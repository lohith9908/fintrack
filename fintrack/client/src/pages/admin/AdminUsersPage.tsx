import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  RotateCcw,
  UserCheck,
  UserX,
  Shield,
  Eye,
  Building2,
  Receipt,
  PiggyBank,
} from "lucide-react";
import { AdminService } from "../../services/admin.service";
import { AdminUserItem, AdminUserDetails } from "../../types/admin.types";
import { formatDate } from "../../utils/formatters";
import { useToast } from "../../components/ui/Toast";
import { getErrorMessage } from "../../services/api";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Badge } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import { Dialog } from "../../components/ui/Dialog";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/ErrorState";

export const AdminUsersPage: React.FC = () => {
  const toast = useToast();
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [search, setSearch] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // User Details Modal State
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<AdminUserDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);

  // Status Action Dialog
  const [statusTargetUser, setStatusTargetUser] = useState<{ id: string; name: string; targetStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED" } | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  // Role Action Dialog
  const [roleTargetUser, setRoleTargetUser] = useState<{ id: string; name: string; currentRole: string } | null>(null);
  const [newRole, setNewRole] = useState<"USER" | "ADMIN">("USER");
  const [isUpdatingRole, setIsUpdatingRole] = useState<boolean>(false);

  const fetchUsers = useCallback(async (pageToLoad = 1) => {
    try {
      setIsLoading(true);
      setError(null);
      const params: Record<string, string | number> = {
        page: pageToLoad,
        limit: pagination.limit,
      };

      if (search.trim()) params.search = search.trim();
      if (roleFilter !== "ALL") params.role = roleFilter;
      if (statusFilter !== "ALL") params.status = statusFilter;

      const res = await AdminService.getUsers(params);
      setUsers(res.users);
      setPagination(res.pagination);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [search, roleFilter, statusFilter, pagination.limit]);

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  const handleOpenDetails = async (userId: string) => {
    setSelectedUserId(userId);
    try {
      setIsLoadingDetails(true);
      const details = await AdminService.getUserById(userId);
      setUserDetails(details);
    } catch (err) {
      toast.error(getErrorMessage(err), "Failed to load user details");
      setSelectedUserId(null);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleConfirmStatusUpdate = async () => {
    if (!statusTargetUser) return;
    try {
      setIsUpdatingStatus(true);
      await AdminService.updateUserStatus(statusTargetUser.id, statusTargetUser.targetStatus);
      toast.success(
        `User ${statusTargetUser.name} marked as ${statusTargetUser.targetStatus}`,
        "Status Updated"
      );
      setStatusTargetUser(null);
      fetchUsers(pagination.page);
    } catch (err) {
      toast.error(getErrorMessage(err), "Status Update Failed");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleConfirmRoleUpdate = async () => {
    if (!roleTargetUser) return;
    try {
      setIsUpdatingRole(true);
      await AdminService.updateUserRole(roleTargetUser.id, newRole);
      toast.success(`User role updated to ${newRole}`, "Role Updated");
      setRoleTargetUser(null);
      fetchUsers(pagination.page);
    } catch (err) {
      toast.error(getErrorMessage(err), "Role Update Failed");
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const roleFilterOptions = [
    { value: "ALL", label: "All Roles" },
    { value: "USER", label: "Users" },
    { value: "ADMIN", label: "Admins" },
  ];

  const statusFilterOptions = [
    { value: "ALL", label: "All Statuses" },
    { value: "ACTIVE", label: "Active" },
    { value: "INACTIVE", label: "Inactive" },
    { value: "SUSPENDED", label: "Suspended" },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <Users className="h-3 w-3" />
            <span>Platform User Directory</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            User Management
          </h1>
          <p className="text-xs text-muted-foreground">
            Directory of all registered accounts, moderation controls, role elevations, and activity summaries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchUsers(pagination.page)}
            disabled={isLoading}
            className="text-xs font-semibold"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl border border-border bg-card/80 backdrop-blur-md shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Input
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            className="h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            options={roleFilterOptions}
            className="h-9 text-xs min-w-[110px]"
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={statusFilterOptions}
            className="h-9 text-xs min-w-[120px]"
          />
        </div>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <Card className="p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </Card>
      ) : error ? (
        <ErrorState
          title="Unable to load user directory"
          message={error}
          onRetry={() => fetchUsers(1)}
        />
      ) : users.length === 0 ? (
        <Card className="py-12 text-center space-y-2">
          <Users className="h-8 w-8 text-muted-foreground mx-auto" />
          <h3 className="text-sm font-bold text-foreground">No users match criteria</h3>
          <p className="text-xs text-muted-foreground">Try adjusting your search query or role/status filters.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden border-border/80 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/40 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Financial Records</th>
                  <th className="py-3 px-4">Registered</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {users.map((user) => {
                  const isSuspended = user.status === "SUSPENDED";
                  const isAdmin = user.role === "ADMIN";

                  return (
                    <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                      {/* Name and Email */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={user.name} size="sm" />
                          <div className="min-w-0">
                            <span className="font-bold text-foreground block truncate">
                              {user.name}
                            </span>
                            <span className="text-[11px] text-muted-foreground truncate block">
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3 px-4">
                        <Badge variant={isAdmin ? "danger" : "secondary"} size="sm">
                          {user.role}
                        </Badge>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            user.status === "ACTIVE"
                              ? "success"
                              : isSuspended
                              ? "danger"
                              : "warning"
                          }
                          size="sm"
                        >
                          {user.status}
                        </Badge>
                      </td>

                      {/* Records */}
                      <td className="py-3 px-4 text-muted-foreground">
                        <div className="flex items-center gap-2 text-[11px]">
                          <span>{user.entityCounts.accounts} accs</span>
                          <span>•</span>
                          <span>{user.entityCounts.transactions} txns</span>
                          <span>•</span>
                          <span>{user.entityCounts.budgets} budgets</span>
                        </div>
                      </td>

                      {/* Registered Date */}
                      <td className="py-3 px-4 text-muted-foreground font-mono text-[11px]">
                        {formatDate(user.createdAt, { month: "short", day: "numeric", year: "numeric" })}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDetails(user.id)}
                            className="h-7 w-7 p-0"
                            title="Inspect User Details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>

                          {user.status === "ACTIVE" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setStatusTargetUser({
                                  id: user.id,
                                  name: user.name,
                                  targetStatus: "SUSPENDED",
                                })
                              }
                              className="h-7 text-[11px] px-2 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                              title="Suspend User Account"
                            >
                              <UserX className="h-3 w-3 mr-1" />
                              <span>Suspend</span>
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setStatusTargetUser({
                                  id: user.id,
                                  name: user.name,
                                  targetStatus: "ACTIVE",
                                })
                              }
                              className="h-7 text-[11px] px-2 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                              title="Reactivate User Account"
                            >
                              <UserCheck className="h-3 w-3 mr-1" />
                              <span>Activate</span>
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setRoleTargetUser({
                                id: user.id,
                                name: user.name,
                                currentRole: user.role,
                              });
                              setNewRole(user.role === "ADMIN" ? "USER" : "ADMIN");
                            }}
                            className="h-7 text-[11px] px-2"
                            title="Change Role"
                          >
                            <Shield className="h-3 w-3 mr-1" />
                            <span>Role</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {pagination.totalPages > 1 && (
            <div className="p-3 border-t border-border bg-card/60 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Showing {users.length} of {pagination.total} users
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchUsers(pagination.page - 1)}
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
                  onClick={() => fetchUsers(pagination.page + 1)}
                  className="h-7 px-2.5 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Safe User Details Modal */}
      <Dialog
        isOpen={Boolean(selectedUserId)}
        onClose={() => {
          setSelectedUserId(null);
          setUserDetails(null);
        }}
        size="lg"
        title={userDetails?.user.name || "User Details"}
        description="Safe profile metadata and recorded financial accounts summary."
      >
        {isLoadingDetails || !userDetails ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <div className="space-y-5 text-xs">
            {/* User Profile Bar */}
            <div className="p-3.5 rounded-xl bg-secondary/50 border border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={userDetails.user.name} size="md" />
                <div>
                  <h4 className="font-bold text-sm text-foreground">{userDetails.user.name}</h4>
                  <p className="text-muted-foreground">{userDetails.user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={userDetails.user.role === "ADMIN" ? "danger" : "secondary"}>
                  {userDetails.user.role}
                </Badge>
                <Badge variant={userDetails.user.status === "ACTIVE" ? "success" : "danger"}>
                  {userDetails.user.status}
                </Badge>
              </div>
            </div>

            {/* Entity Summary Stats */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-card border border-border/60">
                <Building2 className="h-4 w-4 text-primary mx-auto mb-1" />
                <span className="text-[10px] text-muted-foreground block">Accounts</span>
                <span className="font-bold text-sm">{userDetails.entitySummary.accountsCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-card border border-border/60">
                <Receipt className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
                <span className="text-[10px] text-muted-foreground block">Transactions</span>
                <span className="font-bold text-sm">{userDetails.entitySummary.transactionsCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-card border border-border/60">
                <PiggyBank className="h-4 w-4 text-purple-500 mx-auto mb-1" />
                <span className="text-[10px] text-muted-foreground block">Budgets</span>
                <span className="font-bold text-sm">{userDetails.entitySummary.budgetsCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-card border border-border/60">
                <RotateCcw className="h-4 w-4 text-amber-500 mx-auto mb-1" />
                <span className="text-[10px] text-muted-foreground block">Recurring</span>
                <span className="font-bold text-sm">{userDetails.entitySummary.recurringCount}</span>
              </div>
            </div>

            {/* Accounts List Preview */}
            <div className="space-y-2">
              <h5 className="font-bold text-foreground">Registered Financial Accounts</h5>
              {userDetails.accounts.length === 0 ? (
                <p className="text-muted-foreground italic">No accounts linked yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {userDetails.accounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="p-2.5 rounded-lg bg-card border border-border/40 flex items-center justify-between"
                    >
                      <span className="font-semibold text-foreground">{acc.name}</span>
                      <Badge variant="secondary" size="sm">
                        {acc.type.replace("_", " ")}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Dialog>

      {/* Confirm Status Change Dialog */}
      <ConfirmDialog
        isOpen={Boolean(statusTargetUser)}
        onClose={() => setStatusTargetUser(null)}
        onConfirm={handleConfirmStatusUpdate}
        title={`Change User Status to ${statusTargetUser?.targetStatus}?`}
        message={`Are you sure you want to mark ${statusTargetUser?.name} as ${statusTargetUser?.targetStatus}? Suspended or inactive users will be blocked from accessing FinTrack.`}
        confirmLabel={`Set as ${statusTargetUser?.targetStatus}`}
        variant={statusTargetUser?.targetStatus === "ACTIVE" ? "primary" : "danger"}
        isLoading={isUpdatingStatus}
      />

      {/* Confirm Role Change Dialog */}
      <Dialog
        isOpen={Boolean(roleTargetUser)}
        onClose={() => setRoleTargetUser(null)}
        title={`Change Role for ${roleTargetUser?.name}`}
        description="Administrators receive elevated access to user directory, audit logs, and platform telemetry."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setRoleTargetUser(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant={newRole === "ADMIN" ? "danger" : "primary"}
              onClick={handleConfirmRoleUpdate}
              isLoading={isUpdatingRole}
            >
              Confirm Role Change
            </Button>
          </>
        }
      >
        <div className="space-y-3 py-2 text-xs">
          <p className="text-muted-foreground">
            Current role: <span className="font-bold text-foreground">{roleTargetUser?.currentRole}</span>
          </p>
          <div className="space-y-1">
            <label className="font-semibold text-foreground">Select New Role</label>
            <Select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as "USER" | "ADMIN")}
              options={[
                { value: "USER", label: "USER (Standard Personal Finance Account)" },
                { value: "ADMIN", label: "ADMIN (Full Platform Governance & Governance Console)" },
              ]}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};
