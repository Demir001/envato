import { z } from 'zod';
import { registerSchema } from './auth.validation';

/**
 * Interface for the User object as stored in the database.
 * Includes sensitive fields like 'password'.
 */
export interface IUser {
  id: number;
  tenantId: string;
  name: string;
  email: string;
  password: string; // Hashed password
  role: 'admin' | 'doctor' | 'reception';
  specialty: string | null;
  phone: string | null;
  isActive: boolean | number;
  createdAt: string;
}

/**
 * A partial User object representing a safe, public-facing profile.
 * Excludes sensitive data like 'password'.
 */
export type IUserProfile = Omit<
  IUser,
  'password' | 'isActive' | 'createdAt'
>;

/**
 * Type inferred from the Zod registration schema.
 */
export type IRegisterPayload = z.infer<typeof registerSchema>['body'];

/**
 * Interface for the successful login response.
 * Includes the JWT and the public user profile.
 */
export interface ILoginResponse {
  token: string;
  user: Omit<IUserProfile, 'specialty' | 'phone' | 'tenantId'> & {
    tenantId: string; // Ensure tenantId is included
  };
}