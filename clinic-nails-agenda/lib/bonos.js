// Lógica de bonos y ventas sin cita, sin pantalla (se puede probar entera).
//
// Contabilidad en BASE CAJA: el dinero cuenta cuando se VENDE el bono; la sesión que luego
// se paga con el bono es una línea de pago «bono» (no es dinero nuevo) y no se vuelve a contar.

export const METODO_BONO = "bono";
const redondear = (n) => Math.round((Number(n) || 0) * 100) / 100;

// Servicios a los que aplica un bono (o bono vendido): varios, uno o ninguno (= cualquier servicio).
// Acepta también el formato antiguo de un solo servicio (`servicioId`).
export const serviciosDe = (b) => (Array.isArray(b?.servicioIds) && b.servicioIds.length ? b.servicioIds : b?.servicioId ? [b.servicioId] : []);

export function fechaMasDias(iso, dias) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + Number(dias));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function saldoBono(bv, usos) {
  const usadas = usos.filter((u) => u.bonoVendidoId === bv.id).length;
  return { total: bv.sesionesTotal, usadas, restantes: Math.max(0, bv.sesionesTotal - usadas) };
}

// activo | agotado | caducado | anulado
export function estadoBono(bv, usos, hoy) {
  if (bv.estado === "anulado") return "anulado";
  if (saldoBono(bv, usos).restantes <= 0) return "agotado";
  if (bv.caduca && bv.caduca < hoy) return "caducado";
  return "activo";
}

// Importe de una cita pagado con bonos (no es dinero cobrado ese día)
export const importeConBono = (cita) => (cita.pagos || []).filter((p) => p.metodoId === METODO_BONO).reduce((s, p) => s + (Number(p.importe) || 0), 0);

// Cuánto cubre UNA sesión de este bono en esta cita: el precio del servicio al que aplica.
// Bono de un tratamiento concreto → ese servicio (principal o extra). Bono «cualquier servicio» → el servicio principal.
export function valorSesion(bv, principal, extras = []) {
  const ids = serviciosDe(bv);
  const candidatos = ids.length ? [principal, ...extras].filter((s) => s && ids.includes(s.id)) : [principal].filter(Boolean);
  return candidatos.length ? redondear(candidatos[0].precio) : 0;
}

// Bonos activos del cliente que se pueden usar en esta cita (no los ya aplicados en ella)
export function bonosAplicables({ bonosVendidos, usos, clienteId, principal, extras = [], hoy, yaAplicados = [] }) {
  if (!clienteId) return [];
  return bonosVendidos
    .filter((bv) => bv.clienteId === clienteId && estadoBono(bv, usos, hoy) === "activo" && !yaAplicados.includes(bv.id) && valorSesion(bv, principal, extras) > 0)
    .map((bv) => ({ bono: bv, restantes: saldoBono(bv, usos).restantes - 0, valor: valorSesion(bv, principal, extras) }))
    .sort((a, b) => (a.bono.caduca || "9999") .localeCompare(b.bono.caduca || "9999") || a.bono.fechaVenta.localeCompare(b.bono.fechaVenta));
}

