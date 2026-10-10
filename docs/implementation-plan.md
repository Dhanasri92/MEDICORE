# MediCore — Implementation Plan & Phase Roadmap

## 1. Project Overview
**MediCore** is a comprehensive, production-grade Online Hospital Management System built to satisfy both Software Engineering academic requirements and modern Web Development standards. MediCore features an exact recreation of the reference MediKit design language: clean white cards, subtle borders, soft gray background (`#F5F6F8`), vibrant medical blue accent (`#329BFA`), persistent sidebar, top navigation with global search, and role-tailored dashboards.

---

## 2. Six-Phase Incremental SDLC Plan

### Phase 1: Inspection, Architecture & Software Engineering Documentation (Current)
- [x] Inspect existing workspace, runtimes (Node.js v22, npm v10, Git).
- [x] Create comprehensive Software Engineering artifacts:
  - `docs/SRS.md` (Functional & Non-Functional Requirements, 5 Detailed Use Cases).
  - `docs/architecture.md` (System Layering, Security Model, Monolith Architecture).
  - `docs/data-dictionary.md` (PostgreSQL / Relational Data Dictionary).
  - `docs/team-organization.md` (6-Member Team Module Boundaries & Git Strategy).
  - `docs/use-case-diagram.puml` & Mermaid use-case diagrams.
  - `docs/sequence-diagram.puml` (Appointment Booking concurrency & lifecycle).
  - `docs/activity-diagram.puml` (Clinical Encounter & Itemized Billing).
  - `docs/api-contract.md` (REST API Specification).

### Phase 2: Project Setup, Data Layer & Authentication Foundation
- [ ] Initialize monorepo directory layout (`client/`, `server/`, `docs/`).
- [ ] Configure Server:
  - Express + TypeScript + Zod validation.
  - Prisma schema with all 15 entities (Users, Doctors, Patients, Departments, Schedules, Appointments, MedicalRecords, Prescriptions, PrescriptionItems, LabReports, Bills, BillItems, Payments, Notifications, AuditLogs).
  - Database migrations and realistic fictional seed script.
  - Authentication module (Registration, Login, JWT/HttpOnly Cookies, Role Guard, Ownership Guard, Rate Limiting).
- [ ] Configure Client:
  - Vite + React + TypeScript + Tailwind CSS.
  - Design tokens matching MediKit reference (`#329BFA`, `#F5F6F8`, `#FFFFFF`, `#171B22`, `#9298A1`).
  - AppShell layout (persistent sidebar, topbar with search, notifications, user profile menu).
  - Reusable components (SummaryCard, DataTable, StatusBadge, Modal, FormField, EmptyState, LoadingSkeleton).
  - Role-aware routing & AuthContext.

### Phase 3: Core Business Modules (Incremental Build)
- [ ] **Module A: Doctors & Schedules**:
  - Doctor directory with department filter, search, consultation fee, availability.
  - Doctor schedule configuration (working days, start/end hours, slot duration).
  - Doctor profile view and management.
- [ ] **Module B: Appointments & Conflict Prevention**:
  - Interactive appointment booking wizard (select department -> select doctor -> select date -> select available time slot -> reason for visit).
  - Server-side concurrency-safe booking logic with double-booking prevention.
  - Status management (Pending, Confirmed, Completed, Cancelled, No-Show).
  - Patient & Doctor appointment management views.
- [ ] **Module C: Clinical Encounters & Prescriptions**:
  - Medical records attached to appointments and patients.
  - Diagnosis notes, symptoms, clinical observations.
  - Itemized prescription creation (medication name, dosage, frequency, duration, instructions).
  - Printable/downloadable patient prescription view.
- [ ] **Module D: Laboratory Reports & Secure Storage**:
  - Secure file upload for lab reports (PDF/JPG/PNG, max 10MB) stored in private directory outside public web root.
  - Authenticated streaming endpoint `/api/lab-reports/:id/file` with ownership authorization.
  - Lab test metadata, status tracking (Pending, In Progress, Completed), patient report view.
- [ ] **Module E: Billing & Payments**:
  - Itemized bill creation (consultation, lab tests, medications, room charge).
  - Automated tax and total calculation.
  - Clearly labelled simulated payment gateway (Card, UPI, NetBanking, Cash).
  - Official invoice and downloadable/printable receipt.
- [ ] **Module F: Notifications, Audit Logs & Operational Analytics**:
  - Real-time in-app notification center.
  - Comprehensive audit logging for HIPAA/academic security tracking.
  - Database-driven analytics for Admin, Doctor, and Patient dashboards (no hardcoded figures).

### Phase 4: Frontend Dashboards & Visual Fidelity Integration
- [ ] Admin Dashboard: 4 summary metric cards, appointment trend chart, status donut chart, recent appointments table, doctor list, hospital notices, quick action modal.
- [ ] Doctor Dashboard: Today's schedule, patient queue, quick consultation launcher, recent clinical history.
- [ ] Patient Dashboard: Upcoming visits, next appointment alert, recent prescriptions, lab reports, pending bills, one-click booking.
- [ ] Mobile responsive drawer sidebar and adaptive data grids.

### Phase 5: Automated Testing & Verification
- [ ] API integration tests with Vitest & Supertest (Auth, Appointments double-booking prevention, Medical Records ownership, Billing totals, Lab file security).
- [ ] Client component and route tests.
- [ ] Production build verification (`npm run build` on client and server).

### Phase 6: Final Documentation, Seed Data & Delivery
- [ ] Seed database with rich fictional data matching the MediKit reference screenshot (Dr. Robert Fox, Dr. Brandon, Dr. Gregory, Cameron, Jorge, Philip, etc.).
- [ ] Detailed User Manual (`docs/user-manual.md`) with role credentials and feature walkthrough.
- [ ] Comprehensive README with single-command startup.
