// Nombre del negocio (editable en Configuración → Negocio) y su favicon. Funciones puras (sin pantalla ni red), probadas aparte.
export const NEGOCIO_POR_DEFECTO = "Clinic Nails & Beauty";
export const MAX_NOMBRE = 60;
export const ACENTO_POR_DEFECTO = "#1469e1";

export const limpiarNombre = (t) => String(t ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_NOMBRE).trim();
export const nombreNegocioDe = (ajustes) => limpiarNombre(ajustes?.negocio?.nombre) || NEGOCIO_POR_DEFECTO;
export const tituloPagina = (nombre) => `${limpiarNombre(nombre) || NEGOCIO_POR_DEFECTO} — Agenda interna`;

// Texto de error si el nombre no vale (vacío si vale)
export function validarNombre(t) {
  if (!limpiarNombre(t)) return "Escribe el nombre del negocio.";
  if (/[<>]/.test(String(t))) return "No uses los signos < ni >.";
  return "";
}

const VACIAS = ["&", "y", "e", "de", "del", "la", "el", "los", "las", "the", "and"];
const primeraLetra = (p) => (String(p).match(/[\p{L}\p{N}]/u) || [""])[0].toUpperCase();
// Iniciales para el icono: las de las dos primeras palabras que cuentan («Clinic Nails & Beauty» → CN, «Barbería Antón» → BA)
export function inicialesDe(nombre) {
  const palabras = limpiarNombre(nombre).split(" ").filter((p) => p && !VACIAS.includes(p.toLowerCase()) && /[\p{L}\p{N}]/u.test(p));
  return palabras.slice(0, 2).map(primeraLetra).join("") || "C";
}
export const letraLogo = (nombre) => inicialesDe(nombre).charAt(0);

// El nombre partido en dos líneas para el menú: «Clinic Nails» / «& Beauty · agenda»
export function partesDelNombre(nombre) {
  const n = limpiarNombre(nombre) || NEGOCIO_POR_DEFECTO;
  const amp = n.indexOf("&");
  if (amp > 0 && amp < n.length - 1) return { titulo: n.slice(0, amp).trim(), subtitulo: `${n.slice(amp).trim()} · agenda` };
  const p = n.split(" ");
  if (p.length > 2) return { titulo: p.slice(0, 2).join(" "), subtitulo: `${p.slice(2).join(" ")} · agenda` };
  return { titulo: n, subtitulo: "agenda" };
}

const esHex = (c) => /^#[0-9a-f]{3,8}$/i.test(String(c || "").trim());
const xml = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// El favicon: cuadrado redondeado con el color de la marca y las iniciales
export function faviconSvg(nombre, color) {
  const ini = inicialesDe(nombre);
  const fill = esHex(color) ? String(color).trim() : ACENTO_POR_DEFECTO;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${fill}"/><text x="32" y="34" text-anchor="middle" dominant-baseline="central" font-family="Georgia,'Times New Roman',serif" font-size="${ini.length > 1 ? 34 : 44}" font-weight="700" fill="#fff">${xml(ini)}</text></svg>`;
}
export const faviconUrl = (nombre, color) => `data:image/svg+xml,${encodeURIComponent(faviconSvg(nombre, color))}`;

// Lo que se guarda en el navegador para pintar la marca ANTES de que cargue la app (pantalla de código, título y favicon sin parpadeo)
export const datosMarcaParaCache = (nombre, color) => ({ nombre: limpiarNombre(nombre), titulo: tituloPagina(nombre), icono: faviconUrl(nombre, color) });

// Se ejecuta en el <head> antes de pintar: pone el título y el favicon guardados (solo acepta un icono «data:image/svg+xml»)
export const SCRIPT_MARCA_INICIAL = `try{var n=JSON.parse(localStorage.getItem('cnb_negocio')||'null');if(n&&n.nombre){if(n.titulo)document.title=String(n.titulo);if(typeof n.icono==='string'&&n.icono.indexOf('data:image/svg+xml,')===0){var l=document.querySelector('link[rel~="icon"]');if(!l){l=document.createElement('link');l.rel='icon';document.head.appendChild(l)}l.type='image/svg+xml';l.href=n.icono}}}catch(e){}`;

// Pone el título y el favicon en la página ya cargada (los de antes se sustituyen)
export function aplicarMarcaEnPagina(doc, nombre, color) {
  doc.title = tituloPagina(nombre);
  doc.querySelectorAll('link[rel~="icon"]').forEach((l) => l.remove());
  const l = doc.createElement("link");
  l.rel = "icon"; l.type = "image/svg+xml"; l.href = faviconUrl(nombre, color);
  doc.head.appendChild(l);
}

