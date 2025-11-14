export interface IBarbearia {
  _id: string;
  nome: string;
  endereco: {
    rua: string;
    numero: string;
    bairro: string;
    cidade: string;
  };
  imagem?: string;
}
