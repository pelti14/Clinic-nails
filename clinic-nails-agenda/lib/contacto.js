// Teléfono, WhatsApp, dirección y mapa del centro (Configuración → Negocio). Salen en las páginas de las clientas (/reservar y el
// enlace de cada cita). Funciones puras (sin pantalla ni red).

export const MAX_DIRECCION = 160;

const limpio = (t, max) => String(t ?? "").replace(/\s+/g, " ").trim().slice(0, max);
// Solo cifras y un «+» delante (lo que entiende el móvil al llamar)
export const soloTelefono = (t) => { const s = String(t ?? "").trim(); return (s.startsWith("+") ? "+" : "") + s.replace(/\D/g, "").slice(0, 15); };
const telefonoValido = (t) => soloTelefono(t).replace("+", "").length >= 9;

// Un enlace de Google Maps o de Mapas de Apple (el de «Compartir»); cualquier otra cosa no vale
export function mapsUrlValida(u) {
  const s = String(u ?? "").trim();
  if (!s) return "";
  try {
    const url = new URL(s);
    if (url.protocol !== "https:") return "";
    const h = url.hostname.toLowerCase();
    const ok = h === "maps.app.goo.gl" || h === "goo.gl" || h === "g.page" || h === "maps.apple.com" || h === "maps.google.com" || /(^|\.)google\.[a-z.]+$/.test(h);
    return ok ? url.toString() : "";
  } catch (e) { return ""; }
}

export function normalizarContacto(n) {
  const v = n && typeof n === "object" ? n : {};
  return {
    telefono: telefonoValido(v.telefono) ? soloTelefono(v.telefono) : "",
    whatsapp: telefonoValido(v.whatsapp) ? soloTelefono(v.whatsapp) : "",
    direccion: limpio(v.direccion, MAX_DIRECCION).replace(/[<>]/g, ""),
    mapsUrl: mapsUrlValida(v.mapsUrl),
  };
}

// Errores del formulario (vacío si todo vale). Los campos vacíos valen: todo es opcional.
export function validarContacto(v) {
  const e = {};
  if (String(v.telefono || "").trim() && !telefonoValido(v.telefono)) e.telefono = "Escribe un teléfono completo (al menos 9 cifras).";
  if (String(v.whatsapp || "").trim() && !telefonoValido(v.whatsapp)) e.whatsapp = "Escribe un número completo (al menos 9 cifras).";
  if (String(v.mapsUrl || "").trim() && !mapsUrlValida(v.mapsUrl)) e.mapsUrl = "Pega el enlace de «Compartir» de Google Maps (https://maps.app.goo.gl/…) o de Mapas de Apple.";
  if (/[<>]/.test(String(v.direccion || ""))) e.direccion = "No uses los signos < ni >.";
  return e;
}

// Para enseñarlo: «986 12 34 56» / «600 12 34 56» (los españoles de 9 cifras); los demás, tal cual
export function telefonoLegible(t) {
  const s = soloTelefono(t);
  const m = s.replace(/^(\+34|0034)/, "").match(/^(\d{3})(\d{2})(\d{2})(\d{2})$/);
  return m ? `${m[1]} ${m[2]} ${m[3]} ${m[4]}` : s;
}

// Para WhatsApp el número va sin «+» y con prefijo de país: si es español sin prefijo (9 cifras), se le pone el 34
export function numeroWhatsApp(t) {
  const s = soloTelefono(t);
  if (!s) return "";
  if (s.startsWith("+")) return s.slice(1);
  if (s.startsWith("00")) return s.slice(2);
  return s.length === 9 ? `34${s}` : s;
}

// Todos los enlaces que necesita la página (vacíos si falta el dato)
export function enlacesContacto(c, mensajeWhatsApp = "") {
  const x = normalizarContacto(c);
  const q = encodeURIComponent(x.direccion);
  const wa = numeroWhatsApp(x.whatsapp);
  return {
    ...x,
    llamar: x.telefono ? `tel:${x.telefono}` : "",
    whatsappUrl: wa ? `https://wa.me/${wa}${mensajeWhatsApp ? `?text=${encodeURIComponent(mensajeWhatsApp)}` : ""}` : "",
    // El mapa se dibuja con la dirección escrita (el enlace corto de «Compartir» no se puede incrustar)
    mapaEmbed: x.direccion ? `https://www.google.com/maps?q=${q}&output=embed` : "",
    // «Cómo llegar»: Google Maps (el enlace de Compartir si lo hay, que lleva al sitio exacto) o Mapas de Apple
    googleMaps: x.direccion ? `https://www.google.com/maps/dir/?api=1&destination=${q}` : x.mapsUrl,
    fichaGoogle: x.mapsUrl,
    appleMaps: x.direccion ? `https://maps.apple.com/?daddr=${q}` : "",
  };
}

export const hayContacto = (c) => { const x = normalizarContacto(c); return Boolean(x.telefono || x.whatsapp || x.direccion || x.mapsUrl); };
