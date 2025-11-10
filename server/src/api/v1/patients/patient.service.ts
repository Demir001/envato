import { getDb } from '../../../config/database';
import { ApiError } from '../../../middleware/errorHandler';
import {
  CreatePatientInput,
  ListPatientsQueryInput,
  UpdatePatientInput,
} from './patient.validation';
import {
  IPatient,
  IPaginatedPatients,
} from './patient.types';

export class PatientService {
  /**
   * List and search patients with pagination.
   * Ensures data is isolated by tenantId.
   */
  static async list(
    tenantId: string,
    query: ListPatientsQueryInput,
  ): Promise<IPaginatedPatients> {
    const db = getDb();

    // Destructure and parse query parameters (DÜZELTİLDİ)
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const { search = '', sortBy = 'name', sortOrder = 'asc' } = query;

    const offset = (page - 1) * limit;

    // --- Build dynamic query ---
    const params: (string | number)[] = [tenantId];
    let whereClause = 'WHERE tenantId = ?';
    
    if (search) {
      // Search across multiple fields
      whereClause += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }
    
    // --- Get Total Count ---
    const countResult: { count: number } = db
      .prepare(`SELECT COUNT(*) as count FROM patients ${whereClause}`)
      .get(...params) as { count: number };
      
    const totalItems = countResult.count;
    const totalPages = Math.ceil(totalItems / limit);

    // --- Get Paginated Data ---
    // Ensure sortBy is a safe column name
    const allowedSortBy = ['name', 'createdAt', 'id'];
    const safeSortBy = allowedSortBy.includes(sortBy) ? sortBy : 'name';
    const safeSortOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const queryParams = [...params, limit, offset];
    const patients: IPatient[] = db
      .prepare(
        `SELECT * FROM patients 
         ${whereClause} 
         ORDER BY ${safeSortBy} ${safeSortOrder} 
         LIMIT ? OFFSET ?`,
      )
      .all(...queryParams) as IPatient[];

    return {
      patients,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        pageSize: limit,
      },
    };
  }

  /**
   * Create a new patient.
   */
  static async create(
    tenantId: string,
    data: CreatePatientInput,
  ): Promise<IPatient> {
    const db = getDb();
    
    // Check for duplicate email within the same tenant
    if (data.email) {
      const existing = db.prepare('SELECT id FROM patients WHERE email = ? AND tenantId = ?')
                         .get(data.email, tenantId);
      if (existing) {
        throw new ApiError(409, 'A patient with this email already exists in your clinic.');
      }
    }

    const {
      name,
      email = null,
      phone = null,
      dob = null,
      gender = null,
      address = null,
      bloodGroup = null,
      notes = null,
    } = data;

    const stmt = db.prepare(
      `INSERT INTO patients (tenantId, name, email, phone, dob, gender, address, bloodGroup, notes)
       VALUES (@tenantId, @name, @email, @phone, @dob, @gender, @address, @bloodGroup, @notes)`,
    );

    try {
      const info = stmt.run({
        tenantId,
        name,
        email,
        phone,
        dob,
        gender,
        address,
        bloodGroup,
        notes,
      });

      // Fetch and return the newly created patient
      const newPatient = db
        .prepare('SELECT * FROM patients WHERE id = ?')
        .get(info.lastInsertRowid);
        
      return newPatient as IPatient;
    } catch (error: any) {
      // Handle potential UNIQUE constraint errors (e.g., if we added one on phone)
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
         throw new ApiError(409, 'A patient with these details already exists.');
      }
      throw new ApiError(500, `Failed to create patient: ${error.message}`);
    }
  }

  /**
   * Get a single patient by ID.
   * Ensures the patient belongs to the correct tenant.
   */
  static async getById(tenantId: string, id: number): Promise<IPatient> {
    const db = getDb();
    const patient: IPatient = db
      .prepare('SELECT * FROM patients WHERE id = ? AND tenantId = ?')
      .get(id, tenantId) as IPatient;

    if (!patient) {
      throw new ApiError(404, 'Patient not found.');
    }
    return patient;
  }

  /**
   * Update an existing patient.
   */
  static async update(
    tenantId: string,
    id: number,
    data: UpdatePatientInput,
  ): Promise<IPatient> {
    const db = getDb();

    // First, verify the patient exists and belongs to this tenant
    const existing = await this.getById(tenantId, id);

    // Dynamically build the SET clause based on provided data
    const fields = Object.keys(data).filter(key => data[key as keyof UpdatePatientInput] !== undefined);
    if (fields.length === 0) {
      // No fields to update, just return the existing data
      return existing;
    }

    const setClause = fields.map((field) => `${field} = @${field}`).join(', ');
    const params = { ...data, id, tenantId };

    try {
      const stmt = db.prepare(
        `UPDATE patients SET ${setClause} WHERE id = @id AND tenantId = @tenantId`,
      );
      stmt.run(params);

      // Return the updated patient record
      return await this.getById(tenantId, id);
    } catch (error: any) {
       if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
         throw new ApiError(409, 'Update failed: A patient with this email already exists.');
       }
      throw new ApiError(500, `Failed to update patient: ${error.message}`);
    }
  }

  /**
   * Delete a patient.
   */
  static async delete(tenantId: string, id: number): Promise<{ id: number }> {
    const db = getDb();
    
    // Verify patient exists and belongs to the tenant
    await this.getById(tenantId, id);

    // Note: 'ON DELETE CASCADE' in the schema should handle related appointments,
    // but invoices might need manual handling if they shouldn't be deleted.
    // For this project, we assume cascade delete is acceptable.
    
    const info = db
      .prepare('DELETE FROM patients WHERE id = ? AND tenantId = ?')
      .run(id, tenantId);

    if (info.changes === 0) {
      // This case should be caught by getById, but as a safeguard:
      throw new ApiError(404, 'Patient not found or already deleted.');
    }
    
    return { id };
  }
}