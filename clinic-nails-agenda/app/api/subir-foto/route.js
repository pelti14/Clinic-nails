import { NextResponse } from "next/server";
import { supabase } from "../../../lib/servidorDb";
import { verificarUsuario } from "../../../lib/auth";

export const dynamic = "force-dynamic";
const MAX_BYTES = 2 * 1024 * 1024;
const TIPOS = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };

// Subida de la foto de una empleada: solo imágenes, máximo 2 MB, y solo quien puede editar empleadas.
export async function POST(request) {
  try {
    const auth = await verificarUsuario(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const u = auth.usuario;
    if (!(u.rol === "admin" || u.permisos?.empleadas)) return NextResponse.json({ error: "No tienes permiso para esto." }, { status: 403 });

    const form = await request.formData();
    const archivo = form.get("archivo");
    const empleadaId = String(form.get("empleadaId") || "");
    if (!archivo || typeof archivo === "string" || !/^[A-Za-z0-9_-]{1,64}$/.test(empleadaId)) return NextResponse.json({ error: "Datos no válidos." }, { status: 400 });
    const extension = TIPOS[archivo.type];
    if (!extension) return NextResponse.json({ error: "Solo se admiten imágenes JPG, PNG, WEBP o GIF." }, { status: 400 });
    if (archivo.size > MAX_BYTES) return NextResponse.json({ error: "La foto pesa más de 2 MB." }, { status: 400 });

    // La foto del administrador solo la cambia el administrador
    const { data: objetivo } = await supabase.from("empleadas").select("rol").eq("id", empleadaId).maybeSingle();
    if (objetivo?.rol === "admin" && u.rol !== "admin") return NextResponse.json({ error: "El perfil de administrador solo lo puede modificar el administrador." }, { status: 403 });

    const ruta = `${empleadaId}-${Date.now()}.${extension}`;
    const { error } = await supabase.storage.from("avatars").upload(ruta, Buffer.from(await archivo.arrayBuffer()), { contentType: archivo.type, upsert: true, cacheControl: "3600" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const { data } = supabase.storage.from("avatars").getPublicUrl(ruta);
    return NextResponse.json({ ok: true, url: data.publicUrl });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
