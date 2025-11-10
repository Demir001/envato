import { getDb } from '../../../config/database';
import { ApiError } from '../../../middleware/errorHandler';
import {
  IAppointmentDetails,
  IListAppointmentsQuery,
  ICreateAppointmentPayload,
  IUpdateAppointmentPayload,
} from './appointment.types';

export class AppointmentService {
  /**
   * Helper function to verify that patient and doctor exist
   * and belong to the correct tenant.
   */
  private static async verifyEntities(
    db: any,
    tenantId: string,
    patientId: number,
    doctorId: number,
  ) {
    const patient = db
      .prepare('SELECT id FROM patients WHERE id = ? AND tenantId = ?')
      .get(patientId, tenantId);
    if (!patient) {
      throw new ApiError(
        404,
        'Patient not found or does not belong to this clinic.',
      );
    }

    const doctor = db
      .prepare(
        "SELECT id FROM users WHERE id = ? AND tenantId = ? AND role = 'doctor'",
      )
      .get(doctorId, tenantId);
    if (!doctor) {
      throw new ApiError(
        404,
        'Doctor not found or does not belong to this clinic.',
      );
    }
  }

  /**
   * Fetches the full details for a single appointment.
   * Internal helper used by create, getById, and update.
   */
  private static async fetchAppointmentDetails(
    db: any,
    tenantId: string,
    appointmentId: number,
  ): Promise<IAppointmentDetails> {
    // LEFT JOIN is used so that if a patient or doctor is deleted,
    // the appointment record itself is still visible.
    const sql = `
      SELECT 
          a.*,
          p.name as patientName,
          p.email as patientEmail,
          u.name as doctorName,
          u.specialty as doctorSpecialty
      FROM appointments a
      LEFT JOIN patients p ON a.patientId = p.id
      LEFT JOIN users u ON a.doctorId = u.id
      WHERE a.id = ? AND a.tenantId = ?
    `;

    const appointment = db
      .prepare(sql)
      .get(appointmentId, tenantId) as IAppointmentDetails;
    if (!appointment) {
      throw new ApiError(404, 'Appointment not found.');
    }
    return appointment;
  }

  /**
   * List appointments for the calendar view.
   * Fetches all appointments that *overlap* with the given date range.
   */
  static async list(
    tenantId: string,
    query: IListAppointmentsQuery,
  ): Promise<IAppointmentDetails[]> {
    const db = getDb();
    const { start, end, doctorId, patientId, status } = query;

    // --- Build dynamic query ---
    // This logic finds appointments that overlap the [start, end) range.
    // (appt.start < query.end) AND (appt.end > query.start)
    const params: (string | number)[] = [tenantId, end, start];
    let whereClause = `WHERE a.tenantId = ? AND a.start < ? AND a.end > ?`;

    if (doctorId) {
      whereClause += ' AND a.doctorId = ?';
      params.push(doctorId);
    }
    if (patientId) {
      whereClause += ' AND a.patientId = ?';
      params.push(patientId);
    }
    if (status) {
      whereClause += ' AND a.status = ?';
      params.push(status);
    }

    const sql = `
      SELECT 
          a.*,
          p.name as patientName,
          u.name as doctorName,
          u.specialty as doctorSpecialty
      FROM appointments a
      LEFT JOIN patients p ON a.patientId = p.id
      LEFT JOIN users u ON a.doctorId = u.id
      ${whereClause}
      ORDER BY a.start ASC
    `;

    try {
      const appointments = db.prepare(sql).all(...params) as IAppointmentDetails[];
      return appointments;
    } catch (error: any) {
      throw new ApiError(500, `Failed to fetch appointments: ${error.message}`);
    }
  }

  /**
   * Create a new appointment.
   */
  static async create(
    tenantId: string,
    receptionistId: number,
    data: ICreateAppointmentPayload,
  ): Promise<IAppointmentDetails> {
    const db = getDb();
    const { patientId, doctorId, start, end, notes } = data;
    
    // Use an optional title, or default to "Randevu"
    const title = data.title || 'Randevu';

    // 1. Verify patient and doctor exist and belong to this tenant
    await this.verifyEntities(db, tenantId, patientId, doctorId);
    
    // TODO: Add conflict detection (check if doctor is busy) - (Skipped for v1)

    // 2. Insert the appointment
    const stmt = db.prepare(
      `INSERT INTO appointments (tenantId, patientId, doctorId, receptionistId, start, end, notes, title)
       VALUES (@tenantId, @patientId, @doctorId, @receptionistId, @start, @end, @notes, @title)`,
    );

    try {
      const info = stmt.run({
        tenantId,
        patientId,
        doctorId,
        receptionistId,
        start,
        end,
        notes,
        title,
      });

      // 3. Return the full details of the new appointment
      return await this.fetchAppointmentDetails(
        db,
        tenantId,
        info.lastInsertRowid as number,
      );
    } catch (error: any) {
      throw new ApiError(500, `Failed to create appointment: ${error.message}`);
    }
  }

  /**
   * Get a single appointment by ID with full details.
   */
  static async getById(
    tenantId: string,
    id: number,
  ): Promise<IAppointmentDetails> {
    const db = getDb();
    return await this.fetchAppointmentDetails(db, tenantId, id);
  }

  /**
   * Update an existing appointment (drag-drop, status change, etc.)
   */
  static async update(
    tenantId: string,
    id: number,
    data: IUpdateAppointmentPayload,
  ): Promise<IAppointmentDetails> {
    const db = getDb();

    // 1. Verify the appointment exists
    await this.fetchAppointmentDetails(db, tenantId, id);

    // 2. If patientId or doctorId are being changed, verify them
    if (data.patientId) {
      const patient = db
        .prepare('SELECT id FROM patients WHERE id = ? AND tenantId = ?')
        .get(data.patientId, tenantId);
      if (!patient) throw new ApiError(404, 'New patient not found.');
    }
    if (data.doctorId) {
      const doctor = db
        .prepare(
          "SELECT id FROM users WHERE id = ? AND tenantId = ? AND role = 'doctor'",
        )
        .get(data.doctorId, tenantId);
      if (!doctor) throw new ApiError(404, 'New doctor not found.');
    }

    // 3. Build dynamic update query
    const fields = Object.keys(data).filter(
      (key) => data[key as keyof IUpdateAppointmentPayload] !== undefined,
    );
    if (fields.length === 0) {
      throw new ApiError(400, 'No fields provided for update.');
    }

    const setClause = fields.map((field) => `${field} = @${field}`).join(', ');
    const params = { ...data, id, tenantId };

    try {
      const stmt = db.prepare(
        `UPDATE appointments SET ${setClause} WHERE id = @id AND tenantId = @tenantId`,
      );
      stmt.run(params);

      // 4. Return the updated full details
      return await this.fetchAppointmentDetails(db, tenantId, id);
    } catch (error: any) {
      throw new ApiError(500, `Failed to update appointment: ${error.message}`);
    }
  }

  /**
   * Delete an appointment.
   */
  static async delete(tenantId: string, id: number): Promise<{ id: number }> {
    const db = getDb();

    // 1. Verify it exists (this also handles tenant isolation)
    await this.fetchAppointmentDetails(db, tenantId, id);

    // 2. Perform the deletion
    const info = db
      .prepare('DELETE FROM appointments WHERE id = ? AND tenantId = ?')
      .run(id, tenantId);

    if (info.changes === 0) {
      // Should be caught by fetchAppointmentDetails, but as a safeguard
      throw new ApiError(404, 'Appointment not found or already deleted.');
    }

    return { id };
  }
}