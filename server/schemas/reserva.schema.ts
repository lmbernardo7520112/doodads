import { z } from "zod";

export const criarReservaSchema = z.object({
  body: z.object({
    barbearia: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID da barbearia inválido"),
    servico: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID do serviço inválido"),
    dataHora: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Data e hora inválidas",
    }),
    valor: z.number().positive("Valor deve ser positivo").optional(),
  }).strict(),
});
