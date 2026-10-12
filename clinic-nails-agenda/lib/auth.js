// SOLO SERVIDOR. Comprueba la sesión (cookie firmada) de quien llama a una ruta.
import { obtenerUsuario, origenValido } from "./servidor";

export async function verificarUsuario(request, { soloAdmin = false } = {}) {
  const mutacion = !["GET", "HEAD"].includes(request.method || "POST");
  if (mutacion && !origenValido(request)) return { ok: false, status: 403, error: "Origen no permitido." };
  const usuario = await obtenerUsuario(request);
  if (!usuario) return { ok: false, status: 401, error: "Sesión caducada. Vuelve a entrar con tu código." };
  if (soloAdmin && usuario.rol !== "admin") return { ok: false, status: 403, error: "Solo un administrador puede hacer esto." };
  return { ok: true, usuario };
}
