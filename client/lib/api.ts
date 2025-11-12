// =============================================================
// 🌐 lib/api.ts
// -------------------------------------------------------------
// Cliente Axios com interceptador de refresh automático
// =============================================================
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

console.log("🔧 API Base URL:", process.env.NEXT_PUBLIC_API_URL);

// -------------------------------------------------------------
// 🔁 Interceptador para renovar token automaticamente
// -------------------------------------------------------------
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (
      error.response &&
      error.response.status === 401 &&
      !original._retry
    ) {
      original._retry = true;
      const stored = localStorage.getItem("auth");
      if (!stored) {
        window.dispatchEvent(new Event("session-expired"));
        return Promise.reject(error);
      }

      const { token, user } = JSON.parse(stored);
      try {
        const res = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          { token }
        );
        const newToken = res.data.token;
        localStorage.setItem("auth", JSON.stringify({ token: newToken, user }));
        original.headers["Authorization"] = `Bearer ${newToken}`;
        return api(original);
      } catch (err) {
        console.error("🚫 Falha ao renovar token:", err);
        window.dispatchEvent(new Event("session-expired"));
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
