"use client";

import Link from "next/link";
import * as React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Log to console or an error reporting service
    // eslint-disable-next-line no-console
    console.error("Global error:", error);
  }, [error]);

  return (
    <html>
      <body className="min-h-dvh grid place-items-center p-6">
        <div className="max-w-md text-center space-y-3">
          <h2 className="text-xl font-semibold">Algo deu errado</h2>
          <p className="text-muted-foreground text-sm">
            Houve um problema ao carregar a aplicação. Você pode tentar
            novamente.
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => reset()}
              className="rounded-md border px-3 py-2 text-sm"
            >
              Tentar novamente
            </button>
            <Link
              href="/login"
              className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white"
            >
              Ir para login
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
