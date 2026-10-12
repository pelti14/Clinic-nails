// Cursos de ventas: rendimiento semanal/mensual de cada empleada, objetivo de ventas extra, clases que se abren según el
// objetivo y test semanal obligatorio. Funciones puras (sin pantalla ni base de datos).
import { importeConBono } from "./bonos";

export const TIPOS_LECCION = { base: "Base", refuerzo: "Refuerzo", avanzado: "Avanzado" };
export const MOTIVOS_REFUERZO = { extra: "no llegaste al objetivo de ventas extra", ticket: "tu ticket medio fue bajo", cruzadas: "no hiciste ninguna venta cruzada" };
const redondear = (n) => Math.round(n * 100) / 100;
const pad = (n) => String(n).padStart(2, "0");
const isoDe = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const sumarDias = (iso, n) => { const d = new Date(`${iso}T00:00:00`); d.setDate(d.getDate() + n); return isoDe(d); };
export const lunesDe = (iso) => sumarDias(iso, -((new Date(`${iso}T00:00:00`).getDay() + 6) % 7));
// Hoy en Madrid (el servidor puede estar en otra zona horaria)
export const hoyMadrid = (ahora = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).format(ahora);

export function rangos(hoy) {
  const lunes = lunesDe(hoy);
  const d = new Date(`${hoy}T00:00:00`);
  return {
    semana: { desde: lunes, hasta: sumarDias(lunes, 6) },
    semanaAnterior: { desde: sumarDias(lunes, -7), hasta: sumarDias(lunes, -1) },
    mes: { desde: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`, hasta: isoDe(new Date(d.getFullYear(), d.getMonth() + 1, 0)) },
  };
}

// Lo que ha facturado una empleada en un periodo y cuánto de eso son VENTAS EXTRA (lo que añadió «a mayores» del servicio de la cita):
// servicios extra, productos y bonos que vendió. Todo en base de caja, como los informes.
export function rendimiento({ empleadaId, citas = [], ventas = [], bonosVendidos = [], servicios = [], productos = [], desde, hasta }) {
  const enRango = (f) => f >= desde && f <= hasta;
  const precioProd = (l) => (l.precio != null ? l.precio : productos.find((p) => p.id === l.productoId)?.precio || 0) * (l.cantidad || 0);
  let facturacion = 0, facturacionCitas = 0, extraServicios = 0, extraProductos = 0, extraBonos = 0, nCitas = 0;
  for (const c of citas) {
    if (c.empleadaId !== empleadaId || c.estadoCobro !== "cobrada" || !enRango(c.fecha)) continue;
    nCitas++;
    const principal = servicios.find((s) => s.id === c.servicioId)?.precio || 0;
    const extras = (c.serviciosExtra || []).reduce((s, id) => s + (servicios.find((x) => x.id === id)?.precio || 0), 0);
    const prods = (c.productos || []).reduce((s, l) => s + precioProd(l), 0);
    const deLaCita = (c.precioManual != null ? c.precioManual : principal + extras + prods) - importeConBono(c);
    facturacion += deLaCita;
    facturacionCitas += deLaCita;
    extraServicios += extras;
    extraProductos += prods;
  }
  // ventas sin cita que hizo ella (productos) y bonos que vendió
  for (const v of ventas) {
    if (v.anulada || v.creadoPor !== empleadaId || !enRango(v.fecha)) continue;
    const prods = (v.productos || []).reduce((s, l) => s + precioProd(l), 0);
    facturacion += prods;
    extraProductos += prods;
  }
  for (const b of bonosVendidos) {
    if (b.estado === "anulado" || b.vendidoPor !== empleadaId || !enRango(b.fechaVenta)) continue;
    facturacion += Number(b.precio) || 0;
    extraBonos += Number(b.precio) || 0;
  }
  const extra = extraServicios + extraProductos + extraBonos;
  // ticket medio = lo que deja de media cada cita cobrada (solo lo de las citas, sin bonos ni ventas sueltas)
  return { facturacion: redondear(facturacion), ticketMedio: nCitas ? redondear(facturacionCitas / nCitas) : 0, extra: redondear(extra), extraServicios: redondear(extraServicios), extraProductos: redondear(extraProductos), extraBonos: redondear(extraBonos), citas: nCitas };
}

export function resumenEmpleada(ctx, hoy) {
  const r = rangos(hoy);
  const semana = rendimiento({ ...ctx, ...r.semana });
  const anterior = rendimiento({ ...ctx, ...r.semanaAnterior });
  const mes = rendimiento({ ...ctx, ...r.mes });
  const objetivo = Number(ctx.objetivo) || 0;
  const objetivoTicket = Number(ctx.objetivoTicket) || 0;
  const cumplioAnterior = objetivo > 0 && anterior.extra >= objetivo;
  // Por qué necesita un refuerzo (clase para vender mejor): no llegó al objetivo de extras, su ticket medio fue bajo (si hay objetivo de
  // ticket) o hizo 3 citas o más sin NINGUNA venta cruzada
  const motivosRefuerzo = [];
  if (objetivo > 0 && !cumplioAnterior) motivosRefuerzo.push("extra");
  if (objetivoTicket > 0 && anterior.citas > 0 && anterior.ticketMedio < objetivoTicket) motivosRefuerzo.push("ticket");
  if (anterior.citas >= 3 && anterior.extra === 0) motivosRefuerzo.push("cruzadas");
  return { semana, anterior, mes, objetivo, objetivoTicket, motivosRefuerzo, cumpleSemana: objetivo > 0 && semana.extra >= objetivo, cumplioAnterior, ticketBajoAnterior: motivosRefuerzo.includes("ticket"), progreso: objetivo > 0 ? Math.min(1, semana.extra / objetivo) : 0 };
}

// ¿Qué clases tiene abiertas? Base: siempre · Refuerzo: si la semana pasada no llegó al objetivo · Avanzado: si llegó (la semana pasada o esta)
export function estadoLeccion(leccion, resumen) {
  if (leccion.activa === false) return { abierta: false, motivo: "Desactivada" };
  if (leccion.tipo === "refuerzo") {
    const motivos = resumen.motivosRefuerzo || (resumen.objetivo > 0 && !resumen.cumplioAnterior ? ["extra"] : []);
    if (motivos.length) return { abierta: true, motivo: `Abierta: la semana pasada ${motivos.map((m) => MOTIVOS_REFUERZO[m]).join(" y ")}` };
    return { abierta: false, motivo: resumen.objetivo > 0 ? "Se abre si no alcanzas el objetivo de ventas extra de la semana" : "Se abre si la semana pasada no hiciste ventas cruzadas o tu ticket medio fue bajo" };
  }
  if (leccion.tipo === "avanzado") {
    if (!resumen.objetivo) return { abierta: false, motivo: "Se abre cuando tengas un objetivo semanal y lo alcances" };
    return resumen.cumplioAnterior || resumen.cumpleSemana ? { abierta: true, motivo: "Abierta: has alcanzado el objetivo" } : { abierta: false, motivo: "Se abre al alcanzar el objetivo de ventas extra" };
  }
  return { abierta: true, motivo: "" };
}

// Tests obligatorios cada semana: los que tiene una empleada sin aprobar en la semana (lunes ISO) indicada
export const testsObligatorios = (lecciones) => lecciones.filter((l) => l.activa !== false && l.obligatorioSemanal && (l.preguntas || []).length > 0);
export function testsPendientes({ lecciones, resultados, empleadaId, semana }) {
  return testsObligatorios(lecciones).filter((l) => !resultados.some((r) => r.empleadaId === empleadaId && r.leccionId === l.id && r.semana === semana && r.aprobado));
}

// Corrección (en el servidor): respuestas = lista de índices elegidos, una por pregunta
export function corregir(preguntas = [], respuestas = [], minimo = 70) {
  const total = preguntas.length;
  const detalle = preguntas.map((p, i) => ({ correcta: p.correcta, elegida: respuestas[i] ?? null, acertada: respuestas[i] === p.correcta }));
  const aciertos = detalle.filter((d) => d.acertada).length;
  const puntuacion = total ? Math.round((aciertos / total) * 100) : 0;
  return { aciertos, total, puntuacion, aprobado: total > 0 && puntuacion >= minimo, detalle };
}
// Las empleadas no reciben cuáles son las respuestas correctas
export const sinRespuestas = (leccion) => ({ ...leccion, preguntas: (leccion.preguntas || []).map(({ correcta, ...resto }) => resto) });

// Una pregunta es válida si tiene texto, de 2 a 4 opciones con texto y una correcta dentro de las opciones
export function preguntaValida(p) {
  const opciones = (p?.opciones || []).map((o) => String(o || "").trim());
  return Boolean(String(p?.texto || "").trim()) && opciones.length >= 2 && opciones.length <= 4 && opciones.every(Boolean) && Number.isInteger(p.correcta) && p.correcta >= 0 && p.correcta < opciones.length;
}
