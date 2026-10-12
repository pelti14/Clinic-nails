import { limites, ipDe, demasiado, falloGeneral, contexto, responder, leerJson, supabase, tokenDe } from "../../../../lib/publicoRutas";
import { misCitasPublico } from "../../../../lib/publicoReservas";
export const dynamic = "force-dynamic";

// El pase puede venir en el cuerpo (guardado en la página) o en la cookie del servidor
export async function POST(request) {
  try {
    const l = limites.pase.permitir(ipDe(request)); if (!l.ok) return demasiado(l);
    const b = await leerJson(request);
    return responder(await misCitasPublico(await contexto(), supabase, tokenDe(request, b)));
  } catch (e) { return falloGeneral(e, "mis-citas"); }
}
