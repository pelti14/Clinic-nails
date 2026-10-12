import { supabase } from "./pasarela";
import { serviciosDe } from "./bonos";

// ---------------------------------------------------------------------------
// Mapeo DB (snake_case) <-> app (camelCase donde aplica)
// ---------------------------------------------------------------------------

const mapEmpleada = (r) => ({
  id: r.id,
  objetivoExtraSemanal: Number(r.objetivo_extra_semanal) || 0,
  objetivoTicketMedio: Number(r.objetivo_ticket_medio) || 0,
  nombre: r.nombre,
  telefono: r.telefono || "",
  activa: r.activa,
  color: r.color || "#B4863C",
  horario: r.horario || {},
  diasLibres: r.dias_libres || [],
  servicios: r.servicios || [],
  codigo: "", // el código ya no sale del servidor (se guarda cifrado)
  tieneCodigo: Boolean(r.tiene_codigo),
  rol: r.rol || "empleada",
  permisos: r.permisos || {},
  fotoUrl: r.foto_url || "",
  horarioTipo: r.horario_tipo || "fijo",
  turnos: r.turnos || [],
  turnoInicio: r.turno_inicio || "",
  ausencias: r.ausencias || [],
  excepciones: r.excepciones || [],
  ghlCalendarId: r.ghl_calendar_id || "",
});

const empleadaToRow = (e) => ({
  id: e.id,
  nombre: e.nombre,
  telefono: e.telefono,
  activa: e.activa,
  color: e.color,
  horario: e.horario,
  dias_libres: e.diasLibres,
  servicios: e.servicios,
  rol: e.rol,
  permisos: e.permisos,
  foto_url: e.fotoUrl || null,
  horario_tipo: e.horarioTipo || "fijo",
  turnos: e.turnos || [],
  turno_inicio: e.turnoInicio || null,
  ausencias: e.ausencias || [],
  excepciones: e.excepciones || [],
  ghl_calendar_id: e.ghlCalendarId || null,
  // solo se envía si se ha escrito un código nuevo; el servidor lo cifra
  ...(e.codigoNuevo ? { codigo: e.codigoNuevo } : {}),
});

const mapCabina = (r) => ({ id: r.id, nombre: r.nombre, activa: r.activa });
const cabinaToRow = (c) => ({ id: c.id, nombre: c.nombre, activa: c.activa });

const mapServicio = (r) => ({
  id: r.id,
  nombre: r.nombre,
  precio: r.precio,
  duracion: r.duracion,
  categoria: r.categoria || "",
  empleadas: r.empleadas || [],
  cabina: r.cabina || "cualquiera",
  activo: r.activo,
  color: r.color || "#B4863C",
  descripcion: r.descripcion || "",
  orden: r.orden ?? 0,
  reservableOnline: r.reservable_online !== false, // ¿lo ven las clientas en la reserva online?
  recomendadoOnline: r.recomendado_online === true, // ¿sale en «Recomendados» de la reserva online?
});

const servicioToRow = (s, conDescripcion = true) => ({
  id: s.id,
  nombre: s.nombre,
  precio: s.precio,
  duracion: s.duracion,
  categoria: s.categoria,
  empleadas: s.empleadas,
  cabina: s.cabina,
  activo: s.activo,
  color: s.color || "#B4863C",
  ...(conDescripcion ? { descripcion: s.descripcion || "", orden: s.orden ?? 0, reservable_online: s.reservableOnline !== false, recomendado_online: s.reservableOnline !== false && s.recomendadoOnline === true } : {}),
});
// Si aún no se ha pegado el esquema nuevo (columnas «descripcion» y «orden»), el servicio se guarda igualmente, sin ellas
const faltaDescripcion = (error) => Boolean(error && /descripcion|orden|reservable_online|recomendado_online/.test(error.message || ""));

const mapCliente = (r) => ({
  id: r.id,
  nombre: r.nombre,
  telefono: r.telefono,
  email: r.email || "",
  favorito: r.favorito || false,
  ghlContactId: r.ghl_contact_id || "",
  notaFija: r.nota_fija || "",
  creadoEn: r.created_at || null,
});

const clienteToRow = (c) => ({
  id: c.id,
  nombre: c.nombre,
  telefono: c.telefono,
  email: c.email || null,
  favorito: c.favorito || false,
  ...(c.notaFija !== undefined ? { nota_fija: c.notaFija || null } : {}),
});

