"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function useRoleRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }
    if (location.pathname === "/login" || location.pathname === "/register") {
      router.push("/home");
    }
  }, [user, loading]);
}
