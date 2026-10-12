"use client";

// Elegir el servicio de una cita con el mismo aspecto del catálogo: categorías con su contador, tarjetas con descripción, duración y
// precio, y un buscador (por nombre, categoría o descripción). Se adapta al tamaño: en pantallas estrechas las categorías pasan a una
// fila que se desliza y las tarjetas van de una en una. Teclado: escribir filtra · ↑↓ mueven · Intro elige · Esc vuelve.

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, Check } from "lucide-react";
import { normalizarTexto } from "../lib/agenda";

const MUTED = "rgba(var(--ink-rgb),0.68)";
const COLOR_DEFECTO = "#B4863C";
export const TEXTO_AYUDA_TECLAS = "↑ ↓ para moverte · Intro para elegir · Esc para volver";

// ¿Pantalla estrecha? (móvil o ventana pequeña)
function useEstrecho(limite = 720) {
  const [estrecho, setEstrecho] = useState(() => typeof window !== "undefined" && window.innerWidth < limite);
  useEffect(() => {
    const alCambiar = () => setEstrecho(window.innerWidth < limite);
    window.addEventListener("resize", alCambiar);
    return () => window.removeEventListener("resize", alCambiar);
  }, [limite]);
  return estrecho;
}

export default function SelectorServicios({ ui, servicios, anadidos = [], hayEmpleada = false, onElegir, onClose }) {
  const { ModalShell } = ui;
  const estrecho = useEstrecho();
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState(null); // null = todas
  const [resalte, setResalte] = useState(0);
  const refActiva = useRef(null);

  const texto = normalizarTexto(busqueda);
  const coincide = (sv) => !texto || normalizarTexto(`${sv.nombre} ${sv.categoria || ""} ${sv.descripcion || ""}`).includes(texto);
  const nombreCat = (sv) => sv.categoria || "Otros";

  // Las categorías en el orden en que ya vienen los servicios (el del catálogo), con cuántos servicios coinciden en cada una
  const categorias = useMemo(() => {
    const lista = [];
    servicios.forEach((sv) => {
      const n = nombreCat(sv);
      let c = lista.find((x) => x.nombre === n);
      if (!c) lista.push((c = { nombre: n, total: 0 }));
      if (coincide(sv)) c.total++;
    });
    return lista;
  }, [servicios, texto]); // eslint-disable-line react-hooks/exhaustive-deps

  const visibles = servicios.filter((sv) => coincide(sv) && (categoria === null || nombreCat(sv) === categoria));
  // En «Todas» y sin buscar se separan por categoría, con su título; si no, una sola lista
  const agrupar = categoria === null && !texto;
  const grupos = [];
  visibles.forEach((sv) => {
    const n = nombreCat(sv);
    let g = grupos.find((x) => x.nombre === n);
    if (!g) grupos.push((g = { nombre: n, items: [] }));
    g.items.push(sv);
  });
  const plana = grupos.flatMap((g) => g.items); // el mismo orden en que se pintan, para las flechas

  useEffect(() => { if (refActiva.current?.scrollIntoView) refActiva.current.scrollIntoView({ block: "nearest" }); }, [resalte, categoria, texto]);

  const cambiarCategoria = (n) => { setCategoria(n); setResalte(0); };
  const alTeclear = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setResalte((i) => Math.min(i + 1, plana.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setResalte((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && plana[resalte]) { e.preventDefault(); onElegir(plana[resalte]); }
  };

  let indice = -1;
  const tarjeta = (sv) => {
    indice += 1;
    const miIndice = indice;
    const activa = miIndice === resalte;
    const ya = anadidos.includes(sv.id);
    return (
      <button
        key={sv.id} type="button" role="option" aria-selected={activa} data-servicio-opcion={sv.id}
        ref={activa ? refActiva : undefined}
        onMouseEnter={() => setResalte(miIndice)}
        onClick={() => onElegir(sv)}
        style={{ display: "flex", flexDirection: "column", gap: 6, textAlign: "left", padding: "12px 14px 12px 16px", borderRadius: 14, position: "relative", overflow: "hidden", minHeight: 96,
          background: activa ? "rgba(var(--accent-rgb),0.12)" : "var(--surface)", border: `1px solid ${activa ? "var(--accent)" : "var(--line)"}`, cursor: "pointer" }}
      >
        <span aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 5, background: sv.color || COLOR_DEFECTO }} />
        <span style={{ fontWeight: 600, fontSize: 14.5, display: "flex", alignItems: "center", gap: 6, lineHeight: 1.25 }}>
          {sv.nombre}
          {ya && <Check size={14} color="var(--accent)" aria-label="Ya añadido" />}
        </span>
        {sv.descripcion && <span style={{ fontSize: 12.5, color: MUTED, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{sv.descripcion}</span>}
        <span style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, paddingTop: 4 }}>
          <span style={{ fontSize: 12.5, color: MUTED, background: "rgba(var(--ink-rgb),0.07)", borderRadius: 999, padding: "2px 9px" }}>{sv.duracion} min</span>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{sv.precio} €</span>
        </span>
      </button>
    );
  };

  const botonCategoria = (nombre, total, activa, etiqueta) => (
    <button
      key={etiqueta} type="button" data-categoria-servicio={etiqueta} aria-pressed={activa} onClick={() => cambiarCategoria(nombre)}
      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, textAlign: "left", padding: estrecho ? "6px 12px" : "9px 12px", borderRadius: estrecho ? 999 : 10, flexShrink: 0, whiteSpace: estrecho ? "nowrap" : "normal",
        border: estrecho ? `1px solid ${activa ? "var(--accent)" : "var(--line)"}` : "none", background: activa ? "rgba(var(--accent-rgb),0.14)" : estrecho ? "var(--surface)" : "transparent", fontWeight: activa ? 700 : 500, fontSize: 14, opacity: total === 0 && texto ? 0.45 : 1 }}
    >
      <span>{etiqueta}</span>
      <span style={{ background: "rgba(var(--ink-rgb),0.08)", borderRadius: 999, minWidth: 22, height: 22, padding: "0 6px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>{total}</span>
    </button>
  );
  const totalCoinciden = servicios.filter(coincide).length;

  return (
    <ModalShell title="Seleccionar servicio" onClose={onClose} ancho={1000}>
      <div data-selector-servicios="1">
        <div style={{ position: "relative", marginBottom: 6 }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: 15, color: MUTED }} aria-hidden="true" />
          <input
            autoFocus className="input" style={{ paddingLeft: 34 }} aria-label="Buscar servicio" placeholder="Escribe el nombre del servicio…" value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setResalte(0); }}
            onKeyDown={alTeclear}
          />
        </div>
        <div style={{ fontSize: 12, color: MUTED, marginBottom: 12 }}>{TEXTO_AYUDA_TECLAS}</div>

        <div style={{ display: "flex", flexDirection: estrecho ? "column" : "row", gap: estrecho ? 10 : 18, alignItems: "stretch" }}>
          {/* categorías */}
          <nav aria-label="Categorías" data-categorias-servicios="1" style={estrecho
            ? { display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, WebkitOverflowScrolling: "touch" }
            : { width: 220, flexShrink: 0, display: "flex", flexDirection: "column", gap: 2, maxHeight: "min(60vh, 560px)", overflowY: "auto", paddingRight: 4 }}>
            {botonCategoria(null, totalCoinciden, categoria === null, "Todas")}
            {categorias.map((c) => botonCategoria(c.nombre, c.total, categoria === c.nombre, c.nombre))}
          </nav>

          {/* servicios */}
          <div role="listbox" aria-label="Servicios" style={{ flex: 1, minWidth: 0, maxHeight: "min(60vh, 560px)", overflowY: "auto", paddingRight: 4 }}>
            {plana.length === 0 && (
              <div style={{ textAlign: "center", color: MUTED, fontSize: 13, padding: 24 }}>
                {hayEmpleada && !texto && servicios.length === 0 ? "Esta empleada no tiene servicios asignados." : "No hay servicios que coincidan."}
              </div>
            )}
            {grupos.map((g) => (
              <div key={g.nombre} style={{ marginBottom: 16 }}>
                {agrupar && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "2px 0 8px" }}>
                    <span style={{ fontWeight: 600, fontSize: 14.5 }}>{g.nombre}</span>
                    <span style={{ background: "rgba(var(--ink-rgb),0.08)", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>{g.items.length}</span>
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: estrecho ? "1fr" : "repeat(auto-fill, minmax(215px, 1fr))", gap: 10 }}>
                  {g.items.map(tarjeta)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
