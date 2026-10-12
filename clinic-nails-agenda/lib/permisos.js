// Matriz de permisos DEL SERVIDOR. Funciones puras: se pueden probar enteras.
// La interfaz oculta botones, pero la defensa real está aquí: aunque alguien
// manipule la app en su navegador, el servidor rechaza lo que no le toca.
//
// Roles: "admin" (todo) y "empleada" (según su lista de permisos).
// Permiso extra «anularCobros» = encargada: puede anular una venta cobrada.

export const TABLAS = ["empleadas", "cabinas", "servicios", "clientes", "metodos_pago", "productos", "citas", "fichajes", "fichajes_activos", "ajustes", "bloqueos", "bonos", "ventas", "bonos_vendidos", "bono_usos", "actividad", "categorias_servicios", "lecciones", "resultados_cursos", "avisos", "avisos_vistos", "marketing_contactos"];
export const OPERACIONES = ["select", "insert", "update", "delete", "upsert"];

const esAdmin = (u) => u?.rol === "admin";
const tiene = (u, permiso) => esAdmin(u) || Boolean(u?.permisos?.[permiso]);
export const puedeAnularCobros = (u) => esAdmin(u) || Boolean(u?.permisos?.anularCobros);

// Columnas que SOLO escribe el servidor (el navegador nunca debe poder fijarlas)
const SOLO_SERVIDOR = {
  citas: ["ghl_event_id", "ghl_calendar_id", "origen", "ghl_snapshot"],
  clientes: ["ghl_contact_id"],
  bloqueos: ["ghl_event_id", "ghl_calendar_id"],
  servicios: ["ghl_calendar_id"], // el calendario de GHL de cada servicio lo fija el servidor
  empleadas: ["codigo_hash"],
};

export function limpiarDatos(tabla, fila, usuario) {
  const copia = { ...(fila || {}) };
  (SOLO_SERVIDOR[tabla] || []).forEach((k) => delete copia[k]);
  if (tabla === "empleadas" && !esAdmin(usuario)) {
    // quien no es administrador nunca puede darse (ni dar) rol, permisos ni cambiar códigos
    delete copia.rol;
    delete copia.permisos;
    delete copia.codigo;
    delete copia.objetivo_extra_semanal; // el objetivo de ventas extra de cada empleada lo fija el administrador
    delete copia.objetivo_ticket_medio; // y el de ticket medio también
    delete copia.ghl_schedule_id; // el horario de GHL de cada empleada lo gestiona solo el servidor
    delete copia.ghl_calendar_id; // el calendario de GHL de cada empleada también es cosa del administrador
  }
  return copia;
}

// null, undefined y "" son lo mismo ("sin valor"): no deben contar como un cambio
const vacio = (v) => (v === undefined || v === "" ? null : v);

const IGNORAR_AL_COMPARAR = ["updated_at", "modificado_por", "created_at"];

// Qué columnas cambia realmente un parche respecto a la fila que ya existe
export function camposCambiados(existente, parche) {
  return Object.keys(parche || {}).filter((k) => {
    if (IGNORAR_AL_COMPARAR.includes(k)) return false;
    return JSON.stringify(vacio(parche[k])) !== JSON.stringify(vacio(existente?.[k]));
  });
}

const si = () => ({ ok: true });
const no = (error = "No tienes permiso para hacer esto.") => ({ ok: false, error });

// ¿El cambio solo AÑADE pagos a una venta (respetando los anteriores y sin superar el total)?
function esSoloNuevoPago(existente, datos) {
  if (!existente || existente.anulada) return false;
  if (!camposCambiados(existente, datos).every((k) => k === "pagos")) return false;
  const antes = Array.isArray(existente.pagos) ? existente.pagos : [];
  const despues = Array.isArray(datos?.pagos) ? datos.pagos : [];
  if (despues.length < antes.length || JSON.stringify(despues.slice(0, antes.length)) !== JSON.stringify(antes)) return false;
  const nuevas = despues.slice(antes.length);
  if (!nuevas.every((p) => p && typeof p.metodoId === "string" && p.metodoId !== "bono" && Number(p.importe) > 0)) return false;
  const total = despues.reduce((s, p) => s + (Number(p.importe) || 0), 0);
  return total <= Number(existente.total) + 0.01;
}

