# FinTrack — Technical Requirements Document (TRD)

**Document:** `TRD.md`  
**Version:** 1.0  
**Status:** Locked / Source of Truth  
**Product:** FinTrack — Personal Finance Management Platform  
**Related Product Document:** `PRD.md`  
**Date:** 22 August 2026

---

# 1. Document Purpose

This Technical Requirements Document defines the technical standards, technology stack, engineering constraints, application requirements, security requirements, API requirements, development standards, and operational expectations for FinTrack.

`PRD.md` defines **what the product must do**.

`TRD.md` defines the **technical requirements and constraints used to build it**.

The implementation must comply with both documents.

---

# 2. Technical Objectives

FinTrack must be built as a maintainable, secure, responsive full-stack web application.

The technical implementation must prioritize:

- Security
- Maintainability
- Separation of concerns
- Strong data ownership
- API consistency
- Responsive frontend architecture
- Efficient database access
- Reliable financial calculations
- Clear validation
- Testability
- Scalability appropriate for a portfolio/production-style application

---

# 3. Locked Technology Stack

## 3.1 Frontend

The frontend stack is:

- React
- Vite
- JavaScript/TypeScript according to the final project setup
- React Router
- Tailwind CSS
- shadcn/ui
- Zustand or Redux Toolkit for global state where required
- Axios for HTTP communication
- Recharts for data visualization
- Framer Motion for controlled UI transitions
- Lucide React for icons

The frontend must not contain business-critical authorization logic as a security boundary.

---

# 4. Backend Stack

The backend stack is:

- Node.js
- Express.js
- JavaScript/TypeScript according to the final project setup
- Mongoose
- MongoDB
- JWT
- bcrypt
- Multer
- Zod or Joi for validation
- Helmet
- CORS
- Rate limiting middleware
- Nodemailer for email functionality where configured

The backend is authoritative for:

- Authentication
- Authorization
- Financial calculations
- Ownership validation
- Input validation
- File authorization
- Report generation
- Administrative operations

---

# 5. Database

## 5.1 Database Technology

MongoDB is the primary database.

Mongoose is the application ODM.

MongoDB Compass may be used for:

- Inspecting collections
- Viewing documents
- Debugging data
- Creating indexes during development when appropriate
- Database administration during development

The application itself must connect through the configured MongoDB connection string.

---

# 6. No AI Integration Requirement

This project must not use any external AI API.

The application must not require:

- OpenAI API keys
- Gemini API keys
- Claude API keys
- AI model endpoints
- AI-generated financial recommendations
- External AI inference services

## 6.1 Deterministic Logic

All financial insights must be generated through internal application logic.

Examples:

```text
Current month expense > previous month expense
→ "Your expenses increased compared with last month."
```

```text
Budget usage >= 90%
→ Critical budget warning
```

```text
Savings this month > previous month
→ Positive savings insight
```

```text
Category amount / total expense × 100
→ Category percentage
```

No AI service may be introduced to implement these capabilities.

---

# 7. Runtime Configuration

Configuration must be provided through environment variables.

Required environment configuration may include:

```env
NODE_ENV=
PORT=
MONGO_URI=

JWT_SECRET=
JWT_EXPIRES_IN=

BCRYPT_SALT_ROUNDS=

CLIENT_URL=

ADMIN_EMAIL=
ADMIN_PASSWORD=

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=

UPLOAD_DIR=
MAX_FILE_SIZE=

```

The exact variables may be refined during implementation, but secrets must not be hardcoded.

No AI API keys are permitted.

---

# 8. Environment Files

The repository must contain:

```text
.env
.env.example
.gitignore
```

## `.env`

Contains actual local/deployment secrets.

Must never be committed.

## `.env.example`

Contains variable names and safe example values/placeholders.

Must not contain real secrets.

## `.gitignore`

Must exclude at minimum:

```text
node_modules/
.env
.env.local
.env.*.local
dist/
build/
uploads/
*.log
.DS_Store
```

Additional generated files may be ignored where appropriate.

---

# 9. Authentication Architecture

Authentication uses JWT.

