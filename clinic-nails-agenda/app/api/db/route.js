import { NextResponse } from "next/server";
import { supabase } from "../../../lib/servidorDb";
import { verificarUsuario } from "../../../lib/auth";
import { hashCodigo } from "../../../lib/servidor";
import { esCodigoValido, LONGITUD_CODIGO } from "../../../lib/codigo";
import { TABLAS, OPERACIONES, evaluar, limpiarDatos, filtrarLectura } from "../../../lib/permisos";
import { construirActividad } from "../../../lib/actividad";
import { registrarActividad } from "../../../lib/actividadServidor";

export const dynamic = "force-dynamic";

// Pasarela única de datos: la app ya NO habla con la base de datos directamente.
// Cada petición lleva la sesión; aquí se decide, en el servidor, qué puede hacer cada persona.

const responder = (cuerpo, status = 200) => NextResponse.json(cuerpo, { status });
const COLUMNA = /^[a-z_]{1,40}$/;
const LISTA_COLUMNAS = /^[a-z_*, ]{1,300}$/i;
const MAX_FILAS = 500;

function filtrosValidos(f) {
  if (f === undefined) return [];
  if (!Array.isArray(f) || f.length > 3) return null;
  for (const par of f) {
    if (!Array.isArray(par) || par.length !== 2 || !COLUMNA.test(par[0])) return null;
    if (!["string", "number", "boolean"].includes(typeof par[1])) return null;
  }
  return f;
}

const conFiltros = (q, filtros) => filtros.reduce((acc, [c, v]) => acc.eq(c, v), q);

// Códigos de acceso: llegan en claro (5 dígitos), se guardan SOLO cifrados
async function procesarCodigo(fila, idPropio) {
  if (!Object.prototype.hasOwnProperty.call(fila, "codigo")) return { fila };
  const codigo = fila.codigo;
  const resto = { ...fila };
  delete resto.codigo;
  if (codigo === "" || codigo === null || codigo === undefined) return { fila: resto }; // sin cambios
  if (!esCodigoValido(codigo)) return { error: `El código de acceso debe tener ${LONGITUD_CODIGO} dígitos.` };
  const h = hashCodigo(codigo);
  const { data } = await supabase.from("empleadas").select("id").eq("codigo_hash", h);
  if ((data || []).some((e) => e.id !== (idPropio ?? resto.id))) return { error: "Ese código ya lo usa otra persona. Elige otro." };
  return { fila: { ...resto, codigo_hash: h, codigo: null } };
}

export async function POST(request) {
  try {
    const auth = await verificarUsuario(request);
    if (!auth.ok) return responder({ error: auth.error }, auth.status);
    const usuario = auth.usuario;

    const cuerpo = await request.json();
    const { tabla, op, columnas, orden, datos, onConflict } = cuerpo || {};
    if (!TABLAS.includes(tabla) || !OPERACIONES.includes(op)) return responder({ error: "Petición no válida." }, 400);
    const filtros = filtrosValidos(cuerpo.filtros);
    if (filtros === null) return responder({ error: "Filtros no válidos." }, 400);

    // ---------- Lectura ----------
    if (op === "select") {
      const permisoLeer = evaluar({ usuario, tabla, op });
      if (!permisoLeer.ok) return responder({ error: permisoLeer.error }, 403);
      if (columnas && !LISTA_COLUMNAS.test(columnas)) return responder({ error: "Columnas no válidas." }, 400);
      let q = conFiltros(supabase.from(tabla).select(columnas || "*"), filtros);
      if (orden?.col) {
        if (!COLUMNA.test(orden.col)) return responder({ error: "Orden no válido." }, 400);
        q = q.order(orden.col, { ascending: orden.asc !== false });
      }
      if (Number.isInteger(cuerpo.limite)) q = q.limit(Math.min(Math.max(cuerpo.limite, 1), 1000));
      if (tabla === "actividad" && typeof cuerpo.antes === "string") q = q.lt("created_at", cuerpo.antes); // paginar hacia atrás
      const { data, error } = await q;
      if (error) return responder({ error: error.message }, 500);
      return responder({ data: filtrarLectura(usuario, tabla, data) });
    }

    // ---------- Escritura ----------
    const filasEntrada = op === "insert" || op === "upsert" ? (Array.isArray(datos) ? datos : [datos]) : [datos || {}];
    if (filasEntrada.length > MAX_FILAS || filasEntrada.some((f) => f === null || typeof f !== "object")) return responder({ error: "Datos no válidos." }, 400);

    // fila existente (para saber si una cita ya está cobrada, qué cambia un parche…)
    let existente = null;
    if ((op === "update" || op === "delete") && filtros.length) {
      const { data } = await conFiltros(supabase.from(tabla).select("*"), filtros);
      existente = (data || [])[0] || null;
      if (!existente && op === "update") return responder({ error: "No se encontró lo que quieres modificar." }, 404);
    }
    if ((op === "update" || op === "delete") && !filtros.length) return responder({ error: "Falta indicar qué fila." }, 400);

    let limpias = filasEntrada.map((f) => limpiarDatos(tabla, f, usuario));

    for (const fila of limpias) {
      const permiso = evaluar({ usuario, tabla, op, datos: fila, existente, filtros, lote: limpias.length });
      if (!permiso.ok) return responder({ error: permiso.error }, 403);
    }

    if (tabla === "empleadas" && op !== "delete") {
      const procesadas = [];
      for (const fila of limpias) {
        const r = await procesarCodigo(fila, existente?.id);
        if (r.error) return responder({ error: r.error }, 400);
        procesadas.push(r.fila);
      }
      limpias = procesadas;
    }

    const carga = op === "insert" || op === "upsert" ? (Array.isArray(datos) ? limpias : limpias[0]) : limpias[0];
    let consulta;
    if (op === "insert") consulta = supabase.from(tabla).insert(carga);
    else if (op === "update") consulta = conFiltros(supabase.from(tabla).update(carga), filtros);
    else if (op === "delete") consulta = conFiltros(supabase.from(tabla).delete(), filtros);
    else {
      if (onConflict && !LISTA_COLUMNAS.test(onConflict)) return responder({ error: "Datos no válidos." }, 400);
      consulta = supabase.from(tabla).upsert(carga, onConflict ? { onConflict } : undefined);
    }
    const { error } = await consulta;
    if (error) return responder({ error: error.message }, 400);
    // Cada cambio queda anotado por el servidor (quién, qué y cuándo): la empleada no puede saltárselo
    await registrarActividad(construirActividad({ usuario, tabla, op, filas: limpias, existente, filtros, codigoCambiado: tabla === "empleadas" && filasEntrada.some((f) => f.codigo !== undefined && f.codigo !== null && f.codigo !== "") }));
    return responder({ ok: true });
  } catch (err) {
    console.error("db:", err);
    return responder({ error: err.message }, 500);
  }
}
