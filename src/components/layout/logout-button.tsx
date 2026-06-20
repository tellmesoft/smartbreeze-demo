"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Spinner } from "@/components/ui/loading";

export function LogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={pending}
      aria-busy={pending || undefined}
      className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-800 disabled:opacity-70"
    >
      {pending ? (
        <Spinner size="sm" label="Cerrando sesión" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
      {pending ? "Cerrando sesión..." : "Cerrar sesión"}
    </button>
  );
}
