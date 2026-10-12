// Lógica de fichaje sin pantalla (se puede probar entera).
//
// Estados de una empleada en el día:
//   fuera      → no hay fichaje abierto
//   dentro     → trabajando (hay fichaje abierto)
//   descanso   → hay fichaje abierto pero marcado en descanso
//
// Acciones:
//   entrada  (fuera → dentro)        salida   (dentro/descanso → fuera)
//   descanso (dentro → descanso)     volver   (descanso → dentro)
// Cada tramo trabajado se guarda como un fichaje (entrada → salida), así las horas
// del descanso nunca cuentan como trabajadas.

export function estadoFichaje(empleadaId, activos, descansos) {
  if (activos[empleadaId] == null) return "fuera";
  return descansos[empleadaId] != null ? "descanso" : "dentro";
}

// Qué botones se muestran en la cabecera de cada empleada
export function botonesFichaje(estado, { fichoHoy = false } = {}) {
  if (estado === "fuera") return { principal: { accion: "entrada", texto: "Fichar entrada" }, salida: { accion: "salida", texto: "Fichar salida", activo: false } };
  if (estado === "dentro") return { principal: { accion: "descanso", texto: "Descanso" }, salida: { accion: "salida", texto: "Fichar salida", activo: true } };
  return { principal: { accion: "volver", texto: "Fichar entrada" }, salida: { accion: "salida", texto: "Fichar salida", activo: true } };
}

// Qué operaciones hay que hacer en la base de datos para una acción.
// Devuelve { fichaje?: {entrada, salida}, activo: {...} | null (cerrar) , aviso }
export function planDeFichaje(accion, estado, { entradaActiva, ahora }) {
  const tramo = () => (entradaActiva != null && ahora > entradaActiva ? { entrada: entradaActiva, salida: ahora } : null);
  if (accion === "entrada" && estado === "fuera") return { activo: { horaEntrada: ahora }, aviso: "Entrada fichada" };
  if (accion === "descanso" && estado === "dentro") return { fichaje: tramo(), activo: { horaEntrada: entradaActiva, extra: { enDescanso: true, descansoDesde: ahora } }, aviso: "Descanso iniciado" };
  if (accion === "volver" && estado === "descanso") return { activo: { horaEntrada: ahora, extra: { enDescanso: false } }, aviso: "De vuelta del descanso" };
  if (accion === "salida" && estado === "dentro") return { fichaje: tramo(), activo: null, aviso: "Salida fichada" };
  if (accion === "salida" && estado === "descanso") return { activo: null, aviso: "Salida fichada" }; // el tramo ya se guardó al iniciar el descanso
  return null; // acción que no corresponde al estado
}

// Aviso al entrar con el código:
//  · «entrada»: está en su turno, aún no ha fichado nada hoy
//  · «salida»: ya pasó su hora de salida y sigue con el fichaje abierto
// (siempre es un aviso: nunca impide usar la app)
export function alertaDeFichaje({ horario, ahora, dentro, fichoHoy }) {
  if (!horario) return null;
  if (!dentro && !fichoHoy && ahora >= horario.inicio && ahora < horario.fin) return "entrada";
  if (dentro && ahora >= horario.fin) return "salida";
  return null;
}

// ---------------------------------------------------------------------------
// Resumen del día de una empleada: horas, descanso e incidencias (llegó tarde, salió antes / a deshora…)
// ---------------------------------------------------------------------------
export const TOLERANCIA_MIN = 5; // hasta 5 min de margen sobre su horario no se considera incidencia

