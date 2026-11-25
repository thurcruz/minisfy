"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronsUpDown, Lock, PanelLeftClose, X } from "lucide-react";
import { navigation } from "@/config/navigation";
import { organization, units } from "@/mocks/queries";
import { MinisfyLogo } from "@/ui/logo";
import { cn } from "@/lib/utils";

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Marca */}
      <div className="flex h-14 shrink-0 items-center gap-2 px-4 text-white">
        <MinisfyLogo />
      </div>

      {/* Seletor de organização e unidade */}
      <div className="px-3 pb-3">
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-lg border border-sidebar-line bg-sidebar-hover/50 px-2.5 py-2 text-left transition-colors hover:bg-sidebar-hover"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-brand-500 text-[11px] font-bold text-white">
            CE
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium text-white">
              {organization.name}
            </span>
            <span className="block truncate text-[11px] text-sidebar-fg">
              {units.length} unidades
            </span>
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-sidebar-fg" />
        </button>
      </div>

      {/* Navegação */}
      <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {navigation.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-sidebar-fg/60">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] transition-colors",
                        active
                          ? "bg-sidebar-active font-medium text-sidebar-fg-active"
                          : "text-sidebar-fg hover:bg-sidebar-hover hover:text-sidebar-fg-active",
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="min-w-0 flex-1 truncate">
                        {item.label}
                      </span>
                      {item.status === "planned" && (
                        <Lock
                          className="size-3 shrink-0 text-sidebar-fg/40"
                          aria-label={`Previsto para ${item.phase}`}
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Rodapé: usuário */}
      <div className="shrink-0 border-t border-sidebar-line p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-1 py-1">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-500 text-[11px] font-bold text-brand-900">
            AC
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium text-white">
              Arthur Costa
            </span>
            <span className="block truncate text-[11px] text-sidebar-fg">
              Administrador geral
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

export function MobileSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Fechar menu"
        onClick={onClose}
        className="absolute inset-0 bg-brand-950/60 backdrop-blur-[2px]"
      />
      <div className="absolute inset-y-0 left-0 w-[272px] shadow-lg">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar menu"
          className="absolute right-0 top-3 z-10 translate-x-full pl-2 text-white/70 hover:text-white"
        >
          <X className="size-5" />
        </button>
        <SidebarContent onNavigate={onClose} />
      </div>
    </div>
  );
}

export function useSidebar() {
  const [open, setOpen] = useState(false);
  return { open, setOpen };
}

export { PanelLeftClose };
