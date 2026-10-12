"use client";

// Sección «Bonos» (catálogo y bonos vendidos) y formulario de «Nueva venta» sin cita
// (productos y/o bonos). Los descuentos de sesión se hacen al cobrar una cita.

import React, { useMemo, useState } from "react";
import { Ticket, Plus, Minus, X, Pencil, ShoppingBag, Search } from "lucide-react";
import { buscarClientes, claveTelefono } from "../lib/clientes";
import { saldoBono, estadoBono, planDeVenta, valorSesion, pendienteVenta, importePagado, serviciosDe, METODO_BONO } from "../lib/bonos";
import { euros } from "../lib/informes";
import { normalizarTexto } from "../lib/agenda";
import SelectorBuscable from "./SelectorBuscable";

const MUTED = "rgba(var(--ink-rgb),0.68)";
const fechaCorta = (iso) => (iso ? new Date(iso + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }) : "—");
const idLocal = () => Math.random().toString(36).slice(2, 10);

const ESTADO = {
  activo: { texto: "Activo", bg: "rgba(22,163,74,0.16)", fg: "#166534" },
  agotado: { texto: "Agotado", bg: "rgba(var(--ink-rgb),0.08)", fg: MUTED },
  caducado: { texto: "Caducado", bg: "rgba(217,119,6,0.16)", fg: "#92400E" },
  anulado: { texto: "Anulado", bg: "rgba(220,38,38,0.14)", fg: "#991B1B" },
};
export function EtiquetaEstado({ estado }) {
  const e = ESTADO[estado] || ESTADO.activo;
  return <span style={{ background: e.bg, color: e.fg, fontWeight: 600, fontSize: 11.5, padding: "2px 8px", borderRadius: 999, whiteSpace: "nowrap" }}>{e.texto}</span>;
}

// ---------------------------------------------------------------------------
// Sección
// ---------------------------------------------------------------------------

