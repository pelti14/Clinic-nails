// Cliente de GoHighLevel — SOLO se usa desde rutas de API (servidor), nunca
// desde el navegador. El token de Private Integration no debe llegar nunca
// al cliente.
//
// La configuración (clave, Location ID y calendario general) la fija
// `cargarConfigGHL()` (lib/configServidor.js) antes de cada llamada: sale de
// los Ajustes de la app y, si faltan, de las variables de entorno.

import { cuerpoCalendarioServicio } from "./ghlServicios";

const BASE_URL = "https://services.leadconnectorhq.com";
const GHL_VERSION = "2021-07-28";

let CONFIG = { apiKey: "", locationId: "", calendarId: "" };

export function fijarConfig(c) {
  CONFIG = {
    apiKey: (c?.apiKey || "").trim(),
    locationId: (c?.locationId || "").trim(),
    calendarId: (c?.calendarId || "").trim(),
  };
}

export function configActual() {
  return CONFIG;
}

export function configurado() {
  return Boolean(CONFIG.apiKey && CONFIG.locationId);
}

async function ghlFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${CONFIG.apiKey}`,
      Version: GHL_VERSION,
      // Solo se declara JSON si hay cuerpo: la API de GHL rechaza con «Body cannot be empty when content-type is set
      // to application/json» los DELETE sin cuerpo (y mover una cita entre empleadas implica borrarla de un calendario)
      ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });

  const texto = await res.text();
  let data = null;
  try {
    data = texto ? JSON.parse(texto) : null;
  } catch (e) {
    data = { raw: texto };
  }

  if (!res.ok) {
    const mensaje = data?.message || data?.error || `GHL respondió ${res.status}`;
    const err = new Error(Array.isArray(mensaje) ? mensaje.join(", ") : mensaje);
    err.status = res.status;
    throw err;
  }
  return data;
}

// ---------------------------------------------------------------------------
// Calendarios
// ---------------------------------------------------------------------------

// Lista los calendarios de la cuenta de GHL (nombre + id), para poder
// asignar a cada empleada el suyo por nombre en vez de copiar IDs a mano.
export async function listarCalendarios() {
  const params = new URLSearchParams({ locationId: CONFIG.locationId });
  const data = await ghlFetch(`/calendars/?${params.toString()}`, { method: "GET" });
  return (data?.calendars || []).map((c) => ({
    id: c.id || c._id,
    name: c.name || "(sin nombre)",
    tipo: c.calendarType || c.type || "",
    activo: c.isActive !== false,
    miembros: Array.isArray(c.teamMembers) ? c.teamMembers.length : 0,
  }));
}

// Los calendarios de GHL de tipo equipo (round robin, colectivo...) exigen
// indicar a qué miembro del equipo se asigna cada cita ("assignedUserId").
// Lo sacamos del propio calendario: su miembro principal, o el primero.
// Si el calendario no tiene equipo (o no se puede leer), devuelve null y la
// cita se envía sin asignar — GHL avisará si de verdad hacía falta.
export async function usuarioAsignadoDelCalendario(calendarId) {
  try {
    const data = await ghlFetch(`/calendars/${calendarId}`, { method: "GET" });
    const miembros = data?.calendar?.teamMembers || data?.teamMembers || [];
    if (!Array.isArray(miembros) || miembros.length === 0) return null;
    const elegido = miembros.find((m) => m.isPrimary) || miembros[0];
    return elegido?.userId || null;
  } catch (err) {
    return null;
  }
}

// Al ACTUALIZAR una cita de un calendario de equipo, GHL también exige el
// miembro asignado. Se respeta el que ya tenga la cita en GHL (por si alguien
// la reasignó allí); si no se puede saber, se usa el principal del calendario.
async function usuarioAsignadoDeLaCita(ghlEventId) {
  try {
    const data = await ghlFetch(`/calendars/events/appointments/${ghlEventId}`, { method: "GET" });
    return data?.event?.assignedUserId || data?.appointment?.assignedUserId || data?.assignedUserId || null;
  } catch (err) {
    return null;
  }
}

// Eventos de un calendario entre dos instantes (milisegundos)
// ¿Sigue existiendo esta cita en GHL? «borrada» solo si GHL dice que no existe (404) o la marca como borrada; ante cualquier duda
// (error de red, permisos…) devuelve «desconocido» y no se toca nada.
export async function comprobarCitaGHL(ghlEventId) {
  try {
    const data = await ghlFetch(`/calendars/events/appointments/${ghlEventId}`, { method: "GET" });
    const ev = data?.appointment || data?.event || data;
    return ev && ev.deleted === true ? "borrada" : "existe";
  } catch (e) {
    return e?.status === 404 ? "borrada" : "desconocido";
  }
}

// Una cita de GHL tal cual (para saber su contacto)
export async function obtenerCitaGHL(ghlEventId) {
  const data = await ghlFetch(`/calendars/events/appointments/${ghlEventId}`, { method: "GET" });
  return data?.appointment || data?.event || data || null;
}

export async function listarEventos(calendarId, desdeMs, hastaMs) {
  const params = new URLSearchParams({
    locationId: CONFIG.locationId,
    calendarId,
    startTime: String(desdeMs),
    endTime: String(hastaMs),
  });
  const data = await ghlFetch(`/calendars/events?${params.toString()}`, { method: "GET" });
  return Array.isArray(data?.events) ? data.events : [];
}

// ---------------------------------------------------------------------------
// Contactos
// ---------------------------------------------------------------------------

export async function obtenerContacto(contactId) {
  const data = await ghlFetch(`/contacts/${contactId}`, { method: "GET" });
  return data?.contact || null;
}

async function buscarContactoPorTelefono(telefono) {
  if (!telefono) return null;
  const params = new URLSearchParams({ locationId: CONFIG.locationId, query: telefono, limit: "1" });
  const data = await ghlFetch(`/contacts/?${params.toString()}`, { method: "GET" });
  const contactos = data?.contacts || [];
  return contactos[0] || null;
}

async function crearContacto(cliente) {
  const [firstName, ...resto] = (cliente.nombre || "").trim().split(" ");
  const data = await ghlFetch("/contacts/", {
    method: "POST",
    body: JSON.stringify({
      locationId: CONFIG.locationId,
      firstName: firstName || cliente.nombre,
      lastName: resto.join(" ") || undefined,
      phone: cliente.telefono || undefined,
      email: cliente.email || undefined,
      tags: cliente.favorito ? ["favorito"] : [],
      ...(cliente.noMolestar ? { dnd: true } : {}), // contacto de relleno: GHL no le manda ningún mensaje
    }),
  });
  return data?.contact;
}

async function actualizarContacto(ghlContactId, cliente) {
  const [firstName, ...resto] = (cliente.nombre || "").trim().split(" ");
  const data = await ghlFetch(`/contacts/${ghlContactId}`, {
    method: "PUT",
    body: JSON.stringify({
      firstName: firstName || cliente.nombre,
      lastName: resto.join(" ") || undefined,
      phone: cliente.telefono || undefined,
      email: cliente.email || undefined,
      tags: cliente.favorito ? ["favorito"] : [],
      ...(cliente.noMolestar ? { dnd: true } : {}),
    }),
  });
  return data?.contact;
}

// Crea el contacto si no existe (buscando primero por teléfono), o lo
// actualiza si ya lo teníamos enlazado o lo encontramos por teléfono.
// Devuelve el ghl_contact_id para guardarlo en Supabase.
export async function upsertContacto(cliente) {
  if (!configurado()) return null;

  if (cliente.ghlContactId) {
    await actualizarContacto(cliente.ghlContactId, cliente);
    return cliente.ghlContactId;
  }

  const encontrado = await buscarContactoPorTelefono(cliente.telefono);
  if (encontrado) {
    await actualizarContacto(encontrado.id, cliente);
    return encontrado.id;
  }

  const creado = await crearContacto(cliente);
  return creado?.id || null;
}

// ---------------------------------------------------------------------------
// Citas (Calendar events / appointments)
// ---------------------------------------------------------------------------

// Devuelve el offset de Madrid ("+01:00" o "+02:00" en horario de verano)
// para una fecha concreta, calculado con el propio motor de zonas horarias
// de JS — así no hay que acordarse a mano de cuándo cambia la hora.
function offsetMadridEnFecha(fechaStr) {
  const d = new Date(fechaStr + "T12:00:00Z");
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Madrid",
    timeZoneName: "shortOffset",
  }).formatToParts(d);
  const tz = partes.find((p) => p.type === "timeZoneName")?.value || "GMT+1";
  const match = tz.match(/GMT([+-]\d+)/);
  const horas = match ? parseInt(match[1], 10) : 1;
  const signo = horas >= 0 ? "+" : "-";
  return `${signo}${String(Math.abs(horas)).padStart(2, "0")}:00`;
}

function isoConHora(fecha, minutosDelDia) {
  // «24:00» no es una hora válida para GHL: una cita que acaba a medianoche acaba a las 00:00 del día siguiente
  if (minutosDelDia >= 24 * 60) {
    const d = new Date(`${fecha}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + Math.floor(minutosDelDia / (24 * 60)));
    return isoConHora(d.toISOString().slice(0, 10), minutosDelDia % (24 * 60));
  }
  const h = Math.floor(minutosDelDia / 60);
  const m = minutosDelDia % 60;
  // Con el offset de Madrid explícito, GHL interpreta la hora correcta
  // sin importar en qué zona horaria esté el servidor donde corre la app.
  return `${fecha}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00${offsetMadridEnFecha(fecha)}`;
}

