import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database.js';
import * as billingService from './billing.service.js';
import { createBillSchema, processPaymentSchema } from './billing.schema.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

export const billingRouter = Router();

// POST /api/admin/bills - Admin creates invoice
billingRouter.post('/', authenticate, requireRole(['ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = createBillSchema.parse(req.body);
    const bill = await billingService.createBill({
      patientId: validated.patientId,
      appointmentId: validated.appointmentId,
      dueDate: validated.dueDate,
      items: validated.items,
      taxPercent: validated.taxPercent,
      actorUserId: req.user!.userId,
      actorRole: req.user!.role,
    });

    res.status(201).json({
      success: true,
      message: 'Itemized invoice created successfully.',
      data: bill,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/bills - Admin lists all bills
billingRouter.get('/', authenticate, requireRole(['ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const status = req.query.status as string;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;

    const [bills, total] = await Promise.all([
      prisma.bill.findMany({
        where,
        skip,
        take: limit,
        include: {
          patient: {
            include: { user: { select: { firstName: true, lastName: true, email: true } } },
          },
          items: true,
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.bill.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        bills,
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

// GET /api/bills/mine - Patient's own bills
billingRouter.get('/mine', authenticate, requireRole(['PATIENT']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bills = await prisma.bill.findMany({
      where: { patientId: req.user!.patientId },
      include: {
        items: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: bills });
  } catch (error) {
    next(error);
  }
});

// GET /api/bills/:id - View invoice details
billingRouter.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const bill = await prisma.bill.findUnique({
      where: { id },
      include: {
        patient: { include: { user: true } },
        items: true,
        payments: { orderBy: { paymentDate: 'desc' } },
        appointment: {
          include: { doctor: { include: { user: true, department: true } } },
        },
      },
    });

    if (!bill) {
      res.status(404).json({ success: false, error: 'Invoice not found.' });
      return;
    }

    if (req.user!.role === 'PATIENT' && bill.patientId !== req.user!.patientId) {
      res.status(403).json({ success: false, error: 'Forbidden.' });
      return;
    }

    res.json({ success: true, data: bill });
  } catch (error) {
    next(error);
  }
});

// POST /api/bills/:id/payments - Simulated Payment Gateway
billingRouter.post('/:id/payments', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const validated = processPaymentSchema.parse(req.body);
    const bill = await prisma.bill.findUnique({ where: { id } });

    if (!bill) {
      res.status(404).json({ success: false, error: 'Invoice not found.' });
      return;
    }

    if (req.user!.role === 'PATIENT' && bill.patientId !== req.user!.patientId) {
      res.status(403).json({ success: false, error: 'Forbidden.' });
      return;
    }

    const result = await billingService.processSimulatedPayment({
      billId: id,
      amount: validated.amount,
      paymentMethod: validated.paymentMethod,
      notes: validated.notes,
      actorUserId: req.user!.userId,
      actorRole: req.user!.role,
    });

    res.json({
      success: true,
      message: 'Simulated payment completed successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/bills/:id/receipt - Formal receipt view
billingRouter.get('/:id/receipt', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const bill = await prisma.bill.findUnique({
      where: { id },
      include: {
        patient: { include: { user: true } },
        items: true,
        payments: true,
      },
    });

    if (!bill) {
      res.status(404).json({ success: false, error: 'Invoice not found.' });
      return;
    }

    if (req.user!.role === 'PATIENT' && bill.patientId !== req.user!.patientId) {
      res.status(403).json({ success: false, error: 'Forbidden.' });
      return;
    }

    res.json({
      success: true,
      data: {
        receiptNumber: `REC-${bill.billNumber}`,
        issuedDate: new Date(),
        bill,
      },
    });
  } catch (error) {
    next(error);
  }
});
