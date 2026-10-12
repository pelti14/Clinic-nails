"use client";

// Horario semanal de cada empleada → GHL, para que el bot de IA solo agende dentro de su horario. Siempre se ve primero lo que se va a
// enviar (y si GHL ya tiene un horario suyo) y solo se envía al confirmar. Después, cada cambio de su horario al guardar la ficha se
// actualiza solo en GHL. No se envían ausencias, vacaciones ni días sueltos, ni los turnos rotativos.

import React, { useState } from "react";
import { horarioSemanal, resumenSemanal } from "../lib/ghlHorarios";

const MUTED = "rgba(var(--ink-rgb),0.72)";

export default function HorariosGHL({ empleadas, showToast, onEnviado }) {
  const [previas, setPrevias] = useState({}); // empleadaId → respuesta de la vista previa
  const [ocupada, setOcupada] = useState("");
  const [estado, setEstado] = useState({}); // empleadaId → { ok, texto }

  async function llamar(emp, vistaPrevia) {
    setOcupada(emp.id);
    setEstado((s) => ({ ...s, [emp.id]: null }));
    try {
      const res = await fetch("/api/ghl/sync-horario", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ empleadaId: emp.id, vistaPrevia }) });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || data.ok === false) throw new Error(data?.error || data?.motivo || `GHL respondió ${res.status}`);
      if (data.accion === "no_sincronizable") { setEstado((s) => ({ ...s, [emp.id]: { ok: false, texto: data.motivo } })); return; }
      if (vistaPrevia) { setPrevias((p) => ({ ...p, [emp.id]: data })); return; }
      setPrevias((p) => ({ ...p, [emp.id]: null }));
      setEstado((s) => ({ ...s, [emp.id]: { ok: true, texto: `✓ ${data.accion === "creado" ? "Horario enviado a GHL" : "Horario actualizado en GHL"}: ${data.resumen}.${data.aviso ? ` ${data.aviso}` : ""}` } }));
      showToast?.(`GHL: horario de «${emp.nombre}» ${data.accion === "creado" ? "enviado" : "actualizado"}.`, "ok");
      onEnviado?.();
    } catch (err) {
      setEstado((s) => ({ ...s, [emp.id]: { ok: false, texto: err.message } }));
    } finally {
      setOcupada("");
    }
  }

  return (
    <div className="card" data-horarios-ghl="1" style={{ padding: 20, marginTop: 20 }}>
      <h3 style={{ fontSize: 18, margin: "0 0 4px" }}>Horarios de las empleadas → GHL</h3>
      <p style={{ margin: "0 0 14px", fontSize: 13.5, color: MUTED }}>
        Para que el bot de IA agende solo cuando cada empleada trabaja, el horario semanal de la agenda tiene que ser el mismo que el de GHL.
        Pulsa <strong>«Vista previa»</strong> para ver qué se enviaría (y si GHL ya tiene un horario suyo) y confirma. <strong>Después, cada vez que cambies su horario semanal y guardes su ficha, se actualiza solo en GHL.</strong>
      </p>
      {empleadas.length === 0 && <div data-sin-empleadas="1" style={{ color: MUTED, fontSize: 14 }}>No hay empleadas.</div>}
      {empleadas.map((e) => {
        const semanal = horarioSemanal(e);
        const previa = previas[e.id];
        const est = estado[e.id];
        return (
          <div key={e.id} data-horario-empleada={e.id} style={{ padding: "12px 0", borderTop: "1px solid var(--line)" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 260px", minWidth: 0 }}>
                <div style={{ fontWeight: 700 }}>{e.nombre}</div>
                <div data-resumen-horario={e.id} style={{ fontSize: 13, color: MUTED }}>{resumenSemanal(semanal)}</div>
                {!semanal.sincronizable && <div data-no-sincronizable={e.id} style={{ fontSize: 12.5, color: "#92400E" }}>{semanal.motivo}</div>}
                {semanal.sincronizable && !e.ghlCalendarId && <div data-sin-calendario={e.id} style={{ fontSize: 12.5, color: "#92400E" }}>No tiene calendario en GHL: asígnale uno arriba (calendarios) o guarda su ficha para que se cree.</div>}
              </div>
              {semanal.sincronizable && (
                <button type="button" className="btn btn-ghost" data-vista-previa-horario={e.id} disabled={ocupada === e.id || !e.ghlCalendarId} style={{ minHeight: 36 }} onClick={() => llamar(e, true)}>{ocupada === e.id && !previa ? "Un momento…" : "Vista previa"}</button>
              )}
            </div>
            {previa && (
              <div data-previa-horario={e.id} role="group" aria-label={`Qué se enviaría para ${e.nombre}`} style={{ marginTop: 10, border: "1px solid var(--accent)", borderRadius: 12, padding: "10px 14px", background: "rgba(var(--accent-rgb),0.07)", fontSize: 13.5 }}>
                <div>Se va a <strong>{previa.hara === "crear" ? "crear" : "actualizar"}</strong> en GHL el horario «{previa.nombreHorario}»: <strong>{previa.resumen}</strong> (hora de {previa.timezone}).</div>
                {previa.existente && <div data-horario-existente={e.id} style={{ marginTop: 4, color: "#92400E" }}>GHL ya tiene un horario suyo («{previa.existente.nombre}»): se reemplazará por este.</div>}
                {previa.avisos.map((a, i) => <div key={i} data-aviso-horario={e.id} style={{ marginTop: 4, fontSize: 12.5, color: "#92400E" }}>{a}</div>)}
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button type="button" className="btn btn-gold" data-enviar-horario={e.id} disabled={ocupada === e.id} style={{ minHeight: 36 }} onClick={() => llamar(e, false)}>{ocupada === e.id ? "Enviando…" : "Enviar a GHL"}</button>
                  <button type="button" className="btn btn-ghost" data-cancelar-horario={e.id} style={{ minHeight: 36 }} onClick={() => setPrevias((p) => ({ ...p, [e.id]: null }))}>Cancelar</button>
                </div>
              </div>
            )}
            {est && <div role={est.ok ? "status" : "alert"} data-estado-horario={e.id} style={{ marginTop: 8, fontSize: 13.5, color: est.ok ? "#166534" : "var(--danger)" }}>{est.texto}</div>}
          </div>
        );
      })}
      <p style={{ margin: "12px 0 0", fontSize: 12.5, color: MUTED }}>
        <strong>No se envían</strong> los turnos rotativos (cambian cada semana y GHL solo admite un horario semanal fijo), ni las ausencias, vacaciones o días sueltos (GHL pide fechas concretas y esa parte aún no está verificada):
        para esos días, bloquea el horario en GHL o con «Horario no disponible» en la agenda.
      </p>
    </div>
  );
}
