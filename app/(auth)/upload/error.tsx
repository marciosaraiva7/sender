"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="w-full h-dvh grid place-items-center p-6">
      <div className="max-w-md text-center space-y-3">
        <h2 className="text-xl font-semibold">
          Não foi possível carregar a página
        </h2>
        <p className="text-muted-foreground text-sm">
          {error?.message || "Ocorreu um erro inesperado."}
        </p>
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => reset()}
            className="rounded-md border px-3 py-2 text-sm"
          >
            Tentar novamente
          </button>
          <Link
            href="/"
            className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}
