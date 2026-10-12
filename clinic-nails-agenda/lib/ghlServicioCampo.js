// El servicio que ha pedido la clienta al bot de IA de GHL: el bot lo guarda en un campo del contacto llamado «Servicio»
// y la app lo lee al importar la cita. Funciones puras (sin red), probadas aparte.
import { normalizarTexto, elegirServicioPorTitulo } from "./agenda";

// De todos los campos personalizados de contacto de GHL, el que guarda el servicio: se llama «Servicio» (o algo que lo contiene,
// por ejemplo «Servicio solicitado» o la clave «contact.servicio»). Si hay varios, gana el que se llama exactamente «Servicio».
export function campoServicio(definiciones = []) {
  const puntos = (d) => {
    const nombre = normalizarTexto(d?.name || "");
    const clave = normalizarTexto(String(d?.fieldKey || "").replace(/^contact\./, ""));
    if (nombre === "servicio" || clave === "servicio") return 3;
    if (nombre.startsWith("servicio") || clave.startsWith("servicio")) return 2;
    if (nombre.includes("servicio") || clave.includes("servicio")) return 1;
    return 0;
  };
  return [...definiciones].map((d) => ({ d, p: puntos(d) })).filter((x) => x.p > 0).sort((a, b) => b.p - a.p)[0]?.d || null;
}

// Lo que tiene escrito ese contacto en el campo «Servicio» (texto, o la primera opción si es una lista)
export function valorCampoServicio(contacto, definiciones) {
  const def = campoServicio(definiciones);
  if (!def) return "";
  const campos = contacto?.customFields || contacto?.customField || [];
  const c = campos.find((f) => f?.id === def.id || (f?.key && f.key === def.fieldKey));
  let v = c?.value;
  if (Array.isArray(v)) v = v[0];
  return String(v ?? "").trim();
}

// El campo «Servicio» puede traer UN servicio («Skin Revival») o VARIOS («Dermapen y Radiofrecuencia», «Skin Revival, Manicura»).
// Si el texto es EXACTAMENTE el nombre de un servicio, es ese (un servicio puede llamarse «Manicura y pedicura»: no se parte). Si no, se parte por
// comas, «+», «y», «e», «;» o saltos de línea y CADA trozo tiene que reconocerse: si es así, son esos servicios (el primero, el principal);
// si algún trozo no se reconoce, NO se da por bueno (porTitulo = false) y la cita queda para revisar. → { servicios, porTitulo }
export function serviciosDelCampo(valor, servicios, empleada) {
  const n = normalizarTexto(valor);
  const exacto = n ? servicios.find((sv) => sv.activo !== false && normalizarTexto(sv.nombre) === n) : null;
  if (exacto) return { servicios: [exacto], porTitulo: true };
  const trozos = String(valor ?? "").split(/\s*(?:[,;+|\n]|\s+y\s+|\s+e\s+)\s*/i).map((t) => t.trim()).filter(Boolean);
  if (trozos.length > 1) {
    const hallados = trozos.map((t) => elegirServicioPorTitulo(t, servicios, empleada));
    const buenos = hallados.filter((h) => h.porTitulo && h.servicio);
    const unicos = [...new Map(buenos.map((h) => [h.servicio.id, h.servicio])).values()];
    return { servicios: unicos, porTitulo: buenos.length === trozos.length };
  }
  const entero = elegirServicioPorTitulo(valor, servicios, empleada);
  return { servicios: entero.servicio ? [entero.servicio] : [], porTitulo: entero.porTitulo };
}
