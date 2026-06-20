"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-800"
    >
      <LogOut className="h-4 w-4" />
      Cerrar sesión
    </button>
  );
}
