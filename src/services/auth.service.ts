import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';

const JWT_SECRET = process.env.JWT_SECRET || 'vendor_query_super_secret_jwt_key_2026_production';

export class AuthService {
  static async register(businessName: string, email: string, password: string) {
    const existing = await prisma.vendor.findUnique({
      where: { email },
    });

    if (existing) {
      throw new Error('A vendor account with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const vendor = await prisma.vendor.create({
      data: {
        businessName,
        email,
        passwordHash,
      },
      select: {
        id: true,
        businessName: true,
        email: true,
        createdAt: true,
      },
    });

    const token = jwt.sign(
      { vendorId: vendor.id, email: vendor.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { vendor, token };
  }

  static async login(email: string, password: string) {
    const vendor = await prisma.vendor.findUnique({
      where: { email },
    });

    if (!vendor) {
      throw new Error('Invalid email or password.');
    }

    const isValid = await bcrypt.compare(password, vendor.passwordHash);
    if (!isValid) {
      throw new Error('Invalid email or password.');
    }

    const token = jwt.sign(
      { vendorId: vendor.id, email: vendor.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      vendor: {
        id: vendor.id,
        businessName: vendor.businessName,
        email: vendor.email,
        createdAt: vendor.createdAt,
      },
      token,
    };
  }
}
