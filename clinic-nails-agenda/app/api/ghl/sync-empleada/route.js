import { NextResponse } from "next/server";
import { verificarUsuario } from "../../../../lib/auth";
import { supabase } from "../../../../lib/servidorDb";
import { cargarConfigGHL } from "../../../../lib/configServidor";
import { configurado, usuarioAsignadoDelCalendario, listarUsuariosGHL, renombrarUsuarioGHL, actualizarCalendarioGHL, crearCalendarioServicioGHL } from "../../../../lib/ghl";
import { elegirUsuarioPorNombre, NOMBRE_ELIMINADA } from "../../../../lib/ghlEmpleadas";

export const dynamic = "force-dynamic";
const fallo = (error, status = 500) => NextResponse.json({ ok: false, error }, { status });
const explicar = (err, que) => (err?.status === 401 || err?.status === 403 ? `GHL no deja ${que} con la clave actual (${err.message}). Revisa los permisos de tu clave en GHL → Ajustes → Integraciones privadas.` : err?.message || "Error desconocido de GHL");

// Alta / edición: la empleada tiene su calendario en GHL (se crea y se le asigna solo, si hay un usuario suyo en GHL).
// Baja (accion: "baja"): NO se borra nada en GHL; su calendario y su usuario se renombran «empleado-eliminado» y se
// desactivan sin horario, para que no se pueda reservar con ella.
export async function POST(request) {
  try {
    const auth = await verificarUsuario(request);
    if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    const u = auth.usuario;
    if (u.rol !== "admin" && !u.permisos?.empleadas) return fallo("No tienes permiso para gestionar empleadas.", 403);
    await cargarConfigGHL();
    if (!configurado()) return NextResponse.json({ ok: false, skipped: true, motivo: "GHL no configurado" });

    const { empleadaId, accion } = await request.json();
    if (!empleadaId) return fallo("Falta empleadaId", 400);
    const { data: emp, error: errEmp } = await supabase.from("empleadas").select("id, nombre, activa, rol, ghl_calendar_id").eq("id", empleadaId).single();
    if (errEmp || !emp) return fallo(`Empleada no encontrada${errEmp ? ` (${errEmp.message})` : ""}`, 404);
    const calendarioActual = (emp.ghl_calendar_id || "").trim();

    // ----- BAJA -----
    if (accion === "baja") {
      if (emp.rol === "admin") return fallo("El perfil de administrador no se da de baja aquí.", 403);
      if (!calendarioActual) return NextResponse.json({ ok: true, accion: "omitido", nombre: emp.nombre });
      const avisos = [];
      let userId = null;
      try { userId = await usuarioAsignadoDelCalendario(calendarioActual); } catch (e) { userId = null; }
      try {
        // sin horario (openHours vacío) y desactivado: nadie puede reservarle nada
        await actualizarCalendarioGHL(calendarioActual, { name: NOMBRE_ELIMINADA, isActive: false, openHours: [] });
      } catch (err) {
        if (err?.status !== 404) return fallo(explicar(err, "renombrar su calendario"), 502);
        avisos.push("Su calendario ya no existía en GHL.");
      }
      if (userId) {
        try { await renombrarUsuarioGHL(userId, NOMBRE_ELIMINADA); } catch (err) { avisos.push(`Su usuario de GHL no se pudo renombrar (${err.message}): renómbralo a mano a «${NOMBRE_ELIMINADA}».`); }
      }
      return NextResponse.json({ ok: true, accion: "baja", nombre: emp.nombre, calendarId: calendarioActual, ...(avisos.length ? { aviso: avisos.join(" ") } : {}) });
    }

    // ----- ALTA / EDICIÓN -----
    if (emp.rol === "admin") return NextResponse.json({ ok: true, accion: "omitido", nombre: emp.nombre });
    if (emp.activa === false) return NextResponse.json({ ok: true, accion: "omitido", nombre: emp.nombre });

    if (calendarioActual) {
      try {
        await actualizarCalendarioGHL(calendarioActual, { name: emp.nombre }); // por si ha cambiado su nombre
      } catch (err) {
        if (err?.status !== 404) return fallo(explicar(err, "actualizar su calendario"), 502);
        return fallo(`Su calendario de GHL ya no existe. Asígnale otro en Configuración → Conexión con GoHighLevel.`, 404);
      }
      return NextResponse.json({ ok: true, accion: "actualizado", nombre: emp.nombre, calendarId: calendarioActual });
    }

    let usuarios;
    try { usuarios = await listarUsuariosGHL(); } catch (err) { return fallo(explicar(err, "leer los usuarios"), 502); }
    const { usuario, ambiguo } = elegirUsuarioPorNombre(usuarios, emp.nombre);
    if (!usuario) {
      return fallo(
        ambiguo
          ? `Hay varios usuarios en GHL que podrían ser «${emp.nombre}» (${ambiguo.map((x) => x.name || x.email).join(", ")}). Asígnale su calendario a mano en Configuración → Conexión con GoHighLevel.`
          : `No hay ningún usuario en GHL llamado «${emp.nombre}». Crea su usuario en GHL (Ajustes → Equipo) con ese nombre y vuelve a guardarla: se le asignará su calendario solo.`,
        404
      );
    }
    let nuevo;
    try {
      // calendario interno de la empleada: sin horario de reserva (no se puede reservar online en él; la app lo usa para sus citas)
      nuevo = await crearCalendarioServicioGHL({ nombre: emp.nombre, descripcion: `Calendario de ${emp.nombre} (lo usa la agenda de la clínica)`, duracion: 15, usuarios: [usuario.id], openHours: [], sinHorario: true });
    } catch (err) {
      return fallo(explicar(err, "crear calendarios"), 502);
    }
    const { error: errGuardar } = await supabase.from("empleadas").update({ ghl_calendar_id: nuevo.id }).eq("id", emp.id);
    if (errGuardar) return fallo(`El calendario se creó en GHL pero no se pudo guardar el vínculo (${errGuardar.message}).`);
    return NextResponse.json({ ok: true, accion: "creado", nombre: emp.nombre, calendarId: nuevo.id, usuario: usuario.name || usuario.email || usuario.id, ...(nuevo.aviso ? { aviso: nuevo.aviso } : {}) });
  } catch (err) {
    console.error("sync-empleada:", err);
    return fallo(err.message || "Error al sincronizar la empleada con GHL");
  }
}
