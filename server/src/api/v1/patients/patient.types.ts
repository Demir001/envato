/**
 * Interface representing the Patient data model as stored in the database.
 * Aligns with the 'patients' table schema in database.ts.
 */
export interface IPatient {
  id: number;
  tenantId: string;
  name: string;
  email: string | null;
  phone: string | null;
  dob: string | null; // ISO Date string (e.g., "1990-05-15")
  gender: 'male' | 'female' | 'other' | null;
  address: string | null;
  bloodGroup: string | null; // e.g., "A+", "O-", "AB+"
  notes: string | null;
  createdAt: string; // ISO DateTime string
}

/**
 * Type for query parameters when listing patients.
 * Note: These come from req.query and will be strings.
 * Validation (in patient.validation.ts) will parse them.
 */
export interface IListPatientsQuery {
  page?: string;
  limit?: string;
  search?: string; // Search by name, email, or phone
  sortBy?: 'name' | 'createdAt' | 'id';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Interface for the paginated response when listing patients.
 */
export interface IPaginatedPatients {
  patients: IPatient[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}