// Envía a GoHighLevel una cita de la agenda: crea, actualiza o MUEVE su evento en el calendario de su empleada y deja guardado el vínculo.
// La usan la ruta /api/ghl/sync-cita (cuando alguien del equipo guarda una cita) y las reservas online de las clientas.
// Devuelve { status, cuerpo }; el que la llama decide cómo responder. Hay que haber llamado antes a cargarConfigGHL().
import { configActual, upsertContacto, crearCitaGHL, actualizarCitaGHL, eliminarCitaGHL } from "./ghl";

import { actualizarEnlaceCitaGHL } from "./ghlEnlaceCita";

const fallar = (error, status = 500) => ({ status, cuerpo: { ok: false, error } });

async function sincronizarInterno(supabase, citaId) {
  const { data: cita, error: errCita } = await supabase.from("citas").select("*").eq("id", citaId).single();
  if (errCita || !cita) return fallar(`Cita no encontrada${errCita ? ` (${errCita.message})` : ""}`, 404);

  let clienteRow = null;
  if (cita.cliente_id) {
    const { data, error } = await supabase.from("clientes").select("*").eq("id", cita.cliente_id).single();
    if (error || !data) return fallar(`Cliente no encontrado${error ? ` (${error.message})` : ""}`, 404);
    clienteRow = data;
  }

  const { data: servicioRow } = await supabase.from("servicios").select("*").eq("id", cita.servicio_id).single();

  // ---- Calendario de GHL que le corresponde a ESTA cita --------------------
  // El de su empleada; si no tiene, el general (GHL_CALENDAR_ID).
  const { data: empleadaRow, error: errEmp } = await supabase
    .from("empleadas")
    .select("nombre, ghl_calendar_id")
    .eq("id", cita.empleada_id)
    .single();
  if (errEmp) return fallar(`No se pudo leer la empleada de la cita (${errEmp.message})`);

  const calendarioEmpleada = (empleadaRow?.ghl_calendar_id || "").trim();
  const calendarioGeneral = configActual().calendarId;
  const calendarioFinal = calendarioEmpleada || calendarioGeneral;
  const origen = calendarioEmpleada ? "empleada" : "general";
  if (!calendarioFinal) {
    return fallar("Esta empleada no tiene calendario de GHL asignado y tampoco hay uno general configurado", 400);
  }

  // ---- Contacto -------------------------------------------------------------
  // Sin ficha de cliente ("Sin cita previa"): contacto genérico de relleno
  // para que el hueco quede igualmente reservado en GHL.
  const cliente = clienteRow
    ? {
        nombre: clienteRow.nombre,
        telefono: clienteRow.telefono,
        email: clienteRow.email,
        favorito: clienteRow.favorito,
        ghlContactId: clienteRow.ghl_contact_id,
      }
    : {
        nombre: cita.clienta || "Sin cita previa",
        telefono: "000000000",
        email: "sin-cita@clinicnailsandbeauty.local",
        favorito: false,
        ghlContactId: null,
      };

  const ghlContactId = await upsertContacto(cliente);
  if (!ghlContactId) return fallar("GHL no devolvió el contacto de esta clienta");
  if (clienteRow && ghlContactId !== clienteRow.ghl_contact_id) {
    await supabase.from("clientes").update({ ghl_contact_id: ghlContactId }).eq("id", clienteRow.id);
  }

  // Una venta cobrada se ve como «[COBRADO 45 €]» en el título de la cita de GHL
  const cobrada = cita.estado_cobro === "cobrada" && cita.asistencia !== "cancelada" && cita.asistencia !== "no_asistio";
  const pagos = Array.isArray(cita.pagos) ? cita.pagos : [];
  const importeBono = pagos.filter((p) => p?.metodoId === "bono").reduce((s, p) => s + (Number(p?.importe) || 0), 0);
  const importe = pagos.reduce((s, p) => s + (Number(p?.importe) || 0), 0) - importeBono; // dinero cobrado de verdad
  const euros = (n) => `${n.toFixed(2).replace(/\.00$/, "")} €`;
  // «[COBRADO 45 €]», «[COBRADO BONO]» (sesión de un bono ya pagado) o «[COBRADO 30 € + BONO]»
  const detalle = [importe > 0 ? euros(importe) : "", importeBono > 0 ? "BONO" : ""].filter(Boolean).join(" + ");
  const marca = cobrada ? `[COBRADO${detalle ? ` ${detalle}` : ""}] ` : "";
  const titulo = `${marca}${servicioRow?.nombre || "Cita"} — ${cliente.nombre}`;
  // Estado que se refleja en GHL (sirve para sus automatizaciones)
  const estado =
    cita.asistencia === "no_asistio" ? "noshow" : cita.asistencia === "cancelada" ? "cancelled" : cita.estado_cobro === "cobrada" ? "showed" : undefined;
  const datosCita = { fecha: cita.fecha, inicio: cita.inicio, duracion: cita.duracion, titulo, estado };

  // ---- Crear, actualizar o MOVER ----------------------------------------------
  // Si ya existe en GHL y está en el calendario correcto → se actualiza.
  // Si existe pero en otro calendario (o no sabemos en cuál) → se borra y se
  // vuelve a crear en el correcto, para que no se quede colgada donde no toca.
  let ghlEventId = cita.ghl_event_id || null;
  let accion;
  let aviso = null;
  let calendarioReal = calendarioFinal;

  let hecho = false;

  if (ghlEventId && cita.ghl_calendar_id === calendarioFinal) {
    // Si ya no está cobrada/cancelada/no asistió, el estado vuelve a «confirmed» (si no, GHL se quedaría en «showed»)
    await actualizarCitaGHL(ghlEventId, { ...datosCita, estado: datosCita.estado || "confirmed", calendarId: calendarioFinal });
    accion = "actualizada";
    hecho = true;
  }
  if (!hecho) {
    accion = ghlEventId ? "movida" : "creada";
    if (ghlEventId) {
      // Si no se puede borrar la antigua, la cita se crea igualmente en el calendario nuevo (así la agenda y GHL no se desajustan)
      // y se avisa de qué hay que borrar a mano, en vez de dejar todo a medias con un error.
      try {
        await eliminarCitaGHL(ghlEventId);
      } catch (e) {
        aviso = `La cita se movió en GHL, pero no se pudo borrar la reserva antigua del otro calendario (${e.message}). Bórrala a mano en GHL para que no quede duplicada.`;
      }
    }
    const creada = await crearCitaGHL({ ghlContactId, calendarId: calendarioFinal, ...datosCita });
    ghlEventId = creada.id;
    calendarioReal = creada.calendarId || calendarioFinal;
  }

  const instantanea = { fecha: cita.fecha, inicio: cita.inicio, duracion: cita.duracion, empleada_id: cita.empleada_id, cancelada: cita.asistencia === "cancelada" };
  const { error: errGuardar } = await supabase
    .from("citas")
    .update({ ghl_event_id: ghlEventId, ghl_calendar_id: calendarioReal })
    .eq("id", citaId);
  if (errGuardar) {
    // Al menos conserva el id de la cita de GHL, para no dejarla huérfana ni duplicarla
    await supabase.from("citas").update({ ghl_event_id: ghlEventId }).eq("id", citaId);
    return fallar(
      `La cita se envió a GHL pero no se pudo guardar el vínculo (${errGuardar.message}). ` +
        "Vuelve a pegar supabase/schema.sql en Supabase."
    );
  }
  // Lo que acaba de quedar igual en la app y en GHL (para detectar luego qué se cambió en GHL). Si falta la columna, se ignora.
  await supabase.from("citas").update({ ghl_snapshot: instantanea }).eq("id", citaId);

  return { status: 200, cuerpo: {
    ok: true,
    accion,
    origen,
    empleada: empleadaRow?.nombre || "",
    calendarId: calendarioReal,
    ghlEventId,
    ...(aviso ? { aviso } : {}),
  } };
}

// Envía la cita a GHL y, si se conoce la dirección de la web, deja en el contacto el enlace para cambiar o cancelar su PRÓXIMA cita
// (campo «Enlace cita», para usar {{contact.enlace_cita}} en las automatizaciones). El enlace es un extra: si falla, la cita no se ve afectada.
export async function sincronizarCitaGHL(supabase, citaId, { baseUrl = "" } = {}) {
  const r = await sincronizarInterno(supabase, citaId);
  if (baseUrl && r.status === 200 && r.cuerpo?.ok) {
    try {
      const { data } = await supabase.from("citas").select("*").eq("id", citaId);
      const clienteId = data && data[0] && data[0].cliente_id;
      if (clienteId) await actualizarEnlaceCitaGHL({ supabase, clienteId, baseUrl });
    } catch (e) { /* el enlace es un extra */ }
  }
  return r;
}

