"use client";

// Crear una clase con IA (solo administrador). Dos caminos: 1) cuentas con tus palabras qué quieres que aprendan; 2) la app mira tus
// resultados (con reglas y tus números, sin IA), te enseña lo que ve y propone una clase para cada cosa. La IA solo escribe la clase y
// su test; antes de guardarla la ves, la editas y puedes quitar preguntas. Solo viajan cifras, nunca nombres ni teléfonos.

import React, { useState } from "react";
import { Sparkles, Trash2, RefreshCw } from "lucide-react";

const MUTED = "rgba(var(--ink-rgb),0.72)";
const TIPOS = [["refuerzo", "De refuerzo (para quien falla en esto)"], ["base", "Base (para empezar desde cero)"], ["avanzado", "Avanzada (para quien ya lo domina)"]];
const GRAVEDAD = { 3: ["Importante", "#B91C1C"], 2: ["Se puede mejorar", "#B45309"], 1: ["A tener en cuenta", "#166534"] };

export default function GeneradorCurso({ ui, hallazgos, servicios, negocio, onCrear, onClose }) {
  const { ModalShell, Field } = ui;
  const [tab, setTab] = useState("peticion");
  const [texto, setTexto] = useState("");
  const [tipo, setTipo] = useState("refuerzo");
  const [preguntas, setPreguntas] = useState(8);
  const [indicaciones, setIndicaciones] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [sinClave, setSinClave] = useState(false);
  const [curso, setCurso] = useState(null);
  const [ultima, setUltima] = useState(null); // lo último que se pidió, para «Generar otra versión»
  const [cambios, setCambios] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function generar(entrada) {
    setCargando(true); setError(""); setSinClave(false); setUltima(entrada);
    try {
      const res = await fetch("/api/cursos/generar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...entrada, tipo, preguntas, negocio, servicios: servicios.filter((s) => s.activo !== false).map((s) => ({ nombre: s.nombre, precio: s.precio })) }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) { setSinClave(Boolean(data.sinClave)); setError(data.error || "No se ha podido crear la clase. Vuelve a probar."); return; }
      setCurso({ titulo: data.curso.titulo, contenido: data.curso.contenido, preguntas: data.curso.preguntas });
    } catch (e) {
      setError("No hay conexión. Comprueba tu internet y vuelve a probar.");
    } finally {
      setCargando(false);
    }
  }
  const porPeticion = () => generar({ modo: "peticion", texto });
  const porHallazgo = (h) => generar({ modo: "resultados", hallazgos: [h], texto: indicaciones, hallazgoId: h.id });
  const otraVersion = () => generar({ ...ultima, texto: `${ultima.texto || ""}${cambios.trim() ? `${ultima.texto ? " " : ""}Cambios que quiero respecto a la versión anterior: ${cambios.trim()}` : ""}` });

  const valido = curso && curso.titulo.trim().length >= 4 && curso.contenido.trim().length >= 200 && curso.preguntas.length >= 3;
  async function crear() {
    setGuardando(true); setError("");
    try {
      await onCrear({ titulo: curso.titulo.trim(), contenido: curso.contenido.trim(), tipo, preguntas: curso.preguntas, obligatorioSemanal: false, minimoAprobado: 70, activa: true });
      onClose();
    } catch (e) {
      setError(e?.message || "No se pudo guardar la clase.");
    } finally {
      setGuardando(false);
    }
  }
  const quitarPregunta = (i) => setCurso((c) => ({ ...c, preguntas: c.preguntas.filter((_, k) => k !== i) }));

  const ajustes = (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
      <label style={{ fontSize: 13.5 }}>Tipo de clase<select className="input" aria-label="Tipo de clase" value={tipo} onChange={(e) => setTipo(e.target.value)} style={{ display: "block", minWidth: 250 }}>{TIPOS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></label>
      <label style={{ fontSize: 13.5 }}>Preguntas del test<select className="input" aria-label="Número de preguntas" value={preguntas} onChange={(e) => setPreguntas(Number(e.target.value))} style={{ display: "block" }}>{[6, 8, 10].map((n) => <option key={n} value={n}>{n} preguntas</option>)}</select></label>
    </div>
  );

  return (
    <ModalShell title="Crear una clase con IA" onClose={onClose} ancho={760}>
      {!curso && (
        <div data-generador-formulario="1">
          <div role="tablist" aria-label="Cómo crear la clase" style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            {[["peticion", "Describe lo que quieres"], ["resultados", "Según mis resultados"]].map(([id, t]) => <button key={id} type="button" role="tab" aria-selected={tab === id} data-tab-ia={id} className={`btn ${tab === id ? "btn-gold" : "btn-ghost"}`} onClick={() => { setTab(id); setError(""); }}>{t}</button>)}
          </div>

          {tab === "peticion" && (
            <>
              <p style={{ fontSize: 13.5, color: MUTED, marginTop: -4 }}>Cuéntalo como se lo contarías a una formadora: qué quieres que aprendan y a quién va dirigido. La IA escribe la clase y su test, y tú la revisas antes de guardarla.</p>
              <Field label="¿Qué quieres que aprendan?"><textarea className="input" rows={4} maxLength={1500} aria-label="Qué quieres que aprendan" placeholder="Por ejemplo: cómo explicar qué es el Dermapen y cuándo recomendarlo, sin prometer resultados; o cómo vender un bono de radiofrecuencia a una clienta que duda por el precio." value={texto} onChange={(e) => setTexto(e.target.value)} /></Field>
              {ajustes}
              <div style={{ display: "flex", justifyContent: "flex-end" }}><button type="button" className="btn btn-gold" data-generar="1" disabled={cargando || texto.trim().length < 8} onClick={porPeticion}><Sparkles size={15} aria-hidden="true" /> {cargando ? "Escribiendo la clase…" : "Crear la clase"}</button></div>
            </>
          )}

          {tab === "resultados" && (
            <>
              <p style={{ fontSize: 13.5, color: MUTED, marginTop: -4 }}>Esto es lo que se ve en tus números de las últimas semanas. Elige sobre qué quieres una clase y la IA la escribe. <strong>Solo se envían estas cifras</strong>, nunca nombres ni teléfonos de clientas ni de empleadas.</p>
              {ajustes}
              <Field label="Indicaciones (opcional)"><textarea className="input" rows={2} maxLength={500} aria-label="Indicaciones adicionales" placeholder="Por ejemplo: que tenga ejemplos con la radiofrecuencia" value={indicaciones} onChange={(e) => setIndicaciones(e.target.value)} /></Field>
              {hallazgos.map((h) => {
                const [etq, color] = GRAVEDAD[h.severidad] || GRAVEDAD[1];
                return (
                  <div key={h.id} className="card" data-hallazgo={h.id} style={{ padding: 14, marginBottom: 10, borderLeft: `4px solid ${color}` }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: 0.4 }}>{etq}</div>
                    <div style={{ fontWeight: 700, margin: "2px 0" }}>{h.titulo}</div>
                    <div data-evidencia={h.id} style={{ fontSize: 13.5, color: MUTED, marginBottom: 8 }}>{h.evidencia}</div>
                    <button type="button" className="btn btn-gold" data-crear-hallazgo={h.id} disabled={cargando} style={{ minHeight: 36 }} onClick={() => porHallazgo(h)}><Sparkles size={14} aria-hidden="true" /> {cargando && ultima?.hallazgoId === h.id ? "Escribiendo la clase…" : "Crear una clase sobre esto"}</button>
                  </div>
                );
              })}
            </>
          )}

          {cargando && <p role="status" data-escribiendo="1" style={{ fontSize: 13.5, color: MUTED }}>La IA está escribiendo la clase y su test. Puede tardar hasta un minuto: no cierres esta ventana.</p>}
          {error && (
            <div role="alert" data-error-ia="1" style={{ color: "var(--danger)", fontSize: 13.5, marginTop: 10 }}>{error}</div>
          )}
          {sinClave && (
            <div data-sin-clave="1" className="card" style={{ padding: 14, marginTop: 10, fontSize: 13.5 }}>
              <strong>Para activar la IA (se hace una sola vez):</strong>
              <ol style={{ margin: "6px 0 0", paddingLeft: 18, lineHeight: 1.6 }}>
                <li>Crea una cuenta en <strong>console.anthropic.com</strong>, añade algo de saldo y crea una clave de API.</li>
                <li>En tu hosting (Hostinger), añade la variable de entorno <strong>ANTHROPIC_API_KEY</strong> con esa clave.</li>
                <li>Reinicia la aplicación y vuelve a probar. Cada clase cuesta unos céntimos, que se descuentan de tu saldo.</li>
              </ol>
            </div>
          )}
        </div>
      )}

      {curso && (
        <div data-generador-vista="1">
          <p style={{ fontSize: 13.5, color: MUTED, marginTop: -4 }}>Léela con calma: la IA puede equivocarse. Puedes cambiar el título y el texto, y quitar las preguntas que no te gusten (mínimo 3). Cuando estés conforme, créala.</p>
          <Field label="Título de la clase"><input className="input" aria-label="Título de la clase" maxLength={120} value={curso.titulo} onChange={(e) => setCurso({ ...curso, titulo: e.target.value })} /></Field>
          <Field label="Texto de la clase"><textarea className="input" rows={14} aria-label="Texto de la clase" value={curso.contenido} onChange={(e) => setCurso({ ...curso, contenido: e.target.value })} /></Field>
          <div style={{ fontWeight: 700, margin: "6px 0" }}>Test ({curso.preguntas.length} preguntas)</div>
          {curso.preguntas.map((p, i) => (
            <div key={i} data-pregunta={i} className="card" style={{ padding: 12, marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{i + 1}. {p.texto}</div>
                <button type="button" className="btn btn-ghost" data-quitar-pregunta={i} aria-label={`Quitar la pregunta ${i + 1}`} disabled={curso.preguntas.length <= 3} style={{ minHeight: 30, padding: "2px 8px" }} onClick={() => quitarPregunta(i)}><Trash2 size={14} aria-hidden="true" /></button>
              </div>
              <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 13.5 }}>{p.opciones.map((o, k) => <li key={k} data-correcta={k === p.correcta ? "1" : undefined} style={{ color: k === p.correcta ? "#166534" : undefined, fontWeight: k === p.correcta ? 700 : 400 }}>{o}{k === p.correcta ? "  ✓" : ""}</li>)}</ul>
            </div>
          ))}
          <label style={{ fontSize: 13.5, display: "block", margin: "10px 0" }}>Tipo de clase
            <select className="input" aria-label="Tipo de clase al guardar" value={tipo} onChange={(e) => setTipo(e.target.value)} style={{ display: "block", maxWidth: 360 }}>{TIPOS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select>
          </label>
          <Field label="¿Quieres otra versión? Cuéntale qué cambiar (opcional)"><input className="input" aria-label="Qué cambiar en la otra versión" placeholder="Por ejemplo: más corta, con más ejemplos de uñas…" value={cambios} onChange={(e) => setCambios(e.target.value)} /></Field>
          {cargando && <p role="status" data-escribiendo="1" style={{ fontSize: 13.5, color: MUTED }}>Escribiendo otra versión…</p>}
          {error && <div role="alert" data-error-ia="1" style={{ color: "var(--danger)", fontSize: 13.5, marginBottom: 8 }}>{error}</div>}
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" className="btn btn-ghost" data-volver="1" disabled={cargando || guardando} onClick={() => { setCurso(null); setCambios(""); setError(""); }}>Volver</button>
              <button type="button" className="btn btn-ghost" data-otra-version="1" disabled={cargando || guardando} onClick={otraVersion}><RefreshCw size={14} aria-hidden="true" /> Generar otra versión</button>
            </div>
            <button type="button" className="btn btn-gold" data-crear-clase="1" disabled={!valido || cargando || guardando} onClick={crear}>{guardando ? "Creando…" : "Crear la clase"}</button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}
