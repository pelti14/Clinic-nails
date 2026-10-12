import "./globals.css";
import { SCRIPT_MARCA_INICIAL } from "../lib/negocio";

export const metadata = {
  title: "Clinic Nails & Beauty — Agenda interna",
  description:
    "Panel interno: agenda, empleadas, servicios, cabinas y fichajes de Clinic Nails & Beauty.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

// Se ejecuta antes de pintar la página: aplica el modo oscuro y los colores
// personalizados guardados, para evitar el parpadeo de los colores por defecto.
const temaInicial = `try{var d=localStorage.getItem('cnb_theme')==='dark';if(d)document.documentElement.setAttribute('data-theme','dark');var v=JSON.parse(localStorage.getItem('cnb_theme_vars')||'null');if(v){var m=d?v.oscuro:v.claro;for(var k in m){document.documentElement.style.setProperty(k,m[k])}}}catch(e){}`;

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: temaInicial }} />
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_MARCA_INICIAL }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
