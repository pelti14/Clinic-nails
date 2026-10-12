// SOLO SERVIDOR. Deja en el contacto de GHL el enlace para cambiar o cancelar su PRÓXIMA cita (campo «Enlace cita»), para usarlo en tus
// automatizaciones con {{contact.enlace_cita}}. Si la clienta no tiene ninguna cita próxima, el campo se vacía. Todo es «mejor esfuerzo»:
// si falta el campo o GHL falla, la cita no se ve afectada.
import { configurado, listarCamposPersonalizadosGHL, escribirCampoContactoGHL } from "./ghl";
import { campoEnlaceCita } from "./ghlEnlaceCampo";
import { enlaceDeCita } from "./enlaceCita";
import { fechaYMinutosMadrid } from "./agenda";

export async function actualizarEnlaceCitaGHL({ supabase, clienteId, baseUrl, ahoraMs = Date.now(), definiciones = null }) {
  if (!configurado() || !clienteId || !baseUrl) return { ok: true, omitido: true };
  const { data: cl } = await supabase.from("clientes").select("*").eq("id", clienteId);
  const contactId = (cl && cl[0] && cl[0].ghl_contact_id) || "";
  if (!contactId) return { ok: true, omitido: true };
  const campo = campoEnlaceCita(definiciones || (await listarCamposPersonalizadosGHL()));
  if (!campo) return { ok: true, faltaCampo: true };
  const hoy = fechaYMinutosMadrid(ahoraMs).fecha;
  const { data: citas } = await supabase.from("citas").select("*").eq("cliente_id", clienteId);
  const proxima = (citas || []).filter((c) => c.fecha >= hoy && c.asistencia !== "cancelada" && c.estado_cobro !== "cobrada").sort((a, b) => (a.fecha === b.fecha ? a.inicio - b.inicio : a.fecha < b.fecha ? -1 : 1))[0];
  const enlace = proxima ? enlaceDeCita(baseUrl, proxima.id) : "";
  await escribirCampoContactoGHL(contactId, campo.id, enlace);
  return { ok: true, enlace };
}