The preferred authentication transport is an HTTP-only cookie.

## 9.1 Login Flow

```text
Client
  ↓
POST /api/auth/login
  ↓
Validate credentials
  ↓
Find user
  ↓
Compare password using bcrypt
  ↓
Create JWT
  ↓
Set HTTP-only cookie
  ↓
Return safe user/session response
```

The password must never be returned to the client.

---

# 10. Password Requirements

Passwords must be hashed with bcrypt before persistence.

The application must never store:

```text
password: "MyPassword123"
```

Instead, it stores a bcrypt hash.

Example conceptual structure:

```text
passwordHash: "$2b$..."
```

The exact bcrypt cost factor must be configurable through environment configuration or a centralized security configuration.

Recommended default:

```text
BCRYPT_SALT_ROUNDS=12
```

---

# 11. JWT Requirements

JWT must be used for authentication.

JWT payload should contain only necessary identity/authorization information.

Do not place sensitive financial information inside JWT payloads.

The token must have an expiration.

The backend must verify:

- Signature
- Expiration
- Required claims
- User existence/status where appropriate

JWT secrets must come from environment configuration.

---

# 12. HTTP-Only Cookie Requirements

Authentication cookies should use appropriate security flags.

Production configuration should support:

```text
httpOnly
secure
sameSite
```

The exact `sameSite` configuration must account for frontend/backend deployment architecture.

The client must not need to read the JWT directly from JavaScript.

---

# 13. Authorization and RBAC

The backend must implement role-based access control.

Roles:

```text
USER
ADMIN
```

Authentication answers:

> Who is the user?

Authorization answers:

> What is the user allowed to do?

These must remain separate concerns.

---

# 14. Ownership Security

Every user-owned resource must be checked on the backend.

Protected resources include:

- Transactions
- Accounts
- Categories
- Budgets
- Recurring transactions
- Savings goals
- Notifications
- Receipts
- Reports
- Activity history

A request such as:

```text
GET /api/transactions/:id
```

must not return a transaction merely because the ID exists.

The backend must verify that:

```text
transaction.userId === authenticatedUser.id
```

or apply the appropriate ownership relationship.

---

# 15. Admin Seed Requirements

A seed script must create the default administrator.

Requirements:

1. Read admin email from environment configuration.
2. Read admin password from environment configuration.
3. Check whether the admin already exists.
4. If it exists, do not create a duplicate.
5. If it does not exist, hash the password with bcrypt.
6. Create the admin with `ADMIN` role.
7. Report the result safely.

The seed must be idempotent.

The administrator must not be created through normal public registration.

---

# 16. Password Reset Requirements

Password reset must use a secure, expiring token.

Recommended flow:

```text
Forgot password
      ↓
Generate random reset token
      ↓
Hash token for storage
      ↓
Store expiration
      ↓
Send reset URL/instructions
      ↓
User submits token
      ↓
Validate token + expiration
      ↓
Hash new password
      ↓
Update password
      ↓
Invalidate token
```

Raw reset tokens should not be stored permanently in plaintext.

The reset endpoint must prevent:

- Expired token reuse
- Invalid token reuse
- Multiple successful uses of the same token

---

# 17. Backend Architecture Requirements

Backend code must be organized by responsibility.

Recommended separation:

```text
Routes
  ↓
Controllers
  ↓
Services
  ↓
Models / Database
```

Cross-cutting concerns:

```text
Middleware
Validators
Utilities
Configuration
Error handling
```

Controllers should remain relatively thin.

Business logic should be placed in services or dedicated business-logic modules where appropriate.

---

# 18. API Architecture

FinTrack uses a REST-style API.

Base prefix:

```text
/api
```

Primary resources:

```text
/api/auth
/api/users
/api/transactions
/api/categories
/api/accounts
/api/budgets
/api/goals
/api/recurring-transactions
/api/notifications
/api/analytics
/api/reports
/api/admin
```

---

# 19. API Naming Standards

Use resource-oriented endpoints.

Examples:

