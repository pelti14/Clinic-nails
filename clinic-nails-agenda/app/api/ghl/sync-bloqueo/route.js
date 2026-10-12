import { NextResponse } from "next/server";
import { verificarUsuario } from "../../../../lib/auth";
import { supabase } from "../../../../lib/servidorDb";
import { cargarConfigGHL } from "../../../../lib/configServidor";
import { configurado, configActual, crearBloqueoGHL, crearCitaGHL, upsertContacto, eliminarCitaGHL, usuarioAsignadoDelCalendario } from "../../../../lib/ghl";

export const dynamic = "force-dynamic";

const fallo = (error, status = 500) => NextResponse.json({ ok: false, error }, { status });

// Envía a GHL un horario no disponible. Se crea como un EVENTO «No disponible» en el calendario de la empleada (con un contacto de
// relleno que no recibe mensajes): así se VE en el calendario de GHL y nadie puede reservar ahí. (El «block slot» interno de GHL lo
// acepta pero no lo dibuja en el calendario: solo se usa si el evento no se puede crear.) Al actualizar o mover, se borra el anterior y
// se crea de nuevo. Para borrarlo se usa /eliminar-cita.
export async function POST(request) {
  try {
    const auth = await verificarUsuario(request);
    if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    await cargarConfigGHL();
    if (!configurado()) return NextResponse.json({ ok: false, skipped: true, motivo: "GHL no configurado" });

    const { bloqueoId } = await request.json();
    if (!bloqueoId) return fallo("Falta bloqueoId", 400);

    const { data: b, error: errB } = await supabase.from("bloqueos").select("*").eq("id", bloqueoId).single();
    if (errB || !b) return fallo(`Horario no disponible no encontrado${errB ? ` (${errB.message})` : ""}`, 404);

    const { data: emp, error: errEmp } = await supabase.from("empleadas").select("nombre, ghl_calendar_id").eq("id", b.empleada_id).single();
    if (errEmp) return fallo(`No se pudo leer la empleada (${errEmp.message})`);

    const propio = (emp?.ghl_calendar_id || "").trim();
    const calendarId = propio || configActual().calendarId;
    if (!calendarId) return fallo("Esta empleada no tiene calendario de GHL asignado y tampoco hay uno general configurado", 400);

    const titulo = `No disponible${b.motivo ? ` — ${b.motivo}` : ""}`;
    const fin = Math.min(b.inicio + b.duracion, 23 * 60 + 59); // GHL no admite las 24:00
    const ghlEventViejo = b.ghl_event_id || null;
    let aviso = null;
    let ghlEventId = null;
    let visible = true;

    // 1.º evento visible en el calendario de la empleada (contacto «No disponible», con «no molestar»)
    try {
      const contactoId = await upsertContacto({ nombre: "No disponible", telefono: "000000001", email: "no-disponible@clinicnailsandbeauty.local", favorito: false, ghlContactId: null, noMolestar: true });
      if (!contactoId) throw new Error("GHL no devolvió el contacto de relleno");
      if (ghlEventViejo) await eliminarCitaGHL(ghlEventViejo); // actualizar o mover = borrar el anterior y crear de nuevo
      const creado = await crearCitaGHL({ ghlContactId: contactoId, calendarId, fecha: b.fecha, inicio: b.inicio, duracion: fin - b.inicio, titulo, estado: "confirmed" });
      ghlEventId = creado.id;
    } catch (errVisible) {
      // 2.º plan B: bloqueo interno de GHL (bloquea a la persona, pero GHL no lo dibuja en el calendario)
      visible = false;
      let assignedUserId = null;
      try { assignedUserId = await usuarioAsignadoDelCalendario(calendarId); } catch (e) { assignedUserId = null; }
      if (ghlEventViejo) await eliminarCitaGHL(ghlEventViejo).catch(() => {});
      const creado = await crearBloqueoGHL({ calendarId, assignedUserId, fecha: b.fecha, inicio: b.inicio, duracion: b.duracion, titulo });
      ghlEventId = creado.id;
      aviso = `No se pudo crearlo como evento visible en el calendario de GHL (${errVisible.message}); se creó como bloqueo interno: bloquea las reservas pero GHL no lo dibuja en su calendario.`;
    }
    const accion = ghlEventViejo ? "actualizado" : "creado";
    const calendarioReal = calendarId;

    const { error: errGuardar } = await supabase.from("bloqueos").update({ ghl_event_id: ghlEventId, ghl_calendar_id: calendarioReal }).eq("id", bloqueoId);
    if (errGuardar) {
      await supabase.from("bloqueos").update({ ghl_event_id: ghlEventId }).eq("id", bloqueoId);
      return fallo(`El bloqueo se envió a GHL pero no se pudo guardar el vínculo (${errGuardar.message}). Vuelve a pegar supabase/schema.sql en Supabase.`);
    }

    return NextResponse.json({ ok: true, accion, visible, origen: propio ? "empleada" : "general", empleada: emp?.nombre || "", calendarId: calendarioReal, ghlEventId, ...(aviso ? { aviso } : {}) });
  } catch (err) {
    console.error("GHL sync-bloqueo:", err);
    return fallo(err.message);
  }
}
