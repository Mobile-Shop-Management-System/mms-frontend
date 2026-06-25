import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { SidebarProvider } from "@/context/SidebarContext";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export const metadata = {
  title: "MMS - Dashboard",
};

export default function DashboardLayout({ children }) {
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="flex h-screen bg-background overflow-hidden">
          <Sidebar />
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            <Topbar />
            <main className="flex-1 overflow-auto p-6">{children}</main>
          </div>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
