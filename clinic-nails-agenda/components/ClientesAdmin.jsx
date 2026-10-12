"use client";

// Sección «Clientes» (solo administrador): todos los clientes con sus etiquetas automáticas,
// búsqueda, filtros, edición, borrado, exportación e importación de listas (por ejemplo, de Fresha).

import React, { useMemo, useState } from "react";
import { Search, Heart, Pin, Pencil, Trash2, Upload, Download, UserPlus, Eye, History } from "lucide-react";
import { buscarClientes, resumenCliente, cumpleFiltro, parsearCSV, detectarColumnas, prepararImportacion, textoExportacion, textoNoImportadas, FORMATOS_EXPORTACION } from "../lib/clientes";
import { descargarTexto } from "../lib/descarga";
import { euros } from "../lib/informes";

const MUTED = "rgba(var(--ink-rgb),0.68)";
const fechaCorta = (iso) => (iso ? new Date(iso + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }) : "—");
const POR_PAGINA = 100;

export function Etiqueta({ e, pequena }) {
  const colores = {
    primera: ["rgba(21,112,239,0.14)", "var(--accent-text)"],
    recurrente: ["rgba(22,163,74,0.16)", "#166534"],
    categoria: ["rgba(var(--ink-rgb),0.08)", "var(--text)"],
    inactivo: ["rgba(217,119,6,0.16)", "#92400E"],
    sinvisitas: ["rgba(var(--ink-rgb),0.06)", MUTED],
  };
  const [bg, fg] = colores[e.tipo] || colores.categoria;
  return (
    <span title={e.ayuda || e.texto} style={{ display: "inline-block", background: bg, color: fg, fontWeight: 600, fontSize: pequena ? 10.5 : 11.5, padding: pequena ? "1px 6px" : "2px 8px", borderRadius: 999, whiteSpace: "nowrap" }}>
      {e.texto}
    </span>
  );
}

