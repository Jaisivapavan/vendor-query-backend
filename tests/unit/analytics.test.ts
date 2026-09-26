import { AnalyticsService } from '../../src/services/analytics.service';
import { prisma } from '../../src/config/db';

describe('Analytics Service - SQL Aggregations & Metrics Tests', () => {
  let demoVendorId: string;

  beforeAll(async () => {
    const demoVendor = await prisma.vendor.findFirst({
      where: { email: 'demo@restaurant.com' },
    });
    if (demoVendor) {
      demoVendorId = demoVendor.id;
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should calculate non-negative revenue and correct order count for demo vendor', async () => {
    if (!demoVendorId) return;

    const summary = await AnalyticsService.getRevenueSummary(demoVendorId);

    expect(summary).toBeDefined();
    expect(summary.totalRevenue).toBeGreaterThanOrEqual(0);
    expect(summary.totalOrders).toBeGreaterThan(0);
    expect(summary.averageOrderValue).toBeGreaterThanOrEqual(0);
  });

  it('should rank top selling items with positive quantities', async () => {
    if (!demoVendorId) return;

    const topItems = await AnalyticsService.getTopSellingItems(demoVendorId, 5);

    expect(Array.isArray(topItems)).toBe(true);
    expect(topItems.length).toBeLessThanOrEqual(5);

    if (topItems.length > 0) {
      expect(topItems[0]).toHaveProperty('name');
      expect(topItems[0]).toHaveProperty('totalQuantitySold');
      expect(topItems[0].totalQuantitySold).toBeGreaterThan(0);
    }
  });

  it('should calculate payment method breakdown across valid methods', async () => {
    if (!demoVendorId) return;

    const breakdown = await AnalyticsService.getPaymentMethodBreakdown(demoVendorId);

    expect(Array.isArray(breakdown)).toBe(true);
    const validMethods = ['CASH', 'UPI', 'CARD'];
    breakdown.forEach((item) => {
      expect(validMethods).toContain(item.paymentMethod);
      expect(item.orderSharePercentage).toBeGreaterThanOrEqual(0);
      expect(item.orderSharePercentage).toBeLessThanOrEqual(100);
    });
  });
});
