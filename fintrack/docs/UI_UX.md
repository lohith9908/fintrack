# FinTrack — UI/UX Design Specification

**Document:** `UI/UX.md`  
**Version:** 1.0  
**Status:** Locked / Source of Truth  
**Product:** FinTrack — Personal Finance Management Platform  
**Related Documents:** `PRD.md`, `TRD.md`, `ARCHITECTURE.md`, `DATABASESCHEMA.md`  
**Date:** 22 August 2026

---

# 1. Document Purpose

This document defines the visual design system, user experience principles, navigation patterns, page layouts, responsive behavior, interaction patterns, component standards, accessibility expectations, animation rules, states, and visual language for FinTrack.

This document is the UI/UX source of truth.

The goal is to create a polished personal finance application that feels intentionally designed by a product team rather than a generic generated dashboard.

---

# 2. Product Design Direction

FinTrack should feel like a modern, trustworthy fintech product.

The design should communicate:

- Financial clarity
- Trust
- Stability
- Control
- Professionalism
- Simplicity
- Data confidence

The interface should make complex financial information easy to understand without making the product look childish or overly decorative.

---

# 3. Core Design Principles

## 3.1 Clarity First

Financial information must be immediately understandable.

Users should quickly answer:

- How much did I earn?
- How much did I spend?
- How much do I have left?
- Where did I spend money?
- Am I exceeding my budget?
- Am I saving enough?
- What needs my attention?

---

## 3.2 Hierarchy

Important information must visually dominate secondary information.

Example:

```text
₹50,000
Total Income
```

The amount should have stronger visual hierarchy than the label.

---

## 3.3 Data Before Decoration

Charts, cards, icons, and visual effects must support understanding.

Do not add visual elements simply to make the interface look busy.

---

## 3.4 Professional Fintech Aesthetic

The application should avoid the common "AI-generated SaaS dashboard" appearance.

Avoid:

- Excessive gradients
- Excessive glassmorphism
- Giant rounded containers
- Random blobs
- Excessive glowing effects
- Purple/blue gradient everywhere
- Decorative 3D illustrations
- Excessive emoji use
- Huge empty hero sections
- Excessive card nesting

---

## 3.5 Subtle Motion

Motion should communicate:

- State change
- Navigation
- Feedback
- Progress
- Hierarchy

Motion must never become the main visual feature.

---

# 4. Visual Identity

## 4.1 Brand

```text
Name:
FinTrack
```

Suggested tagline:

```text
Track. Understand. Improve.
```

---

# 5. Color System

The final implementation should use semantic design tokens rather than hardcoding colors throughout components.

The color system should include:

```text
Primary
Primary Hover
Primary Foreground

Background
Surface
Surface Elevated
Surface Muted

Foreground
Foreground Muted
Foreground Subtle

Border
Border Strong

Success
Success Background
Success Foreground

Warning
Warning Background
Warning Foreground

Danger
Danger Background
Danger Foreground

Info
Info Background
Info Foreground
```

---

# 6. Financial Semantic Colors

Financial meaning should remain consistent throughout the application.

## Income

Use a positive/green semantic treatment.

```text
Income → Success family
```

## Expense

Use a danger/red semantic treatment only when appropriate.

Normal expense data should not make the entire interface feel alarming.

## Savings

Use positive/primary semantic treatment.

## Budget Warning

Use warning.

## Budget Critical

Use stronger warning/danger treatment.

## Budget Exceeded

Use danger.

Color must never be the only way to communicate state.

---

# 7. Dark Mode

FinTrack supports:

```text
Light
Dark
System
```

Dark mode must not simply invert the light theme.

It should use dedicated dark surfaces and readable contrast.

Avoid pure black backgrounds where possible.

Use layered dark surfaces:

```text
App Background
Surface
Elevated Surface
```

Charts must remain readable in both themes.

---

# 8. Typography

Typography must be clean, modern, and highly readable.

Recommended hierarchy:

```text
Display
H1
H2
H3
H4
Body
Body Small
Caption
Label
```

Financial numbers should use a strong, readable weight.

Example:

```text
₹50,000
```

should be visually prominent.

---

# 9. Typography Rules

Avoid:

- Excessively thin financial numbers
- Too many font weights
- Decorative fonts
- Long uppercase text
- Tiny low-contrast text

Use typography to establish hierarchy rather than excessive containers.

---

# 10. Spacing System

Use a consistent spacing scale.

Recommended base:

```text
4
8
12
16
20
24
32
40
48
64
80
```

Spacing should be consistent across:

- Cards
- Forms
- Tables
- Sections
- Page layouts
- Navigation

---

# 11. Border Radius

Use moderate, consistent radius values.

Recommended hierarchy:

```text
Small controls: 6–8px
Cards: 10–14px
Dialogs: 12–16px
Large containers: 16px
```

Avoid making every element excessively rounded.

---

# 12. Shadows

Shadows should be subtle.

Use elevation sparingly:

```text
Level 0 → no shadow
Level 1 → subtle
Level 2 → dialog/dropdown
Level 3 → modal/overlay
```

Borders may provide most of the visual separation.

---

# 13. Layout System

Desktop application layout:

```text
┌─────────────────────────────────────────────┐
│ Header                                      │
├───────────────┬─────────────────────────────┤
│ Sidebar       │ Main Content                │
│               │                             │
│ Dashboard     │                             │
│ Transactions  │                             │
│ Budgets       │                             │
│ Accounts      │                             │
│ Goals         │                             │
│ Recurring     │                             │
│ Analytics     │                             │
│ Calendar      │                             │
│ Reports       │                             │
│ Notifications │                             │
│ Settings      │                             │
└───────────────┴─────────────────────────────┘
```

---

# 14. Desktop Sidebar

The sidebar should contain:

```text
FinTrack Logo

Overview
Dashboard

Money
Transactions
Accounts
Budgets
Recurring

Planning
Savings Goals
Calendar

Insights
Analytics
Reports

System
Notifications
Settings
```

Admin users see a separate administrative navigation area.

---

# 15. Sidebar Behavior

Desktop:

- Persistent sidebar
- Collapsible where appropriate
- Active route clearly indicated

Tablet:

- Compact/collapsible sidebar

Mobile:

- Drawer or bottom navigation depending on screen/context

Navigation must remain accessible.

---

# 16. Header

Header should contain:

- Page title or contextual heading
- Date/range context where useful
- Notification button
- User profile/menu
- Optional page actions

Example:

```text
Dashboard                         🔔   User
Good morning, John
```

Avoid excessive header controls.

---

# 17. Mobile Navigation

Mobile navigation should prioritize the most frequently used destinations.

Recommended primary navigation:

```text
Home
Transactions
Budgets
Goals
More
```

The "More" area can expose:

```text
Accounts
Recurring
Analytics
Calendar
Reports
Notifications
Settings
```

---

# 18. Page Width

Main content should use a comfortable maximum width.

Recommended:

```text
max-width ≈ 1440px
```

with responsive horizontal padding.

Very wide screens should not produce excessively stretched financial cards.

---

# 19. Dashboard UX

The dashboard is the most important screen.

It should answer the user's most important financial questions within seconds.

---

# 20. Dashboard Structure

Recommended order:

```text
1. Greeting / Period
2. Financial Summary
3. Main Income vs Expense Chart
4. Budget / Goals / Account Summary
5. Category Analytics
6. Spending/Savings Trends
7. Financial Insights
8. Recent Transactions
9. Upcoming Payments
```

The exact responsive arrangement may change by viewport.

---

# 21. Dashboard Summary Cards

Four primary cards:

```text
Total Income
Total Expenses
Remaining Balance
Savings Rate
```

Example:

```text
┌─────────────────────┐
│ Total Income        │
│ ₹50,000             │
│ ↑ 12.4% vs July     │
└─────────────────────┘
```

Cards should not contain excessive decoration.

---

# 22. Summary Card Behavior

Each card should support:

- Main value
- Supporting label
- Optional comparison
- Optional icon
- Semantic status

Avoid showing meaningless percentages.

If there is insufficient comparison data:

```text
No previous period
```

rather than:

```text
0%
```

---

# 23. Main Analytics Chart

Primary chart:

```text
Income vs Expenses
```

Recommended:

- Area/line chart
- Monthly or selected-period data
- Clear legend
- Tooltip
- Accessible textual summary

Example:

```text
Income   ─────────
Expenses ───────
```

---

# 24. Expense Category Chart

Recommended chart:

```text
Donut/Pie
```

or another appropriate category visualization.

The chart must be accompanied by a readable category list.

Example:

```text
Food          ₹7,200   27%
Shopping      ₹4,800   18%
Transport     ₹3,900   14%
```

Users should not be forced to interpret color alone.

---

# 25. Spending Trend

Show:

- Daily/weekly/monthly trend depending on range
- Current period
- Previous period comparison where possible

Use a line/area visualization with readable tooltips.

---

# 26. Savings Trend

Show savings movement over time.

Include:

```text
Income
Expenses
Savings
```

where useful.

---

# 27. Dashboard Recent Transactions

Display a compact list/table:

```text
Amazon
Shopping
- ₹2,499
22 Aug

Salary
Income
+ ₹50,000
01 Aug
```

Provide:

```text
View all transactions
```

---

# 28. Dashboard Budget Widget

Example:

```text
Food

₹4,000 / ₹5,000

████████░░ 80%

₹1,000 remaining
```

Use semantic state.

---

# 29. Dashboard Goal Widget

Example:

```text
New Laptop

₹35,000 / ₹80,000

████████░░░░

43.75%

₹45,000 remaining
```

---

# 30. Dashboard Account Widget

Example:

```text
Accounts

HDFC Bank       ₹42,000
Cash             ₹8,500
UPI             ₹12,400
Credit Card     -₹7,200
```

---

# 31. Dashboard Insight Widget

Insights should be concise.

Example:

```text
💡 Food spending increased 18%
compared with last month.
```

The interface should allow the user to understand why the insight exists where useful.

---

# 32. Dashboard Upcoming Payments

Example:

```text
Upcoming

Netflix        ₹649     Sep 1
Rent        ₹15,000     Sep 5
Internet       ₹899     Sep 7
```

---

# 33. Transaction Page

The transaction page is a major operational screen.

Structure:

```text
Transactions

[Search transactions...]

[Filters] [Date] [Type] [Category] [Account]

-----------------------------------------
Date | Description | Category | Amount
-----------------------------------------
...
```

Primary action:

```text
+ Add Transaction
```

---

# 34. Transaction Search

Search field placeholder:

```text
Search transactions...
```

Examples:

```text
Amazon
Netflix
Salary
```

Search should feel fast and provide clear feedback.

---

# 35. Transaction Filters

Filters:

```text
Type
Category
Account
Payment Method
Date Range
Amount Range
```

Provide:

```text
Clear filters
```

when filters are active.

---

# 36. Transaction Table

Desktop columns:

```text
Date
Description
Category
Account
Payment Method
Amount
Actions
```

Income and expense amounts should have clear semantic treatment.

---

# 37. Mobile Transaction List

On mobile, convert table rows into cards/list items.

Example:

```text
Amazon
Shopping · UPI
22 Aug 2026

- ₹2,499

•••
```

Do not force users to horizontally scroll a wide desktop table unless there is no reasonable alternative.

---

# 38. Add Transaction UX

Transaction form:

```text
Type
Amount
Category
Description
Date
Payment Method
Account
Notes
Receipt
```

The form should clearly distinguish:

```text
Income
Expense
```

The selected type should influence available categories.

---

# 39. Transaction Form Rules

When:

```text
Type = Income
```

show income categories.

When:

```text
Type = Expense
```

show expense categories.

The UI should prevent obvious invalid combinations before submission.

Backend validation remains authoritative.

---

# 40. Receipt Upload UX

Receipt field:

```text
Upload receipt
[ Choose file ]

JPG, PNG, WEBP or PDF
Maximum size: configured limit
```

After upload:

```text
Receipt.jpg
1.4 MB

[View] [Replace] [Remove]
```

Use a drag-and-drop area on desktop only if it improves UX.

---

# 41. Transaction Detail

Transaction detail should display:

```text
Amount
Type
Category
Description
Date
Account
Payment Method
Notes
Receipt
Created
Updated
```

Actions:

```text
Edit
Delete
```

Deletion must require confirmation.

---

# 42. Budget Page

Budget page should provide:

```text
Current Month
[Month selector]

Total Budget
Total Spent
Remaining
```

Then category budget cards/list.

---

# 43. Budget Card

Example:

```text
Food

₹4,000 / ₹5,000

████████░░

80%

₹1,000 remaining
```

States:

```text
Healthy
Warning
Critical
Exceeded
```

---

# 44. Budget Creation UX

Fields:

```text
Category
Monthly Limit
Alert Thresholds
```

Month/year should be explicit.

Prevent duplicate budgets for the same category and period through backend validation.

---

# 45. Budget Exceeded State

When exceeded:

```text
⚠️ Food budget exceeded

₹5,800 / ₹5,000

116%
```

Provide a useful action:

```text
View related expenses
```

---

# 46. Accounts Page

Account page should show:

```text
Total Balance

HDFC Bank
₹42,000

Cash
₹8,500

UPI
₹12,400

Credit Card
-₹7,200
```

Primary action:

```text
+ Add Account
```

---

# 47. Account Card

Account card:

```text
HDFC Bank
Bank Account

₹42,000

12 transactions this month

•••
```

Do not overload cards with unnecessary metadata.

---

# 48. Account Creation

Fields:

```text
Account Name
Account Type
Opening Balance
Currency
Notes
```

Account type:

```text
Cash
Bank Account
Credit Card
UPI
Other
```

---

# 49. Categories Page

Show:

```text
Income Categories
Expense Categories
```

System categories should be visually distinguished from user-created categories.

Example:

```text
Food        System
Gym         Custom
Travel      Custom
```

---

# 50. Custom Category UX

Creation fields:

```text
Category Name
Type
Icon
Color
```

The icon/color selection should be simple, not an overwhelming customization tool.

---

# 51. Recurring Transactions Page

Layout:

```text
Recurring Transactions

+ Add Recurring

Netflix
₹649
Monthly
Next payment: Sep 1

Rent
₹15,000
Monthly
Next payment: Sep 5
```

Actions:

```text
Edit
Pause
Resume
Delete
```

---

# 52. Recurring Transaction Form

Fields:

```text
Name
Amount
Type
Category
Account
Payment Method
Frequency
Start Date
Next Occurrence
End Date
```

Frequency:

```text
Daily
Weekly
Monthly
Yearly
```

---

# 53. Savings Goals Page

Header:

```text
Savings Goals

Total Saved
₹35,000

Total Targets
₹120,000
```

Goal cards:

```text
🎯 New Laptop

₹35,000 / ₹80,000

████████░░░░
43.75%

₹45,000 remaining
Target: Dec 2026
```

---

# 54. Savings Goal Creation

Fields:

```text
Goal Name
Target Amount
Target Date
Category
Description
```

---

# 55. Savings Goal Contribution UX

A contribution action may provide:

```text
Add Contribution

Amount
Account
Date
Note

[Save Contribution]
```

Contribution must not silently modify unrelated transactions unless the implementation explicitly models such a relationship.

---

# 56. Analytics Page

Analytics should provide a deeper view than the dashboard.

Recommended controls:

```text
Date Range
Account
Category
Transaction Type
```

Charts:

```text
Income vs Expenses
Expense by Category
Spending Trend
Savings Trend
Payment Methods
Account Spending
```

---

# 57. Analytics Information Hierarchy

Top:

```text
Income
Expenses
Savings
Savings Rate
```

Middle:

```text
Trend charts
```

Bottom:

```text
Detailed category/payment/account analysis
```

---

# 58. Financial Insights Page/Section

Insights should appear in a dedicated section and optionally on the dashboard.

Example:

```text
Financial Insights

💡 Food spending increased by 18%
compared with last month.

⚠️ Shopping budget is at 92%.

📈 You saved ₹4,500 more than last month.
```

Insights should have:

- Type
- Severity
- Date/context
- Explanation where useful

---

# 59. Financial Calendar

Calendar should show financial events.

Examples:

```text
Sep 1
Netflix ₹649

Sep 5
Rent ₹15,000

Sep 7
Internet ₹899
```

Calendar event types should be visually distinguishable without relying only on color.

---

# 60. Reports Page

Reports page:

```text
Financial Reports

[Month / Year]

Report Type
[Monthly Financial Report]

[Generate Report]

[Download PDF]
[Download CSV]
```

---

# 61. Report Preview

Report preview should show:

```text
August 2026

Income       ₹50,000
Expenses     ₹32,500
Savings      ₹17,500
Savings Rate 35%

Top Category
Food         ₹7,200

Top Payment
UPI          ₹12,400
```

---

# 62. Notifications Page

Notification center:

```text
Notifications

All | Unread

⚠️ Shopping budget reached 90%
2 minutes ago

🎯 ₹2,000 away from Laptop goal
1 hour ago

📅 Electricity bill due tomorrow
Yesterday
```

Unread notifications should have clear but subtle emphasis.

---

# 63. Notification Actions

