import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/db';

describe('API Integration Endpoints Tests', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('GET /health - should return healthy system status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.system).toBe('VendorQuery API');
  });

  it('POST /api/auth/login - should authenticate valid demo credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'demo@restaurant.com',
        password: 'password123',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.vendor.email).toBe('demo@restaurant.com');
  });

  it('POST /api/auth/login - should reject invalid credentials with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'demo@restaurant.com',
        password: 'incorrect_password',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
