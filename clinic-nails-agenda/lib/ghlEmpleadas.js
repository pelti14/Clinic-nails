// Emparejar una empleada de la app con su usuario de GHL (sin red: función pura, probada aparte).
import { normalizarTexto } from "./agenda";

const nombreCompleto = (u) => normalizarTexto(u?.name || `${u?.firstName || ""} ${u?.lastName || ""}`);
const primerNombre = (t) => normalizarTexto(t).split(" ")[0] || "";

// Devuelve { usuario } (si hay uno claro), { ambiguo: [...] } (si hay varios posibles) o { usuario: null }
export function elegirUsuarioPorNombre(usuarios = [], nombre = "") {
  const buscado = normalizarTexto(nombre);
  if (!buscado) return { usuario: null };
  const exactos = usuarios.filter((u) => nombreCompleto(u) === buscado);
  if (exactos.length === 1) return { usuario: exactos[0] };
  if (exactos.length > 1) return { usuario: null, ambiguo: exactos };
  // si no hay coincidencia exacta, por el primer nombre (solo si no hay duda)
  const pn = primerNombre(nombre);
  const parecidos = usuarios.filter((u) => primerNombre(u?.firstName || u?.name || "") === pn);
  if (parecidos.length === 1) return { usuario: parecidos[0] };
  if (parecidos.length > 1) return { usuario: null, ambiguo: parecidos };
  return { usuario: null };
}
export const NOMBRE_ELIMINADA = "empleado-eliminado";
