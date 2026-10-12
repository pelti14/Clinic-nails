import { NextResponse } from "next/server";
import { verificarUsuario } from "../../../../lib/auth";
import { configurado, listarCalendarios, configActual } from "../../../../lib/ghl";
import { cargarConfigGHL } from "../../../../lib/configServidor";

// Siempre en vivo: nunca servir una respuesta guardada de antes.
export const dynamic = "force-dynamic";

export async function GET(request) {
  const auth = await verificarUsuario(request, { soloAdmin: true });
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  const cfg = await cargarConfigGHL();
  if (!configurado()) {
    return NextResponse.json({
      ok: false,
      configurado: false,
      motivo: "Falta la clave o el Location ID de GHL (Configuración → Conexiones)",
    });
  }
  try {
    const calendarios = await listarCalendarios();
    return NextResponse.json({
      ok: true,
      configurado: true,
      calendarioGeneral: configActual().calendarId,
      origenClave: cfg.origenClave,
      calendarios,
    });
  } catch (err) {
    console.error("GHL diagnostico:", err);
    return NextResponse.json({ ok: false, configurado: true, error: err.message }, { status: 500 });
  }
}
