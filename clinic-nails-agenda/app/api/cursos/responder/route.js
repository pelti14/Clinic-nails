import { NextResponse } from "next/server";
import { verificarUsuario } from "../../../../lib/auth";
import { supabase } from "../../../../lib/servidorDb";
import { corregir, lunesDe, hoyMadrid } from "../../../../lib/cursos";
import { registrarActividad } from "../../../../lib/actividadServidor";

export const dynamic = "force-dynamic";

// El test lo CORRIGE EL SERVIDOR (las empleadas nunca reciben las respuestas correctas) y guarda el resultado.
// Se puede repetir hasta aprobar; cuenta el de la semana en curso (lunes–domingo, hora de Madrid).
export async function POST(request) {
  try {
    const auth = await verificarUsuario(request);
    if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    const u = auth.usuario;
    const { leccionId, respuestas } = await request.json();
    if (!leccionId || !Array.isArray(respuestas)) return NextResponse.json({ ok: false, error: "Faltan datos del test." }, { status: 400 });
    const { data: leccion, error } = await supabase.from("lecciones").select("*").eq("id", leccionId).single();
    if (error || !leccion) return NextResponse.json({ ok: false, error: "No se ha encontrado esa clase." }, { status: 404 });
    if (leccion.activa === false) return NextResponse.json({ ok: false, error: "Esta clase está desactivada." }, { status: 403 });
    const preguntas = leccion.preguntas || [];
    if (!preguntas.length) return NextResponse.json({ ok: false, error: "Esta clase no tiene test." }, { status: 400 });
    const r = corregir(preguntas, respuestas.map((x) => (Number.isInteger(x) ? x : null)), leccion.minimo_aprobado ?? 70);
    const semana = lunesDe(hoyMadrid());
    const fila = { id: `res_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`, empleada_id: u.id, leccion_id: leccion.id, semana, puntuacion: r.puntuacion, aciertos: r.aciertos, total: r.total, aprobado: r.aprobado };
    const { error: errIns } = await supabase.from("resultados_cursos").insert(fila);
    if (errIns) return NextResponse.json({ ok: false, error: `No se pudo guardar el resultado (${errIns.message}). ¿Has pegado el esquema nuevo en Supabase?` }, { status: 500 });
    await registrarActividad([{ usuario_id: u.id, usuario_nombre: u.nombre, origen: "app", entidad: "resultado_curso", entidad_id: fila.id, cliente_id: null, accion: "test", resumen: `Hizo el test «${leccion.titulo}»: ${r.puntuacion} % (${r.aciertos}/${r.total}) · ${r.aprobado ? "aprobado" : "suspendido"}`, detalle: { leccionId: leccion.id, semana, puntuacion: r.puntuacion, aprobado: r.aprobado } }]);
    return NextResponse.json({ ok: true, resultado: { id: fila.id, semana, aciertos: r.aciertos, total: r.total, puntuacion: r.puntuacion, aprobado: r.aprobado, minimo: leccion.minimo_aprobado ?? 70, detalle: r.detalle } });
  } catch (err) {
    console.error("cursos/responder:", err);
    return NextResponse.json({ ok: false, error: err.message || "No se pudo corregir el test." }, { status: 500 });
  }
}
