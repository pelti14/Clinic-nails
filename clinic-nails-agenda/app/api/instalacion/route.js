import { NextResponse } from "next/server";
import { verificarUsuario } from "../../../lib/auth";
import { supabase } from "../../../lib/servidorDb";
import { hashCodigo } from "../../../lib/servidor";
import { registrarActividad } from "../../../lib/actividadServidor";
import { estadoInstalacion, completarInstalacion } from "../../../lib/instalacion";

export const dynamic = "force-dynamic";

// ¿Falta la «Primera configuración»? (solo se le pregunta al administrador, y solo en una instalación nueva)
export async function GET(request) {
  try {
    const auth = await verificarUsuario(request, { soloAdmin: true });
    if (!auth.ok) return NextResponse.json({ ok: true, pendiente: false });
    const est = await estadoInstalacion(supabase);
    return NextResponse.json({ ok: true, pendiente: est.pendiente, usuario: { nombre: auth.usuario.nombre } });
  } catch (err) {
    console.error("instalacion:", err);
    return NextResponse.json({ ok: true, pendiente: false });
  }
}

export async function POST(request) {
  try {
    const auth = await verificarUsuario(request, { soloAdmin: true });
    if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    const cuerpo = await request.json().catch(() => ({}));
    const r = await completarInstalacion(supabase, auth.usuario, cuerpo, { hashCodigo });
    if (!r.ok) return NextResponse.json(r, { status: r.status || 400 });
    await registrarActividad([{ usuario_id: auth.usuario.id, usuario_nombre: r.admin, origen: "app", entidad: "ajustes", entidad_id: "instalacion", accion: "editar", resumen: `Primera configuración hecha: «${r.negocio}»${cuerpo.borrarEjemplos ? " (datos de ejemplo borrados)" : ""}`, detalle: {} }]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("instalacion:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
