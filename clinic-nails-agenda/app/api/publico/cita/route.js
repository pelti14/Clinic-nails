import { limites, ipDe, demasiado, falloGeneral, contexto, responder, leerJson, supabase } from "../../../../lib/publicoRutas";
import { citaPorCodigo } from "../../../../lib/publicoReservas";
export const dynamic = "force-dynamic";

// Lo que enseña la página del enlace de una cita: solo su fecha, hora, servicios y profesional (y el nombre de pila de la clienta)
export async function POST(request) {
  try {
    const l = limites.pase.permitir(ipDe(request)); if (!l.ok) return demasiado(l);
    const b = await leerJson(request);
    return responder(await citaPorCodigo(await contexto(), supabase, { codigo: typeof b.codigo === "string" ? b.codigo : "" }));
  } catch (e) { return falloGeneral(e, "cita"); }
}
