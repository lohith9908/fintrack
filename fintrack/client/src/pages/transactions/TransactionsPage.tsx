import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  CreditCard,
  Building2,
  Wallet,
  Smartphone,
  Layers,
  FileText,
} from "lucide-react";
import { TransactionService } from "../../services/transaction.service";
import { AccountService } from "../../services/account.service";
import { CategoryService } from "../../services/category.service";
import {
  ITransaction,
  TransactionSummary,
  TransactionType,
  PaymentMethod,
  CreateTransactionPayload,
} from "../../types/transaction.types";
import { IAccount } from "../../types/account.types";
import { ICategory } from "../../types/category.types";
import {
  Button,
  Input,
  Select,
  CurrencyInput,
  DatePicker,
  Textarea,
  Tabs,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Dialog,
  Dropdown,
  Skeleton,
  EmptyState,
  ErrorState,
  ConfirmDialog,
} from "../../components/ui";
import { useToast } from "../../components/ui/Toast";
import { formatCurrency, formatDate } from "../../utils/formatters";

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Cash",
  UPI: "UPI",
  CREDIT_CARD: "Credit Card",
  DEBIT_CARD: "Debit Card",
  BANK_TRANSFER: "Bank Transfer",
  OTHER: "Other",
};

const PAYMENT_METHOD_ICONS: Record<PaymentMethod, React.FC<{ className?: string }>> = {
  CASH: Wallet,
  UPI: Smartphone,
  CREDIT_CARD: CreditCard,
  DEBIT_CARD: CreditCard,
  BANK_TRANSFER: Building2,
  OTHER: Layers,
};

