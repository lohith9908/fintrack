import React, { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  PieChart,
  Repeat,
  Target,
  Calendar,
  BarChart3,
  FileSpreadsheet,
  Bell,
  Settings,
  Shield,
  Menu,
  Moon,
  Sun,
  Laptop,
  Search,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
} from "lucide-react";
import { cn } from "../utils/cn";
import { useTheme } from "../hooks/useTheme";
import { IconButton } from "../components/ui/IconButton";
import { Avatar } from "../components/ui/Avatar";
import { Drawer } from "../components/ui/Drawer";
import { Dropdown } from "../components/ui/Dropdown";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const { resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);

  const navigationSections: NavSection[] = [
    {
      title: "Overview",
      items: [
        { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
        { label: "Design System", href: "/", icon: <Sparkles className="h-4 w-4" />, badge: "Phase 6" },
      ],
    },
    {
      title: "Money",
      items: [
        { label: "Transactions", href: "/transactions", icon: <ArrowLeftRight className="h-4 w-4" /> },
        { label: "Accounts", href: "/accounts", icon: <Wallet className="h-4 w-4" /> },
        { label: "Budgets", href: "/budgets", icon: <PieChart className="h-4 w-4" /> },
        { label: "Recurring", href: "/recurring", icon: <Repeat className="h-4 w-4" /> },
      ],
    },
    {
      title: "Planning",
      items: [
        { label: "Savings Goals", href: "/goals", icon: <Target className="h-4 w-4" /> },
        { label: "Calendar", href: "/calendar", icon: <Calendar className="h-4 w-4" /> },
      ],
    },
    {
      title: "Insights",
      items: [
        { label: "Analytics", href: "/analytics", icon: <BarChart3 className="h-4 w-4" /> },
        { label: "Reports", href: "/reports", icon: <FileSpreadsheet className="h-4 w-4" /> },
      ],
    },
    {
      title: "System",
      items: [
        { label: "Notifications", href: "/notifications", icon: <Bell className="h-4 w-4" />, badge: "2" },
        { label: "Settings", href: "/settings", icon: <Settings className="h-4 w-4" /> },
        { label: "Admin Panel", href: "/admin", icon: <Shield className="h-4 w-4" /> },
      ],
    },
  ];

  const bottomNavItems = [
    { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { label: "Transactions", href: "/transactions", icon: <ArrowLeftRight className="h-5 w-5" /> },
    { label: "Budgets", href: "/budgets", icon: <PieChart className="h-5 w-5" /> },
    { label: "Goals", href: "/goals", icon: <Target className="h-5 w-5" /> },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* ============================================================ */}
      {/* 1. Desktop / Tablet Sidebar per UI_UX.md Section 14 & 15     */}
      {/* ============================================================ */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-border bg-card/70 backdrop-blur-md transition-all duration-300 z-30 sticky top-0 h-screen",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-border/60">
          <Link to="/" className="flex items-center space-x-2.5 overflow-hidden">
            <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0 shadow-sm shadow-primary/25">
              <Layers className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col leading-none">
                <span className="font-bold text-base tracking-tight text-foreground">FinTrack</span>
                <span className="text-[10px] text-muted-foreground font-medium mt-0.5">Finance OS</span>
              </div>
            )}
          </Link>

          <IconButton
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            icon={isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
            className="hidden lg:inline-flex text-muted-foreground"
          />
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
          {navigationSections.map((section) => (
            <div key={section.title} className="space-y-1">
              {!isCollapsed && (
                <span className="px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  {section.title}
                </span>
              )}
              {section.items.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    title={isCollapsed ? item.label : undefined}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors group relative",
                      isActive
                        ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                    )}
                  >
                    <span className={cn("shrink-0", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")}>
                      {item.icon}
                    </span>
                    {!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}
                    {!isCollapsed && item.badge && (
                      <span
                        className={cn(
                          "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                          isActive
                            ? "bg-primary-foreground/20 text-primary-foreground"
                            : "bg-secondary text-secondary-foreground"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* User Card in Footer */}
        {!isCollapsed && (
          <div className="p-3 border-t border-border/60">
            <div className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50 border border-border/40">
              <Avatar name="Alex Miller" size="sm" status="online" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate text-foreground">Alex Miller</p>
                <p className="text-[10px] text-muted-foreground truncate">alex@fintrack.app</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* ============================================================ */}
      {/* 2. Main Wrapper: Header + Content Viewport                   */}
      {/* ============================================================ */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Application Header per UI_UX.md Section 16 */}
        <header className="h-16 border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* Left: Mobile Drawer Trigger + Search Context */}
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <IconButton
              aria-label="Open mobile menu"
              size="sm"
              onClick={() => setMobileDrawerOpen(true)}
              icon={<Menu className="h-5 w-5" />}
              className="md:hidden"
            />
            <div className="relative w-full max-w-xs hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search transactions, budgets... (⌘K)"
                className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-input bg-card placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                readOnly
              />
            </div>
          </div>

          {/* Right: Actions, Theme, Notifications & User */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle Dropdown */}
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

            {/* Notification Icon */}
            <IconButton
              aria-label="Notifications"
              size="sm"
              icon={
                <div className="relative">
                  <Bell className="h-4 w-4 text-foreground" />
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
                </div>
              }
            />

            {/* Profile Dropdown */}
            <Dropdown
              trigger={
                <div className="flex items-center gap-2 pl-2 cursor-pointer select-none">
                  <Avatar name="Alex Miller" size="sm" />
                </div>
              }
              items={[
                { id: "profile", label: "User Profile", icon: <Settings className="h-4 w-4" /> },
                { id: "admin", label: "Admin Console", icon: <Shield className="h-4 w-4" /> },
                { id: "theme-quick", label: `Switch to ${resolvedTheme === "dark" ? "Light" : "Dark"} Mode`, icon: resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />, onClick: toggleTheme },
                { id: "logout", label: "Sign Out", destructive: true, dividerBefore: true },
              ]}
            />
          </div>
        </header>

        {/* Content Container (max-width ≈ 1440px per UI_UX.md Section 18) */}
        <main className="flex-1 w-full max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* ============================================================ */}
      {/* 3. Mobile Bottom Navigation per UI_UX.md Section 17          */}
      {/* ============================================================ */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-card/90 backdrop-blur-lg border-t border-border z-40 flex items-center justify-around px-2"
      >
        {bottomNavItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full text-[10px] font-medium gap-1 transition-colors",
                isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setMobileDrawerOpen(true)}
          className="flex flex-col items-center justify-center flex-1 h-full text-[10px] font-medium gap-1 text-muted-foreground hover:text-foreground"
        >
          <Menu className="h-5 w-5" />
          <span>More</span>
        </button>
      </nav>

      {/* Mobile Drawer Sheet */}
      <Drawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        title="FinTrack Navigation"
        placement="left"
      >
        <div className="space-y-6">
          {navigationSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                {section.title}
              </span>
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted font-medium"
                >
                  <span className="text-muted-foreground">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </Drawer>
    </div>
  );
};
