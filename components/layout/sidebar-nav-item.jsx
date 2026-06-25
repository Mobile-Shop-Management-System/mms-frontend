"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function SidebarNavItem({ href, icon: Icon, label, badge, collapsed }) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));

  const linkClass = cn(
    "group flex items-center gap-2.5 rounded-lg text-sm transition-colors duration-150",
    collapsed ? "justify-center size-9" : "px-2.5 py-2 w-full",
    isActive
      ? "bg-primary/10 text-primary font-semibold"
      : "text-muted-foreground font-medium hover:bg-muted hover:text-foreground"
  );

  const inner = (
    <>
      <Icon className={cn("size-4 shrink-0 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
      {!collapsed && <span className="flex-1 truncate">{label}</span>}
      {!collapsed && badge && (
        <span className="ml-auto text-[10px] font-semibold bg-primary/10 text-primary rounded-full px-2 py-0.5 leading-none">
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
