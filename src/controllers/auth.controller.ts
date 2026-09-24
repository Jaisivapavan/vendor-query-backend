import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';

export const registerSchema = z.object({
  businessName: z.string().min(2, 'Business name must have at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { businessName, email, password } = req.body;
      const result = await AuthService.register(businessName, email, password);
      res.status(201).json({
        success: true,
        message: 'Vendor registered successfully',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Registration failed',
      });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        error: error.message || 'Authentication failed',
      });
    }
  }

  static async getProfile(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      data: {
        vendorId: req.vendorId,
        email: req.vendorEmail,
      },
    });
  }
}
