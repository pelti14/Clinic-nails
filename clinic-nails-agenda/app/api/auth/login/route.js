import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/servidorDb";
import { esCodigoValido } from "../../../../lib/codigo";
import { registrarActividad } from "../../../../lib/actividadServidor";
import { hashCodigo, crearSesion, cookieSesion, ipDe, bloqueado, registrarFallo, limpiarFallos, origenValido, cifrarCodigosPendientes } from "../../../../lib/servidor";

export const dynamic = "force-dynamic";
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
const MAX_POR_IP = 8; // intentos fallidos por IP cada 10 min
const MAX_GLOBAL = 60; // y en total, para frenar ataques repartidos

export async function POST(request) {
  try {
    if (!origenValido(request)) return NextResponse.json({ ok: false, error: "Origen no permitido." }, { status: 403 });
    const ip = ipDe(request);
    if (bloqueado(`login:${ip}`, MAX_POR_IP) || bloqueado("login:global", MAX_GLOBAL)) {
      return NextResponse.json({ ok: false, error: "Demasiados intentos fallidos. Espera unos minutos." }, { status: 429 });
    }

    const { codigo } = await request.json();
    const fallo = async () => {
      await registrarActividad([{ usuario_id: null, usuario_nombre: "(código incorrecto)", origen: "app", entidad: "sesion", entidad_id: null, accion: "login_fallido", resumen: "Intento fallido de entrada con un código", detalle: { ip } }]);
      registrarFallo(`login:${ip}`);
      registrarFallo("login:global");
      await pausa(250);
      return NextResponse.json({ ok: false, error: "Código incorrecto" }, { status: 401 });
    };
    if (!esCodigoValido(codigo)) return fallo();

    await cifrarCodigosPendientes(); // migra los códigos antiguos en claro la primera vez
    const { data, error } = await supabase.from("empleadas").select("id, nombre, rol, activa, permisos").eq("codigo_hash", hashCodigo(codigo));
    if (error) {
      // Un fallo de configuración NO es «código incorrecto»: se dice qué falta
      const falta = /codigo_hash/i.test(error.message || "");
      console.error("login (base de datos):", error.message);
      return NextResponse.json(
        { ok: false, error: falta ? "Falta un paso en Supabase: pega y ejecuta supabase/schema.sql (crea la columna codigo_hash)." : `Error de la base de datos: ${error.message}` },
        { status: 500 }
      );
    }
    const u = (data || []).find((e) => e.activa);
    if (!u) return fallo();

    limpiarFallos(`login:${ip}`);
    await registrarActividad([{ usuario_id: u.id, usuario_nombre: u.nombre, origen: "app", entidad: "sesion", entidad_id: u.id, accion: "login", resumen: "Entró con su código", detalle: {} }]);
    const respuesta = NextResponse.json({ ok: true, usuario: { id: u.id, nombre: u.nombre, rol: u.rol || "empleada", permisos: u.permisos || {} } });
    respuesta.headers.append("Set-Cookie", cookieSesion(await crearSesion(u.id), request));
    return respuesta;
  } catch (err) {
    console.error("login:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
