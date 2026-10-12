import { limites, ipDe, demasiado, falloGeneral, contexto, responder, leerJson, supabase, tokenDe } from "../../../../lib/publicoRutas";
import { huecosPublicos, huecosParaCambio } from "../../../../lib/publicoReservas";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const l = limites.consultar.permitir(ipDe(request)); if (!l.ok) return demasiado(l);
    const b = await leerJson(request);
    const ctx = await contexto();
    const empleadaId = b.empleadaId ? String(b.empleadaId) : null;
    // Huecos para CAMBIAR una cita ya reservada (con el pase o el enlace de esa cita): el hueco que ocupa ahora también cuenta como libre
    if (b.cambio && typeof b.cambio === "object") return responder(await huecosParaCambio(ctx, supabase, { token: tokenDe(request, b.cambio), citaId: b.cambio.citaId, codigo: typeof b.cambio.codigo === "string" ? b.cambio.codigo : "", fecha: b.fecha, empleadaId }));
    return responder(await huecosPublicos(ctx, supabase, { servicioIds: b.servicioIds, fecha: b.fecha, empleadaId }));
  } catch (e) { return falloGeneral(e, "huecos"); }
}
