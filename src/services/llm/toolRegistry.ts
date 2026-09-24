import { FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { z } from 'zod';
import { AnalyticsService } from '../analytics.service';

// 1. Zod schemas for validating tool inputs from LLM
export const topSellingItemsToolSchema = z.object({
  limit: z.number().int().min(1).max(20).optional().default(5),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const revenueSummaryToolSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const paymentBreakdownToolSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// 2. Gemini Function Declarations
export const analyticsFunctionDeclarations: FunctionDeclaration[] = [
  {
    name: 'getTopSellingItems',
    description:
      'Fetches top-selling dishes and items ranked by total quantity sold and revenue for a given date range.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        limit: {
          type: SchemaType.INTEGER,
          description: 'Number of top items to retrieve (default is 5).',
        },
        startDate: {
          type: SchemaType.STRING,
          description: 'Start date in ISO format (e.g., 2026-08-01 or 2026-08-01T00:00:00Z).',
        },
        endDate: {
          type: SchemaType.STRING,
          description: 'End date in ISO format (e.g., 2026-08-31 or 2026-08-31T23:59:59Z).',
        },
      },
    },
  },
  {
    name: 'getRevenueSummary',
    description:
      'Calculates total earnings, gross and net revenue, order volume, and tax collected over a date range.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        startDate: {
          type: SchemaType.STRING,
          description: 'Start date in ISO format (e.g., 2026-08-01).',
        },
        endDate: {
          type: SchemaType.STRING,
          description: 'End date in ISO format (e.g., 2026-08-31).',
        },
      },
    },
  },
  {
    name: 'getPaymentMethodBreakdown',
    description:
      'Calculates the sales volume and transaction count grouped across payment methods: UPI, CASH, and CARD.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        startDate: {
          type: SchemaType.STRING,
          description: 'Start date in ISO format.',
        },
        endDate: {
          type: SchemaType.STRING,
          description: 'End date in ISO format.',
        },
      },
    },
  },
];

// 3. Dispatcher executing deterministic SQL aggregations
// CRITICAL INVARIANT: vendorId is ALWAYS taken from verified JWT session, NEVER from LLM parameters
export async function executeAnalyticsTool(
  toolName: string,
  args: any,
  vendorId: string
): Promise<any> {
  switch (toolName) {
    case 'getTopSellingItems': {
      const parsed = topSellingItemsToolSchema.parse(args || {});
      return AnalyticsService.getTopSellingItems(
        vendorId,
        parsed.limit,
        parsed.startDate,
        parsed.endDate
      );
    }

    case 'getRevenueSummary': {
      const parsed = revenueSummaryToolSchema.parse(args || {});
      return AnalyticsService.getRevenueSummary(
        vendorId,
        parsed.startDate,
        parsed.endDate
      );
    }

    case 'getPaymentMethodBreakdown': {
      const parsed = paymentBreakdownToolSchema.parse(args || {});
      return AnalyticsService.getPaymentMethodBreakdown(
        vendorId,
        parsed.startDate,
        parsed.endDate
      );
    }

    default:
      throw new Error(`Unrecognized tool call: ${toolName}`);
  }
}
