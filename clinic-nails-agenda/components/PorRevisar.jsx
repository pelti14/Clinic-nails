"use client";

// Reservas por revisar: las que ha hecho el bot de IA de GHL sin que supiera qué servicio era (la app les pone uno por defecto y la cita
// conserva la duración fija del calendario de GHL). Aquí se elige el servicio correcto con un clic: la cita pasa a durar lo que dura ese
// servicio, se busca cabina y se corrige también en GHL (título y duración). Avisa, sin bloquear, si pisa otra cita o queda fuera de horario.

import React, { useMemo, useState } from "react";
import { corregirServicio, tituloDeGHL, valorDelCampo } from "../lib/porRevisar";
import { diaLargo } from "../lib/publicoCliente";

const MUTED = "rgba(var(--ink-rgb),0.72)";
const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const eur = (n) => `${Number(n || 0).toLocaleString("es-ES", { maximumFractionDigits: 2 })} €`;

function Fila({ cita, servicios, empleadas, cabinas, todasLasCitas, bloqueos, horarioDe, onCorregir, onEstaBien, onAbrirCita }) {
  const [servicioId, setServicioId] = useState("");
  const [trabajando, setTrabajando] = useState(false);
  const emp = empleadas.find((e) => e.id === cita.empleadaId);
  const actual = servicios.find((s) => s.id === cita.servicioId);
  const elegido = servicios.find((s) => s.id === servicioId);
  const suyos = servicios.filter((s) => (s.empleadas || []).includes(cita.empleadaId));
  const otros = servicios.filter((s) => !(s.empleadas || []).includes(cita.empleadaId));
  const prev = useMemo(() => (elegido && emp ? corregirServicio({ cita, servicio: elegido, cabinas, citas: todasLasCitas, bloqueos, empleada: emp, horario: horarioDe(emp, cita.fecha) }) : null), [elegido, emp, cita, cabinas, todasLasCitas, bloqueos, horarioDe]);
  const campo = valorDelCampo(cita.notas), titulo = tituloDeGHL(cita.notas);

  async function accion(f) { setTrabajando(true); try { await f(); } finally { setTrabajando(false); } }
  // «Mirar ahora en GHL»: qué pone AHORA el campo «Servicio» del contacto
  const [mirada, setMirada] = useState(null);
  async function mirarEnGHL() {
    setMirada({ cargando: true });
    try {
      const r = await fetch("/api/ghl/campo-servicio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ citaId: cita.id }) });
      setMirada(await r.json().catch(() => ({ ok: false, error: "Respuesta no válida" })));
    } catch (e) { setMirada({ ok: false, error: "Sin conexión" }); }
  }
  const textoMirada = (m) => {
    if (m.cargando) return "Mirando en GHL…";
    if (!m.ok) return `No se ha podido mirar: ${m.error || "error desconocido"}.`;
    if (m.sinPermiso) return m.mensaje;
    if (m.sinCampo) return `En GHL no hay ningún campo de contacto que se llame «Servicio»${m.campos?.length ? ` (los que hay: ${m.campos.join(", ")})` : ""}. Créalo (tipo texto) y que el bot lo rellene.`;
    const campoTxt = `el campo «${m.campo.nombre}»${m.campo.clave ? ` (${m.campo.clave})` : ""}`;
    if (m.sinContacto) return `Esta reserva no tiene contacto en GHL, así que no hay ${campoTxt} que leer.`;
    if (!m.valor) return `Ahora mismo ${campoTxt} de este contacto está VACÍO: el bot no lo está rellenando. En GHL, en el bot de IA, revisa que la acción que guarda el servicio escriba en ese campo y que se ejecute ANTES o justo después de reservar.${m.campo.tipo && !/TEXT/i.test(m.campo.tipo) ? ` Además, es de tipo ${m.campo.tipo}: mejor de tipo texto.` : ""}`;
    return `Ahora ${campoTxt} dice «${m.valor}». En la próxima sincronización (en un minuto) la agenda lo aplicará sola si coincide con un servicio; si no, elige el correcto aquí.`;
  };
  return (
    <div data-fila-revisar={cita.id} className="card" style={{ padding: 14, marginBottom: 10, borderLeft: "4px solid #F59E0B" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "baseline" }}>
        <div style={{ fontWeight: 700 }}>{cita.clienta || "Sin nombre"}</div>
        <div style={{ fontSize: 13.5, color: MUTED }}>{diaLargo(cita.fecha)} · {hhmm(cita.inicio)}{emp ? ` · ${emp.nombre}` : ""}</div>
      </div>
      <div style={{ fontSize: 13, color: MUTED, margin: "4px 0 8px", lineHeight: 1.5 }}>
        {titulo && <div>Título de la reserva en GHL: «{titulo}»</div>}
        <div data-que-escribio-el-bot="1">{campo ? <>El bot escribió «{campo}» en «Servicio», pero no coincide con ninguno.</> : "El bot no escribió ningún servicio."}</div>
        <div>Ahora tiene <strong>{actual ? actual.nombre : "un servicio por defecto"}</strong> (por defecto) · {cita.duracion} min</div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <select className="input" aria-label={`Servicio correcto para ${cita.clienta || "la cita"}`} value={servicioId} onChange={(e) => setServicioId(e.target.value)} style={{ flex: "1 1 240px", maxWidth: 360 }}>
          <option value="">Elige el servicio correcto…</option>
          {suyos.length > 0 && <optgroup label={`Los que hace ${emp?.nombre || "esta profesional"}`}>{suyos.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}</optgroup>}
          {otros.length > 0 && <optgroup label="Otros servicios">{otros.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}</optgroup>}
        </select>
        <button type="button" className="btn btn-gold" data-corregir={cita.id} disabled={!elegido || trabajando} style={{ minHeight: 38 }} onClick={() => accion(() => onCorregir(cita, elegido))}>{trabajando ? "Guardando…" : prev && prev.avisos.length ? "Corregir igualmente" : "Corregir"}</button>
      </div>
      {prev && (
        <div data-vista-previa={cita.id} style={{ marginTop: 8, fontSize: 13.5 }}>
          Pasará a durar <strong>{prev.cambios.duracion} min</strong> (de {hhmm(cita.inicio)} a {hhmm(cita.inicio + prev.cambios.duracion)}) · {eur(elegido.precio)}
          {prev.avisos.length > 0 && <div data-avisos-revisar={cita.id} style={{ color: "#92400E", marginTop: 4 }}>⚠ {prev.avisos.join(" · ")}</div>}
        </div>
      )}
      <div style={{ display: "flex", gap: 14, marginTop: 8, flexWrap: "wrap" }}>
        <button type="button" className="link-btn" data-esta-bien={cita.id} disabled={trabajando} style={{ fontSize: 13 }} onClick={() => accion(() => onEstaBien(cita))}>Está bien así (dejar el servicio actual)</button>
        <button type="button" className="link-btn" data-abrir-cita-revisar={cita.id} style={{ fontSize: 13 }} onClick={() => onAbrirCita(cita)}>Abrir la cita</button>
        <button type="button" className="link-btn" data-mirar-ghl={cita.id} disabled={mirada?.cargando} style={{ fontSize: 13 }} onClick={mirarEnGHL}>Mirar ahora en GHL</button>
      </div>
      {mirada && <div role="status" data-mirada-ghl={cita.id} style={{ marginTop: 8, fontSize: 13, lineHeight: 1.5, padding: "8px 10px", borderRadius: 10, background: "rgba(var(--accent-rgb),0.08)" }}>{textoMirada(mirada)}</div>}
    </div>
  );
}

export default function PorRevisar({ ui, citas, servicios, empleadas, cabinas, todasLasCitas, bloqueos, horarioDe, onCorregir, onEstaBien, onAbrirCita, onClose }) {
  const { ModalShell } = ui;
  const activos = servicios.filter((s) => s.activo !== false).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  return (
    <ModalShell title={`Reservas por revisar${citas.length ? ` (${citas.length})` : ""}`} onClose={onClose} ancho={760}>
      <p style={{ fontSize: 13.5, color: MUTED, marginTop: -4 }}>
        Son reservas que hizo el bot de IA sin saber qué servicio era: la agenda les puso uno por defecto y conservan la duración del calendario de GHL.
        Elige el servicio correcto: la cita pasará a durar lo que dura ese servicio y se corregirá también en GHL (título y duración).
        Si el bot escribe el servicio un poco después de reservar, la agenda lo vuelve a mirar sola en cada sincronización con GHL (cada minuto con la agenda abierta, durante 24 h) y la corrige sin que hagas nada.
      </p>
      {citas.length === 0 && <div data-sin-revisar="1" className="card" style={{ padding: 18, color: MUTED }}>✓ No hay ninguna reserva por revisar.</div>}
      {citas.map((c) => <Fila key={c.id} cita={c} servicios={activos} empleadas={empleadas} cabinas={cabinas} todasLasCitas={todasLasCitas} bloqueos={bloqueos} horarioDe={horarioDe} onCorregir={onCorregir} onEstaBien={onEstaBien} onAbrirCita={onAbrirCita} />)}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}><button type="button" className="btn btn-ghost" onClick={onClose}>Cerrar</button></div>
    </ModalShell>
  );
}
