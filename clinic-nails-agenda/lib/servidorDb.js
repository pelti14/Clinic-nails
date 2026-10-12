// SOLO SERVIDOR. Acceso a la base de datos con la clave de servicio (se salta
// las reglas públicas). Todo el código del servidor usa ESTE módulo, nunca la
// clave pública.
import { supabaseAdmin } from "./supabaseAdmin";

let cliente = null;

export const supabase = {
  from(...args) {
    if (!cliente) cliente = supabaseAdmin();
    if (!cliente) throw new Error("Falta la variable SUPABASE_SERVICE_ROLE_KEY en el hosting (Supabase → Project Settings → API → service_role).");
    return cliente.from(...args);
  },
  get storage() {
    if (!cliente) cliente = supabaseAdmin();
    if (!cliente) throw new Error("Falta la variable SUPABASE_SERVICE_ROLE_KEY en el hosting.");
    return cliente.storage;
  },
};
