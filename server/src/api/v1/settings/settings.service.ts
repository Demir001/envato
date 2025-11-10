import { getDb } from '../../../config/database';
import { ApiError } from '../../../middleware/errorHandler';
import { UpdateSettingsInput } from './settings.validation';
import {
  IClinicSettings,
  ISettingsFromDB,
  IOpeningHours,
} from './settings.types';

export class SettingsService {
  /**
   * Helper to create default settings for a tenant if none exist.
   * This is called on the first 'get' or 'update' attempt.
   */
  private static async createDefaultSettings(
    db: any,
    tenantId: string,
    clinicName: string,
  ): Promise<ISettingsFromDB> {
    // 1. Create default opening hours (e.g., Mon-Fri 9-5)
    const defaultDay = (isOpen: boolean) => ({
      open: '09:00',
      close: '17:00',
      isOpen,
    });
    const defaultHours: IOpeningHours = {
      mon: defaultDay(true),
      tue: defaultDay(true),
      wed: defaultDay(true),
      thu: defaultDay(true),
      fri: defaultDay(true),
      sat: defaultDay(false),
      sun: defaultDay(false),
    };

    // 2. Default holidays (empty)
    const defaultHolidays: string[] = [];

    // 3. Insert into DB
    const stmt = db.prepare(
      `INSERT INTO settings (tenantId, clinicName, openingHours, holidays, currencySymbol)
       VALUES (@tenantId, @clinicName, @openingHours, @holidays, @currencySymbol)`,
    );
    try {
      stmt.run({
        tenantId,
        clinicName,
        openingHours: JSON.stringify(defaultHours),
        holidays: JSON.stringify(defaultHolidays),
        currencySymbol: '$',
      });

      // 4. Fetch and return the newly created settings
      const newSettings = db
        .prepare('SELECT * FROM settings WHERE tenantId = ?')
        .get(tenantId);
      return newSettings as ISettingsFromDB;
    } catch (error: any) {
      // This might fail if settings were created by a concurrent request
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        const existing = db
          .prepare('SELECT * FROM settings WHERE tenantId = ?')
          .get(tenantId);
        return existing as ISettingsFromDB;
      }
      throw new ApiError(500, `Failed to create default settings: ${error.message}`);
    }
  }

  /**
   * Helper to parse JSON fields from the DB row.
   */
  private static parseSettings(
    dbSettings: ISettingsFromDB,
  ): IClinicSettings {
    let openingHours: IOpeningHours | null = null;
    let holidays: string[] = [];

    try {
      if (dbSettings.openingHours) {
        openingHours = JSON.parse(dbSettings.openingHours);
      }
    } catch (e) {
      console.error('Failed to parse openingHours JSON');
      openingHours = null; // Use default or null on parse error
    }

    try {
      if (dbSettings.holidays) {
        holidays = JSON.parse(dbSettings.holidays);
        if (!Array.isArray(holidays)) holidays = [];
      }
    } catch (e) {
      console.error('Failed to parse holidays JSON');
      holidays = [];
    }

    return {
      tenantId: dbSettings.tenantId,
      clinicName: dbSettings.clinicName || '',
      currencySymbol: dbSettings.currencySymbol || '$',
      openingHours,
      holidays,
    };
  }

  /**
   * Get the settings for a tenant.
   * Creates default settings if none exist.
   */
  static async get(tenantId: string): Promise<IClinicSettings> {
    const db = getDb();
    let settingsRow = db
      .prepare('SELECT * FROM settings WHERE tenantId = ?')
      .get(tenantId) as ISettingsFromDB | undefined;

    if (!settingsRow) {
      // If no settings, fetch clinic name and create defaults
      const clinic = db
        .prepare('SELECT name FROM clinics WHERE id = ?')
        .get(tenantId) as { name: string } | undefined;
      
      const clinicName = clinic ? clinic.name : 'My Clinic';
      
      settingsRow = await this.createDefaultSettings(db, tenantId, clinicName);
    }

    return this.parseSettings(settingsRow);
  }

  /**
   * Update the settings for a tenant.
   */
  static async update(
    tenantId: string,
    data: UpdateSettingsInput,
  ): Promise<IClinicSettings> {
    const db = getDb();

    // 1. Ensure settings exist (gets current settings)
    const currentSettings = await this.get(tenantId);

    // 2. Prepare data for update (stringify JSON fields)
    const fieldsToUpdate: Record<string, any> = {};

    if (data.clinicName !== undefined) {
      fieldsToUpdate.clinicName = data.clinicName;
    }
    if (data.currencySymbol !== undefined) {
      fieldsToUpdate.currencySymbol = data.currencySymbol;
    }
    if (data.openingHours !== undefined) {
      fieldsToUpdate.openingHours = JSON.stringify(data.openingHours);
    }
    if (data.holidays !== undefined) {
      fieldsToUpdate.holidays = JSON.stringify(data.holidays);
    }

    // 3. Build dynamic SET clause
    const setClause = Object.keys(fieldsToUpdate)
      .map((field) => `${field} = @${field}`)
      .join(', ');
      
    if (setClause.length === 0) {
      // This should be caught by validation, but as a safeguard
      return currentSettings;
    }

    const params = { ...fieldsToUpdate, tenantId };

    try {
      // 4. Update the settings table
      const stmt = db.prepare(
        `UPDATE settings SET ${setClause} WHERE tenantId = @tenantId`,
      );
      stmt.run(params);

      // 5. If clinicName was updated, also update the 'clinics' table
      if (data.clinicName) {
        db.prepare('UPDATE clinics SET name = ? WHERE id = ?').run(
          data.clinicName,
          tenantId,
        );
      }

      // 6. Return the newly updated, parsed settings
      return await this.get(tenantId);
    } catch (error: any) {
      throw new ApiError(500, `Failed to update settings: ${error.message}`);
    }
  }
}