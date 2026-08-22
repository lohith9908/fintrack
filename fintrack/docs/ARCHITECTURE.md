# FinTrack — System Architecture Document

**Document:** `ARCHITECTURE.md`  
**Version:** 1.0  
**Status:** Locked / Source of Truth  
**Product:** FinTrack — Personal Finance Management Platform  
**Related Documents:** `PRD.md`, `TRD.md`  
**Date:** 22 August 2026

---

# 1. Document Purpose

This document defines the system architecture for FinTrack.

It describes:

- Overall architecture
- Application boundaries
- Frontend architecture
- Backend architecture
- Database interaction
- Authentication architecture
- Authorization/RBAC
- File upload architecture
- Financial calculation architecture
- Analytics architecture
- Notification architecture
- Reporting architecture
- Admin architecture
- Error handling
- Security boundaries
- Data flow
- Project structure
- Deployment boundaries

This document is the architectural source of truth.

The architecture must remain consistent with:

```text
PRD.md
TRD.md
DATABASESCHEMA.md
UI/UX.md
WEBFLOW.md
IMPLEMENTATION.md
```

---

# 2. Architecture Goals

FinTrack architecture must provide:

1. Clear separation between frontend and backend.
2. Secure authentication and authorization.
3. Strict user data ownership.
4. Maintainable business logic.
5. Efficient MongoDB queries.
6. Reusable frontend components.
7. Deterministic financial analytics.
8. Secure receipt uploads using Multer.
9. Clear administrative boundaries.
10. Testable services and business rules.
11. Responsive application behavior.
12. A structure that can grow without becoming difficult to maintain.

---

# 3. High-Level Architecture

FinTrack uses a layered full-stack web architecture.

```text
                         ┌───────────────────────┐
                         │       Browser         │
                         │   React Web Client    │
                         └───────────┬───────────┘
                                     │
                               HTTPS / HTTP
                                     │
                                     ▼
                         ┌───────────────────────┐
                         │      Express API      │
                         │     Node.js Server    │
                         └───────────┬───────────┘
                                     │
                ┌────────────────────┼────────────────────┐
                │                    │                    │
                ▼                    ▼                    ▼
        ┌───────────────┐    ┌───────────────┐    ┌───────────────┐
        │ Auth / RBAC   │    │ Business      │    │ File Upload   │
        │ Middleware    │    │ Services      │    │ Multer        │
        └───────────────┘    └───────┬───────┘    └───────┬───────┘
                                     │                    │
                                     ▼                    ▼
                              ┌───────────────┐     ┌───────────────┐
                              │   Mongoose    │     │ File Storage  │
                              └───────┬───────┘     └───────────────┘
                                      │
                                      ▼
                              ┌───────────────┐
                              │    MongoDB    │
                              └───────────────┘
```

---

# 4. Architectural Style

The backend follows a layered architecture.

```text
HTTP Request
     ↓
Route
     ↓
Middleware
     ↓
Controller
     ↓
Service / Business Logic
     ↓
Model / Repository Layer
     ↓
MongoDB
```

Cross-cutting concerns:

```text
Authentication
Authorization
Validation
Error Handling
Logging
Configuration
Security
```

---

# 5. Application Boundaries

FinTrack consists of the following major boundaries:

```text
Frontend Application
        │
        │ REST API
        ▼
Backend Application
        │
        ├── Authentication
        ├── User Management
        ├── Transactions
        ├── Categories
        ├── Accounts
        ├── Budgets
        ├── Recurring Transactions
        ├── Savings Goals
        ├── Analytics
        ├── Insights
        ├── Notifications
        ├── Reports
        ├── Uploads
        └── Administration
        │
        ▼
MongoDB
```

---

# 6. Repository Structure

Recommended repository structure:

```text
fintrack/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── features/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── store/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── constants/
│   │   ├── types/
│   │   ├── App.*
│   │   └── main.*
│   │
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── validators/
│   │   ├── utils/
│   │   ├── modules/
│   │   ├── jobs/
│   │   ├── seed/
│   │   ├── constants/
│   │   ├── app.*
│   │   └── server.*
│   │
│   └── package.json
│
├── uploads/
│
├── docs/
│
├── .env
├── .env.example
├── .gitignore
├── README.md
└── package.json
```

The exact extension (`.js` or `.ts`) will be finalized by the implementation setup, but the architectural separation remains unchanged.

---

# 7. Frontend Architecture

The frontend is a React single-page application.

Recommended conceptual structure:

