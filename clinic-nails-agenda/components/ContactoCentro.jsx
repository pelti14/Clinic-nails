"use client";

// Cómo contactar y llegar al centro en las páginas de las clientas: llamar, WhatsApp, la dirección con su mapa y «Cómo llegar»
// (Google Maps o Mapas de Apple). Los datos salen de Configuración → Negocio; si no hay ninguno, no se pinta nada.

import React from "react";
import { Phone, MessageCircle, MapPin, Navigation } from "lucide-react";
import { enlacesContacto, hayContacto, telefonoLegible } from "../lib/contacto";

const MUTED = "rgba(var(--ink-rgb),0.72)";
const boton = { display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none", minHeight: 40 };

// Solo los botones de llamar / WhatsApp (para meterlos junto a «llámanos»)
export function BotonesLlamar({ contacto, mensaje = "" }) {
  const e = enlacesContacto(contacto, mensaje);
  if (!e.llamar && !e.whatsappUrl) return null;
  return (
    <div data-botones-llamar="1" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
      {e.llamar && <a className="btn btn-gold" data-llamar="1" href={e.llamar} style={boton}><Phone size={16} aria-hidden="true" /> Llamar</a>}
      {e.whatsappUrl && <a className="btn btn-ghost" data-whatsapp="1" href={e.whatsappUrl} target="_blank" rel="noopener noreferrer" style={boton}><MessageCircle size={16} aria-hidden="true" /> WhatsApp</a>}
    </div>
  );
}

export default function ContactoCentro({ negocio, contacto, mensaje = "", conBotones = true }) {
  if (!hayContacto(contacto)) return null;
  const e = enlacesContacto(contacto, mensaje);
  return (
    <section className="card" data-contacto-centro="1" style={{ padding: 18, marginTop: 18 }}>
      <h2 style={{ fontSize: 18, margin: "0 0 8px" }}>Dónde estamos</h2>
      {e.direccion && <p data-direccion="1" style={{ margin: "0 0 10px", display: "flex", gap: 6, alignItems: "flex-start" }}><MapPin size={17} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} /> <span>{e.direccion}</span></p>}
      {e.mapaEmbed && (
        <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--line)", marginBottom: 10 }}>
          <iframe data-mapa="1" title={`Mapa de ${negocio || "el centro"}`} src={e.mapaEmbed} width="100%" height="220" style={{ border: 0, display: "block" }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        </div>
      )}
      {(e.googleMaps || e.appleMaps) && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {e.googleMaps && <a className="btn btn-ghost" data-como-llegar-google="1" href={e.googleMaps} target="_blank" rel="noopener noreferrer" style={boton}><Navigation size={16} aria-hidden="true" /> Cómo llegar (Google Maps)</a>}
          {e.appleMaps && <a className="btn btn-ghost" data-como-llegar-apple="1" href={e.appleMaps} target="_blank" rel="noopener noreferrer" style={boton}><Navigation size={16} aria-hidden="true" /> Mapas de iPhone</a>}
        </div>
      )}
      {e.fichaGoogle && e.direccion && <p style={{ margin: "10px 0 0", fontSize: 13.5 }}><a data-ficha-google="1" href={e.fichaGoogle} target="_blank" rel="noopener noreferrer">Ver {negocio || "el centro"} en Google Maps</a></p>}
      {conBotones && (e.llamar || e.whatsappUrl) && (
        <>
          <div style={{ fontSize: 13.5, color: MUTED, marginTop: 14 }}>¿Dudas? Escríbenos o llámanos{e.telefono ? ` al ${telefonoLegible(e.telefono)}` : ""}.</div>
          <BotonesLlamar contacto={contacto} mensaje={mensaje} />
        </>
      )}
    </section>
  );
}
