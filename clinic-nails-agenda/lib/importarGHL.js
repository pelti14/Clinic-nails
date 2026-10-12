// SOLO SERVIDOR. Trae a la agenda las citas que se han creado en GoHighLevel
// (por ejemplo desde el calendario público o un embudo) y todavía no existen aquí.
//
// Reglas de seguridad:
//  · Solo CREA citas nuevas. Nunca modifica ni borra una cita existente.
//  · Si ya hay una cita sin vincular en el mismo hueco y empleada (típico de
//    una cita creada desde la app justo antes de que se guardara su vínculo),
//    se vincula en vez de duplicarla.
//  · Los eventos cancelados en GHL no se importan.
import { randomUUID } from "crypto";
import { supabase } from "./servidorDb";
import { registrarActividad } from "./actividadServidor";
import { actualizarEnlaceCitaGHL } from "./ghlEnlaceCita";
import { configActual, configurado, listarEventos, comprobarCitaGHL, obtenerContacto, listarCamposPersonalizadosGHL, actualizarCitaGHL, vaciarCampoContactoGHL } from "./ghl";
import { valorCampoServicio, campoServicio, serviciosDelCampo } from "./ghlServicioCampo";
import { decidir, estadoApp, resumenCambioGHL } from "./ghlReconciliar";
import {
  parsearMomentoGHL,
  fechaYMinutosMadrid,
  elegirCabina,
  elegirServicioPorTitulo,
  telefonoClave,
  soloDigitos,
} from "./agenda";

// La agenda cubre todo el día (00:00–24:00): se importan citas a cualquier hora
const DAY_START = 0;
const DAY_END = 24 * 60;
const hhmm = (min) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