export default function ClientesAdmin({ ui, clientes, citas, servicios, hoy, calcularTotal, onNuevo, onEditar, onEliminar, onVerActividad, onVerPerfil, onToggleFavorito, onImportar, showToast }) {
  const { ModalShell, ConfirmDialog } = ui;
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [orden, setOrden] = useState("nombre");
  const [mostrar, setMostrar] = useState(POR_PAGINA);
  const [hub, setHub] = useState(null); // «importar» | «exportar» | null: la ventana de importar y exportar
  const [aEliminar, setAEliminar] = useState(null);

  const categorias = useMemo(() => [...new Set(servicios.map((s) => (s.categoria || "").trim() || "Otros"))].sort((a, b) => a.localeCompare(b, "es")), [servicios]);

  const filas = useMemo(() => {
    const porCliente = new Map();
    citas.forEach((c) => {
      if (!c.clienteId) return;
      if (!porCliente.has(c.clienteId)) porCliente.set(c.clienteId, []);
      porCliente.get(c.clienteId).push(c);
    });
    return clientes.map((c) => {
      const suyas = porCliente.get(c.id) || [];
      const resumen = resumenCliente(c, suyas, servicios, hoy);
      const gasto = suyas.filter((x) => x.estadoCobro === "cobrada" && (x.asistencia || "prevista") !== "cancelada").reduce((s, x) => s + calcularTotal(x), 0);
      return { c, resumen, gasto };
    });
  }, [clientes, citas, servicios, hoy, calcularTotal]);

  const contadores = useMemo(() => {
    const n = { todos: filas.length, primera: 0, recurrente: 0, inactivo: 0, sinvisitas: 0 };
    filas.forEach(({ resumen }) => {
      if (resumen.esPrimera) n.primera++;
      if (resumen.esRecurrente) n.recurrente++;
      if (resumen.inactivo) n.inactivo++;
      if (resumen.reservas === 0) n.sinvisitas++;
    });
    return n;
  }, [filas]);

  const visibles = useMemo(() => {
    const ids = new Set(buscarClientes(clientes, busqueda).map((c) => c.id));
    const ordenBusqueda = new Map(buscarClientes(clientes, busqueda).map((c, i) => [c.id, i]));
    const lista = filas.filter(({ c, resumen }) => ids.has(c.id) && cumpleFiltro(filtro, c, resumen));
    const cmp = {
      nombre: (a, b) => a.c.nombre.localeCompare(b.c.nombre, "es"),
      ultima: (a, b) => (b.resumen.ultima || "").localeCompare(a.resumen.ultima || "") || a.c.nombre.localeCompare(b.c.nombre, "es"),
      visitas: (a, b) => b.resumen.reservas - a.resumen.reservas || a.c.nombre.localeCompare(b.c.nombre, "es"),
      gasto: (a, b) => b.gasto - a.gasto || a.c.nombre.localeCompare(b.c.nombre, "es"),
      recientes: (a, b) => String(b.c.creadoEn || "").localeCompare(String(a.c.creadoEn || "")),
    }[orden];
    return busqueda.trim() ? lista.sort((a, b) => ordenBusqueda.get(a.c.id) - ordenBusqueda.get(b.c.id)) : lista.sort(cmp);
  }, [filas, clientes, busqueda, filtro, orden]);

  const chip = (valor, texto, n) => (
    <button
      key={valor} type="button" onClick={() => { setFiltro(valor); setMostrar(POR_PAGINA); }}
      aria-pressed={filtro === valor}
      className={filtro === valor ? "btn btn-gold" : "btn btn-ghost"}
      style={{ minHeight: 34, padding: "4px 12px", fontSize: 13 }}
    >
      {texto}{n !== undefined ? ` · ${n}` : ""}
    </button>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, marginBottom: 4 }}>Clientes</h1>
          <p style={{ color: MUTED, margin: 0, fontSize: 14 }}>
            Todos los clientes aparecen aquí al darse de alta o al reservar. Las etiquetas se ponen solas según sus visitas y los servicios que se hacen.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="btn btn-ghost" data-importar-exportar="1" onClick={() => setHub("importar")}><Upload size={15} /> Importar / Exportar</button>
          <button type="button" className="btn btn-gold" onClick={onNuevo}><UserPlus size={15} /> Nuevo cliente</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }} role="group" aria-label="Filtrar por etiqueta">
        {chip("todos", "Todos", contadores.todos)}
        {chip("primera", "Primera visita", contadores.primera)}
        {chip("recurrente", "Recurrentes", contadores.recurrente)}
        {chip("inactivo", "Inactivos", contadores.inactivo)}
        {chip("sinvisitas", "Sin visitas", contadores.sinvisitas)}
        {chip("favorito", "Favoritos")}
        {chip("nota", "Con nota fija")}
        {categorias.map((cat) => chip(`cat:${cat}`, `Cliente de ${cat}`))}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <div style={{ position: "relative", flex: "1 1 260px", maxWidth: 380 }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: 12, color: MUTED }} aria-hidden="true" />
          <input
            className="input" style={{ paddingLeft: 34 }} aria-label="Buscar cliente"
            placeholder="Nombre, parte del teléfono o email…" value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setMostrar(POR_PAGINA); }}
          />
        </div>
        <select className="input" style={{ maxWidth: 220 }} aria-label="Ordenar por" value={orden} onChange={(e) => setOrden(e.target.value)}>
          <option value="nombre">Ordenar: nombre (A-Z)</option>
          <option value="ultima">Ordenar: última visita</option>
          <option value="visitas">Ordenar: más visitas</option>
          <option value="gasto">Ordenar: mayor gasto</option>
          <option value="recientes">Ordenar: recién añadidos</option>
        </select>
      </div>

      <div className="card" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
          <thead>
            <tr style={{ background: "rgba(var(--ink-rgb),0.04)", textAlign: "left" }}>
              {["", "Cliente", "Teléfono", "Etiquetas", "Visitas", "Última visita", "Gasto", ""].map((h, i) => (
                <th key={i} style={{ padding: "10px 14px", fontWeight: 500, color: MUTED, fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibles.length === 0 && (
              <tr><td colSpan={8} style={{ padding: 18, textAlign: "center", color: MUTED }}>{clientes.length ? "Ningún cliente coincide con la búsqueda o el filtro." : "Todavía no hay clientes. Se añadirán solos al reservar, o pulsa «Importar»."}</td></tr>
            )}
            {visibles.slice(0, mostrar).map(({ c, resumen, gasto }) => (
              <tr key={c.id} style={{ borderTop: "1px solid var(--line)" }}>
                <td style={{ padding: "10px 14px" }}>
                  <button type="button" onClick={() => onToggleFavorito(c.id)} aria-label={c.favorito ? `Quitar de favoritos a ${c.nombre}` : `Marcar como favorito a ${c.nombre}`} style={{ background: "transparent", border: "none", padding: 0, display: "flex", cursor: "pointer" }}>
                    <Heart size={15} style={{ fill: c.favorito ? "var(--accent)" : "none", stroke: c.favorito ? "var(--accent)" : "rgba(var(--ink-rgb),0.45)" }} />
                  </button>
                </td>
                <td style={{ padding: "10px 14px", fontWeight: 500 }}>
                  <button type="button" className="link-btn" onClick={() => onVerPerfil(c.id)} title="Ver la ficha y el historial">{c.nombre}</button>
                  {c.notaFija && <Pin size={12} style={{ marginLeft: 6, color: "var(--accent-text)" }} aria-label="Tiene nota fija" />}
                  {c.email && <div style={{ fontSize: 12, color: MUTED, fontWeight: 400 }}>{c.email}</div>}
                </td>
                <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>{c.telefono || "—"}</td>
                <td style={{ padding: "10px 14px" }}>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{resumen.etiquetas.map((e, i) => <Etiqueta key={i} e={e} />)}</div>
                </td>
                <td style={{ padding: "10px 14px", textAlign: "center" }}>{resumen.visitas}{resumen.proxima ? <div style={{ fontSize: 11.5, color: MUTED }}>+1 próxima</div> : null}</td>
                <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>{fechaCorta(resumen.ultima)}</td>
                <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>{gasto ? euros(gasto) : "—"}</td>
                <td style={{ padding: "6px 10px", whiteSpace: "nowrap" }}>
                  <button type="button" className="btn-ghost" style={{ border: "none", padding: 6 }} onClick={() => onVerPerfil(c.id)} aria-label={`Ver ficha de ${c.nombre}`} title="Ver ficha e historial"><Eye size={15} /></button>
                  {onVerActividad && <button type="button" className="btn-ghost" style={{ border: "none", padding: 6 }} onClick={() => onVerActividad(c)} aria-label={`Ver actividad de ${c.nombre}`} title="Ver actividad de este cliente"><History size={15} /></button>}
                  <button type="button" className="btn-ghost" style={{ border: "none", padding: 6 }} onClick={() => onEditar(c)} aria-label={`Editar a ${c.nombre}`} title="Editar"><Pencil size={15} /></button>
                  <button type="button" className="btn-ghost" style={{ border: "none", padding: 6, color: "var(--danger)" }} onClick={() => setAEliminar(c)} aria-label={`Eliminar a ${c.nombre}`} title="Eliminar"><Trash2 size={15} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, fontSize: 13, color: MUTED, flexWrap: "wrap", gap: 8 }}>
        <span>{visibles.length} de {clientes.length} clientes</span>
        {visibles.length > mostrar && <button type="button" className="btn btn-ghost" onClick={() => setMostrar((m) => m + POR_PAGINA)}>Mostrar {Math.min(POR_PAGINA, visibles.length - mostrar)} más</button>}
      </div>

      {aEliminar && (
        <ConfirmDialog
          titulo={`¿Eliminar a ${aEliminar.nombre}?`}
          mensaje="Se borra su ficha. Sus citas anteriores se conservan (y los informes de ventas no cambian), pero dejarán de estar enlazadas a este cliente. No se puede deshacer."
          textoConfirmar="Eliminar cliente" textoCancelar="No, conservar" peligroso
          onCancelar={() => setAEliminar(null)}
          onConfirmar={async () => {
            const c = aEliminar;
            setAEliminar(null);
            await onEliminar(c);
          }}
        />
      )}

      {hub && <ImportarExportarClientes ui={ui} clientes={clientes} filas={filas} visibles={visibles} hoy={hoy} inicial={hub} onClose={() => setHub(null)} onImportar={onImportar} showToast={showToast} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Importación guiada de una lista (CSV)
// ---------------------------------------------------------------------------

function PanelImportar({ ui, clientes, onClose, onImportar, showToast }) {
  const { Field } = ui;
  const [texto, setTexto] = useState("");
  const [archivo, setArchivo] = useState("");
  const [mapeo, setMapeo] = useState(null);
  const [notasElegido, setNotasElegido] = useState(null); // por defecto, las notas se guardan como nota fija (se ven al abrir sus citas)
  const notasComoNotaFija = notasElegido ?? true;
  const [completarOn, setCompletarOn] = useState(true);
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState("");

  const parsed = useMemo(() => (texto.trim() ? parsearCSV(texto) : null), [texto]);
  const mapa = mapeo || (parsed ? detectarColumnas(parsed.cabeceras) : null);
  const prep = useMemo(() => (parsed && mapa && mapa.nombre >= 0 ? prepararImportacion(parsed.filas, mapa, clientes, { notasComoNotaFija }) : null), [parsed, mapa, clientes, notasComoNotaFija]);

  async function cargarArchivo(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setError("");
    if (f.size > 8 * 1024 * 1024) return setError("El archivo es demasiado grande (máximo 8 MB).");
    try {
      setTexto(await f.text());
      setArchivo(f.name);
      setMapeo(null);
    } catch (err) {
      setError("No se pudo leer el archivo. Prueba a guardarlo como CSV desde Excel o pega su contenido abajo.");
    }
  }

  async function importar() {
    setTrabajando(true);
    setError("");
    try {
      const aCompletar = completarOn ? prep.completar : [];
      const n = await onImportar(prep.nuevos, aCompletar);
      showToast(`Importados ${n} clientes.${aCompletar.length ? ` Completados los datos de ${aCompletar.length} que ya existían.` : ""}`, "ok");
      onClose();
    } catch (err) {
      setError(`${err?.message || "No se pudo importar."} Puede que se hayan guardado algunos: vuelve a subir el MISMO archivo y las que ya están se saltan solas como repetidas.`);
    } finally {
      setTrabajando(false);
    }
  }

  const opcionesColumna = (parsed?.cabeceras || []).map((h, i) => <option key={i} value={i}>{h || `(columna ${i + 1})`}</option>);
  const selector = (clave, etiqueta, obligatorio) => (
    <Field label={`${etiqueta}${obligatorio ? "" : " (opcional)"}`}>
      <select className="input" aria-label={`Columna de ${etiqueta}`} value={mapa[clave]} onChange={(e) => setMapeo({ ...mapa, [clave]: Number(e.target.value) })}>
        <option value={-1}>— no importar —</option>
        {opcionesColumna}
      </select>
    </Field>
  );

  return (
    <div data-panel-importar="1">
      <p style={{ fontSize: 13.5, color: MUTED, marginTop: -4 }}>
        Sube la lista en CSV (por ejemplo, la que exportas desde Fresha o desde Excel). Se reconocen solas las columnas de nombre, teléfono y email, y no se importan los clientes que ya existen (mismo teléfono o email).
      </p>

      <Field label="Archivo CSV">
        <input type="file" accept=".csv,.txt,text/csv" aria-label="Archivo CSV" onChange={cargarArchivo} />
        {archivo && <div style={{ fontSize: 12.5, color: MUTED, marginTop: 4 }}>{archivo}</div>}
      </Field>
      <Field label="…o pega aquí el contenido">
        <textarea className="input" rows={3} aria-label="Contenido del CSV" placeholder={"Nombre;Teléfono;Email\nAna López;600111222;ana@correo.com"} value={texto} onChange={(e) => { setTexto(e.target.value); setMapeo(null); setArchivo(""); }} style={{ fontFamily: "monospace", fontSize: 12.5 }} />
      </Field>
      {error && <div role="alert" style={{ color: "var(--danger)", fontSize: 13, marginBottom: 10 }}>{error}</div>}

      {parsed && parsed.filas.length === 0 && <div style={{ fontSize: 13.5, color: "var(--danger)" }}>No se han encontrado filas de datos en el archivo.</div>}

      {parsed && parsed.filas.length > 0 && mapa && (
        <>
          <div style={{ fontSize: 13, color: MUTED, margin: "6px 0 8px" }}>{parsed.filas.length} filas leídas. Comprueba que las columnas son las correctas:</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "0 14px" }}>
            {selector("nombre", "Nombre", true)}
            {selector("apellidos", "Apellidos")}
            {selector("telefono", "Teléfono (móvil)")}
            {selector("telefono2", "Teléfono alternativo")}
            {selector("email", "Email")}
            {selector("notas", "Notas")}
          </div>
          {mapa.notas >= 0 && (
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, marginBottom: 10 }}>
              <input type="checkbox" checked={notasComoNotaFija} onChange={(e) => setNotasElegido(e.target.checked)} />
              Guardar las notas del archivo como «nota fija» del cliente (se verán al abrir sus citas)
            </label>
          )}
          {mapa.nombre < 0 && <div role="alert" style={{ color: "var(--danger)", fontSize: 13 }}>Elige qué columna contiene el nombre.</div>}

          {prep && (
            <div className="card" style={{ padding: 14, marginTop: 8 }} aria-live="polite">
              <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 6 }}>
                Se importarán <span style={{ color: "var(--accent-text)" }}>{prep.nuevos.length}</span> clientes nuevos
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.7, color: MUTED }}>
                <li>{prep.duplicados.length} ya existen o están repetidos en el archivo (no se importan)</li>
                {prep.invalidos.length > 0 && <li>{prep.invalidos.length} filas sin nombre (no se importan{prep.invalidos.length <= 5 ? `: líneas ${prep.invalidos.map((x) => x.linea).join(", ")}` : ""})</li>}
                {prep.sinTelefono > 0 && <li>{prep.sinTelefono} nuevos no tienen teléfono (podrás completarlo después)</li>}
              </ul>
              {prep.completar.length > 0 && (
                <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13.5, marginTop: 10 }}>
                  <input type="checkbox" aria-label="Completar los datos de las clientas que ya existen" style={{ marginTop: 3 }} checked={completarOn} onChange={(e) => setCompletarOn(e.target.checked)} />
                  <span>Completar los datos que faltan de <strong>{prep.completar.length}</strong> clientas que ya existen (email, teléfono o nota). Nunca se pisa lo que ya tienen.</span>
                </label>
              )}
              {prep.sinContacto > 0 && <div data-aviso-sin-contacto="1" style={{ fontSize: 12.5, color: "#92400E", marginTop: 8 }}>{prep.sinContacto} nuevas no tienen ni teléfono ni email: no se pueden reconocer, así que si vuelves a importar este archivo se duplicarían.</div>}
              {prep.duplicados.length + prep.invalidos.length > 0 && (
                <button type="button" className="btn btn-ghost" data-descargar-no-importadas="1" style={{ marginTop: 10, minHeight: 34 }} onClick={() => descargarTexto("clientes-no-importados.csv", textoNoImportadas({ cabeceras: parsed.cabeceras, prep }), "text/csv")}>Descargar las {prep.duplicados.length + prep.invalidos.length} filas que no se importan (con el motivo)</button>
              )}
              {prep.nuevos.length > 0 && (
                <div style={{ marginTop: 10, fontSize: 12.5 }}>
                  <div style={{ color: MUTED, marginBottom: 4 }}>Vista previa:</div>
                  {prep.nuevos.slice(0, 5).map((c, i) => <div key={i}>{c.nombre} · {c.telefono || "sin teléfono"}{c.email ? ` · ${c.email}` : ""}</div>)}
                  {prep.nuevos.length > 5 && <div style={{ color: MUTED }}>…y {prep.nuevos.length - 5} más</div>}
                </div>
              )}
              {prep.duplicados.length > 0 && (
                <details style={{ marginTop: 10, fontSize: 12.5 }}>
                  <summary style={{ cursor: "pointer", color: MUTED }}>Ver los que no se importan por repetidos</summary>
                  {prep.duplicados.slice(0, 20).map((d, i) => <div key={i}>{d.fila.nombre} — {d.motivo}{d.existente ? ` (ya existe: ${d.existente.nombre})` : ""}</div>)}
                </details>
              )}
            </div>
          )}
        </>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button type="button" className="btn btn-gold" data-importar-clientes="1" onClick={importar} disabled={!prep || (prep.nuevos.length === 0 && !(completarOn && prep.completar.length > 0)) || trabajando}>
          {trabajando ? "Importando…" : `Importar ${prep ? prep.nuevos.length : 0} clientes${prep && completarOn && prep.completar.length ? ` y completar ${prep.completar.length}` : ""}`}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Exportar: CSV para Excel o para importar en otro programa
