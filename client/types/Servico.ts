// =============================================================
// 📘 Tipagem única e compartilhada para o front-end
// =============================================================

export interface Servico {
  _id: string;
  nome: string;
  descricao?: string;     // opcional
  preco: number;
  duracaoMin?: number;    // opcional
  barbearia?: string;     // opcional, usado em contexto relacional
}
