import { z } from 'zod';

// Base role enum
const roleSchema = z.enum(['admin', 'doctor', 'reception']);

/**
 * Zod schema for validating the user ID in params.
 */
export const userIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'User ID must be a number'),
  }),
});

/**
 * Zod schema for validating list/search query parameters for users.
 */
export const listUsersSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().default('1'),
    limit: z.string().regex(/^\d+$/).optional().default('10'),
    search: z.string().optional(),
    role: roleSchema.optional(),
    status: z.enum(['active', 'inactive']).optional(),
  }),
});

/**
 * Zod schema for creating a new user (by an Admin).
 */
export const createUserSchema = z.object({
  body: z
    .object({
      name: z.string().min(2, 'Name is required'),
      email: z.string().email('Invalid email address'),
      password: z.string().min(8, 'Password must be at least 8 characters'),
      role: roleSchema,
      specialty: z.string().nullable().optional(),
      phone: z.string().min(10, 'Invalid phone number').nullable().optional(),
      isActive: z.boolean().optional().default(true),
    })
    .refine(
      (data) => {
        // If role is 'doctor', specialty is required
        if (data.role === 'doctor' && !data.specialty) {
          return false;
        }
        return true;
      },
      {
        message: 'Specialty is required for the doctor role',
        path: ['specialty'],
      },
    )
    .refine(
      (data) => {
        // If role is not 'doctor', specialty must be null
        if (data.role !== 'doctor' && data.specialty) {
          data.specialty = null;
        }
        return true;
      },
      {},
    ),
});

/**
 * Zod schema for updating an existing user (by an Admin).
 * Email and password are not allowed in this update.
 */
export const updateUserSchema = z.object({
  params: userIdSchema.shape.params,
  body: z
    .object({
      name: z.string().min(2, 'Name is required').optional(),
      role: roleSchema.optional(),
      specialty: z.string().nullable().optional(),
      phone: z.string().min(10, 'Invalid phone number').nullable().optional(),
      isActive: z.boolean().optional(),
    })
    .refine(
      (data) => {
        // If role is explicitly set to 'doctor', specialty must be provided (or already exist, hard to check here)
        // If role is set to something *other* than 'doctor', specialty should be nulled.
        if (data.role && data.role !== 'doctor') {
          data.specialty = null;
        }
        return true;
      },
      {},
    ),
});

/**
 * Zod schema for changing a user's password (by an Admin).
 */
export const changePasswordSchema = z.object({
  params: userIdSchema.shape.params,
  body: z.object({
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  }),
});

// Export inferred types
export type ListUsersQueryInput = z.infer<typeof listUsersSchema>['query'];
export type CreateUserInput = z.infer<typeof createUserSchema>['body'];
export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>['body'];