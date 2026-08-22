# FinTrack — Database Schema Document

**Document:** `DATABASESCHEMA.md`  
**Version:** 1.0  
**Status:** Locked / Source of Truth  
**Product:** FinTrack — Personal Finance Management Platform  
**Database:** MongoDB  
**ODM:** Mongoose  
**Related Documents:** `PRD.md`, `TRD.md`, `ARCHITECTURE.md`  
**Date:** 22 August 2026

---

# 1. Document Purpose

This document defines the MongoDB data model for FinTrack.

It is the database source of truth for:

- Collections
- Fields
- Data types
- Required fields
- Defaults
- Enums
- References
- Ownership
- Indexes
- Validation expectations
- Relationships
- Embedded documents
- Security-sensitive fields
- Data lifecycle rules

The application must not introduce database structures that conflict with this document without formally updating the schema documentation.

---

# 2. Database Technology

FinTrack uses:

```text
MongoDB
+
Mongoose
```

MongoDB Compass may be used to inspect and manage development data.

The application must connect to MongoDB through the backend.

The frontend must never connect directly to MongoDB.

---

# 3. Database Naming Conventions

## 3.1 Collections

Collection names should use lowercase plural names.

Examples:

```text
users
transactions
categories
accounts
budgets
recurringtransactions
savingsgoals
notifications
passwordresettokens
auditlogs
useractivities
systemsettings
```

The exact physical Mongoose collection naming behavior may be explicitly configured, but the logical names above are authoritative.

## 3.2 Field Naming

Use camelCase:

```text
firstName
lastName
createdAt
updatedAt
paymentMethod
targetAmount
nextOccurrence
```

## 3.3 IDs

MongoDB ObjectId is the default identifier.

Every primary document has:

```text
_id: ObjectId
```

References should use ObjectId unless a specific technical reason requires otherwise.

---

# 4. Global Document Fields

Most primary application documents should contain:

```text
_id
createdAt
updatedAt
```

Mongoose timestamps should be enabled where appropriate.

Not every supporting/temporary collection necessarily requires both timestamps if the lifecycle does not need them.

---

# 5. Core Collections

FinTrack v1 uses the following primary collections:

```text
users
transactions
categories
accounts
budgets
recurringtransactions
savingsgoals
notifications
passwordresettokens
auditlogs
useractivities
systemsettings
```

---

# 6. Entity Relationship Overview

Conceptual relationship:

```text
                         ┌──────────────┐
                         │    User      │
                         └──────┬───────┘
                                │
       ┌────────────┬───────────┼────────────┬──────────────┐
       │            │           │            │              │
       ▼            ▼           ▼            ▼              ▼
 Transactions   Accounts    Budgets      Goals       Recurring Txns
       │            │           │            │              │
       │            │           │            │              │
       └──────┬─────┴─────┬─────┴──────┬─────┘              │
              │           │            │                    │
              ▼           ▼            ▼                    ▼
          Categories  Notifications  Activities        Transactions

                         │
                         ▼
                     Receipts
                  (metadata/reference)

Admin
  │
  ├── User Management
  ├── System Settings
  └── Audit Logs
```

---

# 7. User Collection

Collection:

```text
users
```

Purpose:

Stores authentication identity, profile information, role, preferences, and account status.

## 7.1 Fields

| Field | Type | Required | Default | Notes |
|---|---|---:|---|---|
| `_id` | ObjectId | Yes | Auto | Primary identifier |
| `name` | String | Yes | — | Display/full name |
| `email` | String | Yes | — | Unique, normalized |
| `passwordHash` | String | Yes | — | bcrypt hash; never return to client |
| `role` | String | Yes | `USER` | `USER` / `ADMIN` |
| `phone` | String | No | — | Optional |
| `profilePicture` | Object | No | — | Profile image metadata/reference |
| `currency` | String | Yes | `INR` | ISO-style currency code |
| `timezone` | String | Yes | Application default | User timezone |
| `dateFormat` | String | Yes | Application default | Display preference |
| `theme` | String | Yes | `system` | `light` / `dark` / `system` |
| `notificationPreferences` | Object | No | Defaults | User notification preferences |
| `status` | String | Yes | `ACTIVE` | Account state |
| `onboardingCompleted` | Boolean | Yes | `false` | Onboarding state |
| `lastLoginAt` | Date | No | — | Last successful login |
| `createdAt` | Date | Yes | Auto | Timestamp |
| `updatedAt` | Date | Yes | Auto | Timestamp |

---

# 8. User Role Enum

Allowed values:

```text
USER
ADMIN
```

No other role is part of the locked v1 scope.

---

# 9. User Status Enum

Allowed values:

```text
ACTIVE
INACTIVE
SUSPENDED
```

The exact administrative meaning of each status must be consistent across backend authorization and UI.

At minimum:

```text
ACTIVE → normal access
INACTIVE/SUSPENDED → restricted authentication/access
```

---

# 10. User Theme Enum

Allowed:

```text
light
dark
system
```

---

# 11. User Notification Preferences

Recommended structure:

