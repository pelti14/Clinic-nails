import { NextResponse } from "next/server";
import { verificarUsuario } from "../../../../lib/auth";
import { supabase } from "../../../../lib/servidorDb";
import { configurado, upsertContacto } from "../../../../lib/ghl";
import { cargarConfigGHL } from "../../../../lib/configServidor";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const auth = await verificarUsuario(request);
    if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    await cargarConfigGHL();
    if (!configurado()) {
      return NextResponse.json({ ok: false, skipped: true, motivo: "GHL no configurado" });
    }

    const { clienteId } = await request.json();
    if (!clienteId) return NextResponse.json({ ok: false, error: "Falta clienteId" }, { status: 400 });

    const { data: row, error } = await supabase.from("clientes").select("*").eq("id", clienteId).single();
    if (error || !row) return NextResponse.json({ ok: false, error: "Cliente no encontrado" }, { status: 404 });

    const cliente = {
      nombre: row.nombre,
      telefono: row.telefono,
      email: row.email,
      favorito: row.favorito,
      ghlContactId: row.ghl_contact_id,
    };

    const ghlContactId = await upsertContacto(cliente);

    if (ghlContactId && ghlContactId !== row.ghl_contact_id) {
      await supabase.from("clientes").update({ ghl_contact_id: ghlContactId }).eq("id", clienteId);
    }

    return NextResponse.json({ ok: true, ghlContactId });
  } catch (err) {
    console.error("GHL sync-cliente:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
