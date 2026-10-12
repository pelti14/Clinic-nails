// «Por revisar»: las reservas del bot de IA de GHL cuyo servicio no se pudo saber (se les pone uno por defecto) y el diagnóstico de si el bot
// está rellenando el campo «Servicio» con cada empleada. Funciones puras (sin pantalla ni red), probadas aparte.
import { MARCA_REVISAR, quitarMarcaRevisar, avisosDeMovimiento, elegirCabina, overlaps } from "./agenda";
import { sumarDias } from "./cursos";

export const MARCA_REVISADO = "✔ Servicio revisado a mano";
const INICIO_BOT = "📥 Reservada desde GoHighLevel";
export const esDelBot = (c) => String(c.notas || "").startsWith(INICIO_BOT);
export const estaPorRevisar = (c) => String(c.notas || "").includes(MARCA_REVISAR) && c.asistencia !== "cancelada" && c.estadoCobro !== "cobrada";
// Lo que ponía el campo «Servicio» del contacto cuando no coincidió con ningún servicio (vacío si el bot no escribió nada)
export const valorDelCampo = (notas) => (String(notas || "").match(/dice «([^»]*)»/) || [])[1] || "";
// El título que tenía la reserva en GHL (lo primero entre « »)
export const tituloDeGHL = (notas) => (String(notas || "").match(/Reservada desde GoHighLevel \(«([^»]*)»\)/) || [])[1] || "";

// Las pendientes: de hoy en adelante (y unos días atrás por si se pasó alguna), por orden de fecha y hora
export function citasPorRevisar(citas, hoy, diasAtras = 3) {
  const desde = sumarDias(hoy, -diasAtras);
  return citas.filter((c) => estaPorRevisar(c) && c.fecha >= desde).sort((a, b) => (a.fecha === b.fecha ? a.inicio - b.inicio : a.fecha < b.fecha ? -1 : 1));
}

// La nota después de revisarla: sin la marca de «revisa» y con una marca permanente (sirve para el diagnóstico del bot)
export const notaRevisada = (notas, texto = MARCA_REVISADO) => { const limpia = quitarMarcaRevisar(notas); return limpia.includes(texto) ? limpia : `${limpia} ${texto}.`.trim(); };

// Poner el servicio correcto a una cita del bot: la cita pasa a durar lo que dura ese servicio (sin pasar de la medianoche), se busca cabina y
// se avisa (sin bloquear) si queda fuera de horario, pisa otra cita, la empleada no hace ese servicio o no hay cabina libre.
// → { cambios: { servicioId, duracion, cabinaId, notas }, avisos, duracionAntes }
export function corregirServicio({ cita, servicio, cabinas, citas, bloqueos = [], empleada, horario }) {
  const duracion = Number(servicio.duracion) > 0 ? Math.min(Number(servicio.duracion), 1440 - cita.inicio) : cita.duracion;
  const delDia = citas.filter((a) => a.fecha === cita.fecha && a.id !== cita.id && a.asistencia !== "cancelada");
  const cabina = elegirCabina(servicio, cabinas, delDia, cita.inicio, duracion, cita.cabinaId);
  const avisos = avisosDeMovimiento({ cita: { ...cita, duracion }, empleada, servicio, fecha: cita.fecha, inicio: cita.inicio, citas, bloqueos, horario });
  // elegirCabina nunca bloquea: si todas están ocupadas, se comparte; aquí se avisa
  if (!cabina) avisos.push("no hay ninguna cabina activa");
  else if (delDia.some((a) => a.cabinaId === cabina && overlaps(a.inicio, a.duracion, cita.inicio, duracion))) avisos.push("no hay ninguna cabina libre a esa hora (compartirá cabina)");
  return { cambios: { servicioId: servicio.id, duracion, cabinaId: cabina || cita.cabinaId, notas: notaRevisada(cita.notas) }, avisos, duracionAntes: cita.duracion };
}

// ¿Está el bot rellenando el campo «Servicio» con cada empleada? Cuenta las reservas del bot (sin canceladas) desde hace `dias` días:
// «con servicio» = llegó con el servicio (del campo o del título); «sin servicio» = se puso uno por defecto (esté revisada o no).
export function estadoBotPorEmpleada({ citas, empleadas, hoy, dias = 30 }) {
  const desde = sumarDias(hoy, -dias);
  const bot = citas.filter((c) => esDelBot(c) && c.asistencia !== "cancelada" && c.fecha >= desde);
  const fila = (cs, e) => {
    const sin = cs.filter((c) => String(c.notas || "").includes(MARCA_REVISAR) || String(c.notas || "").includes(MARCA_REVISADO)).length;
    return { empleada: e, total: cs.length, conServicio: cs.length - sin, sinServicio: sin, porRevisar: cs.filter(estaPorRevisar).length, porcentaje: cs.length ? Math.round(((cs.length - sin) / cs.length) * 100) : null };
  };
  const filas = empleadas.filter((e) => e.activa !== false && e.rol !== "admin").map((e) => fila(bot.filter((c) => c.empleadaId === e.id), e));
  return { filas, total: fila(bot, { id: "todas", nombre: "Todas" }) };
}
