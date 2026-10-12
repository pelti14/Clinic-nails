"use client";

// La página del ENLACE de una cita (/reservar/cita/<código>): la clienta ve su cita y puede cambiarla o cancelarla sin entrar con nada.
// El enlace es único de esa cita y está firmado por el servidor. Se lo mandas desde una automatización de GHL ({{contact.enlace_cita}}).

import React, { useEffect, useState } from "react";
import CambiarCita from "./CambiarCita";
import { api, diaLargo, legible, primerNombre } from "../lib/publicoCliente";
import { icsDeCita } from "../lib/reservaOnline";

const MUTED = "rgba(var(--ink-rgb),0.72)";

export default function GestionarCita({ codigo }) {
  const [info, setInfo] = useState(null);
  const [fallo, setFallo] = useState("");
  const [cambiando, setCambiando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [hecho, setHecho] = useState(null); // { tipo: "cambiada" | "cancelada", cita? }
  const [error, setError] = useState("");
  const [trabajando, setTrabajando] = useState(false);

  async function cargar() {
    const r = await api("cita", { codigo });
    if (r.ok) { setInfo(r.data); document.title = `Tu cita — ${r.data.negocio}`; } else setFallo(r.status === 404 ? "Este enlace no es válido. Si lo has copiado a mano, comprueba que esté completo; si no, llámanos y te ayudamos." : r.data.error || "No se ha podido cargar tu cita.");
  }
  useEffect(() => { cargar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function cancelar() {
    setTrabajando(true); setError("");
    const r = await api("cancelar", { codigo });
    setTrabajando(false);
    if (r.ok) { setHecho({ tipo: "cancelada" }); setConfirmando(false); await cargar(); } else setError(r.data.error || "No se ha podido cancelar.");
  }
  function descargarIcs(c) {
    const ics = icsDeCita({ negocio: info.negocio, titulo: `${c.servicios.join(" + ")} — ${info.negocio}`, fecha: c.fecha, inicio: c.inicio, duracion: c.duracion || info.cita.duracion, uid: c.id });
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    const a = document.createElement("a"); a.href = url; a.download = "mi-cita.ics"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const caja = { maxWidth: 640, margin: "0 auto", padding: "24px 16px 60px" };
  if (fallo) return <main style={caja}><div role="alert" data-cita-fallo="1" className="card" style={{ padding: 20 }}>{fallo}</div><p style={{ marginTop: 14 }}><a href="/reservar" data-reservar-nueva="1">Reservar una cita nueva</a></p></main>;
  if (!info) return <main style={caja}><p data-cita-cargando="1" style={{ color: MUTED }}>Cargando tu cita…</p></main>;
  const c = info.cita;
  const aviso = { cancelada: "Esta cita está cancelada.", pasada: "Esta cita ya ha pasado.", cobrada: "Esta cita ya está pagada: no se puede cambiar desde aquí." }[c.estado];

  return (
    <main style={caja} data-gestionar-cita="1">
      <h1 style={{ fontSize: 26, margin: "0 0 4px" }}>{info.negocio}</h1>
      <p style={{ margin: "0 0 16px", color: MUTED }}>{info.cliente.nombre ? `Hola, ${primerNombre(info.cliente.nombre)}. ` : ""}Esta es tu cita.</p>
      <div className="card" data-resumen-cita-enlace="1" style={{ padding: 18 }}>
        <div style={{ fontSize: 19, fontWeight: 700 }} data-cita-dia="1">{diaLargo(c.fecha)} · {c.hora}</div>
        <div style={{ marginTop: 4 }}>{c.servicios.join(" + ")}</div>
        <div style={{ fontSize: 14, color: MUTED, marginTop: 2 }}>{c.empleada ? `Con ${c.empleada}` : ""}{c.duracion ? ` · ${legible(c.duracion)}` : ""}</div>
        {c.estado !== "activa" && <div data-estado-cita={c.estado} style={{ marginTop: 12, fontWeight: 600 }}>{aviso}</div>}
      </div>

      {hecho?.tipo === "cancelada" && <div role="status" data-cita-cancelada="1" className="card" style={{ padding: 14, marginTop: 12, background: "rgba(5,96,58,0.10)" }}>Tu cita ha quedado cancelada. Gracias por avisarnos.</div>}
      {hecho?.tipo === "cambiada" && (
        <div role="status" data-cita-cambiada="1" className="card" style={{ padding: 14, marginTop: 12, background: "rgba(5,96,58,0.10)" }}>
          {hecho.sinCambios ? "Tu cita se queda como estaba." : <>¡Hecho! Tu cita es ahora el <strong>{diaLargo(hecho.cita.fecha)} a las {hecho.cita.hora}</strong>{hecho.cita.empleada ? ` con ${hecho.cita.empleada}` : ""}.</>}
          {!hecho.sinCambios && <div style={{ marginTop: 8 }}><button type="button" className="btn btn-ghost" data-ics="1" style={{ minHeight: 34 }} onClick={() => descargarIcs({ ...hecho.cita, servicios: c.servicios })}>Añadir al calendario</button></div>}
        </div>
      )}

      {c.estado === "activa" && !hecho && (
        c.puedeCambiar ? (
          <div style={{ marginTop: 14 }}>
            {!cambiando && !confirmando && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" className="btn btn-gold" data-cambiar="1" onClick={() => { setCambiando(true); setError(""); }}>Cambiar el día o la hora</button>
                <button type="button" className="btn btn-ghost" data-cancelar="1" onClick={() => { setConfirmando(true); setError(""); }}>Cancelar mi cita</button>
              </div>
            )}
            {confirmando && (
              <div className="card" data-confirmar-cancelacion="1" style={{ padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>¿Seguro que quieres cancelar tu cita?</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" className="btn btn-gold" data-confirmar-cancelar="1" disabled={trabajando} onClick={cancelar}>{trabajando ? "Cancelando…" : "Sí, cancelar"}</button>
                  <button type="button" className="btn btn-ghost" data-no-cancelar="1" disabled={trabajando} onClick={() => setConfirmando(false)}>No</button>
                </div>
              </div>
            )}
            {cambiando && <CambiarCita auth={{ codigo }} cita={c} maxDias={info.maxDias} onCerrar={() => setCambiando(false)} onHecho={async (nueva, sinCambios) => { setCambiando(false); setHecho({ tipo: "cambiada", cita: nueva, sinCambios }); await cargar(); }} />}
            {error && <div role="alert" data-error-cita="1" style={{ color: "var(--danger)", fontSize: 13.5, marginTop: 10 }}>{error}</div>}
          </div>
        ) : (
          <div data-no-cambiable="1" className="card" style={{ padding: 14, marginTop: 14 }}>Para cambiarla o cancelarla con menos de {info.cancelarHoras} h de antelación, llámanos y lo vemos.</div>
        )
      )}
      {(c.estado === "cancelada" || hecho?.tipo === "cancelada") && <p style={{ marginTop: 16 }}><a href="/reservar" data-reservar-nueva="1">Reservar una cita nueva</a></p>}
    </main>
  );
}
