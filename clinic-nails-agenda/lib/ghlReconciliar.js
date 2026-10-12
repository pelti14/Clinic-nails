// Qué hacer cuando una cita que ya está vinculada con GHL no es igual en la app y en GHL.
// Fusión «a tres bandas» con la última versión sincronizada (snapshot): para CADA dato gana quien lo haya cambiado
// desde entonces. Si lo cambiaron los dos, gana la app (es lo que se enviará a GHL). Así un cambio que acabas de
// hacer en la app y que aún no ha llegado a GHL nunca se pisa con la versión vieja de GHL.

export const CAMPOS_SYNC = ["fecha", "inicio", "duracion", "empleada_id", "cancelada"];

export const estadoApp = (c) => ({ fecha: c.fecha, inicio: c.inicio, duracion: c.duracion, empleada_id: c.empleada_id, cancelada: c.asistencia === "cancelada" });

const igual = (a, b) => CAMPOS_SYNC.every((k) => a?.[k] === b?.[k]);

export function decidir({ app, ghl, snapshot = null }) {
  if (igual(app, ghl)) return { accion: snapshot && igual(snapshot, ghl) ? "nada" : "guardar_snapshot", aplicar: {}, conflictos: [] };
  const aplicar = {};
  const conflictos = [];
  for (const k of CAMPOS_SYNC) {
    if (app[k] === ghl[k]) continue;
    const appCambio = snapshot ? app[k] !== snapshot[k] : false;
    const ghlCambio = snapshot ? ghl[k] !== snapshot[k] : true; // sin versión anterior se supone que lo cambió GHL (la app sube sus cambios al momento)
    if (appCambio && ghlCambio) conflictos.push(k);
    else if (ghlCambio) aplicar[k] = ghl[k];
  }
  return { accion: Object.keys(aplicar).length ? "aplicar" : "nada", aplicar, conflictos };
}

const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const diaCorto = (f) => new Date(`${f}T00:00:00`).toLocaleDateString("es-ES", { day: "numeric", month: "short" });

// Texto para el registro de actividad
export function resumenCambioGHL(cita, aplicar) {
  const quien = cita.clienta || "cita";
  if ("cancelada" in aplicar && aplicar.cancelada) return `Reserva cancelada en GHL: ${quien}`;
  if ("cancelada" in aplicar) return `Reserva reactivada en GHL: ${quien}`;
  const partes = [];
  if ("fecha" in aplicar || "inicio" in aplicar) {
    const f1 = "fecha" in aplicar ? aplicar.fecha : cita.fecha;
    const i1 = "inicio" in aplicar ? aplicar.inicio : cita.inicio;
    partes.push(`${diaCorto(cita.fecha)} ${hhmm(cita.inicio)} → ${diaCorto(f1)} ${hhmm(i1)}`);
  }
  if ("duracion" in aplicar) partes.push(`duración ${cita.duracion} → ${aplicar.duracion} min`);
  if ("empleada_id" in aplicar) partes.push("cambió de empleada");
  return `Reserva modificada en GHL (${quien}): ${partes.join(" · ")}`;
}