```text
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/forgot-password
POST   /api/auth/reset-password

GET    /api/transactions
POST   /api/transactions
GET    /api/transactions/:id
PATCH  /api/transactions/:id
DELETE /api/transactions/:id

GET    /api/budgets
POST   /api/budgets
GET    /api/budgets/:id
PATCH  /api/budgets/:id
DELETE /api/budgets/:id
```

Exact endpoint inventory will be finalized in the architecture/API implementation documentation.

---

# 20. HTTP Methods

Use HTTP methods consistently.

```text
GET     Read
POST    Create
PATCH   Partial update
PUT     Full replacement where necessary
DELETE  Delete
```

Do not use `POST` for every operation when a more appropriate HTTP method exists.

---

# 21. API Response Standard

API responses should follow a consistent structure.

Successful response concept:

```json
{
  "success": true,
  "message": "Transaction created successfully",
  "data": {}
}
```

Error response concept:

```json
{
  "success": false,
  "message": "Unable to create transaction",
  "errors": []
}
```

The exact response schema will be standardized during API architecture implementation.

---

# 22. HTTP Status Codes

Use meaningful status codes.

Common examples:

```text
200 OK
201 Created
204 No Content
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
429 Too Many Requests
500 Internal Server Error
```

Do not return `200` for every error.

---

# 23. Validation

Validation must exist on the backend for all externally supplied data.

Validation applies to:

- Registration
- Login
- Profile
- Transactions
- Categories
- Accounts
- Budgets
- Savings goals
- Recurring transactions
- Notifications/preferences
- Password changes
- Password reset
- File uploads
- Reports
- Admin actions

The frontend may perform validation for UX, but backend validation is authoritative.

---

# 24. Financial Data Validation

Financial amounts must be validated.

Requirements:

- Amount must be numeric.
- Amount must be greater than zero for transaction amounts.
- Budget amounts must be valid positive monetary values.
- Goal target amounts must be valid positive monetary values.
- Invalid numeric values must be rejected.
- Unexpected `NaN`, `Infinity`, or malformed numeric input must be rejected.

Financial calculations must avoid JavaScript floating-point errors where practical.

For monetary calculations, the implementation should use a consistent precision strategy, such as storing monetary values in the smallest supported currency unit or applying a clearly defined decimal strategy.

The final database strategy will be defined in `DATABASESCHEMA.md`.

---

# 25. Date and Time Requirements

All dates must be handled consistently.

The application must distinguish between:

- Stored timestamps
- User-selected transaction dates
- Recurring transaction dates
- Budget periods
- Goal target dates

User timezone preferences must be respected for display and date-sensitive operations.

The backend must avoid ambiguous date parsing.

---

# 26. Transaction Requirements

Transactions must support:

```text
amount
type
category
description
date
paymentMethod
account
notes
receipt
user
createdAt
updatedAt
```

Supported types:

```text
income
expense
```

Transactions must belong to a user.

---

# 27. Transaction Query Requirements

Transaction APIs must support server-side:

- Search
- Filtering
- Sorting
- Pagination
- Date ranges
- Amount ranges

Example conceptual query:

```text
GET /api/transactions
  ?type=expense
  &category=food
  &paymentMethod=upi
  &minAmount=500
  &maxAmount=5000
  &startDate=2026-08-01
  &endDate=2026-08-31
  &search=amazon
```

Query parameters must be validated and sanitized.

---

# 28. Pagination Requirements

Large collections must not be returned without limits.

Pagination must provide enough metadata for the frontend, such as:

```text
page
limit
total
totalPages
hasNextPage
hasPreviousPage
```

The exact response structure will be finalized during API design.

Maximum page size should be enforced server-side.

---

# 29. Database Indexing Requirements

Indexes must be created based on actual query patterns.

Likely indexed fields include combinations involving:

- User ID
- Transaction date
- Transaction type
- Category
- Account
- Created date
- Notification read status
- Recurring transaction next occurrence
- Password reset token hash
- User email

Indexes must be documented in `DATABASESCHEMA.md`.

Indexes must not be added indiscriminately.

---

# 30. Dashboard Analytics Requirements

Dashboard calculations should be performed efficiently.

Avoid:

