"use client";

import { useState, useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Bell,
  Sun,
  Moon,
  UserCircle,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NAV_SECTIONS } from "./nav-config";
import { useSidebar } from "@/context/SidebarContext";
import { useAuth } from "@/context/AuthContext";

function getInitials(user) {
  if (!user) return "?";
  const f = user.first_name?.[0] ?? "";
  const l = user.last_name?.[0] ?? "";
  return (f + l).toUpperCase() || user.username?.[0]?.toUpperCase() || "?";
}

function getPageName(pathname) {
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (
        pathname === item.href ||
        (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"))
      ) {
        return item.label;
      }
    }
  }
  return "Dashboard";
}

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { setMobileOpen, collapsed, setCollapsed } = useSidebar();
  const { user, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Cache bust timestamp - only updates when avatar_url changes
  const avatarUrl = useMemo(() => {
    if (!user?.avatar_url) return null;
    return `${user.avatar_url}?t=${Date.now()}`;
  }, [user?.avatar_url]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 h-14 flex items-center border-b border-border/60 bg-background px-3 gap-1 shrink-0">

        {/* Mobile: hamburger */}
        <Button variant="ghost" size="icon" className="lg:hidden text-muted-foreground" onClick={() => setMobileOpen(true)}>
          <Menu className="size-4" />
        </Button>

        {/* Desktop: sidebar collapse toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:flex text-muted-foreground hover:text-foreground"
          onClick={() => setCollapsed((c) => !c)}
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        </Button>

        <Separator orientation="vertical" className="h-5 mx-1 hidden lg:block" />

        {/* Breadcrumb */}
        <Breadcrumb className="flex-1">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage className="text-sm font-semibold text-foreground">
                {getPageName(pathname)}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Right side */}
        <div className="flex items-center gap-1">

          {/* Search — pill button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden sm:flex items-center gap-2 h-8 px-3 rounded-lg border border-border bg-muted/40 hover:bg-muted text-muted-foreground text-xs transition-colors w-40"
          >
            <Search className="size-3.5 shrink-0" />
            <span className="flex-1 text-left">Search...</span>
            <kbd className="shrink-0 h-4 px-1 rounded border border-border bg-background text-[10px] font-mono text-muted-foreground leading-4">
              ⌘K
            </kbd>
          </button>
          <Button variant="ghost" size="icon" className="sm:hidden text-muted-foreground" onClick={() => setSearchOpen(true)}>
            <Search className="size-4" />
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
            <Bell className="size-4" />
            <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-destructive ring-1 ring-background" />
          </Button>

          {/* Theme */}
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {mounted && theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>

          <Separator orientation="vertical" className="h-5 mx-0.5" />

          {/* User avatar dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <div className="size-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold select-none shrink-0 overflow-hidden">
                {avatarUrl ? (
                  <img
                    key={avatarUrl}
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to initials if image fails to load
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <span>{getInitials(user)}</span>
                )}
              </div>
              <span className="hidden sm:block text-xs font-medium text-foreground max-w-24 truncate">
                {user?.first_name && user?.last_name
                  ? `${user.first_name} ${user.last_name}`
                  : user?.username ?? "Account"}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <div className="px-3 py-2.5">
                <p className="font-semibold text-sm text-foreground truncate">
                  {user?.first_name && user?.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : user?.username}
                </p>
                {user?.email && (
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
                <UserCircle className="size-3.5" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={logout}>
                <LogOut className="size-3.5" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </header>

      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen} title="Search" description="Search navigation items">
        <Command>
          <CommandInput placeholder="Search pages..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {NAV_SECTIONS.map((section) => (
              <CommandGroup key={section.label} heading={section.label}>
                {section.items.map((item) => (
                  <CommandItem
                    key={item.href}
                    onSelect={() => { setSearchOpen(false); window.location.href = item.href; }}
                  >
                    <item.icon className="size-4 mr-2" />
                    {item.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
