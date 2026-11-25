"use client";

import { useState } from "react";
import { Menu, Moon, Search, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { MobileSidebar, SidebarContent } from "./sidebar";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/primitives";

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  /**
   * O servidor não sabe qual tema o usuário escolheu, então escolher o
   * ícone no render causa hydration mismatch. Renderizamos os dois e
   * deixamos o CSS decidir pela classe .dark — sem efeito, sem flash.
   */
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Alternar tema claro e escuro"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Moon className="dark:hidden" />
      <Sun className="hidden dark:block" />
    </Button>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-dvh">
      {/* Sidebar fixa no desktop */}
      <aside className="fixed inset-y-0 left-0 hidden w-[248px] lg:block">
        <SidebarContent />
      </aside>

      <MobileSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col lg:pl-[248px]">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-subtle bg-surface/90 px-4 backdrop-blur-md lg:px-7">
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            aria-label="Abrir menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu />
          </Button>

          <label className="relative hidden min-w-0 max-w-sm flex-1 items-center sm:flex">
            <Search className="pointer-events-none absolute left-3 size-4 text-fg-muted" />
            <input
              type="search"
              placeholder="Buscar pessoas, grupos, eventos…"
              className="h-9 w-full rounded-full border border-line bg-canvas pl-9 pr-3 text-[13px] text-fg placeholder:text-fg-muted focus:border-interactive focus:outline-none"
            />
          </label>

          <div className="ml-auto flex items-center gap-2">
            <Badge tone="outline" className="hidden md:inline-flex">
              Protótipo · dados fictícios
            </Badge>
            <ThemeToggle />
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 lg:px-7 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
