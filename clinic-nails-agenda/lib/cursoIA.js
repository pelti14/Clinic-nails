// Crear una clase (con su test) con IA: o contándole qué quieres que aprendan, o partiendo de lo que dicen tus resultados.
// Todo lo que no es la llamada a la IA son funciones puras y probadas aparte. SOLO la llamada (generarCursoConIA) sale a internet y solo
// se usa desde el servidor: la clave de la IA nunca llega al navegador.

const redondear = (n) => Math.round(n * 100) / 100;
const pct = (x) => `${Math.round(x * 100)} %`;
const eur = (n) => `${Number(n || 0).toLocaleString("es-ES", { maximumFractionDigits: 2 })} €`;

// ---------------------------------------------------------------------------
// 1 · Qué dicen tus resultados (reglas con tus números: no usa IA y es 100 % explicable)
// ---------------------------------------------------------------------------
const conAlgoMas = (c) => (c.serviciosExtra || []).length > 0 || (c.productos || []).length > 0;
const vino = (c) => c.estadoCobro === "cobrada" && c.asistencia !== "cancelada" && c.asistencia !== "no_asistio";
const restar = (iso, dias) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() - dias); return d.toISOString().slice(0, 10); };

// → lista de hallazgos, del más importante al menos: { id, severidad 1-3, titulo, evidencia, peticion }
export function diagnosticoDelNegocio({ kpis, citas = [], hoy, ocupacionSemana = null, reactivables = 0, bonosSinCita = 0, objetivoTicket = 0 }) {
  const h = [];
  const desde = restar(hoy, 28);
  const cobradas = citas.filter((c) => vino(c) && c.fecha > desde && c.fecha <= hoy);
  if (cobradas.length >= 10) {
    const tasa = cobradas.filter(conAlgoMas).length / cobradas.length;
    if (tasa < 0.3) h.push({ id: "cruzadas", severidad: tasa < 0.15 ? 3 : 2, titulo: "Vender más a cada clienta sin presionar", evidencia: `Solo el ${pct(tasa)} de las citas cobradas en las últimas 4 semanas incluyó algo más (otro servicio o un producto).`, peticion: "Cómo ofrecer, sin presionar, un segundo servicio o un producto que vaya bien con lo que la clienta ya se hace, para subir el ticket medio" });
  }
  if (objetivoTicket > 0 && kpis.ticketMedio30 > 0 && kpis.ticketMedio30 < objetivoTicket * 0.9) h.push({ id: "ticket", severidad: 2, titulo: "Subir el ticket medio", evidencia: `El ticket medio de los últimos 30 días (${eur(kpis.ticketMedio30)}) está por debajo del objetivo (${eur(objetivoTicket)}).`, peticion: "Cómo presentar los tratamientos de más valor (por ejemplo, Eternal Radiance o Dermapen) y los packs para que la clienta entienda su valor y elija con confianza" });
  const c30 = kpis.cancelaciones30 || {};
  const fallos = (c30.tasaCancelacion || 0) + (c30.tasaNoVino || 0);
  if ((c30.programadas || 0) >= 15 && fallos >= 12) h.push({ id: "plantones", severidad: fallos >= 20 ? 3 : 2, titulo: "Que menos clientas cancelen o no vengan", evidencia: `En los últimos 30 días, el ${redondear(fallos)} % de las citas se canceló o la clienta no vino (${c30.canceladas} canceladas y ${c30.noVino} que no vinieron de ${c30.programadas}).`, peticion: "Cómo confirmar las citas, recordarlas y reaccionar cuando una clienta cancela o no viene, sin molestar y sin perder el hueco" });
  if (ocupacionSemana !== null && ocupacionSemana < 0.55) h.push({ id: "huecos", severidad: ocupacionSemana < 0.35 ? 3 : 2, titulo: "Llenar la agenda de los próximos días", evidencia: `Los próximos 7 días solo tienen cita el ${pct(ocupacionSemana)} de las horas de trabajo.`, peticion: "Cómo llenar los huecos de la semana: escribir a clientas que llevan tiempo sin venir y ofrecerles una hora concreta por WhatsApp" });
  const cl = kpis.clientas || {};
  if ((cl.enRiesgo || 0) + (cl.perdidas || 0) >= 10 && (cl.enRiesgo || 0) + (cl.perdidas || 0) > (cl.activas || 0) * 0.5) h.push({ id: "perdidas", severidad: 2, titulo: "Recuperar clientas que hace tiempo que no vienen", evidencia: `Hay ${cl.enRiesgo || 0} clientas en riesgo (3–6 meses sin venir) y ${cl.perdidas || 0} perdidas (más de 6 meses), frente a ${cl.activas || 0} activas.`, peticion: "Cómo escribir a una clienta que hace meses que no viene para que vuelva, qué decirle y qué no decirle" });
  if (kpis.variacionMes !== null && kpis.variacionMes !== undefined && kpis.variacionMes <= -15) h.push({ id: "caida", severidad: 2, titulo: "Remontar la facturación del mes", evidencia: `Este mes se factura un ${Math.abs(kpis.variacionMes).toLocaleString("es-ES")} % menos que el mes pasado en los mismos días.`, peticion: "Cómo ofrecer bonos y tratamientos recurrentes para que las clientas vuelvan con regularidad" });
  if (bonosSinCita >= 5) h.push({ id: "bonos", severidad: 1, titulo: "Que las clientas gasten sus bonos", evidencia: `${bonosSinCita} clientas tienen un bono con sesiones sin gastar y ninguna cita.`, peticion: "Cómo recordar a una clienta que le quedan sesiones de su bono y proponerle la siguiente cita" });
  if (h.length === 0) h.push({ id: "mantener", severidad: 1, titulo: "Todo va bien: mantener la buena atención y la fidelidad", evidencia: "En tus números de las últimas semanas no se ve ningún problema claro.", peticion: "Cómo cuidar la experiencia de la clienta de principio a fin para que repita y nos recomiende" });
  return h.sort((a, b) => b.severidad - a.severidad);
}