export function resumenDiaFichaje({ horario, tramos = [], abierto = null, ahora = 0, esHoy = false, diaPasado = false, tolerancia = TOLERANCIA_MIN }) {
  const orden = [...tramos].sort((a, b) => a.entrada - b.entrada);
  const entrada = orden.length ? orden[0].entrada : abierto ? abierto.entrada : null;
  const salida = !abierto && orden.length ? Math.max(...orden.map((t) => t.salida)) : null;

  let trabajado = orden.reduce((s, t) => s + Math.max(0, t.salida - t.entrada), 0);
  if (abierto && !abierto.enDescanso && esHoy) trabajado += Math.max(0, ahora - abierto.entrada);

  // descanso = huecos entre tramos (y el descanso en curso si lo hay)
  let descanso = 0;
  for (let i = 1; i < orden.length; i++) descanso += Math.max(0, orden[i].entrada - orden[i - 1].salida);
  if (abierto && orden.length) {
    const finUltimo = orden[orden.length - 1].salida;
    descanso += abierto.enDescanso ? (esHoy ? Math.max(0, ahora - finUltimo) : 0) : Math.max(0, abierto.entrada - finUltimo);
  }

  const incidencias = [];
  if (horario && entrada != null) {
    const tarde = entrada - horario.inicio;
    if (tarde > tolerancia) incidencias.push({ tipo: "tarde", minutos: tarde });
  }
  if (horario && salida != null) {
    const antes = horario.fin - salida;
    const extra = salida - horario.fin;
    if (antes > tolerancia) incidencias.push({ tipo: "antes", minutos: antes });
    if (extra > tolerancia) incidencias.push({ tipo: "extra", minutos: extra });
  }
  const sinFichar = Boolean(horario) && !orden.length && !abierto && (diaPasado || (esHoy && ahora >= horario.fin));
  if (sinFichar) incidencias.push({ tipo: "sin_fichar" });
  if (horario && abierto && esHoy && ahora >= horario.fin + tolerancia) incidencias.push({ tipo: "sin_salida" });

  const estado = abierto ? (abierto.enDescanso ? "descanso" : "dentro") : orden.length ? "completo" : sinFichar ? "sin_fichar" : "pendiente";
  return { entrada, salida, trabajado, descanso, incidencias, estado };
}

// 12 → «12 min»; 454,7333 → «7 h 34 min 44 s»; 0,5 → «30 s» (nunca decimales)
export function tiempoCorto(min) {
  const t = Math.round(Math.max(0, min) * 60);
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
  const partes = [];
  if (h) partes.push(`${h} h`);
  if (m || (h && s)) partes.push(`${m} min`);
  if (s || !partes.length) partes.push(`${s} s`);
  return partes.join(" ");
}

export const textoIncidencia = (i) =>
  ({
    tarde: `Llegó ${tiempoCorto(i.minutos)} tarde`,
    antes: `Salió ${tiempoCorto(i.minutos)} antes`,
    extra: `Salió ${tiempoCorto(i.minutos)} después de su hora (horas extra)`,
    sin_fichar: "No fichó",
    sin_salida: "Sigue sin fichar la salida",
  })[i.tipo];

// ---------------------------------------------------------------------------
// Tiempo con SEGUNDOS: las horas se guardan como minutos con decimales (10:07:30 = 607,5)
// ---------------------------------------------------------------------------
const dosd = (n) => String(n).padStart(2, "0");
export function tiempoLabel(min) {
  if (typeof min !== "number" || Number.isNaN(min)) return "—";
  const t = Math.round(min * 60);
  return `${dosd(Math.floor(t / 3600))}:${dosd(Math.floor((t % 3600) / 60))}:${dosd(t % 60)}`;
}
export function duracionLabel(min) {
  const t = Math.round(Math.max(0, min) * 60);
  return `${Math.floor(t / 3600)}h ${dosd(Math.floor((t % 3600) / 60))}m ${dosd(t % 60)}s`;
}
// "10:07" o "10:07:30" → minutos con decimales (null si no es válida)
export function minutosDesdeHora(txt) {
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(String(txt || "").trim());
  if (!m) return null;
  const [h, mi, se] = [Number(m[1]), Number(m[2]), Number(m[3] || 0)];
  if (h > 23 || mi > 59 || se > 59) return null;
  return h * 60 + mi + se / 60;
}
export function ahoraPreciso(fecha = new Date()) {
  return fecha.getHours() * 60 + fecha.getMinutes() + fecha.getSeconds() / 60;
}

