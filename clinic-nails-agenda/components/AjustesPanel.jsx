"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Plug, Palette, Megaphone, Wallet, RefreshCw, Copy, X, Check, ShieldCheck, Store, Globe } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { PRESETS, TEMA_POR_DEFECTO, normalizarTema, esHex } from "../lib/theme";
import { estadoSeguridad, cerrarTodasLasSesiones } from "../lib/authCliente";
import { validarId, normalizarMarketing, EJEMPLOS, hayEtiquetas } from "../lib/etiquetas";
import { normalizarAjustesReservas } from "../lib/reservaOnline";
import { normalizarContacto, validarContacto, enlacesContacto, MAX_DIRECCION } from "../lib/contacto";
import { nombreNegocioDe, limpiarNombre, validarNombre, partesDelNombre, letraLogo, faviconUrl, tituloPagina, NEGOCIO_POR_DEFECTO, MAX_NOMBRE, ACENTO_POR_DEFECTO } from "../lib/negocio";

const MUTED = "rgba(var(--ink-rgb),0.74)";

function Campo({ etiqueta, ayuda, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="field-label">{etiqueta}</div>
      {children}
      {ayuda && <div style={{ fontSize: 12.5, color: MUTED, marginTop: 5 }}>{ayuda}</div>}
    </div>
  );
}

function Seccion({ titulo, ayuda, children }) {
  return (
    <section className="card" style={{ padding: 18, marginBottom: 16 }}>
      <h2 style={{ fontSize: 17, marginBottom: 2 }}>{titulo}</h2>
      {ayuda && <p style={{ color: MUTED, fontSize: 13.5, margin: "0 0 14px" }}>{ayuda}</p>}
      {!ayuda && <div style={{ height: 12 }} />}
      {children}
    </section>
  );
}

