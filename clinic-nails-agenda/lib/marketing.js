// Marketing (solo administrador): huecos libres de un día, por qué hay huecos, qué hacer hoy, clientas para reactivar con su mensaje de
// WhatsApp y cómo va el negocio. Funciones puras (sin pantalla ni base de datos), probadas aparte.
import { overlaps } from "./agenda";
import { rendimiento, sumarDias, lunesDe } from "./cursos";
import { saldoBono, estadoBono } from "./bonos";

const redondear = (n) => Math.round(n * 100) / 100;
const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
export const diaSemanaTexto = (iso) => DIAS[new Date(`${iso}T12:00:00`).getDay()];
export const diasEntre = (desde, hasta) => Math.round((new Date(`${hasta}T12:00:00`) - new Date(`${desde}T12:00:00`)) / 86400000);
const activa = (c) => c.asistencia !== "cancelada";
const vino = (c) => c.estadoCobro === "cobrada" && c.asistencia !== "cancelada" && c.asistencia !== "no_asistio";
const valorCita = (c, servicios) => {
  if (c.precioManual != null) return Number(c.precioManual) || 0;
  const p = servicios.find((s) => s.id === c.servicioId)?.precio || 0;
  return p + (c.serviciosExtra || []).reduce((s, id) => s + (servicios.find((x) => x.id === id)?.precio || 0), 0);
};

// ---------------------------------------------------------------------------
// Huecos libres de un día
// ---------------------------------------------------------------------------
// `horarioDe(emp)` = { inicio, fin } de esa empleada ese día, o null si no trabaja. Las canceladas no ocupan; los horarios no disponibles sí.
export function huecosDelDia({ empleadas, fecha, citas, bloqueos = [], horarioDe, minimo = 30 }) {
  const porEmpleada = [];
  let disponibles = 0, ocupados = 0;
  for (const emp of empleadas) {
    const h = horarioDe(emp);
    if (!h || h.fin <= h.inicio) continue;
    const intervalos = [
      ...citas.filter((c) => c.fecha === fecha && c.empleadaId === emp.id && activa(c)).map((c) => [c.inicio, c.inicio + c.duracion]),
      ...bloqueos.filter((b) => b.fecha === fecha && b.empleadaId === emp.id).map((b) => [b.inicio, b.inicio + b.duracion]),
    ].map(([a, b]) => [Math.max(a, h.inicio), Math.min(b, h.fin)]).filter(([a, b]) => b > a).sort((x, y) => x[0] - y[0]);
    const fusion = [];
    for (const iv of intervalos) { const u = fusion[fusion.length - 1]; if (u && iv[0] <= u[1]) u[1] = Math.max(u[1], iv[1]); else fusion.push([...iv]); }
    const ocup = fusion.reduce((s, [a, b]) => s + (b - a), 0);
    const huecos = [];
    let cursor = h.inicio;
    for (const [a, b] of fusion) { if (a - cursor >= minimo) huecos.push({ inicio: cursor, fin: a, minutos: a - cursor }); cursor = Math.max(cursor, b); }
    if (h.fin - cursor >= minimo) huecos.push({ inicio: cursor, fin: h.fin, minutos: h.fin - cursor });
    const total = h.fin - h.inicio;
    disponibles += total; ocupados += ocup;
    porEmpleada.push({ empleada: emp, inicio: h.inicio, fin: h.fin, disponibles: total, ocupados: ocup, libres: total - ocup, huecos, ocupacion: total ? ocup / total : 0 });
  }
  const huecosTotales = porEmpleada.flatMap((e) => e.huecos);
  return { fecha, porEmpleada, disponibles, ocupados, libres: disponibles - ocupados, ocupacion: disponibles ? ocupados / disponibles : 0, minutosEnHuecos: huecosTotales.reduce((s, h) => s + h.minutos, 0), nHuecos: huecosTotales.length };
}