```json
{
  "budgetAlerts": true,
  "recurringPaymentAlerts": true,
  "goalAlerts": true,
  "financialInsights": true,
  "systemNotifications": true
}
```

These are user preferences, not authorization controls.

---

# 12. Profile Picture Object

Profile picture metadata may contain:

```text
url
storageKey
originalName
mimeType
size
```

Sensitive/internal storage details should not be returned to clients unless needed.

---

# 13. User Indexes

Required/expected indexes:

```text
email: unique
role
status
createdAt
```

Recommended:

```text
{ email: 1 }
```

as a unique index.

Email must be normalized before uniqueness enforcement.

---

# 14. Transaction Collection

Collection:

```text
transactions
```

Purpose:

Stores income and expense records.

## 14.1 Fields

| Field | Type | Required | Default | Notes |
|---|---|---:|---|---|
| `_id` | ObjectId | Yes | Auto | Primary identifier |
| `user` | ObjectId | Yes | — | Ref: User |
| `amount` | Number/Decimal strategy | Yes | — | Positive monetary value |
| `type` | String | Yes | — | `INCOME` / `EXPENSE` |
| `category` | ObjectId | Yes | — | Ref: Category |
| `description` | String | Yes | — | User-facing description/title |
| `date` | Date | Yes | — | Financial transaction date |
| `paymentMethod` | String | Yes | — | Payment method enum |
| `account` | ObjectId | Yes | — | Ref: Account |
| `notes` | String | No | — | Optional |
| `receipt` | Object | No | — | Receipt metadata/reference |
| `createdAt` | Date | Yes | Auto | Timestamp |
| `updatedAt` | Date | Yes | Auto | Timestamp |

---

# 15. Transaction Type Enum

Allowed:

```text
INCOME
EXPENSE
```

---

# 16. Transaction Amount Rules

Amount must:

- Be numeric
- Be greater than zero
- Reject NaN
- Reject Infinity
- Follow the application's monetary precision strategy

The database implementation should prefer a precision-safe monetary representation.

The final implementation may use:

```text
integer minor units
```

or:

```text
Decimal128
```

The selected strategy must be applied consistently across all monetary fields.

---

# 17. Payment Method Enum

Allowed:

```text
CASH
UPI
CREDIT_CARD
DEBIT_CARD
BANK_TRANSFER
OTHER
```

---

# 18. Transaction Receipt Object

A receipt reference may contain:

```text
fileId
storageKey
url
originalName
mimeType
size
uploadedAt
```

The receipt object is metadata/reference data.

The actual file must not be embedded as a large binary field inside the transaction document unless a later architecture explicitly requires it.

---

# 19. Transaction Indexes

Required/expected:

```text
{ user: 1, date: -1 }
{ user: 1, type: 1, date: -1 }
{ user: 1, category: 1, date: -1 }
{ user: 1, account: 1, date: -1 }
{ user: 1, paymentMethod: 1, date: -1 }
{ user: 1, createdAt: -1 }
```

Search indexes may be added depending on the final search implementation.

Indexes must support the actual query patterns used by the API.

---

# 20. Category Collection

Collection:

```text
categories
```

Purpose:

Stores default/system categories and user-created custom categories.

## 20.1 Fields

| Field | Type | Required | Default | Notes |
|---|---|---:|---|---|
| `_id` | ObjectId | Yes | Auto | Primary identifier |
| `user` | ObjectId | No | null | Null for system/default category |
| `name` | String | Yes | — | Category name |
| `type` | String | Yes | — | `INCOME` / `EXPENSE` |
| `icon` | String | No | — | Icon identifier |
| `color` | String | No | — | UI color token/value |
| `isSystem` | Boolean | Yes | `false` | Protect default categories |
| `isActive` | Boolean | Yes | `true` | Soft disable |
| `createdAt` | Date | Yes | Auto | Timestamp |
| `updatedAt` | Date | Yes | Auto | Timestamp |

---

# 21. Default Income Categories

Seed/system categories:

```text
Salary
Freelancing
Business
Investments
Other
```

---

# 22. Default Expense Categories

Seed/system categories:

```text
Food
Transport
Shopping
Bills
Education
Entertainment
Healthcare
Other
```

---

# 23. Category Ownership Rules

System category:

```text
user = null
isSystem = true
```

User custom category:

```text
user = authenticatedUserId
isSystem = false
```

A user must not be able to edit/delete another user's category.

System categories must not be deleted through normal user operations.

---

# 24. Category Indexes

Recommended:

```text
{ user: 1, type: 1, name: 1 }
{ isSystem: 1, type: 1 }
```

For user-specific uniqueness, the implementation may use a partial/sparse strategy appropriate for MongoDB.

The system must prevent duplicate custom category names where the product rules require uniqueness.

---

# 25. Account Collection

Collection:

```text
accounts
```

Purpose:

Represents financial wallets/accounts belonging to a user.

Examples:

- Cash
- Bank Account
- Credit Card
- UPI

## 25.1 Fields