```text
React Application
│
├── Routing
├── Authentication State
├── Layouts
├── Pages
├── Feature Modules
├── Shared Components
├── API Services
├── Global State
├── Hooks
├── Utilities
└── Design System
```

---

# 8. Frontend Feature Modules

Major feature modules:

```text
auth
dashboard
transactions
categories
accounts
budgets
recurringTransactions
savingsGoals
analytics
calendar
notifications
reports
profile
settings
admin
```

Each feature should keep related UI, hooks, API interactions, validation helpers, and state close together where practical.

---

# 9. Frontend Page Architecture

Primary user pages:

```text
/auth/register
/auth/login
/auth/forgot-password
/auth/reset-password

/dashboard
/transactions
/transactions/new
/transactions/:id
/budgets
/accounts
/categories
/recurring
/goals
/calendar
/analytics
/reports
/notifications
/profile
/settings
```

Primary administrative pages:

```text
/admin
/admin/users
/admin/audit-logs
/admin/categories
/admin/settings
```

Exact routing details will be finalized in `WEBFLOW.md`.

---

# 10. Frontend Layouts

Recommended layouts:

```text
AuthLayout
AppLayout
AdminLayout
```

## AuthLayout

Used for:

- Login
- Registration
- Forgot password
- Reset password

## AppLayout

Used for normal authenticated users.

Contains:

- Sidebar/navigation
- Header
- Notification access
- User menu
- Main content area

## AdminLayout

Used only for administrators.

Contains:

- Admin navigation
- Admin header
- Admin-specific actions
- Admin content area

---

# 11. Frontend Authentication State

Authentication state should have three states:

```text
loading
authenticated
unauthenticated
```

Initial application load:

```text
React App
   ↓
Check current session
   ↓
GET /api/auth/me
   ↓
Authenticated?
   ├── Yes → Load user
   └── No  → Unauthenticated
```

The browser must not depend on reading a JWT from localStorage when HTTP-only cookies are used.

---

# 12. Frontend Route Protection

Protected route flow:

```text
User navigates to /dashboard
        ↓
Auth state checked
        ↓
Authenticated?
    ├── No → /auth/login
    └── Yes
         ↓
     Render page
```

Admin route:

```text
User navigates to /admin
        ↓
Authenticated?
        ↓
Role === ADMIN?
   ├── No → Forbidden/redirect
   └── Yes → Admin page
```

Frontend protection is a UX mechanism.

Backend authorization remains the security boundary.

---

# 13. Backend Architecture

Backend application structure:

```text
Express
│
├── Routes
├── Middleware
├── Controllers
├── Services
├── Models
├── Validators
├── Jobs
├── Utilities
├── Configuration
└── Error Handler
```

---

# 14. Route Layer

Routes define:

- HTTP method
- URL
- Middleware
- Controller

Example:

```text
POST /api/transactions
       ↓
authenticateUser
       ↓
validateTransaction
       ↓
transactionController.create
```

Routes should not contain large business-logic blocks.

---

# 15. Middleware Layer

Core middleware:

```text
request parsing
CORS
Helmet
rate limiting
authentication
authorization
validation
upload handling
error handling
```

Middleware should have one clear responsibility where possible.

---

# 16. Controller Layer

Controllers translate HTTP requests into application service calls.

Responsibilities:

- Read request parameters/body
- Invoke appropriate service
- Return response
- Map expected application errors

Controllers should not contain complex financial calculations.

---

# 17. Service Layer

Services contain business logic.

Examples:

```text
AuthService
TransactionService
BudgetService
AccountService
GoalService
RecurringTransactionService
AnalyticsService
InsightService
NotificationService
ReportService
FileService
AdminService
```

Services are the preferred location for complex application behavior.

---

# 18. Model Layer

Mongoose models represent database entities.

Core models:

```text
User
Transaction
Category
Account
Budget
RecurringTransaction
SavingsGoal
Notification
PasswordResetToken
AuditLog
UserActivity
```

Potential system configuration model:

```text
SystemSetting
```

if required.

The complete schema is defined separately in:

```text
DATABASESCHEMA.md
```

---

# 19. Database Architecture

MongoDB stores application data.

Conceptually:

```text
                 MongoDB
                    │
      ┌─────────────┼─────────────┐
      │             │             │
      ▼             ▼             ▼
    Users      Financial Data   System Data
                   │
        ┌──────────┼───────────┐
        │          │           │
        ▼          ▼           ▼
 Transactions   Budgets      Goals
 Accounts       Recurring    Categories
 Notifications  Activity     Audit Logs
```

---

# 20. User Ownership Model

