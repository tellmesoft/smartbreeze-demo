import { BrandLogo } from "@/components/layout/brand-logo";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { LogoutButton } from "@/components/layout/logout-button";
import { PwaInstallButton } from "@/components/pwa/pwa-install-button";
import { rolLabels } from "@/lib/navigation";
import { base64ToDataUrl, cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";

type SidebarProps = {
  user: SessionUser;
  badges?: {
    mantenimientos?: number;
    alertas?: number;
    repuestos?: number;
    medidores?: number;
  };
  className?: string;
  onNavigate?: () => void;
};

export function Sidebar({ user, badges = {}, className, onNavigate }: SidebarProps) {
  const avatar = base64ToDataUrl(user.avatarBase64);

  return (
    <aside
      className={cn(
        "flex h-full max-h-[100dvh] shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-white",
        className ?? "w-[252px]"
      )}
    >
      <div className="px-5 pb-3 pt-8">
        <BrandLogo priority variant="mark" showWordmark />
      </div>

      <SidebarNav user={user} badges={badges} onNavigate={onNavigate} />

      <div className="mt-auto border-t border-gray-100 px-4 py-4">
        <div className="mb-3 px-2">
          <PwaInstallButton fullWidth variant="outline" size="sm" />
        </div>
        <div className="mb-3 flex items-center gap-3 px-2">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt={user.nombre} className="h-8 w-8 rounded-full" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold">
              {user.nombre.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">{user.nombre}</p>
            <p className="truncate text-xs text-gray-500">{rolLabels[user.rol]}</p>
          </div>
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}
