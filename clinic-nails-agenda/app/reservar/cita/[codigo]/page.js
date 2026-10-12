import GestionarCita from "../../../../components/GestionarCita";

// La página que se abre con el enlace de una cita (el que mandas desde GHL): no sale en Google y la cita solo se ve con su enlace firmado.
export const metadata = {
  title: "Tu cita",
  robots: { index: false, follow: false },
};

export default function PaginaCita({ params }) {
  return <GestionarCita codigo={params.codigo} />;
}