Most financial documents contain a user relationship.

Conceptually:

```text
User
 │
 ├── Transactions
 ├── Accounts
 ├── Categories
 ├── Budgets
 ├── Recurring Transactions
 ├── Savings Goals
 ├── Notifications
 └── Activity History
```

The backend must always enforce ownership.

---

# 21. Authentication Flow

Complete authentication architecture:

```text
                  Register
                     │
                     ▼
              Validate Input
                     │
                     ▼
             Check Existing User
                     │
                     ▼
             bcrypt Password Hash
                     │
                     ▼
               Save User
                     │
                     ▼
              Authentication
```

Login:

```text
Login Request
     ↓
Validate
     ↓
Find User
     ↓
bcrypt.compare()
     ↓
Generate JWT
     ↓
HTTP-only Cookie
     ↓
Authenticated Session
```

---

# 22. Authentication Middleware

Protected request:

```text
HTTP Request
     ↓
Read authentication cookie
     ↓
Verify JWT
     ↓
Extract user identity
     ↓
Check user status
     ↓
Attach authenticated user
     ↓
Next middleware/controller
```

Invalid/expired token:

```text
401 Unauthorized
```

---

# 23. Authorization Middleware

Role-based authorization:

```text
authenticateUser
       ↓
authorizeRole("ADMIN")
       ↓
Admin Controller
```

Normal user:

```text
authenticateUser
       ↓
User Controller
```

Authorization must be enforced server-side.

---

# 24. Admin Architecture

Admin area is logically separated from user features.

```text
                    Backend
                       │
              ┌────────┴────────┐
              │                 │
         User Services      Admin Services
              │                 │
              ▼                 ▼
        User-owned data     Platform data
```

Admin routes must require:

```text
Authentication
+
ADMIN role
```

---

# 25. Admin Seed Architecture

Seed process:

```text
Run seed
   ↓
Read ADMIN_EMAIL
Read ADMIN_PASSWORD
   ↓
Find existing admin
   ↓
Exists?
 ├── Yes → Stop safely
 └── No
      ↓
  bcrypt hash
      ↓
 Create ADMIN
```

The process must be idempotent.

---

# 26. Transaction Architecture

Transaction lifecycle:

```text
Client Form
    ↓
POST /api/transactions
    ↓
Authentication
    ↓
Validation
    ↓
Ownership checks
    ↓
Transaction Service
    ↓
Financial validation
    ↓
Mongoose Model
    ↓
MongoDB
    ↓
Response
```

---

# 27. Transaction Search Architecture

Search/filter flow:

```text
Transaction UI
      ↓
Query parameters
      ↓
GET /api/transactions
      ↓
Validate query
      ↓
Build MongoDB query
      ↓
Apply ownership filter
      ↓
Apply filters
      ↓
Apply search
      ↓
Apply sort
      ↓
Apply pagination
      ↓
MongoDB
      ↓
Paginated response
```

---

# 28. Budget Architecture

Budget calculation:

```text
Budget
  +
User
  +
Category
  +
Month
       ↓
Find qualifying expenses
       ↓
Aggregate spending
       ↓
Compare with budget limit
       ↓
Calculate percentage
       ↓
Determine status
       ↓
Return budget summary
```

---

# 29. Budget Alert Architecture

Budget usage:

```text
Budget Usage
     ↓
Threshold Evaluation
     │
     ├── 50% → Informational
     ├── 75% → Warning
     ├── 90% → Critical
     └── 100%+ → Exceeded
     ↓
Notification Service
     ↓
Notification
```

Alert generation must be deterministic.

---

# 30. Recurring Transaction Architecture

Recurring transactions require controlled processing.

Conceptual flow:

```text
Recurring Transaction
        ↓
Check next occurrence
        ↓
Is due?
   ├── No → Wait
   └── Yes
        ↓
Create transaction
        ↓
Update next occurrence
        ↓
Record processing state
```

The processing mechanism must be idempotent to avoid duplicate transactions.

The exact scheduler/job implementation will be finalized in `IMPLEMENTATION.md`.

---

# 31. Savings Goal Architecture

Goal flow:

```text
Goal
 ↓
Contributions / Savings Data
 ↓
Calculate Current Saved
 ↓
Calculate Progress
 ↓
Calculate Remaining
 ↓
Optional Projection
 ↓
Return Goal Summary
```

Projection must use deterministic calculations.

---

# 32. Analytics Architecture

Analytics must be backend-driven.

```text
Dashboard
    ↓
Analytics API
    ↓
Analytics Service
    ↓
MongoDB Aggregation
    ↓
Normalized Analytics Result
    ↓
Frontend Charts
```