Support:

```text
Mark as read
Mark all as read
Delete
```

---

# 64. Profile Page

Profile page should contain:

```text
Profile Information
Security
Preferences
```

Profile:

```text
Name
Email
Phone
Profile Picture
```

Security:

```text
Change Password
```

Preferences:

```text
Currency
Timezone
Date Format
Theme
Notifications
```

---

# 65. Settings Page

Settings should be organized by sections.

Recommended:

```text
Appearance
Notifications
Financial Preferences
Security
Account
```

Avoid a long single form containing every setting.

---

# 66. Onboarding UX

Onboarding should feel lightweight.

Example:

```text
Welcome to FinTrack

Let's set up your finances.

Step 1 of 5
```

Steps:

```text
Personal information
Monthly income
Main categories
First budget
First savings goal
```

Allow skipping optional steps.

---

# 67. Admin Dashboard

Admin UI must visually differ enough to communicate elevated context without becoming a completely different product.

Top metrics:

```text
Total Users
Active Users
Transactions
Total Income
Total Expenses
```

Charts:

```text
User registrations
Transaction volume
Income/expense trends
Popular categories
```

---

# 68. Admin User Management

Page structure:

```text
Users

[Search users...]

[Status] [Role]

------------------------------------------
User | Email | Role | Status | Actions
------------------------------------------
```

Actions:

```text
View
Activate
Deactivate
Change Role
```

Sensitive user financial data should not be unnecessarily displayed.

---

# 69. Admin Audit Logs

Table:

```text
Time
Admin
Action
Target
Details
```

Filters:

```text
Action
Admin
Date range
Target type
```

---

# 70. Admin System Settings

If implemented:

```text
System Settings

Default Categories
Notification Configuration
System Preferences
```

Only authorized admins can access this page.

---

# 71. Demo Account UX

The public portfolio deployment may include:

```text
Explore Demo
```

The demo should clearly indicate:

```text
Demo Account
Sample financial data
```

Do not make demo data look like real personal data.

---

# 72. Empty States

Every major data page needs a useful empty state.

Example:

```text
No transactions yet.

Start tracking your finances by adding
your first income or expense.

[+ Add Transaction]
```

Avoid generic:

```text
No data.
```

---

# 73. Loading States

Use skeletons for major dashboard/data sections.

Example:

```text
┌─────────────────────┐
│ ▓▓▓▓▓▓▓             │
│ ▓▓▓▓                │
└─────────────────────┘
```

Avoid flashing blank screens.

---

# 74. Button Loading States

When submitting:

```text
Saving...
```

instead of allowing repeated clicks.

Buttons should become appropriately disabled during submission.

---

# 75. Error States

Example:

```text
Unable to load transactions.

Please try again.

[Retry]
```

Do not expose raw API/database errors.

---

# 76. Form Validation

Validation messages should appear close to the relevant field.

Bad:

```text
Something went wrong.
```

Better:

```text
Amount must be greater than ₹0.
```

Errors should be concise and actionable.

---

# 77. Destructive Actions

Actions such as:

- Delete transaction
- Delete category
- Delete account
- Delete goal
- Delete receipt
- Delete account

must require appropriate confirmation.

Example:

```text
Delete transaction?

This action cannot be undone.

[Cancel] [Delete]
```

---

# 78. Toast Notifications

Use toasts for lightweight feedback:

```text
Transaction added successfully.
Budget updated.
Receipt uploaded.
Password changed.
```

Avoid using toasts for important information that users need to read later.

Use the notification center for persistent notifications.

---

# 79. Modal/Dialog Rules

Dialogs should be used for:

- Confirmation
- Small focused forms
- Quick actions

Do not put large multi-step workflows inside tiny modal dialogs.

Large forms should use dedicated pages/drawers where appropriate.

---

# 80. Tables

Tables must have:

- Clear column hierarchy
- Sticky headers where useful
- Pagination
- Sorting indicators
- Empty state
- Loading state
- Responsive behavior

Avoid excessive columns.

---

# 81. Charts

Charts must:

- Have clear labels
- Have readable tooltips
- Use consistent semantic colors
- Work in light/dark mode
- Include text summaries where useful
- Remain responsive

Charts must not be used when a simple table/value is clearer.

---

# 82. Chart Accessibility

Do not rely exclusively on color.

For example:

```text
Income — ₹50,000
Expenses — ₹32,500
```

should accompany a visual chart.

---

# 83. Currency Formatting

The UI must consistently format money.

Default:

```text
₹50,000
₹32,500
₹17,500
```

Currency formatting should be centralized.

---

# 84. Number Formatting

Use consistent:

- Thousands separators
- Decimal precision
- Percentage precision

Example:

```text
43.75%
```

Do not randomly display:

```text
43.754839%
```

unless detailed precision is required.

---

# 85. Date Formatting

Display dates according to user preferences.

Example:

```text
22 Aug 2026
```

or configured user format.

Relative time may be used in notifications:

```text
2 minutes ago
```

but detailed timestamps should remain available where needed.

---

# 86. Forms

Forms should follow:

```text
Label
Input
Help text
Error
```

Use appropriate input types:

- Currency
- Date
- Select
- Text
- Textarea
- File

---

# 87. Currency Input

Currency fields should:

- Accept numeric input
- Prevent invalid characters where practical
- Format carefully
- Show currency context
- Validate positive values

Do not hide precision behavior from users.

---

# 88. Search UX

Search should:

- Have a clear placeholder
- Show active query
- Allow clearing
- Debounce requests where appropriate
- Show empty results
- Preserve query during pagination/filtering

---

# 89. Filter UX

Filters should be discoverable but not visually overwhelming.

Desktop:

```text
Search
Filter controls
```

Mobile:

```text
Search
[Filters]
```

with a filter drawer/sheet.

---

