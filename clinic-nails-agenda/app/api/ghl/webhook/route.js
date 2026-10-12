import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { supabase } from "../../../../lib/servidorDb";
import { cargarConfigGHL } from "../../../../lib/configServidor";
import { importarConBloqueo } from "../../../../lib/importarGHL";

export const dynamic = "force-dynamic";

function igual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

// Aviso instantáneo desde un Workflow de GHL ("Customer Booked Appointment" →
// acción "Webhook" a esta dirección con ?token=...). No usa el contenido del
// aviso: simplemente dispara la misma importación segura.
export async function POST(request) {
  try {
    const token = new URL(request.url).searchParams.get("token") || "";
    const { data } = await supabase.from("ajustes").select("valor").eq("clave", "webhook").maybeSingle();
    const esperado = data?.valor?.token || "";
    if (!esperado || !igual(token, esperado)) {
      return NextResponse.json({ ok: false, error: "Token no válido" }, { status: 401 });
    }

    await cargarConfigGHL();
    const r = await importarConBloqueo({ dias: 60 });
    return NextResponse.json({ ok: r.ok, importadas: r.importadas?.length || 0, errores: r.errores || [] });
  } catch (err) {
    console.error("GHL webhook:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, mensaje: "Webhook de la agenda activo. Envía las avisos por POST con ?token=…" });
}
