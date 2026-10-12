// Lógica de clientes sin pantalla (se puede probar entera): búsqueda tolerante,
// etiquetas automáticas, y lectura/validación de listas CSV (por ejemplo de Fresha).

export const normalizar = (t) =>
  String(t ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

export const digitos = (t) => String(t ?? "").replace(/\D/g, "");

// Clave para comparar teléfonos aunque tengan +34, espacios o guiones: los 9 últimos dígitos
export const claveTelefono = (t) => {
  const d = digitos(t);
  return d.length >= 7 ? d.slice(-9) : "";
};

// ---------------------------------------------------------------------------
// Búsqueda: por parte del nombre (sin acentos, en cualquier orden) o parte del teléfono
// (sin importar espacios, guiones ni el +34)
// ---------------------------------------------------------------------------
export function buscarClientes(clientes, texto, limite = Infinity) {
  const t = normalizar(texto);
  if (!t) return clientes.slice(0, limite);
  const d = digitos(texto);
  const palabras = t.split(" ").filter(Boolean);
  const hayLetras = /[a-z]/.test(t);
  const puntuados = [];
  for (const c of clientes) {
    const nombre = normalizar(c.nombre);
    let puntos = 0;
    if (palabras.every((p) => nombre.includes(p))) puntos = nombre.startsWith(palabras[0]) ? 3 : 2;
    if (!hayLetras && d.length >= 2 && digitos(c.telefono).includes(d)) puntos = Math.max(puntos, digitos(c.telefono).endsWith(d) ? 3 : 2);
    if (hayLetras && d.length >= 3 && digitos(c.telefono).includes(d)) puntos = Math.max(puntos, 1);
    if (!hayLetras && c.email && normalizar(c.email).includes(t)) puntos = Math.max(puntos, 1);
    if (puntos) puntuados.push([puntos, c]);
  }
  puntuados.sort((a, b) => b[0] - a[0] || a[1].nombre.localeCompare(b[1].nombre, "es"));
  return puntuados.map((x) => x[1]).slice(0, limite);
}

// ---------------------------------------------------------------------------
// Etiquetas automáticas
// ---------------------------------------------------------------------------
const asist = (c) => c.asistencia || "prevista";
const dias = (a, b) => Math.round((new Date(a + "T00:00:00") - new Date(b + "T00:00:00")) / 86400000);

export function categoriasDeCita(cita, servicios) {
  const ids = [cita.servicioId, ...(cita.serviciosExtra || [])];
  const cats = new Set();
  ids.forEach((id) => {
    const s = servicios.find((x) => x.id === id);
    if (s) cats.add((s.categoria || "").trim() || "Otros");
  });
  return [...cats];
}

// Para saber, cita por cita, si es la PRIMERA vez que viene esa persona
export function primeraCitaPorCliente(citas) {
  const mapa = new Map();
  citas
    .filter((c) => c.clienteId && asist(c) === "prevista")
    .forEach((c) => {
      const clave = `${c.fecha} ${String(c.inicio).padStart(4, "0")}`;
      const actual = mapa.get(c.clienteId);
      if (!actual || clave < actual.clave) mapa.set(c.clienteId, { clave, id: c.id });
    });
  return mapa; // clienteId -> { clave, id de su primera cita }
}

export function resumenCliente(cliente, citas, servicios, hoy, { diasInactivo = 60 } = {}) {
  const suyas = citas.filter((c) => c.clienteId === cliente.id);
  const efectivas = suyas.filter((c) => asist(c) === "prevista");
  const pasadas = efectivas.filter((c) => c.fecha < hoy || c.estadoCobro === "cobrada");
  const proximas = efectivas.filter((c) => c.fecha >= hoy && c.estadoCobro !== "cobrada").sort((a, b) => a.fecha.localeCompare(b.fecha) || a.inicio - b.inicio);
  const ultima = [...pasadas].sort((a, b) => b.fecha.localeCompare(a.fecha))[0]?.fecha || "";
  const porCategoria = new Map();
  efectivas.forEach((c) => categoriasDeCita(c, servicios).forEach((cat) => porCategoria.set(cat, (porCategoria.get(cat) || 0) + 1)));
  const categorias = [...porCategoria.entries()].map(([categoria, n]) => ({ categoria, n })).sort((a, b) => b.n - a.n || a.categoria.localeCompare(b.categoria, "es"));

  const etiquetas = [];
  if (efectivas.length === 0) etiquetas.push({ tipo: "sinvisitas", texto: "Sin visitas" });
  else if (efectivas.length === 1) etiquetas.push({ tipo: "primera", texto: "Primera visita" });
  else etiquetas.push({ tipo: "recurrente", texto: "Cliente recurrente" });
  categorias.forEach(({ categoria, n }) => etiquetas.push({ tipo: "categoria", categoria, n, texto: `${categoria} · ${n}`, ayuda: `Cliente de ${categoria}: ${n} ${n === 1 ? "visita" : "visitas"}` }));
  const inactivo = Boolean(ultima) && dias(hoy, ultima) > diasInactivo && proximas.length === 0;
  if (inactivo) etiquetas.push({ tipo: "inactivo", texto: `Inactivo (${dias(hoy, ultima)} días)` });

  return {
    visitas: pasadas.length,
    reservas: efectivas.length,
    noShows: suyas.filter((c) => asist(c) === "no_asistio").length,
    ultima,
    proxima: proximas[0] || null,
    categorias,
    etiquetas,
    inactivo,
    esPrimera: efectivas.length === 1,
    esRecurrente: efectivas.length >= 2,
  };
}

// ¿El cliente cumple un filtro del listado? ("todos", "primera", "recurrente", "inactivo", "nota", "favorito", "cat:Facial")
export function cumpleFiltro(filtro, cliente, resumen) {
  if (!filtro || filtro === "todos") return true;
  if (filtro === "primera") return resumen.esPrimera;
  if (filtro === "recurrente") return resumen.esRecurrente;
  if (filtro === "inactivo") return resumen.inactivo;
  if (filtro === "sinvisitas") return resumen.reservas === 0;
  if (filtro === "nota") return Boolean(cliente.notaFija);
  if (filtro === "favorito") return Boolean(cliente.favorito);
  if (filtro.startsWith("cat:")) return resumen.categorias.some((c) => c.categoria === filtro.slice(4));
  return true;
}

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------
export function parsearCSV(texto) {
  let t = String(texto ?? "").replace(/^\uFEFF/, "");
  if (!t.trim()) return { cabeceras: [], filas: [], separador: "," };
  const primera = t.split(/\r?\n/, 1)[0];
  const cuenta = (c) => (primera.match(new RegExp(`\\${c}`, "g")) || []).length;
  const separador = [";", "\t", ","].map((c) => [c, cuenta(c)]).sort((a, b) => b[1] - a[1])[0][1] > 0 ? [";", "\t", ","].map((c) => [c, cuenta(c)]).sort((a, b) => b[1] - a[1])[0][0] : ",";

  const filas = [];
  let fila = [];
  let campo = "";
  let comillas = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (comillas) {
      if (ch === '"') {
        if (t[i + 1] === '"') {
          campo += '"';
          i++;
        } else comillas = false;
      } else campo += ch;
    } else if (ch === '"') comillas = true;
    else if (ch === separador) {
      fila.push(campo);
      campo = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && t[i + 1] === "\n") i++;
      fila.push(campo);
      campo = "";
      if (fila.some((x) => x.trim() !== "")) filas.push(fila);
      fila = [];
    } else campo += ch;
  }
  fila.push(campo);
  if (fila.some((x) => x.trim() !== "")) filas.push(fila);
  const cabeceras = (filas.shift() || []).map((h) => h.trim());
  return { cabeceras, filas: filas.map((f) => cabeceras.map((_, i) => (f[i] ?? "").trim())), separador };
}

