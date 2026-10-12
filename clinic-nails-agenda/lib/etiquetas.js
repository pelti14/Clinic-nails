// Etiquetas de marketing: píxeles de Meta (varios), Google Ads, Google Analytics 4
// y Google Tag Manager.
//
// SEGURIDAD: los identificadores se insertan dentro de código que ejecuta el
// navegador, así que solo se aceptan si cumplen EXACTAMENTE el formato de cada
// plataforma. Cualquier otra cosa se descarta: no hay forma de colar código.
//
// PRIVACIDAD: el píxel de Meta se carga con la recogida automática desactivada
// (`autoConfig: false`), para que no lea los formularios de la agenda (nombres,
// teléfonos y emails de clientes) ni los envíe a Facebook.

export const FORMATOS = {
  metaPixel: /^\d{8,20}$/,
  googleAds: /^AW-\d{6,15}$/,
  ga4: /^G-[A-Z0-9]{4,20}$/,
  gtm: /^GTM-[A-Z0-9]{4,12}$/,
};

export const EJEMPLOS = {
  metaPixel: "123456789012345",
  googleAds: "AW-123456789",
  ga4: "G-ABCDEF1234",
  gtm: "GTM-ABCD123",
};

const limpiar = (tipo, valor) => {
  const v = String(valor ?? "").trim();
  return tipo === "metaPixel" ? v : v.toUpperCase();
};

export function validarId(tipo, valor) {
  return FORMATOS[tipo].test(limpiar(tipo, valor));
}

export function normalizarMarketing(m) {
  const x = m || {};
  const lista = (tipo, arr) => [...new Set((Array.isArray(arr) ? arr : []).map((v) => limpiar(tipo, v)).filter((v) => FORMATOS[tipo].test(v)))];
  return {
    activo: x.activo !== false,
    metaPixels: lista("metaPixel", x.metaPixels),
    googleAds: lista("googleAds", x.googleAds),
    ga4: lista("ga4", x.ga4),
    gtm: lista("gtm", x.gtm),
  };
}

export const hayEtiquetas = (m) => {
  const n = normalizarMarketing(m);
  return n.metaPixels.length + n.googleAds.length + n.ga4.length + n.gtm.length > 0;
};

function cargarFbevents(win, doc) {
  if (win.fbq) return;
  const n = (win.fbq = function () {
    if (n.callMethod) n.callMethod.apply(n, arguments);
    else n.queue.push(arguments);
  });
  if (!win._fbq) win._fbq = n;
  n.push = n;
  n.loaded = true;
  n.version = "2.0";
  n.queue = [];
  const t = doc.createElement("script");
  t.async = true;
  t.src = "https://connect.facebook.net/en_US/fbevents.js";
  t.setAttribute("data-cnb-tag", "meta");
  doc.head.appendChild(t);
}

// Idempotente: cada identificador se carga una sola vez por página. Si se quita
// una etiqueta, deja de cargarse la próxima vez que se abre la app.
export function inyectarEtiquetas(entrada, win = typeof window !== "undefined" ? window : null) {
  const cargadas = [];
  if (!win || !win.document) return { cargadas };
  const doc = win.document;
  const m = normalizarMarketing(entrada);
  if (!m.activo) return { cargadas };
  const reg = (win.__cnbTags = win.__cnbTags || { meta: [], gtm: [], gtag: [], gtagCargado: false });

  // ---- Meta Pixel (uno o varios) ----
  const nuevosMeta = m.metaPixels.filter((id) => !reg.meta.includes(id));
  if (nuevosMeta.length) {
    cargarFbevents(win, doc);
    nuevosMeta.forEach((id) => {
      win.fbq("set", "autoConfig", false, id); // sin lectura automática de formularios
      win.fbq("init", id);
      reg.meta.push(id);
      cargadas.push(`Meta Pixel ${id}`);
    });
    win.fbq("track", "PageView");
  }

  // ---- Google Tag Manager ----
  m.gtm.filter((id) => !reg.gtm.includes(id)).forEach((id) => {
    win.dataLayer = win.dataLayer || [];
    win.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    const s = doc.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`;
    s.setAttribute("data-cnb-tag", `gtm:${id}`);
    doc.head.appendChild(s);
    reg.gtm.push(id);
    cargadas.push(`Tag Manager ${id}`);
  });

  // ---- Google Analytics 4 y Google Ads (comparten gtag.js) ----
  const idsGtag = [...m.ga4, ...m.googleAds].filter((id) => !reg.gtag.includes(id));
  if (idsGtag.length) {
    win.dataLayer = win.dataLayer || [];
    if (!win.gtag) {
      win.gtag = function () {
        win.dataLayer.push(arguments);
      };
    }
    if (!reg.gtagCargado) {
      win.gtag("js", new Date());
      const s = doc.createElement("script");
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(idsGtag[0])}`;
      s.setAttribute("data-cnb-tag", "gtag");
      doc.head.appendChild(s);
      reg.gtagCargado = true;
    }
    idsGtag.forEach((id) => {
      if (id.startsWith("G-")) win.gtag("config", id, { allow_google_signals: false, allow_ad_personalization_signals: false });
      else win.gtag("config", id);
      reg.gtag.push(id);
      cargadas.push(id.startsWith("G-") ? `Google Analytics ${id}` : `Google Ads ${id}`);
    });
  }

  return { cargadas };
}
