# Software Requirements Specification (SRS)
## Project: MediCore Online Hospital Management System

---

## 1. Introduction

### 1.1 Purpose
This document specifies the software requirements for the **MediCore Online Hospital Management System**. MediCore provides a secure, role-based, multi-tiered digital healthcare management platform designed for hospital administrators, healthcare practitioners (doctors), and patients.

### 1.2 Scope
MediCore automates and centralizes clinical, administrative, and financial hospital operations. The core capabilities encompass patient self-registration, credential-based authentication, physician directory search, conflict-safe appointment booking, clinical consultation documentation, electronic prescriptions with itemized medications, secure private laboratory report management, itemized patient billing with simulated transaction processing, in-app notifications, and auditable system logging.

---

## 2. Overall Description

### 2.1 System Environment & Architecture
MediCore is structured as a modular monolith adhering to clean architectural separation:
1. **Presentation Layer**: Single Page Application (SPA) built with React 18, TypeScript, Tailwind CSS, Lucide React icons, and Recharts.
2. **Application / API Layer**: RESTful Express service in TypeScript providing input validation (Zod), JWT/session authentication, role-based access control (RBAC), and transactional business rules.
3. **Data Layer**: Relational database (PostgreSQL / SQLite compatibility) managed via Prisma ORM with foreign key integrity and ACID guarantees.
4. **Protected File Storage Layer**: Local secure filesystem storage for medical documents and laboratory reports, completely quarantined from public static serving.

### 2.2 User Classes and Characteristics
- **Patient**: Registered public user seeking medical care. Can manage their personal medical profile, schedule appointments with doctors, view assigned clinical encounters, download prescriptions, view verified lab reports, and settle outstanding bills.
- **Doctor (Physician)**: Medical specialist managing a designated schedule. Can view appointment queues, conduct clinical consultations, author diagnoses and prescription regimens, review patient lab records, and update visit statuses.
- **Hospital Administrator**: Privileged operational staff member. Manages doctor directories, departments, master appointment calendars, itemized hospital invoices, lab report uploads, system audit logs, and hospital notices.

---

## 3. Specific Requirements

### 3.1 Functional Requirements (FR)

#### Category 1: Authentication & Account Management
- **FR-AUTH-01**: The system shall permit new patients to register using valid full name, unique email address, password (minimum 8 characters), contact phone number, date of birth, and gender.
- **FR-AUTH-02**: The system shall hash all passwords using a cryptographically secure algorithm (bcrypt / argon2) with appropriate work factor prior to persistence.
- **FR-AUTH-03**: The system shall issue cryptographically signed session tokens upon successful credential verification, delivering them via secure HttpOnly cookies or Authorization Bearer tokens.
- **FR-AUTH-04**: The system shall enforce role-based access control on both client route navigation and backend API endpoints for `ADMIN`, `DOCTOR`, and `PATIENT` roles.
- **FR-AUTH-05**: The system shall rate-limit authentication endpoints to mitigate brute-force credential stuffing.
- **FR-AUTH-06**: The system shall invalidate active sessions and clear client authentication tokens upon logout.

#### Category 2: Doctor & Department Management
- **FR-DOC-01**: The system shall maintain physician profiles including full name, department, specialization, qualifications, years of experience, consultation fee, and active status.
- **FR-DOC-02**: The system shall allow administrators to create, update, activate, and deactivate doctor accounts.
- **FR-DOC-03**: The system shall allow users to search and filter doctors by name, department, specialization, and availability.
- **FR-DOC-04**: The system shall allow doctors and administrators to configure weekly working schedules, consultation hours, and slot durations (e.g., 30 minutes).

#### Category 3: Appointment Scheduling & Conflict Prevention
- **FR-APT-01**: The system shall present available appointment slots for a selected doctor and target date dynamically, computing available slots by subtracting booked/active appointments from the doctor's working schedule.
- **FR-APT-02**: The system shall execute appointment booking within a concurrency-safe database transaction to prevent double-booking of identical doctor, date, and time combinations.
- **FR-APT-03**: The system shall assign an initial status of `CONFIRMED` or `PENDING` upon appointment creation and record patient reason for visit.
- **FR-APT-04**: The system shall enforce permitted appointment status transitions: `PENDING` -> `CONFIRMED` -> `COMPLETED`, or to `CANCELLED` / `NO_SHOW`.
- **FR-APT-05**: The system shall permit patients to cancel eligible upcoming appointments up to 2 hours prior to scheduled time, immediately releasing the slot for subsequent bookings.

