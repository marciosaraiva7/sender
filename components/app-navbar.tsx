"use client";

import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function AppNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch {
      // ignora erros de signOut
    }
    // Remove cookie de sessão usado no middleware
    document.cookie = "token=; Max-Age=0; path=/";
    router.push("/login");
  };

  const avatarUrl = user?.photoURL || undefined;
  const avatarAlt = user?.displayName || user?.email || "Usuário";
  const fallback = (user?.displayName || user?.email || "U")
    .slice(0, 1)
    .toUpperCase();

  // Esconde a navbar na página de login
  if (pathname === "/login") return null;

  return (
    <header className="w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="font-semibold tracking-tight flex items-center gap-2"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/netune.png"
              alt="Sender IA"
              width={38}
              height={32}
              className="mr-[-5px]"
            />
            <img
              src="/logo-sender.png"
              alt="Sender IA"
              width={120}
              height={20}
            />
          </Link>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className={classNames(
              "group inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5",
              "hover:bg-accent hover:text-accent-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <span className="relative inline-flex h-8 w-8 shrink-0 overflow-hidden rounded-full bg-muted">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={avatarAlt}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-sm font-medium">
                  {fallback}
                </span>
              )}
            </span>
            <span className="text-sm text-muted-foreground max-w-[140px] truncate">
              {user?.displayName || user?.email || "Conta"}
            </span>
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-48 rounded-md border bg-popover text-popover-foreground shadow-md focus:outline-none"
            >
              <button
                role="menuitem"
                onClick={handleLogout}
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
              >
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default AppNavbar;
