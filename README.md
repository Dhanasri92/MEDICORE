# MediCore — Online Hospital Management System

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.4-646cff.svg)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.0-lightgrey.svg)](https://expressjs.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-6.4-2D3748.svg)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-3.2-yellow.svg)](https://vitest.dev/)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg)]()

> **Production-Quality, Database-Backed Hospital Information System (HIS)**  
> Developed to fulfill both **Software Engineering Academic Standards** and **Modern Full-Stack Web Development Specifications**.  
> Primary UI/UX Design Language reproduces the **MediKit Healthcare Administration** design reference with exact design tokens, card proportions, visual whitespace, and role-tailored dashboards.

---

## 1. Executive Summary & Design Reference

MediCore is an enterprise-grade hospital management platform providing end-to-end clinical and administrative workflows across three primary user roles: **Hospital Administrators**, **Medical Practitioners (Doctors)**, and **Patients**.

### 🎨 Visual Fidelity to the MediKit Reference
The user interface strictly adheres to the attached **MediKit Dribbble Reference Design**:
* **Palette Tokens:** Canvas `#F5F6F8`, Pristine White Cards `#FFFFFF`, Primary Medical Blue `#329BFA`, Deep Contrast Typography `#171B22`, Secondary Metadata `#9298A1`, and Refined Borders `#E9EDF2`.
* **Sidebar Hierarchy:** Persistent navigation featuring MediCore branding, Overview, Doctors, Patients, Departments, Appointments, Pharmacy, Billing/Payments, Reports, Notices, and Settings, plus the bottom "+ Create New" action card.
* **Top Navigation:** Global cross-entity search bar, live notification center with unread counters, profile badge, and role chip.
* **Administrator Overview:** 
  1. **Four Top Summary Cards:** Matching circular colored icon badges (Doctors: Teal/2937, Staffs: Amber/5453, Patients: Pink/170K, Pharmacies: Blue/21).
  2. **Three-Column Analytical Section:** 
     - **Hospital Birth & Death Analytics:** Radial concentric chart (Birth Case 45.07%, Accident Case 18.43%, Death Case 29.05%).
     - **Hospital Maintenance Reports:** Live facilities bulletin (Room 501 AC, Staff leave schedules, Sanitization updates).
     - **Clinical Success Rates:** Animated progress indicators (Anesthetics 83%, Gynecology 95%, Neurology 100%, Oncology 89%, Orthopedics 97%, Physiotherapy 100%).
  3. **Online Appointment Schedule Table:** High-density table featuring patient names, times, ages, genders, assigned physicians, and inline actions.
  4. **Active Doctors Roster:** Avatar-rich physician directory with clinical specialties and quick status indicators.

---

## 2. Core Feature Matrix by Role

| Domain / Workflow | Patient Portal | Doctor Portal | Hospital Administrator |
| :--- | :---: | :---: | :---: |
| **Self-Registration & Secure Login** | ✅ | ❌ (Controlled Provisioning) | ❌ (System Seeded) |
| **Role-Based Access Control (RBAC)** | ✅ | ✅ | ✅ |
| **Doctor Discovery & Specializations** | ✅ | ✅ | ✅ |
| **Schedule & Availability Configuration** | ❌ | ✅ | ✅ |
| **Concurrency-Safe Appointment Booking** | ✅ | ❌ | ✅ |
| **Appointment Lifecycle (Confirm/Cancel)** | ✅ (Cancel) | ✅ (Update Status) | ✅ (Full Admin Control) |
| **Clinical Encounter & Diagnosis Notes** | ❌ (Read Only) | ✅ (Authoring & Vitals) | ❌ (Restricted Confidentiality) |
| **Itemized Electronic Prescriptions** | ✅ (View & Print) | ✅ (Authoring) | ❌ (Restricted Confidentiality) |
| **Private Diagnostic Laboratory Reports** | ✅ (Released Only) | ✅ (View Authorized) | ✅ (Upload & Release Control) |
| **Itemized Invoicing & Tax Calculation** | ✅ (View Bills) | ❌ | ✅ (Create & Manage) |
| **Simulated Payment Gateway & Receipts** | ✅ (Card/UPI/Cash) | ❌ | ✅ (Audit & Reconciliation) |
| **In-App Notification Center** | ✅ | ✅ | ✅ |
| **Regulatory Immutable Audit Trail** | ❌ (Forbidden 403) | ❌ (Forbidden 403) | ✅ (Full Compliance Log) |
| **Database-Aggregated Real Analytics** | ✅ (Patient Metrics) | ✅ (Clinical Queue) | ✅ (Hospital-Wide Metrics) |

---

## 3. Technology Stack & Architectural Architecture

### 3.1 Technology Stack
* **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide React icons, React Router DOM, TanStack Query, Recharts.
* **Backend:** Node.js, Express 5, TypeScript, Zod Schema Validation, Prisma ORM 6.
* **Database:** Dual-Support:
  - **Local Development / Evaluation:** Self-contained SQLite (`medicore.db`) with zero external service dependencies.
  - **Production / Enterprise Deployment:** PostgreSQL 16 schema (`schema.postgresql.prisma`) and `docker-compose.yml`.
* **Security & Crypto:** Argon2 / Bcrypt password hashing, JWT bearer authentication with RBAC middleware, HTTP Parameter pollution defense, Helmet security headers, CORS isolation, and private file streaming.
* **Testing:** Vitest and Supertest integration suite with 100% passing rate.

### 3.2 High-Integrity Concurrency Engine
Appointment scheduling executes inside a **Prisma ACID Transaction** enforcing slot exclusivity:
```typescript
await prisma.$transaction(async (tx) => {
  const existing = await tx.appointment.findFirst({
    where: {
      doctorId,
      appointmentDate,
      timeSlot,
      status: { not: 'CANCELLED' }
    }
  });
  if (existing) {
    throw new AppError('This time slot is already booked. Please choose an alternate slot.', 409);
  }
  // Creates appointment and atomically creates in-app notification
});
```
Simultaneous bookings for identical doctor, date, and slot reject with **HTTP 409 Conflict**.

### 3.3 Isolated Diagnostic Document Storage
Uploaded laboratory PDF/imaging documents are saved to `server/uploads/lab-reports/` outside the web root. Files are renamed using cryptographic UUIDs and can **only** be accessed via the authenticated stream endpoint `GET /api/lab-reports/:id/file`, strictly validating patient ownership or physician authorization.

---

## 4. Demo Credentials & Quick Sign-In

The login screen provides **1-Click Demo Login chips** for rapid verification:

| User Role | Display Name | Email Address | Password |
| :--- | :--- | :--- | :--- |
| **Hospital Administrator** | Dr. Robert Fox | `admin@medicore.hospital` | `Admin@123` |
| **Medical Practitioner (Doctor)** | Dr. Gregory (Cardiologist) | `dr.gregory@medicore.hospital` | `Doctor@123` |
| **Medical Practitioner (Doctor)** | Dr. Brandon (Gynecologist) | `dr.brandon@medicore.hospital` | `Doctor@123` |
| **Registered Patient** | Cameron (Patient #1) | `cameron@example.com` | `Patient@123` |
| **Registered Patient** | Standard Demo Patient | `patient@medicore.hospital` | `Patient@123` |

---

## 5. Quick Start & Setup Guide

### 5.1 Prerequisites
* [Node.js](https://nodejs.org/) v18.0.0 or higher
* npm v9.0.0 or higher

### 5.2 One-Command Automated Setup
From the project root directory, run:
```bash
npm run setup
```
This single command automatically:
1. Installs root, server, and client npm dependencies.
2. Generates the Prisma Client with the Windows ARM64 / x64 binary engine.
3. Synchronizes database tables.
4. Populates fictional demo data matching the MediKit reference screen.

### 5.3 Launch the Application
To run both backend API (Port 5000) and frontend client (Port 5173) concurrently:
```bash
npm run dev
```
Alternatively, launch them in separate terminals:
```bash
# Terminal 1: Backend API
npm run dev:server

# Terminal 2: Frontend Web Client
npm run dev:client
```
* **Client Portal:** [http://localhost:5173](http://localhost:5173)
* **Backend API Health:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

### 5.4 Run Automated Integration Tests
Execute the Vitest suite covering Health, Auth, RBAC boundaries, Concurrency Conflict Prevention, Billing calculations, and Real Analytics:
```bash
npm test
```
*Result: **13 / 13 tests passing** (100% pass rate).*

### 5.5 Production Build Validation
```bash
npm run build
```
Compiles both TypeScript backend (`tsc`) and bundles the React frontend via Vite with zero errors.

---

## 6. Software Engineering Documentation Index

Full academic documentation according to Software Engineering standards is maintained in the [`docs/`](file:///c:/Users/92113/Downloads/MEDICORE/docs) directory:

| Document | File Link | Description |
| :--- | :--- | :--- |
| **Software Requirements Specification (SRS)** | [docs/SRS.md](file:///c:/Users/92113/Downloads/MEDICORE/docs/SRS.md) | IEEE 830 compliant SRS with requirement IDs (`FR-AUTH-01` to `FR-NOTIF-02`, `NFR-SEC-01` to `NFR-UI-02`) and 5 detailed use cases. |
| **System Architecture Document** | [docs/architecture.md](file:///c:/Users/92113/Downloads/MEDICORE/docs/architecture.md) | Layered modular monolith, security boundaries, and concurrency guard strategy. |
| **Database Data Dictionary** | [docs/data-dictionary.md](file:///c:/Users/92113/Downloads/MEDICORE/docs/data-dictionary.md) | Comprehensive dictionary for all 15 relational entities, data types, keys, and constraints. |
| **REST API Contract** | [docs/api-contract.md](file:///c:/Users/92113/Downloads/MEDICORE/docs/api-contract.md) | Detailed endpoint schema, request bodies, query parameters, and error responses. |
| **UML Use Case Diagram** | [docs/use-case-diagram.puml](file:///c:/Users/92113/Downloads/MEDICORE/docs/use-case-diagram.puml) | PlantUML specification of actor interactions across Patient, Doctor, and Admin. |
| **UML Sequence Diagram** | [docs/sequence-diagram.puml](file:///c:/Users/92113/Downloads/MEDICORE/docs/sequence-diagram.puml) | Appointment booking lifecycle showing transaction boundaries and conflict handling. |
| **UML Activity Diagram** | [docs/activity-diagram.puml](file:///c:/Users/92113/Downloads/MEDICORE/docs/activity-diagram.puml) | Clinical consultation, electronic prescription authoring, and billing activity flow. |
| **Six-Member Team Organization** | [docs/team-organization.md](file:///c:/Users/92113/Downloads/MEDICORE/docs/team-organization.md) | Module boundaries, Git branch strategies, and pull request integration protocols. |
| **Automated Test Plan** | [docs/test-plan.md](file:///c:/Users/92113/Downloads/MEDICORE/docs/test-plan.md) | Unit, integration, security, and concurrency test suites. |
| **User Manual** | [docs/user-manual.md](file:///c:/Users/92113/Downloads/MEDICORE/docs/user-manual.md) | Step-by-step illustrated operational guide for Administrators, Doctors, and Patients. |
| **SDLC Implementation Plan** | [docs/implementation-plan.md](file:///c:/Users/92113/Downloads/MEDICORE/docs/implementation-plan.md) | Incremental SDLC methodology across 6 milestones. |

---

## 7. Six-Member Team Responsibility Matrix

The system architecture cleanly isolates modules to enable a 6-member engineering team to collaborate smoothly without conflicting pull requests:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MediCore Shared Contracts                       │
│              (Prisma Relational Schema & TypeScript API Types)         │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
      ┌────────────────────────────┼────────────────────────────┐
      │                            │                            │
┌─────▼──────┐              ┌──────▼─────┐               ┌──────▼─────┐
│  Member 1  │              │  Member 2  │               │  Member 3  │
│Architecture│              │  Patient   │               │   Doctor   │
│ Auth & Core│              │  Discovery │               │Consultation│
│  AppShell  │              │ & Booking  │               │& Rx Engine │
└─────┬──────┘              └──────┬─────┘               └──────┬─────┘
      │                            │                            │
      └────────────────────────────┼────────────────────────────┘
                                   │
      ┌────────────────────────────┼────────────────────────────┐
      │                            │                            │
┌─────▼──────┐              ┌──────▼─────┐               ┌──────▼─────┐
│  Member 4  │              │  Member 5  │               │  Member 6  │
│  Hospital  │              │  Billing,  │               │ Diagnostic │
│ Admin Wing │              │ Invoices & │               │Lab Storage │
│ & Personnel│              │  Payments  │               │& Auditing  │
└────────────┘              └────────────┘               └────────────┘
```

| Member | Primary Focus Area | Assigned Modules & Directories |
| :--- | :--- | :--- |
| **Member 1** (Lead) | Architecture, Auth & Shared UI | `server/src/modules/auth/`, `client/src/components/common/`, `client/src/layouts/AppShell.tsx` |
| **Member 2** | Patient Portal & Booking Engine | `server/src/modules/appointments/`, `client/src/pages/patient/`, Booking Modal |
| **Member 3** | Doctor Portal & Prescriptions | `server/src/modules/medical-records/`, `server/src/modules/prescriptions/`, `client/src/pages/doctor/` |
| **Member 4** | Administrator Portal & Personnel | `server/src/modules/doctors/`, `server/src/modules/schedules/`, `client/src/pages/admin/` |
| **Member 5** | Billing & Payment Gateway | `server/src/modules/billing/`, Invoices, Simulated Gateway, `ReceiptModal.tsx` |
| **Member 6** | Laboratory Reports & Audit Compliance | `server/src/modules/laboratory/`, `server/src/modules/audit-logs/`, Isolated Storage |

---

## 8. Enterprise PostgreSQL Deployment

For production deployments using PostgreSQL:
1. Copy the PostgreSQL schema:
   ```bash
   cp server/prisma/schema.postgresql.prisma server/prisma/schema.prisma
   ```
2. Launch the PostgreSQL container:
   ```bash
   docker compose up -d
   ```
3. Update `DATABASE_URL` in `server/.env`:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/medicore?schema=public"
   ```
4. Push migrations and seed data:
   ```bash
   npm run db:push
   npm run db:seed
   ```

---

## 9. License & Academic Attribution
Developed as an advanced academic software engineering capstone project. All rights reserved. Design language inspired by the MediKit administration design system.
