// Avisos para las empleadas: un popup al entrar con su código («recuerda fichar»…). Se puede repetir todos los días o salir solo una
// vez, para todas o para algunas, solo si todavía no han fichado, con fechas de inicio y fin. Funciones puras (sin pantalla ni base de datos).

export const FRECUENCIAS = { diaria: "Todos los días", una_vez: "Una sola vez" };
export const DIAS_SEMANA = [{ n: 1, corto: "L", largo: "Lunes" }, { n: 2, corto: "M", largo: "Martes" }, { n: 3, corto: "X", largo: "Miércoles" }, { n: 4, corto: "J", largo: "Jueves" }, { n: 5, corto: "V", largo: "Viernes" }, { n: 6, corto: "S", largo: "Sábado" }, { n: 0, corto: "D", largo: "Domingo" }];
export const diaDeSemana = (iso) => new Date(`${iso}T12:00:00`).getDay();

export const plantillaRecuerdaFichar = () => ({
  titulo: "Recuerda fichar",
  mensaje: "Todavía no has fichado hoy. No te olvides de fichar tu entrada.",
  destinatarios: [],
  frecuencia: "diaria",
  soloSiNoFicho: true,
  dias: [],
  desde: "",
  hasta: "",
  activo: true,
});

// ¿Este aviso está en vigor hoy? (activo, dentro de sus fechas y, si es diario y se limitó a ciertos días, uno de esos días)
export function avisoVigente(aviso, hoy) {
  if (aviso.activo === false) return false;
  if (aviso.desde && hoy < aviso.desde) return false;
  if (aviso.hasta && hoy > aviso.hasta) return false;
  if (aviso.frecuencia !== "una_vez" && (aviso.dias || []).length > 0 && !aviso.dias.includes(diaDeSemana(hoy))) return false;
  return true;
}
// Sin destinatarios = todas las empleadas
export const aplicaA = (aviso, empleadaId) => (aviso.destinatarios || []).length === 0 || aviso.destinatarios.includes(empleadaId);

// Los avisos que le tocan ver ahora a una empleada, en el orden en que se crearon.
// Un aviso diario sale una vez al día (aunque vuelva a entrar con su código); uno «una sola vez», una única vez en total.
export function avisosParaMostrar({ avisos, vistos, empleadaId, hoy, haFichadoHoy }) {
  return avisos.filter((a) => {
    if (!avisoVigente(a, hoy) || !aplicaA(a, empleadaId)) return false;
    if (a.soloSiNoFicho && haFichadoHoy) return false;
    const suyos = vistos.filter((v) => v.avisoId === a.id && v.empleadaId === empleadaId);
    return a.frecuencia === "una_vez" ? suyos.length === 0 : !suyos.some((v) => v.fecha === hoy);
  });
}

// La fila que se guarda al cerrar el aviso (id fijo: marcarlo dos veces el mismo día no duplica nada)
export const filaVisto = ({ avisoId, empleadaId, fecha }) => ({ id: `${avisoId}_${empleadaId}_${fecha}`, avisoId, empleadaId, fecha });

// Resumen legible de un aviso (para la lista del administrador)
export function resumenAviso(a, empleadas = []) {
  const para = (a.destinatarios || []).length === 0 ? "Todas las empleadas" : (a.destinatarios || []).map((id) => empleadas.find((e) => e.id === id)?.nombre || "—").join(", ");
  const cuando = a.frecuencia === "una_vez" ? "Una sola vez" : (a.dias || []).length ? `Cada ${DIAS_SEMANA.filter((d) => a.dias.includes(d.n)).map((d) => d.largo.toLowerCase()).join(", ")}` : "Todos los días";
  const extra = [a.soloSiNoFicho ? "solo si no ha fichado" : "", a.desde ? `desde ${a.desde}` : "", a.hasta ? `hasta ${a.hasta}` : ""].filter(Boolean);
  return { para, cuando, extra: extra.join(" · ") };
}
