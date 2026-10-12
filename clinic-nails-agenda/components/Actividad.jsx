"use client";

// Registro de actividad (solo administrador): quién hizo qué y cuándo. Lo anota el servidor;
// aquí solo se LEE. Sección general, historial de una reserva o de un cliente, y el menú de «tres puntitos».

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal, RefreshCw, Search } from "lucide-react";
import { ETIQUETA_ENTIDAD } from "../lib/actividad";

const MUTED = "rgba(var(--ink-rgb),0.68)";
const POR_PAGINA = 300;

const ACCION = {
  crear: ["Creó", "#166534", "rgba(22,163,74,0.16)"],
  modificar: ["Modificó", "var(--accent-text)", "rgba(21,112,239,0.14)"],
  mover: ["Movió", "var(--accent-text)", "rgba(21,112,239,0.14)"],
  cobrar: ["Cobró", "#166534", "rgba(22,163,74,0.16)"],
  cobrar_plazo: ["Cobró plazo", "#166534", "rgba(22,163,74,0.16)"],
  anular_cobro: ["Anuló cobro", "#991B1B", "rgba(220,38,38,0.14)"],
  anular: ["Anuló", "#991B1B", "rgba(220,38,38,0.14)"],
  borrar: ["Borró", "#991B1B", "rgba(220,38,38,0.14)"],
  asistencia: ["Asistencia", "#92400E", "rgba(217,119,6,0.16)"],
  confirmar: ["Confirmación", "#166534", "rgba(22,163,74,0.16)"],
  fichar: ["Fichó", "var(--accent-text)", "rgba(21,112,239,0.14)"],
  login: ["Entró", MUTED, "rgba(var(--ink-rgb),0.08)"],
  login_fallido: ["Intento fallido", "#991B1B", "rgba(220,38,38,0.14)"],
};

