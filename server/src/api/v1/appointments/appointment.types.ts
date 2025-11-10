/**
 * Interface representing the Appointment data model as stored in the database.
 * Aligns with the 'appointments' table schema in database.ts.
 */
export interface IAppointment {
  id: number;
  tenantId: string;
  patientId: number;
  doctorId: number;
  receptionistId: number | null; // User ID of who booked it
  title: string | null;
  start: string; // ISO DateTime string (e.g., "2024-12-25T09:00:00")
  end: string; // ISO DateTime string (e.g., "2024-12-25T09:30:00")
  status: 'scheduled' | 'completed' | 'cancelled' | 'noshow';
  notes: string | null;
  createdAt: string; // ISO DateTime string
}

/**
 * Interface for the data expected from FullCalendar (or a simple list).
 * Includes expanded details (patient name, doctor name) for easy display.
 */
export interface IAppointmentDetails extends IAppointment {
  patientName: string;
  doctorName: string;
  patientEmail?: string | null;
  doctorSpecialty?: string | null;
}

/**
 * Type for query parameters when fetching appointments for the calendar.
 * Requires a start and end date range (provided by FullCalendar).
 */
export interface IListAppointmentsQuery {
  start: string; // ISO Date or DateTime string
  end: string; // ISO Date or DateTime string
  doctorId?: string; // Optional: filter by a specific doctor
  patientId?: string; // Optional: filter by a specific patient
  status?: string; // Optional: filter by status
}

/**
 * Type for creating a new appointment.
 * (notes? eklendi)
 */
export type ICreateAppointmentPayload = Omit<
  IAppointment,
  'id' | 'tenantId' | 'receptionistId' | 'status' | 'createdAt'
> & {
  notes?: string | null; // 'optional' olarak düzeltildi
};

/**
 * Type for updating an existing appointment.
 * Used for drag-and-drop (start/end update) or status/notes changes.
 */
export type IUpdateAppointmentPayload = Partial<
  Pick<IAppointment, 'start' | 'end' | 'status' | 'notes' | 'doctorId' | 'patientId'>
>;