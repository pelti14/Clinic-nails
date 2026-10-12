import { limites, ipDe, demasiado, falloGeneral, contexto, responder } from "../../../../lib/publicoRutas";
import { catalogoPublico } from "../../../../lib/publicoReservas";
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const l = limites.consultar.permitir(ipDe(request)); if (!l.ok) return demasiado(l);
    return responder(catalogoPublico(await contexto()));
  } catch (e) { return falloGeneral(e, "catalogo"); }
}
