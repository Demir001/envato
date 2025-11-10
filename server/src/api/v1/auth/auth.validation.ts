import { z } from 'zod';

/**
 * Zod schema for the login request.
 * Validates the request body for the login endpoint.
 */
export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email address'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(1, 'Password cannot be empty'),
  }),
});

/**
 * Zod schema for the registration request.
 * Validates the request body for the register endpoint.
 */
export const registerSchema = z.object({
  body: z.object({
    clinicName: z
      .string({ required_error: 'Clinic name is required' })
      .min(2, 'Clinic name must be at least 2 characters'),
    userName: z
      .string({ required_error: 'User name is required' })
      .min(2, 'User name must be at least 2 characters'),
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email address'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters long'),
    // You could add a password confirmation field here if needed
    // passwordConfirmation: z.string().min(8)
  }),
  // .refine((data) => data.password === data.passwordConfirmation, {
  //   message: "Passwords do not match",
  //   path: ["passwordConfirmation"], // Path of the error
  // }),
});

// Export types inferred from schemas for use in controllers/services
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type RegisterInput = z.infer<typeof registerSchema>['body'];