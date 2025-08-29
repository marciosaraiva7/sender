import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="w-full h-dvh flex flex-col justify-center items-center gap-4">
      <h1 className="text-2xl font-bold">Tela inicial</h1>
      <Button asChild>
        <Link href="/upload">Ir para upload</Link>
      </Button>
    </main>
  );
}
