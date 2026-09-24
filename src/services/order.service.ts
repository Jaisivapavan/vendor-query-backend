import type { MenuItem, Prisma } from '@prisma/client';
import prisma from '../config/db';

export type PaymentMethod = 'CASH' | 'UPI' | 'CARD';
export type OrderStatus = 'COMPLETED' | 'CANCELLED';

export interface OrderItemInput {
  menuItemId: string;
  quantity: number;
}

export class OrderService {
  static async createOrder(
    vendorId: string,
    items: OrderItemInput[],
    paymentMethod: PaymentMethod = 'CASH'
  ) {
    if (!items || items.length === 0) {
      throw new Error('Order must contain at least one item.');
    }

    const menuItemIds = items.map((i) => i.menuItemId);

    // Fetch and verify all menu items belong to the authenticated vendor
    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        vendorId,
      },
    });

    if (menuItems.length !== menuItemIds.length) {
      throw new Error('One or more menu items were not found or do not belong to your store.');
    }

    const itemMap = new Map<string, MenuItem>(menuItems.map((m: MenuItem) => [m.id, m]));

    // Calculate line items, subtotal, and 5% GST
    let subtotal = 0;
    const orderLineItems = items.map((item) => {
      const dbItem = itemMap.get(item.menuItemId)!;
      const lineSubtotal = Number((dbItem.price * item.quantity).toFixed(2));
      subtotal += lineSubtotal;

      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice: dbItem.price,
        subtotal: lineSubtotal,
      };
    });

    // 5% GST
    const taxAmount = Number((subtotal * 0.05).toFixed(2));
    const totalAmount = Number((subtotal + taxAmount).toFixed(2));

    // Save transactionally in Prisma
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const order = await tx.order.create({
        data: {
          vendorId,
          totalAmount,
          taxAmount,
          paymentMethod,
          status: 'COMPLETED',
          items: {
            create: orderLineItems,
          },
        },
        include: {
          items: {
            include: {
              menuItem: true,
            },
          },
        },
      });

      return order;
    });
  }

  static async getOrders(
    vendorId: string,
    page: number = 1,
    limit: number = 20,
    startDate?: Date,
    endDate?: Date
  ) {
    const skip = (page - 1) * limit;

    const whereClause: any = { vendorId };

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = startDate;
      if (endDate) whereClause.createdAt.lte = endDate;
    }

    const [total, orders] = await Promise.all([
      prisma.order.count({ where: whereClause }),
      prisma.order.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              menuItem: true,
            },
          },
        },
      }),
    ]);

    return {
      orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getOrderById(vendorId: string, orderId: string) {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        vendorId,
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        vendor: {
          select: {
            businessName: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error('Order not found or does not belong to this vendor.');
    }

    return order;
  }
}
