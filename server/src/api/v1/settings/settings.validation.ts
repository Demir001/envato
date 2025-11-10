import { z } from 'zod';

// Regex for time in HH:MM format (e.g., "09:00", "17:30")
const timeStringSchema = z
  .string()
  .regex(
    /^([01]\d|2[0-3]):([0-5]\d)$/,
    'Time must be in HH:MM format (e.g., 09:00)',
  );

// Regex for ISO Date (YYYY-MM-DD)
const isoDateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

/**
 * Zod schema for a single day's opening hours.
 */
const dayHoursSchema = z
  .object({
    open: timeStringSchema,
    close: timeStringSchema,
    isOpen: z.boolean(),
  })
  // Ensure 'close' is after 'open' if the clinic is open
  .refine(
    (data) => {
      if (!data.isOpen) return true;
      return data.close > data.open;
    },
    {
      message: 'Close time must be after open time',
      path: ['close'],
    },
  );

/**
 * Zod schema for the complete 7-day opening hours object.
 */
const openingHoursSchema = z.object({
  mon: dayHoursSchema,
  tue: dayHoursSchema,
  wed: dayHoursSchema,
  thu: dayHoursSchema,
  fri: dayHoursSchema,
  sat: dayHoursSchema,
  sun: dayHoursSchema,
});

/**
 * Zod schema for updating the clinic settings.
 * All fields are optional.
 */
export const updateSettingsSchema = z.object({
  body: z
    .object({
      clinicName: z
        .string()
        .min(2, 'Clinic name must be at least 2 characters')
        .optional(),
      currencySymbol: z
        .string()
        .max(5, 'Currency symbol is too long')
        .optional(),
      openingHours: openingHoursSchema.nullable().optional(),
      holidays: z
        .array(isoDateString, {
          invalid_type_error: 'Holidays must be an array of YYYY-MM-DD strings',
        })
        .nullable()
        .optional(),
    })
    // Ensure at least one field is provided
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided to update settings',
    }),
});

// Export inferred types
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>['body'];