// Cuántas citas suele haber ese día de la semana (media de las últimas N semanas) frente a las que hay
export function ocupacionHabitual({ citas, fecha, semanas = 4 }) {
  const cuenta = (f) => citas.filter((c) => c.fecha === f && activa(c)).length;
  const previos = Array.from({ length: semanas }, (_, i) => sumarDias(fecha, -7 * (i + 1)));
  const conDatos = previos.map(cuenta);
  const media = conDatos.reduce((s, n) => s + n, 0) / semanas;
  return { dia: cuenta(fecha), media: redondear(media), semanas };
}

// «Por qué hay huecos»: señales que sacamos de los datos (no son causas seguras, son pistas)
export function senalesDeHuecos({ fecha, huecos, habitual, citas }) {
  const s = [];
  const dia = diaSemanaTexto(fecha);
  if (huecos.nHuecos === 0) return ["No hay huecos de 30 minutos o más: el día está completo."];
  if (habitual.media > 0 && habitual.dia < habitual.media * 0.8) s.push(`Hay ${habitual.dia} ${habitual.dia === 1 ? "cita" : "citas"} y un ${dia} normal suele haber unas ${Math.round(habitual.media)} (media de las últimas ${habitual.semanas} semanas): se ha reservado menos de lo habitual.`);
  else if (habitual.media === 0 && habitual.dia === 0) s.push(`No hay ninguna cita y no hay historial de otros ${dia}s con citas: puede que ese día se trabaje poco.`);
  const canceladas = citas.filter((c) => c.fecha === fecha && c.asistencia === "cancelada").length;
  if (canceladas > 0) s.push(`${canceladas} ${canceladas === 1 ? "cita cancelada ha dejado" : "citas canceladas han dejado"} hueco ese día.`);
  const sinConfirmar = citas.filter((c) => c.fecha === fecha && activa(c) && c.estadoCobro !== "cobrada" && (c.confirmacion || "pendiente") !== "confirmada").length;
  if (sinConfirmar > 0) s.push(`${sinConfirmar} ${sinConfirmar === 1 ? "cita sigue" : "citas siguen"} sin confirmar: si alguna no viene, serán más huecos.`);
  const todos = huecos.porEmpleada.flatMap((e) => e.huecos);
  // minutos libres a partir de las 16:00 y antes de las 14:00 (un hueco que cruza esas horas cuenta solo la parte que cae dentro)
  const tarde = todos.reduce((a, h) => a + Math.max(0, h.fin - Math.max(h.inicio, 16 * 60)), 0), manana = todos.reduce((a, h) => a + Math.max(0, Math.min(h.fin, 14 * 60) - h.inicio), 0);
  const total = huecos.minutosEnHuecos;
  if (total > 0 && tarde / total >= 0.6) s.push("La mayoría de los huecos están por la tarde (a partir de las 16:00).");
  else if (total > 0 && manana / total >= 0.6) s.push("La mayoría de los huecos están por la mañana (antes de las 14:00).");
  const conPoco = huecos.porEmpleada.filter((e) => e.ocupacion < 0.35 && e.disponibles >= 240);
  if (conPoco.length) s.push(`${conPoco.map((e) => e.empleada.nombre).join(" y ")} ${conPoco.length === 1 ? "tiene" : "tienen"} el día casi vacío (menos del 35 % ocupado).`);
  if (s.length === 0) s.push("No se ve una causa clara en los datos: son huecos sueltos entre citas.");
  return s;
}

// ---------------------------------------------------------------------------
// Último servicio de una clienta (para sugerirlo al abrir su cita)
// ---------------------------------------------------------------------------
export function ultimoServicioDe(clienteId, citas, servicios, hoy) {
  if (!clienteId) return null;
  const suyas = citas.filter((c) => c.clienteId === clienteId && vino(c) && (!hoy || c.fecha <= hoy)).sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : b.inicio - a.inicio));
  if (!suyas.length) return null;
  const c = suyas[0];
  const servicio = servicios.find((s) => s.id === c.servicioId) || null;
  return { servicio, servicioId: c.servicioId, fecha: c.fecha, dias: hoy ? Math.max(0, diasEntre(c.fecha, hoy)) : null, visitas: suyas.length, extras: (c.serviciosExtra || []).map((id) => servicios.find((s) => s.id === id)).filter(Boolean) };
}

