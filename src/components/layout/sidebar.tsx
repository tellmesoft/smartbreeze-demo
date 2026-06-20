import { BrandLogo } from "@/components/layout/brand-logo";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { SidebarProfileLink } from "@/components/layout/sidebar-profile-link";
import { LogoutButton } from "@/components/layout/logout-button";
import { PwaInstallButton } from "@/components/pwa/pwa-install-button";
import { cn } from "@/lib/utils";
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
        <SidebarProfileLink user={user} onNavigate={onNavigate} />
        <LogoutButton />
      </div>
    </aside>
  );
}