const mapCita = (r) => ({
  id: r.id,
  fecha: r.fecha,
  empleadaId: r.empleada_id,
  servicioId: r.servicio_id,
  cabinaId: r.cabina_id,
  clienteId: r.cliente_id,
  clienta: r.clienta,
  inicio: r.inicio,
  duracion: r.duracion,
  creadoPor: r.creado_por,
  modificadoPor: r.modificado_por,
  precioManual: r.precio_manual,
  serviciosExtra: r.servicios_extra || [],
  pagos: r.pagos || [],
  productos: r.productos || [],
  estadoCobro: r.estado_cobro || "pendiente",
  cobradaEn: r.cobrada_en,
  cobradaPor: r.cobrada_por,
  creadoEn: r.created_at,
  ghlEventId: r.ghl_event_id || "",
  ghlCalendarId: r.ghl_calendar_id || "",
  notas: r.notas || "",
  asistencia: r.asistencia || "prevista",
  origen: r.origen || "",
  confirmacion: r.confirmacion || "pendiente",
  confirmacionPor: r.confirmacion_por || "",
  confirmacionEn: r.confirmacion_en || null,
});

const citaToRow = (c) => ({
  id: c.id,
  fecha: c.fecha,
  empleada_id: c.empleadaId,
  servicio_id: c.servicioId,
  cabina_id: c.cabinaId,
  cliente_id: c.clienteId || null,
  clienta: c.clienta,
  inicio: c.inicio,
  duracion: c.duracion,
  creado_por: c.creadoPor || null,
  modificado_por: c.modificadoPor || null,
  precio_manual: c.precioManual != null ? c.precioManual : null,
  servicios_extra: c.serviciosExtra || [],
  pagos: c.pagos || [],
  productos: c.productos || [],
  estado_cobro: c.estadoCobro || "pendiente",
  cobrada_en: c.cobradaEn || null,
  cobrada_por: c.cobradaPor || null,
  updated_at: new Date().toISOString(),
  ...(c.notas !== undefined ? { notas: c.notas || null } : {}),
  ...(c.asistencia !== undefined ? { asistencia: c.asistencia || "prevista" } : {}),
  // al cambiar de día, hora o empleada la confirmación ya no vale: vuelve a «pendiente»
  ...(c.reiniciarConfirmacion ? { confirmacion: "pendiente", confirmacion_por: null, confirmacion_en: null } : {}),
});

// Las horas de fichaje son minutos con decimales (los segundos van en entrada_s / salida_s; si no están, valen los minutos de siempre)
const mapFichaje = (r) => ({
  id: r.id,
  empleadaId: r.empleada_id,
  fecha: r.fecha,
  entrada: r.entrada_s != null ? r.entrada_s / 60 : r.entrada,
  salida: r.salida_s != null ? r.salida_s / 60 : r.salida,
});

const fichajeToRow = (f, conSegundos = true) => ({
  id: f.id,
  empleada_id: f.empleadaId,
  fecha: f.fecha,
  entrada: Math.floor(f.entrada),
  salida: Math.floor(f.salida),
  ...(conSegundos ? { entrada_s: Math.round(f.entrada * 60), salida_s: Math.round(f.salida * 60) } : {}),
});
// Si el esquema nuevo (columnas de segundos) aún no está pegado, se guarda igualmente con precisión de minutos
const faltaColumnaSegundos = (error) => Boolean(error && /_s\b|entrada_s|salida_s|hora_entrada_s|descanso_desde_s/.test(error.message || ""));

// ---------------------------------------------------------------------------
// Empleadas
// ---------------------------------------------------------------------------

export async function fetchEmpleadas() {
  const { data, error } = await supabase.from("empleadas").select("*").order("created_at");
  if (error) throw error;
  return (data || []).map(mapEmpleada);
}

export async function insertEmpleada(empleada) {
  const { error } = await supabase.from("empleadas").insert(empleadaToRow(empleada));
  if (error) throw error;
}

export async function updateEmpleada(empleada) {
  const { error } = await supabase.from("empleadas").update(empleadaToRow(empleada)).eq("id", empleada.id);
  if (error) throw error;
}

