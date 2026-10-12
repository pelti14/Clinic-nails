import ReservaOnline from "../../components/ReservaOnline";

// La página que se comparte con las clientas: no necesita código y no enseña nada interno.
export const metadata = {
  title: "Reservar cita",
  description: "Reserva tu cita online: elige servicio, día y hora.",
};

export default function PaginaReservar() {
  return <ReservaOnline />;
}
