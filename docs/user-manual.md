# MediCore — Online Hospital Management System: User Manual

**Document Version:** 1.0.0  
**Target Audience:** Hospital Administrators, Medical Practitioners (Doctors), and Registered Patients  
**System Version:** MediCore Enterprise v1.0.0  
**Design Reference:** MediKit Healthcare Administration Language  

---

## Table of Contents
1. [System Access & Technical Prerequisites](#1-system-access--technical-prerequisites)
2. [Demo Credentials & Quick Sign-In](#2-demo-credentials--quick-sign-in)
3. [Hospital Administrator Portal Manual](#3-hospital-administrator-portal-manual)
   - [3.1 Operational Analytics Dashboard](#31-operational-analytics-dashboard)
   - [3.2 Doctor Staff Management](#32-doctor-staff-management)
   - [3.3 Department Configuration](#33-department-configuration)
   - [3.4 Patient Management & Demographics](#34-patient-management--demographics)
   - [3.5 Appointment Administration](#35-appointment-administration)
   - [3.6 Billing & Invoice Generation](#36-billing--invoice-generation)
   - [3.7 Diagnostic Lab Reports & Security](#37-diagnostic-lab-reports--security)
   - [3.8 Hospital Notices & Maintenance Bulletins](#38-hospital-notices--maintenance-bulletins)
   - [3.9 Regulatory Audit Log Inspection](#39-regulatory-audit-log-inspection)
4. [Doctor Clinical Portal Manual](#4-doctor-clinical-portal-manual)
   - [4.1 Doctor Daily Dashboard](#41-doctor-daily-dashboard)
   - [4.2 Appointment Agenda & Patient Queue](#42-appointment-agenda--patient-queue)
   - [4.3 Clinical Consultation & Diagnosis Workflow](#43-clinical-consultation--diagnosis-workflow)
   - [4.4 Electronic Prescription Authoring](#44-electronic-prescription-authoring)
   - [4.5 Reviewing Patient Medical Records & Lab Results](#45-reviewing-patient-medical-records--lab-results)
5. [Patient Care Portal Manual](#5-patient-care-portal-manual)
   - [5.1 Patient Registration & Authentication](#51-patient-registration--authentication)
   - [5.2 Doctor Discovery & Specialization Search](#52-doctor-discovery--specialization-search)
   - [5.3 Real-Time Slot Selection & Appointment Booking](#53-real-time-slot-selection--appointment-booking)
   - [5.4 Managing Appointments & Cancellations](#54-managing-appointments--cancellations)
   - [5.5 Viewing Clinical Records & Diagnoses](#55-viewing-clinical-records--diagnoses)
   - [5.6 Accessing Electronic Prescriptions](#56-accessing-electronic-prescriptions)
   - [5.7 Viewing & Downloading Diagnostic Lab Reports](#57-viewing--downloading-diagnostic-lab-reports)
   - [5.8 Itemized Billing & Simulated Payment Checkout](#58-itemized-billing--simulated-payment-checkout)
   - [5.9 Notification Center](#59-notification-center)
6. [Security, Privacy & Troubleshooting](#6-security-privacy--troubleshooting)

---

## 1. System Access & Technical Prerequisites

MediCore is a web-based, cloud-ready hospital management information system accessible via modern web browsers (Chrome, Edge, Firefox, Safari).

* **Web Application Portal:** `http://localhost:5173`
* **API & Health Endpoint:** `http://localhost:5000/api/health`
* **Local Storage Isolation:** Diagnostic lab uploads reside in a private system directory outside the web root (`server/uploads/lab-reports/`) and can only be accessed through authenticated streaming endpoints.

---

## 2. Demo Credentials & Quick Sign-In

For immediate evaluation, academic presentation, or training, the login screen provides **1-Click Demo Login** chips along with standard credential authentication:

| Role | Name | Email Address | Password | Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Dr. Robert Fox (Medical Director) | `admin@medicore.hospital` | `Admin@123` | Full clinical, operational, financial, and audit administrative oversight |
| **Doctor** | Dr. Gregory (Cardiologist) | `dr.gregory@medicore.hospital` | `Doctor@123` | Clinical documentation, prescriptions, doctor schedule, patient history |
| **Doctor** | Dr. Brandon (Gynecologist) | `dr.brandon@medicore.hospital` | `Doctor@123` | Clinical consultations, lab reviews, schedule management |
| **Patient** | Cameron (Patient #1) | `cameron@example.com` | `Patient@123` | Appointment booking, personal records, lab reports, simulated payments |
| **Patient** | Standard Demo Patient | `patient@medicore.hospital` | `Patient@123` | Full patient capabilities |

---

## 3. Hospital Administrator Portal Manual

Hospital Administrators oversee facility operations, medical personnel, billing reconciliations, and compliance monitoring.

### 3.1 Operational Analytics Dashboard
* **Route:** `/admin/dashboard`
* **Top Metric Cards:**
  * **2937 Doctors:** Total roster of registered physicians.
  * **5453 Staffs:** Operational medical and support personnel.
  * **170K Patients:** Master patient index count.
  * **21 Pharmacies / Departments:** Active operational units.
* **Analytical Radial Chart:** Visualizes hospital distribution across Vitality/Birth cases (45.07%), Accident & Trauma cases (18.43%), and Critical mortality cases (29.05%).
* **Hospital Maintenance Reports:** Displays live operational alerts (e.g., HVAC maintenance in Room 501, Staff leave schedules, sanitization requests).
* **Clinical Department Success Rates:** Progress metrics across Anesthetics (83%), Gynecology (95%), Neurology (100%), Oncology (89%), Orthopedics (97%), and Physiotherapy (100%).
* **Online Appointments Table:** Live view of registered visits with direct administrative controls to edit status or cancel invalid records.
* **Doctors Availability Roster:** Real-time indicator of active physicians and clinical specializations.

### 3.2 Doctor Staff Management
* **Route:** `/admin/doctors`
* **Features:**
  * View complete physician roster with department, license number, consultation fees, and active/inactive status.
  * **Add New Doctor:** Click **"+ Add Doctor"** to open the provisioning dialog. Enter full name, clinical email, phone, medical license number, department, consultation fee, qualifications, and biography.
  * **Toggle Active Status:** Instantly activate or suspend a physician's booking eligibility.

### 3.3 Department Configuration
* **Route:** `/admin/departments`
* **Features:**
  * Review all clinical wings (Cardiology, Gynecology, Orthopedics, Neurology, Pediatrics, General Medicine).
  * Check associated doctor headcounts and location codes.

### 3.4 Patient Management & Demographics
* **Route:** `/admin/patients`
* **Features:**
  * Searchable patient directory filtered by name, phone, or blood type.
  * View registered patient demographics (Date of Birth, Gender, Emergency Contact, Address).

### 3.5 Appointment Administration
* **Route:** `/admin/appointments`
* **Features:**
  * Global schedule monitor displaying all visits across all hospital departments.
  * Status filter: `PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`.
  * Update appointment statuses in real time.

### 3.6 Billing & Invoice Generation
* **Route:** `/admin/billing`
* **Features:**
  * View all issued invoices with payment statuses: `PAID`, `UNPAID`, `PARTIALLY_PAID`, `CANCELLED`.
  * **Create Invoice:** Click **"+ Create New Invoice"** to issue an itemized hospital bill for an inpatient or consultation encounter.
  * Add multiple line items (e.g., Doctor Consultation, Laboratory Panel, Ward Charges, Pharmacy Medications).
  * System automatically computes subtotal, taxes (8%), and net payable amount.

### 3.7 Diagnostic Lab Reports & Security
* **Route:** `/admin/lab-reports`
* **Features:**
  * View hospital laboratory investigations.
  * **Upload Diagnostic Report:** Click **"+ Upload Lab Report"**, attach diagnostic PDF or image (`.pdf`, `.png`, `.jpg`), enter test title, normal reference range, and clinical findings.
  * **Release Flag:** Mark as "Released to Patient" so the patient can view and download the result from their portal. Unreleased reports remain internal-only.

### 3.8 Hospital Notices & Maintenance Bulletins
* **Route:** `/admin/notices`
* **Features:**
  * Publish administrative announcements, sanitation reminders, and equipment service orders visible across the administrative dashboard.

### 3.9 Regulatory Audit Log Inspection
* **Route:** `/admin/audit-logs`
* **Features:**
  * Tamper-evident trail tracking user actions (`LOGIN`, `CREATE`, `UPDATE`, `DELETE`, `PAYMENT`).
  * Captures timestamp, acting user ID, resource entity, IP address, and JSON before/after state diff.

---

## 4. Doctor Clinical Portal Manual

Medical Practitioners have dedicated clinical workflows optimized for fast consultations, diagnosis recording, and electronic prescription generation.

### 4.1 Doctor Daily Dashboard
* **Route:** `/doctor/dashboard`
* **Features:**
  * Immediate snapshot of today's scheduled consultations.
  * Quick patient queue listing next arriving appointments.
  * Direct action buttons to begin clinical consultation documentation.

### 4.2 Appointment Agenda & Patient Queue
* **Route:** `/doctor/appointments`
* **Features:**
  * Filter consultations by date and status.
  * View patient reason for visit, scheduled time slot, and patient contact.
  * Update status to `CONFIRMED`, `COMPLETED`, or `NO_SHOW`.

### 4.3 Clinical Consultation & Diagnosis Workflow
* **Procedure:**
  1. Navigate to `/doctor/appointments`.
  2. Locate patient record and click **"Consult / Document"**.
  3. Enter clinical observations:
     * **Chief Complaints & Symptoms**
     * **Clinical Diagnosis**
     * **Vital Signs:** Blood Pressure (mmHg), Heart Rate (bpm), Body Temperature (°F), Weight (kg), Oxygen Saturation SpO2 (%).
     * **Physician Clinical Notes**
  4. Click **"Save Clinical Record"**. The record is committed and timestamped in the patient's longitudinal health record.

### 4.4 Electronic Prescription Authoring
* **Procedure:**
  1. From the Consultation dialog or `/doctor/prescriptions`, click **"Author Prescription"**.
  2. Add itemized medication lines:
     * **Drug Name:** (e.g., Amoxicillin 500mg, Atorvastatin 20mg)
     * **Dosage & Unit:** (e.g., 1 tablet, 5ml)
     * **Frequency:** (e.g., Twice daily after meals, Once at bedtime)
     * **Duration:** (e.g., 7 days, 30 days)
     * **Clinical Instructions:** (e.g., Take with full glass of water, Avoid dairy)
  3. Save Prescription. It is immediately released to the patient's portal for viewing and printing.

### 4.5 Reviewing Patient Medical Records & Lab Results
* **Route:** `/doctor/patients`
* **Features:**
  * View complete clinical history of authorized patients.
  * Inspect previous diagnoses, physician notes, and released laboratory results before prescribing medications.

---

## 5. Patient Care Portal Manual

The Patient Portal provides self-service healthcare management with full transparency over appointments, medical history, medications, and billing.

### 5.1 Patient Registration & Authentication
* **Registration Route:** `/register`
* **Self-Service Onboarding:** Enter First Name, Last Name, Email, Password (minimum 6 characters), Phone Number, Date of Birth, Gender, and Blood Group.
* System verifies duplicate email prevention and immediately signs the patient in.

### 5.2 Doctor Discovery & Specialization Search
* **Route:** `/patient/doctors`
* **Features:**
  * Browse the hospital's clinical directory.
  * Filter by Department (Cardiology, Gynecology, Orthopedics, Neurology, General Medicine).
  * Real-time search by doctor name, qualification, or clinical interest.
  * Inspect consultation fees and scheduled clinic hours.
  * Click **"Book Appointment"** to immediately open the slot selector.

### 5.3 Real-Time Slot Selection & Appointment Booking
* **Procedure:**
  1. From the dashboard or doctor directory, click **"Book New Appointment"**.
  2. Select your preferred Physician.
  3. Pick an upcoming consultation date.
  4. The system calculates available time slots (e.g., `09:00`, `09:30`, `14:00`, `14:30`) according to the doctor's weekly clinic schedule.
  5. Any slot already booked by another patient is disabled.
  6. Enter the **Reason for Visit** (e.g., "Routine cardiovascular checkup and blood pressure review").
  7. Click **"Confirm Booking"**.
  8. Concurrency Protection: The backend executes an ACID transaction with an atomic slot uniqueness lock, eliminating double-booking even under concurrent simultaneous submissions.
  9. An appointment confirmation code (e.g., `APT-20261020-0930`) is generated, and an in-app notification is posted.

### 5.4 Managing Appointments & Cancellations
* **Route:** `/patient/appointments`
* **Features:**
  * Displays upcoming, completed, and past visits with status badges (`CONFIRMED`, `COMPLETED`, `CANCELLED`).
  * **Cancellation Policy:** Patients can cancel upcoming appointments with one click. Cancelled slots immediately become available for other patients to book.

### 5.5 Viewing Clinical Records & Diagnoses
* **Route:** `/patient/medical-records`
* **Features:**
  * Longitudinal record of all clinical visits.
  * View consulting physician, visit date, recorded vitals (BP, Heart Rate, Temp, Weight), diagnosis, and doctor advice.

### 5.6 Accessing Electronic Prescriptions
* **Route:** `/patient/prescriptions`
* **Features:**
  * View all issued prescriptions itemized with medications, dosage schedules, and dietary instructions.
  * Printable receipt view formatted for presenting at external pharmacies.

### 5.7 Viewing & Downloading Diagnostic Lab Reports
* **Route:** `/patient/lab-reports`
* **Features:**
  * Access released diagnostic laboratory investigations (e.g., Comprehensive Metabolic Panel, Lipid Profile, MRI Brain).
  * View test date, reference intervals, and lab technician commentary.
  * Click **"Download File"** or **"View Document"** to stream the secure report directly from the private document store.

### 5.8 Itemized Billing & Simulated Payment Checkout
* **Route:** `/patient/billing`
* **Features:**
  * View all hospital invoices, outstanding balances, and payment histories.
  * **Simulated Checkout Procedure:**
    1. Click **"Pay Now"** on any unpaid invoice.
    2. Choose payment method:
       * **Credit / Debit Card:** Enter Cardholder Name, 16-digit Card Number, Expiry, and CVV.
       * **UPI / QR Code:** Enter Virtual Payment Address (e.g., `user@okhdfcbank`).
       * **Hospital Counter Cash Receipt:** Enter Cashier terminal receipt reference.
    3. Click **"Process Payment"**.
    4. The backend verifies the balance, updates invoice status to `PAID`, generates a unique transaction reference (e.g., `PAY-SIM-1791642831`), and creates an audit record.
    5. Click **"View Receipt"** to open a formal printable receipt with hospital header, itemized breakdown, tax breakdown, and paid stamp.

### 5.9 Notification Center
* **Route:** Top navigation bell icon on all pages.
* **Features:**
  * Real-time badges for booking confirmations, cancellations, invoice issuances, and lab release alerts.
  * One-click "Mark as Read" dismissal.

---

## 6. Security, Privacy & Troubleshooting

### Security Safeguards
1. **Least-Privilege Role Isolation:** Patients cannot view or query administrative records, audit logs, or other patients' health information.
2. **Private Document Storage:** Diagnostic lab reports are stored outside public HTTP folders with randomized server UUID filenames. Documents are only served to authorized users via authenticated stream routes (`/api/lab-reports/:id/file`).
3. **Session Management:** Cryptographically signed JWT tokens with standard 24-hour expiration.

### Common Troubleshooting Scenarios
* **"Time slot already booked" error during booking:** Another patient confirmed that slot immediately prior to your submission. Select an alternate available slot on the calendar.
* **Lab report download button disabled:** The lab technician has not yet released the report to patient view. Contact hospital diagnostics for assistance.
* **Session timeout:** If inactive for extended periods, the portal will prompt you to log back in. Your saved data remains securely stored on the database server.
