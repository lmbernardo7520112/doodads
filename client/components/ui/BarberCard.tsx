//client/components/ui/BarberCard.tsx

"use client";

import Image from "next/image";
import Link from "next/link";

// =============================================================
// 💈 Tipagem completa e segura
// -------------------------------------------------------------
interface Endereco {
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  cep: string;
}

interface BarberCardProps {
  barbearia: {
    _id: string;
    imagem?: string;
    nome: string;
    endereco?: Endereco; // ✅ agora é objeto, não string
    telefone1?: string;
    telefone2?: string;
  };
}

// =============================================================
// 💇‍♂️ Componente de Card de Barbearia
// -------------------------------------------------------------
export default function BarberCard({ barbearia }: BarberCardProps) {
  // Monta endereço formatado de forma segura
  const enderecoFormatado = barbearia.endereco
    ? `${barbearia.endereco.rua}, ${barbearia.endereco.numero} — ${barbearia.endereco.bairro}, ${barbearia.endereco.cidade}`
    : "Endereço não informado";

  // Usa imagem padrão caso não exista
  const imageSrc = barbearia.imagem || "/https://i.ytimg.com/vi/X1_2e8FOW2Y/maxresdefault.jpg";

  return (
    <Link href={`/barbearia/${barbearia._id}`} prefetch={false}>
      <div className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-transform hover:scale-[1.02] bg-white">
        {/* Imagem da barbearia */}
        <div className="relative h-48 w-full bg-gray-100">
          <Image
            src={imageSrc}
            alt={`Imagem da ${barbearia.nome}`}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        </div>

        {/* Conteúdo textual */}
        <div className="p-4 space-y-1">
          <h3 className="font-semibold text-lg text-gray-900">
            {barbearia.nome}
          </h3>
          <p className="text-sm text-gray-600">{enderecoFormatado}</p>

          {/* Telefones opcionais */}
          {(barbearia.telefone1 || barbearia.telefone2) && (
            <p className="text-xs text-gray-500 mt-1">
              📞 {barbearia.telefone1 || barbearia.telefone2}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
