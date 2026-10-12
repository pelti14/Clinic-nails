import { NextResponse } from "next/server";
import { verificarUsuario } from "../../../../lib/auth";
import { configurado, eliminarCitaGHL, cambiarEstadoCitaGHL } from "../../../../lib/ghl";
import { cargarConfigGHL } from "../../../../lib/configServidor";

export const dynamic = "force-dynamic";

// Al borrar una cita de la agenda: 1.º se marca como CANCELADA en GHL (así se dispara su automatización de «cita cancelada»),
// 2.º se espera unos segundos (GHL necesita un momento para lanzarla) y 3.º se borra. Los horarios no disponibles se borran
// directamente (`cancelarAntes` falso): no tienen clienta a la que avisar. La espera se puede cambiar con GHL_ESPERA_CANCELAR_MS.
const esperar = (ms) => new Promise((ok) => setTimeout(ok, ms));
const ESPERA_POR_DEFECTO = 3000;

export async function POST(request) {
  try {
    const auth = await verificarUsuario(request);
    if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    await cargarConfigGHL();
    if (!configurado()) {
      return NextResponse.json({ ok: false, skipped: true, motivo: "GHL no configurado" });
    }

    const { ghlEventId, cancelarAntes } = await request.json();
    if (!ghlEventId) return NextResponse.json({ ok: true, skipped: true, motivo: "La cita no estaba en GHL" });

    let cancelada = false;
    let aviso = null;
    if (cancelarAntes) {
      try {
        await cambiarEstadoCitaGHL(ghlEventId, "cancelled");
        cancelada = true;
        const ms = Number(process.env.GHL_ESPERA_CANCELAR_MS ?? ESPERA_POR_DEFECTO);
        await esperar(Number.isFinite(ms) ? Math.min(Math.max(ms, 0), 10000) : ESPERA_POR_DEFECTO);
      } catch (err) {
        // si no se pudo marcar como cancelada (ya no existía, permisos…), se borra igualmente
        aviso = `No se pudo marcar la cita como cancelada en GHL (${err.message}): su automatización de cancelación no se habrá lanzado.`;
      }
    }
    await eliminarCitaGHL(ghlEventId);
    return NextResponse.json({ ok: true, cancelada, ...(aviso ? { aviso } : {}) });
  } catch (err) {
    console.error("GHL eliminar-cita:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