export function evaluar({ usuario, tabla, op, datos, existente, filtros, lote = 1 }) {
  if (!usuario) return no("Sesión no válida.");
  if (!TABLAS.includes(tabla)) return no("Tabla no permitida.");
  if (!OPERACIONES.includes(op)) return no("Operación no permitida.");

  // El registro de actividad: solo el administrador lo lee y NADIE lo escribe desde la app (lo anota el servidor)
  if (tabla === "actividad") {
    if (usuario.rol !== "admin") return no("Solo el administrador puede ver la actividad.");
    return op === "select" ? si() : no("El registro de actividad no se puede modificar ni borrar.");
  }

  // La lectura la puede hacer cualquiera con sesión; lo que ve se filtra aparte (filtrarLectura)
  if (op === "select") return si();

  const admin = esAdmin(usuario);
  const escribe = op === "insert" || op === "update" || op === "delete" || op === "upsert";
  if (!escribe) return no();

  switch (tabla) {
    case "citas": {
      if (!tiene(usuario, "agenda")) return no();
      if (existente?.estado_cobro === "cobrada" && !puedeAnularCobros(usuario)) {
        if (op === "delete") return no("Solo el administrador o un encargado puede borrar o anular una venta ya cobrada.");
        if (op === "update") {
          const raros = camposCambiados(existente, datos).filter((k) => k !== "notas");
          if (raros.length) return no("Esta venta ya está cobrada: solo el administrador o un encargado puede anularla para modificarla.");
        }
      }
      return si();
    }
    case "bloqueos":
      return tiene(usuario, "agenda") ? si() : no();
    // Bonos: el catálogo lo gestiona quien tenga el permiso «bonos»; vender y usar sesiones, cualquiera con agenda;
    // anular una venta, un bono o devolver una sesión, solo administrador o encargada (como anular un cobro).
    case "bonos":
      return tiene(usuario, "bonos") ? si() : no("No tienes permiso para gestionar los bonos.");
    case "ventas":
    case "bonos_vendidos":
      if (op === "insert") return tiene(usuario, "agenda") ? si() : no();
      if (op === "update") {
        if (puedeAnularCobros(usuario)) return si();
        // Cobrar un plazo de un bono: cualquiera con agenda, pero SOLO añadiendo pagos (sin tocar lo anterior ni pasarse del total)
        if (tabla === "ventas" && tiene(usuario, "agenda") && esSoloNuevoPago(existente, datos)) return si();
        return no("Solo el administrador o un encargado puede anular una venta o un bono.");
      }
      return admin ? si() : no("Solo el administrador puede eliminar ventas.");
    case "bono_usos":
      if (op === "insert") return tiene(usuario, "agenda") ? si() : no();
      if (op === "delete") return puedeAnularCobros(usuario) ? si() : no("Solo el administrador o un encargado puede devolver una sesión de un bono.");
      return no();
    case "clientes": {
      if (admin) return si();
      if (!tiene(usuario, "agenda")) return no();
      if (op === "delete") return no("Solo el administrador puede eliminar clientes.");
      if (op === "insert") return lote > 1 ? no("Solo el administrador puede importar clientes.") : si();
      if (op === "update") {
        const raros = camposCambiados(existente, datos).filter((k) => !["nota_fija", "favorito"].includes(k));
        return raros.length ? no("Solo el administrador puede modificar los datos de un cliente.") : si();
      }
      return no();
    }
    case "productos": {
      if (op === "delete") return admin ? si() : no("Solo el administrador puede eliminar productos.");
      if (tiene(usuario, "productos")) return si();
      // al cobrar, cualquiera con agenda puede descontar stock (y solo eso)
      if (op === "update" && tiene(usuario, "agenda")) {
        const raros = camposCambiados(existente, datos).filter((k) => k !== "stock");
        return raros.length ? no() : si();
      }
      return no();
    }
    case "servicios":
      if (op === "delete") return admin ? si() : no("Solo el administrador puede eliminar servicios.");
      return tiene(usuario, "servicios") ? si() : no();
    case "categorias_servicios":
      return tiene(usuario, "servicios") ? si() : no();
    // Cursos: las clases las gestiona el administrador; los resultados SOLO los escribe el servidor (corrige el test él mismo)
    case "lecciones":
      return admin ? si() : no("Solo el administrador puede gestionar las clases.");
    case "resultados_cursos":
      return no("Los resultados de los tests los guarda el servidor al corregirlos.");
    // Avisos del popup: los crea el administrador; cada empleada solo anota que ha visto los suyos
    case "avisos":
      return admin ? si() : no("Solo el administrador puede gestionar los avisos.");
    // Marketing: solo el administrador lee y escribe
    case "marketing_contactos":
      return admin ? si() : no("Solo el administrador puede ver y anotar el marketing.");
    case "avisos_vistos": {
      if (admin) return si();
      if (op === "delete") return no("Solo el administrador puede borrar el historial de avisos.");
      const filas = Array.isArray(datos) ? datos : [datos];
      return filas.length > 0 && filas.every((f) => f?.empleada_id === usuario.id) ? si() : no("Solo puedes marcar tus propios avisos.");
    }
    case "cabinas":
      return tiene(usuario, "cabinas") ? si() : no();
    case "metodos_pago":
    case "ajustes":
      return admin ? si() : no("Solo el administrador puede cambiar esto.");
    case "empleadas": {
      if (op === "delete") return admin ? si() : no("Solo el administrador puede eliminar empleadas.");
      if (!tiene(usuario, "empleadas")) return no();
      // El perfil de administrador solo lo toca el administrador (ni nombre, ni foto, ni horario, ni estado…)
      if (!admin && existente?.rol === "admin") return no("El perfil de administrador solo lo puede modificar el administrador.");
      return si();
    }
    case "fichajes": {
      if (admin) return si();
      if (op !== "insert") return no();
      return datos?.empleada_id === usuario.id ? si() : no("Solo puedes fichar por ti misma.");
    }
    case "fichajes_activos": {
      if (admin) return si();
      const propio =
        datos?.empleada_id === usuario.id ||
        existente?.empleada_id === usuario.id ||
        (filtros || []).some(([c, v]) => c === "empleada_id" && v === usuario.id);
      return propio ? si() : no("Solo puedes fichar por ti misma.");
    }
    default:
      return no();
  }
}