// ---------------------------------------------------------------------------
function PanelExportar({ filas, visibles, hoy, onClose, showToast }) {
  const [formato, setFormato] = useState("completo");
  const [alcance, setAlcance] = useState("todos");
  const [separador, setSeparador] = useState(";");
  const hayFiltro = visibles.length !== filas.length;
  const lista = alcance === "visibles" && hayFiltro ? visibles : [...filas].sort((a, b) => a.c.nombre.localeCompare(b.c.nombre, "es"));
  function descargar() {
    descargarTexto(`${FORMATOS_EXPORTACION[formato].archivo}-${hoy}.csv`, textoExportacion({ filas: lista, formato, separador }), "text/csv");
    showToast(`Exportados ${lista.length} clientes.`, "ok");
  }
  const radio = (valor, actual, set, etiqueta, ayuda, aria) => (
    <label style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 0", cursor: "pointer", fontSize: 14 }}>
      <input type="radio" aria-label={aria} style={{ marginTop: 3 }} checked={actual === valor} onChange={() => set(valor)} />
      <span><strong>{etiqueta}</strong>{ayuda && <span style={{ display: "block", fontSize: 12.5, color: MUTED }}>{ayuda}</span>}</span>
    </label>
  );
  return (
    <div data-panel-exportar="1">
      <p style={{ fontSize: 13.5, color: MUTED, marginTop: -4 }}>Descarga tu lista de clientes en un archivo CSV: para abrirla en Excel, hacer una copia de seguridad o llevártela a otro programa (por ejemplo, Fresha).</p>
      <div style={{ fontWeight: 700, margin: "6px 0 2px" }}>¿Qué formato?</div>
      {Object.entries(FORMATOS_EXPORTACION).map(([id, f]) => <React.Fragment key={id}>{radio(id, formato, setFormato, f.nombre, f.ayuda, `Formato: ${f.nombre}`)}</React.Fragment>)}
      {hayFiltro && (
        <>
          <div style={{ fontWeight: 700, margin: "10px 0 2px" }}>¿Cuáles?</div>
          {radio("todos", alcance, setAlcance, `Todos los clientes (${filas.length})`, "", "Exportar todos los clientes")}
          {radio("visibles", alcance, setAlcance, `Solo los que se ven ahora con tu búsqueda o filtro (${visibles.length})`, "", "Exportar solo los que se ven")}
        </>
      )}
      <div style={{ fontWeight: 700, margin: "10px 0 4px" }}>Separador de columnas</div>
      <select className="input" aria-label="Separador de columnas" value={separador} onChange={(e) => setSeparador(e.target.value)} style={{ maxWidth: 360 }}>
        <option value=";">Punto y coma (Excel en español)</option>
        <option value=",">Coma (formato estándar; Fresha y Google Sheets)</option>
      </select>
      <p data-resumen-exportar="1" style={{ fontSize: 13, color: MUTED, margin: "12px 0 0" }}>Se exportarán <strong>{lista.length}</strong> {lista.length === 1 ? "cliente" : "clientes"}. El archivo se abre bien en Excel (acentos y ñ incluidos).</p>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cerrar</button>
        <button type="button" className="btn btn-gold" data-descargar-clientes="1" onClick={descargar} disabled={lista.length === 0}><Download size={15} /> Descargar CSV</button>
      </div>
    </div>
  );
}

// La ventana de importar y exportar, con sus dos pestañas
function ImportarExportarClientes({ ui, clientes, filas, visibles, hoy, inicial, onClose, onImportar, showToast }) {
  const { ModalShell } = ui;
  const [tab, setTab] = useState(inicial || "importar");
  return (
    <ModalShell title="Importar y exportar clientes" onClose={onClose} ancho={720}>
      <div role="tablist" aria-label="Importar o exportar" style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {[["importar", "Importar clientes", Upload], ["exportar", "Exportar clientes", Download]].map(([id, texto, Icono]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} data-tab-clientes={id} className={`btn ${tab === id ? "btn-gold" : "btn-ghost"}`} onClick={() => setTab(id)}><Icono size={15} /> {texto}</button>
        ))}
      </div>
      {tab === "importar" ? <PanelImportar ui={ui} clientes={clientes} onClose={onClose} onImportar={onImportar} showToast={showToast} /> : <PanelExportar filas={filas} visibles={visibles} hoy={hoy} onClose={onClose} showToast={showToast} />}
    </ModalShell>
  );
}

