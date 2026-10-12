// SOLO SERVIDOR. El enlace de cada cita para que la clienta la CAMBIE o la CANCELE sin tener que entrar con nada (se lo puedes mandar desde
// una automatización de GHL). Es un enlace firmado: lleva el id de la cita y una firma que solo el servidor sabe calcular, así que no se puede
// adivinar ni sacar el de otra cita. No se guarda nada en la base de datos (se vuelve a calcular cuando hace falta).
import { createHmac, timingSafeEqual } from "crypto";

const secreto = () => process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const firma = (id) => createHmac("sha256", secreto()).update(`gestion:${id}`).digest("hex").slice(0, 32);
const ID_VALIDO = /^[A-Za-z0-9_-]{6,64}$/;

export const codigoDeCita = (id) => (secreto() && ID_VALIDO.test(String(id || "")) ? `${id}.${firma(id)}` : "");
// Devuelve el id de la cita si el código es auténtico; si no, null
export function citaIdDeCodigo(codigo) {
  const m = /^([A-Za-z0-9_-]{6,64})\.([a-f0-9]{32})$/.exec(String(codigo || ""));
  if (!m || !secreto()) return null;
  const a = Buffer.from(m[2]), b = Buffer.from(firma(m[1]));
  return a.length === b.length && timingSafeEqual(a, b) ? m[1] : null;
}
export const enlaceDeCita = (base, id) => { const c = codigoDeCita(id); return c && base ? `${String(base).replace(/\/+$/, "")}/reservar/cita/${c}` : ""; };

// La dirección pública de la web: la que has puesto en Ajustes (si usas un subdominio) o la de la propia petición
export function baseDeLaPeticion(headers, dominioPublico = "") {
  if (dominioPublico) return String(dominioPublico).replace(/\/+$/, "");
  const get = (k) => String((typeof headers?.get === "function" ? headers.get(k) : headers?.[k]) || "");
  const host = (get("x-forwarded-host") || get("host")).split(",")[0].trim();
  if (!host || /[\s/<>"'\\]/.test(host)) return "";
  const proto = (get("x-forwarded-proto") || (/^(localhost|127\.)/.test(host) ? "http" : "https")).split(",")[0].trim();
  return `${proto === "http" ? "http" : "https"}://${host}`;
}