The frontend should focus on presentation.

---

# 33. Analytics Modules

Analytics service may contain functions such as:

```text
getFinancialSummary()
getMonthlyIncomeExpenses()
getExpenseByCategory()
getSpendingTrend()
getSavingsTrend()
getPaymentMethodBreakdown()
getAccountBreakdown()
getAverageDailySpending()
getHighestSpendingDay()
getHighestSpendingCategory()
```

---

# 34. Financial Summary Architecture

Summary:

```text
Income
Expenses
Savings
Savings Rate
```

Calculation:

```text
Savings = Income - Expenses
```

```text
Savings Rate = Savings / Income × 100
```

Zero-income cases must be handled safely.

---

# 35. Insight Engine Architecture

The insight engine is a dedicated internal business-logic component.

```text
Analytics Service
      ↓
Insight Service
      ↓
Rule Registry
      ↓
Rule Evaluation
      ↓
Insight Objects
```

Example rule:

```text
Rule:
MONTH_OVER_MONTH_EXPENSE_INCREASE

Condition:
currentMonthExpenses > previousMonthExpenses

Calculation:
percentageIncrease =
((current - previous) / previous) * 100

Output:
"Your expenses increased by X% compared with last month."
```

---

# 36. Insight Rule Requirements

Each rule should be:

- Deterministic
- Testable
- Independently executable
- Explainable
- Based on user-owned data

No rule may call an external AI API.

---

# 37. Financial Calendar Architecture

Calendar data may be derived from:

```text
Recurring Transactions
Budgets
Goal Deadlines
Expected Income
Upcoming Payments
```

Flow:

```text
Calendar Request
      ↓
Calendar Service
      ↓
Collect relevant financial events
      ↓
Normalize events
      ↓
Sort by date
      ↓
Return calendar data
```

---

# 38. Notification Architecture

Notification flow:

```text
Business Event
     ↓
Notification Rule
     ↓
Notification Service
     ↓
Notification Model
     ↓
User Notification Center
```

Examples:

```text
Budget reaches threshold
Recurring payment approaching
Goal milestone reached
Insight generated
```

---

# 39. Notification Read State

Each notification belongs to a user.

Conceptually:

```text
Notification
├── user
├── type
├── message
├── read
└── createdAt
```

A user may only read/update/delete their own notifications.

---

# 40. File Upload Architecture

Receipt upload flow:

```text
User
 ↓
Transaction Form
 ↓
multipart/form-data
 ↓
Express Route
 ↓
Authentication
 ↓
Multer
 ↓
File Validation
 ↓
File Service
 ↓
Storage Provider
 ↓
Receipt Metadata
 ↓
Transaction Reference
 ↓
MongoDB
```

---

# 41. Multer Responsibility

Multer is responsible for processing incoming multipart file data.

It must not be responsible for:

- User authorization
- Business rules
- Database ownership
- Financial calculations

Those responsibilities belong to middleware/services.

---

# 42. File Storage Abstraction

The application should isolate physical storage.

```text
FileService
     ↓
StorageProvider
     ├── Local Storage
     └── Future compatible provider
```

This prevents transaction logic from becoming tightly coupled to a specific storage mechanism.

---

# 43. Receipt Authorization

Receipt access:

```text
Request receipt
      ↓
Authenticate
      ↓
Find receipt metadata
      ↓
Verify ownership
      ↓
Authorize
      ↓
Return file
```

A receipt must never be accessible only because a user knows/guesses its identifier.

---

# 44. Report Architecture

Report flow:

```text
Reports UI
    ↓
Report Request
    ↓
Report Controller
    ↓
Report Service
    ↓
Analytics / Financial Services
    ↓
Generate Report Data
    ↓
PDF/CSV Generator
    ↓
Response/File
```

Reports must be generated from authoritative backend calculations.

---

# 45. PDF Architecture

PDF generation should use a dedicated service:

```text
PDFReportService
```

It receives normalized report data and produces the PDF.

Financial calculation logic must remain outside the PDF renderer.

---

# 46. CSV Architecture

CSV generation:

```text
Report Data
    ↓
CSV Formatter
    ↓
CSV File/Response
```

CSV formatting must not recalculate financial totals.

---

# 47. User Data Export Architecture

Data export:

```text
User
 ↓
Export Request
 ↓
Authentication
 ↓
Ownership Scope
 ↓
Collect User Data
 ↓
Remove Sensitive Internal Fields
 ↓
Generate Export
 ↓
Return File
```

