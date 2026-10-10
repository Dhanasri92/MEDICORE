# MediCore — 6-Member Team Organization & Module Boundaries

To ensure concurrent, non-conflicting collaboration across our 6-member engineering team, MediCore defines strict ownership boundaries, shared contract specifications, and Git workflow conventions.

---

## 1. Team Ownership Matrix

| Member | Primary Role | Domain Slices & Components | Backend Modules | Test & Delivery Focus |
|---|---|---|---|---|
| **Member 1** | System Architect & Integration Lead | Monorepo setup, AppShell, Theme tokens, Auth UI (`/login`, `/register`), Protected Routes | `auth`, `users`, JWT middleware, Error handling | Auth integration tests, Security headers, Root build pipelines |
| **Member 2** | Patient Experience Specialist | Patient Portal (`/patient/dashboard`, `/patient/doctors`, `/patient/appointments`, `/patient/profile`) | `appointments` (patient booking & cancellations), Doctor discovery APIs | Slot calculation, Concurrency test, Booking lifecycle |
| **Member 3** | Clinical Systems Specialist | Doctor Portal (`/doctor/dashboard`, `/doctor/appointments`, `/doctor/consultations/:id`, `/doctor/prescriptions`) | `medical-records`, `prescriptions`, `schedules` | Clinical validation tests, Prescription item cascading, Print styling |
| **Member 4** | Hospital Administration Specialist | Admin Portal (`/admin/dashboard`, `/admin/doctors`, `/admin/patients`, `/admin/departments`, `/admin/schedules`) | `doctors` (admin CRUD), `departments`, operational aggregates | Admin role guards, Doctor provisioning, Analytics calculations |
| **Member 5** | Financial Systems Specialist | Billing Portal (`/admin/billing`, `/patient/billing`), Invoice view, Receipt view | `billing`, `payments`, tax calculations | Line-item calculation tests, Simulated gateway idempotency |
| **Member 6** | Diagnostic & QA / Compliance Lead | Lab Reports (`/admin/lab-reports`, `/patient/lab-reports`), Notification bell, Audit viewer | `laboratory` (file upload/stream), `notifications`, `audit-logs` | MIME validation, Private storage isolation, End-to-end regression |

---

## 2. Git Branching & Pull Request Strategy

```
main (Production / Stable Releases)
  └── develop (Integration Branch)
        ├── feature/m1-auth-shell
        ├── feature/m2-patient-booking
        ├── feature/m3-doctor-clinical
        ├── feature/m4-admin-operations
        ├── feature/m5-billing-payments
        └── feature/m6-lab-notifications
```

### Branch Conventions
- Feature branches: `feature/m<number>-<short-description>` (e.g. `feature/m2-appointment-wizard`)
- Bugfix branches: `fix/m<number>-<issue-key>`
- Schema migrations: Any modification to `prisma/schema.prisma` requires prior cross-team approval and must be committed with an accompanying migration file.

### Pull Request & Integration Rules
1. Every PR must include unit or integration tests verifying new business logic.
2. All PRs require review and approval by the Integration Lead (Member 1).
3. Automated linting (`npm run lint`), type-checking (`npm run type-check`), and test suites must pass before merge.
4. Schema migrations are applied sequentially using Prisma migrations.
