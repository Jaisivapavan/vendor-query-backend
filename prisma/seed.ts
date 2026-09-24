import { PrismaClient, PaymentMethod, OrderStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Create or update Demo Vendor
  const demoEmail = 'demo@restaurant.com';
  let vendor = await prisma.vendor.findUnique({ where: { email: demoEmail } });

  if (!vendor) {
    const passwordHash = await bcrypt.hash('password123', 10);
    vendor = await prisma.vendor.create({
      data: {
        businessName: 'Spice Craft Bistro',
        email: demoEmail,
        passwordHash,
      },
    });
    console.log(`✅ Created Demo Vendor: ${vendor.businessName} (${demoEmail})`);
  } else {
    console.log(`ℹ️ Vendor ${demoEmail} already exists. Using ID: ${vendor.id}`);
  }

  const vendorId = vendor.id;

  // 2. Create Categories & Menu Items
  const categoriesData = [
    {
      name: 'Starters',
      items: [
        { name: 'Paneer Tikka', price: 260 },
        { name: 'Chicken Seekh Kebab', price: 320 },
        { name: 'Crispy Corn & Waterchestnut', price: 210 },
        { name: 'Dahi Ke Kebab', price: 240 },
      ],
    },
    {
      name: 'Main Course',
      items: [
        { name: 'Butter Chicken', price: 380 },
        { name: 'Dal Makhani', price: 290 },
        { name: 'Hyderabadi Chicken Dum Biryani', price: 350 },
        { name: 'Paneer Butter Masala', price: 310 },
        { name: 'Garlic Butter Naan', price: 65 },
        { name: 'Jeera Rice', price: 160 },
      ],
    },
    {
      name: 'Beverages',
      items: [
        { name: 'Mango Lassi', price: 120 },
        { name: 'Fresh Lime Soda', price: 80 },
        { name: 'Masala Chai', price: 50 },
        { name: 'Cold Coffee', price: 140 },
      ],
    },
    {
      name: 'Desserts',
      items: [
        { name: 'Gulab Jamun (2 pcs)', price: 110 },
        { name: 'Rasmalai (2 pcs)', price: 140 },
        { name: 'Kulfi Falooda', price: 160 },
      ],
    },
  ];

  const allMenuItems: { id: string; name: string; price: number }[] = [];

  for (const catData of categoriesData) {
    let category = await prisma.category.findFirst({
      where: { vendorId, name: catData.name },
    });

    if (!category) {
      category = await prisma.category.create({
        data: {
          vendorId,
          name: catData.name,
        },
      });
    }

    for (const itemData of catData.items) {
      let menuItem = await prisma.menuItem.findFirst({
        where: { vendorId, categoryId: category.id, name: itemData.name },
      });

      if (!menuItem) {
        menuItem = await prisma.menuItem.create({
          data: {
            vendorId,
            categoryId: category.id,
            name: itemData.name,
            price: itemData.price,
            isAvailable: true,
          },
        });
      }
      allMenuItems.push({ id: menuItem.id, name: menuItem.name, price: menuItem.price });
    }
  }

  console.log(`✅ Loaded ${allMenuItems.length} menu items across ${categoriesData.length} categories.`);

  // Check existing orders count
  const existingOrdersCount = await prisma.order.count({ where: { vendorId } });
  if (existingOrdersCount >= 300) {
    console.log(`ℹ️ Already found ${existingOrdersCount} orders for this vendor. Seeding complete.`);
    return;
  }

  console.log(`📦 Generating 350 historical orders over the past 60 days...`);

  const paymentMethods: PaymentMethod[] = [PaymentMethod.UPI, PaymentMethod.CASH, PaymentMethod.CARD];
  // Weight UPI 55%, CARD 25%, CASH 20%
  const getRandomPaymentMethod = (): PaymentMethod => {
    const r = Math.random();
    if (r < 0.55) return PaymentMethod.UPI;
    if (r < 0.80) return PaymentMethod.CARD;
    return PaymentMethod.CASH;
  };

  const now = Date.now();
  const totalOrdersToGenerate = 350 - existingOrdersCount;

  for (let i = 0; i < totalOrdersToGenerate; i++) {
    // Distribute randomly across the last 60 days
    const daysAgo = Math.random() * 60;
    const orderDate = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
    // Add peak lunch (12-15) and dinner (19-23) bias
    const hour = Math.random() < 0.65 ? Math.floor(19 + Math.random() * 4) : Math.floor(12 + Math.random() * 4);
    orderDate.setHours(hour, Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));

    // Choose 1 to 4 random menu items
    const itemCount = Math.floor(Math.random() * 4) + 1;
    const shuffledItems = [...allMenuItems].sort(() => 0.5 - Math.random()).slice(0, itemCount);

    let subtotal = 0;
    const orderLines = shuffledItems.map((menuItem) => {
      const quantity = Math.floor(Math.random() * 3) + 1;
      const lineSubtotal = Number((menuItem.price * quantity).toFixed(2));
      subtotal += lineSubtotal;

      return {
        menuItemId: menuItem.id,
        quantity,
        unitPrice: menuItem.price,
        subtotal: lineSubtotal,
      };
    });

    const taxAmount = Number((subtotal * 0.05).toFixed(2));
    const totalAmount = Number((subtotal + taxAmount).toFixed(2));

    await prisma.order.create({
      data: {
        vendorId,
        totalAmount,
        taxAmount,
        paymentMethod: getRandomPaymentMethod(),
        status: OrderStatus.COMPLETED,
        createdAt: orderDate,
        items: {
          create: orderLines,
        },
      },
    });
  }

  const finalCount = await prisma.order.count({ where: { vendorId } });
  console.log(`🎉 Seeding finished! Total orders in database: ${finalCount}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