#### Category 4: Clinical Encounters & Prescriptions
- **FR-CLN-01**: The system shall allow attending physicians to document clinical encounters, recording diagnosis, symptoms, clinical notes, and physical examination findings.
- **FR-CLN-02**: The system shall allow physicians to create electronic prescriptions linked to an encounter or appointment.
- **FR-CLN-03**: The system shall record itemized prescription entries including medication name, dosage form, dosage strength, frequency, duration, and special patient instructions.
- **FR-CLN-04**: The system shall provide patients with read-only access to their issued prescriptions in a print-ready, formatted clinical view.
- **FR-CLN-05**: The system shall prevent modification of completed medical records by non-authoring parties and maintain an audit trail of modifications.

#### Category 5: Laboratory Reports & Secure Storage
- **FR-LAB-01**: The system shall allow administrators and laboratory staff to create lab report metadata linked to patients and clinical visits.
- **FR-LAB-02**: The system shall accept report file uploads (PDF, JPEG, PNG; max size 10MB), assigning randomized storage filenames outside public web directories.
- **FR-LAB-03**: The system shall restrict file downloads to authenticated users possessing valid ownership or clinical authorization (`PATIENT` owning the record, assigned `DOCTOR`, or `ADMIN`).
- **FR-LAB-04**: The system shall track report status through `ORDERED`, `SAMPLE_COLLECTED`, `IN_PROGRESS`, and `COMPLETED`.

#### Category 6: Billing & Financial Management
- **FR-BIL-01**: The system shall allow administrators to generate itemized invoices comprising consultation fees, procedure fees, medications, laboratory tests, and facility charges.
- **FR-BIL-02**: The system shall automatically compute subtotal, applied tax (e.g., 5%), and gross invoice amount on the server.
- **FR-BIL-03**: The system shall track bill status through `UNPAID`, `PARTIALLY_PAID`, and `PAID`.
- **FR-BIL-04**: The system shall provide a simulated payment gateway facilitating test transactions via Credit/Debit Card, UPI, NetBanking, and Cash, recording payment method, transaction reference, and timestamp.
- **FR-BIL-05**: The system shall generate printable, formatted tax receipts detailing transaction references upon settlement.

#### Category 7: Notifications & Audit Logging
- **FR-NOTIF-01**: The system shall generate in-app notification records for appointments, clinical encounters, released lab reports, and bill generations.
- **FR-NOTIF-02**: The system shall maintain unread notification badges and allow users to mark notifications as read.
- **FR-AUD-01**: The system shall maintain immutable audit log entries recording actor ID, role, action performed, entity affected, IP address, and timestamp for all sensitive clinical and administrative operations.

---

### 3.2 Non-Functional Requirements (NFR)

#### Security & Compliance
- **NFR-SEC-01**: All sensitive API endpoints shall require authenticated tokens with least-privilege role verification.
- **NFR-SEC-02**: Passwords shall be salted and hashed using bcrypt with at least 10 rounds.
- **NFR-SEC-03**: Medical files and lab reports shall never be stored in or served directly from public web directories.
- **NFR-SEC-04**: All user inputs shall undergo server-side schema validation using Zod before database queries to eliminate injection vulnerabilities.

#### Performance & Reliability
- **NFR-PERF-01**: Standard dashboard read APIs shall respond within 250 milliseconds under standard load.
- **NFR-PERF-02**: Relational database transactions shall ensure complete ACID properties for scheduling and financial transactions.
- **NFR-REL-01**: The application shall gracefully handle empty database states without throwing unhandled exceptions or rendering broken layouts.

#### Usability & Design
- **NFR-UI-01**: The user interface shall faithfully reproduce the MediKit visual language: `#329BFA` primary blue, `#F5F6F8` canvas background, `#FFFFFF` crisp cards, rounded corners, subtle shadows, clean typography, and responsive sidebar navigation.
- **NFR-UI-02**: The application shall remain fully functional and responsive across desktop (>= 1280px), tablet (768px - 1024px), and mobile (< 768px) viewports.

---

## 4. Detailed Use Case Specifications

### Use Case 1: Patient Self-Registration & First Login
- **Primary Actor**: Prospective Patient
- **Preconditions**: User possesses a unique email address not previously registered.
- **Main Success Scenario**:
  1. Patient navigates to `/register` and submits their full name, email, password, phone, DOB, and gender.
  2. Server validates inputs against Zod schema, checks for email uniqueness, hashes the password, and creates both `User` and `Patient` database records inside a transaction.
  3. Server returns success response and redirects patient to `/login`.
  4. Patient submits credentials; server verifies password hash, generates a secure JWT token, and initializes user state.
  5. Patient is redirected to `/patient/dashboard` with personalized welcoming metrics.
