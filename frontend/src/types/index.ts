export interface Vendor {
  id: string;
  businessName: string;
  email: string;
  createdAt?: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  isAvailable: boolean;
  categoryId: string;
  category?: Category;
}

export interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  menuItem?: MenuItem;
}

export interface Order {
  id: string;
  totalAmount: number;
  taxAmount: number;
  discountAmount: number;
  paymentMethod: 'CASH' | 'UPI' | 'CARD';
  status: 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  orderItems?: OrderItem[];
  _count?: { orderItems: number };
}

export interface RevenueSummary {
  totalRevenue: number;
  netRevenue: number;
  totalTax: number;
  totalDiscount: number;
  totalOrders: number;
  averageOrderValue: number;
}

export interface TopSellingItem {
  menuItemId: string;
  name: string;
  totalQuantitySold: number;
  totalRevenue: number;
}

export interface PaymentSplitItem {
  paymentMethod: string;
  totalAmount: number;
  orderCount: number;
  orderSharePercentage: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
}