// Crea la cita en el calendario indicado. Devuelve { id, calendarId } o
// lanza un error con el motivo — nunca "éxito" sin id real, para que un
// fallo no pase en silencio.
export async function crearCitaGHL({ ghlContactId, calendarId, fecha, inicio, duracion, titulo, estado }) {
  if (!configurado()) throw new Error("GHL no está configurado");
  if (!calendarId) throw new Error("No hay calendario de GHL asignado");
  if (!ghlContactId) throw new Error("No se pudo obtener el contacto en GHL");

  const assignedUserId = await usuarioAsignadoDelCalendario(calendarId);

  const data = await ghlFetch("/calendars/events/appointments", {
    method: "POST",
    body: JSON.stringify({
      calendarId,
      locationId: CONFIG.locationId,
      contactId: ghlContactId,
      title: titulo,
      startTime: isoConHora(fecha, inicio),
      endTime: isoConHora(fecha, inicio + duracion),
      ...(assignedUserId ? { assignedUserId } : {}),
      ...(estado ? { appointmentStatus: estado } : {}),
      // La disponibilidad la gestiona esta app; GHL no debe rechazar la cita
      // por sus propios huecos o plazos de antelación.
      ignoreFreeSlotValidation: true,
      ignoreDateRange: true,
    }),
  });

  const id = data?.id || data?.appointment?.id || data?.event?.id;
  if (!id) {
    throw new Error(`GHL no devolvió el id de la cita (${JSON.stringify(data).slice(0, 200)})`);
  }
  return { id, calendarId: data?.calendarId || data?.appointment?.calendarId || calendarId };
}

