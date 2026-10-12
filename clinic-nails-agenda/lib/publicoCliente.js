// Ayudantes de las páginas públicas de reservas (/reservar y /reservar/cita/…): llamadas al servidor, fechas y lo que se guarda en el móvil.
import { primeraMayuscula } from "./reservaOnline";

export const CLAVE_PASE = "cnb_cliente";
export const eur = (n) => `${Number(n || 0).toLocaleString("es-ES", { maximumFractionDigits: 2 })} €`;
export const legible = (min) => { const h = Math.floor(min / 60), r = min % 60; return h && r ? `${h} h ${r} min` : h ? `${h} h` : `${r} min`; };
export const hoyMadrid = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Madrid" }).format(new Date());
export const sumar = (iso, n) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
export const partesDia = (iso) => { const d = new Date(`${iso}T12:00:00Z`); return { dow: d.toLocaleDateString("es-ES", { weekday: "short", timeZone: "UTC" }).replace(".", ""), num: d.getUTCDate(), mes: d.toLocaleDateString("es-ES", { month: "short", timeZone: "UTC" }).replace(".", "") }; };
// «lunes, 12 de octubre» con la primera letra en mayúscula (no «Lunes, 12 De Octubre»)
export const diaLargo = (iso) => primeraMayuscula(new Date(`${iso}T12:00:00Z`).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }));
export const primerNombre = (n) => String(n || "").trim().split(/\s+/)[0];

// Llama al servidor. Las consultas (sin cuerpo) llevan un número al final y «no-store» para saltarse cualquier memoria (caché) del hosting.
export async function api(ruta, cuerpo) {
  try {
    const res = await fetch(cuerpo === undefined ? `/api/publico/${ruta}?t=${Date.now()}` : `/api/publico/${ruta}`, cuerpo === undefined ? { cache: "no-store" } : { method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store", body: JSON.stringify(cuerpo) });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok && data.ok !== false, status: res.status, data };
  } catch (e) {
    return { ok: false, status: 0, data: { error: "No hay conexión. Comprueba tu internet y vuelve a probar." } };
  }
}
export const leerPase = () => { try { return JSON.parse(window.localStorage.getItem(CLAVE_PASE) || "null") || null; } catch (e) { return null; } };
export const guardarPase = (p) => { try { if (p) window.localStorage.setItem(CLAVE_PASE, JSON.stringify(p)); else window.localStorage.removeItem(CLAVE_PASE); } catch (e) { /* sin almacenamiento: no pasa nada */ } };
export async function copiarTexto(texto) { try { await navigator.clipboard.writeText(texto); return true; } catch (e) { return false; } }