| Field | Type | Required | Default | Notes |
|---|---|---:|---|---|
| `_id` | ObjectId | Yes | Auto | Primary identifier |
| `user` | ObjectId | Yes | — | Ref: User |
| `name` | String | Yes | — | Account display name |
| `type` | String | Yes | — | Account type |
| `openingBalance` | Monetary | Yes | `0` | Initial balance |
| `currency` | String | Yes | `INR` | Account currency |
| `status` | String | Yes | `ACTIVE` | Account state |
| `notes` | String | No | — | Optional |
| `createdAt` | Date | Yes | Auto | Timestamp |
| `updatedAt` | Date | Yes | Auto | Timestamp |

---

# 26. Account Type Enum

Allowed:

```text
CASH
BANK_ACCOUNT
CREDIT_CARD
UPI
OTHER
```

---

# 27. Account Status Enum

Allowed:

```text
ACTIVE
INACTIVE
ARCHIVED
```

---

# 28. Account Balance Strategy

The application must define one authoritative balance calculation.

Recommended strategy:

```text
Current Balance
=
Opening Balance
+
Income affecting account
-
Expenses affecting account
```

If future transfer support is introduced, transfers must be modeled consistently.

The frontend must not invent account balances independently.

---

# 29. Account Indexes

Recommended:

```text
{ user: 1, status: 1 }
{ user: 1, name: 1 }
```

---

# 30. Budget Collection

Collection:

```text
budgets
```

Purpose:

Stores monthly category budgets.

## 30.1 Fields

| Field | Type | Required | Default | Notes |
|---|---|---:|---|---|
| `_id` | ObjectId | Yes | Auto | Primary identifier |
| `user` | ObjectId | Yes | — | Ref: User |
| `category` | ObjectId | Yes | — | Ref: Category |
| `month` | Number | Yes | — | 1–12 |
| `year` | Number | Yes | — | Four-digit year |
| `limitAmount` | Monetary | Yes | — | Budget limit |
| `alertThresholds` | Object | No | Defaults | Alert configuration |
| `notes` | String | No | — | Optional |
| `createdAt` | Date | Yes | Auto | Timestamp |
| `updatedAt` | Date | Yes | Auto | Timestamp |

---

# 31. Budget Alert Thresholds

Recommended structure:

```json
{
  "informational": 50,
  "warning": 75,
  "critical": 90,
  "exceeded": 100
}
```

Values represent percentages.

---

# 32. Budget Rules

Budget limit must be greater than zero.

Budget usage is calculated from qualifying expense transactions.

A user should not have multiple active budgets for the same:

```text
user + category + month + year
```

A compound unique index should enforce this.

---

# 33. Budget Indexes

Required:

```text
{
  user: 1,
  category: 1,
  year: 1,
  month: 1
}
```

This combination should be unique for active/current budget records.

---

# 34. Recurring Transaction Collection

Collection:

```text
recurringtransactions
```

Purpose:

Stores recurring income/expense definitions.

## 34.1 Fields

| Field | Type | Required | Default | Notes |
|---|---|---:|---|---|
| `_id` | ObjectId | Yes | Auto | Primary identifier |
| `user` | ObjectId | Yes | — | Ref: User |
| `name` | String | Yes | — | Display name |
| `amount` | Monetary | Yes | — | Positive amount |
| `type` | String | Yes | — | Income/Expense |
| `category` | ObjectId | Yes | — | Ref: Category |
| `account` | ObjectId | Yes | — | Ref: Account |
| `paymentMethod` | String | Yes | — | Payment method |
| `frequency` | String | Yes | — | Frequency enum |
| `startDate` | Date | Yes | — | Start |
| `nextOccurrence` | Date | Yes | — | Next scheduled date |
| `endDate` | Date | No | — | Optional |
| `isActive` | Boolean | Yes | `true` | Active state |
| `lastProcessedOccurrence` | Date | No | — | Idempotency support |
| `createdAt` | Date | Yes | Auto | Timestamp |
| `updatedAt` | Date | Yes | Auto | Timestamp |

---

# 35. Recurring Frequency Enum

Allowed:

```text
DAILY
WEEKLY
MONTHLY
YEARLY
```

---

# 36. Recurring Transaction Processing

The system must prevent duplicate transaction creation.

The recurring definition should retain enough information to determine whether the current occurrence has already been processed.

Recommended:

```text
lastProcessedOccurrence
```

A stronger uniqueness/idempotency strategy may also use a generated occurrence key.

---

# 37. Recurring Transaction Indexes

Recommended:

```text
{ user: 1, nextOccurrence: 1, isActive: 1 }
{ user: 1, isActive: 1 }
```

---

# 38. Savings Goal Collection

Collection:

```text
savingsgoals
```

Purpose:

Stores user savings goals and progress.

## 38.1 Fields

| Field | Type | Required | Default | Notes |
|---|---|---:|---|---|
| `_id` | ObjectId | Yes | Auto | Primary identifier |
| `user` | ObjectId | Yes | — | Ref: User |
| `name` | String | Yes | — | Goal name |
| `targetAmount` | Monetary | Yes | — | Target |
| `currentAmount` | Monetary | Yes | `0` | Current saved amount |
| `targetDate` | Date | No | — | Optional target |
| `category` | String | No | — | Goal category |
| `description` | String | No | — | Optional |
| `status` | String | Yes | `ACTIVE` | Goal status |
| `createdAt` | Date | Yes | Auto | Timestamp |
| `updatedAt` | Date | Yes | Auto | Timestamp |

