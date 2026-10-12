// Motor de informes. Funciones puras: reciben los datos y devuelven números.
// Así se pueden comprobar con casos calculados a mano.
//
// ctx = {
//   citas, servicios, clientes, empleadas (las que salen en la agenda), productos, metodos,
//   horarioDelDia(empleada, fecha, []) → { inicio, fin } | null   (jornada de ese día)
//   total(cita) → importe total de la cita,
//   hoy: "YYYY-MM-DD",
// }
//
// Una cita cuenta como:
//   · efectiva  → asistencia "prevista" (incluye las cobradas)
//   · no asistió → asistencia "no_asistio"
//   · cancelada → asistencia "cancelada" (no ocupa agenda ni cuenta en nada)

export const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
export const DIAS_CORTOS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
export const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

// ---------------------------------------------------------------------------
// Fechas
// ---------------------------------------------------------------------------

import { ventasEnRango, lineasPagoEnRango, importeConBono, METODO_BONO } from "./bonos";

const pad = (n) => String(n).padStart(2, "0");
export const isoDe = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fechaDeISO = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export function sumarDias(iso, n) {
  const d = fechaDeISO(iso);
  d.setDate(d.getDate() + n);
  return isoDe(d);
}
export function diaSemana(iso) {
  const g = fechaDeISO(iso).getDay();
  return g === 0 ? 6 : g - 1; // lunes = 0
}
export function listaFechas(desde, hasta) {
  const out = [];
  for (let f = desde; f <= hasta && out.length < 800; f = sumarDias(f, 1)) out.push(f);
  return out;
}

export const PRESETS_RANGO = [
  { id: "hoy", nombre: "Hoy" },
  { id: "7d_prox", nombre: "Próximos 7 días" },
  { id: "semana", nombre: "Esta semana" },
  { id: "mes", nombre: "Este mes" },
  { id: "mes_ant", nombre: "Mes pasado" },
  { id: "30d", nombre: "Últimos 30 días" },
  { id: "90d", nombre: "Últimos 90 días" },
  { id: "anio", nombre: "Este año" },
];

export function rangoDePreset(id, hoy) {
  const d = fechaDeISO(hoy);
  const y = d.getFullYear();
  const m = d.getMonth();
  switch (id) {
    case "hoy":
      return [hoy, hoy];
    case "7d_prox":
      return [hoy, sumarDias(hoy, 6)];
    case "semana": {
      const lunes = sumarDias(hoy, -diaSemana(hoy));
      return [lunes, sumarDias(lunes, 6)];
    }
    case "mes":
      return [isoDe(new Date(y, m, 1)), isoDe(new Date(y, m + 1, 0))];
    case "mes_ant":
      return [isoDe(new Date(y, m - 1, 1)), isoDe(new Date(y, m, 0))];
    case "30d":
      return [sumarDias(hoy, -29), hoy];
    case "90d":
      return [sumarDias(hoy, -89), hoy];
    case "anio":
      return [`${y}-01-01`, `${y}-12-31`];
    default:
      return [sumarDias(hoy, -29), hoy];
  }
}

// El periodo inmediatamente anterior, de la misma duración
export function rangoAnterior(desde, hasta) {
  const n = listaFechas(desde, hasta).length;
  return [sumarDias(desde, -n), sumarDias(desde, -1)];
}

export const variacion = (actual, anterior) => (anterior ? (actual - anterior) / anterior : null);

// ---------------------------------------------------------------------------
// Clasificación de citas
// ---------------------------------------------------------------------------

const asist = (c) => c.asistencia || "prevista";
export const esEfectiva = (c) => asist(c) === "prevista";
export const esNoShow = (c) => asist(c) === "no_asistio";
export const esCancelada = (c) => asist(c) === "cancelada";
const esCobrada = (c) => c.estadoCobro === "cobrada" && !esCancelada(c);
const enRango = (c, desde, hasta) => c.fecha >= desde && c.fecha <= hasta;
const suma = (arr, f) => arr.reduce((s, x) => s + f(x), 0);
const redondear = (n) => Math.round(n * 100) / 100;

