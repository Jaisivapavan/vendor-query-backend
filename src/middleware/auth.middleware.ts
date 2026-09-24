import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  vendorId: string;
  email?: string;
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Access denied. Bearer token missing or malformed.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET || 'vendor_query_super_secret_jwt_key_2026_production';

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;

    if (!decoded.vendorId) {
      res.status(401).json({
        success: false,
        error: 'Invalid token: vendorId claim missing.',
      });
      return;
    }

    req.vendorId = decoded.vendorId;
    req.vendorEmail = decoded.email;
    next();
  } catch {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token.',
    });
  }
};
