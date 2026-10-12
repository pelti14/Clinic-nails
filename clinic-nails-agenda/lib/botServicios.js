// Textos que se pegan en GHL para que el bot de IA reserve con el servicio correcto (generados con los servicios de la app).
import { normalizarTexto } from "./agenda";

const activos = (servicios) => servicios.filter((s) => s.activo !== false && String(s.nombre || "").trim());

// Cómo se llama un servicio para el bot: su nombre; si el mismo nombre existe en dos categorías, «Nombre (Categoría)» para que no se confundan
export function etiquetaServicio(s, servicios = []) {
  const nombre = String(s.nombre).trim();
  const repetido = activos(servicios).filter((x) => normalizarTexto(x.nombre) === normalizarTexto(nombre)).length > 1;
  const cat = String(s.categoria || "").trim();
  return repetido && cat ? `${nombre} (${cat})` : nombre;
}

// Opciones del campo «Servicio» (lista desplegable) de GHL: los servicios activos, sin repetir
export function opcionesCampoServicio(servicios = []) {
  const vistos = new Set();
  return activos(servicios).map((s) => etiquetaServicio(s, servicios)).filter((n) => { const k = normalizarTexto(n); if (vistos.has(k)) return false; vistos.add(k); return true; });
}

const duracion = (m) => { const h = Math.floor(m / 60), r = m % 60; return h && r ? `${h} h ${r} min` : h ? `${h} h` : `${r} min`; };

// Instrucciones para el bot: la lista de servicios por categoría (con duración y precio) y qué hacer al reservar
export function textoBotServicios(servicios = [], nombreNegocio = "la clínica") {
  const lista = activos(servicios);
  const porCategoria = [];
  lista.forEach((s) => {
    const cat = String(s.categoria || "").trim() || "Otros";
    let g = porCategoria.find((x) => normalizarTexto(x.cat) === normalizarTexto(cat));
    if (!g) porCategoria.push((g = { cat, items: [] }));
    g.items.push(s);
  });
  const lineas = porCategoria.map((g) => `${g.cat}:\n${g.items.map((s) => `  - ${etiquetaServicio(s, lista)} (${duracion(Number(s.duracion) || 0)}, ${Number(s.precio).toLocaleString("es-ES")} €)`).join("\n")}`).join("\n");
  return `SERVICIOS DE ${nombreNegocio.toUpperCase()} (usa SIEMPRE el nombre EXACTO que aparece en esta lista):
${lineas || "  (todavía no hay servicios)"}

CÓMO RESERVAR UNA CITA:
1. Antes de reservar, pregunta qué servicio quiere la clienta. Confirma cuál es de la lista de arriba. Si pide algo que no está en la lista, dile que no lo hacemos y ofrécele los servicios más parecidos.
2. ANTES de reservar la cita, guarda el servicio elegido en el campo del contacto «Servicio», escribiendo su nombre EXACTO tal como aparece en la lista (sin cambiar palabras ni añadir nada). Si la clienta quiere varios servicios en la misma visita, escríbelos todos en ese campo separados por comas (por ejemplo «Dermapen, Radiofrecuencia») y haz una sola reserva.
3. Después reserva la cita en el hueco que elija la clienta.
4. Nunca reserves sin haber guardado antes el servicio en el campo «Servicio».`;
}
