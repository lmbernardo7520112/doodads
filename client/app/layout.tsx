import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";
import { VoiceAssistant } from "@/components/VoiceAssistant";

export const metadata = {
  title: "Doodads",
  description: "SaaS de agendamentos para barbearias",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          <Navbar />
          <main className="mx-auto max-w-3xl p-4">{children}</main>
          <VoiceAssistant />
          <Footer />
          {/* 🔔 Toasts globais */}
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
