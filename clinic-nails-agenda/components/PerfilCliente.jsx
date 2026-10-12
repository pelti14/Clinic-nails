"use client";

import React, { useState } from "react";
import { Phone, Mail, StickyNote, Pin, Pencil, Plus, Heart } from "lucide-react";
import { euros } from "../lib/informes";
import { resumenCliente } from "../lib/clientes";
import { Etiqueta } from "./ClientesAdmin";
import { MenuPuntos } from "./Actividad";

const MUTED = "rgba(var(--ink-rgb),0.74)";
const fecha = (iso) => (iso ? iso.split("-").reverse().join("/") : "—");
const hora = (min) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

function Dato({ etiqueta, valor, detalle }) {
  return (
    <div className="card" style={{ padding: "10px 12px" }}>
      <div style={{ fontSize: 12, color: MUTED }}>{etiqueta}</div>
      <div style={{ fontSize: 19, fontWeight: 600 }}>{valor}</div>
      {detalle && <div style={{ fontSize: 12, color: MUTED }}>{detalle}</div>}
    </div>
  );
}

function Estado({ cita }) {
  const a = cita.asistencia || "prevista";
  let texto = "Pendiente";
  let color = "var(--accent-text)";
  if (a === "no_asistio") {
    texto = "No asistió";
    color = "var(--danger)";
  } else if (a === "cancelada") {
    texto = "Cancelada";
    color = MUTED;
  } else if (cita.estadoCobro === "cobrada") {
    texto = "Cobrada";
    color = "var(--success)";
  }
  return <span style={{ fontSize: 12, fontWeight: 600, color }}>{texto}</span>;
}

