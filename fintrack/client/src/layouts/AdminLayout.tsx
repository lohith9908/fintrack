import React from "react";
import { Link, Outlet } from "react-router-dom";
import {
  Shield,
  Users,
  Activity,
  FolderTree,
  Sliders,
  ArrowLeft,
  Moon,
  Sun,
  Laptop,
} from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import { Avatar } from "../components/ui/Avatar";
import { Dropdown } from "../components/ui/Dropdown";

export const AdminLayout: React.FC = () => {
  const { resolvedTheme, setTheme } = useTheme();

  const adminNavItems = [
    { label: "Overview", href: "/admin", icon: <Shield className="h-4 w-4" /> },
    { label: "User Management", href: "/admin/users", icon: <Users className="h-4 w-4" /> },
    { label: "Audit Logs", href: "/admin/audit-logs", icon: <Activity className="h-4 w-4" /> },
    { label: "System Categories", href: "/admin/categories", icon: <FolderTree className="h-4 w-4" /> },
    { label: "System Settings", href: "/admin/settings", icon: <Sliders className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 border-r border-border bg-card/80 backdrop-blur-md flex flex-col justify-between sticky top-0 md:h-screen z-30">
        <div>
          {/* Brand Header */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-border/60">
            <Link to="/admin" className="flex items-center space-x-2.5">
              <div className="h-8 w-8 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 flex items-center justify-center font-bold">
                <Shield className="h-4 w-4" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-bold text-sm tracking-tight text-foreground">Admin Console</span>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase mt-0.5">FinTrack Platform</span>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <div className="p-3 space-y-1">
            <span className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
              Platform Administration
            </span>
            {adminNavItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Back to App Link in Footer */}
        <div className="p-3 border-t border-border/60 space-y-2">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to User App</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-20 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Administration</span>
            <span>/</span>
            <span className="text-foreground font-semibold">Overview</span>
          </div>

          <div className="flex items-center gap-2">
            <Dropdown
              trigger={
                <button
                  aria-label="Toggle theme"
                  className="h-8 w-8 rounded-lg border border-border bg-card hover:bg-muted text-foreground flex items-center justify-center transition-colors"
                >
                  {resolvedTheme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </button>
              }
              items={[
                { id: "light", label: "Light Theme", icon: <Sun className="h-4 w-4" />, onClick: () => setTheme("light") },
                { id: "dark", label: "Dark Theme", icon: <Moon className="h-4 w-4" />, onClick: () => setTheme("dark") },
                { id: "system", label: "System Default", icon: <Laptop className="h-4 w-4" />, onClick: () => setTheme("system") },
              ]}
            />
            <Avatar name="Admin User" size="sm" />
          </div>
        </header>

        <main className="flex-1 w-full max-w-[1440px] mx-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
