// =============================================================
// 💈 components/BarberDashboard.tsx
// -------------------------------------------------------------
// Painel Operacional para Barbeiros gerenciarem pagamentos manuais.
// Permite listar, confirmar recebimento e expirar pagamentos.
// =============================================================

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import toast from "react-hot-toast";
import {
  CheckCircle,
  Clock,
  Timer,
  AlertTriangle,
  User,
  Phone,
  Calendar,
  DollarSign,
  Loader2,
  RefreshCw,
} from "lucide-react";

export default function BarberDashboard() {
  const { user, token } = useAuth();
  const [barbearia, setBarbearia] = useState<any>(null);
  const [pagamentos, setPagamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 1. Carregar barbearia do barbeiro logado
  const fetchBarbearia = async () => {
    try {
      const res = await api.get("/barbearias", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const barbearias = Array.isArray(res.data) ? res.data : [];
      const minha = barbearias.find(
        (b: any) =>
          b.barbeiro === user?.id || b.barbeiro?._id === user?.id
      );
      if (minha) {
        setBarbearia(minha);
        return minha._id;
      }
      return null;
    } catch (err) {
      console.error("Erro ao carregar barbearia:", err);
      toast.error("Não foi possível identificar sua barbearia.");
      return null;
    }
  };

  // 2. Carregar pagamentos manuais
  const fetchPagamentos = async (barbeariaId: string, filter: string, pageNum: number) => {
    try {
      setRefreshing(true);
      const params: any = { page: pageNum, limit: 10 };
      if (filter !== "all") {
        params.status = filter;
      }
      const res = await api.get(`/barbearias/${barbeariaId}/pagamentos-manuais`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      setPagamentos(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch (err: any) {
      console.error("Erro ao carregar pagamentos:", err);
      toast.error("Erro ao carregar pagamentos da barbearia.");
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    const bId = await fetchBarbearia();
    if (bId) {
      await fetchPagamentos(bId, statusFilter, page);
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && user) {
      loadData();
    }
  }, [token, user]);

  useEffect(() => {
    if (barbearia) {
      fetchPagamentos(barbearia._id, statusFilter, page);
    }
  }, [statusFilter, page]);

  // Ação: Confirmar recebimento
  const handleConfirm = async (p: any) => {
    const confirmText = `⚠️ ATENÇÃO: Confirme apenas se o pagamento de R$ ${(
      p.amountCents / 100
    ).toFixed(2)} foi recebido diretamente por fora do app (ex: Pix da barbearia).\n\nO Doodads não processa Pix real nem recebe o dinheiro.\n\nDeseja confirmar o recebimento?`;

    const confirmed = window.confirm(confirmText);
    if (!confirmed) return;

    try {
      await api.patch(
        `/reservas/pagamento-manual/${p.bookingPaymentId}/confirmar`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Recebimento confirmado com sucesso!");
      fetchPagamentos(barbearia._id, statusFilter, page);
    } catch (err: any) {
      console.error("Erro ao confirmar pagamento:", err);
      const msg = err.response?.data?.message || "Erro ao confirmar pagamento.";
      toast.error(msg);
    }
  };

  // Ação: Marcar como expirado
  const handleExpire = async (p: any) => {
    const confirmed = window.confirm(
      "Deseja marcar este pagamento pendente vencido como expirado?"
    );
    if (!confirmed) return;

    try {
      await api.patch(
        `/reservas/pagamento-manual/${p.bookingPaymentId}/expirar`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Pagamento marcado como expirado.");
      fetchPagamentos(barbearia._id, statusFilter, page);
    } catch (err: any) {
      console.error("Erro ao expirar pagamento:", err);
      const msg = err.response?.data?.message || "Erro ao expirar pagamento.";
      toast.error(msg);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-gray-900" />
        <p className="text-gray-500 text-sm">Carregando painel...</p>
      </div>
    );
  }

  if (!barbearia) {
    return (
      <div className="text-center p-6 bg-red-50 rounded-xl border border-red-200">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-2" />
        <p className="text-red-700 font-medium">Nenhuma barbearia vinculada ao seu usuário.</p>
        <p className="text-red-600 text-sm mt-1">Entre em contato com o suporte técnico.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Painel Operacional</h1>
          <p className="text-sm text-gray-500">💈 {barbearia.nome}</p>
        </div>
        <button
          onClick={loadData}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Atualizar
        </button>
      </div>

      {/* Alerta Educativo */}
      <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs leading-relaxed">
        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-semibold">Aviso Importante sobre Pagamentos Manuais</p>
          <p className="mt-1">
            O Doodads <strong>não intermedia valores</strong>, não gera chaves Pix, nem processa transações reais.
            O cliente deve pagar por fora diretamente à barbearia. Confirme o recebimento na lista abaixo
            <strong> apenas depois de verificar o saldo</strong> na sua conta bancária.
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { id: "pending", label: "Pendentes" },
          { id: "paid", label: "Confirmados" },
          { id: "expired", label: "Expirados" },
          { id: "all", label: "Todos" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => {
              setStatusFilter(f.id);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
              statusFilter === f.id
                ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista de pagamentos */}
      {refreshing && pagamentos.length === 0 ? (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="w-6 h-6 animate-spin text-gray-900" />
        </div>
      ) : pagamentos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100 shadow-sm">
          <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 font-medium">Nenhum pagamento encontrado.</p>
          <p className="text-gray-400 text-xs mt-1">Nenhum registro corresponde ao filtro selecionado.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pagamentos.map((p) => {
            const dateStr = new Date(p.reserva?.dataHora || p.createdAt).toLocaleString("pt-BR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            const statusInfo = p.paymentStatusPresentation || {
              label: p.paymentStatus,
              tone: "warning",
            };

            const toneMap: Record<string, string> = {
              success: "text-green-700 bg-green-50 border-green-200",
              warning: "text-amber-700 bg-amber-50 border-amber-200",
              danger: "text-red-700 bg-red-50 border-red-200",
            };
            const badgeTone = toneMap[statusInfo.tone] || "text-gray-700 bg-gray-50 border-gray-200";

            return (
              <div
                key={p.bookingPaymentId}
                className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition space-y-3"
              >
                {/* Linha 1: Serviço e Preço */}
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="font-bold text-gray-900">{p.reserva?.servico?.nome || "Serviço"}</h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" />
                      {dateStr}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-gray-900">
                      R$ {(p.amountCents / 100).toFixed(2)}
                    </span>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badgeTone}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Linha 2: Cliente */}
                {p.reserva?.usuario && (
                  <div className="pt-2 border-t border-gray-50 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-medium truncate">{p.reserva.usuario.nomeCompleto}</span>
                    </div>
                    {p.reserva.usuario.telefone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <span>{p.reserva.usuario.telefone}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Linha 3: Ações */}
                {(p.canConfirm || p.canExpire) && (
                  <div className="pt-3 border-t border-gray-50 flex flex-wrap gap-2">
                    {p.canConfirm && (
                      <button
                        onClick={() => handleConfirm(p)}
                        className="flex-1 min-w-[150px] bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold py-2 px-4 rounded-lg transition"
                      >
                        Confirmar recebimento
                      </button>
                    )}
                    {p.canExpire && (
                      <button
                        onClick={() => handleExpire(p)}
                        className="flex-1 min-w-[150px] bg-red-650 hover:bg-red-700 text-white text-xs font-semibold py-2 px-4 rounded-lg transition"
                      >
                        Marcar como expirado
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-2">
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium hover:bg-gray-50 disabled:opacity-50 transition"
          >
            Anterior
          </button>
          <span className="text-xs text-gray-500 font-medium">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium hover:bg-gray-50 disabled:opacity-50 transition"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
