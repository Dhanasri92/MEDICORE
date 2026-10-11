# MediCore — Testing & Reproduction Guide

This guide provides the exact commands and reproduction steps for running tests, verifying bug fixes, and executing end-to-end flows.

---

## 1. Prerequisites & Environment Setup

Ensure Node.js v20+ and npm are installed.

```bash
# Clone / navigate to workspace root
cd c:\Users\92113\Downloads\MEDICORE

# Install dependencies across all packages
npm run install:all

# Generate Prisma Client & prepare SQLite database
npm run db:push
npm run db:seed
```

---

## 2. Running Automated Tests

### 2.1 Backend Tests (Unit + Integration)
The backend suite uses **Vitest** and **Supertest** executing against the local Prisma SQLite database.

```bash
# Run all 14 backend test suites (144 tests)
npm --prefix server test

# Run a specific unit test file
npx --prefix server vitest run tests/unit/validation.unit.test.ts
npx --prefix server vitest run tests/unit/billing-calculations.unit.test.ts
npx --prefix server vitest run tests/unit/appointment-status.unit.test.ts

# Run a specific integration test file
npx --prefix server vitest run tests/integration/auth.integration.test.ts
npx --prefix server vitest run tests/integration/appointments.integration.test.ts
npx --prefix server vitest run tests/integration/billing-payments.integration.test.ts
npx --prefix server vitest run tests/integration/laboratory.integration.test.ts
```

### 2.2 Frontend Tests (Component + Validation)
The client suite uses **Vitest** + **React Testing Library** + **jsdom**.

```bash
# Run all 7 client test suites (28 tests)
npm --prefix client test

# Run a specific component test file
npx --prefix client vitest run tests/components/StatusBadge.test.tsx
npx --prefix client vitest run tests/components/Modal.test.tsx
npx --prefix client vitest run tests/components/LoginPage.test.tsx
npx --prefix client vitest run tests/components/Sidebar.test.tsx
npx --prefix client vitest run tests/components/RescheduleAppointmentModal.test.tsx
```

---

## 3. Building for Production

Verify TypeScript compilation and frontend bundling:

```bash
# Build both server (tsc) and client (tsc && vite build)
npm run build
```

Expected output:
- Server: Clean exit code 0 (`tsc`).
- Client: Clean exit code 0, producing optimized bundles in `client/dist/`.

---

## 4. Running the Complete Application Locally

To start both backend and frontend servers simultaneously:

```bash
npm run dev
```

Or run individually:

```bash
# Terminal 1: Backend API Server (Port 5000)
npm --prefix server run dev

# Terminal 2: Frontend Client (Port 5173)
npm --prefix client run dev
```

### Endpoints:
- **Frontend Web UI**: `http://localhost:5173`
- **Backend API Base**: `http://localhost:5000/api`
- **Health Check**: `http://localhost:5000/api/health`

---

## 5. Seeded Test Credentials

| Role | Email | Password | Intended Portal |
|---|---|---|---|
| **Administrator** | `admin@medicore.hospital` | `Admin@123` | `/admin/dashboard` |
| **Doctor** | `dr.gregory@medicore.hospital` | `Doctor@123` | `/doctor/dashboard` |
| **Doctor (Alternate)**| `dr.brandon@medicore.hospital`| `Doctor@123` | `/doctor/dashboard` |
| **Patient** | `patient@medicore.hospital` | `Patient@123` | `/patient/dashboard` |

---

## 6. How to Reproduce & Verify Fixed Defects

### Reproducing BUG-001 (Duplicate Payment Race Condition)
```bash
npx --prefix server vitest run tests/integration/billing-payments.integration.test.ts -t "DUPLICATE CHARGE PREVENTION"
```
*Expected Result*: Second payment on settled bill is rejected with HTTP 400 (`This invoice has already been fully settled`).

### Reproducing BUG-002 (Appointment Rescheduling)
```bash
npx --prefix server vitest run tests/integration/appointments.integration.test.ts -t "Rescheduling Appointments"
```
*Expected Result*: Rescheduling succeeds to open slots with HTTP 200, but is rejected with HTTP 409 if slot is occupied or HTTP 400 if appointment was cancelled.

### Reproducing BUG-003 (Cancelled Appointment Clinical Guard)
```bash
npx --prefix server vitest run tests/integration/clinical-records.integration.test.ts -t "should reject documenting consultation for a CANCELLED appointment"
```
*Expected Result*: Request returns HTTP 400 Bad Request with message `Cannot document clinical consultation for a cancelled appointment`.

### Reproducing BUG-005 (File Upload Validation Rejection)
```bash
npx --prefix server vitest run tests/integration/laboratory.integration.test.ts -t "should reject lab upload with unsupported file type"
```
*Expected Result*: Upload of `.txt` file returns HTTP 400 Bad Request with message `Only PDF, PNG, and JPEG formats are permitted for laboratory reports`.