---

# 39. Savings Goal Status

Allowed:

```text
ACTIVE
COMPLETED
PAUSED
CANCELLED
```

---

# 40. Savings Goal Contribution Strategy

The v1 schema keeps the current saved amount directly on the goal.

Conceptually:

```text
currentAmount
```

The application may later introduce a separate contribution collection if contribution history becomes a required feature.

For v1, contribution operations must update `currentAmount` safely.

If a contribution operation is implemented as a multi-step transaction, MongoDB transactions should be considered where appropriate.

---

# 41. Goal Indexes

Recommended:

```text
{ user: 1, status: 1 }
{ user: 1, targetDate: 1 }
```

---

# 42. Notification Collection

Collection:

```text
notifications
```

Purpose:

Stores user-facing in-app notifications.

## 42.1 Fields

| Field | Type | Required | Default | Notes |
|---|---|---:|---|---|
| `_id` | ObjectId | Yes | Auto | Primary identifier |
| `user` | ObjectId | Yes | — | Ref: User |
| `type` | String | Yes | — | Notification type |
| `title` | String | Yes | — | Short title |
| `message` | String | Yes | — | Display message |
| `severity` | String | Yes | `INFO` | Visual/priority state |
| `read` | Boolean | Yes | `false` | Read state |
| `metadata` | Object | No | — | Safe structured metadata |
| `createdAt` | Date | Yes | Auto | Timestamp |
| `updatedAt` | Date | Yes | Auto | Timestamp |

---

# 43. Notification Type Enum

Allowed examples:

```text
BUDGET_ALERT
BUDGET_EXCEEDED
RECURRING_PAYMENT
GOAL_MILESTONE
FINANCIAL_INSIGHT
SYSTEM
```

The enum may expand only through documented scope changes.

---

# 44. Notification Severity Enum

Allowed:

```text
INFO
SUCCESS
WARNING
CRITICAL
```

---

# 45. Notification Indexes

Required/expected:

```text
{ user: 1, read: 1, createdAt: -1 }
{ user: 1, createdAt: -1 }
```

---

# 46. Password Reset Token Collection

Collection:

```text
passwordresettokens
```

Purpose:

Stores secure password reset token metadata.

## 46.1 Fields

| Field | Type | Required | Default | Notes |
|---|---|---:|---|---|
| `_id` | ObjectId | Yes | Auto | Primary identifier |
| `user` | ObjectId | Yes | — | Ref: User |
| `tokenHash` | String | Yes | — | Hash of raw reset token |
| `expiresAt` | Date | Yes | — | Expiration |
| `usedAt` | Date | No | — | Reuse prevention |
| `createdAt` | Date | Yes | Auto | Creation time |

The raw reset token must not be stored.

---

# 47. Password Reset Indexes

A TTL index should exist on:

```text
expiresAt
```

This allows expired reset-token records to be automatically removed by MongoDB.

The application must still explicitly validate expiration when consuming a token.

---

# 48. Audit Log Collection

Collection:

```text
auditlogs
```

Purpose:

Stores important administrative actions.

## 48.1 Fields

| Field | Type | Required | Default | Notes |
|---|---|---:|---|---|
| `_id` | ObjectId | Yes | Auto | Primary identifier |
| `actor` | ObjectId | Yes | — | Admin user |
| `action` | String | Yes | — | Action identifier |
| `targetType` | String | Yes | — | Resource type |
| `targetId` | ObjectId/String | No | — | Target identifier |
| `metadata` | Object | No | — | Safe action metadata |
| `createdAt` | Date | Yes | Auto | Timestamp |

---

# 49. Audit Log Action Examples

Examples:

```text
USER_ACTIVATED
USER_DEACTIVATED
ROLE_CHANGED
SYSTEM_CATEGORY_CREATED
SYSTEM_CATEGORY_UPDATED
SYSTEM_CATEGORY_DISABLED
SYSTEM_SETTING_UPDATED
```

Exact actions should be centralized as constants.

---

# 50. Audit Log Security

Audit logs must never contain:

- Passwords
- Password hashes
- JWTs
- Reset tokens
- Secrets
- Unnecessary sensitive financial information

Only required metadata should be recorded.

---

# 51. Audit Log Indexes

Recommended:

```text
{ actor: 1, createdAt: -1 }
{ targetType: 1, targetId: 1, createdAt: -1 }
{ createdAt: -1 }
```

---

# 52. User Activity Collection

Collection:

```text
useractivities
```

Purpose:

Stores useful non-sensitive activity history for users.

## 52.1 Fields

| Field | Type | Required | Default | Notes |
|---|---|---:|---|---|
| `_id` | ObjectId | Yes | Auto | Primary identifier |
| `user` | ObjectId | Yes | — | Ref: User |
| `action` | String | Yes | — | Activity type |
| `entityType` | String | Yes | — | Resource type |
| `entityId` | ObjectId/String | No | — | Resource identifier |
| `description` | String | Yes | — | User-facing activity |
| `metadata` | Object | No | — | Safe display metadata |
| `createdAt` | Date | Yes | Auto | Timestamp |

