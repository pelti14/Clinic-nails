// El circulito de «citas nuevas» del menú Agenda: cuenta las citas que han entrado (reserva online, bot de IA, GHL u otra persona) desde
// la última vez que abriste la Agenda. Para no depender del reloj de cada móvil, la marca es la fecha de creación (la del servidor) de la
// cita más reciente que ya habías visto. Funciones puras (sin pantalla ni red).

const ms = (t) => { const n = Date.parse(t || ""); return Number.isFinite(n) ? n : 0; };

// La cita más reciente que hay ahora mismo (lo que queda «visto» al abrir la Agenda)
export function marcaVistas(citas = []) {
  let max = 0, iso = "";
  for (const c of citas) { const n = ms(c.creadoEn); if (n > max) { max = n; iso = c.creadoEn; } }
  return iso;
}

// Las nuevas desde la marca: no las que has creado tú ni las canceladas. Sin marca, ninguna (la primera vez se empieza a contar desde ahora).
export function citasNuevas(citas = [], { marca, usuarioId } = {}) {
  const desde = ms(marca);
  if (!desde) return [];
  return citas.filter((c) => ms(c.creadoEn) > desde && c.asistencia !== "cancelada" && (!usuarioId || c.creadoPor !== usuarioId));
}

export const claveMarca = (usuarioId) => `cnb_agenda_vista_${usuarioId || "anon"}`;
