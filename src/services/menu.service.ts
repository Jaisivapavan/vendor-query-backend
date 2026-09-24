import prisma from '../config/db';

export class MenuService {
  // Category management
  static async createCategory(vendorId: string, name: string) {
    return prisma.category.create({
      data: {
        vendorId,
        name,
      },
    });
  }

  static async getCategories(vendorId: string) {
    return prisma.category.findMany({
      where: { vendorId },
      include: {
        _count: {
          select: { menuItems: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  // Menu item management
  static async createMenuItem(
    vendorId: string,
    categoryId: string,
    name: string,
    price: number
  ) {
    // Verify category belongs to this vendor
    const category = await prisma.category.findFirst({
      where: { id: categoryId, vendorId },
    });

    if (!category) {
      throw new Error('Category not found or does not belong to this vendor.');
    }

    return prisma.menuItem.create({
      data: {
        vendorId,
        categoryId,
        name,
        price,
        isAvailable: true,
      },
      include: {
        category: true,
      },
    });
  }

  static async getMenuItems(vendorId: string, availableOnly: boolean = false) {
    return prisma.menuItem.findMany({
      where: {
        vendorId,
        ...(availableOnly ? { isAvailable: true } : {}),
      },
      include: {
        category: true,
      },
      orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
    });
  }

  static async updateMenuItem(
    vendorId: string,
    itemId: string,
    data: { price?: number; isAvailable?: boolean; name?: string }
  ) {
    const item = await prisma.menuItem.findFirst({
      where: { id: itemId, vendorId },
    });

    if (!item) {
      throw new Error('Menu item not found or does not belong to this vendor.');
    }

    return prisma.menuItem.update({
      where: { id: itemId },
      data,
      include: {
        category: true,
      },
    });
  }
}
