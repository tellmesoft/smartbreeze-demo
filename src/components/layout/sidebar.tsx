import Link from "next/link";
import { navItems, rolLabels } from "@/lib/navigation";
import { base64ToDataUrl, cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";
import { LogoutButton } from "@/components/layout/logout-button";

type SidebarProps = {
  user: SessionUser;
  badges?: {
    mantenimientos?: number;
    alertas?: number;
  };
  className?: string;
  onNavigate?: () => void;
};

export function Sidebar({ user, badges = {}, className, onNavigate }: SidebarProps) {
  const items = navItems.filter((item) => item.roles.includes(user.rol));
  const avatar = base64ToDataUrl(user.avatarBase64);

  return (
    <aside
      className={cn(
        "flex h-screen shrink-0 flex-col border-r border-gray-200 bg-white",
        className ?? "w-64"
      )}
    >
      <div className="flex h-16 items-center gap-3 border-b border-gray-100 px-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2563EB] text-lg font-bold text-white">
          SB
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">Smartbreeze</p>
          <p className="text-xs text-gray-500">Gestión HVAC</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => {
          const Icon = item.icon;
          const badgeCount = item.badgeKey ? badges[item.badgeKey] : undefined;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-[#2563EB]"
              )}
            >
              <span className="flex items-center gap-3">
                <Icon className="h-4 w-4" />
                {item.label}
              </span>
              {badgeCount ? (
                <span className="rounded-full bg-[#2563EB] px-2 py-0.5 text-xs text-white">
                  {badgeCount}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-100 p-4">
        <div className="mb-3 flex items-center gap-3">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt={user.nombre} className="h-9 w-9 rounded-full" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold">
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
