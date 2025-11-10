import express from 'express';
import { config } from 'dotenv';
import { connectToMongo } from './config/db';

config();  // Carrega .env

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para JSON
app.use(express.json());

// Rota de teste
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Servidor rodando e conectado ao DB!' });
});

// Conecta ao MongoDB e inicia o servidor
(async () => {
  await connectToMongo();
  app.listen(PORT, () => {
    console.log(`🚀 Servidor Express rodando na porta ${PORT}`);
  });
})();