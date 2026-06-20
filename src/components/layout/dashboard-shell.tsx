"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Sidebar } from "@/components/layout/sidebar";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";

type DashboardShellProps = {
  user: SessionUser;
  badges?: {
    mantenimientos?: number;
    alertas?: number;
    repuestos?: number;
    medidores?: number;
  };
  children: React.ReactNode;
};

export function DashboardShell({ user, badges, children }: DashboardShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {menuOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-label="Cerrar menú"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <Sidebar
        user={user}
        badges={badges}
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[252px] transition-transform duration-200 lg:static lg:translate-x-0",
          menuOpen ? "translate-x-0" : "-translate-x-full"
        )}
        onNavigate={() => setMenuOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 lg:hidden">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-gray-700 hover:bg-gray-100"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <BrandLogo link={false} variant="mark" className="h-11 w-11" />
          <div className="w-10" />
        </header>

        <main className="flex-1 overflow-auto bg-[#f8fafc] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