- **Extensions**:
  - 2a. Email already exists: System displays clear inline error "An account with this email address already exists" without revealing internal stack traces.

### Use Case 2: Conflict-Free Appointment Scheduling
- **Primary Actor**: Patient
- **Preconditions**: Patient is authenticated; Doctor has active availability schedule.
- **Main Success Scenario**:
  1. Patient navigates to `/patient/appointments/book`.
  2. Patient selects Department, chooses Doctor, and selects target date on date picker.
  3. Client queries `/api/doctors/:id/availability?date=YYYY-MM-DD`. Server returns array of time slots tagged with availability status.
  4. Patient selects an open slot (e.g. 10:00 AM), enters reason for visit, and clicks "Confirm Booking".
  5. Server initiates database transaction with exclusive lock check: verifies slot has not been concurrently reserved.
  6. Server creates `Appointment` record with status `CONFIRMED`, creates notification for Doctor and Patient, records audit log, and commits transaction.
  7. Client displays success modal and redirects to `/patient/appointments`.
- **Extensions**:
  - 5a. Slot concurrently taken: Transaction detects conflict, aborts insert, and returns HTTP 409 Conflict with message "This slot was just booked by another patient. Please select another time."

### Use Case 3: Clinical Consultation & Electronic Prescription Issuance
- **Primary Actor**: Doctor
- **Preconditions**: Doctor has an appointment scheduled with patient in status `CONFIRMED`.
- **Main Success Scenario**:
  1. Doctor opens `/doctor/appointments`, locates patient in queue, and clicks "Start Consultation".
  2. System transitions appointment to in-consultation and presents patient clinical record editor.
  3. Doctor enters symptoms, clinical observations, physical exam notes, and diagnosis.
  4. Doctor clicks "Add Medication" and enters itemized lines (e.g., Amoxicillin, 500mg, 1 tablet 3x daily, 7 days, "Take after food").
  5. Doctor submits consultation; server creates `MedicalRecord` and linked `Prescription` with `PrescriptionItem` records in an atomic transaction.
  6. Appointment status updates to `COMPLETED`. Notification dispatched to patient informing them that their prescription is ready.
  7. Patient can immediately view, download, or print the prescription from `/patient/prescriptions`.

### Use Case 4: Private Lab Report Ingestion & Authorized Retrieval
- **Primary Actor**: Hospital Administrator / Lab Technician (Upload) & Patient (Download)
- **Preconditions**: Patient has undergone prescribed diagnostic test.
- **Main Success Scenario**:
  1. Admin opens `/admin/lab-reports` and clicks "Upload Lab Report".
  2. Admin selects patient, test category (e.g., Complete Blood Count), test date, and uploads PDF/image file.
  3. Server validates MIME type (application/pdf, image/png, image/jpeg) and size (<= 10MB), writes file with UUID filename to private storage directory `storage/lab-reports/`, and inserts `LabReport` metadata.
  4. System emits notification to patient.
  5. Patient opens `/patient/lab-reports`, views verified report metadata, and clicks "View Report".
  6. Client requests `/api/lab-reports/:id/file`. Server verifies requesting user owns the report (or is admin/assigned doctor) and streams file with appropriate `Content-Type` and `Content-Disposition`.
- **Extensions**:
  - 6a. Unauthorized patient requests another patient's report ID: Server returns HTTP 403 Forbidden and logs security audit event.

### Use Case 5: Itemized Hospital Billing & Simulated Payment Settlement
- **Primary Actor**: Administrator (Generation) & Patient (Settlement)
- **Preconditions**: Patient has completed a clinical consultation, procedure, or lab test.
- **Main Success Scenario**:
  1. Admin navigates to `/admin/billing` and clicks "Create New Bill".
  2. Admin selects Patient and adds line items: Consultation ($75.00), Blood Test Panel ($45.00), Medication Dispensation ($30.00).
  3. Server calculates Subtotal ($150.00), Tax 5% ($7.50), and Total ($157.50), storing invoice in status `UNPAID`.
  4. Patient opens `/patient/billing`, reviews invoice line items, and clicks "Pay Now".
  5. Simulated payment dialog opens with options (Credit Card, UPI, NetBanking, Cash Demo). Patient inputs test card and confirms.
  6. Server records `Payment` record linked to `Bill`, updates bill status to `PAID`, generates unique transaction reference `TXN-XXXXXXXX`, and dispatches notification.
  7. Patient views or prints official paid hospital tax receipt.