Never include:

- Password hash
- Reset tokens
- JWT
- Secrets
- Other user data

---

# 48. User Activity Architecture

Activity flow:

```text
User Action
    ↓
Activity Service
    ↓
UserActivity Model
    ↓
Activity History UI
```

Examples:

```text
Added transaction
Updated budget
Created savings goal
Added account
```

Activity logging must not record secrets.

---

# 49. Audit Log Architecture

Administrative activity:

```text
Admin Request
    ↓
Authentication
    ↓
ADMIN Authorization
    ↓
Admin Service
    ↓
Perform Action
    ↓
Create Audit Log
```

Important action and audit record creation should be logically coordinated to avoid misleading audit history.

---

# 50. Error Architecture

Global error handling:

```text
Request
  ↓
Route
  ↓
Middleware
  ↓
Controller
  ↓
Service
  ↓
Error
  ↓
Central Error Handler
  ↓
Safe API Response
```

Errors should have categories such as:

```text
ValidationError
AuthenticationError
AuthorizationError
NotFoundError
ConflictError
FileUploadError
DatabaseError
ApplicationError
```

---

# 51. Security Architecture

Security layers:

```text
                 Internet
                    │
                    ▼
             HTTPS / TLS
                    │
                    ▼
               Express
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
      CORS       Helmet      Rate Limit
        │           │           │
        └───────────┼───────────┘
                    ▼
             Authentication
                    │
                    ▼
             Authorization
                    │
                    ▼
               Validation
                    │
                    ▼
             Business Logic
                    │
                    ▼
                Database
```

---

# 52. Data Security Boundaries

Sensitive information includes:

- Password hashes
- JWT/authentication data
- Password reset tokens
- Personal information
- Financial transaction data
- Receipt files
- Administrative information

Sensitive fields must be protected from:

- API responses
- Logs
- Frontend state
- Unauthorized users
- Git repository

---

# 53. Database Access Rules

Only backend services may access MongoDB.

The frontend must never connect directly to MongoDB.

Correct:

```text
React
 ↓
Express API
 ↓
Mongoose
 ↓
MongoDB
```

Incorrect:

```text
React
 ↓
MongoDB
```

---

# 54. Database Query Rules

Database queries must:

- Include ownership constraints
- Use indexes where appropriate
- Avoid unnecessary fields
- Avoid unbounded queries
- Use pagination for large collections
- Use aggregation for analytical workloads where appropriate

---

# 55. API Request Flow

Normal authenticated request:

```text
Browser
   ↓
Axios
   ↓
Express
   ↓
CORS/Helmet/etc.
   ↓
Authentication
   ↓
Authorization
   ↓
Validation
   ↓
Controller
   ↓
Service
   ↓
Mongoose
   ↓
MongoDB
   ↓
Service
   ↓
Controller
   ↓
JSON Response
   ↓
React
```

---

# 56. Dashboard Request Flow

```text
Dashboard loads
      ↓
Auth state confirmed
      ↓
Request dashboard summary
      ↓
Request analytics
      ↓
Request recent transactions
      ↓
Request budget status
      ↓
Request goals
      ↓
Request notifications/insights
      ↓
Render dashboard
```

Requests should be coordinated to avoid unnecessary duplication.

Where practical, a dashboard endpoint may aggregate multiple summary requirements, while detailed modules retain separate endpoints.

---

# 57. Admin Dashboard Request Flow

```text
Admin loads /admin
       ↓
Auth check
       ↓
Role check
       ↓
Admin dashboard API
       ↓
Admin Service
       ↓
Aggregations
       ↓
MongoDB
       ↓
Safe admin statistics
       ↓
Admin UI
```

---

# 58. State Ownership

The architecture distinguishes:

## Client state

Examples:

- Theme
- Sidebar state
- Modal state
- Form state
- Temporary UI state

## Server state

Examples:

- Transactions
- Budgets
- Goals
- Accounts
- Notifications
- User profile

Server state should remain authoritative on the backend.

---

# 59. Caching Strategy

Caching is optional and should only be introduced where it provides measurable value.

The first implementation should prioritize:

- Correctness
- Database indexes
- Efficient aggregation
- Pagination

Caching must never cause stale financial information to be presented incorrectly.

---

# 60. Background Processing

Background processing may be used for:

- Recurring transaction processing
- Scheduled notifications
- Other time-based tasks

The architecture must ensure:

- Idempotency
- Failure handling
- Retry strategy where appropriate
- No duplicate financial transactions

The exact scheduler implementation is deferred to `IMPLEMENTATION.md`.

