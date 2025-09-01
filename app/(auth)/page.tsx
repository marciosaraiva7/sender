import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="w-full h-dvh flex flex-col justify-center items-center gap-4">
      <h1 className="text-2xl font-bold">Tela inicial</h1>
      <Button asChild className="bg-blue-700 hover:bg-blue-800">
        <Link href="/upload">Ir para upload</Link>
      </Button>
    </main>
  );
}
