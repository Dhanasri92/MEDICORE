import { Router, Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { prisma } from '../../config/database.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { labReportUpload } from '../../middleware/upload.middleware.js';
import { logAuditEvent } from '../audit/audit.service.js';
import { createNotification } from '../notifications/notification.service.js';
import { ENV } from '../../config/environment.js';

export const laboratoryRouter = Router();

// POST /api/lab-reports - Upload lab report (ADMIN, DOCTOR)
laboratoryRouter.post(
  '/',
  authenticate,
  requireRole(['ADMIN', 'DOCTOR']),
  labReportUpload.single('reportFile'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { patientId, doctorId, testName, category, testDate, summary, status } = req.body;

      if (!patientId || !testName || !category) {
        res.status(400).json({ success: false, error: 'Patient ID, test name, and category are required.' });
        return;
      }

      const patient = await prisma.patient.findUnique({
        where: { id: patientId },
        include: { user: true },
      });

      if (!patient) {
        res.status(404).json({ success: false, error: 'Patient not found.' });
        return;
      }

      const report = await prisma.labReport.create({
        data: {
          patientId,
          doctorId: doctorId || (req.user!.role === 'DOCTOR' ? req.user!.doctorId : null),
          testName,
          category,
          testDate: testDate ? new Date(testDate) : new Date(),
          status: status || 'COMPLETED',
          summary,
          filePath: req.file ? req.file.filename : null,
          fileName: req.file ? req.file.originalname : null,
          fileSize: req.file ? req.file.size : null,
          mimeType: req.file ? req.file.mimetype : null,
        },
        include: {
          patient: { include: { user: true } },
        },
      });

      await logAuditEvent({
        userId: req.user!.userId,
        userRole: req.user!.role,
        action: 'UPLOAD_LAB_REPORT',
        entity: 'LabReport',
        entityId: report.id,
        details: `Lab report uploaded: "${testName}" for ${patient.user.firstName} ${patient.user.lastName}`,
      });

      await createNotification({
        userId: patient.userId,
        title: 'Laboratory Report Available',
        message: `Your diagnostic laboratory report for "${testName}" is now ready for review.`,
        type: 'LAB_REPORT',
        linkUrl: '/patient/lab-reports',
      });

      res.status(201).json({
        success: true,
        message: 'Laboratory report uploaded and attached successfully.',
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/lab-reports - List all lab reports (ADMIN)
laboratoryRouter.get('/', authenticate, requireRole(['ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      prisma.labReport.findMany({
        skip,
        take: limit,
        include: {
          patient: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
          doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
        },
        orderBy: { testDate: 'desc' },
      }),
      prisma.labReport.count(),
    ]);

    res.json({
      success: true,
      data: {
        reports,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/lab-reports/mine - Patient's own reports
laboratoryRouter.get('/mine', authenticate, requireRole(['PATIENT']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reports = await prisma.labReport.findMany({
      where: { patientId: req.user!.patientId },
      include: {
        doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { testDate: 'desc' },
    });

    res.json({ success: true, data: reports });
  } catch (error) {
    next(error);
  }
});

// GET /api/lab-reports/patient/:patientId - Reports for specific patient (DOCTOR, ADMIN)
laboratoryRouter.get('/patient/:patientId', authenticate, requireRole(['DOCTOR', 'ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patientId = req.params.patientId as string;
    const reports = await prisma.labReport.findMany({
      where: { patientId },
      include: {
        doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { testDate: 'desc' },
    });

    res.json({ success: true, data: reports });
  } catch (error) {
    next(error);
  }
});

// GET /api/lab-reports/:id - Metadata view
laboratoryRouter.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const report = await prisma.labReport.findUnique({
      where: { id },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
      },
    });

    if (!report) {
      res.status(404).json({ success: false, error: 'Laboratory report not found.' });
      return;
    }

    if (req.user!.role === 'PATIENT' && report.patientId !== req.user!.patientId) {
      res.status(403).json({ success: false, error: 'Forbidden.' });
      return;
    }

    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
});

// GET /api/lab-reports/:id/file - Authenticated secure file stream
laboratoryRouter.get('/:id/file', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const report = await prisma.labReport.findUnique({
      where: { id },
    });

    if (!report || !report.filePath) {
      res.status(404).json({ success: false, error: 'Report document file not found.' });
      return;
    }

    // Authorization check
    if (req.user!.role === 'PATIENT' && report.patientId !== req.user!.patientId) {
      await logAuditEvent({
        userId: req.user!.userId,
        userRole: req.user!.role,
        action: 'UNAUTHORIZED_REPORT_ACCESS_ATTEMPT',
        entity: 'LabReport',
        entityId: report.id,
        details: 'Attempted to access another patient lab file',
      });
      res.status(403).json({ success: false, error: 'Forbidden: You cannot access files of other patients.' });
      return;
    }

    const fullFilePath = path.join(ENV.UPLOAD_DIR, report.filePath);
    if (!fs.existsSync(fullFilePath)) {
      res.status(404).json({ success: false, error: 'Storage file was moved or is missing.' });
      return;
    }

    // Set secure headers
    res.setHeader('Content-Type', report.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${report.fileName || 'report.pdf'}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');

    const fileStream = fs.createReadStream(fullFilePath);
    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
});
