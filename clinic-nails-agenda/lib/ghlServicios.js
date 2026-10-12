// Cuerpo de los calendarios que la app crea en GHL (el interno de cada empleada). Sin red: función pura, probada aparte.

// Cuerpo para crear (nuevo: true) o actualizar un calendario. Si se manda un horario, GHL numera los días de 1 (lunes) a 7 (domingo). `minimo` solo manda lo imprescindible
// (se usa si GHL rechaza algún campo de la versión completa).
export function cuerpoCalendarioServicio({ locationId, nombre, descripcion = "", duracion, usuarios = [], openHours = [], activo = true, nuevo = true, minimo = false, sinHorario = false }) {
  const base = {
    name: nombre,
    isActive: activo,
    calendarType: "round_robin",
    eventType: "RoundRobin_OptimizeForAvailability",
    teamMembers: usuarios.map((userId, i) => ({ userId, priority: 0.5, isPrimary: i === 0, selected: true })),
    slotDuration: Number(duracion) || 60,
    slotDurationUnit: "mins",
  };
  if (nuevo) base.locationId = locationId;
  if (minimo) return base;
  return {
    ...base,
    description: descripcion,
    slotInterval: 15,
    slotIntervalUnit: "mins",
    slotBuffer: 0,
    preBuffer: 0,
    autoConfirm: true,
    allowReschedule: true,
    allowCancellation: true,
    // sinHorario: se manda openHours vacío a propósito (calendario interno: nadie puede reservar en él)
    ...(openHours.length ? { openHours } : sinHorario ? { openHours: [] } : {}),
  };
}
