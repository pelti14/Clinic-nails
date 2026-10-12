// SOLO SERVIDOR. Lógica de la reserva online de las clientas (página pública /reservar). Las rutas /api/publico/* solo llaman a estas
// funciones. Nunca devuelve datos de otras clientas ni de las citas de nadie: solo el catálogo, los huecos libres y lo de quien tenga su pase.
// La base de datos y el envío a GHL se reciben como parámetros (así se prueba todo sin red).
import { randomBytes, randomUUID, randomInt, createHash, createHmac, timingSafeEqual } from "crypto";
import { registrarActividad } from "./actividadServidor";
import { elegirCabina, telefonoClave, fechaYMinutosMadrid } from "./agenda";
import { horarioDelDia } from "./horarios";
import { nombreNegocioDe, NEGOCIO_POR_DEFECTO } from "./negocio";
import { citaIdDeCodigo, enlaceDeCita } from "./enlaceCita";
import { sumarDias } from "./cursos";
import { normalizarAjustesReservas, validarDatosReserva, serviciosReservables, empleadasPara, empleadasReservables, huecosReservables, fechaReservable, asignarEmpleada, duracionTotal, precioTotal, citasFuturasDe, puedeCancelar, normalizarEmail, serviciosRecomendados } from "./reservaOnline";

const err = (status, error) => ({ ok: false, status, error });
const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const hash = (t) => createHash("sha256").update(String(t)).digest("hex");
const secreto = () => process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const firma = (t) => createHmac("sha256", secreto()).update(String(t)).digest("hex");
const iguales = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && timingSafeEqual(x, y); };
const TOKEN_OK = /^[a-f0-9]{64}$/;
const DIAS_VALIDEZ_PASE = 400;
export const ahoraMadrid = (ms = Date.now()) => { const { fecha, minutos } = fechaYMinutosMadrid(ms); return { hoy: fecha, minutos }; };

const mapServicio = (r) => ({ id: r.id, nombre: r.nombre, descripcion: r.descripcion || "", categoria: r.categoria || "", duracion: Number(r.duracion) || 0, precio: Number(r.precio) || 0, empleadas: r.empleadas || [], cabina: r.cabina || "cualquiera", activo: r.activo !== false, reservableOnline: r.reservable_online !== false, recomendadoOnline: r.recomendado_online === true, orden: Number(r.orden) || 0 });
const mapEmpleada = (r) => ({ id: r.id, nombre: r.nombre, activa: r.activa !== false, rol: r.rol || "empleada", horario: r.horario || {}, diasLibres: r.dias_libres || [], horarioTipo: r.horario_tipo || "fijo", turnos: r.turnos || [], turnoInicio: r.turno_inicio || "", ausencias: r.ausencias || [], excepciones: r.excepciones || [] });
const mapCita = (r) => ({ id: r.id, fecha: r.fecha, empleadaId: r.empleada_id, cabinaId: r.cabina_id, clienteId: r.cliente_id, servicioId: r.servicio_id, serviciosExtra: r.servicios_extra || [], inicio: r.inicio, duracion: r.duracion, asistencia: r.asistencia, estadoCobro: r.estado_cobro, notas: r.notas || "" });

export async function cargarContexto(supabase, { ahoraMs = Date.now() } = {}) {
  const [aj, sv, em, cb] = await Promise.all([supabase.from("ajustes").select("*"), supabase.from("servicios").select("*"), supabase.from("empleadas").select("*"), supabase.from("cabinas").select("*")]);
  for (const r of [aj, sv, em, cb]) if (r.error) throw new Error(r.error.message);
  const ajustes = Object.fromEntries((aj.data || []).filter((a) => a.clave === "reservas" || a.clave === "negocio").map((a) => [a.clave, a.valor]));
  const reservas = normalizarAjustesReservas(ajustes.reservas);
  const hoy = ahoraMadrid(ahoraMs).hoy;
  // El orden de las categorías del catálogo (si esa tabla aún no existe, se ignora)
  let categorias = [];
  try { const c = await supabase.from("categorias_servicios").select("*"); if (!c.error) categorias = (c.data || []).map((x) => ({ nombre: x.nombre, orden: Number(x.orden) || 0 })); } catch (e) { categorias = []; }
  // Para «los más reservados»: solo los servicios de las citas de los últimos 90 días
  let citasRecientes = [];
  if (reservas.activas && reservas.recomendados === "auto") {
    const r = await supabase.from("citas").select("servicio_id, servicios_extra, fecha, asistencia").gte("fecha", sumarDias(hoy, -90)).lte("fecha", hoy);
    if (!r.error) citasRecientes = (r.data || []).map(mapCita);
  }
  return { reservas, hoy, negocio: nombreNegocioDe({ negocio: ajustes.negocio }) || NEGOCIO_POR_DEFECTO, servicios: (sv.data || []).map(mapServicio), empleadas: (em.data || []).map(mapEmpleada), cabinas: (cb.data || []).map((c) => ({ id: c.id, activa: c.activa !== false })), categorias, citasRecientes };
}