const CAMPOS = {
  fecha: "Fecha", inicio: "Hora de inicio", duracion: "Duración (min)", empleada_id: "Empleada", servicio_id: "Servicio", cabina_id: "Cabina",
  cliente_id: "Cliente", clienta: "Nombre en la cita", notas: "Notas", estado_cobro: "Cobro", asistencia: "Asistencia", confirmacion: "Confirmación", confirmacion_por: "Anotada por", confirmacion_en: "Anotada el", pagos: "Pagos", productos: "Productos",
  servicios_extra: "Servicios extra", precio_manual: "Precio manual", nombre: "Nombre", telefono: "Teléfono", email: "Email", nota_fija: "Nota fija",
  favorito: "Favorito", total: "Total", anulada: "Anulada", estado: "Estado", precio: "Precio", stock: "Stock", activo: "Activo", activa: "Activa",
  entrada: "Entrada", salida: "Salida", motivo: "Motivo", sesiones: "Sesiones", rol: "Rol", permisos: "Permisos", horario: "Horario", turnos: "Turnos",
  "codigo de acceso": "Código de acceso", hora_entrada: "Hora de entrada", en_descanso: "En descanso", bonos: "Bonos", cobrada_por: "Cobrada por", cobrada_en: "Cobrada el",
};
const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(Math.round(m % 60)).padStart(2, "0")}`;

function formato(campo, v, ctx) {
  if (v === null || v === undefined || v === "") return "—";
  const nombre = (lista, id) => lista?.find((x) => x.id === id)?.nombre || String(v);
  if (campo === "empleada_id" || campo === "cobrada_por" || campo === "creado_por") return nombre(ctx.empleados, v);
  if (campo === "servicio_id") return nombre(ctx.servicios, v);
  if (campo === "cabina_id") return nombre(ctx.cabinas, v);
  if (campo === "cliente_id") return nombre(ctx.clientes, v);
  if (["inicio", "hora_entrada", "entrada", "salida"].includes(campo) && typeof v === "number") return hhmm(v);
  if (typeof v === "boolean") return v ? "Sí" : "No";
  if (campo === "estado_cobro") return v === "cobrada" ? "Cobrada" : v === "pendiente" ? "Pendiente" : String(v);
  if (campo === "asistencia") return { prevista: "Asiste", no_asistio: "No asistió", cancelada: "Cancelada" }[v] || String(v);
  if (campo === "pagos" && typeof v === "string") {
    try {
      const arr = JSON.parse(v);
      if (Array.isArray(arr)) return arr.length ? arr.map((p) => `${ctx.metodosPago?.find((m) => m.id === p.metodoId)?.nombre || (p.metodoId === "bono" ? "Bono" : p.metodoId)} ${p.importe} €`).join(" + ") : "sin pagos";
    } catch (e) {
      /* se enseña tal cual */
    }
  }
  return String(v);
}

const cuando = (iso) => (iso ? new Date(iso).toLocaleString("es-ES", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—");

// ---------------------------------------------------------------------------

// El menú de «tres puntitos». En el móvil se abre como un DIÁLOGO CENTRADO con fondo (antes se pegaba al botón y, si este estaba a la
// izquierda, se salía de la pantalla); en pantallas anchas es un desplegable que se queda siempre dentro de la ventana. Se cierra al tocar
// fuera, con «Cerrar» o con Escape.
const ANCHO_MENU = 260;
export function MenuPuntos({ items, etiqueta = "Más opciones" }) {
  const [abierto, setAbierto] = useState(false);
  const [pos, setPos] = useState(null); // null = diálogo centrado (móvil); { top, left } = desplegable junto al botón
  const boton = useRef(null);
  const cerrar = () => setAbierto(false);
  function abrir() {
    const r = boton.current?.getBoundingClientRect();
    const ancho = typeof window !== "undefined" ? window.innerWidth : 1280;
    if (ancho < 700 || !r) setPos(null);
    else setPos({ top: Math.max(8, r.bottom + 6), left: Math.min(Math.max(8, r.right - ANCHO_MENU), ancho - ANCHO_MENU - 8) });
    setAbierto((a) => !a);
  }
  useEffect(() => {
    if (!abierto) return undefined;
    // Escape cierra SOLO el menú (se escucha antes que la ventana de debajo y se corta ahí: antes cerraba también la cita o la ficha)
    const esc = (e) => { if (e.key === "Escape") { e.stopPropagation(); e.stopImmediatePropagation(); setAbierto(false); } };
    window.addEventListener("keydown", esc, true);
    return () => window.removeEventListener("keydown", esc, true);
  }, [abierto]);
  const caja = { background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, boxShadow: "0 18px 44px -12px rgba(0,0,0,0.45)", padding: 6 };
  const item = { display: "block", width: "100%", textAlign: "left", padding: "12px 14px", background: "transparent", border: "none", borderRadius: 10, fontSize: 14.5, color: "var(--text)", cursor: "pointer", minHeight: 44 };
  const lista = (
    <div role="menu" data-menu-lista={pos ? "desplegable" : "centrado"} aria-label={etiqueta} onClick={(e) => e.stopPropagation()} style={pos ? { ...caja, position: "fixed", top: pos.top, left: pos.left, width: ANCHO_MENU, maxHeight: "70vh", overflowY: "auto" } : { ...caja, width: "min(92vw, 380px)", maxHeight: "80vh", overflowY: "auto" }}>
      {items.map((it) => (
        <button key={it.texto} type="button" role="menuitem" onClick={() => { setAbierto(false); it.onClick(); }} style={item}>{it.texto}</button>
      ))}
      {!pos && <button type="button" data-menu-cerrar="1" onClick={cerrar} style={{ ...item, textAlign: "center", fontWeight: 600, marginTop: 4, borderTop: "1px solid var(--line)", borderRadius: 0, color: "rgba(var(--ink-rgb),0.72)" }}>Cerrar</button>}
    </div>
  );
  return (
    <div style={{ position: "relative", display: "inline-block" }} data-menu-puntos="1">
      <button ref={boton} type="button" aria-label={etiqueta} aria-haspopup="menu" aria-expanded={abierto} onClick={abrir} style={{ background: "rgba(var(--ink-rgb),0.06)", border: "none", borderRadius: 10, width: 36, height: 36, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text)" }}>
        <MoreHorizontal size={18} aria-hidden="true" />
      </button>
      {abierto && createPortal(
        <div data-menu-fondo="1" onClick={cerrar} style={{ position: "fixed", inset: 0, zIndex: 400, background: pos ? "transparent" : "rgba(10,18,38,0.45)", display: pos ? "block" : "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          {lista}
        </div>,
        document.body
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

export function ListaActividad({ entradas, ctx, vacio }) {
  const [abierta, setAbierta] = useState(null);
  if (!entradas.length) return <div style={{ padding: 18, textAlign: "center", color: MUTED }}>{vacio}</div>;
  return (
    <div data-lista-actividad="1">
      {entradas.map((e) => {
        const [textoAccion, color, fondo] = ACCION[e.accion] || [e.accion, MUTED, "rgba(var(--ink-rgb),0.08)"];
        const d = e.detalle || {};
        const tiene = (d.cambios && d.cambios.length) || d.datos || d.antes || d.titulo || d.cantidad;
        const abiertaEsta = abierta === e.id;
        return (
          <div key={e.id} data-actividad-id={e.id} data-accion={e.accion} style={{ padding: "12px 14px", borderTop: "1px solid var(--line)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "baseline" }}>
              <div style={{ fontSize: 12.5, color: MUTED }}>{cuando(e.creadoEn)}</div>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>
                {e.usuarioNombre}
                {e.origen === "online" && <span data-origen-online="1" style={{ marginLeft: 6, background: "#0E7490", color: "#fff", fontSize: 10.5, padding: "1px 7px", borderRadius: 999, fontWeight: 700 }}>Reserva online</span>}
                {e.origen === "ghl" && <span data-origen-ghl="1" style={{ marginLeft: 6, background: "#7C3AED", color: "#fff", fontSize: 10.5, padding: "1px 7px", borderRadius: 999, fontWeight: 700 }}>GHL · IA</span>}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 4 }}>
              <span style={{ background: fondo, color, fontWeight: 700, fontSize: 11.5, padding: "2px 9px", borderRadius: 999, whiteSpace: "nowrap" }}>{textoAccion}</span>
              <span style={{ fontSize: 11.5, color: MUTED }}>{ETIQUETA_ENTIDAD[e.entidad] || e.entidad}</span>
              <span style={{ fontSize: 14 }}>{e.resumen}</span>
              {tiene && <button type="button" className="link-btn" style={{ fontSize: 12.5 }} onClick={() => setAbierta(abiertaEsta ? null : e.id)} aria-expanded={abiertaEsta}>{abiertaEsta ? "Ocultar detalle" : "Ver detalle"}</button>}
            </div>
            {abiertaEsta && (
              <div data-detalle-actividad="1" style={{ marginTop: 8, background: "rgba(var(--ink-rgb),0.04)", borderRadius: 10, padding: "8px 12px", fontSize: 13 }}>
                {d.cambios && d.cambios.map((c, i) => (
                  <div key={i}><strong>{CAMPOS[c.campo] || c.campo}:</strong> <span style={{ color: MUTED }}>{formato(c.campo, c.antes, ctx)}</span> → <strong>{formato(c.campo, c.despues, ctx)}</strong></div>
                ))}
                {(d.datos || d.antes) && Object.entries(d.datos || d.antes).filter(([, v]) => v !== null && v !== "").map(([k, v]) => (
                  <div key={k}><strong>{CAMPOS[k] || k}:</strong> {formato(k, v, ctx)}</div>
                ))}
                {d.titulo && <div><strong>Título en GHL:</strong> «{d.titulo}»{d.servicio ? ` · servicio: ${d.servicio}` : ""}{d.hora ? ` · ${d.fecha} ${d.hora}` : ""}{d.empleada ? ` · ${d.empleada}` : ""}</div>}
                {d.cantidad && <div><strong>Cantidad:</strong> {d.cantidad}{d.primeros ? ` (por ejemplo: ${d.primeros.join(", ")})` : ""}</div>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function useActividad(cargar, filtros) {
  const [entradas, setEntradas] = useState([]);
  const [estado, setEstado] = useState({ cargando: true, error: "", hayMas: false });
  const clave = JSON.stringify(filtros || []);
  const recargar = useCallback(async () => {
    setEstado((s) => ({ ...s, cargando: true, error: "" }));
    try {
      const r = await cargar({ filtros: filtros || [], limite: POR_PAGINA });
      setEntradas(r);
      setEstado({ cargando: false, error: "", hayMas: r.length >= POR_PAGINA });
    } catch (err) {
      const falta = /actividad/i.test(err?.message || "");
      setEstado({ cargando: false, hayMas: false, error: falta ? "El registro de actividad aún no está creado: pega el supabase/schema.sql más reciente en Supabase y vuelve a abrir esta pantalla." : err?.message || "No se pudo cargar la actividad." });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargar, clave]);
  useEffect(() => { recargar(); }, [recargar]);
  const masAntiguas = async () => {
    const ultima = entradas[entradas.length - 1];
    if (!ultima) return;
    try {
      const r = await cargar({ filtros: filtros || [], limite: POR_PAGINA, antes: ultima.creadoEn });
      setEntradas((e) => [...e, ...r]);
      setEstado((s) => ({ ...s, hayMas: r.length >= POR_PAGINA }));
    } catch (err) {
      setEstado((s) => ({ ...s, error: err?.message || "No se pudieron cargar más." }));
    }
  };
  return { entradas, estado, recargar, masAntiguas };
}

// Historial de UNA reserva o de UN cliente
export function ActividadModal({ ui, titulo, filtros, cargar, ctx, nivel = 2, onClose }) {
  const { ModalShell } = ui;
  const { entradas, estado, masAntiguas } = useActividad(cargar, filtros);
  return (
    <ModalShell title={titulo} nivel={nivel} onClose={onClose} ancho={680}>
      <div data-actividad-modal="1">
        <p style={{ marginTop: -4, fontSize: 13, color: MUTED }}>Todo lo que se ha hecho, de más reciente a más antiguo. Queda guardado siempre y solo lo ve el administrador.</p>
        {estado.cargando && <div style={{ padding: 14, color: MUTED }}>Cargando…</div>}
        {estado.error && <div role="alert" style={{ color: "var(--danger)", fontSize: 13.5, padding: 10 }}>{estado.error}</div>}
        {!estado.cargando && !estado.error && <ListaActividad entradas={entradas} ctx={ctx} vacio="Todavía no hay actividad registrada para esto." />}
        {estado.hayMas && <div style={{ textAlign: "center", marginTop: 10 }}><button type="button" className="btn btn-ghost" onClick={masAntiguas}>Cargar anteriores</button></div>}
      </div>
    </ModalShell>
  );
}

// Sección general (menú «Actividad»)
export default function ActividadSeccion({ cargar, ctx }) {
  const { entradas, estado, recargar, masAntiguas } = useActividad(cargar, []);
  const [usuario, setUsuario] = useState("");
  const [tipo, setTipo] = useState("");
  const [texto, setTexto] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const usuarios = useMemo(() => [...new Set(entradas.map((e) => e.usuarioNombre))].sort((a, b) => a.localeCompare(b, "es")), [entradas]);
  const tipos = useMemo(() => [...new Set(entradas.map((e) => e.entidad))].sort(), [entradas]);
  const filtradas = useMemo(() => {
    const t = texto.trim().toLowerCase();
    return entradas.filter((e) => {
      if (usuario && e.usuarioNombre !== usuario) return false;
      if (tipo && e.entidad !== tipo) return false;
      if (t && !`${e.resumen} ${e.usuarioNombre}`.toLowerCase().includes(t)) return false;
      const dia = e.creadoEn ? new Date(e.creadoEn) : null;
      const iso = dia ? `${dia.getFullYear()}-${String(dia.getMonth() + 1).padStart(2, "0")}-${String(dia.getDate()).padStart(2, "0")}` : "";
      if (desde && iso < desde) return false;
      if (hasta && iso > hasta) return false;
      return true;
    });
  }, [entradas, usuario, tipo, texto, desde, hasta]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, marginBottom: 4 }}>Actividad</h1>
          <p style={{ color: MUTED, margin: 0, fontSize: 14 }}>Todo lo que hacen las empleadas desde que entran con su código, y las reservas que llegan de GHL. Queda guardado siempre y no se puede borrar ni modificar.</p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={recargar}><RefreshCw size={15} /> Actualizar</button>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <div style={{ position: "relative", flex: "1 1 220px", maxWidth: 320 }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: 12, color: MUTED }} aria-hidden="true" />
          <input className="input" style={{ paddingLeft: 34 }} aria-label="Buscar en la actividad" placeholder="Buscar (cliente, acción…)" value={texto} onChange={(e) => setTexto(e.target.value)} />
        </div>
        <select className="input" style={{ maxWidth: 220 }} aria-label="Filtrar por persona" value={usuario} onChange={(e) => setUsuario(e.target.value)}>
          <option value="">Todas las personas</option>
          {usuarios.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
        <select className="input" style={{ maxWidth: 200 }} aria-label="Filtrar por tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="">Todo tipo de cosa</option>
          {tipos.map((t) => <option key={t} value={t}>{ETIQUETA_ENTIDAD[t] || t}</option>)}
        </select>
        <input className="input" style={{ maxWidth: 160 }} type="date" aria-label="Desde" value={desde} onChange={(e) => setDesde(e.target.value)} />
        <input className="input" style={{ maxWidth: 160 }} type="date" aria-label="Hasta" value={hasta} onChange={(e) => setHasta(e.target.value)} />
      </div>

      <div className="card" data-actividad-seccion="1">
        {estado.cargando && <div style={{ padding: 18, color: MUTED }}>Cargando…</div>}
        {estado.error && <div role="alert" style={{ color: "var(--danger)", padding: 18, fontSize: 14 }}>{estado.error}</div>}
        {!estado.cargando && !estado.error && <ListaActividad entradas={filtradas} ctx={ctx} vacio={entradas.length ? "Nada coincide con esos filtros." : "Todavía no hay actividad registrada."} />}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, fontSize: 13, color: MUTED, flexWrap: "wrap", gap: 8 }}>
        <span>{filtradas.length} de {entradas.length} anotaciones cargadas</span>
        {estado.hayMas && <button type="button" className="btn btn-ghost" onClick={masAntiguas}>Cargar anteriores</button>}
      </div>
    </div>
  );
}
