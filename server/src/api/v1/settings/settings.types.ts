/**
 * Interface for a single day's opening hours.
 */
export interface IDayHours {
  open: string; // e.g., "09:00"
  close: string; // e.g., "17:00"
  isOpen: boolean; // true if the clinic is open this day
}

/**
 * Interface for the 'openingHours' JSON object.
 * Uses 3-letter day codes for keys (e.g., 'mon', 'tue').
 */
export interface IOpeningHours {
  mon: IDayHours;
  tue: IDayHours;
  wed: IDayHours;
  thu: IDayHours;
  fri: IDayHours;
  sat: IDayHours;
  sun: IDayHours;
}

/**
 * Interface representing the Clinic Settings.
 * Aligns with the 'settings' table, with JSON fields parsed.
 */
export interface IClinicSettings {
  tenantId: string;
  clinicName: string | null;
  currencySymbol: string; // e.g., "$", "€", "₺"
  
  // These fields are stored as JSON strings in SQLite
  openingHours: IOpeningHours | null;
  holidays: string[]; // Array of ISO Date strings (YYYY-MM-DD)
}

/**
 * Interface representing the raw data from the 'settings' table.
 */
export interface ISettingsFromDB {
  id: number;
  tenantId: string;
  clinicName: string | null;
  openingHours: string | null; // JSON string
  holidays: string | null; // JSON string
  currencySymbol: string | null;
}

/**
 * Type for updating the clinic settings.
 * All fields are optional.
 */
export type IUpdateSettingsPayload = Partial<{
  clinicName: string;
  currencySymbol: string;
  openingHours: IOpeningHours;
  holidays: string[]; // A full array of holiday dates
}>;