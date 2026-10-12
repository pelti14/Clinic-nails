import { NextResponse } from "next/server";
import { verificarUsuario } from "../../../../lib/auth";
import { supabase } from "../../../../lib/servidorDb";
import { cargarConfigGHL } from "../../../../lib/configServidor";
import { configurado, obtenerCitaGHL, obtenerContacto, listarCamposPersonalizadosGHL } from "../../../../lib/ghl";
import { campoServicio, valorCampoServicio } from "../../../../lib/ghlServicioCampo";

export const dynamic = "force-dynamic";

// «Mirar ahora en GHL» (Por revisar): qué tiene escrito AHORA MISMO el contacto de esa reserva en el campo «Servicio». Sirve para saber si
// el bot de IA no lo está rellenando (vacío) o lo rellena con un texto que no coincide con ningún servicio.
export async function POST(request) {
  try {
    const auth = await verificarUsuario(request);
    if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    await cargarConfigGHL();
    if (!configurado()) return NextResponse.json({ ok: false, error: "GHL no está conectado (Configuración → Conexiones)." });
    const { citaId } = await request.json().catch(() => ({}));
    if (!citaId) return NextResponse.json({ ok: false, error: "Falta la cita." }, { status: 400 });
    const { data: cita } = await supabase.from("citas").select("id, ghl_event_id, cliente_id").eq("id", citaId).maybeSingle();
    if (!cita) return NextResponse.json({ ok: false, error: "No encuentro esa cita." }, { status: 404 });

    let definiciones = [];
    try { definiciones = await listarCamposPersonalizadosGHL(); } catch (e) {
      return NextResponse.json({ ok: true, sinPermiso: true, mensaje: `No puedo leer los campos de contacto de GHL (${e.message}). Activa el permiso «locations/customFields.readonly» de tu clave.` });
    }
    const def = campoServicio(definiciones);
    if (!def) return NextResponse.json({ ok: true, sinCampo: true, campos: definiciones.map((d) => d.name).filter(Boolean).slice(0, 40) });

    // El contacto: el de la ficha de la clienta o, si no lo tiene, el de la propia cita en GHL
    let contactId = "";
    if (cita.cliente_id) { const { data: cli } = await supabase.from("clientes").select("ghl_contact_id").eq("id", cita.cliente_id).maybeSingle(); contactId = cli?.ghl_contact_id || ""; }
    if (!contactId && cita.ghl_event_id) { try { contactId = (await obtenerCitaGHL(cita.ghl_event_id))?.contactId || ""; } catch (e) { /* sin cita en GHL */ } }
    if (!contactId) return NextResponse.json({ ok: true, sinContacto: true, campo: { nombre: def.name, clave: def.fieldKey, tipo: def.dataType } });

    const contacto = await obtenerContacto(contactId);
    return NextResponse.json({ ok: true, campo: { nombre: def.name, clave: def.fieldKey, tipo: def.dataType }, valor: valorCampoServicio(contacto, definiciones) });
  } catch (err) {
    console.error("GHL campo-servicio:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