function importeProductos(c, ctx) {
  return suma(c.productos || [], (l) => {
    const p = ctx.productos.find((x) => x.id === l.productoId);
    return p ? p.precio * l.cantidad : 0;
  });
}

// ---------------------------------------------------------------------------
// VENTAS
// ---------------------------------------------------------------------------

export function informeVentas(ctx, desde, hasta) {
  const servPorId = new Map(ctx.servicios.map((s) => [s.id, s]));
  const cobradas = ctx.citas.filter((c) => esCobrada(c) && enRango(c, desde, hasta));
  // BASE CAJA: lo pagado con un bono no es dinero nuevo (ya contó al VENDER el bono)
  const total = (c) => Math.max(ctx.total(c) - importeConBono(c), 0);
  const ingresosCitas = suma(cobradas, (c) => total(c));
  // Ventas sin cita (productos y bonos vendidos directamente)
  const ventasR = ventasEnRango(ctx.ventas || [], desde, hasta); // vendidas en el rango (para contarlas)
  const lineasR = lineasPagoEnRango(ctx.ventas || [], desde, hasta); // cobros del rango (también los plazos de ventas anteriores)
  const ingresosVentas = suma(lineasR, (x) => Number(x.linea.importe) || 0);
  const ingresos = ingresosCitas + ingresosVentas;

  // por día
  const fechas = listaFechas(desde, hasta);
  const porDiaMap = new Map(fechas.map((f) => [f, { fecha: f, ingresos: 0, cobradas: 0 }]));
  cobradas.forEach((c) => {
    const r = porDiaMap.get(c.fecha);
    if (r) {
      r.ingresos += total(c);
      r.cobradas += 1;
    }
  });
  lineasR.forEach(({ linea, fecha }) => {
    const r = porDiaMap.get(fecha);
    if (r) r.ingresos += Number(linea.importe) || 0;
  });
  ventasR.forEach((v) => {
    const r = porDiaMap.get(v.fecha);
    if (r) r.ventas = (r.ventas || 0) + 1;
  });
  const porDia = [...porDiaMap.values()];

  // por método de pago
  const mm = new Map();
  cobradas.forEach((c) => (c.pagos || []).forEach((p) => p.metodoId !== METODO_BONO && mm.set(p.metodoId, (mm.get(p.metodoId) || 0) + (Number(p.importe) || 0))));
  lineasR.forEach(({ linea: p }) => mm.set(p.metodoId, (mm.get(p.metodoId) || 0) + (Number(p.importe) || 0)));
  const totalPagos = [...mm.values()].reduce((a, b) => a + b, 0);
  const porMetodo = [...mm.entries()]
    .map(([id, importe]) => ({ id, nombre: ctx.metodos.find((m) => m.id === id)?.nombre || id, importe, pct: totalPagos ? importe / totalPagos : 0 }))
    .sort((a, b) => b.importe - a.importe);

  // por servicio / categoría (se reparte lo cobrado entre los servicios de la cita)
  const ps = new Map();
  let ingresosProductos = 0;
  const unidadesProducto = new Map();
  cobradas.forEach((c) => {
    const lineas = [c.servicioId, ...(c.serviciosExtra || [])].map((id) => servPorId.get(id)).filter(Boolean);
    const prod = importeProductos(c, ctx);
    ingresosProductos += prod;
    (c.productos || []).forEach((l) => unidadesProducto.set(l.productoId, (unidadesProducto.get(l.productoId) || 0) + l.cantidad));
    if (lineas.length === 0) return;
    const parte = Math.max(total(c) - prod, 0);
    const lista = suma(lineas, (s) => s.precio || 0);
    lineas.forEach((s) => {
      const cuota = lista > 0 ? (parte * (s.precio || 0)) / lista : parte / lineas.length;
      const r = ps.get(s.id) || { id: s.id, nombre: s.nombre, categoria: s.categoria || "Otros", color: s.color, ingresos: 0, cantidad: 0, minutos: 0 };
      r.ingresos += cuota;
      r.cantidad += 1;
      r.minutos += s.duracion || 0;
      ps.set(s.id, r);
    });
  });
  const porServicio = [...ps.values()]
    .map((r) => ({ ...r, ticket: r.cantidad ? r.ingresos / r.cantidad : 0, ingresoPorHora: r.minutos ? r.ingresos / (r.minutos / 60) : 0 }))
    .sort((a, b) => b.ingresos - a.ingresos);

  const pc = new Map();
  porServicio.forEach((r) => {
    const x = pc.get(r.categoria) || { categoria: r.categoria, ingresos: 0, cantidad: 0 };
    x.ingresos += r.ingresos;
    x.cantidad += r.cantidad;
    pc.set(r.categoria, x);
  });
  // Bonos vendidos: una categoría propia (el dinero cuenta al venderlos)
  const bonosVendidos = suma(ventasR, (v) => suma(v.bonos || [], (l) => l.cantidad));
  // lo cobrado de cada venta se reparte entre bonos y productos en proporción a su importe
  const parteBonos = (v) => (v.total > 0 ? suma(v.bonos || [], (l) => l.precio * l.cantidad) / v.total : 0);
  const ingresosBonos = redondear(suma(lineasR, ({ venta, linea }) => (Number(linea.importe) || 0) * parteBonos(venta)));
  if (bonosVendidos > 0) pc.set("Bonos", { categoria: "Bonos", ingresos: ingresosBonos, cantidad: bonosVendidos });
  const porCategoria = [...pc.values()].sort((a, b) => b.ingresos - a.ingresos);
  ingresosProductos += suma(ventasR, (v) => suma(v.productos || [], (l) => l.precio * l.cantidad));
  ventasR.forEach((v) => (v.productos || []).forEach((l) => unidadesProducto.set(l.productoId, (unidadesProducto.get(l.productoId) || 0) + l.cantidad)));

  // por empleada
  const pe = new Map();
  cobradas.forEach((c) => {
    const r = pe.get(c.empleadaId) || { id: c.empleadaId, nombre: ctx.empleadas.find((e) => e.id === c.empleadaId)?.nombre || "—", ingresos: 0, cobradas: 0 };
    r.ingresos += total(c);
    r.cobradas += 1;
    pe.set(c.empleadaId, r);
  });
  const porEmpleada = [...pe.values()].map((r) => ({ ...r, ticket: r.cobradas ? r.ingresos / r.cobradas : 0 })).sort((a, b) => b.ingresos - a.ingresos);

  // por día de la semana (media por día de ese tipo)
  const porDiaSemana = DIAS.map((nombre, i) => {
    const dias = fechas.filter((f) => diaSemana(f) === i);
    const total = suma(porDia.filter((r) => diaSemana(r.fecha) === i), (r) => r.ingresos);
    return { dia: i, nombre, ingresos: total, dias: dias.length, media: dias.length ? total / dias.length : 0 };
  });

  const pendienteCobro = suma(
    ctx.citas.filter((c) => esEfectiva(c) && c.estadoCobro !== "cobrada" && c.fecha <= ctx.hoy && enRango(c, desde, hasta)),
    (c) => ctx.total(c)
  );

  return {
    ingresos,
    cobradas: cobradas.length,
    ticketMedio: cobradas.length ? ingresosCitas / cobradas.length : 0, // ticket de las citas (las ventas sin cita no son citas)
    ingresosCitas,
    ingresosVentas,
    ingresosBonos,
    bonosVendidos,
    ventasDirectas: ventasR.length,
    porDia,
    porMetodo,
    porServicio,
    porCategoria,
    porEmpleada,
    porDiaSemana,
    ingresosProductos,
    unidadesProductos: [...unidadesProducto.values()].reduce((a, b) => a + b, 0),
    pendienteCobro,
  };
}

