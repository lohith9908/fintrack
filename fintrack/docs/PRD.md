# FinTrack — Product Requirements Document (PRD)

**Document:** `PRD.md`  
**Version:** 1.0  
**Status:** Locked / Source of Truth  
**Product:** FinTrack — Personal Finance Management Platform  
**Date:** 22 August 2026

---

## 1. Document Purpose

This Product Requirements Document defines the complete product scope, functional requirements, user roles, business capabilities, UX expectations, security expectations, and non-functional product requirements for **FinTrack**.

This document is a **source of truth** for the project.

All implementation decisions must conform to this document unless a requirement is formally revised in the appropriate source-of-truth document.

The project is intentionally designed as a serious full-stack portfolio/application project rather than a basic CRUD expense tracker.

---

# 2. Product Overview

## 2.1 Product Name

**FinTrack**

## 2.2 Product Type

Full-stack personal finance management web application.

## 2.3 Product Goal

FinTrack enables users to manage their personal finances from a single platform by allowing them to:

- Track income and expenses
- Manage financial accounts and wallets
- Create monthly budgets
- Track recurring transactions
- Create and monitor savings goals
- Analyze spending and saving patterns
- Upload receipts
- Receive financial notifications
- Generate financial reports
- Export financial data
- Manage their profile and preferences

The platform also provides an administrative area with role-based access control for authorized administrators.

## 2.4 Core Product Principle

FinTrack should feel like a **real, polished fintech product**, not a generic generated dashboard or a collection of disconnected CRUD pages.

The product must prioritize:

- Clarity
- Reliability
- Security
- Useful financial information
- Consistent UX
- Responsive design
- Maintainable architecture
- Strong full-stack engineering practices

---

# 3. Locked Technology/Product Constraints

The following constraints are locked for this project.

## 3.1 No AI APIs

FinTrack must **not integrate any external AI API or AI service**.

This includes, but is not limited to:

- OpenAI APIs
- Gemini APIs
- Claude APIs
- Any external generative AI API
- AI-based financial recommendation APIs

All financial insights must be generated using **built-in deterministic business logic**.

Examples:

- Month-over-month percentage comparison
- Budget threshold rules
- Category percentage calculations
- Savings calculations
- Spending trend calculations
- Goal completion projections based on deterministic historical data

No AI API key should be required anywhere in the project.

## 3.2 File Uploads

Receipt and document uploads must use **Multer** on the backend.

The upload system must support appropriate:

- File type validation
- File size validation
- Upload authorization
- File metadata
- Replacement
- Deletion

## 3.3 Authentication

Authentication must use:

- JWT
- HTTP-only cookies
- bcrypt password hashing
- Protected routes
- Role-based authorization

Passwords must never be stored in plaintext.

## 3.4 Database

The application uses:

- MongoDB
- Mongoose

MongoDB Compass may be used for database inspection and management during development.

## 3.5 Environment Configuration

The project must support:

- `.env`
- `.env.example`
- `.gitignore`

Secrets must never be committed to source control.

---

# 4. Product Objectives

## Objective 1 — Financial Tracking

Allow users to accurately record and manage income and expenses.

## Objective 2 — Financial Visibility

Give users a clear understanding of:

- Income
- Expenses
- Balance
- Savings
- Spending categories
- Payment methods
- Accounts

## Objective 3 — Budget Control

Help users create budgets and understand when spending approaches or exceeds limits.

## Objective 4 — Savings Progress

Allow users to create measurable savings goals and monitor progress.

## Objective 5 — Financial Insights

Convert transaction data into useful, understandable insights using deterministic business logic.

## Objective 6 — Automation

Support recurring income and expenses so users can manage predictable financial activity.

## Objective 7 — Reporting

Allow users to generate and export useful financial reports.

## Objective 8 — Security

Protect personal and financial information using strong authentication, authorization, validation, and security practices.

## Objective 9 — Portfolio Quality

Demonstrate professional full-stack engineering across:

- Frontend
- Backend
- Database
- Authentication
- Authorization
- File handling
- Analytics
- Reporting
- Responsive UI/UX
- Security
- Administration

---

# 5. User Roles

FinTrack has two primary roles.

## 5.1 USER

A normal registered user can:

- Manage their own profile
- Manage their own transactions
- Manage their own accounts
- Manage their own categories
- Manage their own budgets
- Manage their own recurring transactions
- Manage their own savings goals
- View their own analytics
- View their own notifications
- Upload their own receipts
- Generate their own reports
- Export their own data
- Delete their own account

Users must not access another user's financial data.

## 5.2 ADMIN

An administrator can access the administrative application area.

Admin capabilities include:

- View platform-level statistics
- Manage users
- Activate/deactivate users
- Manage roles where authorized
- Manage system/default categories
- View administrative audit logs
- Manage permitted system settings

Administrative access must be enforced on the backend.

Hiding admin UI elements in the frontend is not considered authorization.

---

# 6. Admin Seed Requirement

A default administrator must be created through a database seed process.

Requirements:

- Admin must not be created through normal public registration.
- Seed process checks whether the admin already exists.
- If the admin does not exist, it is created.
- Admin credentials are loaded from environment variables.
- Admin password is hashed using bcrypt before storage.
- Running the seed repeatedly must not create duplicate admin accounts.
- The admin seed must be safe to run more than once.

---

# 7. Authentication Requirements

## 7.1 Registration

Users can register using required account information.

Registration must:

- Validate input
- Validate email
- Enforce password requirements
- Confirm password where applicable
- Hash password with bcrypt
- Prevent duplicate accounts
- Create the user
- Establish authenticated state where appropriate

## 7.2 Login

Users can log in using their credentials.

Login must:

- Validate credentials
- Verify the password using bcrypt
- Generate JWT authentication
- Store authentication securely using an HTTP-only cookie
- Reject invalid credentials
- Apply login rate limiting/throttling

## 7.3 Logout

Logout must:

- Invalidate/remove the authentication cookie
- Clear authenticated client state
- Return the user to an unauthenticated state

## 7.4 Protected Routes

Authenticated application routes must reject unauthenticated requests.

## 7.5 Forgot Password

Users can request a password reset.

Requirements:

- Validate email
- Generate a secure reset token
- Apply token expiration
- Avoid exposing whether an account exists through unsafe responses
- Send reset instructions through configured email infrastructure when enabled

## 7.6 Reset Password

Users can reset their password using a valid, non-expired reset token.

Requirements:

- Validate token
- Validate new password
- Hash new password using bcrypt
- Invalidate the reset token
- Prevent reuse of expired/used reset tokens

## 7.7 Change Password

Authenticated users can change their password.

The user must provide appropriate current/new password information.

---

# 8. User Profile & Settings

Users can manage:

- Name
- Email
- Phone number
- Profile picture
- Currency
- Timezone
- Date format
- Theme
- Notification preferences

Settings must persist per user.

Theme options:

- Light
- Dark
- System

---

# 9. Dashboard Requirements

The dashboard is the primary product experience.

## 9.1 Summary Cards

The dashboard must show:

- Total Income
- Total Expenses
- Remaining Balance
- Savings Rate

Example:

```text
Total Income       ₹50,000
Total Expenses     ₹32,500
Remaining Balance  ₹17,500
Savings Rate       35%
```

## 9.2 Analytics

Dashboard must provide:

- Monthly income vs expenses
- Expense by category
- Spending trend
- Savings trend
- Income trend
- Balance trend
- Payment method breakdown
- Account overview

## 9.3 Dashboard Widgets

The dashboard may contain:

- Recent transactions
- Budget status
- Savings goal progress
- Upcoming recurring transactions
- Notifications
- Financial insights
- Upcoming bills

## 9.4 Dashboard Time Filters

Users must be able to analyze data using:

- This month
- Last month
- Last 3 months
- Last 6 months
- This year
- Custom date range

