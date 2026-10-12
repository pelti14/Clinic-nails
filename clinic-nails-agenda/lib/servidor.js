// SOLO SERVIDOR. Sesiones firmadas, cifrado de códigos, comprobación de origen
// y límite de intentos.
//
//  · La clave de firma y la de cifrado de códigos se DERIVAN de la clave de servicio
//    de Supabase (que solo conoce el servidor): no hay que configurar nada más.
//  · Los códigos de 5 dígitos se guardan como HMAC con esa clave secreta: aunque
//    alguien consiguiera la base de datos, no podría averiguar los códigos sin
//    la clave del servidor.
//  · La sesión viaja en una cookie HttpOnly + SameSite=Strict (+ Secure en https):
//    el JavaScript de la página no puede leerla ni otra web puede usarla.
import crypto from "crypto";
import { supabase } from "./servidorDb";

export const COOKIE = "cnb_sesion";
export const DURACION_S = 12 * 3600;

function clave() {
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!k) throw new Error("Falta la variable SUPABASE_SERVICE_ROLE_KEY en el hosting.");
  return crypto.createHmac("sha256", k).update("clinic-nails/v1").digest();
}

export const hashCodigo = (codigo) => crypto.createHmac("sha256", clave()).update("codigo:" + String(codigo)).digest("hex");

const firmaDe = (cuerpo) => crypto.createHmac("sha256", clave()).update("sesion:" + cuerpo).digest("base64url");

export function firmarSesion(datos) {
  const cuerpo = Buffer.from(JSON.stringify(datos)).toString("base64url");
  return `${cuerpo}.${firmaDe(cuerpo)}`;
}

export function leerToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const [cuerpo, firma] = token.split(".");
  const esperada = firmaDe(cuerpo);
  const a = Buffer.from(firma || "");
  const b = Buffer.from(esperada);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const datos = JSON.parse(Buffer.from(cuerpo, "base64url").toString("utf8"));
    if (!datos.exp || datos.exp < Date.now()) return null;
    return datos;
  } catch (e) {
    return null;
  }
}

export function leerCookie(request, nombre = COOKIE) {
  const h = request.headers.get("cookie") || "";
  for (const parte of h.split(";")) {
    const [k, ...v] = parte.trim().split("=");
    if (k === nombre) return decodeURIComponent(v.join("="));
  }
  return "";
}

const esHttps = (request) => {
  const proto = request.headers.get("x-forwarded-proto");
  if (proto) return proto.split(",")[0].trim() === "https";
  try {
    return new URL(request.url).protocol === "https:";
  } catch (e) {
    return false;
  }
};

export const cookieSesion = (token, request) => `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${DURACION_S}${esHttps(request) ? "; Secure" : ""}`;
export const cookieBorrar = (request) => `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${esHttps(request) ? "; Secure" : ""}`;

// "Cerrar sesión en todos los dispositivos": se cambia este número y todas las sesiones anteriores dejan de valer
export async function epochActual() {
  const { data } = await supabase.from("ajustes_privados").select("valor").eq("clave", "sesion_epoch").maybeSingle();
  return data?.valor || "0";
}
export async function subirEpoch() {
  const nuevo = String(Date.now());
  await supabase.from("ajustes_privados").upsert({ clave: "sesion_epoch", valor: nuevo, updated_at: new Date().toISOString() });
  return nuevo;
}

export async function crearSesion(usuarioId) {
  return firmarSesion({ id: usuarioId, ep: await epochActual(), exp: Date.now() + DURACION_S * 1000 });
}

// La persona de la sesión (datos frescos de la base: si se le quita un permiso, deja de tenerlo al instante)
export async function obtenerUsuario(request) {
  let datos = null;
  try {
    datos = leerToken(leerCookie(request));
  } catch (e) {
    return null;
  }
  if (!datos) return null;
  if (datos.ep !== (await epochActual())) return null;
  const { data } = await supabase.from("empleadas").select("id, nombre, rol, activa, permisos").eq("id", datos.id).maybeSingle();
  if (!data || !data.activa) return null;
  return { id: data.id, nombre: data.nombre, rol: data.rol || "empleada", permisos: data.permisos || {} };
}

// Una web ajena no puede hacer peticiones en tu nombre: el origen debe ser esta misma web
export function origenValido(request) {
  const origen = request.headers.get("origin");
  if (!origen) return true;
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  try {
    return new URL(origen).host === host;
  } catch (e) {
    return false;
  }
}

// ---- Límite de intentos (en memoria) ----
const fallos = new Map();
const VENTANA_MS = 10 * 60 * 1000;
export const ipDe = (request) => (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || request.headers.get("x-real-ip") || "desconocida";
export function bloqueado(clave, max) {
  const r = fallos.get(clave);
  return Boolean(r && r.hasta > Date.now() && r.n >= max);
}
export function registrarFallo(clave) {
  const ahora = Date.now();
  const r = fallos.get(clave);
  if (!r || r.hasta < ahora) fallos.set(clave, { n: 1, hasta: ahora + VENTANA_MS });
  else r.n += 1;
}
export const limpiarFallos = (clave) => fallos.delete(clave);

// Códigos típicos que conviene cambiar
export const CODIGOS_DE_EJEMPLO = ["00000", "11111", "22222", "33333", "44444", "55555", "66666", "77777", "88888", "99999", "12345", "54321", "01234", "12121", "00001", "00123"];

// Cifra los códigos que aún estén en claro (de versiones anteriores) y borra el original
export async function cifrarCodigosPendientes() {
  const { data } = await supabase.from("empleadas").select("id, codigo");
  let n = 0;
  for (const e of data || []) {
    if (!e.codigo) continue;
    const { error } = await supabase.from("empleadas").update({ codigo_hash: hashCodigo(e.codigo), codigo: null }).eq("id", e.id);
    if (!error) n++;
  }
  return n;
}