// Lo único que ve cualquiera que abra la página: nada de datos internos
export function catalogoPublico(ctx) {
  const reservables = serviciosReservables(ctx.servicios).sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre));
  const hacen = (e) => reservables.filter((s) => (s.empleadas || []).includes(e.id)).map((s) => s.id);
  // «Recomendados»: lo primero que ven las clientas (los más reservados, los marcados a mano o nada, según los ajustes)
  const recomendados = ctx.reservas.activas ? serviciosRecomendados({ servicios: reservables, citas: ctx.citasRecientes || [], modo: ctx.reservas.recomendados, max: ctx.reservas.recomendadosMax, hoy: ctx.hoy }) : [];
  // Categorías en el orden del catálogo (las que no estén en él, al final por orden alfabético)
  const posicion = new Map((ctx.categorias || []).map((c) => [c.nombre, c.orden]));
  const categorias = [...new Set(reservables.map((s) => s.categoria).filter(Boolean))].sort((a, b) => (posicion.has(a) ? posicion.get(a) : 1e6) - (posicion.has(b) ? posicion.get(b) : 1e6) || a.localeCompare(b, "es"));
  return {
    ok: true, activo: ctx.reservas.activas, negocio: ctx.negocio, bienvenida: ctx.reservas.bienvenida, privacidadUrl: ctx.reservas.privacidadUrl, maxDias: ctx.reservas.maxDias,
    recomendados, categorias: ctx.reservas.activas ? categorias : [],
    servicios: ctx.reservas.activas ? reservables.map((s) => ({ id: s.id, nombre: s.nombre, descripcion: s.descripcion, categoria: s.categoria, duracion: s.duracion, precio: s.precio })) : [],
    empleadas: ctx.reservas.activas ? empleadasReservables(ctx.empleadas).map((e) => ({ id: e.id, nombre: e.nombre, servicios: hacen(e) })).filter((e) => e.servicios.length) : [],
  };
}

function resolverServicios(ctx, ids) {
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 4) return err(400, "Elige entre 1 y 4 servicios.");
  const unicos = [...new Set(ids.map(String))];
  const reservables = serviciosReservables(ctx.servicios);
  const sel = unicos.map((id) => reservables.find((s) => s.id === id));
  if (sel.some((s) => !s)) return err(400, "Alguno de los servicios ya no se puede reservar online.");
  return { ok: true, servicios: sel };
}

async function datosDelDia(supabase, fecha) {
  const [c, b] = await Promise.all([supabase.from("citas").select("*").eq("fecha", fecha), supabase.from("bloqueos").select("*").eq("fecha", fecha)]);
  if (c.error) throw new Error(c.error.message);
  return { citas: (c.data || []).map(mapCita), bloqueos: (b.data || []).map((x) => ({ fecha: x.fecha, empleadaId: x.empleada_id, inicio: x.inicio, duracion: x.duracion })) };
}
const calcularHuecos = (ctx, servicios, fecha, datos, ahoraMs, empleadaId) => {
  const { hoy, minutos } = ahoraMadrid(ahoraMs);
  return huecosReservables({ fecha, hoy, ahoraMin: minutos, servicios, empleadas: ctx.empleadas, citas: datos.citas, bloqueos: datos.bloqueos, horarioDe: (e, f) => horarioDelDia(e, f, []), intervalo: ctx.reservas.intervalo, antelacionMin: ctx.reservas.antelacionHoras * 60, empleadaId });
};

