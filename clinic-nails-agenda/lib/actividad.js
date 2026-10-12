// Registro de actividad (auditoría): quién hizo qué y cuándo. Lo escribe SIEMPRE el servidor.
// Este módulo solo construye las anotaciones (puro, sin base de datos) para poder probarlo entero.

export const ENTIDAD_DE_TABLA = {
  citas: "cita", clientes: "cliente", ventas: "venta", bonos: "bono", bonos_vendidos: "bono_vendido", bono_usos: "bono_uso",
  fichajes: "fichaje", fichajes_activos: "fichaje", bloqueos: "bloqueo", empleadas: "empleada", servicios: "servicio",
  cabinas: "cabina", productos: "producto", metodos_pago: "metodo_pago", ajustes: "ajuste", categorias_servicios: "categoria_servicio", lecciones: "leccion", resultados_cursos: "resultado_curso", avisos: "aviso",
};
export const ETIQUETA_ENTIDAD = {
  cita: "cita", cliente: "cliente", venta: "venta", bono: "bono", bono_vendido: "bono vendido", bono_uso: "sesión de bono", fichaje: "fichaje",
  bloqueo: "horario no disponible", empleada: "empleada", servicio: "servicio", cabina: "cabina", producto: "producto", metodo_pago: "método de pago",
  ajuste: "ajuste", categoria_servicio: "categoría de servicios", leccion: "clase", resultado_curso: "test", aviso: "aviso", sesion: "sesión",
};

// Columnas que cambian solas o son internas: no cuentan como «cambio» ni se muestran
const RUIDO = ["updated_at", "modificado_por", "created_at", "ghl_event_id", "ghl_calendar_id", "ghl_contact_id", "origen", "codigo", "codigo_hash", "tiene_codigo"];
const SECRETO = /codigo|token|clave|secret|key|password/i;

export function recortar(v, max = 300) {
  if (v === undefined) return null;
  if (v === null || typeof v === "number" || typeof v === "boolean") return v;
  const t = typeof v === "string" ? v : JSON.stringify(v);
  return t.length > max ? t.slice(0, max) + "…" : t;
}
const igual = (a, b) => JSON.stringify(a === "" ? null : a ?? null) === JSON.stringify(b === "" ? null : b ?? null);

export function cambiosEntre(antes, despues) {
  return Object.keys(despues || {})
    .filter((k) => !RUIDO.includes(k) && !igual(antes?.[k], despues[k]))
    .map((k) => ({ campo: k, antes: SECRETO.test(k) ? "(oculto)" : recortar(antes?.[k]), despues: SECRETO.test(k) ? "(oculto)" : recortar(despues[k]) }));
}
const sinRuido = (fila) => Object.fromEntries(Object.entries(fila || {}).filter(([k]) => !RUIDO.includes(k)).map(([k, v]) => [k, SECRETO.test(k) ? "(oculto)" : recortar(v)]));

const nombreDe = (...filas) => {
  for (const f of filas) { const n = f && (f.clienta || f.cliente_nombre || f.nombre); if (n) return String(n); }
  return "";
};
const clienteDe = (tabla, ...filas) => {
  if (tabla === "clientes") return filas.map((f) => f?.id).find(Boolean) || null;
  if (["citas", "ventas", "bonos_vendidos"].includes(tabla)) return filas.map((f) => f?.cliente_id).find(Boolean) || null;
  return null;
};

function accionDeUpdate(tabla, antes, despues, cambios) {
  const hay = (k) => cambios.some((c) => c.campo === k);
  if (tabla === "citas") {
    if (hay("estado_cobro")) return despues.estado_cobro === "cobrada" ? "cobrar" : "anular_cobro";
    if (hay("asistencia")) return "asistencia";
    if (hay("fecha") || hay("inicio") || hay("empleada_id")) return "mover";
    // solo cambió la confirmación de asistencia (✋ / no cogió / pendiente)
    if (hay("confirmacion") && cambios.every((c) => ["confirmacion", "confirmacion_por", "confirmacion_en", "updated_at"].includes(c.campo))) return "confirmar";
  }
  if ((tabla === "ventas" || tabla === "bonos_vendidos") && (hay("anulada") || (hay("estado") && despues.estado === "anulado"))) return "anular";
  if (tabla === "ventas" && hay("pagos")) return "cobrar_plazo";
  return "modificar";
}

const VERBO = { crear: "Creó", modificar: "Modificó", borrar: "Borró", mover: "Movió", cobrar: "Cobró", anular_cobro: "Anuló el cobro de", asistencia: "Cambió la asistencia de", confirmar: "Cambió la confirmación de", anular: "Anuló", cobrar_plazo: "Cobró un plazo de" };

