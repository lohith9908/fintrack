import React, { useState, useEffect, useCallback, useRef } from "react";
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
  Search,
  Filter,
  X,
  Paperclip,
  UploadCloud,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import { TransactionService } from "../../services/transaction.service";
import { AccountService } from "../../services/account.service";
import { CategoryService } from "../../services/category.service";
import {
  ITransaction,
  TransactionSummary,
  TransactionType,
  PaymentMethod,
  PaginationMeta,
  CreateTransactionPayload,
  TransactionFilterParams,
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
  Drawer,
  Dropdown,
  Pagination,
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Transactions State
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [filters, setFilters] = useState<{
    startDate: string;
    endDate: string;
    category: string;
    account: string;
    paymentMethod: string;
    minAmount: string;
    maxAmount: string;
  }>({
    startDate: "",
    endDate: "",
    category: "",
    account: "",
    paymentMethod: "",
    minAmount: "",
    maxAmount: "",
  });

  // Supporting Dropdown Data
  const [accounts, setAccounts] = useState<IAccount[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);

  // Dialog States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<ITransaction | null>(null);
  const [viewingTransaction, setViewingTransaction] = useState<ITransaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<ITransaction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Receipt Upload State
  const [selectedReceiptFile, setSelectedReceiptFile] = useState<File | null>(null);
  const [isReceiptLoading, setIsReceiptLoading] = useState(false);
  const [receiptBlobUrl, setReceiptBlobUrl] = useState<string | null>(null);

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

  // Fetch Transactions with Active Filters & Pagination
  const loadTransactions = useCallback(
    async (pageToLoad = pagination.page) => {
      try {
        setIsLoading(true);
        setError(null);

        const params: TransactionFilterParams = {
          page: pageToLoad,
          limit: pagination.limit,
        };

        if (searchQuery.trim()) params.search = searchQuery.trim();
        if (activeTab === "income") params.type = "INCOME";
        if (activeTab === "expense") params.type = "EXPENSE";
        if (filters.category) params.category = filters.category;
        if (filters.account) params.account = filters.account;
        if (filters.paymentMethod) params.paymentMethod = filters.paymentMethod as PaymentMethod;
        if (filters.startDate) params.startDate = filters.startDate;
        if (filters.endDate) params.endDate = filters.endDate;
        if (filters.minAmount) params.minAmount = Number(filters.minAmount);
        if (filters.maxAmount) params.maxAmount = Number(filters.maxAmount);

        const data = await TransactionService.getTransactions(params);
        setTransactions(data.transactions);
        setSummary(data.summary);
        setPagination(data.pagination);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load transactions";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [
      pagination.page,
      pagination.limit,
      searchQuery,
      activeTab,
      filters.category,
      filters.account,
      filters.paymentMethod,
      filters.startDate,
      filters.endDate,
      filters.minAmount,
      filters.maxAmount,
    ]
  );

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
    loadMetadata();
  }, [loadMetadata]);

  useEffect(() => {
    loadTransactions(1);
  }, [searchQuery, activeTab, filters, loadTransactions]);

  // Active filter count
  const activeFilterCount = Object.values(filters).filter((val) => Boolean(val)).length;

  const handleClearFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      category: "",
      account: "",
      paymentMethod: "",
      minAmount: "",
      maxAmount: "",
    });
    setSearchQuery("");
  };

  // Dynamic Categories matching current selected type
  const availableCategories = categories.filter(
    (c) => c.type === formData.type && c.isActive
  );

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingTransaction(null);
    setSelectedReceiptFile(null);
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
    setSelectedReceiptFile(null);
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

      let savedTxn: ITransaction;
      if (editingTransaction) {
        savedTxn = await TransactionService.updateTransaction(
          editingTransaction._id,
          payload
        );
        toast.success("Transaction updated successfully");
      } else {
        savedTxn = await TransactionService.createTransaction(payload);
        toast.success("Transaction recorded successfully");
      }

      // If a receipt file was chosen in the modal, upload it now
      if (selectedReceiptFile && savedTxn) {
        try {
          await TransactionService.uploadReceipt(savedTxn._id, selectedReceiptFile);
          toast.success("Receipt attached successfully");
        } catch {
          toast.warning("Transaction saved, but receipt upload failed");
        }
      }

      setIsAddModalOpen(false);
      setSelectedReceiptFile(null);
      loadTransactions(1);
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
      loadTransactions(pagination.page);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete transaction";
      toast.error(msg);
    }
  };

  // View Receipt Blob
  const handleViewReceipt = async (txn: ITransaction) => {
    try {
      setIsReceiptLoading(true);
      const { url } = await TransactionService.getReceiptBlob(txn._id);
      setReceiptBlobUrl(url);
    } catch {
      toast.error("Failed to load receipt file");
    } finally {
      setIsReceiptLoading(false);
    }
  };

  // Delete Receipt
  const handleDeleteReceipt = async (txn: ITransaction) => {
    try {
      setIsReceiptLoading(true);
      const updated = await TransactionService.deleteReceipt(txn._id);
      setViewingTransaction(updated);
      setReceiptBlobUrl(null);
      toast.success("Receipt attachment removed");
      loadTransactions(pagination.page);
    } catch {
      toast.error("Failed to remove receipt");
    } finally {
      setIsReceiptLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-[1440px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <FileText className="h-3 w-3" />
            <span>Phase 10 Search, Filters & Receipts</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Transactions & Ledger
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Searchable, filterable income and expense records with receipt attachments.
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

      {/* Search & Filter Toolbar */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Tabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            variant="pill"
            tabs={[
              { id: "all", label: "All Transactions" },
              { id: "expense", label: "Expenses" },
              { id: "income", label: "Income" },
            ]}
          />

          <div className="flex items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-8 text-xs rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filter Toggle Button */}
            <Button
              variant={activeFilterCount > 0 ? "primary" : "outline"}
              size="sm"
              onClick={() => setIsFilterDrawerOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Filter className="h-3.5 w-3.5" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" size="sm" className="ml-1 bg-white text-black font-bold">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Active Filter Chips */}
        {(activeFilterCount > 0 || searchQuery) && (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-muted-foreground font-medium">Active filters:</span>

            {searchQuery && (
              <Badge variant="secondary" size="sm" className="flex items-center gap-1">
                <span>Search: "{searchQuery}"</span>
                <button onClick={() => setSearchQuery("")}>
                  <X className="h-3 w-3 hover:text-foreground" />
                </button>
              </Badge>
            )}

            {filters.category && (
              <Badge variant="secondary" size="sm" className="flex items-center gap-1">
                <span>
                  Category: {categories.find((c) => c._id === filters.category)?.name || "Selected"}
                </span>
                <button onClick={() => setFilters({ ...filters, category: "" })}>
                  <X className="h-3 w-3 hover:text-foreground" />
                </button>
              </Badge>
            )}

            {filters.account && (
              <Badge variant="secondary" size="sm" className="flex items-center gap-1">
                <span>
                  Account: {accounts.find((a) => a._id === filters.account)?.name || "Selected"}
                </span>
                <button onClick={() => setFilters({ ...filters, account: "" })}>
                  <X className="h-3 w-3 hover:text-foreground" />
                </button>
              </Badge>
            )}

            {filters.paymentMethod && (
              <Badge variant="secondary" size="sm" className="flex items-center gap-1">
                <span>
                  Method: {PAYMENT_METHOD_LABELS[filters.paymentMethod as PaymentMethod] || filters.paymentMethod}
                </span>
                <button onClick={() => setFilters({ ...filters, paymentMethod: "" })}>
                  <X className="h-3 w-3 hover:text-foreground" />
                </button>
              </Badge>
            )}

            {(filters.startDate || filters.endDate) && (
              <Badge variant="secondary" size="sm" className="flex items-center gap-1">
                <span>
                  Date: {filters.startDate || "Any"} to {filters.endDate || "Any"}
                </span>
                <button onClick={() => setFilters({ ...filters, startDate: "", endDate: "" })}>
                  <X className="h-3 w-3 hover:text-foreground" />
                </button>
              </Badge>
            )}

            {(filters.minAmount || filters.maxAmount) && (
              <Badge variant="secondary" size="sm" className="flex items-center gap-1">
                <span>
                  Amount: ₹{filters.minAmount || "0"} - ₹{filters.maxAmount || "∞"}
                </span>
                <button onClick={() => setFilters({ ...filters, minAmount: "", maxAmount: "" })}>
                  <X className="h-3 w-3 hover:text-foreground" />
                </button>
              </Badge>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-xs text-muted-foreground hover:text-foreground h-6 px-2"
            >
              Clear All
            </Button>
          </div>
        )}
      </div>

      {/* Transaction Table / List State */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton variant="rectangular" className="h-14 w-full" />
          <Skeleton variant="rectangular" className="h-14 w-full" />
          <Skeleton variant="rectangular" className="h-14 w-full" />
          <Skeleton variant="rectangular" className="h-14 w-full" />
        </div>
      ) : error ? (
        <ErrorState
          title="Could not load transactions"
          message={error}
          onRetry={() => loadTransactions(1)}
        />
      ) : transactions.length === 0 ? (
        <EmptyState
          title={activeFilterCount > 0 || searchQuery ? "No matching transactions found" : "No transactions recorded yet"}
          description={
            activeFilterCount > 0 || searchQuery
              ? "Try adjusting or clearing your search and filter parameters."
              : "Start building your financial ledger by adding your income sources or recent expenses."
          }
          actionLabel={activeFilterCount > 0 || searchQuery ? "Clear Filters" : "Add Transaction"}
          onAction={activeFilterCount > 0 || searchQuery ? handleClearFilters : handleOpenAdd}
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
                  <TableHead className="w-16 text-center">Receipt</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-12 text-center"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((txn) => {
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

                      <TableCell className="text-center">
                        {txn.receipt ? (
                          <span
                            title="Receipt attached"
                            className="inline-flex p-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                          >
                            <Paperclip className="h-3.5 w-3.5" />
                          </span>
                        ) : (
                          <span className="text-muted-foreground/30 text-xs">—</span>
                        )}
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
                              onClick: () => {
                                setViewingTransaction(txn);
                                setReceiptBlobUrl(null);
                              },
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

          {/* Pagination Controls */}
          <div className="p-4 border-t border-border">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(p) => loadTransactions(p)}
              totalItems={pagination.total}
              pageSize={pagination.limit}
            />
          </div>
        </Card>
      )}

      {/* Filter Drawer */}
      <Drawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        title="Filter Transactions"
        description="Filter your transaction records by custom dates, category, account, and amount range."
        placement="right"
      >
        <div className="space-y-5 p-4">
          {/* Category Filter */}
          <Select
            label="Category"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            options={[
              { value: "", label: "All Categories" },
              ...categories.map((c) => ({ value: c._id, label: `${c.name} (${c.type})` })),
            ]}
          />

          {/* Account Filter */}
          <Select
            label="Account / Wallet"
            value={filters.account}
            onChange={(e) => setFilters({ ...filters, account: e.target.value })}
            options={[
              { value: "", label: "All Accounts" },
              ...accounts.map((a) => ({ value: a._id, label: `${a.name} (${a.type})` })),
            ]}
          />

          {/* Payment Method Filter */}
          <Select
            label="Payment Method"
            value={filters.paymentMethod}
            onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
            options={[
              { value: "", label: "All Methods" },
              { value: "UPI", label: "UPI" },
              { value: "CASH", label: "Cash" },
              { value: "CREDIT_CARD", label: "Credit Card" },
              { value: "DEBIT_CARD", label: "Debit Card" },
              { value: "BANK_TRANSFER", label: "Bank Transfer" },
              { value: "OTHER", label: "Other" },
            ]}
          />

          {/* Date Range Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">Date Range</label>
            <div className="grid grid-cols-2 gap-2">
              <DatePicker
                label="Start Date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
              <DatePicker
                label="End Date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
          </div>

          {/* Amount Range Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">Amount Range (₹)</label>
            <div className="grid grid-cols-2 gap-2">
              <CurrencyInput
                label="Min Amount"
                value={filters.minAmount}
                onChangeValue={(val) => setFilters({ ...filters, minAmount: val ? val.toString() : "" })}
                placeholder="Min ₹"
              />
              <CurrencyInput
                label="Max Amount"
                value={filters.maxAmount}
                onChangeValue={(val) => setFilters({ ...filters, maxAmount: val ? val.toString() : "" })}
                placeholder="Max ₹"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-border flex items-center justify-between gap-3">
            <Button variant="outline" size="sm" onClick={handleClearFilters}>
              Reset Filters
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsFilterDrawerOpen(false)}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </Drawer>

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

          {/* Receipt Upload Dropzone */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Attach Receipt (Optional - JPG, PNG, WEBP, PDF up to 5MB)
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  const file = e.target.files[0];
                  if (file.size > 5 * 1024 * 1024) {
                    toast.error("File exceeds maximum allowed size of 5 MB");
                    return;
                  }
                  setSelectedReceiptFile(file);
                }
              }}
            />

            {selectedReceiptFile ? (
              <div className="p-3 rounded-xl border border-primary/30 bg-primary/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <Paperclip className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-foreground line-clamp-1">
                    {selectedReceiptFile.name}
                  </span>
                  <span className="text-muted-foreground">
                    ({(selectedReceiptFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedReceiptFile(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-4 rounded-xl border border-dashed border-border hover:border-primary/40 bg-secondary/20 hover:bg-secondary/40 transition-colors flex flex-col items-center justify-center gap-1 text-center"
              >
                <UploadCloud className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground">
                  Click to select receipt document
                </span>
              </button>
            )}
          </div>

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
          description="Complete financial audit metadata and attached receipts."
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

            {/* Receipt Section */}
            <div className="pt-3 border-t border-border space-y-2">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Paperclip className="h-3.5 w-3.5 text-primary" />
                <span>Receipt Attachment</span>
              </span>

              {viewingTransaction.receipt ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl border border-border bg-secondary/30 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-primary" />
                      <div>
                        <span className="font-medium text-foreground block line-clamp-1">
                          {viewingTransaction.receipt.originalName || "Receipt Attachment"}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {viewingTransaction.receipt.mimeType} •{" "}
                          {viewingTransaction.receipt.size
                            ? `${(viewingTransaction.receipt.size / 1024).toFixed(1)} KB`
                            : "Uploaded"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewReceipt(viewingTransaction)}
                        isLoading={isReceiptLoading}
                        className="h-7 text-xs flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Preview</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteReceipt(viewingTransaction)}
                        isLoading={isReceiptLoading}
                        className="h-7 text-xs text-rose-500 hover:text-rose-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Inline Preview if Loaded */}
                  {receiptBlobUrl && (
                    <div className="p-2 rounded-xl border border-border bg-card">
                      {viewingTransaction.receipt.mimeType?.includes("pdf") ? (
                        <div className="p-4 text-center space-y-2">
                          <p className="text-xs text-muted-foreground">PDF Document Ready</p>
                          <a
                            href={receiptBlobUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary underline"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>Download / Open PDF</span>
                          </a>
                        </div>
                      ) : (
                        <img
                          src={receiptBlobUrl}
                          alt="Receipt Preview"
                          className="max-h-60 rounded-lg object-contain mx-auto"
                        />
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
                  No receipt attached to this transaction.
                </div>
              )}
            </div>

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
        message={`Are you sure you want to permanently delete "${transactionToDelete?.description}"? Any attached receipt files will also be removed, and your account balance will be recalculated automatically.`}
        confirmLabel="Delete Transaction"
        variant="danger"
      />
    </div>
  );
};