const SINONIMOS = {
  nombre: ["first name", "firstname", "nombre", "nombre de pila", "name", "client name", "nombre cliente", "nombre del cliente", "cliente"],
  apellidos: ["last name", "lastname", "surname", "apellidos", "apellido", "family name"],
  nombreCompleto: ["full name", "nombre completo", "nombre y apellidos", "nombre y apellido"],
  telefono: ["mobile number", "mobile", "phone", "phone number", "telefono", "teléfono", "movil", "móvil", "celular", "numero de movil", "número de móvil", "numero de telefono", "número de teléfono", "tel", "whatsapp", "cell"],
  telefono2: ["telephone", "landline", "home phone", "work phone", "other phone", "phone 2", "telefono 2", "teléfono 2", "telefono fijo", "teléfono fijo", "fijo", "telefono alternativo", "teléfono alternativo"],
  email: ["email", "e-mail", "correo", "correo electronico", "correo electrónico", "mail", "email address"],
  notas: ["notes", "notas", "additional info", "additional information", "informacion adicional", "información adicional", "nota", "observaciones", "comentarios", "comments"],
};

// Adivina qué columna es cada dato a partir de las cabeceras (Fresha, Booksy, hojas propias…)
export function detectarColumnas(cabeceras) {
  const n = cabeceras.map(normalizar);
  const buscar = (clave, excluir = []) => {
    const sinonimos = SINONIMOS[clave].map(normalizar);
    let i = n.findIndex((h, idx) => !excluir.includes(idx) && sinonimos.includes(h));
    if (i < 0) i = n.findIndex((h, idx) => !excluir.includes(idx) && sinonimos.some((s) => s.length > 3 && h.includes(s)));
    return i;
  };
  const completo = buscar("nombreCompleto");
  const nombre = buscar("nombre", completo >= 0 ? [completo] : []);
  const usados = [completo, nombre].filter((x) => x >= 0);
  const apellidos = buscar("apellidos", usados);
  const telefono = buscar("telefono");
  return { nombre: completo >= 0 && nombre < 0 ? completo : nombre, apellidos, telefono, telefono2: buscar("telefono2", telefono >= 0 ? [telefono] : []), email: buscar("email"), notas: buscar("notas") };
}