---

# 53. User Activity Examples

```text
TRANSACTION_CREATED
TRANSACTION_UPDATED
TRANSACTION_DELETED
BUDGET_CREATED
BUDGET_UPDATED
GOAL_CREATED
ACCOUNT_CREATED
CATEGORY_CREATED
```

---

# 54. User Activity Indexes

Recommended:

```text
{ user: 1, createdAt: -1 }
{ user: 1, entityType: 1, createdAt: -1 }
```

---

# 55. System Settings Collection

Collection:

```text
systemsettings
```

Purpose:

Stores permitted system-level configuration.

This collection is optional at the earliest implementation stage but reserved in the architecture for admin-managed configuration.

## 55.1 Fields

| Field | Type | Required | Default | Notes |
|---|---|---:|---|---|
| `_id` | ObjectId | Yes | Auto | Primary identifier |
| `key` | String | Yes | — | Unique setting key |
| `value` | Mixed/Object | Yes | — | Setting value |
| `description` | String | No | — | Admin-facing description |
| `updatedBy` | ObjectId | No | — | Ref: User/Admin |
| `createdAt` | Date | Yes | Auto | Timestamp |
| `updatedAt` | Date | Yes | Auto | Timestamp |

---

# 56. System Settings Index

Required:

```text
key: unique
```

---

# 57. Relationships

## User → Transactions

```text
User 1 ──── N Transactions
```

Transaction contains:

```text
user → User._id
```

## User → Accounts

```text
User 1 ──── N Accounts
```

## User → Budgets

```text
User 1 ──── N Budgets
```

## User → Goals

```text
User 1 ──── N SavingsGoals
```

## User → Recurring Transactions

```text
User 1 ──── N RecurringTransactions
```

## User → Notifications

```text
User 1 ──── N Notifications
```

## User → Activities

```text
User 1 ──── N UserActivities
```

## Admin → Audit Logs

```text
Admin/User 1 ──── N AuditLogs
```

---

# 58. Transaction → Category

```text
Transaction N ──── 1 Category
```

A transaction references a category.

Category ownership must be verified:

```text
System category
OR
Category belongs to authenticated user
```

---

# 59. Transaction → Account

```text
Transaction N ──── 1 Account
```

The account must belong to the authenticated user.

---

# 60. Budget → Category

```text
Budget N ──── 1 Category
```

Budget category must be valid for expense budgeting.

---

# 61. Recurring Transaction Relationships

Recurring transaction references:

```text
User
Category
Account
```

All referenced resources must belong to the same user unless the referenced category is a system category.

---

# 62. Receipt Relationship

Receipts are attached conceptually to transactions.

```text
Transaction
    │
    └── receipt metadata
             │
             ▼
        File Storage
```

The database stores metadata/reference rather than requiring the full file content inside the transaction document.

---

# 63. Ownership Rules

The following rule is universal:

```text
Authenticated User
        ↓
Resource Query
        ↓
Must include ownership scope
```

Examples:

```text
transactions.user = currentUserId
accounts.user = currentUserId
budgets.user = currentUserId
goals.user = currentUserId
```

A client-supplied user ID must not override the authenticated identity.

---

# 64. Soft Delete Strategy

For financial records, hard deletion must be carefully controlled.

The v1 product allows users to delete transactions and accounts according to product rules.

Where deletion could break historical reporting or referential consistency, the implementation should consider:

```text
isDeleted
deletedAt
```

or an archival approach.

The final decision for each entity must be made during implementation based on the exact feature flow.

The system must never leave users with inaccessible or corrupted financial records.

---

# 65. User Account Deletion

When a user permanently deletes their account, all associated user-owned resources must be handled consistently.

Associated resources include:

```text
transactions
categories
accounts
budgets
recurringtransactions
savingsgoals
notifications
useractivities
```

Password reset records must also be removed/invalidated.

Administrative audit logs may require retention according to the final administrative data policy and must not be used to preserve unnecessary personal data.

---

# 66. Referential Integrity

MongoDB does not enforce relational foreign keys like a relational database.

Therefore, application-level integrity checks are required.

Before creating a transaction:

```text
Verify user
Verify category
Verify account
```

Before creating a budget:

```text
Verify user
Verify category
```

Before creating a recurring transaction:

```text
Verify category
Verify account
```

---

# 67. Cross-User Reference Prevention

This is a critical rule.

Example:

```text
User A
Account A

User B
Transaction B
```

User B must not be able to submit:

```text
account = Account A
```

and successfully associate their transaction with it.

Every cross-document reference must be checked against the authenticated user's ownership.

---

# 68. Category Integrity

For transactions:

```text
category.type
```

must match transaction type where required.

Examples:

```text
INCOME transaction
→ INCOME category

EXPENSE transaction
→ EXPENSE category
```

System categories may be shared across users.

Custom categories belong only to their owner.

---

# 69. Budget Integrity

Budgets should only reference categories appropriate for expense budgeting.