export async function actualizarCitaGHL(ghlEventId, { calendarId, fecha, inicio, duracion, titulo, estado }) {
  if (!configurado() || !ghlEventId) return;
  const assignedUserId =
    (await usuarioAsignadoDeLaCita(ghlEventId)) || (calendarId ? await usuarioAsignadoDelCalendario(calendarId) : null);
  await ghlFetch(`/calendars/events/appointments/${ghlEventId}`, {
    method: "PUT",
    body: JSON.stringify({
      title: titulo,
      startTime: isoConHora(fecha, inicio),
      endTime: isoConHora(fecha, inicio + duracion),
      ignoreFreeSlotValidation: true,
      ...(assignedUserId ? { assignedUserId } : {}),
      ...(estado ? { appointmentStatus: estado } : {}),
    }),
  });
}

// Cambia SOLO el estado de una cita en GHL (por ejemplo a «cancelled»): no toca ni la hora ni el título. Sirve para que GHL dispare sus
// automatizaciones de «cita cancelada» antes de borrarla.
export async function cambiarEstadoCitaGHL(ghlEventId, estado) {
  if (!configurado() || !ghlEventId) return;
  await ghlFetch(`/calendars/events/appointments/${ghlEventId}`, {
    method: "PUT",
    body: JSON.stringify({ appointmentStatus: estado, ignoreFreeSlotValidation: true }),
  });
}

