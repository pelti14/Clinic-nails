"use client";

import React, { useMemo, useState } from "react";
import {
  PRESETS_RANGO,
  DIAS,
  DIAS_CORTOS,
  rangoDePreset,
  informeResumen,
  informeVentas,
  serieMensual,
  informeClientes,
  informeOcupacion,
  informeServiciosEquipo,
  euros,
  porcentaje,
  horasTexto,
} from "../lib/informes";

const MUTED = "rgba(var(--ink-rgb),0.74)";

// ---------------------------------------------------------------------------
// Utilidades de presentación
// ---------------------------------------------------------------------------

const fechaCorta = (iso) => (iso ? iso.split("-").reverse().join("/") : "—");
const hh = (h) => `${String(h).padStart(2, "0")}:00`;

// Descarga una tabla como CSV (separador ";" y UTF-8 con BOM para que Excel en español la abra bien)
export function descargarCSV(nombre, columnas, filas) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const cuerpo = [columnas.map((c) => esc(c.titulo)).join(";"), ...filas.map((f) => columnas.map((c) => esc(c.valor(f))).join(";"))].join("\r\n");
  const blob = new Blob(["\uFEFF" + cuerpo], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${nombre}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Tarjeta({ titulo, ayuda, acciones, children, estilo }) {
  return (
    <section className="card" style={{ padding: 18, ...estilo }}>
      {(titulo || acciones) && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ fontSize: 16.5 }}>{titulo}</h2>
            {ayuda && <div style={{ fontSize: 12.5, color: MUTED, marginTop: 2 }}>{ayuda}</div>}
          </div>
          {acciones}
        </div>
      )}
      {children}
    </section>
  );
}

function Kpi({ etiqueta, valor, detalle, variacion, invertir }) {
  let delta = null;
  if (variacion !== undefined && variacion !== null && Number.isFinite(variacion)) {
    const sube = variacion > 0.0005;
    const baja = variacion < -0.0005;
    const bueno = invertir ? baja : sube;
    const malo = invertir ? sube : baja;
    delta = (
      <span style={{ fontSize: 12.5, fontWeight: 600, color: bueno ? "var(--success)" : malo ? "var(--danger)" : MUTED }}>
        {sube ? "▲" : baja ? "▼" : "•"} {porcentaje(Math.abs(variacion), 0)} <span style={{ fontWeight: 400, color: MUTED }}>vs. periodo anterior</span>
      </span>
    );
  }
  return (
    <div className="card" style={{ padding: "14px 16px" }}>
      <div style={{ fontSize: 12.5, color: MUTED, fontWeight: 500 }}>{etiqueta}</div>
      <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: -0.5, margin: "2px 0" }}>{valor}</div>
      {detalle && <div style={{ fontSize: 12.5, color: MUTED }}>{detalle}</div>}
      {delta}
    </div>
  );
}

