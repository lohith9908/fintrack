import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  CheckCircle2,
  Info,
  Calendar,
  Sparkles,
  ExternalLink,
  Shield,
  ChevronRight,
} from "lucide-react";
import { NotificationService } from "../../services/notification.service";
import { NotificationItem } from "../../types/notification.types";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { cn } from "../../utils/cn";

export const NotificationBellDropdown: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [recentNotifications, setRecentNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUnreadAndRecent = async () => {
    try {
      const count = await NotificationService.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // Graceful fallback
    }
  };

  const loadRecentNotifications = async () => {
    try {
      setLoading(true);
      const res = await NotificationService.getNotifications({ limit: 5 });
      setRecentNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadAndRecent();
    const interval = setInterval(fetchUnreadAndRecent, 30000); // 30s polling for background updates
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadRecentNotifications();
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      setUnreadCount(0);
      setRecentNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // Graceful fallback
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.read) {
      try {
        await NotificationService.markAsRead(notif._id);
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setRecentNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, read: true } : n))
        );
      } catch {
        // Continue
      }
    }

    setIsOpen(false);

    // Direct navigation if metadata or type has associated route
    if (notif.type === "BUDGET_ALERT" || notif.type === "BUDGET_EXCEEDED") {
      navigate("/budgets");
    } else if (notif.type === "RECURRING_PAYMENT") {
      navigate("/recurring");
    } else if (notif.type === "GOAL_MILESTONE") {
      navigate("/goals");
    } else if (notif.type === "FINANCIAL_INSIGHT") {
      navigate("/analytics");
    } else {
      navigate("/notifications");
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

  const formatRelativeTime = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / (60 * 1000));
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "Yesterday";
    return `${days}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        aria-label={`Notifications (${unreadCount} unread)`}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative h-8 w-8 rounded-lg border border-border bg-card hover:bg-muted text-foreground flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          isOpen && "bg-muted border-primary/30"
        )}
      >
        <Bell className="h-4 w-4 text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-extrabold text-primary-foreground shadow-sm animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-border bg-card shadow-xl z-50 overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="p-3.5 border-b border-border flex items-center justify-between bg-muted/30">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-foreground">Notifications</h4>
              {unreadCount > 0 ? (
                <Badge variant="primary" size="sm">
                  {unreadCount} new
                </Badge>
              ) : (
                <Badge variant="secondary" size="sm">
                  Up to date
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-80 overflow-y-auto divide-y divide-border/40">
            {loading ? (
              <div className="p-6 text-center space-y-2">
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-muted-foreground">Loading notifications...</p>
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="h-8 w-8 rounded-full bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto">
                  <CheckCheck className="h-4 w-4" />
                </div>
                <p className="text-xs font-semibold text-foreground">No new notifications</p>
                <p className="text-[11px] text-muted-foreground">
                  You are all caught up! Automated alerts will appear here.
                </p>
              </div>
            ) : (
              recentNotifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  className={cn(
                    "p-3 flex items-start gap-3 hover:bg-muted/50 cursor-pointer transition-colors text-left",
                    !notif.read && "bg-primary/5 font-medium"
                  )}
                >
                  <div className="p-2 rounded-lg bg-card border border-border shrink-0 mt-0.5 shadow-2xs">
                    {getNotificationIcon(notif.type, notif.severity)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <p className={cn("text-xs truncate", !notif.read ? "font-bold text-foreground" : "font-medium text-foreground/80")}>
                        {notif.title}
                      </p>
                      {!notif.read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                    <div className="pt-1 flex items-center justify-between text-[10px] text-muted-foreground/80">
                      <span>{formatRelativeTime(notif.createdAt)}</span>
                      <span className="inline-flex items-center gap-0.5 text-primary">
                        View <ChevronRight className="h-2.5 w-2.5" />
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer View All Link */}
          <div className="p-2.5 border-t border-border bg-muted/20 text-center">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs font-semibold"
              onClick={() => {
                setIsOpen(false);
                navigate("/notifications");
              }}
            >
              <span>Open Notification Center</span>
              <ExternalLink className="h-3.5 w-3.5 ml-1.5 text-muted-foreground" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
