# MediCore — Bug Report & Defect Remediation Log

This document logs all defects discovered during the Phase 1 audit and subsequent test phases, their root cause analysis, severity classification, and applied fixes.

---

## 1. Prioritized Defect Summary

| Bug ID | Severity | Module | Description | Status |
|---|---|---|---|---|
| **BUG-001** | **Critical** | Billing / Payments | Race condition allowed duplicate payments and negative balance on concurrent requests | **RESOLVED** |
| **BUG-002** | **High** | Appointments | Incomplete feature: Rescheduling appointment was missing backend endpoint and frontend modal | **RESOLVED** |
| **BUG-003** | **High** | Clinical Records | Medical consultation could be documented for cancelled appointments | **RESOLVED** |
| **BUG-004** | **Medium** | Auth / Files | Lab file streaming failed because auth middleware did not accept token in query parameters | **RESOLVED** |
| **BUG-005** | **Medium** | File Uploads | Multer fileFilter rejection returned HTTP 500 instead of HTTP 400 Bad Request | **RESOLVED** |
| **BUG-006** | **Low** | Admin Dashboard | Hardcoded fallback metric strings ('2937', '5453', '170K') used in dashboard cards | **RESOLVED** |
| **BUG-007** | **Low** | Doctor UI | "Start Consultation" button displayed even for cancelled visits | **RESOLVED** |

---

## 2. Defect Analysis & Fix Details

### BUG-001: Race Condition & Duplicate Payment Inconsistency
- **Severity**: **Critical**
- **Location**: `server/src/modules/billing/billing.service.ts`
- **Root Cause**: `processSimulatedPayment` fetched the bill outside the database transaction. Concurrent requests saw the bill as `UNPAID` before either transaction committed, resulting in duplicate charges, overpayment, and invalid status records.
- **Fix Applied**:
  - Moved bill retrieval and balance calculation inside `prisma.$transaction(async (tx) => ...)`.
  - Added strict guard inside the transaction checking `if (bill.status === 'PAID') throw new Error('This invoice has already been fully settled.')`.
  - Added check preventing payments exceeding `bill.balance`.
- **Regression Test**: `tests/integration/billing-payments.integration.test.ts` (Subtest: *DUPLICATE CHARGE PREVENTION*).

---

### BUG-002: Missing Appointment Rescheduling Endpoint & Modal
- **Severity**: **High**
- **Location**: `server/src/modules/appointments/` & `client/src/components/appointments/`
- **Root Cause**: Patient UI allowed cancelling visits, but lacked the capability to reschedule existing visits without losing clinical history. The backend lacked a dedicated rescheduling route.
- **Fix Applied**:
  - Added `rescheduleAppointmentSchema` validating `appointmentDate`, `timeSlot`, and `reason` in `appointment.schema.ts`.
  - Added `rescheduleAppointment` service method in `appointment.service.ts` with checks against cancelled visits and slot collision prevention.
  - Added `PATCH /api/appointments/:id/reschedule` endpoint in `appointment.routes.ts`.
  - Created `RescheduleAppointmentModal.tsx` in `client/src/components/appointments/` with live slot loading and connected it into `PatientAppointmentsPage.tsx`.
- **Regression Test**: `tests/integration/appointments.integration.test.ts` & `client/tests/components/RescheduleAppointmentModal.test.tsx`.

---

### BUG-003: Clinical Consultation Permitted on Cancelled Appointments
- **Severity**: **High**
- **Location**: `server/src/modules/medical-records/record.service.ts`
- **Root Cause**: `createMedicalRecordWithPrescription` verified the appointment existed and belonged to the patient, but did not check `appointment.status`. If a patient cancelled their visit, a doctor could still document notes and prescriptions against it.
- **Fix Applied**:
  - Added status guard in `record.service.ts`:
    ```typescript
    if (appointment.status === 'CANCELLED') {
      const err: any = new Error('Cannot document clinical consultation for a cancelled appointment.');
      err.statusCode = 400;
      throw err;
    }
    ```
- **Regression Test**: `tests/integration/clinical-records.integration.test.ts` (Subtest: *should reject documenting consultation for a CANCELLED appointment with HTTP 400*).

---

### BUG-004: File Streaming Blocked Due to Header-Only Token Extraction
- **Severity**: **Medium**
- **Location**: `server/src/middleware/auth.middleware.ts`
- **Root Cause**: File downloads through `window.open` or `<a>` tags cannot attach custom `Authorization: Bearer` headers. The auth middleware only parsed `req.headers.authorization`, rejecting legitimate authenticated downloads.
- **Fix Applied**:
  - Extended token extraction in `authenticate` middleware to check `req.query.token as string` if the `Authorization` header is absent:
    ```typescript
    const queryToken = req.query?.token as string | undefined;
    const token = headerToken || queryToken;
    ```
- **Regression Test**: `tests/integration/laboratory.integration.test.ts` (Subtest: *should allow patient to stream/download their lab report using auth token in query string*).

---

### BUG-005: Multer File Filter Rejection Threw HTTP 500
- **Severity**: **Medium**
- **Location**: `server/src/middleware/upload.middleware.ts`
- **Root Cause**: When a client uploaded an unsupported file type (e.g. `.txt`), Multer's `fileFilter` called `cb(new Error(...))`. Because the Error object lacked a `statusCode = 400` property, Express error middleware treated it as an unexpected server crash and returned HTTP 500.
- **Fix Applied**:
  - Explicitly set `err.statusCode = 400` on the error in `upload.middleware.ts`:
    ```typescript
    const err: any = new Error('Invalid file type. Only PDF, PNG, and JPEG formats are permitted for laboratory reports.');
    err.statusCode = 400;
    cb(err);
    ```
- **Regression Test**: `tests/integration/laboratory.integration.test.ts` (Subtest: *should reject lab upload with unsupported file type with HTTP 400*).

---

### BUG-006: Hardcoded Fallback Metrics in Admin Dashboard
- **Severity**: **Low**
- **Location**: `client/src/pages/admin/AdminDashboardPage.tsx`
- **Root Cause**: When database numbers were `0` or initial state was loading, the dashboard cards displayed hardcoded placeholder strings (`2937`, `5453`, `170K`) instead of real application metrics.
- **Fix Applied**:
  - Replaced hardcoded fallbacks with reactive metrics: `stats?.totalPatients ?? 0`, `stats?.activeDoctors ?? 0`, and formatted earnings.
- **Regression Test**: `tests/integration/admin-analytics.integration.test.ts` and E2E Admin Dashboard verification.

---

### BUG-007: "Start Consultation" Button Visible on Cancelled Visits
- **Severity**: **Low**
- **Location**: `client/src/pages/doctor/DoctorAppointmentsPage.tsx` & `DoctorDashboardPage.tsx`
- **Root Cause**: The action column rendered "Start Consultation" for any appointment whose status was not `COMPLETED`, including `CANCELLED` visits.
- **Fix Applied**:
  - Guarded action buttons to only display for `CONFIRMED` or `PENDING` visits:
    ```tsx
    {(apt.status === 'CONFIRMED' || apt.status === 'PENDING') && (
      <button onClick={() => handleStartConsultation(apt)} ...>
        Start Consultation
      </button>
    )}
    ```
- **Regression Test**: E2E Doctor Journey verification.