// Valida una venta sin cita y prepara TODO lo que hay que guardar
export function planDeVenta({ clienteId, clienteNombre, lineasProductos = [], lineasBonos = [], productos, plantillas, pagos = [], aPlazos = false, fecha, usuarioId, uid }) {
  const prods = lineasProductos.filter((l) => l.productoId && Number(l.cantidad) > 0);
  const bons = lineasBonos.filter((l) => l.plantillaId && Number(l.cantidad) > 0);
  if (!prods.length && !bons.length) return { error: "Añade al menos un producto o un bono." };
  if (bons.length && !clienteId) return { error: "Para vender un bono hay que elegir el cliente." };

  const lProd = [];
  const stock = [];
  for (const l of prods) {
    const p = productos.find((x) => x.id === l.productoId);
    if (!p) return { error: "Un producto de la venta ya no existe." };
    if (Number(l.cantidad) > p.stock) return { error: `No hay stock suficiente de «${p.nombre}» (quedan ${p.stock}).` };
    lProd.push({ productoId: p.id, nombre: p.nombre, cantidad: Number(l.cantidad), precio: p.precio });
    stock.push({ productoId: p.id, nuevoStock: p.stock - Number(l.cantidad) });
  }
  const lBon = [];
  const bonosVendidos = [];
  for (const l of bons) {
    const t = plantillas.find((x) => x.id === l.plantillaId);
    if (!t || !t.activo) return { error: "Un bono de la venta ya no está disponible." };
    lBon.push({ plantillaId: t.id, nombre: t.nombre, cantidad: Number(l.cantidad), precio: t.precio });
    for (let i = 0; i < Number(l.cantidad); i++) {
      bonosVendidos.push({
        id: uid(), plantillaId: t.id, clienteId, nombre: t.nombre, servicioIds: serviciosDe(t), servicioId: serviciosDe(t)[0] || "", sesionesTotal: t.sesiones, precio: t.precio,
        fechaVenta: fecha, caduca: t.caducidadDias ? fechaMasDias(fecha, t.caducidadDias) : null, estado: "activo", vendidoPor: usuarioId,
      });
    }
  }
  const total = redondear(lProd.reduce((s, l) => s + l.precio * l.cantidad, 0) + lBon.reduce((s, l) => s + l.precio * l.cantidad, 0));
  // cada pago lleva su fecha: el dinero cuenta el día en que se cobra (importa si se paga a plazos)
  const lineasPago = pagos.filter((p) => p.metodoId && Number(p.importe) > 0).map((p) => ({ metodoId: p.metodoId, importe: redondear(p.importe), fecha }));
  if (lineasPago.some((p) => p.metodoId === METODO_BONO)) return { error: "Un bono no se puede pagar con otro bono." };
  const pagado = redondear(lineasPago.reduce((s, p) => s + p.importe, 0));
  if (aPlazos) {
    // Pago a plazos: solo bonos; el bono queda activo desde el primer pago y el resto se cobra después
    if (lProd.length) return { error: "El pago a plazos solo está disponible para ventas de bonos (sin productos)." };
    if (pagado <= 0) return { error: "Indica cuánto se cobra ahora (el primer pago)." };
    if (pagado - total > 0.01) return { error: `Sobran ${redondear(pagado - total).toFixed(2)} € en el pago.` };
  } else if (Math.abs(pagado - total) > 0.01) {
    return { error: pagado < total ? `Faltan ${redondear(total - pagado).toFixed(2)} € por cobrar.` : `Sobran ${redondear(pagado - total).toFixed(2)} € en el pago.` };
  }

  const ventaId = uid();
  return {
    venta: { id: ventaId, fecha, clienteId: clienteId || "", clienteNombre: clienteNombre || "", productos: lProd, bonos: lBon, pagos: lineasPago, total, anulada: false, creadoPor: usuarioId },
    bonosVendidos: bonosVendidos.map((b) => ({ ...b, ventaId })),
    stock,
    total,
  };
}

// Ventas de bonos de un cliente que aún no están pagadas del todo (la más antigua primero)
export const deudasDeCliente = (ventas, clienteId) =>
  clienteId
    ? ventas
        .filter((v) => v.clienteId === clienteId && !v.anulada)
        .map((v) => ({ venta: v, deuda: pendienteVenta(v) }))
        .filter((x) => x.deuda > 0.005)
        .sort((a, b) => a.venta.fecha.localeCompare(b.venta.fecha))
    : [];

// Ventas sin cita dentro de un rango (no anuladas)
export const ventasEnRango = (ventas, desde, hasta) => ventas.filter((v) => !v.anulada && v.fecha >= desde && v.fecha <= hasta);

// ---------------------------------------------------------------------------
// Pagos a plazos: cada línea de pago de una venta lleva su fecha (por defecto, la de la venta)
// ---------------------------------------------------------------------------
export const fechaDePago = (p, venta) => p.fecha || venta.fecha;
export function importePagado(v) {
  return redondear((v.pagos || []).reduce((s, p) => s + (Number(p.importe) || 0), 0));
}
export function pendienteVenta(v) {
  return v.anulada ? 0 : Math.max(0, redondear(v.total - importePagado(v)));
}

// Todos los cobros (líneas de pago) de ventas no anuladas con fecha dentro del rango
export function lineasPagoEnRango(ventas, desde, hasta) {
  const out = [];
  ventas.filter((v) => !v.anulada).forEach((v) => (v.pagos || []).forEach((p) => {
    const fecha = fechaDePago(p, v);
    if (fecha >= desde && fecha <= hasta) out.push({ venta: v, linea: p, fecha });
  }));
  return out;
}

// Registrar un plazo (nuevo cobro) sobre una venta con importe pendiente
export function planDePlazo({ venta, pagos, fecha }) {
  if (venta.anulada) return { error: "Esta venta está anulada." };
  const pendiente = pendienteVenta(venta);
  if (pendiente <= 0.005) return { error: "Esta venta ya está pagada del todo." };
  const nuevas = pagos.filter((p) => p.metodoId && Number(p.importe) > 0).map((p) => ({ metodoId: p.metodoId, importe: redondear(p.importe), fecha }));
  if (!nuevas.length) return { error: "Indica el importe que se cobra." };
  if (nuevas.some((p) => p.metodoId === METODO_BONO)) return { error: "Un bono no se puede pagar con otro bono." };
  const suma = redondear(nuevas.reduce((s, p) => s + p.importe, 0));
  if (suma - pendiente > 0.01) return { error: `Solo quedan ${pendiente.toFixed(2)} € por cobrar.` };
  const todos = [...(venta.pagos || []), ...nuevas];
  return { pagos: todos, cobrado: suma, pendienteTras: redondear(pendiente - suma) };
}