---

# 61. Recurring Processing Idempotency

Recurring processing must prevent:

```text
Same recurring event
+
Same occurrence
=
Duplicate transaction
```

A processing mechanism must have a reliable way to determine whether an occurrence has already been processed.

The database schema should support the required uniqueness/idempotency strategy.

---

# 62. Email Architecture

Email functionality is primarily required for password recovery and may support selected notifications where implemented.

Conceptual flow:

```text
Application
    ↓
Email Service
    ↓
Nodemailer
    ↓
SMTP Provider
```

SMTP credentials must come from environment configuration.

No email credential may be committed.

---

# 63. API Layer Separation

The frontend should not know database implementation details.

For example:

Frontend should request:

```text
GET /api/dashboard/summary
```

not construct MongoDB queries.

Backend owns:

- Query logic
- Aggregations
- Business rules
- Authorization

---

# 64. Financial Calculation Ownership

All authoritative financial calculations belong to backend services.

Examples:

- Total income
- Total expenses
- Savings
- Savings rate
- Budget usage
- Category percentages
- Goal progress
- Trend percentages

The frontend may calculate display-only values, but the backend remains authoritative for financial business logic.

---

# 65. Currency Architecture

The application should support a user-configurable currency.

The default product experience uses:

```text
INR (₹)
```

Currency configuration must be user-aware.

Formatting should be centralized rather than duplicated across components.

---

# 66. UI Design Architecture

The UI uses a reusable design system.

Conceptual structure:

```text
Design Tokens
     ↓
UI Primitives
     ↓
Shared Components
     ↓
Feature Components
     ↓
Pages
```

Examples:

```text
Button
Input
Card
Modal
Table
Badge
Progress
ChartContainer
FormField
```

Detailed visual requirements are defined in:

```text
UI/UX.md
```

---

# 67. Responsive Architecture

The UI must adapt by layout rather than simply shrinking desktop content.

Desktop:

```text
Sidebar + Main Content
```

Tablet:

```text
Compact Navigation + Main Content
```

Mobile:

```text
Top Bar / Drawer / Bottom Navigation
+
Stacked Content
```

The exact breakpoints and responsive rules are defined in `UI/UX.md`.

---

# 68. Frontend Error Boundary

The frontend should use an application-level error boundary for unexpected rendering errors.

Unexpected UI errors must show a safe recovery interface rather than a blank page.

---

# 69. Observability

The architecture should make it possible to diagnose:

- API errors
- Database errors
- Authentication problems
- Upload failures
- Background processing failures
- Report generation failures

Logging must remain privacy-conscious.

---

# 70. Deployment Architecture

Conceptual production deployment:

```text
                  Internet
                     │
                     ▼
              Frontend Hosting
                     │
                     │ HTTPS
                     ▼
              Backend Hosting
                     │
            ┌────────┼────────┐
            │        │        │
            ▼        ▼        ▼
        MongoDB   File Store SMTP
```

The exact hosting providers are intentionally not locked in this architecture document.

---

# 71. Local Development Architecture

Local development:

```text
Browser
   │
   ├── React/Vite Dev Server
   │
   └── Express Dev Server
             │
             ▼
        Local/Cloud MongoDB
             │
             ▼
       MongoDB Compass
```

Multer may store development uploads in a controlled local upload directory.

---

# 72. Environment Separation

Configuration should distinguish:

```text
development
test
production
```

Environment variables must determine environment-specific behavior.

---

# 73. Build Architecture

Frontend:

```text
React Source
    ↓
Vite Build
    ↓
Production Assets
```

Backend:

```text
Node/Express Source
    ↓
Production Runtime
```

If TypeScript is selected during implementation:

```text
TypeScript
    ↓
Compiler/Build
    ↓
Node Runtime
```

---

# 74. Testing Architecture

Testing layers:

```text
Unit Tests
    ↓
Service/Business Logic Tests
    ↓
Integration Tests
    ↓
API Tests
    ↓
Frontend Tests
    ↓
End-to-End Validation
```

Priority test areas:

- Authentication
- RBAC
- Ownership
- Financial calculations
- Budget calculations
- Insight rules
- File upload security
- Admin operations

---

# 75. Test Data Isolation

Test data must be isolated from development/production data.

Tests must not accidentally modify real user financial records.

---

# 76. Failure Handling

The architecture must handle failures gracefully.

Examples:

## MongoDB unavailable

```text
API
 ↓
Database failure
 ↓
Central error handler
 ↓
Safe 500 response
```

## File upload failure

