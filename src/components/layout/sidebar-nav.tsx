"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import { navGroupLabels, navItemsForRole } from "@/lib/navigation";
import { navIconActive, navIconInactive, navItemActive, navItemInactive } from "@/lib/selection-styles";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";

type SidebarNavProps = {
  user: SessionUser;
  badges?: {
    mantenimientos?: number;
    alertas?: number;
    repuestos?: number;
    medidores?: number;
  };
  onNavigate?: () => void;
};

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav({ user, badges = {}, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const items = navItemsForRole(user.rol);

  return (
    <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
      {items.map((item, index) => {
        const Icon = item.icon;
        const badgeCount = item.badgeKey ? badges[item.badgeKey] : undefined;
        const active = isActive(pathname, item.href);
        const showGroupLabel =
          index === 0 || item.group !== items[index - 1].group;

        return (
          <Fragment key={item.href}>
            {showGroupLabel ? (
              <p
                className={cn(
                  "mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400",
                  index > 0 && "mt-4"
                )}
              >
                {navGroupLabels[item.group]}
              </p>
            ) : null}
            <Link
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center justify-between rounded-lg px-3 py-2.5 text-[15px] font-medium transition-colors",
                active ? navItemActive : navItemInactive
              )}
            >
              <span className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0",
                    active ? navIconActive : navIconInactive
                  )}
                />
                {item.label}
              </span>
              {badgeCount ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#2563EB] px-1.5 text-[11px] font-semibold text-white">
                  {badgeCount}
                </span>
              ) : null}
            </Link>
          </Fragment>
        );
      })}
    </nav>
  );
}
