import { limites, ipDe, demasiado, falloGeneral, contexto, responder, leerJson, supabase, sincronizar, baseUrlDe, tokenDe } from "../../../../lib/publicoRutas";
import { cancelarPublico } from "../../../../lib/publicoReservas";
export const dynamic = "force-dynamic";

// Con el pase (cuerpo o cookie) + el id de la cita, o con el enlace firmado de esa cita
export async function POST(request) {
  try {
    const l = limites.pase.permitir(ipDe(request)); if (!l.ok) return demasiado(l);
    const b = await leerJson(request);
    const ctx = await contexto(); const base = baseUrlDe(request, ctx);
    return responder(await cancelarPublico(ctx, supabase, { token: tokenDe(request, b), citaId: b.citaId, codigo: typeof b.codigo === "string" ? b.codigo : "" }, { sincronizar: (id) => sincronizar(id, base) }));
  } catch (e) { return falloGeneral(e, "cancelar"); }
}
