// =============================================================
// 🌐 lib/api.ts
// -------------------------------------------------------------
// Cliente Axios com suporte a refresh token e baseURL confiável
// Agora 100% compatível com Stripe Checkout e ambiente Next/Vite
// =============================================================

// client/lib/api.ts
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
  "http://localhost:3000/api";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

console.log("🔧 API Base URL carregada:", BASE_URL);

// request interceptor: adiciona X-Request-Id + debug logs
api.interceptors.request.use(
  (config) => {
    try {
      // gerar request id para correlação
      const requestId = uuidv4();
      config.headers = config.headers || {};
      (config.headers as any)["X-Request-Id"] = requestId;

      // anexar Authorization apenas se já houver um auth no localStorage
      const stored = localStorage.getItem("auth");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed?.token) {
            (config.headers as any)["Authorization"] = `Bearer ${parsed.token}`;
          }
        } catch {}
      }

      // marca tempo inicial
      (config as any).metadata = { startTime: new Date().getTime(), requestId };

      console.debug(`📤 [API request] id=${requestId} ${config.method?.toUpperCase()} ${config.url}`);
    } catch (err) {
      console.error("Erro no request interceptor:", err);
    }
    return config;
  },
  (err) => Promise.reject(err)
);

// response interceptor: logs e tratamento de 401
api.interceptors.response.use(
  (res) => {
    try {
      const meta = (res.config as any).metadata || {};
      const duration = new Date().getTime() - (meta.startTime || Date.now());
      console.debug(
        `📥 [API response] id=${meta.requestId} ${res.status} ${res.config.url} duration=${duration}ms`
      );
    } catch {}
    return res;
  },
  async (error) => {
    try {
      const original = error.config;
      const meta = original ? (original as any).metadata || {} : {};
      const duration = new Date().getTime() - (meta.startTime || Date.now());
      console.warn(
        `⚠️ [API error] id=${meta.requestId || "?"} url=${original?.url} status=${error?.response?.status || "NETWORK"} duration=${duration}ms`
      );

      // token refresh existente (mantemos)
      if (!error.response) return Promise.reject(error);

      const shouldRefresh = error.response.status === 401 && !original._retry;
      if (!shouldRefresh) return Promise.reject(error);

      original._retry = true;

      const stored = localStorage.getItem("auth");
      if (!stored) {
        window.dispatchEvent(new Event("session-expired"));
        return Promise.reject(error);
      }

      const { token, user } = JSON.parse(stored);
      try {
        const resRefresh = await axios.post(`${BASE_URL}/auth/refresh`, { token });
        const newToken = resRefresh.data.token;
        localStorage.setItem("auth", JSON.stringify({ token: newToken, user }));

        original.headers["Authorization"] = `Bearer ${newToken}`;
        return api(original);
      } catch (err) {
        window.dispatchEvent(new Event("session-expired"));
        return Promise.reject(err);
      }
    } catch (err) {
      return Promise.reject(error);
    }
  }
);

export default api;