```text
Load every transaction into React
↓
Calculate everything in browser
```

Prefer:

```text
Frontend
 ↓
Analytics API
 ↓
Backend aggregation/business logic
 ↓
MongoDB
 ↓
Aggregated response
```

MongoDB aggregation pipelines should be used where appropriate.

---

# 31. Financial Insight Engine

Financial insights must be implemented as deterministic business logic.

Suggested architecture:

```text
Analytics Data
      ↓
Insight Rules
      ↓
Rule Evaluation
      ↓
Insight Objects
      ↓
API Response
      ↓
Frontend
```

Each rule should have:

- Rule identifier
- Conditions
- Calculation
- Message template
- Severity/type
- Optional priority

Example:

```text
RULE_BUDGET_90_PERCENT
```

Condition:

```text
budgetUsed >= 0.90
```

Output:

```text
"You have used 90% of your Food budget."
```

No external AI service is allowed.

---

# 32. Recurring Transaction Requirements

Recurring transactions must support:

- Frequency
- Next occurrence
- Start date
- End date
- Active/inactive state

The recurring transaction engine must avoid duplicate transaction creation.

Any automatic processing mechanism must be idempotent.

The exact scheduler/background execution mechanism will be defined in `ARCHITECTURE.md` and `IMPLEMENTATION.md`.

---

# 33. Budget Calculation Requirements

Budget usage must be derived from qualifying transactions for:

- User
- Category
- Budget month/year
- Expense type

Example:

```text
budgetUsed =
sum(expenses matching user + category + budget period)
```

Budget percentage:

```text
percentage =
(budgetUsed / budgetLimit) * 100
```

The implementation must safely handle:

```text
budgetLimit = 0
```

without division errors.

---

# 34. Savings Calculation Requirements

Savings should be based on a clearly defined calculation.

Default monthly savings concept:

```text
Savings = Total Income - Total Expenses
```

Savings rate:

```text
Savings Rate =
(Savings / Total Income) × 100
```

If income is zero, the system must avoid division by zero and use an explicitly defined display behavior.

---

# 35. Savings Goal Requirements

Goals must maintain:

- Target amount
- Current saved amount
- Target date
- Contributions

Progress:

```text
progress =
(currentSaved / targetAmount) * 100
```

The value must be capped appropriately for UI presentation if it exceeds 100%.

---

# 36. Account Balance Requirements

Account balances must be calculated consistently.

The implementation must define how:

- Opening balance
- Income transactions
- Expense transactions
- Transfers if supported
- Credit card balances

affect the account balance.

Any future account-transfer behavior must follow the final database/business rules.

---

# 37. File Upload Requirements

Multer is mandatory for receipt uploads.

The upload system must include:

- Authentication check
- Ownership check
- File type validation
- File size validation
- Safe file naming
- Controlled storage location
- Metadata persistence
- Delete/replace behavior

The server must not trust the original filename or MIME type alone.

File access must be authorized.

Users must not be able to retrieve another user's private receipt by guessing a file path or ID.

---

# 38. File Storage Strategy

The initial technical design should support a storage abstraction.

Conceptually:

```text
ReceiptService
      ↓
StorageProvider
      ↓
LocalStorage / Deployment Storage
```

Multer handles incoming files.

The storage implementation may initially use local storage for development, while the architecture should avoid tightly coupling business logic to a specific physical storage implementation.

The final deployment storage decision must be documented before production deployment.

---

# 39. File Limits

File upload limits must be configurable.

Example configuration:

```env
MAX_FILE_SIZE=
```

The exact maximum size will be defined during implementation.

Oversized files must be rejected before unnecessary processing.

---

# 40. Notifications

Notifications must be stored as application data associated with a user.

They should support:

- Type
- Message
- Read/unread state
- Created timestamp
- Optional metadata

The notification system must not expose another user's notifications.

---

# 41. Reports

Reports must be generated from authoritative backend data.

The frontend should request a report rather than independently calculating financial totals.

PDF generation must use a server-side PDF generation approach.

CSV generation must use a structured CSV generation approach.

Exports must respect:

