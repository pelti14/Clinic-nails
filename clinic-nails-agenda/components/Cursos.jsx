"use client";

// Cursos de ventas. Cada empleada ve su rendimiento (semana y mes), qué ha vendido «a mayores», si cumple su objetivo, el test
// obligatorio de la semana y las clases que se le abren según ese objetivo. El administrador ve el seguimiento de todo el equipo
// y gestiona las clases. El test lo corrige el servidor.

import React, { useMemo, useState } from "react";
import { Lock, Plus, Pencil, Trash2, Check, Sparkles } from "lucide-react";
import GeneradorCurso from "./GeneradorCurso";
import { TIPOS_LECCION, MOTIVOS_REFUERZO, resumenEmpleada, estadoLeccion, testsObligatorios, testsPendientes, lunesDe, preguntaValida } from "../lib/cursos";
import { LECCIONES_RECOMENDADAS } from "../lib/leccionesBase";
import { normalizarTexto } from "../lib/agenda";

const MUTED = "rgba(var(--ink-rgb),0.7)";
const eur = (n) => `${Number(n || 0).toLocaleString("es-ES", { maximumFractionDigits: 2 })} €`;
const pct = (n) => `${Math.round((n || 0) * 100)} %`;
const COLOR_TIPO = { base: ["var(--accent-text)", "rgba(21,112,239,0.14)"], refuerzo: ["#92400E", "rgba(217,119,6,0.18)"], avanzado: ["#166534", "rgba(22,163,74,0.16)"] };

function Barra({ valor, ok }) {
  return (
    <div role="progressbar" aria-valuenow={Math.round(valor * 100)} aria-valuemin={0} aria-valuemax={100} style={{ height: 10, borderRadius: 999, background: "rgba(var(--ink-rgb),0.1)", overflow: "hidden" }}>
      <div style={{ width: `${Math.round(valor * 100)}%`, height: "100%", background: ok ? "#16A34A" : "var(--accent)", transition: "width .3s" }} />
    </div>
  );
}

function Etiqueta({ tipo }) {
  const [color, fondo] = COLOR_TIPO[tipo] || COLOR_TIPO.base;
  return <span style={{ background: fondo, color, fontWeight: 700, fontSize: 11.5, padding: "2px 9px", borderRadius: 999 }}>{TIPOS_LECCION[tipo] || tipo}</span>;
}