function resumenDe({ tabla, entidad, accion, fila, existente, cambios, esAltaMasiva, n }) {
  const etq = ETIQUETA_ENTIDAD[entidad] || entidad;
  const nombre = nombreDe(fila, existente);
  if (esAltaMasiva) return `Creó ${n} ${etq === "cliente" ? "clientes" : etq === "bono vendido" ? "bonos vendidos" : etq === "servicio" ? "servicios" : etq + "s"}`;
  if (tabla === "fichajes_activos") {
    if (accion === "borrar") return "Cerró su fichaje (fichó la salida)";
    if (fila?.en_descanso === true) return "Empezó un descanso";
    if (fila?.en_descanso === false) return "Volvió del descanso";
    return "Fichó la entrada";
  }
  if (tabla === "fichajes" && accion === "crear") return "Guardó un tramo de fichaje";
  if (tabla === "ajustes") return `Cambió el ajuste «${fila?.clave || existente?.clave || ""}»`;
  if (tabla === "bono_usos") return accion === "crear" ? "Descontó una sesión de un bono" : "Devolvió una sesión de un bono";
  if (tabla === "citas" && accion === "confirmar") {
    const e = fila?.confirmacion;
    return `Marcó ${e === "confirmada" ? "«confirmada: viene»" : e === "no_contesta" ? "«no cogió la llamada»" : "«sin confirmar»"} en la cita${nombre ? ` de ${nombre}` : ""}`;
  }
  if (tabla === "citas" && accion === "asistencia") {
    const a = fila?.asistencia;
    return `Marcó ${a === "no_asistio" ? "«no asistió»" : a === "cancelada" ? "«cancelada»" : "«asiste»"} en la cita${nombre ? ` de ${nombre}` : ""}`;
  }
  const verbo = VERBO[accion] || "Modificó";
  const sobre = accion === "anular_cobro" || accion === "cobrar_plazo" || accion === "asistencia" ? ` ${etq === "venta" ? "la venta" : "la " + etq}` : ` ${["cita", "venta", "cabina"].includes(entidad) ? "la" : entidad === "bloqueo" ? "el" : "el"} ${etq}`;
  const art = ["cita", "venta", "cabina", "metodo_pago", "sesion", "empleada", "categoria_servicio", "leccion"].includes(entidad) ? "la" : "el";
  const resto = accion === "anular_cobro" ? ` la cita` : accion === "cobrar_plazo" ? ` la venta` : "";
  const base = ["anular_cobro", "cobrar_plazo"].includes(accion) ? `${verbo}${resto}` : `${verbo} ${art} ${etq}`;
  void sobre;
  const cuando = cambios && cambios.length && accion === "modificar" ? ` (${cambios.map((c) => c.campo).slice(0, 4).join(", ")})` : "";
  return `${base}${nombre ? ` de ${nombre}` : ""}${cuando}`.replace(" de de ", " de ");
}

// Devuelve las anotaciones (sin id ni fecha: los pone la base de datos) de una escritura
export function construirActividad({ usuario, tabla, op, filas = [], existente = null, filtros = [], codigoCambiado = false }) {
  const entidad = ENTIDAD_DE_TABLA[tabla];
  if (!entidad) return [];
  const base = { usuario_id: usuario?.id || null, usuario_nombre: usuario?.nombre || "—", origen: "app", entidad };
  const idDe = (f) => f?.id || f?.clave || f?.empleada_id || (filtros.find(([c]) => ["id", "clave", "empleada_id", "cita_id"].includes(c)) || [])[1] || null;

  if ((op === "insert" || op === "upsert") && filas.length > 3) {
    const crea = op === "insert";
    const plural = entidad === "cliente" ? "clientes" : entidad === "bono_vendido" ? "bonos vendidos" : entidad === "servicio" ? "servicios" : `${ETIQUETA_ENTIDAD[entidad] || entidad}s`;
    return [{ ...base, entidad_id: null, cliente_id: null, accion: crea ? "crear" : "modificar", resumen: crea ? resumenDe({ tabla, entidad, accion: "crear", esAltaMasiva: true, n: filas.length }) : `Actualizó ${filas.length} ${plural}`, detalle: { cantidad: filas.length, primeros: filas.slice(0, 5).map((f) => nombreDe(f) || f.id) } }];
  }
  if (op === "insert" || op === "upsert") {
    return filas.map((fila) => {
      const accion = tabla === "fichajes_activos" ? "fichar" : op === "upsert" ? "modificar" : "crear";
      return { ...base, entidad_id: idDe(fila), cliente_id: clienteDe(tabla, fila), accion, resumen: resumenDe({ tabla, entidad, accion: op === "upsert" ? "modificar" : "crear", fila, existente }), detalle: tabla === "ajustes" ? { clave: fila.clave } : { datos: sinRuido(fila) } };
    });
  }
  if (op === "update") {
    const fila = filas[0] || {};
    const cambios = cambiosEntre(existente, fila);
    if (codigoCambiado) cambios.push({ campo: "codigo de acceso", antes: "(oculto)", despues: "(cambiado)" });
    if (!cambios.length) return []; // no cambió nada real: no hace falta anotarlo
    const accion = accionDeUpdate(tabla, existente, fila, cambios);
    return [{ ...base, entidad_id: idDe(existente) || idDe(fila), cliente_id: clienteDe(tabla, fila, existente), accion, resumen: resumenDe({ tabla, entidad, accion, fila, existente, cambios }), detalle: tabla === "ajustes" ? { clave: existente?.clave || fila.clave } : { cambios } }];
  }
  if (op === "delete") {
    return [{ ...base, entidad_id: idDe(existente), cliente_id: clienteDe(tabla, existente), accion: "borrar", resumen: resumenDe({ tabla, entidad, accion: "borrar", fila: {}, existente }), detalle: tabla === "ajustes" ? { clave: existente?.clave } : { antes: sinRuido(existente) } }];
  }
  return [];
}
