// Horario de cada empleada en un día concreto (horario fijo o rotativo, días libres, ausencias y días sueltos). Se usa en la agenda y,
// en el servidor, para calcular los huecos que ven las clientas al reservar online: mismo cálculo en los dos sitios.
export const DAY_START = 10 * 60; // 10:00 en minutos: horario habitual por defecto
export const DAY_END = 21 * 60; // 21:00 en minutos

const DIA_SEMANA_KEYS = ["dom", "lun", "mar", "mie", "jue", "vie", "sab"];

export function diaSemanaKey(fechaStr) {
  const d = new Date(fechaStr + "T00:00:00");
  return DIA_SEMANA_KEYS[d.getDay()];
}

export function minutosDesdeHHMM(hhmm) {
  if (!hhmm || typeof hhmm !== "string" || !hhmm.includes(":")) return null;
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

// ¿Cae esta fecha dentro de alguna ausencia (vacaciones, baja, asunto
// propio...) registrada para esta empleada?
export function ausenciaEnFecha(empleada, fechaStr) {
  return (empleada.ausencias || []).find((a) => fechaStr >= a.inicio && fechaStr <= a.fin) || null;
}

export function tieneCitasEseDia(empleada, fechaStr, appointments) {
  return (appointments || []).some((a) => a.empleadaId === empleada.id && a.fecha === fechaStr);
}

// Índice (0-based) de qué semana del ciclo rotativo corresponde a una
// fecha, a partir de la fecha de referencia (un lunes) donde empieza
// la semana 0 del ciclo.
export function indiceSemanaRotativa(turnoInicio, fechaStr, totalSemanas) {
  if (!turnoInicio || !totalSemanas) return 0;
  const inicio = new Date(turnoInicio + "T00:00:00");
  const fecha = new Date(fechaStr + "T00:00:00");
  const dias = Math.floor((fecha - inicio) / 86400000);
  const semanas = Math.floor(dias / 7);
  const idx = ((semanas % totalSemanas) + totalSemanas) % totalSemanas; // nunca negativo
  return idx;
}

// Horario de una empleada en un día concreto: null si ese día no trabaja
// (ausencia registrada sin citas pendientes, día libre marcado, o el
// patrón de esa semana la tiene inactiva ese día). Si un día está de
// ausencia pero todavía tiene citas puestas, se mantiene visible con su
// horario normal hasta que esas citas se quiten o se muevan — para no
// perder de vista una cita ya confirmada al marcar vacaciones encima.
// Si no hay hora de inicio/fin guardada para ese día, se asume que
// trabaja el rango completo mostrado.
export function excepcionEnFecha(empleada, fechaStr) {
  return (empleada.excepciones || []).find((e) => e.fecha === fechaStr) || null;
}

export function horarioDelDia(empleada, fechaStr, appointments) {
  const excepcion = excepcionEnFecha(empleada, fechaStr);
  if (excepcion) {
    if (!excepcion.activo) {
      if (tieneCitasEseDia(empleada, fechaStr, appointments)) return { inicio: DAY_START, fin: DAY_END };
      return null;
    }
    const inicio = minutosDesdeHHMM(excepcion.inicio) ?? DAY_START;
    const fin = minutosDesdeHHMM(excepcion.fin) ?? DAY_END;
    return { inicio, fin };
  }

  const ausencia = ausenciaEnFecha(empleada, fechaStr);
  if (ausencia && !tieneCitasEseDia(empleada, fechaStr, appointments)) return null;

  const diaKey = diaSemanaKey(fechaStr);

  if (empleada.horarioTipo === "rotativo" && empleada.turnos?.length) {
    const idx = indiceSemanaRotativa(empleada.turnoInicio, fechaStr, empleada.turnos.length);
    const patron = empleada.turnos[idx];
    const h = patron?.[diaKey];
    if (!h || !h.activo) {
      // Si sigue teniendo citas ese día, no la ocultamos aunque su patrón
      // diga que libra, por la misma razón que con las ausencias.
      if (tieneCitasEseDia(empleada, fechaStr, appointments)) return { inicio: DAY_START, fin: DAY_END };
      return null;
    }
    const inicio = minutosDesdeHHMM(h.inicio) ?? DAY_START;
    const fin = minutosDesdeHHMM(h.fin) ?? DAY_END;
    return { inicio, fin };
  }

  if ((empleada.diasLibres || []).includes(diaKey)) {
    if (tieneCitasEseDia(empleada, fechaStr, appointments)) return { inicio: DAY_START, fin: DAY_END };
    return null;
  }
  const h = empleada.horario?.[diaKey];
  const inicio = minutosDesdeHHMM(h?.inicio) ?? DAY_START;
  const fin = minutosDesdeHHMM(h?.fin) ?? DAY_END;
  return { inicio, fin };
}

export function trabajaEseDia(empleada, fechaStr, appointments) {
  return horarioDelDia(empleada, fechaStr, appointments) != null;
}