---

# 10. Income Management

Users can create income transactions.

Default income categories:

- Salary
- Freelancing
- Business
- Investments
- Other

Income transaction fields include:

- Amount
- Type
- Category
- Description
- Date
- Payment method
- Account
- Notes
- Receipt/attachment where applicable

Users can:

- Create
- View
- Edit
- Delete
- Search
- Filter

income transactions.

---

# 11. Expense Management

Default expense categories:

- Food
- Transport
- Shopping
- Bills
- Education
- Entertainment
- Healthcare
- Other

Users can:

- Create expense
- View expense
- Edit expense
- Delete expense
- Duplicate transaction
- Attach receipt
- Add notes

Expense amounts must be validated as positive monetary values.

---

# 12. Transaction Management

A transaction may contain:

- Amount
- Type
- Category
- Description
- Date
- Payment method
- Account
- Notes
- Receipt reference
- Created timestamp
- Updated timestamp

Supported transaction types:

- Income
- Expense

## 12.1 Transaction Search

Users can search transaction information using relevant searchable fields.

Example:

```text
Amazon
```

should return matching transactions.

## 12.2 Transaction Filters

Users can filter by:

- Type
- Category
- Account
- Payment method
- Date range
- Minimum amount
- Maximum amount

## 12.3 Transaction Sorting

Users can sort by relevant fields such as:

- Date
- Amount
- Created date

## 12.4 Pagination

Transaction lists must use server-side pagination.

The frontend must not be required to load an unbounded transaction history.

---

# 13. Custom Categories

Users can create custom categories.

A category may contain:

- Name
- Type
- Icon
- Color
- Active status

Types:

- Income
- Expense

Default/system categories must be protected from unsafe deletion.

Users can:

- Create custom category
- Rename custom category
- Delete custom category
- Select icon
- Select display color

---

# 14. Multiple Accounts / Wallets

Users can create and manage financial accounts.

Examples:

- Cash
- Bank Account
- Credit Card
- UPI

Account information may include:

- Name
- Type
- Opening balance
- Current balance
- Currency
- Status

Transactions can be associated with an account.

The dashboard should provide an account-level overview.

---

# 15. Payment Method Tracking

Supported payment methods:

- Cash
- UPI
- Credit Card
- Debit Card
- Bank Transfer
- Other

Payment method data must be available for analytics.

Example:

```text
UPI spending this month: ₹12,400
```

---

# 16. Monthly Budgets

Users can create monthly budgets by category.

Example:

```text
Food            ₹5,000
Transport       ₹3,000
Shopping        ₹4,000
Entertainment   ₹2,000
```

Budget tracking must calculate:

- Budget limit
- Amount spent
- Amount remaining
- Percentage used
- Status

## 16.1 Budget Status

Default thresholds:

```text
0–69%     Healthy
70–89%    Warning
90–99%    Critical
100%+     Exceeded
```

## 16.2 Budget Alerts

When thresholds are reached, users may receive notifications.

Example:

> You have used 90% of your Shopping budget.

If spending exceeds the budget:

> You have exceeded your Food budget.

## 16.3 Budget History

Users can review budget performance across previous months.

---

# 17. Recurring Transactions

Users can define recurring transactions.

Examples:

- Netflix
- Rent
- Electricity
- Internet
- Salary
- Subscriptions

Recurring transaction fields include:

- Name
- Amount
- Type
- Category
- Account
- Payment method
- Frequency
- Start date
- Next occurrence
- End date
- Active status

Supported frequencies:

- Daily
- Weekly
- Monthly
- Yearly

The system must expose upcoming recurring payments.

---

# 18. Savings Goals

Users can create savings goals.

Examples:

- New Laptop
- Emergency Fund
- Vacation
- Car
- Education
- Phone

Goal information includes:

- Goal name
- Target amount
- Current saved amount
- Target date
- Category
- Description
- Contributions

The UI must show:

- Progress amount
- Progress percentage
- Remaining amount
- Target date

## 18.1 Goal Projection

The system may estimate an expected completion date using deterministic historical contribution/saving data.

No AI is required.

---

# 19. Expense Analytics

Analytics must provide useful financial breakdowns.

Required analytics include:

- Income by month
- Expenses by month
- Savings by month
- Expenses by category
- Spending trend
- Savings trend
- Payment method breakdown
- Account spending
- Average daily spending
- Highest spending day
- Highest spending category

Analytics must be calculated from the user's authorized financial data.

---

# 20. Financial Insights

FinTrack must provide rule-based financial insights.

No AI service is allowed.

Examples:

- Food expenses increased compared with last month.
- Shopping represents a significant percentage of total expenses.
- Savings increased compared with the previous month.
- A budget has reached a warning threshold.
- A budget has been exceeded.
- A savings goal is progressing.
- A payment method represents a significant portion of spending.

Insight calculations must be:

- Deterministic
- Explainable
- Based on stored financial data
- Safe for edge cases such as missing previous-month data

Insights should never be presented as professional financial advice.

---

# 21. Financial Calendar

A calendar view must provide visibility into financial events.

Events may include:

- Recurring income
- Recurring expenses
- Bills
- Upcoming payments
- Savings goal deadlines
- Budget periods

The calendar should allow users to understand upcoming financial obligations.

---

# 22. Receipt & File Uploads

Receipt uploads are a locked project feature.

## 22.1 Upload Middleware

Backend upload handling must use **Multer**.

## 22.2 Supported File Types

The initial supported formats are:

- JPG
- JPEG
- PNG
- WEBP
- PDF

## 22.3 Upload Requirements

The system must validate:

- File type
- File size
- User ownership/authorization
- Upload destination
- File metadata

Users can:

- Upload receipt
- View/preview receipt where supported
- Download/view receipt
- Replace receipt
- Delete receipt

The transaction must reference the uploaded file safely.

---

# 23. Notifications

FinTrack must include an in-app notification center.

Notification examples:

- Budget warning
- Budget exceeded
- Upcoming recurring transaction
- Savings goal milestone
- Financial insight
- System notification

Users can:

- View notifications
- Mark notification as read
- Mark all as read
- Delete notifications
- Configure notification preferences

---

# 24. Smart Budget Alerts

Budget alert thresholds must be configurable in a controlled manner.

Default thresholds:

```text
50%  Informational
75%  Warning
90%  Critical
100% Exceeded
```

The product may use the stricter locked budget-status thresholds for visual classification while notifications can use their own notification thresholds.

No AI is required for alerts.

---

# 25. Financial Reports

Users can generate reports for:

- Monthly finances
- Yearly finances
- Income
- Expenses
- Categories
- Budgets

Reports should contain meaningful financial summaries.

Example:

```text
August 2026 Financial Report

Income       ₹50,000
Expenses     ₹32,500
Savings      ₹17,500
Savings Rate 35%

Top Category
Food         ₹7,200

Top Payment Method
UPI          ₹12,400
```

---

# 26. Report Export

Supported exports:

- CSV
- PDF

Exports must only contain data the authenticated user is authorized to access.

---

# 27. Data Export

Users must be able to export their personal financial data.

Exportable data should include relevant:

- Profile data
- Transactions
- Budgets
- Goals
- Accounts
- Categories
- Recurring transactions

The exported data must belong only to the requesting user.

---

# 28. Account Deletion

Users can permanently delete their account.

Requirements:

- Explicit confirmation
- Clear warning
- Appropriate authorization
- Removal/anonymization of associated data according to the final data-retention policy
- Invalidation of authentication state

The implementation must avoid leaving accessible orphaned financial records.

---

# 29. User Activity History

Users should have access to relevant activity history.

Examples:

```text
Added Amazon expense
Created Laptop savings goal
Updated Food budget
Added HDFC Bank account
```

Activity history should not expose sensitive authentication secrets.