// Supabase devuelve como máximo 1000 filas por consulta: se lee por páginas
async function leerTodo(tabla, columnas, filtro) {
  const out = [];
  for (let desde = 0; ; desde += 1000) {
    let q = supabase.from(tabla).select(columnas).range(desde, desde + 999);
    if (filtro) q = filtro(q);
    const { data, error } = await q;
    if (error) throw new Error(`${tabla}: ${error.message}`);
    out.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return out;
}

export async function importarCitasDeGHL({ dias = 60, ahora = Date.now(), baseUrl = "" } = {}) {
  if (!configurado()) return { ok: false, skipped: true, motivo: "GHL no configurado" };

  const resultado = { ok: true, importadas: [], actualizadas: [], conflictos: 0, vinculadas: 0, yaEnLaApp: 0, canceladas: 0, eliminadas: [], omitidas: [], errores: [] };

  const desdeMs = ahora - 24 * 3600 * 1000;
  const hastaMs = ahora + dias * 24 * 3600 * 1000;
  const fechaDesde = fechaYMinutosMadrid(desdeMs).fecha;

  // Los horarios no disponibles que la app ha enviado a GHL no son citas (si la tabla aún no existe, se ignora)
  const bloqueosRows = await leerTodo("bloqueos", "ghl_event_id", (q) => q.gte("fecha", fechaDesde)).catch(() => []);
  const bloqueosPorEvento = new Set(bloqueosRows.filter((b) => b.ghl_event_id).map((b) => b.ghl_event_id));

  const [empleadas, serviciosRows, cabinasRows, citasRows, clientes] = await Promise.all([
    leerTodo("empleadas", "id, nombre, activa, rol, ghl_calendar_id"),
    leerTodo("servicios", "*, categoria"),
    leerTodo("cabinas", "*"),
    leerTodo("citas", "*", (q) => q.gte("fecha", fechaDesde)), // «*»: incluye la última versión sincronizada (ghl_snapshot) si existe
    leerTodo("clientes", "id, nombre, telefono, email, ghl_contact_id"),
  ]);

  const servicios = serviciosRows.map((r) => ({ id: r.id, nombre: r.nombre, categoria: r.categoria || "", activo: r.activo, empleadas: r.empleadas || [], cabina: r.cabina || "cualquiera", duracion: Number(r.duracion) || 0 }));
  const cabinas = cabinasRows.map((r) => ({ id: r.id, activa: r.activa }));
  const citas = citasRows.map((r) => ({ ...r, cabinaId: r.cabina_id }));
  const citasPorEvento = new Set(citas.filter((c) => c.ghl_event_id).map((c) => c.ghl_event_id));
  const citaPorEvento = new Map(citas.filter((c) => c.ghl_event_id).map((c) => [c.ghl_event_id, c]));

  const staff = empleadas.filter((e) => e.activa && e.rol !== "admin");
  const empleadaPorCalendario = new Map(staff.filter((e) => (e.ghl_calendar_id || "").trim()).map((e) => [e.ghl_calendar_id.trim(), e]));

  // El contacto de GHL se lee una sola vez por sincronización (lo piden el cliente y el servicio)
  const contactosCache = new Map();
  const leerContacto = async (id) => {
    if (!contactosCache.has(id)) contactosCache.set(id, await obtenerContacto(id));
    return contactosCache.get(id);
  };
  // El bot de IA escribe el servicio que pide la clienta en el campo «Servicio» del contacto: se lee cuando el título no lo dice
  let definicionesCampos = null;
  const camposDeContacto = async () => {
    if (definicionesCampos) return definicionesCampos;
    try {
      definicionesCampos = await listarCamposPersonalizadosGHL();
    } catch (err) {
      definicionesCampos = [];
      resultado.errores.push(`No se pudo leer el campo «Servicio» de los contactos de GHL (${err.message}). Si usas el bot de IA, activa el permiso «locations/customFields.readonly» de tu clave.`);
    }
    return definicionesCampos;
  };

  const general = configActual().calendarId;
  const calendarios = new Set(empleadaPorCalendario.keys());
  if (general) calendarios.add(general);
  if (calendarios.size === 0) {
    return { ...resultado, ok: false, errores: ["No hay ningún calendario de GHL asignado a una empleada (Configuración → Conexiones)."] };
  }

  // ---- Leer eventos de cada calendario ----
  const eventos = [];
  for (const calId of calendarios) {
    try {
      const lista = await listarEventos(calId, desdeMs, hastaMs);
      lista.forEach((ev) => eventos.push({ ev, calId }));
    } catch (err) {
      resultado.errores.push(`No se pudieron leer las citas del calendario ${calId}: ${err.message}`);
    }
  }

  const guardarSnapshot = async (cita, estado) => {
    cita.ghl_snapshot = estado;
    await supabase.from("citas").update({ ghl_snapshot: estado }).eq("id", cita.id); // si la columna aún no existe, se ignora
  };

  async function reconciliar(cita, ev, cancelado, calId) {
    if (cita.estado_cobro === "cobrada") return void resultado.yaEnLaApp++; // una cita ya cobrada no se mueve sola
    const ini = parsearMomentoGHL(ev.startTime ?? ev.start);
    if (!ini) return void resultado.yaEnLaApp++;
    const fin = parsearMomentoGHL(ev.endTime ?? ev.end);
    const { fecha, minutos } = fechaYMinutosMadrid(ini);
    const duracionGHL = fin && fin > ini ? Math.min(Math.max(Math.round((fin - ini) / 60000), 5), 600) : cita.duracion;
    const calEv = (ev.calendarId || calId || "").trim();
    const empGHL = empleadaPorCalendario.get(calEv)?.id;
    const topada = cita.inicio + cita.duracion >= 23 * 60 + 59; // la duración recortada por el límite de las 24:00 no se compara
    const ghl = { fecha, inicio: minutos, duracion: topada ? cita.duracion : duracionGHL, empleada_id: empGHL || cita.empleada_id, cancelada: cancelado };
    const d = decidir({ app: estadoApp(cita), ghl, snapshot: cita.ghl_snapshot || null });
    if (d.conflictos.length) resultado.conflictos++;
    if (d.accion === "guardar_snapshot") {
      await guardarSnapshot(cita, ghl);
      return void resultado.yaEnLaApp++;
    }
    if (d.accion === "nada") return void resultado.yaEnLaApp++;

    const nuevo = { ...estadoApp(cita), ...d.aplicar };
    if (!nuevo.cancelada && (nuevo.inicio < DAY_START || nuevo.inicio + nuevo.duracion > DAY_END)) {
      resultado.omitidas.push({ id: ev.id, motivo: `Se movió en GHL fuera del horario de la agenda (${hhmm(DAY_START)}–${hhmm(DAY_END)}) y no se vería: se queda como estaba`, detalle: `${cita.clienta} · ${fecha} ${hhmm(minutos)}` });
      return;
    }
    const cambios = {};
    const detalle = [];
    for (const [campo, columna] of [["fecha", "fecha"], ["inicio", "inicio"], ["duracion", "duracion"], ["empleada_id", "empleada_id"]]) {
      if (campo in d.aplicar) { cambios[columna] = d.aplicar[campo]; detalle.push({ campo: columna, antes: cita[columna], despues: d.aplicar[campo] }); }
    }
    if ("empleada_id" in d.aplicar) cambios.ghl_calendar_id = calEv;
    if ("cancelada" in d.aplicar) {
      const asistencia = d.aplicar.cancelada ? "cancelada" : "prevista";
      cambios.asistencia = asistencia;
      detalle.push({ campo: "asistencia", antes: cita.asistencia, despues: asistencia });
    }
    const { error } = await supabase.from("citas").update(cambios).eq("id", cita.id);
    if (error) return void resultado.errores.push(`No se pudo actualizar «${cita.clienta}» con el cambio de GHL: ${error.message}`);
    const resumen = resumenCambioGHL(cita, d.aplicar);
    Object.assign(cita, cambios);
    await guardarSnapshot(cita, ghl);
    resultado.actualizadas.push({ id: cita.id, clienta: cita.clienta, cambios: Object.keys(d.aplicar), resumen });
    await registrarActividad([{ usuario_id: null, usuario_nombre: "GHL (reserva online / IA)", origen: "ghl", entidad: "cita", entidad_id: cita.id, cliente_id: cita.cliente_id || null, accion: "cancelada" in d.aplicar ? "asistencia" : "mover", resumen, detalle: { cambios: detalle, ghlEventId: ev.id } }]);
  }

  const inicioDe = (x) => parsearMomentoGHL(x.ev.startTime ?? x.ev.start) ?? 0;
  eventos.sort((a, b) => inicioDe(a) - inicioDe(b));

  for (const { ev, calId } of eventos) {
    const id = ev.id;
    if (!id) continue;
    const titulo = ev.title || "";
    // El estado puede venir en `appointmentStatus` o en `status`: se miran los dos
    const estados = [ev.appointmentStatus, ev.status].map((x) => String(x || "").toLowerCase());
    const estadoGHL = estados.includes("noshow") ? "noshow" : estados.find(Boolean) || "";

    const cancelado = Boolean(ev.deleted || estados.some((x) => ["cancelled", "canceled", "invalid"].includes(x)));
    const enlazada = citaPorEvento.get(id);
    if (cancelado && !enlazada) {
      resultado.canceladas++;
      continue;
    }
    if (bloqueosPorEvento.has(id) || /^no disponible\b/i.test(titulo.trim())) {
      resultado.bloqueosPropios = (resultado.bloqueosPropios || 0) + 1;
      continue;
    }
    if (enlazada) {
      // La cita ya está en la app: si en GHL se ha movido o cancelado, se refleja aquí (sin pisar lo que se haya cambiado en la app)
      await reconciliar(enlazada, ev, cancelado, calId);
      continue;
    }

    const ini = parsearMomentoGHL(ev.startTime ?? ev.start);
    if (!ini) {
      resultado.errores.push(`Cita «${titulo || id}»: no se pudo leer su fecha (${ev.startTime ?? "vacía"}).`);
      continue;
    }
    const fin = parsearMomentoGHL(ev.endTime ?? ev.end);
    const { fecha, minutos } = fechaYMinutosMadrid(ini);
    let duracion = fin && fin > ini ? Math.min(Math.max(Math.round((fin - ini) / 60000), 5), 600) : 60;
    const etiqueta = `${titulo || "Cita"} · ${fecha} ${hhmm(minutos)}`;

    const calEv = (ev.calendarId || calId || "").trim();
    const emp = empleadaPorCalendario.get(calEv);
    if (!emp) {
      resultado.omitidas.push({ id, motivo: "Su calendario de GHL no está asignado a ninguna empleada", detalle: etiqueta });
      continue;
    }
    if (minutos < DAY_START || minutos + duracion > DAY_END) {
      resultado.omitidas.push({ id, motivo: `Cae fuera del horario de la agenda (${hhmm(DAY_START)}–${hhmm(DAY_END)}) y no se vería`, detalle: `${etiqueta} · ${emp.nombre}` });
      continue;
    }

    // ¿Ya existe una cita sin vincular exactamente en ese hueco? → se vincula
    const gemela = citas.find((c) => !c.ghl_event_id && c.empleada_id === emp.id && c.fecha === fecha && c.inicio === minutos);
    if (gemela) {
      const { error } = await supabase.from("citas").update({ ghl_event_id: id, ghl_calendar_id: calEv || calId }).eq("id", gemela.id);
      if (error) resultado.errores.push(`No se pudo vincular «${etiqueta}»: ${error.message}`);
      else {
        gemela.ghl_event_id = id;
        citasPorEvento.add(id);
        resultado.vinculadas++;
      }
      continue;
    }

    // ---- Cliente ----
    let clienteId = null;
    let nombreCliente = titulo || "Cliente de GHL";
    if (ev.contactId) {
      let cli = clientes.find((c) => c.ghl_contact_id === ev.contactId);
      if (!cli) {
        let contacto = null;
        try {
          contacto = await leerContacto(ev.contactId);
        } catch (err) {
          resultado.errores.push(`No se pudo leer el contacto de «${etiqueta}»: ${err.message}`);
        }
        if (contacto) {
          const nombreC = [contacto.firstName, contacto.lastName].filter(Boolean).join(" ") || contacto.name || contacto.contactName || "";
          const tel = contacto.phone || "";
          const esRelleno = soloDigitos(tel) === "000000000" || /@clinicnailsandbeauty\.local$/i.test(contacto.email || "");
          if (esRelleno) {
            nombreCliente = nombreC || nombreCliente; // visita "sin cita previa"
          } else {
            const clave = telefonoClave(tel);
            cli = clave ? clientes.find((c) => telefonoClave(c.telefono) === clave) : null;
            if (!cli && contacto.email) cli = clientes.find((c) => c.email && c.email.toLowerCase() === contacto.email.toLowerCase());
            if (cli) {
              await supabase.from("clientes").update({ ghl_contact_id: ev.contactId }).eq("id", cli.id);
              cli.ghl_contact_id = ev.contactId;
            } else {
              const nuevo = { id: randomUUID(), nombre: nombreC || "Cliente de GHL", telefono: tel, email: contacto.email || null, ghl_contact_id: ev.contactId };
              const { error } = await supabase.from("clientes").insert(nuevo);
              if (error) resultado.errores.push(`No se pudo crear el cliente de «${etiqueta}»: ${error.message}`);
              else {
                cli = nuevo;
                clientes.push(nuevo);
              }
            }
          }
        }
      }
      if (cli) {
        clienteId = cli.id;
        nombreCliente = cli.nombre;
      }
    }

    // ---- Servicio y cabina ----
    let { servicio, porTitulo } = elegirServicioPorTitulo(titulo, servicios, emp);
    let servicioDesde = porTitulo ? "titulo" : "defecto";
    let valorCampo = "";
    let extras = []; // los demás servicios si el campo «Servicio» traía varios
    if (!porTitulo && ev.contactId) {
      // el título no dice qué servicio es: se mira el campo «Servicio» del contacto (lo rellena el bot de IA antes de reservar)
      try {
        valorCampo = valorCampoServicio(await leerContacto(ev.contactId), await camposDeContacto());
        if (valorCampo) {
          const r = serviciosDelCampo(valorCampo, servicios, emp);
          if (r.porTitulo) { servicio = r.servicios[0]; extras = r.servicios.slice(1); porTitulo = true; servicioDesde = "campo"; }
        }
      } catch (err) {
        // sin poder leer el contacto, se sigue con el servicio por defecto (la cita queda marcada para revisar)
      }
    }
    if (!servicio) {
      resultado.errores.push(`«${etiqueta}»: no hay ningún servicio activo al que asignarla.`);
      continue;
    }
    // Reserva del bot de IA (servicio tomado del campo «Servicio»): el calendario de la empleada reserva huecos de duración fija,
    // así que la cita dura lo que dure el servicio, y en GHL se corrige la duración (para que bloquee el hueco real) y el título.
    const duracionGHL = duracion;
    const duracionServicios = [servicio, ...extras].reduce((m, sv) => m + (Number(sv.duracion) || 0), 0);
    if (servicioDesde === "campo" && duracionServicios > 0) duracion = Math.min(duracionServicios, DAY_END - minutos);
    const cabinaId = elegirCabina(servicio, cabinas, citas.filter((c) => c.fecha === fecha), minutos, duracion, null);
    if (!cabinaId) {
      resultado.errores.push(`«${etiqueta}»: no hay ninguna cabina activa.`);
      continue;
    }

    const fila = {
      id: randomUUID(),
      fecha,
      empleada_id: emp.id,
      servicio_id: servicio.id,
      servicios_extra: extras.map((sv) => sv.id),
      cabina_id: cabinaId,
      cliente_id: clienteId,
      clienta: nombreCliente,
      inicio: minutos,
      duracion,
      pagos: [],
      productos: [],
      estado_cobro: "pendiente",
      asistencia: estadoGHL === "noshow" ? "no_asistio" : "prevista",
      ghl_event_id: id,
      ghl_calendar_id: calEv || calId,
      origen: "ghl",
      notas: `📥 Reservada desde GoHighLevel («${titulo || "sin título"}»).${servicioDesde === "campo" ? ` Servicio tomado del campo «Servicio» del contacto («${valorCampo}»).` : porTitulo ? "" : valorCampo ? ` Revisa el servicio: el campo «Servicio» del contacto dice «${valorCampo}» y no coincide con ninguno; se ha puesto uno por defecto.` : " Revisa el servicio: se ha puesto uno por defecto."}`,
    };
    const { error } = await supabase.from("citas").insert(fila);
    if (error) {
      resultado.errores.push(`No se pudo crear «${etiqueta}»: ${error.message}`);
      continue;
    }
    await registrarActividad([{
      usuario_id: null, usuario_nombre: "GHL (reserva online / IA)", origen: "ghl", entidad: "cita", entidad_id: fila.id, cliente_id: clienteId || null, accion: "crear",
      resumen: `Reserva creada desde GHL: «${titulo || "sin título"}» (${nombreCliente || "sin nombre"})${porTitulo ? "" : " · servicio por revisar"}`,
      detalle: { titulo, ghlEventId: id, fecha, hora: hhmm(minutos), empleada: emp.nombre, servicio: servicio.nombre, servicioPorTitulo: porTitulo, servicioDesde, campoServicio: valorCampo || null },
    }]);
    if (servicioDesde === "campo") {
      try {
        await actualizarCitaGHL(id, { calendarId: calEv || calId, fecha, inicio: minutos, duracion, titulo: `${[servicio, ...extras].map((sv) => sv.nombre).join(" + ")} – ${nombreCliente}` });
      } catch (err) {
        resultado.errores.push(`«${etiqueta}»: la cita entró con su servicio, pero no se pudo corregir en GHL (duración ${duracionGHL} → ${duracion} min): ${err.message}`);
      }
      try {
        await vaciarCampoContactoGHL(ev.contactId, campoServicio(await camposDeContacto())?.id);
      } catch (err) {
        resultado.errores.push(`«${etiqueta}»: no se pudo vaciar el campo «Servicio» del contacto en GHL (la próxima reserva del bot podría llevar el servicio anterior): ${err.message}`);
      }
    }
    await guardarSnapshot({ id: fila.id }, { fecha, inicio: minutos, duracion, empleada_id: emp.id, cancelada: false });
    const nuevaCita = { id: fila.id, fecha, empleada_id: emp.id, inicio: minutos, duracion, cabinaId, ghl_event_id: id, asistencia: fila.asistencia, estado_cobro: "pendiente", clienta: nombreCliente, cliente_id: clienteId, ghl_snapshot: { fecha, inicio: minutos, duracion, empleada_id: emp.id, cancelada: false } };
    citas.push(nuevaCita);
    citaPorEvento.set(id, nuevaCita);
    citasPorEvento.add(id);
    resultado.importadas.push({ id: fila.id, fecha, hora: hhmm(minutos), empleada: emp.nombre, clienta: nombreCliente, servicio: servicio.nombre, servicioPorTitulo: porTitulo, servicioDesde, titulo });
  }

  // ---- Citas BORRADAS en GHL ----
  // Una cita borrada en GHL ya no sale en su lista, así que antes se quedaba para siempre en la agenda. Para no cancelar nada por error,
  // solo se mira si TODOS los calendarios se leyeron bien, solo las citas con vínculo, sin cobrar, de hoy en adelante y de un calendario que
  // sí se ha leído, y se confirma cita por cita con GHL (404 = borrada). Ante cualquier duda no se toca nada.
  const listadoCompleto = !resultado.errores.some((e) => e.startsWith("No se pudieron leer las citas del calendario"));
  if (listadoCompleto) {
    const vistos = new Set(eventos.map(({ ev }) => ev.id).filter(Boolean));
    const fechaHasta = fechaYMinutosMadrid(hastaMs).fecha;
    const candidatas = [...citaPorEvento.values()].filter((c) => c.ghl_event_id && !vistos.has(c.ghl_event_id) && !bloqueosPorEvento.has(c.ghl_event_id) && c.estado_cobro !== "cobrada" && c.asistencia !== "cancelada" && c.fecha >= fechaDesde && c.fecha <= fechaHasta && calendarios.has((c.ghl_calendar_id || "").trim()));
    for (const c of candidatas.slice(0, 25)) {
      if ((await comprobarCitaGHL(c.ghl_event_id)) !== "borrada") continue;
      const nota = `${c.notas || ""} 🗑️ Eliminada en GoHighLevel.`.trim();
      const { error } = await supabase.from("citas").update({ asistencia: "cancelada", ghl_event_id: null, ghl_snapshot: null, notas: nota }).eq("id", c.id);
      if (error) { resultado.errores.push(`No se pudo cancelar «${c.clienta}» (borrada en GHL): ${error.message}`); continue; }
      Object.assign(c, { asistencia: "cancelada", ghl_event_id: null, ghl_snapshot: null, notas: nota });
      resultado.eliminadas.push({ id: c.id, clienta: c.clienta, fecha: c.fecha, hora: hhmm(c.inicio) });
      await registrarActividad([{ usuario_id: null, usuario_nombre: "GHL (reserva online / IA)", origen: "ghl", entidad: "cita", entidad_id: c.id, cliente_id: c.cliente_id || null, accion: "cancelar", resumen: `Cita eliminada en GHL: ${c.clienta || "sin nombre"} el ${c.fecha} a las ${hhmm(c.inicio)} (cancelada también aquí)`, detalle: { fecha: c.fecha, hora: hhmm(c.inicio), ghlEventId: "borrado" } }]);
    }
  }

  // ---- Enlace para cambiar o cancelar la cita (campo «Enlace cita» del contacto en GHL) de las clientas con citas nuevas del bot ----
  if (baseUrl && resultado.importadas.length) {
    const hechos = new Set();
    for (const imp of resultado.importadas.slice(0, 15)) {
      try {
        const { data } = await supabase.from("citas").select("*").eq("id", imp.id);
        const clienteId = data && data[0] && data[0].cliente_id;
        if (!clienteId || hechos.has(clienteId)) continue;
        hechos.add(clienteId);
        await actualizarEnlaceCitaGHL({ supabase, clienteId, baseUrl, ahoraMs: ahora });
      } catch (e) { /* el enlace es un extra: no estropea la importación */ }
    }
  }

  return resultado;
}

// Candado en memoria: si dos pantallas (o el webhook y una pantalla) piden
// importar a la vez, comparten la misma ejecución en vez de duplicar citas.
let enCurso = null;
export function importarConBloqueo(opciones) {
  if (!enCurso) {
    enCurso = importarCitasDeGHL(opciones).finally(() => {
      enCurso = null;
    });
  }
  return enCurso;
}