```text
Upload
 ↓
Failure
 ↓
Clean temporary state where applicable
 ↓
Safe error response
```

## Email failure

Password-reset/email workflows must handle email service failures without exposing sensitive information.

---

# 77. Security Failure Handling

Security failures should default to denial.

Examples:

```text
No token → deny
Invalid token → deny
Expired token → deny
Wrong role → deny
Wrong owner → deny
Invalid file → deny
Invalid input → deny
```

---

# 78. Architecture Anti-Patterns

The following should be avoided:

## Frontend directly accessing MongoDB

Not allowed.

## Business logic inside React components

Avoid.

## Business logic inside Express route definitions

Avoid.

## Trusting client-provided user IDs

Not allowed for ownership decisions.

## Storing passwords in plaintext

Not allowed.

## Storing JWT in localStorage as the primary auth mechanism

Not permitted for the locked authentication architecture.

## Returning entire database documents blindly

Avoid.

## Unbounded transaction queries

Not allowed.

## AI API for financial insights

Not allowed.

---

# 79. Dependency Direction

Preferred dependency direction:

```text
Routes
  ↓
Controllers
  ↓
Services
  ↓
Models/Database
```

Utilities should remain reusable and low-level.

Business services should not depend on React components.

Database models should not depend on HTTP request objects.

---

# 80. Module Boundaries

Recommended backend modules:

```text
auth
users
transactions
categories
accounts
budgets
recurringTransactions
goals
analytics
insights
notifications
calendar
reports
uploads
admin
```

A feature module may contain:

```text
controller
service
validator
routes
tests
```

depending on the final organization.

---

# 81. Configuration Boundary

All configuration should be centralized.

Examples:

```text
database config
JWT config
security config
upload config
email config
application config
```

Business logic should not directly read `process.env` throughout the application.

---

# 82. Constants Boundary

System constants should be centralized.

Examples:

```text
USER_ROLES
TRANSACTION_TYPES
PAYMENT_METHODS
BUDGET_THRESHOLDS
SUPPORTED_FILE_TYPES
NOTIFICATION_TYPES
```

This avoids duplicated magic strings.

---

# 83. Financial Insight Rule Registry

A centralized rule registry is recommended:

```text
InsightRules
├── budgetThreshold
├── expenseIncrease
├── expenseDecrease
├── savingsIncrease
├── savingsDecrease
├── categoryConcentration
├── paymentMethodConcentration
└── goalProgress
```

Each rule should be independently testable.

---

# 84. Security Boundary Diagram

```text
                    CLIENT
                      │
                      ▼
              HTTPS / Browser
                      │
                      ▼
                 Express API
                      │
             ┌────────┴────────┐
             ▼                 ▼
     Authentication       Input Validation
             │                 │
             └────────┬────────┘
                      ▼
                 Authorization
                      │
              ┌───────┴───────┐
              ▼               ▼
            USER            ADMIN
              │               │
              └───────┬───────┘
                      ▼
                Business Logic
                      │
                      ▼
                   MongoDB
```

---

# 85. Data Flow: Add Expense

```text
User
 ↓
Expense Form
 ↓
Client validation
 ↓
POST /api/transactions
 ↓
Authentication
 ↓
Authorization
 ↓
Server validation
 ↓
Verify category ownership
 ↓
Verify account ownership
 ↓
Transaction Service
 ↓
Save transaction
 ↓
Optional receipt reference
 ↓
MongoDB
 ↓
Response
 ↓
Update transaction UI
 ↓
Refresh affected analytics
```

---

# 86. Data Flow: Dashboard

```text
Dashboard
 ↓
Authenticated session
 ↓
Dashboard API
 ├── Summary
 ├── Analytics
 ├── Recent Transactions
 ├── Budget Status
 ├── Goals
 ├── Notifications
 └── Insights
 ↓
Backend Services
 ↓
MongoDB Aggregations/Queries
 ↓
Normalized Response
 ↓
Dashboard Components
```

---

# 87. Data Flow: Budget Warning

```text
Transaction created
      ↓
Budget data queried/calculated
      ↓
Budget usage percentage
      ↓
Threshold crossed?
      ↓
Yes
      ↓
Notification Service
      ↓
Create Notification
      ↓
User Notification Center
```

The exact trigger strategy may be event-driven or calculated on demand depending on the implementation phase.

---

# 88. Data Flow: Receipt

```text
Transaction Form
      ↓
multipart/form-data
      ↓
Multer
      ↓
File Validation
      ↓
Storage
      ↓
Receipt Metadata
      ↓
Transaction Reference
      ↓
MongoDB
```

