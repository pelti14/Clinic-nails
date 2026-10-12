// SOLO SERVIDOR. Piezas comunes de las rutas públicas /api/publico/*: responder, límites contra abusos y envío a GHL.
import { NextResponse } from "next/server";
import { supabase } from "./servidorDb";
import { cargarConfigGHL } from "./configServidor";
import { configurado } from "./ghl";
import { sincronizarCitaGHL } from "./sincronizarCitaGHL";
import { cargarContexto } from "./publicoReservas";
import { crearLimitador } from "./reservaOnline";
import { baseDeLaPeticion } from "./enlaceCita";

export const limites = {
  consultar: crearLimitador({ max: 240, ventanaMs: 10 * 60000 }), // catálogo y huecos, por IP
  reservarIp: crearLimitador({ max: 8, ventanaMs: 60 * 60000 }),
  reservarTel: crearLimitador({ max: 5, ventanaMs: 60 * 60000 }),
  codigoIp: crearLimitador({ max: 10, ventanaMs: 60 * 60000 }),
  codigoEmail: crearLimitador({ max: 3, ventanaMs: 10 * 60000 }),
  verificarIp: crearLimitador({ max: 30, ventanaMs: 60 * 60000 }),
  verificarEmail: crearLimitador({ max: 10, ventanaMs: 60 * 60000 }),
  pase: crearLimitador({ max: 60, ventanaMs: 10 * 60000 }),
};
export const ipDe = (request) => String(request.headers?.get?.("x-forwarded-for") || request.headers?.get?.("x-real-ip") || "desconocida").split(",")[0].trim().slice(0, 64);
// Ninguna respuesta pública se guarda en memoria (ni en el navegador ni en la red del hosting): si no, activar las reservas podría tardar en verse
const SIN_CACHE = { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0", Pragma: "no-cache", Expires: "0", "CDN-Cache-Control": "no-store", "Surrogate-Control": "no-store" };
// El pase de la clienta también se guarda en una COOKIE del servidor (httpOnly: ni la página ni un anuncio ni un script pueden leerla). Así,
// aunque el móvil borre lo que guardan las páginas por su cuenta (Safari lo hace a los 7 días sin entrar), sigue reconociéndola sin pedir otro código.
export const NOMBRE_COOKIE = "cnb_pase";
const OPCIONES_COOKIE = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" };
export const leerCookiePase = (request) => { const m = new RegExp(`(?:^|;\\s*)${NOMBRE_COOKIE}=([a-f0-9]{64})(?:;|$)`).exec(String(request?.headers?.get?.("cookie") || "")); return m ? m[1] : ""; };
export const tokenDe = (request, cuerpo) => (typeof cuerpo?.token === "string" && cuerpo.token) || leerCookiePase(request);
// `cookie`: un pase (se guarda), «borrar» (se quita) o nada
export const responder = (r, { cookie } = {}) => {
  const { status = 200, ...cuerpo } = r;
  const resp = NextResponse.json(cuerpo, { status: r.ok === false ? status : 200, headers: SIN_CACHE });
  if (r.ok !== false && cookie === "borrar") resp.cookies.set(NOMBRE_COOKIE, "", { ...OPCIONES_COOKIE, maxAge: 0 });
  else if (r.ok !== false && cookie) resp.cookies.set(NOMBRE_COOKIE, cookie, { ...OPCIONES_COOKIE, maxAge: 400 * 86400 });
  return resp;
};
export const baseUrlDe = (request, ctx) => baseDeLaPeticion(request?.headers, ctx?.reservas?.dominioPublico);
export const demasiado = (l) => NextResponse.json({ ok: false, error: `Demasiados intentos. Espera ${Math.max(1, Math.ceil((l.reintentarEnMs || 60000) / 60000))} min y vuelve a probar.` }, { status: 429, headers: SIN_CACHE });
export const leerJson = async (request) => { try { const j = await request.json(); return j && typeof j === "object" ? j : {}; } catch (e) { return {}; } };
export const falloGeneral = (e, donde) => { console.error(`publico ${donde}:`, e); return NextResponse.json({ ok: false, error: "No se ha podido completar. Inténtalo de nuevo en un momento." }, { status: 500, headers: SIN_CACHE }); };
export const contexto = () => cargarContexto(supabase);
// Para avisar a GHL de una cita (y que salten tus automatizaciones): si GHL no está configurado, no pasa nada
export async function sincronizar(citaId, baseUrl = "") {
  await cargarConfigGHL();
  if (!configurado()) return { ok: true, skipped: true };
  return (await sincronizarCitaGHL(supabase, citaId, { baseUrl })).cuerpo;
}
export { supabase };
