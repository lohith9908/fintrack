import React from "react";
import assert from "node:assert/strict";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";

// Theme & Providers
import { ThemeProvider } from "../hooks/useTheme";
import { ToastProvider } from "../components/ui/Toast";
import { AuthProvider } from "../context/AuthContext";

// Formatters
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatDate,
  formatRelativeTime,
} from "../utils/formatters";

// All 26 Shared UI Components
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
  Dropdown,
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
  TableFooter,
  Pagination,
  Progress,
  Avatar,
  Skeleton,
  EmptyState,
  ErrorState,
  ConfirmDialog,
  ChartContainer,
} from "../components/ui";

// Layouts & Pages
import { AppLayout } from "../layouts/AppLayout";
import { AuthLayout } from "../layouts/AuthLayout";
import { AdminLayout } from "../layouts/AdminLayout";
import { DesignSystemShowcase } from "../pages/DesignSystemShowcase";

async function runPhase6RuntimeVerification() {
  console.log("\n==========================================================");
  console.log("  FinTrack — Phase 6 Frontend Runtime & Component Audit   ");
  console.log("==========================================================\n");

  let totalAssertions = 0;
  const countAssert = () => {
    totalAssertions++;
  };

  // Helper wrapper with Router & Providers
  const renderWithProviders = (ui: React.ReactElement, route = "/") => {
    return renderToString(
      <MemoryRouter initialEntries={[route]}>
        <ThemeProvider defaultTheme="light">
          <ToastProvider>
            <AuthProvider>{ui}</AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </MemoryRouter>
    );
  };

  // ----------------------------------------------------
  // Check 1: Formatters & Currency Logic
  // ----------------------------------------------------
  console.log("[Check 1] Centralized Financial Formatters");
  assert.equal(formatCurrency(50000), "₹50,000");
  countAssert();
  assert.equal(formatCurrency(32500.5, "INR", true), "₹32,500.50");
  countAssert();
  assert.equal(formatCurrency(-1500), "-₹1,500");
  countAssert();
  assert.equal(formatCurrency(0), "₹0");
  countAssert();
  assert.equal(formatPercent(43.75), "43.8%");
  countAssert();
  assert.equal(formatNumber(1250000), "12,50,000");
  countAssert();
  assert.ok(formatDate("2026-08-27").includes("2026"));
  countAssert();
  assert.equal(formatRelativeTime(new Date()), "Just now");
  countAssert();
  console.log("  ✅ Check 1 PASSED: INR formatting, percentage precision, and date formatting verified.");

  // ----------------------------------------------------
  // Check 2: All 26 Shared UI Components Render & Props
  // ----------------------------------------------------
  console.log("\n[Check 2] Rendering all 26 Shared UI Components");

  // 1. Button
  const btnHtml = renderToString(
    <div>
      <Button variant="primary" size="sm">Primary SM</Button>
      <Button variant="secondary" size="md">Secondary MD</Button>
      <Button variant="outline" size="lg">Outline LG</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="success">Success</Button>
      <Button isLoading>Loading</Button>
    </div>
  );
  assert.ok(btnHtml.includes("Primary SM") && btnHtml.includes("animate-spin"));
  countAssert();

  // 2. IconButton
  const iconBtnHtml = renderToString(<IconButton aria-label="Settings action">⚙️</IconButton>);
  assert.ok(iconBtnHtml.includes('aria-label="Settings action"'));
  countAssert();

  // 3. Input
  const inputHtml = renderToString(
    <Input label="Email Address" placeholder="alex@example.com" error="Invalid email" helperText="Work email" />
  );
  assert.ok(inputHtml.includes("Email Address") && inputHtml.includes("Invalid email"));
  countAssert();

  // 4. Textarea
  const textareaHtml = renderToString(
    <Textarea label="Notes" value="Financial notes text" maxCharacters={200} readOnly />
  );
  assert.ok(textareaHtml.includes("Notes") && textareaHtml.includes("20/200"));
  countAssert();

  // 5. Select
  const selectHtml = renderToString(
    <Select
      label="Category"
      options={[
        { value: "salary", label: "Salary Income" },
        { value: "groceries", label: "Groceries" },
      ]}
    />
  );
  assert.ok(selectHtml.includes("Category") && selectHtml.includes("Salary Income"));
  countAssert();

  // 6. DatePicker
  const dateHtml = renderToString(<DatePicker label="Transaction Date" defaultValue="2026-08-27" />);
  assert.ok(dateHtml.includes("Transaction Date") && dateHtml.includes('type="date"'));
  countAssert();

  // 7. CurrencyInput
  const currencyInputHtml = renderToString(
    <CurrencyInput label="Amount in Rupees" currencySymbol="₹" value="45000" />
  );
  assert.ok(currencyInputHtml.includes("Amount in Rupees") && currencyInputHtml.includes("₹"));
  countAssert();

  // 8. Checkbox
  const checkboxHtml = renderToString(
    <Checkbox label="Send monthly alert" description="Notify 2 days prior to due date" checked />
  );
  assert.ok(checkboxHtml.includes("Send monthly alert") && checkboxHtml.includes("Notify 2 days prior"));
  countAssert();

  // 9. Switch
  const switchHtml = renderToString(
    <Switch label="Dark Mode" description="Low light surface" checked onCheckedChange={() => {}} />
  );
  assert.ok(switchHtml.includes("Dark Mode") && switchHtml.includes('role="switch"'));
  countAssert();

  // 10. Tabs
  const tabsHtml = renderToString(
    <Tabs
      activeTab="tab1"
      onTabChange={() => {}}
      tabs={[
        { id: "tab1", label: "Overview Tab" },
        { id: "tab2", label: "Analytics Tab", badge: "New" },
      ]}
    />
  );
  assert.ok(tabsHtml.includes("Overview Tab") && tabsHtml.includes("Analytics Tab") && tabsHtml.includes("New"));
  countAssert();

  // 11. Dropdown
  const dropdownHtml = renderToString(
    <Dropdown
      trigger={<button>User Menu</button>}
      items={[
        { id: "profile", label: "User Profile" },
        { id: "logout", label: "Sign Out", destructive: true },
      ]}
    />
  );
  assert.ok(dropdownHtml.includes("User Menu"));
  countAssert();

  // 12. Tooltip
  const tooltipHtml = renderToString(
    <Tooltip content="Tooltip helper text">
      <span>Hover element</span>
    </Tooltip>
  );
  assert.ok(tooltipHtml.includes("Hover element"));
  countAssert();

  // 13. Dialog
  const dialogHtml = renderToString(
    <Dialog isOpen={true} onClose={() => {}} title="Test Modal" description="Modal description" footer={<button>Save</button>}>
      <p>Modal body content</p>
    </Dialog>
  );
  assert.ok(dialogHtml.includes("Test Modal") && dialogHtml.includes("Modal body content") && dialogHtml.includes('role="dialog"'));
  countAssert();

  // 14. Drawer
  const drawerHtml = renderToString(
    <Drawer isOpen={true} onClose={() => {}} title="Side Drawer" placement="right">
      <p>Drawer inner content</p>
    </Drawer>
  );
  assert.ok(drawerHtml.includes("Side Drawer") && drawerHtml.includes("Drawer inner content"));
  countAssert();

  // 15. Toast Container
  const toastHtml = renderToString(
    <ToastProvider>
      <div>Toast container child</div>
    </ToastProvider>
  );
  assert.ok(toastHtml.includes("Toast container child"));
  countAssert();

  // 16. Badge
  const badgeHtml = renderToString(
    <div>
      <Badge variant="success" dot>Income</Badge>
      <Badge variant="warning">Budget 80%</Badge>
      <Badge variant="danger" dot>Budget Exceeded</Badge>
    </div>
  );
  assert.ok(badgeHtml.includes("Income") && badgeHtml.includes("Budget 80%") && badgeHtml.includes("Budget Exceeded"));
  countAssert();

  // 17. Card Compound
  const cardHtml = renderToString(
    <Card hover>
      <CardHeader>
        <CardTitle>Financial Summary</CardTitle>
        <CardDescription>Monthly status</CardDescription>
      </CardHeader>
      <CardContent>Card body</CardContent>
      <CardFooter>Card footer</CardFooter>
    </Card>
  );
  assert.ok(cardHtml.includes("Financial Summary") && cardHtml.includes("Card body") && cardHtml.includes("Card footer"));
  countAssert();

  // 18. Table Compound
  const tableHtml = renderToString(
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Merchant</TableHead>
          <TableHead>Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Grocery Store</TableCell>
          <TableCell>₹3,400</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>Total</TableCell>
          <TableCell>₹3,400</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
  assert.ok(tableHtml.includes("Grocery Store") && tableHtml.includes("₹3,400"));
  countAssert();

  // 19. Pagination
  const paginationHtml = renderToString(
    <Pagination currentPage={2} totalPages={10} totalItems={100} pageSize={10} onPageChange={() => {}} />
  );
  assert.ok(paginationHtml.includes("Showing") && paginationHtml.includes("11") && paginationHtml.includes("20"));
  countAssert();

  // 20. Progress
  const progressHtml = renderToString(<Progress value={75} max={100} variant="warning" showLabel />);
  assert.ok(progressHtml.includes('role="progressbar"') && progressHtml.includes("75%"));
  countAssert();

  // 21. Avatar
  const avatarHtml = renderToString(
    <div>
      <Avatar name="Alex Miller" size="md" status="online" />
      <Avatar name="David Lee" size="sm" status="busy" />
      <Avatar size="lg" />
    </div>
  );
  assert.ok(avatarHtml.includes("AM") && avatarHtml.includes("DL"));
  countAssert();

  // 22. Skeleton
  const skeletonHtml = renderToString(
    <div>
      <Skeleton variant="text" />
      <Skeleton variant="circular" />
      <Skeleton variant="rectangular" />
      <Skeleton variant="card" />
    </div>
  );
  assert.ok(skeletonHtml.includes("animate-pulse"));
  countAssert();

  // 23. EmptyState
  const emptyStateHtml = renderToString(
    <EmptyState title="No Transactions Found" description="Try adjusting filters" actionLabel="Add Entry" onAction={() => {}} />
  );
  assert.ok(emptyStateHtml.includes("No Transactions Found") && emptyStateHtml.includes("Add Entry"));
  countAssert();

  // 24. ErrorState
  const errorStateHtml = renderToString(
    <ErrorState title="Connection Error" message="Server unreachable" onRetry={() => {}} />
  );
  assert.ok(errorStateHtml.includes("Connection Error") && errorStateHtml.includes("Retry"));
  countAssert();

  // 25. ConfirmDialog
  const confirmHtml = renderToString(
    <ConfirmDialog isOpen={true} onClose={() => {}} onConfirm={() => {}} title="Delete Record" message="Are you sure?" confirmLabel="Delete" />
  );
  assert.ok(confirmHtml.includes("Delete Record") && confirmHtml.includes("Are you sure?"));
  countAssert();

  // 26. ChartContainer
  const chartHtml = renderToString(
    <ChartContainer title="Cash Flow Chart" description="Monthly breakdown" summaryText="Income vs Expense">
      <div>[Chart Graphic]</div>
    </ChartContainer>
  );
  assert.ok(chartHtml.includes("Cash Flow Chart") && chartHtml.includes("Income vs Expense") && chartHtml.includes("[Chart Graphic]"));
  countAssert();

  console.log("  ✅ Check 2 PASSED: All 26 UI components rendered and verified with zero runtime crashes.");

  // ----------------------------------------------------
  // Check 3: AppLayout Shell & Navigation Groups
  // ----------------------------------------------------
  console.log("\n[Check 3] Rendering AppLayout Shell");
  const appLayoutHtml = renderWithProviders(<AppLayout />, "/dashboard");
  assert.ok(appLayoutHtml.includes("FinTrack") && appLayoutHtml.includes("Overview") && appLayoutHtml.includes("Money") && appLayoutHtml.includes("Planning") && appLayoutHtml.includes("Insights") && appLayoutHtml.includes("System"));
  assert.ok(appLayoutHtml.includes("aria-label=\"Mobile Navigation\""), "Mobile bottom nav must be present in AppLayout");
  countAssert();
  console.log("  ✅ Check 3 PASSED: AppLayout rendered with desktop sidebar, header, and mobile bottom navigation.");

  // ----------------------------------------------------
  // Check 4: AuthLayout & AdminLayout Shells
  // ----------------------------------------------------
  console.log("\n[Check 4] Rendering AuthLayout & AdminLayout Shells");
  const authLayoutHtml = renderWithProviders(<AuthLayout />, "/auth/login");
  assert.ok(authLayoutHtml.includes("FinTrack") && authLayoutHtml.includes("Bank-grade encryption"));
  countAssert();

  const adminLayoutHtml = renderWithProviders(<AdminLayout />, "/admin");
  assert.ok(adminLayoutHtml.includes("Admin Console") && adminLayoutHtml.includes("Platform Administration"));
  countAssert();
  console.log("  ✅ Check 4 PASSED: AuthLayout and AdminLayout rendered cleanly.");

  // ----------------------------------------------------
  // Check 5: DesignSystemShowcase Page
  // ----------------------------------------------------
  console.log("\n[Check 5] Rendering DesignSystemShowcase Page");
  const showcaseHtml = renderWithProviders(<DesignSystemShowcase />, "/design-system");
  assert.ok(showcaseHtml.includes("FinTrack Phase 6 Design System Foundation"));
  assert.ok(showcaseHtml.includes("Total Income") && showcaseHtml.includes("Total Expenses") && showcaseHtml.includes("Remaining Balance"));
  assert.ok(showcaseHtml.includes("Buttons &amp; Badges") || showcaseHtml.includes("Buttons & Badges"));
  countAssert();
  console.log("  ✅ Check 5 PASSED: Interactive DesignSystemShowcase rendered with summary cards, table, and tabs.");

  // ----------------------------------------------------
  // Check 6: Responsive & Overflow Guard Inspection
  // ----------------------------------------------------
  console.log("\n[Check 6] Responsive & Overflow Guard Inspection");
  assert.ok(appLayoutHtml.includes("max-w-[1440px]"), "Main container must use max-w-[1440px] per UI_UX.md");
  assert.ok(appLayoutHtml.includes("min-w-0"), "Flex child containers must specify min-w-0 to prevent horizontal overflow");
  assert.ok(appLayoutHtml.includes("overflow-y-auto"), "Sidebar must contain overflow-y-auto for scrollable navigation");
  countAssert();
  console.log("  ✅ Check 6 PASSED: Responsive constraints, overflow guards, and layout dimensions verified.");

  console.log("\n==========================================================");
  console.log(`  🌟 ALL ${totalAssertions} RUNTIME PHASE 6 CHECKS PASSED WITH 0 ERRORS!`);
  console.log("==========================================================\n");
}

runPhase6RuntimeVerification().catch((err) => {
  console.error("❌ Phase 6 runtime verification failed:", err);
  process.exit(1);
});
