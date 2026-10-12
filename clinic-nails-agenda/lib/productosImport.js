// Importar y exportar productos (CSV de Excel o JSON). Funciones puras, sin pantalla ni base de datos.
import { normalizarTexto } from "./agenda";

const limpiar = (t) => String(t ?? "").replace(/\s+/g, " ").trim();
const clave = (t) => normalizarTexto(limpiar(t));

// ---- CSV -----------------------------------------------------------------
// Detecta el separador (; , o tabulador) mirando la primera línea y respeta las comillas
function detectarSeparador(texto) {
  const primera = texto.split(/\r?\n/).find((l) => l.trim()) || "";
  let mejor = ";", max = -1;
  for (const sep of [";", "\t", ","]) {
    let n = 0, dentro = false;
    for (const c of primera) { if (c === '"') dentro = !dentro; else if (c === sep && !dentro) n++; }
    if (n > max) { max = n; mejor = sep; }
  }
  return mejor;
}
export function parsearCSV(texto) {
  const t = String(texto || "").replace(/^\uFEFF/, "");
  const sep = detectarSeparador(t);
  const filas = [];
  let fila = [], campo = "", dentro = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (dentro) {
      if (c === '"') { if (t[i + 1] === '"') { campo += '"'; i++; } else dentro = false; } else campo += c;
    } else if (c === '"') dentro = true;
    else if (c === sep) { fila.push(campo); campo = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && t[i + 1] === "\n") i++; fila.push(campo); campo = ""; if (fila.some((x) => x.trim() !== "")) filas.push(fila); fila = []; }
    else campo += c;
  }
  fila.push(campo);
  if (fila.some((x) => x.trim() !== "")) filas.push(fila);
  return filas;
}

const ALIAS = {
  nombre: ["nombre", "producto", "name", "articulo", "item", "denominacion"],
  precio: ["precio", "pvp", "price", "importe", "tarifa", "precio venta", "precio de venta"],
  stock: ["stock", "existencias", "cantidad", "unidades", "inventario", "uds"],
  activo: ["activo", "activa", "estado", "disponible", "active"],
};
const campoDe = (cabecera) => { const k = clave(cabecera); return Object.keys(ALIAS).find((f) => ALIAS[f].includes(k)) || null; };
const aNumero = (v) => { if (v === null || v === undefined || String(v).trim() === "") return NaN; if (typeof v === "number") return v; return Number(String(v).replace(/[€\s]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".")); };
const aBooleano = (v) => {
  if (typeof v === "boolean") return v;
  const k = clave(v);
  if (["si", "sí", "s", "1", "true", "verdadero", "activo", "activa", "yes", "y", "disponible"].includes(k)) return true;
  if (["no", "n", "0", "false", "falso", "inactivo", "inactiva", "desactivado", "desactivada", "baja"].includes(k)) return false;
  return null;
};