---

# 30. Admin Dashboard

The admin dashboard is separate from the user dashboard.

It must provide platform-level metrics such as:

- Total users
- Active users
- Total transactions
- Total income
- Total expenses

Additional analytics may include:

- User registrations
- Active user trends
- Transaction volume
- Income/expense trends
- Popular categories

---

# 31. Admin User Management

Authorized admins can:

- Search users
- Filter users
- View user account information
- View registration information
- Activate users
- Deactivate users
- Manage roles where authorized
- View transaction count

Admin actions must be audited.

---

# 32. Admin Audit Logs

Administrative actions must be recorded.

Audit information may include:

- Admin identity
- Action
- Target
- Timestamp
- Relevant metadata

Examples:

```text
Admin changed user role
Admin deactivated account
Admin updated system category
```

Audit logs must be protected from unauthorized modification.

---

# 33. Admin System Management

Authorized administrators can manage permitted system-level information, including:

- Default categories
- System settings
- User roles
- Account statuses
- Notification configuration where supported

---

# 34. Responsive Design

The product must be fully responsive across:

- Desktop
- Laptop
- Tablet
- Mobile

Important financial data must remain usable on small screens.

Tables must have responsive alternatives where necessary.

Forms must be touch-friendly.

Charts must resize correctly.

---

# 35. UI/UX Requirements

FinTrack should use a clean, professional fintech visual language.

## Required design characteristics

- Clean layout
- Consistent spacing
- Strong typography hierarchy
- Clear data visualization
- Restrained color usage
- Accessible contrast
- Consistent components
- Professional forms
- Clear empty states
- Clear loading states
- Clear error states
- Useful confirmation dialogs

## Avoid

- Excessive gradients
- Excessive glassmorphism
- Excessive rounded cards
- Excessive glowing effects
- Random decorative animations
- Generic AI-generated SaaS styling
- Visual clutter

Animations should be subtle and purposeful.

---

# 36. Dark Mode

Theme modes:

- Light
- Dark
- System

Theme selection must persist.

---

# 37. Onboarding

New users should receive a guided onboarding experience.

Suggested steps:

1. Personal information
2. Monthly income
3. Main expense categories
4. First budget
5. First savings goal
6. First account

Onboarding should be skippable where appropriate.

---

# 38. Demo Account

The deployed portfolio version should support a safe demo account where appropriate.

The demo account must:

- Contain fake/sample financial data
- Never contain real personal financial data
- Be clearly separated from real user accounts
- Be safe for public demonstration

---

# 39. Search, Filtering & Pagination Standards

Server-side operations are required where data can grow significantly.

Required capabilities include:

- Search
- Filtering
- Sorting
- Pagination
- Date ranges
- Numeric ranges

The UI must clearly show:

- Current filters
- Active search
- Result count where available
- Empty result state
- Loading state
- Error state

---

# 40. Validation Requirements

All user-provided data must be validated.

Validation applies to:

- Registration
- Login
- Transactions
- Categories
- Budgets
- Accounts
- Savings goals
- Recurring transactions
- Profile information
- File uploads
- Report parameters
- Admin actions

Client-side validation improves UX.

Server-side validation is authoritative.

---

# 41. Error Handling

The product must provide predictable error behavior.

Required states:

- Loading
- Empty
- Success
- Validation error
- Authentication error
- Authorization error
- Not found
- Server error
- Upload error
- Network failure

Errors must not expose sensitive implementation details.

---

# 42. Security Requirements

The product must implement appropriate security controls.

Required controls include:

- bcrypt password hashing
- JWT authentication
- HTTP-only cookies
- Secure cookie configuration
- Authorization middleware
- Role-based access control
- Input validation
- Rate limiting
- Helmet/security headers
- CORS restrictions
- File upload validation
- Ownership checks
- Protected admin routes
- Secure password reset flow
- Environment-based secrets
- No secrets in Git

---

# 43. Data Ownership

A normal user may only access resources they own.

