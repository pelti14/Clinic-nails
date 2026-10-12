import { NextResponse } from "next/server";
import { verificarUsuario } from "../../../../lib/auth";
import { generarCursoConIA, MODELO_POR_DEFECTO } from "../../../../lib/cursoIA";
import { crearLimitador } from "../../../../lib/reservaOnline";

export const dynamic = "force-dynamic";
export const maxDuration = 120; // escribir una clase con su test tarda entre 20 y 60 segundos

// Como mucho 12 clases por hora (cada una cuesta dinero en la cuenta de la IA)
const limite = crearLimitador({ max: 12, ventanaMs: 60 * 60000 });
const SIN_CACHE = { "Cache-Control": "no-store" };

// Crea una clase con su test con IA. Solo el administrador. La clave de la IA vive en el servidor (ANTHROPIC_API_KEY) y no sale nunca de aquí.
export async function POST(request) {
  try {
    const auth = await verificarUsuario(request);
    if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status, headers: SIN_CACHE });
    if (auth.usuario.rol !== "admin") return NextResponse.json({ ok: false, error: "Solo el administrador puede crear clases con IA." }, { status: 403, headers: SIN_CACHE });
    const l = limite.permitir(auth.usuario.id);
    if (!l.ok) return NextResponse.json({ ok: false, error: `Has creado muchas clases en poco tiempo. Espera ${Math.max(1, Math.ceil(l.reintentarEnMs / 60000))} min.` }, { status: 429, headers: SIN_CACHE });
    let cuerpo = {};
    try { cuerpo = await request.json(); } catch (e) { cuerpo = {}; }
    const r = await generarCursoConIA(cuerpo || {}, { apiKey: process.env.ANTHROPIC_API_KEY, modelo: process.env.ANTHROPIC_MODEL || MODELO_POR_DEFECTO });
    if (!r.ok) return NextResponse.json({ ok: false, error: r.error, ...(r.sinClave ? { sinClave: true } : {}) }, { status: r.sinClave ? 503 : r.status || 502, headers: SIN_CACHE });
    return NextResponse.json({ ok: true, curso: r.curso, modelo: r.modelo }, { headers: SIN_CACHE });
  } catch (e) {
    console.error("cursos/generar:", e);
    return NextResponse.json({ ok: false, error: "No se ha podido crear la clase. Vuelve a probar en un momento." }, { status: 500, headers: SIN_CACHE });
  }
}