// Un horario no disponible de la app = un «block slot» en el calendario de GHL:
// nadie puede reservar ahí desde GHL. (GHL admite calendarId O assignedUserId, no ambos.)
// Un horario no disponible bloquea A LA PERSONA (assignedUserId): así queda bloqueada en todos sus calendarios (también en los de
// servicio) y funciona aunque su calendario sea de tipo «round robin» (GHL solo admite bloquear por calendarId en calendarios de
// tipo evento: «The calendar is not an event calendar»). GHL no admite mandar los dos a la vez.
function cuerpoBloqueo({ calendarId, assignedUserId, fecha, inicio, duracion, titulo }) {
  const fin = Math.min(inicio + duracion, 23 * 60 + 59); // GHL no admite las 24:00
  return JSON.stringify({
    ...(assignedUserId ? { assignedUserId } : { calendarId }),
    locationId: CONFIG.locationId,
    title: titulo,
    startTime: isoConHora(fecha, inicio),
    endTime: isoConHora(fecha, fin),
  });
}

export async function crearBloqueoGHL(datos) {
  if (!configurado()) throw new Error("GHL no está configurado");
  if (!datos.calendarId && !datos.assignedUserId) throw new Error("No hay calendario de GHL asignado");
  const enviar = (d) => ghlFetch("/calendars/events/block-slots", { method: "POST", body: cuerpoBloqueo(d) });
  let data;
  try {
    data = await enviar(datos);
  } catch (err) {
    // si GHL no acepta bloquear por persona, se prueba como antes, por calendario
    if (!datos.assignedUserId || !datos.calendarId || ![400, 422].includes(err?.status)) throw err;
    data = await enviar({ ...datos, assignedUserId: null });
  }
  const id = data?.id || data?.event?.id || data?.blockSlot?.id;
  if (!id) throw new Error(`GHL no devolvió el id del bloqueo (${JSON.stringify(data).slice(0, 200)})`);
  return { id, calendarId: data?.calendarId || datos.calendarId };
}

export async function actualizarBloqueoGHL(ghlEventId, datos) {
  if (!configurado() || !ghlEventId) return;
  const enviar = (d) => ghlFetch(`/calendars/events/block-slots/${ghlEventId}`, { method: "PUT", body: cuerpoBloqueo(d) });
  try {
    await enviar(datos);
  } catch (err) {
    if (!datos.assignedUserId || !datos.calendarId || ![400, 422].includes(err?.status)) throw err;
    await enviar({ ...datos, assignedUserId: null });
  }
}

// Si la cita ya no existe en GHL (404), se da por borrada.
export async function eliminarCitaGHL(ghlEventId) { // también borra los block slots (mismo endpoint)
  if (!configurado() || !ghlEventId) return;
  try {
    await ghlFetch(`/calendars/events/${ghlEventId}`, { method: "DELETE" });
  } catch (err) {
    if (err.status === 404) return;
    throw err;
  }
}

export const eliminarBloqueoGHL = eliminarCitaGHL;


// ---------------------------------------------------------------------------
// Crear el calendario interno de una empleada
// ---------------------------------------------------------------------------
const idDeCalendario = (data) => data?.calendar?.id || data?.id || null;
const esRechazoDeCampos = (err) => [400, 422].includes(err?.status);

// Crea el calendario del servicio. Si GHL rechaza algún campo opcional, reintenta con lo imprescindible.
export async function crearCalendarioServicioGHL(datos) {
  if (!configurado()) throw new Error("GHL no está configurado");
  let aviso = null;
  const enviar = (minimo) => ghlFetch("/calendars/", { method: "POST", body: JSON.stringify(cuerpoCalendarioServicio({ ...datos, locationId: CONFIG.locationId, nuevo: true, minimo })) });
  let data;
  try {
    data = await enviar(false);
  } catch (err) {
    if (!esRechazoDeCampos(err)) throw err;
    data = await enviar(true);
    aviso = `GHL no aceptó algunos ajustes (${err.message}): el calendario se creó con lo básico. Revisa su horario y duración en GHL.`;
  }
  const id = idDeCalendario(data);
  if (!id) throw new Error(`GHL no devolvió el id del calendario (${JSON.stringify(data).slice(0, 200)})`);
  return { id, aviso };
}

