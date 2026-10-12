import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Si faltan las variables de entorno, creamos un cliente "vacío" que no
// rompe el arranque de la app — la interfaz mostrará un aviso claro en vez
// de una pantalla en blanco. Rellena .env.local con tus claves reales.
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key"
);
