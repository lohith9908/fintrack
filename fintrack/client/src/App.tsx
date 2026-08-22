import React, { useEffect, useState } from "react";
import { 
  ShieldCheck, 
  Server, 
  CheckCircle2, 
  Layers, 
  Moon, 
  Sun, 
  FileText,
  Activity
} from "lucide-react";

interface HealthResponse {
  success: boolean;
  message: string;
}

export const App: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState<boolean>(false);

  useEffect(() => {
    // Check initial system theme preference
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/health");
        if (!res.ok) {
          throw new Error(`HTTP Error: ${res.status}`);
        }
        const data: HealthResponse = await res.json();
        setHealthStatus(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to reach backend API");
      } finally {
        setLoading(false);
      }
    };

    checkApiHealth();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary selection:text-primary-foreground">
      {/* Top Header */}
      <header className="border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight">FinTrack</span>
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium border border-primary/20">
                Phase 1 Active
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 py-12 flex-1 w-full space-y-8">
        {/* Hero Section */}
        <div className="space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-success/10 text-success border border-success/20">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Phase 1 — Project Initialization & Development Foundation</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Personal Finance Management Platform
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm sm:text-base leading-relaxed">
            FinTrack is built with rigorous user ownership, deterministic financial intelligence, and production-grade engineering principles.
          </p>
        </div>

        {/* API Smoke Test Widget */}
        <div className="p-6 rounded-xl border border-border bg-card shadow-sm space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-secondary text-secondary-foreground">
                <Server className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Backend Health Status</h2>
                <p className="text-xs text-muted-foreground">GET /api/health</p>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <Activity className="h-4 w-4 animate-spin text-primary" />
                <span>Checking API...</span>
              </div>
            ) : error ? (
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
                Disconnected: {error}
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-success/10 text-success border border-success/20">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                {healthStatus?.message || "Connected"}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-border/60 text-xs">
            <div className="p-3 rounded-lg bg-secondary/50">
              <span className="text-muted-foreground block mb-1">Frontend Stack</span>
              <span className="font-semibold text-foreground">React + Vite + TypeScript</span>
            </div>
            <div className="p-3 rounded-lg bg-secondary/50">
              <span className="text-muted-foreground block mb-1">Backend Stack</span>
              <span className="font-semibold text-foreground">Node.js + Express + TypeScript</span>
            </div>
            <div className="p-3 rounded-lg bg-secondary/50">
              <span className="text-muted-foreground block mb-1">Styling</span>
              <span className="font-semibold text-foreground">Tailwind CSS + Design Tokens</span>
            </div>
          </div>
        </div>

        {/* Locked Documentation Verification */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Source of Truth Documentation</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { code: "PRD.md", desc: "Product Scope & Capabilities" },
              { code: "TRD.md", desc: "Technical Constraints & Standards" },
              { code: "ARCHITECTURE.md", desc: "System Boundaries & Flow" },
              { code: "DATABASESCHEMA.md", desc: "MongoDB / Mongoose Models" },
              { code: "UI_UX.md", desc: "Design System & Interaction" },
              { code: "WEBFLOW.md", desc: "User & Admin Navigation Maps" },
              { code: "IMPLEMENTATION.md", desc: "20 Execution Phases" },
            ].map((doc) => (
              <div
                key={doc.code}
                className="p-4 rounded-xl border border-border bg-card/60 hover:bg-card transition-colors space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">{doc.code}</span>
                </div>
                <p className="text-xs text-muted-foreground">{doc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/40 py-6">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2">
          <span>FinTrack v1.0 — Locked Implementation Scope</span>
          <span>Deterministic Intelligence Engine • Zero External AI APIs</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