// ---------------------------------------------------------------------------
// Clientas para reactivar
// ---------------------------------------------------------------------------
// Clientas que vinieron alguna vez (cita cobrada), llevan entre `minDias` y `maxDias` sin venir y no tienen ninguna cita futura.
// Primero las que tienen un bono con sesiones sin gastar y las que más han gastado. `contactos` = [{ clienteId, fecha }] (marketing ya hecho).
export function clientesParaReactivar({ clientes, citas, servicios, bonosVendidos = [], bonoUsos = [], contactos = [], hoy, minDias = 45, maxDias = 365, sinContactarDias = 14 }) {
  const lista = [];
  for (const cl of clientes) {
    const suyas = citas.filter((c) => c.clienteId === cl.id && activa(c));
    if (suyas.some((c) => c.fecha >= hoy && c.estadoCobro !== "cobrada")) continue; // ya tiene cita próxima
    const vistas = suyas.filter(vino);
    if (!vistas.length) continue;
    const ultima = vistas.reduce((m, c) => (c.fecha > m.fecha ? c : m), vistas[0]);
    const dias = diasEntre(ultima.fecha, hoy);
    if (dias < minDias || dias > maxDias) continue;
    const ultimoContacto = contactos.filter((x) => x.clienteId === cl.id).map((x) => x.fecha).sort().pop() || null;
    const hace = ultimoContacto ? diasEntre(ultimoContacto, hoy) : null;
    const bonoSesiones = bonosVendidos.filter((b) => b.clienteId === cl.id && estadoBono(b, bonoUsos, hoy) === "activo").reduce((s, b) => s + saldoBono(b, bonoUsos).restantes, 0);
    lista.push({
      cliente: cl, ultimaVisita: ultima.fecha, dias, visitas: vistas.length, gasto: redondear(vistas.reduce((s, c) => s + valorCita(c, servicios), 0)),
      ultimoServicio: servicios.find((s) => s.id === ultima.servicioId) || null, bonoSesiones, ultimoContacto, contactadaHaceDias: hace,
      contactadaReciente: hace !== null && hace < sinContactarDias,
    });
  }
  return lista.sort((a, b) => Number(b.bonoSesiones > 0) - Number(a.bonoSesiones > 0) || b.gasto - a.gasto || a.dias - b.dias);
}

export function tiempoSinVenir(dias) {
  if (dias < 60) return `${dias} días`;
  const m = Math.round(dias / 30);
  return m < 12 ? `${m} meses` : m === 12 ? "un año" : `${(Math.round((dias / 365) * 2) / 2).toString().replace(".", ",")} años`;
}

// El WhatsApp para reactivar: cercano, sin promesas ni descuentos inventados. `hueco` = { fecha, inicio } para ofrecer uno concreto.
export function mensajeReactivacion({ nombre, ultimoServicio, dias, hueco, hoy, negocio = "Clinic Nails & Beauty" }) {
  const primer = String(nombre || "").trim().split(/\s+/)[0];
  const desde = ultimoServicio ? ` desde tu ${ultimoServicio.nombre}` : "";
  const cuando = hueco ? (hueco.fecha === sumarDias(hoy, 1) ? "mañana" : `el ${diaSemanaTexto(hueco.fecha)}`) : "";
  const oferta = hueco ? `Tenemos un hueco ${cuando} a las ${hhmm(hueco.inicio)}${ultimoServicio ? ` para tu ${ultimoServicio.nombre}` : ""}. ¿Te lo reservo?` : "¿Te apetece que te busquemos un hueco esta semana?";
  return `Hola${primer ? ` ${primer}` : ""}, te escribimos de ${negocio}. Hace ${tiempoSinVenir(dias)} que no te vemos por aquí${desde} y nos acordamos de ti. ${oferta}`;
}

