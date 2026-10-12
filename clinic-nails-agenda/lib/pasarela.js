// NAVEGADOR. La app ya no habla con la base de datos directamente: este objeto imita
// las pocas llamadas que usa db.js (from/select/insert/update/delete/upsert/eq/order)
// pero las envía a /api/db, donde el servidor comprueba la sesión y los permisos.

async function llamar(cuerpo) {
  let res;
  try {
    res = await fetch("/api/db", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo), credentials: "same-origin" });
  } catch (e) {
    return { data: null, error: new Error("No hay conexión con el servidor.") };
  }
  let json = null;
  try {
    json = await res.json();
  } catch (e) {
    json = null;
  }
  if (res.status === 401 && typeof window !== "undefined") window.dispatchEvent(new Event("cnb-sesion-caducada"));
  if (!res.ok || json?.error) return { data: null, error: new Error(json?.error || `Error ${res.status}`) };
  return { data: json?.data ?? null, error: null };
}

class Consulta {
  constructor(tabla) {
    this.t = { tabla, op: "select", filtros: [] };
  }
  select(columnas) {
    if (this.t.op === "select") this.t.columnas = columnas;
    return this;
  }
  insert(datos) {
    this.t.op = "insert";
    this.t.datos = datos;
    return this;
  }
  update(datos) {
    this.t.op = "update";
    this.t.datos = datos;
    return this;
  }
  delete() {
    this.t.op = "delete";
    return this;
  }
  upsert(datos, opciones) {
    this.t.op = "upsert";
    this.t.datos = datos;
    if (opciones?.onConflict) this.t.onConflict = opciones.onConflict;
    return this;
  }
  eq(col, valor) {
    this.t.filtros.push([col, valor]);
    return this;
  }
  limit(n) {
    this.t.limite = n;
    return this;
  }
  lt(col, valor) {
    if (col === "created_at") this.t.antes = valor; // solo para paginar el registro de actividad
    return this;
  }
  order(col, opciones) {
    this.t.orden = { col, asc: opciones?.ascending !== false };
    return this;
  }
  then(resolver, rechazar) {
    return llamar(this.t).then(resolver, rechazar);
  }
}

export const supabase = { from: (tabla) => new Consulta(tabla) };
