"use client";

import {
  ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarNavItem } from "./sidebar-nav-item";
import { SidebarNavGroup } from "./sidebar-nav-group";
import { NAV_SECTIONS } from "./nav-config";
import { useSidebar } from "@/context/SidebarContext";
import { useAuth } from "@/context/AuthContext";

function SidebarInner({ collapsed, onLinkClick }) {
  const { user } = useAuth();

  const filterNavSections = (sections) => {
    return sections.map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        // Users link only for admins
        if (item.href === "/dashboard/users" && user?.role !== 'admin') {
          return false;
        }
        return true;
      }),
    })).filter((section) => section.items.length > 0);
  };

  const filteredSections = filterNavSections(NAV_SECTIONS);
  return (
    <TooltipProvider delay={400}>
      <div className="flex flex-col h-full">
        {/* Logo — same height as topbar */}
        <div
          className={cn(
            "h-14 flex items-center shrink-0 px-4 border-b border-border/60",
            collapsed && "justify-center px-0",
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-8 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-sm">
              <ShoppingBag className="size-4 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-bold tracking-tight leading-tight">
                  ShopOS
                </p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest leading-tight">
                  POS System
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav
          className="flex-1 overflow-y-auto px-2.5 py-3 space-y-0.5"
          onClick={onLinkClick}
        >
          {filteredSections.map((section, idx) => (
            <div key={section.label} className={cn(idx > 0 && "mt-4")}>
              {collapsed ? (
                <div className="mx-auto w-5 h-px bg-border/60 mb-2 mt-2" />
              ) : (
                <p className="px-2.5 mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 select-none">
                  {section.label}
                </p>
              )}
              <div
                className={cn(
                  "space-y-0.5",
                  collapsed && "flex flex-col items-center",
                )}
              >
                {section.items.map((item) =>
                  item.children ? (
                    <SidebarNavGroup
                      key={item.label}
                      {...item}
                      collapsed={collapsed}
                    />
                  ) : (
                    <SidebarNavItem
                      key={item.href}
                      {...item}
                      collapsed={collapsed}
                    />
                  ),
                )}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </TooltipProvider>
  );
}

export function Sidebar() {
  const { collapsed, mobileOpen, setMobileOpen } = useSidebar();

  return (
    <>
      <aside
        className={cn(
          "hidden lg:flex flex-col h-screen bg-background border-r border-border/60 shrink-0 overflow-hidden transition-all duration-300 ease-in-out",
          collapsed ? "w-17" : "w-67.5",
        )}
      >
        <SidebarInner collapsed={collapsed} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-67.5 p-0 border-r border-border/60"
          showCloseButton={false}
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarInner
            collapsed={false}
            onLinkClick={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