A budget should not use an income-only category.

---

# 70. Account Currency

The initial product defaults to:

```text
INR
```

If multi-currency behavior is later expanded, the database model must be updated before implementation.

For v1, calculations should assume a consistent currency context per user's financial data.

---

# 71. Monetary Precision Strategy

The database must use a consistent monetary strategy.

Preferred options:

## Option A — Minor Units

Store:

```text
₹50.25
```

as:

```text
5025
```

where currency supports two decimal places.

## Option B — Decimal128

MongoDB Decimal128 can represent monetary values precisely.

The final implementation should select one strategy before production implementation and use it consistently across:

- Transactions
- Budgets
- Accounts
- Goals
- Reports
- Analytics

The selected strategy must be documented in implementation code and tests.

---

# 72. Aggregation Requirements

MongoDB aggregation should be used for analytical operations such as:

- Monthly income
- Monthly expenses
- Category totals
- Payment method totals
- Spending trends
- Savings trends

Aggregation pipelines must always apply the user ownership filter.

Conceptually:

```text
$match user
   ↓
$date filtering
   ↓
$group
   ↓
$sort
   ↓
$project
```

---

# 73. Dashboard Query Strategy

Dashboard should avoid fetching all transactions.

Instead:

```text
Summary Aggregation
Category Aggregation
Monthly Trend Aggregation
Payment Method Aggregation
Recent Transaction Query
Budget Query
Goal Query
Notification Query
```

These may be separate endpoints or optimized into suitable service calls.

---

# 74. Index Strategy

Indexes should be designed around actual access patterns.

Primary query dimensions:

```text
user
date
category
account
type
paymentMethod
status
createdAt
nextOccurrence
read
```

Indexes should be reviewed during implementation and testing.

---

# 75. Compound Index Guidelines

Examples:

```text
transactions:
{ user: 1, date: -1 }

budgets:
{ user: 1, category: 1, year: 1, month: 1 }

notifications:
{ user: 1, read: 1, createdAt: -1 }

recurringtransactions:
{ user: 1, nextOccurrence: 1, isActive: 1 }
```

Compound indexes should match common filter/sort patterns.

---

# 76. Unique Constraints

Important uniqueness rules:

## User

```text
email unique
```

## Budget

```text
user + category + year + month unique
```

## System setting

```text
key unique
```

Custom category uniqueness should be enforced according to the final product rule.

---

# 77. Mongoose Schema Requirements

Mongoose schemas should:

- Enable timestamps where appropriate
- Define required fields
- Define enum values
- Define validation
- Define indexes
- Hide sensitive fields from normal serialization where appropriate
- Use references consistently
- Avoid overly permissive schemas

---

# 78. Sensitive Field Protection

Sensitive user fields should not be returned by default.

At minimum:

```text
passwordHash
```

must be excluded from standard user responses.

Reset-token data must never be returned through API endpoints.

---

# 79. Data Serialization

Before returning MongoDB documents to clients:

```text
MongoDB document
      ↓
Service/controller transformation
      ↓
Safe DTO/response
      ↓
Client
```

Do not blindly return raw documents containing internal fields.

---

# 80. Schema Validation vs Application Validation

Both levels are required.

## Mongoose validation

Protects persistence.

## Service/API validation

Protects business rules.

Example:

Mongoose:

```text
amount required
```

Service:

```text
amount > 0
category belongs to user
account belongs to user
category type matches transaction type
```

---

# 81. Transaction Deletion Considerations

Deleting a transaction may affect:

- Dashboard totals
- Budget usage
- Savings calculations
- Account balances
- Analytics
- Reports

After deletion, all derived calculations must reflect the new source data.

No stale financial totals should remain authoritative.

---

# 82. Budget Changes

Updating a budget does not alter transaction history.

It only changes:

```text
budget limit
```

Usage remains derived from transactions.

---

# 83. Goal Changes

Updating a goal target should recalculate:

```text
progress percentage
remaining amount
projection where available
```

No historical transaction data should be silently modified.

---

# 84. Account Deactivation

Deactivating an account should not automatically delete its transaction history.

Historical transactions may remain linked to an inactive account.

The UI should prevent new transactions against an inactive account where appropriate.

---

# 85. Category Deactivation

Deactivating a category should not automatically delete historical transactions.

Existing transactions should retain their category reference.

New transactions should not be allowed to use an inactive category.

---

# 86. Notification Lifecycle

Notifications may be:

```text
created
unread
read
deleted
```

The notification system should not modify underlying financial records.

---

# 87. Audit Log Lifecycle

Audit logs are append-oriented.

Normal users must never modify them.

Admins should not casually delete audit history.

Retention behavior can be expanded later, but v1 must preserve meaningful administrative audit records.

---

# 88. User Activity Lifecycle

User activities are informational.

They should not be treated as the authoritative source for financial calculations.

The source of truth remains:

```text
Transactions
Budgets
Accounts
Goals
Recurring Transactions
```

---

# 89. Data Integrity Rules

The following are mandatory:

1. Every user-owned document must have an owner.
2. Every owner must be verified against the authenticated user.
3. Transactions must reference valid categories.
4. Transactions must reference valid accounts.
5. Transaction type must match category type where required.
6. Budgets must reference valid expense categories.
7. Recurring transactions must reference valid accounts/categories.
8. Passwords must be stored only as bcrypt hashes.
9. Reset tokens must be stored as hashes.
10. Receipts must be authorized.
11. Admin actions must be audited.
12. Financial calculations must use authoritative source data.

---

# 90. Database Security

MongoDB credentials must be supplied through environment configuration.

The application must not expose:

```text
MONGO_URI
database credentials
database host credentials
```

MongoDB should be configured with appropriate access controls in deployment.

---

# 91. Database Connection Architecture

Backend startup:

```text
Node.js
   ↓
Load environment
   ↓
Validate configuration
   ↓
Connect Mongoose
   ↓
MongoDB
   ↓
Start HTTP server
```

If database connection is required for the application to function, the server should not report healthy readiness before the required database connection is available.

---

# 92. Database Error Handling

The application must safely handle:

- Connection failures
- Duplicate key errors
- Validation errors
- Cast errors
- Timeout errors
- Transaction/session failures

Raw database errors should not be exposed directly to users.

---

# 93. Seed Data

System seed data should include:

## Admin

Created from:

```text
ADMIN_EMAIL
ADMIN_PASSWORD
```

## Default categories

Income:

```text
Salary
Freelancing
Business
Investments
Other
```

Expense:

```text
Food
Transport
Shopping
Bills
Education
Entertainment
Healthcare
Other
```

Seed operations must be idempotent.

---

# 94. Demo Data

Demo user data may be generated separately from production/system seed data.

Demo data must:

- Use fake data
- Belong to a dedicated demo user
- Never contain real personal data
- Be safely resettable

Demo data must not become mixed with real users.

---

# 95. Database Migration Considerations

MongoDB does not require traditional relational migrations for every schema change, but structured migration/seed scripts should be used when existing data must be transformed.

Potential migration examples:

```text
Add field
Normalize category
Convert monetary representation
Create new index
```

Schema changes must be documented.

---

# 96. Schema Versioning

If a breaking database structure is introduced, a documented schema/data migration strategy must be used.

Do not silently change field meaning.

---

# 97. Database Backup

Production database backups must be handled through the deployment/database infrastructure.

MongoDB Compass is not a replacement for production backup infrastructure.

---

# 98. Database Performance

The database layer should avoid:

- Unbounded queries
- Excessive population
- N+1 queries
- Unnecessary full collection scans
- Large document growth without reason

Use:

- Projection
- Indexes
- Aggregation
- Pagination
- Appropriate references

---

# 99. Population Strategy

Mongoose `populate()` should be used selectively.

Do not populate large related datasets when only IDs are required.

For analytics, prefer aggregation pipelines over deeply populated documents.

---

# 100. Transaction/Session Strategy

MongoDB transactions may be used for operations requiring multiple related writes.

Examples:

- Complex savings goal contribution
- Multi-document administrative operation
- Critical financial state changes

The use of transactions should be justified by actual consistency requirements.

---

# 101. No Embedded Large Files

Receipt files and other large uploads must not be stored as large embedded arrays or binary fields inside ordinary transaction documents unless the architecture is explicitly revised.

Use metadata/reference architecture.

---

# 102. Schema Reference Summary

| Collection | Primary Owner | Important References |
|---|---|---|
| `users` | Self | — |
| `transactions` | `user` | `category`, `account` |
| `categories` | `user` or system | — |
| `accounts` | `user` | — |
| `budgets` | `user` | `category` |
| `recurringtransactions` | `user` | `category`, `account` |
| `savingsgoals` | `user` | — |
| `notifications` | `user` | — |
| `passwordresettokens` | `user` | — |
| `auditlogs` | `actor` | Target metadata |
| `useractivities` | `user` | Entity metadata |
| `systemsettings` | System | `updatedBy` |

---

# 103. Complete Schema Inventory

```text
users
├── profile
├── authentication
├── role
├── status
└── preferences

transactions
├── income
├── expense
├── category
├── account
├── payment method
└── receipt metadata

categories
├── system categories
└── user categories

accounts
├── account type
├── opening balance
├── currency
└── status

budgets
├── category
├── month/year
├── limit
└── alert thresholds

recurringtransactions
├── schedule
├── category
├── account
└── processing state

savingsgoals
├── target
├── current amount
├── target date
└── status

notifications
├── type
├── severity
├── message
└── read state

passwordresettokens
├── token hash
├── expiration
└── usage state

auditlogs
├── actor
├── action
├── target
└── metadata

useractivities
├── user
├── action
├── entity
└── description

systemsettings
├── key
├── value
└── updatedBy
```

---

# 104. Database-to-Feature Mapping

