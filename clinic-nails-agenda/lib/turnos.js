// Ciclos de turnos por semanas (por ejemplo 2 semanas de un tipo y 1 de otro), sin pantalla.
// Se guardan como siempre: `turnos` = una semana por cada semana del ciclo, y `turnoInicio` = lunes de la semana 1.

export const DIAS_CORTOS = { lun: "L", mar: "M", mie: "X", jue: "J", vie: "V", sab: "S", dom: "D" };
const ORDEN_DIAS = ["lun", "mar", "mie", "jue", "vie", "sab", "dom"];
export const letra = (i) => String.fromCharCode(65 + i);

const clonar = (p) => JSON.parse(JSON.stringify(p || {}));
// Texto estable de una semana: no depende del orden de las claves (ni en la semana ni dentro de cada día)
const estable = (v) => (v && typeof v === "object" ? (Array.isArray(v) ? `[${v.map(estable).join(",")}]` : `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${estable(v[k])}`).join(",")}}`) : JSON.stringify(v));
const canon = (p) => estable(p || {});

// Agrupa las semanas idénticas: tipos A, B… y qué tipo toca cada semana del ciclo
export function derivarCiclo(turnos) {
  const plantillas = [];
  const claves = [];
  const ciclo = (turnos && turnos.length ? turnos : [{}]).map((p) => {
    const k = canon(p);
    let i = claves.indexOf(k);
    if (i < 0) { claves.push(k); plantillas.push(clonar(p)); i = plantillas.length - 1; }
    return i;
  });
  return { plantillas, ciclo };
}

// Los tipos que no se usan desaparecen y los que quedan se renombran por orden de aparición (A, B…)
export function compactar({ plantillas, ciclo }) {
  const orden = [];
  ciclo.forEach((i) => { if (!orden.includes(i)) orden.push(i); });
  return { plantillas: orden.map((i) => clonar(plantillas[i])), ciclo: ciclo.map((i) => orden.indexOf(i)) };
}

export const construirTurnos = (plantillas, ciclo) => ciclo.map((i) => clonar(plantillas[i]));

export const PRESETS = [
  { id: "igual", texto: "Todas las semanas iguales", ciclo: [0] },
  { id: "alterna", texto: "Alterna 1 y 1", ciclo: [0, 1] },
  { id: "dos_uno", texto: "2 semanas y 1 distinta", ciclo: [0, 0, 1] },
  { id: "tres_uno", texto: "3 semanas y 1 distinta", ciclo: [0, 0, 0, 1] },
];

// Un atajo conserva lo ya escrito en el tipo A (y B si existe); el tipo que falte empieza como copia de A
export function aplicarPreset(id, plan) {
  const p = PRESETS.find((x) => x.id === id);
  if (!p) return plan;
  const necesarios = Math.max(...p.ciclo) + 1;
  const plantillas = [...plan.plantillas];
  while (plantillas.length < necesarios) plantillas.push(clonar(plantillas[0]));
  return compactar({ plantillas, ciclo: p.ciclo });
}

// Cambia el tipo de una semana del ciclo: A → B → … → un tipo nuevo (copia del actual) → A (máximo 4 tipos)
export function siguienteTipo(plan, pos, maximo = 4) {
  const n = plan.plantillas.length;
  let sig = plan.ciclo[pos] + 1;
  let plantillas = plan.plantillas;
  if (sig >= n) {
    if (n < maximo) { plantillas = [...plantillas, clonar(plantillas[plan.ciclo[pos]])]; sig = n; } else sig = 0;
  }
  return compactar({ plantillas, ciclo: plan.ciclo.map((x, i) => (i === pos ? sig : x)) });
}
export const anadirSemana = (plan) => ({ plantillas: plan.plantillas, ciclo: [...plan.ciclo, plan.ciclo[plan.ciclo.length - 1] ?? 0] });
export const quitarSemana = (plan) => (plan.ciclo.length > 1 ? compactar({ plantillas: plan.plantillas, ciclo: plan.ciclo.slice(0, -1) }) : plan);

// «LMXJV 10:00–21:00» (o «Sin días» / «horas distintas»)
export function resumenPatron(patron) {
  const dias = ORDEN_DIAS.filter((d) => patron?.[d]?.activo);
  if (!dias.length) return "Sin días";
  const horas = new Set(dias.map((d) => `${patron[d].inicio || "?"}–${patron[d].fin || "?"}`));
  return `${dias.map((d) => DIAS_CORTOS[d]).join("")} ${horas.size === 1 ? [...horas][0] : "horas distintas"}`;
}

const sumar = (iso, n) => { const d = new Date(iso + "T00:00:00"); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
export const lunesDe = (iso) => { const d = new Date(iso + "T00:00:00"); return sumar(iso, -((d.getDay() + 6) % 7)); };

// Las próximas semanas con el tipo que les toca (misma fórmula que usa la agenda)
export function vistaPrevia({ turnoInicio, ciclo, desde, semanas = 8 }) {
  const n = ciclo.length;
  return Array.from({ length: semanas }, (_, i) => {
    const lunes = sumar(lunesDe(desde), 7 * i);
    let idx = 0;
    if (turnoInicio && n) {
      const dias = Math.floor((new Date(lunes + "T00:00:00") - new Date(turnoInicio + "T00:00:00")) / 86400000);
      idx = (((Math.floor(dias / 7) % n) + n) % n);
    }
    return { lunes, posicion: idx, tipo: ciclo[idx] ?? 0 };
  });
}

// Semanas (de lunes a domingo) que cubren un mes: para dibujar el calendario mensual
export function semanasDelMes(anio, mes) {
  const primero = `${anio}-${String(mes + 1).padStart(2, "0")}-01`;
  const ultimo = new Date(anio, mes + 1, 0);
  const finISO = `${ultimo.getFullYear()}-${String(ultimo.getMonth() + 1).padStart(2, "0")}-${String(ultimo.getDate()).padStart(2, "0")}`;
  const semanas = [];
  for (let l = lunesDe(primero); l <= finISO; l = sumar(l, 7)) semanas.push(Array.from({ length: 7 }, (_, i) => sumar(l, i)));
  return semanas;
}