export default function BonosSeccion({ ui, bonos, bonosVendidos, usos, servicios, clientes, hoy, ventas = [], metodosPago = [], puedeGestionar, puedeAnular, onNuevo, onEditar, onToggleActivo, onVender, onAnular, onCobrarPlazo }) {
  const { ConfirmDialog } = ui;
  const [tab, setTab] = useState("catalogo");
  const [filtro, setFiltro] = useState("activo");
  const [busqueda, setBusqueda] = useState("");
  const [aAnular, setAAnular] = useState(null);
  const [plazoDe, setPlazoDe] = useState(null); // bono vendido del que se cobra un plazo

  const servicio = (id) => servicios.find((s) => s.id === id);
  const clientePorId = useMemo(() => new Map(clientes.map((c) => [c.id, c])), [clientes]);

  const filasVendidos = useMemo(() => {
    const ids = busqueda.trim() ? new Set(buscarClientes(clientes, busqueda).map((c) => c.id)) : null;
    return bonosVendidos
      .map((bv) => ({ bv, estado: estadoBono(bv, usos, hoy), saldo: saldoBono(bv, usos) }))
      .filter(({ bv, estado }) => (filtro === "todos" || estado === filtro) && (!ids || ids.has(bv.clienteId)))
      .sort((a, b) => b.bv.fechaVenta.localeCompare(a.bv.fechaVenta));
  }, [bonosVendidos, usos, hoy, filtro, busqueda, clientes]);

  const contadores = useMemo(() => {
    const n = { activo: 0, agotado: 0, caducado: 0, anulado: 0 };
    bonosVendidos.forEach((bv) => { n[estadoBono(bv, usos, hoy)]++; });
    return n;
  }, [bonosVendidos, usos, hoy]);

  const tabBtn = (id, texto) => (
    <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? "btn btn-gold" : "btn btn-ghost"} style={{ minHeight: 36 }} onClick={() => setTab(id)}>{texto}</button>
  );
  const chip = (valor, texto, n) => (
    <button key={valor} type="button" aria-pressed={filtro === valor} className={filtro === valor ? "btn btn-gold" : "btn btn-ghost"} style={{ minHeight: 32, padding: "3px 12px", fontSize: 13 }} onClick={() => setFiltro(valor)}>
      {texto}{n !== undefined ? ` · ${n}` : ""}
    </button>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, marginBottom: 4 }}>Bonos</h1>
          <p style={{ color: MUTED, margin: 0, fontSize: 14 }}>Crea packs de sesiones, véndeselos a un cliente y descuenta cada sesión al cobrar su cita.</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="btn btn-ghost" onClick={() => onVender(null)}><ShoppingBag size={15} /> Vender un bono</button>
          {puedeGestionar && <button type="button" className="btn btn-gold" onClick={onNuevo}><Plus size={15} /> Nuevo bono</button>}
        </div>
      </div>

      <div role="tablist" style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {tabBtn("catalogo", "Catálogo")}
        {tabBtn("vendidos", `Vendidos · ${bonosVendidos.length}`)}
      </div>

      {tab === "catalogo" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {bonos.length === 0 && <div className="card" style={{ padding: 20, color: MUTED }}>Todavía no hay bonos. {puedeGestionar ? "Pulsa «Nuevo bono» para crear el primero." : "Pídele al administrador que cree alguno."}</div>}
          {bonos.map((b) => {
            const nombres = serviciosDe(b).map((id) => servicio(id)?.nombre).filter(Boolean);
            const s = serviciosDe(b).length === 1 ? servicio(serviciosDe(b)[0]) : null;
            const porSesion = b.sesiones ? b.precio / b.sesiones : 0;
            const ahorro = s && s.precio > 0 && b.sesiones ? Math.round((1 - porSesion / s.precio) * 100) : null;
            return (
              <div key={b.id} className="card" data-bono-id={b.id} style={{ padding: 16, opacity: b.activo ? 1 : 0.6, display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <strong style={{ fontSize: 16 }}>{b.nombre}</strong>
                  {!b.activo && <EtiquetaEstado estado="anulado" />}
                </div>
                <div style={{ color: MUTED, fontSize: 13 }} data-servicios-de-bono={b.id}>{nombres.length ? nombres.join(" · ") : "Cualquier servicio"} · {b.sesiones} {b.sesiones === 1 ? "sesión" : "sesiones"}</div>
                <div style={{ fontSize: 22, fontWeight: 600 }}>{euros(b.precio)}</div>
                <div style={{ color: MUTED, fontSize: 12.5 }}>
                  {euros(porSesion)} por sesión{ahorro !== null && ahorro > 0 ? ` · ahorro del ${ahorro} % sobre la tarifa` : ""}
                  <br />{b.caducidadDias ? `Caduca a los ${b.caducidadDias} días de la compra` : "Sin caducidad"}
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  <button type="button" className="btn btn-gold" style={{ minHeight: 34, padding: "4px 12px", fontSize: 13 }} disabled={!b.activo} onClick={() => onVender(b.id)}>Vender</button>
                  {puedeGestionar && <button type="button" className="btn btn-ghost" style={{ minHeight: 34, padding: "4px 12px", fontSize: 13 }} onClick={() => onEditar(b)} aria-label={`Editar ${b.nombre}`}><Pencil size={13} /> Editar</button>}
                  {puedeGestionar && <button type="button" className="btn btn-ghost" style={{ minHeight: 34, padding: "4px 12px", fontSize: 13 }} onClick={() => onToggleActivo(b)}>{b.activo ? "Desactivar" : "Activar"}</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "vendidos" && (
        <div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }} role="group" aria-label="Filtrar bonos vendidos">
            {chip("activo", "Activos", contadores.activo)}
            {chip("agotado", "Agotados", contadores.agotado)}
            {chip("caducado", "Caducados", contadores.caducado)}
            {chip("anulado", "Anulados", contadores.anulado)}
            {chip("todos", "Todos")}
          </div>
          <div style={{ position: "relative", maxWidth: 360, marginBottom: 14 }}>
            <Search size={15} style={{ position: "absolute", left: 12, top: 12, color: MUTED }} aria-hidden="true" />
            <input className="input" style={{ paddingLeft: 34 }} aria-label="Buscar cliente con bono" placeholder="Cliente: nombre o parte del teléfono…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>
          <div className="card" style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
              <thead>
                <tr style={{ background: "rgba(var(--ink-rgb),0.04)", textAlign: "left" }}>
                  {["Cliente", "Bono", "Sesiones", "Comprado", "Caduca", "Precio", "Pago", "Estado", ""].map((h, i) => <th key={i} style={{ padding: "10px 14px", fontWeight: 500, color: MUTED, fontSize: 12 }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filasVendidos.length === 0 && <tr><td colSpan={9} style={{ padding: 18, textAlign: "center", color: MUTED }}>No hay bonos con ese filtro.</td></tr>}
                {filasVendidos.map(({ bv, estado, saldo }) => (
                  <tr key={bv.id} data-bono-vendido={bv.id} style={{ borderTop: "1px solid var(--line)" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 500 }}>{clientePorId.get(bv.clienteId)?.nombre || "—"}<div style={{ fontSize: 12, color: MUTED, fontWeight: 400 }}>{clientePorId.get(bv.clienteId)?.telefono || ""}</div></td>
                    <td style={{ padding: "10px 14px" }}>{bv.nombre}</td>
                    <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}><strong>{saldo.restantes}</strong> de {saldo.total} <span style={{ color: MUTED }}>({saldo.usadas} usadas)</span></td>
                    <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>{fechaCorta(bv.fechaVenta)}</td>
                    <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>{bv.caduca ? fechaCorta(bv.caduca) : "Sin caducidad"}</td>
                    <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>{euros(bv.precio)}</td>
                    <td style={{ padding: "10px 14px", fontSize: 13 }} data-pago-bono-vendido={bv.id}>
                      {(() => {
                        const venta = ventas.find((x) => x.id === bv.ventaId);
                        if (!venta || venta.anulada) return <span style={{ color: MUTED }}>—</span>;
                        const deuda = pendienteVenta(venta);
                        if (deuda <= 0.005) return <span style={{ color: MUTED }}>Pagado</span>;
                        return (
                          <div>
                            <strong style={{ color: "var(--danger)" }}>Debe {euros(deuda)}</strong>
                            <div style={{ color: MUTED, fontSize: 12 }}>pagado {euros(importePagado(venta))} de {euros(venta.total)}</div>
                            {estado !== "anulado" && <button type="button" className="btn btn-gold" style={{ minHeight: 28, padding: "2px 10px", fontSize: 12.5, marginTop: 4 }} onClick={() => setPlazoDe({ bv, venta })} aria-label={`Cobrar plazo de ${clientePorId.get(bv.clienteId)?.nombre || ""}`}>Cobrar plazo</button>}
                          </div>
                        );
                      })()}
                    </td>
                    <td style={{ padding: "10px 14px" }}><EtiquetaEstado estado={estado} /></td>
                    <td style={{ padding: "6px 10px" }}>
                      {puedeAnular && estado !== "anulado" && saldo.usadas === 0 && (
                        <button type="button" className="btn btn-ghost" style={{ minHeight: 30, padding: "3px 10px", fontSize: 12.5, color: "var(--danger)" }} onClick={() => setAAnular(bv)} aria-label={`Anular el bono de ${clientePorId.get(bv.clienteId)?.nombre || ""}`}>Anular</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 12.5, color: MUTED, marginTop: 10 }}>Las sesiones se descuentan al cobrar una cita. Un bono con sesiones ya usadas no se puede anular.</p>
        </div>
      )}

      {plazoDe && (
        <PlazoModal
          ui={ui} venta={plazoDe.venta} nombreBono={plazoDe.bv.nombre} cliente={clientePorId.get(plazoDe.bv.clienteId)} metodosPago={metodosPago}
          onClose={() => setPlazoDe(null)}
          onConfirmar={async (venta, pagos) => { const r = await onCobrarPlazo(venta, pagos); if (r?.ok) setPlazoDe(null); return r; }}
        />
      )}

      {aAnular && (
        <ConfirmDialog
          titulo="¿Anular este bono?"
          mensaje={`Se anula «${aAnular.nombre}» de ${clientePorId.get(aAnular.clienteId)?.nombre || "este cliente"} (${euros(aAnular.precio)}). La devolución del dinero se hace aparte; aquí solo deja de poder usarse.`}
          textoConfirmar="Anular bono" textoCancelar="No, conservar" peligroso
          onCancelar={() => setAAnular(null)}
          onConfirmar={async () => { const b = aAnular; setAAnular(null); await onAnular(b); }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Crear / editar un bono del catálogo
// ---------------------------------------------------------------------------

export function BonoModal({ ui, data, servicios, onClose, onSave }) {
  const { ModalShell, Field } = ui;
  const [nombre, setNombre] = useState(data?.nombre || "");
  const [servicioIds, setServicioIds] = useState(serviciosDe(data || {}));
  const [sesiones, setSesiones] = useState(String(data?.sesiones ?? 5));
  const [precio, setPrecio] = useState(data?.precio != null ? String(data.precio) : "");
  const [caducidad, setCaducidad] = useState(data?.caducidadDias ? String(data.caducidadDias) : "");
  const nSes = Number(sesiones);
  const nPrecio = Number(String(precio).replace(",", "."));
  const valido = nombre.trim() && Number.isInteger(nSes) && nSes >= 1 && Number.isFinite(nPrecio) && nPrecio > 0 && (caducidad === "" || (Number.isInteger(Number(caducidad)) && Number(caducidad) >= 1));
  const [busquedaSrv, setBusquedaSrv] = useState("");
  const elegidos = servicios.filter((x) => servicioIds.includes(x.id));
  const s = elegidos.length === 1 ? elegidos[0] : null;
  const porSesion = valido ? nPrecio / nSes : 0;
  return (
    <ModalShell title={data ? "Editar bono" : "Nuevo bono"} onClose={onClose}>
      <Field label="Nombre del bono"><input className="input" aria-label="Nombre del bono" placeholder="Ej.: Dermapen 5 sesiones" value={nombre} onChange={(e) => setNombre(e.target.value)} /></Field>
      <Field label="Tratamientos a los que aplica (puedes marcar varios)">
        <input type="search" className="input" aria-label="Buscar servicio del bono" placeholder="Buscar servicio…" value={busquedaSrv} onChange={(e) => setBusquedaSrv(e.target.value)} style={{ marginBottom: 8 }} />
        <div data-servicios-bono="1" style={{ display: "grid", gap: 6, maxHeight: 240, overflowY: "auto", border: "1px solid var(--line)", borderRadius: 10, padding: 10 }}>
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13.5, fontWeight: 600 }}>
            <input type="checkbox" aria-label="Cualquier servicio" checked={servicioIds.length === 0} onChange={() => setServicioIds([])} /> Cualquier servicio
          </label>
          {servicios.filter((x) => x.activo !== false && (!busquedaSrv.trim() || normalizarTexto(`${x.nombre} ${x.categoria || ""}`).includes(normalizarTexto(busquedaSrv)))).map((x) => (
            <label key={x.id} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13.5 }}>
              <input type="checkbox" aria-label={`Servicio ${x.nombre}`} checked={servicioIds.includes(x.id)} onChange={() => setServicioIds((prev) => (prev.includes(x.id) ? prev.filter((i) => i !== x.id) : [...prev, x.id]))} />
              {x.nombre} · {euros(x.precio)}
            </label>
          ))}
        </div>
        <div style={{ fontSize: 12.5, color: MUTED, marginTop: 4 }}>
          {servicioIds.length === 0 ? "Sin marcar ninguno: vale para cualquier servicio." : servicioIds.length === 1 ? "Vale para este servicio." : `Vale para ${servicioIds.length} servicios: cada sesión cubre uno de ellos (el cliente elige cuál al cobrar).`}
        </div>
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Nº de sesiones"><input className="input" type="number" min={1} step={1} inputMode="numeric" aria-label="Número de sesiones" value={sesiones} onChange={(e) => setSesiones(e.target.value)} /></Field>
        <Field label="Precio del bono (€)"><input className="input" inputMode="decimal" aria-label="Precio del bono" placeholder="320" value={precio} onChange={(e) => setPrecio(e.target.value)} /></Field>
      </div>
      <Field label="Caduca a los (días) — vacío = no caduca"><input className="input" type="number" min={1} step={1} inputMode="numeric" aria-label="Días de caducidad" placeholder="Ej.: 180" value={caducidad} onChange={(e) => setCaducidad(e.target.value)} /></Field>
      {valido && (
        <div data-resumen-bono="1" style={{ fontSize: 13.5, color: MUTED, marginBottom: 6 }}>
          Sale a <strong>{euros(porSesion)}</strong> por sesión
          {s && s.precio > 0 ? <> (tarifa normal {euros(s.precio)}: {porSesion < s.precio ? `ahorro del ${Math.round((1 - porSesion / s.precio) * 100)} %` : "más caro que la tarifa suelta"})</> : null}
          {elegidos.length > 1 ? <> (tarifas de esos servicios: de {euros(Math.min(...elegidos.map((x) => x.precio)))} a {euros(Math.max(...elegidos.map((x) => x.precio)))})</> : null}.
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button type="button" className="btn btn-gold" disabled={!valido} onClick={() => onSave({ nombre: nombre.trim(), servicioIds, servicioId: servicioIds[0] || "", sesiones: nSes, precio: Math.round(nPrecio * 100) / 100, caducidadDias: caducidad === "" ? null : Number(caducidad), activo: data ? data.activo : true })}>Guardar</button>
      </div>
    </ModalShell>
  );
}

// ---------------------------------------------------------------------------
// Nueva venta sin cita: productos y/o bonos
// ---------------------------------------------------------------------------

export function VentaRapida({ ui, clientes, productos, bonos, metodosPago, preselBonoId, citasHoy = [], servicios = [], totalDeCita = () => 0, onCrearCliente, onClose, onConfirmar }) {
  const { ModalShell, Field } = ui;
  const [cliente, setCliente] = useState(null);
  const [busca, setBusca] = useState("");
  const [lProd, setLProd] = useState([]);
  const [lBon, setLBon] = useState(preselBonoId ? [{ id: idLocal(), plantillaId: preselBonoId, cantidad: 1 }] : []);
  const [pagos, setPagos] = useState([]);
  const [selProd, setSelProd] = useState("");
  const [selBono, setSelBono] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [usar, setUsar] = useState(""); // "citaId|plantillaId": descontar la 1.ª sesión en una cita de hoy
  const [aPlazos, setAPlazos] = useState(false);
  const [nuevoCli, setNuevoCli] = useState({ abierto: false, nombre: "", telefono: "", email: "", error: "", guardando: false });
  const plazosPosibles = lBon.length > 0 && lProd.length === 0;
  const plazosActivos = aPlazos && plazosPosibles;

  const disponiblesProd = productos.filter((p) => p.activo !== false && p.stock > 0);
  const disponiblesBono = bonos.filter((b) => b.activo);
  const metodos = metodosPago.filter((m) => m.activo && m.id !== METODO_BONO);
  const sugeridos = busca.trim() && !cliente ? buscarClientes(clientes, busca, 5) : [];

  const total = Math.round((lProd.reduce((s, l) => s + (productos.find((p) => p.id === l.productoId)?.precio || 0) * l.cantidad, 0) + lBon.reduce((s, l) => s + (bonos.find((b) => b.id === l.plantillaId)?.precio || 0) * l.cantidad, 0)) * 100) / 100;
  const pagado = Math.round(pagos.reduce((s, p) => s + (Number(String(p.importe).replace(",", ".")) || 0), 0) * 100) / 100;
  const pendiente = Math.round((total - pagado) * 100) / 100;
  // Citas de HOY de este cliente, aún sin cobrar, que la primera sesión de un bono de esta venta cubriría ENTERAS
  const opcionesHoy = [];
  if (cliente) {
    const hh = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
    [...new Set(lBon.map((l) => l.plantillaId))].forEach((pid) => {
      const t = bonos.find((b) => b.id === pid);
      if (!t) return;
      citasHoy.filter((c) => c.clienteId === cliente.id).forEach((c) => {
        const principal = servicios.find((s) => s.id === c.servicioId);
        const extras = (c.serviciosExtra || []).map((id) => servicios.find((s) => s.id === id)).filter(Boolean);
        const valor = valorSesion({ servicioIds: serviciosDe(t) }, principal, extras);
        if (valor > 0 && totalDeCita(c) <= valor + 0.005) opcionesHoy.push({ clave: `${c.id}|${pid}`, citaId: c.id, plantillaId: pid, texto: `${principal?.nombre || "Cita"} de las ${hh(c.inicio)} (${totalDeCita(c)} €) con «${t.nombre}»` });
      });
    });
  }
  const elegida = opcionesHoy.find((o) => o.clave === usar) || null;
  const datos = () => ({
    usarEnCita: elegida ? { citaId: elegida.citaId, plantillaId: elegida.plantillaId } : null,
    aPlazos: plazosActivos,
    clienteId: cliente?.id || "", clienteNombre: cliente?.nombre || "",
    lineasProductos: lProd, lineasBonos: lBon,
    pagos: pagos.map((p) => ({ metodoId: p.metodoId, importe: Number(String(p.importe).replace(",", ".")) || 0 })),
  });
  const plan = planDeVenta({ ...datos(), productos, plantillas: bonos, fecha: "2000-01-01", usuarioId: "x", uid: idLocal });

  const nombreProd = (id) => productos.find((p) => p.id === id);
  const cambiarCant = (arr, set, id, d, max) => set(arr.map((l) => (l.id === id ? { ...l, cantidad: Math.min(max ?? 99, Math.max(1, l.cantidad + d)) } : l)));

  async function cobrar() {
    setGuardando(true);
    setError("");
    const r = await onConfirmar(datos());
    setGuardando(false);
    if (r?.error) setError(r.error);
    else onClose();
  }

  const mini = { minHeight: 30, padding: "3px 10px", fontSize: 13 };
  return (
    <ModalShell pagina title="Nueva venta" onClose={onClose} ancho={820}>
      <div data-venta-rapida="1">
        <Field label="Cliente (obligatorio si vendes un bono)">
          {cliente ? (
            <div className="card" style={{ padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span><strong>{cliente.nombre}</strong> <span style={{ color: MUTED, fontSize: 13 }}>{cliente.telefono}</span></span>
              <button type="button" aria-label="Quitar cliente" onClick={() => { setCliente(null); setBusca(""); }} style={{ background: "transparent", border: "none" }}><X size={15} /></button>
            </div>
          ) : (
            <>
              <input className="input" aria-label="Buscar cliente para la venta" placeholder="Nombre o parte del teléfono… (vacío = sin cliente)" value={busca} onChange={(e) => setBusca(e.target.value)} />
              {sugeridos.map((c) => (
                <button key={c.id} type="button" onClick={() => { setCliente(c); setBusca(""); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "7px 10px", marginTop: 4, borderRadius: 8, border: "1px solid var(--line)", background: "transparent", cursor: "pointer", fontSize: 13.5 }}>
                  <strong>{c.nombre}</strong> · {c.telefono}
                </button>
              ))}
              {!nuevoCli.abierto && (
                <button type="button" className="btn btn-ghost" style={{ minHeight: 30, padding: "3px 10px", fontSize: 13, marginTop: 6 }}
                  onClick={() => { const t = busca.trim(); const letras = /[a-zA-ZÀ-ÿ]/.test(t); setNuevoCli({ abierto: true, nombre: letras ? t : "", telefono: !letras ? t : "", email: "", error: "", guardando: false }); }}>
                  <Plus size={13} /> Crear cliente nuevo
                </button>
              )}
              {nuevoCli.abierto && (() => {
                const parecidos = (() => {
                  const vistos = new Map();
                  if (nuevoCli.telefono.replace(/\D/g, "").length >= 3) buscarClientes(clientes, nuevoCli.telefono, 4).forEach((c) => vistos.set(c.id, c));
                  if (nuevoCli.nombre.trim().length >= 3) buscarClientes(clientes, nuevoCli.nombre, 4).forEach((c) => vistos.set(c.id, c));
                  return [...vistos.values()].slice(0, 4);
                })();
                return (
                  <div data-nuevo-cliente="1" className="card" style={{ padding: 12, marginTop: 8, display: "grid", gap: 8 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>Cliente nuevo</div>
                    <input className="input" aria-label="Nombre del cliente nuevo" placeholder="Nombre y apellidos" value={nuevoCli.nombre} onChange={(e) => setNuevoCli({ ...nuevoCli, nombre: e.target.value, error: "" })} />
                    <input className="input" aria-label="Teléfono del cliente nuevo" inputMode="tel" placeholder="Teléfono (obligatorio)" value={nuevoCli.telefono} onChange={(e) => setNuevoCli({ ...nuevoCli, telefono: e.target.value, error: "" })} />
                    <input className="input" aria-label="Email del cliente nuevo (opcional)" placeholder="Email (opcional)" value={nuevoCli.email} onChange={(e) => setNuevoCli({ ...nuevoCli, email: e.target.value })} />
                    {parecidos.length > 0 && (
                      <div role="region" aria-label="Clientes parecidos" style={{ borderTop: "1px solid var(--line)", paddingTop: 6 }}>
                        <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 4 }}>¿Ya existe? Toca para usar ese cliente:</div>
                        {parecidos.map((c) => (
                          <button key={c.id} type="button" onClick={() => { setCliente(c); setNuevoCli({ ...nuevoCli, abierto: false }); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "6px 10px", marginBottom: 4, borderRadius: 8, border: "1px solid var(--line)", background: "transparent", cursor: "pointer", fontSize: 13.5 }}>
                            <strong>{c.nombre}</strong> · {c.telefono}
                          </button>
                        ))}
                      </div>
                    )}
                    {nuevoCli.error && <div role="alert" style={{ color: "var(--danger)", fontSize: 12.5 }}>{nuevoCli.error}</div>}
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button type="button" className="btn btn-ghost" style={{ minHeight: 30, padding: "3px 10px", fontSize: 13 }} onClick={() => setNuevoCli({ ...nuevoCli, abierto: false, error: "" })}>Cancelar</button>
                      <button type="button" className="btn btn-gold" style={{ minHeight: 30, padding: "3px 12px", fontSize: 13 }} disabled={nuevoCli.guardando}
                        onClick={async () => {
                          if (!nuevoCli.nombre.trim() || !claveTelefono(nuevoCli.telefono)) return setNuevoCli({ ...nuevoCli, error: "Escribe el nombre y un teléfono válido." });
                          setNuevoCli({ ...nuevoCli, guardando: true, error: "" });
                          const r = await onCrearCliente({ nombre: nuevoCli.nombre.trim(), telefono: nuevoCli.telefono.trim(), email: nuevoCli.email.trim() });
                          if (r?.error) return setNuevoCli((c) => ({ ...c, guardando: false, error: r.error }));
                          setCliente(r.cliente);
                          setNuevoCli({ abierto: false, nombre: "", telefono: "", email: "", error: "", guardando: false });
                        }}>Guardar cliente</button>
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </Field>

        <Field label="Productos">
          <div style={{ display: "flex", gap: 8 }}>
            <SelectorBuscable ariaLabel="Producto" style={{ flex: 1 }} placeholder="Busca un producto…" valor={selProd} onChange={setSelProd}
              opciones={disponiblesProd.map((p) => ({ id: p.id, etiqueta: p.nombre, detalle: `${euros(p.precio)} (stock ${p.stock})` }))} />
            <button type="button" className="btn btn-ghost" style={mini} disabled={!selProd} onClick={() => { setLProd((l) => (l.some((x) => x.productoId === selProd) ? l.map((x) => (x.productoId === selProd ? { ...x, cantidad: Math.min(x.cantidad + 1, nombreProd(selProd)?.stock || 1) } : x)) : [...l, { id: idLocal(), productoId: selProd, cantidad: 1 }])); setSelProd(""); }}><Plus size={13} /> Añadir producto</button>
          </div>
          {lProd.map((l) => {
            const p = nombreProd(l.productoId);
            return (
              <div key={l.id} data-linea-producto={l.productoId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--line)", fontSize: 13.5 }}>
                <span>{p?.nombre}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button type="button" aria-label={`Menos ${p?.nombre}`} onClick={() => cambiarCant(lProd, setLProd, l.id, -1)} style={{ background: "transparent", border: "1px solid var(--line)", borderRadius: 6 }}><Minus size={12} /></button>
                  <strong>{l.cantidad}</strong>
                  <button type="button" aria-label={`Más ${p?.nombre}`} onClick={() => cambiarCant(lProd, setLProd, l.id, 1, p?.stock)} style={{ background: "transparent", border: "1px solid var(--line)", borderRadius: 6 }}><Plus size={12} /></button>
                  <span style={{ minWidth: 70, textAlign: "right" }}>{euros((p?.precio || 0) * l.cantidad)}</span>
                  <button type="button" aria-label={`Quitar ${p?.nombre}`} onClick={() => setLProd(lProd.filter((x) => x.id !== l.id))} style={{ background: "transparent", border: "none" }}><X size={13} /></button>
                </span>
              </div>
            );
          })}
        </Field>

        <Field label="Bonos">
          <div style={{ display: "flex", gap: 8 }}>
            <SelectorBuscable ariaLabel="Bono" style={{ flex: 1 }} placeholder="Busca un bono…" valor={selBono} onChange={setSelBono}
              opciones={disponiblesBono.map((x) => ({ id: x.id, etiqueta: x.nombre, detalle: euros(x.precio) }))} />
            <button type="button" className="btn btn-ghost" style={mini} disabled={!selBono} onClick={() => { setLBon((l) => (l.some((x) => x.plantillaId === selBono) ? l.map((x) => (x.plantillaId === selBono ? { ...x, cantidad: x.cantidad + 1 } : x)) : [...l, { id: idLocal(), plantillaId: selBono, cantidad: 1 }])); setSelBono(""); }}><Ticket size={13} /> Añadir bono</button>
          </div>
          {lBon.map((l) => {
            const b = bonos.find((x) => x.id === l.plantillaId);
            return (
              <div key={l.id} data-linea-bono={l.plantillaId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--line)", fontSize: 13.5 }}>
                <span>{b?.nombre} <span style={{ color: MUTED }}>({b?.sesiones} sesiones)</span></span>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button type="button" aria-label={`Menos ${b?.nombre}`} onClick={() => cambiarCant(lBon, setLBon, l.id, -1)} style={{ background: "transparent", border: "1px solid var(--line)", borderRadius: 6 }}><Minus size={12} /></button>
                  <strong>{l.cantidad}</strong>
                  <button type="button" aria-label={`Más ${b?.nombre}`} onClick={() => cambiarCant(lBon, setLBon, l.id, 1)} style={{ background: "transparent", border: "1px solid var(--line)", borderRadius: 6 }}><Plus size={12} /></button>
                  <span style={{ minWidth: 70, textAlign: "right" }}>{euros((b?.precio || 0) * l.cantidad)}</span>
                  <button type="button" aria-label={`Quitar ${b?.nombre}`} onClick={() => setLBon(lBon.filter((x) => x.id !== l.id))} style={{ background: "transparent", border: "none" }}><X size={13} /></button>
                </span>
              </div>
            );
          })}
        </Field>

        {plazosPosibles && (
          <label data-a-plazos="1" style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13.5, margin: "4px 0 10px" }}>
            <input type="checkbox" aria-label="Pago a plazos" checked={aPlazos} onChange={(e) => { setAPlazos(e.target.checked); setPagos([]); }} />
            Pago a plazos: el bono queda activo desde el primer pago y el resto se cobra después
          </label>
        )}

        {opcionesHoy.length > 0 && (
          <div data-descontar-hoy="1" className="card" style={{ padding: 14, marginTop: 6, border: "1px solid var(--accent)" }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>¿Descontar la primera sesión hoy?</div>
            <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13.5, marginBottom: 6 }}>
              <input type="radio" name="descontar-hoy" aria-label="No descontar ahora" checked={!elegida} onChange={() => setUsar("")} /> No, solo vender el bono
            </label>
            {opcionesHoy.map((o) => (
              <label key={o.clave} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13.5, marginBottom: 6 }}>
                <input type="radio" name="descontar-hoy" aria-label={`Descontar en ${o.texto}`} checked={usar === o.clave} onChange={() => setUsar(o.clave)} /> Sí, en {o.texto}: queda cobrada con el bono
              </label>
            ))}
          </div>
        )}

        <div className="card" style={{ padding: 14, marginTop: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 17, fontWeight: 600, marginBottom: 10 }}><span>Total</span><span data-total-venta="1">{euros(total)}</span></div>
          {total > 0 && (
            <>
              <div style={{ fontSize: 13, color: MUTED, marginBottom: 6 }}>Cobrar con (puedes combinar varios métodos):</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                {metodos.map((m) => (
                  <button key={m.id} type="button" className="btn btn-ghost" style={mini} disabled={pendiente <= 0.005} onClick={() => setPagos((p) => [...p, { id: idLocal(), metodoId: m.id, importe: String(pendiente) }])}>{m.nombre}</button>
                ))}
              </div>
              {pagos.map((p) => (
                <div key={p.id} data-linea-pago={p.metodoId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "6px 0", fontSize: 13.5 }}>
                  <span>{metodos.find((m) => m.id === p.metodoId)?.nombre || p.metodoId}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input className="input" style={{ width: 96, padding: "4px 8px", textAlign: "right" }} inputMode="decimal" aria-label={`Importe ${metodos.find((m) => m.id === p.metodoId)?.nombre || p.metodoId}`} value={p.importe} onChange={(e) => setPagos(pagos.map((x) => (x.id === p.id ? { ...x, importe: e.target.value } : x)))} /> €
                    <button type="button" aria-label="Quitar este pago" onClick={() => setPagos(pagos.filter((x) => x.id !== p.id))} style={{ background: "transparent", border: "none" }}><X size={13} /></button>
                  </span>
                </div>
              ))}
              {pagos.length > 0 && <div data-pendiente-venta="1" style={{ fontSize: 13, color: (plazosActivos ? pendiente < -0.005 : Math.abs(pendiente) > 0.005) ? "var(--danger)" : MUTED, marginTop: 4 }}>{pendiente < -0.005 ? `Pagado de más: ${Math.abs(pendiente).toFixed(2)} €` : Math.abs(pendiente) <= 0.005 ? "Pagado completo" : plazosActivos ? `Se cobran ${euros(pagado)} ahora · quedan ${euros(pendiente)} por cobrar en los siguientes plazos` : `Pendiente: ${pendiente.toFixed(2)} €`}</div>}
            </>
          )}
        </div>

        {(error || (plan.error && (lProd.length > 0 || lBon.length > 0) && /cliente|stock|disponible|bono|plazos|primer pago/i.test(plan.error))) && (
          <div role="alert" style={{ color: "var(--danger)", fontSize: 13, marginTop: 10 }}>{error || plan.error}</div>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn btn-gold" disabled={Boolean(plan.error) || guardando} onClick={cobrar}>{guardando ? "Guardando…" : plazosActivos && pendiente > 0.005 ? `Cobrar ${euros(pagado)} ahora` : `Cobrar ${euros(total)}`}</button>
        </div>
      </div>
    </ModalShell>
  );
}

// ---------------------------------------------------------------------------
// Cobrar un plazo de un bono vendido a plazos
// ---------------------------------------------------------------------------

export function PlazoModal({ ui, nivel = 0, venta, nombreBono, cliente, metodosPago, onClose, onConfirmar }) {
  const { ModalShell, Field } = ui;
  const deuda = pendienteVenta(venta);
  const [importe, setImporte] = useState(String(deuda));
  const [metodo, setMetodo] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const n = Number(String(importe).replace(",", "."));
  const valido = metodo && Number.isFinite(n) && n > 0 && n <= deuda + 0.01;
  const metodos = metodosPago.filter((m) => m.activo && m.id !== METODO_BONO);
  return (
    <ModalShell title="Cobrar plazo" nivel={nivel} onClose={onClose}>
      <div data-plazo="1">
        <p style={{ marginTop: 0, fontSize: 14 }}><strong>{cliente?.nombre || "Cliente"}</strong> · {nombreBono}</p>
        <div style={{ fontSize: 13.5, color: MUTED, marginBottom: 12 }}>
          Total {euros(venta.total)} · pagado {euros(importePagado(venta))} · <strong style={{ color: "var(--danger)" }}>debe {euros(deuda)}</strong>
          {(venta.pagos || []).length > 0 && (
            <div style={{ marginTop: 6, fontSize: 12.5 }}>
              {(venta.pagos || []).map((p, i) => <div key={i}>{p.fecha || venta.fecha} · {metodosPago.find((m) => m.id === p.metodoId)?.nombre || p.metodoId} · {euros(p.importe)}</div>)}
            </div>
          )}
        </div>
        <Field label="Importe que se cobra ahora (€)"><input className="input" inputMode="decimal" aria-label="Importe del plazo" value={importe} onChange={(e) => { setImporte(e.target.value); setError(""); }} /></Field>
        <Field label="Cobrado con">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {metodos.map((m) => <button key={m.id} type="button" aria-pressed={metodo === m.id} className={metodo === m.id ? "btn btn-gold" : "btn btn-ghost"} style={{ minHeight: 32, padding: "3px 12px", fontSize: 13 }} onClick={() => setMetodo(m.id)}>{m.nombre}</button>)}
          </div>
        </Field>
        {error && <div role="alert" style={{ color: "var(--danger)", fontSize: 13, marginBottom: 8 }}>{error}</div>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn btn-gold" disabled={!valido || guardando} onClick={async () => { setGuardando(true); const r = await onConfirmar(venta, [{ metodoId: metodo, importe: n }]); setGuardando(false); if (r?.error) setError(r.error); }}>
            {guardando ? "Guardando…" : `Cobrar ${euros(Number.isFinite(n) && n > 0 ? n : 0)}`}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
