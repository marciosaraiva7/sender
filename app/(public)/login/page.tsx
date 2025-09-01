"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import Logo from "././../../../public/netune.png";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [showInstall, setShowInstall] = React.useState(false);
  const deferredPromptRef = React.useRef<BeforeInstallPromptEvent | null>(null);

  // Detecta possibilidade de instalação PWA (Android/Chromium)
  React.useEffect(() => {
    const onBeforeInstall = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      setShowInstall(true);
    };
    window.addEventListener(
      "beforeinstallprompt",
      onBeforeInstall as EventListener
    );
    return () =>
      window.removeEventListener(
        "beforeinstallprompt",
        onBeforeInstall as EventListener
      );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao entrar");
      }
      document.cookie = `token=${data.token}; path=/`;
      router.push("/");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erro inesperado");
      }
      toast.error("Erro ao fazer login", {
        description: "Verifique suas credenciais e tente novamente",
        richColors: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-dvh flex justify-center items-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-2 mb-6">
          <Image
            src={Logo}
            alt="RDM Logo"
            width={160}
            height={48}
            priority
            className="mb-4"
          />
          <h1 className="text-xl text-left w-full font-semibold">
            Fazer login
          </h1>
          <h3 className="text-accent-foreground w-full text-left">
            Use suas credenciais do Sender
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 w-full">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full p-2 border rounded-md"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            className="w-full p-2 border rounded-md"
            required
          />
          {/* {error && <p className="text-red-500 text-sm">{error}</p>} */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white rounded-lg flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="inline-block h-4 w-4 rounded-full border-2 border-white/80 border-t-transparent animate-spin" />
                Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </button>
        </form>
      </div>

      {/* Drawer para instalar PWA */}
      {showInstall && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowInstall(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-xl border bg-background p-4 shadow-2xl">
            <div className="mx-auto max-w-sm">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold">Instalar aplicativo</h2>
                <button
                  type="button"
                  onClick={() => setShowInstall(false)}
                  className="text-sm text-muted-foreground hover:underline"
                >
                  Fechar
                </button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Adicione o Sender à tela inicial para uma experiência mais
                rápida.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                {deferredPromptRef.current ? (
                  <button
                    type="button"
                    onClick={async () => {
                      const e = deferredPromptRef.current;
                      if (!e || typeof e.prompt !== "function") return;
                      e.prompt();
                      const choice = await e.userChoice;
                      if (choice?.outcome === "accepted") setShowInstall(false);
                    }}
                    className="w-full h-10 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Instalar agora
                  </button>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Para instalar no iPhone/iPad: toque em Compartilhar →
                    “Adicionar à Tela de Início”.
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setShowInstall(false)}
                  className="w-full h-10 rounded-md border"
                >
                  Agora não
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
