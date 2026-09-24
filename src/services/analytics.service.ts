import prisma from '../config/db';

export class AnalyticsService {
  /**
   * 1. Top Selling Dishes by volume & revenue
   */
  static async getTopSellingItems(
    vendorId: string,
    limit: number = 5,
    startDate?: string | Date,
    endDate?: string | Date
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const whereOrder: any = {
      vendorId,
      status: 'COMPLETED',
    };

    if (start || end) {
      whereOrder.createdAt = {};
      if (start) whereOrder.createdAt.gte = start;
      if (end) whereOrder.createdAt.lte = end;
    }

    // Group order items by menuItemId
    const itemAggregations = await prisma.orderItem.groupBy({
      by: ['menuItemId'],
      where: {
        order: whereOrder,
      },
      _sum: {
        quantity: true,
        subtotal: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: limit,
    });

    if (itemAggregations.length === 0) {
      return [];
    }

    // Fetch dish details for names & categories
    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: itemAggregations.map((a) => a.menuItemId) },
        vendorId,
      },
      include: {
        category: {
          select: { name: true },
        },
      },
    });

    const itemMap = new Map(menuItems.map((m) => [m.id, m]));

    return itemAggregations.map((agg, index) => {
      const details = itemMap.get(agg.menuItemId);
      return {
        rank: index + 1,
        menuItemId: agg.menuItemId,
        name: details?.name || 'Unknown Item',
        category: details?.category.name || 'Uncategorized',
        price: details?.price || 0,
        totalQuantitySold: agg._sum.quantity || 0,
        totalRevenue: Number((agg._sum.subtotal || 0).toFixed(2)),
      };
    });
  }

  /**
   * 2. Revenue & Tax Summary over date range
   */
  static async getRevenueSummary(
    vendorId: string,
    startDate?: string | Date,
    endDate?: string | Date
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const whereOrder: any = {
      vendorId,
      status: 'COMPLETED',
    };

    if (start || end) {
      whereOrder.createdAt = {};
      if (start) whereOrder.createdAt.gte = start;
      if (end) whereOrder.createdAt.lte = end;
    }

    const [aggregateData, orderCount] = await Promise.all([
      prisma.order.aggregate({
        where: whereOrder,
        _sum: {
          totalAmount: true,
          taxAmount: true,
        },
        _avg: {
          totalAmount: true,
        },
      }),
      prisma.order.count({ where: whereOrder }),
    ]);

    const totalRevenue = Number((aggregateData._sum.totalAmount || 0).toFixed(2));
    const totalTax = Number((aggregateData._sum.taxAmount || 0).toFixed(2));
    const averageOrderValue = Number((aggregateData._avg.totalAmount || 0).toFixed(2));
    const netRevenue = Number((totalRevenue - totalTax).toFixed(2));

    return {
      totalOrders: orderCount,
      totalRevenue,
      netRevenue,
      totalTax,
      averageOrderValue,
      period: {
        startDate: start ? start.toISOString() : 'All time',
        endDate: end ? end.toISOString() : 'Present',
      },
    };
  }

  /**
   * 3. Payment Method Distribution (UPI, Cash, Card)
   */
  static async getPaymentMethodBreakdown(
    vendorId: string,
    startDate?: string | Date,
    endDate?: string | Date
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const whereOrder: any = {
      vendorId,
      status: 'COMPLETED',
    };

    if (start || end) {
      whereOrder.createdAt = {};
      if (start) whereOrder.createdAt.gte = start;
      if (end) whereOrder.createdAt.lte = end;
    }

    const breakdown = await prisma.order.groupBy({
      by: ['paymentMethod'],
      where: whereOrder,
      _count: {
        id: true,
      },
      _sum: {
        totalAmount: true,
      },
    });

    const totalOrders = breakdown.reduce((sum, b) => sum + b._count.id, 0);
    const totalSales = breakdown.reduce((sum, b) => sum + (b._sum.totalAmount || 0), 0);

    return breakdown.map((item) => {
      const amount = Number((item._sum.totalAmount || 0).toFixed(2));
      const count = item._count.id;
      const orderSharePercentage = totalOrders > 0 ? Number(((count / totalOrders) * 100).toFixed(1)) : 0;
      const revenueSharePercentage = totalSales > 0 ? Number(((amount / totalSales) * 100).toFixed(1)) : 0;

      return {
        paymentMethod: item.paymentMethod,
        orderCount: count,
        totalAmount: amount,
        orderSharePercentage,
        revenueSharePercentage,
      };
    });
  }
}