// Últimos 12 meses terminando en el mes de `hasta`: ingresos, nº de cobros y ticket medio de cada mes
export function serieMensual(ctx, hasta) {
  const d = fechaDeISO(hasta);
  const meses = [];
  for (let i = 11; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    meses.push({ clave: `${m.getFullYear()}-${pad(m.getMonth() + 1)}`, etiqueta: `${MESES_CORTOS[m.getMonth()]} ${String(m.getFullYear()).slice(2)}`, ingresos: 0, cobradas: 0, completo: true });
  }
  const finMesActual = isoDe(new Date(d.getFullYear(), d.getMonth() + 1, 0));
  meses[11].completo = hasta >= finMesActual && ctx.hoy > finMesActual;
  const idx = new Map(meses.map((m, i) => [m.clave, i]));
  meses.forEach((m) => {
    m.ingresosCitas = 0;
    m.ventasN = 0;
  });
  ctx.citas.filter(esCobrada).forEach((c) => {
    const i = idx.get(c.fecha.slice(0, 7));
    if (i !== undefined) {
      const t = Math.max(ctx.total(c) - importeConBono(c), 0); // base caja
      meses[i].ingresos += t;
      meses[i].ingresosCitas += t;
      meses[i].cobradas += 1;
    }
  });
  lineasPagoEnRango(ctx.ventas || [], "0000-01-01", "9999-12-31").forEach(({ linea, fecha }) => {
    const i = idx.get(fecha.slice(0, 7));
    if (i !== undefined) meses[i].ingresos += Number(linea.importe) || 0;
  });
  (ctx.ventas || []).filter((v) => !v.anulada).forEach((v) => {
    const i = idx.get(v.fecha.slice(0, 7));
    if (i !== undefined) meses[i].ventasN += 1;
  });
  meses.forEach((m) => {
    m.ticket = m.cobradas ? m.ingresosCitas / m.cobradas : 0;
  });
  const conDatos = meses.filter((m) => m.cobradas > 0 || m.ventasN > 0 || m.ingresos > 0); // también un mes que solo cobró plazos de ventas anteriores
  const completos = conDatos.filter((m) => m.completo);
  const media = (arr, f) => (arr.length ? suma(arr, f) / arr.length : 0);
  return {
    meses,
    mediaMensual: media(conDatos, (m) => m.ingresos),
    mediaMensualCompletos: media(completos, (m) => m.ingresos),
    mesesConDatos: conDatos.length,
    ticketMedioPeriodo: (() => {
      const c = suma(conDatos, (m) => m.cobradas);
      return c ? suma(conDatos, (m) => m.ingresosCitas) / c : 0;
    })(),
  };
}

