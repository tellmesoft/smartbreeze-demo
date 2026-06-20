"use client";

import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Spinner } from "@/components/ui/loading";
import { usePendingRouter } from "@/hooks/use-pending-router";
import { rolLabels } from "@/lib/navigation";
import { profileLinkActive } from "@/lib/selection-styles";
import { userAvatarSrc } from "@/lib/usuarios";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";

type Props = {
  user: SessionUser;
  onNavigate?: () => void;
};

export function SidebarProfileLink({ user, onNavigate }: Props) {
  const pathname = usePathname();
  const { isPending, push } = usePendingRouter();
  const active = pathname === "/perfil";
  const avatarSrc = userAvatarSrc(user.avatarBase64, user.nombre, user.rol);

  return (
    <button
      type="button"
      disabled={isPending}
      aria-busy={isPending || undefined}
      aria-label="Ver mi perfil"
      onClick={() => {
        onNavigate?.();
        push("/perfil");
      }}
      className={cn(
        "mb-3 flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors",
        "hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]",
        active && profileLinkActive,
        isPending && "opacity-80"
      )}
    >
      {isPending ? (
        <div className="flex h-9 w-9 items-center justify-center">
          <Spinner size="sm" label="Cargando perfil" />
        </div>
      ) : avatarSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarSrc} alt={user.nombre} className="h-9 w-9 rounded-full object-cover ring-2 ring-white" />
      ) : (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-700">
          {user.nombre.slice(0, 2).toUpperCase()}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">
          {isPending ? "Cargando..." : user.nombre}
        </p>
        <p className="truncate text-xs text-gray-500">{rolLabels[user.rol]}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
    </button>
  );
}
