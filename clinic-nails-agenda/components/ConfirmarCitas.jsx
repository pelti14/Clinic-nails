"use client";

// Confirmar las citas de un día (normalmente mañana): se llama o se escribe por WhatsApp a cada clienta y se anota si viene (✋),
// si no cogió la llamada, o se deja pendiente. Lo que conteste la IA de WhatsApp de GHL también llega aquí (ver Configuración → Conexiones).

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Hand, Phone, PhoneOff, MessageCircle } from "lucide-react";
import { citasParaConfirmar, resumenConfirmaciones, enlaceLlamada, enlaceWhatsApp, mensajeConfirmacion, diaLargo, ESTADOS_CONFIRMACION } from "../lib/confirmaciones";

const MUTED = "rgba(var(--ink-rgb),0.72)";
const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const sumar = (iso, n) => { const d = new Date(`${iso}T12:00:00`); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const cuando = (f) => (f ? new Date(f).toLocaleString("es-ES", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" }) : "");

export default function ConfirmarCitas({ ui, negocio, fechaInicial, hoy, citas, clientes, servicios, empleadas, onConfirmacion, onAbrirCita, onClose }) {
  const { ModalShell } = ui;
  const [fecha, setFecha] = useState(fechaInicial);
  const lista = citasParaConfirmar(citas, fecha);
  const r = resumenConfirmaciones(lista);
  const nombreDia = fecha === sumar(hoy, 1) ? "mañana" : fecha === hoy ? "hoy" : diaLargo(fecha);
  const chip = (texto, color, fondo) => <span style={{ background: fondo, color, fontWeight: 700, fontSize: 12.5, padding: "3px 10px", borderRadius: 999 }}>{texto}</span>;

  return (
    <ModalShell title={`Confirmar citas de ${nombreDia}`} onClose={onClose} ancho={860}>
      <div data-confirmar-dia="1">
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          <button type="button" className="btn btn-ghost" aria-label="Día anterior" style={{ minHeight: 36, padding: "4px 10px" }} onClick={() => setFecha(sumar(fecha, -1))}><ChevronLeft size={16} /></button>
          <strong style={{ fontSize: 16, textTransform: "capitalize" }}>{diaLargo(fecha)}</strong>
          <button type="button" className="btn btn-ghost" aria-label="Día siguiente" style={{ minHeight: 36, padding: "4px 10px" }} onClick={() => setFecha(sumar(fecha, 1))}><ChevronRight size={16} /></button>
          <span data-resumen-confirmacion="1" style={{ display: "flex", gap: 6, flexWrap: "wrap", marginLeft: "auto" }}>
            {chip(`${r.confirmadas} confirmadas`, "#166534", "rgba(22,163,74,0.16)")}
            {chip(`${r.noContesta} no cogieron`, "#92400E", "rgba(217,119,6,0.18)")}
            {chip(`${r.pendientes} pendientes`, "var(--text)", "rgba(var(--ink-rgb),0.09)")}
          </span>
        </div>
        {lista.length === 0 && <div data-sin-citas="1" style={{ padding: 22, textAlign: "center", color: MUTED }}>No hay citas que confirmar este día.</div>}
        <div style={{ maxHeight: "60vh", overflowY: "auto", display: "grid", gap: 10 }}>
          {lista.map((c) => {
            const cliente = c.clienteId ? clientes.find((x) => x.id === c.clienteId) : null;
            const tel = cliente?.telefono || "";
            const servicio = servicios.find((s) => s.id === c.servicioId);
            const emp = empleadas.find((e) => e.id === c.empleadaId);
            const estado = c.confirmacion || "pendiente";
            const llamar = enlaceLlamada(tel);
            const wa = enlaceWhatsApp(tel, mensajeConfirmacion({ nombre: cliente?.nombre || c.clienta, fecha: c.fecha, inicio: c.inicio, servicio: servicio?.nombre, hoy, negocio }));
            const enlace = (href, texto, Icono, dato) => href
              ? <a href={href} {...dato} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="btn btn-ghost" style={{ minHeight: 36, padding: "4px 12px", textDecoration: "none" }}><Icono size={14} aria-hidden="true" /> {texto}</a>
              : <span className="btn btn-ghost" aria-disabled="true" title="Esta clienta no tiene teléfono" style={{ minHeight: 36, padding: "4px 12px", opacity: 0.4 }}><Icono size={14} aria-hidden="true" /> {texto}</span>;
            return (
              <div key={c.id} className="card" data-fila-confirmar={c.id} data-estado={estado} style={{ padding: "12px 14px", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", borderLeft: `4px solid ${estado === "confirmada" ? "#16A34A" : estado === "no_contesta" ? "#D97706" : "rgba(var(--ink-rgb),0.2)"}` }}>
                <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                  <div style={{ fontWeight: 700 }}>{hhmm(c.inicio)}–{hhmm(c.inicio + c.duracion)} · {c.clienta}</div>
                  <div style={{ fontSize: 13, color: MUTED }}>{servicio?.nombre || "Cita"} · {emp?.nombre || ""}{tel ? ` · ${tel}` : ""}</div>
                  {estado !== "pendiente" && (
                    <div data-quien-confirmo="1" style={{ fontSize: 12.5, color: estado === "confirmada" ? "#166534" : "#92400E", fontWeight: 600 }}>
                      {ESTADOS_CONFIRMACION[estado].texto}{c.confirmacionPor ? ` · ${c.confirmacionPor}` : ""}{c.confirmacionEn ? ` · ${cuando(c.confirmacionEn)}` : ""}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                  {enlace(llamar, "Llamar", Phone, { "data-llamar": c.id })}
                  {enlace(wa, "WhatsApp", MessageCircle, { "data-whatsapp": c.id })}
                  <button type="button" data-marcar-confirmada={c.id} aria-pressed={estado === "confirmada"} className={estado === "confirmada" ? "btn btn-gold" : "btn btn-ghost"} style={{ minHeight: 36, padding: "4px 12px" }} onClick={() => onConfirmacion(c, estado === "confirmada" ? "pendiente" : "confirmada")}><Hand size={14} aria-hidden="true" /> Confirmada</button>
                  <button type="button" data-marcar-no-cogio={c.id} aria-pressed={estado === "no_contesta"} className={estado === "no_contesta" ? "btn btn-gold" : "btn btn-ghost"} style={{ minHeight: 36, padding: "4px 12px" }} onClick={() => onConfirmacion(c, estado === "no_contesta" ? "pendiente" : "no_contesta")}><PhoneOff size={14} aria-hidden="true" /> No cogió</button>
                  <button type="button" className="btn btn-ghost" data-abrir-cita={c.id} style={{ minHeight: 36, padding: "4px 12px" }} onClick={() => onAbrirCita(c)}>Abrir</button>
                </div>
              </div>
            );
          })}
        </div>
        <p style={{ fontSize: 12.5, color: MUTED, margin: "12px 0 0" }}>«Llamar» marca desde el móvil o el ordenador con un toque; «WhatsApp» abre el chat con el mensaje ya escrito. Después anota aquí el resultado. Si cambias la cita de día u hora, la confirmación vuelve a «pendiente».</p>
      </div>
    </ModalShell>
  );
}
