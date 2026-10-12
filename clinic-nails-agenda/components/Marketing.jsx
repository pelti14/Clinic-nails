"use client";

// Marketing · informe del día (solo administrador). Se calcula en el momento con los datos actuales de la agenda: cómo va el negocio,
// qué huecos quedan y por qué, qué hacer hoy y a qué clientas escribir. «Escribir» abre el WhatsApp con el mensaje ya preparado;
// la app no envía nada sola (cada mensaje lo envías tú con un toque) y anota a quién ya se ha escrito para no repetir.

import React, { useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, MessageCircle, Phone, Check, Megaphone } from "lucide-react";
import { huecosDelDia, ocupacionHabitual, senalesDeHuecos, clientesParaReactivar, repartirHuecos, mensajeReactivacion, tiempoSinVenir, kpisDelNegocio, accionesDeHoy, bonosSinCita, ocupacionProximosDias } from "../lib/marketing";
import { enlaceWhatsApp, enlaceLlamada, diaLargo, sinConfirmar as contarSinConfirmar } from "../lib/confirmaciones";
import { sumarDias } from "../lib/cursos";
import ConfirmarCitas from "./ConfirmarCitas";

const MUTED = "rgba(var(--ink-rgb),0.72)";
const eur = (n) => `${Number(n || 0).toLocaleString("es-ES", { maximumFractionDigits: 2 })} €`;
const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const legible = (min) => { const h = Math.floor(min / 60), r = min % 60; return h && r ? `${h} h ${r} min` : h ? `${h} h` : `${r} min`; };
const pct = (n) => `${Math.round((n || 0) * 100)} %`;
const LIMITE = 15;

function Variacion({ valor }) {
  if (valor === null || valor === undefined) return <span style={{ color: MUTED, fontSize: 12.5 }}>sin datos para comparar</span>;
  const sube = valor >= 0;
  return <span data-variacion={sube ? "sube" : "baja"} style={{ color: sube ? "#166534" : "#B91C1C", fontWeight: 700, fontSize: 13 }}>{sube ? "▲" : "▼"} {Math.abs(valor).toLocaleString("es-ES", { maximumFractionDigits: 1 })} %</span>;
}

