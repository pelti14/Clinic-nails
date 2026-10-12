import { NextResponse } from "next/server";
import { verificarUsuario } from "../../../../lib/auth";
import { cargarConfigGHL } from "../../../../lib/configServidor";
import { importarConBloqueo } from "../../../../lib/importarGHL";
import { supabase } from "../../../../lib/servidorDb";
import { baseUrlParaEnlaces } from "../../../../lib/baseUrl";

export const dynamic = "force-dynamic";

// Trae a la agenda las citas creadas en GHL que todavía no existen aquí.
export async function POST(request) {
  try {
    const auth = await verificarUsuario(request);
    if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

    await cargarConfigGHL();
    const resultado = await importarConBloqueo({ dias: 60, baseUrl: await baseUrlParaEnlaces(request, supabase) });
    return NextResponse.json(resultado);
  } catch (err) {
    console.error("GHL importar:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
