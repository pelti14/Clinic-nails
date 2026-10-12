// Utilidades de agenda sin dependencias de React ni del navegador, compartidas
// por el servidor (importación desde GHL) y probables con tests.

export function overlaps(startA, durA, startB, durB) {
  return startA < startB + durB && startB < startA + durA;
}

// Elige la cabina de una cita SIN bloquearla: la preferida si está libre; si no,
// otra compatible que esté libre; y si todas están ocupadas, se comparte
// (se permite solapar citas). Devuelve null solo si no hay ninguna cabina activa.
export function elegirCabina(servicio, cabins, citasMismoDia, inicio, duracion, preferidaId) {
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

// ---------------------------------------------------------------------------
// Texto y teléfonos
// ---------------------------------------------------------------------------

export function normalizarTexto(s) {
  return (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export const soloDigitos = (s) => (s || "").replace(/\D/g, "");

// Clave para comparar teléfonos aunque vengan con +34, espacios o guiones:
// los 9 últimos dígitos.
export function telefonoClave(s) {
  const d = soloDigitos(s);
  return d.length >= 9 ? d.slice(-9) : "";
}

// ---------------------------------------------------------------------------
// Fechas de GHL → hora de Madrid
// ---------------------------------------------------------------------------

// Desfase de Madrid (en minutos) en un instante concreto
export function offsetMadridMin(ms) {
  const partes = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Madrid", timeZoneName: "shortOffset" }).formatToParts(new Date(ms));
  const tz = partes.find((p) => p.type === "timeZoneName")?.value || "GMT+1";
  const m = tz.match(/GMT([+-]\d+)(?::(\d+))?/);
  if (!m) return 60;
  const h = parseInt(m[1], 10);
  return h * 60 + (h < 0 ? -1 : 1) * (m[2] ? parseInt(m[2], 10) : 0);
}

// Acepta lo que pueda devolver GHL: milisegundos, segundos, ISO con zona
// ("2026-10-08T18:00:00+02:00", "...Z") o una hora sin zona
// ("2026-10-08 18:00:00"), que se interpreta como hora de Madrid.
export function parsearMomentoGHL(v) {
  if (v == null || v === "") return null;
  if (typeof v === "number") return v < 1e11 ? v * 1000 : v;
  const s = String(v).trim();
  if (/^\d{9,13}$/.test(s)) return s.length <= 10 ? Number(s) * 1000 : Number(s);

  if (/\d{4}-\d{2}-\d{2}/.test(s) && /(Z|[+-]\d{2}:?\d{2})$/i.test(s)) {
    const t = Date.parse(s.replace(" ", "T"));
    return Number.isNaN(t) ? null : t;
  }

  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return null;
  const [, Y, Mo, D, h, mi, se] = m;
  const comoUTC = Date.UTC(+Y, +Mo - 1, +D, +h, +mi, +(se || 0));
  const off1 = offsetMadridMin(comoUTC);
  let ms = comoUTC - off1 * 60000;
  const off2 = offsetMadridMin(ms); // por si justo cruza el cambio de hora
  if (off2 !== off1) ms = comoUTC - off2 * 60000;
  return ms;
}

// Instante → { fecha: "YYYY-MM-DD", minutos } en hora de Madrid
export function fechaYMinutosMadrid(ms) {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(ms));
  const g = (t) => partes.find((p) => p.type === t)?.value;
  return { fecha: `${g("year")}-${g("month")}-${g("day")}`, minutos: parseInt(g("hour"), 10) * 60 + parseInt(g("minute"), 10) };
}

// ---------------------------------------------------------------------------
// Servicio de una reserva que viene de fuera (solo tenemos el título del evento)
// ---------------------------------------------------------------------------

const PALABRAS_VACIAS = new Set(["cita", "reserva", "reservada", "para", "con", "por", "del", "las", "los", "una", "sesion", "sesiones", "tratamiento", "servicio", "nueva", "nuevo", "clinic", "nails", "beauty", "online", "web", "agendada"]);
const palabrasDe = (txt, min = 4) => normalizarTexto(txt).split(/[^a-z0-9]+/).filter((w) => w.length >= min && !PALABRAS_VACIAS.has(w));

// Qué servicio es una reserva de GHL según su título:
//  1) el título contiene el nombre completo del servicio;
//  2) si no, por palabras («Manicura» encuentra «Manicura semipermanente»; «Uñas» encuentra los de esa categoría);
//  3) si no hay forma de saberlo, uno de la empleada POR DEFECTO (porTitulo: false → hay que revisarlo).
export function elegirServicioPorTitulo(titulo, servicios, empleada) {
  const activos = servicios.filter((s) => s.activo);
  const t = normalizarTexto(titulo);
  const contenidos = activos.filter((s) => s.nombre && t.includes(normalizarTexto(s.nombre)));
  if (contenidos.length) {
    // gana el nombre más largo; si hay varios iguales (el mismo nombre en dos categorías), el de la categoría que nombra el texto
    // («Relleno 2 semanas (Extension de pestañas)») y, si no, el que hace esa empleada
    const largo = Math.max(...contenidos.map((s) => s.nombre.length));
    const empatados = contenidos.filter((s) => s.nombre.length === largo);
    const puntos = (s) => (s.categoria && t.includes(normalizarTexto(s.categoria)) ? 2 : 0) + ((s.empleadas || []).includes(empleada?.id) ? 1 : 0);
    const porNombre = [...empatados].sort((a, b) => puntos(b) - puntos(a))[0];
    return { servicio: porNombre, porTitulo: true };
  }
  const delEquipo = activos.find((s) => (s.empleadas || []).includes(empleada?.id));

  const pt = new Set(palabrasDe(titulo));
  if (pt.size) {
    const puntuados = activos
      .map((s) => {
        const ps = new Set([...palabrasDe(s.nombre), ...palabrasDe(s.categoria || "", 3)]);
        let n = 0;
        ps.forEach((w) => { if (pt.has(w)) n++; });
        return { s, n };
      })
      .filter((x) => x.n > 0);
    if (puntuados.length) {
      const mejor = Math.max(...puntuados.map((x) => x.n));
      const empatados = puntuados.filter((x) => x.n === mejor).map((x) => x.s);
      const delEmpate = empatados.filter((s) => (s.empleadas || []).includes(empleada?.id));
      const elegido = delEmpate[0] || empatados[0];
      // si hay más de un servicio posible, se elige el mejor pero se pide revisarlo
      return { servicio: elegido, porTitulo: empatados.length === 1 || delEmpate.length === 1 };
    }
  }
  return { servicio: delEquipo || activos[0] || null, porTitulo: false };
}

// Las citas importadas con servicio dudoso llevan esta frase en la nota
export const MARCA_REVISAR = "Revisa el servicio";
// Quita la frase «Revisa el servicio: …se ha puesto uno por defecto.» (la del importador tiene dos versiones: con y sin el valor del campo «Servicio»)
export const quitarMarcaRevisar = (notas) => String(notas || "").replace(/\s*Revisa el servicio:.*?se ha puesto uno por defecto\./s, "").trim();
export const pedidoOriginal = (notas) => (String(notas || "").match(/«([^»]*)»/) || [])[1] || "";

// Avisos al poner una cita en un hueco (mover, arrastrar o reprogramar). NO bloquean: se puede dejar en cualquier sitio, pero se avisa.
// `horario` = { inicio, fin } del día de esa empleada, o null si ese día no trabaja. Una lista vacía = el hueco está libre.
export function avisosDeMovimiento({ cita, empleada, servicio, fecha, inicio, citas = [], bloqueos = [], horario }) {
  const avisos = [];
  if (servicio && !(servicio.empleadas || []).includes(empleada.id)) avisos.push(`${empleada.nombre} no tiene asignado «${servicio.nombre}»`);
  if (!horario || inicio < horario.inicio || inicio + cita.duracion > horario.fin) avisos.push(`queda fuera del horario de ${empleada.nombre}`);
  // las canceladas no ocupan el hueco
  if (citas.some((a) => a.fecha === fecha && a.id !== cita.id && a.empleadaId === empleada.id && a.asistencia !== "cancelada" && overlaps(a.inicio, a.duracion, inicio, cita.duracion))) avisos.push("se solapa con otra cita");
  const bloqueo = bloqueos.find((b) => b.fecha === fecha && b.empleadaId === empleada.id && overlaps(b.inicio, b.duracion, inicio, cita.duracion));
  if (bloqueo) avisos.push(`coincide con un horario no disponible${bloqueo.motivo ? ` (${bloqueo.motivo})` : ""}`);
  return avisos;
}