export async function huecosPublicos(ctx, supabase, { servicioIds, fecha, empleadaId }, ahoraMs = Date.now()) {
  if (!ctx.reservas.activas) return err(403, "Las reservas online no están activas.");
  const r = resolverServicios(ctx, servicioIds); if (!r.ok) return r;
  const { hoy } = ahoraMadrid(ahoraMs);
  if (!fechaReservable(fecha, { hoy, maxDias: ctx.reservas.maxDias })) return err(400, "Esa fecha no se puede reservar.");
  const datos = await datosDelDia(supabase, fecha);
  const huecos = calcularHuecos(ctx, r.servicios, fecha, datos, ahoraMs, empleadaId || null);
  return { ok: true, fecha, duracion: duracionTotal(r.servicios), precio: precioTotal(r.servicios), slots: huecos.map((h) => ({ inicio: h.inicio, hora: hhmm(h.inicio) })) };
}

async function buscarCliente(supabase, { telefono, email }) {
  const { data, error } = await supabase.from("clientes").select("*");
  if (error) throw new Error(error.message);
  const clave = telefonoClave(telefono);
  return (data || []).find((c) => clave && telefonoClave(c.telefono) === clave) || null;
}
const nuevoPase = async (supabase, clienteId, ahoraMs) => {
  const token = randomBytes(32).toString("hex");
  const { error } = await supabase.from("clientes_acceso").insert({ id: randomUUID(), cliente_id: clienteId, token_hash: hash(token), creado: new Date(ahoraMs).toISOString(), ultimo_uso: new Date(ahoraMs).toISOString() });
  if (error) throw new Error(error.message);
  return token;
};

// Reservar: valida todo en el servidor, vuelve a comprobar que el hueco sigue libre, crea la cita (y la clienta si es nueva) y avisa a GHL
export async function reservarPublico(ctx, supabase, entrada, { ahoraMs = Date.now(), sincronizar, baseUrl = "" } = {}) {
  if (!ctx.reservas.activas) return err(403, "Las reservas online no están activas.");
  const v = validarDatosReserva(entrada);
  if (v.bot) return err(400, "No se ha podido enviar.");
  if (!v.ok) return { ok: false, status: 400, error: "Revisa los datos.", errores: v.errores };
  const r = resolverServicios(ctx, entrada.servicioIds); if (!r.ok) return r;
  const { hoy } = ahoraMadrid(ahoraMs);
  const inicio = Number(entrada.inicio);
  if (!fechaReservable(entrada.fecha, { hoy, maxDias: ctx.reservas.maxDias }) || !Number.isInteger(inicio)) return err(400, "Esa fecha u hora no se puede reservar.");
  const datos = await datosDelDia(supabase, entrada.fecha);
  const huecos = calcularHuecos(ctx, r.servicios, entrada.fecha, datos, ahoraMs, entrada.empleadaId || null);
  const hueco = huecos.find((h) => h.inicio === inicio);
  if (!hueco) return err(409, "Ese hueco acaba de ocuparse. Elige otro, por favor.");
  const empleadaId = asignarEmpleada({ empleadaIds: hueco.empleadaIds, preferida: entrada.empleadaId || null, citasDelDia: datos.citas });
  if (!empleadaId) return err(409, "Ese hueco acaba de ocuparse. Elige otro, por favor.");
  const empleada = ctx.empleadas.find((e) => e.id === empleadaId);
  const dur = duracionTotal(r.servicios);

  let cliente = await buscarCliente(supabase, v.limpio);
  const nueva = !cliente;
  if (cliente) {
    const { data: todas, error: e1 } = await supabase.from("citas").select("*").eq("cliente_id", cliente.id);
    if (e1) throw new Error(e1.message);
    if (citasFuturasDe((todas || []).map(mapCita), cliente.id, hoy).length >= ctx.reservas.maxCitasFuturas) return err(409, `Ya tienes ${ctx.reservas.maxCitasFuturas} citas próximas. Para reservar otra, llámanos y lo vemos.`);
    if (v.limpio.email && !String(cliente.email || "").trim()) { await supabase.from("clientes").update({ email: v.limpio.email }).eq("id", cliente.id); cliente = { ...cliente, email: v.limpio.email }; }
  } else {
    cliente = { id: randomUUID(), nombre: v.limpio.nombre, telefono: v.limpio.telefono, email: v.limpio.email, favorito: false };
    const { error: e2 } = await supabase.from("clientes").insert(cliente);
    if (e2) throw new Error(e2.message);
  }

  const cabinaId = elegirCabina(r.servicios[0], ctx.cabinas, datos.citas.filter((c) => c.asistencia !== "cancelada"), inicio, dur, null);
  const fila = {
    id: randomUUID(), fecha: entrada.fecha, empleada_id: empleadaId, servicio_id: r.servicios[0].id, cabina_id: cabinaId, cliente_id: cliente.id, clienta: cliente.nombre, inicio, duracion: dur,
    servicios_extra: r.servicios.slice(1).map((s) => s.id), pagos: [], productos: [], estado_cobro: "pendiente", asistencia: "prevista", origen: "online",
    notas: `🌐 Reserva online.${nueva ? " Clienta nueva." : ""}${entrada.empleadaId ? ` Pidió a ${empleada.nombre}.` : ""}`,
  };
  const { error: e3 } = await supabase.from("citas").insert(fila);
  if (e3) throw new Error(e3.message);

  // Dos reservas a la vez para el mismo hueco: si hay cualquier otra cita pisándose con esta, se retira esta (nunca se deja una doble reserva)
  const despues = await datosDelDia(supabase, entrada.fecha);
  const choque = despues.citas.some((c) => c.id !== fila.id && c.empleadaId === empleadaId && c.asistencia !== "cancelada" && c.inicio < inicio + dur && inicio < c.inicio + c.duracion);
  if (choque) {
    await supabase.from("citas").delete().eq("id", fila.id);
    return err(409, "Ese hueco acaba de ocuparse. Elige otro, por favor.");
  }

  let ghl = "no sincronizada";
  if (sincronizar) { try { const s = await sincronizar(fila.id); ghl = s && s.ok === false ? `error: ${s.error || s.motivo || "GHL"}` : s && s.skipped ? "GHL no configurado" : "enviada a GHL"; } catch (e) { ghl = `error: ${e.message}`; } }
  const token = entrada.recordar ? await nuevoPase(supabase, cliente.id, ahoraMs) : null;
  const nombres = r.servicios.map((s) => s.nombre);
  await registrarActividad([{ usuario_id: null, usuario_nombre: "Reserva online", origen: "online", entidad: "cita", entidad_id: fila.id, cliente_id: cliente.id, accion: "crear", resumen: `Reserva online: ${cliente.nombre} · ${nombres.join(" + ")} el ${entrada.fecha} a las ${hhmm(inicio)} con ${empleada.nombre}${nueva ? " (clienta nueva)" : ""}`, detalle: { fecha: entrada.fecha, hora: hhmm(inicio), empleada: empleada.nombre, servicios: nombres, duracion: dur, nueva, ghl } }]);
  return { ok: true, cita: { id: fila.id, fecha: entrada.fecha, inicio, hora: hhmm(inicio), duracion: dur, precio: precioTotal(r.servicios), servicios: nombres, empleada: empleada.nombre }, cliente: { nombre: cliente.nombre, telefono: cliente.telefono, email: cliente.email || "" }, ...(token ? { token } : {}), ...(baseUrl && enlaceDeCita(baseUrl, fila.id) ? { enlace: enlaceDeCita(baseUrl, fila.id) } : {}), ghl };
}

