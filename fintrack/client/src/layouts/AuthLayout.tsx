import React from "react";
import { Link, Outlet } from "react-router-dom";
import { Layers, Moon, Sun, ShieldCheck } from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import { IconButton } from "../components/ui/IconButton";

export const AuthLayout: React.FC = () => {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary selection:text-primary-foreground">
      {/* Header */}
      <header className="h-16 px-4 sm:px-8 flex items-center justify-between border-b border-border/40">
        <Link to="/" className="flex items-center space-x-2.5">
          <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-sm shadow-primary/25">
            <Layers className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg tracking-tight text-foreground">FinTrack</span>
        </Link>

        <div className="flex items-center space-x-3">
          <IconButton
            aria-label="Toggle theme"
            size="sm"
            onClick={toggleTheme}
            icon={resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          />
        </div>
      </header>

      {/* Main Centered Content Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-8">
        <div className="w-full max-w-md space-y-6 animate-fadeIn">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-border/40 text-center text-xs text-muted-foreground space-y-1">
        <div className="flex items-center justify-center gap-1.5 font-medium">
          <ShieldCheck className="h-3.5 w-3.5 text-success" />
          <span>Bank-grade encryption • Zero external AI leaks</span>
        </div>
        <p>© 2026 FinTrack — Personal Finance Management Platform</p>
      </footer>
    </div>
  );
};