export async function deleteEmpleada(id) {
  const { error } = await supabase.from("empleadas").delete().eq("id", id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Cabinas
// ---------------------------------------------------------------------------

export async function fetchCabinas() {
  const { data, error } = await supabase.from("cabinas").select("*").order("created_at");
  if (error) throw error;
  return (data || []).map(mapCabina);
}

export async function insertCabina(cabina) {
  const { error } = await supabase.from("cabinas").insert(cabinaToRow(cabina));
  if (error) throw error;
}

export async function updateCabina(cabina) {
  const { error } = await supabase.from("cabinas").update(cabinaToRow(cabina)).eq("id", cabina.id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Servicios
// ---------------------------------------------------------------------------

export async function fetchServicios() {
  const { data, error } = await supabase.from("servicios").select("*").order("created_at");
  if (error) throw error;
  return (data || []).map(mapServicio);
}

export async function insertServicio(servicio) {
  let { error } = await supabase.from("servicios").insert(servicioToRow(servicio));
  if (faltaDescripcion(error)) ({ error } = await supabase.from("servicios").insert(servicioToRow(servicio, false)));
  if (error) throw error;
}

export async function updateServicio(servicio) {
  let { error } = await supabase.from("servicios").update(servicioToRow(servicio)).eq("id", servicio.id);
  if (faltaDescripcion(error)) ({ error } = await supabase.from("servicios").update(servicioToRow(servicio, false)).eq("id", servicio.id));
  if (error) throw error;
}

export async function deleteServicio(id) {
  const { error } = await supabase.from("servicios").delete().eq("id", id);
  if (error) throw error;
}

// Importación en bloque: los nuevos se insertan de golpe y los reemplazos se actualizan de golpe (solo los datos que trae
// el archivo; sus empleadas, cabina y color no se tocan porque no van en la fila).
export async function importarServicios({ nuevos = [], reemplazos = [], categorias = [] }) {
  if (nuevos.length) {
    let { error } = await supabase.from("servicios").insert(nuevos.map((s) => servicioToRow(s)));
    if (faltaDescripcion(error)) ({ error } = await supabase.from("servicios").insert(nuevos.map((s) => servicioToRow(s, false))));
    if (error) throw error;
  }
  if (categorias.length) {
    const { error } = await supabase.from("categorias_servicios").upsert(categorias.map((c) => ({ id: c.id, nombre: c.nombre, descripcion: c.descripcion || "", orden: c.orden ?? 0 })), { onConflict: "id" });
    if (error && !/categorias_servicios/.test(error.message || "")) throw error; // si aún no existe la tabla de categorías, se importa igualmente
  }
  if (reemplazos.length) {
    // filas completas (la ficha del servicio con los datos del archivo ya puestos): ver upsertServiciosCompletos
    await upsertServiciosCompletos(reemplazos);
  }
}

// ---------------------------------------------------------------------------
// Clientes
// ---------------------------------------------------------------------------

export async function fetchClientes() {
  const { data, error } = await supabase.from("clientes").select("*").order("nombre");
  if (error) throw error;
  return (data || []).map(mapCliente);
}

export async function insertCliente(cliente) {
  const { error } = await supabase.from("clientes").insert(clienteToRow(cliente));
  if (error) throw error;
}

export async function updateCliente(cliente) {
  const { error } = await supabase.from("clientes").update(clienteToRow(cliente)).eq("id", cliente.id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Citas
// ---------------------------------------------------------------------------

export async function fetchCitas() {
  const { data, error } = await supabase.from("citas").select("*").order("inicio");
  if (error) throw error;
  return (data || []).map(mapCita);
}

export async function insertCita(cita) {
  const { error } = await supabase.from("citas").insert(citaToRow(cita));
  if (error) throw error;
}

export async function updateCita(cita) {
  let { error } = await supabase.from("citas").update(citaToRow(cita)).eq("id", cita.id);
  // sin la columna nueva (falta pegar el esquema) el cambio se guarda igualmente, sin reiniciar la confirmación
  if (error && cita.reiniciarConfirmacion && /confirmacion/.test(error.message || "")) ({ error } = await supabase.from("citas").update(citaToRow({ ...cita, reiniciarConfirmacion: false })).eq("id", cita.id));
  if (error) throw error;
}

// Anota si una clienta confirma su cita (✋), no cogió la llamada o vuelve a pendiente. `por`: quién lo anota.
export async function marcarConfirmacion(citaId, estado, por) {
  const pendiente = estado === "pendiente";
  const { error } = await supabase.from("citas").update({ confirmacion: estado, confirmacion_por: pendiente ? null : por || null, confirmacion_en: pendiente ? null : new Date().toISOString() }).eq("id", citaId);
  if (error) throw new Error(/confirmacion/.test(error.message || "") ? `${error.message}. ¿Has pegado el esquema nuevo en Supabase?` : error.message);
}

export async function deleteCita(id) {
  const { error } = await supabase.from("citas").delete().eq("id", id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Fichajes (histórico) + fichajes activos (turno en curso)
// ---------------------------------------------------------------------------

export async function fetchFichajes() {
  const { data, error } = await supabase.from("fichajes").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapFichaje);
}

export async function insertFichaje(fichaje) {
  let { error } = await supabase.from("fichajes").insert(fichajeToRow(fichaje));
  if (faltaColumnaSegundos(error)) ({ error } = await supabase.from("fichajes").insert(fichajeToRow(fichaje, false)));
  if (error) throw error;
}

export async function updateFichaje(fichaje) {
  let { error } = await supabase.from("fichajes").update(fichajeToRow(fichaje)).eq("id", fichaje.id);
  if (faltaColumnaSegundos(error)) ({ error } = await supabase.from("fichajes").update(fichajeToRow(fichaje, false)).eq("id", fichaje.id));
  if (error) throw error;
}

export async function deleteFichaje(id) {
  const { error } = await supabase.from("fichajes").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchFichajesActivos() {
  const { data, error } = await supabase.from("fichajes_activos").select("*");
  if (error) throw error;
  const activos = {};
  const descansos = {};
  (data || []).forEach((r) => {
    const entrada = r.hora_entrada_s != null ? r.hora_entrada_s / 60 : r.hora_entrada;
    activos[r.empleada_id] = entrada;
    if (r.en_descanso) descansos[r.empleada_id] = r.descanso_desde_s != null ? r.descanso_desde_s / 60 : r.descanso_desde ?? entrada;
  });
  return { activos, descansos };
}

// `extra` solo se envía al iniciar/terminar un descanso (así, la entrada normal no depende de las columnas nuevas)
export async function setFichajeActivo(empleadaId, horaEntrada, extra) {
  const fila = (conSegundos) => ({
    empleada_id: empleadaId,
    hora_entrada: Math.floor(horaEntrada),
    ...(conSegundos ? { hora_entrada_s: Math.round(horaEntrada * 60) } : {}),
    ...(extra
      ? {
          en_descanso: Boolean(extra.enDescanso),
          descanso_desde: extra.enDescanso ? Math.floor(extra.descansoDesde) : null,
          ...(conSegundos ? { descanso_desde_s: extra.enDescanso ? Math.round(extra.descansoDesde * 60) : null } : {}),
        }
      : {}),
  });
  let { error } = await supabase.from("fichajes_activos").upsert(fila(true));
  if (faltaColumnaSegundos(error)) ({ error } = await supabase.from("fichajes_activos").upsert(fila(false)));
  if (error) throw error;
}

export async function clearFichajeActivo(empleadaId) {
  const { error } = await supabase.from("fichajes_activos").delete().eq("empleada_id", empleadaId);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Productos (venta en tienda / durante el cobro de una cita)
// ---------------------------------------------------------------------------

const mapProducto = (r) => ({ id: r.id, nombre: r.nombre, precio: r.precio, stock: r.stock, activo: r.activo });
const productoToRow = (p) => ({ id: p.id, nombre: p.nombre, precio: p.precio, stock: p.stock, activo: p.activo });

export async function fetchProductos() {
  const { data, error } = await supabase.from("productos").select("*").order("created_at");
  if (error) throw error;
  return (data || []).map(mapProducto);
}

export async function insertProducto(producto) {
  const { error } = await supabase.from("productos").insert(productoToRow(producto));
  if (error) throw error;
}

export async function updateProducto(producto) {
  const { error } = await supabase.from("productos").update(productoToRow(producto)).eq("id", producto.id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Foto de empleada (Supabase Storage, bucket "avatars")
// ---------------------------------------------------------------------------

export async function subirFotoEmpleada(empleadaId, file) {
  const form = new FormData();
  form.append("archivo", file);
  form.append("empleadaId", empleadaId);
  const res = await fetch("/api/subir-foto", { method: "POST", body: form, credentials: "same-origin" });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) throw new Error(json.error || "No se pudo subir la foto.");
  return json.url;
}

// ---------------------------------------------------------------------------
// Métodos de pago
// ---------------------------------------------------------------------------

const mapMetodoPago = (r) => ({ id: r.id, nombre: r.nombre, activo: r.activo });
const metodoPagoToRow = (m) => ({ id: m.id, nombre: m.nombre, activo: m.activo });

export async function fetchMetodosPago() {
  const { data, error } = await supabase.from("metodos_pago").select("*").order("created_at");
  if (error) throw error;
  return (data || []).map(mapMetodoPago);
}

export async function insertMetodoPago(metodo) {
  const { error } = await supabase.from("metodos_pago").insert(metodoPagoToRow(metodo));
  if (error) throw error;
}

export async function updateMetodoPago(metodo) {
  const { error } = await supabase.from("metodos_pago").update(metodoPagoToRow(metodo)).eq("id", metodo.id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Actualización automática: cada X segundos (y al volver a la pestaña) se vuelven a
// pedir los datos al servidor, así lo que entra desde otro dispositivo o desde GHL
// aparece solo. Las tablas que casi no cambian se piden con menos frecuencia.
// ---------------------------------------------------------------------------

const TABLAS_LENTAS = ["empleadas", "cabinas", "servicios", "productos", "metodos_pago"];
let intervaloSegundos = 20;
let reloj = null;
let vuelta = 0;
const suscriptores = new Map(); // tabla -> Set(callback)

function lanzar(tabla) {
  (suscriptores.get(tabla) || new Set()).forEach((cb) => {
    try {
      Promise.resolve(cb()).catch(() => {});
    } catch (e) {
      // un fallo puntual no debe parar el reloj
    }
  });
}

function latido(forzar) {
  if (typeof document !== "undefined" && document.visibilityState === "hidden" && !forzar) return;
  vuelta += 1;
  suscriptores.forEach((_, tabla) => {
    if (TABLAS_LENTAS.includes(tabla) && vuelta % 3 !== 0 && !forzar) return;
    lanzar(tabla);
  });
}

function reiniciarReloj() {
  if (reloj) clearInterval(reloj);
  reloj = suscriptores.size ? setInterval(() => latido(false), Math.max(5, intervaloSegundos) * 1000) : null;
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && suscriptores.size) latido(true);
  });
}

export function setIntervaloActualizacion(segundos) {
  const n = Number(segundos);
  if (!Number.isFinite(n) || n < 5) return;
  intervaloSegundos = n;
  reiniciarReloj();
}

export function subscribeToTable(table, onChange) {
  if (!suscriptores.has(table)) suscriptores.set(table, new Set());
  suscriptores.get(table).add(onChange);
  if (!reloj) reiniciarReloj();
  return () => {
    const set = suscriptores.get(table);
    if (set) {
      set.delete(onChange);
      if (!set.size) suscriptores.delete(table);
    }
    if (!suscriptores.size && reloj) {
      clearInterval(reloj);
      reloj = null;
    }
  };
}

// ---------------------------------------------------------------------------
// Nota fija de un cliente (se actualiza sola, sin tocar el resto de sus datos)
export async function deleteCliente(id) {
  const { error } = await supabase.from("clientes").delete().eq("id", id);
  if (error) throw error;
}

// Alta de muchos clientes de golpe (importación). Se envían por tandas para no saturar.
export async function insertClientes(lista) {
  for (let i = 0; i < lista.length; i += 200) {
    const { error } = await supabase.from("clientes").insert(lista.slice(i, i + 200).map(clienteToRow));
    if (error) throw error;
  }
}

// ---------------------------------------------------------------------------
// Horarios no disponibles (bloqueos)
// ---------------------------------------------------------------------------

const mapBloqueo = (r) => ({
  id: r.id,
  fecha: r.fecha,
  empleadaId: r.empleada_id,
  inicio: r.inicio,
  duracion: r.duracion,
  motivo: r.motivo || "",
  creadoPor: r.creado_por || null,
  ghlEventId: r.ghl_event_id || "",
});

const bloqueoToRow = (b) => ({
  id: b.id,
  fecha: b.fecha,
  empleada_id: b.empleadaId,
  inicio: b.inicio,
  duracion: b.duracion,
  motivo: b.motivo || null,
  creado_por: b.creadoPor || null,
});

export async function fetchBloqueos() {
  const { data, error } = await supabase.from("bloqueos").select("*").order("fecha");
  if (error) throw error;
  return (data || []).map(mapBloqueo);
}

export async function insertBloqueo(b) {
  const { error } = await supabase.from("bloqueos").insert(bloqueoToRow(b));
  if (error) throw error;
}

export async function updateBloqueo(b) {
  const { error } = await supabase.from("bloqueos").update(bloqueoToRow(b)).eq("id", b.id);
  if (error) throw error;
}

export async function deleteBloqueo(id) {
  const { error } = await supabase.from("bloqueos").delete().eq("id", id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
export async function updateNotaFijaCliente(id, texto) {
  const { error } = await supabase.from("clientes").update({ nota_fija: (texto || "").trim() || null }).eq("id", id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Ajustes de la app (colores, etiquetas de marketing, datos de GHL...)
// ---------------------------------------------------------------------------
export async function fetchAjustes() {
  const { data, error } = await supabase.from("ajustes").select("clave, valor");
  if (error) throw error;
  const out = {};
  (data || []).forEach((r) => {
    out[r.clave] = r.valor;
  });
  return out;
}

export async function saveAjuste(clave, valor) {
  const { error } = await supabase.from("ajustes").upsert({ clave, valor, updated_at: new Date().toISOString() });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Bonos, bonos vendidos, usos de sesiones y ventas sin cita
// ---------------------------------------------------------------------------

// Varios servicios: `servicio_ids` (si el esquema nuevo está pegado); un solo servicio sigue usando `servicio_id`
const idsServicios = (r) => (Array.isArray(r.servicio_ids) && r.servicio_ids.length ? r.servicio_ids : r.servicio_id ? [r.servicio_id] : []);
const filaServicios = (b) => {
  const ids = serviciosDe(b);
  const incluir = ids.length > 1 || b.tieneServicioIds; // solo se toca la columna nueva si hace falta (así un bono de un servicio no depende del esquema nuevo)
  return { servicio_id: ids[0] || null, ...(incluir ? { servicio_ids: ids.length > 1 ? ids : [] } : {}) };
};

const mapBono = (r) => ({
  id: r.id,
  nombre: r.nombre || "",
  servicioIds: idsServicios(r),
  servicioId: idsServicios(r)[0] || "",
  tieneServicioIds: Array.isArray(r.servicio_ids) && r.servicio_ids.length > 0,
  sesiones: r.sesiones,
  precio: Number(r.precio) || 0,
  caducidadDias: r.caducidad_dias ?? null,
  activo: r.activo !== false,
});
const bonoToRow = (b) => ({
  id: b.id,
  nombre: b.nombre,
  ...filaServicios(b),
  sesiones: b.sesiones,
  precio: b.precio,
  caducidad_dias: b.caducidadDias || null,
  activo: b.activo !== false,
});

export async function fetchBonos() {
  const { data, error } = await supabase.from("bonos").select("*").order("created_at");
  if (error) throw error;
  return (data || []).map(mapBono);
}
export async function insertBono(b) {
  const { error } = await supabase.from("bonos").insert(bonoToRow(b));
  if (error) throw error;
}
export async function updateBono(b) {
  const { error } = await supabase.from("bonos").update(bonoToRow(b)).eq("id", b.id);
  if (error) throw error;
}

const mapBonoVendido = (r) => ({
  id: r.id,
  ventaId: r.venta_id || "",
  plantillaId: r.plantilla_id || "",
  clienteId: r.cliente_id || "",
  nombre: r.nombre || "",
  servicioIds: idsServicios(r),
  servicioId: idsServicios(r)[0] || "",
  tieneServicioIds: Array.isArray(r.servicio_ids) && r.servicio_ids.length > 0,
  sesionesTotal: r.sesiones_total,
  precio: Number(r.precio) || 0,
  fechaVenta: r.fecha_venta,
  caduca: r.caduca || null,
  vendidoPor: r.vendido_por || null,
  estado: r.estado || "activo",
});
const bonoVendidoToRow = (b) => ({
  id: b.id,
  venta_id: b.ventaId || null,
  plantilla_id: b.plantillaId || null,
  cliente_id: b.clienteId || null,
  nombre: b.nombre,
  ...filaServicios(b),
  sesiones_total: b.sesionesTotal,
  precio: b.precio,
  fecha_venta: b.fechaVenta,
  caduca: b.caduca || null,
  estado: b.estado || "activo",
  ...(b.vendidoPor ? { vendido_por: b.vendidoPor } : {}), // al editar un bono ya vendido no se pierde quién lo vendió
});

export async function fetchBonosVendidos() {
  const { data, error } = await supabase.from("bonos_vendidos").select("*").order("fecha_venta");
  if (error) throw error;
  return (data || []).map(mapBonoVendido);
}
export async function insertBonosVendidos(lista) {
  const { error } = await supabase.from("bonos_vendidos").insert(lista.map(bonoVendidoToRow));
  if (error) throw error;
}
export async function updateBonoVendido(b) {
  const { error } = await supabase.from("bonos_vendidos").update(bonoVendidoToRow(b)).eq("id", b.id);
  if (error) throw error;
}

const mapUso = (r) => ({ id: r.id, bonoVendidoId: r.bono_vendido_id, citaId: r.cita_id || "", fecha: r.fecha, creadoPor: r.creado_por || null });
export async function fetchBonoUsos() {
  const { data, error } = await supabase.from("bono_usos").select("*").order("fecha");
  if (error) throw error;
  return (data || []).map(mapUso);
}
export async function insertBonoUso(u) {
  const { error } = await supabase.from("bono_usos").insert({ id: u.id, bono_vendido_id: u.bonoVendidoId, cita_id: u.citaId || null, fecha: u.fecha, creado_por: u.creadoPor || null });
  if (error) throw error;
}
export async function deleteBonoUsosDeCita(citaId) {
  const { error } = await supabase.from("bono_usos").delete().eq("cita_id", citaId);
  if (error) throw error;
}

const mapVenta = (r) => ({
  id: r.id,
  fecha: r.fecha,
  clienteId: r.cliente_id || "",
  clienteNombre: r.cliente_nombre || "",
  productos: r.productos || [],
  bonos: r.bonos || [],
  pagos: r.pagos || [],
  total: Number(r.total) || 0,
  anulada: Boolean(r.anulada),
  creadoPor: r.creado_por || null,
});
const ventaToRow = (v) => ({
  id: v.id,
  fecha: v.fecha,
  cliente_id: v.clienteId || null,
  cliente_nombre: v.clienteNombre || null,
  productos: v.productos || [],
  bonos: v.bonos || [],
  pagos: v.pagos || [],
  total: v.total,
  anulada: Boolean(v.anulada),
  creado_por: v.creadoPor || null,
});
export async function fetchVentas() {
  const { data, error } = await supabase.from("ventas").select("*").order("fecha");
  if (error) throw error;
  return (data || []).map(mapVenta);
}
export async function insertVenta(v) {
  const { error } = await supabase.from("ventas").insert(ventaToRow(v));
  if (error) throw error;
}
export async function updateVenta(v) {
  const { error } = await supabase.from("ventas").update(ventaToRow(v)).eq("id", v.id);
  if (error) throw error;
}


// ---------------------------------------------------------------------------
// Registro de actividad (solo lo lee el administrador; lo escribe el servidor)
// ---------------------------------------------------------------------------
const mapActividad = (r) => ({
  id: r.id,
  creadoEn: r.created_at,
  usuarioId: r.usuario_id || null,
  usuarioNombre: r.usuario_nombre || "—",
  origen: r.origen || "app",
  entidad: r.entidad || "",
  entidadId: r.entidad_id || "",
  clienteId: r.cliente_id || "",
  accion: r.accion || "",
  resumen: r.resumen || "",
  detalle: r.detalle || {},
});

// filtros: [["entidad","cita"],["entidad_id", id]] o [["cliente_id", id]] (máx. 3)
export async function fetchActividad({ filtros = [], limite = 300, antes } = {}) {
  let q = supabase.from("actividad").select("*");
  filtros.forEach(([c, v]) => {
    q = q.eq(c, v);
  });
  q = q.order("created_at", { ascending: false }).limit(limite);
  if (antes) q = q.lt("created_at", antes);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(mapActividad);
}

// ---------------------------------------------------------------------------
// Categorías de servicios (nombre, descripción y orden) y posición de los servicios
// ---------------------------------------------------------------------------
const mapCategoriaServicio = (r) => ({ id: r.id, nombre: r.nombre || "", descripcion: r.descripcion || "", orden: r.orden ?? 0 });

export async function fetchCategoriasServicios() {
  const { data, error } = await supabase.from("categorias_servicios").select("*").order("orden");
  if (error) throw error;
  return (data || []).map(mapCategoriaServicio);
}

// Crea o actualiza categorías (todas con las mismas columnas)
export async function upsertCategoriasServicios(categorias) {
  if (!categorias.length) return;
  const { error } = await supabase.from("categorias_servicios").upsert(
    categorias.map((c) => ({ id: c.id, nombre: c.nombre, descripcion: c.descripcion || "", orden: c.orden ?? 0 })),
    { onConflict: "id" }
  );
  if (error) throw error;
}

export async function deleteCategoriaServicio(id) {
  const { error } = await supabase.from("categorias_servicios").delete().eq("id", id);
  if (error) throw error;
}




// ---------------------------------------------------------------------------
// Productos: borrar e importar en bloque
// ---------------------------------------------------------------------------
export async function deleteProducto(id) {
  const { error } = await supabase.from("productos").delete().eq("id", id);
  if (error) throw error;
}

// Los nuevos se insertan de golpe y los reemplazos se actualizan de golpe (con las mismas columnas)
export async function importarProductos({ nuevos = [], reemplazos = [] }) {
  if (nuevos.length) {
    const { error } = await supabase.from("productos").insert(nuevos.map(productoToRow));
    if (error) throw error;
  }
  if (reemplazos.length) {
    const { error } = await supabase.from("productos").upsert(reemplazos.map((r) => ({ id: r.id, nombre: r.nombre, precio: r.precio, stock: r.stock, activo: r.activo })), { onConflict: "id" });
    if (error) throw error;
  }
}

// ---------------------------------------------------------------------------
// Cursos de ventas: clases, resultados de los tests y objetivo semanal de cada empleada
// ---------------------------------------------------------------------------
const mapLeccion = (r) => ({ id: r.id, titulo: r.titulo || "", contenido: r.contenido || "", tipo: r.tipo || "base", orden: r.orden ?? 0, activa: r.activa !== false, obligatorioSemanal: Boolean(r.obligatorio_semanal), minimoAprobado: r.minimo_aprobado ?? 70, preguntas: r.preguntas || [] });
const leccionToRow = (l) => ({ id: l.id, titulo: l.titulo, contenido: l.contenido || "", tipo: l.tipo || "base", orden: l.orden ?? 0, activa: l.activa !== false, obligatorio_semanal: Boolean(l.obligatorioSemanal), minimo_aprobado: l.minimoAprobado ?? 70, preguntas: l.preguntas || [] });
const mapResultado = (r) => ({ id: r.id, empleadaId: r.empleada_id, leccionId: r.leccion_id, semana: r.semana, puntuacion: r.puntuacion ?? 0, aciertos: r.aciertos ?? 0, total: r.total ?? 0, aprobado: Boolean(r.aprobado), creadoEn: r.created_at });

export async function fetchLecciones() {
  const { data, error } = await supabase.from("lecciones").select("*").order("orden");
  if (error) throw error;
  return (data || []).map(mapLeccion);
}
export async function insertLeccion(l) {
  const { error } = await supabase.from("lecciones").insert(leccionToRow(l));
  if (error) throw error;
}
export async function updateLeccion(l) {
  const { error } = await supabase.from("lecciones").update(leccionToRow(l)).eq("id", l.id);
  if (error) throw error;
}
export async function deleteLeccion(id) {
  const { error } = await supabase.from("lecciones").delete().eq("id", id);
  if (error) throw error;
}
export async function fetchResultadosCursos() {
  const { data, error } = await supabase.from("resultados_cursos").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapResultado);
}
// Solo el administrador (el servidor lo comprueba): objetivo semanal de ventas extra de una empleada
// Solo el administrador: objetivo de ticket medio (lo que debe dejar de media cada cita) de una empleada
export async function guardarObjetivoTicket(empleadaId, valor) {
  const { error } = await supabase.from("empleadas").update({ objetivo_ticket_medio: Math.max(0, Number(valor) || 0) }).eq("id", empleadaId);
  if (error) throw error;
}
export async function guardarObjetivoExtra(empleadaId, valor) {
  const { error } = await supabase.from("empleadas").update({ objetivo_extra_semanal: Math.max(0, Number(valor) || 0) }).eq("id", empleadaId);
  if (error) throw error;
}

// Guardar VARIOS servicios de golpe (su posición, su categoría o su color). Se mandan FILAS COMPLETAS: un upsert con solo
// {id, orden} falla si la base tiene columnas obligatorias sin valor por defecto (como «nombre»): PostgreSQL rechaza la fila
// antes de ver que el servicio ya existe («null value in column "nombre"… violates not-null constraint»).
// servicios: servicios completos (tal como están en la app) con el dato nuevo ya cambiado.
async function upsertServiciosCompletos(servicios) {
  if (!servicios.length) return;
  const enviar = (conOpcionales) => supabase.from("servicios").upsert(servicios.map((s) => servicioToRow(s, conOpcionales)), { onConflict: "id" });
  let { error } = await enviar(true);
  if (faltaDescripcion(error)) ({ error } = await enviar(false));
  if (error) throw error;
}
export const guardarOrdenServicios = upsertServiciosCompletos;
export const guardarCategoriaServicios = upsertServiciosCompletos;
export const guardarColoresServicios = upsertServiciosCompletos;

// ---------------------------------------------------------------------------
// Avisos para las empleadas (popup al entrar con su código)
// ---------------------------------------------------------------------------
const mapAviso = (r) => ({ id: r.id, titulo: r.titulo || "", mensaje: r.mensaje || "", destinatarios: r.destinatarios || [], frecuencia: r.frecuencia || "diaria", soloSiNoFicho: Boolean(r.solo_si_no_ficho), dias: r.dias || [], desde: r.desde || "", hasta: r.hasta || "", activo: r.activo !== false, creadoEn: r.created_at });
const avisoToRow = (a) => ({ id: a.id, titulo: a.titulo, mensaje: a.mensaje, destinatarios: a.destinatarios || [], frecuencia: a.frecuencia || "diaria", solo_si_no_ficho: Boolean(a.soloSiNoFicho), dias: a.dias || [], desde: a.desde || null, hasta: a.hasta || null, activo: a.activo !== false });
export async function fetchAvisos() {
  const { data, error } = await supabase.from("avisos").select("*").order("created_at");
  if (error) throw error;
  return (data || []).map(mapAviso);
}
export async function insertAviso(a) {
  const { error } = await supabase.from("avisos").insert(avisoToRow(a));
  if (error) throw error;
}
export async function updateAviso(a) {
  const { error } = await supabase.from("avisos").update(avisoToRow(a)).eq("id", a.id);
  if (error) throw error;
}
export async function deleteAviso(id) {
  const { error } = await supabase.from("avisos").delete().eq("id", id);
  if (error) throw error;
}
export async function fetchAvisosVistos() {
  const { data, error } = await supabase.from("avisos_vistos").select("*");
  if (error) throw error;
  return (data || []).map((r) => ({ id: r.id, avisoId: r.aviso_id, empleadaId: r.empleada_id, fecha: r.fecha }));
}
// Al cerrar el popup: se anota que esta empleada ha visto estos avisos hoy (id fijo: repetirlo no duplica)
export async function marcarAvisosVistos(filas) {
  if (!filas.length) return;
  const { error } = await supabase.from("avisos_vistos").upsert(filas.map((f) => ({ id: f.id, aviso_id: f.avisoId, empleada_id: f.empleadaId, fecha: f.fecha })), { onConflict: "id" });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Marketing (solo administrador): a quién ya se ha escrito o llamado
// ---------------------------------------------------------------------------
export async function fetchContactosMarketing() {
  const { data, error } = await supabase.from("marketing_contactos").select("*").order("fecha", { ascending: false });
  if (error) throw error;
  return (data || []).map((r) => ({ id: r.id, clienteId: r.cliente_id, canal: r.canal || "whatsapp", motivo: r.motivo || "reactivacion", por: r.por || "", fecha: r.fecha }));
}
export async function registrarContactoMarketing(c) {
  const { error } = await supabase.from("marketing_contactos").insert({ id: c.id, cliente_id: c.clienteId, canal: c.canal || "whatsapp", motivo: c.motivo || "reactivacion", por: c.por || null, fecha: c.fecha });
  if (error) throw error;
}