export const TransactionsPage: React.FC = () => {
  const toast = useToast();

  // Transactions State
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  // Supporting Data
  const [accounts, setAccounts] = useState<IAccount[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);

  // Dialog States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<ITransaction | null>(null);
  const [viewingTransaction, setViewingTransaction] = useState<ITransaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<ITransaction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<{
    amount: number;
    type: TransactionType;
    category: string;
    description: string;
    date: string;
    paymentMethod: PaymentMethod;
    account: string;
    notes: string;
  }>({
    amount: 0,
    type: "EXPENSE",
    category: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    paymentMethod: "UPI",
    account: "",
    notes: "",
  });

  // Load Transactions
  const loadTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await TransactionService.getTransactions();
      setTransactions(data.transactions);
      setSummary(data.summary);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load transactions";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load Accounts and Categories for Dropdowns
  const loadMetadata = useCallback(async () => {
    try {
      const [accRes, catRes] = await Promise.all([
        AccountService.getAccounts(),
        CategoryService.getCategories(),
      ]);
      setAccounts(accRes.accounts.filter((a) => a.status !== "ARCHIVED"));
      setCategories(catRes);
    } catch {
      toast.error("Failed to load accounts or categories");
    }
  }, [toast]);

  useEffect(() => {
    loadTransactions();
    loadMetadata();
  }, [loadTransactions, loadMetadata]);

  // Filter transactions by tab
  const filteredTransactions = transactions.filter((t) => {
    if (activeTab === "income") return t.type === "INCOME";
    if (activeTab === "expense") return t.type === "EXPENSE";
    return true;
  });

  // Dynamic Categories matching current selected type
  const availableCategories = categories.filter(
    (c) => c.type === formData.type && c.isActive
  );

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingTransaction(null);
    const defaultAcc = accounts[0]?._id || "";
    const defaultCat = categories.find((c) => c.type === "EXPENSE")?._id || "";

    setFormData({
      amount: 0,
      type: "EXPENSE",
      category: defaultCat,
      description: "",
      date: new Date().toISOString().split("T")[0],
      paymentMethod: "UPI",
      account: defaultAcc,
      notes: "",
    });
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (txn: ITransaction) => {
    setEditingTransaction(txn);
    setFormData({
      amount: txn.amount,
      type: txn.type,
      category: typeof txn.category === "object" ? txn.category._id : txn.category,
      description: txn.description,
      date: new Date(txn.date).toISOString().split("T")[0],
      paymentMethod: txn.paymentMethod,
      account: typeof txn.account === "object" ? txn.account._id : txn.account,
      notes: txn.notes || "",
    });
    setIsAddModalOpen(true);
  };

  // Handle Submit (Create or Update)
  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || formData.amount <= 0) {
      toast.warning("Please enter an amount greater than zero");
      return;
    }
    if (!formData.description.trim()) {
      toast.warning("Please enter a description");
      return;
    }
    if (!formData.category) {
      toast.warning("Please select a category");
      return;
    }
    if (!formData.account) {
      toast.warning("Please select an account");
      return;
    }

    try {
      setIsSubmitting(true);

      const payload: CreateTransactionPayload = {
        amount: Number(formData.amount),
        type: formData.type,
        category: formData.category,
        description: formData.description.trim(),
        date: formData.date,
        paymentMethod: formData.paymentMethod,
        account: formData.account,
        notes: formData.notes.trim() || undefined,
      };

      if (editingTransaction) {
        await TransactionService.updateTransaction(editingTransaction._id, payload);
        toast.success("Transaction updated successfully");
      } else {
        await TransactionService.createTransaction(payload);
        toast.success("Transaction recorded successfully");
      }

      setIsAddModalOpen(false);
      loadTransactions();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save transaction";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleConfirmDelete = async () => {
    if (!transactionToDelete) return;
    try {
      const res = await TransactionService.deleteTransaction(transactionToDelete._id);
      toast.success(res.message);
      setTransactionToDelete(null);
      loadTransactions();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete transaction";
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-[1440px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <FileText className="h-3 w-3" />
            <span>Phase 9 Core Ledger</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Transactions & Ledger
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Record, track, and monitor all your income earnings and daily expenses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAdd}
            className="flex items-center gap-2 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add Transaction</span>
          </Button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card hover className="bg-gradient-to-br from-card to-card/80">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs uppercase tracking-wider text-emerald-500 font-semibold">
                  Total Income
                </CardTitle>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <ArrowDownLeft className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-emerald-500">
                +{formatCurrency(summary.totalIncome)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Recorded earnings & deposits
              </p>
            </CardContent>
          </Card>

          <Card hover className="bg-gradient-to-br from-card to-card/80">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs uppercase tracking-wider text-rose-500 font-semibold">
                  Total Expenses
                </CardTitle>
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500">
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-rose-500">
                -{formatCurrency(summary.totalExpenses)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Recorded outflows & spendings
              </p>
            </CardContent>
          </Card>

          <Card hover className="bg-gradient-to-br from-card to-card/80">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Net Cash Flow
                </CardTitle>
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Wallet className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold tracking-tight ${
                  summary.netCashFlow >= 0 ? "text-foreground" : "text-rose-500"
                }`}
              >
                {summary.netCashFlow >= 0 ? "+" : ""}
                {formatCurrency(summary.netCashFlow)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Net income surplus / deficit
              </p>
            </CardContent>
          </Card>

          <Card hover className="bg-gradient-to-br from-card to-card/80">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Total Records
                </CardTitle>
                <div className="p-2 rounded-lg bg-secondary text-foreground">
                  <FileText className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {summary.transactionCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total ledger transactions recorded
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Tabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          variant="pill"
          tabs={[
            { id: "all", label: "All Transactions", badge: transactions.length.toString() },
            { id: "expense", label: "Expenses", badge: transactions.filter((t) => t.type === "EXPENSE").length.toString() },
            { id: "income", label: "Income", badge: transactions.filter((t) => t.type === "INCOME").length.toString() },
          ]}
        />
      </div>

      {/* Transaction List / States */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton variant="rectangular" className="h-14 w-full" />
          <Skeleton variant="rectangular" className="h-14 w-full" />
          <Skeleton variant="rectangular" className="h-14 w-full" />
        </div>
      ) : error ? (
        <ErrorState
          title="Could not load transactions"
          message={error}
          onRetry={loadTransactions}
        />
      ) : filteredTransactions.length === 0 ? (
        <EmptyState
          title={activeTab === "all" ? "No transactions recorded yet" : `No ${activeTab} transactions found`}
          description="Start building your financial ledger by adding your income sources or recent expenses."
          actionLabel="Add Transaction"
          onAction={handleOpenAdd}
        />
      ) : (
        <Card className="overflow-hidden border border-border">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Account / Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-12 text-center"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((txn) => {
                  const isIncome = txn.type === "INCOME";
                  const MethodIcon = PAYMENT_METHOD_ICONS[txn.paymentMethod] || Layers;

                  return (
                    <TableRow key={txn._id} className="hover:bg-secondary/40 transition-colors">
                      <TableCell className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground/70" />
                          <span>{formatDate(txn.date)}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: txn.category?.color || "#3B82F6" }}
                          />
                          <span className="text-xs font-semibold text-foreground">
                            {txn.category?.name || "Uncategorized"}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="text-sm font-medium text-foreground line-clamp-1">
                            {txn.description}
                          </div>
                          {txn.notes && (
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {txn.notes}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Badge variant="secondary" size="sm" className="flex items-center gap-1">
                            <MethodIcon className="h-3 w-3" />
                            <span>{txn.account?.name || "Account"}</span>
                          </Badge>
                          <span className="text-[11px] opacity-70">
                            • {PAYMENT_METHOD_LABELS[txn.paymentMethod] || txn.paymentMethod}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-right whitespace-nowrap">
                        <span
                          className={`text-sm font-bold tracking-tight ${
                            isIncome ? "text-emerald-500" : "text-rose-500"
                          }`}
                        >
                          {isIncome ? "+" : "-"}
                          {formatCurrency(txn.amount, txn.account?.currency || "INR")}
                        </span>
                      </TableCell>

                      <TableCell className="text-center">
                        <Dropdown
                          trigger={
                            <button
                              aria-label="Transaction actions"
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          }
                          items={[
                            {
                              id: "view",
                              label: "View Details",
                              icon: <Eye className="h-3.5 w-3.5" />,
                              onClick: () => setViewingTransaction(txn),
                            },
                            {
                              id: "edit",
                              label: "Edit Record",
                              icon: <Edit2 className="h-3.5 w-3.5" />,
                              onClick: () => handleOpenEdit(txn),
                            },
                            {
                              id: "delete",
                              label: "Delete",
                              icon: <Trash2 className="h-3.5 w-3.5" />,
                              destructive: true,
                              onClick: () => setTransactionToDelete(txn),
                            },
                          ]}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Add / Edit Transaction Modal Dialog */}
      <Dialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingTransaction ? "Edit Transaction" : "Record New Transaction"}
        description={
          editingTransaction
            ? "Update the details of this financial transaction."
            : "Enter the details of your income or expense transaction."
        }
      >
        <form onSubmit={handleSaveTransaction} className="space-y-4">
          {/* Income vs Expense Selector */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-secondary/50 border border-border">
            <button
              type="button"
              onClick={() => {
                const firstCat = categories.find((c) => c.type === "EXPENSE")?._id || "";
                setFormData({ ...formData, type: "EXPENSE", category: firstCat });
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                formData.type === "EXPENSE"
                  ? "bg-rose-500 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ArrowUpRight className="h-4 w-4" />
              <span>Expense</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const firstCat = categories.find((c) => c.type === "INCOME")?._id || "";
                setFormData({ ...formData, type: "INCOME", category: firstCat });
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                formData.type === "INCOME"
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ArrowDownLeft className="h-4 w-4" />
              <span>Income</span>
            </button>
          </div>

          {/* Amount Input */}
          <CurrencyInput
            label="Amount *"
            currencySymbol="₹"
            value={formData.amount || ""}
            onChangeValue={(val) => setFormData({ ...formData, amount: val || 0 })}
            placeholder="0.00"
            required
          />

          {/* Description */}
          <Input
            label="Description / Title *"
            placeholder="e.g. Salary Credit, Grocery Shopping, Electric Bill"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />

          {/* Category & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Category *"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={availableCategories.map((cat) => ({
                value: cat._id,
                label: cat.name,
              }))}
              required
            />

            <DatePicker
              label="Transaction Date *"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          {/* Account & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Financial Account / Wallet *"
              value={formData.account}
              onChange={(e) => setFormData({ ...formData, account: e.target.value })}
              options={accounts.map((acc) => ({
                value: acc._id,
                label: `${acc.name} (${acc.currency || "INR"})`,
              }))}
              required
            />

            <Select
              label="Payment Method *"
              value={formData.paymentMethod}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  paymentMethod: e.target.value as PaymentMethod,
                })
              }
              options={[
                { value: "UPI", label: "UPI" },
                { value: "CASH", label: "Cash" },
                { value: "CREDIT_CARD", label: "Credit Card" },
                { value: "DEBIT_CARD", label: "Debit Card" },
                { value: "BANK_TRANSFER", label: "Bank Transfer" },
                { value: "OTHER", label: "Other" },
              ]}
              required
            />
          </div>

          {/* Notes */}
          <Textarea
            label="Notes & Remarks (Optional)"
            placeholder="Additional context or references"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            maxCharacters={500}
          />

          {/* Dialog Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {editingTransaction ? "Save Changes" : "Save Transaction"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Transaction Details Modal */}
      {viewingTransaction && (
        <Dialog
          isOpen={true}
          onClose={() => setViewingTransaction(null)}
          title="Transaction Details"
          description="Complete financial audit metadata for this record."
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-card border border-border flex items-center justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  {viewingTransaction.type}
                </span>
                <div
                  className={`text-2xl font-bold ${
                    viewingTransaction.type === "INCOME"
                      ? "text-emerald-500"
                      : "text-rose-500"
                  }`}
                >
                  {viewingTransaction.type === "INCOME" ? "+" : "-"}
                  {formatCurrency(
                    viewingTransaction.amount,
                    viewingTransaction.account?.currency || "INR"
                  )}
                </div>
              </div>

              <div
                className="px-3 py-1 rounded-full text-xs font-bold border"
                style={{
                  backgroundColor: `${viewingTransaction.category?.color || "#3B82F6"}15`,
                  borderColor: `${viewingTransaction.category?.color || "#3B82F6"}30`,
                  color: viewingTransaction.category?.color || "#3B82F6",
                }}
              >
                {viewingTransaction.category?.name}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-muted-foreground">Description</span>
                <p className="font-semibold text-foreground text-sm">
                  {viewingTransaction.description}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-muted-foreground">Date</span>
                <p className="font-semibold text-foreground text-sm">
                  {formatDate(viewingTransaction.date)}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-muted-foreground">Account</span>
                <p className="font-semibold text-foreground text-sm">
                  {viewingTransaction.account?.name}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-muted-foreground">Payment Method</span>
                <p className="font-semibold text-foreground text-sm">
                  {PAYMENT_METHOD_LABELS[viewingTransaction.paymentMethod]}
                </p>
              </div>
            </div>

            {viewingTransaction.notes && (
              <div className="space-y-1 text-xs">
                <span className="text-muted-foreground">Notes</span>
                <p className="p-2.5 rounded-lg bg-secondary/50 border border-border/60 text-foreground">
                  {viewingTransaction.notes}
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewingTransaction(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const txn = viewingTransaction;
                  setViewingTransaction(null);
                  handleOpenEdit(txn);
                }}
              >
                Edit Transaction
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!transactionToDelete}
        onClose={() => setTransactionToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Transaction Record?"
        message={`Are you sure you want to permanently delete "${transactionToDelete?.description}"? Your account balance and financial totals will be recalculated automatically.`}
        confirmLabel="Delete Transaction"
        variant="danger"
      />
    </div>
  );
};
