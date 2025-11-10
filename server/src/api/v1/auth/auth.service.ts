import { getDb } from '../../../config/database';
import { ApiError } from '../../../middleware/errorHandler';
import { IRegisterPayload, IUser, ILoginResponse } from './auth.types';
import bcrypt from 'bcryptjs';
import generateToken from '../../../utils/generateToken';
import { randomUUID } from 'crypto'; // For new clinic tenantId

export class AuthService {
  /**
   * Registers a new clinic and its first admin user.
   */
  static async register(payload: IRegisterPayload): Promise<Partial<IUser>> {
    const { clinicName, userName, email, password } = payload;
    const db = getDb();

    // --- 1. Check if email is already taken *anywhere* (for simplicity) ---
    // A more complex multi-tenant system might allow same email different tenant.
    const existingUser = db
      .prepare('SELECT id FROM users WHERE email = ?')
      .get(email.toLowerCase());

    if (existingUser) {
      throw new ApiError(409, 'Email address is already in use.');
    }

    // --- 2. Create Clinic (Tenant) and User in a Transaction ---
    const registerTransaction = db.transaction(() => {
      // Create the new clinic (tenant)
      const tenantId = `clinic_${randomUUID()}`;
      const clinicInfo = db
        .prepare('INSERT INTO clinics (id, name) VALUES (?, ?)')
        .run(tenantId, clinicName);

      if (clinicInfo.changes === 0) {
        throw new ApiError(500, 'Failed to create the clinic record.');
      }

      // Hash the password
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(password, salt);

      // Create the admin user for this clinic
      const userInfo = db
        .prepare(
          `INSERT INTO users (tenantId, name, email, password, role) 
           VALUES (?, ?, ?, ?, 'admin')`,
        )
        .run(tenantId, userName, email.toLowerCase(), hashedPassword);

      if (userInfo.changes === 0) {
        throw new ApiError(500, 'Failed to create the user record.');
      }

      // Return the newly created user (excluding password)
      const newUser = db
        .prepare('SELECT id, name, email, role, tenantId FROM users WHERE id = ?')
        .get(userInfo.lastInsertRowid);

      return newUser as Partial<IUser>;
    });

    try {
      const newUser = registerTransaction();
      return newUser;
    } catch (error) {
      console.error('Registration transaction failed:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Registration failed due to a server error.');
    }
  }

  /**
   * Logs in a user.
   */
  static async login(email: string, password: string): Promise<ILoginResponse> {
    const db = getDb();

    const user: IUser = db
      .prepare('SELECT * FROM users WHERE email = ? AND isActive = 1')
      .get(email.toLowerCase()) as IUser;

    if (!user) {
      throw new ApiError(401, 'Invalid email or password.');
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid email or password.');
    }

    // Generate token
    const token = generateToken(user.id, user.email, user.role, user.tenantId);

    // Return user info and token
    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      },
    };
  }

  /**
   * Gets a user's profile.
   */
  static async getProfile(
    userId: number,
    tenantId: string,
  ): Promise<Partial<IUser>> {
    const db = getDb();
    const user = db
      .prepare(
        'SELECT id, name, email, role, tenantId, specialty, phone FROM users WHERE id = ? AND tenantId = ?',
      )
      .get(userId, tenantId);

    if (!user) {
      throw new ApiError(404, 'User profile not found.');
    }

    return user as Partial<IUser>;
  }
}