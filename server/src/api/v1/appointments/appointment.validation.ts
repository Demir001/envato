import { z } from 'zod';

// DÜZELTME 1: 'offset: true' kaldırıldı.
// Bu şema artık '2024-12-25T09:00:00' (lokal)
// VE '2024-12-25T09:00:00Z' (UTC/offset) formatlarını kabul eder.
const isoDateTimeString = z
  .string()
  .datetime({ message: 'Invalid ISO 8601 DateTime string' });

// Sadece YYYY-MM-DD formatı için ayrı bir schema (FullCalendar ay görünümü)
const dateString = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    'Date must be in YYYY-MM-DD format (e.g., 2024-12-31)',
  );

// FullCalendar'ın gönderebileceği iki formatı da (Tarih veya Tarih+Saat) kabul et
// Bu, sorgu parametreleri (query params) için kullanılır.
const calendarDateSchema = z.union([isoDateTimeString, dateString], {
  invalid_type_error: 'Start/End must be YYYY-MM-DD or ISO DateTime string',
});

/**
 * Zod schema for listing appointments (used by FullCalendar).
 * DÜZELTME 2: Hatalı regex yerine yeni ve esnek 'calendarDateSchema' kullanıldı.
 */
export const listAppointmentsSchema = z.object({
  query: z.object({
    start: calendarDateSchema,
    end: calendarDateSchema,
    doctorId: z.string().regex(/^\d+$/).optional(),
    patientId: z.string().regex(/^\d+$/).optional(),
    status: z.enum(['scheduled', 'completed', 'cancelled', 'noshow']).optional(),
  }),
});

/**
 * Zod schema for validating the appointment ID in params.
 */
export const appointmentIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Appointment ID must be a number'),
  }),
});

/**
 * Zod schema for creating a new appointment.
 * DÜZELTME 3: Gövde (body) her zaman tam ISO DateTime beklemelidir.
 * Bu nedenle düzeltilmiş 'isoDateTimeString' kullanıldı.
 */
export const createAppointmentSchema = z.object({
  body: z
    .object({
      patientId: z
        .number()
        .int()
        .positive('Patient ID must be a positive number'),
      doctorId: z
        .number()
        .int()
        .positive('Doctor ID must be a positive number'),
      title: z.string().min(2, 'Title is required').nullable().optional(),
      start: isoDateTimeString, // Uses the fixed schema
      end: isoDateTimeString, // Uses the fixed schema
      notes: z.string().nullable().optional(),
    })
    // Ensure 'end' is after 'start'
    .refine((data) => new Date(data.end) > new Date(data.start), {
      message: 'End time must be after start time',
      path: ['end'],
    }),
});

/**
 * Zod schema for updating an appointment (drag-drop, status change).
 * DÜZELTME 4: Düzeltilmiş 'isoDateTimeString' kullanıldı.
 */
export const updateAppointmentSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Appointment ID must be a number'),
  }),
  body: z
    .object({
      patientId: z
        .number()
        .int()
        .positive('Patient ID must be a positive number')
        .optional(),
      doctorId: z
        .number()
        .int()
        .positive('Doctor ID must be a positive number')
        .optional(),
      start: isoDateTimeString.optional(), // Uses the fixed schema
      end: isoDateTimeString.optional(), // Uses the fixed schema
      status: z
        .enum(['scheduled', 'completed', 'cancelled', 'noshow'])
        .optional(),
      notes: z.string().nullable().optional(),
    })
    // Ensure at least one field is provided for update
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update',
    })
    // Ensure 'end' is after 'start' if both are provided
    .refine(
      (data) => {
        if (data.start && data.end) {
          return new Date(data.end) > new Date(data.start);
        }
        return true; // Validation passes if one or none are provided
      },
      {
        message: 'End time must be after start time',
        path: ['end'],
      },
    ),
});

// Export inferred types
export type ListAppointmentsQueryInput = z.infer<
  typeof listAppointmentsSchema
>['query'];
export type CreateAppointmentInput = z.infer<
  typeof createAppointmentSchema
>['body'];
export type UpdateAppointmentInput = z.infer<
  typeof updateAppointmentSchema
>['body'];