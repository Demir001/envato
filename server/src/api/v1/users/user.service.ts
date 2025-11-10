import { getDb } from '../../../config/database';
import { ApiError } from '../../../middleware/errorHandler';
import {
  CreateUserInput,
  ListUsersQueryInput,
  UpdateUserInput,
} from './user.validation';
import { IPaginatedUsers, IPublicUser, IUser } from './user.types';
import bcrypt from 'bcryptjs';

export class UserService {
  /**
   * Helper function to convert a full DB user object to a public-facing profile.
   */
  private static toPublicUser(user: IUser): IPublicUser {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, tenantId, ...publicData } = user;
    return {
      ...publicData,
      isActive: !!user.isActive, // Ensure boolean (0/1 -> false/true)
    };
  }

  /**
   * Get a user by ID, ensuring they belong to the correct tenant.
   * Internal helper function.
   */
  static async getById(
    tenantId: string,
    id: number,
    includePassword = false,
  ): Promise<IUser | IPublicUser> {
    const db = getDb();
    const user: IUser = db
      .prepare('SELECT * FROM users WHERE id = ? AND tenantId = ?')
      .get(id, tenantId) as IUser;

    if (!user) {
      throw new ApiError(404, 'User not found.');
    }
    return includePassword ? user : this.toPublicUser(user);
  }

  /**
   * List and search staff users with pagination.
   */
  static async list(
    tenantId: string,
    query: ListUsersQueryInput,
  ): Promise<IPaginatedUsers> {
    const db = getDb();

    // Destructure and parse query parameters (DÜZELTİLDİ)
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const { search = '', role, status } = query;

    const offset = (page - 1) * limit;

    // --- Build dynamic query ---
    const params: (string | number)[] = [tenantId];
    let whereClause = 'WHERE tenantId = ?';

    if (search) {
      whereClause += ' AND (name LIKE ? OR email LIKE ? OR specialty LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }
    if (role) {
      whereClause += ' AND role = ?';
      params.push(role);
    }
    if (status) {
      whereClause += ' AND isActive = ?';
      params.push(status === 'active' ? 1 : 0);
    }

    // --- Get Total Count ---
    const countResult: { count: number } = db
      .prepare(`SELECT COUNT(*) as count FROM users ${whereClause}`)
      .get(...params) as { count: number };

    const totalItems = countResult.count;
    const totalPages = Math.ceil(totalItems / limit);

    // --- Get Paginated Data ---
    // Exclude password from the selection
    const queryParams = [...params, limit, offset];
    const users: IUser[] = db
      .prepare(
        `SELECT id, name, email, role, specialty, phone, isActive 
         FROM users 
         ${whereClause} 
         ORDER BY name ASC 
         LIMIT ? OFFSET ?`,
      )
      .all(...queryParams) as IUser[];

    return {
      users: users.map(this.toPublicUser),
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        pageSize: limit,
      },
    };
  }

  /**
   * Create a new staff user.
   */
  static async create(
    tenantId: string,
    data: CreateUserInput,
  ): Promise<IPublicUser> {
    const db = getDb();

    // Check if email is already in use for this tenant
    const existing = db
      .prepare('SELECT id FROM users WHERE email = ? AND tenantId = ?')
      .get(data.email.toLowerCase(), tenantId);
    if (existing) {
      throw new ApiError(409, 'A user with this email already exists.');
    }

    // Hash the password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(data.password, salt);

    const {
      name,
      email,
      role,
      specialty = null,
      phone = null,
      isActive = true,
    } = data;

    const stmt = db.prepare(
      `INSERT INTO users (tenantId, name, email, password, role, specialty, phone, isActive)
       VALUES (@tenantId, @name, @email, @password, @role, @specialty, @phone, @isActive)`,
    );

    try {
      const info = stmt.run({
        tenantId,
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role,
        specialty: role === 'doctor' ? specialty : null, // Ensure specialty is null if not doctor
        phone,
        isActive: isActive ? 1 : 0,
      });

      return (await this.getById(
        tenantId,
        info.lastInsertRowid as number,
      )) as IPublicUser;
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new ApiError(409, 'A user with this email already exists.');
      }
      throw new ApiError(500, `Failed to create user: ${error.message}`);
    }
  }

  /**
   * Update an existing staff user's details.
   */
  static async update(
    tenantId: string,
    id: number,
    data: UpdateUserInput,
  ): Promise<IPublicUser> {
    const db = getDb();

    // 1. Verify user exists and get current data
    const existingUser = (await this.getById(tenantId, id)) as IPublicUser;

    // 2. Dynamically build the SET clause
    const fields = Object.keys(data).filter(
      (key) => data[key as keyof UpdateUserInput] !== undefined,
    );
    if (fields.length === 0) {
      throw new ApiError(400, 'No fields provided for update.');
    }

    // If role is being changed to something other than doctor, nullify specialty
    if (data.role && data.role !== 'doctor') {
      data.specialty = null;
      if (!fields.includes('specialty')) {
        fields.push('specialty');
      }
    }
    // If role is not provided but specialty is, ensure user is a doctor
    if (data.specialty && !data.role && existingUser.role !== 'doctor') {
      throw new ApiError(400, 'Cannot add specialty to a non-doctor user.');
    }

    const setClause = fields.map((field) => `${field} = @${field}`).join(', ');
    
    // Create a new object for SQL parameters (DÜZELTİLDİ)
    const sqlParams: any = { ...data, id, tenantId };

    // Convert boolean 'isActive' to number (1 or 0) for SQLite
    if (data.isActive !== undefined) {
      sqlParams.isActive = data.isActive ? 1 : 0;
    }

    try {
      const stmt = db.prepare(
        `UPDATE users SET ${setClause} WHERE id = @id AND tenantId = @tenantId`,
      );
      stmt.run(sqlParams); // Düzeltilmiş parametreleri kullan

      // Return the updated user record
      return (await this.getById(tenantId, id)) as IPublicUser;
    } catch (error: any) {
      throw new ApiError(500, `Failed to update user: ${error.message}`);
    }
  }

  /**
   * Change a user's password.
   */
  static async updatePassword(
    tenantId: string,
    id: number,
    newPassword: string,
  ): Promise<void> {
    const db = getDb();

    // 1. Verify user exists
    await this.getById(tenantId, id);

    // 2. Hash new password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(newPassword, salt);

    // 3. Update password in DB
    try {
      db.prepare('UPDATE users SET password = ? WHERE id = ? AND tenantId = ?').run(
        hashedPassword,
        id,
        tenantId,
      );
    } catch (error: any) {
      throw new ApiError(500, `Failed to update password: ${error.message}`);
    }
  }

  /**
   * Delete a staff user.
   */
  static async delete(tenantId: string, id: number): Promise<{ id: number }> {
    const db = getDb();

    // 1. Verify user exists
    await this.getById(tenantId, id);

    // 2. TODO: Check for dependencies.
    // e.g., Are they a doctor with future appointments?
    // For v1, we assume deletion is allowed.
    // 'ON DELETE SET NULL' in appointments schema will handle foreign key.

    // 3. Perform deletion
    const info = db
      .prepare('DELETE FROM users WHERE id = ? AND tenantId = ?')
      .run(id, tenantId);

    if (info.changes === 0) {
      throw new ApiError(404, 'User not found or already deleted.');
    }

    return { id };
  }
}