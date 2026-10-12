import { limites, ipDe, demasiado, falloGeneral, contexto, responder, leerJson, supabase, sincronizar, baseUrlDe, tokenDe } from "../../../../lib/publicoRutas";
import { modificarPublico } from "../../../../lib/publicoReservas";
export const dynamic = "force-dynamic";

// Cambia una cita de día, de hora o de profesional (con el pase o con el enlace de la cita)
export async function POST(request) {
  try {
    const l = limites.pase.permitir(ipDe(request)); if (!l.ok) return demasiado(l);
    const b = await leerJson(request);
    const ctx = await contexto(); const base = baseUrlDe(request, ctx);
    return responder(await modificarPublico(ctx, supabase, { token: tokenDe(request, b), citaId: b.citaId, codigo: typeof b.codigo === "string" ? b.codigo : "", fecha: b.fecha, inicio: b.inicio, empleadaId: b.empleadaId ? String(b.empleadaId) : null }, { sincronizar: (id) => sincronizar(id, base) }));
  } catch (e) { return falloGeneral(e, "modificar"); }
}
