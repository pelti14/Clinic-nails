import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { verificarUsuario } from "../../../../lib/auth";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export const dynamic = "force-dynamic";

// Solo el administrador. Devuelve la clave del enlace con el que GHL avisa de las confirmaciones por WhatsApp (la crea la primera vez)
// o, con { regenerar: true }, crea una nueva (el enlace anterior deja de funcionar).
export async function POST(request) {
  try {
    const auth = await verificarUsuario(request);
    if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    if (auth.usuario.rol !== "admin") return NextResponse.json({ ok: false, error: "Solo el administrador puede ver o cambiar esta clave." }, { status: 403 });
    const admin = supabaseAdmin();
    if (!admin) return NextResponse.json({ ok: false, error: "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor." }, { status: 500 });
    let regenerar = false;
    try { regenerar = Boolean((await request.json())?.regenerar); } catch (e) { regenerar = false; }
    const { data } = await admin.from("ajustes_privados").select("valor").eq("clave", "ghl_confirmacion_token").maybeSingle();
    if (data?.valor && !regenerar) return NextResponse.json({ ok: true, token: data.valor, nuevo: false });
    const token = randomBytes(24).toString("hex");
    const { error } = await admin.from("ajustes_privados").upsert({ clave: "ghl_confirmacion_token", valor: token, updated_at: new Date().toISOString() }, { onConflict: "clave" });
    if (error) return NextResponse.json({ ok: false, error: `No se pudo guardar la clave (${error.message}).` }, { status: 500 });
    return NextResponse.json({ ok: true, token, nuevo: true });
  } catch (err) {
    console.error("token-confirmacion:", err);
    return NextResponse.json({ ok: false, error: err.message || "No se pudo crear la clave." }, { status: 500 });
  }
}
