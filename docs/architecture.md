# MediCore — System Architecture & Design Document

## 1. Architectural Philosophy & Style
MediCore is engineered as a **Modular Monolith** with clear boundary segregation across vertical functional slices and horizontal architectural layers. Microservices were deliberately avoided for this project to eliminate distributed data consistency overhead, latency penalties, and deployment complexity while preserving clean domain separation, high cohesion, and low coupling.

```
+-----------------------------------------------------------------------------------+
|                            PRESENTATION TIER (CLIENT)                             |
|  React 18 SPA | TypeScript | Tailwind CSS | Vite | TanStack Query | Recharts     |
|  Pages: /admin/* | /doctor/* | /patient/* | /login | /register                    |
+-----------------------------------------------------------------------------------+
                                         │
                                  HTTPS / REST JSON
                                         │
+-----------------------------------------------------------------------------------+
|                             APPLICATION / API TIER                                |
|  Express.js | TypeScript | Modular Routing | Middleware (Auth, RBAC, Rate-Limit) |
|  Controllers -> Services -> Repositories / Prisma Queries -> Zod Schemas         |
+-----------------------------------------------------------------------------------+
                   │                                             │
                   ▼                                             ▼
+------------------------------------+         +------------------------------------+
|             DATA TIER              |         |       SECURE STORAGE TIER          |
|  PostgreSQL / Relational Database  |         |  Quarantined Directory             |
|  Prisma ORM | ACID Transactions    |         |  storage/lab-reports/              |
|  Foreign Keys, Unique Indices      |         |  UUID Filenames, MIME Verification |
+------------------------------------+         +------------------------------------+
```

---

## 2. Horizontal Layer Responsibilities

### 2.1 Presentation Layer (`client/src/`)
- **Layouts & Shell**: Recreates the MediKit Dribbble visual reference featuring persistent collapsible sidebar, high-contrast primary navigation pill, top search bar, user notifications dropdown, and dynamic breadcrumbs.
- **State Management**: TanStack Query manages asynchronous server state caching, invalidation, and optimistic feedback. React Context manages local user session and theme tokens.
- **Form Handling & Validation**: React Hook Form paired with Zod resolvers provides immediate client-side validation feedback matching backend validation schemas.

### 2.2 Application / API Layer (`server/src/`)
- **Middleware**:
  - `authMiddleware`: Extracts JWT from HttpOnly cookie or `Authorization: Bearer <token>` header, verifies signature, and populates `req.user`.
  - `roleMiddleware`: Restricts endpoints to authorized roles (`ADMIN`, `DOCTOR`, `PATIENT`).
  - `ownershipMiddleware`: Asserts that requesting patient only accesses resources belonging to their personal record ID.
  - `rateLimiter`: Protects authentication endpoints from brute force.
  - `errorHandler`: Converts domain exceptions into structured JSON error envelopes with sanitized messages.
- **Modules**:
  - `auth`: Registration, credential verification, JWT issuance, session termination.
  - `doctors`: Profiles, qualifications, consultation fees, specialization search.
  - `patients`: Demographics, blood type, emergency contacts, medical history.
  - `schedules`: Doctor working days, shift hours, slot calculation.
  - `appointments`: Booking transaction, conflict locking, lifecycle transitions.
  - `medical-records`: Clinical diagnoses, symptoms, physical examination records.
  - `prescriptions`: Itemized medications, dosage, frequency, printable formats.
  - `laboratory`: Metadata storage, secure file upload/streaming.
  - `billing`: Itemized invoice generation, tax calculation, simulated payment gateway.
  - `notifications`: In-app event delivery and read acknowledgments.
  - `audit`: Immutable event logging for administrative and clinical operations.

### 2.3 Data Layer
- **Prisma ORM**: Type-safe query building and schema migrations.
- **Transaction Manager**: Enforces ACID properties for appointment booking (preventing double-booking) and multi-item billing creation.
- **Data Integrity**: Foreign key constraints with cascading deletes where appropriate (e.g. prescription items deleted if prescription is deleted), and restrictive constraints on clinical records.

### 2.4 File Storage Layer
- Uploaded medical files (lab reports, test imagery) are written directly to `server/storage/lab-reports/` using cryptographically generated UUIDs (e.g. `d8b5c9a4-23e1-4bcf-8a7a-6f17e0821d3f.pdf`).
- This directory is completely excluded from static file serving (`express.static`). Files can only be streamed via authenticated handler after validating user permissions.

---

## 3. Concurrency & Conflict Prevention Architecture

To prevent simultaneous double-booking of a doctor:
1. When booking `/api/appointments`, the backend runs an atomic transaction:
   ```typescript
   await prisma.$transaction(async (tx) => {
     // 1. Verify doctor exists and is active
     // 2. Query existing active appointments for the doctor on date & time
     const conflict = await tx.appointment.findFirst({
       where: {
         doctorId,
         appointmentDate,
         timeSlot,
         status: { notIn: ['CANCELLED', 'NO_SHOW'] }
       }
     });
     if (conflict) {
       throw new ConflictError('This time slot has already been booked.');
     }
     // 3. Create appointment atomically
     return await tx.appointment.create({ ... });
   });
   ```
2. A compound database index on `[doctorId, appointmentDate, timeSlot]` accelerates lookup and safeguards against race conditions.

---

## 4. Security Architecture

1. **Password Storage**: Passwords are salted and hashed using `bcryptjs` with a work factor of 10.
2. **Session / Token Security**: Signed JWTs signed with `JWT_SECRET` containing user ID, role, and email. Expiration set to 7 days. Delivered via HttpOnly, SameSite cookies or Authorization Bearer header.
3. **Data Protection & Least Privilege**:
   - `ADMIN`: Operational management, physician creation, itemized billing, audit log review. Cannot edit clinical diagnoses authored by physicians.
   - `DOCTOR`: Can view only assigned patients and schedule; can author clinical notes and prescriptions.
   - `PATIENT`: Strictly scoped to records where `patientId == req.user.patientId`.
4. **Input Sanitization**: Strong typed validation via Zod on all incoming request bodies and query parameters.
5. **Private File Delivery**: Protected file routes set `X-Content-Type-Options: nosniff` and stream chunks with appropriate MIME headers only after token validation.