// ---------------------------------------------------------------------------
// Cómo va el negocio
// ---------------------------------------------------------------------------
// Facturado (base de caja, como los informes) en un periodo sumando a todas las empleadas
export function facturadoEnPeriodo({ empleadas, citas, ventas, bonosVendidos, servicios, productos, desde, hasta }) {
  const t = { facturacion: 0, extra: 0, citas: 0, facturacionCitas: 0 };
  for (const e of empleadas) {
    const r = rendimiento({ empleadaId: e.id, citas, ventas, bonosVendidos, servicios, productos, desde, hasta });
    t.facturacion += r.facturacion; t.extra += r.extra; t.citas += r.citas; t.facturacionCitas += r.ticketMedio * r.citas;
  }
  return { facturacion: redondear(t.facturacion), extra: redondear(t.extra), citas: t.citas, ticketMedio: t.citas ? redondear(t.facturacionCitas / t.citas) : 0 };
}

const variacion = (actual, previo) => (previo > 0 ? redondear(((actual - previo) / previo) * 100) : null);

export function kpisDelNegocio({ empleadas, citas, ventas = [], bonosVendidos = [], servicios, productos = [], clientes = [], hoy }) {
  const base = { empleadas, citas, ventas, bonosVendidos, servicios, productos };
  const f = (desde, hasta) => facturadoEnPeriodo({ ...base, desde, hasta });
  const ayer = sumarDias(hoy, -1);
  const lunes = lunesDe(hoy), diasSemana = diasEntre(lunes, hoy);
  const semana = f(lunes, hoy), semanaAnt = f(sumarDias(lunes, -7), sumarDias(lunes, -7 + diasSemana));
  const mesIni = `${hoy.slice(0, 8)}01`, diaMes = Number(hoy.slice(8, 10));
  const d = new Date(`${mesIni}T12:00:00`); d.setMonth(d.getMonth() - 1);
  const mesAntIni = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  const finMesAnt = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const mesAntFin = `${mesAntIni.slice(0, 8)}${String(Math.min(diaMes, finMesAnt)).padStart(2, "0")}`;
  const mes = f(mesIni, hoy), mesAnt = f(mesAntIni, mesAntFin);
  const hace30 = sumarDias(hoy, -30);
  const ult30 = citas.filter((c) => c.fecha > hace30 && c.fecha <= hoy);
  const canceladas = ult30.filter((c) => c.asistencia === "cancelada").length, noVino = ult30.filter((c) => c.asistencia === "no_asistio").length;
  const programadas = ult30.length;
  const estado = { activas: 0, enRiesgo: 0, perdidas: 0 };
  for (const cl of clientes) {
    const vistas = citas.filter((c) => c.clienteId === cl.id && vino(c));
    if (!vistas.length) continue;
    const dias = diasEntre(vistas.reduce((m, c) => (c.fecha > m ? c.fecha : m), vistas[0].fecha), hoy);
    if (dias <= 90) estado.activas++; else if (dias <= 180) estado.enRiesgo++; else estado.perdidas++;
  }
  return {
    hoy: f(hoy, hoy), ayer: f(ayer, ayer), semana, semanaAnterior: semanaAnt, variacionSemana: variacion(semana.facturacion, semanaAnt.facturacion),
    mes, mesAnterior: mesAnt, variacionMes: variacion(mes.facturacion, mesAnt.facturacion),
    ticketMedio30: f(sumarDias(hoy, -29), hoy).ticketMedio,
    cancelaciones30: { programadas, canceladas, noVino, tasaCancelacion: programadas ? redondear((canceladas / programadas) * 100) : 0, tasaNoVino: programadas ? redondear((noVino / programadas) * 100) : 0 },
    clientas: estado,
  };
}