// ---------------------------------------------------------------------------
// «Mis citas»: quien tiene su pase (guardado en su móvil) ve y cancela SUS citas
// ---------------------------------------------------------------------------
async function clienteDelPase(supabase, token, ahoraMs) {
  if (!TOKEN_OK.test(String(token || ""))) return null;
  const { data, error } = await supabase.from("clientes_acceso").select("*").eq("token_hash", hash(token));
  if (error) throw new Error(error.message);
  const p = (data || [])[0];
  if (!p || ahoraMs - new Date(p.ultimo_uso || p.creado).getTime() > DIAS_VALIDEZ_PASE * 86400000) return null;
  const { data: cl } = await supabase.from("clientes").select("*").eq("id", p.cliente_id);
  if (!cl || !cl[0]) return null;
  await supabase.from("clientes_acceso").update({ ultimo_uso: new Date(ahoraMs).toISOString() }).eq("id", p.id);
  return cl[0];
}

export async function misCitasPublico(ctx, supabase, token, ahoraMs = Date.now()) {
  const cliente = await clienteDelPase(supabase, token, ahoraMs);
  if (!cliente) return err(401, "Tu acceso ha caducado. Entra de nuevo con tu email o reserva otra vez.");
  const { hoy } = ahoraMadrid(ahoraMs);
  const { data, error } = await supabase.from("citas").select("*").eq("cliente_id", cliente.id);
  if (error) throw new Error(error.message);
  const citas = citasFuturasDe((data || []).map(mapCita), cliente.id, hoy).sort((a, b) => (a.fecha + String(a.inicio).padStart(5, "0") < b.fecha + String(b.inicio).padStart(5, "0") ? -1 : 1));
  return { ok: true, cliente: { nombre: cliente.nombre, telefono: cliente.telefono || "", email: cliente.email || "" }, cancelarHoras: ctx.reservas.cancelarHoras, citas: citas.map((c) => ({ id: c.id, fecha: c.fecha, hora: hhmm(c.inicio), inicio: c.inicio, servicios: [c.servicioId, ...c.serviciosExtra].map((id) => ctx.servicios.find((s) => s.id === id)?.nombre).filter(Boolean), empleada: ctx.empleadas.find((e) => e.id === c.empleadaId)?.nombre || "", puedeCancelar: puedeCancelar({ fecha: c.fecha, inicio: c.inicio, hoy, ahoraMin: ahoraMadrid(ahoraMs).minutos, horas: ctx.reservas.cancelarHoras }) })) };
}

