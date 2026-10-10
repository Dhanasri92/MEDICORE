# MediCore — Relational Database Data Dictionary

The MediCore database schema contains 15 interconnected relational entities designed with standard relational constraints, foreign keys, and indexes.

---

## Entity 1: `users`
Core identity table managing credentials and role assignment.

| Field Name | Type | Constraints | Description |
|---|---|---|---|
| `id` | String / UUID | PRIMARY KEY | Unique user identifier |
| `email` | String | UNIQUE, NOT NULL | User account login email |
| `passwordHash` | String | NOT NULL | Salted bcrypt password hash |
| `role` | String | NOT NULL | Role: `ADMIN`, `DOCTOR`, `PATIENT` |
| `firstName` | String | NOT NULL | First name |
| `lastName` | String | NOT NULL | Last name |
| `phone` | String | NULLABLE | Contact telephone |
| `avatar` | String | NULLABLE | Profile picture URL or icon identifier |
| `isActive` | Boolean | DEFAULT true | Account status flag |
| `createdAt` | DateTime | DEFAULT now() | Creation timestamp |
| `updatedAt` | DateTime | ON UPDATE | Last modification timestamp |

---

## Entity 2: `departments`
Hospital clinical specialties and wards.

| Field Name | Type | Constraints | Description |
|---|---|---|---|
| `id` | String / UUID | PRIMARY KEY | Unique department identifier |
| `name` | String | UNIQUE, NOT NULL | Department name (e.g., Cardiology) |
| `code` | String | UNIQUE, NOT NULL | Short code (e.g., CARD, NEUR, PEDI) |
| `description` | String | NULLABLE | Department summary |
| `headDoctorId`| String | NULLABLE, FK | Physician acting as department chair |
| `color` | String | DEFAULT '#329BFA' | UI accent tag color |
| `createdAt` | DateTime | DEFAULT now() | Creation timestamp |

---

## Entity 3: `doctors`
Medical practitioners and specialists.

| Field Name | Type | Constraints | Description |
|---|---|---|---|
| `id` | String / UUID | PRIMARY KEY | Doctor profile identifier |
| `userId` | String | UNIQUE, FK(users.id) | Linked credential user record |
| `departmentId`| String | FK(departments.id) | Primary clinical department |
| `specialization`| String | NOT NULL | Medical specialty (e.g. Cardiologist) |
| `qualification` | String | NOT NULL | Degrees (e.g., MD, MBBS, FACS) |
| `experienceYears`| Integer | DEFAULT 0 | Years in active clinical practice |
| `consultationFee`| Decimal/Float| NOT NULL | Consultation base fee in USD |
| `biography` | String | NULLABLE | Physician professional biography |
| `roomNumber` | String | NULLABLE | Hospital consultation room / clinic office |
| `isAvailable` | Boolean | DEFAULT true | Real-time on-duty status |
| `createdAt` | DateTime | DEFAULT now() | Record timestamp |

---

## Entity 4: `patients`
Registered healthcare recipients.

| Field Name | Type | Constraints | Description |
|---|---|---|---|
| `id` | String / UUID | PRIMARY KEY | Patient profile identifier |
| `userId` | String | UNIQUE, FK(users.id) | Linked credential user record |
| `dateOfBirth` | DateTime | NOT NULL | Patient date of birth |
| `gender` | String | NOT NULL | Gender (`MALE`, `FEMALE`, `OTHER`) |
| `bloodGroup` | String | NULLABLE | Blood type (A+, O+, B-, etc.) |
| `address` | String | NULLABLE | Residential postal address |
| `emergencyContactName` | String | NULLABLE | Emergency contact person |
| `emergencyContactPhone` | String | NULLABLE | Emergency contact phone |
| `allergies` | String | NULLABLE | Known drug and food allergies |
| `createdAt` | DateTime | DEFAULT now() | Record creation timestamp |

---

## Entity 5: `doctor_schedules`
Weekly availability rules for generating appointment slots.

| Field Name | Type | Constraints | Description |
|---|---|---|---|
| `id` | String / UUID | PRIMARY KEY | Schedule rule identifier |
| `doctorId` | String | FK(doctors.id) | Linked doctor |
| `dayOfWeek` | Integer | NOT NULL | 0 = Sunday, 1 = Monday, ..., 6 = Saturday |
| `startTime` | String | NOT NULL | Daily shift start (e.g., "09:00") |
| `endTime` | String | NOT NULL | Daily shift end (e.g., "17:00") |
| `slotDuration` | Integer | DEFAULT 30 | Slot length in minutes |
| `isActive` | Boolean | DEFAULT true | Schedule active status |

