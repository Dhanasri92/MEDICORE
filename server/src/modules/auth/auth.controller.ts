import { Request, Response, NextFunction } from 'express';
import { registerSchema, loginSchema, updateProfileSchema } from './auth.schema.js';
import * as authService from './auth.service.js';
import { prisma } from '../../config/database.js';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = registerSchema.parse(req.body);
    const result = await authService.registerPatient(validated);

    // Set HttpOnly cookie
    res.cookie('medicore_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = loginSchema.parse(req.body);
    const ipAddress = req.ip || req.socket.remoteAddress;
    const result = await authService.loginUser(validated.email, validated.password, ipAddress);

    // Set HttpOnly cookie
    res.cookie('medicore_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: 'Login successful.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie('medicore_token');
  res.json({
    success: true,
    message: 'Logged out successfully.',
  });
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await authService.getCurrentUserProfile(req.user!.userId);
    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = updateProfileSchema.parse(req.body);
    const userId = req.user!.userId;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: validated.firstName,
        lastName: validated.lastName,
        phone: validated.phone,
      },
    });

    if (req.user!.patientId) {
      await prisma.patient.update({
        where: { id: req.user!.patientId },
        data: {
          address: validated.address,
          emergencyContactName: validated.emergencyContactName,
          emergencyContactPhone: validated.emergencyContactPhone,
          allergies: validated.allergies,
          bloodGroup: validated.bloodGroup,
        },
      });
    }

    const updatedProfile = await authService.getCurrentUserProfile(userId);
    res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: updatedProfile,
    });
  } catch (error) {
    next(error);
  }
}