// ---------------------------------------------------------------------------
// OCUPACIÓN
// ---------------------------------------------------------------------------

function unirIntervalos(intervalos) {
  const arr = intervalos.filter(([a, b]) => b > a).sort((x, y) => x[0] - y[0]);
  const out = [];
  for (const [a, b] of arr) {
    if (out.length && a <= out[out.length - 1][1]) out[out.length - 1][1] = Math.max(out[out.length - 1][1], b);
    else out.push([a, b]);
  }
  return out;
}
function medidaEn(intervalos, ini, fin) {
  let t = 0;
  for (const [a, b] of intervalos) {
    const x = Math.max(a, ini);
    const y = Math.min(b, fin);
    if (y > x) t += y - x;
  }
  return t;
}

// Tramos libres de [ini, fin] una vez quitados los horarios no disponibles (bloqueos)
function libresDe(ini, fin, bloqueados) {
  const out = [];
  let cur = ini;
  for (const [a, b] of bloqueados) {
    if (b <= cur) continue;
    if (a >= fin) break;
    if (a > cur) out.push([cur, Math.min(a, fin)]);
    cur = Math.max(cur, b);
    if (cur >= fin) break;
  }
  if (cur < fin) out.push([cur, fin]);
  return out;
}
// Minutos de `intervalos` que caen dentro de los tramos libres y de [ini, fin]
function medidaInter(intervalos, libres, ini, fin) {
  let t = 0;
  for (const [l0, l1] of libres) t += medidaEn(intervalos, Math.max(l0, ini), Math.min(l1, fin));
  return t;
}