| Feature | Collections |
|---|---|
| Authentication | `users`, `passwordresettokens` |
| RBAC | `users`, `auditlogs` |
| Dashboard | `transactions`, `accounts`, `budgets`, `savingsgoals`, `notifications` |
| Income | `transactions`, `categories`, `accounts` |
| Expenses | `transactions`, `categories`, `accounts` |
| Search/filter | `transactions` |
| Custom categories | `categories` |
| Multiple accounts | `accounts`, `transactions` |
| Budgets | `budgets`, `transactions`, `categories` |
| Recurring transactions | `recurringtransactions`, `transactions` |
| Savings goals | `savingsgoals` |
| Analytics | `transactions`, `accounts`, `budgets`, `savingsgoals` |
| Insights | Analytics data + internal rule engine |
| Calendar | `recurringtransactions`, `budgets`, `savingsgoals` |
| Receipts | `transactions` + file storage metadata |
| Notifications | `notifications` |
| Reports | Financial collections |
| Data export | User-owned collections |
| User activity | `useractivities` |
| Admin | `users`, `auditlogs`, `systemsettings` |

---

# 105. Data Ownership Matrix

| Resource | User Access | Admin Access |
|---|---|---|
| Own profile | Full | Authorized admin operations only |
| Own transactions | Full | Limited/authorized |
| Other user's transactions | No | Only if explicitly authorized by admin feature |
| Own accounts | Full | Authorized |
| Other user's accounts | No | Limited/authorized |
| Own budgets | Full | Authorized |
| Own goals | Full | Authorized |
| Own notifications | Full | No |
| Own receipts | Full | Authorized |
| Audit logs | No | Yes |
| System settings | No | Yes |
| User roles | No | Yes |

Admin access must always follow the minimum necessary privilege principle.

---

# 106. Sensitive Data Matrix

| Data | Stored | Returned to Normal Client |
|---|---|---|
| Password | bcrypt hash | No |
| Password reset raw token | No | No |
| Password reset token hash | Yes | No |
| JWT secret | Environment only | No |
| MongoDB credentials | Environment only | No |
| Financial transactions | Yes | Owner only |
| Receipts | Storage + metadata | Owner/authorized |
| Admin audit logs | Yes | Admin only |
| User profile | Yes | Owner/authorized |

---

# 107. Source-of-Truth Relationship

This database document is governed by:

```text
PRD.md
TRD.md
ARCHITECTURE.md
```

The other source-of-truth documents are:

```text
UI/UX.md
WEBFLOW.md
IMPLEMENTATION.md
```

Responsibilities:

```text
PRD.md
→ Product requirements

TRD.md
→ Technical requirements

ARCHITECTURE.md
→ System architecture

DATABASESCHEMA.md
→ Data model

UI/UX.md
→ Interface and UX

WEBFLOW.md
→ User/admin flows

IMPLEMENTATION.md
→ Implementation phases
```

---

# 108. Schema Change Policy

Database schema changes must not be made casually.

A schema change requires consideration of:

- Existing data
- API compatibility
- Frontend compatibility
- Indexes
- Ownership
- Security
- Reports
- Analytics
- Migration requirements

If the meaning of a field changes, the source-of-truth document must be updated.

---

# 109. Final Database Rules

The following rules are locked:

1. MongoDB is the primary database.
2. Mongoose is the ODM.
3. MongoDB Compass is a development/management tool, not the application data layer.
4. Users own their financial data.
5. Ownership is enforced server-side.
6. Transactions reference users, categories, and accounts.
7. Budgets reference users and categories.
8. Recurring transactions reference users, categories, and accounts.
9. Savings goals belong to users.
10. Notifications belong to users.
11. Password reset tokens are stored hashed.
12. Password hashes are never returned.
13. Admin actions are audited.
14. Receipt files are stored outside ordinary transaction documents with metadata/reference stored in MongoDB.
15. Multer handles multipart upload processing.
16. Financial analytics use backend aggregation/business logic.
17. Financial insights use deterministic internal rules only.
18. No AI API data or AI API key is stored in the database or environment.
19. Large collections use appropriate indexes and pagination.
20. Cross-user references are prohibited.
21. Seed data must be idempotent.
22. Database changes must remain consistent with the source-of-truth documents.

---

# 110. Final Database Architecture

```text
MongoDB
│
├── users
│
├── transactions
│      ├── user
│      ├── category
│      ├── account
│      └── receipt metadata
│
├── categories
│      ├── system
│      └── user-owned
│
├── accounts
│      └── user-owned
│
├── budgets
│      ├── user
│      └── category
│
├── recurringtransactions
│      ├── user
│      ├── category
│      └── account
│
├── savingsgoals
│      └── user
│
├── notifications
│      └── user
│
├── passwordresettokens
│      └── user
│
├── auditlogs
│      └── admin actor
│
├── useractivities
│      └── user
│
└── systemsettings
       └── admin updater
```

---

# 111. Database Scope Lock

This document defines the locked database model for **FinTrack v1**.

The schema is designed to support the complete approved product scope while preserving:

- User isolation
- Financial data integrity
- Secure authentication
- RBAC
- Analytics
- Budgeting
- Recurring transactions
- Savings goals
- Notifications
- Reporting
- Receipt uploads
- Administrative auditing

No external AI service is represented or required in the database architecture.

All financial intelligence is generated from application data using deterministic internal logic.

**`DATABASESCHEMA.md` is the database source of truth for FinTrack v1.**
