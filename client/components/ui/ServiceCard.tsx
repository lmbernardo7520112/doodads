// Defina uma interface para as props
interface ServiceCardProps {
  servico: {
    nome: string;
    descricao: string;
    preco: number;
  };
  onReservar: (servico: ServiceCardProps['servico']) => void;  // Função que recebe o servico
}

export default function ServiceCard({ servico, onReservar }: ServiceCardProps) {
  return (
    <div className="flex justify-between items-center bg-gray-50 p-4 rounded-card mb-2">
      <div>
        <h4 className="font-semibold">{servico.nome}</h4>
        <p className="text-sm text-gray-500">{servico.descricao}</p>
        <p className="text-green-600 font-medium mt-1">R$ {servico.preco.toFixed(2)}</p>
      </div>
      <button
        onClick={() => onReservar(servico)}
        className="bg-green-500 text-white px-4 py-2 rounded-full hover:bg-green-600 transition"
      >
        Reservar
      </button>
    </div>
  );
}