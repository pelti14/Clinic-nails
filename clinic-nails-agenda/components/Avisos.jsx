"use client";

// Avisos para las empleadas. El administrador los crea aquí; a la empleada le salen en un popup al entrar con su código
// (una vez al día o una sola vez, según se elija). Ver lib/avisos.js para las reglas.

import React, { useState } from "react";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { FRECUENCIAS, DIAS_SEMANA, plantillaRecuerdaFichar, resumenAviso } from "../lib/avisos";

const MUTED = "rgba(var(--ink-rgb),0.72)";

// ---------------------------------------------------------------------------
// Popup para la empleada
// ---------------------------------------------------------------------------
export function AvisosPopup({ ui, avisos, onEntendido, vistaPrevia = false }) {
  const { ModalShell } = ui;
  return (
    <ModalShell title={vistaPrevia ? "Así lo verá la empleada" : avisos.length === 1 ? "Tienes un aviso" : `Tienes ${avisos.length} avisos`} onClose={onEntendido} ancho={520} nivel={2}>
      <div data-avisos-popup="1">
        {avisos.map((a) => (
          <div key={a.id || "previa"} data-aviso-popup={a.id || "previa"} style={{ padding: "12px 14px", borderRadius: 14, background: "rgba(var(--accent-rgb),0.10)", border: "1px solid var(--accent)", marginBottom: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{a.titulo}</div>
            <div style={{ whiteSpace: "pre-wrap", fontSize: 14.5, lineHeight: 1.5 }}>{a.mensaje}</div>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
          <button type="button" className="btn btn-gold" data-entendido="1" autoFocus onClick={onEntendido}>{vistaPrevia ? "Cerrar" : "Entendido"}</button>
        </div>
      </div>
    </ModalShell>
  );
}

// ---------------------------------------------------------------------------
// Editor de un aviso
// ---------------------------------------------------------------------------
function AvisoEditor({ ui, aviso, plantilla, empleadas, onClose, onGuardar }) {
  const { ModalShell, Field } = ui;
  const [f, setF] = useState(() => aviso || plantilla || { ...plantillaRecuerdaFichar(), titulo: "", mensaje: "", soloSiNoFicho: false });
  const [solo, setSolo] = useState((f.destinatarios || []).length > 0);
  const [previa, setPrevia] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const alternar = (campo, valor) => setF((x) => ({ ...x, [campo]: x[campo].includes(valor) ? x[campo].filter((v) => v !== valor) : [...x[campo], valor] }));
  const valido = f.titulo.trim() && f.mensaje.trim() && (!solo || (f.destinatarios || []).length > 0) && (!f.desde || !f.hasta || f.desde <= f.hasta);
  async function guardar() {
    setGuardando(true);
    setError("");
    try {
      await onGuardar({ ...f, titulo: f.titulo.trim(), mensaje: f.mensaje.trim(), destinatarios: solo ? f.destinatarios : [] });
    } catch (err) {
      setError(err.message || "No se pudo guardar el aviso.");
      setGuardando(false);
    }
  }
  const radio = (nombre, checked, onChange, texto, etiqueta) => (
    <label style={{ display: "flex", gap: 8, alignItems: "center" }}><input type="radio" name={nombre} aria-label={etiqueta || texto} checked={checked} onChange={onChange} /> {texto}</label>
  );
  return (
    <ModalShell title={aviso ? "Editar aviso" : "Nuevo aviso"} onClose={onClose} ancho={640}>
      <div data-aviso-editor="1">
        <Field label="Título"><input className="input" aria-label="Título del aviso" value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} placeholder="Recuerda fichar" /></Field>
        <Field label="Mensaje"><textarea className="input" rows={3} aria-label="Mensaje del aviso" value={f.mensaje} onChange={(e) => setF({ ...f, mensaje: e.target.value })} placeholder="Qué quieres que lea la empleada" /></Field>
        <Field label="¿Para quién?">
          <div style={{ display: "grid", gap: 6 }}>
            {radio("para", !solo, () => setSolo(false), "Todas las empleadas", "Para todas las empleadas")}
            {radio("para", solo, () => setSolo(true), "Solo algunas", "Solo para algunas")}
          </div>
          {solo && (
            <div data-destinatarios="1" style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
              {empleadas.map((e) => (
                <button key={e.id} type="button" className={`chip ${(f.destinatarios || []).includes(e.id) ? "on" : ""}`} aria-pressed={(f.destinatarios || []).includes(e.id)} onClick={() => alternar("destinatarios", e.id)}>{e.nombre}</button>
              ))}
              {(f.destinatarios || []).length === 0 && <span style={{ fontSize: 12.5, color: "#B45309" }}>Elige al menos una empleada.</span>}
            </div>
          )}
        </Field>
        <Field label="¿Cada cuánto sale?">
          <div style={{ display: "grid", gap: 6 }}>
            {radio("frecuencia", f.frecuencia === "diaria", () => setF({ ...f, frecuencia: "diaria" }), "Todos los días (una vez al día, la primera vez que entre)", "Todos los días")}
            {radio("frecuencia", f.frecuencia === "una_vez", () => setF({ ...f, frecuencia: "una_vez" }), "Una sola vez (no vuelve a salir cuando lo haya cerrado)", "Una sola vez")}
          </div>
          {f.frecuencia === "diaria" && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 4 }}>Solo estos días de la semana (si no marcas ninguno, sale todos):</div>
              <div data-dias-semana="1" style={{ display: "flex", gap: 6 }}>
                {DIAS_SEMANA.map((d) => <button key={d.n} type="button" title={d.largo} aria-label={d.largo} className={`chip ${(f.dias || []).includes(d.n) ? "on" : ""}`} aria-pressed={(f.dias || []).includes(d.n)} onClick={() => alternar("dias", d.n)} style={{ minWidth: 36, justifyContent: "center" }}>{d.corto}</button>)}
              </div>
            </div>
          )}
        </Field>
        <label style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 12 }}>
          <input type="checkbox" aria-label="Solo si todavía no ha fichado hoy" checked={f.soloSiNoFicho} onChange={(e) => setF({ ...f, soloSiNoFicho: e.target.checked })} style={{ marginTop: 3 }} />
          <span><strong>Solo si todavía no ha fichado hoy.</strong> Si al entrar ya ha fichado, no le sale.</span>
        </label>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Field label="Desde (opcional)"><input type="date" className="input" aria-label="Aviso desde" value={f.desde || ""} onChange={(e) => setF({ ...f, desde: e.target.value })} /></Field>
          <Field label="Hasta (opcional)"><input type="date" className="input" aria-label="Aviso hasta" value={f.hasta || ""} onChange={(e) => setF({ ...f, hasta: e.target.value })} /></Field>
        </div>
        {f.desde && f.hasta && f.desde > f.hasta && <div role="alert" style={{ color: "var(--danger)", fontSize: 13, marginBottom: 8 }}>La fecha de inicio no puede ser posterior a la del final.</div>}
        <label style={{ display: "flex", gap: 8, alignItems: "center", margin: "6px 0 14px" }}>
          <input type="checkbox" aria-label="Aviso activo" checked={f.activo !== false} onChange={(e) => setF({ ...f, activo: e.target.checked })} /> Aviso activo
        </label>
        {error && <div role="alert" style={{ color: "var(--danger)", fontSize: 13.5, marginBottom: 8 }}>{error}</div>}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="btn btn-ghost" data-vista-previa-aviso="1" disabled={!f.titulo.trim() || !f.mensaje.trim()} onClick={() => setPrevia(true)}><Eye size={14} aria-hidden="true" /> Vista previa</button>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="button" className="btn btn-gold" data-guardar-aviso="1" disabled={!valido || guardando} onClick={guardar}>Guardar</button>
          </div>
        </div>
      </div>
      {previa && <AvisosPopup ui={ui} vistaPrevia avisos={[{ id: "", titulo: f.titulo.trim(), mensaje: f.mensaje.trim() }]} onEntendido={() => setPrevia(false)} />}
    </ModalShell>
  );
}

