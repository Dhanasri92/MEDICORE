# MediCore — Complete Automated Test Plan & QA Strategy

## 1. Quality Objectives & Standards
MediCore is an enterprise-grade Online Hospital Management System handling sensitive Electronic Health Records (EHR), multi-role authorization (Admin, Doctor, Patient), appointment scheduling, diagnostic laboratory specimen tracking, and financial transactions. 

The QA strategy enforces zero-tolerance for data loss, unauthorized record leakage, race condition conflicts, and financial inconsistencies.

---

## 2. Test Pyramid & Scope

```
                    ▲
                   / \
                  /   \
                 / E2E \       Playwright / Browser Automation (5 User Journeys)
                /-------\
               /  Integ  \     Supertest + Live Prisma SQLite Test Suite (91 tests)
              /-----------\
             /  Component  \   React Testing Library + Vitest jsdom (28 tests)
            /---------------\
           /    Unit Tests   \ Vitest Pure Logic, Math & RBAC (53 tests)
          /-------------------\
```

### 2.1 Backend Unit Test Matrix (`server/tests/unit/`)
| Module / Feature | Test Target | Key Validations & Invariants |
|---|---|---|
| **Input Validation** | `validation.unit.test.ts` | Zod schemas reject invalid emails, short passwords, malformed dates, negative currency amounts, invalid UUIDs. |
| **Authentication Utils** | `auth-utils.unit.test.ts` | Argon2/Bcrypt password hashing, salt verification, JWT generation & expiration, malformed token rejection. |
| **Role-Based Auth (RBAC)** | `role-auth.unit.test.ts` | Matrix evaluation for `ADMIN`, `DOCTOR`, `PATIENT` across privileged, clinical, and patient actions. |
| **Slot Scheduling Math** | `slot-math.unit.test.ts` | 30-minute interval generation between doctor start/end hours, lunch break exclusions, past date handling. |
| **Appointment Lifecycle** | `appointment-status.unit.test.ts` | Deterministic state machine (`PENDING` → `CONFIRMED` → `COMPLETED` / `CANCELLED`), invalid transition guards. |
| **Billing Calculations** | `billing-calculations.unit.test.ts` | Line-item sum, configurable tax calculation (5%), discount arithmetic, IEEE-754 precision rounding. |

### 2.2 Backend API Integration Matrix (`server/tests/integration/`)
| Domain | Test File | Endpoint Tested & Assertions |
|---|---|---|
| **Auth & Sessions** | `auth.integration.test.ts` | Registration, login, duplicate email rejection (HTTP 409/400), invalid password (HTTP 401), session profile, logout. |
| **Doctors & Patients** | `doctors-patients.integration.test.ts` | Doctor profiles, specialty search, patient profile retrieval, unauthorized modification prevention (HTTP 403). |
| **Appointments** | `appointments.integration.test.ts` | Slot availability, appointment booking, double booking rejection, simultaneous concurrency conflict test, rescheduling, cancellation. |
| **Clinical Records** | `clinical-records.integration.test.ts` | Consultation note creation, itemized multi-drug prescriptions, cancelled appointment protection, cross-patient privacy boundary (HTTP 403). |
| **Laboratory Reports** | `laboratory.integration.test.ts` | Multi-format upload (PDF/PNG/JPEG), unsupported MIME rejection (.txt), authorized download streaming, cross-patient isolation. |
| **Billing & Payments** | `billing-payments.integration.test.ts` | Invoice generation, line items & 5% tax, payment simulation, partial payment, balance enforcement, duplicate payment rejection. |
| **Admin & Analytics** | `admin-analytics.integration.test.ts` | Hospital metrics computation, doctor/patient/department administration, audit trail verification. |

### 2.3 Frontend Component & Page Test Matrix (`client/tests/`)
| Component / Page | Test File | Focus |
|---|---|---|
| `StatusBadge` | `StatusBadge.test.tsx` | All status mappings (`CONFIRMED`, `CANCELLED`, `PAID`, `PARTIALLY_PAID`, `PENDING`), fallback behavior. |
| `SummaryCard` | `SummaryCard.test.tsx` | Metrics display, trend indicators, dynamic color themes (`teal`, `amber`, `pink`, `blue`). |
| `Modal` | `Modal.test.tsx` | Conditional rendering, backdrop dismiss, Escape key listener, child component rendering. |
| `EmptyState` | `EmptyState.test.tsx` | Fallback messaging, call-to-action button trigger, `LoadingSpinner` behavior. |
| `LoginPage` | `LoginPage.test.tsx` | Email/password input binding, one-click demo chips, auth context integration, error banners. |
| `Sidebar` | `Sidebar.test.tsx` | Dynamic navigation links strictly filtered by active user role (`ADMIN`, `DOCTOR`, `PATIENT`). |
| `RescheduleAppointmentModal` | `RescheduleAppointmentModal.test.tsx` | Asynchronous slot loading, interactive slot selection, patch request submission, conflict error handling. |

### 2.4 End-to-End User Journeys (E2E Verification)
1. **Workflow A — Patient Journey**:
   Login as patient (`patient@medicore.hospital`) → View dashboard → Browse doctors (`/patient/doctors`) → View upcoming appointments (`/patient/appointments`) → Reschedule/cancel modal verification → Review invoices & receipts (`/patient/billing`).
2. **Workflow B — Doctor Journey**:
   Login as doctor (`dr.gregory@medicore.hospital`) → View appointments & patient queue (`/doctor/dashboard`) → Inspect prescriptions (`/doctor/prescriptions`) → Review lab reports (`/doctor/lab-reports`).
3. **Workflow C — Administrator Journey**:
   Login as admin (`admin@medicore.hospital`) → Inspect hospital analytics (`/admin/dashboard`) → Manage physicians (`/admin/doctors`) → Monitor hospital-wide appointments (`/admin/appointments`) → Review billing ledger (`/admin/billing`).

---

## 3. Environment & Configuration Requirements

| Layer | Environment Specification |
|---|---|
| Runtime | Node.js v20+ / Windows PowerShell |
| Database | SQLite (`medicore.db`) managed through Prisma ORM |
| Backend Server | Express v4 + TypeScript on port `5000` |
| Frontend Client | React 18 + Vite on port `5173` |
| Test Frameworks | Vitest v2 / v5, Supertest v7, React Testing Library, jsdom |
