import { Request, Response } from 'express';
import { z } from 'zod';
import { MenuService } from '../services/menu.service';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
});

export const createMenuItemSchema = z.object({
  categoryId: z.string().uuid('Invalid category ID format'),
  name: z.string().min(1, 'Item name is required'),
  price: z.number().positive('Price must be greater than 0'),
});

export const updateMenuItemSchema = z.object({
  name: z.string().optional(),
  price: z.number().positive().optional(),
  isAvailable: z.boolean().optional(),
});

export class MenuController {
  // Category controllers
  static async createCategory(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.vendorId!;
      const { name } = req.body;
      const category = await MenuService.createCategory(vendorId, name);
      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create category',
      });
    }
  }

  static async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.vendorId!;
      const categories = await MenuService.getCategories(vendorId);
      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch categories',
      });
    }
  }

  // Menu item controllers
  static async createMenuItem(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.vendorId!;
      const { categoryId, name, price } = req.body;
      const item = await MenuService.createMenuItem(vendorId, categoryId, name, price);
      res.status(201).json({
        success: true,
        message: 'Menu item created successfully',
        data: item,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create menu item',
      });
    }
  }

  static async getMenuItems(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.vendorId!;
      const availableOnly = req.query.available === 'true';
      const items = await MenuService.getMenuItems(vendorId, availableOnly);
      res.status(200).json({
        success: true,
        data: items,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch menu items',
      });
    }
  }

  static async updateMenuItem(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.vendorId!;
      const { id } = req.params;
      const updated = await MenuService.updateMenuItem(vendorId, id as string, req.body);
      res.status(200).json({
        success: true,
        message: 'Menu item updated successfully',
        data: updated,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update menu item',
      });
    }
  }
}