// Ocupación = minutos con cita ÷ minutos de jornada (sin contar los horarios no disponibles). Citas solapadas de una
// misma empleada cuentan una sola vez (nunca pasa del 100 %).
//  · efectiva: solo citas a las que se acudió (o están por venir)
//  · reservada: efectivas + las que no asistieron (el hueco estaba vendido)
export function informeOcupacion(ctx, desde, hasta, { empleadaId } = {}) {
  const fechas = listaFechas(desde, hasta);
  const staff = ctx.empleadas.filter((e) => !empleadaId || e.id === empleadaId);
  const porFecha = new Map();
  ctx.citas.forEach((c) => {
    if (c.fecha < desde || c.fecha > hasta) return;
    if (!porFecha.has(c.fecha)) porFecha.set(c.fecha, []);
    porFecha.get(c.fecha).push(c);
  });

  const nueva = () => ({ capacidadMin: 0, efectivaMin: 0, reservadaMin: 0 });
  const total = nueva();
  const porEmpleada = new Map(staff.map((e) => [e.id, { id: e.id, nombre: e.nombre, ...nueva() }]));
  const porDiaSemana = DIAS.map((nombre, dia) => ({ dia, nombre, ...nueva(), diasContados: 0 }));
  const porHora = new Map();
  const mapa = DIAS.map(() => new Map());

  for (const fecha of fechas) {
    const dow = diaSemana(fecha);
    const citasDia = porFecha.get(fecha) || [];
    let contado = false;
    for (const emp of staff) {
      const j = ctx.horarioDelDia(emp, fecha, []);
      if (!j || j.fin <= j.inicio) continue;
      contado = true;
      const delEmp = citasDia.filter((c) => c.empleadaId === emp.id);
      const efect = unirIntervalos(delEmp.filter(esEfectiva).map((c) => [c.inicio, c.inicio + c.duracion]));
      const reserv = unirIntervalos(delEmp.filter((c) => esEfectiva(c) || esNoShow(c)).map((c) => [c.inicio, c.inicio + c.duracion]));
      const bloqueados = unirIntervalos((ctx.bloqueos || []).filter((b) => b.fecha === fecha && b.empleadaId === emp.id).map((b) => [b.inicio, b.inicio + b.duracion]));
      const libres = libresDe(j.inicio, j.fin, bloqueados);
      const cap = medidaEn(libres, j.inicio, j.fin);
      const ef = medidaInter(efect, libres, j.inicio, j.fin);
      const rs = medidaInter(reserv, libres, j.inicio, j.fin);

      const sumar = (obj, c, e, r) => {
        obj.capacidadMin += c;
        obj.efectivaMin += e;
        obj.reservadaMin += r;
      };
      sumar(total, cap, ef, rs);
      sumar(porEmpleada.get(emp.id), cap, ef, rs);
      sumar(porDiaSemana[dow], cap, ef, rs);

      for (let h = Math.floor(j.inicio / 60); h < Math.ceil(j.fin / 60); h++) {
        const a = Math.max(j.inicio, h * 60);
        const b = Math.min(j.fin, h * 60 + 60);
        if (b <= a) continue;
        const c1 = medidaEn(libres, a, b);
        const e1 = medidaInter(efect, libres, a, b);
        const r1 = medidaInter(reserv, libres, a, b);
        if (!porHora.has(h)) porHora.set(h, { hora: h, ...nueva() });
        sumar(porHora.get(h), c1, e1, r1);
        if (!mapa[dow].has(h)) mapa[dow].set(h, nueva());
        sumar(mapa[dow].get(h), c1, e1, r1);
      }
    }
    if (contado) porDiaSemana[dow].diasContados += 1;
  }

  const pct = (x, cap) => (cap ? x / cap : 0);
  const conPct = (o) => ({ ...o, pctEfectiva: pct(o.efectivaMin, o.capacidadMin), pctReservada: pct(o.reservadaMin, o.capacidadMin), noShowMin: o.reservadaMin - o.efectivaMin });

  const horas = [...porHora.values()].sort((a, b) => a.hora - b.hora).map(conPct);
  const celdas = [];
  mapa.forEach((m, dia) =>
    m.forEach((v, hora) => {
      if (v.capacidadMin > 0) celdas.push({ dia, hora, ...conPct(v) });
    })
  );
  const ordenadas = [...celdas].sort((a, b) => a.pctEfectiva - b.pctEfectiva);

  return {
    ...conPct(total),
    porEmpleada: [...porEmpleada.values()].map(conPct),
    porDiaSemana: porDiaSemana.map(conPct),
    porHora: horas,
    mapa: celdas,
    franjasFlojas: ordenadas.slice(0, 5),
    franjasFuertes: ordenadas.slice(-5).reverse(),
  };
}

