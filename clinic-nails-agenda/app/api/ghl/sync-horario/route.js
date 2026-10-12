import { NextResponse } from "next/server";
import { verificarUsuario } from "../../../../lib/auth";
import { supabase } from "../../../../lib/servidorDb";
import { cargarConfigGHL } from "../../../../lib/configServidor";
import { configurado, usuarioAsignadoDelCalendario, buscarHorariosGHL, crearHorarioGHL, actualizarHorarioGHL, aplicarHorarioACalendarioGHL } from "../../../../lib/ghl";
import { horarioSemanal, reglasGHL, resumenSemanal, pendientesNoEnviados, nombreHorarioGHL, ZONA_HORARIA } from "../../../../lib/ghlHorarios";
import { hoyMadrid } from "../../../../lib/cursos";
import { nombreNegocioDe } from "../../../../lib/negocio";

export const dynamic = "force-dynamic";
const fallo = (error, status = 500) => NextResponse.json({ ok: false, error }, { status });
const explicar = (err, que) => (err?.status === 401 || err?.status === 403 ? `GHL no deja ${que} con la clave actual (${err.message}). Revisa los permisos de tu clave en GHL → Ajustes → Integraciones privadas (calendarios con escritura).` : err?.message || "Error desconocido de GHL");

// Envía a GHL el horario SEMANAL de una empleada (el que usa el bot de IA para agendar). Con `vistaPrevia: true` no escribe nada: dice qué
// enviaría y qué horario suyo hay ya en GHL. Con `soloSiYaSincronizada: true` (al guardar una empleada) solo actúa si ya se le envió
// antes con el botón: así nunca se toca el horario de GHL de quien no se ha confirmado. No envía ausencias, vacaciones ni días sueltos.
export async function POST(request) {
  try {
    const auth = await verificarUsuario(request);
    if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    const u = auth.usuario;
    if (u.rol !== "admin" && !u.permisos?.empleadas) return fallo("No tienes permiso para gestionar empleadas.", 403);
    await cargarConfigGHL();
    if (!configurado()) return NextResponse.json({ ok: false, skipped: true, motivo: "GHL no configurado" });

    const { empleadaId, vistaPrevia, soloSiYaSincronizada } = await request.json();
    if (!empleadaId) return fallo("Falta empleadaId", 400);
    const { data: r, error } = await supabase.from("empleadas").select("*").eq("id", empleadaId).single();
    if (error || !r) return fallo(`Empleada no encontrada${error ? ` (${error.message})` : ""}`, 404);
    const emp = { id: r.id, nombre: r.nombre, activa: r.activa, rol: r.rol, horario: r.horario || {}, diasLibres: r.dias_libres || [], horarioTipo: r.horario_tipo || "fijo", turnos: r.turnos || [], turnoInicio: r.turno_inicio || "", ausencias: r.ausencias || [], excepciones: r.excepciones || [] };
    const guardado = (r.ghl_schedule_id || "").trim();
    const calendarId = (r.ghl_calendar_id || "").trim();

    if (emp.rol === "admin" || emp.activa === false) return NextResponse.json({ ok: true, accion: "omitido", nombre: emp.nombre });
    if (soloSiYaSincronizada && !guardado) return NextResponse.json({ ok: true, accion: "omitido", nombre: emp.nombre });

    const semanal = horarioSemanal(emp);
    if (!semanal.sincronizable) return NextResponse.json({ ok: true, accion: "no_sincronizable", nombre: emp.nombre, motivo: semanal.motivo });
    if (!calendarId) return fallo("Esta empleada no tiene calendario en GHL: asígnale uno en Configuración → Conexión con GoHighLevel (o guárdala para que se cree).", 409);
    const userId = await usuarioAsignadoDelCalendario(calendarId);
    if (!userId) return fallo("No se pudo saber qué usuario de GHL tiene ese calendario (¿está sin equipo asignado?).", 409);

    const rules = reglasGHL(semanal);
    const { data: ajusteNegocio } = await supabase.from("ajustes").select("valor").eq("clave", "negocio").maybeSingle();
    const nombreH = nombreHorarioGHL(emp.nombre, nombreNegocioDe({ negocio: ajusteNegocio?.valor }));
    const avisos = [...semanal.avisos, pendientesNoEnviados(emp, hoyMadrid())].filter(Boolean);
    if (rules.length === 0) return fallo("Esa empleada no trabaja ningún día de la semana: no se envía un horario vacío (el bot no podría agendarle nada).", 409);

    // ¿Ya hay un horario suyo en GHL? El que guardamos, o uno que GHL tenga ya para esta persona y calendario
    let scheduleId = guardado;
    let existente = null;
    let adoptado = false;
    if (!scheduleId) {
      try {
        const lista = await buscarHorariosGHL({ userId, calendarId });
        existente = (lista || []).find((h) => (!h.userId || h.userId === userId) && (!Array.isArray(h.calendarIds) || h.calendarIds.length === 0 || h.calendarIds.includes(calendarId))) || null;
        if (existente?.id) { scheduleId = existente.id; adoptado = true; }
      } catch (err) {
        existente = null; // si no se puede consultar, se crea uno nuevo
      }
    }
    const hara = scheduleId ? "actualizar" : "crear";

    if (vistaPrevia) {
      return NextResponse.json({ ok: true, accion: "vista_previa", nombre: emp.nombre, hara, rules, timezone: ZONA_HORARIA, resumen: resumenSemanal(semanal), nombreHorario: nombreH, avisos, ...(adoptado ? { existente: { id: existente.id, nombre: existente.name || existente.nombre || "sin nombre" } } : {}) });
    }

    let resultado;
    try {
      if (scheduleId) {
        resultado = await actualizarHorarioGHL(scheduleId, { nombre: nombreH, rules, timezone: ZONA_HORARIA });
        if (adoptado && Array.isArray(existente?.calendarIds) && !existente.calendarIds.includes(calendarId)) await aplicarHorarioACalendarioGHL(scheduleId, calendarId);
      } else {
        resultado = await crearHorarioGHL({ nombre: nombreH, rules, timezone: ZONA_HORARIA, userId, calendarIds: [calendarId] });
        scheduleId = resultado?.id || "";
      }
    } catch (err) {
      if (guardado && err?.status === 404) {
        // alguien borró en GHL el horario que se envió: se olvida el vínculo para poder crearlo de nuevo
        await supabase.from("empleadas").update({ ghl_schedule_id: null }).eq("id", emp.id);
        return fallo("El horario que se envió antes ya no existe en GHL (alguien lo borró). Se ha olvidado el vínculo: pulsa de nuevo «Vista previa» y envíalo otra vez; se creará uno nuevo.", 404);
      }
      const pista = !scheduleId && /exist|already|association|calendar/i.test(err.message || "") ? " Puede que ese calendario ya tenga un horario aplicado a esta persona: en GHL (Ajustes → Calendarios → Disponibilidad) desvincúlalo y vuelve a intentarlo." : "";
      return fallo(`${explicar(err, "guardar el horario")}${pista}`, 502);
    }
    if (!scheduleId) return fallo("GHL no devolvió el identificador del horario creado.", 502);
    if (scheduleId !== guardado) {
      const { error: errGuardar } = await supabase.from("empleadas").update({ ghl_schedule_id: scheduleId }).eq("id", emp.id);
      if (errGuardar) return fallo(`El horario se envió a GHL pero no se pudo guardar el vínculo (${errGuardar.message}). ¿Has pegado el esquema nuevo en Supabase?`);
    }
    return NextResponse.json({ ok: true, accion: guardado || adoptado ? "actualizado" : "creado", nombre: emp.nombre, scheduleId, resumen: resumenSemanal(semanal), ...(avisos.length ? { aviso: avisos.join(" ") } : {}), ...(adoptado ? { adoptado: true } : {}) });
  } catch (err) {
    console.error("sync-horario:", err);
    return fallo(err.message || "Error al enviar el horario a GHL");
  }
}
