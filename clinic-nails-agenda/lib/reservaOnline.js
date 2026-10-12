// Reserva online de las clientas (página pública /reservar): validar lo que escriben, calcular los huecos reales y repartir empleada.
// Funciones puras (sin pantalla, red ni base de datos): se usan en el servidor y se prueban aparte.
import { overlaps, telefonoClave } from "./agenda";
import { sumarDias } from "./cursos";

export const RESERVAS_POR_DEFECTO = { activas: false, antelacionHoras: 2, maxDias: 60, intervalo: 15, cancelarHoras: 24, maxCitasFuturas: 3, bienvenida: "", privacidadUrl: "", recomendados: "auto", recomendadosMax: 5, dominioPublico: "" };

const entero = (v, min, max, def) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : def; };
// Ajustes guardados → valores seguros (con límites razonables)
export function normalizarAjustesReservas(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  const d = RESERVAS_POR_DEFECTO;
  return {
    activas: r.activas === true,
    antelacionHoras: entero(r.antelacionHoras, 0, 168, d.antelacionHoras),
    maxDias: entero(r.maxDias, 1, 365, d.maxDias),
    intervalo: [10, 15, 20, 30, 60].includes(Number(r.intervalo)) ? Number(r.intervalo) : d.intervalo,
    cancelarHoras: entero(r.cancelarHoras, 0, 168, d.cancelarHoras),
    maxCitasFuturas: entero(r.maxCitasFuturas, 1, 20, d.maxCitasFuturas),
    bienvenida: String(r.bienvenida ?? "").trim().slice(0, 300),
    privacidadUrl: /^https?:\/\/\S+$/i.test(String(r.privacidadUrl ?? "").trim()) ? String(r.privacidadUrl).trim().slice(0, 300) : "",
    // qué servicios salen primero («Recomendados»): los más reservados, los marcados a mano o ninguno
    recomendados: ["auto", "manual", "ninguno"].includes(r.recomendados) ? r.recomendados : d.recomendados,
    recomendadosMax: entero(r.recomendadosMax, 1, 10, d.recomendadosMax),
    // dirección pública para los enlaces de las citas (si usas un subdominio); si no, se usa la de la propia página
    dominioPublico: /^https?:\/\/[^\s/?#]+$/i.test(String(r.dominioPublico ?? "").trim().replace(/\/+$/, "")) ? String(r.dominioPublico).trim().replace(/\/+$/, "").slice(0, 200) : "",
  };
}

// ---------------------------------------------------------------------------
// Lo que escribe la clienta
// ---------------------------------------------------------------------------
const limpiar = (t) => String(t ?? "").replace(/\s+/g, " ").trim();
// Teléfono → 9 cifras españolas (6/7 móvil, 8/9 fijo) o «+» y cifras si es de otro país. null si no vale.
export function normalizarTelefono(t) {
  const crudo = String(t ?? "").trim();
  const d = crudo.replace(/\D/g, "");
  if (!d) return null;
  const sinPrefijo = d.startsWith("0034") ? d.slice(4) : crudo.startsWith("+34") || (d.startsWith("34") && d.length === 11) ? d.slice(2) : d;
  if (/^[6-9]\d{8}$/.test(sinPrefijo)) return sinPrefijo;
  if (crudo.startsWith("+") && !crudo.startsWith("+34") && d.length >= 8 && d.length <= 15) return `+${d}`;
  return null;
}
export function normalizarEmail(e) {
  const x = limpiar(e).toLowerCase();
  if (!x) return "";
  return x.length <= 120 && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/.test(x) ? x : null;
}

// → { ok, errores: { campo: texto }, limpio: { nombre, telefono, email } }
export function validarDatosReserva({ nombre, telefono, email, consentimiento, web }) {
  const errores = {};
  if (web) return { ok: false, errores: { general: "No se ha podido enviar." }, bot: true, limpio: {} }; // campo trampa para bots
  const n = limpiar(nombre);
  if (n.length < 2 || !/\p{L}/u.test(n)) errores.nombre = "Escribe tu nombre.";
  else if (n.length > 80 || /[<>]/.test(n)) errores.nombre = "Revisa tu nombre (máximo 80 letras y sin «<» ni «>»).";
  const tel = normalizarTelefono(telefono);
  if (!tel) errores.telefono = "Escribe un teléfono válido (9 cifras, por ejemplo 600 123 456).";
  const mail = normalizarEmail(email);
  if (mail === null) errores.email = "Ese email no parece válido. Revísalo, por favor.";
  else if (!mail) errores.email = "Escribe tu email: lo necesitamos para avisarte y para que puedas cambiar o cancelar tu cita.";
  if (consentimiento !== true) errores.consentimiento = "Necesitamos que aceptes el tratamiento de tus datos para poder reservar.";
  return { ok: Object.keys(errores).length === 0, errores, limpio: { nombre: n, telefono: tel, email: mail || "" } };
}

// ---------------------------------------------------------------------------
// Qué se puede reservar y con quién
// ---------------------------------------------------------------------------
export const serviciosReservables = (servicios) => servicios.filter((s) => s.activo !== false && s.reservableOnline !== false && String(s.nombre || "").trim() && Number(s.duracion) > 0);
export const duracionTotal = (servicios) => servicios.reduce((m, s) => m + (Number(s.duracion) || 0), 0);
export const precioTotal = (servicios) => Math.round(servicios.reduce((m, s) => m + (Number(s.precio) || 0), 0) * 100) / 100;
export const empleadasReservables = (empleadas) => empleadas.filter((e) => e.activa !== false && e.rol !== "admin");
// Las que hacen TODOS los servicios elegidos (se hacen seguidos, con la misma persona)
export const empleadasPara = (servicios, empleadas) => empleadasReservables(empleadas).filter((e) => servicios.length > 0 && servicios.every((s) => (s.empleadas || []).includes(e.id)));

export const fechasReservables = ({ hoy, maxDias }) => Array.from({ length: maxDias + 1 }, (_, i) => sumarDias(hoy, i));
export const fechaReservable = (fecha, { hoy, maxDias }) => /^\d{4}-\d{2}-\d{2}$/.test(String(fecha)) && fecha >= hoy && fecha <= sumarDias(hoy, maxDias);

// Los huecos en los que una clienta puede empezar: la empleada trabaja ese día, el servicio entero cabe en su horario y no pisa ninguna cita
// (las canceladas no cuentan) ni horario no disponible. Hoy, además, respeta la antelación mínima. Devuelve [{ inicio, empleadaIds }].
// `horarioDe(empleada, fecha)` = { inicio, fin } o null (hay que calcularlo SIN citas, para que un día libre con citas no cuente como de trabajo).
export function huecosReservables({ fecha, hoy, ahoraMin = 0, servicios, empleadas, citas, bloqueos = [], horarioDe, intervalo = 15, antelacionMin = 120, empleadaId = null }) {
  const dur = duracionTotal(servicios);
  if (!dur) return [];
  let pool = empleadasPara(servicios, empleadas);
  if (empleadaId) pool = pool.filter((e) => e.id === empleadaId);
  const porInicio = new Map();
  for (const emp of pool) {
    const h = horarioDe(emp, fecha);
    if (!h || h.fin <= h.inicio) continue;
    const ocupados = [
      ...citas.filter((c) => c.fecha === fecha && c.empleadaId === emp.id && c.asistencia !== "cancelada").map((c) => [c.inicio, c.duracion]),
      ...bloqueos.filter((b) => b.fecha === fecha && b.empleadaId === emp.id).map((b) => [b.inicio, b.duracion]),
    ];
    for (let t = Math.ceil(h.inicio / intervalo) * intervalo; t + dur <= h.fin; t += intervalo) {
      if (fecha === hoy && t < ahoraMin + antelacionMin) continue;
      if (ocupados.some(([a, d]) => overlaps(a, d, t, dur))) continue;
      if (!porInicio.has(t)) porInicio.set(t, []);
      porInicio.get(t).push(emp.id);
    }
  }
  return [...porInicio.entries()].sort((a, b) => a[0] - b[0]).map(([inicio, empleadaIds]) => ({ inicio, empleadaIds }));
}

// Con quién queda la cita: la que pidió la clienta (si puede) y, si le da igual, la que menos citas tiene ese día
export function asignarEmpleada({ empleadaIds, preferida, citasDelDia }) {
  if (preferida) return empleadaIds.includes(preferida) ? preferida : null;
  const cuenta = (id) => citasDelDia.filter((c) => c.empleadaId === id && c.asistencia !== "cancelada").length;
  return [...empleadaIds].sort((a, b) => cuenta(a) - cuenta(b) || String(a).localeCompare(String(b)))[0] || null;
}

// ¿Quedan citas futuras de esta clienta por encima del máximo?
export const citasFuturasDe = (citas, clienteId, hoy) => citas.filter((c) => c.clienteId === clienteId && c.fecha >= hoy && c.asistencia !== "cancelada" && c.estadoCobro !== "cobrada");
// Cancelar solo si falta al menos `horas` para la cita
export function puedeCancelar({ fecha, inicio, hoy, ahoraMin, horas }) {
  const minutosHasta = (new Date(`${fecha}T00:00:00Z`) - new Date(`${hoy}T00:00:00Z`)) / 60000 + inicio - ahoraMin;
  return minutosHasta >= horas * 60;
}

// ---------------------------------------------------------------------------
// Limitador (contra abusos): como mucho `max` intentos por clave en `ventanaMs`
// ---------------------------------------------------------------------------
export function crearLimitador({ max, ventanaMs }) {
  const marcas = new Map();
  return {
    permitir(clave, ahora = Date.now()) {
      const recientes = (marcas.get(clave) || []).filter((t) => ahora - t < ventanaMs);
      if (recientes.length >= max) { marcas.set(clave, recientes); return { ok: false, reintentarEnMs: ventanaMs - (ahora - recientes[0]) }; }
      recientes.push(ahora); marcas.set(clave, recientes);
      if (marcas.size > 5000) for (const [k, v] of marcas) if (!v.some((t) => ahora - t < ventanaMs)) marcas.delete(k);
      return { ok: true };
    },
  };
}

// Archivo .ics para añadir la cita al calendario del móvil (hora local, sin zona: el móvil la toma como suya)
export function icsDeCita({ negocio, titulo, fecha, inicio, duracion, uid }) {
  const f = fecha.replace(/-/g, "");
  const h = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}${String(m % 60).padStart(2, "0")}00`;
  const esc = (t) => String(t).replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
  const fin = inicio + duracion;
  const finFecha = fin >= 1440 ? sumarDias(fecha, 1).replace(/-/g, "") : f;
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Agenda//Reserva online//ES", "BEGIN:VEVENT", `UID:${uid}@reservas`, `DTSTAMP:${f}T000000`, `DTSTART:${f}T${h(inicio)}`, `DTEND:${finFecha}T${h(fin % 1440)}`, `SUMMARY:${esc(titulo)}`, `DESCRIPTION:${esc(`Reserva en ${negocio}`)}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
}
export { telefonoClave };