export function limpiarTelefono(t) {
  let v = String(t ?? "").trim().replace(/[\s.\-()]/g, "");
  if (v.startsWith("00")) v = "+" + v.slice(2);
  return v.replace(/[^\d+]/g, "");
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Convierte las filas del CSV en clientes y separa: nuevos, duplicados (por teléfono o email) y no válidos
export function prepararImportacion(filas, mapeo, existentes, { notasComoNotaFija = false } = {}) {
  const porTelefono = new Map();
  const porEmail = new Map();
  existentes.forEach((c) => {
    const k = claveTelefono(c.telefono);
    if (k) porTelefono.set(k, c);
    if (c.email) porEmail.set(String(c.email).toLowerCase(), c);
  });
  const vistosTel = new Set();
  const vistosEmail = new Set();
  const out = { nuevos: [], duplicados: [], invalidos: [], completar: [], sinTelefono: 0, sinContacto: 0 };
  const completarPorId = new Map(); // datos que faltan de las clientas que YA existen (nunca se pisa lo que ya tienen)
  const val = (f, i) => (i >= 0 && i < f.length ? String(f[i] ?? "").trim() : "");

  filas.forEach((f, idx) => {
    const linea = idx + 2; // la fila 1 son las cabeceras
    const nombre = [val(f, mapeo.nombre), mapeo.apellidos >= 0 && mapeo.apellidos !== mapeo.nombre ? val(f, mapeo.apellidos) : ""].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
    const telefono = limpiarTelefono(val(f, mapeo.telefono)) || limpiarTelefono(val(f, mapeo.telefono2 ?? -1)); // sin móvil, se usa el otro teléfono
    let email = val(f, mapeo.email).toLowerCase();
    if (!nombre) return out.invalidos.push({ linea, motivo: "Sin nombre", original: f });
    if (email && !EMAIL.test(email)) email = ""; // un email mal escrito se descarta, no se importa basura
    const cliente = { nombre, telefono, email, notaFija: notasComoNotaFija ? val(f, mapeo.notas) : "", _linea: linea };
    const kt = claveTelefono(telefono);
    const ya = (kt && porTelefono.get(kt)) || (email && porEmail.get(email));
    if (ya) {
      const cambios = {};
      if (!String(ya.email || "").trim() && email) cambios.email = email;
      if (!claveTelefono(ya.telefono) && telefono) cambios.telefono = telefono;
      if (notasComoNotaFija && !String(ya.notaFija || "").trim() && cliente.notaFija) cambios.notaFija = cliente.notaFija;
      if (Object.keys(cambios).length) completarPorId.set(ya.id, { existente: ya, cambios: { ...cambios, ...(completarPorId.get(ya.id)?.cambios || {}) }, linea });
      return out.duplicados.push({ fila: cliente, existente: ya, motivo: kt && porTelefono.get(kt) ? "mismo teléfono" : "mismo email", original: f });
    }
    if ((kt && vistosTel.has(kt)) || (email && vistosEmail.has(email))) return out.duplicados.push({ fila: cliente, existente: null, original: f, motivo: "repetido en el propio archivo" });
    if (kt) vistosTel.add(kt);
    if (email) vistosEmail.add(email);
    if (!telefono) out.sinTelefono++;
    if (!telefono && !email) out.sinContacto++; // sin teléfono ni email no se puede reconocer si ya existe
    out.nuevos.push(cliente);
  });
  out.completar = [...completarPorId.values()];
  return out;
}

// ---------------------------------------------------------------------------
// Exportación: CSV listo para Excel (o para importar en otro programa como Fresha)
// ---------------------------------------------------------------------------
export function partirNombre(nombre) {
  const p = String(nombre ?? "").trim().split(/\s+/).filter(Boolean);
  return [p[0] || "", p.slice(1).join(" ")];
}
// Una celda que empiece por = o @ (o por + o - seguido de una letra) la interpretaría Excel como una fórmula: se le antepone un apóstrofo
const escapaFormula = (t) => (/^[=@]|^[+\-][^\d\s().+\-]/.test(t) ? `'${t}` : t);
export const celdaCSV = (v) => `"${escapaFormula(String(v ?? "")).replace(/"/g, '""')}"`;
export function construirCSV(columnas, filas, { separador = ";" } = {}) {
  const sep = separador === "," ? "," : ";";
  return "\uFEFF" + [columnas.map((c) => celdaCSV(c.titulo)).join(sep), ...filas.map((f) => columnas.map((c) => celdaCSV(c.valor(f))).join(sep))].join("\r\n");
}
// Formatos: «completo» (para Excel, con visitas y gasto) y «fresha» (las columnas que pide Fresha al importar: sirve también para otros programas)
export const FORMATOS_EXPORTACION = {
  completo: { nombre: "Completo (para Excel)", ayuda: "Nombre, teléfono, email, etiquetas, visitas, última visita, gasto total y nota fija.", archivo: "clientes" },
  fresha: { nombre: "Para importar en Fresha u otro programa", ayuda: "First name, Last name, Email, Mobile phone y Client notes: el formato que aceptan Fresha y la mayoría de programas.", archivo: "clientes-formato-fresha" },
};
export function columnasExportacion(formato) {
  if (formato === "fresha") {
    return [
      { titulo: "First name", valor: ({ c }) => partirNombre(c.nombre)[0] },
      { titulo: "Last name", valor: ({ c }) => partirNombre(c.nombre)[1] },
      { titulo: "Email", valor: ({ c }) => c.email },
      { titulo: "Mobile phone", valor: ({ c }) => c.telefono },
      { titulo: "Client notes", valor: ({ c }) => c.notaFija },
    ];
  }
  return [
    { titulo: "Nombre", valor: ({ c }) => c.nombre },
    { titulo: "Teléfono", valor: ({ c }) => c.telefono },
    { titulo: "Email", valor: ({ c }) => c.email },
    { titulo: "Etiquetas", valor: ({ resumen }) => resumen.etiquetas.map((e) => e.texto).join(" | ") },
    { titulo: "Visitas", valor: ({ resumen }) => resumen.visitas },
    { titulo: "Última visita", valor: ({ resumen }) => resumen.ultima },
    { titulo: "Gasto total (€)", valor: ({ gasto }) => gasto.toFixed(2).replace(".", ",") },
    { titulo: "Nota fija", valor: ({ c }) => c.notaFija },
  ];
}
export const textoExportacion = ({ filas, formato = "completo", separador = ";" }) => construirCSV(columnasExportacion(formato), filas, { separador });

// Las filas que NO se importan (con su motivo y sus datos originales) para que puedas revisarlas en Excel
export function textoNoImportadas({ cabeceras, prep }) {
  const filas = [
    ...prep.invalidos.map((x) => ({ linea: x.linea, motivo: x.motivo, original: x.original || [] })),
    ...prep.duplicados.map((d, i) => ({ linea: d.fila._linea, motivo: d.existente ? `${d.motivo} (ya existe: ${d.existente.nombre})` : d.motivo, original: d.original || [] })),
  ].sort((a, b) => a.linea - b.linea);
  const cols = [{ titulo: "Línea", valor: (f) => f.linea }, { titulo: "Motivo", valor: (f) => f.motivo }, ...cabeceras.map((h, i) => ({ titulo: h || `Columna ${i + 1}`, valor: (f) => f.original[i] ?? "" }))];
  return construirCSV(cols, filas);
}

