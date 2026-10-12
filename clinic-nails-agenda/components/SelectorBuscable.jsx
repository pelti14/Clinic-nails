"use client";

// Elegir UNA cosa de una lista larga (productos, bonos…) escribiendo para buscar: sustituye al desplegable nativo, que no se puede buscar.
// La lista se desplaza dentro de su caja (nunca crece sin límite). Teclado: escribir filtra · ↑↓ mueven · Intro elige · Esc cierra.
import React, { useMemo, useRef, useState } from "react";
import { normalizarTexto } from "../lib/agenda";

export default function SelectorBuscable({ opciones, valor, onChange, ariaLabel, placeholder = "Escribe para buscar…", vacio = "Sin resultados", style }) {
  const [abierto, setAbierto] = useState(false);
  const [q, setQ] = useState("");
  const [activa, setActiva] = useState(0);
  const refInput = useRef(null);
  const actual = opciones.find((o) => o.id === valor);
  const filtradas = useMemo(() => {
    const t = normalizarTexto(q);
    return t ? opciones.filter((o) => normalizarTexto(`${o.etiqueta} ${o.detalle || ""}`).includes(t)) : opciones;
  }, [opciones, q]);
  const elegir = (o) => { onChange(o.id); setAbierto(false); setQ(""); refInput.current?.blur(); };
  const teclas = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setAbierto(true); setActiva((i) => Math.min(i + 1, filtradas.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiva((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && abierto && filtradas[activa]) { e.preventDefault(); elegir(filtradas[activa]); }
    else if (e.key === "Escape" && abierto) { e.stopPropagation(); setAbierto(false); setQ(""); }
  };
  return (
    <div style={{ position: "relative", ...style }}>
      <input
        ref={refInput} className="input" role="combobox" aria-expanded={abierto} aria-autocomplete="list" aria-label={ariaLabel}
        value={abierto ? q : actual ? actual.etiqueta : ""} placeholder={actual ? actual.etiqueta : placeholder} autoComplete="off"
        onFocus={() => { setAbierto(true); setQ(""); setActiva(0); }}
        onBlur={() => setTimeout(() => setAbierto(false), 120)}
        onChange={(e) => { setQ(e.target.value); setAbierto(true); setActiva(0); }}
        onKeyDown={teclas}
      />
      {abierto && (
        <ul role="listbox" aria-label={`Resultados: ${ariaLabel}`} data-selector-lista="1" style={{ position: "absolute", left: 0, right: 0, top: "calc(100% + 4px)", zIndex: 30, margin: 0, padding: 4, listStyle: "none", maxHeight: 240, overflowY: "auto", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, boxShadow: "0 10px 30px rgba(0,0,0,0.15)" }}>
          {filtradas.length === 0 && <li style={{ padding: "8px 10px", fontSize: 13.5, opacity: 0.7 }}>{vacio}</li>}
          {filtradas.map((o, i) => (
            <li key={o.id} role="option" aria-selected={o.id === valor} data-opcion={o.id}
              onMouseDown={(e) => { e.preventDefault(); elegir(o); }} onMouseEnter={() => setActiva(i)}
              style={{ padding: "8px 10px", borderRadius: 8, fontSize: 14, cursor: "pointer", background: i === activa ? "rgba(var(--ink-rgb),0.07)" : "transparent", fontWeight: o.id === valor ? 700 : 400 }}>
              {o.etiqueta}{o.detalle && <span style={{ opacity: 0.65, fontSize: 12.5 }}> · {o.detalle}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
