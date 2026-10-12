// SOLO SERVIDOR. Cliente de Supabase con la clave "service_role", que se salta
// las reglas de acceso. Sirve para guardar secretos (como la clave de GHL) en
// una tabla que la clave pública NO puede leer. Nunca se importa desde el
// navegador, y la variable no empieza por NEXT_PUBLIC_ para que no se
// incluya jamás en el código que se descarga el navegador.
import { createClient } from "@supabase/supabase-js";

export function hayServiceRole() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function supabaseAdmin() {
  if (!hayServiceRole()) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
