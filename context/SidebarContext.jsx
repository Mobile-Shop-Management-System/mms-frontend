"use client";

import { createContext, useContext, useState, useEffect } from "react";

const SidebarContext = createContext({
  mobileOpen: false,
  setMobileOpen: () => {},
  collapsed: false,
  setCollapsed: () => {},
});

export function SidebarProvider({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsedState] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored !== null) setCollapsedState(stored === "true");
  }, []);

  const setCollapsed = (val) => {
    const next = typeof val === "function" ? val(collapsed) : val;
    setCollapsedState(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  };

  return (
    <SidebarContext.Provider value={{ mobileOpen, setMobileOpen, collapsed, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

export const useSidebar = () => useContext(SidebarContext);
