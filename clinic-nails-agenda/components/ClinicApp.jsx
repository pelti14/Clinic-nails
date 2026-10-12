"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { COLOR_SERVICIO_POR_DEFECTO, colorPorDefecto, tinteDeColor, aplicarTema, TEMA_POR_DEFECTO, normalizarTema, claveCategoria } from "../lib/theme";
import { inyectarEtiquetas } from "../lib/etiquetas";
import { buscarClientes, claveTelefono, resumenCliente, primeraCitaPorCliente } from "../lib/clientes";
import { puedeAnularCobros } from "../lib/permisos";
import BonosSeccion, { BonoModal, VentaRapida, PlazoModal } from "./Bonos";
import ActividadSeccion, { ActividadModal, MenuPuntos } from "./Actividad";
import { leerServicios, planDeImportacion, servicioNuevo, cambiosDeReemplazo } from "../lib/serviciosImport";
import { listaCategorias, ordenarServicios, moverId, moverPasos, posiciones, duracionLegible, exportarServicios, serviciosDeCategoria, existeCategoria } from "../lib/serviciosCatalogo";
import { descargarJSON, descargarTexto } from "../lib/descarga";
import { productoNuevo, cambiosDeReemplazoProducto, exportarProductosJSON, exportarProductosCSV } from "../lib/productosImport";
import ImportarProductosModal from "./ImportarProductos";
import Cursos from "./Cursos";
import BotGHL from "./BotGHL";
import SelectorBuscable from "./SelectorBuscable";
import SelectorServicios from "./SelectorServicios";
import AvisosAdmin, { AvisosPopup } from "./Avisos";
import { avisosParaMostrar, filaVisto } from "../lib/avisos";
import Marketing from "./Marketing";
import HorariosGHL from "./HorariosGHL";
import PorRevisar from "./PorRevisar";
import { citasPorRevisar, corregirServicio, notaRevisada } from "../lib/porRevisar";
import { citasNuevas, marcaVistas, claveMarca } from "../lib/novedadesAgenda";
import PrimeraConfiguracion from "./PrimeraConfiguracion";
import { DAY_START, DAY_END, diaSemanaKey, minutosDesdeHHMM, ausenciaEnFecha, tieneCitasEseDia, indiceSemanaRotativa, excepcionEnFecha, horarioDelDia, trabajaEseDia } from "../lib/horarios";
import { nombreNegocioDe, limpiarNombre, NEGOCIO_POR_DEFECTO, partesDelNombre, letraLogo, datosMarcaParaCache, aplicarMarcaEnPagina, ACENTO_POR_DEFECTO } from "../lib/negocio";
import { horarioCambio } from "../lib/ghlHorarios";
import { ultimoServicioDe, kpisDelNegocio, ocupacionProximosDias, bonosSinCita } from "../lib/marketing";
import { diagnosticoDelNegocio } from "../lib/cursoIA";
import { testsPendientes, lunesDe as lunesDeCursos } from "../lib/cursos";
import { derivarCiclo, construirTurnos, aplicarPreset, siguienteTipo, anadirSemana, quitarSemana, resumenPatron, vistaPrevia, semanasDelMes, PRESETS, letra } from "../lib/turnos";
import { bonosAplicables, importeConBono, planDeVenta, estadoBono, saldoBono, ventasEnRango, lineasPagoEnRango, pendienteVenta, planDePlazo, deudasDeCliente, serviciosDe as serviciosDeBono, METODO_BONO } from "../lib/bonos";
import { estadoFichaje, botonesFichaje, planDeFichaje, alertaDeFichaje, resumenDiaFichaje, textoIncidencia, tiempoLabel, duracionLabel, minutosDesdeHora, ahoraPreciso } from "../lib/fichaje";
import ClientesAdmin, { Etiqueta } from "./ClientesAdmin";
import { iniciarSesion, sesionInicial, cerrarSesion, verificarPin } from "../lib/authCliente";
import { LONGITUD_CODIGO, esCodigoValido } from "../lib/codigo";
import { MARCA_REVISAR, quitarMarcaRevisar, pedidoOriginal, normalizarTexto, avisosDeMovimiento } from "../lib/agenda";
import { sinConfirmar, diaLargo } from "../lib/confirmaciones";
import ConfirmarCitas from "./ConfirmarCitas";
import Informes from "./Informes";
import AjustesPanel from "./AjustesPanel";
import PerfilCliente from "./PerfilCliente";
import {
  Home,
  CalendarDays,
  Users,
  Sparkles,
  DoorClosed,
  Timer,
  Settings,
  Plus,
  X,
  Pencil,
  Trash2,
  LogIn,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Ban,
  Coffee,
  Ticket,
  History,
  Upload,
  Download,
  GraduationCap,
  Hand,
  PhoneOff,
  Megaphone,
  CalendarClock,
  ShoppingBag,
  Check,
  AlertTriangle,
  Loader2,
  Lock,
  Contact,
  Search,
  CreditCard,
  Package,
  Wallet,
  DollarSign,
  Heart,
  Bell,
  Menu,
  Camera,
  Clock,
  UserPlus,
  Footprints,
  Tag,
  Sun,
  Moon,
  BarChart3,
  StickyNote,
  Pin,
  Palette,
  Banknote,
  Smartphone,
  SplitSquareHorizontal,
  Delete,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { supabaseConfigured } from "../lib/supabaseClient";
import {
  fetchEmpleadas,
  insertEmpleada,
  updateEmpleada,
  deleteEmpleada,
  fetchAjustes,
  setIntervaloActualizacion,
  fetchBloqueos,
  insertBloqueo,
  updateBloqueo,
  deleteBloqueo,
  deleteCliente,
  insertClientes,
  fetchBonos,
  insertBono,
  updateBono,
  fetchBonosVendidos,
  insertBonosVendidos,
  updateBonoVendido,
  fetchBonoUsos,
  insertBonoUso,
  deleteBonoUsosDeCita,
  fetchVentas,
  fetchActividad,
  insertVenta,
  updateVenta,
  saveAjuste,
  updateNotaFijaCliente,
  subirFotoEmpleada,
  fetchCabinas,
  insertCabina,
  updateCabina,
  fetchServicios,
  insertServicio,
  updateServicio,
  deleteServicio,
  importarServicios,
  deleteProducto,
  importarProductos,
  fetchLecciones,
  insertLeccion,
  updateLeccion,
  deleteLeccion,
  fetchResultadosCursos,
  guardarObjetivoExtra,
  guardarObjetivoTicket,
  marcarConfirmacion,
  fetchAvisos,
  insertAviso,
  updateAviso,
  deleteAviso,
  fetchAvisosVistos,
  marcarAvisosVistos,
  fetchContactosMarketing,
  registrarContactoMarketing,
  fetchCategoriasServicios,
  upsertCategoriasServicios,
  deleteCategoriaServicio,
  guardarOrdenServicios,
  guardarCategoriaServicios,
  guardarColoresServicios,
  fetchClientes,
  insertCliente,
  updateCliente,
  fetchProductos,
  insertProducto,
  updateProducto,
  fetchCitas,
  insertCita,
  updateCita as updateCitaRow,
  deleteCita as deleteCitaRow,
  fetchFichajes,
  insertFichaje,
  updateFichaje,
  deleteFichaje,
  fetchFichajesActivos,
  setFichajeActivo as setFichajeActivoRow,
  clearFichajeActivo as clearFichajeActivoRow,
  fetchMetodosPago,
  insertMetodoPago,
  updateMetodoPago,
  subscribeToTable,
} from "../lib/db";

// ---------------------------------------------------------------------------
// Datos: todo vive en Supabase (ver supabase/schema.sql).
//
// Sesión: el código (PIN) solo se pide UNA VEZ al entrar. Si no hay
// actividad durante INACTIVITY_MS, se cierra la sesión sola y hay que
// volver a introducir el código. Fichar sigue pidiendo el código de esa
// empleada en concreto, sea quien sea quien tenga la sesión abierta.
// ---------------------------------------------------------------------------

const INACTIVITY_MS = 40000;

const DIAS = ["lun", "mar", "mie", "jue", "vie", "sab", "dom"];
const DIAS_LABEL = { lun: "Lun", mar: "Mar", mie: "Mié", jue: "Jue", vie: "Vie", sab: "Sáb", dom: "Dom" };
const DIAS_LABEL_LARGO = { lun: "Lunes", mar: "Martes", mie: "Miércoles", jue: "Jueves", vie: "Viernes", sab: "Sábado", dom: "Domingo" };

const HORARIO_DEFAULT = {
  lun: { activo: true, inicio: "10:00", fin: "21:00" },
  mar: { activo: true, inicio: "10:00", fin: "21:00" },
  mie: { activo: true, inicio: "10:00", fin: "21:00" },
  jue: { activo: true, inicio: "10:00", fin: "21:00" },
  vie: { activo: true, inicio: "10:00", fin: "21:00" },
  sab: { activo: true, inicio: "10:00", fin: "15:00" },
  dom: { activo: false, inicio: "", fin: "" },
};

const DEFAULT_PERMISOS = {
  agenda: true,
  fichajes: true,
  empleadas: false,
  servicios: false,
  cabinas: false,
  productos: false,
  ventas: false,
  informes: false,
  anularCobros: false, // encargada: puede anular una venta ya cobrada
  bonos: false, // crear y gestionar el catálogo de bonos
};

const PERMISOS_LABELS = {
  agenda: "Agenda",
  empleadas: "Empleadas",
  servicios: "Servicios",
  cabinas: "Cabinas",
  fichajes: "Fichajes",
  productos: "Productos",
  ventas: "Ventas",
  informes: "Informes",
  anularCobros: "Puede anular cobros (encargada)",
  bonos: "Bonos (crear y gestionar)",
};

function formatLocalISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function todayISO() {
  return formatLocalISO(new Date());
}

// ---------------------------------------------------------------------------
// Utilidades de tiempo
// ---------------------------------------------------------------------------

// La rejilla de la agenda cubre TODO el día; DAY_START/DAY_END siguen siendo el horario habitual por defecto
const GRID_START = 0; // 00:00
const GRID_END = 24 * 60; // 24:00
const PX_PER_MIN = 1.6;

function minToLabel(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function nowMinutesRounded() {
  const d = new Date();
  const m = d.getHours() * 60 + d.getMinutes();
  return Math.round(m / 30) * 30;
}

function nowMinutesExact() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

// Solo la primera letra en mayúscula ("Miércoles, 7 de octubre"), no cada palabra
const primeraMayuscula = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);

function fechaLabel(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return primeraMayuscula(d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" }));
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return formatLocalISO(d);
}


// Cuenta cuántas citas de una empleada caen dentro de un rango de
// fechas (para avisar antes de guardar una ausencia que se solapa).
function citasEnRango(empleadaId, inicio, fin, appointments) {
  return (appointments || []).filter((a) => a.empleadaId === empleadaId && a.fecha >= inicio && a.fecha <= fin);
}

// Cuántos días de una ausencia caen dentro de un año concreto (para el
// recuento anual por motivo).
function diasAusenciaEnAnio(ausencia, anio) {
  const inicio = new Date(ausencia.inicio + "T00:00:00");
  const fin = new Date(ausencia.fin + "T00:00:00");
  const inicioAnio = new Date(anio, 0, 1);
  const finAnio = new Date(anio, 11, 31);
  const desde = inicio < inicioAnio ? inicioAnio : inicio;
  const hasta = fin > finAnio ? finAnio : fin;
  if (hasta < desde) return 0;
  return Math.round((hasta - desde) / 86400000) + 1;
}

function resumenAusenciasAnio(ausencias, anio) {
  const resumen = {};
  (ausencias || []).forEach((a) => {
    const dias = diasAusenciaEnAnio(a, anio);
    if (dias > 0) resumen[a.motivo] = (resumen[a.motivo] || 0) + dias;
  });
  return resumen;
}

// Texto blanco o carbón según lo oscuro/claro que sea el color de fondo,
// para que el nombre de la cita se lea bien sea cual sea el color que
// el admin elija para el servicio.
function colorTextoContraste(hex) {
  if (!hex || hex.length < 7) return "#14213D";
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminancia = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminancia > 0.6 ? "#14213D" : "#FFFFFF";
}

function overlaps(startA, durA, startB, durB) {
  const endA = startA + durA;
  const endB = startB + durB;
  return startA < endB && startB < endA;
}

// Elige la cabina de una cita SIN bloquearla: la preferida si está libre; si no,
// otra compatible que esté libre; y si todas están ocupadas, se comparte
// (se permite solapar citas). Devuelve null solo si no hay ninguna cabina activa.
function elegirCabina(servicio, cabins, citasMismoDia, inicio, duracion, preferidaId) {
  const activas = cabins.filter((c) => c.activa);
  const compatibles = servicio?.cabina && servicio.cabina !== "cualquiera" ? activas.filter((c) => c.id === servicio.cabina) : activas;
  const candidatas = compatibles.length ? compatibles : activas;
  if (candidatas.length === 0) return null;
  const libre = (c) => !citasMismoDia.some((a) => a.cabinaId === c.id && overlaps(a.inicio, a.duracion, inicio, duracion));
  const preferida = candidatas.find((c) => c.id === preferidaId);
  if (preferida && libre(preferida)) return preferida.id;
  const libreC = candidatas.find(libre);
  if (libreC) return libreC.id;
  return (preferida || candidatas[0]).id;
}

// Reparte en "carriles" las citas de una misma empleada que se solapan, para
// dibujarlas una al lado de la otra en vez de taparse. Devuelve un Map
// id -> { carril, carriles } (carriles = cuántas se solapan en ese grupo).
function disponerCitasSolapadas(citas) {
  const orden = [...citas].sort((x, y) => x.inicio - y.inicio || y.duracion - x.duracion);
  const resultado = new Map();
  let grupo = [];
  let finGrupo = -Infinity;
  let finCarril = [];
  const cerrar = () => {
    grupo.forEach((it) => resultado.set(it.id, { carril: it.carril, carriles: finCarril.length }));
    grupo = [];
    finCarril = [];
    finGrupo = -Infinity;
  };
  for (const c of orden) {
    if (c.inicio >= finGrupo) cerrar();
    let carril = finCarril.findIndex((fin) => fin <= c.inicio);
    if (carril === -1) {
      carril = finCarril.length;
      finCarril.push(0);
    }
    finCarril[carril] = c.inicio + c.duracion;
    grupo.push({ id: c.id, carril });
    finGrupo = Math.max(finGrupo, c.inicio + c.duracion);
  }
  cerrar();
  return resultado;
}

function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// Avisa a GoHighLevel (a través de nuestras rutas de API en el servidor) de
// que ha cambiado un cliente o una cita. Nunca bloquea el guardado (la cita
// ya se guardó en Supabase antes de llamar a esto) — pero si GHL rechaza
// algo, lo enseña en pantalla con showToast en vez de fallar en silencio,
// para poder ver el motivo exacto sin mirar logs del servidor.
async function sincronizarGHL(ruta, cuerpo, showToast, opciones = {}) {
  try {
    const res = await fetch(`/api/ghl/${ruta}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || (data && data.ok === false)) {
      const motivo = data?.error || data?.motivo || `GHL respondió ${res.status}`;
      showToast?.(`GHL no sincronizó: ${motivo}`, "error");
    } else if (ruta === "sync-empleada" && data?.accion) {
      if (data.accion === "creado" || data.accion === "baja" || data.aviso) {
        const texto = data.accion === "creado" ? `GHL: calendario de «${data.nombre}» creado y asignado a su usuario (${data.usuario}).` : data.accion === "baja" ? `GHL: «${data.nombre}» renombrada a «empleado-eliminado» y sin horario (no se ha borrado nada).` : `GHL: «${data.nombre}» sincronizada.`;
        showToast?.(`${texto}${data.aviso ? ` ${data.aviso}` : ""}`, data.aviso ? "error" : "ok");
      }
    } else if (ruta === "sync-horario" && data?.accion) {
      if (data.accion === "creado" || data.accion === "actualizado") showToast?.(`GHL: horario de «${data.nombre}» ${data.accion === "creado" ? "enviado" : "actualizado"} (${data.resumen}).${data.aviso ? ` ${data.aviso}` : ""}`, data.aviso ? "error" : "ok");
    } else if (data?.aviso) {
      showToast?.(data.aviso, "error"); // la sincronización salió, pero queda algo por hacer a mano
    } else if (ruta === "sync-bloqueo" && data?.accion) {
      showToast?.(
        data.origen === "general"
          ? `GHL: horario bloqueado en el calendario GENERAL (${data.empleada || "esta empleada"} no tiene calendario propio asignado).`
          : `GHL: horario ${data.accion} en el calendario de ${data.empleada || "la empleada"}.`,
        data.origen === "general" ? "error" : "ok"
      );
    } else if (ruta === "sync-cita" && data?.accion && !opciones.soloErrores) {
      // Confirmación explícita de a qué calendario ha ido la cita: así un
      // calendario mal asignado se ve al momento en vez de pasar desapercibido.
      const verbo = data.accion === "creada" ? "enviada" : data.accion === "movida" ? "movida" : "actualizada";
      const donde =
        data.origen === "general"
          ? `al calendario GENERAL (${data.empleada || "esta empleada"} no tiene calendario propio asignado)`
          : `al calendario de ${data.empleada || "la empleada"}`;
      showToast?.(`GHL: cita ${verbo} ${donde}.`, data.origen === "general" ? "error" : "ok");
    }
  } catch (err) {
    console.warn(`GHL ${ruta}:`, err);
    showToast?.(`No se pudo contactar con GHL (${err.message})`, "error");
  }
}

function puedeVer(currentUser, permKey) {
  if (!currentUser) return false;
  if (currentUser.rol === "admin") return true;
  if (permKey === "clientes" || permKey === "actividad" || permKey === "marketing") return false; // Clientes, Actividad y Marketing son solo del administrador
  return Boolean(currentUser.permisos?.[permKey]);
}

function calcularTotalCita(cita, services, productos) {
  if (cita.precioManual != null) return cita.precioManual;
  const principal = services.find((s) => s.id === cita.servicioId);
  const extras = (cita.serviciosExtra || []).map((id) => services.find((s) => s.id === id)).filter(Boolean);
  const productosTotal = (cita.productos || []).reduce((sum, l) => {
    const p = productos.find((x) => x.id === l.productoId);
    return sum + (p ? p.precio * l.cantidad : 0);
  }, 0);
  return (principal?.precio || 0) + extras.reduce((sum, s) => sum + s.precio, 0) + productosTotal;
}

// Facturación (citas cobradas) de un mes concreto — para el informe de
// "este mes" / "mes anterior" en Ventas.
function resumenFacturacionMes(appointments, services, productos, anio, mes, ventas = []) {
  const cobradasDelMes = appointments.filter((a) => {
    if (a.estadoCobro !== "cobrada") return false;
    const f = new Date(a.fecha + "T00:00:00");
    return f.getFullYear() === anio && f.getMonth() === mes;
  });
  let total = 0;
  const porMetodo = {};
  // Base caja: lo pagado con bono no es dinero nuevo (ya se cobró al vender el bono)
  cobradasDelMes.forEach((c) => {
    total += calcularTotalCita(c, services, productos) - importeConBono(c);
    (c.pagos || []).forEach((p) => {
      if (p.metodoId === METODO_BONO) return;
      porMetodo[p.metodoId] = (porMetodo[p.metodoId] || 0) + p.importe;
    });
  });
  // ventas sin cita: el dinero cuenta el día en que se cobra cada pago (también los plazos)
  const desdeMes = `${anio}-${String(mes + 1).padStart(2, "0")}-01`;
  const hastaMes = `${anio}-${String(mes + 1).padStart(2, "0")}-31`;
  lineasPagoEnRango(ventas, desdeMes, hastaMes).forEach(({ linea: pg }) => {
    total += Number(pg.importe) || 0;
    porMetodo[pg.metodoId] = (porMetodo[pg.metodoId] || 0) + (Number(pg.importe) || 0);
  });
  const vendidasMes = ventas.filter((v) => !v.anulada && v.fecha >= desdeMes && v.fecha <= hastaMes).length;
  return { total, porMetodo, cantidad: cobradasDelMes.length + vendidasMes };
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function ClinicApp() {
  const [view, setView] = useState("inicio");
  const [employees, setEmployees] = useState([]);
  const [serviciosBrutos, setServices] = useState([]);
  const [lecciones, setLecciones] = useState([]); // clases de los cursos de ventas
  const [resultadosCursos, setResultadosCursos] = useState([]); // resultados de los tests (cada empleada ve los suyos)
  const [categoriasSrv, setCategoriasSrv] = useState([]); // categorías de servicios guardadas (nombre, descripción, orden)
  // Los servicios siempre salen en el orden que has elegido (por categoría y posición) en toda la app
  const services = useMemo(() => ordenarServicios(serviciosBrutos, categoriasSrv), [serviciosBrutos, categoriasSrv]);
  const [cabins, setCabins] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [metodosPago, setMetodosPago] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [fichajesLog, setFichajesLog] = useState([]);
  const [fichajeActivo, setFichajeActivo] = useState({});
  const [descansos, setDescansos] = useState({}); // empleadaId -> minuto en que empezó el descanso
  const [pendienteAlerta, setPendienteAlerta] = useState(false);
  const [avisos, setAvisos] = useState([]); // avisos del popup (el administrador los crea)
  const [avisosVistos, setAvisosVistos] = useState([]);
  const [contactosMarketing, setContactosMarketing] = useState([]); // a quién ya se ha escrito o llamado (solo el administrador lo lee)
  const [pendienteAvisos, setPendienteAvisos] = useState(false);
  const [avisosPopup, setAvisosPopup] = useState(null); // los avisos que se enseñan ahora
  const [alertaFichaje, setAlertaFichaje] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [day, setDay] = useState(todayISO());

  const [currentUserId, setCurrentUserId] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const vistaPrevia = React.useRef(null); // pantalla a la que volver tras un cierre por inactividad
  const vistaActual = React.useRef(view); // siempre la pantalla actual (el temporizador de inactividad guarda copias antiguas de `view`)
  vistaActual.current = view;
  const [avisoLogin, setAvisoLogin] = useState(""); // por qué se ha vuelto a la pantalla de acceso
  const [sesion, setSesion] = useState(null); // la persona que ha entrado (datos que devuelve el servidor)

  const [isMobile, setIsMobile] = useState(false);
  const [tema, setTema] = useState("light");
  useEffect(() => {
    try {
      setTema(document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");
    } catch (e) {
      // sin acceso al documento: se queda en claro
    }
  }, []);
  function toggleTema() {
    const nuevo = tema === "dark" ? "light" : "dark";
    setTema(nuevo);
    try {
      if (nuevo === "dark") document.documentElement.setAttribute("data-theme", "dark");
      else document.documentElement.removeAttribute("data-theme");
      window.localStorage.setItem("cnb_theme", nuevo);
    } catch (e) {
      // no pasa nada si no se puede recordar la preferencia
    }
  }
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [notifBaseline, setNotifBaseline] = useState(null);
  const [notifVistas, setNotifVistas] = useState(() => {
    if (typeof window === "undefined") return new Set();
    try {
      return new Set(JSON.parse(window.localStorage.getItem("cnb_notif_vistas") || "[]"));
    } catch (e) {
      return new Set();
    }
  });

  const [empleadaModal, setEmpleadaModal] = useState(null);
  const [servicioModal, setServicioModal] = useState(null);
  const [cabinaModal, setCabinaModal] = useState(null);
  const [clienteModal, setClienteModal] = useState(null);
  const [metodoPagoModal, setMetodoPagoModal] = useState(null);
  const [productoModal, setProductoModal] = useState(null);
  const [citaModal, setCitaModal] = useState(null);
  const [diaModal, setDiaModal] = useState(null); // { empleada, fecha } — editar un día suelto desde Turnos
  const [toast, setToast] = useState(null);
  const [pinRequest, setPinRequest] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null); // { titulo, mensaje, onConfirmar }
  const [ajustes, setAjustes] = useState({});
  const [ajustesListos, setAjustesListos] = useState(false);
  const [temaPreview, setTemaPreview] = useState(null);
  const [perfilClienteId, setPerfilClienteId] = useState(null);
  const [bloqueos, setBloqueos] = useState([]);
  const [bloqueoModal, setBloqueoModal] = useState(null);
  const [bonos, setBonos] = useState([]); // catálogo
  const [bonosVendidos, setBonosVendidos] = useState([]);
  const [bonoUsos, setBonoUsos] = useState([]);
  const [ventas, setVentas] = useState([]); // ventas sin cita
  const [bonoModal, setBonoModal] = useState(null); // "nuevo" | bono
  const [reprogramando, setReprogramando] = useState(null); // la cita que se está reprogramando (se elige su nuevo hueco en la agenda)
  const [eliminarServicio, setEliminarServicio] = useState(null); // { sv, nCitas, nBonos }: confirmación de eliminar un servicio
  const [categoriaModal, setCategoriaModal] = useState(null); // null | "nueva" | categoría que se edita
  const [categoriaInicial, setCategoriaInicial] = useState(""); // categoría que trae un servicio nuevo
  const [importarProductosModal, setImportarProductosModal] = useState(false);
  const [importarModal, setImportarModal] = useState(false); // asistente «Importar servicios»
  const [menuAnadir, setMenuAnadir] = useState(false); // «Añadir»: ¿cita, venta u horario no disponible?
  const [actividadModal, setActividadModal] = useState(null); // { titulo, filtros }: historial de una reserva o de un cliente
  const [fichajeAbierto, setFichajeAbierto] = useState(null); // empleada cuyo fichaje en curso se está corrigiendo
  const [fichajeModal, setFichajeModal] = useState(null); // { modo: "nuevo", fecha } | { modo: "editar", fichaje }
  const [ventaModal, setVentaModal] = useState(null); // { preselBonoId }

  const currentUser = employees.find((e) => e.id === currentUserId) || (sesion ? { ...sesion, codigo: "" } : null);

  // Al entrar con el código: aviso si no ha fichado la entrada (en su turno) o la salida (pasada su hora)
  useEffect(() => {
    if (!pendienteAlerta || loading || !currentUser) return;
    setPendienteAlerta(false);
    if (currentUser.rol === "admin") return;
    const emp = employees.find((e) => e.id === currentUser.id);
    if (!emp) return;
    const hoy = todayISO();
    const dentro = fichajeActivo[emp.id] != null;
    const fichoHoy = dentro || fichajesLog.some((f) => f.empleadaId === emp.id && f.fecha === hoy);
    const tipo = alertaDeFichaje({ horario: horarioDelDia(emp, hoy, []), ahora: nowMinutesExact(), dentro, fichoHoy });
    if (tipo) setAlertaFichaje({ tipo, empleadaId: emp.id });
  }, [pendienteAlerta, loading, currentUser, employees, fichajeActivo, fichajesLog]);

  // Al entrar con el código: los avisos que le tocan (una vez al día o una sola vez, según cada aviso; «solo si no ha fichado» incluido)
  useEffect(() => {
    if (!pendienteAvisos || loading || !currentUser) return;
    setPendienteAvisos(false);
    if (currentUser.rol === "admin") return;
    const hoy = todayISO();
    const haFichadoHoy = fichajeActivo[currentUser.id] != null || fichajesLog.some((f) => f.empleadaId === currentUser.id && f.fecha === hoy);
    const lista = avisosParaMostrar({ avisos, vistos: avisosVistos, empleadaId: currentUser.id, hoy, haFichadoHoy });
    if (lista.length) setAvisosPopup(lista);
  }, [pendienteAvisos, loading, currentUser, avisos, avisosVistos, fichajeActivo, fichajesLog]);

  const showToast = useCallback((msg, tipo = "ok") => {
    setToast({ msg, tipo, key: uid() });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  // Guardar un ajuste (se ve al instante; si falla, se recarga el estado real)
  async function guardarAjuste(clave, valor) {
    setAjustes((a) => ({ ...a, [clave]: valor }));
    try {
      await saveAjuste(clave, valor);
    } catch (err) {
      await refreshAjustes();
      showToast(`No se pudo guardar el ajuste (${err.message})`, "error");
      throw err;
    }
  }

  // Colores de toda la app: los guardados (o la vista previa mientras se editan)
  const temaEfectivo = normalizarTema(temaPreview || ajustes.tema || TEMA_POR_DEFECTO);
  const claveTema = JSON.stringify(temaEfectivo);
  useEffect(() => {
    if (!ajustesListos && !temaPreview) return;
    aplicarTema(temaEfectivo, tema === "dark", !temaPreview);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claveTema, tema, ajustesListos, Boolean(temaPreview)]); // al terminar una vista previa hay que recordar los colores guardados

  // Cada cuántos segundos se refresca la agenda (por si entra algo desde otro dispositivo o desde GHL)
  // Nombre del negocio (Configuración → Negocio). Antes de entrar con el código aún no se puede leer de la base de datos: se usa el que
  // quedó guardado en este navegador (así la pantalla de entrada ya lo enseña) y, si no hay, el de por defecto.
  const [negocioCache, setNegocioCache] = useState("");
  useEffect(() => {
    try { const n = JSON.parse(window.localStorage.getItem("cnb_negocio") || "null"); if (n?.nombre) setNegocioCache(limpiarNombre(n.nombre)); } catch (e) { /* sin nombre guardado */ }
  }, []);
  const negocio = ajustesListos ? nombreNegocioDe(ajustes) : negocioCache || NEGOCIO_POR_DEFECTO;
  // Título de la pestaña y favicon con el nombre y el color de la marca; se guardan para pintarlos sin parpadeo la próxima vez
  useEffect(() => {
    if (typeof document === "undefined") return;
    const color = temaEfectivo?.acento;
    aplicarMarcaEnPagina(document, negocio, color);
    if (ajustesListos) { try { window.localStorage.setItem("cnb_negocio", JSON.stringify(datosMarcaParaCache(negocio, color))); } catch (e) { /* sin almacenamiento */ } }
  }, [negocio, ajustesListos, temaEfectivo?.acento]);

  const actualizacionSeg = ajustes.actualizacion?.segundos || 20;
  useEffect(() => {
    setIntervaloActualizacion(actualizacionSeg);
  }, [actualizacionSeg]);

  // Etiquetas de marketing (píxeles de Meta, Google Ads, Analytics, Tag Manager)
  const claveMarketing = JSON.stringify(ajustes.marketing || null);
  useEffect(() => {
    if (ajustesListos) inyectarEtiquetas(ajustes.marketing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ajustesListos, claveMarketing]);

  // Trae a la agenda las citas creadas en GHL mientras la app está abierta
  const importacionActiva = ajustes.importacion?.activa !== false;
  const importacionSegundos = ajustes.importacion?.segundos || 60;
  useEffect(() => {
    if (!currentUser || !importacionActiva || !ajustesListos) return undefined;
    let parado = false;
    async function importar() {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      try {
        const r = await fetch("/api/ghl/importar", { method: "POST" });
        const d = await r.json();
        const nuevas = d?.importadas?.length || 0;
        const cambiadas = d?.actualizadas?.length || 0;
        const borradas = d?.eliminadas?.length || 0;
        if (parado || (!nuevas && !cambiadas && !borradas)) return;
        await refreshCitas();
        const partes = [];
        if (nuevas) partes.push(nuevas === 1 ? "1 cita nueva" : `${nuevas} citas nuevas`);
        if (cambiadas) partes.push(cambiadas === 1 ? `1 cita cambiada (${d.actualizadas[0].resumen.replace(/^Reserva /, "").replace(/ en GHL/, "")})` : `${cambiadas} citas cambiadas`);
        if (borradas) partes.push(borradas === 1 ? `1 cita cancelada o eliminada en GHL (${d.eliminadas[0].clienta}, quitada de la agenda)` : `${borradas} citas canceladas o eliminadas en GHL (quitadas de la agenda)`);
        showToast(`Desde GHL: ${partes.join(" y ")}.`);
      } catch (e) {
        // sin conexión: se reintenta en el siguiente ciclo
      }
    }
    importar();
    const t = window.setInterval(importar, importacionSegundos * 1000);
    return () => {
      parado = true;
      window.clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, importacionActiva, importacionSegundos, ajustesListos]);

  // -------------------------------------------------------------------------
  // Responsive: sidebar en cajón en pantallas estrechas
  // -------------------------------------------------------------------------

  useEffect(() => {
    function check() {
      setIsMobile(window.innerWidth < 860);
    }
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // -------------------------------------------------------------------------
  // Carga inicial + suscripción en tiempo real a cada tabla de Supabase
  // -------------------------------------------------------------------------

  const refreshEmpleadas = useCallback(() => fetchEmpleadas().then(setEmployees), []);
  const refreshCabinas = useCallback(() => fetchCabinas().then(setCabins), []);
  const refreshServicios = useCallback(() => fetchServicios().then(setServices), []);
  const refreshLecciones = useCallback(() => fetchLecciones().then(setLecciones).catch(() => setLecciones([])), []); // sin las tablas nuevas, la sección sale vacía
  const refreshResultadosCursos = useCallback(() => fetchResultadosCursos().then(setResultadosCursos).catch(() => setResultadosCursos([])), []);
  const refreshAvisos = useCallback(() => fetchAvisos().then(setAvisos).catch(() => setAvisos([])), []); // sin las tablas nuevas, no hay avisos
  const refreshContactosMarketing = useCallback(() => fetchContactosMarketing().then(setContactosMarketing).catch(() => setContactosMarketing([])), []);
  const refreshAvisosVistos = useCallback(() => fetchAvisosVistos().then(setAvisosVistos).catch(() => setAvisosVistos([])), []);
  const refreshCategoriasSrv = useCallback(() => fetchCategoriasServicios().then(setCategoriasSrv).catch(() => setCategoriasSrv([])), []); // sin la tabla nueva: las categorías salen de los propios servicios
  const refreshClientes = useCallback(() => fetchClientes().then(setClientes), []);
  const calcularTotalCliente = useCallback((c) => calcularTotalCita(c, services, productos) - importeConBono(c), [services, productos]);
  const refreshProductos = useCallback(() => fetchProductos().then(setProductos), []);
  const refreshMetodosPago = useCallback(() => fetchMetodosPago().then(setMetodosPago), []);
  const refreshCitas = useCallback(() => fetchCitas().then(setAppointments), []);
  const refreshFichajes = useCallback(() => fetchFichajes().then(setFichajesLog), []);
  const refreshFichajesActivos = useCallback(
    () =>
      fetchFichajesActivos().then(({ activos, descansos: d }) => {
        setFichajeActivo(activos);
        setDescansos(d);
      }),
    []
  );
  // Tolerante: si todavía no existe la tabla de ajustes (no se ha pegado el schema.sql), la app arranca igual con los valores por defecto
  // Tolerante: si aún no se ha pegado el schema.sql nuevo (tabla de bloqueos), la agenda funciona igual
  const refreshBloqueos = useCallback(() => fetchBloqueos().then(setBloqueos).catch(() => {}), []);
  // Tolerantes: si aún no se ha pegado el schema.sql nuevo, la agenda funciona igual
  const refreshBonos = useCallback(() => fetchBonos().then(setBonos).catch(() => {}), []);
  const refreshBonosVendidos = useCallback(() => fetchBonosVendidos().then(setBonosVendidos).catch(() => {}), []);
  const refreshBonoUsos = useCallback(() => fetchBonoUsos().then(setBonoUsos).catch(() => {}), []);
  const refreshVentas = useCallback(() => fetchVentas().then(setVentas).catch(() => {}), []);
  const refreshAjustes = useCallback(
    () =>
      fetchAjustes()
        .then((a) => {
          setAjustes(a);
          setAjustesListos(true);
        })
        .catch((err) => {
          console.warn("Ajustes:", err);
          setAjustesListos(true);
        }),
    []
  );

  useEffect(() => {
    if (!supabaseConfigured) {
      setLoadError(
        "Falta configurar Supabase: crea un archivo .env.local con NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY (ver README)."
      );
      setLoading(false);
      return;
    }

    if (!sesion) return undefined; // sin sesión no se pide NINGÚN dato
    let cancelled = false;

    async function cargarTodo() {
      try {
        await Promise.all([
          refreshEmpleadas(),
          refreshCabinas(),
          refreshServicios(),
          refreshCategoriasSrv(),
          refreshLecciones(),
          refreshResultadosCursos(),
          refreshAvisos(),
          refreshAvisosVistos(),
          refreshContactosMarketing(),
          refreshClientes(),
          refreshProductos(),
          refreshMetodosPago(),
          refreshCitas(),
          refreshFichajes(),
          refreshFichajesActivos(),
          refreshAjustes(),
          refreshBloqueos(),
          refreshBonos(),
          refreshBonosVendidos(),
          refreshBonoUsos(),
          refreshVentas(),
        ]);
        if (!cancelled) setLoadError(null);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setLoadError(
            "No se pudo conectar con Supabase. Revisa que las tablas existan (supabase/schema.sql) y que las claves en .env.local sean correctas."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    cargarTodo();

    const unsubs = [
      subscribeToTable("empleadas", refreshEmpleadas),
      subscribeToTable("cabinas", refreshCabinas),
      subscribeToTable("servicios", refreshServicios),
      subscribeToTable("categorias_servicios", refreshCategoriasSrv),
      subscribeToTable("lecciones", refreshLecciones),
      subscribeToTable("avisos", refreshAvisos),
      subscribeToTable("resultados_cursos", refreshResultadosCursos),
      subscribeToTable("clientes", refreshClientes),
      subscribeToTable("productos", refreshProductos),
      subscribeToTable("metodos_pago", refreshMetodosPago),
      subscribeToTable("citas", refreshCitas),
      subscribeToTable("fichajes", refreshFichajes),
      subscribeToTable("fichajes_activos", refreshFichajesActivos),
      subscribeToTable("ajustes", refreshAjustes),
      subscribeToTable("bloqueos", refreshBloqueos),
      subscribeToTable("bonos", refreshBonos),
      subscribeToTable("bonos_vendidos", refreshBonosVendidos),
      subscribeToTable("bono_usos", refreshBonoUsos),
      subscribeToTable("ventas", refreshVentas),
    ];

    return () => {
      cancelled = true;
      unsubs.forEach((unsub) => unsub());
    };
  }, [
    refreshEmpleadas,
    refreshCabinas,
    refreshServicios,
    refreshCategoriasSrv,
    refreshLecciones,
    refreshResultadosCursos,
    refreshAvisos,
    refreshAvisosVistos,
    refreshContactosMarketing,
    refreshClientes,
    refreshProductos,
    refreshMetodosPago,
    refreshCitas,
    refreshFichajes,
    refreshFichajesActivos,
    refreshAjustes,
    refreshBloqueos,
    refreshBonos,
    refreshBonosVendidos,
    refreshBonoUsos,
    refreshVentas,
    sesion?.id,
  ]);

  // Al abrir la app se pregunta al servidor si ya hay una sesión válida (cookie firmada).
  useEffect(() => {
    let cancelado = false;
    (async () => {
      const r = await sesionInicial(); // en producción siempre devuelve «sin sesión»: lo primero es el código
      if (cancelado) return;
      if (r.ok && r.usuario) {
        setSesion(r.usuario);
        setCurrentUserId(r.usuario.id);
      }
      setAuthChecked(true);
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  // Punto de partida de las notificaciones: lo que ya existía al entrar
  // no cuenta como "nuevo".
  useEffect(() => {
    if (!loading && notifBaseline === null) {
      setNotifBaseline(new Set(appointments.map((a) => a.id)));
    }
  }, [loading, notifBaseline, appointments]);

  // Cierre de sesión automático por inactividad.
  useEffect(() => {
    if (!currentUser) return;
    let timer;
    function reset() {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => logout({ recordarVista: true }), INACTIVITY_MS);
    }
    const eventos = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
    eventos.forEach((ev) => window.addEventListener(ev, reset));
    reset();
    return () => {
      window.clearTimeout(timer);
      eventos.forEach((ev) => window.removeEventListener(ev, reset));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  function login(usuario) {
    setAvisoLogin("");
    setPendienteAlerta(true); // al entrar con el código se comprueba si le falta fichar
    setPendienteAvisos(true); // y se miran sus avisos
    setSesion(usuario);
    setCurrentUserId(usuario.id);
    setLoading(true);
    setNotifBaseline(new Set(appointments.map((a) => a.id)));
    const previa = vistaPrevia.current;
    vistaPrevia.current = null;
    const permiso = previa && previa.startsWith("inf-") ? "informes" : previa;
    setView(previa && (previa === "inicio" || puedeVer(usuario, permiso)) ? previa : "inicio");
  }

  // Tras un cierre por INACTIVIDAD se recuerda la pantalla en la que estabas: al poner el código se vuelve a ella
  function logout(opciones) {
    vistaPrevia.current = opciones && opciones.recordarVista === true ? vistaActual.current : null;
    cerrarSesion();
    // la información de clientes y citas no se queda en memoria cuando nadie ha entrado
    setSesion(null);
    setCurrentUserId(null);
    setEmployees([]);
    setClientes([]);
    setAppointments([]);
    setBloqueos([]);
    setBonos([]);
    setBonosVendidos([]);
    setBonoUsos([]);
    setVentas([]);
    setServices([]);
    setCabins([]);
    setProductos([]);
    setMetodosPago([]);
    setFichajesLog([]);
    setDescansos({});
    setAlertaFichaje(null);
    setLoading(true);
  }

  // El servidor dice que la sesión ya no vale (caducada, o cerrada desde otro dispositivo)
  useEffect(() => {
    function caducada() {
      if (!sesion) return;
      logout({ recordarVista: true });
      setAvisoLogin("La sesión ha caducado. Vuelve a entrar con tu código.");
    }
    window.addEventListener("cnb-sesion-caducada", caducada);
    return () => window.removeEventListener("cnb-sesion-caducada", caducada);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sesion?.id]);

  // ----- Fichajes (el administrador puede corregirlos) -----
  function guardarFichaje(datos) {
    withErrorToast(async () => {
      if (fichajeModal.modo === "editar") {
        await updateFichaje({ ...fichajeModal.fichaje, ...datos });
        showToast("Fichaje modificado");
      } else {
        await insertFichaje({ id: uid(), ...datos });
        showToast("Fichaje añadido");
      }
      await refreshFichajes();
      setFichajeModal(null);
    }, "No se pudo guardar el fichaje.");
  }
  function guardarEntradaAbierta(emp, entrada) {
    withErrorToast(async () => {
      await setFichajeActivoRow(emp.id, entrada);
      await refreshFichajesActivos();
      showToast("Hora de entrada modificada");
      setFichajeAbierto(null);
    }, "No se pudo modificar la entrada.");
  }
  function cerrarFichajeAbierto(emp, enDescanso, entrada, salida) {
    withErrorToast(async () => {
      if (!enDescanso) await insertFichaje({ id: uid(), empleadaId: emp.id, fecha: todayISO(), entrada, salida });
      await clearFichajeActivoRow(emp.id);
      await Promise.all([refreshFichajes(), refreshFichajesActivos()]);
      showToast("Fichaje cerrado");
      setFichajeAbierto(null);
    }, "No se pudo cerrar el fichaje.");
  }
  function eliminarFichaje(f) {
    withErrorToast(async () => {
      await deleteFichaje(f.id);
      await refreshFichajes();
      showToast("Fichaje eliminado");
    }, "No se pudo eliminar el fichaje.");
  }

  // ----- Bonos y ventas sin cita -----
  function guardarBono(datos) {
    withErrorToast(async () => {
      if (bonoModal && bonoModal !== "nuevo") {
        await updateBono({ ...bonoModal, ...datos });
        showToast("Bono actualizado");
      } else {
        await insertBono({ ...datos, id: uid() });
        showToast("Bono creado");
      }
      await refreshBonos();
      setBonoModal(null);
    }, "No se pudo guardar el bono.");
  }

  // Devuelve { ok } o { error } para que el formulario lo enseñe sin cerrarse
  async function confirmarVenta(datos) {
    const plan = planDeVenta({ ...datos, productos, plantillas: bonos, fecha: todayISO(), usuarioId: currentUser.id, uid });
    if (plan.error) return { error: plan.error };
    try {
      await insertVenta(plan.venta);
    } catch (err) {
      return { error: `No se pudo guardar la venta (${err.message}).` };
    }
    try {
      if (plan.bonosVendidos.length) await insertBonosVendidos(plan.bonosVendidos);
      for (const st of plan.stock) {
        const prod = productos.find((p) => p.id === st.productoId);
        if (prod) await updateProducto({ ...prod, stock: st.nuevoStock });
      }
    } catch (err) {
      await Promise.all([refreshVentas(), refreshBonosVendidos(), refreshProductos()]);
      return { error: `La venta se registró pero algo falló al terminarla (${err.message}). Avisa al administrador antes de repetirla.` };
    }
    // Descontar ya la primera sesión en una cita de hoy: la cita queda cobrada con el bono
    if (datos.usarEnCita) {
      const bv = plan.bonosVendidos.find((b) => b.plantillaId === datos.usarEnCita.plantillaId);
      const cita = appointments.find((a) => a.id === datos.usarEnCita.citaId);
      if (bv && cita && cita.estadoCobro !== "cobrada") {
        try {
          const importe = calcularTotalCita(cita, services, productos);
          await updateCitaRow({ ...cita, pagos: [...(cita.pagos || []), { id: uid(), metodoId: METODO_BONO, importe, bonoVendidoId: bv.id }], estadoCobro: "cobrada", cobradaEn: new Date().toISOString(), cobradaPor: currentUser.id, modificadoPor: currentUser.id });
          await insertBonoUso({ id: uid(), bonoVendidoId: bv.id, citaId: cita.id, fecha: cita.fecha, creadoPor: currentUser.id });
          sincronizarGHL("sync-cita", { citaId: cita.id }, showToast, { soloErrores: true });
          await Promise.all([refreshVentas(), refreshBonosVendidos(), refreshProductos(), refreshCitas(), refreshBonoUsos()]);
          showToast(`Venta cobrada (${plan.total.toFixed(2)} €) y primera sesión descontada en la cita de ${cita.clienta}.`);
          return { ok: true };
        } catch (err) {
          await Promise.all([refreshVentas(), refreshBonosVendidos(), refreshProductos(), refreshCitas(), refreshBonoUsos()]);
          return { error: `El bono se vendió, pero no se pudo descontar la sesión en la cita (${err.message}). Cierra esta ventana y cobra la cita con «Usar 1 sesión».` };
        }
      }
    }
    await Promise.all([refreshVentas(), refreshBonosVendidos(), refreshProductos()]);
    const cobradoAhora = plan.venta.pagos.reduce((sum, pg) => sum + pg.importe, 0);
    const debe = Math.round((plan.total - cobradoAhora) * 100) / 100;
    showToast(debe > 0.005 ? `Bono vendido a plazos: cobrados ${cobradoAhora.toFixed(2)} €, quedan ${debe.toFixed(2)} € por cobrar (Bonos → Vendidos → Cobrar plazo). Ya está activo.` : plan.bonosVendidos.length ? `Venta cobrada (${plan.total.toFixed(2)} €). El bono ya está en la ficha del cliente: se descuenta al cobrar su cita.` : `Venta cobrada (${plan.total.toFixed(2)} €)`);
    return { ok: true };
  }

  function anularVenta(v) {
    withErrorToast(async () => {
      const suyos = bonosVendidos.filter((b) => b.ventaId === v.id);
      if (suyos.some((b) => bonoUsos.some((u) => u.bonoVendidoId === b.id))) {
        showToast("Esta venta incluye un bono con sesiones ya usadas: no se puede anular.", "error");
        return;
      }
      for (const l of v.productos || []) {
        const prod = productos.find((p) => p.id === l.productoId);
        if (prod) await updateProducto({ ...prod, stock: prod.stock + l.cantidad });
      }
      for (const b of suyos) await updateBonoVendido({ ...b, estado: "anulado" });
      await updateVenta({ ...v, anulada: true });
      await Promise.all([refreshVentas(), refreshBonosVendidos(), refreshProductos()]);
      showToast("Venta anulada");
    }, "No se pudo anular la venta.");
  }

  // Cliente nuevo desde «Nueva venta» (si todavía no tiene ficha)
  async function crearClienteDesdeVenta(datos) {
    const mismo = clientes.find((c) => claveTelefono(c.telefono) && claveTelefono(c.telefono) === claveTelefono(datos.telefono));
    if (mismo) return { error: `Ya existe un cliente con ese teléfono: ${mismo.nombre}. Búscalo en el campo de arriba.` };
    try {
      const nuevo = { id: uid(), nombre: datos.nombre, telefono: datos.telefono, email: datos.email || "", favorito: false };
      await insertCliente(nuevo);
      await refreshClientes();
      return { cliente: { ...nuevo, notaFija: "", ghlContactId: "" } };
    } catch (err) {
      return { error: `No se pudo crear el cliente (${err.message}).` };
    }
  }

  // Cobrar un plazo de un bono vendido a plazos (solo añade un pago a la venta)
  async function cobrarPlazo(venta, pagos) {
    const plan = planDePlazo({ venta, pagos, fecha: todayISO() });
    if (plan.error) return { error: plan.error };
    try {
      await updateVenta({ ...venta, pagos: plan.pagos });
      await refreshVentas();
      showToast(plan.pendienteTras > 0.005 ? `Plazo cobrado (${plan.cobrado.toFixed(2)} €). Quedan ${plan.pendienteTras.toFixed(2)} € por cobrar.` : `Plazo cobrado (${plan.cobrado.toFixed(2)} €). El bono está pagado del todo.`);
      return { ok: true };
    } catch (err) {
      return { error: `No se pudo registrar el cobro (${err.message}).` };
    }
  }

  function anularBonoVendido(b) {
    withErrorToast(async () => {
      await updateBonoVendido({ ...b, estado: "anulado" });
      await refreshBonosVendidos();
      showToast("Bono anulado");
    }, "No se pudo anular el bono.");
  }

  // Hace el fichaje (entrada / descanso / volver / salida) y refresca
  function ejecutarFichaje(empleadaId, accion) {
    const estado = estadoFichaje(empleadaId, fichajeActivo, descansos);
    const plan = planDeFichaje(accion, estado, { entradaActiva: fichajeActivo[empleadaId], ahora: ahoraPreciso() }); // segundos exactos
    if (!plan) return;
    withErrorToast(async () => {
      if (plan.fichaje) await insertFichaje({ id: uid(), empleadaId, fecha: todayISO(), entrada: plan.fichaje.entrada, salida: plan.fichaje.salida });
      if (plan.activo) await setFichajeActivoRow(empleadaId, plan.activo.horaEntrada, plan.activo.extra);
      else await clearFichajeActivoRow(empleadaId);
      await Promise.all([refreshFichajes(), refreshFichajesActivos()]);
      showToast(plan.aviso);
    }, "No se pudo registrar el fichaje.");
  }

  // Ella misma (ya entró con su código) ficha sin más; otra persona confirma con el código de la empleada
  function solicitarFichaje(empleadaId, accion, { forzarPin = false } = {}) {
    if (!forzarPin && currentUser && currentUser.id === empleadaId) return ejecutarFichaje(empleadaId, accion);
    const empleada = employees.find((e) => e.id === empleadaId);
    if (!empleada) return undefined;
    const que = { entrada: "fichar la entrada", volver: "fichar la vuelta del descanso", descanso: "empezar el descanso", salida: "fichar la salida" }[accion];
    return requestPin({
      title: `Código de ${empleada.nombre}`,
      subtitle: `Confirma tu código para ${que}`,
      empleadaId: empleada.id,
      onSuccess: () => ejecutarFichaje(empleadaId, accion),
    });
  }

  // El ancho del menú lateral, para que las páginas integradas (añadir cita, venta…) ocupen solo la zona de contenido
  useEffect(() => {
    document.documentElement.style.setProperty("--sidebar-w", isMobile ? "0px" : "244px");
  }, [isMobile]);
  // Cambiar de pantalla con una cita, venta u horario abierto sin guardar: se pregunta antes (no se pierde nada por un clic)
  function navegar(v) {
    if (v !== "agenda") setReprogramando(null); // reprogramar solo tiene sentido en la agenda
    if (citaModal || ventaModal || bloqueoModal) {
      setConfirmDialog({
        titulo: "¿Salir sin guardar?",
        mensaje: "Tienes algo abierto sin guardar. Si cambias de pantalla, se perderá lo que no hayas guardado.",
        textoConfirmar: "Salir sin guardar",
        textoCancelar: "Seguir editando",
        peligroso: true,
        onConfirmar: () => { setCitaModal(null); setVentaModal(null); setBloqueoModal(null); setView(v); setSidebarOpen(false); },
      });
      return;
    }
    setView(v);
    setSidebarOpen(false);
  }

  // ---- Enlace para que la clienta cambie o cancele SU cita (para mandárselo o para las automatizaciones de GHL) ----
  async function copiarEnlaceCita(cita) {
    try {
      const r = await fetch("/api/enlace-cita", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ citaId: cita.id }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) return showToast(d.error || "No se ha podido crear el enlace.", "error");
      try { await navigator.clipboard.writeText(d.enlace); showToast("Enlace copiado: con él la clienta puede cambiar o cancelar su cita."); } catch (e) { showToast(`Copia este enlace: ${d.enlace}`); }
    } catch (e) {
      showToast("No se ha podido crear el enlace.", "error");
    }
  }

  // ---- Reservas del bot por revisar: poner el servicio correcto (la cita pasa a durar lo que dura) y corregirla también en GHL ----
  async function corregirServicioApp(cita, servicio) {
    const emp = employees.find((e) => e.id === cita.empleadaId);
    if (!emp) { showToast("No se encuentra a la empleada de esa cita.", "error"); return; }
    const r = corregirServicio({ cita, servicio, cabinas: cabins, citas: appointments, bloqueos, empleada: emp, horario: horarioDelDia(emp, cita.fecha, appointments) });
    setAppointments((prev) => prev.map((a) => (a.id === cita.id ? { ...a, ...r.cambios } : a))); // se ve al instante
    try {
      await updateCitaRow({ ...cita, ...r.cambios, modificadoPor: currentUser.id });
    } catch (err) {
      await refreshCitas();
      showToast(`No se pudo corregir la cita: ${err.message || err}`, "error");
      return;
    }
    await refreshCitas();
    showToast(`Servicio corregido: ${cita.clienta} → ${servicio.nombre} (${r.cambios.duracion} min).${r.avisos.length ? ` Aviso: ${r.avisos.join("; ")}.` : ""}`);
    sincronizarGHL("sync-cita", { citaId: cita.id }, showToast, { soloErrores: true }); // en GHL se corrigen el título y la duración
  }
  async function estaBienServicioApp(cita) {
    const notas = notaRevisada(cita.notas);
    setAppointments((prev) => prev.map((a) => (a.id === cita.id ? { ...a, notas } : a)));
    try {
      await updateCitaRow({ ...cita, notas, modificadoPor: currentUser.id });
    } catch (err) {
      await refreshCitas();
      showToast(`No se pudo guardar: ${err.message || err}`, "error");
      return;
    }
    await refreshCitas();
    showToast(`Marcada como revisada: ${cita.clienta} se queda con su servicio actual.`);
  }

  // ---- Marketing: anotar a quién se ha contactado ----
  function registrarContactoApp(cliente, canal, motivo) {
    const fila = { id: uid(), clienteId: cliente.id, canal, motivo, por: currentUser.nombre, fecha: todayISO() };
    setContactosMarketing((p) => [...p, fila]); // se ve al instante
    registrarContactoMarketing(fila).catch(() => {
      showToast("No se pudo anotar el contacto. ¿Has pegado el esquema nuevo en Supabase?", "error");
      refreshContactosMarketing();
    });
  }

  // ---- Avisos para las empleadas ----
  async function cerrarAvisos() {
    const lista = avisosPopup || [];
    setAvisosPopup(null);
    if (!lista.length || !currentUser) return;
    const filas = lista.map((a) => filaVisto({ avisoId: a.id, empleadaId: currentUser.id, fecha: todayISO() }));
    setAvisosVistos((v) => [...v, ...filas]); // se ve al instante (no vuelve a salir)
    try { await marcarAvisosVistos(filas); } catch (err) { showToast("No se pudo anotar que has visto el aviso.", "error"); }
    refreshAvisosVistos();
  }
  async function guardarAvisoApp(a) {
    try {
      if (a.id) await updateAviso(a);
      else await insertAviso({ ...a, id: uid() });
      await refreshAvisos();
      showToast(a.id ? "Aviso actualizado" : "Aviso creado");
    } catch (err) {
      throw new Error(`No se pudo guardar el aviso (${err.message}). ¿Has pegado el esquema nuevo en Supabase?`);
    }
  }
  function borrarAvisoApp(a) {
    setConfirmDialog({
      titulo: `Eliminar el aviso «${a.titulo}»`,
      mensaje: "Se borra el aviso y ya no le saldrá a nadie.",
      textoConfirmar: "Eliminar aviso",
      peligroso: true,
      onConfirmar: () => withErrorToast(async () => { await deleteAviso(a.id); await refreshAvisos(); showToast("Aviso eliminado"); }, "No se pudo eliminar el aviso."),
    });
  }
  const alternarAvisoApp = (a) => withErrorToast(async () => { await updateAviso({ ...a, activo: a.activo === false }); await refreshAvisos(); }, "No se pudo cambiar el aviso.");

  // ---- Cursos de ventas ----
  // El test lo corrige el servidor (aquí no están las respuestas correctas): devuelve la nota y qué fallaste
  async function responderTest(leccionId, respuestas) {
    const res = await fetch("/api/cursos/responder", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leccionId, respuestas }) });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) throw new Error(data?.error || `No se pudo corregir el test (${res.status}).`);
    await refreshResultadosCursos();
    return data.resultado;
  }
  async function guardarLeccionApp(l) {
    try {
      if (l.id) await updateLeccion(l);
      else await insertLeccion({ ...l, id: uid(), orden: Math.max(-1, ...lecciones.map((x) => x.orden ?? 0)) + 1 });
      await refreshLecciones();
      showToast(l.id ? "Clase actualizada" : "Clase creada");
    } catch (err) {
      throw new Error(`No se pudo guardar la clase (${err.message}). ¿Has pegado el esquema nuevo en Supabase?`);
    }
  }
  function borrarLeccionApp(l) {
    setConfirmDialog({
      titulo: `Eliminar la clase «${l.titulo}»`,
      mensaje: "Se borra la clase y su test. Los resultados que ya se guardaron de ese test se conservan.",
      textoConfirmar: "Eliminar clase",
      peligroso: true,
      onConfirmar: () => withErrorToast(async () => { await deleteLeccion(l.id); await refreshLecciones(); showToast("Clase eliminada"); }, "No se pudo eliminar la clase."),
    });
  }
  function guardarObjetivoApp(empleadaId, valor, tipo = "extra") {
    withErrorToast(async () => {
      if (tipo === "ticket") await guardarObjetivoTicket(empleadaId, valor);
      else await guardarObjetivoExtra(empleadaId, valor);
      await refreshEmpleadas();
      showToast(tipo === "ticket" ? (valor > 0 ? `Objetivo de ticket medio: ${valor} €` : "Objetivo de ticket medio quitado") : valor > 0 ? `Objetivo semanal de ventas extra: ${valor} €` : "Objetivo semanal quitado");
    }, "No se pudo guardar el objetivo. ¿Has pegado el esquema nuevo en Supabase?");
  }
  // aviso rojo en el menú: tests obligatorios de esta semana sin aprobar (solo para las empleadas)
  // «Primera configuración»: en una instalación nueva, al entrar el administrador (con el código de ejemplo) se le pide lo básico una vez
  const [instalacion, setInstalacion] = useState(null); // null = sin mirar; { pendiente, usuario }
  useEffect(() => {
    if (!currentUser || currentUser.rol !== "admin") return undefined;
    let parado = false;
    fetch("/api/instalacion", { cache: "no-store" }).then((r) => r.json()).then((d) => { if (!parado) setInstalacion(d); }).catch(() => {});
    return () => { parado = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, currentUser?.rol]);

  // Circulito de «citas nuevas» en el menú Agenda: las que entran (reserva online, bot de IA, GHL u otra persona) desde la última vez que se
  // abrió la Agenda. Al abrirla se pone a cero y vuelve a contar las que vayan entrando. Se recuerda en este navegador para cada persona.
  const [marcaAgenda, setMarcaAgenda] = useState("");
  const guardarMarcaAgenda = useCallback((m) => {
    if (!m || !currentUser) return;
    setMarcaAgenda(m);
    try { window.localStorage.setItem(claveMarca(currentUser.id), m); } catch (e) { /* sin almacenamiento: solo dura esta sesión */ }
  }, [currentUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!currentUser || loading) return;
    let guardada = "";
    try { guardada = window.localStorage.getItem(claveMarca(currentUser.id)) || ""; } catch (e) { guardada = ""; }
    if (guardada) setMarcaAgenda(guardada);
    else guardarMarcaAgenda(marcaVistas(appointments) || new Date().toISOString()); // la primera vez se empieza a contar desde ahora
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, loading]);
  // Con la Agenda abierta (y a la vista) todo lo que entra queda visto
  useEffect(() => {
    if (view !== "agenda" || !currentUser || loading) return;
    if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
    const m = marcaVistas(appointments);
    if (m && (!marcaAgenda || Date.parse(m) > Date.parse(marcaAgenda))) guardarMarcaAgenda(m);
  }, [view, appointments, currentUser?.id, loading, marcaAgenda, guardarMarcaAgenda]);
  const nuevasAgenda = view === "agenda" ? 0 : citasNuevas(appointments, { marca: marcaAgenda, usuarioId: currentUser?.id }).length;

  const testsPendientesMios = !currentUser || currentUser.rol === "admin" ? 0 : testsPendientes({ lecciones, resultados: resultadosCursos, empleadaId: currentUser.id, semana: lunesDeCursos(todayISO()) }).length;

  // ---- Productos: exportar e importar ----
  function exportarCatalogoProductos(formato) {
    const fecha = todayISO();
    if (formato === "csv") descargarTexto(`productos-clinic-nails-${fecha}.csv`, exportarProductosCSV(productos), "text/csv");
    else descargarJSON(`productos-clinic-nails-${fecha}.json`, exportarProductosJSON(productos));
    showToast(`Exportados ${productos.length} productos (${formato === "csv" ? "CSV para Excel" : "JSON"}): se pueden volver a importar.`);
  }
  const productoUsado = (id) =>
    appointments.some((a) => (a.productos || []).some((l) => l.productoId === id)) || ventas.some((v) => (v.productos || []).some((l) => l.productoId === id));
  // Los que tienen ventas o citas no se borran (sus ventas se quedarían sin producto): se desactivan
  async function aplicarImportacionProductos(plan) {
    const resumen = { creados: 0, reemplazados: 0, borrados: 0, desactivados: 0, errores: [] };
    const nuevos = plan.crear.map((imp) => productoNuevo(imp, uid()));
    const reemplazos = plan.reemplazar.map(({ existente, nuevo }) => cambiosDeReemplazoProducto(existente, nuevo));
    try {
      await importarProductos({ nuevos, reemplazos });
      resumen.creados = nuevos.length;
      resumen.reemplazados = reemplazos.length;
    } catch (err) {
      resumen.errores.push(`No se pudo importar (${err.message}). No se ha borrado nada.`);
      return resumen;
    }
    for (const p of [...plan.borrar, ...plan.desactivar]) {
      try {
        if (plan.borrar.includes(p)) { await deleteProducto(p.id); resumen.borrados++; }
        else { await updateProducto({ ...p, activo: false }); resumen.desactivados++; }
      } catch (err) {
        resumen.errores.push(`«${p.nombre}»: ${err.message}`);
      }
    }
    await refreshProductos();
    return resumen;
  }

  // ---- Mover y reprogramar citas, y confirmar la asistencia ----
  // Poner una cita en otro hueco (arrastrando o reprogramando). Si cambia de día, hora o empleada, su confirmación vuelve a «pendiente».
  function moverCitaA(cita, empleadaId, inicio, fecha = cita.fecha) {
    const emp = employees.find((e) => e.id === empleadaId);
    if (!emp) return;
    const citasMismoDia = appointments.filter((a) => a.fecha === fecha && a.id !== cita.id);
    const servicio = services.find((sv) => sv.id === cita.servicioId);
    const cabinaId = servicio ? elegirCabina(servicio, cabins, citasMismoDia, inicio, cita.duracion, cita.cabinaId) || cita.cabinaId : cita.cabinaId;
    // Avisos (no bloquean): se permite poner la cita en cualquier hueco
    const avisos = avisosDeMovimiento({ cita, empleada: emp, servicio, fecha, inicio, citas: appointments, bloqueos, horario: horarioDelDia(emp, fecha, appointments) });
    const cambioDeDia = fecha !== cita.fecha;
    const reiniciar = cambioDeDia || inicio !== cita.inicio || empleadaId !== cita.empleadaId;
    // Se ve el cambio al instante; si falla, se recarga el estado real
    setAppointments((prev) => prev.map((a) => (a.id === cita.id ? { ...a, fecha, empleadaId, inicio, cabinaId, ...(reiniciar ? { confirmacion: "pendiente", confirmacionPor: "", confirmacionEn: null } : {}) } : a)));
    withErrorToast(async () => {
      try {
        await updateCitaRow({ ...cita, fecha, empleadaId, inicio, cabinaId, modificadoPor: currentUser.id, reiniciarConfirmacion: reiniciar });
      } catch (err) {
        await refreshCitas();
        throw err;
      }
      await refreshCitas();
      const tras = avisos.length ? ` · Aviso: ${avisos.join("; ")}` : "";
      showToast(cambioDeDia ? `Cita de ${cita.clienta} reprogramada: ${diaLargo(fecha)} a las ${minToLabel(inicio)} con ${emp.nombre}${tras}.` : `Cita movida a las ${minToLabel(inicio)} con ${emp.nombre}${tras}.`);
      sincronizarGHL("sync-cita", { citaId: cita.id }, showToast, { soloErrores: true });
    }, "No se pudo mover la cita.");
  }
  // «Reprogramar» desde la cita: se vuelve a la agenda, en el día de la cita, para elegir el hueco nuevo con un clic
  function iniciarReprogramar(cita) {
    setCitaModal(null);
    setView("agenda");
    setDay(cita.fecha);
    setReprogramando(cita);
  }
  const avisosParaHueco = (empleadaId, fecha, inicio) => {
    const emp = employees.find((e) => e.id === empleadaId);
    if (!emp || !reprogramando) return [];
    const servicio = services.find((sv) => sv.id === reprogramando.servicioId);
    return avisosDeMovimiento({ cita: reprogramando, empleada: emp, servicio, fecha, inicio, citas: appointments, bloqueos, horario: horarioDelDia(emp, fecha, appointments) });
  };
  // ✋ Confirmada · No cogió la llamada · Pendiente (se ve al instante)
  function anotarConfirmacion(cita, estado) {
    withErrorToast(async () => {
      const pendiente = estado === "pendiente";
      setAppointments((prev) => prev.map((a) => (a.id === cita.id ? { ...a, confirmacion: estado, confirmacionPor: pendiente ? "" : currentUser.nombre, confirmacionEn: pendiente ? null : new Date().toISOString() } : a)));
      try {
        await marcarConfirmacion(cita.id, estado, currentUser.nombre);
      } catch (err) {
        await refreshCitas();
        throw err;
      }
      await refreshCitas();
      showToast(estado === "confirmada" ? `✋ ${cita.clienta}: confirmada` : estado === "no_contesta" ? `${cita.clienta}: no cogió la llamada` : `${cita.clienta}: confirmación quitada`);
    }, "No se pudo anotar la confirmación.");
  }

  // ---- Eliminar un servicio (la X del catálogo) ----
  function pedirEliminarServicio(sv) {
    const nCitas = appointments.filter((a) => a.servicioId === sv.id || (a.serviciosExtra || []).includes(sv.id)).length;
    const nBonos = bonos.filter((b) => serviciosDeBono(b).includes(sv.id)).length + bonosVendidos.filter((b) => serviciosDeBono(b).includes(sv.id)).length;
    setEliminarServicio({ sv, nCitas, nBonos });
  }
  function confirmarEliminarServicio() {
    const { sv } = eliminarServicio;
    withErrorToast(async () => {
      await deleteServicio(sv.id);
      await refreshServicios();
      setEliminarServicio(null);
      showToast(`Servicio «${sv.nombre}» eliminado`);
    }, "No se pudo eliminar el servicio.");
  }
  function desactivarEnVezDeEliminar() {
    const { sv } = eliminarServicio;
    withErrorToast(async () => {
      await updateServicio({ ...sv, activo: false });
      await refreshServicios();
      setEliminarServicio(null);
      showToast(`Servicio «${sv.nombre}» desactivado`);
    }, "No se pudo desactivar el servicio.");
  }

  // ---- Catálogo de servicios: orden, categorías y exportación ----
  function ordenarServiciosApp(ids) {
    const items = posiciones(ids);
    const nuevo = Object.fromEntries(items.map((x) => [x.id, x.orden]));
    setServices((prev) => prev.map((sv) => (sv.id in nuevo ? { ...sv, orden: nuevo[sv.id] } : sv))); // se ve al instante
    const completos = services.filter((sv) => sv.id in nuevo).map((sv) => ({ ...sv, orden: nuevo[sv.id] })); // filas completas (ver db.js)
    guardarOrdenServicios(completos).catch((err) => {
      refreshServicios();
      showToast(`No se pudo guardar el orden (${err.message}). ¿Has pegado el esquema nuevo en Supabase?`, "error");
    });
  }
  const filasCategorias = () => listaCategorias(services, categoriasSrv).filter((c) => c.nombre !== "");
  function ordenarCategoriasApp(nombres) {
    withErrorToast(async () => {
      const porNombre = Object.fromEntries(filasCategorias().map((c) => [claveCategoria(c.nombre), c]));
      const filas = nombres.map((n, i) => ({ id: porNombre[claveCategoria(n)]?.id || uid(), nombre: n, descripcion: porNombre[claveCategoria(n)]?.descripcion || "", orden: i }));
      setCategoriasSrv(filas); // se ve al instante
      await upsertCategoriasServicios(filas);
      await refreshCategoriasSrv();
    }, "No se pudo guardar el orden de las categorías. ¿Has pegado el esquema nuevo en Supabase?");
  }
  function guardarCategoriaApp({ id, nombreAnterior, nombre, descripcion }) {
    withErrorToast(async () => {
      const existente = filasCategorias().find((c) => claveCategoria(c.nombre) === claveCategoria(nombreAnterior || "\u0000"));
      const cambiaNombre = nombreAnterior != null && nombreAnterior !== nombre;
      if (cambiaNombre) {
        const suyos = serviciosDeCategoria(services, nombreAnterior);
        if (suyos.length) await guardarCategoriaServicios(suyos.map((sv) => ({ ...sv, categoria: nombre })));
      }
      const orden = existente ? Math.max(0, categoriasSrv.find((c) => c.id === (id || existente.id))?.orden ?? filasCategorias().indexOf(existente)) : filasCategorias().length;
      await upsertCategoriasServicios([{ id: id || existente?.id || uid(), nombre, descripcion, orden }]);
      await Promise.all([refreshServicios(), refreshCategoriasSrv()]);
      setCategoriaModal(null);
      showToast(nombreAnterior == null ? "Categoría creada" : "Categoría actualizada");
    }, "No se pudo guardar la categoría. ¿Has pegado el esquema nuevo en Supabase?");
  }
  function borrarCategoriaApp(cat) {
    setConfirmDialog({
      titulo: `Eliminar la categoría «${cat.nombre}»`,
      mensaje: cat.total ? `Sus ${cat.total} servicios NO se borran: pasarán a «Sin categoría».` : "La categoría está vacía.",
      textoConfirmar: "Eliminar categoría",
      peligroso: true,
      onConfirmar: () =>
        withErrorToast(async () => {
          const suyos = serviciosDeCategoria(services, cat.nombre);
          if (suyos.length) await guardarCategoriaServicios(suyos.map((sv) => ({ ...sv, categoria: "" })));
          if (cat.id) await deleteCategoriaServicio(cat.id);
          await Promise.all([refreshServicios(), refreshCategoriasSrv()]);
          setCategoriaModal(null);
          showToast("Categoría eliminada");
        }, "No se pudo eliminar la categoría."),
    });
  }
  function exportarCatalogo() {
    const datos = exportarServicios(services, categoriasSrv);
    descargarJSON(`servicios-clinic-nails-${todayISO()}.json`, datos);
    showToast(`Exportados ${services.length} servicios en ${datos.length} categorías (se pueden volver a importar).`);
  }

  // Importar servicios de un archivo: crea los nuevos, reemplaza los que ya existen y (si se pide) retira los que sobran.
  // Lo que tiene citas o bonos NO se borra (su historial se quedaría sin servicio): se desactiva.
  async function aplicarImportacionServicios(plan, { empleadas, deCero = false, categorias = [] }) {
    const resumen = { creados: 0, reemplazados: 0, borrados: 0, desactivados: 0, errores: [] };
    const contadores = {};
    services.forEach((sv) => { const k = claveCategoria(sv.categoria || ""); contadores[k] = (contadores[k] || 0) + 1; });
    // Posición: al empezar de cero, la del archivo; si no, los nuevos van detrás de los que ya había en esa categoría
    const finalDe = {};
    services.forEach((sv) => { const k = claveCategoria(sv.categoria || ""); finalDe[k] = Math.max(finalDe[k] ?? -1, sv.orden ?? 0); });
    const desplazo = (cat) => (deCero ? 0 : (finalDe[claveCategoria(cat)] ?? -1) + 1);
    const nuevos = plan.crear.map((imp) => {
      const k = claveCategoria(imp.categoria);
      const color = colorPorDefecto(imp.categoria, contadores[k] || 0);
      contadores[k] = (contadores[k] || 0) + 1;
      return { ...servicioNuevo(imp, { id: uid(), empleadas, color }), orden: (imp.orden ?? 0) + desplazo(imp.categoria) };
    });
    // filas completas: la ficha que ya tenía (empleadas, cabina, color…) con los datos del archivo encima
    const reemplazos = plan.reemplazar.map(({ existente, nuevo }) => ({ ...existente, ...cambiosDeReemplazo(existente, nuevo), orden: deCero ? nuevo.orden ?? 0 : existente.orden ?? 0 }));
    // Categorías: las del archivo (con su descripción) y su orden; si se empieza de cero, primero las del archivo
    const clv = claveCategoria;
    const actuales = filasCategorias();
    const delArchivo = categorias.map((c) => c.nombre);
    const orden = deCero
      ? [...delArchivo, ...actuales.map((c) => c.nombre).filter((n) => !delArchivo.some((x) => clv(x) === clv(n)))]
      : [...actuales.map((c) => c.nombre), ...delArchivo.filter((n) => !actuales.some((c) => clv(c.nombre) === clv(n)))];
    const filasCat = orden.map((nombre, i) => {
      const guardada = categoriasSrv.find((c) => clv(c.nombre) === clv(nombre));
      const delFile = categorias.find((c) => clv(c.nombre) === clv(nombre));
      return { id: guardada?.id || uid(), nombre: delFile?.nombre || nombre, descripcion: delFile?.descripcion || guardada?.descripcion || "", orden: i };
    });
    try {
      await importarServicios({ nuevos, reemplazos, categorias: filasCat });
      resumen.creados = nuevos.length;
      resumen.reemplazados = reemplazos.length;
    } catch (err) {
      resumen.errores.push(`No se pudo importar (${err.message}). No se ha borrado nada.`);
      return resumen; // si falla lo primero no se toca nada más
    }
    for (const sv of [...plan.borrar, ...plan.desactivar]) {
      const borrar = plan.borrar.includes(sv);
      try {
        if (!borrar) await updateServicio({ ...sv, activo: false });
        if (borrar) { await deleteServicio(sv.id); resumen.borrados++; } else resumen.desactivados++;
      } catch (err) {
        resumen.errores.push(`«${sv.nombre}»: ${err.message}`);
      }
    }
    // Al empezar de cero, las categorías guardadas que ya no tienen servicios (ni los desactivados) se retiran
    if (deCero) {
      const enUso = new Set([...delArchivo, ...plan.desactivar.map((sv) => sv.categoria || ""), ...plan.conservar.map((sv) => sv.categoria || "")].map((n) => clv(n)));
      for (const c of categoriasSrv) if (c.id && !enUso.has(clv(c.nombre))) await deleteCategoriaServicio(c.id).catch(() => {});
    }
    await Promise.all([refreshServicios(), refreshCategoriasSrv()]);
    return resumen;
  }

  // Empleada y hora con las que arrancan «Añadir cita» y «Añadir horario no disponible»
  function valoresAnadir() {
    return {
      empleadaId: activeStaffForAgenda.find((e) => trabajaEseDia(e, day, appointments))?.id || activeStaffForAgenda[0]?.id,
      inicio: Math.min(Math.max(Math.round(nowMinutesExact() / 30) * 30, DAY_START), DAY_END - 30),
    };
  }

  function requestPin({ title, subtitle, empleadaId, onSuccess }) {
    setPinRequest({ title, subtitle, empleadaId, onSuccess });
  }

  async function withErrorToast(fn, mensajeError) {
    try {
      await fn();
    } catch (err) {
      console.error(err);
      const detalle = err?.message ? ` (${err.message})` : "";
      showToast((mensajeError || "Algo falló al guardar en Supabase.") + detalle, "error");
    }
  }

  const activeEmployees = employees.filter((e) => e.activa);
  const activeStaffForAgenda = activeEmployees.filter((e) => e.rol !== "admin");

  const notificaciones = notifBaseline
    ? appointments
        .filter((a) => !notifBaseline.has(a.id) && a.creadoPor !== currentUser?.id)
        .sort((a, b) => (a.creadoEn < b.creadoEn ? 1 : -1))
        .slice(0, 20)
    : [];
  const notifNoLeidas = notificaciones.filter((n) => !notifVistas.has(n.id));

  function marcarNotificacionesLeidas() {
    setNotifVistas((prev) => {
      const next = new Set(prev);
      notificaciones.forEach((n) => next.add(n.id));
      try {
        window.localStorage.setItem("cnb_notif_vistas", JSON.stringify([...next].slice(-300)));
      } catch (e) {
        // no pasa nada
      }
      return next;
    });
  }

  // -------------------------------------------------------------------------
  // Pantallas de carga / error
  // -------------------------------------------------------------------------

  if (loadError) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 24 }}>
        <div className="card" style={{ maxWidth: 480, padding: 24, textAlign: "center" }}>
          <AlertTriangle size={22} style={{ marginBottom: 10, color: "var(--danger)" }} />
          <h2 style={{ fontSize: 19, marginBottom: 10 }}>No hay conexión con la base de datos</h2>
          <p style={{ fontSize: 13.5, color: "rgba(var(--ink-rgb),0.7)", lineHeight: 1.6 }}>{loadError}</p>
        </div>
      </div>
    );
  }

  if (!authChecked || (sesion && loading)) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", gap: 10, color: "rgba(var(--ink-rgb),0.68)" }}>
        <Loader2 size={18} className="spin" />
        Cargando datos…
        <style>{`.spin { animation: spin 0.8s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLogin={login} aviso={avisoLogin} negocio={negocio} />;
  }

  if (instalacion?.pendiente && currentUser.rol === "admin") {
    return <PrimeraConfiguracion nombreActual={instalacion.usuario?.nombre || currentUser.nombre || ""} onHecho={() => window.location.reload()} onSalir={() => logout()} />;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "transparent", fontFamily: "Outfit, sans-serif", color: "var(--text)" }}>
      <Sidebar
        view={view}
        setView={navegar}
        currentUser={currentUser}
        badges={{ cursos: testsPendientesMios, agenda: nuevasAgenda }}
        badgesAviso={{ agenda: citasPorRevisar(appointments, todayISO()).length }}
        negocio={negocio}
        isMobile={isMobile}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main style={{ flex: 1, minWidth: 0, padding: isMobile ? "16px 16px 110px" : "28px 32px", position: "relative" }}>
        <TopBar
          isMobile={isMobile}
          onOpenSidebar={() => setSidebarOpen(true)}
          currentUser={currentUser}
          onLogout={logout}
          notificaciones={notificaciones}
          notifNoLeidas={notifNoLeidas}
          showNotif={showNotif}
          setShowNotif={(v) => { setShowNotif(v); if (v) marcarNotificacionesLeidas(); }}
          employees={employees}
          tema={tema}
          onToggleTema={toggleTema}
          fichaje={currentUser && currentUser.rol !== "admin" && employees.some((e) => e.id === currentUser.id) ? { estado: estadoFichaje(currentUser.id, fichajeActivo, descansos), onAccion: (accion) => ejecutarFichaje(currentUser.id, accion) } : null}
        />

        {view === "inicio" && (
          <Inicio
            currentUser={currentUser}
            employees={activeEmployees}
            services={services}
            productos={productos}
            appointments={appointments.filter((a) => a.fecha === todayISO())}
            fichajesLog={fichajesLog}
            ventasDirectasHoy={lineasPagoEnRango(ventas, todayISO(), todayISO()).reduce((acc, x) => acc + (Number(x.linea.importe) || 0), 0)}
          />
        )}

        {view === "agenda" && puedeVer(currentUser, "agenda") && (
          <Agenda
            onCorregirServicio={corregirServicioApp} onEstaBienServicio={estaBienServicioApp}
            ventas={ventas}
            fichajeActivo={fichajeActivo}
            descansos={descansos}
            currentUser={currentUser}
            onFichaje={(id, accion) => solicitarFichaje(id, accion)}
            bloqueos={bloqueos}
            onNuevoBloqueo={(empleadaId, inicio) => setBloqueoModal({ modo: "nuevo", empleadaId, inicio, fecha: day })}
            onAnadir={() => setMenuAnadir(true)}
            onEditBloqueo={(b) => setBloqueoModal({ modo: "editar", bloqueo: b })}
            day={day}
            setDay={setDay}
            employees={activeStaffForAgenda}
            services={services}
            cabins={cabins}
            clientes={clientes}
            productos={productos}
            appointments={appointments}
            onSlotClick={(empleadaId, inicio) => setCitaModal({ modo: "nuevo", empleadaId, inicio })}
            onEditCita={(cita) => setCitaModal({ modo: "editar", cita })}
            onMoveCita={(cita, empleadaId, inicio) => moverCitaA(cita, empleadaId, inicio)}
            reprogramando={reprogramando}
            onCancelarReprogramar={() => setReprogramando(null)}
            onReprogramarAqui={(empleadaId, fecha, inicio) => { const c = reprogramando; setReprogramando(null); moverCitaA(c, empleadaId, inicio, fecha); }}
            avisosParaHueco={avisosParaHueco}
            negocio={negocio}
            onMensaje={(texto) => showToast(texto)}
            hoy={todayISO()}
            onConfirmacion={anotarConfirmacion}
          />
        )}

        {view === "clientes" && currentUser.rol === "admin" && (
          <ClientesAdmin
            ui={{ ModalShell, Field, ConfirmDialog }}
            clientes={clientes}
            citas={appointments}
            servicios={services}
            hoy={todayISO()}
            calcularTotal={calcularTotalCliente}
            showToast={showToast}
            onNuevo={() => setClienteModal("nuevo")}
            onEditar={(c) => setClienteModal(c)}
            onVerActividad={(c) => setActividadModal({ titulo: `Actividad de ${c.nombre}`, filtros: [["cliente_id", c.id]] })}
            onVerPerfil={(id) => setPerfilClienteId(id)}
            onToggleFavorito={(id) => {
              const cliente = clientes.find((c) => c.id === id);
              withErrorToast(async () => {
                await updateCliente({ ...cliente, favorito: !cliente.favorito });
                await refreshClientes();
              }, "No se pudo actualizar el cliente.");
            }}
            onEliminar={(c) =>
              withErrorToast(async () => {
                await deleteCliente(c.id);
                await Promise.all([refreshClientes(), refreshCitas()]);
                showToast(`Cliente eliminado: ${c.nombre}`);
              }, "No se pudo eliminar el cliente.")
            }
            onImportar={async (nuevos, completar = []) => {
              const filas = nuevos.map((c) => ({ id: uid(), nombre: c.nombre, telefono: c.telefono || "", email: c.email || "", favorito: false, ...(c.notaFija ? { notaFija: c.notaFija } : {}) }));
              await insertClientes(filas);
              for (const { existente, cambios } of completar) await updateCliente({ ...existente, ...cambios }); // solo rellena lo que faltaba
              await refreshClientes();
              return filas.length;
            }}
          />
        )}

        {view === "productos" && puedeVer(currentUser, "productos") && (
          <Productos
            productos={productos}
            onImportar={() => setImportarProductosModal(true)}
            onExportarCSV={() => exportarCatalogoProductos("csv")}
            onExportarJSON={() => exportarCatalogoProductos("json")}
            onNew={() => setProductoModal("nuevo")}
            onEdit={(p) => setProductoModal(p)}
            onToggleActivo={(id) => {
              const producto = productos.find((p) => p.id === id);
              withErrorToast(async () => {
                await updateProducto({ ...producto, activo: !producto.activo });
                await refreshProductos();
              }, "No se pudo actualizar el producto.");
            }}
          />
        )}

        {view === "ventas" && puedeVer(currentUser, "ventas") && (
          <Ventas appointments={appointments} services={services} productos={productos} metodosPago={metodosPago} employees={employees} ventas={ventas} puedeAnular={puedeAnularCobros(currentUser)} onAnularVenta={anularVenta} />
        )}

        {view === "marketing" && currentUser.rol === "admin" && (
          <Marketing
            ui={{ ModalShell, Field }} negocio={negocio} hoy={todayISO()} empleadas={employees.filter((e) => e.activa !== false && e.rol !== "admin")} citas={appointments} bloqueos={bloqueos}
            servicios={services} clientes={clientes} bonosVendidos={bonosVendidos} bonoUsos={bonoUsos} ventas={ventas} productos={productos} contactos={contactosMarketing}
            horarioDe={(e, f) => horarioDelDia(e, f, appointments)} onContacto={registrarContactoApp} onConfirmacion={anotarConfirmacion}
            onAbrirCita={(c) => { setView("agenda"); setDay(c.fecha); setCitaModal({ modo: "editar", cita: c }); }}
            onAbrirCliente={(c) => setPerfilClienteId(c.id)}
          />
        )}

        {view === "avisos" && currentUser.rol === "admin" && (
          <AvisosAdmin ui={{ ModalShell, Field }} avisos={avisos} empleadas={employees.filter((e) => e.activa !== false && e.rol !== "admin")} onGuardar={guardarAvisoApp} onBorrar={borrarAvisoApp} onAlternar={alternarAvisoApp} />
        )}

        {view === "cursos" && (
          <Cursos
            ui={{ ModalShell, Field }} usuario={currentUser} esAdmin={currentUser.rol === "admin"} employees={employees}
            citas={appointments} ventas={ventas} bonosVendidos={bonosVendidos} servicios={services} productos={productos}
            lecciones={lecciones} resultados={resultadosCursos} hoy={todayISO()}
            onResponder={responderTest} calcularDiagnostico={() => {
              const hoyISO = todayISO(); const equipo = employees.filter((e) => e.activa !== false && e.rol !== "admin");
              const objetivos = equipo.map((e) => Number(e.objetivoTicketMedio) || 0).filter((n) => n > 0);
              return diagnosticoDelNegocio({
                kpis: kpisDelNegocio({ empleadas: equipo, citas: appointments, ventas, bonosVendidos, servicios: services, productos, clientes, hoy: hoyISO }), citas: appointments, hoy: hoyISO,
                ocupacionSemana: ocupacionProximosDias({ empleadas: equipo, citas: appointments, bloqueos, horarioDe: (e, f) => horarioDelDia(e, f, appointments), hoy: hoyISO }),
                bonosSinCita: bonosSinCita({ bonosVendidos, bonoUsos, citas: appointments, hoy: hoyISO }).length, objetivoTicket: objetivos.length ? objetivos.reduce((s, n) => s + n, 0) / objetivos.length : 0,
              });
            }} negocio={negocio} onGuardarLeccion={guardarLeccionApp} onBorrarLeccion={borrarLeccionApp} onGuardarObjetivo={guardarObjetivoApp}
          />
        )}

        {view === "actividad" && currentUser.rol === "admin" && (
          <ActividadSeccion cargar={fetchActividad} ctx={{ empleados: employees, servicios: services, cabinas: cabins, clientes, metodosPago }} />
        )}

        {view === "bonos" && puedeVer(currentUser, "bonos") && (
          <BonosSeccion
            ui={{ ModalShell, ConfirmDialog, Field }}
            bonos={bonos} bonosVendidos={bonosVendidos} usos={bonoUsos} servicios={services} clientes={clientes} hoy={todayISO()}
            puedeGestionar={true} puedeAnular={puedeAnularCobros(currentUser)}
            onNuevo={() => setBonoModal("nuevo")}
            onEditar={(b) => setBonoModal(b)}
            onToggleActivo={(b) => withErrorToast(async () => { await updateBono({ ...b, activo: !b.activo }); await refreshBonos(); }, "No se pudo actualizar el bono.")}
            onVender={(id) => setVentaModal({ preselBonoId: id || undefined })}
            onAnular={anularBonoVendido}
            ventas={ventas}
            metodosPago={metodosPago}
            onCobrarPlazo={cobrarPlazo}
          />
        )}

        {view === "empleadas" && puedeVer(currentUser, "empleadas") && (
          <Empleadas
            employees={employees}
            services={services}
            currentUser={currentUser}
            onNew={() => setEmpleadaModal("nuevo")}
            onEdit={(e) => setEmpleadaModal(e)}
            onToggleActiva={(id) => {
              const empleada = employees.find((e) => e.id === id);
              withErrorToast(async () => {
                await updateEmpleada({ ...empleada, activa: !empleada.activa });
                await refreshEmpleadas();
              }, "No se pudo actualizar la empleada.");
            }}
            onDelete={(emp) => {
              setConfirmDialog({
                titulo: "Eliminar empleada",
                mensaje: `¿Seguro que quieres eliminar a ${emp.nombre}? Esto no se puede deshacer. Sus citas y fichajes pasados se conservan, pero dejarán de mostrar su nombre.`,
                textoConfirmar: "Eliminar",
                peligroso: true,
                onConfirmar: () => {
                  withErrorToast(async () => {
                    // En GHL no se borra nada: su calendario y su usuario pasan a llamarse «empleado-eliminado» y se quedan sin
                    // horario (nadie puede reservarle más). Va ANTES de borrarla aquí, porque hace falta su ficha para localizarlos.
                    await sincronizarGHL("sync-empleada", { empleadaId: emp.id, accion: "baja" }, showToast);
                    await deleteEmpleada(emp.id);
                    await refreshEmpleadas();
                    showToast("Empleada eliminada");
                  }, "No se pudo eliminar la empleada.");
                },
              });
            }}
          />
        )}

        {["inf-resumen", "inf-ventas", "inf-clientes", "inf-ocupacion", "inf-equipo"].includes(view) && puedeVer(currentUser, "informes") && (
          <Informes
            ventas={ventas}
            bloqueos={bloqueos}
            vista={view.slice(4)}
            citas={appointments}
            servicios={services}
            clientes={clientes}
            empleadas={activeStaffForAgenda}
            productos={productos}
            metodos={metodosPago}
            horarioDelDia={horarioDelDia}
            calcularTotal={calcularTotalCita}
            hoy={todayISO()}
            onVerCliente={(id) => setPerfilClienteId(id)}
          />
        )}

        {view === "turnos" && puedeVer(currentUser, "empleadas") && (
          <Turnos
            employees={activeStaffForAgenda}
            appointments={appointments}
            onEdit={(e) => setEmpleadaModal(e)}
            onEditarDia={(empleada, fecha) => setDiaModal({ empleada, fecha })}
          />
        )}

        {view === "servicios" && puedeVer(currentUser, "servicios") && (
          <Servicios
            services={services}
            employees={employees}
            cabins={cabins}
            categorias={categoriasSrv}
            puedeEliminar={currentUser.rol === "admin"}
            onEliminar={pedirEliminarServicio}
            onNew={(categoria) => { setCategoriaInicial(categoria || ""); setServicioModal("nuevo"); }}
            onExportar={exportarCatalogo}
            onOrdenar={ordenarServiciosApp}
            onNuevaCategoria={() => setCategoriaModal("nueva")}
            onEditarCategoria={(c) => setCategoriaModal(c)}
            onMoverCategoria={(nombres, nombre, delta) => ordenarCategoriasApp(moverPasos(nombres, nombre, delta))}
            onOrdenarCategorias={ordenarCategoriasApp}
            onImportar={() => setImportarModal(true)}
            onEdit={(s) => setServicioModal(s)}
            onToggleActivo={(id) => {
              const servicio = services.find((s) => s.id === id);
              withErrorToast(async () => {
                await updateServicio({ ...servicio, activo: !servicio.activo });
                await refreshServicios();
              }, "No se pudo actualizar el servicio.");
            }}
                      onColoresAuto={() =>
              setConfirmDialog({
                titulo: "Asignar colores por categoría",
                mensaje:
                  "Se cambiará el color de todos los servicios según su categoría (cada servicio de una misma categoría tendrá un tono distinto). Los colores que hubieras elegido a mano se sustituirán. Después puedes cambiar cualquiera desde Editar.",
                textoConfirmar: "Asignar colores",
                onConfirmar: () =>
                  withErrorToast(async () => {
                    const contador = {};
                    const cambios = [];
                    for (const sv of services) {
                      const clave = claveCategoria(sv.categoria || "");
                      const idx = contador[clave] || 0;
                      contador[clave] = idx + 1;
                      const color = colorPorDefecto(sv.categoria || "", idx);
                      if (color !== sv.color) cambios.push({ ...sv, color });
                    }
                    const cambiados = cambios.length;
                    await guardarColoresServicios(cambios); // de una vez, aunque sean cientos
                    await refreshServicios();
                    showToast(cambiados ? `Colores asignados a ${cambiados} servicio${cambiados === 1 ? "" : "s"}.` : "Los colores ya estaban asignados.");
                  }, "No se pudieron asignar los colores."),
              })
            }
          />
        )}

        {view === "cabinas" && puedeVer(currentUser, "cabinas") && (
          <Cabinas
            cabins={cabins}
            onNew={() => setCabinaModal("nuevo")}
            onEdit={(c) => setCabinaModal(c)}
            onToggleActiva={(id) => {
              const cabina = cabins.find((c) => c.id === id);
              withErrorToast(async () => {
                await updateCabina({ ...cabina, activa: !cabina.activa });
                await refreshCabinas();
              }, "No se pudo actualizar la cabina.");
            }}
          />
        )}

        {view === "fichajes" && puedeVer(currentUser, "fichajes") && (
          <Fichajes
            employees={activeEmployees}
            fichajeActivo={fichajeActivo}
            descansos={descansos}
            fichajesLog={fichajesLog}
            currentUser={currentUser}
            onFichar={(empleadaId) => {
              const estado = estadoFichaje(empleadaId, fichajeActivo, descansos);
              solicitarFichaje(empleadaId, estado === "fuera" ? "entrada" : estado === "descanso" ? "volver" : "salida");
            }}
            onEditar={(f) => setFichajeModal({ modo: "editar", fichaje: f })}
            onEliminar={eliminarFichaje}
            onNuevo={(fecha) => setFichajeModal({ modo: "nuevo", fecha })}
            onEditarAbierto={(e) => setFichajeAbierto(e)}
          />
        )}

        {view === "configuracion" && currentUser.rol === "admin" && (
          <AjustesPanel
            ajustes={ajustes}
            onGuardarAjuste={guardarAjuste}
            currentUser={currentUser}
            showToast={showToast}
            onPreviewTema={setTemaPreview}
            onImportado={() => refreshCitas()}
            pagos={
              <Configuracion
                metodosPago={metodosPago}
                onNewMetodo={() => setMetodoPagoModal("nuevo")}
                onEditMetodo={(m) => setMetodoPagoModal(m)}
                onToggleMetodo={(id) => {
                  const metodo = metodosPago.find((m) => m.id === id);
                  withErrorToast(async () => {
                    await updateMetodoPago({ ...metodo, activo: !metodo.activo });
                    await refreshMetodosPago();
                  }, "No se pudo actualizar el método de pago.");
                }}
              />
            }
            calendarios={
              <ConexionGHL
                employees={employees.filter((e) => e.activa)}
                appointments={appointments}
                onAsignarCalendario={(empleadaId, calendarId) => {
                  const emp = employees.find((e) => e.id === empleadaId);
                  withErrorToast(async () => {
                    await updateEmpleada({ ...emp, ghlCalendarId: calendarId });
                    await refreshEmpleadas();
                    showToast(calendarId ? `Calendario asignado a ${emp.nombre}` : `${emp.nombre} vuelve a usar el calendario general`);
                  }, "No se pudo asignar el calendario.");
                }}
              />
            }
            botIA={<BotGHL services={services} showToast={showToast} nombreNegocio={negocio} citas={appointments} empleadas={employees} hoy={todayISO()} />}
            negocio={negocio} acento={temaEfectivo?.acento}
            horariosGHL={<HorariosGHL empleadas={employees.filter((e) => e.activa !== false && e.rol !== "admin")} showToast={showToast} onEnviado={() => refreshEmpleadas()} />}
          />
        )}

        {toast && <Toast msg={toast.msg} tipo={toast.tipo} />}

        {empleadaModal && (
          <EmpleadaModal
            esAdmin={currentUser.rol === "admin"}
            data={empleadaModal === "nuevo" ? null : empleadaModal}
            services={services}
            appointments={appointments}
            employees={employees}
            onClose={() => setEmpleadaModal(null)}
            onUploadFoto={async (empleadaId, file) => {
              try {
                return await subirFotoEmpleada(empleadaId, file);
              } catch (err) {
                console.error(err);
                showToast("No se pudo subir la foto.", "error");
                throw err;
              }
            }}
            onSave={(data) => {
              withErrorToast(async () => {
                const antes = employees.find((e) => e.id === data.id); // para saber si cambió su horario semanal
                if (empleadaModal === "nuevo") {
                  await insertEmpleada(data);
                  showToast("Empleada añadida");
                } else {
                  await updateEmpleada(data);
                  showToast("Empleada actualizada");
                }
                // Los servicios que marcaste en la ficha se aplican en cada servicio
                // (es la lista que usa el calendario al elegir qué puede hacer cada una).
                const marcados = data.servicios || [];
                const cambios = services.filter((sv) => (sv.empleadas || []).includes(data.id) !== marcados.includes(sv.id));
                for (const sv of cambios) {
                  const empleadas = marcados.includes(sv.id)
                    ? [...(sv.empleadas || []), data.id]
                    : (sv.empleadas || []).filter((x) => x !== data.id);
                  await updateServicio({ ...sv, empleadas });
                }
                if (cambios.length) await refreshServicios();
                await refreshEmpleadas();
                setEmpleadaModal(null);
                // Su calendario en GHL: si aún no lo tiene, se le crea y se le asigna solo (si ya existe su usuario en GHL)
                if (puedeVer(currentUser, "empleadas") && data.rol !== "admin" && data.activa !== false) {
                  sincronizarGHL("sync-empleada", { empleadaId: data.id }, showToast).then(() => refreshEmpleadas());
                  // Si cambió su horario semanal y ya se le envió antes (desde Configuración → Conexiones), se actualiza solo en GHL
                  if (empleadaModal !== "nuevo" && antes && horarioCambio(antes, data)) sincronizarGHL("sync-horario", { empleadaId: data.id, soloSiYaSincronizada: true }, showToast);
                }
              }, "No se pudo guardar la empleada.");
            }}
          />
        )}

        {servicioModal && (
          <ServicioModal
            data={servicioModal === "nuevo" ? null : servicioModal}
            categoriaInicial={categoriaInicial}
            employees={employees}
            cabins={cabins}
            services={services}
            onClose={() => setServicioModal(null)}
            onSave={(data) => {
              withErrorToast(async () => {
                let servicioId = data.id;
                if (servicioModal === "nuevo") {
                  servicioId = uid();
                  const ordenFinal = Math.max(-1, ...services.filter((x) => claveCategoria(x.categoria || "") === claveCategoria(data.categoria || "")).map((x) => x.orden ?? 0)) + 1;
                  await insertServicio({ ...data, id: servicioId, orden: ordenFinal }); // al final de su categoría
                  showToast("Servicio creado");
                } else {
                  await updateServicio(data);
                  showToast("Servicio actualizado");
                }
                await refreshServicios();
                setServicioModal(null);
              }, "No se pudo guardar el servicio.");
            }}
          />
        )}

        {cabinaModal && (
          <CabinaModal
            data={cabinaModal === "nuevo" ? null : cabinaModal}
            onClose={() => setCabinaModal(null)}
            onSave={(data) => {
              withErrorToast(async () => {
                if (cabinaModal === "nuevo") {
                  await insertCabina({ ...data, id: uid() });
                  showToast("Cabina creada");
                } else {
                  await updateCabina(data);
                  showToast("Cabina actualizada");
                }
                await refreshCabinas();
                setCabinaModal(null);
              }, "No se pudo guardar la cabina.");
            }}
          />
        )}

        {avisosPopup && <AvisosPopup ui={{ ModalShell }} avisos={avisosPopup} onEntendido={cerrarAvisos} />}
        {eliminarServicio && (
          <ModalShell title={`Eliminar «${eliminarServicio.sv.nombre}»`} onClose={() => setEliminarServicio(null)} ancho={520}>
            <div data-eliminar-servicio="1" style={{ fontSize: 14.5, lineHeight: 1.55 }}>
              {eliminarServicio.nCitas + eliminarServicio.nBonos > 0 ? (
                <>
                  <p style={{ marginTop: 0 }}>Este servicio ya se ha usado: <strong>{eliminarServicio.nCitas} {eliminarServicio.nCitas === 1 ? "cita" : "citas"}</strong>{eliminarServicio.nBonos > 0 && <> y <strong>{eliminarServicio.nBonos} {eliminarServicio.nBonos === 1 ? "bono" : "bonos"}</strong></>}.
                    Si lo eliminas, esas citas se quedan <strong>sin servicio</strong> (siguen existiendo, pero sin su nombre ni su precio en los informes){eliminarServicio.nBonos > 0 && " y los bonos que lo incluían ya no se podrán usar en él"}. <strong>No se puede deshacer.</strong></p>
                  <p>Si solo quieres que no se pueda elegir más, mejor <strong>desactívalo</strong>: no se pierde nada.</p>
                </>
              ) : (
                <p style={{ marginTop: 0 }}>No se ha usado en ninguna cita ni bono. Se elimina para siempre.</p>
              )}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setEliminarServicio(null)}>Cancelar</button>
                {eliminarServicio.nCitas + eliminarServicio.nBonos > 0 && eliminarServicio.sv.activo !== false && <button type="button" className="btn btn-ghost" data-desactivar-en-vez="1" onClick={desactivarEnVezDeEliminar}>Desactivarlo en su lugar</button>}
                <button type="button" className="btn btn-gold" data-confirmar-eliminar-servicio="1" style={{ background: "var(--danger)", borderColor: "var(--danger)", color: "#fff" }} onClick={confirmarEliminarServicio}>Eliminar «{eliminarServicio.sv.nombre}»</button>
              </div>
            </div>
          </ModalShell>
        )}
        {categoriaModal && (
          <CategoriaModal
            data={categoriaModal === "nueva" ? null : categoriaModal}
            existentes={listaCategorias(services, categoriasSrv)}
            onClose={() => setCategoriaModal(null)}
            onSave={guardarCategoriaApp}
            onDelete={borrarCategoriaApp}
          />
        )}
        {importarProductosModal && (
          <ImportarProductosModal ui={{ ModalShell, Field }} productos={productos} esAdmin={currentUser.rol === "admin"} usado={productoUsado} onClose={() => setImportarProductosModal(false)} onAplicar={aplicarImportacionProductos} />
        )}
        {importarModal && (
          <ImportarServiciosModal
            services={services}
            employees={employees.filter((e) => e.activa && e.rol !== "admin")}
            esAdmin={currentUser.rol === "admin"}
            usado={(id) =>
              appointments.some((a) => a.servicioId === id || (a.serviciosExtra || []).includes(id)) ||
              bonos.some((b) => serviciosDeBono(b).includes(id)) ||
              bonosVendidos.some((b) => serviciosDeBono(b).includes(id))
            }
            onClose={() => setImportarModal(false)}
            onAplicar={aplicarImportacionServicios}
          />
        )}
        {menuAnadir && (
          <MenuAnadir
            conVenta={puedeVer(currentUser, "agenda")}
            onCerrar={() => setMenuAnadir(false)}
            onCita={() => { setMenuAnadir(false); setCitaModal({ modo: "nuevo", ...valoresAnadir() }); }}
            onVenta={() => { setMenuAnadir(false); setVentaModal({}); }}
            onBloqueo={() => { setMenuAnadir(false); setBloqueoModal({ modo: "nuevo", ...valoresAnadir(), fecha: day }); }}
          />
        )}
        {actividadModal && (
          <ActividadModal
            ui={{ ModalShell }} titulo={actividadModal.titulo} filtros={actividadModal.filtros} cargar={fetchActividad}
            ctx={{ empleados: employees, servicios: services, cabinas: cabins, clientes, metodosPago }}
            nivel={2} onClose={() => setActividadModal(null)}
          />
        )}
        {fichajeAbierto && fichajeActivo[fichajeAbierto.id] != null && (
          <FichajeAbiertoModal
            empleada={fichajeAbierto} entrada={fichajeActivo[fichajeAbierto.id]} enDescanso={descansos[fichajeAbierto.id] != null}
            onClose={() => setFichajeAbierto(null)}
            onGuardarEntrada={(entrada) => guardarEntradaAbierta(fichajeAbierto, entrada)}
            onCerrar={(entrada, salida) => cerrarFichajeAbierto(fichajeAbierto, descansos[fichajeAbierto.id] != null, entrada, salida)}
          />
        )}
        {fichajeModal && (
          <FichajeModal
            data={fichajeModal.modo === "editar" ? fichajeModal.fichaje : null}
            defaults={fichajeModal}
            employees={activeEmployees.filter((e) => e.rol !== "admin")}
            onClose={() => setFichajeModal(null)}
            onSave={guardarFichaje}
          />
        )}
        {ventaModal && (
          <VentaRapida
            ui={{ ModalShell, Field }}
            clientes={clientes} productos={productos} bonos={bonos} metodosPago={metodosPago}
            preselBonoId={ventaModal.preselBonoId}
            citasHoy={appointments.filter((a) => a.fecha === todayISO() && a.clienteId && a.estadoCobro !== "cobrada" && (a.asistencia || "prevista") === "prevista")}
            servicios={services}
            totalDeCita={(c) => calcularTotalCita(c, services, productos)}
            onClose={() => setVentaModal(null)}
            onConfirmar={confirmarVenta}
            onCrearCliente={crearClienteDesdeVenta}
          />
        )}
        {bonoModal && (
          <BonoModal
            ui={{ ModalShell, Field }}
            data={bonoModal === "nuevo" ? null : bonoModal}
            servicios={services}
            onClose={() => setBonoModal(null)}
            onSave={guardarBono}
          />
        )}

        {alertaFichaje && employees.find((e) => e.id === alertaFichaje.empleadaId) && (
          <AlertaFichaje
            alerta={alertaFichaje}
            empleada={employees.find((e) => e.id === alertaFichaje.empleadaId)}
            onCerrar={() => setAlertaFichaje(null)}
            onFichar={() => {
              const id = alertaFichaje.empleadaId;
              setAlertaFichaje(null);
              ejecutarFichaje(id, alertaFichaje.tipo === "entrada" ? "entrada" : "salida");
            }}
          />
        )}

        {bloqueoModal && (
          <BloqueoModal
            data={bloqueoModal.modo === "editar" ? bloqueoModal.bloqueo : null}
            defaults={bloqueoModal}
            employees={activeStaffForAgenda}
            appointments={appointments}
            onClose={() => setBloqueoModal(null)}
            onSave={(b) => {
              withErrorToast(async () => {
                if (bloqueoModal.modo === "editar") {
                  await updateBloqueo({ ...bloqueoModal.bloqueo, ...b });
                  showToast("Horario actualizado");
                  sincronizarGHL("sync-bloqueo", { bloqueoId: bloqueoModal.bloqueo.id }, showToast);
                } else {
                  const nuevoId = uid();
                  await insertBloqueo({ ...b, id: nuevoId, creadoPor: currentUser.id });
                  showToast("Horario marcado como no disponible");
                  sincronizarGHL("sync-bloqueo", { bloqueoId: nuevoId }, showToast);
                }
                await refreshBloqueos();
                setBloqueoModal(null);
              }, "No se pudo guardar el horario no disponible.");
            }}
            onDelete={() => {
              withErrorToast(async () => {
                const ghlEventId = bloqueoModal.bloqueo.ghlEventId;
                await deleteBloqueo(bloqueoModal.bloqueo.id);
                if (ghlEventId) sincronizarGHL("eliminar-cita", { ghlEventId }, showToast); // también libera el hueco en GHL
                await refreshBloqueos();
                setBloqueoModal(null);
                showToast("Horario libre de nuevo");
              }, "No se pudo quitar el bloqueo.");
            }}
          />
        )}

        {clienteModal && (
          <ClienteModal
            data={clienteModal === "nuevo" ? null : clienteModal}
            onClose={() => setClienteModal(null)}
            onSave={(data) => {
              withErrorToast(async () => {
                let clienteId = data.id;
                if (clienteModal === "nuevo") {
                  clienteId = uid();
                  await insertCliente({ ...data, id: clienteId });
                  showToast("Cliente guardado");
                } else {
                  await updateCliente(data);
                  showToast("Cliente actualizado");
                }
                sincronizarGHL("sync-cliente", { clienteId }, showToast);
                await refreshClientes();
                setClienteModal(null);
              }, "No se pudo guardar el cliente.");
            }}
          />
        )}

        {productoModal && (
          <ProductoModal
            data={productoModal === "nuevo" ? null : productoModal}
            onClose={() => setProductoModal(null)}
            onSave={(data) => {
              withErrorToast(async () => {
                if (productoModal === "nuevo") {
                  await insertProducto({ ...data, id: uid() });
                  showToast("Producto creado");
                } else {
                  await updateProducto(data);
                  showToast("Producto actualizado");
                }
                await refreshProductos();
                setProductoModal(null);
              }, "No se pudo guardar el producto.");
            }}
          />
        )}

        {metodoPagoModal && (
          <MetodoPagoModal
            data={metodoPagoModal === "nuevo" ? null : metodoPagoModal}
            onClose={() => setMetodoPagoModal(null)}
            onSave={(data) => {
              withErrorToast(async () => {
                if (metodoPagoModal === "nuevo") {
                  await insertMetodoPago({ ...data, id: uid() });
                  showToast("Método de pago creado");
                } else {
                  await updateMetodoPago(data);
                  showToast("Método de pago actualizado");
                }
                await refreshMetodosPago();
                setMetodoPagoModal(null);
              }, "No se pudo guardar el método de pago.");
            }}
          />
        )}

        {citaModal && (
          <CitaModal
            modo={citaModal.modo}
            defaults={citaModal}
            day={citaModal.modo === "editar" ? citaModal.cita.fecha : day}
            employees={activeStaffForAgenda}
            services={services}
            cabins={cabins}
            clientes={clientes}
            productos={productos}
            metodosPago={metodosPago}
            appointments={appointments}
            bloqueos={bloqueos}
            bonosVendidos={bonosVendidos}
            bonoUsos={bonoUsos}
            ventas={ventas}
            onCobrarPlazo={cobrarPlazo}
            esAdmin={currentUser.rol === "admin"}
            onVerActividad={(datos) => setActividadModal(datos)}
            currentUser={currentUser}
            onConfirmacion={anotarConfirmacion} onCopiarEnlace={copiarEnlaceCita}
            onReprogramar={iniciarReprogramar}
            onClose={() => setCitaModal(null)}
            onCreateCliente={async (datosCliente) => {
              const id = uid();
              await insertCliente({ ...datosCliente, id });
              await refreshClientes();
              return id;
            }}
            onSave={(cita) => {
              withErrorToast(async () => {
                let citaId;
                if (citaModal.modo === "editar") {
                  citaId = citaModal.cita.id;
                  const orig = citaModal.cita;
                  const reiniciar = cita.fecha !== orig.fecha || cita.inicio !== orig.inicio || cita.empleadaId !== orig.empleadaId; // otro hueco = hay que volver a confirmar
                  await updateCitaRow({ ...cita, id: citaId, modificadoPor: currentUser.id, reiniciarConfirmacion: reiniciar });
                  showToast("Cita actualizada");
                } else {
                  citaId = uid();
                  await insertCita({ ...cita, id: citaId, creadoPor: currentUser.id });
                  showToast("Cita creada");
                }
                if (cita.fijarNotaEnCliente && cita.clienteId) {
                  await updateNotaFijaCliente(cita.clienteId, cita.fijarNotaEnCliente);
                  await refreshClientes();
                }
                sincronizarGHL("sync-cita", { citaId }, showToast);
                await refreshCitas();
                setCitaModal(null);
              }, "No se pudo guardar la cita.");
            }}
            onDelete={() => {
              withErrorToast(async () => {
                await deleteCitaRow(citaModal.cita.id);
                if (citaModal.cita.ghlEventId) {
                  // En GHL primero se marca «cancelada» (para que salte su automatización) y a los pocos segundos se borra;
                  // si la cita ya estaba cancelada no hace falta repetirlo
                  sincronizarGHL("eliminar-cita", { ghlEventId: citaModal.cita.ghlEventId, cancelarAntes: citaModal.cita.asistencia !== "cancelada" }, showToast);
                }
                await refreshCitas();
                showToast("Cita eliminada");
                setCitaModal(null);
              }, "No se pudo eliminar la cita.");
            }}
            onCobrar={(cita) => {
              withErrorToast(async () => {
                for (const linea of cita.productos || []) {
                  const prod = productos.find((p) => p.id === linea.productoId);
                  if (prod) await updateProducto({ ...prod, stock: Math.max(0, prod.stock - linea.cantidad) });
                }
                await updateCitaRow({
                  ...cita,
                  id: citaModal.cita.id,
                  modificadoPor: currentUser.id,
                  estadoCobro: "cobrada",
                  cobradaEn: new Date().toISOString(),
                  cobradaPor: currentUser.id,
                });
                // Las sesiones pagadas con bono se descuentan ahora
                for (const pg of cita.pagos || []) {
                  if (pg.bonoVendidoId) await insertBonoUso({ id: uid(), bonoVendidoId: pg.bonoVendidoId, citaId: citaModal.cita.id, fecha: citaModal.cita.fecha, creadoPor: currentUser.id });
                }
                if (cita.fijarNotaEnCliente && cita.clienteId) {
                  await updateNotaFijaCliente(cita.clienteId, cita.fijarNotaEnCliente);
                  await refreshClientes();
                }
                await Promise.all([refreshCitas(), refreshProductos(), refreshBonoUsos()]);
                showToast("Venta cobrada");
                sincronizarGHL("sync-cita", { citaId: citaModal.cita.id }, showToast, { soloErrores: true }); // en GHL queda marcada como cobrada
                setCitaModal(null);
              }, "No se pudo cobrar la venta.");
            }}
            onAnularCobro={() => {
              withErrorToast(async () => {
                const cita = citaModal.cita;
                for (const linea of cita.productos || []) {
                  const prod = productos.find((p) => p.id === linea.productoId);
                  if (prod) await updateProducto({ ...prod, stock: prod.stock + linea.cantidad });
                }
                // Al anular, las sesiones de bono vuelven al saldo y se quitan las líneas de pago con bono
                await updateCitaRow({ ...cita, pagos: (cita.pagos || []).filter((pg) => pg.metodoId !== METODO_BONO), estadoCobro: "pendiente", modificadoPor: currentUser.id });
                await deleteBonoUsosDeCita(cita.id);
                await Promise.all([refreshCitas(), refreshProductos(), refreshBonoUsos()]);
                showToast("Cobro anulado");
                sincronizarGHL("sync-cita", { citaId: cita.id }, showToast, { soloErrores: true }); // GHL deja de verla como cobrada
                setCitaModal(null);
              }, "No se pudo anular el cobro.");
            }}
            onReject={(msg) => showToast(msg, "error")}
            onVerPerfil={(id) => setPerfilClienteId(id)}
          />
        )}

        {perfilClienteId && (() => {
          const cli = clientes.find((c) => c.id === perfilClienteId);
          if (!cli) return null;
          return (
            <PerfilCliente
              ui={{ ModalShell }}
              esAdmin={currentUser.rol === "admin"}
              bonos={bonosVendidos.filter((b) => b.clienteId === cli.id).map((bv) => ({ bv, estado: estadoBono(bv, bonoUsos, todayISO()), saldo: saldoBono(bv, bonoUsos), pendiente: pendienteVenta(ventas.find((v) => v.id === bv.ventaId) || { total: 0, pagos: [] }) }))}
              cliente={cli}
              citas={appointments}
              servicios={services}
              empleadas={employees}
              productos={productos}
              calcularTotal={calcularTotalCita}
              hoy={todayISO()}
              onClose={() => setPerfilClienteId(null)}
              onVerActividad={currentUser.rol === "admin" ? (c) => setActividadModal({ titulo: `Actividad de ${c.nombre}`, filtros: [["cliente_id", c.id]] }) : null}
              onEditar={currentUser.rol === "admin" ? (c) => {
                setPerfilClienteId(null);
                setClienteModal(c);
              } : null}
              onNuevaCita={
                citaModal
                  ? null
                  : (clienteId) => {
                      setPerfilClienteId(null);
                      setView("agenda");
                      setCitaModal({
                        modo: "nuevo",
                        clienteId,
                        empleadaId: activeStaffForAgenda[0]?.id,
                        inicio: Math.min(Math.max(Math.round(nowMinutesExact() / 30) * 30, DAY_START), DAY_END - 30),
                      });
                    }
              }
              onGuardarNota={(id, texto) =>
                withErrorToast(async () => {
                  await updateNotaFijaCliente(id, texto);
                  await refreshClientes();
                  showToast(texto.trim() ? "Nota fija guardada" : "Nota fija quitada");
                }, "No se pudo guardar la nota.")
              }
            />
          );
        })()}

        {pinRequest && (
          <PinConfirmModal
            title={pinRequest.title}
            subtitle={pinRequest.subtitle}
            empleadaId={pinRequest.empleadaId}
            onCancel={() => setPinRequest(null)}
            onSuccess={() => {
              const fn = pinRequest.onSuccess;
              setPinRequest(null);
              fn && fn();
            }}
          />
        )}

        {confirmDialog && (
          <ConfirmDialog
            titulo={confirmDialog.titulo}
            mensaje={confirmDialog.mensaje}
            textoConfirmar={confirmDialog.textoConfirmar}
            textoCancelar={confirmDialog.textoCancelar}
            peligroso={confirmDialog.peligroso}
            onCancelar={() => setConfirmDialog(null)}
            onConfirmar={() => {
              const fn = confirmDialog.onConfirmar;
              setConfirmDialog(null);
              fn && fn();
            }}
          />
        )}

        {diaModal && (
          <DiaModal
            empleada={diaModal.empleada}
            fecha={diaModal.fecha}
            appointments={appointments}
            onClose={() => setDiaModal(null)}
            onIrAHorarioCompleto={() => {
              setDiaModal(null);
              setEmpleadaModal(diaModal.empleada);
            }}
            onGuardar={(excepcion) => {
              withErrorToast(async () => {
                const emp = employees.find((e) => e.id === diaModal.empleada.id);
                const nuevas = [...(emp.excepciones || []).filter((e) => e.fecha !== excepcion.fecha), excepcion];
                await updateEmpleada({ ...emp, excepciones: nuevas });
                await refreshEmpleadas();
                showToast("Horario de ese día actualizado");
                setDiaModal(null);
              }, "No se pudo guardar el horario de ese día.");
            }}
            onQuitarExcepcion={() => {
              withErrorToast(async () => {
                const emp = employees.find((e) => e.id === diaModal.empleada.id);
                const nuevas = (emp.excepciones || []).filter((e) => e.fecha !== diaModal.fecha);
                await updateEmpleada({ ...emp, excepciones: nuevas });
                await refreshEmpleadas();
                showToast("Excepción eliminada, vuelve al horario habitual");
                setDiaModal(null);
              }, "No se pudo quitar la excepción.");
            }}
          />
        )}
      </main>

      {isMobile && (
        <BottomNav
          view={view}
          setView={navegar}
          currentUser={currentUser}
          onMas={() => setSidebarOpen(true)}
          onNueva={() => setMenuAnadir(true)}
          badges={{ agenda: nuevasAgenda }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Avatar reutilizable (foto si existe, si no inicial sobre color)
// ---------------------------------------------------------------------------

function Avatar({ empleada, size = 38 }) {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%", flexShrink: 0, padding: 2,
        border: `2px solid ${empleada.color}`, display: "flex", alignItems: "center", justifyContent: "center",
        boxSizing: "content-box",
      }}
    >
      <div
        style={{
          width: size, height: size, borderRadius: "50%", overflow: "hidden",
          background: empleada.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Outfit', sans-serif", fontSize: size * 0.45,
        }}
      >
        {empleada.fotoUrl ? (
          <img src={empleada.fotoUrl} alt={empleada.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          empleada.nombre[0]
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PIN pad reutilizable (estilo Fresha: puntos + teclado numérico + teclado físico)
// ---------------------------------------------------------------------------

function PinPad({ length, value, onDigit, error, variante = "claro" }) {
  const dots = Array.from({ length }, (_, i) => i < value.length);
  const oscuro = variante === "oscuro";
  const keyStyle = {
    width: 64, height: 64, borderRadius: "50%",
    border: oscuro ? "1px solid rgba(246,241,231,0.35)" : "1px solid var(--line)",
    background: oscuro ? "rgba(246,241,231,0.1)" : "var(--field-bg)",
    color: oscuro ? "#F4F7FC" : "var(--text)",
    fontSize: 22, fontFamily: "'Outfit', sans-serif", fontWeight: 600,
  };
  const dotBorder = error ? "#E08A7D" : oscuro ? "#F4F7FC" : "var(--accent)";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "center", gap: 14, marginBottom: 26 }}>
        {dots.map((filled, i) => (
          <span
            key={i}
            style={{
              width: 12, height: 12, borderRadius: "50%",
              background: filled ? dotBorder : "transparent",
              border: `2px solid ${dotBorder}`,
              transition: "background .1s ease",
            }}
          />
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 64px)", gap: 14, justifyContent: "center" }}>
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((k) => (
          <button key={k} type="button" onClick={() => onDigit(k)} style={keyStyle}>{k}</button>
        ))}
        <div />
        <button type="button" onClick={() => onDigit("0")} style={keyStyle}>0</button>
        <div />
      </div>
      <p style={{ textAlign: "center", fontSize: 12, color: oscuro ? "rgba(246,241,231,0.45)" : "rgba(var(--ink-rgb),0.4)", marginTop: 16 }}>
        También puedes escribir el código con el teclado
      </p>
    </div>
  );
}

// verificar(codigo) debe devolver true si el código es correcto (y ya
// se encarga de lo que toque hacer, como iniciar sesión); si devuelve
// false, el PIN se marca en rojo un instante y se borra solo.
function usePinEntry(verificar, activo = true) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  function onDigit(d) {
    setValue((current) => {
      if (current.length >= LONGITUD_CODIGO) return current;
      const next = current + d;
      setError(false);
      if (next.length === LONGITUD_CODIGO) {
        window.setTimeout(async () => {
          const ok = await verificar(next);
          if (!ok) {
            setError(true);
            window.setTimeout(() => {
              setValue("");
              setError(false);
            }, 550);
          }
        }, 120);
      }
      return next;
    });
  }

  function onDelete() {
    setValue((v) => v.slice(0, -1));
    setError(false);
  }

  useEffect(() => {
    if (!activo) return;
    function handleKey(e) {
      if (e.key >= "0" && e.key <= "9") onDigit(e.key);
      else if (e.key === "Backspace") onDelete();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activo, verificar]);

  return { value, error, onDigit, onDelete };
}

// ---------------------------------------------------------------------------
// Pantalla de acceso — solo el código; el propio código dice quién eres
// ---------------------------------------------------------------------------

function LoginScreen({ onLogin, aviso, negocio = NEGOCIO_POR_DEFECTO }) {
  const [mensaje, setMensaje] = useState("");
  const pin = usePinEntry(async (codigo) => {
    const r = await iniciarSesion(codigo);
    if (r.ok && r.usuario) {
      onLogin(r.usuario);
      return true;
    }
    setMensaje(r.status === 429 || r.status === 0 || r.status >= 500 ? r.error || "No se pudo entrar." : "");
    return false;
  }, true);

  return (
    <div
      style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
        background: "linear-gradient(135deg, #0A1226 0%, #12295C 55%, var(--accent-deep) 100%)", position: "relative", overflow: "hidden",
      }}
    >
      <GlobalFonts />
      <div aria-hidden="true" style={{ position: "absolute", width: 460, height: 460, borderRadius: "50%", top: "-8%", left: "-6%", background: "radial-gradient(circle, rgba(var(--accent-rgb),0.5), transparent 65%)", filter: "blur(30px)", animation: "driftA 14s ease-in-out infinite" }} />
      <div aria-hidden="true" style={{ position: "absolute", width: 520, height: 520, borderRadius: "50%", bottom: "-14%", right: "-10%", background: "radial-gradient(circle, rgba(255,255,255,0.16), transparent 65%)", filter: "blur(36px)", animation: "driftB 17s ease-in-out infinite" }} />
      <div style={{ width: "100%", maxWidth: 380, textAlign: "center", position: "relative", zIndex: 1 }}>
        <div data-marca-login="1" style={{ fontFamily: "'Outfit', sans-serif", fontSize: 21, fontWeight: 600, color: "#F4F7FC", letterSpacing: 1, marginBottom: 46 }}>
          {negocio.toUpperCase().split("&").map((t, i) => (i === 0 ? <React.Fragment key={i}>{t}</React.Fragment> : <React.Fragment key={i}><span style={{ color: "var(--accent-light)" }}>&</span>{t}</React.Fragment>))}
        </div>

        <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 27, fontWeight: 600, color: "#F4F7FC", marginBottom: 4 }}>
          Introducir código
        </h1>
        <p style={{ fontSize: 12.5, color: pin.error ? "#E08A7D" : "rgba(246,241,231,0.6)", marginBottom: 30 }}>
          {pin.error ? mensaje || "Código incorrecto, inténtalo de nuevo" : aviso || "Agenda interna"}
        </p>

        <PinPad length={LONGITUD_CODIGO} value={pin.value} onDigit={pin.onDigit} error={pin.error} variante="oscuro" />
      </div>
    </div>
  );
}

function GlobalFonts() {
  return <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Outfit:wght@400;500;600&display=swap');`}</style>;
}

// ---------------------------------------------------------------------------
// Modal de confirmación con código (solo se usa ya para Fichajes)
// ---------------------------------------------------------------------------

function PinConfirmModal({ title, subtitle, empleadaId, onSuccess, onCancel }) {
  const pin = usePinEntry(async (codigo) => {
    const r = await verificarPin(codigo, empleadaId); // se comprueba en el servidor
    if (r.ok) {
      onSuccess();
      return true;
    }
    return false;
  }, true);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(28,25,22,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 16 }}>
      <div className="card" style={{ width: 340, maxWidth: "100%", padding: "26px 24px", textAlign: "center", background: "var(--surface)" }}>
        <Lock size={18} style={{ marginBottom: 10, color: "var(--accent-text)" }} />
        <h3 style={{ fontSize: 17, marginBottom: 4 }}>{title}</h3>
        <p style={{ fontSize: 12.5, color: pin.error ? "var(--danger)" : "rgba(var(--ink-rgb),0.6)", marginBottom: 20 }}>
          {pin.error ? "Código incorrecto, inténtalo de nuevo" : subtitle}
        </p>
        <PinPad length={LONGITUD_CODIGO} value={pin.value} onDigit={pin.onDigit} error={pin.error} variante="claro" />
        <button type="button" className="btn btn-ghost" style={{ marginTop: 22, width: "100%", justifyContent: "center" }} onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Barra superior: hamburguesa (móvil), notificaciones, usuario
// ---------------------------------------------------------------------------

function BottomNav({ view, setView, currentUser, onNueva, onMas, badges = {} }) {
  const candidatos = [
    { id: "inicio", label: "Inicio", icon: Home, ok: true },
    { id: "agenda", label: "Agenda", icon: CalendarDays, ok: puedeVer(currentUser, "agenda") },
    { id: "clientes", label: "Clientes", icon: Contact, ok: puedeVer(currentUser, "clientes") },
    { id: "fichajes", label: "Fichar", icon: Timer, ok: puedeVer(currentUser, "fichajes") },
    { id: "ventas", label: "Ventas", icon: Wallet, ok: puedeVer(currentUser, "ventas") },
  ].filter((i) => i.ok);

  const izquierda = candidatos.slice(0, 2);
  const derecha = candidatos.slice(2, 3);
  const puedeCrear = puedeVer(currentUser, "agenda");

  const boton = (it) => {
    const active = view === it.id;
    const Icon = it.icon;
    return (
      <button
        key={it.id} type="button" onClick={() => setView(it.id)} aria-current={active ? "page" : undefined}
        style={{
          flex: 1, minHeight: 52, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
          border: "none", background: "transparent", fontSize: 12, fontWeight: active ? 600 : 500,
          color: active ? "var(--accent-text)" : "rgba(var(--ink-rgb),0.74)",
        }}
      >
        <span
          aria-hidden="true"
          style={{ position: "relative", width: 46, height: 28, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", background: active ? "rgba(var(--accent-rgb),0.2)" : "transparent", transition: "background .2s ease" }}
        >
          <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
          {badges[it.id] > 0 && <span data-badge-movil={it.id} style={{ position: "absolute", top: -4, right: 2, background: "#DC2626", color: "#fff", borderRadius: 999, fontSize: 10.5, fontWeight: 700, minWidth: 18, height: 18, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 5px", boxShadow: "0 0 0 2px var(--bar-bg)" }}>{badges[it.id]}</span>}
        </span>
        {it.label}
      </button>
    );
  };

  return (
    <nav
      aria-label="Navegación rápida" className="bottom-nav"
      style={{
        position: "fixed", left: 12, right: 12, bottom: "max(12px, env(safe-area-inset-bottom))", zIndex: 45,
        display: "flex", alignItems: "center", padding: "6px 6px", borderRadius: 28,
        background: "var(--bar-bg)", border: "1px solid rgba(var(--ink-rgb),0.14)", boxShadow: "var(--shadow-md)",
      }}
    >
      {izquierda.map(boton)}
      {puedeCrear && (
        <button
          type="button" onClick={onNueva} aria-label="Nueva cita" title="Nueva cita"
          style={{
            width: 58, height: 58, borderRadius: "50%", border: "none", marginTop: -30, flexShrink: 0, color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg, var(--accent), var(--accent-deep))",
            boxShadow: "0 14px 28px -10px rgba(var(--accent-rgb),0.9), inset 0 1px 0 rgba(255,255,255,0.35), 0 0 0 5px var(--bg)",
          }}
        >
          <Plus size={28} aria-hidden="true" />
        </button>
      )}
      {derecha.map(boton)}
      <button
        type="button" onClick={onMas}
        style={{ flex: 1, minHeight: 52, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, border: "none", background: "transparent", fontSize: 12, fontWeight: 500, color: "rgba(var(--ink-rgb),0.74)" }}
      >
        <span aria-hidden="true" style={{ width: 46, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Menu size={20} strokeWidth={1.8} />
        </span>
        Más
      </button>
    </nav>
  );
}

function TopBar({ isMobile, onOpenSidebar, currentUser, onLogout, notificaciones, notifNoLeidas, showNotif, setShowNotif, employees, tema, onToggleTema, fichaje }) {
  const barraRef = React.useRef(null);
  // Se publica la altura de esta barra para que las del calendario se peguen justo debajo
  useEffect(() => {
    const el = barraRef.current;
    if (!el) return undefined;
    const medir = () => document.documentElement.style.setProperty("--topbar-h", `${el.offsetHeight}px`);
    medir();
    window.addEventListener("resize", medir);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(medir) : null;
    if (ro) ro.observe(el);
    return () => {
      window.removeEventListener("resize", medir);
      if (ro) ro.disconnect();
    };
  }, []);
  const hoyLabel = primeraMayuscula(new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" }));
  const iconBtn = {
    width: 44, height: 44, borderRadius: "50%", border: "1px solid rgba(var(--ink-rgb),0.16)", background: "var(--surface)",
    display: "flex", alignItems: "center", justifyContent: "center", position: "relative", boxShadow: "var(--shadow-sm)",
  };

  return (
    <div
      ref={barraRef}
      data-barra-sticky="superior"
      style={{
        position: "sticky", top: 0, zIndex: 30, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        margin: isMobile ? "-16px -16px 14px" : "-28px -32px 18px", padding: isMobile ? "10px 16px" : "14px 32px",
        background: "var(--bar-bg)", WebkitBackdropFilter: "blur(14px)", backdropFilter: "blur(14px)",
        borderBottom: "1px solid var(--line)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        {isMobile && (
          <button type="button" onClick={onOpenSidebar} aria-label="Abrir menú" style={iconBtn}>
            <Menu size={20} aria-hidden="true" />
          </button>
        )}
        <div style={{ fontSize: isMobile ? 14 : 15, fontWeight: 500, color: "rgba(var(--ink-rgb),0.78)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {hoyLabel}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {fichaje && (() => {
          const b = botonesFichaje(fichaje.estado);
          const mini = { minHeight: 40, padding: "6px 12px", fontSize: 13, gap: 6, whiteSpace: "nowrap" };
          return (
            <div data-fichaje-barra="1" style={{ display: "flex", gap: 6 }}>
              <button type="button" data-fichar={b.principal.accion} aria-label={b.principal.texto} className={`btn ${b.principal.accion === "descanso" ? "btn-ghost" : "btn-gold"}`} style={mini} onClick={() => fichaje.onAccion(b.principal.accion)}>
                {b.principal.accion === "descanso" ? <Coffee size={15} aria-hidden="true" /> : <LogIn size={15} aria-hidden="true" />}{!isMobile && ` ${b.principal.texto}`}
              </button>
              <button type="button" data-fichar="salida" aria-label="Fichar salida" className="btn btn-ghost" style={mini} disabled={!b.salida.activo} title={b.salida.activo ? "" : "Primero hay que fichar la entrada"} onClick={() => fichaje.onAccion("salida")}>
                <LogOut size={15} aria-hidden="true" />{!isMobile && " Fichar salida"}
              </button>
            </div>
          );
        })()}
        <button
          type="button" onClick={onToggleTema} style={iconBtn}
          aria-label={tema === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
          title={tema === "dark" ? "Modo claro" : "Modo oscuro"}
        >
          {tema === "dark" ? <Sun size={19} aria-hidden="true" /> : <Moon size={19} aria-hidden="true" />}
        </button>

        <div style={{ position: "relative" }}>
          <button type="button" onClick={() => setShowNotif(!showNotif)} style={iconBtn} aria-label={notifNoLeidas.length > 0 ? `Notificaciones, ${notifNoLeidas.length} sin leer` : "Notificaciones"}>
            <Bell size={19} aria-hidden="true" />
            {notifNoLeidas.length > 0 && (
              <span style={{ position: "absolute", top: 9, right: 10, width: 10, height: 10, borderRadius: "50%", background: "#D64B3A", border: "2px solid var(--surface)" }} />
            )}
          </button>
          {showNotif && (
            <NotificacionesDropdown notificaciones={notificaciones} employees={employees} onClose={() => setShowNotif(false)} />
          )}
        </div>

        <button
          type="button" onClick={onLogout} aria-label="Cambiar usuario" title="Cambiar usuario"
          style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 44, padding: "6px 14px 6px 6px", borderRadius: 999, border: "1px solid rgba(var(--ink-rgb),0.16)", background: "var(--surface)", boxShadow: "var(--shadow-sm)", fontSize: 13.5, fontWeight: 500 }}
        >
          <Avatar empleada={currentUser} size={30} />
          {!isMobile && <span>{currentUser.nombre}</span>}
          <LogOut size={15} aria-hidden="true" style={{ opacity: 0.7 }} />
        </button>
      </div>
    </div>
  );
}

function NotificacionesDropdown({ notificaciones, employees, onClose }) {
  const boxRef = React.useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div ref={boxRef} style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 40, width: 280, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 6, boxShadow: "0 10px 30px rgba(0,0,0,0.15)", maxHeight: 320, overflowY: "auto" }}>
      <div style={{ padding: "10px 14px", fontSize: 12.5, fontWeight: 500, borderBottom: "1px solid var(--line)" }}>Notificaciones</div>
      {notificaciones.length === 0 && (
        <div style={{ padding: 16, fontSize: 12.5, color: "rgba(var(--ink-rgb),0.68)" }}>Sin novedades por ahora.</div>
      )}
      {notificaciones.map((n) => {
        const emp = employees.find((e) => e.id === n.empleadaId);
        return (
          <div key={n.id} style={{ padding: "10px 14px", borderBottom: "1px solid var(--line)", fontSize: 12.5 }}>
            Nueva cita: <strong>{n.clienta}</strong> con {emp?.nombre || "—"} · {fechaLabel(n.fecha)} a las {minToLabel(n.inicio)}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar (cajón deslizante en móvil, fija en escritorio)
// ---------------------------------------------------------------------------

function Sidebar({ view, setView, currentUser, isMobile, open, onClose, badges = {}, badgesAviso = {}, negocio = NEGOCIO_POR_DEFECTO }) {
  const marca = partesDelNombre(negocio);
  const items = [
    { id: "inicio", label: "Inicio", icon: Home, always: true },
    { id: "agenda", label: "Agenda", icon: CalendarDays, permKey: "agenda" },
    { id: "clientes", label: "Clientes", icon: Contact, permKey: "clientes" },
    { id: "ventas", label: "Ventas", icon: Wallet, permKey: "ventas" },
        { id: "bonos", label: "Bonos", icon: Ticket, permKey: "bonos" },
        { id: "actividad", label: "Actividad", icon: History, permKey: "actividad" },
    {
      id: "grupo-informes", label: "Informes", icon: BarChart3, permKey: "informes",
      children: [
        { id: "inf-resumen", label: "Resumen general" },
        { id: "inf-ventas", label: "Ventas" },
        { id: "inf-clientes", label: "Clientes" },
        { id: "inf-ocupacion", label: "Ocupación" },
        { id: "inf-equipo", label: "Servicios y equipo" },
      ],
    },
    { id: "grupo-marketing", label: "Marketing", icon: Megaphone, children: [{ id: "marketing", label: "Informe del día", soloAdmin: true }] },
    { id: "cursos", label: "Cursos", icon: GraduationCap, always: true },
    // Cada opción de un grupo tiene su propio permiso; el grupo se ve si se puede ver alguna
    {
      id: "grupo-empleados", label: "Empleados", icon: Users,
      children: [
        { id: "empleadas", label: "Miembros del equipo", permKey: "empleadas" },
        { id: "turnos", label: "Turnos", permKey: "empleadas" },
        { id: "cabinas", label: "Cabinas", permKey: "cabinas" },
        { id: "fichajes", label: "Fichajes", permKey: "fichajes" },
        { id: "avisos", label: "Avisos", permKey: "empleadas", soloAdmin: true },
      ],
    },
    {
      id: "grupo-catalogo", label: "Catálogo", icon: Package,
      children: [
        { id: "servicios", label: "Servicios", permKey: "servicios" },
        { id: "productos", label: "Productos", permKey: "productos" },
      ],
    },
    { id: "configuracion", label: "Configuración", icon: Settings, adminOnly: true },
  ];

  const [gruposManual, setGruposManual] = useState({});

  const hijasVisibles = (it) => (it.children || []).filter((c) => (!c.permKey || puedeVer(currentUser, c.permKey)) && (!c.soloAdmin || currentUser.rol === "admin"));
  const visibles = items.filter((it) => {
    if (it.always) return true;
    if (it.adminOnly) return currentUser.rol === "admin";
    if (it.children && !it.permKey) return hijasVisibles(it).length > 0;
    return puedeVer(currentUser, it.permKey);
  });

  function grupoExpandido(it) {
    if (gruposManual[it.id] != null) return gruposManual[it.id];
    return hijasVisibles(it).some((c) => c.id === view);
  }

  const itemStyle = (active) => ({
    display: "flex", alignItems: "center", gap: 12, padding: "8px 12px 8px 8px", borderRadius: 16, width: "100%", minHeight: 48,
    border: "none", textAlign: "left", fontSize: 14.5,
    background: active ? "var(--side-active-bg)" : "transparent",
    color: active ? "var(--side-active-text)" : "var(--side-text)",
    fontWeight: active ? 600 : 400,
    boxShadow: active ? "inset 3px 0 0 var(--side-accent)" : "none",
    transition: "background .2s ease, color .2s ease",
  });

  const tile = (active) => ({
    width: 34, height: 34, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    background: active ? "var(--side-active-bg)" : "var(--side-tile)",
  });

  const contenido = (
    <>
      <div style={{ padding: "2px 8px 24px 8px", display: "flex", alignItems: "center", gap: 12 }}>
        <div
          aria-hidden="true"
          style={{
            width: 40, height: 40, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            background: "linear-gradient(135deg, var(--accent), var(--accent-deep))", color: "#fff", fontFamily: "'Cormorant Garamond', serif",
            fontSize: 23, fontWeight: 700, boxShadow: "0 10px 22px -10px rgba(var(--accent-rgb), 0.9), inset 0 1px 0 rgba(255,255,255,0.3)",
          }}
        >
          {letraLogo(negocio)}
        </div>
        <div style={{ minWidth: 0 }}>
          <div data-marca-titulo="1" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, letterSpacing: 0.3, lineHeight: 1.05, color: "var(--side-text)", overflowWrap: "anywhere" }}>{marca.titulo}</div>
          <div data-marca-subtitulo="1" style={{ fontSize: 12, color: "var(--side-muted)", letterSpacing: 1 }}>{marca.subtitulo}</div>
        </div>
      </div>

      {visibles.map((it) => {
        const { id, label, icon: Icon, children } = it;

        if (children) {
          const hijas = hijasVisibles(it);
          const expandido = grupoExpandido(it);
          const activoAlgunHijo = hijas.some((c) => c.id === view);
          return (
            <div key={id}>
              <button
                type="button"
                aria-expanded={expandido}
                onClick={() => setGruposManual((g) => ({ ...g, [id]: !expandido }))}
                style={itemStyle(activoAlgunHijo && !expandido)}
              >
                <span aria-hidden="true" style={tile(activoAlgunHijo)}>
                  <Icon size={18} strokeWidth={1.8} />
                </span>
                <span style={{ flex: 1, color: activoAlgunHijo ? "var(--side-active-text)" : "var(--side-text)", fontWeight: activoAlgunHijo ? 600 : 400 }}>{label}</span>
                {expandido ? <ChevronUp size={15} aria-hidden="true" /> : <ChevronDown size={15} aria-hidden="true" />}
              </button>
              {(
                <div data-grupo-hijas={id} style={{ marginLeft: 25, paddingLeft: 12, borderLeft: "1px solid var(--side-line)", display: expandido ? "flex" : "none", flexDirection: "column", gap: 2, marginTop: 2, marginBottom: 4 }}>
                  {hijas.map((child) => {
                    const active = view === child.id;
                    return (
                      <button
                        key={child.id}
                        type="button"
                        aria-current={active ? "page" : undefined}
                        onClick={() => setView(child.id)}
                        style={{
                          display: "flex", alignItems: "center", padding: "10px 12px", borderRadius: 12, width: "100%", minHeight: 44,
                          border: "none", textAlign: "left", fontSize: 14,
                          background: active ? "var(--side-active-bg)" : "transparent",
                          color: active ? "var(--side-active-text)" : "var(--side-muted)",
                          fontWeight: active ? 600 : 400,
                        }}
                      >
                        {child.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        const active = view === id;
        return (
          <button key={id} type="button" aria-current={active ? "page" : undefined} onClick={() => setView(id)} style={itemStyle(active)}>
            <span aria-hidden="true" style={tile(active)}>
              <Icon size={18} strokeWidth={1.8} />
            </span>
            {label}
            {(badges[id] > 0 || badgesAviso[id] > 0) && (
              <span style={{ marginLeft: "auto", display: "inline-flex", gap: 4 }}>
                {badgesAviso[id] > 0 && <span data-badge-aviso={id} title={`${badgesAviso[id]} por revisar`} aria-label={`${badgesAviso[id]} por revisar`} style={{ background: "#F59E0B", color: "#fff", borderRadius: 999, fontSize: 11.5, fontWeight: 700, minWidth: 20, height: 20, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 6px" }}>{badgesAviso[id]}</span>}
                {badges[id] > 0 && <span data-badge={id} title={id === "agenda" ? `${badges[id]} cita${badges[id] === 1 ? " nueva" : "s nuevas"}` : undefined} aria-label={id === "agenda" ? `${badges[id]} cita${badges[id] === 1 ? " nueva" : "s nuevas"}` : `${badges[id]} pendiente${badges[id] === 1 ? "" : "s"}`} style={{ background: "#DC2626", color: "#fff", borderRadius: 999, fontSize: 11.5, fontWeight: 700, minWidth: 20, height: 20, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 6px" }}>{badges[id]}</span>}
              </span>
            )}
          </button>
        );
      })}
    </>
  );

  const baseStyle = {
    width: 244, flexShrink: 0, color: "var(--side-text)", padding: "22px 14px", display: "flex", flexDirection: "column", gap: 4,
    background: "var(--side-bg)", borderRight: "1px solid var(--side-line)",
  };

  if (isMobile) {
    return (
      <>
        {open && <div onClick={onClose} className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 48 }} />}
        <aside
          aria-label="Menú principal"
          style={{
            ...baseStyle, width: "min(86vw, 300px)", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 49, overflowY: "auto",
            transform: open ? "translateX(0)" : "translateX(-102%)", transition: "transform .25s cubic-bezier(.2,.8,.2,1)",
            visibility: open ? "visible" : "hidden",
          }}
        >
          {contenido}
        </aside>
      </>
    );
  }

  return (
    <aside aria-label="Menú principal" style={{ ...baseStyle, position: "sticky", top: 0, height: "100vh", alignSelf: "flex-start", overflowY: "auto" }}>
      {contenido}
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

function Toast({ msg, tipo }) {
  return (
    <div
      role={tipo === "error" ? "alert" : "status"}
      style={{
        position: "fixed", top: 76, right: 16, padding: "13px 18px", borderRadius: 16, maxWidth: "min(360px, calc(100vw - 32px))", border: "1px solid rgba(255,255,255,0.14)",
        background: tipo === "error" ? "#912018" : "#14213D", color: "#fff", fontSize: 13.5,
        display: "flex", alignItems: "flex-start", gap: 10, boxShadow: "0 18px 40px -16px rgba(0,0,0,0.6)", zIndex: 70, animation: "popIn .25s cubic-bezier(.2,.8,.2,1)",
      }}
    >
      {tipo === "error" ? <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} /> : <Check size={15} style={{ flexShrink: 0, marginTop: 1 }} />}
      <span>{msg}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inicio
// ---------------------------------------------------------------------------

function Inicio({ currentUser, employees, services, productos, appointments, fichajesLog, ventasDirectasHoy = 0 }) {
  const horasHoy = fichajesLog
    .filter((f) => f.fecha === todayISO())
    .reduce((sum, f) => sum + (f.salida - f.entrada), 0);

  const citasOrdenadas = [...appointments].sort((a, b) => a.inicio - b.inicio);
  const previsionHoy = appointments.reduce((sum, c) => sum + calcularTotalCita(c, services, productos), 0);
  const citasCobradasHoy = appointments.filter((c) => c.estadoCobro === "cobrada");
  const ventasRealesHoy = citasCobradasHoy.reduce((sum, c) => sum + calcularTotalCita(c, services, productos) - importeConBono(c), 0) + ventasDirectasHoy;

  return (
    <div>
      <h1 style={{ fontSize: 30, marginBottom: 4 }}>Hola, {currentUser.nombre.split(" ")[0]}</h1>
      <p style={{ color: "rgba(var(--ink-rgb),0.68)", marginTop: 0, marginBottom: 26, fontSize: 14.5 }}>
        Resumen rápido del día — {fechaLabel(todayISO())}.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 24 }}>
        <StatCard label="Citas hoy" value={appointments.length} />
        <StatCard label="Previsión de ingresos hoy" value={`${previsionHoy.toFixed(2)} €`} />
        <StatCard label="Ventas reales hoy" value={`${ventasRealesHoy.toFixed(2)} €`} />
        <StatCard label="Horas fichadas hoy" value={duracionLabel(horasHoy)} />
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--line)", fontWeight: 500, fontSize: 14 }}>
          Citas de hoy
        </div>
        {citasOrdenadas.length === 0 && (
          <div style={{ padding: 20, textAlign: "center", color: "rgba(var(--ink-rgb),0.68)", fontSize: 13.5 }}>No hay citas hoy.</div>
        )}
        {citasOrdenadas.map((c) => {
          const emp = employees.find((e) => e.id === c.empleadaId);
          const servicio = services.find((s) => s.id === c.servicioId);
          const cobrada = c.estadoCobro === "cobrada";
          return (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: "1px solid var(--line)", fontSize: 13.5 }}>
              <span style={{ width: 46, flexShrink: 0, color: "rgba(var(--ink-rgb),0.68)" }}>{minToLabel(c.inicio)}</span>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: servicio?.color || "var(--accent)", flexShrink: 0 }} />
              <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                <strong>{c.clienta}</strong> · {servicio?.nombre}{c.serviciosExtra?.length ? ` +${c.serviciosExtra.length}` : ""} con {emp?.nombre || "—"}
              </span>
              <span style={{ fontWeight: 500, flexShrink: 0 }}>{calcularTotalCita(c, services, productos).toFixed(2)} €</span>
              <span style={{ fontSize: 12.5, padding: "3px 8px", borderRadius: 20, background: cobrada ? "rgba(var(--ink-rgb),0.08)" : "rgba(var(--accent-rgb),0.12)", color: cobrada ? "rgba(var(--ink-rgb),0.6)" : "var(--accent)", flexShrink: 0 }}>
                {cobrada ? "Cobrada" : "Pendiente"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="card" style={{ padding: "16px 18px" }}>
      <div style={{ fontSize: 12.5, color: "rgba(var(--ink-rgb),0.68)", marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 28, fontWeight: 600, color: "var(--text)" }}>{value}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Calendario mensual desplegable — para saltar a cualquier fecha del año
// ---------------------------------------------------------------------------

function MonthCalendarPopover({ selectedDate, onSelect, onClose }) {
  const initial = new Date(selectedDate + "T00:00:00");
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const boxRef = React.useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const monthLabel = primeraMayuscula(new Date(viewYear, viewMonth, 1).toLocaleDateString("es-ES", { month: "long", year: "numeric" }));
  const firstDay = new Date(viewYear, viewMonth, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function iso(d) {
    return `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  function changeMonth(delta) {
    setViewMonth((prevMonth) => {
      let m = prevMonth + delta;
      let y = viewYear;
      if (m < 0) { m = 11; y -= 1; }
      if (m > 11) { m = 0; y += 1; }
      setViewYear(y);
      return m;
    });
  }

  return (
    <div
      ref={boxRef}
      style={{
        position: "absolute", top: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)", zIndex: 40,
        background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 6, padding: 16,
        boxShadow: "0 10px 30px rgba(0,0,0,0.15)", width: 280,
      }}
    >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <button type="button" onClick={() => setViewYear((y) => y - 1)} className="btn-ghost" style={{ border: "none", padding: 4 }}><ChevronsLeft size={14} /></button>
          <button type="button" onClick={() => changeMonth(-1)} className="btn-ghost" style={{ border: "none", padding: 4 }}><ChevronLeft size={14} /></button>
          <span style={{ fontSize: 13.5, fontWeight: 500 }}>{monthLabel}</span>
          <button type="button" onClick={() => changeMonth(1)} className="btn-ghost" style={{ border: "none", padding: 4 }}><ChevronRight size={14} /></button>
          <button type="button" onClick={() => setViewYear((y) => y + 1)} className="btn-ghost" style={{ border: "none", padding: 4 }}><ChevronsRight size={14} /></button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, fontSize: 12, color: "rgba(var(--ink-rgb),0.68)", marginBottom: 4 }}>
          {["L", "M", "X", "J", "V", "S", "D"].map((d, i) => <div key={i} style={{ textAlign: "center" }}>{d}</div>)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
          {cells.map((d, i) => {
            if (d == null) return <div key={i} />;
            const dateStr = iso(d);
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === todayISO();
            return (
              <button
                key={i}
                type="button"
                onClick={() => { onSelect(dateStr); onClose(); }}
                style={{
                  aspectRatio: "1", borderRadius: 4, border: isToday && !isSelected ? "1px solid var(--accent)" : "1px solid transparent",
                  background: isSelected ? "var(--ink-solid)" : "transparent",
                  color: isSelected ? "var(--on-ink)" : "var(--text)", fontSize: 12.5,
                }}
              >
                {d}
              </button>
            );
          })}
        </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Agenda
// ---------------------------------------------------------------------------

function Agenda({ onAnadir, day, setDay, employees, services, cabins, clientes, productos, appointments, onSlotClick, onEditCita, onMoveCita, negocio, reprogramando = null, onCancelarReprogramar, onReprogramarAqui, avisosParaHueco = () => [], onMensaje, hoy, onConfirmacion, onCorregirServicio, onEstaBienServicio, bloqueos = [], onNuevoBloqueo, onEditBloqueo, fichajeActivo = {}, descansos = {}, currentUser, onFichaje, ventas = [] }) {
  const [menuHueco, setMenuHueco] = useState(null); // { empleadaId, inicio, x, y }
  // Reprogramar: se elige el hueco nuevo con un clic; al pasar el ratón se ve si está libre (verde) o no (rojo)
  const [hoverRepro, setHoverRepro] = useState(null); // { empleadaId, inicio }
  const [confirmarRepro, setConfirmarRepro] = useState(null); // { empleadaId, inicio, avisos }: hueco no libre, se pide confirmar
  const [confirmarManana, setConfirmarManana] = useState(false);
  const [porRevisarAbierto, setPorRevisarAbierto] = useState(false);
  const pendientesRevisar = onCorregirServicio ? citasPorRevisar(appointments, hoy || todayISO()) : [];
  const pendientesManana = onConfirmacion ? sinConfirmar(appointments, addDays(hoy || todayISO(), 1)) : 0;
  const confirmarReproRef = React.useRef(null);
  confirmarReproRef.current = confirmarRepro;
  useEffect(() => {
    if (!reprogramando) { setHoverRepro(null); setConfirmarRepro(null); return undefined; }
    const alTeclear = (e) => { if (e.key === "Escape" && !confirmarReproRef.current) onCancelarReprogramar?.(); };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [reprogramando]); // eslint-disable-line react-hooks/exhaustive-deps
  const inicioEnHueco = (ev, m) => { const r = ev.currentTarget.getBoundingClientRect(); const frac = r.height ? (ev.clientY - r.top) / r.height : 0; return m + (frac >= 0.5 ? 15 : 0); }; // los huecos son de 30 min: se afina a 15
  const alPasarPorHueco = (ev, empleadaId, m) => { const inicio = inicioEnHueco(ev, m); setHoverRepro((h) => (h && h.empleadaId === empleadaId && h.inicio === inicio ? h : { empleadaId, inicio })); };
  const alElegirHueco = (ev, empleadaId, m) => {
    const inicio = inicioEnHueco(ev, m);
    const avisos = avisosParaHueco(empleadaId, day, inicio);
    if (avisos.length === 0) onReprogramarAqui(empleadaId, day, inicio);
    else setConfirmarRepro({ empleadaId, inicio, avisos });
  };
  const primerasCitas = React.useMemo(() => primeraCitaPorCliente(appointments), [appointments]);
  // lo que cada cliente debe aún de sus bonos a plazos (se marca en sus citas del calendario)
  const deudaPorCliente = React.useMemo(() => {
    const m = new Map();
    ventas.filter((v) => !v.anulada && v.clienteId).forEach((v) => { const d = pendienteVenta(v); if (d > 0.005) m.set(v.clienteId, (m.get(v.clienteId) || 0) + d); });
    return m;
  }, [ventas]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [nowMin, setNowMin] = useState(nowMinutesExact());

  useEffect(() => {
    const t = window.setInterval(() => setNowMin(nowMinutesExact()), 30000);
    return () => window.clearInterval(t);
  }, []);

  // ---- Arrastrar citas para moverlas (hora y/o empleada) ----------------------
  const [drag, setDrag] = useState(null); // { citaId, empleadaId, inicio } mientras se arrastra
  const colRefs = React.useRef({});
  const scrollRef = React.useRef(null);
  const dragRef = React.useRef(null);
  const ctxRef = React.useRef({});
  const ignorarClickHasta = React.useRef(0);
  const manejadores = React.useRef(null);
  const gridRef = React.useRef(null);
  const controlsRef = React.useRef(null);
  const headerRef = React.useRef(null);
  // La barra de fecha/«Añadir» y la de empleadas se quedan pegadas bajo la barra superior al hacer scroll
  React.useEffect(() => {
    const el = controlsRef.current;
    if (!el) return undefined;
    const medir = () => document.documentElement.style.setProperty("--agenda-controls-h", `${el.offsetHeight}px`);
    medir();
    window.addEventListener("resize", medir);
    return () => {
      window.removeEventListener("resize", medir);
      document.documentElement.style.removeProperty("--agenda-controls-h");
    };
  }, [day]);

  if (!manejadores.current) {
    const SNAP = 15; // minutos

    // A qué empleada y hora corresponde la posición del puntero
    const destinoDesde = (clientX, clientY) => {
      const d = dragRef.current;
      if (!d) return null;
      let elegido = null;
      let rect = null;
      let mejor = Infinity;
      for (const e of ctxRef.current.empleadasDelDia || []) {
        const el = colRefs.current[e.id];
        if (!el) continue;
        const r = el.getBoundingClientRect();
        const dist = clientX < r.left ? r.left - clientX : clientX > r.right ? clientX - r.right : 0;
        if (dist < mejor) {
          mejor = dist;
          elegido = e.id;
          rect = r;
        }
      }
      if (!elegido) return null;
      let minutos = GRID_START + (clientY - rect.top - d.agarreY) / PX_PER_MIN;
      minutos = Math.round(minutos / SNAP) * SNAP;
      const maxInicio = Math.max(GRID_START, GRID_END - d.cita.duracion);
      return { empleadaId: elegido, inicio: Math.min(Math.max(minutos, GRID_START), maxInicio) };
    };

    const aplicarDestino = (d, dest) => {
      if (!dest) return;
      const prev = d.destino;
      if (prev && prev.empleadaId === dest.empleadaId && prev.inicio === dest.inicio) return;
      d.destino = dest;
      setDrag({ citaId: d.cita.id, ...dest });
    };

    const limpiar = () => {
      const d = dragRef.current;
      if (d) {
        if (d.timer) window.clearTimeout(d.timer);
        if (d.raf) window.cancelAnimationFrame(d.raf);
      }
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
      window.removeEventListener("pointercancel", cancelar);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      dragRef.current = null;
      setDrag(null);
    };

    const activar = (d) => {
      d.activo = true;
      document.body.style.userSelect = "none";
      document.body.style.cursor = "grabbing";
      if (d.tactil && navigator.vibrate) navigator.vibrate(12);
      aplicarDestino(d, { empleadaId: d.cita.empleadaId, inicio: d.cita.inicio });
      // Desplazamiento automático al acercarse a los bordes mientras se arrastra
      const bucle = () => {
        if (dragRef.current !== d || !d.activo) return;
        let cambio = false;
        const vh = window.innerHeight;
        let dy = 0;
        if (d.lastY < 90) dy = -Math.ceil((90 - d.lastY) / 5);
        else if (d.lastY > vh - 90) dy = Math.ceil((d.lastY - (vh - 90)) / 5);
        if (dy) {
          window.scrollBy(0, dy);
          cambio = true;
        }
        const sc = scrollRef.current;
        if (sc) {
          const r = sc.getBoundingClientRect();
          let dx = 0;
          if (d.lastX < r.left + 60) dx = -10;
          else if (d.lastX > r.right - 60) dx = 10;
          if (dx) {
            sc.scrollLeft += dx;
            cambio = true;
          }
        }
        if (cambio) aplicarDestino(d, destinoDesde(d.lastX, d.lastY));
        d.raf = window.requestAnimationFrame(bucle);
      };
      d.raf = window.requestAnimationFrame(bucle);
    };

    const mover = (ev) => {
      const d = dragRef.current;
      if (!d) return;
      if (ev.pointerId !== undefined && d.pointerId !== undefined && ev.pointerId !== d.pointerId) return;
      d.lastX = ev.clientX;
      d.lastY = ev.clientY;
      if (!d.activo) {
        const dx = Math.abs(ev.clientX - d.startX);
        const dy = Math.abs(ev.clientY - d.startY);
        if (d.tactil) {
          // Si el dedo se mueve antes de la pulsación larga, es un desplazamiento normal
          if (dx > 8 || dy > 8) limpiar();
          return;
        }
        if (dx < 6 && dy < 6) return;
        activar(d);
      }
      aplicarDestino(d, destinoDesde(ev.clientX, ev.clientY));
    };

    const soltar = (ev) => {
      const d = dragRef.current;
      if (!d) return;
      if (ev.pointerId !== undefined && d.pointerId !== undefined && ev.pointerId !== d.pointerId) return;
      const activo = d.activo;
      const dest = activo ? d.destino : null;
      const cita = d.cita;
      limpiar();
      if (activo) {
        ignorarClickHasta.current = Date.now() + 350; // evita que el clic posterior abra la ficha
        if (dest && (dest.empleadaId !== cita.empleadaId || dest.inicio !== cita.inicio)) {
          ctxRef.current.onMoveCita?.(cita, dest.empleadaId, dest.inicio);
        }
      }
    };

    const cancelar = () => limpiar();
    manejadores.current = { SNAP, limpiar, activar, mover, soltar, cancelar };
  }

  useEffect(() => {
    // En el móvil, mientras se arrastra una cita, la pantalla no debe desplazarse
    const bloquear = (ev) => {
      if (dragRef.current?.activo && ev.cancelable) ev.preventDefault();
    };
    document.addEventListener("touchmove", bloquear, { passive: false });
    const m = manejadores.current;
    return () => {
      document.removeEventListener("touchmove", bloquear);
      if (dragRef.current) m.limpiar();
    };
  }, []);

  function alPulsarCita(ev, cita) {
    if (ev.button !== undefined && ev.button !== 0) return;
    if (cita.estadoCobro === "cobrada" || !onMoveCita) return; // las cobradas no se mueven
    if (dragRef.current) manejadores.current.limpiar();
    const rect = ev.currentTarget.getBoundingClientRect();
    const tactil = ev.pointerType === "touch";
    const d = {
      cita, pointerId: ev.pointerId, startX: ev.clientX, startY: ev.clientY, lastX: ev.clientX, lastY: ev.clientY,
      agarreY: ev.clientY - rect.top, tactil, activo: false, timer: null, raf: null, destino: null,
    };
    dragRef.current = d;
    const { mover, soltar, cancelar, activar } = manejadores.current;
    // Táctil: hace falta mantener pulsado un momento (si no, es para desplazar la pantalla)
    if (tactil) d.timer = window.setTimeout(() => { if (dragRef.current === d && !d.activo) activar(d); }, 380);
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
    window.addEventListener("pointercancel", cancelar);
  }

  // Teclado: Intro abre la cita; Alt + flechas la mueve (arriba/abajo 15 min, izquierda/derecha otra empleada)
  function moverConTeclado(ev, cita) {
    if (ev.altKey && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(ev.key)) {
      ev.preventDefault();
      if (cita.estadoCobro === "cobrada" || !onMoveCita) return;
      const SNAP = manejadores.current.SNAP;
      let inicio = cita.inicio;
      let empId = cita.empleadaId;
      if (ev.key === "ArrowUp") inicio -= SNAP;
      if (ev.key === "ArrowDown") inicio += SNAP;
      inicio = Math.min(Math.max(inicio, GRID_START), Math.max(GRID_START, GRID_END - cita.duracion));
      if (ev.key === "ArrowLeft" || ev.key === "ArrowRight") {
        const i = empleadasDelDia.findIndex((e) => e.id === empId);
        const j = i + (ev.key === "ArrowRight" ? 1 : -1);
        if (j >= 0 && j < empleadasDelDia.length) empId = empleadasDelDia[j].id;
      }
      if (inicio !== cita.inicio || empId !== cita.empleadaId) onMoveCita(cita, empId, inicio);
      return;
    }
    if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      onEditCita(cita);
    }
  }

  const slots = [];
  for (let m = GRID_START; m < GRID_END; m += 30) slots.push(m);

  const gridHeight = (GRID_END - GRID_START) * PX_PER_MIN;
  const empleadasDelDia = employees.filter((e) => trabajaEseDia(e, day, appointments));
  const citasDelDia = appointments.filter((a) => a.fecha === day);
  const esHoy = day === todayISO();
  const lineaHoraTop = (nowMin - GRID_START) * PX_PER_MIN;
  // La línea de «ahora»: VERDE si esa empleada está en su horario, ROJA si está en la zona gris (fuera de horario)
  const enTurnoAhora = (emp) => { const h = horarioDelDia(emp, day, appointments); return Boolean(h) && nowMin >= h.inicio && nowMin < h.fin; };
  const alguienEnTurno = empleadasDelDia.some(enTurnoAhora);
  ctxRef.current = { empleadasDelDia, citasDelDia, onMoveCita };
  // Al abrir la agenda (o cambiar de día) se baja hasta la hora actual, o hasta el primer turno del día
  const primerTurno = empleadasDelDia.reduce((min, e) => Math.min(min, horarioDelDia(e, day, appointments).inicio), 24 * 60);
  React.useEffect(() => {
    if (!gridRef.current || typeof window.scrollTo !== "function") return;
    const minuto = esHoy ? nowMinutesExact() : primerTurno < 24 * 60 ? primerTurno : DAY_START;
    const css = window.getComputedStyle(document.documentElement);
    // el hueco que ocupan las barras fijas (superior + fecha + empleadas) no debe tapar la hora que se busca
    const barras = (parseFloat(css.getPropertyValue("--topbar-h")) || 0) + (parseFloat(css.getPropertyValue("--agenda-controls-h")) || 0) + (headerRef.current ? headerRef.current.offsetHeight : 0);
    const arriba = gridRef.current.getBoundingClientRect().top + (window.scrollY || 0);
    window.scrollTo({ top: Math.max(0, arriba + minuto * PX_PER_MIN - (barras + (esHoy ? 150 : 40))) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, empleadasDelDia.length > 0]);

  return (
    <div>
      <div ref={controlsRef} data-barra-sticky="controles" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, paddingTop: 8, paddingBottom: 10, flexWrap: "wrap", gap: 12, position: "sticky", top: "var(--topbar-h, 64px)", zIndex: 25, background: "var(--bg, #fff)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <IconButton icon={ChevronLeft} label="Día anterior" onClick={() => setDay(addDays(day, -1))} />

          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setShowCalendar((v) => !v)}
              style={{ background: "transparent", border: "none", display: "flex", alignItems: "center", gap: 8, fontFamily: "'Outfit', sans-serif", fontSize: 20 }}
            >
              <CalendarDays size={17} style={{ color: "var(--accent-text)" }} />
              {fechaLabel(day)}
            </button>
            {showCalendar && (
              <MonthCalendarPopover selectedDate={day} onSelect={setDay} onClose={() => setShowCalendar(false)} />
            )}
          </div>

          <IconButton icon={ChevronRight} label="Día siguiente" onClick={() => setDay(addDays(day, 1))} />

          {!esHoy && (
            <button type="button" className="btn btn-ghost" onClick={() => setDay(todayISO())} style={{ fontSize: 12.5 }}>
              Hoy
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {pendientesRevisar.length > 0 && (
            <button type="button" className="btn btn-ghost" data-por-revisar="1" onClick={() => setPorRevisarAbierto(true)} style={{ borderColor: "#F59E0B", fontSize: 13 }}>
              ⚠ Por revisar <span data-por-revisar-n="1" style={{ background: "#F59E0B", color: "#fff", borderRadius: 999, padding: "0 7px", fontSize: 11.5, fontWeight: 700, marginLeft: 4 }}>{pendientesRevisar.length}</span>
            </button>
          )}
          {onConfirmacion && (
            <button type="button" className="btn btn-ghost" data-confirmar-manana="1" onClick={() => setConfirmarManana(true)} title="Llamar o escribir a las clientas de mañana para confirmar sus citas">
              <Hand size={15} aria-hidden="true" /> Confirmar mañana
              {pendientesManana > 0 && <span data-pendientes-manana="1" aria-label={`${pendientesManana} sin confirmar`} style={{ background: "#D97706", color: "#fff", borderRadius: 999, fontSize: 11.5, fontWeight: 700, minWidth: 20, height: 20, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 6px", marginLeft: 6 }}>{pendientesManana}</span>}
            </button>
          )}
          <button
            type="button"
            className="btn btn-gold"
            onClick={onAnadir}
            aria-haspopup="dialog"
          >
            <Plus size={15} /> Añadir
          </button>
        </div>
        {reprogramando && (
          <div role="status" data-banner-reprogramar="1" style={{ flexBasis: "100%", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", background: "rgba(var(--accent-rgb),0.12)", border: "1px solid var(--accent)", borderRadius: 12, padding: "8px 12px", fontSize: 13.5 }}>
            <CalendarClock size={16} aria-hidden="true" />
            <span style={{ flex: "1 1 260px" }}>
              <strong>Reprogramando la cita de {reprogramando.clienta}</strong> ({services.find((sv) => sv.id === reprogramando.servicioId)?.nombre || "cita"} · {reprogramando.duracion} min · ahora {fechaLabel(reprogramando.fecha)} a las {minToLabel(reprogramando.inicio)}).
              Cambia de día con las flechas y haz <strong>clic en el hueco</strong> donde la quieres: en verde está libre, en rojo no.
            </span>
            <button type="button" className="btn btn-ghost" data-cancelar-reprogramar="1" style={{ minHeight: 34 }} onClick={onCancelarReprogramar}>Cancelar</button>
          </div>
        )}
      </div>

      {empleadasDelDia.length === 0 && (
        <div className="card" style={{ padding: 28, textAlign: "center", color: "rgba(var(--ink-rgb),0.68)", fontSize: 14 }}>
          Nadie trabaja este día.
        </div>
      )}

      {empleadasDelDia.length > 0 && (
      <div className="card" style={{ overflow: "clip" }}>
        <div ref={scrollRef} style={{ overflowX: empleadasDelDia.length > 4 ? "auto" : "clip" }}>
          <div style={{ minWidth: 64 + empleadasDelDia.length * 150 }}>
            <div ref={headerRef} data-barra-sticky="empleados" style={{ display: "grid", gridTemplateColumns: `64px repeat(${empleadasDelDia.length}, minmax(150px, 1fr))`, borderBottom: "1px solid var(--line)", position: "sticky", top: "calc(var(--topbar-h, 64px) + var(--agenda-controls-h, 0px))", zIndex: 20, background: "var(--surface)" }}>
              <div />
              {empleadasDelDia.map((e) => (
                <CabeceraEmpleada key={e.id} e={e} fichajeActivo={fichajeActivo} descansos={descansos} />
              ))}
            </div>

            <div ref={gridRef} style={{ display: "grid", gridTemplateColumns: `64px repeat(${empleadasDelDia.length}, minmax(150px, 1fr))`, position: "relative" }}>
              <div style={{ position: "relative" }}>
                {esHoy && (
                  <div data-hora-actual={alguienEnTurno ? "verde" : "roja"} style={{ position: "absolute", top: lineaHoraTop - 9, right: 3, zIndex: 6, background: alguienEnTurno ? "#16A34A" : "#E0503C", color: "#fff", fontSize: 11, fontWeight: 700, padding: "1px 6px", borderRadius: 6, boxShadow: alguienEnTurno ? "0 0 8px rgba(22,163,74,0.7)" : "0 0 8px rgba(224,80,60,0.7)" }}>
                    {minToLabel(Math.floor(nowMin))}
                  </div>
                )}
                {slots.map((m) => (
                  <div key={m} style={{ height: PX_PER_MIN * 30, fontSize: 12.5, color: "rgba(var(--ink-rgb),0.68)", textAlign: "right", paddingRight: 8, position: "relative", top: -6 }}>
                    {m % 60 === 0 ? minToLabel(m) : ""}
                  </div>
                ))}
              </div>

          {empleadasDelDia.map((emp) => {
            const citasEmp = citasDelDia.filter((a) => a.empleadaId === emp.id);
            const horarioHoy = horarioDelDia(emp, day, appointments);
            const carrilesEmp = disponerCitasSolapadas(citasEmp);
            return (
              <div
                key={emp.id}
                ref={(el) => { colRefs.current[emp.id] = el; }}
                data-col-emp={emp.id}
                style={{ position: "relative", borderLeft: "1px solid var(--line)", height: gridHeight }}
              >
                {slots.map((m) => {
                  const fueraDeTurno = m < horarioHoy.inicio || m >= horarioHoy.fin;
                  return (
                    <div
                      key={m}
                      data-fuera-turno={fueraDeTurno ? "1" : undefined}
                      onClick={(ev) => (reprogramando ? alElegirHueco(ev, emp.id, m) : setMenuHueco({ empleadaId: emp.id, inicio: m, x: ev.clientX, y: ev.clientY, fuera: fueraDeTurno }))}
                      onMouseMove={reprogramando ? (ev) => alPasarPorHueco(ev, emp.id, m) : undefined}
                      title={reprogramando ? "Clic para poner aquí la cita" : fueraDeTurno ? "Fuera de su horario · clic para añadir algo igualmente" : undefined}
                      style={{
                        height: PX_PER_MIN * 30,
                        borderTop: "1px solid rgba(var(--ink-rgb),0.06)",
                        cursor: "pointer",
                        backgroundColor: fueraDeTurno ? "rgba(var(--ink-rgb),0.14)" : "transparent",
                        backgroundImage: fueraDeTurno
                          ? "repeating-linear-gradient(135deg, rgba(var(--ink-rgb),0.16) 0px, rgba(var(--ink-rgb),0.16) 1px, transparent 1px, transparent 7px)"
                          : "none",
                      }}
                      onMouseEnter={fueraDeTurno ? undefined : (ev) => (ev.currentTarget.style.background = "rgba(var(--accent-rgb),0.07)")}
                      onMouseLeave={fueraDeTurno ? undefined : (ev) => (ev.currentTarget.style.background = "transparent")}
                    />
                  );
                })}

                {esHoy && nowMin >= GRID_START && nowMin <= GRID_END && (
                  <div data-linea-ahora={nowMin >= horarioHoy.inicio && nowMin < horarioHoy.fin ? "verde" : "roja"} style={{ position: "absolute", top: lineaHoraTop, left: 0, right: 0, height: 2, background: nowMin >= horarioHoy.inicio && nowMin < horarioHoy.fin ? "#16A34A" : "#E0503C", boxShadow: nowMin >= horarioHoy.inicio && nowMin < horarioHoy.fin ? "0 0 10px 1px rgba(22,163,74,0.75)" : "0 0 10px 1px rgba(224,80,60,0.75)", zIndex: 5, pointerEvents: "none" }} />
                )}

                {drag && drag.empleadaId === emp.id && (() => {
                  const c = citasDelDia.find((a) => a.id === drag.citaId);
                  if (!c) return null;
                  const sv = services.find((x) => x.id === c.servicioId);
                  const col = sv?.color || COLOR_SERVICIO_POR_DEFECTO;
                  const pisa = citasDelDia.some((a) => a.id !== c.id && a.empleadaId === emp.id && overlaps(a.inicio, a.duracion, drag.inicio, c.duracion));
                  return (
                    <div
                      aria-hidden="true"
                      data-ghost="1"
                      style={{
                        position: "absolute", top: (drag.inicio - GRID_START) * PX_PER_MIN, height: Math.max(c.duracion * PX_PER_MIN, 26), left: 4, right: 4,
                        borderRadius: 10, padding: "6px 10px", background: col, color: colorTextoContraste(col), opacity: 0.9,
                        outline: "2px dashed rgba(var(--ink-rgb),0.75)", outlineOffset: 1, zIndex: 30, pointerEvents: "none",
                        fontSize: 12.5, fontWeight: 600, boxShadow: "0 16px 30px -12px rgba(0,0,0,0.55)", overflow: "hidden",
                      }}
                    >
                      {minToLabel(drag.inicio)}–{minToLabel(drag.inicio + c.duracion)} · {c.clienta}
                      {pisa && <div style={{ fontWeight: 500, fontSize: 12 }}>⚠ Se solapa con otra cita</div>}
                    </div>
                  );
                })()}

                {bloqueos.filter((b) => b.fecha === day && b.empleadaId === emp.id).map((b) => {
                  const ini = Math.max(b.inicio, GRID_START);
                  const fin = Math.min(b.inicio + b.duracion, GRID_END);
                  if (fin <= ini) return null;
                  return (
                    <div
                      key={b.id} role="button" tabIndex={0} data-bloqueo-id={b.id}
                      aria-label={`No disponible de ${minToLabel(b.inicio)} a ${minToLabel(b.inicio + b.duracion)}${b.motivo ? `: ${b.motivo}` : ""}`}
                      title="Horario no disponible · clic para añadir una cita igualmente, o para editarlo o quitarlo"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        const r = ev.currentTarget.getBoundingClientRect();
                        const m = Math.round((ini + (ev.clientY - r.top) / PX_PER_MIN) / 15) * 15; // el minuto donde se ha hecho clic
                        setMenuHueco({ empleadaId: emp.id, inicio: Math.min(Math.max(m, ini), Math.max(ini, fin - 15)), x: ev.clientX, y: ev.clientY, bloqueo: b });
                      }}
                      onKeyDown={(ev) => {
                        if (ev.key === "Enter" || ev.key === " ") {
                          ev.preventDefault();
                          const r = ev.currentTarget.getBoundingClientRect();
                          setMenuHueco({ empleadaId: emp.id, inicio: ini, x: r.left + 24, y: r.top + 24, bloqueo: b });
                        }
                      }}
                      style={{
                        position: "absolute", top: (ini - GRID_START) * PX_PER_MIN, height: (fin - ini) * PX_PER_MIN, left: 2, right: 2, zIndex: 1,
                        borderRadius: 8, padding: "5px 8px", fontSize: 12, lineHeight: 1.3, overflow: "hidden", cursor: "pointer",
                        background: "repeating-linear-gradient(135deg, rgba(var(--ink-rgb),0.13) 0px, rgba(var(--ink-rgb),0.13) 6px, rgba(var(--ink-rgb),0.06) 6px, rgba(var(--ink-rgb),0.06) 12px)",
                        border: "1px dashed rgba(var(--ink-rgb),0.45)", color: "var(--text)",
                      }}
                    >
                      <strong style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Ban size={12} aria-hidden="true" /> No disponible</strong>
                      <div style={{ opacity: 0.85 }}>{minToLabel(b.inicio)}–{minToLabel(b.inicio + b.duracion)}{b.motivo ? ` · ${b.motivo}` : ""}</div>
                    </div>
                  );
                })}

                {citasEmp.map((cita) => {
                  const servicio = services.find((s) => s.id === cita.servicioId);
                  const cliente = cita.clienteId ? clientes.find((c) => c.id === cita.clienteId) : null;
                  const cobrada = cita.estadoCobro === "cobrada";
                  const colorServicio = servicio?.color || COLOR_SERVICIO_POR_DEFECTO;
                  const top = (cita.inicio - GRID_START) * PX_PER_MIN;
                  const height = cita.duracion * PX_PER_MIN;
                  const { carril, carriles } = carrilesEmp.get(cita.id) || { carril: 0, carriles: 1 };
                  const arrastrandoEsta = drag && drag.citaId === cita.id;
                  const asistenciaCita = cita.asistencia || "prevista";
                  const noShow = asistenciaCita === "no_asistio";
                  const anulada = asistenciaCita === "cancelada";
                  const tieneNota = Boolean(cita.notas) || Boolean(cliente?.notaFija);
                  const fondoBloque = anulada
                    ? "rgba(var(--ink-rgb),0.06)"
                    : noShow
                    ? "repeating-linear-gradient(135deg, rgba(220,38,38,0.16) 0px, rgba(220,38,38,0.16) 6px, rgba(220,38,38,0.07) 6px, rgba(220,38,38,0.07) 12px)"
                    : cobrada
                    ? "rgba(var(--ink-rgb),0.10)"
                    : tinteDeColor(colorServicio, 0.24);
                  return (
                    <div
                      key={cita.id}
                      className="cita-block"
                      role="button"
                      tabIndex={0}
                      data-cita-id={cita.id}
                      data-confirmacion={cita.confirmacion || "pendiente"}
                      data-reprogramando-esta={reprogramando && reprogramando.id === cita.id ? "1" : undefined}
                      data-carril={carril}
                      data-carriles={carriles}
                      title={cobrada ? "Cobrada: anula el cobro para poder moverla" : "Clic para abrir · arrastra para mover (en el móvil, mantén pulsada)"}
                      aria-label={`${cita.clienta}, ${servicio?.nombre || "cita"}, de ${minToLabel(cita.inicio)} a ${minToLabel(cita.inicio + cita.duracion)}${cobrada ? ", cobrada" : ". Alt más flechas para moverla"}`}
                      onKeyDown={(ev) => moverConTeclado(ev, cita)}
                      onPointerDown={reprogramando ? undefined : (ev) => alPulsarCita(ev, cita)}
                      onContextMenu={(ev) => { if (dragRef.current) ev.preventDefault(); }}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        if (Date.now() < ignorarClickHasta.current) return;
                        if (reprogramando) { onMensaje?.("Estás reprogramando una cita: haz clic en un hueco libre, o cancela arriba."); return; }
                        onEditCita(cita);
                      }}
                      style={{
                        position: "absolute", top, height: Math.max(height, 26),
                        left: `calc(4px + ${carril} * (100% - 8px) / ${carriles})`,
                        width: `calc((100% - 8px) / ${carriles} - ${carriles > 1 ? 2 : 0}px)`,
                        background: fondoBloque, color: "var(--text)",
                        borderRadius: 10, padding: carriles > 1 ? "5px 6px" : "6px 10px",
                        fontSize: 12.5, lineHeight: 1.35, overflow: "hidden",
                        borderLeft: `4px solid ${cobrada || anulada ? "rgba(var(--ink-rgb),0.4)" : noShow ? "#DC2626" : colorServicio}`,
                        cursor: cobrada ? "pointer" : "grab", opacity: arrastrandoEsta ? 0.35 : anulada ? 0.65 : 1,
                        WebkitTouchCallout: "none", userSelect: "none",
                        boxShadow: "0 4px 12px -8px rgba(var(--ink-rgb),0.45)",
                        ...(reprogramando && reprogramando.id === cita.id ? { outline: "2px dashed var(--accent)", outlineOffset: 2, opacity: 0.55 } : {}),
                      }}
                    >
                      <span style={{ position: "absolute", top: 4, right: 4, display: "flex", gap: 3, alignItems: "center" }}>
                        {tieneNota && <StickyNote size={13} aria-label="Tiene nota" />}
                        {cliente?.favorito && <Heart size={12} style={{ fill: "var(--accent)", stroke: "var(--accent)" }} />}
                        {cobrada && <DollarSign size={13} />}
                        {!anulada && !cobrada && cita.confirmacion === "confirmada" && <Hand size={14} data-icono-confirmada="1" aria-label="Confirmada: viene" style={{ color: "#16A34A" }} />}
                        {!anulada && !cobrada && cita.confirmacion === "no_contesta" && <PhoneOff size={13} data-icono-no-cogio="1" aria-label="No cogió la llamada" style={{ color: "#D97706" }} />}
                      </span>
                      <div style={{ fontWeight: 600, paddingRight: 18, textDecoration: anulada ? "line-through" : "none" }}>
                        <span style={{ fontWeight: 400, opacity: 0.8 }}>{minToLabel(cita.inicio)}–{minToLabel(cita.inicio + cita.duracion)}</span> {cita.clienta}
                        {cita.clienteId && primerasCitas.get(cita.clienteId)?.id === cita.id && !anulada && (
                          <span title="Primera visita de este cliente" style={{ marginLeft: 5, background: "var(--accent)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 5px", borderRadius: 6, verticalAlign: "middle", whiteSpace: "nowrap" }}>1ª vez</span>
                        )}
                        {cita.clienteId && deudaPorCliente.get(cita.clienteId) > 0.005 && !anulada && (
                          <span data-deuda-cita="1" title="Este cliente debe aún parte de un bono" style={{ marginLeft: 5, background: "#D92D20", color: "#fff", fontSize: 10.5, fontWeight: 800, padding: "1px 6px", borderRadius: 6, verticalAlign: "middle", whiteSpace: "nowrap" }}>Debe {Math.round(deudaPorCliente.get(cita.clienteId) * 100) / 100} €</span>
                        )}
                        {(cita.notas || "").includes(MARCA_REVISAR) && !anulada && (
                          <span data-revisar-servicio="1" title="Llegó de GHL y el servicio no se reconoció: ábrela y elige el correcto" style={{ marginLeft: 5, background: "#F59E0B", color: "#1F2937", fontSize: 10.5, fontWeight: 800, padding: "1px 6px", borderRadius: 6, verticalAlign: "middle", whiteSpace: "nowrap" }}>⚠ Revisar servicio</span>
                        )}
                        {cliente?.telefono && Math.max(height, 26) < 66 && <span data-telefono="1" style={{ fontWeight: 400, opacity: 0.85, fontSize: 11.5 }}> · {cliente.telefono}</span>}
                      </div>
                      {cliente?.telefono && Math.max(height, 26) >= 66 && <div data-telefono="1" style={{ opacity: 0.85, fontSize: 12 }}>{cliente.telefono}</div>}
                      <div style={{ opacity: 0.85 }}>
                        {noShow ? <strong style={{ color: "var(--danger)" }}>No asistió · </strong> : anulada ? <strong>Cancelada · </strong> : null}
                        {servicio?.nombre}{cita.serviciosExtra?.length ? ` +${cita.serviciosExtra.length}` : ""} · {calcularTotalCita(cita, services, productos).toFixed(2)} €
                      </div>
                    </div>
                  );
                })}
                {reprogramando && hoverRepro && hoverRepro.empleadaId === emp.id && (() => {
                  const avisos = avisosParaHueco(emp.id, day, hoverRepro.inicio);
                  const libre = avisos.length === 0;
                  return (
                    <div data-vista-previa-reprogramar={libre ? "libre" : "ocupado"} style={{ position: "absolute", top: (hoverRepro.inicio - GRID_START) * PX_PER_MIN, height: reprogramando.duracion * PX_PER_MIN, left: 4, right: 4, zIndex: 5, pointerEvents: "none", borderRadius: 10, border: `2px dashed ${libre ? "#16A34A" : "#DC2626"}`, background: libre ? "rgba(22,163,74,0.16)" : "rgba(220,38,38,0.13)", padding: "4px 8px", fontSize: 12, fontWeight: 700, color: libre ? "#14532D" : "#7F1D1D", overflow: "hidden" }}>
                      {minToLabel(hoverRepro.inicio)}–{minToLabel(hoverRepro.inicio + reprogramando.duracion)} · {libre ? "libre ✓" : avisos.join(" · ")}
                    </div>
                  );
                })()}
              </div>
            );
          })}
            </div>
          </div>
        </div>
      </div>
      )}
      {confirmarRepro && (
        <ConfirmDialog
          titulo="Ese hueco no está libre"
          mensaje={`${confirmarRepro.avisos.join("; ")}. ¿La reprogramas igualmente a las ${minToLabel(confirmarRepro.inicio)}?`}
          textoCancelar="Elegir otro hueco"
          textoConfirmar="Reprogramar igualmente"
          onCancelar={() => setConfirmarRepro(null)}
          onConfirmar={() => { const c = confirmarRepro; setConfirmarRepro(null); onReprogramarAqui(c.empleadaId, day, c.inicio); }}
        />
      )}
      {porRevisarAbierto && (
        <PorRevisar
          ui={{ ModalShell }} citas={pendientesRevisar} servicios={services} empleadas={employees} cabinas={cabins} todasLasCitas={appointments} bloqueos={bloqueos}
          horarioDe={(e, f) => horarioDelDia(e, f, appointments)} onCorregir={onCorregirServicio} onEstaBien={onEstaBienServicio}
          onAbrirCita={(c) => { setPorRevisarAbierto(false); onEditCita(c); }} onClose={() => setPorRevisarAbierto(false)}
        />
      )}
      {confirmarManana && (
        <ConfirmarCitas
          ui={{ ModalShell }} negocio={negocio} fechaInicial={addDays(hoy || todayISO(), 1)} hoy={hoy || todayISO()} citas={appointments} clientes={clientes} servicios={services} empleadas={employees}
          onConfirmacion={onConfirmacion} onAbrirCita={(c) => { setConfirmarManana(false); onEditCita(c); }} onClose={() => setConfirmarManana(false)}
        />
      )}
      {menuHueco && (
        <MenuHueco
          hueco={menuHueco} empleada={employees.find((e) => e.id === menuHueco.empleadaId)}
          onCerrar={() => setMenuHueco(null)}
          onCita={() => { onSlotClick(menuHueco.empleadaId, menuHueco.inicio); setMenuHueco(null); }}
          onBloqueo={() => { onNuevoBloqueo && onNuevoBloqueo(menuHueco.empleadaId, menuHueco.inicio); setMenuHueco(null); }}
          onEditarBloqueo={() => { onEditBloqueo && onEditBloqueo(menuHueco.bloqueo); setMenuHueco(null); }}
        />
      )}
      <p style={{ fontSize: 12.5, color: "rgba(var(--ink-rgb),0.68)", marginTop: 10 }}>
        Haz clic en un hueco libre para crear una cita o marcarlo como no disponible, o sobre una cita para editarla o cobrarla. Arrástrala para cambiarle la hora o pasarla a otra empleada (en el móvil, mantén pulsada la cita y arrastra). Las citas se pueden solapar: se dibujan una al lado de la otra.
      </p>
    </div>
  );
}

// Cabecera de cada empleada en la agenda: foto, nombre y botones de fichar
function CabeceraEmpleada({ e, fichajeActivo, descansos }) {
  const estado = estadoFichaje(e.id, fichajeActivo, descansos);
  return (
    <div style={{ padding: "12px 8px 14px", borderLeft: "1px solid var(--line)", display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
      <Avatar empleada={e} size={46} />
      <span style={{ fontWeight: 500, fontSize: 13.5 }}>{e.nombre}</span>
      <span data-estado-fichaje={estado} style={{ fontSize: 11.5, color: estado === "descanso" ? "#B45309" : "rgba(var(--ink-rgb),0.68)" }}>
        {estado === "dentro" ? `En turno desde ${tiempoLabel(fichajeActivo[e.id])}` : estado === "descanso" ? `En descanso desde ${tiempoLabel(descansos[e.id])}` : "Sin fichar"}
      </span>
    </div>
  );
}

// Aviso al entrar con el código: falta fichar la entrada o la salida de hoy (no bloquea nada)
function AlertaFichaje({ alerta, empleada, onFichar, onCerrar }) {
  const entrada = alerta.tipo === "entrada";
  return (
    <ModalShell title="Recuerda fichar" onClose={onCerrar}>
      <p style={{ fontSize: 15, lineHeight: 1.5, marginTop: 0 }}>
        {entrada ? <>Hola {empleada.nombre}: <strong>todavía no has fichado la entrada de hoy.</strong></> : <>Hola {empleada.nombre}: <strong>ya ha pasado tu hora de salida y no has fichado la salida de hoy.</strong></>}
      </p>
      <p style={{ fontSize: 13.5, color: "rgba(var(--ink-rgb),0.74)", marginTop: 0 }}>Puedes seguir usando la agenda con normalidad.</p>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
        <button type="button" className="btn btn-ghost" onClick={onCerrar}>Más tarde</button>
        <button type="button" className="btn btn-gold" onClick={onFichar}>{entrada ? "Fichar entrada ahora" : "Fichar salida ahora"}</button>
      </div>
    </ModalShell>
  );
}

// Menú que sale al pulsar un hueco libre de la agenda
// «Añadir»: ¿qué quieres añadir? (cita, venta u horario no disponible)
function MenuAnadir({ conVenta, onCerrar, onCita, onVenta, onBloqueo }) {
  const opcion = { display: "flex", alignItems: "center", gap: 14, width: "100%", padding: "14px 16px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, textAlign: "left", cursor: "pointer", color: "var(--text)", marginBottom: 10 };
  const icono = { width: 40, height: 40, borderRadius: 12, background: "rgba(var(--accent-rgb),0.12)", color: "var(--accent-text)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" };
  const fila = (clave, Icono, titulo, detalle, onClick) => (
    <button key={clave} type="button" data-anadir={clave} style={opcion} onClick={onClick}>
      <span style={icono}><Icono size={20} aria-hidden="true" /></span>
      <span><span style={{ display: "block", fontWeight: 600, fontSize: 15.5 }}>{titulo}</span><span style={{ display: "block", fontSize: 12.5, color: "rgba(var(--ink-rgb),0.68)" }}>{detalle}</span></span>
    </button>
  );
  return (
    <ModalShell title="¿Qué quieres añadir?" onClose={onCerrar} ancho={440}>
      <div data-menu-anadir="1">
        {fila("cita", Plus, "Cita", "Reservar un hueco a una clienta", onCita)}
        {conVenta && fila("venta", ShoppingBag, "Venta", "Productos o bonos, con o sin cita", onVenta)}
        {fila("bloqueo", Ban, "Horario no disponible", "Pausa, médico, formación…", onBloqueo)}
      </div>
    </ModalShell>
  );
}

function MenuHueco({ hueco, empleada, onCerrar, onCita, onBloqueo, onEditarBloqueo }) {
  useEffect(() => {
    const tecla = (e) => { if (e.key === "Escape") onCerrar(); };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [onCerrar]);
  const ancho = 270;
  const left = Math.max(8, Math.min(hueco.x, (typeof window !== "undefined" ? window.innerWidth : 1000) - ancho - 8));
  const top = Math.max(8, Math.min(hueco.y, (typeof window !== "undefined" ? window.innerHeight : 800) - 190));
  const item = { display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 14px", background: "transparent", border: "none", textAlign: "left", fontSize: 14, cursor: "pointer", color: "var(--text)", borderRadius: 10 };
  return (
    <div onClick={onCerrar} style={{ position: "fixed", inset: 0, zIndex: 70 }} data-menu-hueco="1">
      <div
        role="menu" aria-label={`Hueco de las ${minToLabel(hueco.inicio)}`} onClick={(e) => e.stopPropagation()}
        style={{ position: "fixed", left, top, width: ancho, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, boxShadow: "0 18px 40px -12px rgba(0,0,0,0.4)", padding: 8 }}
      >
        <div style={{ padding: "6px 14px 8px", fontSize: 12.5, color: "rgba(var(--ink-rgb),0.68)" }}>{minToLabel(hueco.inicio)}{empleada ? ` · ${empleada.nombre}` : ""}{hueco.fuera ? " · fuera de su horario" : ""}{hueco.bloqueo ? " · marcado como no disponible" : ""}</div>
        <button type="button" role="menuitem" autoFocus style={item} onClick={onCita}><Plus size={16} style={{ color: "var(--accent-text)" }} aria-hidden="true" /> Añadir cita</button>
        <button type="button" role="menuitem" style={item} onClick={onBloqueo}><Ban size={16} style={{ color: "var(--accent-text)" }} aria-hidden="true" /> Añadir horario no disponible</button>
        {hueco.bloqueo && <button type="button" role="menuitem" data-editar-bloqueo="1" style={item} onClick={onEditarBloqueo}><Pencil size={16} style={{ color: "var(--accent-text)" }} aria-hidden="true" /> Editar o quitar este horario no disponible</button>}
      </div>
    </div>
  );
}

// Campo de fecha que se puede ESCRIBIR (dd/mm/aaaa) además de elegir en el calendario
function CampoFecha({ valor, onChange, etiqueta, estilo, id }) {
  const [texto, setTexto] = useState(valor || "");
  useEffect(() => {
    setTexto(valor || "");
  }, [valor]);
  return (
    <input
      id={id} type="date" className="input" aria-label={etiqueta} style={estilo} value={texto}
      onChange={(e) => {
        setTexto(e.target.value);
        if (/^\d{4}-\d{2}-\d{2}$/.test(e.target.value)) onChange(e.target.value);
      }}
    />
  );
}

// Horario no disponible de una empleada (pausa, médico, formación, vacaciones de un día…)
function BloqueoModal({ data, defaults, employees, appointments, onClose, onSave, onDelete }) {
  const [empleadaId, setEmpleadaId] = useState(data?.empleadaId || defaults?.empleadaId || employees[0]?.id || "");
  const [fecha, setFecha] = useState(data?.fecha || defaults?.fecha || todayISO());
  const [inicio, setInicio] = useState(typeof data?.inicio === "number" ? data.inicio : typeof defaults?.inicio === "number" ? defaults.inicio : DAY_START);
  const [duracion, setDuracion] = useState(data?.duracion || 60);
  const [motivo, setMotivo] = useState(data?.motivo || "");
  const duracionNum = Number(duracion);
  const valido = Boolean(empleadaId && fecha) && Number.isFinite(duracionNum) && duracionNum >= 5 && typeof inicio === "number" && inicio >= 0 && inicio + duracionNum <= 24 * 60;
  const dentro = typeof inicio === "number" && inicio >= GRID_START && inicio + duracionNum <= GRID_END;
  const citasAfectadas = valido ? appointments.filter((a) => a.fecha === fecha && a.empleadaId === empleadaId && (a.asistencia || "prevista") !== "cancelada" && overlaps(a.inicio, a.duracion, inicio, duracionNum)) : [];
  const rapido = { minHeight: 34, padding: "4px 12px", fontSize: 13 };
  return (
    <ModalShell pagina ancho={760} title={data ? "Editar horario no disponible" : "Horario no disponible"} onClose={onClose}>
      <Field label="Empleada">
        <select className="input" aria-label="Empleada" value={empleadaId} onChange={(e) => setEmpleadaId(e.target.value)}>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
        </select>
      </Field>
      <Field label="Fecha"><CampoFecha valor={fecha} onChange={setFecha} etiqueta="Fecha" /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Desde (escribe la hora)"><CampoHora valor={inicio} onChange={setInicio} etiqueta="Hora de inicio del bloqueo" /></Field>
        <Field label="Duración (minutos)">
          <input className="input" type="number" min={5} step={5} inputMode="numeric" aria-label="Duración en minutos" value={duracion} onChange={(e) => setDuracion(e.target.value)} />
        </Field>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {[30, 60, 120].map((m) => <button key={m} type="button" className="btn btn-ghost" style={rapido} onClick={() => setDuracion(m)}>{m === 60 ? "1 hora" : m === 120 ? "2 horas" : "30 min"}</button>)}
        <button type="button" className="btn btn-ghost" style={rapido} onClick={() => { setInicio(GRID_START); setDuracion(GRID_END - GRID_START); }}>Todo el día</button>
      </div>
      {valido && <div style={{ fontSize: 13, color: "rgba(var(--ink-rgb),0.74)", marginBottom: 10 }}>Quedará bloqueado de {minToLabel(inicio)} a {minToLabel(inicio + duracionNum)}.</div>}
      <Field label="Motivo (opcional)"><input className="input" aria-label="Motivo" placeholder="Ej.: médico, formación, pausa larga" value={motivo} onChange={(e) => setMotivo(e.target.value)} /></Field>
      {!dentro && valido && <div role="alert" style={{ fontSize: 12.5, color: "var(--danger)", marginBottom: 10 }}>Parte de ese horario queda fuera de la agenda ({minToLabel(GRID_START)}–{minToLabel(GRID_END)}).</div>}
      {citasAfectadas.length > 0 && (
        <div role="alert" style={{ fontSize: 12.5, color: "var(--danger)", marginBottom: 10 }}>
          ⚠ Hay {citasAfectadas.length} {citasAfectadas.length === 1 ? "cita" : "citas"} en ese horario ({citasAfectadas.map((a) => `${a.clienta} ${minToLabel(a.inicio)}`).join(", ")}). Se mantienen: muévelas o avisa a esos clientes.
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 18, flexWrap: "wrap" }}>
        {data ? <button type="button" className="btn btn-ghost" style={{ color: "var(--danger)", borderColor: "var(--danger)" }} onClick={onDelete}><Trash2 size={14} /> Quitar bloqueo</button> : <span />}
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn btn-gold" disabled={!valido} onClick={() => onSave({ empleadaId, fecha, inicio, duracion: duracionNum, motivo: motivo.trim() })}>Guardar</button>
        </div>
      </div>
    </ModalShell>
  );
}

// Campo de hora con SEGUNDOS (10:07:30) para los fichajes
function CampoHoraSeg({ valor, onChange, etiqueta }) {
  const [texto, setTexto] = useState(typeof valor === "number" ? tiempoLabel(valor) : "");
  useEffect(() => {
    setTexto(typeof valor === "number" ? tiempoLabel(valor) : "");
  }, [valor]);
  return (
    <input
      type="time" step={1} className="input" aria-label={etiqueta} value={texto}
      onChange={(e) => {
        setTexto(e.target.value);
        const m = minutosDesdeHora(e.target.value);
        if (m !== null) onChange(m);
      }}
    />
  );
}

// Campo de hora que se puede ESCRIBIR (por ejemplo 10:35), además de elegir con el selector
function CampoHora({ valor, onChange, etiqueta, estilo }) {
  const [texto, setTexto] = useState(typeof valor === "number" ? minToLabel(valor) : "");
  useEffect(() => {
    setTexto(typeof valor === "number" ? minToLabel(valor) : "");
  }, [valor]);
  return (
    <input
      type="time" step={300} className="input" aria-label={etiqueta} style={estilo} value={texto}
      onChange={(e) => {
        setTexto(e.target.value);
        const m = minutosDesdeHHMM(e.target.value);
        if (m !== null) onChange(m);
      }}
    />
  );
}

function IconButton({ icon: Icon, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="btn-ghost"
      style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", border: "1px solid rgba(var(--ink-rgb),0.22)", background: "var(--field-bg)", flexShrink: 0 }}
    >
      <Icon size={17} aria-hidden="true" />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Cita modal — crear, editar, cobrar y anular
// ---------------------------------------------------------------------------

function iconoMetodo(metodo) {
  const id = (metodo?.id || "").toLowerCase();
  const nombre = (metodo?.nombre || "").toLowerCase();
  if (id === "efectivo" || nombre.includes("efectivo")) return Banknote;
  if (id === "tarjeta" || nombre.includes("tarjeta")) return CreditCard;
  if (id === "bizum" || nombre.includes("bizum")) return Smartphone;
  return DollarSign;
}

function presetsImporte(pendiente) {
  const base = Math.round(pendiente * 100) / 100;
  const candidatos = [
    base,
    base + 5,
    base + 10,
    Math.ceil((base + 1) / 50) * 50,
    Math.ceil((base + 1) / 100) * 100 * (base >= 100 ? 1 : 2),
  ];
  const vistos = new Set();
  return candidatos.filter((v) => v > 0 && (vistos.has(v) ? false : vistos.add(v))).sort((a, b) => a - b);
}

// Teclado para introducir un importe — con cambio automático cuando es en
// efectivo, o simplemente el importe a aplicar para el resto de métodos.
function TecladoImporte({ metodo, pendiente, nombreQuienCobra, onConfirmar, onClose }) {
  const esEfectivo = metodo.id === "efectivo";
  const [valor, setValor] = useState(pendiente > 0 ? String(Math.round(pendiente * 100) / 100) : "0");

  function pulsar(d) {
    setValor((v) => {
      if (d === "." && v.includes(".")) return v;
      if (v === "0" && d !== ".") return d;
      return v + d;
    });
  }
  function borrar() {
    setValor((v) => (v.length > 1 ? v.slice(0, -1) : "0"));
  }

  useEffect(() => {
    function handleKey(e) {
      if (e.key >= "0" && e.key <= "9") pulsar(e.key);
      else if (e.key === ".") pulsar(".");
      else if (e.key === "Backspace") borrar();
      else if (e.key === "Enter") onConfirmar(Number(valor) || 0);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor]);

  const monto = Number(valor) || 0;
  const cambio = esEfectivo ? monto - pendiente : 0;
  const keyStyle = { padding: "13px 0", borderRadius: 24, border: "1px solid var(--line)", background: "var(--field-bg)", fontSize: 15.5, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center" };

  return (
    <div className="card" style={{ padding: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <span style={{ fontWeight: 600, fontSize: 15 }}>Añadir cantidad {esEfectivo ? "en efectivo" : `· ${metodo.nombre}`}</span>
        <button type="button" onClick={onClose} style={{ background: "transparent", border: "none" }}><X size={18} /></button>
      </div>

      <div style={{ textAlign: "center", marginBottom: 16, fontFamily: "'Outfit', sans-serif", fontSize: 32, fontWeight: 600 }}>
        € <span style={{ borderBottom: "2px solid var(--accent)", paddingBottom: 2 }}>{valor}</span>
      </div>

      <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap", marginBottom: 18 }}>
        {presetsImporte(pendiente).map((p) => (
          <button key={p} type="button" className={`chip ${Number(valor) === p ? "on" : ""}`} onClick={() => setValor(String(p))}>{p} €</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "del"].map((k) =>
          k === "del" ? (
            <button key={k} type="button" onClick={borrar} style={keyStyle}><Delete size={16} /></button>
          ) : (
            <button key={k} type="button" onClick={() => pulsar(k)} style={keyStyle}>{k}</button>
          )
        )}
      </div>

      <div style={{ fontSize: 12, color: "rgba(var(--ink-rgb),0.68)", marginBottom: 12 }}>
        {esEfectivo ? "Efectivo recibido por" : "Cobrado por"} · <strong style={{ color: "var(--accent-text)" }}>{nombreQuienCobra}</strong>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontWeight: 600, fontSize: 13.5, color: esEfectivo ? (cambio >= 0 ? "var(--success)" : "var(--danger)") : "rgba(var(--ink-rgb),0.65)" }}>
          {esEfectivo
            ? cambio >= 0
              ? `Cambio · ${cambio.toFixed(2)} €`
              : `Pendiente de pago · ${Math.abs(cambio).toFixed(2)} €`
            : `Se aplicará: ${Math.min(monto, pendiente).toFixed(2)} €`}
        </span>
        <button type="button" className="btn" style={{ background: "var(--ink-solid)", color: "var(--on-ink)" }} onClick={() => onConfirmar(monto)} disabled={monto <= 0}>
          Añadir
        </button>
      </div>
    </div>
  );
}

function CitaModal({ esAdmin = false, onVerActividad, onCopiarEnlace, ventas = [], onCobrarPlazo, bonosVendidos = [], bonoUsos = [], bloqueos = [], modo, defaults, day, employees, services, cabins, clientes, productos, metodosPago, appointments, currentUser, onConfirmacion, onReprogramar, onClose, onSave, onDelete, onCobrar, onAnularCobro, onReject, onCreateCliente , onVerPerfil}) {
  const citaExistente = modo === "editar" ? defaults.cita : null;
  const bloqueada = citaExistente?.estadoCobro === "cobrada";

  const [vista, setVista] = useState("principal"); // 'principal' | 'clientes' | 'servicios' | 'cobro'
  const [mostrarPago, setMostrarPago] = useState(false);
  const [vistaPago, setVistaPago] = useState("metodos"); // 'metodos' | 'dividir'
  const [metodoAbierto, setMetodoAbierto] = useState(null);
  const [plazoVenta, setPlazoVenta] = useState(null); // venta de bono con deuda de la que se cobra un plazo
  const [mostrarSelectorDividir, setMostrarSelectorDividir] = useState(false);
  const [showCalPop, setShowCalPop] = useState(false);
  const [busquedaServicio, setBusquedaServicio] = useState("");
  const [confirmarReprogramar, setConfirmarReprogramar] = useState(false);

  const [fecha, setFecha] = useState(citaExistente?.fecha || day);
  const [empleadaId, setEmpleadaId] = useState(citaExistente?.empleadaId || defaults.empleadaId);
  const [inicio, setInicio] = useState(citaExistente?.inicio ?? defaults.inicio);
  const [servicioId, setServicioId] = useState(citaExistente?.servicioId || "");
  const [serviciosExtra, setServiciosExtra] = useState(citaExistente?.serviciosExtra || []);
  const [duracion, setDuracion] = useState(citaExistente?.duracion || 0);
  const [duracionTocada, setDuracionTocada] = useState(false);
  const [precioManualActivo, setPrecioManualActivo] = useState(citaExistente?.precioManual != null);
  const [precioManualValor, setPrecioManualValor] = useState(citaExistente?.precioManual ?? "");
  const [pagos, setPagos] = useState(
    (citaExistente?.pagos || []).map((p) => ({ ...p, importe: String(p.importe ?? ""), recibido: p.recibido != null ? String(p.recibido) : "" }))
  );
  const [productosLineas, setProductosLineas] = useState(citaExistente?.productos || []);

  const clienteInicial = citaExistente?.clienteId
    ? clientes.find((c) => c.id === citaExistente.clienteId)
    : defaults?.clienteId
    ? clientes.find((c) => c.id === defaults.clienteId) || null
    : null;
  const [modoCliente, setModoCliente] = useState(clienteInicial ? "buscar" : citaExistente ? "ninguno" : "buscar");
  const [busqueda, setBusqueda] = useState("");
  const [clienteSeleccionado, setClienteSeleccionado] = useState(clienteInicial || null);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoTelefono, setNuevoTelefono] = useState("");
  const [nuevoEmail, setNuevoEmail] = useState("");
  const [nombreLibre, setNombreLibre] = useState(!clienteInicial ? citaExistente?.clienta || "" : "");
  const [guardando, setGuardando] = useState(false);
  const [notas, setNotas] = useState(citaExistente?.notas || "");
  const [fijarNota, setFijarNota] = useState(false);
  const [asistencia, setAsistencia] = useState(citaExistente?.asistencia || "prevista");
  const [confirmarCierre, setConfirmarCierre] = useState(false);
  const [resalteServicio, setResalteServicio] = useState(0);
  const [resalteCliente, setResalteCliente] = useState(0);

  const empleada = employees.find((e) => e.id === empleadaId);
  // Datos ACTUALES del cliente elegido (si se edita su nota fija o su teléfono desde su ficha, aquí se ve al momento)
  const clienteVivo = clienteSeleccionado ? clientes.find((cl) => cl.id === clienteSeleccionado.id) || clienteSeleccionado : null;
  const servicio = services.find((s) => s.id === servicioId);
  const serviciosExtraObjs = serviciosExtra.map((id) => services.find((s) => s.id === id)).filter(Boolean);

  const duracionCalculada = (servicio?.duracion || 0) + serviciosExtraObjs.reduce((sum, s) => sum + s.duracion, 0);
  const productosSeleccionados = productosLineas.map((l) => ({ ...l, producto: productos.find((p) => p.id === l.productoId) }));
  const productosTotal = productosSeleccionados.reduce((sum, l) => sum + (l.producto ? l.producto.precio * l.cantidad : 0), 0);
  const precioCalculado = (servicio?.precio || 0) + serviciosExtraObjs.reduce((sum, s) => sum + s.precio, 0) + productosTotal;

  useEffect(() => {
    if (!duracionTocada) setDuracion(duracionCalculada);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servicioId, JSON.stringify(serviciosExtra)]);

  // ¿Hay cambios sin guardar? (la duración solo cuenta si se tocó a mano: se recalcula sola)
  const firmaActual = JSON.stringify([
    fecha, empleadaId, inicio, servicioId, serviciosExtra, duracionTocada ? duracion : null, precioManualActivo, precioManualValor,
    pagos.map((l) => [l.metodoId, l.importe]), productosLineas.map((l) => [l.productoId, l.cantidad]),
    clienteSeleccionado?.id || null, modoCliente, nuevoNombre, nuevoTelefono, nuevoEmail, nombreLibre, notas, fijarNota, asistencia,
  ]);
  const firmaInicial = React.useRef(null);
  if (firmaInicial.current === null) firmaInicial.current = firmaActual;
  const hayCambios = firmaActual !== firmaInicial.current;

  // Cerrar (X, Escape o Cancelar): si hay cambios sin guardar, pregunta antes de perderlos
  // la confirmación se lee de la agenda (así se ve al instante al marcarla, sin cerrar la cita)
  const citaViva = (citaExistente && appointments.find((a) => a.id === citaExistente.id)) || citaExistente || {};
  const confirmacionViva = citaViva.confirmacion || "pendiente";
  const cambiarConfirmacion = (estado) => onConfirmacion(citaExistente, confirmacionViva === estado ? "pendiente" : estado);
  // «Reprogramar»: se vuelve a la agenda para elegir el hueco nuevo con un clic (si hay cambios sin guardar, se avisa)
  function reprogramar() {
    if (hayCambios && !bloqueada) setConfirmarReprogramar(true);
    else onReprogramar(citaExistente);
  }

  function solicitarCierre() {
    if (confirmarCierre) {
      setConfirmarCierre(false); // Escape con el aviso abierto = seguir editando
      return;
    }
    if (hayCambios && !bloqueada) setConfirmarCierre(true);
    else onClose();
  }

  function quitarServicio(id) {
    if (id === servicioId) {
      // el principal pasa a ser el primero de los extra, si hay
      const [siguiente, ...resto] = serviciosExtra;
      setServicioId(siguiente || "");
      setServiciosExtra(resto);
    } else {
      setServiciosExtra((prev) => prev.filter((x) => x !== id));
    }
  }

  function elegirServicio(s) {
    if (!servicioId) {
      setServicioId(s.id);
    } else if (s.id !== servicioId && !serviciosExtra.includes(s.id)) {
      setServiciosExtra((prev) => [...prev, s.id]);
    }
    setVista("principal");
  }

  function addProductoLinea() {
    const disponible = productos.find((p) => p.activo && p.stock > 0);
    setProductosLineas((prev) => [...prev, { id: uid(), productoId: disponible?.id || "", cantidad: 1 }]);
  }
  function updateProductoLinea(id, patch) {
    setProductosLineas((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }
  function removeProductoLinea(id) {
    setProductosLineas((prev) => prev.filter((l) => l.id !== id));
  }

  const totalCita = precioManualActivo ? Number(precioManualValor) || 0 : precioCalculado;
  const totalPagado = pagos.reduce((sum, l) => sum + (Number(l.importe) || 0), 0);
  const diferencia = Math.round((totalCita - totalPagado) * 100) / 100;

  function removePagoLine(id) {
    setPagos((p) => p.filter((l) => l.id !== id));
  }

  async function resolverCliente() {
    if (modoCliente === "buscar") {
      // Cliente vacío = visita sin cita previa (la tarjeta lo indica: "Dejar vacío para clientes sin cita previa")
      if (!clienteSeleccionado) return { clienteId: null, clienta: nombreLibre.trim() || "Sin cita previa" };
      return { clienteId: clienteSeleccionado.id, clienta: clienteSeleccionado.nombre };
    }
    if (modoCliente === "nuevo") {
      if (!nuevoNombre.trim()) {
        onReject("Indica el nombre del cliente.");
        return null;
      }
      if (!nuevoTelefono.trim()) {
        onReject("El teléfono del cliente es obligatorio.");
        return null;
      }
      const mismo = clientes.find((c) => claveTelefono(c.telefono) && claveTelefono(c.telefono) === claveTelefono(nuevoTelefono));
      if (mismo) {
        onReject(`Ya existe un cliente con ese teléfono: ${mismo.nombre}. Toca su nombre en «¿Ya existe?» para usarlo.`);
        return null;
      }
      const nuevoId = await onCreateCliente({ nombre: nuevoNombre.trim(), telefono: nuevoTelefono.trim(), email: nuevoEmail.trim() });
      return { clienteId: nuevoId, clienta: nuevoNombre.trim() };
    }
    return { clienteId: null, clienta: nombreLibre.trim() || "Sin cita previa" };
  }

  async function construirPayload() {
    if (!servicio) { onReject("Selecciona un servicio."); return null; }
    if (!fecha) { onReject("Selecciona una fecha."); return null; }

    const citasMismoDia = appointments.filter((a) => a.fecha === fecha && a.id !== citaExistente?.id);

    // Se permite solapar citas (misma empleada y mismo hueco): ya no se bloquea.
    // El aviso se muestra en la propia ficha antes de guardar.
    const cabinaId = elegirCabina(servicio, cabins, citasMismoDia, inicio, duracion, citaExistente?.cabinaId);
    if (!cabinaId) { onReject("❌ No hay ninguna cabina activa."); return null; }

    const datosCliente = await resolverCliente();
    if (!datosCliente) return null;

    return {
      fecha,
      empleadaId,
      servicioId,
      serviciosExtra,
      cabinaId,
      clienteId: datosCliente.clienteId,
      clienta: datosCliente.clienta,
      inicio,
      duracion,
      precioManual: precioManualActivo ? Number(precioManualValor) || 0 : null,
      pagos: pagos
        .filter((l) => l.metodoId && l.importe !== "")
        .map((l) => ({ id: l.id, metodoId: l.metodoId, importe: Number(l.importe) || 0, recibido: l.recibido !== "" ? Number(l.recibido) : undefined, ...(l.bonoVendidoId ? { bonoVendidoId: l.bonoVendidoId } : {}) })),
      productos: productosLineas.filter((l) => l.productoId && l.cantidad > 0),
      estadoCobro: citaExistente?.estadoCobro || "pendiente",
      // al corregir el servicio de una cita dudosa de GHL, se quita la marca «Revisa el servicio»
      notas: (citaExistente && servicioId !== citaExistente.servicioId ? quitarMarcaRevisar(notas) : notas.trim()) || null,
      asistencia,
      fijarNotaEnCliente: fijarNota && notas.trim() ? notas.trim() : null,
    };
  }

  async function handleGuardar() {
    setGuardando(true);
    try {
      const payload = await construirPayload();
      if (payload) onSave(payload);
    } finally {
      setGuardando(false);
    }
  }

  async function handleCobrar() {
    setGuardando(true);
    try {
      if (asistencia !== "prevista") {
        onReject("No se puede cobrar una cita marcada como «No asistió» o «Cancelada».");
        return;
      }
      const payload = await construirPayload();
      if (!payload) return;
      if (Math.abs(diferencia) > 0.01) {
        onReject(diferencia > 0 ? `Faltan ${diferencia.toFixed(2)} € por cobrar.` : `Sobran ${Math.abs(diferencia).toFixed(2)} € en el pago.`);
        return;
      }
      onCobrar(payload);
    } finally {
      setGuardando(false);
    }
  }

  const empleadaCobro = citaExistente?.cobradaPor ? employees.find((e) => e.id === citaExistente.cobradaPor) : null;

  const filaEstilo = {
    display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left",
    background: "var(--field-bg)", border: "1px solid var(--line)", borderRadius: 4, padding: "12px 14px", marginBottom: 8,
  };
  const iconoCirculo = {
    width: 36, height: 36, borderRadius: "50%", background: "rgba(var(--accent-rgb),0.12)",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  };

  // ---------------------------------------------------------------------
  // Vista: Seleccionar cliente
  // ---------------------------------------------------------------------
  const textoAyudaTeclas = "↑ ↓ para moverte · Intro para elegir · Esc para volver";
  const filaResaltada = (activa) => ({
    ...filaEstilo,
    background: activa ? "rgba(var(--accent-rgb),0.12)" : "var(--field-bg)",
    borderColor: activa ? "var(--accent)" : "var(--line)",
  });
  const verEnLista = (activa) => (el) => {
    if (el && activa && el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
  };

  if (vista === "clientes") {
    const listaClientes = buscarClientes(clientes, busqueda); // por nombre (sin acentos) o por parte del teléfono
    const visibles = listaClientes.slice(0, 200);
    const elegirCli = (c) => {
      setClienteSeleccionado(c);
      setModoCliente("buscar");
      setVista("principal");
    };

    return (
      <ModalShell title="Seleccionar cliente" onClose={() => setVista("principal")}>
        <div style={{ position: "relative", marginBottom: 6 }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: 15, color: "rgba(var(--ink-rgb),0.68)" }} aria-hidden="true" />
          <input
            autoFocus
            className="input" style={{ paddingLeft: 34 }}
            aria-label="Buscar cliente"
            placeholder="Escribe un nombre o parte del teléfono…"
            value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setResalteCliente(0); }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setResalteCliente((i) => Math.min(i + 1, visibles.length - 1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setResalteCliente((i) => Math.max(i - 1, 0)); }
              else if (e.key === "Enter" && visibles[resalteCliente]) { e.preventDefault(); elegirCli(visibles[resalteCliente]); }
            }}
          />
        </div>
        <div style={{ fontSize: 12, color: "rgba(var(--ink-rgb),0.68)", marginBottom: 10 }}>{textoAyudaTeclas}</div>

        <button
          type="button" style={filaEstilo}
          onClick={() => {
            const t = busqueda.trim();
            if (t) { if (/[a-zA-Z\u00C0-\u017F]/.test(t)) setNuevoNombre(t); else setNuevoTelefono(t); } // lo que ya escribió pasa al formulario
            setModoCliente("nuevo"); setClienteSeleccionado(null); setVista("principal");
          }}
        >
          <div style={iconoCirculo}><UserPlus size={17} color="var(--accent)" /></div>
          <span style={{ fontWeight: 500, fontSize: 14 }}>Añadir un nuevo cliente</span>
        </button>

        <button
          type="button" style={filaEstilo}
          onClick={() => { setModoCliente("ninguno"); setClienteSeleccionado(null); setNombreLibre(""); setVista("principal"); }}
        >
          <div style={iconoCirculo}><Footprints size={17} color="var(--accent)" /></div>
          <span style={{ fontWeight: 500, fontSize: 14 }}>Sin cita previa</span>
        </button>

        <div style={{ borderTop: "1px solid var(--line)", margin: "12px 0" }} />

        <div role="listbox" aria-label="Clientes" style={{ maxHeight: "min(44vh, 360px)", overflowY: "auto", paddingRight: 4 }}>
          {listaClientes.length === 0 && (
            <div style={{ textAlign: "center", color: "rgba(var(--ink-rgb),0.68)", fontSize: 13, padding: 16 }}>Sin clientes que coincidan.</div>
          )}

          {visibles.map((c, i) => (
            <button
              key={c.id} type="button" role="option" aria-selected={i === resalteCliente}
              ref={verEnLista(i === resalteCliente)}
              style={filaResaltada(i === resalteCliente)}
              onMouseEnter={() => setResalteCliente(i)}
              onClick={() => elegirCli(c)}
            >
              <div style={{ ...iconoCirculo, background: "var(--accent)", color: "#fff", fontFamily: "'Outfit', sans-serif", fontSize: 15 }}>
                {c.nombre[0]?.toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                  {c.favorito && <Heart size={11} style={{ fill: "var(--accent)", stroke: "var(--accent)" }} />}
                  {c.nombre}
                  {c.notaFija && <Pin size={12} style={{ color: "var(--accent-text)" }} aria-label="Tiene nota fija" />}
                </div>
                <div style={{ fontSize: 12, color: "rgba(var(--ink-rgb),0.68)" }}>{c.telefono}</div>
              </div>
            </button>
          ))}

          {listaClientes.length > visibles.length && (
            <div style={{ textAlign: "center", color: "rgba(var(--ink-rgb),0.68)", fontSize: 12.5, padding: 10 }}>
              Mostrando {visibles.length} de {listaClientes.length}. Escribe para afinar la búsqueda.
            </div>
          )}
        </div>
      </ModalShell>
    );
  }

  // ---------------------------------------------------------------------
  // Vista: Seleccionar servicio
  // ---------------------------------------------------------------------
  if (vista === "servicios") {
    const disponibles = services.filter((sv) => sv.activo && (!empleadaId || sv.empleadas.includes(empleadaId)));
    return (
      <SelectorServicios
        ui={{ ModalShell }} servicios={disponibles} anadidos={[servicioId, ...serviciosExtra].filter(Boolean)} hayEmpleada={Boolean(empleadaId)}
        onElegir={elegirServicio} onClose={() => setVista("principal")}
      />
    );
  }

  // ---------------------------------------------------------------------
  // Vista: Cobrar (carrito + métodos de pago)
  // ---------------------------------------------------------------------
  // Bonos del cliente que se pueden usar en esta cita
  const aplicables = bonosAplicables({
    bonosVendidos, usos: bonoUsos, clienteId: clienteVivo?.id || citaExistente?.clienteId || "",
    principal: services.find((x) => x.id === servicioId), extras: serviciosExtra.map((id) => services.find((x) => x.id === id)).filter(Boolean),
    hoy: todayISO(), yaAplicados: pagos.filter((l) => l.bonoVendidoId).map((l) => l.bonoVendidoId),
  });
  // Lo que este cliente debe aún de bonos pagados a plazos: se ve en grande bajo su nombre y se puede cobrar (parte o todo)
  const clienteDeudaId = clienteVivo?.id || citaExistente?.clienteId || "";
  const deudas = deudasDeCliente(ventas, clienteDeudaId);
  const eurosTxt = (n) => `${(Math.round(n * 100) / 100).toLocaleString("es-ES", { maximumFractionDigits: 2 })} €`;
  const bloqueDeuda = deudas.length > 0 ? (
    <div data-deuda-cliente="1" style={{ marginTop: 8 }}>
      {deudas.map(({ venta, deuda }) => (
        <div key={venta.id} data-deuda-venta={venta.id} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: "#D92D20", background: "rgba(217,45,32,0.10)", padding: "4px 12px", borderRadius: 10, lineHeight: 1.2 }}>Debe {eurosTxt(deuda)} aún</span>
          <span style={{ fontSize: 12.5, color: "rgba(var(--ink-rgb),0.74)" }}>{(venta.bonos || []).map((l) => l.nombre).join(", ")} · pagado {eurosTxt(venta.total - deuda)} de {eurosTxt(venta.total)}</span>
          <button type="button" className="btn btn-gold" style={{ minHeight: 34, padding: "4px 14px", fontSize: 13.5 }} onClick={() => setPlazoVenta(venta)} aria-label={`Cobrar plazo de ${eurosTxt(deuda)}`}>Cobrar plazo</button>
        </div>
      ))}
    </div>
  ) : null;
  // Progreso de los bonos del cliente: cuántas sesiones lleva y qué número sería (o es) la de esta cita
  const aplicablesTodos = bonosAplicables({
    bonosVendidos, usos: bonoUsos, clienteId: clienteDeudaId,
    principal: services.find((x) => x.id === servicioId), extras: serviciosExtra.map((id) => services.find((x) => x.id === id)).filter(Boolean),
    hoy: todayISO(),
  });
  const sesionesDelCliente = clienteDeudaId
    ? bonosVendidos
        .filter((bv) => bv.clienteId === clienteDeudaId)
        .map((bv) => {
          const sal = saldoBono(bv, bonoUsos);
          const usosBono = bonoUsos.filter((u) => u.bonoVendidoId === bv.id).sort((a, b) => String(a.fecha || "").localeCompare(String(b.fecha || "")));
          const idx = citaExistente ? usosBono.findIndex((u) => u.citaId === citaExistente.id) : -1;
          const aplicandoAhora = pagos.some((l) => l.bonoVendidoId === bv.id);
          const aplicable = aplicablesTodos.some((a) => a.bono.id === bv.id);
          const esta = idx >= 0 ? { n: idx + 1, hecha: true } : aplicandoAhora || aplicable ? { n: sal.usadas + 1, hecha: false } : null;
          return { bv, sal, esta, estado: estadoBono(bv, bonoUsos, todayISO()) };
        })
        .filter((x) => x.estado === "activo" || x.esta?.hecha)
    : [];
  const bloqueSesiones = sesionesDelCliente.length > 0 ? (
    <div data-sesiones-bono="1" style={{ marginTop: 10, display: "grid", gap: 10 }}>
      {sesionesDelCliente.map(({ bv, sal, esta }) => (
        <div key={bv.id} data-sesiones-de={bv.id} style={{ fontSize: 13.5 }}>
          <div><strong>{bv.nombre}</strong> · lleva <strong>{sal.usadas}</strong> de {sal.total} sesiones hechas{sal.restantes > 0 ? ` · quedan ${sal.restantes}` : ""}</div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", margin: "5px 0" }}>
            {Array.from({ length: sal.total }).map((_, i) => {
              const hecha = i < sal.usadas;
              const estaEs = esta && i === esta.n - 1;
              return <span key={i} data-sesion-punto={estaEs ? "esta" : hecha ? "hecha" : "libre"} style={{ width: 16, height: 16, borderRadius: "50%", background: hecha ? "var(--accent)" : estaEs ? "rgba(21,112,239,0.18)" : "transparent", border: estaEs ? "3px solid var(--accent)" : hecha ? "1px solid var(--accent)" : "1px solid rgba(var(--ink-rgb),0.35)", boxSizing: "border-box" }} />;
            })}
          </div>
          {esta && <div data-esta-sesion="1" style={{ fontWeight: 700, color: "var(--accent-text)", fontSize: 14 }}>{esta.hecha ? `Esta cita: sesión ${esta.n} de ${sal.total} (ya descontada)` : `Esta cita sería la sesión ${esta.n} de ${sal.total}`}</div>}
        </div>
      ))}
    </div>
  ) : null;
  const pedido = citaExistente ? pedidoOriginal(citaExistente.notas) : "";
  const avisoRevisar = citaExistente && (citaExistente.notas || "").includes(MARCA_REVISAR) ? (
    <div data-aviso-revisar="1" role="alert" style={{ background: "rgba(245,158,11,0.16)", border: "1px solid #F59E0B", borderRadius: 12, padding: "10px 14px", marginBottom: 14, fontSize: 13.5, color: "var(--text)" }}>
      <strong>⚠ Revisa el servicio.</strong> Esta cita llegó de GHL{pedido ? <> (pedía «{pedido}»)</> : null} y no coincide con ningún servicio de la agenda, así que se ha puesto uno por defecto
      (con su precio y duración). Elige el servicio correcto y guarda; si falta, créalo en <em>Servicios</em>.
    </div>
  ) : null;
  const plazoModal = plazoVenta ? (
    <PlazoModal
      ui={{ ModalShell, Field }} nivel={1} venta={plazoVenta} nombreBono={(plazoVenta.bonos || []).map((l) => l.nombre).join(", ")}
      cliente={clienteVivo || clientes.find((c) => c.id === clienteDeudaId)} metodosPago={metodosPago}
      onClose={() => setPlazoVenta(null)}
      onConfirmar={async (venta, pagos) => { const r = await onCobrarPlazo(venta, pagos); if (r?.ok) setPlazoVenta(null); return r; }}
    />
  ) : null;

  if (vista === "cobro") {
    const clienteObjetivo = citaExistente?.clienteId ? clientes.find((c) => c.id === citaExistente.clienteId) : null;
    const esPrimeraVisita = clienteObjetivo
      ? !appointments.some((a) => a.clienteId === clienteObjetivo.id && a.id !== citaExistente?.id)
      : false;
    const serviciosCarrito = [servicio, ...serviciosExtraObjs].filter(Boolean);

    return (
      <ModalShell
        pagina ancho={820}
        title="Añadir al carrito"
        onClose={() => { setVista("principal"); setMostrarPago(false); setVistaPago("metodos"); setMetodoAbierto(null); setMostrarSelectorDividir(false); }}
      >
        <div className="card" style={{ padding: 16, marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>{citaExistente?.clienta || clienteVivo?.nombre || nombreLibre || "Venta sin cita"}</div>
              {clienteObjetivo?.telefono && <div style={{ fontSize: 13, color: "rgba(var(--ink-rgb),0.68)" }}>{clienteObjetivo.telefono}</div>}
              {bloqueDeuda}
              {bloqueSesiones}
              {plazoModal}
            </div>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(var(--accent-rgb),0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Outfit', sans-serif", color: "var(--accent-text)", flexShrink: 0 }}>
              {citaExistente?.clienta[0]?.toUpperCase()}
            </div>
          </div>
          {(esPrimeraVisita || servicio?.categoria) && (
            <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
              {esPrimeraVisita && (
                <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 20, background: "#3B5BA0", color: "#fff" }}>PRIMERA VISITA</span>
              )}
              {servicio?.categoria && (
                <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 20, background: "var(--accent)", color: "#fff" }}>{servicio.categoria.toUpperCase()}</span>
              )}
            </div>
          )}
        </div>

        {serviciosCarrito.map((s) => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
            <span style={{ width: 3, alignSelf: "stretch", borderRadius: 2, background: s.color || "var(--accent)", flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, fontSize: 14.5 }}>{s.nombre}</div>
              <div style={{ fontSize: 12, color: "rgba(var(--ink-rgb),0.68)" }}>{s.duracion} min · {empleada?.nombre}</div>
            </div>
            <span style={{ fontWeight: 500, fontSize: 14.5 }}>{s.precio} €</span>
          </div>
        ))}

        {productosSeleccionados.filter((l) => l.producto).map((l) => (
          <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
            <span style={{ width: 3, alignSelf: "stretch", borderRadius: 2, background: "var(--accent)", flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, fontSize: 14.5 }}>{l.producto.nombre} × {l.cantidad}</div>
              <div style={{ fontSize: 12, color: "rgba(var(--ink-rgb),0.68)" }}>Producto</div>
            </div>
            <span style={{ fontWeight: 500, fontSize: 14.5 }}>{(l.producto.precio * l.cantidad).toFixed(2)} €</span>
          </div>
        ))}

        <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 0 6px", fontSize: 14 }}>
          <span style={{ color: "rgba(var(--ink-rgb),0.68)" }}>Total</span>
          <span>{totalCita.toFixed(2)} €</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 16, fontSize: 15, fontWeight: 600 }}>
          <span>A pagar</span>
          <span>{totalCita.toFixed(2)} €</span>
        </div>

        {!mostrarPago ? (
          <button
            type="button" className="btn btn-gold" style={{ width: "100%", justifyContent: "center", padding: "13px 0" }}
            onClick={() => setMostrarPago(true)}
          >
            Continuar con el pago
          </button>
        ) : (
          <div>
            {metodoAbierto ? (
              <TecladoImporte
                metodo={metodoAbierto}
                pendiente={Math.max(diferencia, 0)}
                nombreQuienCobra={currentUser.nombre}
                onClose={() => setMetodoAbierto(null)}
                onConfirmar={(monto) => {
                  const aplicado = Math.round(Math.min(monto, Math.max(diferencia, 0)) * 100) / 100;
                  setPagos((prev) => [
                    ...prev,
                    { id: uid(), metodoId: metodoAbierto.id, importe: String(aplicado), recibido: metodoAbierto.id === "efectivo" ? String(monto) : "" },
                  ]);
                  setMetodoAbierto(null);
                  setMostrarSelectorDividir(false);
                }}
              />
            ) : vistaPago === "dividir" ? (
              <div>
                <button type="button" onClick={() => setVistaPago("metodos")} style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", fontSize: 13, marginBottom: 14, padding: 0 }}>
                  <ChevronLeft size={15} /> Dividir pago
                </button>

                {pagos.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    {pagos.map((linea) => {
                      const m = metodosPago.find((x) => x.id === linea.metodoId);
                      return (
                        <div key={linea.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13.5, padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
                          <span>{m?.nombre || (linea.metodoId === METODO_BONO ? "Bono (1 sesión)" : linea.metodoId)}</span>
                          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {Number(linea.importe).toFixed(2)} €
                            <button type="button" onClick={() => removePagoLine(linea.id)} style={{ background: "transparent", border: "none" }}><X size={13} /></button>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {diferencia > 0.005 && (
                  <button type="button" className="btn btn-ghost" style={{ width: "100%", justifyContent: "center" }} onClick={() => setMostrarSelectorDividir(true)}>
                    <Plus size={14} /> Añadir método de pago
                  </button>
                )}

                {mostrarSelectorDividir && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>Seleccionar pago</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 10 }}>
                      {metodosPago.filter((m) => m.activo).map((m) => {
                        const Icono = iconoMetodo(m);
                        return (
                          <button key={m.id} type="button" className="card" style={{ padding: "18px 8px", textAlign: "center", border: "1px solid var(--line)" }} onClick={() => setMetodoAbierto(m)}>
                            <Icono size={20} style={{ marginBottom: 6, color: "var(--accent-text)" }} />
                            <div style={{ fontSize: 12.5 }}>{m.nombre}</div>
                          </button>
                        );
                      })}
                    </div>
                    <button type="button" className="btn btn-ghost" style={{ width: "100%", justifyContent: "center" }} onClick={() => setMostrarSelectorDividir(false)}>
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
              {aplicables.length > 0 && diferencia > 0.005 && (
                <div data-bonos-cliente="1" style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 8 }}>Bonos de este cliente</div>
                  {aplicables.map(({ bono, restantes, valor }) => (
                    <button
                      key={bono.id} type="button" className="card" data-usar-bono={bono.id}
                      style={{ width: "100%", padding: "12px 14px", textAlign: "left", border: "1px solid var(--accent)", marginBottom: 8, cursor: "pointer" }}
                      onClick={() => setPagos((prev) => [...prev, { id: uid(), metodoId: METODO_BONO, bonoVendidoId: bono.id, importe: String(Math.min(valor, Math.max(diferencia, 0))), recibido: "" }])}
                    >
                      <strong>Usar 1 sesión de «{bono.nombre}»</strong>
                      <div style={{ fontSize: 12.5, color: "rgba(var(--ink-rgb),0.7)" }}>
                        Quedan {restantes} de {bono.sesionesTotal} · cubre {Math.min(valor, Math.max(diferencia, 0)).toFixed(2)} €{bono.caduca ? ` · caduca ${bono.caduca}` : ""}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 4 }}>
                {metodosPago.filter((m) => m.activo).map((m) => {
                  const Icono = iconoMetodo(m);
                  return (
                    <button
                      key={m.id} type="button" className="card" style={{ padding: "20px 8px", textAlign: "center", border: "1px solid var(--line)" }}
                      onClick={() => {
                        if (m.id === "efectivo") {
                          setMetodoAbierto(m);
                        } else {
                          const aplicado = Math.round(Math.max(diferencia, 0) * 100) / 100;
                          setPagos((prev) => [...prev, { id: uid(), metodoId: m.id, importe: String(aplicado), recibido: "" }]);
                        }
                      }}
                    >
                      <Icono size={22} style={{ marginBottom: 8, color: "var(--accent-text)" }} />
                      <div style={{ fontSize: 13 }}>{m.nombre}</div>
                    </button>
                  );
                })}
                <button type="button" className="card" style={{ padding: "20px 8px", textAlign: "center", border: "1px solid var(--line)" }} onClick={() => setVistaPago("dividir")}>
                  <SplitSquareHorizontal size={22} style={{ marginBottom: 8, color: "var(--accent-text)" }} />
                  <div style={{ fontSize: 13 }}>Dividir pago</div>
                </button>
              </div>
              </>
            )}

            {!metodoAbierto && pagos.length > 0 && (
              <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--line)" }}>
                {pagos.filter((l) => l.bonoVendidoId).map((l) => {
                  const bv = bonosVendidos.find((b) => b.id === l.bonoVendidoId);
                  return (
                    <div key={l.id} data-pago-bono={l.bonoVendidoId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13.5, marginBottom: 10 }}>
                      <span>Bono: 1 sesión de «{bv?.nombre || "bono"}»</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {Number(l.importe).toFixed(2)} €
                        <button type="button" aria-label="Quitar la sesión del bono" onClick={() => removePagoLine(l.id)} style={{ background: "transparent", border: "none" }}><X size={13} /></button>
                      </span>
                    </div>
                  );
                })}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 16 }}>
                  <span>Pagado: <strong>{totalPagado.toFixed(2)} €</strong></span>
                  <span style={{ color: diferencia > 0.005 ? "var(--danger)" : "rgba(var(--ink-rgb),0.6)" }}>
                    {diferencia > 0.005 ? `Pendiente: ${diferencia.toFixed(2)} €` : diferencia < -0.005 ? `Pagado de más: ${Math.abs(diferencia).toFixed(2)} €` : "Pagado completo"}
                  </span>
                </div>
                <button type="button" className="btn btn-gold" style={{ width: "100%", justifyContent: "center", padding: "13px 0" }} onClick={handleCobrar} disabled={guardando}>
                  Confirmar cobro
                </button>
              </div>
            )}
          </div>
        )}
      </ModalShell>
    );
  }

  // ---------------------------------------------------------------------
  // Vista: principal
  // ---------------------------------------------------------------------

  const nombreClienteResumen = clienteSeleccionado
    ? clienteSeleccionado.nombre
    : modoCliente === "nuevo" && nuevoNombre
    ? nuevoNombre
    : modoCliente === "ninguno"
    ? (nombreLibre || "Sin cita previa")
    : null;

  const serviciosElegidos = [servicio, ...serviciosExtraObjs].filter(Boolean);

  // Citas de la misma empleada, ese día, que se pisan con esta (aviso, no bloqueo)
  const solapes = fecha && empleadaId && duracion > 0
    ? appointments.filter((a) => a.fecha === fecha && a.id !== citaExistente?.id && a.empleadaId === empleadaId && (a.asistencia || "prevista") !== "cancelada" && overlaps(a.inicio, a.duracion, inicio, duracion))
    : [];

  const puedeAnular = puedeAnularCobros(currentUser);
  const hoyISO = formatLocalISO(new Date());
  const bloqueosPisados = fecha && empleadaId && duracion > 0
    ? bloqueos.filter((b) => b.fecha === fecha && b.empleadaId === empleadaId && overlaps(b.inicio, b.duracion, inicio, duracion))
    : [];
  const fueraDeAgenda = typeof inicio === "number" && (inicio < GRID_START || inicio >= GRID_END || (duracion > 0 && inicio + duracion > GRID_END));
  const resumenSel = clienteVivo ? resumenCliente(clienteVivo, appointments.filter((a) => a.clienteId === clienteVivo.id), services, hoyISO) : null;
  // Clientes parecidos mientras se escribe uno nuevo (para no duplicarlos)
  const parecidos = modoCliente === "nuevo"
    ? (() => {
        const vistos = new Map();
        if (nuevoTelefono.replace(/\D/g, "").length >= 3) buscarClientes(clientes, nuevoTelefono, 5).forEach((c) => vistos.set(c.id, c));
        if (nuevoNombre.trim().length >= 3) buscarClientes(clientes, nuevoNombre, 5).forEach((c) => vistos.set(c.id, c));
        return [...vistos.values()].slice(0, 5);
      })()
    : [];

  return (
    <>
    <ModalShell pagina ancho={1180} title={modo === "editar" ? "Editar cita" : "Nueva cita"} onClose={solicitarCierre}>
      {modo === "editar" && citaExistente && (
        <div data-confirmacion-cita="1" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          {!bloqueada && onConfirmacion ? (
            <div role="group" aria-label="Confirmación de asistencia" style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, color: "rgba(var(--ink-rgb),0.72)" }}>Confirmación:</span>
              <button type="button" data-confirmar="confirmada" aria-pressed={confirmacionViva === "confirmada"} className={confirmacionViva === "confirmada" ? "btn btn-gold" : "btn btn-ghost"} style={{ minHeight: 34, padding: "4px 12px" }} onClick={() => cambiarConfirmacion("confirmada")}><Hand size={14} aria-hidden="true" /> Confirmada</button>
              <button type="button" data-confirmar="no_contesta" aria-pressed={confirmacionViva === "no_contesta"} className={confirmacionViva === "no_contesta" ? "btn btn-gold" : "btn btn-ghost"} style={{ minHeight: 34, padding: "4px 12px" }} onClick={() => cambiarConfirmacion("no_contesta")}><PhoneOff size={14} aria-hidden="true" /> No cogió</button>
              {confirmacionViva !== "pendiente" && (
                <span data-confirmacion-texto="1" style={{ fontSize: 12.5, fontWeight: 600, color: confirmacionViva === "confirmada" ? "#166534" : "#92400E" }}>
                  {confirmacionViva === "confirmada" ? "Viene" : "No cogió la llamada"}{citaViva.confirmacionPor ? ` · ${citaViva.confirmacionPor}` : ""}
                </span>
              )}
            </div>
          ) : <span />}
          <MenuPuntos items={[
            ...(!bloqueada && onConfirmacion ? [
              { texto: "✋ Confirmada: viene", onClick: () => onConfirmacion(citaExistente, "confirmada") },
              { texto: "No cogió la llamada", onClick: () => onConfirmacion(citaExistente, "no_contesta") },
              ...(confirmacionViva !== "pendiente" ? [{ texto: "Quitar la confirmación", onClick: () => onConfirmacion(citaExistente, "pendiente") }] : []),
            ] : []),
            ...(onCopiarEnlace && !bloqueada && citaExistente.asistencia !== "cancelada" ? [{ texto: "🔗 Copiar enlace para cambiar o cancelar", onClick: () => onCopiarEnlace(citaExistente) }] : []),
            ...(esAdmin && onVerActividad ? [{ texto: "Ver actividad de esta reserva", onClick: () => onVerActividad({ titulo: `Actividad de la cita de ${citaExistente.clienta}`, filtros: [["entidad", "cita"], ["entidad_id", citaExistente.id]] }) }] : []),
          ]} />
        </div>
      )}
      {avisoRevisar}
      {bloqueada && (
        <div style={{ background: "rgba(var(--ink-rgb),0.06)", border: "1px solid var(--line)", borderRadius: 4, padding: "10px 12px", marginBottom: 16, fontSize: 12.5, display: "flex", alignItems: "center", gap: 8 }}>
          <DollarSign size={15} style={{ color: "var(--accent-text)" }} />
          Cobrada {citaExistente.cobradaEn ? `el ${new Date(citaExistente.cobradaEn).toLocaleString("es-ES")}` : ""}{empleadaCobro ? ` por ${empleadaCobro.nombre}` : ""}. Anula el cobro para poder modificarla.
        </div>
      )}

      <fieldset disabled={bloqueada} style={{ border: "none", padding: 0, margin: 0, minWidth: 0 }}>
        <div data-form-columnas="1" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 430px), 1fr))", gap: "0 36px", alignItems: "start" }}>
        <div data-columna="izquierda" style={{ minWidth: 0 }}>
        {/* Tarjeta Cliente */}
        <div style={{ ...filaEstilo, justifyContent: "space-between", cursor: "default" }}>
          {clienteSeleccionado && onVerPerfil ? (
            <div style={{ flex: 1, minWidth: 0 }}>
              <button type="button" className="link-btn" style={{ fontSize: 14 }} onClick={() => onVerPerfil(clienteSeleccionado.id)} title="Ver la ficha del cliente">
                {nombreClienteResumen}
              </button>
              <div style={{ fontSize: 12, color: "rgba(var(--ink-rgb),0.68)" }}>{clienteVivo.telefono} · toca el nombre para ver su ficha</div>
              {bloqueDeuda}
              {bloqueSesiones}
              {plazoModal}
              {resumenSel && (
                <div data-etiquetas-cliente="1" style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 5 }}>
                  {resumenSel.etiquetas.map((e, i) => <Etiqueta key={i} e={e} pequena />)}
                </div>
              )}
            </div>
          ) : (
            <button type="button" onClick={() => setVista("clientes")} style={{ flex: 1, minWidth: 0, textAlign: "left", background: "none", border: "none", padding: 0 }}>
              <div style={{ fontWeight: 500, fontSize: 14 }}>{nombreClienteResumen || "Añadir cliente"}</div>
              <div style={{ fontSize: 12, color: "rgba(var(--ink-rgb),0.68)" }}>
                {clienteVivo ? clienteVivo.telefono : "Dejar vacío para clientes sin cita previa"}
              </div>
            </button>
          )}
          <button
            type="button" onClick={() => setVista("clientes")} aria-label={clienteSeleccionado ? "Cambiar de cliente" : "Elegir cliente"} title={clienteSeleccionado ? "Cambiar de cliente" : "Elegir cliente"}
            style={{ ...iconoCirculo, border: "none" }}
          >
            <UserPlus size={17} color="var(--accent)" />
          </button>
        </div>

        {clienteVivo?.notaFija && (
          <div
            role="note"
            style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "10px 12px", marginBottom: 12, borderRadius: 12, fontSize: 13, background: "rgba(var(--accent-rgb),0.10)", border: "1px solid rgba(var(--accent-rgb),0.4)" }}
          >
            <Pin size={15} style={{ flexShrink: 0, marginTop: 2, color: "var(--accent-text)" }} aria-hidden="true" />
            <div><strong>Nota fija de {clienteVivo.nombre}:</strong> {clienteVivo.notaFija}</div>
          </div>
        )}

        {/* Lo último que se hizo esta clienta (cobrado): se sugiere repetirlo con un clic */}
        {clienteVivo && (() => {
          const u = ultimoServicioDe(clienteVivo.id, appointments.filter((a) => a.id !== citaExistente?.id), services, todayISO());
          if (!u) return null;
          const sv = u.servicio && u.servicio.activo !== false ? services.find((x) => x.id === u.servicio.id) : null;
          const incluido = Boolean(sv) && (servicioId === sv.id || serviciosExtra.includes(sv.id));
          const empleadaHace = !sv || !empleadaId || sv.empleadas.includes(empleadaId);
          const hace = u.dias === 0 ? "hoy" : u.dias === 1 ? "ayer" : u.dias < 60 ? `hace ${u.dias} días` : `hace ${Math.round(u.dias / 30)} meses`;
          return (
            <div data-ultimo-servicio="1" style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", padding: "10px 12px", marginBottom: 12, borderRadius: 12, fontSize: 13.5, background: "rgba(22,163,74,0.09)", border: "1px solid rgba(22,163,74,0.35)" }}>
              <div style={{ flex: "1 1 220px" }}>
                <strong>Último servicio:</strong> {u.servicio?.nombre || "un servicio que ya no existe"}
                {u.extras.length > 0 && <span> (+ {u.extras.map((x) => x.nombre).join(", ")})</span>}
                <span style={{ color: "rgba(var(--ink-rgb),0.7)" }}> · {hace} · {u.visitas} {u.visitas === 1 ? "visita" : "visitas"}</span>
              </div>
              {sv && incluido && <span data-ultimo-incluido="1" style={{ fontWeight: 600, color: "#166534" }}>✓ Ya incluido en esta cita</span>}
              {sv && !incluido && empleadaHace && <button type="button" className="btn btn-ghost" data-repetir-servicio="1" style={{ minHeight: 34 }} onClick={() => elegirServicio(sv)}>{servicioId ? "Añadir también este servicio" : "Repetir este servicio"}</button>}
              {sv && !incluido && !empleadaHace && <span data-ultimo-no-disponible="1" style={{ fontSize: 12.5, color: "#92400E" }}>La empleada elegida no hace este servicio</span>}
            </div>
          );
        })()}

        {modoCliente === "nuevo" && !clienteSeleccionado && (
          <div className="card" style={{ padding: 14, marginBottom: 8, display: "flex", flexDirection: "column", gap: 8 }}>
            <input className="input" placeholder="Nombre del cliente" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} />
            <input className="input" placeholder="Teléfono (obligatorio)" value={nuevoTelefono} onChange={(e) => setNuevoTelefono(e.target.value)} />
            <input className="input" placeholder="Email (opcional)" value={nuevoEmail} onChange={(e) => setNuevoEmail(e.target.value)} />
            {parecidos.length > 0 && (
              <div role="region" aria-label="Clientes parecidos" style={{ borderTop: "1px solid var(--line)", paddingTop: 8 }}>
                <div style={{ fontSize: 12.5, color: "rgba(var(--ink-rgb),0.74)", marginBottom: 6 }}>¿Ya existe? Toca para usar ese cliente:</div>
                {parecidos.map((c) => (
                  <button key={c.id} type="button" onClick={() => { setClienteSeleccionado(c); setModoCliente("buscar"); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "7px 10px", marginBottom: 4, borderRadius: 8, border: "1px solid var(--line)", background: "transparent", cursor: "pointer", fontSize: 13.5 }}>
                    <strong>{c.nombre}</strong> · {c.telefono}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tarjeta Fecha / Hora / Empleada */}
        <div className="card" style={{ padding: "4px 14px", marginBottom: 12 }}>
          <div style={{ position: "relative" }}>
            <button
              type="button" onClick={() => setShowCalPop((v) => !v)}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", background: "transparent", border: "none", padding: "11px 0", textAlign: "left" }}
            >
              <CalendarDays size={16} style={{ color: "var(--accent-text)", flexShrink: 0 }} />
              <span style={{ fontSize: 14 }}>{fechaLabel(fecha)}</span>
            </button>
            {showCalPop && (
              <MonthCalendarPopover selectedDate={fecha} onSelect={setFecha} onClose={() => setShowCalPop(false)} />
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 0 10px 26px", fontSize: 12.5, color: "rgba(var(--ink-rgb),0.68)" }}>
              <label htmlFor="fecha-escrita">o escribe la fecha:</label>
              <CampoFecha id="fecha-escrita" valor={fecha} onChange={setFecha} etiqueta="Escribir la fecha" estilo={{ maxWidth: 170, padding: "4px 8px" }} />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 0", borderTop: "1px solid var(--line)" }}>
            <Clock size={16} style={{ color: "var(--accent-text)", flexShrink: 0 }} />
            <CampoHora valor={inicio} onChange={setInicio} etiqueta="Hora de inicio" estilo={{ border: "none", padding: 0, background: "transparent", fontSize: 14 }} />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 0", borderTop: "1px solid var(--line)" }}>
            <Users size={16} style={{ color: "var(--accent-text)", flexShrink: 0 }} />
            <select
              className="input" style={{ border: "none", padding: 0, background: "transparent", fontSize: 14 }}
              value={empleadaId}
              onChange={(e) => { setEmpleadaId(e.target.value); setServicioId(""); setServiciosExtra([]); }}
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {fueraDeAgenda && (
          <div role="alert" style={{ fontSize: 12.5, color: "var(--danger)", margin: "0 0 10px" }}>
            ⚠ La cita terminaría pasada la medianoche: no se vería completa en el calendario.
          </div>
        )}
        {bloqueosPisados.length > 0 && (
          <div role="alert" data-aviso-no-disponible="1" style={{ fontSize: 12.5, color: "#B45309", margin: "0 0 10px" }}>
            ⚠ Cae en un horario marcado como no disponible ({bloqueosPisados.map((b) => `${minToLabel(b.inicio)}–${minToLabel(b.inicio + b.duracion)}${b.motivo ? `: ${b.motivo}` : ""}`).join(", ")}). Puedes guardarla igualmente.
          </div>
        )}
        {solapes.length > 0 && (
          <div
            role="status"
            style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "10px 12px", marginBottom: 14, borderRadius: 12, fontSize: 13, background: "rgba(245,158,11,0.14)", border: "1px solid rgba(217,119,6,0.55)" }}
          >
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1, color: "#B45309" }} aria-hidden="true" />
            <span>
              Se solapa con {solapes.map((a) => `${a.clienta} (${minToLabel(a.inicio)}–${minToLabel(a.inicio + a.duracion)})`).join(", ")}. Puedes guardarla igualmente.
            </span>
          </div>
        )}

        </div>
        <div data-columna="derecha" style={{ minWidth: 0 }}>
        {/* Tarjeta Servicios */}
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>Servicios</div>

        {serviciosElegidos.length === 0 ? (
          <div className="card" style={{ padding: "30px 20px", textAlign: "center", marginBottom: 12 }}>
            <Tag size={26} style={{ color: "var(--accent-text)", marginBottom: 10 }} />
            <div style={{ fontSize: 13, color: "rgba(var(--ink-rgb),0.68)", marginBottom: 16 }}>Añadir un servicio para guardar la cita</div>
            <button type="button" className="btn btn-ghost" onClick={() => setVista("servicios")}>
              <Plus size={14} /> Añadir servicio
            </button>
          </div>
        ) : (
          <div className="card" style={{ padding: 14, marginBottom: 12 }}>
            {serviciosElegidos.map((s) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color || "var(--accent)", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>{s.nombre}</div>
                  <div style={{ fontSize: 12.5, color: "rgba(var(--ink-rgb),0.68)" }}>{s.duracion} min</div>
                </div>
                <span style={{ fontSize: 13.5, fontWeight: 500 }}>{s.precio} €</span>
                <button type="button" onClick={() => quitarServicio(s.id)} style={{ background: "transparent", border: "none" }}><X size={14} /></button>
              </div>
            ))}
            <button type="button" className="btn btn-ghost" style={{ fontSize: 12.5, marginTop: 10 }} onClick={() => setVista("servicios")}>
              <Plus size={13} /> Añadir otro servicio
            </button>
          </div>
        )}

        {servicio && (
          <>
            <div className="grid-2">
              <Field label="Duración (min)">
                <input
                  className="input" type="number" value={duracion}
                  onChange={(e) => { setDuracion(Number(e.target.value)); setDuracionTocada(true); }}
                />
                {duracionTocada && duracion !== duracionCalculada && (
                  <button type="button" onClick={() => { setDuracion(duracionCalculada); setDuracionTocada(false); }} style={{ fontSize: 12.5, color: "var(--accent-text)", background: "transparent", border: "none", marginTop: 4, padding: 0 }}>
                    Restablecer a {duracionCalculada} min
                  </button>
                )}
              </Field>
              <Field label="Precio de la cita">
                {precioManualActivo ? (
                  <input className="input" type="number" value={precioManualValor} onChange={(e) => setPrecioManualValor(e.target.value)} />
                ) : (
                  <div className="input" style={{ background: "rgba(var(--ink-rgb),0.04)", display: "flex", alignItems: "center" }}>{precioCalculado.toFixed(2)} €</div>
                )}
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, marginTop: 6, color: "rgba(var(--ink-rgb),0.68)" }}>
                  <input
                    type="checkbox" checked={precioManualActivo}
                    onChange={(e) => { setPrecioManualActivo(e.target.checked); if (e.target.checked) setPrecioManualValor(String(precioCalculado)); }}
                  />
                  Fijar precio manualmente
                </label>
              </Field>
            </div>

            <Field label="Productos en tienda">
              {productosSeleccionados.map((linea) => (
                <div key={linea.id} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                  <SelectorBuscable
                    ariaLabel="Producto" style={{ flex: "2 1 140px" }} placeholder="Busca un producto…" valor={linea.productoId}
                    opciones={productos.filter((p) => p.activo && (p.stock > 0 || p.id === linea.productoId)).map((p) => ({ id: p.id, etiqueta: p.nombre, detalle: `${p.precio} € · stock ${p.stock}` }))}
                    onChange={(id) => updateProductoLinea(linea.id, { productoId: id })}
                  />
                  <input className="input" style={{ flex: "0 1 70px" }} type="number" min={1} value={linea.cantidad} onChange={(e) => updateProductoLinea(linea.id, { cantidad: Number(e.target.value) || 1 })} />
                  <button type="button" onClick={() => removeProductoLinea(linea.id)} style={{ background: "transparent", border: "none" }}><X size={14} /></button>
                </div>
              ))}
              <button type="button" className="btn btn-ghost" style={{ fontSize: 12.5 }} onClick={addProductoLinea}>
                <Plus size={13} /> Añadir producto
              </button>
            </Field>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, padding: "10px 0", borderTop: "1px solid var(--line)" }}>
              <span>Total de la cita</span>
              <strong>{totalCita.toFixed(2)} €</strong>
            </div>
            {modo === "editar" && !bloqueada && (
              <div style={{ fontSize: 12.5, color: "rgba(var(--ink-rgb),0.68)", marginBottom: 4 }}>
                El pago se registra al pulsar "Cobrar", abajo.
              </div>
            )}
          </>
        )}

        <div style={{ marginTop: 14 }}>
          <label className="field-label" htmlFor="nota-cita" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <StickyNote size={14} aria-hidden="true" /> Nota interna (solo para el equipo)
          </label>
          <textarea
            id="nota-cita" className="input" rows={2} style={{ resize: "vertical", minHeight: 64 }}
            placeholder="Ej.: alérgica al látex, prefiere a Silvia, viene con su hija…"
            value={notas} onChange={(e) => setNotas(e.target.value)}
          />
          {(clienteSeleccionado || modoCliente === "nuevo") && notas.trim() && (
            <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, marginTop: 8 }}>
              <input type="checkbox" checked={fijarNota} onChange={(e) => setFijarNota(e.target.checked)} style={{ marginTop: 3 }} />
              <span>
                <strong>Fijar en el cliente:</strong> la nota aparecerá siempre que reserve. Si no la marcas, se guarda solo en esta cita y la verás en la ficha del cliente.
              </span>
            </label>
          )}
        </div>

        {modo === "editar" && !bloqueada && (
          <div style={{ marginTop: 14 }}>
            <div className="field-label">Asistencia</div>
            <div role="radiogroup" aria-label="Asistencia" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[["prevista", "Asiste / asistió"], ["no_asistio", "No asistió"], ["cancelada", "Cancelada"]].map(([valor, texto]) => (
                <button
                  key={valor} type="button" role="radio" aria-checked={asistencia === valor}
                  className={`chip ${asistencia === valor ? "on" : ""}`} onClick={() => setAsistencia(valor)}
                >
                  {texto}
                </button>
              ))}
            </div>
            {asistencia !== "prevista" && (
              <div style={{ fontSize: 12.5, color: "rgba(var(--ink-rgb),0.74)", marginTop: 6 }}>
                {asistencia === "no_asistio" ? "Se queda en la agenda marcada en rojo y cuenta como inasistencia en los informes." : "Se queda en la agenda atenuada y no cuenta como ocupación."} No se podrá cobrar.
              </div>
            )}
          </div>
        )}
        </div>
        </div>
      </fieldset>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 18, flexWrap: "wrap" }}>
        {modo === "editar" ? (
          <button type="button" className="btn btn-ghost" style={{ color: "var(--danger)", borderColor: "var(--danger)" }} onClick={onDelete} disabled={bloqueada} title={bloqueada ? "Anula el cobro antes de eliminar" : ""}>
            <Trash2 size={14} /> Eliminar
          </button>
        ) : <span />}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="btn btn-ghost" onClick={solicitarCierre}>Cancelar</button>
          {bloqueada ? (
            puedeAnular ? (
              <button type="button" className="btn" style={{ background: "#7A2E24", borderColor: "#7A2E24", color: "#fff" }} onClick={onAnularCobro} disabled={guardando}>
              Anular cobro
            </button>) : (
              <span role="note" style={{ fontSize: 12.5, color: "rgba(var(--ink-rgb),0.74)", alignSelf: "center", maxWidth: 260 }}>
                Solo el administrador o una encargada puede anular este cobro.
              </span>
            )
          ) : (
            <>
              {modo === "editar" && onReprogramar && citaExistente && !bloqueada && citaExistente.asistencia !== "cancelada" && (
                <button type="button" className="btn btn-ghost" data-reprogramar="1" onClick={reprogramar} disabled={guardando}>
                  <CalendarClock size={14} /> Reprogramar
                </button>
              )}
              {modo === "editar" && (
                <button type="button" className="btn btn-ghost" onClick={() => setVista("cobro")} disabled={guardando || !servicio}>
                  <DollarSign size={14} /> Cobrar
                </button>
              )}
              <button type="button" className="btn btn-gold" onClick={handleGuardar} disabled={guardando || !servicio}>
                {modo === "editar" ? "Guardar cambios" : "Guardar"}
              </button>
            </>
          )}
        </div>
      </div>
    </ModalShell>

    {confirmarReprogramar && (
      <ConfirmDialog
        titulo="¿Reprogramar sin guardar?"
        mensaje="Has cambiado la cita y todavía no la has guardado. Si la reprogramas ahora, se perderán esos cambios."
        textoCancelar="Seguir editando"
        textoConfirmar="Reprogramar sin guardar"
        peligroso
        onCancelar={() => setConfirmarReprogramar(false)}
        onConfirmar={() => { setConfirmarReprogramar(false); onReprogramar(citaExistente); }}
      />
    )}
    {confirmarCierre && (
      <ConfirmDialog
        titulo={modo === "editar" ? "¿Salir sin guardar?" : "¿Cancelar esta cita?"}
        mensaje={modo === "editar"
          ? "Has cambiado la cita y todavía no la has guardado. Si sales ahora, se perderán esos cambios."
          : "Has empezado a rellenar una cita nueva y no se ha guardado. Si sales ahora, se perderá lo que has puesto."}
        textoCancelar="Seguir editando"
        textoConfirmar={modo === "editar" ? "Salir sin guardar" : "Descartar cita"}
        peligroso
        onCancelar={() => setConfirmarCierre(false)}
        onConfirmar={onClose}
      />
    )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Empleadas
// ---------------------------------------------------------------------------

// Turnos de UNA empleada durante un mes (según su horario fijo o su ciclo de semanas, con ausencias y días especiales)
function TurnosMes({ employees, appointments, onEditarDia }) {
  const hoy = todayISO();
  const [ref, setRef] = useState(() => { const d = new Date(hoy + "T00:00:00"); return { a: d.getFullYear(), m: d.getMonth() }; });
  const lista = employees.filter((e) => e.activa !== false && e.rol !== "admin");
  const [empId, setEmpId] = useState(lista[0]?.id || "");
  const emp = lista.find((e) => e.id === empId) || lista[0];
  if (!emp) return <div className="card" style={{ padding: 18 }}>No hay empleadas.</div>;
  const semanas = semanasDelMes(ref.a, ref.m);
  const mover = (d) => setRef((r) => { const f = new Date(r.a, r.m + d, 1); return { a: f.getFullYear(), m: f.getMonth() }; });
  const prefijo = `${ref.a}-${String(ref.m + 1).padStart(2, "0")}`;
  const titulo = primeraMayuscula(new Date(ref.a, ref.m, 1).toLocaleDateString("es-ES", { month: "long", year: "numeric" }));
  return (
    <div data-turnos-mes="1">
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {lista.map((e) => <button key={e.id} type="button" aria-pressed={e.id === emp.id} className={e.id === emp.id ? "btn btn-gold" : "btn btn-ghost"} style={{ minHeight: 34 }} onClick={() => setEmpId(e.id)}>{e.nombre}</button>)}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <IconButton icon={ChevronLeft} label="Mes anterior" onClick={() => mover(-1)} />
        <span data-titulo-mes="1" style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, minWidth: 190, textAlign: "center" }}>{titulo}</span>
        <IconButton icon={ChevronRight} label="Mes siguiente" onClick={() => mover(1)} />
      </div>
      <div className="card" style={{ padding: 10, overflowX: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(84px, 1fr))", gap: 6 }}>
          {["L", "M", "X", "J", "V", "S", "D"].map((d) => <div key={d} style={{ textAlign: "center", fontSize: 12, color: "rgba(var(--ink-rgb),0.6)", fontWeight: 600 }}>{d}</div>)}
          {semanas.flat().map((f) => {
            const h = horarioDelDia(emp, f, []);
            const aus = ausenciaEnFecha(emp, f);
            const exc = excepcionEnFecha(emp, f) != null;
            const delMes = f.startsWith(prefijo);
            return (
              <button
                key={f} type="button" data-dia-mes={f} onClick={() => onEditarDia(emp, f)} title="Clic para editar solo este día"
                style={{ textAlign: "left", padding: "6px 8px", borderRadius: 10, minHeight: 58, cursor: "pointer", opacity: delMes ? 1 : 0.4, background: f === hoy ? "rgba(21,112,239,0.10)" : h ? "var(--surface)" : "rgba(var(--ink-rgb),0.05)", border: exc ? "1.5px dashed rgba(var(--ink-rgb),0.5)" : f === hoy ? "1.5px solid var(--accent)" : "1px solid var(--line)", color: "var(--text)" }}
              >
                <div style={{ fontSize: 12, fontWeight: 700 }}>{Number(f.slice(8))}</div>
                <div style={{ fontSize: 11.5, color: aus ? "#B45309" : h ? "var(--text)" : "rgba(var(--ink-rgb),0.55)" }}>{aus ? aus.motivo : h ? `${minToLabel(h.inicio)}–${minToLabel(h.fin)}` : "Libra"}</div>
              </button>
            );
          })}
        </div>
      </div>
      <p style={{ fontSize: 12.5, color: "rgba(var(--ink-rgb),0.68)", marginTop: 10 }}>El borde punteado marca un día con cambio propio. Para repetir turnos distintos cada semana, usa «Rotativo» en la ficha de la empleada (por ejemplo, 2 semanas de un tipo y 1 de otro).</p>
    </div>
  );
}

function lunesDeSemana(fechaStr) {
  const d = new Date(fechaStr + "T00:00:00");
  const diaSemana = d.getDay(); // 0=domingo
  const offset = diaSemana === 0 ? -6 : 1 - diaSemana;
  d.setDate(d.getDate() + offset);
  return formatLocalISO(d);
}

function ConfirmDialog({ titulo, mensaje, textoConfirmar, textoCancelar, peligroso, onCancelar, onConfirmar }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(28,25,22,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 65, padding: 16 }}>
      <div className="card" role="alertdialog" aria-modal="true" aria-label={titulo} style={{ width: 380, maxWidth: "100%", padding: 22, background: "var(--surface)" }}>
        <h3 style={{ fontSize: 17, marginBottom: 8 }}>{titulo}</h3>
        <p style={{ fontSize: 13.5, color: "rgba(var(--ink-rgb),0.7)", lineHeight: 1.5, marginBottom: 20 }}>{mensaje}</p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button type="button" className="btn btn-ghost" onClick={onCancelar}>{textoCancelar || "Cancelar"}</button>
          <button
            type="button" className="btn" onClick={onConfirmar}
            style={peligroso ? { background: "#7A2E24", borderColor: "#7A2E24", color: "#fff" } : undefined}
          >
            {textoConfirmar || "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Editar el horario de UNA empleada en UN día concreto, sin tocar su
// patrón recurrente (fijo o rotativo) — desde la vista Turnos.
function DiaModal({ empleada, fecha, appointments, onClose, onGuardar, onQuitarExcepcion, onIrAHorarioCompleto }) {
  const excepcionActual = excepcionEnFecha(empleada, fecha);
  const horarioEfectivo = horarioDelDia(empleada, fecha, appointments);

  const [trabaja, setTrabaja] = useState(horarioEfectivo != null);
  const [inicio, setInicio] = useState(horarioEfectivo ? minToLabel(horarioEfectivo.inicio) : "10:00");
  const [fin, setFin] = useState(horarioEfectivo ? minToLabel(horarioEfectivo.fin) : "21:00");

  const fechaLegible = primeraMayuscula(new Date(fecha + "T00:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" }));

  return (
    <ModalShell title={`${empleada.nombre} · ${fechaLegible}`} onClose={onClose}>
      <p style={{ fontSize: 12.5, color: "rgba(var(--ink-rgb),0.68)", marginBottom: 16 }}>
        Este cambio afecta solo a este día. Su horario habitual (fijo o rotativo) sigue igual el resto de la semana.
      </p>

      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, marginBottom: 14 }}>
        <input type="checkbox" checked={trabaja} onChange={(e) => setTrabaja(e.target.checked)} />
        Trabaja este día
      </label>

      {trabaja && (
        <div className="grid-2" style={{ marginBottom: 6 }}>
          <Field label="Entrada">
            <input className="input" type="time" value={inicio} onChange={(e) => setInicio(e.target.value)} />
          </Field>
          <Field label="Salida">
            <input className="input" type="time" value={fin} onChange={(e) => setFin(e.target.value)} />
          </Field>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20, flexWrap: "wrap", gap: 8 }}>
        {excepcionActual ? (
          <button type="button" className="btn btn-ghost" style={{ color: "var(--danger)", borderColor: "var(--danger)" }} onClick={onQuitarExcepcion}>
            Quitar excepción
          </button>
        ) : <span />}
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button
            type="button" className="btn btn-gold"
            onClick={() => onGuardar({ fecha, activo: trabaja, inicio: trabaja ? inicio : "", fin: trabaja ? fin : "" })}
          >
            Guardar solo este día
          </button>
        </div>
      </div>

      <div style={{ borderTop: "1px solid var(--line)", marginTop: 18, paddingTop: 14 }}>
        <button type="button" onClick={onIrAHorarioCompleto} style={{ background: "transparent", border: "none", color: "var(--accent-text)", fontSize: 13, padding: 0 }}>
          Editar horario semanal completo (fijo o rotativo) →
        </button>
      </div>
    </ModalShell>
  );
}

function Turnos({ employees, appointments, onEdit, onEditarDia }) {
  const [vista, setVista] = useState("semana"); // "semana" | "mes"
  const [semanaInicio, setSemanaInicio] = useState(() => lunesDeSemana(todayISO()));
  const diasSemana = Array.from({ length: 7 }, (_, i) => addDays(semanaInicio, i));
  const esSemanaActual = semanaInicio === lunesDeSemana(todayISO());

  const rangoLabel = (() => {
    const inicio = new Date(semanaInicio + "T00:00:00");
    const fin = new Date(diasSemana[6] + "T00:00:00");
    const mismomes = inicio.getMonth() === fin.getMonth();
    const fmtDia = (d) => d.getDate();
    const fmtMes = (d) => d.toLocaleDateString("es-ES", { month: "short" });
    return mismomes
      ? `${fmtDia(inicio)}–${fmtDia(fin)} ${fmtMes(fin)} ${fin.getFullYear()}`
      : `${fmtDia(inicio)} ${fmtMes(inicio)} – ${fmtDia(fin)} ${fmtMes(fin)} ${fin.getFullYear()}`;
  })();

  const conmutador = (
    <div role="group" aria-label="Vista de turnos" style={{ display: "flex", gap: 8, marginBottom: 16 }}>
      <button type="button" aria-pressed={vista === "semana"} className={vista === "semana" ? "btn btn-gold" : "btn btn-ghost"} style={{ minHeight: 34 }} onClick={() => setVista("semana")}>Semana</button>
      <button type="button" aria-pressed={vista === "mes"} className={vista === "mes" ? "btn btn-gold" : "btn btn-ghost"} style={{ minHeight: 34 }} onClick={() => setVista("mes")}>Mes</button>
    </div>
  );
  if (vista === "mes") {
    return (
      <div>
        <HeaderConBoton title="Turnos" subtitle="Todo el mes de una empleada de un vistazo. Toca un día para cambiarlo solo ese día." onNew={null} newLabel="" />
        {conmutador}
        <TurnosMes employees={employees} appointments={appointments} onEditarDia={onEditarDia} />
      </div>
    );
  }

  return (
    <div>
      <HeaderConBoton title="Turnos" subtitle="Toca un día para cambiarlo solo ese día, o el nombre para el horario completo." onNew={null} newLabel="" />
      {conmutador}

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <IconButton icon={ChevronLeft} label="Semana anterior" onClick={() => setSemanaInicio((s) => addDays(s, -7))} />
        <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 17, minWidth: 170, textAlign: "center" }}>{rangoLabel}</span>
        <IconButton icon={ChevronRight} label="Semana siguiente" onClick={() => setSemanaInicio((s) => addDays(s, 7))} />
        {!esSemanaActual && (
          <button type="button" className="btn btn-ghost" style={{ fontSize: 12.5 }} onClick={() => setSemanaInicio(lunesDeSemana(todayISO()))}>
            Esta semana
          </button>
        )}
      </div>

      <div className="card" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "rgba(var(--ink-rgb),0.04)" }}>
              <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 500, fontSize: 12, color: "rgba(var(--ink-rgb),0.68)", minWidth: 170 }}>Empleada</th>
              {diasSemana.map((f) => (
                <th key={f} style={{ padding: "10px 10px", fontWeight: 500, fontSize: 12, color: "rgba(var(--ink-rgb),0.68)", minWidth: 130, textTransform: "capitalize" }}>
                  {new Date(f + "T00:00:00").toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => {
              const minutosSemana = diasSemana.reduce((sum, f) => {
                if (ausenciaEnFecha(emp, f)) return sum;
                const h = horarioDelDia(emp, f, appointments);
                return sum + (h ? h.fin - h.inicio : 0);
              }, 0);
              return (
                <tr key={emp.id} style={{ borderTop: "1px solid var(--line)" }}>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar empleada={emp} size={34} />
                      <div>
                        <button type="button" onClick={() => onEdit(emp)} style={{ background: "transparent", border: "none", padding: 0, fontWeight: 500, fontSize: 13.5, cursor: "pointer", textAlign: "left" }}>
                          {emp.nombre}
                        </button>
                        <div style={{ fontSize: 12.5, color: "rgba(var(--ink-rgb),0.68)" }}>{Math.floor(minutosSemana / 60)}h {minutosSemana % 60 ? `${minutosSemana % 60}min` : ""}</div>
                      </div>
                    </div>
                  </td>
                  {diasSemana.map((f) => {
                    const ausencia = ausenciaEnFecha(emp, f);
                    const h = horarioDelDia(emp, f, appointments);
                    const tieneExcepcion = excepcionEnFecha(emp, f) != null;
                    return (
                      <td key={f} style={{ padding: "8px 10px", textAlign: "center" }}>
                        {ausencia ? (
                          <button
                            type="button" onClick={() => onEditarDia(emp, f)} title={`${ausencia.motivo} — clic para editar solo este día`}
                            style={{
                              display: "inline-block", padding: "6px 10px", borderRadius: 20, fontSize: 12.5, fontWeight: 500, border: "none", cursor: "pointer",
                              background: "repeating-linear-gradient(135deg, rgba(var(--ink-rgb),0.1) 0px, rgba(var(--ink-rgb),0.1) 1px, rgba(var(--ink-rgb),0.03) 1px, rgba(var(--ink-rgb),0.03) 7px)",
                              color: "rgba(var(--ink-rgb),0.68)", whiteSpace: "nowrap",
                            }}
                          >
                            {ausencia.motivo}
                          </button>
                        ) : h ? (
                          <button
                            type="button" onClick={() => onEditarDia(emp, f)} title="Clic para editar solo este día"
                            style={{
                              display: "inline-block", padding: "6px 10px", borderRadius: 20, fontSize: 12, fontWeight: 500, border: tieneExcepcion ? "1.5px dashed var(--accent)" : "none", cursor: "pointer",
                              background: "rgba(var(--accent-rgb),0.15)", color: "var(--accent-text)", whiteSpace: "nowrap",
                            }}
                          >
                            {minToLabel(h.inicio)} – {minToLabel(h.fin)}
                          </button>
                        ) : (
                          <button
                            type="button" onClick={() => onEditarDia(emp, f)} title="Clic para editar solo este día"
                            style={{
                              display: "inline-block", padding: "6px 10px", borderRadius: 20, fontSize: 12.5, border: tieneExcepcion ? "1.5px dashed rgba(var(--ink-rgb),0.4)" : "none", cursor: "pointer",
                              background: "rgba(var(--ink-rgb),0.06)", color: "rgba(var(--ink-rgb),0.68)", whiteSpace: "nowrap",
                            }}
                          >
                            No está trabajando
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 12, color: "rgba(var(--ink-rgb),0.68)", marginTop: 10 }}>
        Toca cualquier día para cambiarlo solo ese día (el borde punteado marca un día con excepción propia), o el nombre de una empleada para su horario semanal completo, sus turnos rotativos o sus ausencias.
      </p>
    </div>
  );
}

function Empleadas({ employees, services, currentUser, onNew, onEdit, onToggleActiva, onDelete }) {
  return (
    <div>
      <HeaderConBoton title="Empleadas" subtitle="Equipo, foto, código de acceso y qué pantallas puede ver cada una." onNew={onNew} newLabel="Añadir empleada" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
        {employees.filter((e) => currentUser.rol === "admin" || e.rol !== "admin").map((e) => (
          <div key={e.id} className="card" style={{ padding: 18, opacity: e.activa ? 1 : 0.5 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <Avatar empleada={e} size={38} />
              <div>
                <div style={{ fontWeight: 500, fontSize: 15.5 }}>{e.nombre}</div>
                <div style={{ fontSize: 12, color: "rgba(var(--ink-rgb),0.68)" }}>{e.rol === "admin" ? "Administrador" : "Empleada"}</div>
              </div>
            </div>
            <div style={{ fontSize: 12.5, color: "rgba(var(--ink-rgb),0.68)", marginBottom: 12 }}>
              {e.rol === "admin" ? "Acceso a todas las pantallas" : `${Object.values(e.permisos || {}).filter(Boolean).length} pantalla(s) habilitada(s)`}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" className="btn btn-ghost" style={{ flex: 1, justifyContent: "center", fontSize: 13 }} onClick={() => onEdit(e)}>
                <Pencil size={13} /> Editar
              </button>
              {e.id !== currentUser.id && (
                <button type="button" className="btn btn-ghost" style={{ flex: 1, justifyContent: "center", fontSize: 13 }} onClick={() => onToggleActiva(e.id)}>
                  {e.activa ? "Desactivar" : "Activar"}
                </button>
              )}
              {e.id !== currentUser.id && currentUser.rol === "admin" && (
                <button type="button" className="btn btn-ghost" style={{ justifyContent: "center", fontSize: 13, color: "var(--danger)", borderColor: "var(--danger)" }} aria-label={`Eliminar a ${e.nombre}`} title="Eliminar empleada" onClick={() => onDelete(e)} title="Eliminar empleada">
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Ciclo de semanas fácil: tipos de semana (A, B…), atajos («2 semanas y 1 distinta»), vista previa de las próximas 8 semanas
function EditorCiclo({ turnos, turnoInicio, onChange }) {
  const [plan, setPlan] = useState(() => derivarCiclo(turnos));
  const aplicar = (nuevo) => {
    setPlan(nuevo);
    onChange(construirTurnos(nuevo.plantillas, nuevo.ciclo));
  };
  const editarTipo = (idx, dia, valor) => aplicar({ ...plan, plantillas: plan.plantillas.map((p, i) => (i === idx ? { ...p, [dia]: valor } : p)) });
  const previa = vistaPrevia({ turnoInicio, ciclo: plan.ciclo, desde: todayISO(), semanas: 8 });
  const corta = (iso) => new Date(iso + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  const suave = { fontSize: 12.5, color: "rgba(var(--ink-rgb),0.68)" };
  return (
    <div data-editor-ciclo="1" style={{ marginBottom: 14 }}>
      <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 6 }}>¿Cómo se repiten las semanas?</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {PRESETS.map((p) => <button key={p.id} type="button" className="chip" data-preset={p.id} onClick={() => aplicar(aplicarPreset(p.id, plan))}>{p.texto}</button>)}
      </div>
      <div style={suave}>Tu ciclo (toca una semana para cambiar su tipo):</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", margin: "8px 0" }}>
        {plan.ciclo.map((t, pos) => (
          <button key={pos} type="button" className="chip on" data-semana-ciclo={pos} data-tipo={letra(t)} aria-label={`Semana ${pos + 1} del ciclo: tipo ${letra(t)}. Toca para cambiar`} onClick={() => aplicar(siguienteTipo(plan, pos))}>Sem {pos + 1}: {letra(t)}</button>
        ))}
        <button type="button" className="btn btn-ghost" style={{ fontSize: 12.5, padding: "4px 10px", minHeight: 30 }} aria-label="Añadir una semana al ciclo" onClick={() => aplicar(anadirSemana(plan))}>+ semana</button>
        <button type="button" className="btn btn-ghost" style={{ fontSize: 12.5, padding: "4px 10px", minHeight: 30 }} aria-label="Quitar la última semana del ciclo" disabled={plan.ciclo.length <= 1} onClick={() => aplicar(quitarSemana(plan))}>− semana</button>
      </div>
      <div data-resumen-ciclo="1" style={{ ...suave, marginBottom: 12 }}>Se repite cada {plan.ciclo.length} {plan.ciclo.length === 1 ? "semana" : "semanas"}: <strong>{plan.ciclo.map(letra).join(" · ")}</strong></div>
      {plan.plantillas.map((patron, idx) => (
        <Field key={idx} label={`Semana tipo ${letra(idx)} · ${resumenPatron(patron)} · se usa en la semana ${plan.ciclo.map((t, i) => (t === idx ? i + 1 : null)).filter(Boolean).join(", ")}`}>
          <div className="card" data-tipo-semana={letra(idx)} style={{ padding: 12, background: "var(--field-bg)" }}>
            <EditorPatronSemana patron={patron} onChangeDia={(dia, valor) => editarTipo(idx, dia, valor)} />
          </div>
        </Field>
      ))}
      <div data-vista-previa-ciclo="1" style={{ marginTop: 6 }}>
        <div style={suave}>{turnoInicio ? "Así quedan las próximas semanas:" : "Elige arriba qué lunes empieza la semana 1 para ver las semanas reales:"}</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
          {previa.map((w) => <span key={w.lunes} data-previa-semana={w.lunes} data-tipo={letra(w.tipo)} style={{ border: "1px solid var(--line)", borderRadius: 999, padding: "3px 10px", fontSize: 12.5 }}>{corta(w.lunes)}: <strong>{letra(w.tipo)}</strong></span>)}
        </div>
      </div>
    </div>
  );
}

function EditorPatronSemana({ patron, onChangeDia }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {DIAS.map((d) => {
        const h = patron?.[d] || {};
        return (
          <div key={d} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 5, width: 76, fontSize: 12.5, color: "rgba(var(--ink-rgb),0.68)" }}>
              <input type="checkbox" checked={!!h.activo} onChange={(e) => onChangeDia(d, { ...h, activo: e.target.checked })} />
              {DIAS_LABEL[d]}
            </label>
            {h.activo ? (
              <>
                <input className="input" type="time" style={{ flex: 1 }} value={h.inicio || ""} onChange={(e) => onChangeDia(d, { ...h, inicio: e.target.value })} />
                <span style={{ fontSize: 12, color: "rgba(var(--ink-rgb),0.68)" }}>a</span>
                <input className="input" type="time" style={{ flex: 1 }} value={h.fin || ""} onChange={(e) => onChangeDia(d, { ...h, fin: e.target.value })} />
              </>
            ) : (
              <span style={{ fontSize: 12, color: "rgba(var(--ink-rgb),0.68)" }}>Libre</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function EmpleadaModal({ esAdmin = true, data, services, appointments, employees, onClose, onSave, onUploadFoto }) {
  const [form, setForm] = useState(() => ({
    id: uid(), nombre: "", telefono: "", activa: true, color: "#5AA9F0", codigo: "", codigoNuevo: "", rol: "empleada", fotoUrl: "",
    horarioTipo: "fijo", turnoInicio: "",
    ...data,
    // Valores por defecto seguros aunque la empleada llegue con datos incompletos
    horario: data?.horario || HORARIO_DEFAULT,
    diasLibres: data?.diasLibres || [],
    // Misma fuente que usa el calendario: los servicios que tienen a esta empleada autorizada
    servicios: data ? services.filter((sv) => (sv.empleadas || []).includes(data.id)).map((sv) => sv.id) : [],
    permisos: { ...DEFAULT_PERMISOS, ...(data?.permisos || {}) },
    turnos: data?.turnos || [],
    ausencias: data?.ausencias || [],
  }));
  const [diaExpandido, setDiaExpandido] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [nuevaAusencia, setNuevaAusencia] = useState({ inicio: "", fin: "", motivo: "Vacaciones", motivoOtro: "" });
  const [avisoAusencia, setAvisoAusencia] = useState(null);

  const anioActual = new Date().getFullYear();
  const resumenAnio = resumenAusenciasAnio(form.ausencias, anioActual);

  function addAusencia() {
    if (!nuevaAusencia.inicio || !nuevaAusencia.fin || nuevaAusencia.fin < nuevaAusencia.inicio) return;
    const motivoFinal = nuevaAusencia.motivo === "Otro" ? (nuevaAusencia.motivoOtro.trim() || "Otro") : nuevaAusencia.motivo;

    const citasEnMedio = citasEnRango(form.id, nuevaAusencia.inicio, nuevaAusencia.fin, appointments);

    setForm((f) => ({
      ...f,
      ausencias: [...(f.ausencias || []), { id: uid(), inicio: nuevaAusencia.inicio, fin: nuevaAusencia.fin, motivo: motivoFinal }],
    }));

    if (citasEnMedio.length > 0) {
      setAvisoAusencia(
        `Tiene ${citasEnMedio.length} cita${citasEnMedio.length === 1 ? "" : "s"} puesta${citasEnMedio.length === 1 ? "" : "s"} en esas fechas. Seguirá apareciendo en la agenda esos días hasta que quites o muevas esa${citasEnMedio.length === 1 ? "" : "s"} cita${citasEnMedio.length === 1 ? "" : "s"}.`
      );
    } else {
      setAvisoAusencia(null);
    }

    setNuevaAusencia({ inicio: "", fin: "", motivo: "Vacaciones", motivoOtro: "" });
  }

  function removeAusencia(id) {
    setForm((f) => ({ ...f, ausencias: (f.ausencias || []).filter((a) => a.id !== id) }));
  }

  function setTurnoDia(turnoIdx, dia, valorDia) {
    setForm((f) => {
      const turnos = [...(f.turnos || [])];
      turnos[turnoIdx] = { ...(turnos[turnoIdx] || {}), [dia]: valorDia };
      return { ...f, turnos };
    });
  }

  function addTurnoSemana() {
    setForm((f) => ({ ...f, turnos: [...(f.turnos || []), {}] }));
  }

  function removeTurnoSemana(idx) {
    setForm((f) => ({ ...f, turnos: (f.turnos || []).filter((_, i) => i !== idx) }));
  }

  function cambiarTipoHorario(tipo) {
    setForm((f) => ({
      ...f,
      horarioTipo: tipo,
      // al pasar a rotativo, el ciclo EMPIEZA con su horario actual (no hay que rellenarlo todo desde cero)
      turnos: tipo === "rotativo" && (!f.turnos || f.turnos.length === 0) ? [JSON.parse(JSON.stringify(f.horario || {}))] : f.turnos,
    }));
  }

  // Servicios que puede realizar: con muchos servicios, se busca por escrito (y «marcar» actúa sobre los que se ven)
  const [busquedaServ, setBusquedaServ] = useState("");
  const serviciosVisibles = busquedaServ.trim() ? services.filter((sv) => normalizarTexto(`${sv.nombre} ${sv.categoria || ""}`).includes(normalizarTexto(busquedaServ))) : services; // por nombre o por categoría
  const idsVisibles = new Set(serviciosVisibles.map((sv) => sv.id));
  const todosVisiblesMarcados = serviciosVisibles.length > 0 && serviciosVisibles.every((sv) => form.servicios.includes(sv.id));
  function toggleServicio(id) {
    setForm((f) => ({
      ...f,
      servicios: f.servicios.includes(id) ? f.servicios.filter((s) => s !== id) : [...f.servicios, id],
    }));
  }

  function toggleDiaLibre(dia) {
    setForm((f) => {
      const actuales = f.diasLibres || [];
      return {
        ...f,
        diasLibres: actuales.includes(dia) ? actuales.filter((d) => d !== dia) : [...actuales, dia],
      };
    });
  }

  function setHorarioHora(dia, campo, valor) {
    setForm((f) => ({
      ...f,
      horario: {
        ...(f.horario || {}),
        [dia]: { ...((f.horario || {})[dia] || {}), activo: true, [campo]: valor },
      },
    }));
  }

  function togglePermiso(key) {
    setForm((f) => ({ ...f, permisos: { ...f.permisos, [key]: !f.permisos?.[key] } }));
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendo(true);
    try {
      const url = await onUploadFoto(form.id, file);
      setForm((f) => ({ ...f, fotoUrl: url }));
    } catch (err) {
      // el toast ya lo muestra el padre
    } finally {
      setSubiendo(false);
    }
  }

  // El código actual NO se puede ver (se guarda cifrado). Aquí solo se escribe uno nuevo.
  const codigoValido = esCodigoValido(form.codigoNuevo || "");
  // el código solo lo pone el administrador: quien no lo es no lo ve ni se le exige
  const codigoOk = !esAdmin || (data ? !form.codigoNuevo || codigoValido : codigoValido); // al crear es obligatorio; al editar, opcional

  return (
    <ModalShell title={data ? "Editar empleada" : "Nueva empleada"} onClose={onClose}>
      <Field label="Foto">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Avatar empleada={form} size={56} />
          <label className="btn btn-ghost" style={{ fontSize: 12.5, cursor: "pointer" }}>
            <Camera size={13} /> {subiendo ? "Subiendo…" : "Cambiar foto"}
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} disabled={subiendo} />
          </label>
        </div>
      </Field>

      <Field label="Nombre">
        <input className="input" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
      </Field>
      <Field label="Teléfono">
        <input className="input" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
      </Field>

      {esAdmin ? (
        <>
      <Field label={data ? `Cambiar código de acceso (${LONGITUD_CODIGO} dígitos)` : `Código de acceso (${LONGITUD_CODIGO} dígitos)`}>
        <input
          className="input"
          value={form.codigoNuevo || ""}
          maxLength={LONGITUD_CODIGO}
          inputMode="numeric"
          autoComplete="off"
          placeholder={data ? (data.tieneCodigo ? "••••• (déjalo vacío para no cambiarlo)" : "Esta persona aún no tiene código") : "Ej. 48271"}
          onChange={(e) => setForm({ ...form, codigoNuevo: e.target.value.replace(/\D/g, "").slice(0, LONGITUD_CODIGO) })}
        />
        {form.codigoNuevo && !codigoValido && (
          <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 6 }}>El código debe tener {LONGITUD_CODIGO} dígitos.</div>
        )}
        <div style={{ fontSize: 12.5, color: "rgba(var(--ink-rgb),0.74)", marginTop: 6 }}>
          El código identifica a quién entra, así que tiene que ser único (si ya lo usa otra persona, el servidor te avisará). Por seguridad se guarda cifrado y nadie puede volver a verlo.
        </div>
      </Field>

      <div data-aviso-calendario="1" style={{ fontSize: 12.5, color: "rgba(var(--ink-rgb),0.74)", marginBottom: 14 }}>
        Su calendario de GHL se asigna en <strong>Configuración → Conexión con GoHighLevel</strong> (así no hace falta copiar ningún ID).
      </div>

      <Field label="Rol">
        <select className="input" value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
          <option value="empleada">Empleada (acceso limitado)</option>
          <option value="admin">Administrador (acceso total)</option>
        </select>
      </Field>

      {form.rol === "empleada" && (
        <Field label="Pantallas que puede ver">
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {Object.keys(DEFAULT_PERMISOS).map((key) => (
              <button
                key={key}
                type="button"
                className={`chip ${form.permisos?.[key] ? "on" : ""}`}
                onClick={() => togglePermiso(key)}
              >
                {PERMISOS_LABELS[key]}
              </button>
            ))}
          </div>
        </Field>
      )}
        </>
      ) : (
        <div data-solo-admin="1" style={{ fontSize: 12.5, color: "rgba(var(--ink-rgb),0.74)", background: "rgba(var(--ink-rgb),0.05)", borderRadius: 10, padding: "8px 12px", marginBottom: 14 }}>
          El código de acceso, el rol y las pantallas permitidas solo los cambia el administrador.
        </div>
      )}

      <Field label="Tipo de horario">
        <div style={{ display: "flex", gap: 6 }}>
          <button type="button" className={`chip ${form.horarioTipo !== "rotativo" ? "on" : ""}`} onClick={() => cambiarTipoHorario("fijo")}>
            Fijo (igual cada semana)
          </button>
          <button type="button" className={`chip ${form.horarioTipo === "rotativo" ? "on" : ""}`} onClick={() => cambiarTipoHorario("rotativo")}>
            Rotativo (alterna semanas)
          </button>
        </div>
      </Field>

      {form.horarioTipo !== "rotativo" && (
        <Field label="Horario semanal">
          <div className="card" style={{ padding: "0 14px" }}>
            {DIAS.map((d, i) => {
              const libre = (form.diasLibres || []).includes(d);
              const abierto = diaExpandido === d;
              const inicio = form.horario?.[d]?.inicio || "10:00";
              const fin = form.horario?.[d]?.fin || "21:00";
              return (
                <div key={d} style={{ borderBottom: i < DIAS.length - 1 ? "1px solid var(--line)" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 0" }}>
                    <span style={{ fontSize: 14 }}>{DIAS_LABEL_LARGO[d]}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (libre) {
                          toggleDiaLibre(d);
                          setDiaExpandido(d);
                        } else {
                          setDiaExpandido(abierto ? null : d);
                        }
                      }}
                      style={{
                        padding: "7px 14px", borderRadius: 20, border: "none", fontSize: 12.5, fontWeight: 500, whiteSpace: "nowrap",
                        background: libre ? "rgba(var(--ink-rgb),0.07)" : "rgba(var(--accent-rgb),0.15)",
                        color: libre ? "rgba(var(--ink-rgb),0.55)" : "var(--accent)",
                      }}
                    >
                      {libre ? "No está trabajando" : `${inicio} – ${fin}`}
                    </button>
                  </div>
                  {abierto && !libre && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 14, flexWrap: "wrap" }}>
                      <input className="input" type="time" style={{ flex: "1 1 100px" }} value={form.horario?.[d]?.inicio || ""} onChange={(e) => setHorarioHora(d, "inicio", e.target.value)} />
                      <span style={{ fontSize: 12.5, color: "rgba(var(--ink-rgb),0.68)" }}>a</span>
                      <input className="input" type="time" style={{ flex: "1 1 100px" }} value={form.horario?.[d]?.fin || ""} onChange={(e) => setHorarioHora(d, "fin", e.target.value)} />
                      <button
                        type="button"
                        onClick={() => { toggleDiaLibre(d); setDiaExpandido(null); }}
                        style={{ fontSize: 12, color: "#7A2E24", background: "transparent", border: "none" }}
                      >
                        Marcar libre
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 12.5, color: "rgba(var(--ink-rgb),0.68)", marginTop: 6 }}>
            Toca un horario para cambiarlo. Fuera de este rango, la agenda mostrará esas horas en gris.
          </div>
        </Field>
      )}

      {form.horarioTipo === "rotativo" && (
        <>
          <Field label="¿Qué lunes empieza la semana 1 del ciclo?">
            <input
              className="input"
              type="date"
              value={form.turnoInicio || ""}
              onChange={(e) => setForm({ ...form, turnoInicio: e.target.value })}
            />
            <div style={{ fontSize: 12.5, color: "rgba(var(--ink-rgb),0.68)", marginTop: 6 }}>
              A partir de esa fecha, el ciclo se repite solo cada {form.turnos?.length || 0} semanas.
            </div>
          </Field>

          <EditorCiclo turnos={form.turnos} turnoInicio={form.turnoInicio} onChange={(turnos) => setForm((f) => ({ ...f, turnos }))} />
        </>
      )}

      <Field label="Ausencias y vacaciones">
        {(form.ausencias || []).length > 0 && (
          <div style={{ marginBottom: 10, border: "1px solid var(--line)", borderRadius: 3, overflow: "hidden" }}>
            {form.ausencias.map((a) => (
              <div key={a.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 10px", borderBottom: "1px solid var(--line)", fontSize: 12.5, background: "var(--field-bg)" }}>
                <span>{a.inicio} → {a.fin} · <strong>{a.motivo}</strong></span>
                <button type="button" onClick={() => removeAusencia(a.id)} style={{ background: "transparent", border: "none" }}><X size={13} /></button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 120px" }}>
            <label className="field-label">Desde</label>
            <input className="input" type="date" value={nuevaAusencia.inicio} onChange={(e) => setNuevaAusencia({ ...nuevaAusencia, inicio: e.target.value })} />
          </div>
          <div style={{ flex: "1 1 120px" }}>
            <label className="field-label">Hasta</label>
            <input className="input" type="date" value={nuevaAusencia.fin} onChange={(e) => setNuevaAusencia({ ...nuevaAusencia, fin: e.target.value })} />
          </div>
          <div style={{ flex: "1 1 140px" }}>
            <label className="field-label">Motivo</label>
            <select className="input" value={nuevaAusencia.motivo} onChange={(e) => setNuevaAusencia({ ...nuevaAusencia, motivo: e.target.value })}>
              <option>Vacaciones</option>
              <option>Baja médica</option>
              <option>Asunto propio</option>
              <option>Otro</option>
            </select>
          </div>
          {nuevaAusencia.motivo === "Otro" && (
            <div style={{ flex: "1 1 140px" }}>
              <label className="field-label">Especificar</label>
              <input className="input" value={nuevaAusencia.motivoOtro} onChange={(e) => setNuevaAusencia({ ...nuevaAusencia, motivoOtro: e.target.value })} />
            </div>
          )}
          <button
            type="button"
            className="btn btn-ghost"
            onClick={addAusencia}
            disabled={!nuevaAusencia.inicio || !nuevaAusencia.fin || nuevaAusencia.fin < nuevaAusencia.inicio}
          >
            <Plus size={13} /> Añadir
          </button>
        </div>

        {avisoAusencia && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginTop: 8, padding: "8px 10px", background: "rgba(var(--accent-rgb),0.12)", borderRadius: 3, fontSize: 12 }}>
            <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1, color: "var(--accent-text)" }} />
            {avisoAusencia}
          </div>
        )}

        {Object.keys(resumenAnio).length > 0 && (
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
            <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Resumen {anioActual}</div>
            {Object.entries(resumenAnio).map(([motivo, dias]) => (
              <div key={motivo} style={{ fontSize: 12.5, color: "rgba(var(--ink-rgb),0.7)" }}>{motivo}: <strong>{dias}</strong> día{dias === 1 ? "" : "s"}</div>
            ))}
          </div>
        )}
      </Field>

      <Field label="Servicios que puede realizar">
        <input type="search" className="input" aria-label="Buscar servicio de la empleada" placeholder="Buscar servicio…" value={busquedaServ} onChange={(e) => setBusquedaServ(e.target.value)} style={{ marginBottom: 8 }} />
        <div data-servicios-empleada="1" style={{ display: "flex", gap: 6, flexWrap: "wrap", maxHeight: 240, overflowY: "auto", border: "1px solid var(--line)", borderRadius: 12, padding: 10 }}>
          {serviciosVisibles.length === 0 && <span style={{ fontSize: 13.5, color: "rgba(var(--ink-rgb),0.7)" }}>Ningún servicio coincide con «{busquedaServ}».</span>}
          {serviciosVisibles.map((sv) => (
            <button key={sv.id} type="button" className={`chip ${form.servicios.includes(sv.id) ? "on" : ""}`} onClick={() => toggleServicio(sv.id)} aria-pressed={form.servicios.includes(sv.id)}>
              {sv.nombre}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
          <button
            type="button"
            data-marcar-visibles="1"
            onClick={() => setForm((f) => ({ ...f, servicios: todosVisiblesMarcados ? f.servicios.filter((id) => !idsVisibles.has(id)) : [...new Set([...f.servicios, ...serviciosVisibles.map((sv) => sv.id)])] }))}
            style={{ background: "transparent", border: "none", padding: 0, fontSize: 13, fontWeight: 600, color: "var(--accent-text)" }}
          >
            {busquedaServ.trim() ? (todosVisiblesMarcados ? `Quitar los ${serviciosVisibles.length} visibles` : `Marcar los ${serviciosVisibles.length} visibles`) : todosVisiblesMarcados ? "Quitar todos" : "Marcar todos"}
          </button>
          <span style={{ fontSize: 12.5, color: "rgba(var(--ink-rgb),0.74)" }}>
            {form.servicios.length} de {services.length} marcados · son los que aparecen al crear una cita para ella
          </span>
        </div>
      </Field>

      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, marginTop: 4 }}>
        <input type="checkbox" checked={form.activa} onChange={(e) => setForm({ ...form, activa: e.target.checked })} />
        Activa
      </label>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button type="button" className="btn btn-gold" onClick={() => onSave(form)} disabled={!form.nombre.trim() || !codigoOk}>Guardar</button>
      </div>
    </ModalShell>
  );
}

// ---------------------------------------------------------------------------
// Servicios
// ---------------------------------------------------------------------------

// Catálogo de servicios: categorías a la izquierda y los servicios de la elegida a la derecha.
// Se ordenan arrastrando (o con las flechas, que valen también en el móvil) y se pueden editar las categorías.
function Servicios({ services, employees, categorias = [], puedeEliminar = false, onEliminar, onNew, onEdit, onToggleActivo, onColoresAuto, onImportar, onExportar, onOrdenar, onNuevaCategoria, onEditarCategoria, onMoverCategoria, onOrdenarCategorias }) {
  const TODAS = "__todas";
  const SIN = "__sin";
  const lista = useMemo(() => listaCategorias(services, categorias), [services, categorias]);
  const [sel, setSel] = useState(TODAS);
  const [buscar, setBuscar] = useState("");
  const [arrastrando, setArrastrando] = useState(null); // { tipo: "servicio" | "categoria", id }
  const claveDe = (c) => (c.nombre === "" ? SIN : c.nombre);
  const actual = lista.find((c) => claveDe(c) === sel) || null;
  useEffect(() => { if (sel !== TODAS && !lista.some((c) => claveDe(c) === sel)) setSel(TODAS); }, [lista, sel]); // la categoría elegida ya no existe

  const q = claveCategoria(buscar);
  const visibles = services.filter((sv) => (sel === TODAS || claveCategoria(sv.categoria || "") === claveCategoria(actual?.nombre ?? "")) && (!q || claveCategoria(sv.nombre).includes(q)));
  const grupos = [];
  visibles.forEach((sv) => {
    const k = claveCategoria(sv.categoria || "");
    let g = grupos.find((x) => x.k === k);
    if (!g) grupos.push((g = { k, nombre: sv.categoria || "", servicios: [] }));
    g.servicios.push(sv);
  });
  const idsDe = (nombre) => services.filter((sv) => claveCategoria(sv.categoria || "") === claveCategoria(nombre)).map((sv) => sv.id);
  const soltarServicio = (haciaId) => {
    if (!arrastrando || arrastrando.tipo !== "servicio") return;
    const origen = services.find((x) => x.id === arrastrando.id), destino = services.find((x) => x.id === haciaId);
    setArrastrando(null);
    if (!origen || !destino || claveCategoria(origen.categoria || "") !== claveCategoria(destino.categoria || "")) return; // solo dentro de su categoría
    const ids = idsDe(origen.categoria || "");
    const nuevo = moverId(ids, origen.id, destino.id);
    if (nuevo !== ids) onOrdenar(nuevo);
  };
  const nombresOrdenables = lista.filter((c) => c.nombre !== "").map((c) => c.nombre);
  const soltarCategoria = (haciaNombre) => {
    if (!arrastrando || arrastrando.tipo !== "categoria") return;
    const desde = arrastrando.id;
    setArrastrando(null);
    const nuevo = moverId(nombresOrdenables, desde, haciaNombre);
    if (nuevo !== nombresOrdenables) onOrdenarCategorias(nuevo);
  };
  const filaCat = (c, i) => {
    const k = claveDe(c);
    const activa = sel === k;
    const ordenable = c.nombre !== "";
    return (
      <div
        key={k} data-categoria={c.nombre || "Sin categoría"} draggable={ordenable} aria-current={activa ? "true" : undefined}
        onDragStart={(e) => { if (ordenable) { setArrastrando({ tipo: "categoria", id: c.nombre }); if (e.dataTransfer) e.dataTransfer.effectAllowed = "move"; } }}
        onDragOver={(e) => { if (arrastrando?.tipo === "categoria" && ordenable) e.preventDefault(); }}
        onDrop={(e) => { e.preventDefault(); if (ordenable) soltarCategoria(c.nombre); }}
        style={{ display: "flex", alignItems: "center", gap: 6, borderRadius: 12, background: activa ? "var(--side-active-bg, rgba(21,112,239,0.12))" : "transparent", marginBottom: 2 }}
      >
        <button type="button" onClick={() => setSel(k)} data-seleccionar-categoria={c.nombre || "Sin categoría"} style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "10px 12px", border: "none", background: "transparent", textAlign: "left", fontSize: 14.5, fontWeight: activa ? 600 : 400, color: "var(--text)", cursor: "pointer", minWidth: 0 }}>
          <span style={{ overflowWrap: "anywhere" }}>{c.nombre || "Sin categoría"}</span>
          <span style={{ background: "rgba(var(--ink-rgb),0.08)", borderRadius: 999, padding: "1px 9px", fontSize: 12, flex: "none" }}>{c.total}</span>
        </button>
        {ordenable && (
          <MenuPuntos etiqueta={`Opciones de ${c.nombre}`} items={[
            { texto: "Editar categoría", onClick: () => onEditarCategoria(c) },
            ...(i > 0 ? [{ texto: "Subir", onClick: () => onMoverCategoria(nombresOrdenables, c.nombre, -1) }] : []),
            ...(i < nombresOrdenables.length - 1 ? [{ texto: "Bajar", onClick: () => onMoverCategoria(nombresOrdenables, c.nombre, 1) }] : []),
          ]} />
        )}
      </div>
    );
  };
  const tarjeta = (sv, idsCategoria) => {
    const i = idsCategoria.indexOf(sv.id);
    const boton = { border: "none", padding: 6, minHeight: 32 };
    return (
      <div
        key={sv.id} data-servicio-id={sv.id} draggable
        onDragStart={(e) => { setArrastrando({ tipo: "servicio", id: sv.id }); if (e.dataTransfer) e.dataTransfer.effectAllowed = "move"; }}
        onDragOver={(e) => { if (arrastrando?.tipo === "servicio") e.preventDefault(); }}
        onDrop={(e) => { e.preventDefault(); soltarServicio(sv.id); }}
        onDragEnd={() => setArrastrando(null)}
        className="card"
        style={{ display: "flex", gap: 10, alignItems: "stretch", padding: 0, marginBottom: 10, overflow: "hidden", opacity: sv.activo === false ? 0.55 : arrastrando?.id === sv.id ? 0.5 : 1 }}
      >
        <div aria-hidden="true" style={{ width: 8, background: sv.color || "#B4863C", flex: "none" }} />
        <div style={{ flex: 1, minWidth: 0, padding: "12px 4px 12px 2px" }}>
          <div data-nombre-servicio="1" style={{ fontWeight: 600, fontSize: 15.5, overflowWrap: "anywhere" }}>{sv.nombre}{sv.activo === false && <span style={{ marginLeft: 8, fontSize: 11.5, fontWeight: 500, color: "rgba(var(--ink-rgb),0.68)" }}>(desactivado)</span>}</div>
          <div style={{ fontSize: 13, color: "rgba(var(--ink-rgb),0.74)" }}>{duracionLegible(sv.duracion)}{sel === TODAS ? "" : ""}</div>
          {sv.descripcion && <div style={{ fontSize: 13, color: "rgba(var(--ink-rgb),0.74)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{sv.descripcion}</div>}
          <div style={{ fontSize: 12, color: "rgba(var(--ink-rgb),0.6)", marginTop: 2 }}>{(sv.empleadas || []).map((id) => employees.find((e) => e.id === id)?.nombre).filter(Boolean).join(", ") || "Sin empleadas asignadas"}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 2, padding: "0 10px 0 0", flex: "none" }}>
          <span style={{ fontWeight: 600, marginRight: 6, whiteSpace: "nowrap" }}>{Number(sv.precio).toLocaleString("es-ES")} €</span>
          <button type="button" className="btn-ghost" style={boton} disabled={i <= 0} aria-label={`Subir ${sv.nombre}`} title="Subir" onClick={() => onOrdenar(moverPasos(idsCategoria, sv.id, -1))}><ChevronUp size={16} /></button>
          <button type="button" className="btn-ghost" style={boton} disabled={i < 0 || i >= idsCategoria.length - 1} aria-label={`Bajar ${sv.nombre}`} title="Bajar" onClick={() => onOrdenar(moverPasos(idsCategoria, sv.id, 1))}><ChevronDown size={16} /></button>
          <button type="button" className="btn-ghost" style={boton} aria-label={`Editar ${sv.nombre}`} title="Editar" onClick={() => onEdit(sv)}><Pencil size={15} /></button>
          {puedeEliminar ? (
            <>
              {sv.activo === false && <button type="button" className="btn-ghost" style={boton} aria-label={`Activar ${sv.nombre}`} title="Activar" onClick={() => onToggleActivo(sv.id)}><Check size={15} /></button>}
              <button type="button" className="btn-ghost" style={boton} aria-label={`Eliminar ${sv.nombre}`} title="Eliminar" onClick={() => onEliminar(sv)}><X size={15} /></button>
            </>
          ) : (
            <button type="button" className="btn-ghost" style={boton} aria-label={`${sv.activo === false ? "Activar" : "Desactivar"} ${sv.nombre}`} title={sv.activo === false ? "Activar" : "Desactivar"} onClick={() => onToggleActivo(sv.id)}>{sv.activo === false ? <Check size={15} /> : <X size={15} />}</button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div data-catalogo-servicios="1">
      <HeaderConBoton title="Servicios" subtitle="Elige una categoría y ordena los servicios arrastrándolos (o con las flechas): saldrán así en toda la app." onNew={() => onNew(actual && actual.nombre ? actual.nombre : "")} newLabel="Nuevo servicio" />
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap", margin: "-6px 0 12px" }}>
        <button type="button" className="btn btn-ghost" onClick={onNuevaCategoria} data-nueva-categoria="1"><Plus size={15} aria-hidden="true" /> Nueva categoría</button>
        {onImportar && <button type="button" className="btn btn-ghost" data-importar-servicios="1" onClick={onImportar}><Upload size={15} aria-hidden="true" /> Importar servicios</button>}
        {onExportar && <button type="button" className="btn btn-ghost" data-exportar-servicios="1" onClick={onExportar}><Download size={15} aria-hidden="true" /> Exportar servicios</button>}
        {onColoresAuto && <button type="button" className="btn btn-ghost" onClick={onColoresAuto}><Palette size={15} aria-hidden="true" /> Asignar colores por categoría</button>}
      </div>
      <div style={{ display: "flex", gap: 18, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div className="card" data-lista-categorias="1" style={{ flex: "0 1 300px", minWidth: 240, padding: 14 }}>
          <div style={{ fontWeight: 600, fontSize: 17, margin: "4px 8px 10px" }}>Categorías</div>
          <div data-categoria="todas" style={{ display: "flex", borderRadius: 12, background: sel === TODAS ? "var(--side-active-bg, rgba(21,112,239,0.12))" : "transparent", marginBottom: 2 }}>
            <button type="button" onClick={() => setSel(TODAS)} data-seleccionar-categoria="todas" style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", border: "none", background: "transparent", fontSize: 14.5, fontWeight: sel === TODAS ? 600 : 400, color: "var(--text)", cursor: "pointer" }}>
              <span>Todas las categorías</span>
              <span style={{ background: "rgba(var(--ink-rgb),0.08)", borderRadius: 999, padding: "1px 9px", fontSize: 12 }}>{services.length}</span>
            </button>
          </div>
          {lista.map((c, i) => filaCat(c, c.nombre === "" ? -1 : nombresOrdenables.indexOf(c.nombre)))}
        </div>
        <div style={{ flex: "1 1 420px", minWidth: 0 }}>
          <input className="input" type="search" aria-label="Buscar servicio" placeholder="Buscar nombre de servicio" value={buscar} onChange={(e) => setBuscar(e.target.value)} style={{ marginBottom: 14, maxWidth: 360 }} />
          {sel !== TODAS && actual && (
            <div data-cabecera-categoria="1" style={{ marginBottom: 12 }}>
              <h2 style={{ fontSize: 21, margin: "0 0 2px" }}>{actual.nombre || "Sin categoría"}</h2>
              {actual.descripcion && <div style={{ fontSize: 13.5, color: "rgba(var(--ink-rgb),0.74)" }}>{actual.descripcion}</div>}
            </div>
          )}
          {grupos.length === 0 && <div className="card" style={{ padding: 22, textAlign: "center", color: "rgba(var(--ink-rgb),0.7)" }}>{services.length === 0 ? "Todavía no hay servicios. Crea uno o impórtalos de un archivo." : buscar ? "Ningún servicio coincide con la búsqueda." : "Esta categoría no tiene servicios todavía."}</div>}
          {grupos.map((g) => (
            <div key={g.k || "sin"} data-grupo-categoria={g.nombre || "Sin categoría"}>
              {sel === TODAS && <div style={{ fontWeight: 600, fontSize: 15, margin: "14px 2px 8px", color: "rgba(var(--ink-rgb),0.82)" }}>{g.nombre || "Sin categoría"}</div>}
              {g.servicios.map((sv) => tarjeta(sv, idsDe(g.nombre)))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Crear o editar una categoría de servicios
function CategoriaModal({ data, existentes, onClose, onSave, onDelete }) {
  const [nombre, setNombre] = useState(data?.nombre || "");
  const [descripcion, setDescripcion] = useState(data?.descripcion || "");
  const repetido = nombre.trim() && existeCategoria(existentes, nombre.trim(), data ? claveCategoria(data.nombre) : null) && claveCategoria(nombre.trim()) !== claveCategoria(data?.nombre || "\u0000");
  const valido = nombre.trim().length > 0 && !repetido;
  return (
    <ModalShell title={data ? "Editar categoría" : "Nueva categoría"} onClose={onClose}>
      <div data-categoria-modal="1">
        <Field label="Nombre"><input className="input" aria-label="Nombre de la categoría" value={nombre} onChange={(e) => setNombre(e.target.value)} /></Field>
        {repetido && <div role="alert" style={{ fontSize: 12.5, color: "var(--danger)", marginTop: -8, marginBottom: 8 }}>Ya existe una categoría con ese nombre.</div>}
        <Field label="Descripción (opcional)"><textarea className="input" rows={3} aria-label="Descripción de la categoría" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Se ve debajo del título de la categoría" /></Field>
        {data && data.nombre !== nombre.trim() && data.total > 0 && <div style={{ fontSize: 12.5, color: "rgba(var(--ink-rgb),0.74)", marginBottom: 8 }}>Se cambiará el nombre de la categoría en sus {data.total} servicios.</div>}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
          {data ? <button type="button" className="btn btn-ghost" style={{ color: "var(--danger)" }} onClick={() => onDelete(data)}>Eliminar categoría</button> : <span />}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="button" className="btn btn-gold" disabled={!valido} onClick={() => onSave({ id: data?.id || null, nombreAnterior: data ? data.nombre : null, nombre: nombre.trim(), descripcion: descripcion.trim() })}>Guardar</button>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

function ImportarServiciosModal({ services, employees, esAdmin, usado, onClose, onAplicar }) {
  const [paso, setPaso] = useState("elegir"); // elegir | revisar | aplicando | hecho
  const [lectura, setLectura] = useState(null); // { servicios, omitidos, avisos }
  const [error, setError] = useState("");
  const [archivo, setArchivo] = useState("");
  const [deCero, setDeCero] = useState(esAdmin); // por defecto: empezar de cero (solo el administrador puede borrar)
  const [empleadas, setEmpleadas] = useState(employees.map((e) => e.id));
  const [confirmando, setConfirmando] = useState(false);
  const [resumen, setResumen] = useState(null);

  async function elegir(ev) {
    const f = ev.target.files && ev.target.files[0];
    if (!f) return;
    setError("");
    setArchivo(f.name);
    try {
      const texto = await new Promise((ok, mal) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = () => mal(new Error("No se pudo leer el archivo.")); r.readAsText(f); });
      let json;
      try { json = JSON.parse(texto); } catch (e) { setError("El archivo no es un JSON válido."); return; }
      const l = leerServicios(json);
      if (l.error) { setError(l.error); return; }
      if (!l.servicios.length) { setError("No se ha encontrado ningún servicio válido en el archivo."); return; }
      setLectura(l);
      setPaso("revisar");
    } catch (err) {
      setError(err.message);
    }
  }

  const plan = lectura ? planDeImportacion({ existentes: services, importados: lectura.servicios, empezarDeCero: deCero && esAdmin, usado }) : null;
  const categorias = lectura ? new Set(lectura.servicios.map((x) => x.categoria)).size : 0;
  const hayBorrado = plan ? plan.borrar.length + plan.desactivar.length > 0 : false;
  const hayQueHacer = plan ? plan.crear.length + plan.reemplazar.length + plan.borrar.length + plan.desactivar.length > 0 : false;
  const lista = (xs, n = 8) => xs.slice(0, n).map((x) => x.nombre).join(", ") + (xs.length > n ? ` … y ${xs.length - n} más` : "");

  async function aplicar() {
    setConfirmando(false);
    setPaso("aplicando");
    const r = await onAplicar(plan, { empleadas, deCero: deCero && esAdmin, categorias: lectura?.categorias || [] });
    setResumen(r);
    setPaso("hecho");
  }

  const nota = { fontSize: 13, color: "rgba(var(--ink-rgb),0.74)" };
  return (
    <ModalShell title="Importar servicios" onClose={paso === "aplicando" ? () => {} : onClose} ancho={720}>
      <div data-importar-servicios-modal="1">
        {paso === "elegir" && (
          <>
            <p style={{ marginTop: 0, ...nota }}>Elige el archivo <strong>.json</strong> con tus servicios (una lista de categorías, cada una con sus servicios: nombre, duración, precio y descripción). Antes de cambiar nada verás qué va a pasar.</p>
            <input type="file" accept=".json,application/json" aria-label="Archivo de servicios" onChange={elegir} />
            {error && <div role="alert" style={{ color: "var(--danger)", fontSize: 13.5, marginTop: 10 }}>{error}</div>}
          </>
        )}

        {paso === "revisar" && lectura && plan && (
          <>
            <div data-lectura="1" style={{ fontSize: 14, marginBottom: 10 }}>
              <strong>{archivo}</strong>: <strong>{lectura.servicios.length}</strong> servicios en {categorias} categorías.
              {lectura.omitidos.length > 0 && <div style={{ color: "var(--danger)", marginTop: 4 }}>{lectura.omitidos.length} no se pueden importar: {lectura.omitidos.slice(0, 5).map((o) => `«${o.nombre}» (${o.motivo.toLowerCase()})`).join(", ")}{lectura.omitidos.length > 5 ? "…" : ""}</div>}
              {lectura.avisos.length > 0 && <div style={{ ...nota, marginTop: 4 }}>{lectura.avisos.slice(0, 3).join(" ")}</div>}
            </div>

            <Field label="¿Qué hacer con los servicios que ya tienes?">
              <label style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6, opacity: esAdmin ? 1 : 0.5 }}>
                <input type="radio" name="modo-import" aria-label="Empezar de cero" checked={deCero && esAdmin} disabled={!esAdmin} onChange={() => setDeCero(true)} />
                <span><strong>Empezar de cero:</strong> eliminar los que no estén en el archivo{!esAdmin && " (solo el administrador)"}. Los que tengan citas o bonos no se borran (se perdería su historial): se desactivan.</span>
              </label>
              <label style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <input type="radio" name="modo-import" aria-label="Solo añadir y reemplazar" checked={!deCero || !esAdmin} onChange={() => setDeCero(false)} />
                <span><strong>Solo añadir y reemplazar:</strong> los demás se quedan como están.</span>
              </label>
            </Field>
            <div style={{ ...nota, marginBottom: 12 }}>Si un servicio del archivo ya existe (mismo nombre y categoría) se <strong>reemplaza</strong> por los datos del archivo, conservando sus empleadas, cabina, color y su historial.</div>

            <Field label="¿Quién hace los servicios nuevos?">
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {employees.map((e) => (
                  <button key={e.id} type="button" className={`chip ${empleadas.includes(e.id) ? "on" : ""}`} aria-pressed={empleadas.includes(e.id)} onClick={() => setEmpleadas((x) => (x.includes(e.id) ? x.filter((i) => i !== e.id) : [...x, e.id]))}>{e.nombre}</button>
                ))}
              </div>
              {empleadas.length === 0 && plan.crear.length > 0 && <div style={{ fontSize: 12.5, color: "#B45309", marginTop: 6 }}>Sin ninguna empleada, los servicios nuevos no se podrán elegir en la agenda hasta que se la asignes.</div>}
            </Field>


            <div data-resumen-importacion="1" style={{ background: "rgba(var(--ink-rgb),0.05)", borderRadius: 12, padding: "12px 14px", fontSize: 14 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Esto es lo que va a pasar:</div>
              <div data-n-crear="1">➕ Se crearán <strong>{plan.crear.length}</strong> servicios nuevos</div>
              <div data-n-reemplazar="1">🔁 Se reemplazarán <strong>{plan.reemplazar.length}</strong> que ya existen{plan.reemplazar.length > 0 && <span style={nota}> ({lista(plan.reemplazar.map((r) => r.existente))})</span>}</div>
              {plan.iguales.length > 0 && <div>✓ {plan.iguales.length} ya están igual: no se tocan</div>}
              {(deCero && esAdmin) && <div data-n-borrar="1">🗑 Se eliminarán <strong>{plan.borrar.length}</strong> servicios actuales{plan.borrar.length > 0 && <span style={nota}> ({lista(plan.borrar)})</span>}</div>}
              {(deCero && esAdmin) && plan.desactivar.length > 0 && <div data-n-desactivar="1">⏸ Se desactivarán <strong>{plan.desactivar.length}</strong> porque tienen citas o bonos<span style={nota}> ({lista(plan.desactivar)})</span></div>}
              {!(deCero && esAdmin) && plan.sinTocar.length > 0 && <div>• {plan.sinTocar.length} servicios actuales no están en el archivo y se quedan como están</div>}
            </div>

            {confirmando && (
              <div role="alert" data-confirmar-importacion="1" style={{ marginTop: 12, border: "1px solid var(--danger)", background: "rgba(220,38,38,0.07)", borderRadius: 12, padding: "12px 14px", fontSize: 14 }}>
                Vas a <strong>eliminar {plan.borrar.length}</strong>{plan.desactivar.length ? ` y desactivar ${plan.desactivar.length}` : ""} servicios actuales. <strong>No se puede deshacer.</strong>
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

        {paso === "aplicando" && <div role="status" style={{ padding: 18, textAlign: "center" }}>Importando servicios…</div>}

        {paso === "hecho" && resumen && (
          <div data-importacion-hecha="1">
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{resumen.errores.length === 0 ? "Importación terminada ✓" : "Importación terminada con problemas"}</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
              <li>{resumen.creados} servicios creados</li>
              <li>{resumen.reemplazados} reemplazados</li>
              {(resumen.borrados > 0 || resumen.desactivados > 0) && <li>{resumen.borrados} eliminados{resumen.desactivados ? ` · ${resumen.desactivados} desactivados (tenían citas o bonos)` : ""}</li>}
            </ul>
            {resumen.errores.length > 0 && <ul data-errores-importacion="1" style={{ color: "var(--danger)", fontSize: 13, paddingLeft: 18 }}>{resumen.errores.slice(0, 8).map((e, i) => <li key={i}>{e}</li>)}</ul>}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}><button type="button" className="btn btn-gold" onClick={onClose}>Cerrar</button></div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}

function ServicioModal({ data, categoriaInicial = "", employees, cabins, services = [], onClose, onSave }) {
  const [form, setForm] = useState(
    data || { nombre: "", descripcion: "", precio: "", duracion: "", categoria: categoriaInicial, empleadas: [], cabina: "cualquiera", activo: true, color: COLOR_SERVICIO_POR_DEFECTO }
  );
  const [colorElegido, setColorElegido] = useState(false); // si lo eliges tú, ya no cambia solo al cambiar la categoría

  // Color por defecto de una categoría: cada servicio de la misma categoría sale con un tono distinto
  const colorDeCategoria = (categoria) => {
    const clave = claveCategoria(categoria);
    const otros = services.filter((sv) => sv.id !== form.id && claveCategoria(sv.categoria || "") === clave).length;
    return colorPorDefecto(categoria, otros);
  };
  const categoriasExistentes = [...new Set(services.map((sv) => sv.categoria).filter(Boolean))];

  function toggleEmpleada(id) {
    setForm((f) => ({
      ...f,
      empleadas: f.empleadas.includes(id) ? f.empleadas.filter((e) => e !== id) : [...f.empleadas, id],
    }));
  }

  const empleadasSeleccionables = employees.filter((e) => e.rol !== "admin");
  const paletaColores = ["#5AA9F0", "#F08BB4", "#59D2A8", "#A98BF0", "#4FD0E0", "#F59A7C", "#7C8CF5", "#8FA3B8"];

  return (
    <ModalShell title={data ? "Editar servicio" : "Nuevo servicio"} onClose={onClose}>
      <Field label="Nombre"><input className="input" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></Field>
      <Field label="Descripción (opcional)">
        <textarea className="input" rows={3} aria-label="Descripción del servicio" value={form.descripcion || ""} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Qué incluye el servicio (también es la descripción de su calendario en GHL)" />
      </Field>
      <label style={{ display: "flex", gap: 10, alignItems: "flex-start", margin: "0 0 14px", fontSize: 14, cursor: "pointer" }}>
        <input type="checkbox" aria-label="Se puede reservar online" style={{ marginTop: 3 }} checked={form.reservableOnline !== false} onChange={(e) => setForm({ ...form, reservableOnline: e.target.checked, ...(e.target.checked ? {} : { recomendadoOnline: false }) })} />
        <span>Se puede reservar online<span style={{ display: "block", fontSize: 12.5, color: "rgba(var(--ink-rgb),0.7)" }}>Si lo desmarcas, las clientas no lo ven en la página de reservas (por ejemplo, un servicio que necesita valoración previa).</span></span>
      </label>
      <label style={{ display: "flex", gap: 10, alignItems: "flex-start", margin: "0 0 14px", fontSize: 14, cursor: form.reservableOnline === false ? "not-allowed" : "pointer", opacity: form.reservableOnline === false ? 0.5 : 1 }}>
        <input type="checkbox" aria-label="Recomendado en la reserva online" style={{ marginTop: 3 }} disabled={form.reservableOnline === false} checked={form.reservableOnline !== false && form.recomendadoOnline === true} onChange={(e) => setForm({ ...form, recomendadoOnline: e.target.checked })} />
        <span>⭐ Recomendado en la reserva online<span style={{ display: "block", fontSize: 12.5, color: "rgba(var(--ink-rgb),0.7)" }}>Sale en el apartado «Recomendados», lo primero que ven las clientas, si en Configuración → Reservas online has elegido «Los que yo marque». El orden es el de este catálogo (arriba, primero).</span></span>
      </label>
      <div className="grid-2">
        <Field label="Precio (€)"><input className="input" type="number" value={form.precio} onChange={(e) => setForm({ ...form, precio: Number(e.target.value) })} /></Field>
        <Field label="Duración (min)"><input className="input" type="number" value={form.duracion} onChange={(e) => setForm({ ...form, duracion: Number(e.target.value) })} /></Field>
      </div>
      <Field label="Categoría">
        <input
          className="input" list="categorias-servicios" value={form.categoria} placeholder="Facial, Corporal, Uñas…"
          onChange={(e) => {
            const categoria = e.target.value;
            setForm({ ...form, categoria, ...(colorElegido || !categoria.trim() ? {} : { color: colorDeCategoria(categoria) }) });
          }}
        />
        <datalist id="categorias-servicios">{categoriasExistentes.map((c) => <option key={c} value={c} />)}</datalist>
        {!colorElegido && form.categoria.trim() && <div style={{ fontSize: 12.5, color: "rgba(var(--ink-rgb),0.74)", marginTop: 5 }}>El color se asigna solo según la categoría; puedes cambiarlo abajo.</div>}
      </Field>

      <Field label="Color en la agenda">
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {paletaColores.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => { setColorElegido(true); setForm({ ...form, color: c }); }}
              title={c}
              style={{
                width: 28, height: 28, borderRadius: "50%", background: c, cursor: "pointer",
                border: form.color === c ? "2px solid var(--text)" : "1px solid var(--line)",
              }}
            />
          ))}
          <input
            type="color"
            value={form.color || COLOR_SERVICIO_POR_DEFECTO}
            onChange={(e) => { setColorElegido(true); setForm({ ...form, color: e.target.value }); }}
            style={{ width: 34, height: 28, padding: 0, border: "1px solid var(--line)", borderRadius: 4, cursor: "pointer" }}
            title="Otro color"
          />
        </div>
        <div style={{ fontSize: 12.5, color: "rgba(var(--ink-rgb),0.68)", marginTop: 6 }}>
          Así se verá el bloque de la cita en la agenda para este servicio.
        </div>
      </Field>

      <Field label="Empleadas autorizadas">
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {empleadasSeleccionables.map((e) => (
            <button key={e.id} type="button" className={`chip ${form.empleadas.includes(e.id) ? "on" : ""}`} onClick={() => toggleEmpleada(e.id)}>
              {e.nombre}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Cabina necesaria">
        <select className="input" value={form.cabina} onChange={(e) => setForm({ ...form, cabina: e.target.value })}>
          <option value="cualquiera">Cualquier cabina</option>
          {cabins.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </Field>

      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, marginTop: 4 }}>
        <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />
        Activo
      </label>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button type="button" className="btn btn-gold" onClick={() => onSave(form)} disabled={!form.nombre.trim()}>Guardar</button>
      </div>
    </ModalShell>
  );
}

// ---------------------------------------------------------------------------
// Cabinas
// ---------------------------------------------------------------------------

function Cabinas({ cabins, onNew, onEdit, onToggleActiva }) {
  return (
    <div>
      <HeaderConBoton title="Cabinas" subtitle="Espacios físicos disponibles para tratamientos." onNew={onNew} newLabel="Añadir cabina" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
        {cabins.map((c) => (
          <div key={c.id} className="card" data-cabina-id={c.id} style={{ padding: 18, opacity: c.activa ? 1 : 0.5, minWidth: 0, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, minWidth: 0 }}>
              <DoorClosed size={17} style={{ flex: "none" }} />
              <span style={{ fontWeight: 500, fontSize: 15, overflowWrap: "anywhere" }}>{c.nombre}</span>
            </div>
            {/* los botones se reparten el ancho, pero si no caben bajan de línea en vez de salirse del recuadro */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" className="btn btn-ghost" style={{ flex: "1 1 90px", minWidth: 0, justifyContent: "center", fontSize: 13, padding: "8px 10px" }} onClick={() => onEdit(c)}><Pencil size={13} /> Editar</button>
              <button type="button" className="btn btn-ghost" style={{ flex: "1 1 90px", minWidth: 0, justifyContent: "center", fontSize: 13, padding: "8px 10px" }} onClick={() => onToggleActiva(c.id)}>
                {c.activa ? "Desactivar" : "Activar"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CabinaModal({ data, onClose, onSave }) {
  const [form, setForm] = useState(data || { nombre: "", activa: true });
  return (
    <ModalShell title={data ? "Editar cabina" : "Nueva cabina"} onClose={onClose}>
      <Field label="Nombre"><input className="input" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></Field>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, marginTop: 4 }}>
        <input type="checkbox" checked={form.activa} onChange={(e) => setForm({ ...form, activa: e.target.checked })} />
        Activa
      </label>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button type="button" className="btn btn-gold" onClick={() => onSave(form)} disabled={!form.nombre.trim()}>Guardar</button>
      </div>
    </ModalShell>
  );
}

// ---------------------------------------------------------------------------
// Productos
// ---------------------------------------------------------------------------

function Productos({ productos, onNew, onEdit, onToggleActivo, onImportar, onExportarCSV, onExportarJSON }) {
  const [busqueda, setBusqueda] = useState("");
  const visibles = busqueda.trim() ? productos.filter((p) => normalizarTexto(p.nombre).includes(normalizarTexto(busqueda))) : productos;
  return (
    <div>
      <HeaderConBoton title="Productos" subtitle="Stock y precio de lo que se vende en tienda o al cobrar una cita." onNew={onNew} newLabel="Nuevo producto" />
      {(onImportar || onExportarCSV) && (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap", margin: "-6px 0 12px" }}>
          {onImportar && <button type="button" className="btn btn-ghost" data-importar-productos="1" onClick={onImportar}><Upload size={15} aria-hidden="true" /> Importar productos</button>}
          {onExportarCSV && <button type="button" className="btn btn-ghost" data-exportar-productos-csv="1" onClick={onExportarCSV}><Download size={15} aria-hidden="true" /> Exportar CSV (Excel)</button>}
          {onExportarJSON && <button type="button" className="btn btn-ghost" data-exportar-productos-json="1" onClick={onExportarJSON}><Download size={15} aria-hidden="true" /> Exportar JSON</button>}
        </div>
      )}
      <input type="search" className="input" aria-label="Buscar producto" placeholder="Buscar producto…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={{ marginBottom: 12 }} />
      <div className="card" style={{ overflowX: "auto", maxHeight: "65vh", overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
          <thead>
            <tr style={{ background: "rgba(var(--ink-rgb),0.04)", textAlign: "left", position: "sticky", top: 0 }}>
              {["Producto", "Precio", "Stock", "Estado", ""].map((h) => (
                <th key={h} style={{ padding: "10px 14px", fontWeight: 500, color: "rgba(var(--ink-rgb),0.68)", fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {productos.length === 0 && (
              <tr><td colSpan={5} style={{ padding: 16, textAlign: "center", color: "rgba(var(--ink-rgb),0.68)" }}>Sin productos todavía.</td></tr>
            )}
            {productos.length > 0 && visibles.length === 0 && (
              <tr><td colSpan={5} style={{ padding: 16, textAlign: "center", color: "rgba(var(--ink-rgb),0.68)" }}>Ningún producto coincide con «{busqueda}».</td></tr>
            )}
            {visibles.map((p) => (
              <tr key={p.id} style={{ borderTop: "1px solid var(--line)", opacity: p.activo ? 1 : 0.5 }}>
                <td style={{ padding: "10px 14px", fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}><Package size={14} /> {p.nombre}</td>
                <td style={{ padding: "10px 14px" }}>{p.precio} €</td>
                <td style={{ padding: "10px 14px", color: p.stock === 0 ? "var(--danger)" : "inherit" }}>{p.stock}</td>
                <td style={{ padding: "10px 14px" }}>{p.activo ? "Activo" : "Inactivo"}</td>
                <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                  <button type="button" className="btn-ghost" style={{ border: "none", padding: 4 }} onClick={() => onEdit(p)}><Pencil size={14} /></button>
                  <button type="button" className="btn-ghost" style={{ border: "none", padding: 4 }} onClick={() => onToggleActivo(p.id)}>
                    {p.activo ? <X size={14} /> : <Check size={14} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductoModal({ data, onClose, onSave }) {
  const [form, setForm] = useState(data || { nombre: "", precio: "", stock: "", activo: true });
  return (
    <ModalShell title={data ? "Editar producto" : "Nuevo producto"} onClose={onClose}>
      <Field label="Nombre"><input className="input" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></Field>
      <div className="grid-2">
        <Field label="Precio (€)"><input className="input" type="number" value={form.precio} onChange={(e) => setForm({ ...form, precio: Number(e.target.value) })} /></Field>
        <Field label="Stock disponible"><input className="input" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} /></Field>
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, marginTop: 4 }}>
        <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />
        Activo
      </label>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button type="button" className="btn btn-gold" onClick={() => onSave(form)} disabled={!form.nombre.trim()}>Guardar</button>
      </div>
    </ModalShell>
  );
}

// ---------------------------------------------------------------------------
// Clientes
// ---------------------------------------------------------------------------

function ClienteModal({ data, onClose, onSave }) {
  const [form, setForm] = useState(data || { nombre: "", telefono: "", email: "", favorito: false });

  return (
    <ModalShell title={data ? "Editar cliente" : "Nuevo cliente"} onClose={onClose}>
      <Field label="Nombre"><input className="input" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></Field>
      <Field label="Teléfono (obligatorio)"><input className="input" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} /></Field>
      <Field label="Email (opcional)"><input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>

      <Field label="Nota fija (sale siempre que este cliente reserve)">
        <textarea className="input" rows={2} style={{ resize: "vertical" }} aria-label="Nota fija" value={form.notaFija || ""} onChange={(e) => setForm({ ...form, notaFija: e.target.value })} />
      </Field>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, marginTop: 4 }}>
        <input type="checkbox" checked={form.favorito} onChange={(e) => setForm({ ...form, favorito: e.target.checked })} />
        Cliente favorito
      </label>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button type="button" className="btn btn-gold" onClick={() => onSave(form)} disabled={!form.nombre.trim() || !form.telefono.trim()}>Guardar</button>
      </div>
    </ModalShell>
  );
}

// ---------------------------------------------------------------------------
// Ventas del día
// ---------------------------------------------------------------------------

function Ventas({ appointments, services, productos, metodosPago, employees, ventas = [], puedeAnular = false, onAnularVenta }) {
  const [dia, setDia] = useState(todayISO());

  const ventasDelDia = appointments.filter((a) => a.fecha === dia && a.estadoCobro === "cobrada");

  const totalesPorMetodo = {};
  let granTotal = 0;
  ventasDelDia.forEach((v) => {
    granTotal += calcularTotalCita(v, services, productos) - importeConBono(v); // lo pagado con bono no es dinero nuevo
    (v.pagos || []).forEach((p) => {
      if (p.metodoId === METODO_BONO) return;
      totalesPorMetodo[p.metodoId] = (totalesPorMetodo[p.metodoId] || 0) + p.importe;
    });
  });
  // Ventas sin cita y cobros de bonos del día (cada línea de pago cuenta el día en que se cobró)
  const sinCitaDelDia = ventas.filter((v) => !v.anulada).map((v) => ({ v, lineas: (v.pagos || []).filter((pg) => (pg.fecha || v.fecha) === dia) })).filter((m) => m.lineas.length > 0);
  sinCitaDelDia.forEach(({ lineas }) => lineas.forEach((pg) => {
    granTotal += Number(pg.importe) || 0;
    totalesPorMetodo[pg.metodoId] = (totalesPorMetodo[pg.metodoId] || 0) + (Number(pg.importe) || 0);
  }));

  const hoy = new Date();
  const anioActual = hoy.getFullYear();
  const mesActual = hoy.getMonth();
  const anioAnterior = mesActual === 0 ? anioActual - 1 : anioActual;
  const mesAnterior = mesActual === 0 ? 11 : mesActual - 1;

  const resumenMesActual = resumenFacturacionMes(appointments, services, productos, anioActual, mesActual, ventas);
  const resumenMesAnterior = resumenFacturacionMes(appointments, services, productos, anioAnterior, mesAnterior, ventas);

  const nombreMes = (anio, mes) => primeraMayuscula(new Date(anio, mes, 1).toLocaleDateString("es-ES", { month: "long", year: "numeric" }));

  return (
    <div>
      <h1 style={{ fontSize: 26, marginBottom: 4 }}>Ventas</h1>
      <p style={{ color: "rgba(var(--ink-rgb),0.68)", marginTop: 0, marginBottom: 20, fontSize: 14 }}>
        Total cobrado y desglose por método de pago.
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <IconButton icon={ChevronLeft} label="Día anterior" onClick={() => setDia(addDays(dia, -1))} />
        <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, minWidth: 200, textAlign: "center" }}>{fechaLabel(dia)}</span>
        <IconButton icon={ChevronRight} label="Día siguiente" onClick={() => setDia(addDays(dia, 1))} />
        {dia !== todayISO() && (
          <button type="button" className="btn btn-ghost" style={{ fontSize: 12.5 }} onClick={() => setDia(todayISO())}>Hoy</button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14, marginBottom: 26 }}>
        {metodosPago.map((m) => (
          <StatCard key={m.id} label={m.nombre} value={`${(totalesPorMetodo[m.id] || 0).toFixed(2)} €`} />
        ))}
        <StatCard label="Total del día" value={`${granTotal.toFixed(2)} €`} />
      </div>

      {sinCitaDelDia.length > 0 && (
        <div className="card" data-ventas-sin-cita="1" style={{ overflowX: "auto", marginBottom: 20 }}>
          <div style={{ padding: "12px 14px 4px", fontWeight: 600, fontSize: 14 }}>Ventas sin cita y cobros de bonos</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
            <tbody>
              {sinCitaDelDia.map(({ v, lineas }) => {
                const delDia = v.fecha === dia;
                const cobrado = lineas.reduce((sum, pg) => sum + (Number(pg.importe) || 0), 0);
                const deuda = pendienteVenta(v);
                const resumen = [...(v.productos || []).map((l) => `${l.cantidad} × ${l.nombre}`), ...(v.bonos || []).map((l) => `${l.cantidad > 1 ? `${l.cantidad} × ` : ""}${l.nombre}`)].join(" · ");
                return (
                  <tr key={v.id} data-venta-id={v.id} style={{ borderTop: "1px solid var(--line)" }}>
                    <td style={{ padding: "10px 14px" }}>{v.clienteNombre || "Sin cliente"}</td>
                    <td style={{ padding: "10px 14px", color: "rgba(var(--ink-rgb),0.74)" }}>
                      {delDia ? resumen : `Plazo de «${(v.bonos || []).map((l) => l.nombre).join(", ")}»`}
                      {deuda > 0.005 && <span style={{ color: "var(--danger)" }}> · a plazos: debe {deuda.toFixed(2)} €</span>}
                    </td>
                    <td style={{ padding: "10px 14px" }}>{lineas.map((pg) => metodosPago.find((m) => m.id === pg.metodoId)?.nombre).filter(Boolean).join(" + ") || "—"}</td>
                    <td style={{ padding: "10px 14px", fontWeight: 600, whiteSpace: "nowrap" }}>{cobrado.toFixed(2)} €</td>
                    <td style={{ padding: "6px 10px" }}>
                      {puedeAnular && delDia && <button type="button" className="btn btn-ghost" style={{ minHeight: 30, padding: "3px 10px", fontSize: 12.5, color: "var(--danger)" }} onClick={() => onAnularVenta(v)} aria-label={`Anular la venta de ${v.clienteNombre || "sin cliente"}`}>Anular</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="card" style={{ overflowX: "auto", marginBottom: 28 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
          <thead>
            <tr style={{ background: "rgba(var(--ink-rgb),0.04)", textAlign: "left" }}>
              {["Hora", "Clienta", "Empleada", "Total", "Métodos"].map((h) => (
                <th key={h} style={{ padding: "10px 14px", fontWeight: 500, color: "rgba(var(--ink-rgb),0.68)", fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ventasDelDia.length === 0 && (
              <tr><td colSpan={5} style={{ padding: 16, textAlign: "center", color: "rgba(var(--ink-rgb),0.68)" }}>Sin ventas cobradas este día.</td></tr>
            )}
            {ventasDelDia.map((v) => {
              const emp = employees.find((e) => e.id === v.empleadaId);
              return (
                <tr key={v.id} style={{ borderTop: "1px solid var(--line)" }}>
                  <td style={{ padding: "10px 14px" }}>{minToLabel(v.inicio)}</td>
                  <td style={{ padding: "10px 14px", fontWeight: 500 }}>{v.clienta}</td>
                  <td style={{ padding: "10px 14px" }}>{emp?.nombre || "—"}</td>
                  <td style={{ padding: "10px 14px" }}>{calcularTotalCita(v, services, productos).toFixed(2)} €</td>
                  <td style={{ padding: "10px 14px" }}>
                    {(v.pagos || []).map((p) => metodosPago.find((m) => m.id === p.metodoId)?.nombre).filter(Boolean).join(" + ") || "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h2 style={{ fontSize: 19, marginBottom: 14 }}>Informe de facturación</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        <InformeMensual titulo={nombreMes(anioActual, mesActual)} resumen={resumenMesActual} metodosPago={metodosPago} />
        <InformeMensual titulo={nombreMes(anioAnterior, mesAnterior)} resumen={resumenMesAnterior} metodosPago={metodosPago} />
      </div>
    </div>
  );
}

function InformeMensual({ titulo, resumen, metodosPago }) {
  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ fontSize: 13, color: "rgba(var(--ink-rgb),0.68)", marginBottom: 2, textTransform: "capitalize" }}>{titulo}</div>
      <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 30, fontWeight: 600, marginBottom: 4 }}>{resumen.total.toFixed(2)} €</div>
      <div style={{ fontSize: 12.5, color: "rgba(var(--ink-rgb),0.68)", marginBottom: 14 }}>{resumen.cantidad} cita{resumen.cantidad === 1 ? "" : "s"} cobrada{resumen.cantidad === 1 ? "" : "s"}</div>
      <div style={{ borderTop: "1px solid var(--line)", paddingTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
        {metodosPago.filter((m) => resumen.porMetodo[m.id]).map((m) => (
          <div key={m.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: "rgba(var(--ink-rgb),0.68)" }}>{m.nombre}</span>
            <span style={{ fontWeight: 500 }}>{resumen.porMetodo[m.id].toFixed(2)} €</span>
          </div>
        ))}
        {Object.keys(resumen.porMetodo).length === 0 && (
          <div style={{ fontSize: 12.5, color: "rgba(var(--ink-rgb),0.68)" }}>Sin ventas cobradas este mes.</div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fichajes
// ---------------------------------------------------------------------------

const horasMin = (m) => duracionLabel(m); // con segundos: 10h 18m 05s

function Fichajes({ employees, fichajeActivo, descansos = {}, fichajesLog, currentUser, onFichar, onEditar, onEliminar, onNuevo, onEditarAbierto }) {
  const [dia, setDia] = useState(todayISO());
  const [aEliminar, setAEliminar] = useState(null);
  const esAdmin = currentUser?.rol === "admin";
  const hoy = todayISO();
  const esHoy = dia === hoy;
  const ahora = nowMinutesExact();
  const visibles = employees.filter((e) => e.rol !== "admin" && (esAdmin || e.id === currentUser?.id));
  const logDia = fichajesLog.filter((f) => f.fecha === dia && visibles.some((e) => e.id === f.empleadaId)).sort((a, b) => a.entrada - b.entrada);
  const filas = visibles
    .map((e) => {
      const horario = horarioDelDia(e, dia, []);
      const tramos = logDia.filter((f) => f.empleadaId === e.id);
      const abierto = esHoy && fichajeActivo[e.id] != null ? { entrada: fichajeActivo[e.id], enDescanso: descansos[e.id] != null, descansoDesde: descansos[e.id] } : null;
      return { e, horario, tramos, resumen: resumenDiaFichaje({ horario, tramos, abierto, ahora, esHoy, diaPasado: dia < hoy }) };
    })
    .filter(({ horario, tramos, resumen }) => horario || tramos.length > 0 || resumen.estado !== "pendiente");
  const abiertos = esHoy ? visibles.filter((e) => fichajeActivo[e.id] != null) : []; // fichajes aún sin cerrar (se pueden corregir o cerrar)
  const colorInc = { tarde: ["rgba(217,119,6,0.16)", "#92400E"], antes: ["rgba(217,119,6,0.16)", "#92400E"], extra: ["rgba(21,112,239,0.14)", "var(--accent-text)"], sin_fichar: ["rgba(220,38,38,0.14)", "#991B1B"], sin_salida: ["rgba(220,38,38,0.14)", "#991B1B"] };
  const th = (h) => <th key={h} style={{ padding: "10px 14px", fontWeight: 500, color: "rgba(var(--ink-rgb),0.68)", fontSize: 12 }}>{h}</th>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, marginBottom: 4 }}>Fichajes</h1>
          <p style={{ color: "rgba(var(--ink-rgb),0.68)", margin: 0, fontSize: 14 }}>
            {esAdmin ? "Entradas, salidas y descansos de cada empleada, con las llegadas tarde y las salidas fuera de su horario." : "Tus fichajes."}
          </p>
        </div>
        {esAdmin && <button type="button" className="btn btn-gold" onClick={() => onNuevo(dia)}><Plus size={15} /> Añadir fichaje</button>}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
        <IconButton icon={ChevronLeft} label="Día anterior" onClick={() => setDia(addDays(dia, -1))} />
        <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, minWidth: 200, textAlign: "center" }}>{fechaLabel(dia)}</span>
        <IconButton icon={ChevronRight} label="Día siguiente" onClick={() => setDia(addDays(dia, 1))} />
        {!esHoy && <button type="button" className="btn btn-ghost" onClick={() => setDia(hoy)}>Hoy</button>}
      </div>

      {esHoy && (
        <div style={{ display: "flex", gap: 14, marginBottom: 22, flexWrap: "wrap" }}>
          {visibles.map((e) => {
            const dentro = fichajeActivo[e.id] != null && descansos[e.id] == null;
            const enDescanso = descansos[e.id] != null;
            return (
              <div key={e.id} className="card" style={{ padding: 18, flex: "1 1 180px", textAlign: "center" }}>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>{e.nombre}</div>
                <div style={{ fontSize: 12, color: "rgba(var(--ink-rgb),0.68)", marginBottom: 14 }}>
                  {enDescanso ? `En descanso desde ${tiempoLabel(descansos[e.id])}` : dentro ? `En turno desde ${tiempoLabel(fichajeActivo[e.id])}` : "Sin fichar"}
                </div>
                <button type="button" className={`btn ${dentro ? "" : "btn-gold"}`} style={{ width: "100%", justifyContent: "center", background: dentro ? "#7A2E24" : undefined, borderColor: dentro ? "#7A2E24" : undefined, color: dentro ? "#fff" : undefined }} onClick={() => onFichar(e.id)}>
                  {dentro ? <><LogOut size={15} /> Fichar salida</> : enDescanso ? <><LogIn size={15} /> Volver del descanso</> : <><LogIn size={15} /> Fichar entrada</>}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="card" data-resumen-fichajes="1" style={{ overflowX: "auto", marginBottom: 22 }}>
        <div style={{ padding: "12px 14px 4px", fontWeight: 600, fontSize: 14 }}>Resumen del día</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
          <thead><tr style={{ background: "rgba(var(--ink-rgb),0.04)", textAlign: "left" }}>{["Empleada", "Turno", "Entrada", "Salida", "Trabajado", "Descanso", "Incidencias"].map(th)}</tr></thead>
          <tbody>
            {filas.length === 0 && <tr><td colSpan={7} style={{ padding: 16, textAlign: "center", color: "rgba(var(--ink-rgb),0.68)" }}>Nadie tiene turno ni fichajes este día.</td></tr>}
            {filas.map(({ e, horario, resumen }) => (
              <tr key={e.id} data-fila-fichaje={e.id} style={{ borderTop: "1px solid var(--line)" }}>
                <td style={{ padding: "10px 14px", fontWeight: 500 }}>{e.nombre}</td>
                <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>{horario ? `${minToLabel(horario.inicio)}–${minToLabel(horario.fin)}` : "Libra"}</td>
                <td style={{ padding: "10px 14px" }}>{resumen.entrada != null ? tiempoLabel(resumen.entrada) : "—"}</td>
                <td style={{ padding: "10px 14px" }}>{resumen.salida != null ? tiempoLabel(resumen.salida) : resumen.estado === "dentro" ? "en turno" : resumen.estado === "descanso" ? "en descanso" : "—"}</td>
                <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>{resumen.trabajado ? horasMin(resumen.trabajado) : "—"}</td>
                <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>{resumen.descanso ? horasMin(resumen.descanso) : "—"}</td>
                <td style={{ padding: "10px 14px" }}>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {resumen.incidencias.length === 0 && (resumen.estado === "completo" || resumen.estado === "dentro" || resumen.estado === "descanso") && <span style={{ fontSize: 12.5, color: "rgba(var(--ink-rgb),0.6)" }}>Sin incidencias</span>}
                    {resumen.incidencias.map((i, k) => (
                      <span key={k} data-incidencia={i.tipo} style={{ background: colorInc[i.tipo][0], color: colorInc[i.tipo][1], fontWeight: 600, fontSize: 11.5, padding: "2px 8px", borderRadius: 999, whiteSpace: "nowrap" }}>{textoIncidencia(i)}</span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ overflowX: "auto" }}>
        <div style={{ padding: "12px 14px 4px", fontWeight: 600, fontSize: 14 }}>Fichajes registrados</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
          <thead><tr style={{ background: "rgba(var(--ink-rgb),0.04)", textAlign: "left" }}>{["Empleada", "Entrada", "Salida", "Horas", ""].map((h, i) => (h ? th(h) : <th key={i} />))}</tr></thead>
          <tbody>
            {logDia.length === 0 && abiertos.length === 0 && <tr><td colSpan={5} style={{ padding: 16, textAlign: "center", color: "rgba(var(--ink-rgb),0.68)" }}>Sin fichajes registrados este día.</td></tr>}
            {abiertos.map((e) => {
              const enDescanso = descansos[e.id] != null;
              return (
                <tr key={`abierto-${e.id}`} data-fichaje-abierto={e.id} style={{ borderTop: "1px solid var(--line)", background: "rgba(21,112,239,0.05)" }}>
                  <td style={{ padding: "10px 14px" }}>{e.nombre}</td>
                  <td style={{ padding: "10px 14px" }}>{enDescanso ? "—" : tiempoLabel(fichajeActivo[e.id])}</td>
                  <td style={{ padding: "10px 14px", fontWeight: 600, color: enDescanso ? "#B45309" : "var(--accent-text)" }}>{enDescanso ? `en descanso desde ${tiempoLabel(descansos[e.id])}` : "en turno"}</td>
                  <td style={{ padding: "10px 14px" }}>{enDescanso ? "—" : horasMin(ahora - fichajeActivo[e.id])}</td>
                  <td style={{ padding: "6px 10px", whiteSpace: "nowrap" }}>
                    {esAdmin && <button type="button" className="btn-ghost" style={{ border: "none", padding: 6 }} onClick={() => onEditarAbierto(e)} aria-label={`Editar fichaje en curso de ${e.nombre}`} title="Corregir o cerrar este fichaje"><Pencil size={15} /></button>}
                  </td>
                </tr>
              );
            })}
            {logDia.map((f) => {
              const emp = employees.find((x) => x.id === f.empleadaId);
              const mins = f.salida - f.entrada;
              return (
                <tr key={f.id} data-fichaje-id={f.id} style={{ borderTop: "1px solid var(--line)" }}>
                  <td style={{ padding: "10px 14px" }}>{emp?.nombre || "—"}</td>
                  <td style={{ padding: "10px 14px" }}>{tiempoLabel(f.entrada)}</td>
                  <td style={{ padding: "10px 14px" }}>{tiempoLabel(f.salida)}</td>
                  <td style={{ padding: "10px 14px" }}>{horasMin(mins)}</td>
                  <td style={{ padding: "6px 10px", whiteSpace: "nowrap" }}>
                    {esAdmin && (
                      <>
                        <button type="button" className="btn-ghost" style={{ border: "none", padding: 6 }} onClick={() => onEditar(f)} aria-label={`Editar fichaje de ${emp?.nombre || ""}`} title="Modificar"><Pencil size={15} /></button>
                        <button type="button" className="btn-ghost" style={{ border: "none", padding: 6, color: "var(--danger)" }} onClick={() => setAEliminar(f)} aria-label={`Eliminar fichaje de ${emp?.nombre || ""}`} title="Eliminar"><Trash2 size={15} /></button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {esAdmin && <p style={{ fontSize: 12.5, color: "rgba(var(--ink-rgb),0.68)", marginTop: 10 }}>Se considera llegada tarde o salida fuera de hora a partir de {5} minutos sobre el turno de cada empleada.</p>}

      {aEliminar && (
        <ConfirmDialog
          titulo="¿Eliminar este fichaje?"
          mensaje={`Se borra el fichaje de ${employees.find((x) => x.id === aEliminar.empleadaId)?.nombre || ""} (${tiempoLabel(aEliminar.entrada)}–${tiempoLabel(aEliminar.salida)}). Las horas trabajadas de ese día se recalculan.`}
          textoConfirmar="Eliminar fichaje" textoCancelar="No, conservar" peligroso
          onCancelar={() => setAEliminar(null)}
          onConfirmar={() => { const f = aEliminar; setAEliminar(null); onEliminar(f); }}
        />
      )}
    </div>
  );
}

// El administrador corrige la entrada de un fichaje EN CURSO o lo cierra con la hora de salida que toque
function FichajeAbiertoModal({ empleada, entrada, enDescanso, onClose, onGuardarEntrada, onCerrar }) {
  const [ent, setEnt] = useState(entrada);
  const [sal, setSal] = useState(ahoraPreciso());
  const validoCerrar = enDescanso || sal > ent;
  return (
    <ModalShell title={`Fichaje en curso de ${empleada.nombre}`} onClose={onClose}>
      <div data-fichaje-abierto-modal="1">
        {enDescanso ? (
          <p style={{ marginTop: 0, fontSize: 14 }}>Está en descanso. Su jornada anterior ya está guardada: puedes cerrar la jornada ahora.</p>
        ) : (
          <>
            <Field label="Hora de entrada (con segundos)"><CampoHoraSeg valor={ent} onChange={setEnt} etiqueta="Hora de entrada en curso" /></Field>
            <button type="button" className="btn btn-ghost" disabled={ent === entrada} onClick={() => onGuardarEntrada(ent)}>Guardar la hora de entrada</button>
            <div style={{ borderTop: "1px solid var(--line)", margin: "16px 0" }} />
            <Field label="Cerrar este fichaje: hora de salida (con segundos)"><CampoHoraSeg valor={sal} onChange={setSal} etiqueta="Hora de salida a registrar" /></Field>
            {!validoCerrar && <div role="alert" style={{ fontSize: 12.5, color: "var(--danger)", marginBottom: 8 }}>La salida debe ser posterior a la entrada.</div>}
          </>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn btn-gold" disabled={!validoCerrar} onClick={() => onCerrar(ent, sal)}>{enDescanso ? "Cerrar la jornada" : "Cerrar fichaje"}</button>
        </div>
      </div>
    </ModalShell>
  );
}

// El administrador corrige o añade un fichaje (hora de entrada y de salida)
function FichajeModal({ data, defaults, employees, onClose, onSave }) {
  const editando = Boolean(data);
  const [empleadaId, setEmpleadaId] = useState(data?.empleadaId || employees[0]?.id || "");
  const [fecha, setFecha] = useState(data?.fecha || defaults?.fecha || todayISO());
  const [entrada, setEntrada] = useState(typeof data?.entrada === "number" ? data.entrada : 600);
  const [salida, setSalida] = useState(typeof data?.salida === "number" ? data.salida : 840);
  const valido = Boolean(empleadaId && fecha) && typeof entrada === "number" && typeof salida === "number" && salida > entrada;
  return (
    <ModalShell title={editando ? "Modificar fichaje" : "Añadir fichaje manual"} onClose={onClose}>
      <div data-fichaje-modal="1">
        <Field label="Empleada">
          <select className="input" aria-label="Empleada del fichaje" value={empleadaId} disabled={editando} onChange={(e) => setEmpleadaId(e.target.value)}>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </Field>
        <Field label="Fecha"><CampoFecha valor={fecha} onChange={setFecha} etiqueta="Fecha del fichaje" /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Entrada (con segundos)"><CampoHoraSeg valor={entrada} onChange={setEntrada} etiqueta="Hora de entrada del fichaje" /></Field>
          <Field label="Salida (con segundos)"><CampoHoraSeg valor={salida} onChange={setSalida} etiqueta="Hora de salida del fichaje" /></Field>
        </div>
        {valido ? <div style={{ fontSize: 13, color: "rgba(var(--ink-rgb),0.74)" }}>Son {horasMin(salida - entrada)} trabajadas.</div> : <div role="alert" style={{ fontSize: 12.5, color: "var(--danger)" }}>La salida debe ser posterior a la entrada.</div>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn btn-gold" disabled={!valido} onClick={() => onSave({ empleadaId, fecha, entrada, salida })}>Guardar</button>
        </div>
      </div>
    </ModalShell>
  );
}

// ---------------------------------------------------------------------------
// Configuración
// ---------------------------------------------------------------------------

function ConexionGHL({ employees, appointments, onAsignarCalendario }) {
  const [estado, setEstado] = useState("cargando"); // cargando | ok | error | sinconfigurar
  const [calendarios, setCalendarios] = useState([]);
  const [general, setGeneral] = useState("");
  const [detalle, setDetalle] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [resync, setResync] = useState(null);

  const comprobar = useCallback(async () => {
    setEstado("cargando");
    setDetalle("");
    try {
      const res = await fetch("/api/ghl/diagnostico", { cache: "no-store" });
      const data = await res.json();
      if (data.configurado === false) {
        setEstado("sinconfigurar");
        setDetalle(data.motivo || "");
        return;
      }
      if (!data.ok) {
        setEstado("error");
        setDetalle(data.error || "Error desconocido");
        return;
      }
      setCalendarios(data.calendarios || []);
      setGeneral(data.calendarioGeneral || "");
      setEstado("ok");
    } catch (err) {
      setEstado("error");
      setDetalle(err.message);
    }
  }, []);

  useEffect(() => {
    comprobar();
  }, [comprobar]);

  const staff = employees.filter((e) => e.rol !== "admin");
  const nombreDe = (id) => calendarios.find((c) => c.id === id);
  const futuras = appointments.filter((a) => a.fecha >= todayISO());

  async function reenviar() {
    setConfirmando(false);
    const citas = [...futuras].sort((a, b) => (a.fecha + String(a.inicio).padStart(4, "0")).localeCompare(b.fecha + String(b.inicio).padStart(4, "0")));
    const errores = [];
    setResync({ hechas: 0, total: citas.length, errores: [], terminado: false });
    for (let i = 0; i < citas.length; i++) {
      try {
        const res = await fetch("/api/ghl/sync-cita", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ citaId: citas[i].id }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data || data.ok === false) {
          errores.push(`${citas[i].clienta} (${citas[i].fecha}): ${data?.error || data?.motivo || res.status}`);
        }
      } catch (err) {
        errores.push(`${citas[i].clienta} (${citas[i].fecha}): ${err.message}`);
      }
      setResync({ hechas: i + 1, total: citas.length, errores: [...errores], terminado: false });
      await new Promise((r) => setTimeout(r, 250));
    }
    setResync({ hechas: citas.length, total: citas.length, errores, terminado: true });
  }

  const pastilla = (texto, color) => (
    <span style={{ display: "inline-block", fontSize: 12.5, fontWeight: 600, padding: "3px 10px", borderRadius: 999, color, background: "rgba(var(--ink-rgb),0.06)" }}>{texto}</span>
  );

  return (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ fontSize: 17, marginBottom: 4 }}>Calendario de cada empleada</h2>
      <p style={{ color: "rgba(var(--ink-rgb),0.74)", marginTop: 0, marginBottom: 16, fontSize: 14 }}>
        Aquí eliges, por nombre, a qué calendario de GHL va cada empleada. Así no hay que copiar IDs a mano.
      </p>

      <div className="card" style={{ padding: 18 }}>
        {estado === "cargando" && <div style={{ fontSize: 14 }}>Comprobando la conexión con GHL…</div>}

        {estado === "sinconfigurar" && (
          <div style={{ fontSize: 14, color: "var(--danger)" }}>
            GHL no está configurado: {detalle}. Añade las variables en tu hosting y vuelve a comprobar.
          </div>
        )}

        {estado === "error" && (
          <div style={{ fontSize: 14, color: "var(--danger)" }}>
            No se pudo hablar con GHL: {detalle}
          </div>
        )}

        {estado === "ok" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
              {pastilla(`Conectado · ${calendarios.length} calendario${calendarios.length === 1 ? "" : "s"} en GHL`, "var(--success)")}
              <span style={{ fontSize: 13, color: "rgba(var(--ink-rgb),0.74)" }}>
                Calendario general (respaldo): <strong>{general ? nombreDe(general)?.name || `ID no encontrado en GHL (${general})` : "no configurado"}</strong>
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {staff.map((e) => {
                const asignado = (e.ghlCalendarId || "").trim();
                const cal = asignado ? nombreDe(asignado) : null;
                const comparte = asignado ? staff.filter((o) => o.id !== e.id && (o.ghlCalendarId || "").trim() === asignado) : [];
                let estadoEmp;
                if (!asignado) estadoEmp = { t: `Sin calendario propio → sus citas van al GENERAL${general ? ` («${nombreDe(general)?.name || "?"}»)` : ""}`, c: "var(--danger)" };
                else if (!cal) estadoEmp = { t: "Este ID no existe en GHL — elige uno de la lista", c: "var(--danger)" };
                else if (comparte.length) estadoEmp = { t: `Comparte calendario con ${comparte.map((o) => o.nombre).join(", ")} — pueden chocar a la misma hora`, c: "var(--danger)" };
                else if (!cal.activo) estadoEmp = { t: "El calendario está en borrador (inactivo) en GHL", c: "var(--danger)" };
                else estadoEmp = { t: `✓ Las citas de ${e.nombre} van a «${cal.name}»`, c: "var(--success)" };

                return (
                  <div key={e.id} style={{ display: "grid", gridTemplateColumns: "minmax(110px, 150px) 1fr", gap: 12, alignItems: "start", paddingBottom: 12, borderBottom: "1px solid var(--line)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 46 }}>
                      <Avatar empleada={e} size={30} />
                      <span style={{ fontWeight: 600, fontSize: 14.5 }}>{e.nombre}</span>
                    </div>
                    <div>
                      <select
                        className="input"
                        aria-label={`Calendario de GHL de ${e.nombre}`}
                        value={asignado}
                        onChange={(ev) => onAsignarCalendario(e.id, ev.target.value)}
                      >
                        <option value="">— Sin calendario propio (usa el general) —</option>
                        {asignado && !cal && <option value={asignado}>⚠ ID desconocido ({asignado.slice(0, 8)}…)</option>}
                        {calendarios.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}{c.activo ? "" : " (borrador)"}</option>
                        ))}
                      </select>
                      <div style={{ fontSize: 13, marginTop: 6, color: estadoEmp.c, fontWeight: 500 }}>{estadoEmp.t}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <details style={{ marginTop: 14 }}>
              <summary style={{ cursor: "pointer", fontSize: 13.5, fontWeight: 500 }}>Ver todos los calendarios de GHL (nombre, tipo e ID)</summary>
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                {calendarios.map((c) => (
                  <div key={c.id} style={{ fontSize: 13 }}>
                    <strong>{c.name}</strong> · {c.tipo || "sin tipo"}{c.miembros ? ` · ${c.miembros} miembro${c.miembros === 1 ? "" : "s"}` : ""}{c.activo ? "" : " · borrador"}
                    <div style={{ fontFamily: "monospace", fontSize: 12, color: "rgba(var(--ink-rgb),0.74)", wordBreak: "break-all" }}>{c.id}</div>
                  </div>
                ))}
              </div>
            </details>
          </>
        )}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
          <button type="button" className="btn btn-ghost" onClick={comprobar} disabled={estado === "cargando"}>Volver a comprobar</button>
          {estado === "ok" && !confirmando && !resync?.hechas && (
            <button type="button" className="btn btn-gold" onClick={() => setConfirmando(true)} disabled={futuras.length === 0}>
              Reenviar a GHL las citas desde hoy ({futuras.length})
            </button>
          )}
        </div>

        {confirmando && (
          <div style={{ marginTop: 12, padding: 14, borderRadius: 14, background: "rgba(var(--ink-rgb),0.05)", fontSize: 13.5 }}>
            Se volverán a enviar {futuras.length} cita{futuras.length === 1 ? "" : "s"} para colocarlas en el calendario que ahora tiene cada empleada.
            Las que estuvieran en otro calendario se moverán (se borra la de GHL y se crea en el correcto).
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button type="button" className="btn btn-gold" onClick={reenviar}>Sí, reenviar</button>
              <button type="button" className="btn btn-ghost" onClick={() => setConfirmando(false)}>Cancelar</button>
            </div>
          </div>
        )}

        {resync && (
          <div style={{ marginTop: 12, fontSize: 13.5 }} role="status">
            {resync.terminado ? "Terminado: " : "Enviando… "}
            {resync.hechas}/{resync.total} citas procesadas
            {resync.terminado && (resync.errores.length === 0 ? " · todas correctas ✓" : ` · ${resync.errores.length} con error`)}
            {resync.errores.length > 0 && (
              <ul style={{ margin: "8px 0 0", paddingLeft: 18, color: "var(--danger)" }}>
                {resync.errores.slice(0, 8).map((er, i) => <li key={i}>{er}</li>)}
                {resync.errores.length > 8 && <li>… y {resync.errores.length - 8} más</li>}
              </ul>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

function Configuracion({ metodosPago, onNewMetodo, onEditMetodo, onToggleMetodo }) {
  return (
    <div>
      <HeaderConBoton title="Métodos de pago" subtitle="Efectivo, tarjeta y Bizum vienen creados por defecto. Puedes añadir más o desactivar los que no uses." onNew={onNewMetodo} newLabel="Nuevo método" />

      <div className="card" style={{ overflowX: "auto", marginBottom: 24 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
          <thead>
            <tr style={{ background: "rgba(var(--ink-rgb),0.04)", textAlign: "left" }}>
              {["Método", "Estado", ""].map((h) => (
                <th key={h} style={{ padding: "10px 14px", fontWeight: 500, color: "rgba(var(--ink-rgb),0.68)", fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metodosPago.map((m) => (
              <tr key={m.id} style={{ borderTop: "1px solid var(--line)", opacity: m.activo ? 1 : 0.5 }}>
                <td style={{ padding: "10px 14px", fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}><CreditCard size={14} /> {m.nombre}</td>
                <td style={{ padding: "10px 14px" }}>{m.activo ? "Activo" : "Inactivo"}</td>
                <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                  <button type="button" className="btn-ghost" style={{ border: "none", padding: 4 }} onClick={() => onEditMetodo(m)}><Pencil size={14} /></button>
                  <button type="button" className="btn-ghost" style={{ border: "none", padding: 4 }} onClick={() => onToggleMetodo(m.id)}>
                    {m.activo ? <X size={14} /> : <Check size={14} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

function MetodoPagoModal({ data, onClose, onSave }) {
  const [form, setForm] = useState(data || { nombre: "", activo: true });
  return (
    <ModalShell title={data ? "Editar método de pago" : "Nuevo método de pago"} onClose={onClose}>
      <Field label="Nombre"><input className="input" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></Field>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, marginTop: 4 }}>
        <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />
        Activo
      </label>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button type="button" className="btn btn-gold" onClick={() => onSave(form)} disabled={!form.nombre.trim()}>Guardar</button>
      </div>
    </ModalShell>
  );
}

// ---------------------------------------------------------------------------
// Piezas reutilizables: Modal, Field, Header
// ---------------------------------------------------------------------------

// Pila de ventanas abiertas: con varias una encima de otra, Escape solo cierra la de arriba
const pilaModales = [];

// `pagina`: en vez de un popup centrado con fondo oscuro, se abre como una PÁGINA integrada en la zona de contenido
// (con el menú y la barra superior a la vista), mucho más ancha. Se usa para añadir una cita, una venta o un horario no disponible.
// Mientras hay una página integrada abierta, la página de detrás no se desplaza: así solo se ve UNA barra de desplazamiento
// (la de la propia página) y no dos juntas, que confundían. Se cuenta cuántas hay abiertas para restaurar solo al cerrar la última.
let paginasAbiertas = 0;
let desplazamientoPrevio = null;
function bloquearDesplazamientoDeFondo(bloquear) {
  if (typeof document === "undefined") return;
  const h = document.documentElement, b = document.body;
  if (bloquear) {
    if (paginasAbiertas === 0) { desplazamientoPrevio = [h.style.overflow, b.style.overflow]; h.style.overflow = "hidden"; b.style.overflow = "hidden"; }
    paginasAbiertas++;
  } else {
    paginasAbiertas = Math.max(0, paginasAbiertas - 1);
    if (paginasAbiertas === 0 && desplazamientoPrevio) { h.style.overflow = desplazamientoPrevio[0]; b.style.overflow = desplazamientoPrevio[1]; desplazamientoPrevio = null; }
  }
}

function ModalShell({ title, onClose, children, ancho, nivel, pagina }) {
  useEffect(() => {
    if (!pagina) return undefined;
    bloquearDesplazamientoDeFondo(true);
    return () => bloquearDesplazamientoDeFondo(false);
  }, [pagina]);
  const miId = React.useRef({});
  const cierreRef = React.useRef(onClose);
  cierreRef.current = onClose;
  useEffect(() => {
    const id = miId.current;
    pilaModales.push(id);
    function onKey(e) {
      if (e.key === "Escape" && pilaModales[pilaModales.length - 1] === id) cierreRef.current();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      const i = pilaModales.indexOf(id);
      if (i >= 0) pilaModales.splice(i, 1);
    };
  }, []);

  if (pagina) {
    return (
      <div
        className="panel-integrado" data-panel-integrado="1"
        style={{ position: "fixed", top: "var(--topbar-h, 0px)", left: "var(--sidebar-w, 0px)", right: 0, bottom: 0, zIndex: 28 + (nivel || 0) * 5, overflowY: "auto", background: "var(--bg)", padding: "18px clamp(12px, 3vw, 36px) 90px" }}
      >
        <div role="dialog" aria-modal="false" aria-label={title} style={{ maxWidth: ancho || 1080, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <button type="button" onClick={onClose} aria-label="Volver" title="Volver (Esc)" className="btn btn-ghost" style={{ minHeight: 40, padding: "6px 14px" }}>
              <ChevronLeft size={17} aria-hidden="true" /> Volver
            </button>
            <h2 style={{ fontSize: 22, margin: 0 }}>{title}</h2>
          </div>
          <div className="card" style={{ padding: "22px clamp(14px, 2.4vw, 32px)", background: "var(--surface)", borderRadius: 22 }}>{children}</div>
        </div>
      </div>
    );
  }
  return (
    <div
      className="modal-overlay"
      style={{ position: "fixed", inset: 0, background: "rgba(18,15,12,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 + (nivel || 0) * 5, padding: 16 }}
    >
      <div
        className="card modal-card"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{ width: ancho || 460, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto", padding: 24, background: "var(--surface)", borderRadius: 22 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, gap: 10 }}>
          <h2 style={{ fontSize: 21 }}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            title="Cerrar (Esc)"
            style={{ background: "rgba(var(--ink-rgb),0.06)", border: "none", width: 38, height: 38, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label className="field-label">{label}</label>
      {children}
    </div>
  );
}

function HeaderConBoton({ title, subtitle, onNew, newLabel }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
      <div>
        <h1 style={{ fontSize: 26, marginBottom: 4 }}>{title}</h1>
        <p style={{ color: "rgba(var(--ink-rgb),0.68)", margin: 0, fontSize: 14 }}>{subtitle}</p>
      </div>
      {onNew && (
        <button type="button" className="btn btn-gold" onClick={onNew}><Plus size={15} /> {newLabel}</button>
      )}
    </div>
  );
}