// ---------------------------------------------------------------------------
// CLIENTES
// ---------------------------------------------------------------------------

export function informeClientes(ctx, desde, hasta, { diasInactivo = 60 } = {}) {
  const efectivas = ctx.citas.filter((c) => esEfectiva(c) && c.clienteId);
  const porCliente = new Map();
  efectivas.forEach((c) => {
    if (!porCliente.has(c.clienteId)) porCliente.set(c.clienteId, []);
    porCliente.get(c.clienteId).push(c);
  });
  porCliente.forEach((lista) => lista.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.inicio - b.inicio));

  const cliPorId = new Map(ctx.clientes.map((c) => [c.id, c]));
  const primera = (id) => porCliente.get(id)?.[0]?.fecha;

  const idsEn = (d, h) => new Set(efectivas.filter((c) => enRango(c, d, h)).map((c) => c.clienteId));
  const activosSet = idsEn(desde, hasta);
  const [pd, ph] = rangoAnterior(desde, hasta);
  const activosPrev = idsEn(pd, ph);

  const nuevos = [...activosSet].filter((id) => primera(id) >= desde && primera(id) <= hasta);
  const recurrentes = [...activosSet].filter((id) => primera(id) < desde);
  const sinFicha = ctx.citas.filter((c) => esEfectiva(c) && !c.clienteId && enRango(c, desde, hasta)).length;
  const citasConCliente = efectivas.filter((c) => enRango(c, desde, hasta));

  // gasto (solo lo cobrado) por cliente en el periodo
  const gasto = new Map();
  ctx.citas.filter((c) => esCobrada(c) && c.clienteId && enRango(c, desde, hasta)).forEach((c) => gasto.set(c.clienteId, (gasto.get(c.clienteId) || 0) + ctx.total(c)));
  const filaCliente = (id, extra = {}) => {
    const cli = cliPorId.get(id);
    const lista = porCliente.get(id) || [];
    return { id, nombre: cli?.nombre || "—", telefono: cli?.telefono || "", visitas: lista.length, ultima: lista[lista.length - 1]?.fecha || "", ...extra };
  };
  const topGasto = [...gasto.entries()]
    .map(([id, g]) => filaCliente(id, { gasto: g, visitasPeriodo: citasConCliente.filter((c) => c.clienteId === id).length }))
    .sort((a, b) => b.gasto - a.gasto)
    .slice(0, 10);

  // frecuencia media entre visitas (todo el histórico, clientes con ≥ 2 visitas)
  let sumaHuecos = 0;
  let nHuecos = 0;
  porCliente.forEach((lista) => {
    for (let i = 1; i < lista.length; i++) {
      sumaHuecos += (fechaDeISO(lista[i].fecha) - fechaDeISO(lista[i - 1].fecha)) / 86400000;
      nHuecos++;
    }
  });

  // inactivos: tuvieron visitas pero hace más de X días que no vienen
  const limite = sumarDias(ctx.hoy, -diasInactivo);
  const gastoTotal = new Map();
  ctx.citas.filter((c) => esCobrada(c) && c.clienteId).forEach((c) => gastoTotal.set(c.clienteId, (gastoTotal.get(c.clienteId) || 0) + ctx.total(c)));
  const proximas = new Set(ctx.citas.filter((c) => esEfectiva(c) && c.clienteId && c.fecha >= ctx.hoy).map((c) => c.clienteId));
  const inactivos = [...porCliente.keys()]
    .filter((id) => porCliente.get(id)[porCliente.get(id).length - 1].fecha < limite && !proximas.has(id))
    .map((id) => {
      const f = filaCliente(id, { gasto: gastoTotal.get(id) || 0 });
      return { ...f, diasSinVenir: Math.round((fechaDeISO(ctx.hoy) - fechaDeISO(f.ultima)) / 86400000) };
    })
    .sort((a, b) => b.gasto - a.gasto);

  // no asistencias por cliente
  const ns = new Map();
  ctx.citas.filter((c) => esNoShow(c) && c.clienteId && enRango(c, desde, hasta)).forEach((c) => ns.set(c.clienteId, (ns.get(c.clienteId) || 0) + 1));
  const noShows = [...ns.entries()].map(([id, n]) => filaCliente(id, { noShows: n })).sort((a, b) => b.noShows - a.noShows).slice(0, 10);

  // distribución de visitas en el periodo
  const visitasPeriodo = new Map();
  citasConCliente.forEach((c) => visitasPeriodo.set(c.clienteId, (visitasPeriodo.get(c.clienteId) || 0) + 1));
  const grupos = [
    { etiqueta: "1 visita", n: 0 },
    { etiqueta: "2 visitas", n: 0 },
    { etiqueta: "3-4 visitas", n: 0 },
    { etiqueta: "5 o más", n: 0 },
  ];
  visitasPeriodo.forEach((v) => {
    if (v === 1) grupos[0].n++;
    else if (v === 2) grupos[1].n++;
    else if (v <= 4) grupos[2].n++;
    else grupos[3].n++;
  });

  const volvieron = [...activosPrev].filter((id) => activosSet.has(id)).length;

  return {
    activos: activosSet.size,
    nuevos: nuevos.length,
    recurrentes: recurrentes.length,
    sinFicha,
    visitasMedias: activosSet.size ? citasConCliente.length / activosSet.size : 0,
    frecuenciaMediaDias: nHuecos ? sumaHuecos / nHuecos : 0,
    retencion: activosPrev.size ? volvieron / activosPrev.size : null,
    activosPeriodoAnterior: activosPrev.size,
    topGasto,
    inactivos,
    diasInactivo,
    noShows,
    distribucionVisitas: grupos,
    totalClientes: ctx.clientes.length,
  };
}

