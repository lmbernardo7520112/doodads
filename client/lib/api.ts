// =============================================================
// 🌐 lib/api.ts
// -------------------------------------------------------------
// Cliente Axios com suporte a refresh token e baseURL confiável
// Agora 100% compatível com Stripe Checkout e ambiente Next/Vite
// =============================================================

import axios from "axios";

// -------------------------------------------------------------
// 📌 BaseURL correta (evita erro de chamar o frontend por engano)
// -------------------------------------------------------------
const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
  "http://localhost:3000/api";

// -------------------------------------------------------------
// 🛠️ Instância principal do Axios
// -------------------------------------------------------------
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Debug opcional
console.log("🔧 API Base URL carregada:", BASE_URL);

// =============================================================
// 🔁 Interceptador de resposta — renovação automática do token
// =============================================================
api.interceptors.response.use(
  (res) => res,

  async (error) => {
    const original = error.config;

    // ❗Evita loop infinito
    if (!error.response) return Promise.reject(error);

    const shouldRefresh =
      error.response.status === 401 && !original._retry;

    if (!shouldRefresh) return Promise.reject(error);

    original._retry = true;

    // ---------------------------------------------------------
    // 📌 Busca o token atual do localStorage
    // ---------------------------------------------------------
    const stored = localStorage.getItem("auth");
    if (!stored) {
      window.dispatchEvent(new Event("session-expired"));
      return Promise.reject(error);
    }

    const { token, user } = JSON.parse(stored);

    try {
      // ---------------------------------------------------------
      // 🔄 Requisita novo token
      // ---------------------------------------------------------
      const res = await axios.post(`${BASE_URL}/auth/refresh`, { token });

      const newToken = res.data.token;

      // Salva novamente
      localStorage.setItem(
        "auth",
        JSON.stringify({ token: newToken, user })
      );

      // Reaplica Authorization no request original
      original.headers["Authorization"] = `Bearer ${newToken}`;

      // 🔥 Reexecuta o request original
      return api(original);
    } catch (err) {
      console.error("🚫 Falha ao renovar token:", err);
      window.dispatchEvent(new Event("session-expired"));
      return Promise.reject(err);
    }
  }
);

export default api;