// ---------------------------------------------------------------------------
// Gestionar una cita (cambiarla o cancelarla): con el pase del móvil (token + id de la cita) o con el ENLACE firmado de esa cita
// ---------------------------------------------------------------------------
const SIN_CITA = "No encontramos esa cita."; // la misma respuesta si es de otra clienta, no existe o el enlace es falso: no se revela nada
async function resolverGestion(supabase, { token, citaId, codigo }, ahoraMs) {
  if (codigo) {
    const id = citaIdDeCodigo(codigo);
    if (!id) return err(404, SIN_CITA);
    const { data } = await supabase.from("citas").select("*").eq("id", id);
    const cita = (data || [])[0];
    if (!cita) return err(404, SIN_CITA);
    let cliente = null;
    if (cita.cliente_id) { const r = await supabase.from("clientes").select("*").eq("id", cita.cliente_id); cliente = (r.data || [])[0] || null; }
    return { ok: true, cita, cliente, via: "enlace" };
  }
  const cliente = await clienteDelPase(supabase, token, ahoraMs);
  if (!cliente) return err(401, "Tu acceso ha caducado. Entra de nuevo con tu email.");
  const { data } = await supabase.from("citas").select("*").eq("id", String(citaId || ""));
  const cita = (data || [])[0];
  if (!cita || cita.cliente_id !== cliente.id) return err(404, SIN_CITA);
  return { ok: true, cita, cliente, via: "pase" };
}
// activa | cancelada | cobrada | pasada
function estadoDeCita(c, hoy, minutos) {
  if (c.asistencia === "cancelada") return "cancelada";
  if (c.estadoCobro === "cobrada") return "cobrada";
  if (c.fecha < hoy || (c.fecha === hoy && c.inicio <= minutos)) return "pasada";
  return "activa";
}
const nombresDe = (ctx, c) => [c.servicioId, ...c.serviciosExtra].map((id) => ctx.servicios.find((s) => s.id === id)?.nombre).filter(Boolean);
const MOTIVO = { cancelada: "Esa cita ya está cancelada.", cobrada: "Esa cita ya está pagada: no se puede cambiar.", pasada: "Esa cita ya ha pasado." };

// Lo que enseña la página del enlace de una cita
export async function citaPorCodigo(ctx, supabase, { codigo }, ahoraMs = Date.now()) {
  if (!codigo) return err(404, SIN_CITA); // sin enlace no hay página (esta página no admite el pase del móvil)
  const g = await resolverGestion(supabase, { codigo }, ahoraMs); if (!g.ok) return g;
  const c = mapCita(g.cita);
  const { hoy, minutos } = ahoraMadrid(ahoraMs);
  const estado = estadoDeCita(c, hoy, minutos);
  const margen = estado === "activa" && puedeCancelar({ fecha: c.fecha, inicio: c.inicio, hoy, ahoraMin: minutos, horas: ctx.reservas.cancelarHoras });
  return { ok: true, negocio: ctx.negocio, cancelarHoras: ctx.reservas.cancelarHoras, maxDias: ctx.reservas.maxDias, cliente: { nombre: String(g.cliente?.nombre || "").trim().split(/\s+/)[0] || "" }, cita: { id: c.id, fecha: c.fecha, hora: hhmm(c.inicio), inicio: c.inicio, duracion: c.duracion, servicios: nombresDe(ctx, c), empleada: ctx.empleadas.find((e) => e.id === c.empleadaId)?.nombre || "", estado, puedeCambiar: margen, puedeCancelar: margen } };
}

