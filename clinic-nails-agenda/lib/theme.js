// Motor de temas: a partir de un color principal y un fondo calcula TODAS las
// variables CSS de la app (modo claro y oscuro) garantizando contraste
// legible (WCAG AA: 4,5:1 en texto). También da el color por defecto de cada
// servicio según su categoría.

const clamp = (n, a, b) => Math.min(Math.max(n, a), b);

// ---------------------------------------------------------------------------
// Color básico
// ---------------------------------------------------------------------------

export const esHex = (h) => /^#[0-9a-fA-F]{6}$/.test(h || "");

export function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

export function rgbToHex([r, g, b]) {
  return "#" + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0")).join("");
}

const lin = (c) => {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};

export function luminancia(hex) {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contraste(a, b) {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

// t = 0 → a, t = 1 → b
export function mezclar(a, b, t) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return rgbToHex(A.map((v, i) => v + (B[i] - v) * t));
}

export function oscurecerHasta(hex, fondo, min) {
  let c = hex;
  for (let i = 0; i < 40 && contraste(c, fondo) < min; i++) c = mezclar(c, "#000000", 0.06);
  return c;
}

export function aclararHasta(hex, fondo, min) {
  let c = hex;
  for (let i = 0; i < 40 && contraste(c, fondo) < min; i++) c = mezclar(c, "#ffffff", 0.06);
  return c;
}

function hslToHex(h, s, l) {
  const S = s / 100;
  const L = l / 100;
  const k = (n) => (n + h / 30) % 12;
  const a = S * Math.min(L, 1 - L);
  const f = (n) => L - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return rgbToHex([f(0) * 255, f(8) * 255, f(4) * 255]);
}

const rgbStr = (hex) => hexToRgb(hex).join(", ");

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

export const PRESETS = {
  cielo: { nombre: "Azul cielo", acento: "#1570EF", fondo: "#F3F7FC", menu: "claro" },
  turquesa: { nombre: "Turquesa", acento: "#0E8F9C", fondo: "#F1F8F9", menu: "claro" },
  lavanda: { nombre: "Lavanda", acento: "#6D5BD0", fondo: "#F6F5FC", menu: "claro" },
  rosa: { nombre: "Rosa suave", acento: "#D6457B", fondo: "#FCF4F7", menu: "claro" },
  menta: { nombre: "Menta", acento: "#12926B", fondo: "#F2F9F6", menu: "claro" },
  nocturno: { nombre: "Azul noche (menú oscuro)", acento: "#2F6FED", fondo: "#F1F4FA", menu: "oscuro" },
  clasico: { nombre: "Dorado clásico", acento: "#B4863C", fondo: "#F6F1E7", menu: "oscuro" },
};

export const TEMA_POR_DEFECTO = { preset: "cielo", ...PRESETS.cielo };

export function normalizarTema(t) {
  const base = TEMA_POR_DEFECTO;
  const x = t || TEMA_POR_DEFECTO;
  return {
    preset: x.preset || "personalizado",
    nombre: x.nombre || "Personalizado",
    acento: esHex(x.acento) ? x.acento : base.acento,
    fondo: esHex(x.fondo) ? x.fondo : base.fondo,
    menu: ["claro", "oscuro", "color"].includes(x.menu) ? x.menu : base.menu,
  };
}

// ---------------------------------------------------------------------------
// Variables CSS del tema
// ---------------------------------------------------------------------------

export function variablesTema(entrada, oscuro = false) {
  const t = normalizarTema(entrada);
  const acento = t.acento;

  // Fondo de botones con texto blanco: siempre ≥ 4,6:1
  const boton = oscurecerHasta(acento, "#ffffff", 4.6);

  let bg, surface, field, text, acentoTexto, mesh1, mesh2;
  if (!oscuro) {
    bg = t.fondo;
    surface = "#ffffff";
    field = "#ffffff";
    text = mezclar(acento, "#0A1020", 0.87);
    acentoTexto = oscurecerHasta(acento, bg, 4.6);
    mesh1 = `rgba(${rgbStr(boton)}, 0.10)`;
    mesh2 = `rgba(${rgbStr(mezclar(acento, "#ffffff", 0.4))}, 0.16)`;
  } else {
    bg = mezclar(acento, "#04070D", 0.93);
    surface = mezclar(acento, "#0B1120", 0.9);
    field = mezclar(acento, "#111A2D", 0.88);
    text = "#E9EEF7";
    acentoTexto = aclararHasta(acento, surface, 4.6);
    mesh1 = `rgba(${rgbStr(acento)}, 0.16)`;
    mesh2 = `rgba(${rgbStr(mezclar(acento, "#000000", 0.5))}, 0.28)`;
  }

  const acentoClaro = mezclar(acento, "#ffffff", oscuro ? 0.25 : 0.4);

  // Menú lateral
  let side;
  const estiloMenu = oscuro && t.menu === "claro" ? "oscuro" : t.menu;
  if (estiloMenu === "claro") {
    side = {
      "--side-bg": "#ffffff",
      "--side-text": text,
      "--side-muted": `rgba(${rgbStr(text)}, 0.72)`,
      "--side-line": `rgba(${rgbStr(text)}, 0.1)`,
      "--side-tile": `rgba(${rgbStr(text)}, 0.06)`,
      "--side-active-bg": `rgba(${rgbStr(boton)}, 0.12)`,
      "--side-active-text": acentoTexto,
      "--side-accent": boton,
    };
  } else if (estiloMenu === "color") {
    side = {
      "--side-bg": `linear-gradient(180deg, ${boton} 0%, ${mezclar(boton, "#000000", 0.28)} 100%)`,
      "--side-text": "#ffffff",
      "--side-muted": "rgba(255, 255, 255, 0.82)",
      "--side-line": "rgba(255, 255, 255, 0.16)",
      "--side-tile": "rgba(255, 255, 255, 0.14)",
      "--side-active-bg": "rgba(255, 255, 255, 0.22)",
      "--side-active-text": "#ffffff",
      "--side-accent": "#ffffff",
    };
  } else {
    const fondoMenu = mezclar(acento, "#050913", 0.9);
    side = {
      "--side-bg": `linear-gradient(180deg, ${mezclar(fondoMenu, "#ffffff", 0.05)} 0%, ${fondoMenu} 100%)`,
      "--side-text": "#F2F5FA",
      "--side-muted": "rgba(242, 245, 250, 0.78)",
      "--side-line": "rgba(255, 255, 255, 0.1)",
      "--side-tile": "rgba(255, 255, 255, 0.08)",
      "--side-active-bg": `rgba(${rgbStr(acentoClaro)}, 0.2)`,
      "--side-active-text": acentoClaro,
      "--side-accent": acentoClaro,
    };
  }

  return {
    "--bg": bg,
    "--surface": surface,
    "--field-bg": field,
    "--text": text,
    "--ink-rgb": rgbStr(text),
    "--ink-solid": text,
    "--on-ink": oscuro ? "#0B1120" : "#ffffff",
    "--accent": boton,
    "--accent-deep": mezclar(boton, "#000000", 0.24),
    "--accent-rgb": rgbStr(boton),
    "--accent-text": acentoTexto,
    "--accent-light": acentoClaro,
    "--focus-color": acentoTexto,
    "--focus-ring": `rgba(${rgbStr(boton)}, 0.28)`,
    "--danger": oscuro ? "#F4A092" : "#B42318",
    "--success": oscuro ? "#8EDDA9" : "#05603A",
    "--bar-bg": oscuro ? `rgba(${rgbStr(bg)}, 0.78)` : `rgba(${rgbStr(bg)}, 0.82)`,
    "--mesh-1": mesh1,
    "--mesh-2": mesh2,
    ...side,
  };
}

// Aplica un mapa de variables al elemento raíz
export function aplicarVariables(vars, el) {
  const raiz = el || (typeof document !== "undefined" ? document.documentElement : null);
  if (!raiz) return;
  Object.entries(vars).forEach(([k, v]) => raiz.style.setProperty(k, v));
}

// Calcula claro+oscuro, aplica el que toca y guarda ambos para el próximo arranque
export function aplicarTema(tema, oscuro, guardarCache = true) {
  const claro = variablesTema(tema, false);
  const noche = variablesTema(tema, true);
  aplicarVariables(oscuro ? noche : claro);
  if (!guardarCache) return { claro, oscuro: noche };
  try {
    window.localStorage.setItem("cnb_theme_vars", JSON.stringify({ claro, oscuro: noche }));
  } catch (e) {
    // si no se puede recordar, no pasa nada
  }
  return { claro, oscuro: noche };
}

// ---------------------------------------------------------------------------
// Colores por defecto de los servicios, según categoría (tonos claros)
// ---------------------------------------------------------------------------

export const claveCategoria = (s) => quitarAcentos(s);
const quitarAcentos = (s) => (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

// Tonos (grados) sin amarillos: azules, rosas, verdes, violetas, turquesas, corales
const TONO_CATEGORIA = [
  [/facial|rostro|cara|piel/, 210],
  [/una|manicura|pedicura|nail/, 335],
  [/corporal|cuerpo|masaje|reductor|reafirm/, 165],
  [/depil|laser/, 265],
  [/ceja|pestan|mirada|ojo/, 185],
  [/pelo|peluqueria|capilar|cabello/, 12],
  [/aparatolog|avanzad|radiofrecuencia|dermapen/, 230],
];
const TONOS_LIBRES = [200, 340, 160, 270, 185, 15, 300, 140, 225];

// Matices para que cada servicio de una misma categoría sea distinto
const MATICES = [
  { dh: 0, s: 78, l: 60 },
  { dh: 12, s: 70, l: 68 },
  { dh: -12, s: 82, l: 52 },
  { dh: 22, s: 64, l: 74 },
  { dh: -22, s: 76, l: 46 },
  { dh: 32, s: 72, l: 62 },
];

export function tonoDeCategoria(categoria) {
  const n = quitarAcentos(categoria);
  const conocido = TONO_CATEGORIA.find(([re]) => re.test(n));
  if (conocido) return conocido[1];
  if (!n) return 210;
  let h = 0;
  for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0;
  return TONOS_LIBRES[h % TONOS_LIBRES.length];
}

// `indice` = cuántos servicios hay ya en esa categoría (para que cada uno salga distinto)
export function colorPorDefecto(categoria, indice = 0) {
  const base = tonoDeCategoria(categoria);
  const m = MATICES[((indice % MATICES.length) + MATICES.length) % MATICES.length];
  return hslToHex((base + m.dh + 360) % 360, m.s, m.l);
}

// Color de relleno suave (estilo Booksy/Fresha) de un bloque de cita
export function tinteDeColor(hex, alfa = 0.2) {
  const c = esHex(hex) ? hex : "#7CB7F2";
  return `rgba(${rgbStr(c)}, ${alfa})`;
}

export const COLOR_SERVICIO_POR_DEFECTO = "#5AA9F0";