// Lo que cada persona puede VER (el servidor recorta las filas antes de enviarlas)
export function filtrarLectura(usuario, tabla, filas) {
  const lista = Array.isArray(filas) ? filas : [];
  const admin = esAdmin(usuario);
  if (tabla === "empleadas") {
    return lista.map((f) => {
      const { codigo, codigo_hash, ...resto } = f;
      return { ...resto, tiene_codigo: Boolean(codigo_hash || codigo) };
    });
  }
  if (tabla === "ajustes" && !admin) return lista.filter((f) => f.clave !== "webhook");
  if (tabla === "fichajes" && !admin) return lista.filter((f) => f.empleada_id === usuario.id);
  if (tabla === "resultados_cursos" && !admin) return lista.filter((f) => f.empleada_id === usuario.id); // cada una ve solo los suyos
  if (tabla === "avisos_vistos" && !admin) return lista.filter((f) => f.empleada_id === usuario.id);
  if (tabla === "marketing_contactos" && !admin) return []; // las empleadas no ven nada de marketing
  if (tabla === "avisos" && !admin) return lista.filter((a) => a.activo !== false && ((a.destinatarios || []).length === 0 || a.destinatarios.includes(usuario.id))); // solo los suyos
  if (tabla === "lecciones" && !admin) return lista.map((f) => ({ ...f, preguntas: (f.preguntas || []).map(({ correcta, ...resto }) => resto) })); // sin las respuestas correctas
  return lista;
}
