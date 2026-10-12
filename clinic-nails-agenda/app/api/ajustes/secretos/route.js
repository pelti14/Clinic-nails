import { NextResponse } from "next/server";
import { verificarUsuario } from "../../../../lib/auth";
import { supabaseAdmin, hayServiceRole } from "../../../../lib/supabaseAdmin";
import { cargarConfigGHL } from "../../../../lib/configServidor";

export const dynamic = "force-dynamic";

// Claves secretas que se pueden guardar desde la app. Se guardan en una tabla
// que la clave pública de Supabase NO puede leer, y nunca se devuelven enteras.
const CLAVES_PERMITIDAS = ["ghl_api_key"];

export async function GET(request) {
  try {
    const auth = await verificarUsuario(request, { soloAdmin: true });
    if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

    const cfg = await cargarConfigGHL();
    let guardada = false;
    let ultimos4 = "";
    const admin = supabaseAdmin();
    if (admin) {
      const { data } = await admin.from("ajustes_privados").select("valor").eq("clave", "ghl_api_key").maybeSingle();
      if (data?.valor) {
        guardada = true;
        ultimos4 = data.valor.slice(-4);
      }
    }
    return NextResponse.json({
      ok: true,
      serviceRole: hayServiceRole(),
      ghlApiKey: { guardada, ultimos4, enEntorno: Boolean(process.env.GHL_API_KEY), origenActivo: cfg.origenClave },
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await verificarUsuario(request, { soloAdmin: true });
    if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

    const { clave, valor } = await request.json();
    if (!CLAVES_PERMITIDAS.includes(clave)) return NextResponse.json({ ok: false, error: "Clave no permitida" }, { status: 400 });

    const admin = supabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Para guardar claves desde la app hace falta añadir UNA variable en tu hosting: SUPABASE_SERVICE_ROLE_KEY (Supabase → Project Settings → API → service_role).",
        },
        { status: 400 }
      );
    }

    const limpio = String(valor ?? "").trim();
    if (limpio === "") {
      const { error } = await admin.from("ajustes_privados").delete().eq("clave", clave);
      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, borrada: true });
    }
    if (limpio.length < 20 || limpio.length > 300 || /\s/.test(limpio)) {
      return NextResponse.json({ ok: false, error: "La clave no parece válida (sin espacios, al menos 20 caracteres)." }, { status: 400 });
    }

    const { error } = await admin.from("ajustes_privados").upsert({ clave, valor: limpio, updated_at: new Date().toISOString() });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, ultimos4: limpio.slice(-4) });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
