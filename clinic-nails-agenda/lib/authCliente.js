// NAVEGADOR. Acceso a la app: el código se comprueba en el servidor, que devuelve
// una cookie de sesión que el JavaScript de la página no puede leer.

async function pedir(url, opciones = {}) {
  try {
    const res = await fetch(url, { credentials: "same-origin", ...opciones });
    const json = await res.json().catch(() => ({}));
    return { ...json, status: res.status, ok: Boolean(res.ok && json.ok !== false) };
  } catch (e) {
    return { ok: false, error: "No hay conexión con el servidor.", status: 0 };
  }
}

const post = (url, cuerpo) => pedir(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo || {}) });

export const iniciarSesion = (codigo) => post("/api/auth/login", { codigo });
export const sesionActual = () => pedir("/api/auth/yo");
// Al ABRIR la app siempre se pide el código: no se retoma ninguna sesión anterior (y se borra la cookie que hubiera)
export async function sesionInicial() {
  await cerrarSesion();
  return { ok: false };
}
export function cerrarSesion() {
  return post("/api/auth/logout");
}
export const verificarPin = (codigo, empleadaId) => post("/api/auth/verificar-pin", { codigo, empleadaId });
export const cerrarTodasLasSesiones = () => post("/api/auth/cerrar-todas");
export const estadoSeguridad = () => pedir("/api/seguridad/estado");
