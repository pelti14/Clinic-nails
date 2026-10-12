// Importar servicios de un archivo JSON (sin pantalla ni base de datos: se prueba entero).
// Formato: [ { categoria, descripcion, servicios: [ { nombre, duracionMin, precio, desdePrecio, descripcion, variantes?: [...] } ] } ]
import { normalizarTexto } from "./agenda";

const limpiar = (t) => String(t ?? "").replace(/\s+/g, " ").trim();
const clave = (t) => normalizarTexto(limpiar(t));
export const claveServicio = (nombre, categoria) => `${clave(nombre)}|${clave(categoria)}`;

const aNumero = (v) => {
  if (v === null || v === undefined || v === "") return NaN;
  return typeof v === "number" ? v : Number(String(v).replace(",", ".").replace(/[^\d.\-]/g, ""));
};

// Lee el archivo ya convertido de JSON. Devuelve { servicios, omitidos, avisos } o { error }.
export function leerServicios(datos) {
  const grupos = Array.isArray(datos) ? datos : datos && Array.isArray(datos.servicios) ? [datos] : null;
  if (!grupos) return { error: "El archivo no tiene el formato esperado: una lista de categorías, cada una con sus servicios." };

  const servicios = [];
  const omitidos = [];
  const avisos = [];
  const categorias = []; // categorías del archivo, en su orden y con su descripción
  const contador = {}; // posición de cada servicio dentro de su categoría
  const vistos = new Map(); // clave → posición, para quedarse con el último si se repite

  const agregar = (x, categoria, descripcionPadre = "") => {
    const nombre = limpiar(x?.nombre);
    if (!nombre) return omitidos.push({ nombre: "(sin nombre)", categoria, motivo: "No tiene nombre" });
    const precio = aNumero(x.precio);
    let duracion = aNumero(x.duracionMin ?? x.duracion);
    if (!Number.isFinite(precio) || precio < 0) return omitidos.push({ nombre, categoria, motivo: "Su precio no es válido" });
    if (!Number.isFinite(duracion) || duracion <= 0) return omitidos.push({ nombre, categoria, motivo: "Su duración no es válida" });
    duracion = Math.round(duracion);
    if (duracion < 5) {
      avisos.push(`«${nombre}»: duración de ${duracion} min → se pone 5 min (el mínimo).`);
      duracion = 5;
    }
    const item = { nombre, categoria, precio: Math.round(precio * 100) / 100, duracion, descripcion: limpiar(x.descripcion) || descripcionPadre, desde: Boolean(x.desdePrecio), orden: 0 };
    const k = claveServicio(nombre, categoria);
    if (vistos.has(k)) {
      avisos.push(`«${nombre}» (${categoria || "sin categoría"}) está repetido en el archivo: se usa el último.`);
      item.orden = servicios[vistos.get(k)].orden;
      servicios[vistos.get(k)] = item;
    } else {
      const ck = clave(categoria);
      item.orden = contador[ck] = (contador[ck] ?? -1) + 1;
      vistos.set(k, servicios.length);
      servicios.push(item);
    }
    return null;
  };

  for (const g of grupos) {
    const esGrupo = g && Array.isArray(g.servicios);
    const categoria = limpiar(esGrupo ? g.categoria : g?.categoria);
    if (categoria && !categorias.some((c) => clave(c.nombre) === clave(categoria))) categorias.push({ nombre: categoria, descripcion: esGrupo ? limpiar(g.descripcion) : "" });
    for (const s of esGrupo ? g.servicios : [g]) {
      const propio = Number.isFinite(aNumero(s?.precio)) && Number.isFinite(aNumero(s?.duracionMin ?? s?.duracion));
      if (Array.isArray(s?.variantes) && s.variantes.length && !propio) {
        // un servicio con variantes sin precio ni duración propios: cada variante pasa a ser un servicio («Axila · Para ella»)
        const base = limpiar(s.nombre);
        for (const v of s.variantes) agregar({ ...v, nombre: `${base} · ${limpiar(v?.nombre)}` }, categoria, limpiar(s.descripcion));
      } else agregar(s, categoria);
    }
  }
  return { servicios, omitidos, avisos, categorias };
}

// Qué hacer con lo que ya existe. `usado(id)` dice si el servicio tiene citas o bonos (no se puede borrar sin dejar su historial sin servicio).
export function planDeImportacion({ existentes = [], importados = [], empezarDeCero = false, usado = () => false }) {
  const pareja = new Map(); // posición del importado → servicio existente
  const tomados = new Set();

  importados.forEach((imp, i) => {
    const e = existentes.find((x) => !tomados.has(x.id) && claveServicio(x.nombre, x.categoria) === claveServicio(imp.nombre, imp.categoria));
    if (e) { pareja.set(i, e); tomados.add(e.id); }
  });
  // misma denominación en otra categoría: solo si no hay duda (uno solo a cada lado)
  importados.forEach((imp, i) => {
    if (pareja.has(i)) return;
    const n = clave(imp.nombre);
    const candidatos = existentes.filter((x) => !tomados.has(x.id) && clave(x.nombre) === n);
    const hermanos = importados.filter((o, j) => !pareja.has(j) && clave(o.nombre) === n);
    if (candidatos.length === 1 && hermanos.length === 1) { pareja.set(i, candidatos[0]); tomados.add(candidatos[0].id); }
  });

  const crear = [];
  const reemplazar = [];
  const iguales = [];
  importados.forEach((imp, i) => {
    const e = pareja.get(i);
    if (!e) return crear.push(imp);
    const igual = e.nombre === imp.nombre && Number(e.precio) === imp.precio && Number(e.duracion) === imp.duracion && (e.categoria || "") === imp.categoria && (e.descripcion || "") === imp.descripcion && e.activo !== false;
    (igual ? iguales : reemplazar).push({ existente: e, nuevo: imp });
  });

  const sobrantes = existentes.filter((x) => !tomados.has(x.id));
  const borrar = [];
  const desactivar = [];
  const conservar = []; // ya estaban desactivados y tienen historial: se dejan como están
  if (empezarDeCero) {
    for (const x of sobrantes) {
      if (!usado(x.id)) borrar.push(x);
      else if (x.activo !== false) desactivar.push(x);
      else conservar.push(x);
    }
  }
  return { crear, reemplazar, iguales, borrar, desactivar, conservar, sinTocar: empezarDeCero ? [] : sobrantes };
}

// Servicio nuevo con lo que el archivo no trae (empleadas y color los elige quien importa)
export const servicioNuevo = (imp, { id, empleadas = [], color }) => ({
  id, nombre: imp.nombre, precio: imp.precio, duracion: imp.duracion, categoria: imp.categoria, descripcion: imp.descripcion, orden: imp.orden ?? 0,
  empleadas, cabina: "cualquiera", activo: true, color,
});
// Al reemplazar solo se tocan los datos del archivo: se conservan sus empleadas, su cabina, su color y su historial (mismo id)
export const cambiosDeReemplazo = (existente, imp) => ({ id: existente.id, nombre: imp.nombre, precio: imp.precio, duracion: imp.duracion, categoria: imp.categoria, descripcion: imp.descripcion, orden: imp.orden ?? 0, activo: true });
