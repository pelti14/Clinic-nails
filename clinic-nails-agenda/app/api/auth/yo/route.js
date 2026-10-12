import { NextResponse } from "next/server";
import { obtenerUsuario } from "../../../../lib/servidor";

export const dynamic = "force-dynamic";

// ¿Hay una sesión válida? (así se recupera al recargar la página)
export async function GET(request) {
  try {
    const usuario = await obtenerUsuario(request);
    if (!usuario) return NextResponse.json({ ok: false }, { status: 401 });
    return NextResponse.json({ ok: true, usuario });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
