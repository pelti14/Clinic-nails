import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { supabase } from "../../../../lib/servidorDb";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { registrarActividad } from "../../../../lib/actividadServidor";
import { normalizarEstado, elegirCitaParaConfirmar, ESTADOS_CONFIRMACION } from "../../../../lib/confirmaciones";
import { hoyMadrid } from "../../../../lib/cursos";

export const dynamic = "force-dynamic";
const respuesta = (cuerpo, status = 200) => NextResponse.json(cuerpo, { status });
const fallo = (error, status) => respuesta({ ok: false, error }, status);

const iguales = (a, b) => {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
};

// Aviso de GHL: una clienta confirmó su cita por WhatsApp (el bot de IA o un flujo de GHL llama aquí).
// Seguridad: lleva una clave en el enlace (?token=…) que se crea en Configuración → Conexiones; sin ella no se hace nada.
// Qué cita: la de `appointmentId` si GHL lo manda; si no, la PRÓXIMA (de hoy en adelante) del contacto (`contactId` / `contact_id`),
// o la de `fecha` si se indica. Estado: `?estado=confirmada` (o `no_contesta`) en el enlace, o `estado` en los datos que mande GHL.
export async function POST(request) {
  try {
    const url = new URL(request.url);
    let cuerpo = {};
    try { cuerpo = (await request.json()) || {}; } catch (e) { cuerpo = {}; }
    const custom = cuerpo.customData || cuerpo.custom_data || {};

    // ---- clave ----
    const admin = supabaseAdmin();
    if (!admin) return fallo("Falta SUPABASE_SERVICE_ROLE_KEY en el servidor.", 500);
    const { data: guardado } = await admin.from("ajustes_privados").select("valor").eq("clave", "ghl_confirmacion_token").maybeSingle();
    const esperado = guardado?.valor || "";
    if (!esperado) return fallo("Todavía no hay un enlace seguro creado: créalo en Configuración → Conexiones.", 503);
    const recibido = url.searchParams.get("token") || request.headers.get("x-token") || cuerpo.token || custom.token || "";
    if (!recibido || !iguales(recibido, esperado)) return fallo("Clave incorrecta.", 401);

    // ---- qué se anota ----
    const estado = normalizarEstado(url.searchParams.get("estado") ?? cuerpo.estado ?? custom.estado ?? cuerpo.status);
    if (!estado) return fallo("Falta el estado: añade «&estado=confirmada» (o «no_contesta») al final del enlace.", 400);
    const appointmentId = cuerpo.appointmentId || cuerpo.appointment_id || cuerpo.eventId || custom.appointmentId || cuerpo.calendar?.appointmentId || "";
    const contactId = cuerpo.contactId || cuerpo.contact_id || custom.contactId || cuerpo.contact?.id || "";
    const fecha = /^\d{4}-\d{2}-\d{2}$/.test(String(url.searchParams.get("fecha") || cuerpo.fecha || custom.fecha || "")) ? String(url.searchParams.get("fecha") || cuerpo.fecha || custom.fecha) : "";
    if (!appointmentId && !contactId) return fallo("GHL no mandó ni la cita (appointmentId) ni el contacto (contactId).", 400);

    // ---- cuál es la cita ----
    const hoy = hoyMadrid();
    let cita = null;
    if (appointmentId) {
      const { data } = await supabase.from("citas").select("*").eq("ghl_event_id", appointmentId).maybeSingle();
      cita = data || null;
      if (cita && (cita.asistencia === "cancelada" || cita.asistencia === "no_asistio")) return fallo("Esa cita está cancelada o marcada como «no asistió»: no se ha cambiado nada.", 409);
    }
    if (!cita && contactId) {
      const { data: clientes } = await supabase.from("clientes").select("id").eq("ghl_contact_id", contactId);
      const ids = (clientes || []).map((c) => c.id);
      if (!ids.length) return fallo("Ese contacto de GHL no está enlazado con ningún cliente de la agenda.", 404);
      const { data: filas } = await supabase.from("citas").select("*").in("cliente_id", ids).gte("fecha", hoy);
      const elegida = elegirCitaParaConfirmar({ citas: (filas || []).map((c) => ({ ...c, estadoCobro: c.estado_cobro })), hoy, fecha });
      cita = elegida ? (filas || []).find((c) => c.id === elegida.id) : null;
    }
    if (!cita) return fallo("No hay ninguna cita próxima de esa clienta que confirmar.", 404);

    // ---- anotar ----
    const por = "WhatsApp (IA de GHL)";
    const pendiente = estado === "pendiente";
    const cambios = { confirmacion: estado, confirmacion_por: pendiente ? null : por, confirmacion_en: pendiente ? null : new Date().toISOString() };
    const { error } = await supabase.from("citas").update(cambios).eq("id", cita.id);
    if (error) return fallo(`No se pudo guardar (${error.message}). ¿Has pegado el esquema nuevo en Supabase?`, 500);
    const hora = `${String(Math.floor(cita.inicio / 60)).padStart(2, "0")}:${String(cita.inicio % 60).padStart(2, "0")}`;
    await registrarActividad([{ usuario_id: null, usuario_nombre: por, origen: "ghl", entidad: "cita", entidad_id: cita.id, cliente_id: cita.cliente_id || null, accion: "confirmar", resumen: `Marcó «${ESTADOS_CONFIRMACION[estado].texto.toLowerCase()}» en la cita de ${cita.clienta} (${cita.fecha} a las ${hora})`, detalle: { antes: { confirmacion: cita.confirmacion || "pendiente" }, despues: cambios, appointmentId: appointmentId || null, contactId: contactId || null } }]);
    return respuesta({ ok: true, citaId: cita.id, clienta: cita.clienta, fecha: cita.fecha, hora, estado });
  } catch (err) {
    console.error("GHL confirmacion:", err);
    return fallo(err.message || "No se pudo anotar la confirmación.", 500);
  }
}
