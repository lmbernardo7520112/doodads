// =============================================================
// 🌐 lib/api.ts
// -------------------------------------------------------------
// Cliente Axios configurado para comunicação com o backend Express.
// Usa variável de ambiente NEXT_PUBLIC_API_URL.
// =============================================================

import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api",
  withCredentials: true, // Permite envio de cookies se necessário
  headers: {
    "Content-Type": "application/json",
  },
});

console.log("🔧 API Base URL:", process.env.NEXT_PUBLIC_API_URL);


export default api;

