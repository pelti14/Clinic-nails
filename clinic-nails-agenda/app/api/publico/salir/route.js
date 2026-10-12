import { limites, ipDe, demasiado, falloGeneral, responder, leerJson, supabase, tokenDe } from "../../../../lib/publicoRutas";
import { salirPublico } from "../../../../lib/publicoReservas";
export const dynamic = "force-dynamic";

// «No soy yo»: borra el pase de este móvil (y su cookie)
export async function POST(request) {
  try {
    const l = limites.pase.permitir(ipDe(request)); if (!l.ok) return demasiado(l);
    const b = await leerJson(request);
    return responder(await salirPublico(supabase, tokenDe(request, b)), { cookie: "borrar" });
  } catch (e) { return falloGeneral(e, "salir"); }
}
