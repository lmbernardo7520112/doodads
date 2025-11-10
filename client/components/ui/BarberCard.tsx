import Image from "next/image";
import Link from "next/link";

// Defina uma interface para as props
interface BarberCardProps {
  barbearia: {
    _id: string;
    imagem: string;
    nome: string;
    endereco: string;
  };
}

export default function BarberCard({ barbearia }: BarberCardProps) {
  return (
    <Link href={`/barbearia/${barbearia._id}`}>
      <div className="rounded-card overflow-hidden shadow-card bg-white transition-transform hover:scale-[1.02]">
        <div className="relative h-48 w-full">
          <Image src={barbearia.imagem} alt={barbearia.nome} fill className="object-cover" />
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg">{barbearia.nome}</h3>
          <p className="text-sm text-gray-500">{barbearia.endereco}</p>
        </div>
      </div>
    </Link>
  );
}