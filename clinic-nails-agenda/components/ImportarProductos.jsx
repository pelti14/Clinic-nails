"use client";

// Importar productos de un archivo CSV (Excel) o JSON: 1) elegir archivo · 2) ver qué va a pasar · 3) confirmar
import React, { useState } from "react";
import { leerProductos, planDeImportacionProductos } from "../lib/productosImport";

const nota = { fontSize: 13, color: "rgba(var(--ink-rgb),0.74)" };
const lista = (xs, n = 8) => xs.slice(0, n).map((x) => x.nombre).join(", ") + (xs.length > n ? ` … y ${xs.length - n} más` : "");

export default function ImportarProductosModal({ ui, productos, esAdmin, usado, onClose, onAplicar }) {
  const { ModalShell, Field } = ui;
  const [paso, setPaso] = useState("elegir"); // elegir | revisar | aplicando | hecho
  const [lectura, setLectura] = useState(null);
  const [error, setError] = useState("");
  const [archivo, setArchivo] = useState("");
  const [deCero, setDeCero] = useState(esAdmin);
  const [confirmando, setConfirmando] = useState(false);
  const [resumen, setResumen] = useState(null);

  async function elegir(ev) {
    const f = ev.target.files && ev.target.files[0];
    if (!f) return;
    setError("");
    setArchivo(f.name);
    try {
      const texto = await new Promise((ok, mal) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = () => mal(new Error("No se pudo leer el archivo.")); r.readAsText(f); });
      const l = leerProductos(texto, f.name);
      if (l.error) return setError(l.error);
      if (!l.productos.length) return setError("No se ha encontrado ningún producto válido en el archivo.");
      setLectura(l);
      setPaso("revisar");
    } catch (err) {
      setError(err.message);
    }
  }

  const modoCero = deCero && esAdmin;
  const plan = lectura ? planDeImportacionProductos({ existentes: productos, importados: lectura.productos, empezarDeCero: modoCero, usado }) : null;
  const hayBorrado = plan ? plan.borrar.length + plan.desactivar.length > 0 : false;
  const hayQueHacer = plan ? plan.crear.length + plan.reemplazar.length + plan.borrar.length + plan.desactivar.length > 0 : false;

  async function aplicar() {
    setConfirmando(false);
    setPaso("aplicando");
    setResumen(await onAplicar(plan));
    setPaso("hecho");
  }

  return (
    <ModalShell title="Importar productos" onClose={paso === "aplicando" ? () => {} : onClose} ancho={680}>
      <div data-importar-productos-modal="1">
        {paso === "elegir" && (
          <>
            <p style={{ marginTop: 0, ...nota }}>Elige un archivo <strong>.csv</strong> (el que guarda Excel) o <strong>.json</strong> con columnas <strong>nombre, precio, stock y activo</strong> (stock y activo son opcionales). Lo más fácil: <strong>exporta primero</strong> tus productos, edítalos en Excel y vuelve a importarlos.</p>
            <input type="file" accept=".csv,.json,.txt,text/csv,application/json" aria-label="Archivo de productos" onChange={elegir} />
            {error && <div role="alert" style={{ color: "var(--danger)", fontSize: 13.5, marginTop: 10 }}>{error}</div>}
          </>
        )}

        {paso === "revisar" && lectura && plan && (
          <>
            <div style={{ fontSize: 14, marginBottom: 10 }}>
              <strong>{archivo}</strong>: <strong>{lectura.productos.length}</strong> productos.
              {lectura.omitidos.length > 0 && <div style={{ color: "var(--danger)", marginTop: 4 }}>{lectura.omitidos.length} no se pueden importar: {lectura.omitidos.slice(0, 5).map((o) => `«${o.nombre}» (${o.motivo.toLowerCase()})`).join(", ")}{lectura.omitidos.length > 5 ? "…" : ""}</div>}
              {lectura.avisos.length > 0 && <div style={{ ...nota, marginTop: 4 }}>{lectura.avisos.slice(0, 3).join(" ")}</div>}
            </div>
            <Field label="¿Qué hacer con los productos que ya tienes?">
              <label style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6, opacity: esAdmin ? 1 : 0.5 }}>
                <input type="radio" name="modo-import-prod" aria-label="Empezar de cero" checked={modoCero} disabled={!esAdmin} onChange={() => setDeCero(true)} />
                <span><strong>Empezar de cero:</strong> eliminar los que no estén en el archivo{!esAdmin && " (solo el administrador)"}. Los que tengan ventas o citas no se borran (se perderían esas ventas): se desactivan.</span>
              </label>
              <label style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <input type="radio" name="modo-import-prod" aria-label="Solo añadir y reemplazar" checked={!modoCero} onChange={() => setDeCero(false)} />
                <span><strong>Solo añadir y reemplazar:</strong> los demás se quedan como están.</span>
              </label>
            </Field>
            <div style={{ ...nota, marginBottom: 12 }}>Si un producto del archivo ya existe (mismo nombre) se <strong>reemplaza</strong> su precio, stock y estado, conservando su historial de ventas. Si el archivo no trae stock, se queda el que había.</div>
            <div data-resumen-importacion-productos="1" style={{ background: "rgba(var(--ink-rgb),0.05)", borderRadius: 12, padding: "12px 14px", fontSize: 14 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Esto es lo que va a pasar:</div>
              <div data-n-crear="1">➕ Se crearán <strong>{plan.crear.length}</strong> productos nuevos</div>
              <div data-n-reemplazar="1">🔁 Se reemplazarán <strong>{plan.reemplazar.length}</strong> que ya existen{plan.reemplazar.length > 0 && <span style={nota}> ({lista(plan.reemplazar.map((r) => r.existente))})</span>}</div>
              {plan.iguales.length > 0 && <div>✓ {plan.iguales.length} ya están igual: no se tocan</div>}
              {modoCero && <div data-n-borrar="1">🗑 Se eliminarán <strong>{plan.borrar.length}</strong> productos actuales{plan.borrar.length > 0 && <span style={nota}> ({lista(plan.borrar)})</span>}</div>}
              {modoCero && plan.desactivar.length > 0 && <div data-n-desactivar="1">⏸ Se desactivarán <strong>{plan.desactivar.length}</strong> porque tienen ventas o citas<span style={nota}> ({lista(plan.desactivar)})</span></div>}
              {!modoCero && plan.sinTocar.length > 0 && <div>• {plan.sinTocar.length} productos actuales no están en el archivo y se quedan como están</div>}
            </div>
            {confirmando && (
              <div role="alert" data-confirmar-importacion="1" style={{ marginTop: 12, border: "1px solid var(--danger)", background: "rgba(220,38,38,0.07)", borderRadius: 12, padding: "12px 14px", fontSize: 14 }}>
                Vas a <strong>eliminar {plan.borrar.length}</strong>{plan.desactivar.length ? ` y desactivar ${plan.desactivar.length}` : ""} productos actuales. <strong>No se puede deshacer.</strong>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button type="button" className="btn btn-gold" onClick={aplicar}>Sí, importar</button>
                  <button type="button" className="btn btn-ghost" onClick={() => setConfirmando(false)}>Volver</button>
                </div>
              </div>
            )}
            {!confirmando && (
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
                <button type="button" className="btn btn-ghost" onClick={() => { setPaso("elegir"); setLectura(null); }}>Elegir otro archivo</button>
                <button type="button" className="btn btn-gold" data-importar="1" disabled={!hayQueHacer} onClick={() => (hayBorrado ? setConfirmando(true) : aplicar())}>Importar</button>
              </div>
            )}
          </>
        )}

        {paso === "aplicando" && <div role="status" style={{ padding: 18, textAlign: "center" }}>Importando productos…</div>}

        {paso === "hecho" && resumen && (
          <div data-importacion-hecha="1">
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{resumen.errores.length === 0 ? "Importación terminada ✓" : "Importación terminada con problemas"}</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
              <li>{resumen.creados} productos creados</li>
              <li>{resumen.reemplazados} reemplazados</li>
              {(resumen.borrados > 0 || resumen.desactivados > 0) && <li>{resumen.borrados} eliminados{resumen.desactivados ? ` · ${resumen.desactivados} desactivados (tenían ventas o citas)` : ""}</li>}
            </ul>
            {resumen.errores.length > 0 && <ul data-errores-importacion="1" style={{ color: "var(--danger)", fontSize: 13, paddingLeft: 18 }}>{resumen.errores.slice(0, 8).map((e, i) => <li key={i}>{e}</li>)}</ul>}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}><button type="button" className="btn btn-gold" onClick={onClose}>Cerrar</button></div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