# 90. Pagination UX

Show:

```text
Previous
1 2 3
Next
```

and useful result information where available.

Disable invalid navigation.

---

# 91. Responsive Breakpoints

The final implementation should use consistent breakpoints.

Conceptual:

```text
Mobile
Tablet
Desktop
Large Desktop
```

Exact pixel values may follow the selected Tailwind defaults unless a design-specific breakpoint is required.

---

# 92. Mobile-First Considerations

Important actions must remain easy to use on mobile:

- Add transaction
- View balance
- Check budget
- Add goal
- View notifications

Floating action buttons may be used selectively for high-frequency actions.

---

# 93. Mobile Dashboard

Mobile order:

```text
Greeting
Summary cards
Balance
Income/expense chart
Budget
Goals
Insights
Recent transactions
Upcoming payments
```

Cards should stack naturally.

---

# 94. Tablet Dashboard

Tablet may use two-column layouts:

```text
Summary
Summary

Chart
Chart

Budgets
Goals
```

The layout should adapt without overcrowding.

---

# 95. Desktop Dashboard

Desktop can use:

```text
4 summary cards

Large chart + category chart

Budget + goals + accounts

Trends + insights

Recent transactions + upcoming payments
```

---

# 96. Navigation Active State

Current navigation item should be clearly visible through:

- Background/surface change
- Typography
- Icon treatment
- Accent indicator

Do not rely only on color.

---

# 97. Icons

Use Lucide React or the locked icon library.

Icons should:

- Have consistent stroke style
- Have consistent size
- Support tooltips when meaning is not obvious
- Not replace labels for critical actions

---

# 98. Emoji Usage

Emoji may be used sparingly for:

- Savings goals
- Friendly insight accents
- Demo content

Do not use emoji as the primary icon system.

---

# 99. Forms: Create vs Edit

Create and edit forms should use consistent layouts.

Example:

```text
Add Transaction
```

vs

```text
Edit Transaction
```

The user should always know whether they are creating or modifying data.

---

# 100. Unsaved Changes

For important forms, the application should warn users before abandoning meaningful unsaved changes where practical.

---

# 101. Accessibility

FinTrack must support:

- Keyboard navigation
- Focus management
- Screen-reader-friendly labels
- Semantic HTML
- Accessible dialogs
- Accessible forms
- Sufficient contrast
- Non-color status indicators

---

# 102. Focus Management

When a dialog opens:

```text
Focus → Dialog
```

When it closes:

```text
Focus → Trigger
```

Keyboard users must be able to navigate all interactive elements.

---

# 103. Motion Accessibility

Respect reduced-motion preferences.

If the user has reduced motion enabled:

- Reduce transitions
- Disable non-essential movement
- Avoid large animated effects

---

# 104. Performance UX

UI should feel responsive.

Use:

- Skeleton loading
- Optimistic updates only where safe
- Debounced search
- Pagination
- Lazy loading
- Efficient chart rendering

Financial mutations should not use unsafe optimistic updates if they could display incorrect balances.

---

# 105. Feedback Hierarchy

Use:

```text
Toast
→ Lightweight success

Inline validation
→ Form problem

Notification center
→ Persistent user alert

Dialog
→ Confirmation/critical action

Page state
→ Loading/error/empty
```

---

# 106. Security UX

Authentication errors should not reveal sensitive information.

For example, login should use safe messaging rather than exposing whether a specific email exists.

Password reset should similarly avoid account enumeration.

---

# 107. Password UX

Password fields should provide:

- Show/hide control
- Password requirement guidance
- Clear validation
- Confirmation field where appropriate

Do not display the password itself after submission.

---

# 108. File Upload UX

File validation errors should clearly state:

```text
Unsupported file type.
```

or:

```text
File exceeds the maximum allowed size.
```

The UI must not imply a successful upload until the server confirms success.

---

# 109. Notification Badge

The header notification icon may display unread count.

Example:

```text
🔔 3
```

The count should remain readable and not become visually dominant.

---

# 110. Financial Status Badges

Use compact badges:

```text
Healthy
Warning
Critical
Exceeded
```

Badges should include text.

---

# 111. Account Status

Account states:

```text
Active
Inactive
Archived
```

Use a compact status indicator and text.

---

# 112. Goal Status

Goal states:

```text
Active
Completed
Paused
Cancelled
```

Completed goals may have a subtle success treatment.

---

# 113. Accessibility of Financial Status

Example:

Do not use:

```text
Green bar = healthy
Red bar = exceeded
```

alone.

Use:

```text
Healthy — 65%
Exceeded — 116%
```

---

# 114. Design System Components

Recommended shared component library:

```text
Button
IconButton
Input
Textarea
Select
DatePicker
CurrencyInput
Checkbox
Switch
RadioGroup
Tabs
Dropdown
Tooltip
Dialog
Drawer
Toast
Badge
Card
Table
Pagination
Progress
Avatar
Skeleton
EmptyState
ErrorState
ConfirmDialog
ChartContainer
```

---

# 115. Financial Components

Feature-specific reusable components:

```text
FinancialSummaryCard
TransactionRow
TransactionTable
BudgetProgress
BudgetCard
GoalProgress
AccountCard
InsightCard
NotificationItem
RecurringPaymentCard
FinancialChart
```

---

# 116. Component Consistency

Components must use shared tokens and primitives.

Avoid:

```text
Page A → custom button
Page B → different button
Page C → another button
```

Use:

```text
Shared Button
```

unless a truly unique interaction requires a specialized component.

---

# 117. Empty State Illustrations

Illustrations are optional.

If used, they must remain subtle and consistent.

Avoid overly cartoonish graphics.

---

# 118. Error Page

Provide:

```text
Something went wrong.

We couldn't load this page.

[Try Again]
[Go to Dashboard]
```

For forbidden pages:

```text
Access denied.

You don't have permission to view this page.
```

---

# 119. 404 Page

Provide:

```text
Page not found.

The page you're looking for doesn't exist.

[Go to Dashboard]
```

---

# 120. Authentication Pages

## Login

```text
FinTrack

Welcome back

Email
Password

[Login]

Forgot password?

Don't have an account?
Create account
```

## Register

```text
Create your FinTrack account

Name
Email
Password
Confirm Password

[Create Account]

Already have an account?
Login
```

---

# 121. Authentication Visual Style

Auth pages should be:

- Focused
- Minimal
- Professional
- Trustworthy

Avoid giant marketing sections competing with the form.

---

# 122. Forgot Password Page

```text
Forgot your password?

Enter your email and we'll send
reset instructions.

Email

[Send Reset Link]
```

The response should remain privacy-safe.

---

# 123. Reset Password Page

```text
Create a new password

New Password
Confirm Password

[Reset Password]
```

Invalid/expired token:

```text
This reset link is invalid or has expired.

[Request New Link]
```

---

# 124. Dashboard Greeting

Greeting should be contextual but not overdone.

Example:

```text
Good morning, Alex
Here's your financial overview for August.
```

Avoid excessive motivational copy.

---

# 125. Microcopy Style

Use:

- Short
- Direct
- Friendly
- Professional
- Action-oriented

Prefer:

```text
Add transaction
```

over:

```text
Click here to add a new financial transaction
```

---

# 126. Confirmation Copy

Be clear about consequences.

Example:

```text
Delete this transaction?

This will remove it from your financial history
and update your analytics.

[Cancel] [Delete]
```

---

# 127. Budget Alert Copy

Use direct wording:

```text
You've used 90% of your Food budget.
```

rather than:

```text
Uh oh! Your food budget is almost gone!!! 😱
```

---

# 128. Insight Copy

Use concise factual language:

```text
Your food spending increased 18% compared
with last month.
```

Avoid presenting insights as professional financial advice.

---

# 129. Goal Copy

Example:

```text
You're ₹2,000 away from your Laptop goal.
```

Avoid exaggerated gamification.

---

# 130. Transaction Amount Presentation

Income:

```text
+ ₹50,000
```

Expense:

```text
- ₹2,499
```

The sign and label should both make the transaction type understandable.

---

# 131. Balance Presentation

Balance may be displayed as:

```text
₹17,500
Remaining balance
```

Avoid ambiguous labels such as:

```text
Total
```

---

# 132. Dashboard Period Selector

Use a compact control:

```text
August 2026 ▼
```

or:

```text
This month ▼
```

For custom range:

```text
22 Jul – 22 Aug
```

---

# 133. Responsive Chart Behavior

On mobile:

- Reduce chart height
- Simplify labels
- Keep tooltips usable
- Allow horizontal chart scrolling only where necessary
- Preserve readable values

---

# 134. Table-to-Card Transformation

For mobile, high-density tables should transform into cards rather than merely shrinking text.

Example:

```text
Amazon
Shopping · UPI
22 Aug 2026

₹2,499
```

---

# 135. Modal-to-Drawer Transformation

Large filter interfaces may become bottom sheets/drawers on mobile.

---

# 136. Desktop Hover Behavior

Hover may be used for:

- Row actions
- Tooltips
- Card affordances

But critical actions must remain accessible without hover.

---

# 137. Touch Targets

Interactive controls should have comfortable touch targets.

Avoid tiny icons that are difficult to tap on mobile.

---

# 138. Design Tokens

Implementation should centralize:

```text
colors
spacing
radius
shadows
typography
breakpoints
transitions
```

This makes the visual system consistent.

---

# 139. Component States

Interactive components should support appropriate states:

```text
default
hover
focus
active
disabled
loading
error
success
```

---

# 140. Button Hierarchy

Primary:

```text
Add Transaction
Create Budget
Save Changes
```

Secondary:

```text
Cancel
View Details
```

Destructive:

```text
Delete
Remove
Deactivate
```

Ghost/icon:

```text
More
Close
Back
```

Do not make every button visually primary.

---

# 141. Form Submission

Submit button should communicate state:

```text
Save Transaction
```

during request:

```text
Saving...
```

after success:

```text
Transaction added
```

---

# 142. Authentication Loading

During initial session restoration:

```text
Loading your account...
```

or a neutral application skeleton.

Avoid showing the protected dashboard briefly before redirecting.

---

# 143. Dashboard Data Loading

Use section-level skeletons so the page can progressively appear.

Do not block the entire dashboard if one non-critical widget fails.

---

# 144. Partial Failure

If analytics fails but transactions load:

```text
Transactions → available

Analytics
Unable to load analytics.
[Retry]
```

Do not blank the entire page unnecessarily.

---

# 145. UX for Slow Networks

Use:

- Loading indicators
- Skeletons
- Disabled duplicate submissions
- Retry actions
- Clear error messages

---

# 146. Offline Behavior

Full offline financial synchronization is not part of v1.

The UI should clearly communicate network failures rather than pretending a mutation succeeded.

---

# 147. Accessibility of Charts

Every major chart should provide an accessible textual summary.

Example:

```text
August expenses were ₹32,500.
Food was the largest category at ₹7,200.
```

---

# 148. Accessibility of Icons

Decorative icons should be hidden from screen readers where appropriate.

Action icons need accessible labels.

Example:

```text
aria-label="Delete transaction"
```

---

# 149. Keyboard Shortcuts

Keyboard shortcuts are optional and not part of the core v1 requirement.

If added, they must not interfere with normal browser behavior.

---

# 150. Localization Readiness

The UI should avoid hardcoding assumptions that make future localization impossible.

However, full multilingual support is not part of the locked v1 feature scope.

---

# 151. Financial Data Privacy in UI

Avoid exposing unnecessary financial information in:

