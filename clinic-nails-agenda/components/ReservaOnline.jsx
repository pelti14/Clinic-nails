"use client";

// Página pública de reservas (/reservar), la que compartes con las clientas. No necesita código: no ve nada interno, solo el catálogo
// reservable y los huecos libres. Pasos: 1 servicios (arriba, «⭐ Recomendados») · 2 día y hora · 3 sus datos (nombre, teléfono y email) ·
// 4 reserva hecha. Si ya ha reservado antes, su móvil la reconoce (pase en el móvil y cookie del servidor): ve, CAMBIA y cancela sus citas;
// en otro móvil entra con su email (código de 6 cifras, una sola vez si marca «mantenerme conectada»).

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { aplicarMarcaEnPagina } from "../lib/negocio";
import { icsDeCita } from "../lib/reservaOnline";
import { api, copiarTexto, diaLargo, eur, guardarPase, hoyMadrid, legible, leerPase, partesDia, primerNombre, sumar } from "../lib/publicoCliente";
import ContactoCentro, { BotonesLlamar } from "./ContactoCentro";
import CambiarCita from "./CambiarCita";

const MUTED = "rgba(var(--ink-rgb),0.72)";
const REC = "__rec"; // la «categoría» de recomendados
const OTROS = "__otros";

export default function ReservaOnline() {
  const [cat, setCat] = useState(null);
  const [fallo, setFallo] = useState("");
  const [cargado, setCargado] = useState(false);
  const [paso, setPaso] = useState(1);
  const [sel, setSel] = useState([]);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("");
  const [empleadaId, setEmpleadaId] = useState("");
  const [hoy] = useState(hoyMadrid);
  const [fecha, setFecha] = useState("");
  const [slots, setSlots] = useState(null);
  const [inicio, setInicio] = useState(null);
  // La casilla de la política de privacidad viene marcada
  const [datos, setDatos] = useState({ nombre: "", telefono: "", email: "", consentimiento: true, recordar: true, web: "" });
  const [errores, setErrores] = useState({});
  const [aviso, setAviso] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [hecho, setHecho] = useState(null);
  const [pase, setPase] = useState(null); // lo que sabemos de ella (nombre, teléfono, email y, si lo hay, su pase)
  const [mis, setMis] = useState(null); // la respuesta de «mis citas»: si existe, está conectada
  const [cancelando, setCancelando] = useState("");
  const [cambiando, setCambiando] = useState("");
  const [msgMis, setMsgMis] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [entrar, setEntrar] = useState({ abierto: false, fase: 1, email: "", codigo: "", mensaje: "", error: "", cargando: false, recordar: true });

  const cargarMis = useCallback(async (p) => {
    const r = await api("mis-citas", { token: p?.token || "" });
    if (r.ok) {
      const u = { token: p?.token || "", nombre: r.data.cliente.nombre, telefono: r.data.cliente.telefono, email: r.data.cliente.email };
      setMis(r.data); setPase(u);
      setDatos((d) => ({ ...d, nombre: d.nombre || u.nombre, telefono: d.telefono || u.telefono, email: d.email || u.email }));
      setEntrar((e) => ({ ...e, abierto: false }));
      if (!p?.token && !leerPase()) guardarPase({ nombre: u.nombre, telefono: u.telefono, email: u.email });
    } else if (r.status === 401 && p?.token) {
      const sinPase = { nombre: p.nombre, telefono: p.telefono, email: p.email };
      guardarPase(sinPase); setPase(sinPase); setMis(null);
      setMsgMis("Tu acceso en este móvil ha caducado. Entra con tu email o reserva como siempre.");
    }
  }, []);

  // ---- carga inicial ----
  useEffect(() => {
    let vivo = true;
    (async () => {
      const r = await api("catalogo");
      if (!vivo) return;
      if (!r.ok) { setFallo(r.data.error || "No se ha podido cargar la página. Inténtalo de nuevo en un momento."); return; }
      setCat(r.data);
      setCategoria((r.data.recomendados || []).length ? REC : "");
      aplicarMarcaEnPagina(document, r.data.negocio);
      document.title = `Reservar cita — ${r.data.negocio}`;
      const p = leerPase();
      if (p) {
        setPase(p);
        setDatos((d) => ({ ...d, nombre: p.nombre || "", telefono: p.telefono || "", email: p.email || "" }));
      }
      if (r.data.activo) await cargarMis(p); // con el pase de la página o, si no hay, con la cookie del servidor
      if (vivo) setCargado(true);
    })();
    return () => { vivo = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const servicios = cat?.servicios || [];
  const recomendados = cat?.recomendados || [];
  const elegidos = useMemo(() => sel.map((id) => servicios.find((s) => s.id === id)).filter(Boolean), [sel, servicios]);
  const duracion = elegidos.reduce((m, s) => m + s.duracion, 0);
  const precio = elegidos.reduce((m, s) => m + s.precio, 0);
  const categorias = cat?.categorias || [];
  const hayOtros = servicios.some((s) => !s.categoria);
  const base = busca.trim() ? servicios : categoria === REC ? recomendados.map((id) => servicios.find((s) => s.id === id)).filter(Boolean) : categoria === OTROS ? servicios.filter((s) => !s.categoria) : categoria ? servicios.filter((s) => s.categoria === categoria) : servicios;
  const visibles = base.filter((s) => !busca.trim() || `${s.nombre} ${s.descripcion} ${s.categoria}`.toLowerCase().includes(busca.trim().toLowerCase()));
  const posibles = (cat?.empleadas || []).filter((e) => elegidos.length > 0 && elegidos.every((s) => e.servicios.includes(s.id)));
  const dias = useMemo(() => Array.from({ length: Math.min(14, (cat?.maxDias || 0) + 1) }, (_, i) => sumar(hoy, i)), [cat, hoy]);

  const pedirHuecos = useCallback(async (f, ids, emp) => {
    setSlots(null);
    const r = await api("huecos", { servicioIds: ids, fecha: f, empleadaId: emp || null });
    setSlots(r.ok ? r.data.slots : []);
    if (!r.ok) setAviso(r.data.error || "No se han podido cargar los huecos.");
  }, []);
  useEffect(() => { if (paso === 2 && fecha && sel.length) { setInicio(null); pedirHuecos(fecha, sel, empleadaId); } }, [paso, fecha, empleadaId]); // eslint-disable-line react-hooks/exhaustive-deps

  const alternar = (id) => { setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= 4 ? s : [...s, id])); setEmpleadaId(""); };
  const irAHuecos = () => { setPaso(2); setAviso(""); if (!fecha) setFecha(hoy); };

  async function reservar() {
    setEnviando(true); setErrores({}); setAviso("");
    const r = await api("reservar", { servicioIds: sel, empleadaId: empleadaId || null, fecha, inicio, nombre: datos.nombre, telefono: datos.telefono, email: datos.email, consentimiento: datos.consentimiento, recordar: datos.recordar, web: datos.web });
    setEnviando(false);
    if (r.ok) {
      if (r.data.token) { const p = { token: r.data.token, nombre: r.data.cliente.nombre, telefono: r.data.cliente.telefono, email: r.data.cliente.email }; guardarPase(p); setPase(p); }
      setHecho(r.data);
      setMis(null);
      setPaso(4);
      return;
    }
    if (r.data.errores) { setErrores(r.data.errores); setAviso("Revisa los datos marcados."); return; }
    setAviso(r.data.error || "No se ha podido reservar. Inténtalo de nuevo.");
    if (r.status === 409 && /hueco/i.test(r.data.error || "")) { setPaso(2); pedirHuecos(fecha, sel, empleadaId); }
  }

  function nuevaReserva() { setSel([]); setFecha(""); setInicio(null); setSlots(null); setEmpleadaId(""); setHecho(null); setPaso(1); setAviso(""); setErrores({}); setCopiado(false); setDatos((d) => ({ ...d, consentimiento: true })); if (pase?.token) cargarMis(pase); }
  function descargarIcs() {
    const ics = icsDeCita({ negocio: cat.negocio, titulo: `${hecho.cita.servicios.join(" + ")} — ${cat.negocio}`, fecha: hecho.cita.fecha, inicio: hecho.cita.inicio, duracion: hecho.cita.duracion, uid: hecho.cita.id });
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    const a = document.createElement("a"); a.href = url; a.download = "mi-cita.ics"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function copiarEnlace() { if (await copiarTexto(hecho.enlace)) { setCopiado(true); setTimeout(() => setCopiado(false), 2500); } }
  async function cancelar(id) {
    const r = await api("cancelar", { token: pase?.token || "", citaId: id });
    setCancelando("");
    if (r.ok) { setMsgMis("Cita cancelada. Si quieres, reserva otra."); cargarMis(pase); } else setMsgMis(r.data.error || "No se ha podido cancelar.");
  }
  async function olvidar() {
    await api("salir", { token: pase?.token || "" }); // borra el pase del servidor y la cookie
    guardarPase(null); setPase(null); setMis(null); setMsgMis(""); setCambiando(""); setCancelando(""); setDatos((d) => ({ ...d, nombre: "", telefono: "", email: "" }));
  }

  // ---- entrar con el email en otro móvil ----
  const setE = (c) => setEntrar((e) => ({ ...e, ...c }));
  async function pedirCodigo() {
    setE({ cargando: true, error: "" });
    const r = await api("codigo", { email: entrar.email });
    if (r.ok) setE({ cargando: false, fase: 2, mensaje: r.data.mensaje, codigo: "" }); else setE({ cargando: false, error: r.data.error || "No se ha podido enviar el código." });
  }
  async function verificarCodigo() {
    setE({ cargando: true, error: "" });
    const r = await api("verificar", { email: entrar.email, codigo: entrar.codigo, recordar: entrar.recordar });
    if (!r.ok) { setE({ cargando: false, error: r.data.error || "El código no es correcto." }); return; }
    const p = { token: r.data.token, nombre: r.data.cliente.nombre, telefono: r.data.cliente.telefono, email: r.data.cliente.email };
    guardarPase(entrar.recordar ? p : null); setPase(p);
    setDatos((d) => ({ ...d, nombre: p.nombre, telefono: p.telefono, email: p.email }));
    setEntrar({ abierto: false, fase: 1, email: "", codigo: "", mensaje: "", error: "", cargando: false, recordar: true });
    setMsgMis(""); cargarMis(p);
  }

  // ---- pantallas ----
  const caja = { maxWidth: 720, margin: "0 auto", padding: "20px 16px 60px" };
  if (fallo) return <main style={caja}><div role="alert" data-reserva-fallo="1" className="card" style={{ padding: 20 }}>{fallo}</div></main>;
  if (!cat) return <main style={caja}><p data-reserva-cargando="1" style={{ color: MUTED }}>Cargando…</p></main>;
  if (!cat.activo) return <main style={caja}><h1 style={{ fontSize: 26 }}>{cat.negocio}</h1><div data-reserva-apagada="1" className="card" style={{ padding: 20 }}>Ahora mismo no se puede reservar online. Llámanos y te buscamos hueco.<BotonesLlamar contacto={cat.contacto} /></div><ContactoCentro negocio={cat.negocio} contacto={cat.contacto} conBotones={false} /></main>;

  const etiqueta = (t) => <div className="field-label">{t}</div>;
  const err = (c) => (errores[c] ? <div role="alert" data-error={c} style={{ color: "var(--danger)", fontSize: 13, marginTop: 4 }}>{errores[c]}</div> : null);
  const pasos = ["Servicios", "Día y hora", "Tus datos"];
  const conectada = Boolean(mis);
  const chips = [...(recomendados.length ? [[REC, "⭐ Recomendados", "recomendados"]] : []), ...categorias.map((c) => [c, c, c]), ...(hayOtros && categorias.length ? [[OTROS, "Otros", "otros"]] : []), ["", "Todas", "todas"]];

  return (
    <main style={caja} data-reserva="1">
      <header style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 28, margin: "0 0 4px" }}>{cat.negocio}</h1>
        <p style={{ margin: 0, color: MUTED }}>{cat.bienvenida || "Reserva tu cita en un minuto."}</p>
      </header>

      {/* ===== Mis citas / acceso ===== */}
      {paso !== 4 && (
        <section aria-label="Mis citas" style={{ marginBottom: 18 }}>
          {pase && (
            <div className="card" data-saludo="1" style={{ padding: 14, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
              <div><strong>Hola, {primerNombre(pase.nombre)}</strong> <span style={{ color: MUTED, fontSize: 13 }}>· ya tenemos tus datos</span></div>
              <button type="button" className="btn btn-ghost" data-olvidar="1" style={{ minHeight: 34, padding: "4px 12px" }} onClick={olvidar}>No soy {primerNombre(pase.nombre)}</button>
            </div>
          )}
          {msgMis && <div role="status" data-msg-mis="1" className="card" style={{ padding: 12, marginTop: 8, fontSize: 14 }}>{msgMis}</div>}
          {mis && mis.citas.length > 0 && (
            <div data-mis-citas="1" className="card" style={{ padding: 14, marginTop: 8 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Tus próximas citas</div>
              {mis.citas.map((c) => (
                <div key={c.id} data-cita={c.id} style={{ padding: "8px 0", borderTop: "1px solid var(--line)" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ flex: "1 1 220px" }}>
                      <div style={{ fontWeight: 600 }}>{diaLargo(c.fecha)} · {c.hora}</div>
                      <div style={{ fontSize: 13, color: MUTED }}>{c.servicios.join(" + ")}{c.empleada ? ` · con ${c.empleada}` : ""}</div>
                    </div>
                    {cancelando === c.id ? (
                      <span style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13, flexWrap: "wrap" }}>¿Cancelar esta cita?
                        <button type="button" className="btn btn-gold" data-confirmar-cancelar={c.id} style={{ minHeight: 32, padding: "2px 12px" }} onClick={() => cancelar(c.id)}>Sí, cancelar</button>
                        <button type="button" className="btn btn-ghost" style={{ minHeight: 32, padding: "2px 12px" }} onClick={() => setCancelando("")}>No</button>
                      </span>
                    ) : c.puedeCancelar ? (
                      <span style={{ display: "flex", gap: 6 }}>
                        <button type="button" className="btn btn-ghost" data-cambiar-cita={c.id} style={{ minHeight: 34, padding: "4px 12px" }} onClick={() => { setCambiando(cambiando === c.id ? "" : c.id); setCancelando(""); }}>Cambiar</button>
                        <button type="button" className="btn btn-ghost" data-cancelar-cita={c.id} style={{ minHeight: 34, padding: "4px 12px" }} onClick={() => { setCancelando(c.id); setCambiando(""); }}>Cancelar</button>
                      </span>
                    ) : (
                      <span data-no-cancelable={c.id} style={{ fontSize: 12.5, color: MUTED, maxWidth: 240 }}>Para cambiar o cancelar con menos de {mis.cancelarHoras} h, llámanos.</span>
                    )}
                  </div>
                  {cambiando === c.id && (
                    <CambiarCita auth={{ token: pase?.token || "", citaId: c.id }} cita={{ ...c, duracion: 0 }} maxDias={cat.maxDias}
                      onCerrar={() => setCambiando("")}
                      onHecho={(nueva, sinCambios) => { setCambiando(""); setMsgMis(sinCambios ? "Tu cita se queda como estaba." : `Cita cambiada: ahora es el ${diaLargo(nueva.fecha)} a las ${nueva.hora}.`); cargarMis(pase); }} />
                  )}
                </div>
              ))}
            </div>
          )}
          {cargado && !conectada && !entrar.abierto && (
            <button type="button" className="btn btn-ghost" data-entrar-email="1" style={{ marginTop: 8, minHeight: 36 }} onClick={() => setE({ abierto: true, email: pase?.email || "" })}>Ya he reservado antes: entrar con mi email</button>
          )}
          {entrar.abierto && !conectada && (
            <div className="card" data-entrar="1" style={{ padding: 14, marginTop: 8 }}>
              {entrar.fase === 1 ? (
                <>
                  {etiqueta("Tu email")}
                  <input className="input" type="email" inputMode="email" autoComplete="email" aria-label="Tu email para entrar" value={entrar.email} onChange={(e) => setE({ email: e.target.value })} />
                  <p style={{ fontSize: 12.5, color: MUTED, margin: "6px 0 10px" }}>Te enviaremos un código de 6 cifras. Solo funciona si diste tu email al reservar.</p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" className="btn btn-gold" data-pedir-codigo="1" disabled={entrar.cargando || !entrar.email.trim()} onClick={pedirCodigo}>{entrar.cargando ? "Enviando…" : "Enviarme el código"}</button>
                    <button type="button" className="btn btn-ghost" onClick={() => setE({ abierto: false, error: "" })}>Cancelar</button>
                  </div>
                </>
              ) : (
                <>
                  <p data-msg-codigo="1" style={{ margin: "0 0 8px", fontSize: 14 }}>{entrar.mensaje}</p>
                  {etiqueta("Código de 6 cifras")}
                  <input className="input" inputMode="numeric" autoComplete="one-time-code" maxLength={6} aria-label="Código de 6 cifras" value={entrar.codigo} onChange={(e) => setE({ codigo: e.target.value.replace(/\D/g, "").slice(0, 6) })} />
                  <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13.5, margin: "10px 0", cursor: "pointer" }}>
                    <input type="checkbox" style={{ marginTop: 3 }} aria-label="Mantenerme conectada en este dispositivo" checked={entrar.recordar} onChange={(e) => setE({ recordar: e.target.checked })} />
                    <span>Mantenerme conectada en este dispositivo<span style={{ display: "block", fontSize: 12.5, color: MUTED }}>No te pediremos otro código la próxima vez. No lo marques si el móvil no es tuyo.</span></span>
                  </label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button type="button" className="btn btn-gold" data-verificar-codigo="1" disabled={entrar.cargando || entrar.codigo.length !== 6} onClick={verificarCodigo}>{entrar.cargando ? "Comprobando…" : "Entrar"}</button>
                    <button type="button" className="btn btn-ghost" onClick={() => setE({ fase: 1, error: "" })}>Cambiar el email</button>
                  </div>
                </>
              )}
              {entrar.error && <div role="alert" data-error-entrar="1" style={{ color: "var(--danger)", fontSize: 13, marginTop: 8 }}>{entrar.error}</div>}
            </div>
          )}
        </section>
      )}

      {paso !== 4 && (
        <nav aria-label="Pasos" style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {pasos.map((t, i) => <span key={t} data-paso={i + 1} aria-current={paso === i + 1 ? "step" : undefined} style={{ fontSize: 13, padding: "4px 12px", borderRadius: 999, fontWeight: 600, background: paso === i + 1 ? "var(--accent)" : "rgba(var(--ink-rgb),0.08)", color: paso === i + 1 ? "#fff" : MUTED }}>{i + 1}. {t}</span>)}
        </nav>
      )}

      {/* ===== 1 · Servicios ===== */}
      {paso === 1 && (
        <section aria-label="Elige tus servicios">
          <h2 style={{ fontSize: 20, margin: "0 0 10px" }}>¿Qué te gustaría hacerte?</h2>
          <input className="input" aria-label="Buscar servicio" placeholder="Buscar servicio…" value={busca} onChange={(e) => setBusca(e.target.value)} style={{ marginBottom: 10 }} />
          {chips.length > 1 && (
            <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 10, paddingBottom: 4 }}>
              {chips.map(([valor, texto, clave]) => <button key={clave} type="button" className={`btn ${categoria === valor && !busca.trim() ? "btn-gold" : "btn-ghost"}`} data-categoria={clave} aria-pressed={categoria === valor} style={{ minHeight: 34, padding: "4px 14px", whiteSpace: "nowrap" }} onClick={() => { setCategoria(valor); setBusca(""); }}>{texto}</button>)}
            </div>
          )}
          {categoria === REC && !busca.trim() && visibles.length > 0 && <p data-titulo-recomendados="1" style={{ margin: "0 0 8px", fontSize: 13.5, color: MUTED }}>⭐ Lo que más suelen reservar nuestras clientas.</p>}
          {visibles.length === 0 && <div data-sin-servicios="1" className="card" style={{ padding: 16, color: MUTED }}>{servicios.length === 0 ? "Todavía no hay servicios para reservar online. Llámanos." : "Ningún servicio coincide con tu búsqueda."}</div>}
          {visibles.map((s) => {
            const on = sel.includes(s.id);
            return (
              <button key={s.id} type="button" data-servicio={s.id} aria-pressed={on} onClick={() => alternar(s.id)} className="card" style={{ display: "block", width: "100%", textAlign: "left", padding: 14, marginBottom: 8, cursor: "pointer", border: on ? "2px solid var(--accent)" : "1px solid var(--line)", background: on ? "rgba(var(--accent-rgb),0.08)" : undefined }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}><strong>{on ? "✓ " : ""}{s.nombre}</strong><span style={{ fontWeight: 700, whiteSpace: "nowrap" }}>{eur(s.precio)}</span></div>
                {s.descripcion && <div style={{ fontSize: 13.5, color: MUTED, margin: "4px 0" }}>{s.descripcion}</div>}
                <div style={{ fontSize: 12.5, color: MUTED }}>{legible(s.duracion)}</div>
              </button>
            );
          })}
          <div data-resumen="1" style={{ position: "sticky", bottom: 0, background: "var(--bg, #fff)", padding: "12px 0", borderTop: "1px solid var(--line)", display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
            <span style={{ fontSize: 14 }}>{elegidos.length === 0 ? "Elige al menos un servicio (hasta 4)" : `${elegidos.length} ${elegidos.length === 1 ? "servicio" : "servicios"} · ${legible(duracion)} · ${eur(precio)}`}</span>
            <button type="button" className="btn btn-gold" data-continuar="1" disabled={elegidos.length === 0} onClick={irAHuecos}>Continuar</button>
          </div>
        </section>
      )}

      {/* ===== 2 · Día y hora ===== */}
      {paso === 2 && (
        <section aria-label="Elige día y hora">
          <h2 style={{ fontSize: 20, margin: "0 0 4px" }}>¿Cuándo te viene bien?</h2>
          <p style={{ margin: "0 0 12px", fontSize: 13.5, color: MUTED }}>{elegidos.map((s) => s.nombre).join(" + ")} · {legible(duracion)} · {eur(precio)}</p>
          {posibles.length > 0 ? (
            <div style={{ marginBottom: 12 }}>
              {etiqueta("¿Con quién?")}
              <select className="input" aria-label="Empleada" value={empleadaId} onChange={(e) => { setEmpleadaId(e.target.value); setAviso(""); }}>
                <option value="">Me da igual</option>
                {posibles.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>
          ) : <div role="alert" data-sin-empleada="1" className="card" style={{ padding: 12, marginBottom: 12 }}>Ninguna de nuestras profesionales hace todos esos servicios seguidos. Quita alguno o reserva por separado.</div>}
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 6, marginBottom: 8 }}>
            {dias.map((d) => { const p = partesDia(d); const on = fecha === d; return (
              <button key={d} type="button" data-fecha={d} aria-pressed={on} onClick={() => { setFecha(d); setAviso(""); }} className={`btn ${on ? "btn-gold" : "btn-ghost"}`} style={{ minWidth: 58, flexDirection: "column", padding: "6px 8px", lineHeight: 1.2 }}>
                <span style={{ fontSize: 11.5, textTransform: "capitalize" }}>{p.dow}</span><strong style={{ fontSize: 18 }}>{p.num}</strong><span style={{ fontSize: 11 }}>{p.mes}</span>
              </button>); })}
          </div>
          {(cat.maxDias || 0) > 13 && <label style={{ display: "block", fontSize: 13, marginBottom: 12 }}>Otro día: <input type="date" aria-label="Otro día" min={hoy} max={sumar(hoy, cat.maxDias)} value={fecha} onChange={(e) => { if (e.target.value) { setFecha(e.target.value); setAviso(""); } }} className="input" style={{ width: "auto", display: "inline-block", minHeight: 34, padding: "2px 8px" }} /></label>}
          <div style={{ fontWeight: 700, margin: "6px 0" }}>{fecha ? diaLargo(fecha) : ""}</div>
          {slots === null && <p data-cargando-huecos="1" style={{ color: MUTED }}>Buscando huecos…</p>}
          {slots && slots.length === 0 && <div data-sin-huecos="1" className="card" style={{ padding: 14, color: MUTED }}>No quedan huecos ese día. Prueba con otro día.</div>}
          {slots && slots.length > 0 && (
            <div role="group" aria-label="Horas disponibles" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(84px, 1fr))", gap: 8 }}>
              {slots.map((s) => <button key={s.inicio} type="button" data-hueco={s.inicio} aria-pressed={inicio === s.inicio} onClick={() => setInicio(s.inicio)} className={`btn ${inicio === s.inicio ? "btn-gold" : "btn-ghost"}`} style={{ minHeight: 40 }}>{s.hora}</button>)}
            </div>
          )}
          {aviso && <div role="alert" data-aviso="1" style={{ color: "var(--danger)", fontSize: 13.5, marginTop: 10 }}>{aviso}</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
            <button type="button" className="btn btn-ghost" data-atras="1" onClick={() => setPaso(1)}>Atrás</button>
            <button type="button" className="btn btn-gold" data-continuar="1" disabled={inicio === null} onClick={() => { setPaso(3); setAviso(""); }}>Continuar</button>
          </div>
        </section>
      )}

      {/* ===== 3 · Datos ===== */}
      {paso === 3 && (
        <section aria-label="Tus datos">
          <h2 style={{ fontSize: 20, margin: "0 0 4px" }}>Tus datos</h2>
          <p data-resumen-cita="1" style={{ margin: "0 0 14px", fontSize: 13.5, color: MUTED }}>{diaLargo(fecha)} · {Math.floor(inicio / 60)}:{String(inicio % 60).padStart(2, "0")} · {elegidos.map((s) => s.nombre).join(" + ")}</p>
          <div style={{ marginBottom: 12 }}>{etiqueta("Nombre *")}<input className="input" autoComplete="name" aria-label="Nombre" value={datos.nombre} onChange={(e) => setDatos({ ...datos, nombre: e.target.value })} />{err("nombre")}</div>
          <div style={{ marginBottom: 12 }}>{etiqueta("Teléfono *")}<input className="input" type="tel" inputMode="tel" autoComplete="tel" aria-label="Teléfono" value={datos.telefono} onChange={(e) => setDatos({ ...datos, telefono: e.target.value })} />{err("telefono")}</div>
          <div style={{ marginBottom: 12 }}>{etiqueta("Email *")}<input className="input" type="email" inputMode="email" autoComplete="email" aria-label="Email" value={datos.email} onChange={(e) => setDatos({ ...datos, email: e.target.value })} /><div style={{ fontSize: 12.5, color: MUTED, marginTop: 4 }}>Lo usamos para avisarte de tu cita y para que puedas cambiarla o cancelarla, también desde otro móvil.</div>{err("email")}</div>
          <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", height: 0, overflow: "hidden" }}><label>Web <input tabIndex={-1} autoComplete="off" name="web" aria-label="Web" value={datos.web} onChange={(e) => setDatos({ ...datos, web: e.target.value })} /></label></div>
          <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13.5, marginBottom: 6, cursor: "pointer" }}>
            <input type="checkbox" style={{ marginTop: 3 }} aria-label="Acepto el tratamiento de mis datos" checked={datos.consentimiento} onChange={(e) => setDatos({ ...datos, consentimiento: e.target.checked })} />
            <span>Acepto que {cat.negocio} trate mis datos para gestionar mi reserva{cat.privacidadUrl ? <>. <a href={cat.privacidadUrl} target="_blank" rel="noopener noreferrer" data-privacidad="1">Política de privacidad</a></> : "."}</span>
          </label>
          {err("consentimiento")}
          <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13.5, margin: "8px 0 12px", cursor: "pointer" }}>
            <input type="checkbox" style={{ marginTop: 3 }} aria-label="Recordarme en este dispositivo" checked={datos.recordar} onChange={(e) => setDatos({ ...datos, recordar: e.target.checked })} />
            <span>Recordarme en este dispositivo<span style={{ display: "block", fontSize: 12.5, color: MUTED }}>La próxima vez no tendrás que escribir nada ni pedir ningún código. No lo marques si el móvil no es tuyo.</span></span>
          </label>
          {aviso && <div role="alert" data-aviso="1" style={{ color: "var(--danger)", fontSize: 13.5, marginBottom: 10 }}>{aviso}</div>}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn btn-ghost" data-atras="1" onClick={() => setPaso(2)}>Atrás</button>
            <button type="button" className="btn btn-gold" data-confirmar-reserva="1" disabled={enviando} onClick={reservar}>{enviando ? "Reservando…" : "Confirmar reserva"}</button>
          </div>
        </section>
      )}

      {/* ===== 4 · Hecho ===== */}
      {paso === 4 && hecho && (
        <section aria-label="Reserva hecha" data-reserva-hecha="1">
          <div className="card" style={{ padding: 20, textAlign: "center" }}>
            <div style={{ fontSize: 40 }} aria-hidden="true">✓</div>
            <h2 style={{ fontSize: 22, margin: "4px 0 8px" }}>¡Reserva hecha!</h2>
            <p style={{ margin: "0 0 4px", fontWeight: 600 }}>{diaLargo(hecho.cita.fecha)} · {hecho.cita.hora}</p>
            <p style={{ margin: "0 0 4px" }}>{hecho.cita.servicios.join(" + ")}</p>
            <p style={{ margin: 0, color: MUTED, fontSize: 14 }}>Con {hecho.cita.empleada} · {legible(hecho.cita.duracion)} · {eur(hecho.cita.precio)}</p>
          </div>
          {hecho.enlace && (
            <div data-enlace-cita="1" className="card" style={{ padding: 14, marginTop: 12, fontSize: 13.5 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>¿Te surge algo? Cambia o cancela tu cita con este enlace</div>
              <a href={hecho.enlace} data-enlace-gestionar="1" style={{ wordBreak: "break-all" }}>{hecho.enlace}</a>
              <div style={{ marginTop: 8 }}><button type="button" className="btn btn-ghost" data-copiar-enlace-cita="1" style={{ minHeight: 34 }} onClick={copiarEnlace}>{copiado ? "✓ Copiado" : "Copiar el enlace"}</button></div>
            </div>
          )}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
            <button type="button" className="btn btn-gold" data-ics="1" onClick={descargarIcs}>Añadir al calendario</button>
            <button type="button" className="btn btn-ghost" data-otra-reserva="1" onClick={nuevaReserva}>{pase?.token ? "Ver mis citas / reservar otra" : "Reservar otra cita"}</button>
          </div>
          {!pase?.token && <p style={{ fontSize: 12.5, color: MUTED, marginTop: 12 }}>No has marcado «Recordarme», así que en este móvil no verás tus citas aquí. {hecho.enlace ? "Para cambiarla o cancelarla, usa el enlace de arriba o llámanos." : "Para cambiarla o cancelarla, llámanos."}</p>}
        </section>
      )}
      <ContactoCentro negocio={cat.negocio} contacto={cat.contacto} />
    </main>
  );
}
