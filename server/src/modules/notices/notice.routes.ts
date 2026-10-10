import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { z } from 'zod';

export const noticeRouter = Router();

// GET /api/notices - List active hospital notices
noticeRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const notices = await prisma.hospitalNotice.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json({ success: true, data: notices });
  } catch (error) {
    next(error);
  }
});

const createNoticeSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  content: z.string().min(3, 'Content is required'),
  type: z.enum(['GENERAL', 'MAINTENANCE', 'HOLIDAY', 'EMERGENCY']).default('MAINTENANCE'),
  reporter: z.string().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
});

// POST /api/notices - Admin creates hospital notice
noticeRouter.post('/', authenticate, requireRole(['ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = createNoticeSchema.parse(req.body);
    const notice = await prisma.hospitalNotice.create({
      data: validated,
    });

    res.status(201).json({
      success: true,
      message: 'Hospital notice published successfully.',
      data: notice,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/notices/:id - Admin archives notice
noticeRouter.delete('/:id', authenticate, requireRole(['ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await prisma.hospitalNotice.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ success: true, message: 'Notice dismissed.' });
  } catch (error) {
    next(error);
  }
});
