"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function SidebarNavItem({ href, icon: Icon, label, badge, collapsed }) {
  const pathname = usePathname();
  const isActive =
    pathname === href ||
    (href !== "/dashboard" && pathname.startsWith(href + "/"));

  const linkClass = cn(
    "group flex items-center gap-2.5 rounded-lg text-sm transition-colors duration-150",
    collapsed ? "justify-center size-9" : "px-2.5 py-2 w-full",
    isActive
      ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-sm"
      : "text-sidebar-foreground/75 font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
  );

  const inner = (
    <>
      <Icon
        className={cn(
          "size-4 shrink-0 transition-colors",
          isActive
            ? "text-sidebar-primary-foreground"
            : "text-sidebar-foreground/65 group-hover:text-sidebar-accent-foreground",
        )}
      />
      {!collapsed && <span className="flex-1 truncate">{label}</span>}
      {!collapsed && badge && (
        <span className="ml-auto text-[10px] font-semibold bg-sidebar-primary text-sidebar-primary-foreground rounded-full px-2 py-0.5 leading-none">
          {badge}
        </span>
      )}
    </>
  );

  return (
    <Link
      href={href}
      className={linkClass}
      title={collapsed ? label : undefined}
    >
      {inner}
    </Link>
  );
}