export async function cancelarPublico(ctx, supabase, { token, citaId, codigo }, { ahoraMs = Date.now(), sincronizar } = {}) {
  const g = await resolverGestion(supabase, { token, citaId, codigo }, ahoraMs); if (!g.ok) return g;
  const c = mapCita(g.cita);
  const { hoy, minutos } = ahoraMadrid(ahoraMs);
  if (c.asistencia === "cancelada") return { ok: true, yaCancelada: true };
  if (c.estadoCobro === "cobrada" || c.fecha < hoy) return err(409, "Esa cita ya no se puede cancelar.");
  if (!puedeCancelar({ fecha: c.fecha, inicio: c.inicio, hoy, ahoraMin: minutos, horas: ctx.reservas.cancelarHoras })) return err(409, `Solo se puede cancelar con ${ctx.reservas.cancelarHoras} horas de antelación. Llámanos y lo vemos.`);
  const { error } = await supabase.from("citas").update({ asistencia: "cancelada", notas: `${c.notas} ❌ Cancelada por la clienta desde la reserva online.`.trim() }).eq("id", c.id);
  if (error) throw new Error(error.message);
  let ghl = "no sincronizada";
  if (sincronizar) { try { const r = await sincronizar(c.id); ghl = r && r.ok === false ? `error: ${r.error || r.motivo || "GHL"}` : "enviada a GHL"; } catch (e) { ghl = `error: ${e.message}`; } }
  const nombreCliente = g.cliente?.nombre || c.clienta || "Clienta";
  await registrarActividad([{ usuario_id: null, usuario_nombre: "Reserva online", origen: "online", entidad: "cita", entidad_id: c.id, cliente_id: g.cliente?.id || null, accion: "cancelar", resumen: `Cancelada por la clienta: ${nombreCliente} · ${nombresDe(ctx, c).join(" + ")} el ${c.fecha} a las ${hhmm(c.inicio)}`, detalle: { fecha: c.fecha, hora: hhmm(c.inicio), ghl, via: g.via } }]);
  return { ok: true };
}

// Un servicio «virtual» con la duración REAL de la cita (por si no coincide con la suma de sus servicios) y las empleadas que pueden hacerla
function servicioDeLaCita(ctx, c) {
  const reales = [c.servicioId, ...c.serviciosExtra].map((id) => ctx.servicios.find((s) => s.id === id));
  const todos = reales.length > 0 && reales.every(Boolean);
  const ids = todos ? ctx.empleadas.filter((e) => reales.every((s) => (s.empleadas || []).includes(e.id))).map((e) => e.id) : [];
  if (c.empleadaId && !ids.includes(c.empleadaId)) ids.push(c.empleadaId);
  return { id: "cita", nombre: "cita", duracion: c.duracion, precio: 0, empleadas: ids, activo: true, cabina: reales[0]?.cabina || "cualquiera" };
}
async function prepararCambio(ctx, supabase, entrada, ahoraMs) {
  const g = await resolverGestion(supabase, entrada, ahoraMs); if (!g.ok) return g;
  const c = mapCita(g.cita);
  const { hoy, minutos } = ahoraMadrid(ahoraMs);
  const estado = estadoDeCita(c, hoy, minutos);
  if (estado !== "activa") return err(409, MOTIVO[estado]);
  if (!puedeCancelar({ fecha: c.fecha, inicio: c.inicio, hoy, ahoraMin: minutos, horas: ctx.reservas.cancelarHoras })) return err(409, `Solo se puede cambiar con ${ctx.reservas.cancelarHoras} horas de antelación. Llámanos y lo vemos.`);
  if (!fechaReservable(entrada.fecha, { hoy, maxDias: ctx.reservas.maxDias })) return err(400, "Esa fecha no se puede reservar.");
  const datos = await datosDelDia(supabase, entrada.fecha);
  const libres = { ...datos, citas: datos.citas.filter((x) => x.id !== c.id) }; // la propia cita no ocupa su hueco
  const huecos = calcularHuecos(ctx, [servicioDeLaCita(ctx, c)], entrada.fecha, libres, ahoraMs, entrada.empleadaId || null);
  return { ok: true, g, c, datos: libres, huecos };
}

