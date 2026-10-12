// Longitud del código de acceso (PIN): 5 dígitos para TODOS. Se usa igual en la pantalla y en el servidor.
export const LONGITUD_CODIGO = 5;
export const esCodigoValido = (c) => new RegExp(`^\\d{${LONGITUD_CODIGO}}$`).test(String(c ?? ""));
