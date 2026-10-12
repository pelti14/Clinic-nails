// SOLO SERVIDOR. Carga la configuración de GoHighLevel y la entrega a lib/ghl.js.
// Prioridad: Ajustes guardados desde la app → variables de entorno.
//  · Location ID y calendario general: tabla `ajustes` (no son secretos).
//  · Clave de GHL: tabla `ajustes_privados` (solo legible con la clave de
//    servicio) y, si no hay, la variable GHL_API_KEY.
import { supabase } from "./servidorDb";
import { supabaseAdmin } from "./supabaseAdmin";
import { fijarConfig } from "./ghl";

export async function cargarConfigGHL() {
  let claveGuardada = "";
  try {
    const admin = supabaseAdmin();
    if (admin) {
      const { data } = await admin.from("ajustes_privados").select("valor").eq("clave", "ghl_api_key").maybeSingle();
      claveGuardada = data?.valor || "";
    }
  } catch (e) {
    // si no se puede leer, se usa la variable de entorno
  }

  let publicos = {};
  try {
    const { data } = await supabase.from("ajustes").select("valor").eq("clave", "ghl").maybeSingle();
    publicos = data?.valor || {};
  } catch (e) {
    // idem
  }

  const cfg = {
    apiKey: claveGuardada || process.env.GHL_API_KEY || "",
    locationId: publicos.locationId || process.env.GHL_LOCATION_ID || "",
    calendarId: publicos.calendarId || process.env.GHL_CALENDAR_ID || "",
  };
  fijarConfig(cfg);
  return { ...cfg, origenClave: claveGuardada ? "app" : process.env.GHL_API_KEY ? "entorno" : "ninguna" };
}
