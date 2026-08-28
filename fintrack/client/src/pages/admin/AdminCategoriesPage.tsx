import React, { useState, useEffect, useCallback } from "react";
import {
  FolderTree,
  Plus,
  RotateCcw,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Tag,
} from "lucide-react";
import { AdminService } from "../../services/admin.service";
import { AdminCategoryItem } from "../../types/admin.types";
import { useToast } from "../../components/ui/Toast";
import { getErrorMessage } from "../../services/api";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Badge } from "../../components/ui/Badge";
import { Dialog } from "../../components/ui/Dialog";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/ErrorState";

export const AdminCategoriesPage: React.FC = () => {
  const toast = useToast();
  const [categories, setCategories] = useState<AdminCategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Add / Edit Modal State
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategoryItem | null>(null);
  const [name, setName] = useState<string>("");
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [icon, setIcon] = useState<string>("Tag");
  const [color, setColor] = useState<string>("#6366F1");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Delete / Disable State
  const [deleteTarget, setDeleteTarget] = useState<AdminCategoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const list = await AdminService.getSystemCategories();
      setCategories(list);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName("");
    setType("EXPENSE");
    setIcon("Tag");
    setColor("#6366F1");
    setModalOpen(true);
  };

  const handleOpenEdit = (cat: AdminCategoryItem) => {
    setEditingCategory(cat);
    setName(cat.name);
    setType(cat.type);
    setIcon(cat.icon || "Tag");
    setColor(cat.color || "#6366F1");
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Category name is required", "Validation Error");
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingCategory) {
        await AdminService.updateSystemCategory(editingCategory.id, {
          name: name.trim(),
          icon: icon.trim(),
          color: color.trim(),
        });
        toast.success(`Category "${name}" updated`, "Category Saved");
      } else {
        await AdminService.createSystemCategory({
          name: name.trim(),
          type,
          icon: icon.trim(),
          color: color.trim(),
        });
        toast.success(`System category "${name}" created`, "Category Created");
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err) {
      toast.error(getErrorMessage(err), "Save Failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (cat: AdminCategoryItem) => {
    try {
      await AdminService.updateSystemCategory(cat.id, { isActive: !cat.isActive });
      toast.success(
        `Category marked as ${!cat.isActive ? "Active" : "Disabled"}`,
        "Status Toggled"
      );
      fetchCategories();
    } catch (err) {
      toast.error(getErrorMessage(err), "Toggle Failed");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      const res = await AdminService.deleteOrDisableCategory(deleteTarget.id);
      if (res.action === "DISABLED") {
        toast.warning(res.message, "Category Disabled");
      } else {
        toast.success(res.message, "Category Deleted");
      }
      setDeleteTarget(null);
      fetchCategories();
    } catch (err) {
      toast.error(getErrorMessage(err), "Delete Failed");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <FolderTree className="h-3 w-3" />
            <span>Phase 17 System Categories</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            System Categories Management
          </h1>
          <p className="text-xs text-muted-foreground">
            Configure global default transaction categories with automated historical transaction reference protection.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCategories}
            disabled={isLoading}
            className="text-xs font-semibold"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            <span>Refresh</span>
          </Button>

          <Button size="sm" onClick={handleOpenAdd} className="text-xs font-semibold">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            <span>Add System Category</span>
          </Button>
        </div>
      </div>

      {/* Main Categories Table */}
      {isLoading ? (
        <Card className="p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between gap-4">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-6 w-24" />
            </div>
          ))}
        </Card>
      ) : error ? (
        <ErrorState
          title="Unable to load system categories"
          message={error}
          onRetry={fetchCategories}
        />
      ) : categories.length === 0 ? (
        <Card className="py-12 text-center space-y-3">
          <FolderTree className="h-8 w-8 text-muted-foreground mx-auto" />
          <h3 className="text-sm font-bold text-foreground">No system categories found</h3>
          <p className="text-xs text-muted-foreground">Get started by creating standard global categories.</p>
          <Button size="sm" onClick={handleOpenAdd} className="text-xs">
            <Plus className="h-3.5 w-3.5 mr-1" />
            <span>Create First Category</span>
          </Button>
        </Card>
      ) : (
        <Card className="overflow-hidden border-border/80 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/40 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Color</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Historical Usage</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-muted/30 transition-colors">
                    {/* Icon & Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-2xs"
                          style={{ backgroundColor: cat.color || "#6366F1" }}
                        >
                          <Tag className="h-3.5 w-3.5" />
                        </div>
                        <span className="font-bold text-foreground">{cat.name}</span>
                      </div>
                    </td>

                    {/* Type Badge */}
                    <td className="py-3 px-4">
                      <Badge variant={cat.type === "INCOME" ? "success" : "danger"} size="sm">
                        {cat.type}
                      </Badge>
                    </td>

                    {/* Color Code */}
                    <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-3 w-3 rounded-full border border-border"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span>{cat.color}</span>
                      </div>
                    </td>

                    {/* Status Toggle Badge */}
                    <td className="py-3 px-4">
                      <Badge variant={cat.isActive ? "success" : "secondary"} size="sm">
                        {cat.isActive ? "Active" : "Disabled"}
                      </Badge>
                    </td>

                    {/* Usage count */}
                    <td className="py-3 px-4 text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {cat.transactionCount} transactions
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(cat)}
                          className="h-7 text-[11px] px-2"
                          title={cat.isActive ? "Disable Category" : "Enable Category"}
                        >
                          {cat.isActive ? (
                            <XCircle className="h-3 w-3 mr-1 text-muted-foreground" />
                          ) : (
                            <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-500" />
                          )}
                          <span>{cat.isActive ? "Disable" : "Enable"}</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(cat)}
                          className="h-7 w-7 p-0"
                          title="Edit Category"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-primary" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(cat)}
                          className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                          title="Delete / Soft-Disable Category"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add / Edit Category Dialog */}
      <Dialog
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCategory ? `Edit Category: ${editingCategory.name}` : "Create System Category"}
        description="Global system categories are available to all users on the platform."
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-foreground">Category Name</label>
            <Input
              placeholder="e.g. Subscriptions, Groceries, Dividends"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {!editingCategory && (
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Flow Type</label>
              <Select
                value={type}
                onChange={(e) => setType(e.target.value as "INCOME" | "EXPENSE")}
                options={[
                  { value: "EXPENSE", label: "EXPENSE (Spending Category)" },
                  { value: "INCOME", label: "INCOME (Revenue Category)" },
                ]}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Icon Identifier</label>
              <Input
                placeholder="Tag, ShoppingBag, Utensils"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Hex Color Code</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-9 w-9 rounded-lg border border-border p-0.5 cursor-pointer bg-transparent"
                />
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="flex-1 font-mono uppercase text-xs"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              {editingCategory ? "Save Changes" : "Create Category"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete / Soft-Disable Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title={`Delete System Category "${deleteTarget?.name}"?`}
        message={
          deleteTarget && deleteTarget.transactionCount > 0
            ? `This category is referenced by ${deleteTarget.transactionCount} transactions. To preserve financial ledger data integrity, FinTrack will safely disable this category instead of permanently deleting historical records.`
            : `Are you sure you want to permanently delete the "${deleteTarget?.name}" system category?`
        }
        confirmLabel={deleteTarget && deleteTarget.transactionCount > 0 ? "Soft-Disable Category" : "Permanently Delete"}
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
