import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      vendorId?: string;
      vendorEmail?: string;
    }
  }
}
