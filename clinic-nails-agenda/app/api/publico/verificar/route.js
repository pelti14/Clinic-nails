import { limites, ipDe, demasiado, falloGeneral, responder, leerJson, supabase } from "../../../../lib/publicoRutas";
import { verificarCodigo } from "../../../../lib/publicoReservas";
import { normalizarEmail } from "../../../../lib/reservaOnline";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const b = await leerJson(request);
    const a = limites.verificarIp.permitir(ipDe(request)); if (!a.ok) return demasiado(a);
    const e = limites.verificarEmail.permitir(normalizarEmail(b.email) || "sin-email"); if (!e.ok) return demasiado(e);
    const r = await verificarCodigo(supabase, { email: b.email, codigo: String(b.codigo || "") });
    // «Mantenerme conectada en este dispositivo»: además del pase de la página, la cookie del servidor (así no pide otro código)
    return responder(r, { cookie: r.ok && b.recordar === true ? r.token : null });
  } catch (e) { return falloGeneral(e, "verificar"); }
}
