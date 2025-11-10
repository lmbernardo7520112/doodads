// Defina uma interface para as props
interface AppointmentCardProps {
  reserva: {
    status: string;
    servico: string;
    barbearia: string;
    data: string;
    horario: string;
  };
}

export default function AppointmentCard({ reserva }: AppointmentCardProps) {
  const statusClass =
    reserva.status === "confirmado"
      ? "bg-green-100 text-green-700"
      : "bg-gray-100 text-gray-600";
  return (
    <div className="bg-white p-4 rounded-card shadow-card mb-3">
      <div className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${statusClass}`}>
        {reserva.status.toUpperCase()}
      </div>
      <h4 className="mt-2 font-medium">{reserva.servico}</h4>
      <p className="text-sm text-gray-500">{reserva.barbearia}</p>
      <p className="text-sm text-gray-400">{reserva.data} — {reserva.horario}</p>
    </div>
  );
}