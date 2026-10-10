# MediCore — RESTful API Specification & Contract

All API responses follow a consistent JSON envelope structure:
```json
// Success Response:
{
  "success": true,
  "data": { ... },
  "message": "Optional human-readable confirmation"
}

// Error Response:
{
  "success": false,
  "error": "Error message description",
  "details": [ ... ] // Validation issues if applicable
}
```

---

## 1. Authentication Endpoints (`/api/auth`)

| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/api/auth/register` | POST | Public | Register new patient account |
| `/api/auth/login` | POST | Public | Authenticate user; returns user object & sets token |
| `/api/auth/me` | GET | Authenticated | Retrieve current session user & linked profile |
| `/api/auth/logout` | POST | Authenticated | Clears auth session cookie |

---

## 2. Doctors & Schedules Endpoints (`/api/doctors`, `/api/schedules`)

| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/api/doctors` | GET | Public/Auth | List doctors with filter by dept, specialization, search |
| `/api/doctors/:id` | GET | Public/Auth | Get detailed doctor profile, qualification, schedules |
| `/api/doctors/:id/availability` | GET | Public/Auth | Get calculated time slots for a given `?date=YYYY-MM-DD` |
| `/api/admin/doctors` | POST | ADMIN | Create new doctor account & clinical profile |
| `/api/admin/doctors/:id` | PATCH | ADMIN | Update doctor details, fee, room, or active status |
| `/api/doctor/schedules` | GET, POST | DOCTOR, ADMIN | Manage weekly shift availability rules |

---

## 3. Department Endpoints (`/api/departments`)

| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/api/departments` | GET | Public/Auth | List all active hospital departments |
| `/api/departments/:id` | GET | Public/Auth | Get department details and affiliated physicians |
| `/api/admin/departments` | POST | ADMIN | Create new clinical department |

---

## 4. Appointments Endpoints (`/api/appointments`)

| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/api/appointments` | POST | PATIENT, ADMIN | Concurrency-safe appointment booking |
| `/api/appointments/mine` | GET | PATIENT | Get requesting patient's appointments |
| `/api/doctor/appointments` | GET | DOCTOR | Get appointments assigned to authenticated doctor |
| `/api/admin/appointments` | GET | ADMIN | Get all hospital appointments with filters & pagination |
| `/api/appointments/:id` | GET | Authenticated | Get appointment details (ownership verified) |
| `/api/appointments/:id/status` | PATCH | DOCTOR, ADMIN | Update status (`CONFIRMED`, `COMPLETED`, `NO_SHOW`) |
| `/api/appointments/:id/cancel` | POST | PATIENT, ADMIN | Cancel eligible appointment and free slot |

---

## 5. Clinical Records & Prescriptions (`/api/medical-records`, `/api/prescriptions`)

| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/api/appointments/:id/medical-records` | POST | DOCTOR | Record diagnosis and consultation notes for visit |
| `/api/patients/:id/medical-records` | GET | DOCTOR, ADMIN | Retrieve patient clinical history |
| `/api/patients/me/medical-records` | GET | PATIENT | Retrieve authenticated patient's clinical history |
| `/api/medical-records/:id` | GET | Authenticated | View specific clinical record |
| `/api/medical-records/:id/prescriptions` | POST | DOCTOR | Attach itemized prescription to record |
| `/api/prescriptions/mine` | GET | PATIENT | List authenticated patient's active prescriptions |
| `/api/prescriptions/:id` | GET | Authenticated | View/print specific prescription |

---

## 6. Laboratory Reports (`/api/lab-reports`)

| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/api/lab-reports` | POST | ADMIN, DOCTOR | Create report metadata and upload file (multipart/form-data) |
| `/api/lab-reports` | GET | ADMIN | List all laboratory reports |
| `/api/lab-reports/mine` | GET | PATIENT | List authenticated patient's lab reports |
| `/api/patients/:id/lab-reports` | GET | DOCTOR, ADMIN | List specific patient's lab reports |
| `/api/lab-reports/:id` | GET | Authenticated | Get report metadata |
| `/api/lab-reports/:id/file` | GET | Authenticated | Secure file download/stream (ownership verified) |

---

## 7. Billing & Payments (`/api/bills`, `/api/payments`)

| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/api/admin/bills` | POST | ADMIN | Create itemized invoice with line items |
| `/api/admin/bills` | GET | ADMIN | List hospital invoices with status & date filters |
| `/api/bills/mine` | GET | PATIENT | List authenticated patient's invoices |
| `/api/bills/:id` | GET | Authenticated | View invoice breakdown and line items |
| `/api/bills/:id/payments` | POST | PATIENT, ADMIN | Process simulated payment (Card, UPI, Cash) |
| `/api/bills/:id/receipt` | GET | Authenticated | Generate official paid tax receipt |

---

## 8. Dashboard Analytics & Operations (`/api/analytics`, `/api/notifications`, `/api/admin`)

| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/api/analytics/admin` | GET | ADMIN | Real-time database aggregates (doctors, patients, today's appointments, outstanding revenue, trends) |
| `/api/analytics/doctor` | GET | DOCTOR | Doctor-specific metrics (today's queue, completed, upcoming) |
| `/api/analytics/patient` | GET | PATIENT | Patient summary (upcoming visits, pending bills, reports) |
| `/api/notifications` | GET | Authenticated | User notification feed |
| `/api/notifications/:id/read` | PATCH | Authenticated | Mark notification as read |
| `/api/notifications/read-all` | POST | Authenticated | Mark all notifications read |
| `/api/admin/audit-logs` | GET | ADMIN | Query security and compliance audit log |
| `/api/admin/notices` | GET, POST | Public/ADMIN | Hospital operational announcements |