---

# 89. Data Flow: Report

```text
Reports Page
      ↓
Select report/date
      ↓
POST/GET report request
      ↓
Authentication
      ↓
Ownership scope
      ↓
Report Service
      ↓
Analytics Services
      ↓
Report Data
      ↓
PDF/CSV Generator
      ↓
Download
```

---

# 90. Data Flow: Admin User Management

```text
Admin UI
 ↓
Admin API
 ↓
Authentication
 ↓
ADMIN authorization
 ↓
Validation
 ↓
Admin Service
 ↓
User Model
 ↓
MongoDB
 ↓
Audit Log
 ↓
Response
```

---

# 91. Source-of-Truth Relationship

The architecture is governed by:

```text
PRD.md
```

Technical requirements are governed by:

```text
TRD.md
```

Database details are governed by:

```text
DATABASESCHEMA.md
```

UI behavior is governed by:

```text
UI/UX.md
```

Navigation/user flows are governed by:

```text
WEBFLOW.md
```

Implementation sequence is governed by:

```text
IMPLEMENTATION.md
```

If a technical architecture decision conflicts with the PRD, the conflict must be resolved explicitly rather than silently changing product behavior.

---

# 92. Architecture Change Policy

Architecture should not change casually after implementation begins.

A change should be made only when:

- A security requirement requires it.
- A technical constraint makes the existing architecture infeasible.
- A critical scalability/reliability issue is identified.
- A dependency becomes unsupported or unsafe.
- A source-of-truth requirement is formally changed.

Any approved architectural change must update:

- `ARCHITECTURE.md`
- Relevant technical/database/UI/implementation documents

as applicable.

---

# 93. Final Architecture

The locked FinTrack architecture is:

```text
┌───────────────────────────────────────────────────────────┐
│                        FINTRACK                           │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                 React Frontend                     │  │
│  │                                                     │  │
│  │  Auth │ Dashboard │ Transactions │ Budgets        │  │
│  │  Goals │ Accounts │ Analytics │ Reports           │  │
│  │  Calendar │ Notifications │ Profile │ Admin      │  │
│  └───────────────────────┬─────────────────────────────┘  │
│                          │                                 │
│                       REST API                             │
│                          │                                 │
│  ┌───────────────────────▼─────────────────────────────┐  │
│  │                 Express / Node.js                  │  │
│  │                                                     │  │
│  │ Auth │ RBAC │ Validation │ Controllers             │  │
│  │ Services │ Analytics │ Insights │ Reports           │  │
│  │ Notifications │ Uploads │ Admin │ Error Handling   │  │
│  └───────────────────────┬─────────────────────────────┘  │
│                          │                                 │
│                       Mongoose                            │
│                          │                                 │
│  ┌───────────────────────▼─────────────────────────────┐  │
│  │                    MongoDB                         │  │
│  │                                                     │  │
│  │ Users │ Transactions │ Accounts │ Budgets          │  │
│  │ Goals │ Categories │ Recurring │ Notifications    │  │
│  │ Audit Logs │ Activities │ Reset Tokens             │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                           │
│  File Upload: Multer → Storage                           │
│  Email: Nodemailer → SMTP                                │
│  Insights: Internal deterministic rules                  │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

---

# 94. Final Architectural Rules

The following rules are locked:

1. React never connects directly to MongoDB.
2. Backend is authoritative for financial calculations.
3. Backend is authoritative for authorization.
4. User ownership must be verified server-side.
5. JWT authentication uses HTTP-only cookies.
6. Passwords use bcrypt hashing.
7. Admin is created through an idempotent seed.
8. Receipt uploads use Multer.
9. File access requires authorization.
10. Financial insights use built-in deterministic logic only.
11. No AI API is permitted.
12. Large transaction lists use server-side pagination.
13. Analytics are calculated through backend services.
14. Controllers should remain thin.
15. Business logic belongs in services/rules.
16. Database access belongs behind the backend.
17. Sensitive fields must never be returned unnecessarily.
18. `.env` must never be committed.
19. Production security settings must be enabled.
20. Architecture changes must be reflected in source-of-truth documentation.

---

# 95. Architecture Scope Lock

This document defines the locked architecture for FinTrack v1.

The architecture is intentionally designed to support the complete feature scope while remaining understandable and implementable as a portfolio-level full-stack project.

No external AI service is part of the architecture.

All intelligent-looking financial behavior is implemented using deterministic internal business logic.

**`ARCHITECTURE.md` is the architectural source of truth for FinTrack v1.**
