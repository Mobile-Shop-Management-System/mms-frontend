"use client";

import { useEffect, useState } from "react";
import {
  CircleAlert,
  CircleCheckBig,
  LoaderCircle,
  ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import apiClient from "@/lib/apiClient";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarNavItem } from "./sidebar-nav-item";
import { SidebarNavGroup } from "./sidebar-nav-group";
import { NAV_SECTIONS } from "./nav-config";
import { useSidebar } from "@/context/SidebarContext";
import { useAuth } from "@/context/AuthContext";

function ServerStatusCard({ collapsed }) {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let active = true;

    const checkServer = async () => {
      try {
        await apiClient.get("/auth/me/", { timeout: 5000 });
        if (active) setStatus("connected");
      } catch {
        if (active) setStatus("offline");
      }
    };

    checkServer();
    const intervalId = window.setInterval(checkServer, 30000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const connected = status === "connected";
  const checking = status === "checking";
  const Icon = checking
    ? LoaderCircle
    : connected
      ? CircleCheckBig
      : CircleAlert;
  const label = checking
    ? "Checking server"
    : connected
      ? "Server connected"
      : "Server offline";

  return (
    <div className={cn("mt-auto px-2.5 pb-3 pt-2", collapsed && "px-2 pb-3")}>
      <div
        className={cn(
          "rounded-xl border p-2.5 transition-colors",
          connected
            ? "border-emerald-300/20 bg-emerald-400/10"
            : checking
              ? "border-sky-300/20 bg-sky-400/10"
              : "border-rose-300/20 bg-rose-400/10",
          collapsed && "flex justify-center p-2",
        )}
        title={collapsed ? label : undefined}
      >
        <div
          className={cn(
            "flex items-center gap-2",
            collapsed && "justify-center",
          )}
        >
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-lg",
              connected
                ? "bg-emerald-400/20 text-emerald-200"
                : checking
                  ? "bg-sky-400/20 text-sky-200"
                  : "bg-rose-400/20 text-rose-200",
            )}
          >
            <Icon className={cn("size-4", checking && "animate-spin")} />
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/55">
                Server status
              </p>
              <p className="mt-0.5 text-xs font-semibold text-sidebar-foreground">
                {label}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SidebarInner({ collapsed, onLinkClick }) {
  const { user } = useAuth();

  const filterNavSections = (sections) => {
    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          const role =
            user?.effective_role ??
            (user?.is_superuser ? "super_admin" : user?.role);
          return !item.roles || item.roles.includes(role);
        }),
      }))
      .filter((section) => section.items.length > 0);
  };

  const filteredSections = filterNavSections(NAV_SECTIONS);
  return (
    <TooltipProvider delay={400}>
      <div className="flex flex-col h-full">
        {/* Logo — same height as topbar */}
        <div
          className={cn(
            "h-14 flex items-center shrink-0 px-4 border-b border-sidebar-border",
            collapsed && "justify-center px-0",
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-8 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-sm">
              <ShoppingBag className="size-4 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-bold tracking-tight leading-tight text-sidebar-foreground">
                  ShopOS
                </p>
                <p className="text-[9px] text-sidebar-foreground/60 uppercase tracking-widest leading-tight">
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
                <div className="mx-auto w-5 h-px bg-sidebar-border mb-2 mt-2" />
              ) : (
                <p className="px-2.5 mb-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/50 select-none">
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

        <ServerStatusCard collapsed={collapsed} />
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
          "hidden lg:flex flex-col h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border shrink-0 overflow-hidden transition-all duration-300 ease-in-out",
          collapsed ? "w-17" : "w-67.5",
        )}
      >
        <SidebarInner collapsed={collapsed} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-67.5 p-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
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