// ---------------------------------------------------------------------------
// 2 · La petición a la IA
// ---------------------------------------------------------------------------
export const TIPOS_CLASE = { base: "base (para empezar desde cero)", refuerzo: "de refuerzo (para quien está fallando en este tema)", avanzado: "avanzada (para quien ya lo domina y quiere más)" };
export const NUMEROS_PREGUNTAS = [6, 8, 10];

export function sanearEntrada({ modo, texto, tipo, preguntas, hallazgos, servicios, negocio }) {
  const corto = (t, n) => String(t ?? "").replace(/\s+/g, " ").trim().slice(0, n);
  return {
    modo: modo === "resultados" ? "resultados" : "peticion",
    texto: String(texto ?? "").trim().slice(0, 1500),
    tipo: Object.keys(TIPOS_CLASE).includes(tipo) ? tipo : "refuerzo",
    preguntas: NUMEROS_PREGUNTAS.includes(Number(preguntas)) ? Number(preguntas) : 8,
    hallazgos: (Array.isArray(hallazgos) ? hallazgos : []).slice(0, 4).map((x) => ({ titulo: corto(x?.titulo, 120), evidencia: corto(x?.evidencia, 300), peticion: corto(x?.peticion, 300) })).filter((x) => x.titulo),
    servicios: (Array.isArray(servicios) ? servicios : []).slice(0, 15).map((s) => ({ nombre: corto(s?.nombre, 60), precio: Number(s?.precio) || 0 })).filter((s) => s.nombre),
    negocio: corto(negocio, 60) || "el centro",
  };
}

export function construirPeticion(entrada) {
  const e = sanearEntrada(entrada);
  const system = [
    `Eres una formadora experta en atención al cliente y ventas para centros de estética en España. Escribes clases cortas para el equipo de «${e.negocio}», un centro de estética pequeño en Vigo.`,
    "Quien lee NO sabe de ventas ni de marketing: nada de jerga ni de anglicismos (nada de «upselling», «KPI», «funnel»…). Frases de 32 palabras como máximo. Tuteo.",
    "La clase debe ser PRÁCTICA: explica la idea con ejemplos reales de un centro de estética, da frases listas para copiar y di también qué NO decir. Usa los servicios del centro como ejemplos cuando encaje.",
    "No prometas resultados ni garantices nada, no digas que un tratamiento cura o elimina algo y no hagas afirmaciones médicas. No inventes cifras, estudios ni datos del centro.",
    "El texto de la clase es TEXTO PLANO: sin Markdown (nada de #, ** ni tablas). Los títulos de cada apartado van en MAYÚSCULAS y las listas con guiones.",
    "El test tiene preguntas de 3 opciones, solo una correcta, con situaciones reales del día a día (no preguntas de memoria). Las opciones incorrectas deben ser tentadoras, no absurdas.",
    'Responde SOLO con un JSON válido, sin texto antes ni después ni bloques de código, con esta forma exacta: {"titulo": "…", "contenido": "…", "preguntas": [{"texto": "…", "opciones": ["…", "…", "…"], "correcta": 0}]} donde «correcta» es la posición (0, 1 o 2) de la opción correcta.',
  ].join("\n");
  const partes = [];
  if (e.modo === "resultados" && e.hallazgos.length) {
    partes.push("Estos son los datos reales del centro que han llevado a proponer esta clase (son cifras, no hay datos personales):");
    e.hallazgos.forEach((h) => partes.push(`- ${h.titulo}: ${h.evidencia}`));
    partes.push(`Escribe una clase que ayude al equipo a mejorar justo eso. Tema: ${e.hallazgos[0].peticion || e.hallazgos[0].titulo}.`);
    if (e.texto) partes.push(`Indicaciones adicionales de la dueña: ${e.texto}`);
  } else {
    partes.push(`La dueña quiere esta clase: ${e.texto || "una clase útil para el equipo"}`);
  }
  partes.push(`Tipo de clase: ${TIPOS_CLASE[e.tipo]}.`);
  partes.push(`El test debe tener exactamente ${e.preguntas} preguntas.`);
  if (e.servicios.length) partes.push(`Servicios del centro (para usar de ejemplo): ${e.servicios.map((s) => (s.precio ? `${s.nombre} (${s.precio} €)` : s.nombre)).join("; ")}.`);
  partes.push("El texto de la clase debe tener entre 500 y 900 palabras.");
  return { system, user: partes.join("\n") };
}