- Notifications
- Activity logs
- Browser titles
- URLs
- Error messages

Do not put sensitive transaction details in query strings when avoidable.

---

# 152. Admin Privacy UX

Admin pages should display only information necessary for administrative functions.

Do not create an unrestricted "view everything" screen merely because the user has an admin role.

---

# 153. User Deletion UX

Account deletion should be intentionally clear.

Flow:

```text
Settings
 ↓
Delete Account
 ↓
Warning
 ↓
Confirmation
 ↓
Final confirmation
 ↓
Delete
 ↓
Logout
 ↓
Redirect to authentication
```

---

# 154. Demo Mode UX

Demo mode should include a subtle indicator:

```text
Demo Account
```

This prevents confusion about whether the displayed financial information is real.

---

# 155. Responsive Settings

Settings should work as:

Desktop:

```text
Settings Sidebar | Settings Content
```

Mobile:

```text
Settings
↓
Section list
↓
Selected section
```

---

# 156. Visual Density

FinTrack should use moderate information density.

The dashboard should feel useful, not empty.

The transaction page can be denser because it is an operational data-management screen.

---

# 157. Avoid Card Overuse

Not every section needs a card.

Use cards for:

- Summary metrics
- Budgets
- Goals
- Accounts
- Insights

Use normal sections for:

- Page headings
- Tables
- Long forms
- Navigation

---

# 158. Avoid Excessive Gradients

Gradients may be used very selectively for subtle brand emphasis.

They must not become the default background style.

---

# 159. Avoid Excessive Glassmorphism

Transparency and blur effects should not be used as the primary design language.

The product should remain readable and practical.

---

# 160. Avoid Artificial AI-Style UI

Do not use:

- "AI insight" badges
- AI sparkle icons
- Chatbot widgets
- Prompt boxes
- AI-generated financial advice
- AI API indicators

Financial insights are ordinary product functionality powered by deterministic business logic.

---

# 161. UX for Financial Insights

The user should understand that insights are based on their financial history.

Optional label:

```text
Based on your recent activity
```

Do not imply professional financial advisory services.

---

# 162. UX for Budget Progress

Budget progress must communicate both:

```text
Absolute value
Percentage
```

Example:

```text
₹4,000 / ₹5,000
80%
```

---

# 163. UX for Savings Goals

Goals must communicate:

```text
Current
Target
Progress
Remaining
Deadline
```

where available.

---

# 164. UX for Recurring Payments

Recurring payment cards should clearly show:

```text
Name
Amount
Frequency
Next payment
Status
```

---

# 165. UX for Accounts

Account cards should clearly distinguish:

```text
Asset
Liability
```

where applicable.

Credit card balances should not look identical to positive bank balances.

---

# 166. UX for Credit Cards

Credit card balances require careful wording.

Example:

```text
Credit Card
Outstanding
- ₹7,200
```

rather than presenting it ambiguously as available cash.

The exact balance semantics are defined by backend account rules.

---

# 167. UX for Payment Methods

Payment methods should be visible in transaction details but should not dominate the transaction display.

---

# 168. UX for Categories

Categories should use:

- Icon
- Name
- Optional color

The category name must always remain visible.

---

# 169. UX for Dates

Use consistent date formatting across:

- Transactions
- Budgets
- Goals
- Recurring payments
- Notifications
- Reports

---

# 170. UX for Amount Errors

Example:

```text
Amount must be greater than ₹0.
```

Do not allow:

```text
-₹500
```

for an ordinary expense amount.

Transaction type determines income/expense direction.

---

# 171. UX for No Previous Month

When a comparison is impossible:

```text
Not enough data for comparison
```

rather than showing a misleading percentage.

---

# 172. UX for No Transactions

Dashboard:

```text
Your financial overview will appear here
after you add your first transaction.

[Add Transaction]
```

---

# 173. UX for No Budget

```text
No budgets yet.

Set category limits to keep your spending on track.

[Create Budget]
```

---

# 174. UX for No Goals

```text
No savings goals yet.

Create a goal and track your progress.

[Create Goal]
```

---

# 175. UX for No Accounts

```text
Add your first account

Track cash, bank accounts, cards and UPI
in one place.

[Add Account]
```

---

# 176. UX for No Notifications

```text
You're all caught up.

New alerts and updates will appear here.
```

---

# 177. UX for No Reports

```text
Generate your first financial report
to review your income, expenses and savings.

[Create Report]
```

---

# 178. UX for File Upload Failure

Example:

```text
Receipt upload failed.

Please check the file type and size and try again.
```

---

# 179. UX for Authentication Failure

Use safe generic messaging:

```text
Invalid email or password.
```

Do not reveal which credential was incorrect.

---

# 180. UX for Authorization Failure

```text
You don't have permission to access this page.
```

---

# 181. UX for Session Expiration

If authentication expires:

```text
Your session has expired.

Please log in again.
```

Then redirect to login.

---

# 182. UX for Server Error

```text
Something went wrong.

Please try again.

[Retry]
```

---

# 183. UX for Delete Confirmation

Destructive dialogs must clearly identify the resource.

Example:

```text
Delete "Amazon - ₹2,499"?

This will remove the transaction from your
financial history.

[Cancel] [Delete]
```

---

# 184. UX for Admin Deactivation

Example:

```text
Deactivate this user?

They will no longer be able to access their account.

[Cancel] [Deactivate]
```

---

# 185. Page Transition

Page transitions should be subtle.

Recommended:

```text
opacity
small translate
```

Duration should remain short.

Avoid long cinematic transitions.

---

# 186. Component Transition

Use small transitions for:

- Dropdowns
- Dialogs
- Drawers
- Progress bars
- Toasts

---

# 187. Reduced Motion

Honor:

```text
prefers-reduced-motion
```

Disable/reduce non-essential animation.

