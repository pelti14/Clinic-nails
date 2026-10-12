import { limites, ipDe, demasiado, falloGeneral, contexto, responder, leerJson, supabase, sincronizar, baseUrlDe } from "../../../../lib/publicoRutas";
import { reservarPublico } from "../../../../lib/publicoReservas";
import { telefonoClave } from "../../../../lib/agenda";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const b = await leerJson(request);
    const a = limites.reservarIp.permitir(ipDe(request)); if (!a.ok) return demasiado(a);
    const t = limites.reservarTel.permitir(telefonoClave(b.telefono) || "sin-telefono"); if (!t.ok) return demasiado(t);
    const ctx = await contexto();
    const base = baseUrlDe(request, ctx);
    const r = await reservarPublico(ctx, supabase, {
      servicioIds: b.servicioIds, empleadaId: b.empleadaId ? String(b.empleadaId) : null, fecha: b.fecha, inicio: b.inicio,
      nombre: b.nombre, telefono: b.telefono, email: b.email, consentimiento: b.consentimiento === true, web: b.web, recordar: b.recordar === true,
    }, { sincronizar: (id) => sincronizar(id, base), baseUrl: base });
    return responder(r, { cookie: r.ok ? r.token : null });
  } catch (e) { return falloGeneral(e, "reservar"); }
}