export default function PerfilCliente({ ui, esAdmin = true, bonos = [], onVerActividad, cliente, citas, servicios, empleadas, productos, calcularTotal, hoy, onClose, onEditar, onNuevaCita, onGuardarNota }) {
  const { ModalShell } = ui;
  const [nota, setNota] = useState(cliente.notaFija || "");
  const [guardando, setGuardando] = useState(false);
  const notaSinGuardar = (nota || "").trim() !== (cliente.notaFija || "").trim();

  const suyas = citas
    .filter((c) => c.clienteId === cliente.id)
    .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.inicio - a.inicio);
  const asist = (c) => c.asistencia || "prevista";
  const efectivas = suyas.filter((c) => asist(c) === "prevista");
  const cobradas = suyas.filter((c) => c.estadoCobro === "cobrada" && asist(c) !== "cancelada");
  const gasto = cobradas.reduce((s, c) => s + calcularTotal(c, servicios, productos), 0);
  const pasadas = efectivas.filter((c) => c.fecha < hoy);
  const proximas = efectivas.filter((c) => c.fecha >= hoy).sort((a, b) => a.fecha.localeCompare(b.fecha) || a.inicio - b.inicio);
  const primera = efectivas.length ? efectivas[efectivas.length - 1].fecha : null;
  const noShows = suyas.filter((c) => asist(c) === "no_asistio").length;

  const resumen = resumenCliente(cliente, suyas, servicios, hoy);

  const nombreServicios = (c) =>
    [c.servicioId, ...(c.serviciosExtra || [])].map((id) => servicios.find((s) => s.id === id)?.nombre).filter(Boolean).join(" + ") || "Servicio";
  const nombreEmpleada = (c) => empleadas.find((e) => e.id === c.empleadaId)?.nombre || "—";

  async function guardarNota(texto) {
    setGuardando(true);
    try {
      await onGuardarNota(cliente.id, texto);
      setNota(texto);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <ModalShell title={cliente.nombre} onClose={onClose} ancho={640} nivel={1}>
      {onVerActividad && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
          <MenuPuntos items={[{ texto: "Ver actividad de este cliente", onClick: () => onVerActividad(cliente) }]} />
        </div>
      )}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center", marginTop: -6, marginBottom: 14, fontSize: 14 }}>
        {cliente.favorito && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 600, color: "var(--accent-text)" }}>
            <Heart size={14} style={{ fill: "var(--accent)", stroke: "var(--accent)" }} aria-hidden="true" /> Favorito
          </span>
        )}
        {cliente.telefono && (
          <a href={`tel:${cliente.telefono.replace(/\s/g, "")}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--accent-text)", fontWeight: 500 }}>
            <Phone size={14} aria-hidden="true" /> {cliente.telefono}
          </a>
        )}
        {cliente.email && (
          <a href={`mailto:${cliente.email}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--accent-text)", fontWeight: 500 }}>
            <Mail size={14} aria-hidden="true" /> {cliente.email}
          </a>
        )}
        {primera && <span style={{ color: MUTED }}>Cliente desde {fecha(primera)}</span>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginBottom: 16 }}>
        <Dato etiqueta="Visitas" valor={pasadas.length} detalle={noShows ? `${noShows} inasistencia${noShows === 1 ? "" : "s"}` : "sin inasistencias"} />
        {esAdmin ? (
          <Dato etiqueta="Gasto total" valor={euros(gasto)} detalle={cobradas.length ? `${euros(gasto / cobradas.length)} de media` : "sin cobros"} />
        ) : (
          <Dato etiqueta="Citas" valor={resumen.reservas} detalle="en total" />
        )}
        <Dato etiqueta="Última visita" valor={pasadas[0] ? fecha(pasadas[0].fecha) : "—"} />
        <Dato etiqueta="Próxima cita" valor={proximas[0] ? fecha(proximas[0].fecha) : "—"} detalle={proximas[0] ? hora(proximas[0].inicio) : "ninguna"} />
      </div>

      <div data-etiquetas-ficha="1" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: resumen.categorias.length ? 8 : 0 }}>
          {resumen.etiquetas.map((e, i) => <Etiqueta key={i} e={e} />)}
        </div>
        {resumen.categorias.length > 0 && (
          <div style={{ fontSize: 13, color: MUTED }}>
            Veces que viene por tipo de servicio: {resumen.categorias.map((c) => `${c.categoria} ${c.n}`).join(" · ")}
          </div>
        )}
      </div>

      {bonos.length > 0 && (
        <div data-bonos-ficha="1" style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 6 }}>Bonos</div>
          {bonos.map(({ bv, estado, saldo, pendiente = 0 }) => (
            <div key={bv.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13.5, padding: "4px 0" }}>
              <span>{bv.nombre}</span>
              <span style={{ color: estado === "activo" ? "var(--accent-text)" : MUTED, fontWeight: estado === "activo" ? 600 : 400 }}>
                {estado === "activo" ? `quedan ${saldo.restantes} de ${saldo.total}${bv.caduca ? ` · caduca ${bv.caduca}` : ""}` : estado}
                {pendiente > 0.005 && <span style={{ color: "var(--danger)", fontWeight: 600 }}> · debe {pendiente.toFixed(2)} €</span>}
              </span>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <label htmlFor="nota-fija" className="field-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Pin size={14} aria-hidden="true" /> Nota fija (aparece siempre que este cliente reserve)
        </label>
        <textarea
          id="nota-fija" className="input" rows={2} style={{ resize: "vertical", minHeight: 64 }}
          placeholder="Ej.: alérgica al látex · prefiere trato por WhatsApp · siempre llega 10 minutos tarde"
          value={nota} onChange={(e) => setNota(e.target.value)}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          <button type="button" className="btn btn-gold" style={{ minHeight: 38, padding: "6px 16px", fontSize: 13.5 }} disabled={!notaSinGuardar || guardando} onClick={() => guardarNota(nota)}>
            Guardar nota fija
          </button>
          {(cliente.notaFija || nota) && (
            <button type="button" className="btn btn-ghost" style={{ minHeight: 38, padding: "6px 16px", fontSize: 13.5 }} disabled={guardando} onClick={() => guardarNota("")}>
              Quitar nota
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
        {onEditar && <button type="button" className="btn btn-ghost" onClick={() => onEditar(cliente)}>
          <Pencil size={14} aria-hidden="true" /> Editar datos
        </button>}
        {onNuevaCita && (
          <button type="button" className="btn btn-gold" onClick={() => onNuevaCita(cliente.id)}>
            <Plus size={14} aria-hidden="true" /> Nueva cita
          </button>
        )}
      </div>

      <h3 style={{ fontSize: 15.5, marginBottom: 8 }}>Historial de citas ({suyas.length})</h3>
      {suyas.length === 0 && <div style={{ color: MUTED, fontSize: 13.5 }}>Todavía no tiene citas.</div>}
      <div style={{ maxHeight: "36vh", overflowY: "auto", paddingRight: 4 }}>
        {suyas.map((c) => (
          <div key={c.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--line)", fontSize: 13.5 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <span>
                <strong>{fecha(c.fecha)}</strong> · {hora(c.inicio)} · {nombreServicios(c)} · {nombreEmpleada(c)}
              </span>
              <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <Estado cita={c} />
                <strong>{euros(calcularTotal(c, servicios, productos))}</strong>
              </span>
            </div>
            {c.notas && (
              <div style={{ display: "flex", gap: 6, alignItems: "flex-start", marginTop: 4, color: MUTED }}>
                <StickyNote size={13} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
                <span>{c.notas}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </ModalShell>
  );
}