Ownership checks are required for:

- Transactions
- Accounts
- Budgets
- Goals
- Categories
- Recurring transactions
- Notifications
- Receipts
- Reports
- Activity history

A client-provided resource ID must never be trusted without server-side ownership verification.

---

# 44. Performance Requirements

The product should remain responsive as data grows.

Requirements:

- Pagination for large lists
- Appropriate database indexes
- Efficient aggregation queries
- Avoid unnecessary API requests
- Avoid loading all transactions for dashboard calculations
- Lazy-load appropriate frontend areas
- Optimize receipt/file handling
- Avoid duplicate calculations where caching is appropriate

---

# 45. Accessibility Requirements

The UI should follow practical accessibility standards.

Requirements include:

- Keyboard navigation
- Visible focus states
- Accessible labels
- Semantic HTML
- Sufficient contrast
- Form error identification
- Accessible dialogs
- Meaningful icon labels/tooltips
- Charts accompanied by understandable textual information

Color must not be the only indicator of financial status.

---

# 46. Browser/Device Expectations

The application should support modern browsers.

Primary targets:

- Chrome
- Edge
- Firefox
- Safari

Responsive behavior must be tested on:

- Desktop
- Tablet
- Mobile

---

# 47. Non-Goals

The following are explicitly **outside the locked scope**.

## Not included

- External AI APIs
- AI financial advisor
- AI-generated financial recommendations
- Stock portfolio management
- Cryptocurrency portfolio management
- Direct bank account synchronization
- Open banking integration
- Automatic bank transaction imports
- Investment trading
- Loan marketplace
- Insurance marketplace
- Payment processing
- Real-money transfers
- Cryptocurrency transactions

These may be considered future products/features but must not be introduced into the locked implementation scope.

---

# 48. Product Success Criteria

The project is considered product-complete when a normal user can:

1. Register securely.
2. Log in and log out.
3. Recover a forgotten password.
4. Access a protected dashboard.
5. Add income.
6. Add expenses.
7. Search and filter transactions.
8. Manage accounts.
9. Manage categories.
10. Create monthly budgets.
11. Receive budget alerts.
12. Create recurring transactions.
13. Create savings goals.
14. View financial analytics.
15. Receive deterministic financial insights.
16. View the financial calendar.
17. Upload receipts using the Multer-based upload flow.
18. Generate reports.
19. Export reports as CSV/PDF.
20. Export personal data.
21. Manage notifications.
22. Change theme.
23. Manage profile/settings.
24. Delete their account.

The admin must be able to:

1. Log in through secure authentication.
2. Access the protected admin dashboard.
3. View platform statistics.
4. Search/manage users.
5. Activate/deactivate users.
6. Manage authorized roles.
7. Manage permitted system data.
8. Review audit logs.

---

# 49. Quality Bar

FinTrack should not be considered complete merely because every endpoint and page exists.

The final product must provide:

- Consistent UI
- Consistent API behavior
- Correct financial calculations
- Secure ownership enforcement
- Secure authentication
- Correct RBAC
- Responsive layouts
- Useful empty states
- Useful error states
- Appropriate loading states
- Clean validation
- Reliable report generation
- Safe file handling
- Good mobile experience
- Maintainable code structure

---

# 50. Locked Feature Inventory

The following feature inventory is locked for the project.