// ---------------------------------------------------------------------------
// SERVICIOS Y EQUIPO
// ---------------------------------------------------------------------------

export function informeServiciosEquipo(ctx, desde, hasta) {
  const ventas = informeVentas(ctx, desde, hasta);
  const ocup = informeOcupacion(ctx, desde, hasta);
  const enPeriodo = ctx.citas.filter((c) => enRango(c, desde, hasta));

  const servicios = ventas.porServicio.map((s) => {
    const citas = enPeriodo.filter((c) => c.servicioId === s.id);
    const noShows = citas.filter(esNoShow).length;
    const efect = citas.filter(esEfectiva).length;
    return { ...s, citas: efect, noShows, tasaNoShow: efect + noShows ? noShows / (efect + noShows) : 0, pctIngresos: ventas.ingresos ? s.ingresos / ventas.ingresos : 0 };
  });

  const equipo = ctx.empleadas.map((e) => {
    const v = ventas.porEmpleada.find((x) => x.id === e.id);
    const o = ocup.porEmpleada.find((x) => x.id === e.id) || { capacidadMin: 0, efectivaMin: 0, pctEfectiva: 0, pctReservada: 0 };
    const suyas = enPeriodo.filter((c) => c.empleadaId === e.id);
    const horasTrabajo = o.capacidadMin / 60;
    const ingresos = v?.ingresos || 0;
    return {
      id: e.id,
      nombre: e.nombre,
      ingresos,
      cobradas: v?.cobradas || 0,
      ticket: v?.ticket || 0,
      citas: suyas.filter(esEfectiva).length,
      noShows: suyas.filter(esNoShow).length,
      horasTrabajo,
      horasOcupadas: o.efectivaMin / 60,
      pctOcupacion: o.pctEfectiva,
      pctReservada: o.pctReservada,
      ingresoPorHora: horasTrabajo ? ingresos / horasTrabajo : 0,
    };
  });

  return { servicios, equipo, categorias: ventas.porCategoria, ingresos: ventas.ingresos };
}

