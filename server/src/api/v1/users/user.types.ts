/**
 * Interface representing the User data model as stored in the database.
 * This is the same base interface from 'auth.types.ts' but is
 * redefined here for module cohesion.
 */
export interface IUser {
  id: number;
  tenantId: string;
  name: string;
  email: string;
  password: string; // Hashed
  role: 'admin' | 'doctor' | 'reception';
  specialty: string | null;
  phone: string | null;
  isActive: boolean | number;
  createdAt: string;
}

/**
 * Public-facing user profile, excluding sensitive data.
 * This is what will be returned by the API.
 */
export type IPublicUser = Omit<
  IUser,
  'password' | 'tenantId' | 'isActive' | 'createdAt'
> & {
  // We can redefine types here for clarity if needed
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'doctor' | 'reception';
  specialty: string | null;
  phone: string | null;
  // Add a 'isActive' field that is guaranteed to be a boolean
  isActive: boolean;
};

/**
 * Type for query parameters when listing users.
 */
export interface IListUsersQuery {
  page?: string;
  limit?: string;
  search?: string; // Search by name, email, or specialty
  role?: 'admin' | 'doctor' | 'reception';
  status?: 'active' | 'inactive';
}

/**
 * Interface for the paginated response when listing users.
 */
export interface IPaginatedUsers {
  users: IPublicUser[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}

/**
 * Type for creating a new user (staff member) by an Admin.
 */
export type ICreateUserPayload = {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'doctor' | 'reception';
  specialty?: string | null;
  phone?: string | null;
  isActive?: boolean;
};

/**
 * Type for updating an existing user (staff member) by an Admin.
 * Password update is handled separately.
 */
export type IUpdateUserPayload = Partial<
  Omit<ICreateUserPayload, 'password' | 'email'>
>;

/**
 * Type for changing a user's password (by Admin).
 */
export type IChangePasswordPayload = {
  newPassword: string;
};