---

## Entity 6: `appointments`
Scheduled clinical visits between patients and doctors.

| Field Name | Type | Constraints | Description |
|---|---|---|---|
| `id` | String / UUID | PRIMARY KEY | Unique appointment identifier |
| `appointmentNumber` | String | UNIQUE, NOT NULL | Human-readable token (e.g., `APT-2026-001`) |
| `patientId` | String | FK(patients.id) | Attending patient |
| `doctorId` | String | FK(doctors.id) | Attending physician |
| `appointmentDate` | String | NOT NULL | Scheduled date (`YYYY-MM-DD`) |
| `timeSlot` | String | NOT NULL | Scheduled start time (`HH:MM`, e.g. "10:00") |
| `status` | String | NOT NULL | `PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `NO_SHOW` |
| `reasonForVisit` | String | NOT NULL | Patient stated symptoms / reason |
| `cancellationReason` | String | NULLABLE | Reason if cancelled |
| `createdAt` | DateTime | DEFAULT now() | Booking timestamp |
| `updatedAt` | DateTime | ON UPDATE | Status modification timestamp |

*Indices*: Compound index on `[doctorId, appointmentDate, timeSlot]` to guard slot concurrency.

---

## Entity 7: `medical_records`
Clinical documentation authored by attending doctors during encounters.

| Field Name | Type | Constraints | Description |
|---|---|---|---|
| `id` | String / UUID | PRIMARY KEY | Clinical encounter record identifier |
| `appointmentId` | String | UNIQUE, FK(appointments.id) | Linked appointment visit |
| `patientId` | String | FK(patients.id) | Patient subject of the encounter |
| `doctorId` | String | FK(doctors.id) | Authoring physician |
| `diagnosis` | String | NOT NULL | Primary clinical diagnosis / findings |
| `symptoms` | String | NOT NULL | Presenting clinical complaints |
| `physicalExamination` | String | NULLABLE | Examination observations and vitals |
| `treatmentPlan` | String | NULLABLE | Proposed therapy and follow-up plan |
| `createdAt` | DateTime | DEFAULT now() | Consultation date & time |

---

## Entity 8: `prescriptions`
Prescription headers issued during an encounter.

| Field Name | Type | Constraints | Description |
|---|---|---|---|
| `id` | String / UUID | PRIMARY KEY | Prescription identifier |
| `recordId` | String | UNIQUE, FK(medical_records.id) | Linked clinical encounter |
| `patientId` | String | FK(patients.id) | Patient recipient |
| `doctorId` | String | FK(doctors.id) | Prescribing physician |
| `prescribedDate`| DateTime | DEFAULT now() | Issuance timestamp |
| `notes` | String | NULLABLE | General pharmacy or diet instructions |
| `status` | String | DEFAULT 'ACTIVE' | Status: `ACTIVE`, `FILLED`, `DISCONTINUED` |

---

## Entity 9: `prescription_items`
Itemized drug orders inside a prescription.

| Field Name | Type | Constraints | Description |
|---|---|---|---|
| `id` | String / UUID | PRIMARY KEY | Item identifier |
| `prescriptionId`| String | FK(prescriptions.id), ON DELETE CASCADE | Parent prescription |
| `medicineName` | String | NOT NULL | Brand / generic drug name |
| `dosage` | String | NOT NULL | Dosage strength (e.g. "500 mg") |
| `frequency` | String | NOT NULL | Schedule (e.g. "Twice daily after food") |
| `duration` | String | NOT NULL | Course length (e.g. "7 Days") |
| `instructions` | String | NULLABLE | Special warnings or instructions |

---

## Entity 10: `lab_reports`
Diagnostic laboratory investigations and uploaded documentation.

| Field Name | Type | Constraints | Description |
|---|---|---|---|
| `id` | String / UUID | PRIMARY KEY | Lab investigation identifier |
| `patientId` | String | FK(patients.id) | Patient tested |
| `doctorId` | String | NULLABLE, FK(doctors.id) | Ordering physician |
| `testName` | String | NOT NULL | Investigation name (e.g., Lipid Profile) |
| `category` | String | NOT NULL | Pathology, Radiology, Hematology, etc. |
| `testDate` | DateTime | NOT NULL | Date sample collected / test conducted |
| `status` | String | NOT NULL | `ORDERED`, `SAMPLE_COLLECTED`, `IN_PROGRESS`, `COMPLETED` |
| `filePath` | String | NULLABLE | Private storage filepath |
| `fileName` | String | NULLABLE | Original uploaded filename |
| `fileSize` | Integer | NULLABLE | Size in bytes |
| `mimeType` | String | NULLABLE | e.g., `application/pdf` |
| `summary` | String | NULLABLE | Clinical impression / results summary |
| `createdAt` | DateTime | DEFAULT now() | Upload timestamp |

---

## Entity 11: `bills`
Itemized hospital invoices.

| Field Name | Type | Constraints | Description |
|---|---|---|---|
| `id` | String / UUID | PRIMARY KEY | Invoice identifier |
| `billNumber` | String | UNIQUE, NOT NULL | Human-readable invoice (e.g. `INV-2026-0042`) |
| `patientId` | String | FK(patients.id) | Invoiced patient |
| `appointmentId` | String | NULLABLE, FK(appointments.id) | Related appointment visit |
| `subtotal` | Float | NOT NULL | Total of bill items before tax |
| `tax` | Float | NOT NULL | Applied tax amount |
| `totalAmount` | Float | NOT NULL | Subtotal + Tax |
| `paidAmount` | Float | DEFAULT 0 | Cumulative payments received |
| `status` | String | NOT NULL | `UNPAID`, `PARTIALLY_PAID`, `PAID` |
| `dueDate` | DateTime | NOT NULL | Payment deadline |
| `createdAt` | DateTime | DEFAULT now() | Bill creation date |

---

## Entity 12: `bill_items`
Itemized line entries on an invoice.

| Field Name | Type | Constraints | Description |
|---|---|---|---|
| `id` | String / UUID | PRIMARY KEY | Line item identifier |
| `billId` | String | FK(bills.id), ON DELETE CASCADE | Parent bill |
| `description` | String | NOT NULL | Service / fee description |
| `quantity` | Integer | DEFAULT 1 | Item quantity |
| `unitPrice` | Float | NOT NULL | Unit price |
| `amount` | Float | NOT NULL | quantity * unitPrice |

---

## Entity 13: `payments`
Simulated financial transactions settling bills.

| Field Name | Type | Constraints | Description |
|---|---|---|---|
| `id` | String / UUID | PRIMARY KEY | Payment transaction identifier |
| `billId` | String | FK(bills.id) | Settled invoice |
| `transactionRef`| String | UNIQUE, NOT NULL | Generated reference (e.g. `TXN-88219401`) |
| `amount` | Float | NOT NULL | Settled payment amount |
| `paymentMethod`| String | NOT NULL | `CREDIT_CARD`, `DEBIT_CARD`, `UPI`, `NET_BANKING`, `CASH` |
| `paymentDate` | DateTime | DEFAULT now() | Transaction timestamp |
| `status` | String | DEFAULT 'SUCCESS' | `SUCCESS`, `PENDING`, `FAILED` |
| `notes` | String | NULLABLE | Payment audit notes |

---

## Entity 14: `notifications`
In-app user alerts and status updates.

| Field Name | Type | Constraints | Description |
|---|---|---|---|
| `id` | String / UUID | PRIMARY KEY | Notification identifier |
| `userId` | String | FK(users.id) | Recipient user |
| `title` | String | NOT NULL | Short notification title |
| `message` | String | NOT NULL | Notification message body |
| `type` | String | NOT NULL | `APPOINTMENT`, `PRESCRIPTION`, `LAB_REPORT`, `BILLING`, `SYSTEM` |
| `linkUrl` | String | NULLABLE | In-app navigation destination |
| `isRead` | Boolean | DEFAULT false | Read receipt flag |
| `createdAt` | DateTime | DEFAULT now() | Delivery timestamp |

---

## Entity 15: `audit_logs`
Immutable compliance and security log.

| Field Name | Type | Constraints | Description |
|---|---|---|---|
| `id` | String / UUID | PRIMARY KEY | Log entry identifier |
| `userId` | String | NULLABLE, FK(users.id) | Actor user identifier |
| `userRole` | String | NULLABLE | Role of the actor |
| `action` | String | NOT NULL | Executed action (e.g. `BOOK_APPOINTMENT`, `ISSUE_PRESCRIPTION`) |
| `entity` | String | NOT NULL | Modified entity name (e.g. `Appointment`) |
| `entityId` | String | NULLABLE | Primary key of affected record |
| `details` | String | NULLABLE | JSON or text summary of change |
| `ipAddress` | String | NULLABLE | Client IP address |
| `createdAt` | DateTime | DEFAULT now() | Event timestamp |
