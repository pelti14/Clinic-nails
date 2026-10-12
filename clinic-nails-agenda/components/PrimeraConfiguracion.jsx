"use client";

// «Primera configuración»: sale UNA vez, al entrar el administrador en una instalación nueva (otro negocio, otro hosting).
// Pide el nombre del negocio, su contacto y dirección, el nombre y el código nuevo del administrador, y si borrar los datos de ejemplo.

import React, { useState } from "react";
import { MAX_NOMBRE } from "../lib/negocio";
import { MAX_DIRECCION } from "../lib/contacto";
import { LONGITUD_CODIGO } from "../lib/codigo";

const MUTED = "rgba(var(--ink-rgb),0.72)";

export default function PrimeraConfiguracion({ nombreActual = "", onHecho, onSalir }) {
  const [f, setF] = useState({ nombre: "", telefono: "", whatsapp: "", direccion: "", mapsUrl: "", adminNombre: nombreActual === "Eduardo" ? "" : nombreActual, codigo: "", repetir: "", borrarEjemplos: true });
  const [errores, setErrores] = useState({});
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const campo = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const err = (k) => (errores[k] ? <div role="alert" data-error-instalacion={k} style={{ color: "var(--danger)", fontSize: 13, marginTop: 4 }}>{errores[k]}</div> : null);
  const etiqueta = (t, ayuda) => <><div className="field-label">{t}</div>{ayuda && <div style={{ fontSize: 12.5, color: MUTED, margin: "-2px 0 6px" }}>{ayuda}</div>}</>;

  async function guardar(e) {
    e.preventDefault();
    setGuardando(true); setError(""); setErrores({});
    try {
      const r = await fetch("/api/instalacion", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ negocio: { nombre: f.nombre, telefono: f.telefono, whatsapp: f.whatsapp, direccion: f.direccion, mapsUrl: f.mapsUrl }, admin: { nombre: f.adminNombre, codigo: f.codigo, repetir: f.repetir }, borrarEjemplos: f.borrarEjemplos }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) { setErrores(d.errores || {}); setError(d.error || "No se ha podido guardar."); return; }
      onHecho();
    } catch (x) {
      setError("No hay conexión. Vuelve a probar.");
    } finally { setGuardando(false); }
  }

  const bloque = { padding: 18, marginBottom: 14 };
  return (
    <main data-primera-configuracion="1" style={{ minHeight: "100vh", background: "var(--bg)", padding: "28px 16px 60px" }}>
      <form onSubmit={guardar} style={{ maxWidth: 640, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, margin: "0 0 6px" }}>Primera configuración</h1>
        <p style={{ color: MUTED, margin: "0 0 18px" }}>Esta agenda está recién instalada. Rellena esto una vez y queda lista para tu negocio. Todo se puede cambiar después en Configuración.</p>

        <section className="card" style={bloque}>
          <h2 style={{ fontSize: 18, margin: "0 0 12px" }}>1. Tu negocio</h2>
          {etiqueta("Nombre del negocio", "Sale en el menú, en la pestaña del navegador y en la página de reservas.")}
          <input className="input" required maxLength={MAX_NOMBRE} aria-label="Nombre del negocio" data-instalacion-negocio="1" value={f.nombre} onChange={campo("nombre")} />
          {err("negocio")}
          <div style={{ height: 12 }} />
          {etiqueta("Teléfono para que te llamen (opcional)")}
          <input className="input" type="tel" inputMode="tel" aria-label="Teléfono" value={f.telefono} onChange={campo("telefono")} />
          {err("telefono")}
          <div style={{ height: 12 }} />
          {etiqueta("WhatsApp (opcional)")}
          <input className="input" type="tel" inputMode="tel" aria-label="WhatsApp" value={f.whatsapp} onChange={campo("whatsapp")} />
          {err("whatsapp")}
          <div style={{ height: 12 }} />
          {etiqueta("Dirección (opcional)", "Calle, número, código postal y ciudad: con ella se dibuja el mapa para las clientas.")}
          <input className="input" maxLength={MAX_DIRECCION} aria-label="Dirección" value={f.direccion} onChange={campo("direccion")} />
          {err("direccion")}
          <div style={{ height: 12 }} />
          {etiqueta("Enlace de Google Maps (opcional)", "Google Maps → tu negocio → Compartir → Copiar enlace.")}
          <input className="input" inputMode="url" placeholder="https://maps.app.goo.gl/…" aria-label="Enlace de Google Maps" value={f.mapsUrl} onChange={campo("mapsUrl")} />
          {err("mapsUrl")}
        </section>

        <section className="card" style={bloque}>
          <h2 style={{ fontSize: 18, margin: "0 0 4px" }}>2. Tu acceso</h2>
          <p style={{ fontSize: 13.5, color: MUTED, margin: "0 0 12px" }}>Has entrado con el código de ejemplo, que conoce cualquiera que lea las instrucciones. Elige el tuyo.</p>
          {etiqueta("Tu nombre")}
          <input className="input" required maxLength={40} aria-label="Tu nombre" data-instalacion-admin="1" value={f.adminNombre} onChange={campo("adminNombre")} />
          {err("adminNombre")}
          <div style={{ height: 12 }} />
          {etiqueta(`Tu código nuevo (${LONGITUD_CODIGO} cifras)`)}
          <input className="input" required type="password" inputMode="numeric" autoComplete="new-password" maxLength={LONGITUD_CODIGO} aria-label="Tu código nuevo" data-instalacion-codigo="1" value={f.codigo} onChange={(e) => setF({ ...f, codigo: e.target.value.replace(/\D/g, "") })} />
          {err("codigo")}
          <div style={{ height: 12 }} />
          {etiqueta("Repite el código")}
          <input className="input" required type="password" inputMode="numeric" autoComplete="new-password" maxLength={LONGITUD_CODIGO} aria-label="Repite el código" data-instalacion-repetir="1" value={f.repetir} onChange={(e) => setF({ ...f, repetir: e.target.value.replace(/\D/g, "") })} />
          {err("repetir")}
        </section>

        <section className="card" style={bloque}>
          <h2 style={{ fontSize: 18, margin: "0 0 10px" }}>3. Datos de ejemplo</h2>
          <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 14, marginBottom: 8 }}>
            <input type="radio" name="ejemplos" checked={f.borrarEjemplos} onChange={() => setF({ ...f, borrarEjemplos: true })} style={{ marginTop: 3 }} />
            <span><strong>Empezar vacío</strong> (recomendado): borra las empleadas y los servicios de ejemplo. Se quedan las cabinas y los métodos de pago (Efectivo, Tarjeta, Bizum), que puedes renombrar.</span>
          </label>
          <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 14 }}>
            <input type="radio" name="ejemplos" checked={!f.borrarEjemplos} onChange={() => setF({ ...f, borrarEjemplos: false })} style={{ marginTop: 3 }} />
            <span>Dejar los ejemplos para probar la agenda (los borras luego a mano). Sus códigos (11111, 22222) cámbialos o desactívalos.</span>
          </label>
        </section>

        <section className="card" style={{ ...bloque, fontSize: 13.5 }}>
          <h2 style={{ fontSize: 18, margin: "0 0 8px" }}>Después</h2>
          <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.7 }}>
            <li>Empleados → crea a tu equipo, con su horario y su código.</li>
            <li>Catálogo → Servicios → tus servicios, con precio y duración (o impórtalos).</li>
            <li>Configuración → Conexiones → conecta GoHighLevel si lo usas (clave, Location ID y calendario de cada empleada).</li>
            <li>Configuración → Reservas online → actívalas si quieres que reserven desde tu web.</li>
          </ol>
        </section>

        {error && <div role="alert" data-error-instalacion-general="1" style={{ color: "var(--danger)", marginBottom: 10 }}>{error}</div>}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="submit" className="btn btn-gold" data-guardar-instalacion="1" disabled={guardando}>{guardando ? "Guardando…" : "Guardar y empezar"}</button>
          <button type="button" className="btn btn-ghost" onClick={onSalir}>Salir</button>
        </div>
      </form>
    </main>
  );
}