// Los huecos a los que se puede MOVER una cita (el suyo también cuenta como libre)
export async function huecosParaCambio(ctx, supabase, entrada, ahoraMs = Date.now()) {
  const p = await prepararCambio(ctx, supabase, entrada, ahoraMs); if (!p.ok) return p;
  const actual = ctx.empleadas.find((e) => e.id === p.c.empleadaId);
  return { ok: true, fecha: entrada.fecha, duracion: p.c.duracion, empleadaActual: actual ? { id: actual.id, nombre: actual.nombre } : null, slots: p.huecos.map((h) => ({ inicio: h.inicio, hora: hhmm(h.inicio) })) };
}

// Cambiar una cita de día, de hora o de profesional. Se vuelve a comprobar el hueco, la confirmación se reinicia y se avisa a GHL (que la mueve).
export async function modificarPublico(ctx, supabase, entrada, { ahoraMs = Date.now(), sincronizar } = {}) {
  const p = await prepararCambio(ctx, supabase, entrada, ahoraMs); if (!p.ok) return p;
  const { c, g, datos, huecos } = p;
  const inicio = Number(entrada.inicio);
  const hueco = Number.isInteger(inicio) ? huecos.find((h) => h.inicio === inicio) : null;
  if (!hueco) return err(409, "Ese hueco acaba de ocuparse. Elige otro, por favor.");
  // Si le da igual la profesional, se mantiene la misma cuando puede; si no, la que menos citas tenga ese día
  const empleadaId = entrada.empleadaId ? (hueco.empleadaIds.includes(entrada.empleadaId) ? entrada.empleadaId : null) : hueco.empleadaIds.includes(c.empleadaId) ? c.empleadaId : asignarEmpleada({ empleadaIds: hueco.empleadaIds, preferida: null, citasDelDia: datos.citas });
  if (!empleadaId) return err(409, "Ese hueco acaba de ocuparse. Elige otro, por favor.");
  if (entrada.fecha === c.fecha && inicio === c.inicio && empleadaId === c.empleadaId) return { ok: true, sinCambios: true, cita: { id: c.id, fecha: c.fecha, inicio: c.inicio, hora: hhmm(c.inicio), empleada: ctx.empleadas.find((e) => e.id === c.empleadaId)?.nombre || "" } };
  const sv = servicioDeLaCita(ctx, c);
  const cabinaId = elegirCabina(sv, ctx.cabinas, datos.citas.filter((x) => x.asistencia !== "cancelada"), inicio, c.duracion, c.cabinaId);
  if (cabinaId === null || cabinaId === undefined) return err(409, "Ese hueco acaba de ocuparse. Elige otro, por favor.");
  const empleada = ctx.empleadas.find((e) => e.id === empleadaId);
  const antes = { fecha: c.fecha, inicio: c.inicio, empleada_id: c.empleadaId, cabina_id: c.cabinaId };
  const nota = `${c.notas} 🔁 Cambiada por la clienta desde la reserva online (antes: ${c.fecha} a las ${hhmm(c.inicio)}).`.trim();
  const nuevo = { fecha: entrada.fecha, inicio, empleada_id: empleadaId, cabina_id: cabinaId, notas: nota };
  let up = await supabase.from("citas").update({ ...nuevo, confirmacion: "pendiente", confirmacion_por: null, confirmacion_en: null }).eq("id", c.id);
  if (up.error) up = await supabase.from("citas").update(nuevo).eq("id", c.id); // por si falta alguna columna de confirmación
  if (up.error) throw new Error(up.error.message);
  // Dos personas a la vez: si otra cita se pisa con el nuevo hueco, se deja la cita como estaba
  const despues = await datosDelDia(supabase, entrada.fecha);
  const choque = despues.citas.some((x) => x.id !== c.id && x.empleadaId === empleadaId && x.asistencia !== "cancelada" && x.inicio < inicio + c.duracion && inicio < x.inicio + x.duracion);
  if (choque) {
    await supabase.from("citas").update({ fecha: antes.fecha, inicio: antes.inicio, empleada_id: antes.empleada_id, cabina_id: antes.cabina_id, notas: c.notas }).eq("id", c.id);
    return err(409, "Ese hueco acaba de ocuparse. Elige otro, por favor.");
  }
  let ghl = "no sincronizada";
  if (sincronizar) { try { const r = await sincronizar(c.id); ghl = r && r.ok === false ? `error: ${r.error || r.motivo || "GHL"}` : "enviada a GHL"; } catch (e) { ghl = `error: ${e.message}`; } }
  const nombres = nombresDe(ctx, c);
  await registrarActividad([{ usuario_id: null, usuario_nombre: "Reserva online", origen: "online", entidad: "cita", entidad_id: c.id, cliente_id: g.cliente?.id || null, accion: "editar", resumen: `Cita cambiada por la clienta: ${g.cliente?.nombre || c.clienta || "Clienta"} · ${nombres.join(" + ")} del ${antes.fecha} a las ${hhmm(antes.inicio)} al ${entrada.fecha} a las ${hhmm(inicio)} con ${empleada.nombre}`, detalle: { antes: { fecha: antes.fecha, hora: hhmm(antes.inicio) }, despues: { fecha: entrada.fecha, hora: hhmm(inicio) }, ghl, via: g.via } }]);
  return { ok: true, cita: { id: c.id, fecha: entrada.fecha, inicio, hora: hhmm(inicio), duracion: c.duracion, servicios: nombres, empleada: empleada.nombre } };
}

