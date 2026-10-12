import { limites, ipDe, demasiado, falloGeneral, contexto, responder, leerJson, supabase } from "../../../../lib/publicoRutas";
import { solicitarCodigo } from "../../../../lib/publicoReservas";
import { cargarConfigGHL } from "../../../../lib/configServidor";
import { configurado, upsertContacto, enviarEmailGHL } from "../../../../lib/ghl";
import { normalizarEmail } from "../../../../lib/reservaOnline";
export const dynamic = "force-dynamic";

// Pide un código de acceso por email. Siempre contesta lo mismo, exista o no ese email (así nadie puede averiguar quién es clienta).
export async function POST(request) {
  try {
    const b = await leerJson(request);
    const a = limites.codigoIp.permitir(ipDe(request)); if (!a.ok) return demasiado(a);
    const email = normalizarEmail(b.email);
    if (email) { const e = limites.codigoEmail.permitir(email); if (!e.ok) return demasiado(e); }
    const ctx = await contexto();
    const enviar = async ({ cliente, codigo }) => {
      await cargarConfigGHL();
      if (!configurado()) throw new Error("GHL no está configurado: no se puede enviar el email");
      const contactId = await upsertContacto({ nombre: cliente.nombre, telefono: cliente.telefono, email: cliente.email, favorito: cliente.favorito, ghlContactId: cliente.ghl_contact_id });
      if (!contactId) throw new Error("GHL no devolvió el contacto");
      if (contactId !== cliente.ghl_contact_id) await supabase.from("clientes").update({ ghl_contact_id: contactId }).eq("id", cliente.id);
      const negocio = ctx.negocio.replace(/[<>&]/g, "");
      const texto = `Tu código para entrar en ${negocio} es ${codigo}. Caduca en 10 minutos. Si no lo has pedido tú, ignora este mensaje.`;
      await enviarEmailGHL({ contactId, asunto: `${negocio}: tu código de acceso`, texto, html: `<p>Tu código para entrar en <strong>${negocio}</strong> es:</p><p style="font-size:28px;letter-spacing:6px"><strong>${codigo}</strong></p><p>Caduca en 10 minutos. Si no lo has pedido tú, ignora este mensaje.</p>` });
    };
    return responder(await solicitarCodigo(supabase, { email: b.email }, { enviar }));
  } catch (e) { return falloGeneral(e, "codigo"); }
}
