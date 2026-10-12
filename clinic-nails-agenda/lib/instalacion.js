// SOLO SERVIDOR. «Primera configuración»: lo que se pregunta al instalar la agenda en un negocio nuevo (otro hosting y otra base de datos).
// Solo sale en una instalación NUEVA: sin el ajuste «instalacion» y sin ninguna cita ni clienta. Una instalación que ya se usa (como la
// tuya) se marca como configurada sola la primera vez que se mira, así que nunca se le pregunta.
// La base de datos se recibe como parámetro (así se prueba sin red).
import { limpiarNombre, validarNombre } from "./negocio";
import { normalizarContacto, validarContacto } from "./contacto";
import { esCodigoValido, LONGITUD_CODIGO } from "./codigo";

// Lo que trae schema.sql de ejemplo (se puede borrar al terminar)
export const EJEMPLOS = {
  empleadas: ["genesis", "silvia"],
  servicios: ["skin", "eternal", "slim", "dermapen", "manicura", "pedicura"],
};
export const CODIGOS_FACILES = ["00000", "11111", "22222", "33333", "44444", "55555", "66666", "77777", "88888", "99999", "12345", "54321", "01234"];

const cuenta = async (supabase, tabla) => {
  const r = await supabase.from(tabla).select("id", { count: "exact", head: true });
  return r.error ? 0 : r.count || 0;
};

// → { pendiente: boolean }. Si ya hay datos de uso real, deja la instalación marcada como configurada.
export async function estadoInstalacion(supabase) {
  const { data, error } = await supabase.from("ajustes").select("valor").eq("clave", "instalacion").maybeSingle();
  if (error) return { pendiente: false, error: error.message }; // sin la tabla de ajustes no se molesta con nada
  if (data?.valor?.completada) return { pendiente: false };
  const [citas, clientes] = await Promise.all([cuenta(supabase, "citas"), cuenta(supabase, "clientes")]);
  if (citas > 0 || clientes > 0) {
    await supabase.from("ajustes").upsert({ clave: "instalacion", valor: { completada: true, automatica: true, fecha: new Date().toISOString() } });
    return { pendiente: false };
  }
  return { pendiente: true };
}

// Revisa lo que llega del formulario → { errores, datos }
export function validarInstalacion(b = {}) {
  const errores = {};
  const nombre = limpiarNombre(b.negocio?.nombre);
  const eNombre = validarNombre(b.negocio?.nombre);
  if (eNombre) errores.negocio = eNombre;
  const contacto = { telefono: b.negocio?.telefono || "", whatsapp: b.negocio?.whatsapp || "", direccion: b.negocio?.direccion || "", mapsUrl: b.negocio?.mapsUrl || "" };
  Object.assign(errores, validarContacto(contacto));
  const admin = String(b.admin?.nombre ?? "").replace(/\s+/g, " ").trim().slice(0, 40);
  if (!admin) errores.adminNombre = "Escribe tu nombre.";
  else if (/[<>]/.test(admin)) errores.adminNombre = "No uses los signos < ni >.";
  const codigo = String(b.admin?.codigo ?? "");
  if (!esCodigoValido(codigo)) errores.codigo = `Tu código tiene que tener ${LONGITUD_CODIGO} cifras.`;
  else if (CODIGOS_FACILES.includes(codigo)) errores.codigo = "Ese código es demasiado fácil de adivinar. Elige otro.";
  else if (String(b.admin?.repetir ?? "") !== codigo) errores.repetir = "Los dos códigos no coinciden.";
  return { errores, datos: { negocio: { nombre, ...normalizarContacto(contacto) }, admin: { nombre: admin, codigo }, borrarEjemplos: b.borrarEjemplos === true } };
}

// Guarda la primera configuración. `hashCodigo` se recibe para no depender aquí del secreto del servidor.
export async function completarInstalacion(supabase, usuario, cuerpo, { hashCodigo }) {
  const est = await estadoInstalacion(supabase);
  if (!est.pendiente) return { ok: false, status: 409, error: "Esta agenda ya está configurada." };
  const { errores, datos } = validarInstalacion(cuerpo);
  if (Object.keys(errores).length) return { ok: false, status: 400, error: "Revisa los campos marcados.", errores };

  const h = hashCodigo(datos.admin.codigo);
  const { data: otros } = await supabase.from("empleadas").select("id").eq("codigo_hash", h);
  if ((otros || []).some((e) => e.id !== usuario.id)) return { ok: false, status: 400, error: "Revisa los campos marcados.", errores: { codigo: "Ese código ya lo usa otra persona (de los ejemplos). Elige otro." } };

  const pasos = [
    supabase.from("ajustes").upsert({ clave: "negocio", valor: datos.negocio }),
    supabase.from("empleadas").update({ nombre: datos.admin.nombre, codigo_hash: h, codigo: null }).eq("id", usuario.id),
  ];
  for (const r of await Promise.all(pasos)) if (r.error) return { ok: false, status: 500, error: r.error.message };

  if (datos.borrarEjemplos) {
    // Primero los servicios (apuntan a las empleadas) y luego las empleadas de ejemplo; nunca la persona que está configurando
    const sv = await supabase.from("servicios").delete().in("id", EJEMPLOS.servicios);
    if (sv.error) return { ok: false, status: 500, error: `No se pudieron borrar los servicios de ejemplo: ${sv.error.message}` };
    const em = await supabase.from("empleadas").delete().in("id", EJEMPLOS.empleadas.filter((id) => id !== usuario.id)).neq("rol", "admin");
    if (em.error) return { ok: false, status: 500, error: `No se pudieron borrar las empleadas de ejemplo: ${em.error.message}` };
  }
  const fin = await supabase.from("ajustes").upsert({ clave: "instalacion", valor: { completada: true, fecha: new Date().toISOString(), por: usuario.id, ejemplosBorrados: datos.borrarEjemplos } });
  if (fin.error) return { ok: false, status: 500, error: fin.error.message };
  return { ok: true, negocio: datos.negocio.nombre, admin: datos.admin.nombre };
}
