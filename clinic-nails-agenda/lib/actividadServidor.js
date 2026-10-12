// SOLO SERVIDOR. Escribe en el registro de actividad. Nunca lanza errores: un fallo al anotar
// no debe romper la acción de la empleada (pero queda en el log del servidor).
import { supabase } from "./servidorDb";

export async function registrarActividad(entradas) {
  if (!entradas || !entradas.length) return { ok: true };
  try {
    const filas = entradas.map((e, i) => ({ id: `act_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}_${i}`, ...e }));
    const { error } = await supabase.from("actividad").insert(filas);
    if (error) {
      console.error("actividad:", error.message);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    console.error("actividad:", err.message);
    return { ok: false, error: err.message };
  }
}
