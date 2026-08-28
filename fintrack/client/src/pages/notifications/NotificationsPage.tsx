import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  Shield,
  Info,
  ChevronRight,
  RotateCcw,
  Check,
} from "lucide-react";
import { NotificationService } from "../../services/notification.service";
import { NotificationItem, NotificationType } from "../../types/notification.types";
import { useToast } from "../../components/ui/Toast";
import { getErrorMessage } from "../../services/api";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { Pagination } from "../../components/ui/Pagination";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { cn } from "../../utils/cn";

type FilterTab = "ALL" | "UNREAD" | NotificationType;

export const NotificationsPage: React.FC = () => {
  const toast = useToast();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state for clear all
  const [clearDialogOpen, setClearDialogOpen] = useState<boolean>(false);
  const [isClearing, setIsClearing] = useState<boolean>(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params: Record<string, unknown> = {
        page,
        limit: 15,
      };

      if (activeTab === "UNREAD") {
        params.read = false;
      } else if (activeTab !== "ALL") {
        params.type = activeTab;
      }

      const res = await NotificationService.getNotifications(params);
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
      setTotalPages(res.totalPages);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [page, activeTab]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await NotificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      toast.success("Notification marked as read", "Updated");
    } catch (err) {
      toast.error(getErrorMessage(err), "Failed");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await NotificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success(`Marked ${res.modifiedCount} notifications as read`, "Completed");
    } catch (err) {
      toast.error(getErrorMessage(err), "Failed");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await NotificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      toast.success("Notification deleted", "Removed");
    } catch (err) {
      toast.error(getErrorMessage(err), "Failed");
    }
  };

  const handleClearRead = async () => {
    try {
      setIsClearing(true);
      const res = await NotificationService.clearNotifications(true);
      setNotifications((prev) => prev.filter((n) => !n.read));
      setClearDialogOpen(false);
      toast.success(`Cleared ${res.deletedCount} read notifications`, "Cleaned");
    } catch (err) {
      toast.error(getErrorMessage(err), "Failed to Clear");
    } finally {
      setIsClearing(false);
    }
  };

  const getNotificationIcon = (type: string, severity: string) => {
    switch (type) {
      case "BUDGET_ALERT":
      case "BUDGET_EXCEEDED":
        return <AlertTriangle className={cn("h-4 w-4", severity === "CRITICAL" ? "text-rose-500" : "text-amber-500")} />;
      case "GOAL_MILESTONE":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "RECURRING_PAYMENT":
        return <Calendar className="h-4 w-4 text-sky-500" />;
      case "FINANCIAL_INSIGHT":
        return <Sparkles className="h-4 w-4 text-purple-500" />;
      case "SYSTEM":
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-primary" />;
    }
  };

  const getActionTarget = (notif: NotificationItem): { url: string; label: string } => {
    switch (notif.type) {
      case "BUDGET_ALERT":
      case "BUDGET_EXCEEDED":
        return { url: "/budgets", label: "View Budgets" };
      case "RECURRING_PAYMENT":
        return { url: "/recurring", label: "View Recurring" };
      case "GOAL_MILESTONE":
        return { url: "/goals", label: "View Goals" };
      case "FINANCIAL_INSIGHT":
        return { url: "/analytics", label: "View Analytics" };
      default:
        return { url: "/dashboard", label: "View Dashboard" };
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / (60 * 1000));
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} minutes ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };

  const tabs: Array<{ id: FilterTab; label: string; count?: number }> = [
    { id: "ALL", label: "All Alerts" },
    { id: "UNREAD", label: "Unread", count: unreadCount },
    { id: "BUDGET_ALERT", label: "Budgets" },
    { id: "RECURRING_PAYMENT", label: "Recurring" },
    { id: "GOAL_MILESTONE", label: "Goals" },
    { id: "FINANCIAL_INSIGHT", label: "Insights" },
    { id: "SYSTEM", label: "System" },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <Bell className="h-3 w-3" />
            <span>Phase 15 Notification Center</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Notifications</h1>
          <p className="text-xs text-muted-foreground">
            Real-time budget alerts, payment schedules, goal milestones, and deterministic insights.
          </p>
        </div>

        {/* Global Notification Actions */}
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs font-semibold"
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
              <span>Mark all as read</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setClearDialogOpen(true)}
            className="text-xs font-semibold text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            <span>Clear Read</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchNotifications()}
            className="text-xs text-muted-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-border/40 scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id);
              setPage(1);
            }}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <span>{tab.label}</span>
            {typeof tab.count === "number" && tab.count > 0 && (
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
                  activeTab === tab.id
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-primary text-primary-foreground"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 rounded-xl border border-border bg-card space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Unable to load notifications"
          message={error}
          onRetry={fetchNotifications}
        />
      ) : notifications.length === 0 ? (
        <EmptyState
          title="No notifications found"
          description={
            activeTab === "UNREAD"
              ? "You have caught up on all pending alerts and notifications."
              : "When automated threshold triggers occur, they will be delivered here."
          }
          icon={<Bell className="h-8 w-8 text-muted-foreground" />}
          actionLabel={activeTab !== "ALL" ? "View All Notifications" : undefined}
          onAction={activeTab !== "ALL" ? () => setActiveTab("ALL") : undefined}
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => {
            const action = getActionTarget(notif);
            return (
              <div
                key={notif._id}
                className={cn(
                  "p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                  !notif.read
                    ? "bg-primary/5 border-primary/25 shadow-xs"
                    : "bg-card border-border hover:border-border/80"
                )}
              >
                {/* Left: Icon and Details */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="p-2.5 rounded-xl bg-card border border-border shadow-2xs shrink-0 mt-0.5">
                    {getNotificationIcon(notif.type, notif.severity)}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className={cn("text-xs truncate", !notif.read ? "font-bold text-foreground" : "font-medium text-foreground")}>
                        {notif.title}
                      </h4>
                      {!notif.read && (
                        <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-muted-foreground/80 block pt-0.5 font-medium">
                      {formatRelativeTime(notif.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <Link to={action.url}>
                    <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold text-primary hover:text-primary/80">
                      <span>{action.label}</span>
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>

                  {!notif.read && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkAsRead(notif._id)}
                      className="h-8 text-xs text-muted-foreground hover:text-foreground"
                      title="Mark as read"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(notif._id)}
                    className="h-8 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title="Delete notification"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pt-4 flex justify-center">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          )}
        </div>
      )}

      {/* Confirmation Dialog for Clearing Read */}
      <ConfirmDialog
        isOpen={clearDialogOpen}
        onClose={() => setClearDialogOpen(false)}
        onConfirm={handleClearRead}
        title="Clear Read Notifications?"
        message="This will permanently delete all previously read notifications from your history. Unread alerts will remain intact."
        confirmLabel="Clear Notifications"
        variant="danger"
        isLoading={isClearing}
      />
    </div>
  );
};