// ---------------------------------------------------------------------------
// Usuarios y calendarios de las empleadas
// ---------------------------------------------------------------------------
export async function listarUsuariosGHL() {
  if (!configurado()) return [];
  const data = await ghlFetch(`/users/?locationId=${encodeURIComponent(CONFIG.locationId)}`);
  return data?.users || [];
}

// Cambia el nombre de un usuario de GHL (al dar de baja a una empleada: «empleado-eliminado»)
export async function renombrarUsuarioGHL(userId, nombre) {
  if (!configurado() || !userId) return;
  await ghlFetch(`/users/${userId}`, { method: "PUT", body: JSON.stringify({ firstName: nombre, lastName: "" }) });
}

// Actualiza solo lo que se indique de un calendario (nombre, activo, horas…)
export async function actualizarCalendarioGHL(calendarId, parcial) {
  if (!configurado() || !calendarId) return;
  await ghlFetch(`/calendars/${calendarId}`, { method: "PUT", body: JSON.stringify(parcial) });
}

// Campos personalizados de los contactos (para saber cuál es el de «Servicio»: el bot de IA escribe ahí el servicio que pide la clienta)
export async function listarCamposPersonalizadosGHL() {
  if (!configurado()) return [];
  const data = await ghlFetch(`/locations/${encodeURIComponent(CONFIG.locationId)}/customFields?model=contact`);
  return data?.customFields || [];
}

// Deja vacío un campo personalizado del contacto. El bot de IA de GHL solo rellena campos vacíos, así que el campo «Servicio»
// se vacía después de importar su cita para que la siguiente reserva de la misma clienta pueda escribir el servicio nuevo.
export async function vaciarCampoContactoGHL(contactId, fieldId) {
  if (!configurado() || !contactId || !fieldId) return;
  await ghlFetch(`/contacts/${contactId}`, {
    method: "PUT",
    body: JSON.stringify({ customFields: [{ id: fieldId, field_value: "" }] }),
  });
}

// ---------------------------------------------------------------------------
// Horarios de disponibilidad por persona (API «Availability» de GHL): lo que usa el bot de IA para saber cuándo puede agendar
// ---------------------------------------------------------------------------
// Horarios de una persona (y de un calendario). Los nombres de los filtros siguen la documentación; si GHL los rechaza, se ignora.
export async function buscarHorariosGHL({ userId, calendarId }) {
  if (!configurado()) return [];
  const p = new URLSearchParams({ locationId: CONFIG.locationId, ...(userId ? { userId } : {}), ...(calendarId ? { calendarId } : {}) });
  const data = await ghlFetch(`/calendars/schedules/search?${p}`);
  return data?.schedules || data?.data || (Array.isArray(data) ? data : []);
}
export async function crearHorarioGHL({ nombre, rules, timezone, userId, calendarIds }) {
  const data = await ghlFetch("/calendars/schedules", { method: "POST", body: JSON.stringify({ name: nombre, rules, timezone, locationId: CONFIG.locationId, userId, calendarIds }) });
  return data?.schedule || data;
}
export async function actualizarHorarioGHL(id, { nombre, rules, timezone }) {
  const data = await ghlFetch(`/calendars/schedules/${id}`, { method: "PUT", body: JSON.stringify({ name: nombre, rules, timezone }) });
  return data?.schedule || data;
}
export async function aplicarHorarioACalendarioGHL(id, calendarId) {
  await ghlFetch(`/calendars/schedules/${id}/associations/${calendarId}`, { method: "PUT" });
}

// Manda un email a un contacto desde GHL (conversaciones). Hace falta que la cuenta tenga el email configurado y que la clave tenga el
// permiso «conversations/message.write».
export async function enviarEmailGHL({ contactId, asunto, html, texto }) {
  return ghlFetch("/conversations/messages", { method: "POST", body: JSON.stringify({ type: "Email", contactId, subject: asunto, html, message: texto }) });
}

// Escribe un valor en un campo personalizado del contacto (por ejemplo, el enlace para cambiar o cancelar su próxima cita)
export async function escribirCampoContactoGHL(contactId, fieldId, valor) {
  if (!configurado() || !contactId || !fieldId) return;
  await ghlFetch(`/contacts/${contactId}`, { method: "PUT", body: JSON.stringify({ customFields: [{ id: fieldId, field_value: String(valor ?? "") }] }) });
}

