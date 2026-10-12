// Confirmación de asistencia: se llama o se escribe a las clientas de mañana y se anota si vienen (✋), si no cogieron la llamada o
// si siguen pendientes. Funciones puras (sin pantalla ni base de datos), probadas aparte.

export const ESTADOS_CONFIRMACION = {
  pendiente: { texto: "Sin confirmar", corto: "Pendiente" },
  confirmada: { texto: "Confirmada: viene", corto: "Confirmada" },
  no_contesta: { texto: "No cogió la llamada", corto: "No cogió" },
};

// Lo que mande GHL (o una persona) como estado, a uno de los tres
export function normalizarEstado(valor) {
  const t = String(valor ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z_ ]/g, "").trim().replace(/\s+/g, "_");
  if (["confirmada", "confirmado", "confirmed", "confirma", "si", "yes", "ok", "viene", "asiste"].includes(t)) return "confirmada";
  if (["no_contesta", "no_coge", "no_cogio", "no_responde", "noanswer", "no_answer", "sin_respuesta"].includes(t)) return "no_contesta";
  if (["pendiente", "pending", "sin_confirmar", "reset"].includes(t)) return "pendiente";
  return null;
}

const NO_CUENTAN = (c) => c.asistencia === "cancelada" || c.asistencia === "no_asistio" || c.estadoCobro === "cobrada";

// Las citas de un día que hay que confirmar (no las canceladas, las que no vinieron ni las ya cobradas), por hora
export function citasParaConfirmar(citas, fecha) {
  return citas.filter((c) => c.fecha === fecha && !NO_CUENTAN(c)).sort((a, b) => a.inicio - b.inicio || String(a.clienta).localeCompare(String(b.clienta)));
}

export function resumenConfirmaciones(lista) {
  const r = { total: lista.length, confirmadas: 0, noContesta: 0, pendientes: 0 };
  lista.forEach((c) => { const e = c.confirmacion || "pendiente"; if (e === "confirmada") r.confirmadas++; else if (e === "no_contesta") r.noContesta++; else r.pendientes++; });
  return r;
}

// Cuántas citas de un día siguen SIN confirmar (pendientes o que no cogieron): lo que enseña el aviso de la agenda
export const sinConfirmar = (citas, fecha) => citasParaConfirmar(citas, fecha).filter((c) => (c.confirmacion || "pendiente") !== "confirmada").length;

// De qué cita habla un aviso de GHL: la próxima (de hoy en adelante) de ese cliente que no esté cancelada, cobrada ni sin asistir.
// Si GHL manda la fecha, solo esa. Devuelve la fila de la cita o null.
export function elegirCitaParaConfirmar({ citas, hoy, fecha }) {
  const candidatas = citas.filter((c) => c.fecha >= hoy && (!fecha || c.fecha === fecha) && !NO_CUENTAN(c));
  return candidatas.sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : a.inicio - b.inicio))[0] || null;
}

// ---- llamar y escribir ----
const digitos = (t) => String(t || "").replace(/\D/g, "");

// Teléfono para WhatsApp (wa.me): solo cifras con prefijo de país; un número español de 9 cifras recibe el 34. Vacío si no sirve.
export function numeroWhatsApp(telefono) {
  let d = digitos(telefono);
  if (d.startsWith("00")) d = d.slice(2);
  if (/^0+$/.test(d)) return ""; // teléfono de relleno (000000000)
  if (d.length === 9 && /^[6-9]/.test(d)) d = `34${d}`;
  return d.length >= 11 && d.length <= 15 ? d : "";
}
export const enlaceWhatsApp = (telefono, texto) => { const n = numeroWhatsApp(telefono); return n ? `https://wa.me/${n}?text=${encodeURIComponent(texto || "")}` : ""; };
export function enlaceLlamada(telefono) {
  const t = String(telefono || "").trim();
  const d = digitos(t);
  if (!d || /^0+$/.test(d)) return "";
  return `tel:${t.startsWith("+") ? "+" : ""}${d}`;
}

const sumarUnDia = (iso) => { const d = new Date(`${iso}T00:00:00`); d.setDate(d.getDate() + 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
export const diaLargo = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

// El mensaje de WhatsApp ya escrito para pedir la confirmación
export function mensajeConfirmacion({ nombre, fecha, inicio, servicio, hoy, negocio = "Clinic Nails & Beauty" }) {
  const primer = String(nombre || "").trim().split(/\s+/)[0];
  const cuando = hoy && fecha === sumarUnDia(hoy) ? `mañana, ${diaLargo(fecha)}` : hoy && fecha === hoy ? "hoy" : `el ${diaLargo(fecha)}`;
  return `Hola${primer ? ` ${primer}` : ""}, te escribimos de ${negocio} para confirmar tu cita ${cuando}, a las ${hhmm(inicio)}${servicio ? ` (${servicio})` : ""}. ¿Nos confirmas que vienes? Si no puedes, avísanos y la cambiamos. ¡Gracias!`;
}
