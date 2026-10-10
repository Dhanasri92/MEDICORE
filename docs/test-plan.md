# MediCore — Automated Test Plan & Strategy

## 1. Objectives & Quality Goals
The test suite ensures end-to-end data integrity, concurrency protection, authorization boundaries, and clinical accuracy. All tests are automated and executed across local development and continuous delivery pipelines.

---

## 2. Test Pyramid & Scope

```
                ▲
               / \
              /   \
             / E2E \       Critical Workflows (Booking to Billing)
            /-------\
           /  Integ  \     API Route & Concurrency Transactions
          /-----------\
         /    Unit     \   Validation, Tax Calculators, Slot Math
        /---------------\
```

### 2.1 Unit Tests
- Password hashing & token verification.
- Time slot generator & interval subtraction.
- Invoice line-item calculations (subtotal, tax percentages, rounding).
- Zod schema validation rules (email, phone, dates, password complexity).

### 2.2 Integration Tests (Supertest + Database)
- **Authentication**:
  - `POST /api/auth/register`: Successful registration creates both User and Patient records.
  - Duplicate registration with identical email returns HTTP 400/409.
  - Invalid password returns HTTP 401.
  - Role-based route guarding blocks unauthorized roles (e.g., patient calling `/api/admin/doctors`).
- **Appointments & Concurrency**:
  - Valid booking creates appointment with status `CONFIRMED`.
  - Double booking attempt for the same doctor, date, and slot returns HTTP 409 Conflict.
  - Cancellation updates status to `CANCELLED` and releases slot availability.
- **Clinical Records**:
  - Physician can attach clinical record and prescription to appointment.
  - Patient cannot create medical records (HTTP 403).
  - Patient can view only their own medical records.
- **Laboratory Reports**:
  - Secure file upload validates allowed extensions (`.pdf`, `.png`, `.jpg`).
  - Unauthorized download request returns HTTP 403 Forbidden.
- **Billing & Payments**:
  - Generating bill computes correct line items and 5% tax.
  - Processing payment updates status from `UNPAID` to `PAID` and logs payment transaction.
  - Duplicate payment on already paid bill is rejected.

---

## 3. Test Execution Commands

```bash
# Run server automated tests
npm --prefix server test

# Run tests with coverage
npm --prefix server run test:coverage
```