// ---------------------------------------------------------------------------
// 3 · Lo que devuelve la IA: se valida TODO antes de enseñarlo
// ---------------------------------------------------------------------------
export function limpiarMarkdown(t) {
  return String(t ?? "").replace(/\r\n/g, "\n").replace(/```[a-z]*\n?/gi, "").replace(/^#{1,6}\s+/gm, "").replace(/\*\*(.+?)\*\*/gs, "$1").replace(/__(.+?)__/gs, "$1").replace(/(^|\s)\*(?!\s)(.+?)\*(?=\s|[.,;:!?]|$)/g, "$1$2").replace(/\n{3,}/g, "\n\n").trim();
}

// → { ok: true, curso } | { ok: false, errores: [...] }
export function parsearCursoIA(respuesta, { preguntas = 8 } = {}) {
  const errores = [];
  const bruto = String(respuesta ?? "");
  const a = bruto.indexOf("{"), b = bruto.lastIndexOf("}");
  if (a < 0 || b <= a) return { ok: false, errores: ["La respuesta no contiene un JSON."] };
  let j;
  try { j = JSON.parse(bruto.slice(a, b + 1)); } catch (e) { return { ok: false, errores: ["El JSON no es válido."] }; }
  const titulo = limpiarMarkdown(j?.titulo).replace(/\s+/g, " ").slice(0, 120);
  const contenido = limpiarMarkdown(j?.contenido);
  if (titulo.length < 4) errores.push("Falta el título.");
  if (contenido.length < 400) errores.push("El texto de la clase es demasiado corto (mínimo 400 letras).");
  if (contenido.length > 9000) errores.push("El texto de la clase es demasiado largo.");
  const lista = Array.isArray(j?.preguntas) ? j.preguntas : [];
  if (lista.length !== preguntas) errores.push(`Hacían falta ${preguntas} preguntas y hay ${lista.length}.`);
  const qs = [];
  lista.forEach((p, i) => {
    const texto = limpiarMarkdown(p?.texto).replace(/\s+/g, " ");
    const ops = Array.isArray(p?.opciones) ? p.opciones.map((o) => limpiarMarkdown(o).replace(/\s+/g, " ")) : [];
    const correcta = Number(p?.correcta);
    if (texto.length < 8) return errores.push(`La pregunta ${i + 1} no tiene texto.`);
    if (ops.length < 3 || ops.some((o) => !o)) return errores.push(`La pregunta ${i + 1} no tiene 3 opciones.`);
    if (!Number.isInteger(correcta) || correcta < 0 || correcta >= ops.length) return errores.push(`La pregunta ${i + 1} no indica bien la respuesta correcta.`);
    if (new Set(ops.map((o) => o.toLowerCase())).size !== ops.length) return errores.push(`La pregunta ${i + 1} tiene opciones repetidas.`);
    qs.push({ texto, opciones: ops, correcta });
  });
  if (errores.length) return { ok: false, errores };
  return { ok: true, curso: { titulo, contenido, preguntas: qs } };
}

// Las IA tienden a poner la respuesta correcta siempre en el mismo sitio: se reparte al azar (y siempre quedan 3 opciones)
export function barajarPreguntas(preguntas, rnd = Math.random) {
  return preguntas.map((p) => {
    let ops = p.opciones.map((texto, i) => ({ texto, ok: i === p.correcta }));
    if (ops.length > 3) { const malas = ops.filter((o) => !o.ok); const quitar = malas[Math.floor(rnd() * malas.length)]; ops = ops.filter((o) => o !== quitar); }
    for (let i = ops.length - 1; i > 0; i--) { const k = Math.floor(rnd() * (i + 1)); [ops[i], ops[k]] = [ops[k], ops[i]]; }
    return { texto: p.texto, opciones: ops.map((o) => o.texto), correcta: ops.findIndex((o) => o.ok) };
  });
}

// ---------------------------------------------------------------------------
// 4 · La llamada a la IA (solo servidor)
// ---------------------------------------------------------------------------
export const MODELO_POR_DEFECTO = "claude-sonnet-5-5";
const URL_API = "https://api.anthropic.com/v1/messages";

async function llamar({ apiKey, modelo, system, mensajes, fetchImpl, timeoutMs }) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(URL_API, { method: "POST", signal: ctl.signal, headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" }, body: JSON.stringify({ model: modelo, max_tokens: 4096, system, messages: mensajes }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, status: res.status, error: data?.error?.message || `Error ${res.status}` };
    const texto = (data.content || []).filter((c) => c.type === "text").map((c) => c.text).join("");
    return { ok: true, texto };
  } catch (e) {
    return { ok: false, status: 0, error: e?.name === "AbortError" ? "timeout" : e?.message || "sin conexión" };
  } finally { clearTimeout(t); }
}

const explicarError = (r, modelo) => {
  if (r.status === 401 || r.status === 403) return "La clave de la IA no es válida o no tiene permiso. Revisa ANTHROPIC_API_KEY en el hosting.";
  if (r.status === 404 || (r.status === 400 && /model/i.test(r.error))) return `La IA no reconoce el modelo «${modelo}». Pon en el hosting la variable ANTHROPIC_MODEL con un modelo que aparezca en tu cuenta de Anthropic.`;
  if (r.status === 429) return "La IA está recibiendo demasiadas peticiones o te has quedado sin saldo. Espera un minuto o revisa tu cuenta de Anthropic.";
  if (r.status === 402) return "Tu cuenta de Anthropic no tiene saldo. Añade crédito y vuelve a probar.";
  if (r.error === "timeout") return "La IA ha tardado demasiado. Vuelve a probar.";
  if (r.status >= 500 || r.status === 0) return "La IA no está disponible ahora mismo. Vuelve a probar en un momento.";
  return "La IA no ha podido hacer la clase. Vuelve a probar.";
};

// → { ok: true, curso } | { ok: false, error, sinClave?, status? }. `fetchImpl` y `rnd` se pueden sustituir (para probarlo sin internet).
export async function generarCursoConIA(entrada, { apiKey, modelo = MODELO_POR_DEFECTO, fetchImpl = globalThis.fetch, rnd = Math.random, timeoutMs = 90000 } = {}) {
  if (!apiKey) return { ok: false, sinClave: true, error: "La IA no está activada. Falta la clave: crea una en console.anthropic.com y ponla en el hosting como ANTHROPIC_API_KEY." };
  const e = sanearEntrada(entrada);
  if (e.modo === "peticion" && e.texto.length < 8) return { ok: false, status: 400, error: "Cuéntame un poco más qué quieres que aprendan." };
  if (e.modo === "resultados" && e.hallazgos.length === 0) return { ok: false, status: 400, error: "No hay ningún resultado sobre el que hacer la clase." };
  const { system, user } = construirPeticion(e);
  let mensajes = [{ role: "user", content: user }];
  let ultimo = null;
  for (let intento = 0; intento < 2; intento++) {
    const r = await llamar({ apiKey, modelo, system, mensajes, fetchImpl, timeoutMs });
    if (!r.ok) return { ok: false, status: r.status || 502, error: explicarError(r, modelo) };
    const p = parsearCursoIA(r.texto, { preguntas: e.preguntas });
    if (p.ok) return { ok: true, curso: { ...p.curso, preguntas: barajarPreguntas(p.curso.preguntas, rnd) }, modelo };
    ultimo = p.errores;
    mensajes = [...mensajes, { role: "assistant", content: r.texto }, { role: "user", content: `Tu respuesta no es válida: ${p.errores.join(" ")} Devuelve SOLO el JSON correcto, con la forma indicada.` }];
  }
  return { ok: false, status: 502, error: `La IA no ha devuelto una clase válida (${(ultimo || []).join(" ")}). Vuelve a probar.` };
}