// ---------------------------------------------------------------------------
// Una clase: contenido y, si tiene, el test (se corrige en el servidor)
// ---------------------------------------------------------------------------
function LeccionModal({ ui, leccion, onClose, onResponder, esAdmin }) {
  const { ModalShell } = ui;
  const preguntas = leccion.preguntas || [];
  const [haciendo, setHaciendo] = useState(false);
  const [resp, setResp] = useState(() => preguntas.map(() => null));
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const completo = resp.every((x) => x !== null);

  async function enviar() {
    setEnviando(true);
    setError("");
    try {
      setResultado(await onResponder(leccion.id, resp));
    } catch (err) {
      setError(err.message || "No se pudo corregir el test.");
    } finally {
      setEnviando(false);
    }
  }
  const repetir = () => { setResp(preguntas.map(() => null)); setResultado(null); setHaciendo(true); };

  return (
    <ModalShell title={leccion.titulo} onClose={onClose} ancho={720}>
      <div data-leccion-modal="1">
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
          <Etiqueta tipo={leccion.tipo} />
          {leccion.obligatorioSemanal && <span style={{ fontSize: 12, fontWeight: 700, color: "#B45309" }}>Test obligatorio cada semana</span>}
        </div>
        {!haciendo && !resultado && (
          <>
            <div data-contenido-leccion="1" style={{ whiteSpace: "pre-wrap", fontSize: 15, lineHeight: 1.6 }}>{leccion.contenido || "Esta clase todavía no tiene contenido."}</div>
            {preguntas.length > 0 && !esAdmin && (
              <div style={{ marginTop: 18 }}>
                <button type="button" className="btn btn-gold" data-hacer-test="1" onClick={() => setHaciendo(true)}>Hacer el test ({preguntas.length} preguntas)</button>
                <div style={{ fontSize: 12.5, color: MUTED, marginTop: 6 }}>Para aprobar necesitas el {leccion.minimoAprobado} % de aciertos. Puedes repetirlo.</div>
              </div>
            )}
            {preguntas.length > 0 && esAdmin && <div style={{ fontSize: 13, color: MUTED, marginTop: 14 }}>Esta clase tiene un test de {preguntas.length} preguntas (aprobado: {leccion.minimoAprobado} %).</div>}
          </>
        )}
        {haciendo && !resultado && (
          <div data-test-preguntas="1">
            {preguntas.map((p, i) => (
              <fieldset key={i} style={{ border: "1px solid var(--line)", borderRadius: 12, padding: "10px 14px", marginBottom: 12 }}>
                <legend style={{ fontWeight: 600, fontSize: 14.5, padding: "0 6px" }}>{i + 1}. {p.texto}</legend>
                {p.opciones.map((o, j) => (
                  <label key={j} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "5px 0", fontSize: 14.5 }}>
                    <input type="radio" name={`pregunta-${i}`} aria-label={`Pregunta ${i + 1}, opción ${j + 1}: ${o}`} checked={resp[i] === j} onChange={() => setResp((r) => r.map((x, k) => (k === i ? j : x)))} />
                    <span>{o}</span>
                  </label>
                ))}
              </fieldset>
            ))}
            {error && <div role="alert" style={{ color: "var(--danger)", fontSize: 13.5, marginBottom: 8 }}>{error}</div>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setHaciendo(false)}>Volver a la clase</button>
              <button type="button" className="btn btn-gold" data-enviar-test="1" disabled={!completo || enviando} onClick={enviar}>{enviando ? "Corrigiendo…" : "Enviar respuestas"}</button>
            </div>
          </div>
        )}
        {resultado && (
          <div data-resultado-test="1">
            <div role="status" style={{ padding: "12px 14px", borderRadius: 12, marginBottom: 12, background: resultado.aprobado ? "rgba(22,163,74,0.14)" : "rgba(220,38,38,0.1)", fontSize: 15 }}>
              <strong>{resultado.aprobado ? "¡Aprobado! ✓" : "No has llegado al mínimo"}</strong> · {resultado.aciertos} de {resultado.total} ({resultado.puntuacion} %). {resultado.aprobado ? "Test de esta semana completado." : `Necesitas el ${resultado.minimo} %: repásalo y vuelve a intentarlo.`}
            </div>
            {preguntas.map((p, i) => {
              const d = resultado.detalle[i];
              return (
                <div key={i} data-pregunta-corregida={d.acertada ? "ok" : "fallo"} style={{ fontSize: 14, margin: "0 0 10px", color: d.acertada ? "inherit" : "var(--danger)" }}>
                  <strong>{d.acertada ? "✓" : "✗"} {i + 1}. {p.texto}</strong>
                  {!d.acertada && <div style={{ color: "var(--text)" }}>La respuesta correcta era: <strong>{p.opciones[d.correcta]}</strong></div>}
                </div>
              );
            })}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
              {!resultado.aprobado && <button type="button" className="btn btn-ghost" data-repetir-test="1" onClick={repetir}>Repetir el test</button>}
              <button type="button" className="btn btn-gold" onClick={onClose}>Cerrar</button>
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}

// ---------------------------------------------------------------------------
// Editor de clases (administrador)
// ---------------------------------------------------------------------------
function LeccionEditor({ ui, leccion, onClose, onGuardar }) {
  const { ModalShell, Field } = ui;
  const [f, setF] = useState(() => leccion || { titulo: "", contenido: "", tipo: "base", activa: true, obligatorioSemanal: false, minimoAprobado: 70, preguntas: [] });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const preguntas = f.preguntas || [];
  const setPregunta = (i, cambio) => setF((x) => ({ ...x, preguntas: x.preguntas.map((p, k) => (k === i ? { ...p, ...cambio } : p)) }));
  const todasValidas = preguntas.every(preguntaValida);
  const valido = f.titulo.trim().length > 0 && todasValidas && (!f.obligatorioSemanal || preguntas.length > 0) && Number(f.minimoAprobado) >= 1 && Number(f.minimoAprobado) <= 100;

  async function guardar() {
    setGuardando(true);
    setError("");
    try {
      await onGuardar({ ...f, titulo: f.titulo.trim(), minimoAprobado: Number(f.minimoAprobado), preguntas: preguntas.map((p) => ({ texto: p.texto.trim(), opciones: p.opciones.map((o) => o.trim()), correcta: p.correcta })) });
    } catch (err) {
      setError(err.message || "No se pudo guardar la clase.");
      setGuardando(false);
    }
  }
  return (
    <ModalShell title={leccion ? "Editar clase" : "Nueva clase"} onClose={onClose} ancho={760}>
      <div data-leccion-editor="1">
        <Field label="Título"><input className="input" aria-label="Título de la clase" value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} /></Field>
        <Field label="¿Cuándo se abre?">
          <select className="input" aria-label="Tipo de clase" value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value })}>
            <option value="base">Base: siempre abierta</option>
            <option value="refuerzo">Refuerzo: se abre si no alcanza su objetivo de ventas extra</option>
            <option value="avanzado">Avanzado: se abre al alcanzar su objetivo de ventas extra</option>
          </select>
        </Field>
        <Field label="Contenido de la clase"><textarea className="input" rows={7} aria-label="Contenido de la clase" value={f.contenido || ""} onChange={(e) => setF({ ...f, contenido: e.target.value })} placeholder="Explica la técnica, ejemplos de frases, cuándo ofrecer un extra…" /></Field>
        <div style={{ fontWeight: 600, margin: "6px 0 8px" }}>Test (opcional)</div>
        {preguntas.map((p, i) => (
          <div key={i} data-pregunta-editor={i} style={{ border: "1px solid var(--line)", borderRadius: 12, padding: 12, marginBottom: 10 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
              <input className="input" aria-label={`Texto de la pregunta ${i + 1}`} placeholder={`Pregunta ${i + 1}`} value={p.texto} onChange={(e) => setPregunta(i, { texto: e.target.value })} />
              <button type="button" className="btn-ghost" aria-label={`Quitar la pregunta ${i + 1}`} style={{ border: "none", padding: 6 }} onClick={() => setF((x) => ({ ...x, preguntas: x.preguntas.filter((_, k) => k !== i) }))}><Trash2 size={15} /></button>
            </div>
            {p.opciones.map((o, j) => (
              <div key={j} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                <input type="radio" name={`correcta-${i}`} aria-label={`La opción ${j + 1} de la pregunta ${i + 1} es la correcta`} checked={p.correcta === j} onChange={() => setPregunta(i, { correcta: j })} />
                <input className="input" aria-label={`Opción ${j + 1} de la pregunta ${i + 1}`} placeholder={`Opción ${j + 1}`} value={o} onChange={(e) => setPregunta(i, { opciones: p.opciones.map((x, k) => (k === j ? e.target.value : x)) })} />
                {p.opciones.length > 2 && <button type="button" className="btn-ghost" aria-label={`Quitar la opción ${j + 1} de la pregunta ${i + 1}`} style={{ border: "none", padding: 4 }} onClick={() => setPregunta(i, { opciones: p.opciones.filter((_, k) => k !== j), correcta: p.correcta === j ? 0 : p.correcta > j ? p.correcta - 1 : p.correcta })}>✕</button>}
              </div>
            ))}
            {p.opciones.length < 4 && <button type="button" className="btn btn-ghost" style={{ fontSize: 12.5, minHeight: 30, padding: "4px 10px" }} onClick={() => setPregunta(i, { opciones: [...p.opciones, ""] })}>+ opción</button>}
            {!preguntaValida(p) && <div style={{ fontSize: 12, color: "#B45309", marginTop: 4 }}>Hace falta el texto, de 2 a 4 opciones rellenas y marcar la correcta.</div>}
          </div>
        ))}
        <button type="button" className="btn btn-ghost" data-anadir-pregunta="1" onClick={() => setF((x) => ({ ...x, preguntas: [...(x.preguntas || []), { texto: "", opciones: ["", ""], correcta: 0 }] }))}><Plus size={14} /> Añadir pregunta</button>
        {preguntas.length > 0 && (
          <div style={{ display: "grid", gap: 8, margin: "14px 0" }}>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="checkbox" aria-label="Test obligatorio cada semana" checked={f.obligatorioSemanal} onChange={(e) => setF({ ...f, obligatorioSemanal: e.target.checked })} />
              <span><strong>Test obligatorio cada semana:</strong> cada empleada debe aprobarlo cada semana (de lunes a domingo).</span>
            </label>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span>Para aprobar hace falta el</span>
              <input className="input" style={{ width: 80 }} type="number" min="1" max="100" aria-label="Porcentaje mínimo para aprobar" value={f.minimoAprobado} onChange={(e) => setF({ ...f, minimoAprobado: e.target.value })} />
              <span>% de aciertos</span>
            </label>
          </div>
        )}
        {f.obligatorioSemanal && preguntas.length === 0 && <div role="alert" style={{ fontSize: 12.5, color: "#B45309" }}>Un test obligatorio necesita al menos una pregunta.</div>}
        <label style={{ display: "flex", gap: 8, alignItems: "center", margin: "8px 0 14px" }}>
          <input type="checkbox" aria-label="Clase activa" checked={f.activa !== false} onChange={(e) => setF({ ...f, activa: e.target.checked })} /> Clase activa (las desactivadas no las ve nadie)
        </label>
        {error && <div role="alert" style={{ color: "var(--danger)", fontSize: 13.5, marginBottom: 8 }}>{error}</div>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn btn-gold" data-guardar-leccion="1" disabled={!valido || guardando} onClick={guardar}>Guardar</button>
        </div>
      </div>
    </ModalShell>
  );
}

// ---------------------------------------------------------------------------
// Pantalla
// ---------------------------------------------------------------------------
export default function Cursos({ ui, usuario, esAdmin, employees, citas, ventas, bonosVendidos, servicios, productos, lecciones, resultados, hoy, onResponder, onGuardarLeccion, onBorrarLeccion, onGuardarObjetivo, calcularDiagnostico, negocio }) {
  const [tab, setTab] = useState(esAdmin ? "equipo" : "mio");
  const [abierta, setAbierta] = useState(null); // clase que se está viendo
  const [editando, setEditando] = useState(null); // "nueva" | clase
  const [generando, setGenerando] = useState(null); // null | { hallazgos }: la ventana de «Crear clase con IA»
  const semana = lunesDe(hoy);
  const equipo = employees.filter((e) => e.activa !== false && e.rol !== "admin");

  const resumenDe = (emp) => resumenEmpleada({ empleadaId: emp.id, citas, ventas, bonosVendidos, servicios, productos, objetivo: emp.objetivoExtraSemanal, objetivoTicket: emp.objetivoTicketMedio }, hoy);
  const miFicha = employees.find((e) => e.id === usuario.id) || { id: usuario.id, objetivoExtraSemanal: 0 };
  const miResumen = useMemo(() => resumenDe(miFicha), [miFicha, citas, ventas, bonosVendidos, servicios, productos, hoy]); // eslint-disable-line react-hooks/exhaustive-deps
  const pendientes = testsPendientes({ lecciones, resultados, empleadaId: usuario.id, semana });
  const obligatorios = testsObligatorios(lecciones);
  const visibles = lecciones.filter((l) => esAdmin || l.activa !== false);
  // clases recomendadas que todavía no están añadidas (el administrador las añade con un botón)
  const recomendadasPendientes = LECCIONES_RECOMENDADAS.filter((r) => !lecciones.some((l) => normalizarTexto(l.titulo) === normalizarTexto(r.titulo)));
  const refuerzoAbierto = lecciones.find((l) => l.tipo === "refuerzo" && l.activa !== false && estadoLeccion(l, miResumen).abierta);
  const mejorSemana = (lId) => resultados.filter((r) => r.empleadaId === usuario.id && r.leccionId === lId && r.semana === semana).reduce((m, r) => Math.max(m, r.puntuacion), -1);

  const tarjeta = { padding: 18 };
  const tabBtn = (id, texto) => <button key={id} type="button" aria-pressed={tab === id} className={tab === id ? "btn btn-gold" : "btn btn-ghost"} style={{ minHeight: 36 }} onClick={() => setTab(id)}>{texto}</button>;

  const listaClases = (opciones = {}) => (
    <div data-lista-clases="1">
      {visibles.length === 0 && <div className="card" style={{ ...tarjeta, textAlign: "center", color: MUTED }}>{esAdmin ? "Todavía no hay clases. Crea la primera." : "Todavía no hay clases."}</div>}
      {visibles.map((l) => {
        const est = estadoLeccion(l, miResumen);
        const abrible = esAdmin ? true : est.abierta;
        const nota = mejorSemana(l.id);
        return (
          <div key={l.id} className="card" data-leccion-id={l.id} data-abierta={abrible ? "1" : "0"} style={{ ...tarjeta, marginBottom: 10, opacity: l.activa === false ? 0.55 : 1, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 260px", minWidth: 0 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}>
                <strong style={{ fontSize: 15.5 }}>{l.titulo}</strong>
                <Etiqueta tipo={l.tipo} />
                {l.obligatorioSemanal && <span style={{ fontSize: 11.5, fontWeight: 700, color: "#B45309" }}>Test semanal obligatorio</span>}
                {l.activa === false && <span style={{ fontSize: 11.5, color: MUTED }}>(desactivada)</span>}
              </div>
              {!esAdmin && !est.abierta && <div style={{ fontSize: 13, color: MUTED, display: "flex", gap: 6, alignItems: "center" }}><Lock size={13} aria-hidden="true" /> {est.motivo}</div>}
              {!esAdmin && est.abierta && est.motivo && <div style={{ fontSize: 13, color: MUTED }}>{est.motivo}</div>}
              {!esAdmin && nota >= 0 && <div style={{ fontSize: 12.5, color: MUTED }}>Tu mejor nota esta semana: {nota} %</div>}
              {esAdmin && <div style={{ fontSize: 12.5, color: MUTED }}>{(l.preguntas || []).length ? `${l.preguntas.length} preguntas · aprobado: ${l.minimoAprobado} %` : "Sin test"}</div>}
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <button type="button" className="btn btn-ghost" disabled={!abrible} data-abrir-leccion={l.id} onClick={() => setAbierta(l)}>{abrible ? "Abrir" : "Bloqueada"}</button>
              {opciones.gestionar && (
                <>
                  <button type="button" className="btn-ghost" aria-label={`Editar ${l.titulo}`} style={{ border: "none", padding: 6 }} onClick={() => setEditando(l)}><Pencil size={15} /></button>
                  <button type="button" className="btn-ghost" aria-label={`Eliminar ${l.titulo}`} style={{ border: "none", padding: 6, color: "var(--danger)" }} onClick={() => onBorrarLeccion(l)}><Trash2 size={15} /></button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div data-cursos="1">
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 26, marginBottom: 4 }}>Cursos</h1>
        <p style={{ color: MUTED, margin: 0, fontSize: 14 }}>{esAdmin ? "Seguimiento del equipo y clases de ventas." : "Tu rendimiento, tu objetivo de ventas extra y las clases para vender mejor."}</p>
      </div>
      {esAdmin && <div role="group" aria-label="Vista de cursos" style={{ display: "flex", gap: 8, marginBottom: 16 }}>{tabBtn("equipo", "Equipo")}{tabBtn("clases", "Gestionar clases")}</div>}

      {/* ===== Empleada: su rendimiento, el test de la semana y sus clases ===== */}
      {!esAdmin && (
        <div data-vista-empleada="1">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14, marginBottom: 16 }}>
            <div className="card" data-rendimiento-semana="1" style={tarjeta}>
              <div style={{ fontSize: 13, color: MUTED }}>Esta semana</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{eur(miResumen.semana.facturacion)} <span style={{ fontSize: 13, fontWeight: 400, color: MUTED }}>facturados</span></div>
              <div style={{ fontSize: 15, margin: "8px 0 6px" }}>Ventas extra: <strong>{eur(miResumen.semana.extra)}</strong></div>
              <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 8 }}>Servicios extra {eur(miResumen.semana.extraServicios)} · productos {eur(miResumen.semana.extraProductos)} · bonos {eur(miResumen.semana.extraBonos)}</div>
              <div data-ticket-medio="1" style={{ fontSize: 14, marginBottom: 8 }}>
                Ticket medio: <strong>{eur(miResumen.semana.ticketMedio)}</strong> <span style={{ color: MUTED, fontSize: 12.5 }}>({miResumen.semana.citas} {miResumen.semana.citas === 1 ? "cita" : "citas"})</span>
                {miResumen.objetivoTicket > 0 && <span data-objetivo-ticket="1" style={{ fontSize: 12.5, color: miResumen.semana.citas > 0 && miResumen.semana.ticketMedio >= miResumen.objetivoTicket ? "#166534" : "#92400E" }}> · objetivo {eur(miResumen.objetivoTicket)}{miResumen.semana.citas > 0 && miResumen.semana.ticketMedio >= miResumen.objetivoTicket ? " ✓" : ""}</span>}
              </div>
              {miResumen.objetivo > 0 ? (
                <div data-objetivo="1">
                  <Barra valor={miResumen.progreso} ok={miResumen.cumpleSemana} />
                  <div style={{ fontSize: 13, marginTop: 6 }}>{eur(miResumen.semana.extra)} de {eur(miResumen.objetivo)} de objetivo ({pct(miResumen.progreso)}){miResumen.cumpleSemana ? " ✓ ¡Objetivo cumplido!" : ""}</div>
                </div>
              ) : <div data-sin-objetivo="1" style={{ fontSize: 13, color: MUTED }}>Todavía no tienes un objetivo semanal de ventas extra.</div>}
            </div>
            <div className="card" data-rendimiento-mes="1" style={tarjeta}>
              <div style={{ fontSize: 13, color: MUTED }}>Este mes</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{eur(miResumen.mes.facturacion)} <span style={{ fontSize: 13, fontWeight: 400, color: MUTED }}>facturados</span></div>
              <div style={{ fontSize: 15, margin: "8px 0 4px" }}>Ventas extra: <strong>{eur(miResumen.mes.extra)}</strong></div>
              <div style={{ fontSize: 12.5, color: MUTED }}>{miResumen.mes.citas} citas cobradas</div>
              {miResumen.objetivo > 0 && <div style={{ fontSize: 12.5, color: MUTED, marginTop: 6 }}>Semana pasada: {eur(miResumen.anterior.extra)} de ventas extra{miResumen.cumplioAnterior ? " ✓" : ""}</div>}
            </div>
          </div>
          {refuerzoAbierto && miResumen.motivosRefuerzo.length > 0 && (
            <div data-refuerzo-aviso="1" className="card" style={{ ...tarjeta, marginBottom: 16, borderColor: "var(--accent)", background: "rgba(var(--accent-rgb),0.08)" }}>
              <strong>Te recomendamos una clase para vender mejor.</strong> La semana pasada {miResumen.motivosRefuerzo.map((m) => MOTIVOS_REFUERZO[m]).join(" y ")}. Son 5 minutos y se entiende a la primera.
              <div style={{ marginTop: 8 }}><button type="button" className="btn btn-gold" data-abrir-refuerzo={refuerzoAbierto.id} style={{ minHeight: 34 }} onClick={() => setAbierta(refuerzoAbierto)}>Abrir «{refuerzoAbierto.titulo}»</button></div>
            </div>
          )}
          {obligatorios.length > 0 && (
            pendientes.length > 0 ? (
              <div role="alert" data-test-pendiente="1" className="card" style={{ ...tarjeta, marginBottom: 16, borderColor: "#F59E0B", background: "rgba(245,158,11,0.1)" }}>
                <strong>Tienes {pendientes.length === 1 ? "1 test obligatorio" : `${pendientes.length} tests obligatorios`} esta semana:</strong>
                {pendientes.map((l) => <div key={l.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}><span>{l.titulo}</span><button type="button" className="btn btn-gold" data-hacer-pendiente={l.id} style={{ minHeight: 34 }} onClick={() => setAbierta(l)}>Hacer el test</button></div>)}
                <div style={{ fontSize: 12.5, color: MUTED, marginTop: 8 }}>Hay que aprobarlo antes del domingo.</div>
              </div>
            ) : <div data-test-hecho="1" className="card" style={{ ...tarjeta, marginBottom: 16, borderColor: "#16A34A", background: "rgba(22,163,74,0.08)" }}><Check size={16} aria-hidden="true" /> <strong>Test de esta semana completado.</strong></div>
          )}
          <div style={{ fontWeight: 600, fontSize: 17, margin: "6px 2px 10px" }}>Clases</div>
          {listaClases()}
        </div>
      )}

      {/* ===== Administrador: seguimiento del equipo ===== */}
      {esAdmin && tab === "equipo" && (
        <div data-vista-equipo="1" className="card" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
            <thead>
              <tr style={{ background: "rgba(var(--ink-rgb),0.04)", textAlign: "left" }}>{["Empleada", "Facturado (semana)", "Ventas extra (semana)", "Objetivo semanal de extra", "Cumple", "Ticket medio (semana)", "Objetivo de ticket medio", "Facturado (mes)", "Ventas extra (mes)", "Test de la semana"].map((h) => <th key={h} style={{ padding: "10px 12px", fontWeight: 500, color: MUTED, fontSize: 12 }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {equipo.length === 0 && <tr><td colSpan={10} style={{ padding: 16, textAlign: "center", color: MUTED }}>No hay empleadas.</td></tr>}
              {equipo.map((e) => {
                const r = resumenDe(e);
                const pend = testsPendientes({ lecciones, resultados, empleadaId: e.id, semana });
                return (
                  <tr key={e.id} data-fila-equipo={e.id} style={{ borderTop: "1px solid var(--line)" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 600 }}>{e.nombre}</td>
                    <td style={{ padding: "10px 12px" }}>{eur(r.semana.facturacion)}</td>
                    <td style={{ padding: "10px 12px" }}>{eur(r.semana.extra)}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <ObjetivoCampo emp={e} campo="objetivoExtraSemanal" etiqueta="Objetivo semanal de ventas extra" tipo="extra" onGuardar={onGuardarObjetivo} />
                    </td>
                    <td style={{ padding: "10px 12px", fontWeight: 600, color: r.objetivo === 0 ? MUTED : r.cumpleSemana ? "#166534" : "#92400E" }}>{r.objetivo === 0 ? "—" : r.cumpleSemana ? `✓ ${pct(r.progreso)}` : pct(r.progreso)}</td>
                    <td data-ticket-semana={e.id} style={{ padding: "10px 12px", fontWeight: 600, color: r.objetivoTicket > 0 && r.semana.citas > 0 && r.semana.ticketMedio < r.objetivoTicket ? "#92400E" : "inherit" }}>{r.semana.citas > 0 ? eur(r.semana.ticketMedio) : "—"}</td>
                    <td style={{ padding: "10px 12px" }}><ObjetivoCampo emp={e} campo="objetivoTicketMedio" etiqueta="Objetivo de ticket medio" tipo="ticket" onGuardar={onGuardarObjetivo} /></td>
                    <td style={{ padding: "10px 12px" }}>{eur(r.mes.facturacion)}</td>
                    <td style={{ padding: "10px 12px" }}>{eur(r.mes.extra)}</td>
                    <td data-test-semana={e.id} style={{ padding: "10px 12px", fontWeight: 600, color: obligatorios.length === 0 ? MUTED : pend.length ? "#B45309" : "#166534" }}>{obligatorios.length === 0 ? "—" : pend.length ? `Pendiente (${pend.length})` : "✓ Aprobado"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== Administrador: gestionar clases ===== */}
      {esAdmin && tab === "clases" && (
        <div data-vista-gestion="1">
          {recomendadasPendientes.map((r) => (
            <div key={r.titulo} className="card" data-clase-recomendada="1" style={{ ...tarjeta, marginBottom: 14, borderColor: "var(--accent)", background: "rgba(var(--accent-rgb),0.07)" }}>
              <div style={{ fontWeight: 700, marginBottom: 2 }}>Clase recomendada: {r.titulo}</div>
              <div style={{ fontSize: 13.5, color: MUTED, marginBottom: 10 }}>Para quien no hace ventas cruzadas o tiene el ticket medio bajo. Está escrita para que la entienda cualquiera e incluye un test de {r.preguntas.length} preguntas. Es de tipo <strong>refuerzo</strong>: se abre sola a la empleada cuando la semana pasada no hizo ninguna venta cruzada (3 citas o más), su ticket medio fue menor que su objetivo o no llegó a su objetivo de ventas extra.</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" className="btn btn-gold" data-anadir-recomendada="1" onClick={() => onGuardarLeccion({ ...r })}>Añadir esta clase</button>
                <button type="button" className="btn btn-ghost" data-ver-recomendada="1" onClick={() => setAbierta({ ...r, id: "recomendada" })}>Ver el contenido</button>
              </div>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            <button type="button" className="btn btn-ghost" data-crear-con-ia="1" onClick={() => setGenerando({ hallazgos: calcularDiagnostico ? calcularDiagnostico() : [] })}><Sparkles size={15} aria-hidden="true" /> Crear clase con IA</button>
            <button type="button" className="btn btn-gold" data-nueva-leccion="1" onClick={() => setEditando("nueva")}><Plus size={15} aria-hidden="true" /> Nueva clase</button>
          </div>
          {listaClases({ gestionar: true })}
        </div>
      )}

      {generando && <GeneradorCurso ui={ui} hallazgos={generando.hallazgos} servicios={servicios} negocio={negocio} onCrear={onGuardarLeccion} onClose={() => setGenerando(null)} />}
      {abierta && <LeccionModal ui={ui} leccion={abierta} esAdmin={esAdmin} onClose={() => setAbierta(null)} onResponder={onResponder} />}
      {editando && <LeccionEditor ui={ui} leccion={editando === "nueva" ? null : editando} onClose={() => setEditando(null)} onGuardar={async (l) => { await onGuardarLeccion(l); setEditando(null); }} />}
    </div>
  );
}

// Objetivo semanal de ventas extra de una empleada: se guarda al salir del campo o al pulsar Intro
function ObjetivoCampo({ emp, onGuardar, campo = "objetivoExtraSemanal", etiqueta = "Objetivo semanal de ventas extra", tipo = "extra" }) {
  const [v, setV] = useState(String(emp[campo] || 0));
  const guardar = () => { const n = Math.max(0, Number(String(v).replace(",", ".")) || 0); if (n !== (emp[campo] || 0)) onGuardar(emp.id, n, tipo); setV(String(n)); };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <input className="input" style={{ width: 90, minHeight: 34, padding: "4px 8px" }} type="number" min="0" aria-label={`${etiqueta} de ${emp.nombre}`} value={v} onChange={(e) => setV(e.target.value)} onBlur={guardar} onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }} /> €
    </span>
  );
}
