import { NextResponse } from "next/server";
import { verificarUsuario } from "../../../lib/auth";
import { supabase } from "../../../lib/servidorDb";
import { baseUrlParaEnlaces } from "../../../lib/baseUrl";
import { enlaceDeCita } from "../../../lib/enlaceCita";

export const dynamic = "force-dynamic";
const fallo = (error, status) => NextResponse.json({ ok: false, error }, { status });

// El enlace para que una clienta cambie o cancele SU cita (para copiarlo y mandárselo por WhatsApp o para usarlo en una automatización)
export async function POST(request) {
  try {
    const auth = await verificarUsuario(request);
    if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    const u = auth.usuario;
    if (u.rol !== "admin" && !u.permisos?.agenda) return fallo("No tienes permiso para esto.", 403);
    let b = {};
    try { b = await request.json(); } catch (e) { b = {}; }
    const { data } = await supabase.from("citas").select("*").eq("id", String(b?.citaId || ""));
    if (!data || !data[0]) return fallo("No encontramos esa cita.", 404);
    const enlace = enlaceDeCita(await baseUrlParaEnlaces(request, supabase), data[0].id);
    if (!enlace) return fallo("No se puede crear el enlace: falta la clave secreta del servidor o la dirección de la web.", 503);
    return NextResponse.json({ ok: true, enlace });
  } catch (err) {
    console.error("enlace-cita:", err);
    return fallo("No se ha podido crear el enlace.", 500);
  }
}
