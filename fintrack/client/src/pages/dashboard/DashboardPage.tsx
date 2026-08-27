import React from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  PieChart as PieChartIcon,
  CreditCard,
  Plus,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  Progress,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../components/ui";
import { formatCurrency, formatPercent, formatDate } from "../../utils/formatters";

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const mockRecentTransactions = [
    { id: "1", desc: "Monthly Salary Deposit", category: "Salary", amount: 85000, type: "INCOME", date: "2026-08-01", method: "Bank Transfer" },
    { id: "2", desc: "Grocery Supermarket", category: "Food", amount: -4250, type: "EXPENSE", date: "2026-08-05", method: "UPI" },
    { id: "3", desc: "Electricity & Water Bill", category: "Bills", amount: -2890, type: "EXPENSE", date: "2026-08-10", method: "Credit Card" },
    { id: "4", desc: "Freelance Consulting Payout", category: "Freelancing", amount: 32000, type: "INCOME", date: "2026-08-15", method: "UPI" },
    { id: "5", desc: "Fuel & Metro Transit", category: "Transport", amount: -1500, type: "EXPENSE", date: "2026-08-18", method: "Cash" },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Welcome back, {user?.name || "User"}
            </h1>
            <Badge variant="success" size="sm" dot>
              Active
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Here is your financial health summary and cash flow overview for August 2026
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/settings">
            <Button size="sm" variant="outline">
              Account Settings
            </Button>
          </Link>
          <Link to="/transactions">
            <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>
              Add Transaction
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards per UI_UX.md Section 21 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Income */}
        <Card hover>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="font-medium text-xs">Total Income</CardDescription>
            <div className="p-2 rounded-lg bg-success/10 text-success">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <div className="text-2xl font-extrabold text-foreground tracking-tight">
              {formatCurrency(117000, user?.currency || "INR")}
            </div>
            <div className="flex items-center text-xs text-success font-semibold gap-1">
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span>+14.2% vs last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Total Expenses */}
        <Card hover>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="font-medium text-xs">Total Expenses</CardDescription>
            <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
              <TrendingDown className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <div className="text-2xl font-extrabold text-foreground tracking-tight">
              {formatCurrency(48640, user?.currency || "INR")}
            </div>
            <div className="flex items-center text-xs text-muted-foreground font-semibold gap-1">
              <ArrowDownRight className="h-3.5 w-3.5" />
              <span>-3.5% under budget</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Remaining Balance */}
        <Card hover>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="font-medium text-xs">Remaining Balance</CardDescription>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <div className="text-2xl font-extrabold text-foreground tracking-tight">
              {formatCurrency(68360, user?.currency || "INR")}
            </div>
            <div className="flex items-center text-xs text-muted-foreground font-medium">
              <span>Across linked accounts</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Savings Rate */}
        <Card hover>
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

      {/* Grid: Recent Transactions & Security/Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions Table (2 cols) */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest financial activity recorded in your accounts</CardDescription>
            </div>
            <Link to="/transactions" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockRecentTransactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-semibold text-foreground">{tx.desc}</TableCell>
                    <TableCell>
                      <Badge variant={tx.type === "INCOME" ? "success" : "secondary"}>
                        {tx.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(tx.date)}</TableCell>
                    <TableCell
                      className={`text-right font-bold ${
                        tx.type === "INCOME" ? "text-success" : "text-foreground"
                      }`}
                    >
                      {formatCurrency(tx.amount, user?.currency || "INR")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Security & Account State Overview (1 col) */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Account Security</CardTitle>
                <ShieldCheck className="h-5 w-5 text-success" />
              </div>
              <CardDescription>Authentication & active session status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <span className="text-muted-foreground">Auth Role:</span>
                <Badge variant={user?.role === "ADMIN" ? "danger" : "primary"}>
                  {user?.role || "USER"}
                </Badge>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <span className="text-muted-foreground">Session Token:</span>
                <span className="font-semibold text-foreground">HTTP-Only Cookie (Encrypted)</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <span className="text-muted-foreground">Base Currency:</span>
                <span className="font-bold text-foreground">{user?.currency || "INR"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Timezone:</span>
                <span className="font-medium text-foreground">{user?.timezone || "Asia/Kolkata"}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Connected Wallets</CardTitle>
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <CardDescription>Accounts & payment methods</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="p-3 rounded-lg border border-border bg-secondary/30 flex items-center justify-between">
                <div>
                  <p className="font-bold text-foreground">HDFC Salary Account</p>
                  <p className="text-[11px] text-muted-foreground">Primary Checking • **** 4920</p>
                </div>
                <span className="font-extrabold text-foreground">{formatCurrency(124500, user?.currency || "INR")}</span>
              </div>

              <div className="p-3 rounded-lg border border-border bg-secondary/30 flex items-center justify-between">
                <div>
                  <p className="font-bold text-foreground">ICICI Amazon Pay</p>
                  <p className="text-[11px] text-muted-foreground">Credit Card • **** 1032</p>
                </div>
                <span className="font-extrabold text-foreground">{formatCurrency(18200, user?.currency || "INR")}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
