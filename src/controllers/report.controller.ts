import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { cacheService } from '../config/redis';

export class ReportController {
  static async getTopItems(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.vendorId!;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const cacheKey = `reports:top-items:${vendorId}:${limit}:${startDate || 'all'}:${endDate || 'all'}`;
      const cached = await cacheService.get(cacheKey);

      if (cached) {
        res.status(200).json({
          success: true,
          cached: true,
          data: JSON.parse(cached),
        });
        return;
      }

      const data = await AnalyticsService.getTopSellingItems(vendorId, limit, startDate, endDate);
      await cacheService.set(cacheKey, JSON.stringify(data), 120); // 2-min cache

      res.status(200).json({
        success: true,
        cached: false,
        data,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch top items',
      });
    }
  }

  static async getRevenue(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.vendorId!;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const cacheKey = `reports:revenue:${vendorId}:${startDate || 'all'}:${endDate || 'all'}`;
      const cached = await cacheService.get(cacheKey);

      if (cached) {
        res.status(200).json({
          success: true,
          cached: true,
          data: JSON.parse(cached),
        });
        return;
      }

      const data = await AnalyticsService.getRevenueSummary(vendorId, startDate, endDate);
      await cacheService.set(cacheKey, JSON.stringify(data), 120);

      res.status(200).json({
        success: true,
        cached: false,
        data,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch revenue summary',
      });
    }
  }

  static async getPaymentSplit(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.vendorId!;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const cacheKey = `reports:payment-split:${vendorId}:${startDate || 'all'}:${endDate || 'all'}`;
      const cached = await cacheService.get(cacheKey);

      if (cached) {
        res.status(200).json({
          success: true,
          cached: true,
          data: JSON.parse(cached),
        });
        return;
      }

      const data = await AnalyticsService.getPaymentMethodBreakdown(vendorId, startDate, endDate);
      await cacheService.set(cacheKey, JSON.stringify(data), 120);

      res.status(200).json({
        success: true,
        cached: false,
        data,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch payment split',
      });
    }
  }
}
