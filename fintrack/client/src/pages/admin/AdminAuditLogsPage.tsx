import React, { useState, useEffect, useCallback } from "react";
import {
  Activity,
  Search,
  RotateCcw,
  Clock,
  Eye,
  FileCode,
  ShieldCheck,
} from "lucide-react";
import { AdminService } from "../../services/admin.service";
import { AdminAuditLogItem } from "../../types/admin.types";
import { formatDate } from "../../utils/formatters";
import { getErrorMessage } from "../../services/api";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Badge } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import { Dialog } from "../../components/ui/Dialog";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/ErrorState";

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AdminAuditLogItem[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 25, totalPages: 1 });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Dropdown Options
  const [actionOptions, setActionOptions] = useState<string[]>([]);
  const [targetTypeOptions, setTargetTypeOptions] = useState<string[]>([]);
  const [selectedAction, setSelectedAction] = useState<string>("ALL");
  const [selectedTargetType, setSelectedTargetType] = useState<string>("ALL");
  const [searchActor, setSearchActor] = useState<string>("");

  // Metadata Inspector Modal State
  const [selectedLog, setSelectedLog] = useState<AdminAuditLogItem | null>(null);

  const fetchFilters = useCallback(async () => {
    try {
      const filters = await AdminService.getAuditFilterOptions();
      setActionOptions(filters.actions);
      setTargetTypeOptions(filters.targetTypes);
    } catch {
      // Non-critical
    }
  }, []);

  const fetchLogs = useCallback(
    async (pageToLoad = 1) => {
      try {
        setIsLoading(true);
        setError(null);
        const params: Record<string, string | number> = {
          page: pageToLoad,
          limit: pagination.limit,
        };

        if (selectedAction !== "ALL") params.action = selectedAction;
        if (selectedTargetType !== "ALL") params.targetType = selectedTargetType;

        const res = await AdminService.getAuditLogs(params);
        setLogs(res.logs);
        setPagination(res.pagination);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    },
    [selectedAction, selectedTargetType, pagination.limit]
  );

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  // Client-side actor search filtering if needed
  const filteredLogs = logs.filter((log) => {
    if (!searchActor.trim()) return true;
    const q = searchActor.toLowerCase();
    return (
      log.actor.name.toLowerCase().includes(q) ||
      log.actor.email.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <ShieldCheck className="h-3 w-3" />
            <span>Phase 17 Governance Trail</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Administrative Audit Trail
          </h1>
          <p className="text-xs text-muted-foreground">
            Immutable, read-only activity logs of administrative actions, user moderation, role updates, and platform configurations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLogs(pagination.page)}
            disabled={isLoading}
            className="text-xs font-semibold"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            <span>Refresh Logs</span>
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl border border-border bg-card/80 backdrop-blur-md shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Input
            placeholder="Search by admin name, email, or action keyword..."
            value={searchActor}
            onChange={(e) => setSearchActor(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            className="h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            options={[
              { value: "ALL", label: "All Action Types" },
              ...actionOptions.map((act) => ({
                value: act,
                label: act.replace(/_/g, " "),
              })),
            ]}
            className="h-9 text-xs min-w-[140px]"
          />

          <Select
            value={selectedTargetType}
            onChange={(e) => setSelectedTargetType(e.target.value)}
            options={[
              { value: "ALL", label: "All Target Entities" },
              ...targetTypeOptions.map((tgt) => ({
                value: tgt,
                label: tgt,
              })),
            ]}
            className="h-9 text-xs min-w-[120px]"
          />
        </div>
      </div>

      {/* Audit Logs Table */}
      {isLoading ? (
        <Card className="p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between gap-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-6 w-28" />
            </div>
          ))}
        </Card>
      ) : error ? (
        <ErrorState
          title="Unable to load audit logs"
          message={error}
          onRetry={() => fetchLogs(1)}
        />
      ) : filteredLogs.length === 0 ? (
        <Card className="py-12 text-center space-y-2">
          <Activity className="h-8 w-8 text-muted-foreground mx-auto" />
          <h3 className="text-sm font-bold text-foreground">No audit logs found</h3>
          <p className="text-xs text-muted-foreground">No administrative actions match your active filter filters.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden border-border/80 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/40 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Administrator</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Details Summary</th>
                  <th className="py-3 px-4 text-right">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    {/* Timestamp */}
                    <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(log.createdAt, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                      </div>
                    </td>

                    {/* Actor */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Avatar name={log.actor.name} size="sm" />
                        <div className="min-w-0">
                          <span className="font-bold text-foreground block truncate">
                            {log.actor.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground block truncate">
                            {log.actor.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4">
                      <Badge variant="secondary" size="sm" className="font-mono text-[10px]">
                        {log.action}
                      </Badge>
                    </td>

                    {/* Target Type */}
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-foreground">{log.targetType}</span>
                        {log.targetId && (
                          <span className="font-mono text-[10px] text-muted-foreground block truncate max-w-[120px]">
                            {log.targetId}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Metadata Summary */}
                    <td className="py-3 px-4 text-muted-foreground max-w-xs truncate">
                      {log.metadata ? (
                        <span className="text-[11px] font-mono">
                          {JSON.stringify(log.metadata).substring(0, 50)}...
                        </span>
                      ) : (
                        <span className="italic text-[11px]">No metadata</span>
                      )}
                    </td>

                    {/* Payload Inspector Button */}
                    <td className="py-3 px-4 text-right">
                      {log.metadata ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                          className="h-7 text-[11px] px-2 text-primary"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          <span>Inspect</span>
                        </Button>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="p-3 border-t border-border bg-card/60 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Showing {logs.length} of {pagination.total} audit logs
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchLogs(pagination.page - 1)}
                  className="h-7 px-2.5 text-xs"
                >
                  Previous
                </Button>
                <span className="font-bold text-foreground">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchLogs(pagination.page + 1)}
                  className="h-7 px-2.5 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Metadata Inspector Modal */}
      <Dialog
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title="Audit Event Metadata"
        description={`Payload inspection for ${selectedLog?.action} on ${selectedLog?.targetType}.`}
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-4 py-2 text-xs">
            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-secondary/50 border border-border/40">
              <div>
                <span className="text-muted-foreground text-[10px] block">Action</span>
                <span className="font-bold font-mono text-foreground">{selectedLog.action}</span>
              </div>
              <div>
                <span className="text-muted-foreground text-[10px] block">Target Entity</span>
                <span className="font-bold text-foreground">
                  {selectedLog.targetType} {selectedLog.targetId ? `(${selectedLog.targetId})` : ""}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground text-[10px] block">Executed By</span>
                <span className="font-semibold text-foreground">
                  {selectedLog.actor.name} ({selectedLog.actor.email})
                </span>
              </div>
              <div>
                <span className="text-muted-foreground text-[10px] block">Timestamp</span>
                <span className="font-mono text-foreground">{selectedLog.createdAt}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="font-semibold flex items-center gap-1.5">
                  <FileCode className="h-3.5 w-3.5" />
                  <span>Sanitized Payload (JSON)</span>
                </span>
                <span className="text-[10px] text-emerald-500 font-semibold">
                  ✓ Credentials omitted & scrubbed
                </span>
              </div>
              <pre className="p-3.5 rounded-xl bg-muted font-mono text-[11px] text-foreground overflow-x-auto max-h-72 border border-border">
                {JSON.stringify(selectedLog.metadata, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};