- User ownership
- Selected date range
- Selected report type
- Current financial data

---

# 42. Data Export

Personal data exports must only include data owned by the authenticated user.

The export process must not accidentally include:

- Password hashes
- JWTs
- Reset tokens
- Internal security fields
- Other users' information
- Admin-only information

---

# 43. Admin Requirements

Admin routes must have both:

```text
Authentication
+
ADMIN authorization
```

Example:

```text
authenticateUser
        ↓
authorizeRole("ADMIN")
        ↓
adminController
```

Frontend route guards are supplementary only.

---

# 44. Admin Audit Logging

Important administrative actions must create audit log records.

Examples:

- Role changes
- User activation/deactivation
- System category changes
- Important administrative configuration changes

Audit logging must not expose passwords, tokens, or other secrets.

---

# 45. Error Handling Architecture

The backend must use centralized error handling.

Conceptual flow:

```text
Route
 ↓
Controller
 ↓
Service
 ↓
Error
 ↓
Central Error Middleware
 ↓
Standard API Response
```

Operational errors must be logged appropriately.

Internal stack traces must not be returned to end users in production.

---

# 46. Logging

The application should use structured application logging where appropriate.

Logs should help diagnose:

- Server startup
- Database connection
- Authentication failures where safe
- Application errors
- File upload failures
- Background processing failures
- Administrative actions where audit logs are insufficient

Logs must not contain:

- Passwords
- JWT secrets
- Reset tokens
- Full authentication cookies
- Sensitive financial information unnecessarily

---

# 47. Security Middleware

Backend security should include appropriate middleware for:

- Helmet/security headers
- CORS
- Rate limiting
- Request body limits
- Validation
- Authentication
- Authorization
- File validation

Security configuration must differ appropriately between development and production where necessary.

---

# 48. CORS Requirements

CORS must be configured using trusted frontend origins.

The backend must not use unrestricted wildcard CORS in a credentialed production authentication configuration.

The frontend origin should be configured through environment variables.

---

# 49. Rate Limiting

Rate limiting must be applied to sensitive endpoints.

Priority endpoints:

- Login
- Registration
- Forgot password
- Reset password
- Other authentication-sensitive routes

Limits should be configurable.

---

# 50. Request Body Limits

The backend must apply appropriate request body size limits.

File uploads should have separate size controls.

The application must not accept unlimited request bodies.

---

# 51. Frontend Authentication Requirements

The frontend must maintain authentication state through an application-level auth store/context.

It should be able to represent:

```text
loading
authenticated
unauthenticated
```

Protected routes must redirect unauthenticated users appropriately.

The frontend must not treat local storage as the source of truth for the JWT when HTTP-only cookies are used.

---

# 52. API Client Requirements

The frontend must use a centralized HTTP client.

The API client should handle:

- Base URL
- Credentials
- Common headers
- Response parsing
- Authentication errors
- Common error handling

Individual components should not create ad-hoc HTTP clients.

---

# 53. Frontend State Management

Global state should be limited to data that genuinely needs global access.

Potential global state:

- Authenticated user
- Theme
- Notifications
- Selected application preferences

Server data should not automatically be duplicated into many unrelated global stores.

The final state-management implementation will be documented in `ARCHITECTURE.md`.

---

# 54. Frontend Component Requirements

Components should be reusable where meaningful.

Expected shared components include:

- Button
- Input
- Select
- Modal/Dialog
- Dropdown
- Toast
- Table
- Pagination
- Date picker
- Currency input
- Loading state
- Empty state
- Error state
- Confirmation dialog
- Progress bar
- Financial summary card

The application should avoid unnecessary component fragmentation.

---

# 55. Responsive Frontend Requirements

All pages must support:

- Desktop
- Tablet
- Mobile

The UI must not depend on hover for essential actions.

Tables must have mobile-friendly behavior.

Charts must resize correctly.

Forms must work on touch devices.

---

# 56. Animation Requirements

Animations must be subtle and purposeful.

Permitted examples:

- Page transitions
- Modal transitions
- Dropdown transitions
- Progress animation
- Chart entrance
- Toast transitions
- Button interaction feedback