| # | Feature | Status |
|---:|---|---|
| 1 | User registration | LOCKED |
| 2 | User login | LOCKED |
| 3 | User logout | LOCKED |
| 4 | JWT authentication | LOCKED |
| 5 | HTTP-only authentication cookies | LOCKED |
| 6 | bcrypt password hashing | LOCKED |
| 7 | Forgot password | LOCKED |
| 8 | Reset password | LOCKED |
| 9 | Change password | LOCKED |
| 10 | Protected routes | LOCKED |
| 11 | RBAC | LOCKED |
| 12 | Admin seed | LOCKED |
| 13 | User profile | LOCKED |
| 14 | User settings | LOCKED |
| 15 | Dashboard | LOCKED |
| 16 | Income management | LOCKED |
| 17 | Expense management | LOCKED |
| 18 | Transaction management | LOCKED |
| 19 | Search | LOCKED |
| 20 | Filtering | LOCKED |
| 21 | Sorting | LOCKED |
| 22 | Pagination | LOCKED |
| 23 | Custom categories | LOCKED |
| 24 | Multiple accounts/wallets | LOCKED |
| 25 | Payment method tracking | LOCKED |
| 26 | Monthly budgets | LOCKED |
| 27 | Budget thresholds | LOCKED |
| 28 | Budget alerts | LOCKED |
| 29 | Budget history | LOCKED |
| 30 | Recurring transactions | LOCKED |
| 31 | Savings goals | LOCKED |
| 32 | Savings projections | LOCKED |
| 33 | Expense analytics | LOCKED |
| 34 | Financial insights | LOCKED |
| 35 | Deterministic insight engine | LOCKED |
| 36 | Financial calendar | LOCKED |
| 37 | Receipt uploads | LOCKED |
| 38 | Multer | LOCKED |
| 39 | File validation | LOCKED |
| 40 | Notifications | LOCKED |
| 41 | Smart budget alerts | LOCKED |
| 42 | PDF reports | LOCKED |
| 43 | CSV reports | LOCKED |
| 44 | Personal data export | LOCKED |
| 45 | Account deletion | LOCKED |
| 46 | User activity history | LOCKED |
| 47 | Admin dashboard | LOCKED |
| 48 | Admin user management | LOCKED |
| 49 | Admin audit logs | LOCKED |
| 50 | Admin system management | LOCKED |
| 51 | Dark mode | LOCKED |
| 52 | Responsive UI | LOCKED |
| 53 | Onboarding | LOCKED |
| 54 | Demo account | LOCKED |
| 55 | API validation | LOCKED |
| 56 | Centralized error handling | LOCKED |
| 57 | Security middleware | LOCKED |
| 58 | Database indexing | LOCKED |
| 59 | `.env` configuration | LOCKED |
| 60 | `.env.example` | LOCKED |
| 61 | `.gitignore` | LOCKED |
| 62 | Project documentation | LOCKED |

---

# 51. Source-of-Truth Relationship

This PRD is the primary **product-level source of truth**.

The seven project documents are:

```text
PRD.md
TRD.md
ARCHITECTURE.md
DATABASESCHEMA.md
UI/UX.md
WEBFLOW.md
IMPLEMENTATION.md
```

Their responsibilities are:

- `PRD.md` — What the product must do and why.
- `TRD.md` — Technical requirements and technology constraints.
- `ARCHITECTURE.md` — How the system is structured.
- `DATABASESCHEMA.md` — How data is modeled.
- `UI/UX.md` — How the product looks and behaves from a UX perspective.
- `WEBFLOW.md` — How users/admins move through the application.
- `IMPLEMENTATION.md` — How the project will be built phase by phase.

The implementation must not introduce unapproved product scope.

---

# 52. Scope Lock

**FinTrack v1 scope is LOCKED.**

New features must not be added casually during implementation.

If a genuinely necessary requirement is discovered, the change must be explicitly reviewed and reflected in the appropriate source-of-truth document before implementation.

The project must not introduce external AI services or AI API keys.

All financial insights and intelligent-looking behavior must use deterministic, built-in application logic.

---

# 53. Final Product Definition

FinTrack is a secure, responsive, full-stack personal finance management platform that allows users to track and understand their finances through transactions, budgets, accounts, recurring payments, savings goals, analytics, deterministic financial insights, notifications, receipts, and reports.

The platform includes secure authentication, bcrypt password hashing, JWT-based sessions, RBAC, a seeded administrator, administrative management, audit logging, responsive fintech UI/UX, and professional reporting capabilities.

**This PRD represents the locked product scope for FinTrack v1.**
