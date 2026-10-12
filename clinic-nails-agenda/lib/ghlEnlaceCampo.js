// El campo del contacto de GHL donde la app deja el enlace para cambiar o cancelar la próxima cita: se llama «Enlace cita» (o algo parecido).
// Función pura (sin red), probada aparte. Sirve para usar {{contact.enlace_cita}} en tus automatizaciones de GHL.
import { normalizarTexto } from "./agenda";

export function campoEnlaceCita(definiciones = []) {
  const EXACTOS = ["enlace cita", "enlace de la cita", "link cita", "link de la cita", "enlace gestionar cita", "enlace para gestionar la cita", "enlace de gestion de la cita"];
  const puntos = (d) => {
    const nombre = normalizarTexto(d?.name || "");
    const clave = normalizarTexto(String(d?.fieldKey || "").replace(/^contact\./, "").replace(/_/g, " "));
    if (EXACTOS.includes(nombre) || EXACTOS.includes(clave)) return 3;
    const tiene = (t) => (t.includes("enlace") || t.includes("link")) && t.includes("cita");
    return tiene(nombre) || tiene(clave) ? 2 : 0;
  };
  return [...definiciones].map((d) => ({ d, p: puntos(d) })).filter((x) => x.p > 0).sort((a, b) => b.p - a.p)[0]?.d || null;
}