// ---------------------------------------------------------------------------
// Qué hacer hoy: lista de acciones con su prioridad
// ---------------------------------------------------------------------------
export function accionesDeHoy({ huecosManana, sinConfirmarManana, citasManana, reactivables, bonosSinCita = 0, hoy }) {
  const a = [];
  if (sinConfirmarManana > 0) a.push({ id: "confirmar", prioridad: 1, titulo: `Confirma las citas de mañana (${sinConfirmarManana} sin confirmar)`, detalle: "Llama o escribe a quien aún no ha confirmado: lo que no se confirma suele acabar en hueco.", accion: "confirmar" });
  if (huecosManana && huecosManana.nHuecos > 0) {
    const horas = (huecosManana.minutosEnHuecos / 60).toLocaleString("es-ES", { maximumFractionDigits: 1 });
    a.push({ id: "huecos", prioridad: huecosManana.ocupacion < 0.5 ? 1 : 2, titulo: `Rellena los huecos de mañana (${horas} h libres en ${huecosManana.nHuecos} ${huecosManana.nHuecos === 1 ? "hueco" : "huecos"})`, detalle: "Escribe a las clientas de la lista de abajo ofreciéndoles uno de esos huecos.", accion: "huecos" });
  }
  if (reactivables.length > 0) a.push({ id: "reactivar", prioridad: 2, titulo: `Escribe a ${Math.min(reactivables.length, 10)} clientas que hace tiempo que no vienen`, detalle: `Hay ${reactivables.length} en total; empieza por las de arriba (bono pendiente o las que más han gastado).`, accion: "reactivar" });
  if (bonosSinCita > 0) a.push({ id: "bonos", prioridad: 2, titulo: `${bonosSinCita} ${bonosSinCita === 1 ? "clienta tiene" : "clientas tienen"} un bono con sesiones sin gastar y ninguna cita`, detalle: "Es dinero ya cobrado que está sin usar: ofréceles una cita.", accion: "reactivar" });
  if (citasManana === 0 && !(huecosManana && huecosManana.nHuecos > 0)) a.push({ id: "libre", prioridad: 3, titulo: "Mañana no hay citas ni horario de trabajo", detalle: "Si debería haber, revisa los turnos de las empleadas.", accion: null });
  return a.sort((x, y) => x.prioridad - y.prioridad);
}

// Clientas con un bono con sesiones por gastar y ninguna cita futura (aunque hayan venido hace poco)
export function bonosSinCita({ bonosVendidos, bonoUsos = [], citas, hoy }) {
  const ids = new Set();
  for (const b of bonosVendidos) {
    if (estadoBono(b, bonoUsos, hoy) !== "activo") continue;
    if (!citas.some((c) => c.clienteId === b.clienteId && c.fecha >= hoy && activa(c) && c.estadoCobro !== "cobrada")) ids.add(b.clienteId);
  }
  return [...ids].filter(Boolean);
}

// Reparte los huecos libres entre las clientas de la lista, por orden: cada una recibe el primer hueco donde cabe su servicio (con una
// empleada que lo haga) y ese hueco se acorta para que a la siguiente le toque otra hora. Devuelve { [clienteId]: { empleada, inicio, duracion } }.
export function repartirHuecos({ clientas, huecos, ocupar = true }) {
  const pool = huecos.porEmpleada.flatMap((e) => e.huecos.map((h) => ({ empleada: e.empleada, inicio: h.inicio, fin: h.fin }))).sort((a, b) => a.inicio - b.inicio || a.empleada.nombre.localeCompare(b.empleada.nombre));
  const reparto = {};
  for (const c of clientas) {
    const sv = c.ultimoServicio;
    const dur = Math.max(15, Number(sv?.duracion) || 30);
    const g = pool.find((x) => x.fin - x.inicio >= dur && (!sv || !Array.isArray(sv.empleadas) || sv.empleadas.length === 0 || sv.empleadas.includes(x.empleada.id)));
    if (!g) continue;
    reparto[c.cliente.id] = { empleada: g.empleada, inicio: g.inicio, duracion: dur };
    if (ocupar) g.inicio += dur;
  }
  return reparto;
}

// Qué parte de las horas de trabajo de los próximos días ya tiene cita (0 a 1). Lo usan Marketing y el diagnóstico de Cursos.
export function ocupacionProximosDias({ empleadas, citas, bloqueos = [], horarioDe, hoy, dias = 7 }) {
  let disp = 0, ocup = 0;
  for (let i = 1; i <= dias; i++) {
    const f = sumarDias(hoy, i);
    const h = huecosDelDia({ empleadas, fecha: f, citas, bloqueos, horarioDe: (e) => horarioDe(e, f) });
    disp += h.disponibles; ocup += h.ocupados;
  }
  return disp ? ocup / disp : 0;
}

