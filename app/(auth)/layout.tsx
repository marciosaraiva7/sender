import AppNavbar from "@/components/app-navbar";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-dvh flex flex-col">
      <AppNavbar />
      <main className="flex-1">{children}</main>
    </div>
  );
}

