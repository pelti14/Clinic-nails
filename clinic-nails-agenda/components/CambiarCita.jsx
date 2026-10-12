"use client";

// Cambiar una cita ya reservada de día, de hora o de profesional. Lo usan «Tus próximas citas» (con el pase del móvil) y la página del
// enlace de la cita. El hueco que ocupa ahora cuenta como libre; al confirmar, el servidor vuelve a comprobarlo.

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { api, diaLargo, hoyMadrid, legible, partesDia, sumar } from "../lib/publicoCliente";

const MUTED = "rgba(var(--ink-rgb),0.72)";

// auth: { token, citaId } (pase del móvil o cookie) o { codigo } (enlace de la cita)
export default function CambiarCita({ auth, cita, maxDias = 60, onHecho, onCerrar }) {
  const [hoy] = useState(hoyMadrid);
  const [fecha, setFecha] = useState(cita.fecha >= hoy ? cita.fecha : hoy);
  const [empleadaId, setEmpleadaId] = useState("");
  const [actual, setActual] = useState(null); // la profesional que tiene ahora
  const [slots, setSlots] = useState(null);
  const [duracion, setDuracion] = useState(cita.duracion || 0);
  const [inicio, setInicio] = useState(null);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const dias = useMemo(() => Array.from({ length: Math.min(14, maxDias + 1) }, (_, i) => sumar(hoy, i)), [hoy, maxDias]);

  const pedir = useCallback(async (f, emp) => {
    setSlots(null); setInicio(null);
    const r = await api("huecos", { cambio: auth, fecha: f, empleadaId: emp || null });
    if (!r.ok) { setSlots([]); setError(r.data.error || "No se han podido cargar los huecos."); return; }
    setSlots(r.data.slots); setActual(r.data.empleadaActual); setDuracion(r.data.duracion);
  }, [auth]);
  useEffect(() => { pedir(fecha, empleadaId); }, [fecha, empleadaId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function confirmar() {
    setEnviando(true); setError("");
    const r = await api("modificar", { ...auth, fecha, inicio, empleadaId: empleadaId || null });
    setEnviando(false);
    if (r.ok) { onHecho(r.data.cita, Boolean(r.data.sinCambios)); return; }
    setError(r.data.error || "No se ha podido cambiar la cita.");
    if (r.status === 409 && /hueco/i.test(r.data.error || "")) pedir(fecha, empleadaId);
  }

  return (
    <div data-cambiar-cita="1" className="card" style={{ padding: 14, marginTop: 10, border: "1px solid var(--accent)" }}>
      <div style={{ fontWeight: 700, marginBottom: 2 }}>Cambiar tu cita</div>
      <div style={{ fontSize: 13.5, color: MUTED, marginBottom: 10 }}>Ahora la tienes el {diaLargo(cita.fecha)} a las {cita.hora}{duracion ? ` · ${legible(duracion)}` : ""}. Elige el nuevo día y hora.</div>
      {actual && (
        <label style={{ display: "block", fontSize: 13.5, marginBottom: 10 }}>¿Con quién?
          <select className="input" aria-label="Profesional para el cambio" value={empleadaId} onChange={(e) => { setEmpleadaId(e.target.value); setError(""); }} style={{ display: "block", maxWidth: 320 }}>
            <option value="">Me da igual (si puede, la misma)</option>
            <option value={actual.id}>Solo con {actual.nombre}</option>
          </select>
        </label>
      )}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 6, marginBottom: 8 }}>
        {dias.map((d) => { const p = partesDia(d); const on = fecha === d; return (
          <button key={d} type="button" data-cambio-fecha={d} aria-pressed={on} onClick={() => { setFecha(d); setError(""); }} className={`btn ${on ? "btn-gold" : "btn-ghost"}`} style={{ minWidth: 58, flexDirection: "column", padding: "6px 8px", lineHeight: 1.2 }}>
            <span style={{ fontSize: 11.5, textTransform: "capitalize" }}>{p.dow}</span><strong style={{ fontSize: 18 }}>{p.num}</strong><span style={{ fontSize: 11 }}>{p.mes}</span>
          </button>); })}
      </div>
      {maxDias > 13 && <label style={{ display: "block", fontSize: 13, marginBottom: 10 }}>Otro día: <input type="date" aria-label="Otro día para el cambio" min={hoy} max={sumar(hoy, maxDias)} value={fecha} onChange={(e) => { if (e.target.value) { setFecha(e.target.value); setError(""); } }} className="input" style={{ width: "auto", display: "inline-block", minHeight: 34, padding: "2px 8px" }} /></label>}
      <div style={{ fontWeight: 700, margin: "6px 0" }}>{diaLargo(fecha)}</div>
      {slots === null && <p data-cargando-cambio="1" style={{ color: MUTED }}>Buscando huecos…</p>}
      {slots && slots.length === 0 && !error && <div data-sin-huecos-cambio="1" style={{ color: MUTED, fontSize: 14 }}>No quedan huecos ese día. Prueba con otro día.</div>}
      {slots && slots.length > 0 && (
        <div role="group" aria-label="Horas disponibles para el cambio" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(84px, 1fr))", gap: 8 }}>
          {slots.map((s) => <button key={s.inicio} type="button" data-cambio-hueco={s.inicio} aria-pressed={inicio === s.inicio} onClick={() => { setInicio(s.inicio); setError(""); }} className={`btn ${inicio === s.inicio ? "btn-gold" : "btn-ghost"}`} style={{ minHeight: 40 }}>{s.hora}</button>)}
        </div>
      )}
      {error && <div role="alert" data-error-cambio="1" style={{ color: "var(--danger)", fontSize: 13.5, marginTop: 10 }}>{error}</div>}
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button type="button" className="btn btn-gold" data-confirmar-cambio="1" disabled={inicio === null || enviando} onClick={confirmar}>{enviando ? "Cambiando…" : "Confirmar el cambio"}</button>
        <button type="button" className="btn btn-ghost" data-cerrar-cambio="1" disabled={enviando} onClick={onCerrar}>No cambiar</button>
      </div>
    </div>
  );
}
