import { Router, Request, Response, NextFunction } from 'express';
import * as doctorService from './doctor.service.js';
import { calculateDoctorAvailability } from '../schedules/schedule.service.js';
import { createDoctorSchema, updateDoctorSchema } from './doctor.schema.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

export const doctorRouter = Router();

// GET /api/doctors - List doctors with search and filter
doctorRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { departmentId, search, isAvailable, page, limit } = req.query;
    const result = await doctorService.listDoctors({
      departmentId: departmentId as string,
      search: search as string,
      isAvailable: isAvailable !== undefined ? isAvailable === 'true' : undefined,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// GET /api/doctors/:id - Get specific doctor profile
doctorRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const doctor = await doctorService.getDoctorById(id);
    res.json({ success: true, data: doctor });
  } catch (error) {
    next(error);
  }
});

// GET /api/doctors/:id/availability?date=YYYY-MM-DD
doctorRouter.get('/:id/availability', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { date } = req.query;
    if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({
        success: false,
        error: 'Query parameter "date" in YYYY-MM-DD format is required.',
      });
      return;
    }

    const availability = await calculateDoctorAvailability(id, date);
    res.json({ success: true, data: availability });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/doctors - Admin creates doctor account
doctorRouter.post('/', authenticate, requireRole(['ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = createDoctorSchema.parse(req.body);
    const doctor = await doctorService.createDoctor(validated, req.user!.userId);

    res.status(201).json({
      success: true,
      message: 'Doctor account and clinical schedule created successfully.',
      data: doctor,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/doctors/:id - Admin updates doctor account
doctorRouter.patch('/:id', authenticate, requireRole(['ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const validated = updateDoctorSchema.parse(req.body);
    const updated = await doctorService.updateDoctor(id, validated, req.user!.userId);

    res.json({
      success: true,
      message: 'Doctor profile updated successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
});
