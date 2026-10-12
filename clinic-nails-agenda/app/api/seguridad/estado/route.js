import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/servidorDb";
import { verificarUsuario } from "../../../../lib/auth";
import { hashCodigo, CODIGOS_DE_EJEMPLO, cifrarCodigosPendientes } from "../../../../lib/servidor";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const auth = await verificarUsuario(request, { soloAdmin: true });
    if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    await cifrarCodigosPendientes();
    const { data } = await supabase.from("empleadas").select("id, nombre, activa, codigo, codigo_hash");
    const comunes = new Map(CODIGOS_DE_EJEMPLO.map((c) => [hashCodigo(c), c]));
    const ejemplo = (data || []).filter((e) => e.activa && e.codigo_hash && comunes.has(e.codigo_hash)).map((e) => e.nombre);
    const sinCodigo = (data || []).filter((e) => e.activa && !e.codigo_hash).map((e) => e.nombre);
    return NextResponse.json({ ok: true, serviceRole: true, codigosDeEjemplo: ejemplo, sinCodigo, sinCifrar: (data || []).filter((e) => e.codigo).length });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
