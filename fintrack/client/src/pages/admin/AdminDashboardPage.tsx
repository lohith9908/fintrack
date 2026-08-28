import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  Users,
  Activity,
  FolderTree,
  Sliders,
  TrendingUp,
  TrendingDown,
  Server,
  RotateCcw,
  Clock,
  ArrowRight,
  Database,
  Cpu,
} from "lucide-react";
import { AdminService } from "../../services/admin.service";
import { AdminPlatformOverview } from "../../types/admin.types";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { getErrorMessage } from "../../services/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/ErrorState";

export const AdminDashboardPage: React.FC = () => {
  const [data, setData] = useState<AdminPlatformOverview | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await AdminService.getOverview();
      setData(res);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const quickNavCards = [
    {
      title: "User Management",
      description: "Search, moderate, inspect entities, and update user status or roles.",
      href: "/admin/users",
      icon: <Users className="h-5 w-5 text-primary" />,
      badge: data ? `${data.metrics.totalUsers} users` : "...",
    },
    {
      title: "System Categories",
      description: "Configure global transaction categories with historical dependency protection.",
      href: "/admin/categories",
      icon: <FolderTree className="h-5 w-5 text-purple-500" />,
      badge: data ? `${data.metrics.totalCategories} active` : "...",
    },
    {
      title: "Audit Trail",
      description: "Inspect immutable, sanitized administrative and security activity logs.",
      href: "/admin/audit-logs",
      icon: <Activity className="h-5 w-5 text-amber-500" />,
      badge: data ? `${data.metrics.totalAuditLogs} records` : "...",
    },
    {
      title: "Platform Settings",
      description: "Configure global registration rules, limits, currency, and maintenance mode.",
      href: "/admin/settings",
      icon: <Sliders className="h-5 w-5 text-emerald-500" />,
      badge: "Configured",
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20">
            <Shield className="h-3 w-3" />
            <span>Phase 17 Admin Platform</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Administration Console
          </h1>
          <p className="text-xs text-muted-foreground">
            Platform governance, telemetry monitoring, user access control, system categories, and security audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOverview}
            disabled={isLoading}
            className="text-xs font-semibold"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            <span>Refresh Overview</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-4 space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-7 w-32" />
              </Card>
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      ) : error ? (
        <ErrorState
          title="Unable to load admin platform overview"
          message={error}
          onRetry={fetchOverview}
        />
      ) : !data ? (
        <ErrorState
          title="Admin data not available"
          message="Unable to compile platform metrics at this time."
          onRetry={fetchOverview}
        />
      ) : (
        <div className="space-y-6">
          {/* 4 Top Executive Platform Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Users */}
            <Card className="p-4 bg-card/80 space-y-1.5 border-border/80 shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold">Total Platform Users</span>
                <Users className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-bold font-mono text-foreground">
                {data.metrics.totalUsers}
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span className="font-semibold text-emerald-500">{data.metrics.activeUsers} active</span>
                <span>•</span>
                <span>{data.metrics.suspendedUsers} suspended</span>
                <span>•</span>
                <span className="font-semibold text-destructive">{data.metrics.adminUsers} admin</span>
              </div>
            </Card>

            {/* Financial Volume */}
            <Card className="p-4 bg-card/80 space-y-1.5 border-border/80 shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold">Gross Processed Volume</span>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold font-mono text-foreground">
                {formatCurrency(data.metrics.financialVolume.grossVolume)}
              </p>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="text-emerald-500 font-semibold flex items-center gap-0.5">
                  <TrendingUp className="h-2.5 w-2.5" />
                  {formatCurrency(data.metrics.financialVolume.totalInflows)}
                </span>
                <span className="text-rose-500 font-semibold flex items-center gap-0.5">
                  <TrendingDown className="h-2.5 w-2.5" />
                  {formatCurrency(data.metrics.financialVolume.totalOutflows)}
                </span>
              </div>
            </Card>

            {/* Financial Records */}
            <Card className="p-4 bg-card/80 space-y-1.5 border-border/80 shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold">Ledger Records</span>
                <Database className="h-4 w-4 text-purple-500" />
              </div>
              <p className="text-2xl font-bold font-mono text-foreground">
                {data.metrics.totalTransactions}
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span>{data.metrics.totalAccounts} accounts</span>
                <span>•</span>
                <span>{data.metrics.totalBudgets} budgets</span>
              </div>
            </Card>

            {/* System Telemetry */}
            <Card className="p-4 bg-card/80 space-y-1.5 border-border/80 shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold">Platform Telemetry</span>
                <Server className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-lg font-bold text-foreground">
                  {data.systemHealth.status}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span>RAM: {data.systemHealth.memoryUsageMb} MB</span>
                <span>•</span>
                <span>Node {data.systemHealth.nodeVersion}</span>
              </div>
            </Card>
          </div>

          {/* Quick Navigation Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickNavCards.map((card) => (
              <Link
                key={card.href}
                to={card.href}
                className="group p-4 rounded-2xl border border-border bg-card hover:bg-muted/40 transition-all hover:border-primary/40 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="p-2 rounded-xl bg-secondary border border-border/60 group-hover:scale-105 transition-transform">
                    {card.icon}
                  </div>
                  <Badge variant="secondary" size="sm">
                    {card.badge}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                    <span>{card.title}</span>
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* Activity Trends & Recent Audit Logs Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* System Health Specs */}
            <Card className="lg:col-span-1">
              <CardHeader className="border-b border-border/40 pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-primary" />
                  <span>Runtime Environment</span>
                </CardTitle>
                <CardDescription className="text-xs">Node.js server and database status</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/40 border border-border/30">
                  <span className="text-muted-foreground">Database State</span>
                  <Badge variant="success" size="sm">
                    {data.systemHealth.database}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/40 border border-border/30">
                  <span className="text-muted-foreground">Environment</span>
                  <span className="font-mono font-bold text-foreground capitalize">
                    {data.systemHealth.environment}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/40 border border-border/30">
                  <span className="text-muted-foreground">Uptime</span>
                  <span className="font-mono font-bold text-foreground">
                    {Math.floor(data.systemHealth.uptimeSeconds / 60)} min {data.systemHealth.uptimeSeconds % 60}s
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/40 border border-border/30">
                  <span className="text-muted-foreground">Audit Log Count</span>
                  <span className="font-mono font-bold text-foreground">
                    {data.metrics.totalAuditLogs} events
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Audit Trail Feed */}
            <Card className="lg:col-span-2">
              <CardHeader className="border-b border-border/40 pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Activity className="h-4 w-4 text-amber-500" />
                    <span>Recent Administrative Audit Events</span>
                  </CardTitle>
                  <CardDescription className="text-xs">Latest governance and security activities</CardDescription>
                </div>
                <Link to="/admin/audit-logs">
                  <Button variant="ghost" size="sm" className="text-xs font-semibold text-primary">
                    <span>View All</span>
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="p-0 overflow-hidden">
                {data.recentAuditLogs.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    No administrative audit logs recorded yet.
                  </div>
                ) : (
                  <div className="divide-y divide-border/40">
                    {data.recentAuditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3.5 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-1.5 rounded-lg bg-secondary text-foreground font-mono text-[10px] font-bold shrink-0">
                            {log.action.split("_")[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-foreground truncate">
                              {log.action.replace(/_/g, " ")}
                            </p>
                            <span className="text-[10px] text-muted-foreground truncate block">
                              By {log.actor.name} ({log.actor.email})
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <Badge variant="secondary" size="sm">
                            {log.targetType}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1 justify-end">
                            <Clock className="h-2.5 w-2.5" />
                            {formatDate(log.createdAt, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
