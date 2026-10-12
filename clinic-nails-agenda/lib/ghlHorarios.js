import { NEGOCIO_POR_DEFECTO } from "./negocio";
import { DAY_START, DAY_END } from "./horarios";

// Horario semanal de una empleada → formato de los «horarios de disponibilidad» de GHL (para que el bot de IA solo agende en su horario).
// Funciones puras (sin red), probadas aparte. Mismo criterio que la agenda: en un horario fijo, un día es libre si está en `diasLibres`;
// si no, trabaja de `inicio` a `fin` (y si no hay horas guardadas, el horario habitual por defecto de la agenda: de 10:00 a 21:00).

export const ZONA_HORARIA = "Europe/Madrid";
export const ORDEN_DIAS = ["lun", "mar", "mie", "jue", "vie", "sab", "dom"];
export const DIAS_GHL = { lun: "monday", mar: "tuesday", mie: "wednesday", jue: "thursday", vie: "friday", sab: "saturday", dom: "sunday" };
const NOMBRE_DIA = { lun: "Lun", mar: "Mar", mie: "Mié", jue: "Jue", vie: "Vie", sab: "Sáb", dom: "Dom" };

const hhmm = (s) => { const m = /^(\d{1,2}):(\d{2})$/.exec(String(s ?? "").trim()); return m && Number(m[1]) < 24 && Number(m[2]) < 60 ? `${m[1].padStart(2, "0")}:${m[2]}` : null; };
const minutos = (s) => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };
const aHHMM = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

// → { sincronizable, motivo?, dias: { lun: { inicio, fin } | null, … }, avisos: [] }
export function horarioSemanal(emp) {
  if (emp?.horarioTipo === "rotativo" && (emp.turnos || []).length) {
    return { sincronizable: false, motivo: "Tiene turnos rotativos (cambian cada semana): GHL solo admite un horario semanal fijo, así que no se puede enviar.", dias: {}, avisos: [] };
  }
  const libres = emp?.diasLibres || [];
  const dias = {};
  const avisos = [];
  for (const d of ORDEN_DIAS) {
    if (libres.includes(d)) { dias[d] = null; continue; }
    const h = emp?.horario?.[d];
    const inicio = hhmm(h?.inicio) ?? aHHMM(DAY_START); // igual que la agenda: sin horas guardadas, 10:00–21:00
    const fin = hhmm(h?.fin) ?? aHHMM(DAY_END);
    if (minutos(fin) <= minutos(inicio)) { dias[d] = null; avisos.push(`${NOMBRE_DIA[d]}: la hora de fin no es posterior a la de inicio: se envía como día libre.`); continue; }
    dias[d] = { inicio, fin };
  }
  return { sincronizable: true, dias, avisos };
}

// Las reglas que espera GHL: una por día que trabaja
export function reglasGHL(semanal) {
  return ORDEN_DIAS.filter((d) => semanal.dias[d]).map((d) => ({ type: "wday", day: DIAS_GHL[d], intervals: [{ from: semanal.dias[d].inicio, to: semanal.dias[d].fin }] }));
}

// «Lun–Vie 10:00–21:00 · Sáb 10:00–14:00 · Dom libre»
export function resumenSemanal(semanal) {
  if (!semanal.sincronizable) return "Turnos rotativos";
  const tramos = [];
  for (const d of ORDEN_DIAS) {
    const h = semanal.dias[d];
    const txt = h ? `${h.inicio}–${h.fin}` : "libre";
    const u = tramos[tramos.length - 1];
    if (u && u.txt === txt) u.hasta = d; else tramos.push({ txt, desde: d, hasta: d });
  }
  return tramos.map((t) => `${t.desde === t.hasta ? NOMBRE_DIA[t.desde] : `${NOMBRE_DIA[t.desde]}–${NOMBRE_DIA[t.hasta]}`} ${t.txt}`).join(" · ");
}

// Lo que NO se envía: ausencias y días sueltos futuros (GHL pide fechas concretas; todavía sin verificar su formato)
export function pendientesNoEnviados(emp, hoy) {
  const aus = (emp?.ausencias || []).filter((a) => (a.fin || a.inicio || "") >= hoy).length;
  const exc = (emp?.excepciones || []).filter((e) => (e.fecha || "") >= hoy).length;
  const partes = [];
  if (aus) partes.push(`${aus} ${aus === 1 ? "ausencia o vacaciones" : "ausencias o vacaciones"}`);
  if (exc) partes.push(`${exc} ${exc === 1 ? "día suelto modificado" : "días sueltos modificados"}`);
  return partes.length ? `No se envían ${partes.join(" ni ")}: GHL pide fechas concretas y esa parte aún no está verificada. En esos días el bot podría agendarle citas: bloquéalos en GHL o con «Horario no disponible».` : "";
}

export const nombreHorarioGHL = (nombre, negocio = NEGOCIO_POR_DEFECTO) => `${negocio} — ${nombre}`;

// ¿Cambió algo que afecte al horario semanal? (para enviarlo solo cuando toca)
export const horarioCambio = (antes, despues) => JSON.stringify([antes?.horario, antes?.diasLibres, antes?.horarioTipo, antes?.turnos, antes?.turnoInicio]) !== JSON.stringify([despues?.horario, despues?.diasLibres, despues?.horarioTipo, despues?.turnos, despues?.turnoInicio]);