const Rejilla = ({ children, min = 190 }) => (
  <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))`, gap: 12 }}>{children}</div>
);

// Gráfico de barras verticales (HTML/CSS: se adapta solo al ancho y se desplaza si hay muchas barras)
function BarChart({ datos, formato = euros, alto = 180, color = "var(--accent)", etiqueta }) {
  const max = Math.max(1e-9, ...datos.map((d) => d.valor));
  const denso = datos.length > 20;
  const conValores = datos.length <= 12;
  const salto = denso ? Math.ceil(datos.length / 12) : 1;
  // Con muchas barras (más de 40) se ajustan al ancho disponible: así no se esconden los días recientes a la derecha
  const minAncho = datos.length > 40 ? 0 : datos.length * (denso ? 14 : 34);
  return (
    <div style={{ overflowX: "auto" }} role="img" aria-label={etiqueta}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: denso ? 3 : 8, height: alto, minWidth: minAncho, paddingTop: 18 }}>
        {datos.map((d, i) => (
          <div
            key={i}
            title={`${d.etiqueta}: ${formato(d.valor)}${d.extra ? " · " + d.extra : ""}`}
            style={{ flex: 1, minWidth: 0, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", gap: 4 }}
          >
            {conValores && <span style={{ fontSize: 11, color: MUTED, whiteSpace: "nowrap" }}>{d.valor ? formato(d.valor) : ""}</span>}
            <div
              data-barra="1"
              style={{ width: "100%", maxWidth: 46, height: `${(d.valor / max) * 100}%`, minHeight: d.valor > 0 ? 3 : 0, background: d.color || color, borderRadius: "6px 6px 2px 2px" }}
            />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: denso ? 3 : 8, minWidth: minAncho, marginTop: 6 }}>
        {datos.map((d, i) => (
          <div key={i} style={{ flex: 1, minWidth: 0, display: "flex", justifyContent: "center", fontSize: 11, color: MUTED, whiteSpace: "nowrap" }}>
            {i % salto === 0 ? <span>{d.etiqueta}</span> : ""}
          </div>
        ))}
      </div>
    </div>
  );
}

// Barras horizontales para rankings
function Ranking({ filas, formato = euros, vacio = "Sin datos en este periodo.", color = "var(--accent)" }) {
  if (!filas.length) return <div style={{ color: MUTED, fontSize: 13, padding: "8px 0" }}>{vacio}</div>;
  const max = Math.max(1e-9, ...filas.map((f) => f.valor));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      {filas.map((f, i) => (
        <div key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13.5, marginBottom: 3 }}>
            <span style={{ fontWeight: 500, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.nombre}</span>
            <span style={{ fontWeight: 600, flexShrink: 0 }}>
              {formato(f.valor)}
              {f.extra && <span style={{ fontWeight: 400, color: MUTED }}> · {f.extra}</span>}
            </span>
          </div>
          <div style={{ height: 8, borderRadius: 6, background: "rgba(var(--ink-rgb),0.08)" }}>
            <div style={{ width: `${(f.valor / max) * 100}%`, height: "100%", borderRadius: 6, background: f.color || color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Tabla({ columnas, filas, vacio = "Sin datos en este periodo.", onFila, csv }) {
  const cabecera = (
    <tr>
      {columnas.map((c) => (
        <th key={c.titulo} style={{ textAlign: c.derecha ? "right" : "left", padding: "9px 10px", fontSize: 12.5, fontWeight: 600, color: MUTED, whiteSpace: "nowrap", borderBottom: "1px solid var(--line)" }}>
          {c.titulo}
        </th>
      ))}
    </tr>
  );
  return (
    <div>
      {csv && filas.length > 0 && (
        <div style={{ marginBottom: 8, textAlign: "right" }}>
          <button type="button" className="btn btn-ghost" style={{ minHeight: 36, padding: "6px 14px", fontSize: 13 }} onClick={() => descargarCSV(csv, columnas, filas)}>
            Descargar CSV
          </button>
        </div>
      )}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
          <thead>{cabecera}</thead>
          <tbody>
            {filas.length === 0 && (
              <tr>
                <td colSpan={columnas.length} style={{ padding: 14, color: MUTED }}>{vacio}</td>
              </tr>
            )}
            {filas.map((f, i) => (
              <tr key={f.id || i} style={{ borderBottom: "1px solid var(--line)" }}>
                {columnas.map((c) => (
                  <td key={c.titulo} style={{ padding: "9px 10px", textAlign: c.derecha ? "right" : "left", whiteSpace: c.derecha ? "nowrap" : "normal" }}>
                    {c.nombre && onFila ? (
                      <button type="button" className="link-btn" onClick={() => onFila(f)}>{c.valor(f)}</button>
                    ) : (
                      c.render ? c.render(f) : c.valor(f)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Mapa de calor día de la semana × hora
function MapaCalor({ celdas, modo }) {
  const horas = [...new Set(celdas.map((c) => c.hora))].sort((a, b) => a - b);
  const por = new Map(celdas.map((c) => [`${c.dia}-${c.hora}`, c]));
  if (!horas.length) return <div style={{ color: MUTED, fontSize: 13 }}>No hay jornada configurada en este periodo.</div>;
  const valor = (c) => (modo === "reservada" ? c.pctReservada : c.pctEfectiva);
  return (
    <div style={{ overflowX: "auto" }}>
      <div role="table" aria-label="Ocupación por día y hora" style={{ display: "grid", gridTemplateColumns: `52px repeat(${horas.length}, minmax(38px, 1fr))`, gap: 3, minWidth: 52 + horas.length * 41 }}>
        <div />
        {horas.map((h) => (
          <div key={h} style={{ fontSize: 11, textAlign: "center", color: MUTED }}>{String(h).padStart(2, "0")}h</div>
        ))}
        {DIAS_CORTOS.map((d, dia) => (
          <React.Fragment key={d}>
            <div style={{ fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center" }}>{d}</div>
            {horas.map((h) => {
              const c = por.get(`${dia}-${h}`);
              if (!c) return <div key={h} style={{ height: 30, borderRadius: 6, background: "repeating-linear-gradient(135deg, rgba(var(--ink-rgb),0.07) 0 4px, transparent 4px 8px)" }} title={`${d} ${hh(h)}: cerrado`} />;
              const v = valor(c);
              return (
                <div
                  key={h}
                  data-celda={`${dia}-${h}`}
                  title={`${DIAS[dia]} ${hh(h)} · ${porcentaje(c.pctEfectiva)} efectiva · ${porcentaje(c.pctReservada)} contando inasistencias`}
                  style={{
                    height: 30, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600,
                    background: `rgba(var(--accent-rgb), ${0.08 + 0.85 * Math.min(v, 1)})`, color: v > 0.55 ? "#fff" : "var(--text)",
                  }}
                >
                  {Math.round(v * 100)}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      <div style={{ fontSize: 12, color: MUTED, marginTop: 8 }}>Porcentaje de ocupación de cada franja. Más oscuro = más ocupada.</div>
    </div>
  );
}

function Segmentado({ opciones, valor, onChange, etiqueta }) {
  return (
    <div role="radiogroup" aria-label={etiqueta} style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {opciones.map(([v, t]) => (
        <button key={v} type="button" role="radio" aria-checked={valor === v} className={`chip ${valor === v ? "on" : ""}`} onClick={() => onChange(v)}>
          {t}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pantalla
// ---------------------------------------------------------------------------

const TITULOS = {
  resumen: ["Resumen general", "Cómo va el negocio: ingresos, citas, ocupación y clientes."],
  ventas: ["Informe de ventas", "Ingresos, ticket medio, métodos de pago y evolución mensual."],
  clientes: ["Informe de clientes", "Nuevos, recurrentes, fidelidad y a quién conviene reactivar."],
  ocupacion: ["Informe de ocupación", "Cuánto de tu jornada está ocupada, por día, por hora y por empleada."],
  equipo: ["Servicios y equipo", "Qué servicios rinden más y cómo trabaja cada empleada."],
};

export default function Informes({ ventas = [], bloqueos = [], vista, citas, servicios, clientes, empleadas, productos, metodos, horarioDelDia, calcularTotal, hoy, onVerCliente }) {
  const [preset, setPreset] = useState("mes");
  const [propio, setPropio] = useState({ desde: "", hasta: "" });
  const [empleadaId, setEmpleadaId] = useState("");
  const [modoOcup, setModoOcup] = useState("efectiva"); // efectiva | reservada

  const personalizadoValido = preset === "personalizado" && propio.desde && propio.hasta && propio.desde <= propio.hasta;
  const [desde, hasta] = personalizadoValido ? [propio.desde, propio.hasta] : rangoDePreset(preset === "personalizado" ? "30d" : preset, hoy);

  const ctx = useMemo(
    () => ({ ventas, bloqueos, citas, servicios, clientes, empleadas, productos, metodos, horarioDelDia, total: (c) => calcularTotal(c, servicios, productos), hoy }),
    [ventas, bloqueos, citas, servicios, clientes, empleadas, productos, metodos, horarioDelDia, calcularTotal, hoy]
  );

  const datos = useMemo(() => {
    switch (vista) {
      case "resumen": return informeResumen(ctx, desde, hasta);
      case "ventas": return { v: informeVentas(ctx, desde, hasta), m: serieMensual(ctx, hasta) };
      case "clientes": return informeClientes(ctx, desde, hasta);
      case "ocupacion": return informeOcupacion(ctx, desde, hasta, { empleadaId: empleadaId || undefined });
      case "equipo": return informeServiciosEquipo(ctx, desde, hasta);
      default: return null;
    }
  }, [vista, ctx, desde, hasta, empleadaId]);

  const [titulo, subtitulo] = TITULOS[vista] || TITULOS.resumen;
  const etiquetaDia = (f) => f.slice(8) + "/" + f.slice(5, 7);

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <h1 style={{ fontSize: 26, marginBottom: 4 }}>{titulo}</h1>
        <p style={{ color: MUTED, margin: 0, fontSize: 14 }}>{subtitulo}</p>
      </div>

      {/* Selector de periodo */}
      <div className="card" style={{ padding: 14, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          {PRESETS_RANGO.map((p) => (
            <button key={p.id} type="button" className={`chip ${preset === p.id ? "on" : ""}`} aria-pressed={preset === p.id} onClick={() => setPreset(p.id)}>{p.nombre}</button>
          ))}
          <button type="button" className={`chip ${preset === "personalizado" ? "on" : ""}`} aria-pressed={preset === "personalizado"} onClick={() => setPreset("personalizado")}>Personalizado</button>
        </div>
        {preset === "personalizado" && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
            <label style={{ fontSize: 13 }}>Desde <input className="input" type="date" style={{ width: 170 }} value={propio.desde} onChange={(e) => setPropio({ ...propio, desde: e.target.value })} /></label>
            <label style={{ fontSize: 13 }}>Hasta <input className="input" type="date" style={{ width: 170 }} value={propio.hasta} onChange={(e) => setPropio({ ...propio, hasta: e.target.value })} /></label>
          </div>
        )}
        <div style={{ fontSize: 13, color: MUTED, marginTop: 10 }}>
          Periodo: <strong style={{ color: "var(--text)" }}>{fechaCorta(desde)} – {fechaCorta(hasta)}</strong>
          {preset === "personalizado" && !personalizadoValido && " (elige las dos fechas; mientras tanto se muestran los últimos 30 días)"}
        </div>
      </div>

      {vista === "resumen" && <Resumen r={datos} etiquetaDia={etiquetaDia} />}
      {vista === "ventas" && <Ventas v={datos.v} m={datos.m} etiquetaDia={etiquetaDia} />}
      {vista === "clientes" && <Clientes c={datos} onVerCliente={onVerCliente} />}
      {vista === "ocupacion" && <Ocupacion o={datos} modo={modoOcup} setModo={setModoOcup} empleadas={empleadas} empleadaId={empleadaId} setEmpleadaId={setEmpleadaId} />}
      {vista === "equipo" && <Equipo e={datos} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Resumen
// ---------------------------------------------------------------------------

function Resumen({ r, etiquetaDia }) {
  const o = r.ocupacion;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Rejilla>
        <Kpi etiqueta="Ingresos cobrados" valor={euros(r.ventas.ingresos)} detalle={`${r.ventas.cobradas} cobros`} variacion={r.variaciones.ingresos} />
        <Kpi etiqueta="Citas realizadas" valor={r.citasEfectivas} detalle={`${r.canceladas} canceladas`} variacion={r.variaciones.citas} />
        <Kpi etiqueta="Ticket medio" valor={euros(r.ventas.ticketMedio)} variacion={r.variaciones.ticket} />
        <Kpi etiqueta="Ocupación efectiva" valor={porcentaje(o.pctEfectiva, 1)} detalle={`${porcentaje(o.pctReservada, 1)} contando inasistencias`} variacion={r.variaciones.ocupacion} />
        <Kpi etiqueta="Clientes nuevos" valor={r.clientes.nuevos} detalle={`${r.clientes.recurrentes} recurrentes`} variacion={r.variaciones.nuevos} />
        <Kpi etiqueta="Inasistencias" valor={r.noShows} detalle={`${porcentaje(r.tasaNoShow, 1)} de las citas · ${euros(r.ingresosPerdidosNoShow)} sin cobrar`} />
      </Rejilla>

      <Tarjeta titulo="Ingresos por día" ayuda="Solo lo cobrado.">
        <BarChart etiqueta="Ingresos por día" datos={r.ventas.porDia.map((d) => ({ etiqueta: etiquetaDia(d.fecha), valor: d.ingresos, extra: `${d.cobradas} cobros` }))} />
      </Tarjeta>

      <Rejilla min={300}>
        <Tarjeta titulo="Servicios que más facturan">
          <Ranking filas={r.ventas.porServicio.slice(0, 6).map((s) => ({ nombre: s.nombre, valor: s.ingresos, extra: `${s.cantidad} uds.`, color: s.color }))} />
        </Tarjeta>
        <Tarjeta titulo="Empleadas por ingresos">
          <Ranking filas={r.ventas.porEmpleada.slice(0, 6).map((e) => ({ nombre: e.nombre, valor: e.ingresos, extra: `${e.cobradas} cobros` }))} />
        </Tarjeta>
      </Rejilla>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ventas
// ---------------------------------------------------------------------------

function Ventas({ v, m, etiquetaDia }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Rejilla>
        <Kpi etiqueta="Ingresos cobrados" valor={euros(v.ingresos)} detalle={`${v.cobradas} cobros`} />
        <Kpi etiqueta="Ticket medio" valor={euros(v.ticketMedio)} detalle="por cobro" />
        <Kpi etiqueta="Pendiente de cobro" valor={euros(v.pendienteCobro)} detalle="citas pasadas sin cobrar" />
        <Kpi etiqueta="Productos vendidos" valor={euros(v.ingresosProductos)} detalle={`${v.unidadesProductos} unidades`} />
        <Kpi etiqueta="Media mensual" valor={euros(m.mediaMensual)} detalle={`${m.mesesConDatos} meses con datos · ${euros(m.mediaMensualCompletos)} solo meses completos`} />
      </Rejilla>

      <Tarjeta titulo="Ingresos por día">
        <BarChart etiqueta="Ingresos por día" datos={v.porDia.map((d) => ({ etiqueta: etiquetaDia(d.fecha), valor: d.ingresos, extra: `${d.cobradas} cobros` }))} />
      </Tarjeta>

      <Tarjeta titulo="Evolución de los últimos 12 meses" ayuda="El último mes puede estar incompleto.">
        <BarChart etiqueta="Ingresos mensuales" alto={200} datos={m.meses.map((x) => ({ etiqueta: x.etiqueta, valor: x.ingresos, extra: `${x.cobradas} cobros`, color: x.completo ? undefined : "rgba(var(--accent-rgb),0.45)" }))} />
        <div style={{ height: 14 }} />
        <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 6 }}>Ticket medio mensual</div>
        <BarChart etiqueta="Ticket medio mensual" alto={140} color="var(--accent-text)" datos={m.meses.map((x) => ({ etiqueta: x.etiqueta, valor: x.ticket }))} />
        <div style={{ fontSize: 12.5, color: MUTED, marginTop: 8 }}>Ticket medio de todo el periodo mostrado: <strong>{euros(m.ticketMedioPeriodo)}</strong></div>
      </Tarjeta>

      <Rejilla min={300}>
        <Tarjeta titulo="Métodos de pago">
          <Ranking filas={v.porMetodo.map((x) => ({ nombre: x.nombre, valor: x.importe, extra: porcentaje(x.pct, 0) }))} />
        </Tarjeta>
        <Tarjeta titulo="Por categoría">
          <Ranking filas={v.porCategoria.map((x) => ({ nombre: x.categoria, valor: x.ingresos, extra: `${x.cantidad} uds.` }))} />
        </Tarjeta>
        <Tarjeta titulo="Media por día de la semana" ayuda="Lo que se factura de media cada lunes, martes…">
          <BarChart etiqueta="Media por día de la semana" alto={150} datos={v.porDiaSemana.map((d) => ({ etiqueta: DIAS_CORTOS[d.dia], valor: d.media }))} />
        </Tarjeta>
      </Rejilla>

      <Tarjeta titulo="Por servicio">
        <Tabla
          csv="ventas-por-servicio"
          columnas={[
            { titulo: "Servicio", valor: (s) => s.nombre },
            { titulo: "Categoría", valor: (s) => s.categoria },
            { titulo: "Vendidos", derecha: true, valor: (s) => s.cantidad },
            { titulo: "Ingresos", derecha: true, valor: (s) => euros(s.ingresos) },
            { titulo: "Ticket", derecha: true, valor: (s) => euros(s.ticket) },
            { titulo: "€ por hora", derecha: true, valor: (s) => euros(s.ingresoPorHora) },
          ]}
          filas={v.porServicio}
        />
      </Tarjeta>

      <Tarjeta titulo="Por empleada">
        <Tabla
          columnas={[
            { titulo: "Empleada", valor: (e) => e.nombre },
            { titulo: "Cobros", derecha: true, valor: (e) => e.cobradas },
            { titulo: "Ingresos", derecha: true, valor: (e) => euros(e.ingresos) },
            { titulo: "Ticket medio", derecha: true, valor: (e) => euros(e.ticket) },
          ]}
          filas={v.porEmpleada}
        />
      </Tarjeta>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Clientes
// ---------------------------------------------------------------------------

function Clientes({ c, onVerCliente }) {
  const abrir = (f) => onVerCliente && onVerCliente(f.id);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Rejilla>
        <Kpi etiqueta="Clientes activos" valor={c.activos} detalle={`de ${c.totalClientes} en la base de datos`} />
        <Kpi etiqueta="Nuevos" valor={c.nuevos} detalle="primera visita en el periodo" />
        <Kpi etiqueta="Recurrentes" valor={c.recurrentes} detalle="ya habían venido antes" />
        <Kpi etiqueta="Retención" valor={c.retencion === null ? "—" : porcentaje(c.retencion, 0)} detalle={c.retencion === null ? "sin clientes en el periodo anterior" : `de los ${c.activosPeriodoAnterior} del periodo anterior volvieron`} />
        <Kpi etiqueta="Visitas por cliente" valor={(Math.round(c.visitasMedias * 10) / 10).toLocaleString("es-ES")} detalle="media en el periodo" />
        <Kpi etiqueta="Frecuencia media" valor={c.frecuenciaMediaDias ? `${Math.round(c.frecuenciaMediaDias)} días` : "—"} detalle="entre una visita y la siguiente" />
      </Rejilla>
      {c.sinFicha > 0 && (
        <div style={{ fontSize: 13, color: MUTED }}>
          Además hubo {c.sinFicha} visita{c.sinFicha === 1 ? "" : "s"} «sin cita previa» que no cuentan aquí porque no tienen ficha de cliente.
        </div>
      )}

      <Rejilla min={300}>
        <Tarjeta titulo="¿Cuántas veces vienen?" ayuda="Clientes activos según su nº de visitas en el periodo.">
          <Ranking formato={(n) => `${n}`} filas={c.distribucionVisitas.map((g) => ({ nombre: g.etiqueta, valor: g.n }))} />
        </Tarjeta>
        <Tarjeta titulo="Mejores clientes" ayuda="Por lo cobrado en el periodo.">
          <Tabla
            columnas={[
              { titulo: "Cliente", nombre: true, valor: (f) => f.nombre },
              { titulo: "Visitas", derecha: true, valor: (f) => f.visitasPeriodo },
              { titulo: "Gasto", derecha: true, valor: (f) => euros(f.gasto) },
            ]}
            filas={c.topGasto}
            onFila={abrir}
          />
        </Tarjeta>
      </Rejilla>

      <Tarjeta titulo={`Para reactivar: llevan más de ${c.diasInactivo} días sin venir`} ayuda="Sin cita próxima. Ordenados por lo que han gastado en total. Descarga la lista para una campaña.">
        <Tabla
          csv="clientes-inactivos"
          columnas={[
            { titulo: "Cliente", nombre: true, valor: (f) => f.nombre },
            { titulo: "Teléfono", valor: (f) => f.telefono },
            { titulo: "Última visita", valor: (f) => fechaCorta(f.ultima) },
            { titulo: "Días sin venir", derecha: true, valor: (f) => f.diasSinVenir },
            { titulo: "Visitas", derecha: true, valor: (f) => f.visitas },
            { titulo: "Gasto total", derecha: true, valor: (f) => euros(f.gasto) },
          ]}
          filas={c.inactivos.slice(0, 100)}
          onFila={abrir}
          vacio="Ningún cliente inactivo. ¡Buena señal!"
        />
        {c.inactivos.length > 100 && <div style={{ fontSize: 12.5, color: MUTED, marginTop: 8 }}>Se muestran los 100 primeros de {c.inactivos.length}.</div>}
      </Tarjeta>

      <Tarjeta titulo="Clientes con inasistencias" ayuda="No se presentaron a su cita en el periodo.">
        <Tabla
          columnas={[
            { titulo: "Cliente", nombre: true, valor: (f) => f.nombre },
            { titulo: "Teléfono", valor: (f) => f.telefono },
            { titulo: "Inasistencias", derecha: true, valor: (f) => f.noShows },
          ]}
          filas={c.noShows}
          onFila={abrir}
          vacio="Nadie ha faltado a su cita en este periodo."
        />
      </Tarjeta>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ocupación
// ---------------------------------------------------------------------------

function Ocupacion({ o, modo, setModo, empleadas, empleadaId, setEmpleadaId }) {
  const campo = modo === "reservada" ? "pctReservada" : "pctEfectiva";
  const libres = Math.max(o.capacidadMin - o.efectivaMin, 0);
  const pct = (x) => porcentaje(x, 0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="card" style={{ padding: 14, display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 6 }}>Qué ocupación mostrar en los gráficos</div>
          <Segmentado
            etiqueta="Tipo de ocupación" valor={modo} onChange={setModo}
            opciones={[["efectiva", "Sin contar inasistencias"], ["reservada", "Contando inasistencias"]]}
          />
        </div>
        <label style={{ fontSize: 13 }}>
          <div style={{ color: MUTED, marginBottom: 6 }}>Empleada</div>
          <select className="input" style={{ width: 200 }} value={empleadaId} onChange={(e) => setEmpleadaId(e.target.value)} aria-label="Filtrar por empleada">
            <option value="">Todo el equipo</option>
            {empleadas.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </label>
      </div>

      <Rejilla>
        <Kpi etiqueta="Ocupación efectiva" valor={porcentaje(o.pctEfectiva, 1)} detalle={`${horasTexto(o.efectivaMin)} de ${horasTexto(o.capacidadMin)} de jornada`} />
        <Kpi etiqueta="Contando inasistencias" valor={porcentaje(o.pctReservada, 1)} detalle="el hueco estaba vendido" />
        <Kpi etiqueta="Horas libres" valor={horasTexto(libres)} detalle="jornada sin cita" />
        <Kpi etiqueta="Perdido por inasistencias" valor={horasTexto(o.noShowMin)} detalle={`${porcentaje(o.pctReservada - o.pctEfectiva, 1)} de la jornada`} />
      </Rejilla>
      <div style={{ fontSize: 12.5, color: MUTED }}>
        La ocupación es el tiempo con cita dividido entre el tiempo de jornada de cada empleada. Las citas canceladas no cuentan, y las citas solapadas de una misma empleada cuentan una sola vez (nunca pasa del 100 %).
      </div>

      <Rejilla min={320}>
        <Tarjeta titulo="Por día de la semana" ayuda={modo === "reservada" ? "Contando inasistencias" : "Sin contar inasistencias"}>
          <BarChart etiqueta="Ocupación por día de la semana" formato={pct} alto={170} datos={o.porDiaSemana.map((d) => ({ etiqueta: DIAS_CORTOS[d.dia], valor: d[campo], extra: d.capacidadMin ? `${horasTexto(d.efectivaMin)} de ${horasTexto(d.capacidadMin)}` : "cerrado" }))} />
        </Tarjeta>
        <Tarjeta titulo="Por hora del día" ayuda={modo === "reservada" ? "Contando inasistencias" : "Sin contar inasistencias"}>
          <BarChart etiqueta="Ocupación por hora" formato={pct} alto={170} datos={o.porHora.map((h) => ({ etiqueta: `${String(h.hora).padStart(2, "0")}h`, valor: h[campo] }))} />
        </Tarjeta>
      </Rejilla>

      <Tarjeta titulo="Mapa de ocupación" ayuda="Cada casilla es una hora de un día de la semana, sumando todo el periodo.">
        <MapaCalor celdas={o.mapa} modo={modo} />
      </Tarjeta>

      <Rejilla min={300}>
        <Tarjeta titulo="Franjas más flojas" ayuda="Buenas candidatas para promociones.">
          <Ranking formato={pct} filas={o.franjasFlojas.map((c) => ({ nombre: `${DIAS[c.dia]} ${hh(c.hora)}`, valor: c.pctEfectiva }))} />
        </Tarjeta>
        <Tarjeta titulo="Franjas más fuertes" ayuda="Donde conviene tener a todo el equipo.">
          <Ranking formato={pct} filas={o.franjasFuertes.map((c) => ({ nombre: `${DIAS[c.dia]} ${hh(c.hora)}`, valor: c.pctEfectiva }))} />
        </Tarjeta>
      </Rejilla>

      <Tarjeta titulo="Por empleada">
        <Tabla
          columnas={[
            { titulo: "Empleada", valor: (e) => e.nombre },
            { titulo: "Jornada", derecha: true, valor: (e) => horasTexto(e.capacidadMin) },
            { titulo: "Con cita", derecha: true, valor: (e) => horasTexto(e.efectivaMin) },
            { titulo: "Ocupación", derecha: true, valor: (e) => porcentaje(e.pctEfectiva, 1) },
            { titulo: "Con inasistencias", derecha: true, valor: (e) => porcentaje(e.pctReservada, 1) },
          ]}
          filas={o.porEmpleada}
        />
      </Tarjeta>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Servicios y equipo
// ---------------------------------------------------------------------------

function Equipo({ e }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Tarjeta titulo="Rendimiento por empleada" ayuda="Los € por hora trabajada comparan a quien trabaja más o menos horas.">
        <Tabla
          csv="rendimiento-empleadas"
          columnas={[
            { titulo: "Empleada", valor: (x) => x.nombre },
            { titulo: "Ingresos", derecha: true, valor: (x) => euros(x.ingresos) },
            { titulo: "Citas", derecha: true, valor: (x) => x.citas },
            { titulo: "Ticket medio", derecha: true, valor: (x) => euros(x.ticket) },
            { titulo: "Horas de jornada", derecha: true, valor: (x) => horasTexto(x.horasTrabajo * 60) },
            { titulo: "Ocupación", derecha: true, valor: (x) => porcentaje(x.pctOcupacion, 1) },
            { titulo: "€ por hora trabajada", derecha: true, valor: (x) => euros(x.ingresoPorHora) },
            { titulo: "Inasistencias", derecha: true, valor: (x) => x.noShows },
          ]}
          filas={e.equipo}
        />
      </Tarjeta>

      <Rejilla min={300}>
        <Tarjeta titulo="Ingresos por categoría">
          <Ranking filas={e.categorias.map((c) => ({ nombre: c.categoria, valor: c.ingresos, extra: porcentaje(e.ingresos ? c.ingresos / e.ingresos : 0, 0) }))} />
        </Tarjeta>
        <Tarjeta titulo="€ por hora de servicio" ayuda="Lo que genera cada hora dedicada a ese servicio.">
          <Ranking filas={[...e.servicios].sort((a, b) => b.ingresoPorHora - a.ingresoPorHora).slice(0, 8).map((s) => ({ nombre: s.nombre, valor: s.ingresoPorHora, color: s.color }))} />
        </Tarjeta>
      </Rejilla>

      <Tarjeta titulo="Servicios">
        <Tabla
          csv="rendimiento-servicios"
          columnas={[
            { titulo: "Servicio", valor: (s) => s.nombre },
            { titulo: "Vendidos", derecha: true, valor: (s) => s.cantidad },
            { titulo: "Ingresos", derecha: true, valor: (s) => euros(s.ingresos) },
            { titulo: "% de ingresos", derecha: true, valor: (s) => porcentaje(s.pctIngresos, 0) },
            { titulo: "Ticket", derecha: true, valor: (s) => euros(s.ticket) },
            { titulo: "€ por hora", derecha: true, valor: (s) => euros(s.ingresoPorHora) },
            { titulo: "Inasistencias", derecha: true, valor: (s) => `${s.noShows} (${porcentaje(s.tasaNoShow, 0)})` },
          ]}
          filas={e.servicios}
        />
      </Tarjeta>
    </div>
  );
}
