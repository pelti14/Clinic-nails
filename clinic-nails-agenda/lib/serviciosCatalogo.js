// Catálogo de servicios: categorías, orden y exportación (funciones puras, sin pantalla ni base de datos).
import { normalizarTexto } from "./agenda";

export const SIN_CATEGORIA = "";
const clave = (t) => normalizarTexto(String(t ?? ""));

// Categorías en el orden que se ven: primero las guardadas (por su orden), luego las que solo existen en algún servicio
// (alfabéticas) y al final «Sin categoría». Cada una con cuántos servicios tiene.
export function listaCategorias(servicios = [], filas = []) {
  const porClave = new Map();
  const ordenadas = [...filas].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0) || String(a.nombre).localeCompare(String(b.nombre), "es"));
  ordenadas.forEach((f) => { if (!porClave.has(clave(f.nombre))) porClave.set(clave(f.nombre), { id: f.id, nombre: f.nombre, descripcion: f.descripcion || "", guardada: true }); });
  const sueltas = [];
  servicios.forEach((s) => {
    const k = clave(s.categoria);
    if (k && !porClave.has(k) && !sueltas.some((x) => clave(x.nombre) === k)) sueltas.push({ id: null, nombre: String(s.categoria).trim(), descripcion: "", guardada: false });
  });
  sueltas.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  const lista = [...porClave.values(), ...sueltas];
  if (servicios.some((s) => !clave(s.categoria))) lista.push({ id: null, nombre: SIN_CATEGORIA, descripcion: "", guardada: false });
  return lista.map((c) => {
    const suyos = servicios.filter((s) => clave(s.categoria) === clave(c.nombre));
    return { ...c, total: suyos.length, activos: suyos.filter((s) => s.activo !== false).length };
  });
}

// Servicios en el orden elegido: por categoría (como en la lista), luego su orden y su nombre
export function ordenarServicios(servicios = [], filas = []) {
  const rango = new Map(listaCategorias(servicios, filas).map((c, i) => [clave(c.nombre), i]));
  return [...servicios].sort((a, b) => (rango.get(clave(a.categoria)) ?? 9999) - (rango.get(clave(b.categoria)) ?? 9999) || (a.orden ?? 0) - (b.orden ?? 0) || String(a.nombre).localeCompare(String(b.nombre), "es"));
}

// Mueve un elemento de una lista de ids; devuelve la lista nueva (o la misma si no se puede)
export function moverId(ids, id, haciaId) {
  const i = ids.indexOf(id), j = ids.indexOf(haciaId);
  if (i < 0 || j < 0 || i === j) return ids;
  const copia = [...ids];
  copia.splice(i, 1);
  copia.splice(j, 0, id);
  return copia;
}
export function moverPasos(ids, id, delta) {
  const i = ids.indexOf(id), j = i + delta;
  if (i < 0 || j < 0 || j >= ids.length) return ids;
  return moverId(ids, id, ids[j]);
}
// Posiciones 0,1,2… para guardar
export const posiciones = (ids) => ids.map((id, i) => ({ id, orden: i }));

// «1 h y 20 min», «1 h», «45 min»
export function duracionLegible(min) {
  const m = Math.round(Number(min) || 0), h = Math.floor(m / 60), r = m % 60;
  return h && r ? `${h} h y ${r} min` : h ? `${h} h` : `${r} min`;
}

// Mismo formato que se importa: lista de categorías con sus servicios
export function exportarServicios(servicios = [], filas = []) {
  const ordenados = ordenarServicios(servicios, filas);
  return listaCategorias(servicios, filas)
    .filter((c) => c.total > 0 || c.guardada)
    .map((c) => ({
      categoria: c.nombre,
      descripcion: c.descripcion || "",
      servicios: ordenados.filter((s) => clave(s.categoria) === clave(c.nombre)).map((s) => ({
        nombre: s.nombre, duracionMin: Number(s.duracion), precio: Number(s.precio), desdePrecio: false, descripcion: s.descripcion || "",
        ...(s.activo === false ? { activo: false } : {}),
      })),
    }));
}

// Cambiar el nombre de una categoría: qué servicios hay que actualizar
export const serviciosDeCategoria = (servicios, nombre) => servicios.filter((s) => clave(s.categoria) === clave(nombre));
export const existeCategoria = (categorias, nombre, exceptoClave = null) => categorias.some((c) => clave(c.nombre) === clave(nombre) && clave(c.nombre) !== exceptoClave);
