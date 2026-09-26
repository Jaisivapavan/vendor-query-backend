import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

describe('Auth Service - Security & Token Unit Tests', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

  it('should securely hash passwords using bcrypt salt rounds', async () => {
    const rawPassword = 'password123';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    expect(hashedPassword).toBeDefined();
    expect(hashedPassword).not.toBe(rawPassword);

    const isMatch = await bcrypt.compare(rawPassword, hashedPassword);
    expect(isMatch).toBe(true);

    const isWrongMatch = await bcrypt.compare('wrongpassword', hashedPassword);
    expect(isWrongMatch).toBe(false);
  });

  it('should sign and verify JWT authentication tokens with vendorId payload', () => {
    const mockVendorId = 'vendor-uuid-12345';
    const mockEmail = 'test@restaurant.com';

    const token = jwt.sign(
      { vendorId: mockVendorId, email: mockEmail },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(20);

    const decoded = jwt.verify(token, JWT_SECRET) as {
      vendorId: string;
      email: string;
    };

    expect(decoded.vendorId).toBe(mockVendorId);
    expect(decoded.email).toBe(mockEmail);
  });
});
