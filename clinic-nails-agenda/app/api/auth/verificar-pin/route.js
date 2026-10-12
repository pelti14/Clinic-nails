import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/servidorDb";
import { verificarUsuario } from "../../../../lib/auth";
import { esCodigoValido } from "../../../../lib/codigo";
import { hashCodigo, ipDe, bloqueado, registrarFallo, limpiarFallos, cifrarCodigosPendientes } from "../../../../lib/servidor";

export const dynamic = "force-dynamic";

// Confirma que el código tecleado es el de la empleada indicada (por ejemplo, para fichar).
export async function POST(request) {
  try {
    const auth = await verificarUsuario(request);
    if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    const clave = `pin:${ipDe(request)}`;
    if (bloqueado(clave, 8)) return NextResponse.json({ ok: false, error: "Demasiados intentos. Espera unos minutos." }, { status: 429 });

    const { codigo, empleadaId } = await request.json();
    if (!esCodigoValido(codigo) || !empleadaId) {
      registrarFallo(clave);
      return NextResponse.json({ ok: false });
    }
    await cifrarCodigosPendientes();
    const { data } = await supabase.from("empleadas").select("id, activa, codigo_hash").eq("id", empleadaId).maybeSingle();
    const bien = Boolean(data && data.activa && data.codigo_hash && data.codigo_hash === hashCodigo(codigo));
    if (bien) limpiarFallos(clave);
    else registrarFallo(clave);
    return NextResponse.json({ ok: bien });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