Avoid:

- Excessive motion
- Constant animated backgrounds
- Distracting loops
- Unnecessary decorative animation

---

# 57. Accessibility Requirements

Frontend implementation should include:

- Semantic HTML
- Keyboard navigation
- Focus management
- Visible focus indicators
- Form labels
- Error descriptions
- Accessible dialogs
- Appropriate ARIA where required
- Adequate color contrast
- Non-color indicators for financial states

---

# 58. Loading/Empty/Error States

Every major data-driven screen must define:

```text
Loading
Success
Empty
Error
```

Examples:

```text
No transactions yet.
Add your first transaction.
```

rather than showing a broken empty table.

---

# 59. API Security and Data Leakage Prevention

API responses must expose only fields needed by the client.

Never return:

- Password hashes
- Reset tokens
- JWT secrets
- Internal secrets
- Sensitive admin-only fields

User objects should be serialized through safe response transformations.

---

# 60. Database Data Isolation

MongoDB queries involving user-owned data must include the appropriate user ownership condition.

Example conceptual query:

```text
find({
  user: authenticatedUserId
})
```

For resources that are nested under a user, the user relationship must be enforced consistently.

---

# 61. Database Transaction/Consistency Requirements

Where multiple database writes must remain logically consistent, the implementation should use an appropriate transaction/session strategy where supported.

Examples may include:

- Complex account changes
- Goal contribution operations
- Multi-document operations
- Administrative operations affecting multiple records

The final usage will be determined by actual business flows.

---

# 62. Testing Requirements

The project must include a testing strategy.

Testing levels should include:

## Unit testing

For:

- Financial calculations
- Budget calculations
- Savings calculations
- Insight rules
- Validators
- Utility functions

## Integration testing

For:

- Authentication
- Transactions
- Budgets
- Goals
- Accounts
- File uploads
- Admin authorization

## API testing

For:

- Status codes
- Validation
- Authentication
- Authorization
- Ownership

## Frontend testing

Where appropriate:

- Critical components
- Forms
- Auth flows
- Important user interactions

---

# 63. Security Testing

Testing must specifically verify:

- Unauthenticated access is rejected.
- USER cannot access ADMIN endpoints.
- User A cannot access User B's transaction.
- User A cannot access User B's receipt.
- Invalid JWT is rejected.
- Expired JWT is rejected.
- Password reset token expires.
- Password hashes are never returned.
- File upload restrictions work.
- Rate limits work on sensitive routes.

---

# 64. Financial Calculation Testing

Tests must cover:

- Zero income
- Zero expenses
- Income greater than expenses
- Expenses greater than income
- No transactions
- Budget at 0%
- Budget at 50%
- Budget at 90%
- Budget at 100%
- Budget above 100%
- Goal at 0%
- Goal at 100%
- Goal above target
- Previous month unavailable
- Empty category data

---

# 65. Performance Requirements

The system should be designed to handle increasing user and transaction data without requiring architectural rewrites.

Requirements:

- Indexed queries
- Paginated lists
- Efficient aggregation
- Avoid N+1 query patterns
- Avoid unnecessary frontend data duplication
- Efficient report generation
- Controlled file processing

---

# 66. Deployment Readiness

The application should support separate configuration for:

```text
Development
Testing
Production
```

Production configuration must:

- Use secure cookies
- Use HTTPS
- Use trusted CORS origins
- Use production database credentials
- Disable verbose error responses
- Protect secrets
- Use appropriate file storage
- Use appropriate logging

---

# 67. Database Backup Considerations

Production deployments should have a database backup strategy.

The application itself must not assume that MongoDB Compass is a backup system.

Backups should be handled through appropriate MongoDB/deployment infrastructure.

---

# 68. API Documentation

The final project should document:

- Authentication endpoints
- User endpoints
- Transaction endpoints
- Category endpoints
- Account endpoints
- Budget endpoints
- Goal endpoints
- Recurring transaction endpoints
- Notification endpoints
- Analytics endpoints
- Report endpoints
- Admin endpoints

Documentation should specify:

- HTTP method
- URL
- Authentication requirement
- Role requirement
- Request body
- Query parameters
- Response
- Error responses

---

# 69. Code Quality Standards

Code should follow:

- Clear naming
- Small focused functions
- Separation of concerns
- Reusable utilities
- Consistent error handling
- Consistent formatting
- Linting
- Environment-based configuration

Avoid:

- Huge controllers
- Huge React components
- Duplicate business logic
- Hardcoded secrets
- Hardcoded financial calculations in UI components
- Unvalidated request data
- Direct database access scattered across frontend/business code

---

# 70. Git Requirements

Git must be used for source control.

The repository must not contain:

- `.env`
- Passwords
- API secrets
- Private uploaded files
- Generated sensitive reports
- User financial data

Commits should be meaningful and grouped by logical changes.

---

# 71. Documentation Requirements

The final project must maintain these source-of-truth documents:

```text
PRD.md
TRD.md
ARCHITECTURE.md
DATABASESCHEMA.md
UI/UX.md
WEBFLOW.md
IMPLEMENTATION.md
```

Each document has a specific responsibility.

Technical changes must be reflected in the appropriate document.

---

# 72. Technical Scope Lock

The following are technically locked:

```text
Frontend:
React + Vite

Backend:
Node.js + Express.js

Database:
MongoDB + Mongoose

Authentication:
JWT + HTTP-only cookies

Password hashing:
bcrypt

Uploads:
Multer

Validation:
Zod or Joi

Security:
Helmet + CORS + rate limiting

Charts:
Recharts

Animation:
Framer Motion

UI:
Tailwind CSS + shadcn/ui

Icons:
Lucide React
```

Minor library-version changes are permitted as required for compatibility/security, but the architectural role of each technology must remain consistent unless the source-of-truth documents are formally updated.

---

# 73. Explicitly Prohibited Technical Scope

The following must not be introduced into the implementation without an explicit scope change:

- AI API integrations
- AI API keys
- External AI financial advisors
- Bank synchronization
- Open banking
- Stock trading
- Cryptocurrency trading
- Payment processing
- Real-money transfers
- Investment brokerage APIs

---

# 74. Technical Definition of Done

A feature is technically complete only when:

- Frontend implementation exists where required.
- Backend endpoint/service exists where required.
- Validation exists.
- Authorization exists.
- Ownership checks exist where applicable.
- Database model/indexes are implemented.
- Error states are handled.
- Loading states are handled.
- Empty states are handled.
- Relevant tests exist.
- Security requirements are satisfied.
- Responsive behavior is verified.
- Documentation is updated.

---

# 75. Relationship With Other Source-of-Truth Documents

The project uses seven source-of-truth documents:

```text
PRD.md
TRD.md
ARCHITECTURE.md
DATABASESCHEMA.md
UI/UX.md
WEBFLOW.md
IMPLEMENTATION.md
```

Responsibilities:

| Document | Responsibility |
|---|---|
| `PRD.md` | Product requirements |
| `TRD.md` | Technical requirements |
| `ARCHITECTURE.md` | System architecture |
| `DATABASESCHEMA.md` | Database structure |
| `UI/UX.md` | Interface and UX |
| `WEBFLOW.md` | User/admin flows |
| `IMPLEMENTATION.md` | Phase-by-phase implementation |

The documents must remain consistent.

---

# 76. Final Technical Scope Lock

FinTrack v1 must be implemented as a secure MERN-style full-stack application with:

- React frontend
- Node.js/Express backend
- MongoDB/Mongoose database
- JWT authentication
- HTTP-only cookies
- bcrypt password hashing
- RBAC
- Seeded administrator
- Multer receipt uploads
- Server-side validation
- Server-side filtering/search/pagination
- Financial aggregation
- Deterministic financial insights
- Budgeting
- Recurring transactions
- Savings goals
- Accounts
- Analytics
- Notifications
- Reports
- Admin controls
- Audit logging
- Responsive UI
- Dark mode
- Testing
- Documentation

No external AI API or AI API key is permitted.

**This document represents the locked technical requirements for FinTrack v1.**
