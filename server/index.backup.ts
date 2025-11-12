import express from "express";
import dotenv from "dotenv";
import { connectToMongo } from "./config/db";
import authRoutes from "./routes/auth.routes";
import protectedRoutes from "./routes/protected.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware base
app.use(express.json());

// Conexão com MongoDB
connectToMongo();

// Rotas
app.use("/api/auth", authRoutes);
app.use("/api/test", protectedRoutes);

// Inicialização
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
