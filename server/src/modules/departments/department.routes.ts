import { Router, Request, Response } from 'express';
import { prisma } from '../../config/database.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { z } from 'zod';

export const departmentRouter = Router();

// GET /api/departments
departmentRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { doctors: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: departments,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const createDeptSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  code: z.string().min(2, 'Short code is required'),
  description: z.string().optional(),
  color: z.string().optional(),
});

// POST /api/admin/departments
departmentRouter.post('/', authenticate, requireRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const validated = createDeptSchema.parse(req.body);
    const department = await prisma.department.create({
      data: validated,
    });

    res.status(201).json({
      success: true,
      message: 'Department created successfully.',
      data: department,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});
