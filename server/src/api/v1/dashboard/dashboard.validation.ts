import { z } from 'zod';
import { subDays, format } from 'date-fns';

// ISO Date regex (YYYY-MM-DD)
const isoDateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

// Get default start date (30 days ago) and end date (today)
// We set this here so the defaults are consistent
const defaultEndDate = format(new Date(), 'yyyy-MM-dd');
const defaultStartDate = format(subDays(new Date(), 30), 'yyyy-MM-dd');

/**
 * Zod schema for validating the dashboard query parameters.
 * If no dates are provided, it defaults to the last 30 days.
 */
export const dashboardQuerySchema = z.object({
  query: z
    .object({
      startDate: isoDateString.optional().default(defaultStartDate),
      endDate: isoDateString.optional().default(defaultEndDate),
    })
    .refine(
      (data) => {
        // Ensure endDate is on or after startDate
        return new Date(data.endDate) >= new Date(data.startDate);
      },
      {
        message: 'End date must be on or after the start date',
        path: ['endDate'],
      },
    )
    .refine(
      (data) => {
        // Optional: Add a limit to the date range to prevent huge queries
        // e.g., limit to 1 year
        const diffInMs =
          new Date(data.endDate).getTime() -
          new Date(data.startDate).getTime();
        const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
        return diffInDays <= 366;
      },
      {
        message: 'The date range cannot exceed 366 days',
        path: ['endDate'],
      },
    ),
});

// Export inferred types
export type DashboardQueryInput = z.infer<typeof dashboardQuerySchema>['query'];