// «No soy yo»: el pase de este móvil deja de valer
export async function salirPublico(supabase, token) {
  if (TOKEN_OK.test(String(token || ""))) await supabase.from("clientes_acceso").delete().eq("token_hash", hash(token));
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Entrar con el email en otro móvil: código de 6 cifras por email (10 minutos, 5 intentos, un solo uso)
// ---------------------------------------------------------------------------
const MENSAJE_CODIGO = "Si ese email está registrado, te hemos enviado un código. Mira también la carpeta de spam.";
async function clientePorEmail(supabase, email) {
  const { data, error } = await supabase.from("clientes").select("*");
  if (error) throw new Error(error.message);
  return (data || []).find((c) => normalizarEmail(c.email) === email) || null;
}

export async function solicitarCodigo(supabase, { email }, { ahoraMs = Date.now(), enviar } = {}) {
  const e = normalizarEmail(email);
  if (!e) return err(400, "Escribe un email válido.");
  const cliente = await clientePorEmail(supabase, e);
  if (cliente) { // la respuesta es la misma exista o no el email: así nadie puede comprobar quién es clienta
    const codigo = String(randomInt(0, 1000000)).padStart(6, "0");
    await supabase.from("clientes_codigos").update({ usado: true }).eq("cliente_id", cliente.id);
    const id = randomUUID();
    const { error } = await supabase.from("clientes_codigos").insert({ id, cliente_id: cliente.id, email: e, codigo_hash: firma(`${id}:${codigo}`), expira: new Date(ahoraMs + 10 * 60000).toISOString(), intentos: 0, usado: false, creado: new Date(ahoraMs).toISOString() });
    if (error) throw new Error(error.message);
    try { if (enviar) await enviar({ cliente, codigo }); } catch (ex) { console.error("código de acceso:", ex.message); }
  }
  return { ok: true, mensaje: MENSAJE_CODIGO };
}

export async function verificarCodigo(supabase, { email, codigo }, { ahoraMs = Date.now() } = {}) {
  const e = normalizarEmail(email);
  const MAL = err(400, "El código no es correcto o ha caducado. Pide uno nuevo.");
  if (!e || !/^\d{6}$/.test(String(codigo || ""))) return MAL;
  const cliente = await clientePorEmail(supabase, e);
  if (!cliente) return MAL;
  const { data } = await supabase.from("clientes_codigos").select("*").eq("cliente_id", cliente.id);
  const vivo = (data || []).filter((c) => !c.usado && new Date(c.expira).getTime() > ahoraMs).sort((a, b) => (a.creado < b.creado ? 1 : -1))[0];
  if (!vivo) return MAL;
  if (vivo.intentos >= 5) { await supabase.from("clientes_codigos").update({ usado: true }).eq("id", vivo.id); return MAL; }
  if (!iguales(firma(`${vivo.id}:${codigo}`), vivo.codigo_hash)) { await supabase.from("clientes_codigos").update({ intentos: vivo.intentos + 1 }).eq("id", vivo.id); return MAL; }
  await supabase.from("clientes_codigos").update({ usado: true }).eq("id", vivo.id);
  const token = await nuevoPase(supabase, cliente.id, ahoraMs);
  return { ok: true, token, cliente: { nombre: cliente.nombre, telefono: cliente.telefono || "", email: cliente.email || "" } };
}