function Aviso({ tipo = "info", children }) {
  const colores = {
    info: ["rgba(var(--accent-rgb),0.10)", "rgba(var(--accent-rgb),0.4)"],
    error: ["rgba(180,35,24,0.10)", "rgba(180,35,24,0.45)"],
    ok: ["rgba(5,96,58,0.10)", "rgba(5,96,58,0.4)"],
  }[tipo];
  return (
    <div role={tipo === "error" ? "alert" : "status"} style={{ padding: "10px 12px", borderRadius: 12, fontSize: 13.5, background: colores[0], border: `1px solid ${colores[1]}`, marginBottom: 12 }}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// NEGOCIO: el nombre (menú, pantalla de entrada, pestaña del navegador, favicon y mensajes de WhatsApp)
// ---------------------------------------------------------------------------
function Negocio({ ajustes, onGuardarAjuste, showToast, acento }) {
  const guardado = nombreNegocioDe(ajustes);
  const [texto, setTexto] = useState(guardado);
  const [guardando, setGuardando] = useState(false);
  useEffect(() => { setTexto(guardado); }, [guardado]);
  const limpio = limpiarNombre(texto);
  const error = validarNombre(texto);
  const cambiado = limpio !== guardado;
  const vista = limpio || NEGOCIO_POR_DEFECTO;
  const marca = partesDelNombre(vista);
  const color = esHex(acento) ? acento : ACENTO_POR_DEFECTO;
  async function guardar() {
    if (error || !cambiado) return;
    setGuardando(true);
    try {
      await onGuardarAjuste("negocio", { ...(ajustes?.negocio || {}), nombre: limpio });
      showToast(`Nombre del negocio guardado: «${limpio}». Ya se ve en el menú y en la pestaña del navegador.`, "ok");
    } catch (err) {
      /* guardarAjuste ya avisa del error */
    } finally {
      setGuardando(false);
    }
  }
  return (
    <div data-negocio="1">
      <Seccion titulo="Nombre del negocio" ayuda="Es el nombre que sale en el menú, en la pantalla de entrada con el código, en la pestaña del navegador (con su icono) y en los mensajes de WhatsApp a las clientas.">
        <Campo etiqueta="Nombre" ayuda={`Hasta ${MAX_NOMBRE} letras. Por ejemplo: «Clinic Nails & Beauty» o «Studio Luna».`}>
          <input className="input" aria-label="Nombre del negocio" maxLength={MAX_NOMBRE} value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") guardar(); }} />
        </Campo>
        {error && texto !== "" && <div role="alert" data-error-negocio="1" style={{ color: "var(--danger)", fontSize: 13, marginBottom: 8 }}>{error}</div>}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="btn btn-gold" data-guardar-negocio="1" disabled={Boolean(error) || !cambiado || guardando} onClick={guardar}>{guardando ? "Guardando…" : "Guardar"}</button>
          <button type="button" className="btn btn-ghost" data-restablecer-negocio="1" disabled={limpio === NEGOCIO_POR_DEFECTO} onClick={() => setTexto(NEGOCIO_POR_DEFECTO)}>Volver a «{NEGOCIO_POR_DEFECTO}»</button>
        </div>
      </Seccion>
      <Seccion titulo="Así se verá" ayuda="Se actualiza mientras escribes; no cambia nada hasta que pulses Guardar.">
        <div data-vista-negocio="1" style={{ display: "flex", gap: 22, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 16, background: "var(--side-bg, #0A1226)", minWidth: 220 }}>
            <div aria-hidden="true" style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg, ${color}, ${color})`, color: "#fff", fontFamily: "'Cormorant Garamond', serif", fontSize: 23, fontWeight: 700 }}>{letraLogo(vista)}</div>
            <div style={{ minWidth: 0 }}>
              <div data-vista-titulo="1" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, lineHeight: 1.05, color: "#fff", overflowWrap: "anywhere" }}>{marca.titulo}</div>
              <div data-vista-subtitulo="1" style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", letterSpacing: 1 }}>{marca.subtitulo}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", border: "1px solid var(--line)", borderRadius: 12 }}>
            <img data-vista-favicon="1" src={faviconUrl(vista, color)} width={32} height={32} alt="Icono de la pestaña" style={{ borderRadius: 8 }} />
            <span data-vista-titulo-pestana="1" style={{ fontSize: 13.5 }}>{tituloPagina(vista)}</span>
          </div>
        </div>
        <p style={{ margin: "14px 0 0", fontSize: 12.5, color: MUTED }}>El icono de la pestaña (favicon) se hace solo con las iniciales del nombre y el color de la marca (el de «Colores»), así que cambia cuando cambias cualquiera de los dos. Este nombre no cambia el de GHL, el de tus anuncios ni el de tus plantillas: solo el de esta agenda y sus mensajes.</p>
      </Seccion>
      <ContactoNegocio ajustes={ajustes} onGuardarAjuste={onGuardarAjuste} showToast={showToast} />
    </div>
  );
}

// Teléfono, WhatsApp, dirección y mapa: salen en la página de reservas y en el enlace de cada cita
function ContactoNegocio({ ajustes, onGuardarAjuste, showToast }) {
  const guardado = normalizarContacto(ajustes?.negocio);
  const clave = JSON.stringify(guardado);
  const [f, setF] = useState(guardado);
  const [guardando, setGuardando] = useState(false);
  useEffect(() => { setF(guardado); }, [clave]); // eslint-disable-line react-hooks/exhaustive-deps
  const errores = validarContacto(f);
  const hayError = Object.keys(errores).length > 0;
  const cambiado = JSON.stringify(normalizarContacto(f)) !== clave;
  const vista = enlacesContacto(f);
  const campo = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const err = (k) => (errores[k] ? <div role="alert" data-error-contacto={k} style={{ color: "var(--danger)", fontSize: 13, marginTop: 4 }}>{errores[k]}</div> : null);
  async function guardar() {
    if (hayError || !cambiado) return;
    setGuardando(true);
    try {
      await onGuardarAjuste("negocio", { ...(ajustes?.negocio || {}), ...normalizarContacto(f) });
      showToast("Contacto y dirección guardados. Ya salen en la página de reservas y en el enlace de cada cita.", "ok");
    } catch (e) { /* guardarAjuste ya avisa */ } finally { setGuardando(false); }
  }
  return (
    <Seccion titulo="Contacto y dirección (para las clientas)" ayuda="Sale en la página de reservas y en el enlace de cada cita: botón de llamar, WhatsApp, la dirección con el mapa y «Cómo llegar» con Google Maps o Mapas de iPhone. Todo es opcional: lo que dejes vacío no se enseña.">
      <div data-contacto-negocio="1">
        <Campo etiqueta="Teléfono para llamar" ayuda="Por ejemplo: 986 123 456 o +34 600 123 456.">
          <input className="input" type="tel" inputMode="tel" aria-label="Teléfono para llamar" data-campo-telefono="1" value={f.telefono} onChange={campo("telefono")} />
          {err("telefono")}
        </Campo>
        <Campo etiqueta="WhatsApp (opcional)" ayuda="Si lo pones, sale un botón «WhatsApp» con el mensaje ya escrito. Puede ser el mismo número.">
          <input className="input" type="tel" inputMode="tel" aria-label="WhatsApp" data-campo-whatsapp="1" value={f.whatsapp} onChange={campo("whatsapp")} />
          {err("whatsapp")}
        </Campo>
        <Campo etiqueta="Dirección del centro" ayuda="Escríbela completa (calle, número, código postal y ciudad): con ella se dibuja el mapa y se calcula «Cómo llegar».">
          <input className="input" aria-label="Dirección del centro" data-campo-direccion="1" maxLength={MAX_DIRECCION} value={f.direccion} onChange={campo("direccion")} />
          {err("direccion")}
        </Campo>
        <Campo etiqueta="Enlace de Google Maps (opcional)" ayuda="En Google Maps busca tu centro → Compartir → Copiar enlace, y pégalo aquí. Sale como «Ver en Google Maps» (con tus reseñas y fotos).">
          <input className="input" inputMode="url" aria-label="Enlace de Google Maps" data-campo-maps="1" placeholder="https://maps.app.goo.gl/…" value={f.mapsUrl} onChange={campo("mapsUrl")} />
          {err("mapsUrl")}
        </Campo>
        {vista.mapaEmbed && (
          <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--line)", marginBottom: 12, maxWidth: 520 }}>
            <iframe title="Vista previa del mapa" src={vista.mapaEmbed} width="100%" height="200" style={{ border: 0, display: "block" }} loading="lazy" />
          </div>
        )}
        <button type="button" className="btn btn-gold" data-guardar-contacto="1" disabled={hayError || !cambiado || guardando} onClick={guardar}>{guardando ? "Guardando…" : "Guardar contacto y dirección"}</button>
      </div>
    </Seccion>
  );
}

// ---------------------------------------------------------------------------
// RESERVAS ONLINE: la página /reservar que compartes con las clientas
// ---------------------------------------------------------------------------
function ReservasOnline({ ajustes, onGuardarAjuste, showToast }) {
  const guardado = normalizarAjustesReservas(ajustes?.reservas);
  const [f, setF] = useState(guardado);
  const [guardando, setGuardando] = useState(false);
  const clave = JSON.stringify(guardado);
  useEffect(() => { setF(guardado); }, [clave]); // eslint-disable-line react-hooks/exhaustive-deps
  const cambiado = JSON.stringify(normalizarAjustesReservas(f)) !== clave;
  const enlace = typeof window !== "undefined" ? `${window.location.origin}/reservar` : "/reservar";
  const num = (campo) => (e) => setF({ ...f, [campo]: e.target.value });
  const [prueba, setPrueba] = useState(null);
  // Guarda el formulario entero (o el que se le pase). Al marcar o desmarcar «activadas» se guarda al momento: antes había que bajar al botón
  async function guardar(valores = f, aviso) {
    setGuardando(true);
    try {
      await onGuardarAjuste("reservas", normalizarAjustesReservas(valores));
      showToast(aviso || (valores.activas ? "Reservas online guardadas: ya están activas." : "Reservas online guardadas (desactivadas)."), "ok");
    } catch (err) { /* guardarAjuste ya avisa */ } finally { setGuardando(false); }
  }
  async function alternar(activas) {
    const nuevo = { ...f, activas };
    setF(nuevo);
    await guardar(nuevo, activas ? "Reservas online ACTIVADAS y guardadas: las clientas ya pueden reservar en el enlace." : "Reservas online desactivadas y guardadas.");
  }
  // Lo mismo que hace la página de las clientas: pedir el catálogo público y contar lo que ven
  async function probar() {
    setPrueba({ cargando: true });
    try {
      const r = await fetch(`/api/publico/catalogo?t=${Date.now()}`, { cache: "no-store" });
      const d = await r.json().catch(() => ({}));
      setPrueba({ ok: r.ok && d.ok !== false, activo: d.activo === true, servicios: (d.servicios || []).length, empleadas: (d.empleadas || []).length, privacidad: Boolean(d.privacidadUrl), error: d.error || "" });
    } catch (e) {
      setPrueba({ ok: false, error: "No se ha podido comprobar (¿sin conexión?)." });
    }
  }
  async function copiar() {
    try { await navigator.clipboard.writeText(enlace); showToast("Enlace copiado: ya puedes pegarlo en Instagram, WhatsApp o tu web.", "ok"); } catch (e) { showToast(`Copia este enlace: ${enlace}`, "ok"); }
  }
  return (
    <div data-reservas-online="1">
      <Seccion titulo="Reservas online" ayuda="Una página donde tus clientas eligen servicio, día y hora (solo ven los huecos libres de verdad), dejan su nombre y su teléfono —el email es opcional— y la cita entra sola en la agenda y en GHL.">
        <label style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 15, fontWeight: 600, marginBottom: 12, cursor: "pointer" }}>
          <input type="checkbox" aria-label="Activar las reservas online" checked={f.activas} disabled={guardando} onChange={(e) => alternar(e.target.checked)} /> Reservas online activadas <span style={{ fontWeight: 400, fontSize: 12.5, color: MUTED }}>(se guarda al momento)</span>
        </label>
        <div data-estado-reservas={guardado.activas ? "activas" : "apagadas"} role="status" style={{ padding: "8px 12px", borderRadius: 10, fontSize: 13.5, marginBottom: 10, background: guardado.activas ? "rgba(5,96,58,0.10)" : "rgba(180,83,9,0.12)", border: `1px solid ${guardado.activas ? "rgba(5,96,58,0.4)" : "rgba(180,83,9,0.45)"}` }}>
          Estado guardado: <strong>{guardado.activas ? "ACTIVADAS ✓ (las clientas ya pueden reservar)" : "DESACTIVADAS (las clientas ven que no se puede reservar)"}</strong>
        </div>
        {cambiado && (
          <div data-sin-guardar="1" role="alert" style={{ padding: "8px 12px", borderRadius: 10, fontSize: 13.5, marginBottom: 10, background: "rgba(180,35,24,0.10)", border: "1px solid rgba(180,35,24,0.45)", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span>Tienes cambios <strong>sin guardar</strong>: las clientas todavía no los ven.</span>
            <button type="button" className="btn btn-gold" data-guardar-arriba="1" disabled={guardando} style={{ minHeight: 32, padding: "2px 14px" }} onClick={() => guardar()}>{guardando ? "Guardando…" : "Guardar ahora"}</button>
          </div>
        )}
        <div style={{ marginBottom: 12 }}>
          <button type="button" className="btn btn-ghost" data-probar-reservas="1" disabled={prueba?.cargando} style={{ minHeight: 34 }} onClick={probar}>{prueba?.cargando ? "Comprobando…" : "Comprobar qué ve una clienta"}</button>
          {prueba && !prueba.cargando && (
            <div data-resultado-prueba="1" role="status" style={{ marginTop: 8, fontSize: 13.5, lineHeight: 1.6 }}>
              {!prueba.ok ? <div style={{ color: "var(--danger)" }}>La página pública no responde bien: {prueba.error || "error desconocido"}</div> : (
                <>
                  <div>{prueba.activo ? "✓ La página pública está ACTIVADA." : "✗ La página pública dice que NO se puede reservar."}</div>
                  {guardado.activas && !prueba.activo && <div data-diferencia="1" style={{ color: "var(--danger)" }}>Aquí está guardado como activado pero la página pública no lo ve: puede ser un problema de memoria (caché) del hosting o de la base de datos. Prueba de nuevo en un minuto y, si sigue igual, avísame.</div>}
                  {prueba.activo && <div>{prueba.servicios === 0 ? "✗ No hay ningún servicio para reservar: comprueba que haya servicios activos, con duración, con «Se puede reservar online» marcado y con empleadas asignadas." : `✓ ${prueba.servicios} ${prueba.servicios === 1 ? "servicio reservable" : "servicios reservables"}.`}</div>}
                  {prueba.activo && <div>{prueba.empleadas === 0 ? "✗ Ninguna empleada hace servicios reservables (revisa qué empleadas tiene cada servicio)." : `✓ ${prueba.empleadas} ${prueba.empleadas === 1 ? "profesional" : "profesionales"} disponibles.`}</div>}
                  {prueba.activo && <div>{prueba.privacidad ? "✓ Con enlace a la política de privacidad." : "! Sin enlace a la política de privacidad."}</div>}
                </>
              )}
            </div>
          )}
        </div>
        {f.activas && !f.privacidadUrl && <Aviso tipo="error">Antes de compartir la página, añade el enlace a tu política de privacidad: al pedir nombre y teléfono tienes que informar de cómo tratas sus datos (RGPD).</Aviso>}
        <Campo etiqueta="Enlace para compartir" ayuda="Pégalo en tu Instagram, en WhatsApp, en Google Business o en tu web. Aunque esté desactivado, el enlace existe (las clientas verán que las reservas no están disponibles).">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input className="input" readOnly aria-label="Enlace de reservas" data-enlace-reservas="1" value={enlace} onFocus={(e) => e.target.select()} style={{ flex: "1 1 260px" }} />
            <button type="button" className="btn btn-gold" data-copiar-enlace="1" onClick={copiar}>Copiar</button>
            <a className="btn btn-ghost" href={enlace} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>Abrir</a>
          </div>
        </Campo>
      </Seccion>
      <Seccion titulo="Reglas">
        <div className="grid-2">
          <Campo etiqueta="Antelación mínima (horas)" ayuda="No se puede reservar para dentro de menos de esto."><input className="input" type="number" min={0} max={168} aria-label="Antelación mínima en horas" value={f.antelacionHoras} onChange={num("antelacionHoras")} /></Campo>
          <Campo etiqueta="Hasta cuántos días vista" ayuda="Máximo de días hacia delante."><input className="input" type="number" min={1} max={365} aria-label="Días máximos por delante" value={f.maxDias} onChange={num("maxDias")} /></Campo>
          <Campo etiqueta="Un hueco cada…" ayuda="Cada cuántos minutos puede empezar una cita."><select className="input" aria-label="Intervalo de los huecos" value={f.intervalo} onChange={(e) => setF({ ...f, intervalo: Number(e.target.value) })}>{[10, 15, 20, 30, 60].map((m) => <option key={m} value={m}>{m} minutos</option>)}</select></Campo>
          <Campo etiqueta="Cancelar hasta (horas antes)" ayuda="Pasado ese margen, tienen que llamarte."><input className="input" type="number" min={0} max={168} aria-label="Horas de antelación para cancelar" value={f.cancelarHoras} onChange={num("cancelarHoras")} /></Campo>
          <Campo etiqueta="Citas próximas por clienta" ayuda="Para evitar reservas masivas o de broma."><input className="input" type="number" min={1} max={20} aria-label="Máximo de citas próximas por clienta" value={f.maxCitasFuturas} onChange={num("maxCitasFuturas")} /></Campo>
        </div>
      </Seccion>
      <Seccion titulo="Servicios recomendados" ayuda="El apartado «⭐ Recomendados» es lo primero que ven las clientas al abrir la página de reservas.">
        <div className="grid-2">
          <Campo etiqueta="Cómo se eligen" ayuda="«Los más reservados» se actualiza solo con tus citas de los últimos 90 días. «Los que yo marque» usa la casilla ⭐ de cada servicio (Catálogo → Servicios) y su orden."><select className="input" aria-label="Cómo elegir los servicios recomendados" value={f.recomendados} onChange={(e) => setF({ ...f, recomendados: e.target.value })}><option value="auto">Los más reservados (automático)</option><option value="manual">Los que yo marque</option><option value="ninguno">Sin apartado de recomendados</option></select></Campo>
          {f.recomendados === "auto" && <Campo etiqueta="Cuántos" ayuda="Entre 1 y 10."><input className="input" type="number" min={1} max={10} aria-label="Máximo de servicios recomendados" value={f.recomendadosMax} onChange={num("recomendadosMax")} /></Campo>}
        </div>
        <p style={{ margin: "6px 0 0", fontSize: 12.5, color: MUTED }}>Las categorías salen en el mismo orden que en el catálogo (Catálogo → Servicios, con las flechas ↑↓ de cada categoría).</p>
      </Seccion>
      <Seccion titulo="Textos">
        <Campo etiqueta="Mensaje de bienvenida (opcional)" ayuda="Sale arriba en la página. Por ejemplo: «Reserva tu cita en un minuto. Si necesitas algo especial, llámanos»."><textarea className="input" rows={3} maxLength={300} aria-label="Mensaje de bienvenida" value={f.bienvenida} onChange={(e) => setF({ ...f, bienvenida: e.target.value })} /></Campo>
        <Campo etiqueta="Enlace a tu política de privacidad" ayuda="Empieza por https://. Sale junto a la casilla de consentimiento."><input className="input" aria-label="Enlace a la política de privacidad" placeholder="https://tuweb.com/privacidad" value={f.privacidadUrl} onChange={(e) => setF({ ...f, privacidadUrl: e.target.value })} /></Campo>
        <Campo etiqueta="Dirección pública de la web (opcional)" ayuda="Para los enlaces de «cambiar o cancelar mi cita» que mandas desde GHL. Déjala en blanco para usar la de esta web; si usas un subdominio, ponla aquí (por ejemplo https://reservas.tudominio.com)."><input className="input" aria-label="Dirección pública de la web" placeholder="https://reservas.tudominio.com" value={f.dominioPublico} onChange={(e) => setF({ ...f, dominioPublico: e.target.value })} /></Campo>
      </Seccion>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}><button type="button" className="btn btn-gold" data-guardar-reservas="1" disabled={!cambiado || guardando} onClick={() => guardar()}>{guardando ? "Guardando…" : "Guardar"}</button></div>
      <Seccion titulo="Cómo funciona" ayuda="Para que no tengas sorpresas.">
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.6 }}>
          <li><strong>Qué se puede reservar:</strong> todos los servicios activos, salvo los que desmarques con «Se puede reservar online» en su ficha (Servicios).</li>
          <li><strong>Huecos reales:</strong> se calculan con el horario de cada empleada, sus días libres y ausencias, tus horarios no disponibles y las citas que ya hay (también las que entran por GHL). Con «me da igual», se reparte a la que menos citas tenga ese día.</li>
          <li><strong>Datos:</strong> nombre, teléfono y email obligatorios (el email sirve para avisarla y para que pueda gestionar su cita). Si el teléfono ya existe, no se duplica la clienta. La casilla de privacidad viene marcada.</li>
          <li><strong>Cambiar o cancelar:</strong> en «Tus próximas citas» la clienta puede cambiar el día, la hora o la profesional (con el mismo margen que para cancelar). <strong>Cada cita tiene un enlace propio</strong> para hacerlo sin entrar con nada: en la cita (tres puntitos) tienes «Copiar enlace para cambiar o cancelar», y la app lo deja solo en el campo de contacto de GHL <strong>«Enlace cita»</strong> (créalo en GHL → Ajustes → Campos personalizados, tipo texto) para que lo uses en tus automatizaciones con <code>{"{{contact.enlace_cita}}"}</code>.</li>
          <li><strong>Acceso de las clientas:</strong> tras reservar, su móvil las recuerda (pueden ver y cancelar sus citas). En otro móvil entran con su <strong>email</strong>: reciben un código de 6 cifras por email desde GHL. <strong>Eso solo funciona si tu GHL tiene el email configurado y tu clave tiene el permiso «conversations/message.write»</strong>; si no, la clienta puede reservar igualmente como nueva (se reconoce por su teléfono). Las clientas sin email no pueden usar el código.</li>
          <li><strong>Avisos:</strong> cada reserva entra en la agenda como «🌐 Reserva online», queda en Actividad y se envía a GHL para que salten tus automatizaciones (SMS de confirmación, etc.).</li>
          <li><strong>Protección:</strong> límite de intentos por IP y por teléfono, campo trampa contra bots y comprobación del hueco en el momento de reservar (nunca dos citas a la vez).</li>
        </ul>
      </Seccion>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CONEXIONES (API)
// ---------------------------------------------------------------------------

function Conexiones({ ajustes, onGuardarAjuste, currentUser, showToast, onImportado, calendarios, botIA, horariosGHL }) {
  const cab = { "Content-Type": "application/json" };
  const [secretos, setSecretos] = useState({ cargado: false });
  const [claveNueva, setClaveNueva] = useState("");
  const [guardandoClave, setGuardandoClave] = useState(false);
  const [form, setForm] = useState({ locationId: ajustes.ghl?.locationId || "", calendarId: ajustes.ghl?.calendarId || "" });
  const [prueba, setPrueba] = useState(null);
  const [probando, setProbando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [supa, setSupa] = useState({ estado: "probando" });

  const imp = { activa: ajustes.importacion?.activa !== false, segundos: ajustes.importacion?.segundos || 60, borrarCanceladas: ajustes.importacion?.borrarCanceladas !== false };
  const token = ajustes.webhook?.token || "";
  const urlWebhook = typeof window !== "undefined" && token ? `${window.location.origin}/api/ghl/webhook?token=${token}` : "";

  const cargarSecretos = useCallback(async () => {
    try {
      const r = await fetch("/api/ajustes/secretos", { headers: cab, cache: "no-store" });
      const d = await r.json();
      setSecretos(d.ok ? { ...d, cargado: true } : { error: d.error, cargado: true });
    } catch (e) {
      setSecretos({ error: e.message, cargado: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.codigo]);

  useEffect(() => {
    cargarSecretos();
    (async () => {
      try {
        const { error } = await supabase.from("ajustes").select("clave").limit(1);
        setSupa(error ? { estado: "error", detalle: error.message } : { estado: "ok" });
      } catch (e) {
        setSupa({ estado: "error", detalle: e.message });
      }
    })();
  }, [cargarSecretos]);

  async function guardarClave(valor) {
    setGuardandoClave(true);
    try {
      const r = await fetch("/api/ajustes/secretos", { method: "POST", headers: cab, body: JSON.stringify({ clave: "ghl_api_key", valor }) });
      const d = await r.json();
      if (!d.ok) showToast(d.error || "No se pudo guardar la clave.", "error");
      else {
        showToast(d.borrada ? "Clave eliminada de la app." : "Clave de GHL guardada.");
        setClaveNueva("");
        await cargarSecretos();
      }
    } catch (e) {
      showToast(`No se pudo guardar la clave (${e.message})`, "error");
    } finally {
      setGuardandoClave(false);
    }
  }

  async function guardarGhl() {
    await onGuardarAjuste("ghl", { locationId: form.locationId.trim(), calendarId: form.calendarId.trim() });
    showToast("Datos de GHL guardados.");
  }

  async function probar() {
    setProbando(true);
    try {
      const r = await fetch("/api/ghl/diagnostico", { cache: "no-store" });
      setPrueba(await r.json());
    } catch (e) {
      setPrueba({ ok: false, error: e.message });
    } finally {
      setProbando(false);
    }
  }

  async function importarAhora() {
    setImportando(true);
    setResultado(null);
    try {
      const r = await fetch("/api/ghl/importar", { method: "POST", headers: cab });
      const d = await r.json();
      setResultado(d);
      if (d.importadas?.length && onImportado) onImportado(d);
    } catch (e) {
      setResultado({ ok: false, error: e.message });
    } finally {
      setImportando(false);
    }
  }

  async function generarToken() {
    const b = new Uint8Array(18);
    window.crypto.getRandomValues(b);
    await onGuardarAjuste("webhook", { token: Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("") });
    showToast("Enlace de aviso creado.");
  }

  const k = secretos.ghlApiKey;
  const origen = k?.origenActivo === "app" ? "la que has guardado aquí" : k?.origenActivo === "entorno" ? "la variable GHL_API_KEY del hosting" : "ninguna todavía";
  const urlSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  let hostSupabase = "";
  try { hostSupabase = new URL(urlSupabase).hostname; } catch (e) { hostSupabase = ""; }

  return (
    <div>
      <Seccion titulo="GoHighLevel" ayuda="La clave y los identificadores con los que la agenda habla con GHL. Aquí los cambias sin tocar nada del hosting.">
        <Campo
          etiqueta="Clave de integración (Private Integration Token)"
          ayuda={
            secretos.cargado && !secretos.error
              ? `Ahora se usa: ${origen}.${k?.guardada ? ` Guardada aquí: ····${k.ultimos4}.` : ""} Por seguridad la clave guardada nunca se vuelve a mostrar entera.`
              : "Empieza por «pit-»."
          }
        >
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              className="input" type="password" autoComplete="off" style={{ flex: "1 1 260px" }}
              aria-label="Clave de GoHighLevel"
              placeholder={k?.guardada ? `····${k.ultimos4} (escribe una nueva para cambiarla)` : "pit-…"}
              value={claveNueva} onChange={(e) => setClaveNueva(e.target.value)}
              disabled={secretos.cargado && !secretos.error && !secretos.serviceRole}
            />
            <button type="button" className="btn btn-gold" disabled={!claveNueva.trim() || guardandoClave || (secretos.cargado && !secretos.serviceRole)} onClick={() => guardarClave(claveNueva)}>
              Guardar clave
            </button>
            {k?.guardada && (
              <button type="button" className="btn btn-ghost" disabled={guardandoClave} onClick={() => guardarClave("")}>Quitar la guardada</button>
            )}
          </div>
        </Campo>
        {secretos.cargado && !secretos.error && !secretos.serviceRole && (
          <Aviso tipo="info">
            <strong>Para guardar la clave desde aquí hace falta un paso único.</strong> Añade en tu hosting la variable{" "}
            <code>SUPABASE_SERVICE_ROLE_KEY</code> (Supabase → Project Settings → API → «service_role») y pega de nuevo <code>supabase/schema.sql</code>.
            Esa clave solo la usa el servidor y nunca llega al navegador. Mientras tanto la app sigue usando la variable <code>GHL_API_KEY</code> del hosting.
          </Aviso>
        )}
        {secretos.error && <Aviso tipo="error">No se pudo consultar el estado de la clave: {secretos.error}</Aviso>}

        <div className="grid-2">
          <Campo etiqueta="Location ID" ayuda="GHL → Settings → Business Profile.">
            <input className="input" value={form.locationId} onChange={(e) => setForm({ ...form, locationId: e.target.value })} aria-label="Location ID" />
          </Campo>
          <Campo etiqueta="Calendario general (respaldo)" ayuda="Se usa si una empleada no tiene el suyo. Opcional.">
            <input className="input" value={form.calendarId} onChange={(e) => setForm({ ...form, calendarId: e.target.value })} aria-label="ID del calendario general" />
          </Campo>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="btn btn-gold" onClick={guardarGhl}>Guardar Location ID y calendario</button>
          <button type="button" className="btn btn-ghost" onClick={probar} disabled={probando}>{probando ? "Probando…" : "Probar la conexión"}</button>
        </div>
        {prueba && (
          <div style={{ marginTop: 12 }}>
            {prueba.ok ? (
              <Aviso tipo="ok">✓ Conectado con GHL. Se han encontrado {prueba.calendarios?.length || 0} calendarios.</Aviso>
            ) : (
              <Aviso tipo="error">No se pudo conectar: {prueba.error || prueba.motivo}</Aviso>
            )}
          </div>
        )}
      </Seccion>

      {calendarios}
      {horariosGHL}
      {botIA}

      <Seccion titulo="Actualización automática de la agenda" ayuda="Cada cuánto tiempo la agenda vuelve a pedir los datos al servidor. Así se ven solas las citas que entran desde GHL o desde otro dispositivo.">
        <Campo etiqueta="Actualizar la agenda cada">
          <select
            className="input" style={{ maxWidth: 220 }} aria-label="Frecuencia de actualización de la agenda"
            value={ajustes.actualizacion?.segundos || 20}
            onChange={(e) => onGuardarAjuste("actualizacion", { segundos: Number(e.target.value) })}
          >
            <option value={10}>10 segundos</option>
            <option value={20}>20 segundos</option>
            <option value={30}>30 segundos</option>
            <option value={60}>1 minuto</option>
            <option value={120}>2 minutos</option>
          </select>
        </Campo>
        <div style={{ fontSize: 13, color: MUTED }}>Se pausa sola cuando la pestaña no está a la vista y se actualiza al instante al volver a ella.</div>
      </Seccion>

      <Seccion titulo="Citas que se crean en GHL" ayuda="Trae a la agenda las reservas que entran por GHL (calendario público, embudos, bot de IA…) y refleja aquí lo que se mueve o se cancela allí.">
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, marginBottom: 10 }}>
          <input type="checkbox" checked={imp.activa} onChange={(e) => onGuardarAjuste("importacion", { ...imp, activa: e.target.checked })} />
          Traerlas automáticamente mientras la agenda está abierta
        </label>
        {imp.activa && (
          <Campo etiqueta="Cada cuánto comprobar">
            <select className="input" style={{ maxWidth: 220 }} value={imp.segundos} aria-label="Frecuencia de comprobación" onChange={(e) => onGuardarAjuste("importacion", { ...imp, segundos: Number(e.target.value) })}>
              <option value={30}>30 segundos</option>
              <option value={60}>1 minuto</option>
              <option value={120}>2 minutos</option>
              <option value={300}>5 minutos</option>
            </select>
          </Campo>
        )}
        <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 14, marginBottom: 12 }}>
          <input type="checkbox" data-borrar-canceladas="1" checked={imp.borrarCanceladas} style={{ marginTop: 3 }} onChange={(e) => onGuardarAjuste("importacion", { ...imp, borrarCanceladas: e.target.checked })} />
          <span>Quitar de la agenda las citas que se cancelan en GHL (por ejemplo, el bot de IA)<br /><span style={{ fontSize: 12.5, color: MUTED }}>En vez de quedarse como «cancelada», se borra de la agenda y, a los 3 segundos, también de GHL (su automatización de «cita cancelada» ya se ha lanzado). Queda apuntado en Actividad. Las cobradas y las que usan un bono se quedan como canceladas.</span></span>
        </label>
        <button type="button" className="btn btn-ghost" onClick={importarAhora} disabled={importando}>
          <RefreshCw size={14} aria-hidden="true" /> {importando ? "Importando…" : "Importar ahora"}
        </button>

        {resultado && (
          <div style={{ marginTop: 14, fontSize: 13.5 }} role="status">
            {resultado.error || resultado.ok === false ? (
              <Aviso tipo="error">{resultado.error || resultado.motivo || (resultado.errores || []).join(" · ")}</Aviso>
            ) : (
              <Aviso tipo={resultado.importadas?.length ? "ok" : "info"}>
                <strong>{resultado.importadas?.length || 0} citas nuevas importadas.</strong>{" "}
                {resultado.yaEnLaApp || 0} ya estaban en la agenda
                {resultado.vinculadas ? ` · ${resultado.vinculadas} se han enlazado con una cita existente` : ""}
                {resultado.canceladas ? ` · ${resultado.canceladas} canceladas en GHL (no se importan)` : ""}.
              </Aviso>
            )}
            {(resultado.importadas || []).map((c) => (
              <div key={c.id} style={{ padding: "6px 0", borderBottom: "1px solid var(--line)" }}>
                📥 <strong>{c.clienta}</strong> · {c.fecha.split("-").reverse().join("/")} {c.hora} · {c.servicio} · {c.empleada}
                {!c.servicioPorTitulo && <span style={{ color: "var(--danger)" }}> · revisa el servicio</span>}
              </div>
            ))}
            {(resultado.omitidas || []).length > 0 && (
              <div style={{ marginTop: 10 }}>
                <strong>No se han importado ({resultado.omitidas.length}):</strong>
                {resultado.omitidas.map((o) => (
                  <div key={o.id} style={{ color: MUTED, padding: "4px 0" }}>• {o.detalle} — {o.motivo}</div>
                ))}
              </div>
            )}
            {(resultado.errores || []).length > 0 && resultado.ok !== false && (
              <div style={{ marginTop: 10, color: "var(--danger)" }}>
                {resultado.errores.map((e, i) => <div key={i}>• {e}</div>)}
              </div>
            )}
          </div>
        )}

        <div style={{ borderTop: "1px solid var(--line)", marginTop: 18, paddingTop: 14 }}>
          <h3 style={{ fontSize: 15, marginBottom: 4 }}>Aviso instantáneo (opcional)</h3>
          <p style={{ color: MUTED, fontSize: 13.5, margin: "0 0 10px" }}>
            Con la comprobación automática ya llegan las citas en menos de un minuto. Si las quieres al instante, en GHL crea un <em>Workflow</em> con el disparador
            «Customer Booked Appointment» y la acción «Webhook» (método POST) a esta dirección:
          </p>
          {urlWebhook ? (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input className="input" readOnly style={{ flex: "1 1 320px", fontFamily: "monospace", fontSize: 13 }} value={urlWebhook} aria-label="Dirección del aviso" onFocus={(e) => e.target.select()} />
              <button type="button" className="btn btn-ghost" onClick={() => { navigator.clipboard?.writeText(urlWebhook); showToast("Dirección copiada."); }}>
                <Copy size={14} aria-hidden="true" /> Copiar
              </button>
              <button type="button" className="btn btn-ghost" onClick={generarToken}>Generar otra</button>
            </div>
          ) : (
            <button type="button" className="btn btn-ghost" onClick={generarToken}>Crear la dirección del aviso</button>
          )}
        </div>
      </Seccion>

      <Seccion titulo="Base de datos (Supabase) y variables del hosting">
        {supa.estado === "ok" && <Aviso tipo="ok">✓ Conectada a la base de datos{hostSupabase ? ` (${hostSupabase})` : ""}.</Aviso>}
        {supa.estado === "error" && <Aviso tipo="error">No se puede leer la base de datos: {supa.detalle}. Revisa que hayas pegado <code>supabase/schema.sql</code>.</Aviso>}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
            <thead>
              <tr>
                {["Variable", "Estado", "Dónde se cambia"].map((t) => (
                  <th key={t} style={{ textAlign: "left", padding: "8px 10px", fontSize: 12.5, color: MUTED, borderBottom: "1px solid var(--line)" }}>{t}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["NEXT_PUBLIC_SUPABASE_URL", urlSupabase ? "✓ configurada" : "✗ falta", "En el hosting"],
                ["NEXT_PUBLIC_SUPABASE_ANON_KEY", supa.estado === "ok" ? "✓ configurada" : "comprobar", "En el hosting"],
                ["SUPABASE_SERVICE_ROLE_KEY", secretos.serviceRole ? "✓ configurada" : "— opcional", "En el hosting (permite guardar la clave de GHL aquí)"],
                ["GHL_API_KEY", k?.guardada ? "✓ guardada en la app" : k?.enEntorno ? "✓ en el hosting" : "— sin configurar", "Aquí (campo de arriba)"],
                ["GHL_LOCATION_ID", form.locationId ? "✓ guardado en la app" : "— sin configurar", "Aquí (campo de arriba)"],
                ["GHL_CALENDAR_ID", form.calendarId ? "✓ guardado en la app" : "— sin configurar", "Aquí (campo de arriba)"],
              ].map(([v, e, d]) => (
                <tr key={v} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "8px 10px", fontFamily: "monospace", fontSize: 12.5 }}>{v}</td>
                  <td style={{ padding: "8px 10px", fontWeight: 500 }}>{e}</td>
                  <td style={{ padding: "8px 10px", color: MUTED }}>{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ color: MUTED, fontSize: 13, margin: "12px 0 0" }}>
          Las dos variables de Supabase se quedan en el hosting porque la app las necesita <em>para arrancar y poder leer estos ajustes</em>: no pueden guardarse dentro de la
          propia base de datos. Rara vez cambian. Las tres de GHL, en cambio, una vez rellenadas aquí ya no hace falta tenerlas en el hosting.
        </p>
      </Seccion>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MARKETING
// ---------------------------------------------------------------------------

const TIPOS_ETIQUETA = [
  { tipo: "metaPixel", campo: "metaPixels", titulo: "Píxeles de Meta (Facebook / Instagram)", ayuda: "Puedes añadir todos los que quieras. Es el número de «ID del píxel» de tu Administrador de eventos." },
  { tipo: "googleAds", campo: "googleAds", titulo: "Etiqueta de Google Ads", ayuda: "Empieza por AW-." },
  { tipo: "ga4", campo: "ga4", titulo: "Google Analytics 4", ayuda: "Empieza por G-." },
  { tipo: "gtm", campo: "gtm", titulo: "Google Tag Manager", ayuda: "Empieza por GTM-." },
];

function ListaIds({ def, valores, onChange }) {
  const [texto, setTexto] = useState("");
  const [error, setError] = useState("");
  function añadir() {
    const v = texto.trim();
    if (!v) return;
    if (!validarId(def.tipo, v)) {
      setError(`No parece un identificador válido. Ejemplo: ${EJEMPLOS[def.tipo]}`);
      return;
    }
    const norm = def.tipo === "metaPixel" ? v : v.toUpperCase();
    if (!valores.includes(norm)) onChange([...valores, norm]);
    setTexto("");
    setError("");
  }
  return (
    <Campo etiqueta={def.titulo} ayuda={def.ayuda}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          className="input" style={{ flex: "1 1 240px" }} aria-label={def.titulo} placeholder={EJEMPLOS[def.tipo]}
          value={texto} onChange={(e) => { setTexto(e.target.value); setError(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); añadir(); } }}
        />
        <button type="button" className="btn btn-ghost" onClick={añadir}>Añadir</button>
      </div>
      {error && <div role="alert" style={{ color: "var(--danger)", fontSize: 13, marginTop: 6 }}>{error}</div>}
      {valores.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
          {valores.map((v) => (
            <span key={v} className="chip on" style={{ paddingRight: 8 }}>
              {v}
              <button type="button" aria-label={`Quitar ${v}`} onClick={() => onChange(valores.filter((x) => x !== v))} style={{ background: "transparent", border: "none", display: "flex", padding: 2, color: "inherit" }}>
                <X size={14} aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      )}
    </Campo>
  );
}

function Marketing({ ajustes, onGuardarAjuste, showToast }) {
  const [m, setM] = useState(() => normalizarMarketing(ajustes.marketing));
  const [guardando, setGuardando] = useState(false);
  const cambiado = JSON.stringify(m) !== JSON.stringify(normalizarMarketing(ajustes.marketing));

  async function guardar() {
    setGuardando(true);
    try {
      await onGuardarAjuste("marketing", m);
      showToast("Etiquetas guardadas. Se cargan al abrir la app.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div>
      <Seccion titulo="Etiquetas de marketing" ayuda="Pega los identificadores y se cargan solos en toda la app. No hace falta tocar código.">
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, marginBottom: 14 }}>
          <input type="checkbox" checked={m.activo} onChange={(e) => setM({ ...m, activo: e.target.checked })} />
          Etiquetas activadas
        </label>
        {TIPOS_ETIQUETA.map((def) => (
          <ListaIds key={def.tipo} def={def} valores={m[def.campo]} onChange={(v) => setM({ ...m, [def.campo]: v })} />
        ))}
        <button type="button" className="btn btn-gold" onClick={guardar} disabled={!cambiado || guardando}>Guardar etiquetas</button>
        {!cambiado && hayEtiquetas(ajustes.marketing) && <span style={{ marginLeft: 10, color: "var(--success)", fontSize: 13.5 }}><Check size={14} style={{ verticalAlign: -2 }} aria-hidden="true" /> Guardadas</span>}
      </Seccion>

      <Aviso tipo="info">
        <strong>Privacidad:</strong> esta es una agenda interna con datos de clientes. Por eso el píxel de Meta se carga con la lectura automática de formularios
        <em> desactivada</em> y Google Analytics sin señales de Google ni personalización de anuncios. Aun así, ten en cuenta que estas etiquetas solo medirán la
        actividad de quienes abran esta app. Si publicas páginas para clientes, necesitarás además un aviso de cookies. Al quitar una etiqueta, deja de cargarse la
        próxima vez que se abra la app.
      </Aviso>
    </div>
  );
}

// ---------------------------------------------------------------------------
// APARIENCIA
// ---------------------------------------------------------------------------

function Apariencia({ ajustes, onGuardarAjuste, showToast, onPreviewTema }) {
  const guardado = normalizarTema(ajustes.tema);
  const [b, setB] = useState(guardado);
  const [guardando, setGuardando] = useState(false);
  const bNorm = normalizarTema(b);
  // Se comparan versiones normalizadas: el orden interno de los datos no cuenta como "cambio"
  const cambiado = JSON.stringify(bNorm) !== JSON.stringify(guardado);

  useEffect(() => {
    // Vista previa solo mientras haya cambios sin guardar; al guardar, la app pasa a usar (y recordar) los colores guardados
    onPreviewTema(cambiado ? bNorm : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [b, cambiado]);
  useEffect(() => () => onPreviewTema(null), []); // eslint-disable-line react-hooks/exhaustive-deps

  const elegirPreset = (id) => setB({ ...PRESETS[id], preset: id });
  const personalizar = (parche) => setB((x) => normalizarTema({ ...x, ...parche, preset: "personalizado", nombre: "Personalizado" }));

  async function guardar() {
    setGuardando(true);
    try {
      await onGuardarAjuste("tema", bNorm);
      showToast("Colores guardados para todos los dispositivos.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div>
      <Seccion titulo="Colores de toda la aplicación" ayuda="Elige una combinación o crea la tuya. Se ve al instante y, al guardar, cambia en todos los dispositivos.">
        <div role="radiogroup" aria-label="Combinaciones de colores" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10, marginBottom: 18 }}>
          {Object.entries(PRESETS).map(([id, p]) => {
            const activo = b.preset === id;
            return (
              <button
                key={id} type="button" role="radio" aria-checked={activo} onClick={() => elegirPreset(id)}
                style={{ textAlign: "left", padding: 10, borderRadius: 14, background: "var(--field-bg)", border: activo ? "2px solid var(--accent)" : "1px solid var(--line)" }}
              >
                <div style={{ display: "flex", height: 34, borderRadius: 8, overflow: "hidden", marginBottom: 8, border: "1px solid var(--line)" }}>
                  <div style={{ width: 16, background: p.menu === "claro" ? "#fff" : p.menu === "color" ? p.acento : "#0E1730" }} />
                  <div style={{ flex: 1, background: p.fondo, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ width: 38, height: 14, borderRadius: 7, background: p.acento }} />
                  </div>
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{p.nombre}</div>
              </button>
            );
          })}
        </div>

        <div className="grid-2">
          <Campo etiqueta="Color principal (botones y detalles)">
            <input type="color" aria-label="Color principal" value={esHex(b.acento) ? b.acento : TEMA_POR_DEFECTO.acento} onChange={(e) => personalizar({ acento: e.target.value })} style={{ width: "100%", height: 46, padding: 3, border: "1px solid var(--field-border)", borderRadius: 12, background: "var(--field-bg)", cursor: "pointer" }} />
          </Campo>
          <Campo etiqueta="Color de fondo">
            <input type="color" aria-label="Color de fondo" value={esHex(b.fondo) ? b.fondo : TEMA_POR_DEFECTO.fondo} onChange={(e) => personalizar({ fondo: e.target.value })} style={{ width: "100%", height: 46, padding: 3, border: "1px solid var(--field-border)", borderRadius: 12, background: "var(--field-bg)", cursor: "pointer" }} />
          </Campo>
        </div>

        <Campo etiqueta="Menú lateral">
          <div role="radiogroup" aria-label="Estilo del menú lateral" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[["claro", "Claro"], ["oscuro", "Oscuro"], ["color", "Color principal"]].map(([v, t]) => (
              <button key={v} type="button" role="radio" aria-checked={b.menu === v} className={`chip ${b.menu === v ? "on" : ""}`} onClick={() => personalizar({ menu: v })}>{t}</button>
            ))}
          </div>
        </Campo>

        <Aviso tipo="info">
          Los colores se ajustan solos para que el texto siempre se lea bien, aunque elijas un tono muy claro o muy oscuro. El modo oscuro (luna/sol de arriba) usa
          también estos colores.
        </Aviso>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="btn btn-gold" onClick={guardar} disabled={!cambiado || guardando}>Guardar colores</button>
          <button type="button" className="btn btn-ghost" onClick={() => setB(guardado)} disabled={!cambiado}>Descartar cambios</button>
          <button type="button" className="btn btn-ghost" onClick={() => setB({ ...TEMA_POR_DEFECTO })}>Volver al azul cielo</button>
        </div>
      </Seccion>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SEGURIDAD
// ---------------------------------------------------------------------------

function Seguridad({ showToast }) {
  const [estado, setEstado] = useState({ cargando: true });
  const [bd, setBd] = useState({ estado: "probando" });
  const [cerrando, setCerrando] = useState(false);

  useEffect(() => {
    (async () => {
      setEstado({ cargando: false, ...(await estadoSeguridad()) });
      // Prueba real: ¿puede la clave PÚBLICA (la que viaja en la web) leer datos?
      try {
        const a = await supabase.from("empleadas").select("id").limit(1);
        const b = await supabase.from("clientes").select("id").limit(1);
        const filas = (a.data && a.data.length) || (b.data && b.data.length);
        setBd({ estado: filas ? "abierta" : "cerrada" });
      } catch (e) {
        setBd({ estado: "cerrada" });
      }
    })();
  }, []);

  async function cerrarTodas() {
    setCerrando(true);
    const r = await cerrarTodasLasSesiones();
    setCerrando(false);
    showToast(r.ok ? "Sesión cerrada en todos los demás dispositivos." : r.error || "No se pudo cerrar las sesiones.", r.ok ? "ok" : "error");
  }

  return (
    <div>
      <Seccion titulo="Base de datos" ayuda="Prueba real: se intenta leer tus datos con la clave pública, la que viaja dentro de la web.">
        {bd.estado === "probando" && <Aviso>Comprobando…</Aviso>}
        {bd.estado === "cerrada" && <Aviso tipo="ok"><strong>✓ Cerrada.</strong> La clave pública no puede leer ni escribir nada. Todo pasa por el servidor, que comprueba quién eres y qué puedes hacer.</Aviso>}
        {bd.estado === "abierta" && (
          <Aviso tipo="error">
            <strong>✗ ABIERTA.</strong> Cualquiera que saque la clave pública de la web podría leer tus clientes y citas. Falta el último paso: en Supabase → SQL Editor, pega y ejecuta el contenido de <code>supabase/seguridad.sql</code> (una sola vez) y vuelve a esta pantalla.
          </Aviso>
        )}
      </Seccion>

      <Seccion titulo="Códigos de acceso">
        {estado.cargando && <Aviso>Comprobando…</Aviso>}
        {!estado.cargando && estado.ok === false && <Aviso tipo="error">No se pudo comprobar: {estado.error}</Aviso>}
        {estado.ok && (
          <>
            {estado.codigosDeEjemplo?.length > 0 ? (
              <Aviso tipo="error"><strong>Cambia estos códigos:</strong> {estado.codigosDeEjemplo.join(", ")} usan un código de ejemplo (00000, 11111, 12345…). Es lo primero que probaría alguien. Cámbialos en Empleadas → Editar.</Aviso>
            ) : (
              <Aviso tipo="ok">✓ Nadie usa un código de ejemplo típico.</Aviso>
            )}
            {estado.sinCodigo?.length > 0 && <Aviso>{estado.sinCodigo.join(", ")} todavía no tiene código: no puede entrar.</Aviso>}
          </>
        )}
        <p style={{ color: MUTED, fontSize: 13.5, margin: 0 }}>
          Los códigos se guardan <strong>cifrados</strong> (con una clave que solo conoce el servidor) y nadie puede volver a verlos, ni siquiera tú: solo puedes poner uno nuevo.
          Tras 8 intentos fallidos desde un mismo sitio, el acceso se bloquea 10 minutos. Un código de 5 dígitos tiene 100.000 combinaciones; evita fechas y repeticiones.
        </p>
      </Seccion>

      <Seccion titulo="Sesiones">
        <p style={{ color: MUTED, fontSize: 13.5, margin: "0 0 12px" }}>
          La sesión dura como máximo 12 horas y se cierra sola tras 40 segundos sin tocar la pantalla. Va en una cookie que el navegador protege (no la puede leer ninguna página ni otra web).
          Si pierdes un móvil o un ordenador donde se entró, cierra todas las sesiones.
        </p>
        <button type="button" className="btn btn-ghost" onClick={cerrarTodas} disabled={cerrando}>{cerrando ? "Cerrando…" : "Cerrar la sesión en todos los demás dispositivos"}</button>
      </Seccion>

      <Seccion titulo="Qué está protegido">
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13.5, lineHeight: 1.7 }}>
          <li>Nadie puede ver ni modificar datos sin haber entrado con su código.</li>
          <li>Cada empleada solo puede hacer lo que le permite su ficha, <strong>aunque manipule la app en su navegador</strong>: lo comprueba el servidor.</li>
          <li>Solo el administrador (o quien tenga el permiso de encargada) puede anular una venta cobrada.</li>
          <li>Solo el administrador puede importar, editar o eliminar clientes, y cambiar ajustes y colores.</li>
          <li>Las claves de GHL no se pueden leer desde el navegador, ni siquiera por el administrador.</li>
          <li>Otras webs no pueden hacer peticiones en tu nombre.</li>
        </ul>
      </Seccion>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panel con pestañas
// ---------------------------------------------------------------------------

export default function AjustesPanel({ ajustes, onGuardarAjuste, currentUser, showToast, onPreviewTema, onImportado, pagos, calendarios, botIA, horariosGHL, acento }) {
  const [tab, setTab] = useState("conexiones");
  const pestañas = [
    ["conexiones", "Conexiones (API)", Plug],
    ["negocio", "Negocio", Store],
    ["reservas", "Reservas online", Globe],
    ["apariencia", "Colores", Palette],
    ["marketing", "Marketing", Megaphone],
    ["seguridad", "Seguridad", ShieldCheck],
    ["pagos", "Métodos de pago", Wallet],
  ];

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <h1 style={{ fontSize: 26, marginBottom: 4 }}>Configuración</h1>
        <p style={{ color: MUTED, margin: 0, fontSize: 14 }}>Conexiones, colores, etiquetas de marketing y métodos de pago. Todo desde aquí, sin tocar código.</p>
      </div>

      <div role="tablist" aria-label="Apartados de la configuración" style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
        {pestañas.map(([id, texto, Icono]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} id={`tab-${id}`} className={`chip ${tab === id ? "on" : ""}`} style={{ minHeight: 42, padding: "8px 16px", fontSize: 14 }} onClick={() => setTab(id)}>
            <Icono size={15} aria-hidden="true" /> {texto}
          </button>
        ))}
      </div>

      <div role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === "conexiones" && <Conexiones ajustes={ajustes} onGuardarAjuste={onGuardarAjuste} currentUser={currentUser} showToast={showToast} onImportado={onImportado} calendarios={calendarios} botIA={botIA} horariosGHL={horariosGHL} />}
        {tab === "negocio" && <Negocio ajustes={ajustes} onGuardarAjuste={onGuardarAjuste} showToast={showToast} acento={acento} />}
        {tab === "reservas" && <ReservasOnline ajustes={ajustes} onGuardarAjuste={onGuardarAjuste} showToast={showToast} />}
        {tab === "apariencia" && <Apariencia ajustes={ajustes} onGuardarAjuste={onGuardarAjuste} showToast={showToast} onPreviewTema={onPreviewTema} />}
        {tab === "marketing" && <Marketing ajustes={ajustes} onGuardarAjuste={onGuardarAjuste} showToast={showToast} />}
        {tab === "seguridad" && <Seguridad showToast={showToast} />}
        {tab === "pagos" && pagos}
      </div>
    </div>
  );
}