// Los servicios que salen PRIMERO en la reserva online («Recomendados»). `servicios` ya son los reservables, en el orden del catálogo.
// «auto»: los que más se han hecho en los últimos 90 días (cuentan el principal y los extras de cada cita, sin canceladas); si todavía no hay
// historial, los marcados a mano. «manual»: solo los marcados en cada servicio. «ninguno»: no hay apartado de recomendados.
export function serviciosRecomendados({ servicios, citas = [], modo = "auto", max = 5, hoy }) {
  if (modo === "ninguno") return [];
  const marcados = servicios.filter((s) => s.recomendadoOnline === true).map((s) => s.id);
  if (modo === "manual") return marcados;
  const desde = sumarDias(hoy, -90);
  const cuenta = new Map();
  for (const c of citas) {
    if (c.asistencia === "cancelada" || !(c.fecha > desde && c.fecha <= hoy)) continue;
    for (const id of [c.servicioId, ...(c.serviciosExtra || [])]) if (id) cuenta.set(id, (cuenta.get(id) || 0) + 1);
  }
  const posicion = new Map(servicios.map((sv, i) => [sv.id, i]));
  const masHechos = servicios.filter((sv) => cuenta.get(sv.id) > 0).sort((a, b) => cuenta.get(b.id) - cuenta.get(a.id) || posicion.get(a.id) - posicion.get(b.id)).slice(0, max).map((sv) => sv.id);
  return masHechos.length ? masHechos : marcados;
}

// Primera letra en mayúscula y el resto como está («lunes, 12 de octubre» → «Lunes, 12 de octubre»)
export const primeraMayuscula = (t) => { const x = String(t ?? ""); return x.charAt(0).toLocaleUpperCase("es-ES") + x.slice(1); };