export default function Marketing({ ui, negocio, hoy, empleadas, citas, bloqueos, servicios, clientes, bonosVendidos, bonoUsos, ventas, productos, contactos, horarioDe, onContacto, onConfirmacion, onAbrirCita, onAbrirCliente }) {
  const [dia, setDia] = useState(sumarDias(hoy, 1)); // día de los huecos: mañana por defecto
  const [minDias, setMinDias] = useState(45);
  const [verContactadas, setVerContactadas] = useState(false);
  const [ofrecerHueco, setOfrecerHueco] = useState(true);
  const [verMas, setVerMas] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const refHuecos = useRef(null), refReactivar = useRef(null);
  const manana = sumarDias(hoy, 1);

  const huecos = useMemo(() => huecosDelDia({ empleadas, fecha: dia, citas, bloqueos, horarioDe: (e) => horarioDe(e, dia) }), [empleadas, dia, citas, bloqueos, horarioDe]);
  const huecosManana = useMemo(() => (dia === manana ? huecos : huecosDelDia({ empleadas, fecha: manana, citas, bloqueos, horarioDe: (e) => horarioDe(e, manana) })), [dia, huecos, empleadas, manana, citas, bloqueos, horarioDe]);
  const habitual = useMemo(() => ocupacionHabitual({ citas, fecha: dia }), [citas, dia]);
  const senales = useMemo(() => senalesDeHuecos({ fecha: dia, huecos, habitual, citas }), [dia, huecos, habitual, citas]);
  const kpis = useMemo(() => kpisDelNegocio({ empleadas: [...empleadas], citas, ventas, bonosVendidos, servicios, productos, clientes, hoy }), [empleadas, citas, ventas, bonosVendidos, servicios, productos, clientes, hoy]);
  const semana = useMemo(() => ocupacionProximosDias({ empleadas, citas, bloqueos, horarioDe, hoy }), [empleadas, citas, bloqueos, hoy, horarioDe]);

  const todas = useMemo(() => clientesParaReactivar({ clientes, citas, servicios, bonosVendidos, bonoUsos, contactos, hoy, minDias }), [clientes, citas, servicios, bonosVendidos, bonoUsos, contactos, hoy, minDias]);
  const lista = verContactadas ? todas : todas.filter((x) => !x.contactadaReciente);
  const visibles = verMas ? lista : lista.slice(0, LIMITE);
  const reparto = useMemo(() => (ofrecerHueco ? repartirHuecos({ clientas: visibles, huecos }) : {}), [ofrecerHueco, visibles, huecos]);
  const sinCita = bonosSinCita({ bonosVendidos, bonoUsos, citas, hoy }).length;
  const citasManana = citas.filter((c) => c.fecha === manana && c.asistencia !== "cancelada").length;
  const acciones = accionesDeHoy({ huecosManana, sinConfirmarManana: contarSinConfirmar(citas, manana), citasManana, reactivables: lista, bonosSinCita: sinCita, hoy });
  const ir = (a) => { if (a === "confirmar") setConfirmando(true); else if (a === "huecos") refHuecos.current?.scrollIntoView({ behavior: "smooth", block: "start" }); else if (a === "reactivar") refReactivar.current?.scrollIntoView({ behavior: "smooth", block: "start" }); };

  const tarjeta = { padding: 16 };
  const kpi = (clave, titulo, grande, pie) => (
    <div className="card" data-kpi={clave} style={tarjeta}>
      <div style={{ fontSize: 12.5, color: MUTED }}>{titulo}</div>
      <div style={{ fontSize: 22, fontWeight: 700, margin: "2px 0" }}>{grande}</div>
      <div style={{ fontSize: 12.5, color: MUTED }}>{pie}</div>
    </div>
  );
  const c30 = kpis.cancelaciones30;

  return (
    <div data-marketing="1">
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 26, marginBottom: 4, display: "flex", alignItems: "center", gap: 10 }}><Megaphone size={24} aria-hidden="true" /> Marketing · informe del día</h1>
        <p style={{ color: MUTED, margin: 0, fontSize: 14, textTransform: "capitalize" }}>{diaLargo(hoy)} <span style={{ textTransform: "none" }}>· se calcula al abrir con los datos de ahora mismo · solo lo ves tú</span></p>
      </div>

      {/* ===== Qué hacer hoy ===== */}
      <section aria-label="Qué hacer hoy" style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 18, margin: "0 0 10px" }}>Qué hacer hoy</h2>
        {acciones.length === 0 && <div className="card" data-sin-acciones="1" style={{ ...tarjeta, color: MUTED }}>✓ Todo en orden: no hay nada urgente que hacer hoy.</div>}
        {acciones.map((a) => (
          <div key={a.id} className="card" data-accion-hoy={a.id} style={{ ...tarjeta, marginBottom: 8, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", borderLeft: `4px solid ${a.prioridad === 1 ? "#DC2626" : a.prioridad === 2 ? "#D97706" : "rgba(var(--ink-rgb),0.25)"}` }}>
            <div style={{ flex: "1 1 280px" }}>
              <div style={{ fontWeight: 700 }}>{a.titulo}</div>
              <div style={{ fontSize: 13, color: MUTED }}>{a.detalle}</div>
            </div>
            {a.accion && <button type="button" className="btn btn-gold" data-ir-accion={a.id} style={{ minHeight: 36 }} onClick={() => ir(a.accion)}>{a.accion === "confirmar" ? "Confirmar ahora" : a.accion === "huecos" ? "Ver los huecos" : "Ver la lista"}</button>}
          </div>
        ))}
      </section>

      {/* ===== Cómo va el negocio ===== */}
      <section aria-label="Cómo va el negocio" style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 18, margin: "0 0 10px" }}>Cómo va el negocio</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          {kpi("hoy", "Hoy", eur(kpis.hoy.facturacion), `${kpis.hoy.citas} ${kpis.hoy.citas === 1 ? "cita cobrada" : "citas cobradas"} · ayer ${eur(kpis.ayer.facturacion)}`)}
          {kpi("semana", "Esta semana", eur(kpis.semana.facturacion), <><Variacion valor={kpis.variacionSemana} /> frente a la anterior (mismos días)</>)}
          {kpi("mes", "Este mes", eur(kpis.mes.facturacion), <><Variacion valor={kpis.variacionMes} /> frente al mes pasado (mismos días)</>)}
          {kpi("ticket", "Ticket medio (30 días)", eur(kpis.ticketMedio30), "lo que deja de media cada cita cobrada")}
          {kpi("cancel", "Cancelaciones (30 días)", `${c30.tasaCancelacion.toLocaleString("es-ES")} %`, `${c30.canceladas} canceladas y ${c30.noVino} que no vinieron de ${c30.programadas} citas`)}
          {kpi("ocupacion7", "Ocupación próximos 7 días", pct(semana), "de las horas de trabajo ya tienen cita")}
          {kpi("clientas", "Clientas", `${kpis.clientas.activas} activas`, `${kpis.clientas.enRiesgo} en riesgo (3–6 meses sin venir) · ${kpis.clientas.perdidas} perdidas (más de 6 meses)`)}
        </div>
      </section>

      {/* ===== Huecos ===== */}
      <section ref={refHuecos} aria-label="Huecos" data-huecos-dia={dia} style={{ marginBottom: 22, scrollMarginTop: 90 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", margin: "0 0 10px" }}>
          <h2 style={{ fontSize: 18, margin: 0 }}>Huecos {dia === manana ? "de mañana" : dia === hoy ? "de hoy" : "del"} <span style={{ textTransform: "capitalize" }}>{dia === manana || dia === hoy ? "" : diaLargo(dia)}</span></h2>
          <button type="button" className="btn btn-ghost" aria-label="Día anterior" disabled={dia <= hoy} style={{ minHeight: 34, padding: "4px 10px" }} onClick={() => setDia(sumarDias(dia, -1))}><ChevronLeft size={16} /></button>
          <span style={{ fontSize: 14, textTransform: "capitalize" }}>{diaLargo(dia)}</span>
          <button type="button" className="btn btn-ghost" aria-label="Día siguiente" style={{ minHeight: 34, padding: "4px 10px" }} onClick={() => setDia(sumarDias(dia, 1))}><ChevronRight size={16} /></button>
        </div>
        <div className="card" style={tarjeta}>
          {huecos.porEmpleada.length === 0 ? (
            <div data-sin-horario="1" style={{ color: MUTED }}>Nadie trabaja ese día.</div>
          ) : (
            <>
              <div data-ocupacion="1" style={{ marginBottom: 10, fontSize: 14 }}>
                <strong>{pct(huecos.ocupacion)} ocupado</strong> · {legible(huecos.libres)} libres de {legible(huecos.disponibles)} de trabajo
                <div role="progressbar" aria-valuenow={Math.round(huecos.ocupacion * 100)} aria-valuemin={0} aria-valuemax={100} style={{ height: 8, borderRadius: 999, background: "rgba(var(--ink-rgb),0.1)", marginTop: 6, overflow: "hidden" }}><div style={{ width: `${Math.round(huecos.ocupacion * 100)}%`, height: "100%", background: huecos.ocupacion < 0.5 ? "#D97706" : "#16A34A" }} /></div>
              </div>
              {huecos.porEmpleada.map((e) => (
                <div key={e.empleada.id} data-hueco-empleada={e.empleada.id} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", padding: "6px 0", borderTop: "1px solid var(--line)" }}>
                  <strong style={{ minWidth: 90 }}>{e.empleada.nombre}</strong>
                  <span style={{ fontSize: 12.5, color: MUTED, minWidth: 110 }}>{hhmm(e.inicio)}–{hhmm(e.fin)} · {pct(e.ocupacion)}</span>
                  {e.huecos.length === 0 ? <span style={{ fontSize: 13, color: "#166534" }}>Sin huecos</span> : e.huecos.map((h, i) => <span key={i} data-hueco={`${e.empleada.id}-${h.inicio}`} style={{ background: "rgba(217,119,6,0.16)", color: "#92400E", borderRadius: 999, padding: "2px 10px", fontSize: 13, fontWeight: 600 }}>{hhmm(h.inicio)}–{hhmm(h.fin)} ({legible(h.minutos)})</span>)}
                </div>
              ))}
            </>
          )}
        </div>
        <div className="card" data-senales="1" style={{ ...tarjeta, marginTop: 10 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>¿Por qué hay estos huecos?</div>
          <ul style={{ margin: "0 0 6px", paddingLeft: 18, fontSize: 14 }}>{senales.map((s, i) => <li key={i}>{s}</li>)}</ul>
          <div style={{ fontSize: 12, color: MUTED }}>Son pistas sacadas de tus datos (reservas habituales, cancelaciones, confirmaciones y horas), no causas seguras.</div>
        </div>
        {huecos.nHuecos > 0 && (
          <div className="card" data-como-rellenar="1" style={{ ...tarjeta, marginTop: 10 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Cómo rellenarlos</div>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
              <li>Escribe ahora a las clientas de la lista de abajo: ya llevan un hueco concreto en el mensaje.</li>
              <li>Si tienes citas sin confirmar, confírmalas primero: lo que no se confirma suele acabar en hueco.</li>
              <li>Si queda libre a última hora, ofrece el hueco por WhatsApp a clientas que suelen venir ese día.</li>
            </ol>
          </div>
        )}
      </section>

      {/* ===== Clientas para reactivar ===== */}
      <section ref={refReactivar} aria-label="Clientas para reactivar" data-reactivar-seccion="1" style={{ marginBottom: 22, scrollMarginTop: 90 }}>
        <h2 style={{ fontSize: 18, margin: "0 0 4px" }}>Clientas que hace tiempo que no vienen</h2>
        <p style={{ margin: "0 0 10px", fontSize: 13, color: MUTED }}>Primero las que tienen un bono sin gastar y las que más han gastado. No salen las que ya tienen una cita próxima.</p>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center", marginBottom: 10, fontSize: 14 }}>
          <label style={{ display: "flex", gap: 6, alignItems: "center" }}>Sin venir desde hace más de
            <select className="input" aria-label="Sin venir desde hace más de" style={{ width: "auto", minHeight: 34, padding: "2px 8px" }} value={minDias} onChange={(e) => setMinDias(Number(e.target.value))}>
              {[30, 45, 60, 90, 180].map((d) => <option key={d} value={d}>{d} días</option>)}
            </select>
          </label>
          <label style={{ display: "flex", gap: 6, alignItems: "center" }}><input type="checkbox" aria-label="Ofrecer un hueco en el mensaje" checked={ofrecerHueco} onChange={(e) => { setOfrecerHueco(e.target.checked); }} /> Ofrecer un hueco de {dia === manana ? "mañana" : diaLargo(dia)} en el mensaje</label>
          <label style={{ display: "flex", gap: 6, alignItems: "center" }}><input type="checkbox" aria-label="Mostrar también las ya contactadas" checked={verContactadas} onChange={(e) => setVerContactadas(e.target.checked)} /> Mostrar también las que ya he contactado hace poco ({todas.filter((x) => x.contactadaReciente).length})</label>
        </div>
        {lista.length === 0 && <div className="card" data-sin-reactivar="1" style={{ ...tarjeta, color: MUTED }}>No hay clientas en ese rango ahora mismo.</div>}
        {visibles.map((r) => {
          const c = r.cliente;
          const h = reparto[c.id];
          const texto = mensajeReactivacion({ nombre: c.nombre, ultimoServicio: r.ultimoServicio, dias: r.dias, hueco: h ? { fecha: dia, inicio: h.inicio } : undefined, hoy, negocio });
          const wa = enlaceWhatsApp(c.telefono, texto), tel = enlaceLlamada(c.telefono);
          const boton = { minHeight: 34, padding: "4px 12px", textDecoration: "none" };
          return (
            <div key={c.id} className="card" data-reactivar={c.id} style={{ ...tarjeta, marginBottom: 8, opacity: r.contactadaReciente ? 0.6 : 1 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 280px", minWidth: 0 }}>
                  <div style={{ fontWeight: 700 }}>{c.nombre} {r.bonoSesiones > 0 && <span data-bono-pendiente="1" style={{ background: "rgba(22,163,74,0.16)", color: "#166534", fontSize: 12, borderRadius: 999, padding: "2px 9px", marginLeft: 6 }}>bono: {r.bonoSesiones} {r.bonoSesiones === 1 ? "sesión" : "sesiones"} sin gastar</span>}</div>
                  <div style={{ fontSize: 13, color: MUTED }}>Hace {tiempoSinVenir(r.dias)} ({r.ultimaVisita}) · {r.ultimoServicio?.nombre || "—"} · {r.visitas} {r.visitas === 1 ? "visita" : "visitas"} · {eur(r.gasto)} gastados</div>
                  {r.ultimoContacto && <div data-contactada="1" style={{ fontSize: 12.5, color: "#92400E" }}>Contactada hace {r.contactadaHaceDias === 0 ? "hoy" : `${r.contactadaHaceDias} ${r.contactadaHaceDias === 1 ? "día" : "días"}`}</div>}
                  {h && <div data-hueco-ofrecido="1" style={{ fontSize: 12.5, color: "#166534" }}>Se le ofrece: {hhmm(h.inicio)} con {h.empleada.nombre} ({legible(h.duracion)})</div>}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                  {wa ? <a href={wa} data-wa={c.id} target="_blank" rel="noopener noreferrer" className="btn btn-gold" style={boton} onClick={() => onContacto(c, "whatsapp", "reactivacion")}><MessageCircle size={14} aria-hidden="true" /> WhatsApp</a> : <span className="btn btn-ghost" aria-disabled="true" title="Sin teléfono válido" style={{ ...boton, opacity: 0.4 }}><MessageCircle size={14} aria-hidden="true" /> WhatsApp</span>}
                  {tel ? <a href={tel} data-llamar={c.id} className="btn btn-ghost" style={boton} onClick={() => onContacto(c, "llamada", "reactivacion")}><Phone size={14} aria-hidden="true" /> Llamar</a> : null}
                  <button type="button" className="btn btn-ghost" data-marcar-contactada={c.id} style={boton} onClick={() => onContacto(c, "manual", "reactivacion")}><Check size={14} aria-hidden="true" /> Ya contactada</button>
                  <button type="button" className="btn btn-ghost" data-abrir-ficha={c.id} style={boton} onClick={() => onAbrirCliente(c)}>Ficha</button>
                </div>
              </div>
              <details style={{ marginTop: 6, fontSize: 13 }}><summary style={{ cursor: "pointer", color: MUTED }}>Ver el mensaje</summary><div data-mensaje={c.id} style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>{texto}</div></details>
            </div>
          );
        })}
        {lista.length > LIMITE && !verMas && <button type="button" className="btn btn-ghost" data-ver-mas="1" onClick={() => setVerMas(true)}>Ver las {lista.length - LIMITE} restantes</button>}
        <p style={{ fontSize: 12.5, color: MUTED, margin: "10px 0 0" }}>La app no envía nada sola: «WhatsApp» abre el chat con el mensaje preparado y lo mandas tú con un toque (así cumple con las normas de WhatsApp y de protección de datos: escribe solo a clientas que ya te conocen). Al pulsar, queda anotado que se ha contactado y no vuelve a salir en 14 días.</p>
      </section>

      {confirmando && (
        <ConfirmarCitas
          ui={ui} negocio={negocio} fechaInicial={manana} hoy={hoy} citas={citas} clientes={clientes} servicios={servicios} empleadas={empleadas}
          onConfirmacion={onConfirmacion} onAbrirCita={(c) => { setConfirmando(false); onAbrirCita(c); }} onClose={() => setConfirmando(false)}
        />
      )}
    </div>
  );
}