---

# 188. Notification Animation

New notifications may use a subtle badge update.

Avoid repeated pulsing/glowing that distracts the user.

---

# 189. Chart Animation

Charts may animate on initial load.

Keep animation:

- Short
- Subtle
- Disabled/reduced under reduced-motion preference

---

# 190. Progress Animation

Budget/goal progress may animate when first displayed.

The final value must appear quickly.

---

# 191. Form Interaction

Inputs should have clear focus state.

Example:

```text
Default
Focused
Error
Disabled
```

The focus state should not rely only on a color change.

---

# 192. Disabled Controls

Disabled buttons should communicate why they are unavailable where appropriate.

Do not make disabled text too low-contrast.

---

# 193. Success Feedback

Successful financial mutations should produce:

- Immediate confirmation
- Updated relevant UI
- Updated derived financial information

Example:

```text
Transaction added successfully.
```

Then update:

```text
Balance
Expenses
Budget
Charts
Recent transactions
```

where applicable.

---

# 194. Data Refresh Behavior

After financial mutations, only affected data should be refreshed where practical.

Avoid reloading the entire application unnecessarily.

---

# 195. Dashboard Consistency

All dashboard numbers must be consistent.

For example:

```text
Income - Expenses = Balance
```

where the selected period/business definition makes that relationship applicable.

The UI must not show contradictory totals.

---

# 196. Report Consistency

Report values must use the same backend calculation definitions as the dashboard.

Do not maintain separate conflicting financial calculation logic for reports.

---

# 197. Analytics Consistency

Charts and summary cards should use consistent date/filter context.

If the user selects:

```text
August 2026
```

all relevant dashboard analytics should clearly reflect that context.

---

# 198. Filter Context

When filtering transactions, the UI should preserve active filters during:

- Pagination
- Sorting
- Navigation where appropriate

---

# 199. Breadcrumbs

Breadcrumbs are optional.

They may be used for:

```text
Settings > Security
Admin > Users > User Details
```

They are not required on simple top-level pages.

---

# 200. Page Titles

Each page should have a clear title:

```text
Dashboard
Transactions
Budgets
Accounts
Savings Goals
Analytics
Calendar
Reports
Notifications
Settings
```

---

# 201. Page Actions

Primary page actions should be visually clear.

Examples:

```text
Transactions → + Add Transaction
Budgets → + Create Budget
Accounts → + Add Account
Goals → + Create Goal
Recurring → + Add Recurring
```

---

# 202. UX for Search Results

If search returns no result:

```text
No transactions found for "Amazon".
```

Provide:

```text
Clear search
```

---

# 203. UX for Filtered Empty Results

```text
No transactions match these filters.

[Clear Filters]
```

---

# 204. UX for Pagination End

Disable:

```text
Next
```

when there is no next page.

---

# 205. UX for Large Data Sets

The interface should remain responsive even with thousands of transactions.

Use:

- Server pagination
- Virtualization only if actually necessary
- Efficient API queries
- Compact table rendering

---

# 206. Security and Privacy in URLs

Avoid putting:

- Password reset secrets
- Financial values
- Sensitive transaction descriptions

into URLs unless technically required.

---

# 207. Security and Privacy in Browser Storage

Do not store:

- Passwords
- JWT secrets
- Reset tokens
- Sensitive financial exports

in localStorage.

Authentication uses HTTP-only cookies.

---

# 208. UI/UX Scope Lock

The following design characteristics are locked:

```text
Professional fintech visual language
Clean and restrained UI
Responsive across desktop/tablet/mobile
Light/dark/system theme
Subtle purposeful animations
Strong financial data hierarchy
Accessible components
Clear loading/error/empty states
Server-authoritative financial data
No AI-style interface
No AI chatbot
No AI badges
No AI-generated financial advice UI
```

---

# 209. Final Navigation Map

## User

```text
Dashboard
│
├── Transactions
│   ├── All Transactions
│   ├── Add Transaction
│   └── Transaction Details
│
├── Accounts
│
├── Budgets
│
├── Recurring
│
├── Savings Goals
│
├── Calendar
│
├── Analytics
│
├── Reports
│
├── Notifications
│
└── Settings
    ├── Profile
    ├── Appearance
    ├── Notifications
    ├── Financial Preferences
    ├── Security
    └── Account
```

## Admin

```text
Admin Dashboard
│
├── Users
│
├── Audit Logs
│
├── Categories
│
└── System Settings
```

---

# 210. Final UI/UX Quality Bar

The final interface must:

- Look professionally designed.
- Avoid generic AI-generated styling.
- Feel consistent across all pages.
- Make financial information easy to scan.
- Work on mobile.
- Work in dark mode.
- Provide accessible interactions.
- Provide clear feedback.
- Use meaningful animations only.
- Handle loading, empty, error and success states.
- Avoid visual clutter.
- Keep financial calculations understandable.
- Never imply AI-powered functionality.

---

# 211. Relationship With Other Source-of-Truth Documents

```text
PRD.md
→ Defines product requirements

TRD.md
→ Defines technical requirements

ARCHITECTURE.md
→ Defines system architecture

DATABASESCHEMA.md
→ Defines data structure

UI/UX.md
→ Defines visual and interaction system

WEBFLOW.md
→ Defines user/admin journeys

IMPLEMENTATION.md
→ Defines implementation phases
```

UI/UX decisions must remain consistent with the product requirements and technical architecture.

---

# 212. UI/UX Scope Lock

This document defines the locked UI/UX direction for FinTrack v1.

The application must present a polished, professional, responsive personal finance experience with a strong focus on clarity and usability.

The visual design must intentionally avoid looking like an automatically generated AI dashboard.

All financial insight interfaces must represent deterministic application logic, not external AI.

**`UI/UX.md` is the UI/UX source of truth for FinTrack v1.**