// texto: contenido del archivo (CSV o JSON). Devuelve { productos, omitidos, avisos } o { error }
export function leerProductos(texto, nombreArchivo = "") {
  const t = String(texto || "").replace(/^\uFEFF/, "").trim();
  if (!t) return { error: "El archivo está vacío." };
  const esJSON = /\.json$/i.test(nombreArchivo) || /^[\[{]/.test(t);
  let filas; // lista de objetos { nombre, precio, stock, activo } sin normalizar
  if (esJSON) {
    let json;
    try { json = JSON.parse(t); } catch (e) { return { error: "El archivo no es un JSON válido." }; }
    const lista = Array.isArray(json) ? json : Array.isArray(json?.productos) ? json.productos : null;
    if (!lista) return { error: "El archivo no tiene el formato esperado: una lista de productos con nombre, precio, stock y activo." };
    filas = lista.map((o) => {
      const r = {};
      Object.keys(o || {}).forEach((k) => { const f = campoDe(k); if (f && !(f in r)) r[f] = o[k]; });
      return r;
    });
  } else {
    const tabla = parsearCSV(t);
    if (tabla.length < 2) return { error: "El archivo no tiene filas de productos (la primera línea debe ser la cabecera: nombre; precio; stock; activo)." };
    const campos = tabla[0].map(campoDe);
    if (!campos.includes("nombre")) return { error: "No encuentro la columna del nombre. La primera línea debe ser la cabecera, por ejemplo: nombre;precio;stock;activo." };
    if (!campos.includes("precio")) return { error: "No encuentro la columna del precio (precio, pvp…)." };
    filas = tabla.slice(1).map((cols) => { const r = {}; campos.forEach((f, i) => { if (f && !(f in r)) r[f] = cols[i]; }); return r; });
  }

  const productos = [], omitidos = [], avisos = [], vistos = new Map();
  for (const r of filas) {
    const nombre = limpiar(r.nombre);
    if (!nombre) { omitidos.push({ nombre: "(sin nombre)", motivo: "No tiene nombre" }); continue; }
    const precio = aNumero(r.precio);
    if (!Number.isFinite(precio) || precio < 0) { omitidos.push({ nombre, motivo: "Su precio no es válido" }); continue; }
    let stock = null;
    if ("stock" in r && String(r.stock ?? "").trim() !== "") {
      const n = aNumero(r.stock);
      if (!Number.isFinite(n)) { omitidos.push({ nombre, motivo: "Su stock no es válido" }); continue; }
      stock = Math.max(0, Math.round(n));
      if (n < 0) avisos.push(`«${nombre}»: stock negativo → se pone 0.`);
    }
    let activo = null;
    if ("activo" in r && String(r.activo ?? "").trim() !== "") {
      activo = aBooleano(r.activo);
      if (activo === null) avisos.push(`«${nombre}»: no entiendo «${r.activo}» como activo/inactivo → se deja activo.`);
    }
    const item = { nombre, precio: Math.round(precio * 100) / 100, stock, activo };
    const k = clave(nombre);
    if (vistos.has(k)) { avisos.push(`«${nombre}» está repetido en el archivo: se usa el último.`); productos[vistos.get(k)] = item; }
    else { vistos.set(k, productos.length); productos.push(item); }
  }
  return { productos, omitidos, avisos };
}

// ---- Qué hacer con lo que ya existe ---------------------------------------
export function planDeImportacionProductos({ existentes = [], importados = [], empezarDeCero = false, usado = () => false }) {
  const tomados = new Set();
  const crear = [], reemplazar = [], iguales = [];
  for (const imp of importados) {
    const e = existentes.find((x) => !tomados.has(x.id) && clave(x.nombre) === clave(imp.nombre));
    if (!e) { crear.push(imp); continue; }
    tomados.add(e.id);
    const stock = imp.stock ?? e.stock, activo = imp.activo ?? true;
    const igual = e.nombre === imp.nombre && Number(e.precio) === imp.precio && Number(e.stock) === stock && (e.activo !== false) === activo;
    (igual ? iguales : reemplazar).push({ existente: e, nuevo: imp });
  }
  const sobrantes = existentes.filter((x) => !tomados.has(x.id));
  const borrar = [], desactivar = [], conservar = [];
  if (empezarDeCero) for (const x of sobrantes) { if (!usado(x.id)) borrar.push(x); else if (x.activo !== false) desactivar.push(x); else conservar.push(x); }
  return { crear, reemplazar, iguales, borrar, desactivar, conservar, sinTocar: empezarDeCero ? [] : sobrantes };
}

export const productoNuevo = (imp, id) => ({ id, nombre: imp.nombre, precio: imp.precio, stock: imp.stock ?? 0, activo: imp.activo ?? true });
// Al reemplazar se conserva el id (y su historial); si el archivo no trae stock o estado, se queda el que había
export const cambiosDeReemplazoProducto = (existente, imp) => ({ id: existente.id, nombre: imp.nombre, precio: imp.precio, stock: imp.stock ?? existente.stock, activo: imp.activo ?? true });

// ---- Exportar ---------------------------------------------------------------
export const exportarProductosJSON = (productos) => productos.map((p) => ({ nombre: p.nombre, precio: Number(p.precio), stock: Number(p.stock), activo: p.activo !== false }));
export function exportarProductosCSV(productos) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const num = (n) => String(Number(n)).replace(".", ","); // Excel en español: coma decimal
  const lineas = ["nombre;precio;stock;activo", ...productos.map((p) => [esc(p.nombre), num(p.precio), Number(p.stock), p.activo === false ? "no" : "sí"].join(";"))];
  return "\uFEFF" + lineas.join("\r\n") + "\r\n";
}