// ---------------------------------------------------------------------------
// RESUMEN GENERAL (con comparación frente al periodo anterior)
// ---------------------------------------------------------------------------

function nucleo(ctx, desde, hasta) {
  const v = informeVentas(ctx, desde, hasta);
  const o = informeOcupacion(ctx, desde, hasta);
  const cl = informeClientes(ctx, desde, hasta);
  const citas = ctx.citas.filter((c) => enRango(c, desde, hasta));
  const efectivas = citas.filter(esEfectiva);
  const noShows = citas.filter(esNoShow);
  return {
    ventas: v,
    ocupacion: o,
    clientes: cl,
    citasEfectivas: efectivas.length,
    noShows: noShows.length,
    canceladas: citas.filter(esCancelada).length,
    tasaNoShow: efectivas.length + noShows.length ? noShows.length / (efectivas.length + noShows.length) : 0,
    ingresosPerdidosNoShow: suma(noShows, (c) => ctx.total(c)),
  };
}

export function informeResumen(ctx, desde, hasta) {
  const act = nucleo(ctx, desde, hasta);
  const [pd, ph] = rangoAnterior(desde, hasta);
  const prev = nucleo(ctx, pd, ph);
  return {
    ...act,
    anterior: { desde: pd, hasta: ph, ingresos: prev.ventas.ingresos, citasEfectivas: prev.citasEfectivas, ticketMedio: prev.ventas.ticketMedio, ocupacion: prev.ocupacion.pctEfectiva, nuevos: prev.clientes.nuevos, noShows: prev.noShows },
    variaciones: {
      ingresos: variacion(act.ventas.ingresos, prev.ventas.ingresos),
      citas: variacion(act.citasEfectivas, prev.citasEfectivas),
      ticket: variacion(act.ventas.ticketMedio, prev.ventas.ticketMedio),
      ocupacion: variacion(act.ocupacion.pctEfectiva, prev.ocupacion.pctEfectiva),
      nuevos: variacion(act.clientes.nuevos, prev.clientes.nuevos),
    },
  };
}

// ---------------------------------------------------------------------------
// Utilidades de presentación
// ---------------------------------------------------------------------------

export const euros = (n) => `${(Math.round((n || 0) * 100) / 100).toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`;
export const porcentaje = (x, dec = 0) => {
  const f = 10 ** dec;
  // el pequeño margen evita que 43,05 se redondee a 43,0 por cómo guarda los decimales el ordenador
  return `${(Math.round((x || 0) * 100 * f + 1e-7) / f).toFixed(dec).replace(".", ",")} %`;
};
export const horasTexto = (min) => `${(Math.round((min / 60) * 10) / 10).toLocaleString("es-ES")} h`;
export { redondear };
