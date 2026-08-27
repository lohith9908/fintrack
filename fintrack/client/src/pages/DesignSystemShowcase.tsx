import React, { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  Plus,
  Trash2,
  DollarSign,
  PieChart as PieChartIcon,
  CreditCard,
  Eye,
  SlidersHorizontal,
  FileDown,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  Button,
  IconButton,
  Input,
  Textarea,
  Select,
  DatePicker,
  CurrencyInput,
  Checkbox,
  Switch,
  Tabs,
  Tooltip,
  Dialog,
  Drawer,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Pagination,
  Progress,
  Avatar,
  Skeleton,
  EmptyState,
  ErrorState,
  ConfirmDialog,
  ChartContainer,
  useToast,
} from "../components/ui";
import { formatCurrency, formatPercent, formatDate } from "../utils/formatters";

export const DesignSystemShowcase: React.FC = () => {
  const toast = useToast();

  // State for interactive demonstrations
  const [activeTab, setActiveTab] = useState<string>("buttons");
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const [switchChecked, setSwitchChecked] = useState<boolean>(true);
  const [checkboxChecked, setCheckboxChecked] = useState<boolean>(true);
  const [currencyVal, setCurrencyVal] = useState<number>(45000);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loadingButton, setLoadingButton] = useState<boolean>(false);

  const sampleTransactions = [
    { id: "tx-1", desc: "Monthly Salary Deposit", cat: "Salary", amount: 85000, type: "INCOME", date: "2026-08-01", method: "Bank Transfer" },
    { id: "tx-2", desc: "Grocery Supermarket", cat: "Food", amount: -4250, type: "EXPENSE", date: "2026-08-05", method: "UPI" },
    { id: "tx-3", desc: "Electricity & Water Bill", cat: "Bills", amount: -2890, type: "EXPENSE", date: "2026-08-10", method: "Credit Card" },
    { id: "tx-4", desc: "Freelance Project Milestone", cat: "Freelancing", amount: 32000, type: "INCOME", date: "2026-08-15", method: "UPI" },
    { id: "tx-5", desc: "Fuel & Metro Transit", cat: "Transport", amount: -1500, type: "EXPENSE", date: "2026-08-18", method: "Cash" },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="h-3.5 w-3.5" />
            <span>FinTrack Phase 6 Design System Foundation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            UI/UX Component & Layout Showcase
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            All 26 reusable shared UI components, theme tokens (Light/Dark/System), and responsive application layouts built strictly to <code className="font-semibold text-foreground">UI/UX.md</code>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<FileDown className="h-3.5 w-3.5" />}
            onClick={() => toast.info("Design tokens exported successfully.", "Tokens Exported")}
          >
            Export Spec
          </Button>
          <Button
            size="sm"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => setDialogOpen(true)}
          >
            New Transaction
          </Button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 1. Key Summary Cards per UI_UX.md Section 21 & 22            */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Income */}
        <Card hover className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="font-medium text-xs">Total Income</CardDescription>
            <div className="p-2 rounded-lg bg-success/10 text-success">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <div className="text-2xl font-extrabold text-foreground tracking-tight">
              {formatCurrency(117000)}
            </div>
            <div className="flex items-center text-xs text-success font-semibold gap-1">
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span>+14.2% vs last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Total Expenses */}
        <Card hover className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="font-medium text-xs">Total Expenses</CardDescription>
            <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
              <TrendingDown className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <div className="text-2xl font-extrabold text-foreground tracking-tight">
              {formatCurrency(48640)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground font-semibold gap-1">
              <ArrowDownRight className="h-3.5 w-3.5" />
              <span>-3.5% vs budget limit</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Remaining Balance */}
        <Card hover className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="font-medium text-xs">Remaining Balance</CardDescription>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <div className="text-2xl font-extrabold text-foreground tracking-tight">
              {formatCurrency(68360)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground font-medium">
              <span>Across 4 linked accounts</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Savings Rate */}
        <Card hover className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="font-medium text-xs">Savings Rate</CardDescription>
            <div className="p-2 rounded-lg bg-warning/10 text-warning">
              <PieChartIcon className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-foreground tracking-tight">
                {formatPercent(58.4)}
              </span>
              <span className="text-xs font-semibold text-success">Target 50%</span>
            </div>
            <Progress value={58.4} variant="success" size="sm" />
          </CardContent>
        </Card>
      </div>

      {/* ============================================================ */}
      {/* 2. Interactive Component Showcase Tabs                       */}
      {/* ============================================================ */}
      <div className="space-y-6">
        <Tabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabs={[
            { id: "buttons", label: "Buttons & Badges", icon: <Sparkles className="h-4 w-4" /> },
            { id: "forms", label: "Form Controls & Inputs", icon: <SlidersHorizontal className="h-4 w-4" /> },
            { id: "overlays", label: "Dialogs, Drawers & Toasts", icon: <Layers className="h-4 w-4" /> },
            { id: "data", label: "Tables & Data Display", icon: <CreditCard className="h-4 w-4" /> },
          ]}
        />

        {/* TAB 1: Buttons & Badges */}
        {activeTab === "buttons" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
            {/* Buttons Card */}
            <Card>
              <CardHeader>
                <CardTitle>Button Variants & States</CardTitle>
                <CardDescription>Full button family with loading, sizes, and icon support</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2.5 items-center">
                  <Button variant="primary" onClick={() => toast.success("Primary action fired.")}>Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="danger">Danger</Button>
                  <Button variant="success">Success</Button>
                </div>
                <div className="flex flex-wrap gap-2.5 items-center pt-2 border-t border-border/40">
                  <Button size="sm">Small (sm)</Button>
                  <Button size="md">Medium (md)</Button>
                  <Button size="lg">Large (lg)</Button>
                  <Button
                    isLoading={loadingButton}
                    onClick={() => {
                      setLoadingButton(true);
                      setTimeout(() => setLoadingButton(false), 2000);
                    }}
                  >
                    {loadingButton ? "Processing..." : "Click For Loading"}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-border/40">
                  <IconButton aria-label="Add item" variant="primary" icon={<Plus className="h-4 w-4" />} />
                  <IconButton aria-label="Delete item" variant="danger" icon={<Trash2 className="h-4 w-4" />} />
                  <IconButton aria-label="View item" variant="outline" icon={<Eye className="h-4 w-4" />} />
                </div>
              </CardContent>
            </Card>

            {/* Badges & Avatars Card */}
            <Card>
              <CardHeader>
                <CardTitle>Badges, Progress & Avatars</CardTitle>
                <CardDescription>Semantic feedback pills, progress bars, and user avatars</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="primary" dot>Primary</Badge>
                  <Badge variant="success" dot>Income / Completed</Badge>
                  <Badge variant="warning" dot>Budget Warning</Badge>
                  <Badge variant="danger" dot>Budget Exceeded</Badge>
                  <Badge variant="info" dot>Information</Badge>
                  <Badge variant="secondary">Neutral</Badge>
                  <Badge variant="outline">Outline</Badge>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/40">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Monthly Budget Limit</span>
                    <span>75% (₹37,500 / ₹50,000)</span>
                  </div>
                  <Progress value={75} variant="warning" />
                </div>

                <div className="flex items-center gap-3 pt-2 border-t border-border/40">
                  <Avatar name="Sarah Jenkins" size="sm" status="online" />
                  <Avatar name="David Lee" size="md" status="offline" />
                  <Avatar name="FinTrack System" size="lg" status="busy" />
                  <Avatar size="md" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 2: Form Controls & Inputs */}
        {activeTab === "forms" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
            <Card>
              <CardHeader>
                <CardTitle>Financial & Text Inputs</CardTitle>
                <CardDescription>Accessible forms following Label → Input → Help Text → Error standard</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <CurrencyInput
                  label="Transaction Amount"
                  value={currencyVal}
                  onChangeValue={(val) => setCurrencyVal(val)}
                  helperText="Formatted in Indian Rupees (₹) per UI/UX.md"
                />
                <Input
                  label="Description / Merchant"
                  placeholder="e.g. Amazon Web Services, Whole Foods"
                />
                <DatePicker
                  label="Transaction Date"
                  defaultValue="2026-08-27"
                />
                <Select
                  label="Category"
                  options={[
                    { value: "salary", label: "Salary (Income)" },
                    { value: "food", label: "Food & Dining (Expense)" },
                    { value: "bills", label: "Bills & Utilities (Expense)" },
                    { value: "shopping", label: "Shopping (Expense)" },
                  ]}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Toggles, Textarea & Tooltips</CardTitle>
                <CardDescription>Selection controls, switches, and rich descriptions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  label="Transaction Notes"
                  placeholder="Add optional notes for your tax or financial records..."
                  maxCharacters={200}
                />
                <div className="space-y-3 pt-2 border-t border-border/40">
                  <Switch
                    checked={switchChecked}
                    onCheckedChange={setSwitchChecked}
                    label="Recurring Monthly Subscription"
                    description="Automatically schedule upcoming payment reminder"
                  />
                  <Checkbox
                    checked={checkboxChecked}
                    onChange={(e) => setCheckboxChecked(e.target.checked)}
                    label="Send budget alert notification"
                    description="Notify me if category spending exceeds 85%"
                  />
                </div>
                <div className="flex items-center gap-3 pt-2 border-t border-border/40">
                  <Tooltip content="Deterministic mathematical insights without third-party AI APIs">
                    <span className="text-xs font-semibold text-primary underline cursor-help">
                      Hover for Tooltip Demo
                    </span>
                  </Tooltip>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 3: Overlays (Dialogs, Drawers, Toasts) */}
        {activeTab === "overlays" && (
          <Card className="animate-fadeIn">
            <CardHeader>
              <CardTitle>Overlays & Interactive Feedback</CardTitle>
              <CardDescription>Accessible modals, slide-over sheets, confirmation prompts, and toasts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" onClick={() => setDialogOpen(true)}>
                  Open Modal Dialog
                </Button>
                <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
                  Open Side Drawer Sheet
                </Button>
                <Button variant="danger" onClick={() => setConfirmOpen(true)}>
                  Open Confirm Deletion Dialog
                </Button>
              </div>

              <div className="space-y-2 pt-4 border-t border-border/40">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Trigger Toast Notifications
                </h4>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toast.success("Transaction recorded successfully.", "Success")}
                  >
                    Success Toast
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toast.error("Unable to connect to financial server.", "Error")}
                  >
                    Error Toast
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toast.warning("Budget limit reached 90%.", "Warning")}
                  >
                    Warning Toast
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toast.info("New statement ready for export.", "Notice")}
                  >
                    Info Toast
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border/40">
                <EmptyState
                  title="No Receipts Uploaded"
                  description="Attach receipt photos or PDFs to match with transactions."
                  actionLabel="Upload Receipt"
                  onAction={() => toast.info("Upload modal triggered.")}
                />
                <ErrorState
                  title="Failed to Load Financial Reports"
                  message="Network connection interrupted while retrieving analytics."
                  onRetry={() => toast.success("Retrying connection...")}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* TAB 4: Tables & Data Display */}
        {activeTab === "data" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Chart Container Example */}
            <ChartContainer
              title="Income vs Expenses (Monthly)"
              description="Real-time financial flow comparison"
              summaryText="Income: ₹117,000 • Expenses: ₹48,640 • Net Savings: ₹68,360"
              action={
                <Badge variant="success" dot>
                  +58.4% Savings
                </Badge>
              }
            >
              {/* Financial Chart Bar Mockup */}
              <div className="w-full h-44 flex items-end justify-around gap-4 px-4 pb-2">
                {[
                  { month: "Apr", income: 60, expense: 40 },
                  { month: "May", income: 75, expense: 45 },
                  { month: "Jun", income: 90, expense: 50 },
                  { month: "Jul", income: 80, expense: 55 },
                  { month: "Aug", income: 100, expense: 42 },
                ].map((bar) => (
                  <div key={bar.month} className="flex flex-col items-center gap-2 flex-1 max-w-[60px]">
                    <div className="w-full flex items-end gap-1.5 h-36">
                      <div
                        className="flex-1 bg-primary rounded-t-md transition-all hover:brightness-110"
                        style={{ height: `${bar.income}%` }}
                      />
                      <div
                        className="flex-1 bg-destructive/70 rounded-t-md transition-all hover:brightness-110"
                        style={{ height: `${bar.expense}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-muted-foreground">{bar.month}</span>
                  </div>
                ))}
              </div>
            </ChartContainer>

            {/* Financial Transactions Table */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Formatted transactions with category badges and currency values</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sampleTransactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-semibold text-foreground">{tx.desc}</TableCell>
                        <TableCell>
                          <Badge variant={tx.type === "INCOME" ? "success" : "secondary"}>
                            {tx.cat}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(tx.date)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{tx.method}</TableCell>
                        <TableCell
                          className={`text-right font-bold ${
                            tx.type === "INCOME" ? "text-success" : "text-foreground"
                          }`}
                        >
                          {formatCurrency(tx.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter className="p-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={5}
                  totalItems={25}
                  pageSize={5}
                  onPageChange={setCurrentPage}
                />
              </CardFooter>
            </Card>

            {/* Skeleton Loading Demo */}
            <Card>
              <CardHeader>
                <CardTitle>Skeleton Shimmer Loading States</CardTitle>
                <CardDescription>Non-blocking loading placeholders</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton variant="text" className="w-1/3" />
                <Skeleton variant="text" className="w-2/3" />
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <Skeleton variant="rectangular" className="h-16" />
                  <Skeleton variant="rectangular" className="h-16" />
                  <Skeleton variant="rectangular" className="h-16" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 3. Interactive Modals & Drawers                              */}
      {/* ============================================================ */}

      {/* Demo Modal Dialog */}
      <Dialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Add New Financial Transaction"
        description="Record an income or expense transaction into your ledger"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setDialogOpen(false);
                toast.success("Transaction saved successfully.", "Transaction Created");
              }}
            >
              Save Transaction
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <CurrencyInput label="Amount" placeholder="₹0.00" />
          <Input label="Description" placeholder="e.g. Grocery store, Consulting payout" />
          <DatePicker label="Date" defaultValue="2026-08-27" />
        </div>
      </Dialog>

      {/* Demo Side Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Account Details & Settings"
        description="Manage connected bank accounts, credit cards, and UPI IDs"
        footer={
          <Button size="sm" onClick={() => setDrawerOpen(false)}>
            Close Drawer
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl border border-border bg-secondary/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">HDFC Salary Account</span>
              <Badge variant="success">Active</Badge>
            </div>
            <div className="text-lg font-bold text-foreground">{formatCurrency(124500)}</div>
          </div>
          <div className="p-3.5 rounded-xl border border-border bg-secondary/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">ICICI Amazon Pay Credit Card</span>
              <Badge variant="warning">Credit</Badge>
            </div>
            <div className="text-lg font-bold text-foreground">{formatCurrency(18200)}</div>
          </div>
        </div>
      </Drawer>

      {/* Demo Confirm Deletion Dialog */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          toast.error("Transaction deleted permanently.", "Deleted");
        }}
        title="Delete Transaction"
        message="Are you sure you want to delete this financial record? This action cannot be undone."
        confirmLabel="Delete Permanently"
      />
    </div>
  );
};
