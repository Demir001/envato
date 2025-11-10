import { z } from 'zod';

// Zod schemas for patient properties
// Making most fields optional (except name) for flexibility during creation/update
// .nullable() allows 'null' values, .optional() allows 'undefined'

const nameSchema = z
  .string({ required_error: 'Patient name is required' })
  .min(3, 'Name must be at least 3 characters');

const emailSchema = z
  .string()
  .email('Invalid email address')
  .nullable()
  .optional();

const phoneSchema = z
  .string()
  .min(10, 'Phone number must be at least 10 digits')
  .nullable()
  .optional();

const dobSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format')
  .nullable()
  .optional();

const genderSchema = z.enum(['male', 'female', 'other']).nullable().optional();
const addressSchema = z.string().nullable().optional();
const bloodGroupSchema = z.string().nullable().optional();
const notesSchema = z.string().nullable().optional();

/**
 * Zod schema for creating a new patient.
 */
export const createPatientSchema = z.object({
  body: z.object({
    name: nameSchema,
    email: emailSchema,
    phone: phoneSchema,
    dob: dobSchema,
    gender: genderSchema,
    address: addressSchema,
    bloodGroup: bloodGroupSchema,
    notes: notesSchema,
  }),
});

/**
 * Zod schema for updating an existing patient.
 * All fields are optional during update.
 */
export const updatePatientSchema = z.object({
  body: z.object({
    name: nameSchema.optional(),
    email: emailSchema,
    phone: phoneSchema,
    dob: dobSchema,
    gender: genderSchema,
    address: addressSchema,
    bloodGroup: bloodGroupSchema,
    notes: notesSchema,
  }),
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Patient ID must be a number'),
  }),
});

/**
 * Zod schema for validating the patient ID in params.
 */
export const patientIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Patient ID must be a number'),
  }),
});

/**
 * Zod schema for validating list/search query parameters.
 */
export const listPatientsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().default('1'),
    limit: z.string().regex(/^\d+$/).optional().default('10'),
    search: z.string().optional(),
    sortBy: z.enum(['name', 'createdAt', 'id']).optional().default('name'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  }),
});

// Export inferred types
export type CreatePatientInput = z.infer<typeof createPatientSchema>['body'];
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>['body'];
export type ListPatientsQueryInput = z.infer<
  typeof listPatientsSchema
>['query'];