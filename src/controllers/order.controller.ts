import { Request, Response } from 'express';
import { z } from 'zod';
import { OrderService } from '../services/order.service';

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        menuItemId: z.string().uuid('Invalid menu item ID'),
        quantity: z.number().int().positive('Quantity must be at least 1'),
      })
    )
    .min(1, 'At least one item is required'),
  paymentMethod: z.enum(['CASH', 'UPI', 'CARD']).default('CASH'),
});

export class OrderController {
  static async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.vendorId!;
      const { items, paymentMethod } = req.body;
      const order = await OrderService.createOrder(vendorId, items, paymentMethod);

      res.status(201).json({
        success: true,
        message: 'Order placed and billed successfully',
        data: order,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create order',
      });
    }
  }

  static async getOrders(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.vendorId!;
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
      const startDate = req.query.startDate ? new Date(String(req.query.startDate)) : undefined;
      const endDate = req.query.endDate ? new Date(String(req.query.endDate)) : undefined;

      const result = await OrderService.getOrders(vendorId, page, limit, startDate, endDate);

      res.status(200).json({
        success: true,
        data: result.orders,
        pagination: result.pagination,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch orders',
      });
    }
  }

  static async getOrderById(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.vendorId!;
      const id = String(req.params.id);
      const order = await OrderService.getOrderById(vendorId, id);

      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        error: error.message || 'Order not found',
      });
    }
  }
}
