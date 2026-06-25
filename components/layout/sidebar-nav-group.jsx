"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function NavGroupChild({ href, label }) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-lg py-1.5 px-2 text-sm transition-colors",
        isActive
          ? "text-primary font-semibold"
          : "text-muted-foreground font-medium hover:text-foreground hover:bg-muted/60"
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full shrink-0 transition-colors",
          isActive ? "bg-primary" : "bg-muted-foreground/30"
        )}
      />
      {label}
    </Link>
  );
}

export function SidebarNavGroup({ icon: Icon, label, children, collapsed }) {
  const pathname = usePathname();

  const isAnyActive = children.some(
    (c) => pathname === c.href || pathname.startsWith(c.href + "/")
  );

  const [open, setOpen] = useState(isAnyActive);

  useEffect(() => {
    if (isAnyActive) setOpen(true);
  }, [isAnyActive]);

  const buttonClass = cn(
    "group flex items-center gap-2.5 rounded-lg text-sm transition-colors duration-150",
    isAnyActive
      ? "bg-primary/10 text-primary font-semibold"
      : "text-muted-foreground font-medium hover:bg-muted hover:text-foreground"
  );

  const iconClass = cn(
    "size-4 shrink-0 transition-colors",
    isAnyActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Link
              href={children[0]?.href ?? "#"}
              className={cn(buttonClass, "justify-center size-9")}
            />
          }
        >
          <Icon className={iconClass} />
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(buttonClass, "px-2.5 py-2 w-full")}
      >
        <Icon className={iconClass} />
        <span className="flex-1 truncate text-left">{label}</span>
        <ChevronRight
          className={cn(
            "size-3.5 shrink-0 transition-transform duration-200",
            isAnyActive ? "text-primary/60" : "text-muted-foreground/60",
            open && "rotate-90"
          )}
        />
      </button>

      {open && (
        <div className="ml-3.5 mt-0.5 pl-3 border-l border-border/50 space-y-0.5">
          {children.map((child) => (
            <NavGroupChild key={child.href} href={child.href} label={child.label} />
          ))}
        </div>
      )}
    </div>
  );
}
