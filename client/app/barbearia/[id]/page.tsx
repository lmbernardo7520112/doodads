//client/app/barbearia/[id]/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import api from "@/lib/api";
import ServiceCard from "@/components/ui/ServiceCard";
import { useAuth } from "@/context/AuthContext";
import { Servico } from "@/types/Servico";
import { toast } from "react-hot-toast";

interface Endereco {
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  cep: string;
}

interface Barbearia {
  _id: string;
  nome: string;
  imagem: string;
  endereco: Endereco;
  telefone1?: string;
  telefone2?: string;
  descricao?: string;
}

export default function BarbeariaPage() {
  const { id } = useParams<{ id: string }>();
  const { user, token } = useAuth();
  const router = useRouter();

  const [barbearia, setBarbearia] = useState<Barbearia | null>(null);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ==========================================================
  // 🔄 Buscar dados da barbearia e serviços
  // ==========================================================
  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [barbRes, servRes] = await Promise.all([
          api.get(`/barbearias/${id}`),
          api.get(`/servicos/${id}`),
        ]);
        setBarbearia(barbRes.data);
        setServicos(servRes.data);
      } catch (err: any) {
        console.error("❌ Erro ao carregar barbearia:", err);
        setError("Não foi possível carregar os dados da barbearia.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // ==========================================================
  // 🧾 Função de reserva (mantida)
  // ==========================================================
  const reservar = async (servico: Servico) => {
    try {
      if (!user) {
        alert("Faça login para reservar um serviço.");
        router.push("/login");
        return;
      }

      const response = await api.post(
        "/reservas",
        {
          barbearia: id,
          servico: servico._id,
          dataHora: new Date(Date.now() + 60 * 60 * 1000),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(`✅ Reserva confirmada para ${servico.nome}!`);
      router.push("/home");
    } catch (err: any) {
      if (err.response) {
        alert(
          `Erro ${err.response.status}: ${
            err.response.data?.error ?? "Falha ao reservar."
          }`
        );
      } else {
        alert("Erro inesperado ao realizar reserva.");
      }
    }
  };

  // ==========================================================
  // 🕓 Estados de carregamento e erro
  // ==========================================================
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Carregando barbearia...</p>
      </div>
    );
  }

  if (error || !barbearia) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-red-500">{error ?? "Barbearia não encontrada."}</p>
      </div>
    );
  }

  // ==========================================================
  // 💅 Renderização principal
  // ==========================================================
  const enderecoFormatado = barbearia.endereco
    ? `${barbearia.endereco.rua}, ${barbearia.endereco.numero} — ${barbearia.endereco.bairro}, ${barbearia.endereco.cidade}`
    : "Endereço não informado";

  const encodedAddress = encodeURIComponent(enderecoFormatado);

  const handleCopyPhone = (telefone: string) => {
    navigator.clipboard.writeText(telefone);
    toast.success("📞 Copiado!");
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* 🖼️ Imagem da Barbearia */}
      <div className="relative h-56 w-full rounded-xl overflow-hidden shadow-md bg-gray-100">
        <Image
          src={barbearia.imagem || "/placeholder.svg"}
          alt={`Foto da ${barbearia.nome}`}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      </div>

      {/* 📋 Informações da Barbearia */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">{barbearia.nome}</h1>
        <p className="text-sm text-gray-500">{enderecoFormatado}</p>

        {/* Telefones com botão copiar */}
        {(barbearia.telefone1 || barbearia.telefone2) && (
          <div className="flex flex-col gap-1">
            {[barbearia.telefone1, barbearia.telefone2]
              .filter(Boolean)
              .map((t, i) => (
                <button
                  key={i}
                  onClick={() => handleCopyPhone(t!)}
                  className="text-sm text-emerald-600 hover:text-emerald-700 transition flex items-center gap-2"
                >
                  📞 {t}
                  <span className="text-xs text-gray-400 hover:text-emerald-400">
                    Copiar
                  </span>
                </button>
              ))}
          </div>
        )}
      </div>

      {/* 🗺️ Mapa Google Maps */}
      <div className="rounded-xl overflow-hidden shadow-md border border-gray-200">
        <iframe
          src={`https://maps.google.com/maps?q=${encodedAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
          width="100%"
          height="250"
          loading="lazy"
          className="border-0"
        />
      </div>

      {/* 🧾 Sobre Nós */}
      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-gray-500">SOBRE NÓS</h2>
        <p className="text-sm text-gray-600">
          {barbearia.descricao ?? "Barbearia parceira."}
        </p>
      </div>

      {/* 💇 Serviços */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-500">SERVIÇOS</h2>

        {servicos.length === 0 ? (
          <p className="text-sm text-gray-400 italic">
            Nenhum serviço cadastrado ainda.
          </p>
        ) : (
          <div className="grid gap-3">
            {servicos.map((s) => (
              <ServiceCard key={s._id} servico={s} barbeariaId={id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
