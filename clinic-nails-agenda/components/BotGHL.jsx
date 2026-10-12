"use client";

// Para que el bot de IA de GHL reserve con su servicio: los textos que hay que pegar en GHL, generados con los servicios de la app.
import { estadoBotPorEmpleada } from "../lib/porRevisar";
import React, { useMemo, useState } from "react";
import { opcionesCampoServicio, textoBotServicios } from "../lib/botServicios";

const MUTED = "rgba(var(--ink-rgb),0.72)";

async function copiar(texto) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(texto); return true; }
  } catch (e) { /* se prueba el otro método */ }
  try {
    const ta = document.createElement("textarea");
    ta.value = texto; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch (e) { return false; }
}

export default function BotGHL({ services, showToast, nombreNegocio = "Clinic Nails & Beauty", citas = [], empleadas = [], hoy = "" }) {
  const estadoBot = useMemo(() => (hoy ? estadoBotPorEmpleada({ citas, empleadas, hoy }) : null), [citas, empleadas, hoy]);
  // Enlace seguro para que GHL avise de las confirmaciones por WhatsApp (lo crea el servidor; solo lo ve el administrador)
  const [token, setToken] = useState("");
  const [cargandoToken, setCargandoToken] = useState(false);
  const [errorToken, setErrorToken] = useState("");
  const [confirmandoCambio, setConfirmandoCambio] = useState(false);
  async function pedirToken(regenerar) {
    setCargandoToken(true);
    setErrorToken("");
    try {
      const res = await fetch("/api/ghl/token-confirmacion", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ regenerar }) });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error || `No se pudo (${res.status}).`);
      setToken(data.token);
      setConfirmandoCambio(false);
      if (regenerar) showToast("Clave nueva creada: el enlace anterior ya no funciona. Cámbialo en tus flujos de GHL.", "ok");
    } catch (err) {
      setErrorToken(err.message);
    } finally {
      setCargandoToken(false);
    }
  }
  const base = typeof window !== "undefined" ? window.location.origin : "";
  const enlace = (estado) => `${base}/api/ghl/confirmacion?token=${token}&estado=${estado}`;
  const opciones = useMemo(() => opcionesCampoServicio(services), [services]);
  const texto = useMemo(() => textoBotServicios(services, nombreNegocio), [services, nombreNegocio]);
  const copia = async (que, contenido) => {
    const bien = await copiar(contenido);
    showToast(bien ? `${que} copiado: ya puedes pegarlo en GHL.` : "No se pudo copiar. Selecciona el texto y cópialo a mano.", bien ? "ok" : "error");
  };
  const caja = { width: "100%", fontFamily: "ui-monospace, Menlo, Consolas, monospace", fontSize: 12.5, borderRadius: 10, padding: 10, minHeight: 120, maxHeight: 220, resize: "vertical" };
  const paso = { margin: "0 0 18px", paddingLeft: 4 };
  return (
    <div className="card" data-bot-ghl="1" style={{ padding: 20, marginTop: 20 }}>
      <h3 style={{ fontSize: 18, margin: "0 0 4px" }}>Bot de IA de GHL: que reserve con su servicio</h3>
      <p style={{ margin: "0 0 14px", fontSize: 13.5, color: MUTED }}>
        Cuando el bot reserva una cita no sabe qué servicio es: solo elige el calendario de la empleada. Para que la cita llegue a la agenda <strong>con su servicio</strong>, el bot tiene que apuntarlo
        en un campo del contacto llamado <strong>«Servicio»</strong> antes de reservar, y la app lo lee al importar la cita. Se configura una vez, en GHL:
      </p>

      <div style={paso}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>1 · Crea el campo «Servicio» en GHL</div>
        <div style={{ fontSize: 13.5, color: MUTED, marginBottom: 8 }}>En GHL → Ajustes → Campos personalizados → nuevo campo de <em>Contacto</em>, llamado exactamente <strong>Servicio</strong>, de tipo <strong>lista desplegable</strong> con estas {opciones.length} opciones (una por línea):</div>
        <div style={{ fontSize: 13, color: MUTED, marginBottom: 8 }}>Si quieres que el bot pueda apuntar <strong>varios servicios</strong> en una misma reserva, usa un campo de <strong>texto</strong> en vez de la lista (escribirá los nombres separados por comas); en una lista desplegable solo cabe uno.</div>
        <textarea readOnly aria-label="Opciones del campo Servicio" style={caja} value={opciones.join("\n")} onFocus={(e) => e.target.select()} />
        <button type="button" className="btn btn-gold" data-copiar-opciones="1" style={{ marginTop: 8 }} onClick={() => copia("Listado de opciones", opciones.join("\n"))}>Copiar las {opciones.length} opciones</button>
      </div>

      <div style={paso}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>2 · Pega este texto en las instrucciones del bot</div>
        <div style={{ fontSize: 13.5, color: MUTED, marginBottom: 8 }}>Es la lista de tus servicios con los nombres exactos y lo que debe hacer antes de reservar. Añádelo a las instrucciones (prompt) del bot de IA:</div>
        <textarea readOnly aria-label="Texto para el bot de IA" style={{ ...caja, minHeight: 200 }} value={texto} onFocus={(e) => e.target.select()} />
        <button type="button" className="btn btn-gold" data-copiar-texto="1" style={{ marginTop: 8 }} onClick={() => copia("Texto para el bot", texto)}>Copiar el texto para el bot</button>
      </div>

      <div style={paso}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>3 · Permiso de tu clave de GHL</div>
        <div style={{ fontSize: 13.5, color: MUTED }}>Para que la app pueda leer ese campo, tu clave de GHL (Ajustes → Integraciones privadas) necesita el permiso <strong>locations/customFields.readonly</strong>. Si falta, la sincronización lo avisa.</div>
      </div>

      <div style={{ margin: 0 }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>4 · Pruébalo</div>
        <div style={{ fontSize: 13.5, color: MUTED }}>Haz una reserva con el bot y mira la agenda: la cita debe entrar con su servicio. Si el bot no rellenó el campo, la cita entra igualmente con el aviso <strong>«⚠ Revisar servicio»</strong> (y dice qué ponía el campo).</div>
      </div>
      {estadoBot && (
        <div data-estado-bot="1" style={{ margin: "22px 0 0", paddingTop: 18, borderTop: "1px solid var(--line)" }}>
          <h4 style={{ fontSize: 16, margin: "0 0 4px" }}>¿Está llegando el servicio con cada empleada?</h4>
          <p style={{ margin: "0 0 10px", fontSize: 13.5, color: MUTED }}>Reservas del bot de los últimos 30 días (y las que ya tienen fecha), según hayan entrado <strong>con su servicio</strong> o se haya tenido que poner uno por defecto.</p>
          {estadoBot.total.total === 0 ? <div data-sin-reservas-bot="1" style={{ fontSize: 13.5, color: MUTED }}>Todavía no hay reservas del bot en este periodo.</div> : (
            <>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
                  <thead><tr style={{ textAlign: "left", color: MUTED }}><th style={{ padding: "4px 8px 4px 0" }}>Empleada</th><th style={{ padding: "4px 8px" }}>Reservas del bot</th><th style={{ padding: "4px 8px" }}>Con servicio</th><th style={{ padding: "4px 8px" }}>Sin servicio</th><th style={{ padding: "4px 0 4px 8px" }}>Por revisar</th></tr></thead>
                  <tbody>
                    {[...estadoBot.filas.filter((f) => f.total > 0), estadoBot.total].map((f) => {
                      const color = f.porcentaje === null ? undefined : f.porcentaje >= 90 ? "#166534" : f.porcentaje >= 50 ? "#92400E" : "#B91C1C";
                      return (
                        <tr key={f.empleada.id} data-fila-bot={f.empleada.id} style={{ borderTop: "1px solid var(--line)", fontWeight: f.empleada.id === "todas" ? 700 : 400 }}>
                          <td style={{ padding: "6px 8px 6px 0" }}>{f.empleada.nombre}</td><td style={{ padding: "6px 8px" }}>{f.total}</td>
                          <td style={{ padding: "6px 8px", color }}>{f.conServicio} ({f.porcentaje}%)</td><td style={{ padding: "6px 8px" }}>{f.sinServicio}</td><td style={{ padding: "6px 0 6px 8px" }}>{f.porRevisar}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {estadoBot.filas.filter((f) => f.total >= 2 && f.porcentaje < 80).map((f) => (
                <div key={f.empleada.id} data-consejo-bot={f.empleada.id} style={{ marginTop: 8, fontSize: 13.5, color: "#92400E" }}>⚠ Con <strong>{f.empleada.nombre}</strong> el bot casi nunca indica el servicio ({f.conServicio} de {f.total}). Comprueba en GHL que el bot que reserva en su calendario tiene la acción de apuntar el servicio en el campo «Servicio» y las instrucciones del paso 2.</div>
              ))}
            </>
          )}
        </div>
      )}
      <div data-confirmaciones-whatsapp="1" style={{ margin: "22px 0 0", paddingTop: 18, borderTop: "1px solid var(--line)" }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>5 · Confirmaciones de citas por el WhatsApp de la IA (opcional)</div>
        <div style={{ fontSize: 13.5, color: MUTED, marginBottom: 10 }}>
          Si el bot de IA de GHL (o un flujo) pregunta a las clientas por WhatsApp si vienen, puede avisar a la agenda para que la cita salga con la mano ✋. En GHL → Automatizaciones, cuando la clienta confirme, añade la acción
          <strong> Webhook (POST)</strong> con el enlace de «confirmada». GHL manda el contacto y la app confirma <strong>su próxima cita</strong>. Opcionalmente, otro aviso con el enlace de «no_contesta».
        </div>
        {!token ? (
          <button type="button" className="btn btn-gold" data-mostrar-enlace="1" disabled={cargandoToken} onClick={() => pedirToken(false)}>{cargandoToken ? "Un momento…" : "Crear o mostrar el enlace seguro"}</button>
        ) : (
          <div data-enlaces-confirmacion="1">
            {[["confirmada", "Enlace para «confirmada»", "Enlace de «confirmada»"], ["no_contesta", "Enlace para «no cogió la llamada»", "Enlace de «no cogió»"]].map(([estado, etiqueta, nombre]) => (
              <div key={estado} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 13, color: MUTED, marginBottom: 3 }}>{etiqueta}</div>
                <textarea readOnly aria-label={etiqueta} style={{ ...caja, minHeight: 56 }} value={enlace(estado)} onFocus={(e) => e.target.select()} />
                <button type="button" className="btn btn-ghost" data-copiar-enlace={estado} style={{ marginTop: 6 }} onClick={() => copia(nombre, enlace(estado))}>Copiar</button>
              </div>
            ))}
            {!confirmandoCambio ? (
              <button type="button" className="btn btn-ghost" data-cambiar-clave="1" onClick={() => setConfirmandoCambio(true)}>Cambiar la clave</button>
            ) : (
              <div role="alert" style={{ border: "1px solid var(--danger)", borderRadius: 12, padding: "10px 12px", fontSize: 13.5 }}>
                Los enlaces actuales dejarán de funcionar y tendrás que cambiarlos en tus flujos de GHL.
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button type="button" className="btn btn-gold" data-confirmar-cambio-clave="1" onClick={() => pedirToken(true)}>Sí, cambiar la clave</button>
                  <button type="button" className="btn btn-ghost" onClick={() => setConfirmandoCambio(false)}>Cancelar</button>
                </div>
              </div>
            )}
          </div>
        )}
        {errorToken && <div role="alert" data-error-enlace="1" style={{ color: "var(--danger)", fontSize: 13.5, marginTop: 8 }}>{errorToken}</div>}
        <div style={{ fontSize: 12.5, color: MUTED, marginTop: 10 }}>Quien tenga el enlace puede marcar confirmaciones: no lo compartas. Lo que llegue por aquí aparece en <strong>Actividad</strong> como «WhatsApp (IA de GHL)». No puedo comprobar desde la app cómo tienes montado el bot en GHL: prueba con una clienta de prueba.</div>
      </div>
      <p style={{ margin: "14px 0 0", fontSize: 12.5, color: MUTED }}>Cuando añadas, quites o renombres servicios, vuelve a copiar estos textos para que el bot y la app sigan usando los mismos nombres. El título de la cita también cuenta: si el título ya trae el servicio, se usa ese.</p>
    </div>
  );
}
