import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ENV } from './config/environment.js';
import { errorHandler } from './middleware/error.middleware.js';

import { authRouter } from './modules/auth/auth.routes.js';
import { departmentRouter } from './modules/departments/department.routes.js';
import { doctorRouter } from './modules/doctors/doctor.routes.js';
import { patientRouter } from './modules/patients/patient.routes.js';
import { scheduleRouter } from './modules/schedules/schedule.routes.js';
import { appointmentRouter } from './modules/appointments/appointment.routes.js';
import { medicalRecordRouter } from './modules/medical-records/record.routes.js';
import { prescriptionRouter } from './modules/prescriptions/prescription.routes.js';
import { laboratoryRouter } from './modules/laboratory/laboratory.routes.js';
import { billingRouter } from './modules/billing/billing.routes.js';
import { notificationRouter } from './modules/notifications/notification.routes.js';
import { analyticsRouter } from './modules/analytics/analytics.routes.js';
import { auditRouter } from './modules/audit/audit.routes.js';
import { noticeRouter } from './modules/notices/notice.routes.js';

export const app = express();

// Security and utility middleware
app.use(cors({
  origin: [ENV.CORS_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check Endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'MediCore Online Hospital Management System',
    version: '1.0.0',
  });
});

// Route Mounts
app.use('/api/auth', authRouter);
app.use('/api/departments', departmentRouter);
app.use('/api/doctors', doctorRouter);
app.use('/api/patients', patientRouter);
app.use('/api/schedules', scheduleRouter);
app.use('/api/appointments', appointmentRouter);
app.use('/api/medical-records', medicalRecordRouter);
app.use('/api/prescriptions', prescriptionRouter);
app.use('/api/lab-reports', laboratoryRouter);
app.use('/api/bills', billingRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/admin/audit-logs', auditRouter);
app.use('/api/notices', noticeRouter);

// 404 Route Handler for undefined endpoints
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `API endpoint ${req.method} ${req.baseUrl} was not found.`,
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);
