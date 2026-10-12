// Descargar un archivo desde el navegador (JSON, CSV…). Solo se usa desde pantallas.
export function descargarTexto(nombre, texto, tipo = "application/json") {
  const blob = new Blob([texto], { type: `${tipo};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const descargarJSON = (nombre, datos) => descargarTexto(nombre, JSON.stringify(datos, null, 2), "application/json");
