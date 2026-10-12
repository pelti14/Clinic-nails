import { NextResponse } from "next/server";
import { verificarUsuario } from "../../../../lib/auth";
import { subirEpoch, crearSesion, cookieSesion } from "../../../../lib/servidor";

export const dynamic = "force-dynamic";

// Cierra la sesión en TODOS los dispositivos (la de quien lo pide se renueva para que no se quede fuera).
export async function POST(request) {
  try {
    const auth = await verificarUsuario(request, { soloAdmin: true });
    if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    await subirEpoch();
    const respuesta = NextResponse.json({ ok: true });
    respuesta.headers.append("Set-Cookie", cookieSesion(await crearSesion(auth.usuario.id), request));
    return respuesta;
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