// ---------------------------------------------------------------------------
// Pantalla del administrador
// ---------------------------------------------------------------------------
export default function AvisosAdmin({ ui, avisos, empleadas, onGuardar, onBorrar, onAlternar }) {
  const [editando, setEditando] = useState(null); // "nuevo" | aviso | { plantilla }
  return (
    <div data-avisos-admin="1">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, marginBottom: 4 }}>Avisos para el equipo</h1>
          <p style={{ color: MUTED, margin: 0, fontSize: 14 }}>Un popup que sale a las empleadas al entrar con su código, una vez al día o una sola vez.</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="btn btn-ghost" data-plantilla-fichar="1" onClick={() => setEditando({ plantilla: plantillaRecuerdaFichar() })}>«Recuerda fichar»</button>
          <button type="button" className="btn btn-gold" data-nuevo-aviso="1" onClick={() => setEditando("nuevo")}><Plus size={15} aria-hidden="true" /> Nuevo aviso</button>
        </div>
      </div>
      {avisos.length === 0 && <div className="card" data-sin-avisos="1" style={{ padding: 22, textAlign: "center", color: MUTED }}>Todavía no hay avisos. Prueba con «Recuerda fichar»: sale solo a quien aún no ha fichado.</div>}
      {avisos.map((a) => {
        const r = resumenAviso(a, empleadas);
        return (
          <div key={a.id} className="card" data-aviso-id={a.id} style={{ padding: "14px 16px", marginBottom: 10, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", opacity: a.activo === false ? 0.55 : 1 }}>
            <div style={{ flex: "1 1 280px", minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15.5 }}>{a.titulo} {a.activo === false && <span style={{ fontWeight: 400, fontSize: 12, color: MUTED }}>(desactivado)</span>}</div>
              <div style={{ fontSize: 13.5, margin: "2px 0 6px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{a.mensaje}</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", fontSize: 12 }}>
                <span style={{ background: "rgba(var(--ink-rgb),0.08)", borderRadius: 999, padding: "2px 10px" }}>{r.cuando}</span>
                <span style={{ background: "rgba(var(--ink-rgb),0.08)", borderRadius: 999, padding: "2px 10px" }}>{r.para}</span>
                {r.extra && <span style={{ background: "rgba(217,119,6,0.16)", color: "#92400E", borderRadius: 999, padding: "2px 10px" }}>{r.extra}</span>}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <button type="button" className="btn btn-ghost" data-alternar-aviso={a.id} style={{ minHeight: 34 }} onClick={() => onAlternar(a)}>{a.activo === false ? "Activar" : "Desactivar"}</button>
              <button type="button" className="btn-ghost" aria-label={`Editar ${a.titulo}`} style={{ border: "none", padding: 6 }} onClick={() => setEditando(a)}><Pencil size={15} /></button>
              <button type="button" className="btn-ghost" aria-label={`Eliminar ${a.titulo}`} style={{ border: "none", padding: 6, color: "var(--danger)" }} onClick={() => onBorrar(a)}><Trash2 size={15} /></button>
            </div>
          </div>
        );
      })}
      {editando && (
        <AvisoEditor
          ui={ui} empleadas={empleadas}
          aviso={editando === "nuevo" ? null : editando.plantilla ? null : editando}
          key={editando === "nuevo" ? "nuevo" : editando.plantilla ? "plantilla" : editando.id}
          onClose={() => setEditando(null)}
          onGuardar={async (a) => { await onGuardar(a); setEditando(null); }}
          {...(editando && editando.plantilla ? { plantilla: editando.plantilla } : {})}
        />
      )}
    </div>
  );
}
