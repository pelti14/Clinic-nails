// SOLO SERVIDOR. La dirección pública de la web para los enlaces de las citas: la que hayas puesto en Ajustes → Reservas online (si usas un
// subdominio) o, si no, la de la propia petición.
import { baseDeLaPeticion } from "./enlaceCita";
import { normalizarAjustesReservas } from "./reservaOnline";

export async function baseUrlParaEnlaces(request, supabase) {
  let dominio = "";
  try {
    const { data } = await supabase.from("ajustes").select("valor").eq("clave", "reservas");
    dominio = normalizarAjustesReservas((data || [])[0]?.valor).dominioPublico;
  } catch (e) { dominio = ""; }
  return baseDeLaPeticion(request?.headers, dominio);
}
