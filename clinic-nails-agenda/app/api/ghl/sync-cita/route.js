import { NextResponse } from "next/server";
import { verificarUsuario } from "../../../../lib/auth";
import { supabase } from "../../../../lib/servidorDb";
import { cargarConfigGHL } from "../../../../lib/configServidor";
import { configurado } from "../../../../lib/ghl";
import { sincronizarCitaGHL } from "../../../../lib/sincronizarCitaGHL";
import { baseUrlParaEnlaces } from "../../../../lib/baseUrl";

export const dynamic = "force-dynamic";

const fallo = (error, status = 500) => NextResponse.json({ ok: false, error }, { status });

export async function POST(request) {
  try {
    const auth = await verificarUsuario(request);
    if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    await cargarConfigGHL();
    if (!configurado()) {
      return NextResponse.json({ ok: false, skipped: true, motivo: "GHL no configurado" });
    }

    const { citaId } = await request.json();
    if (!citaId) return fallo("Falta citaId", 400);

    const { status, cuerpo } = await sincronizarCitaGHL(supabase, citaId, { baseUrl: await baseUrlParaEnlaces(request, supabase) });
    return NextResponse.json(cuerpo, { status });
  } catch (err) {
    console.error("GHL sync-cita:", err);
    return fallo(err.message);
  }
}
