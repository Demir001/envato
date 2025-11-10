/**
 * Interface for the Key Performance Indicator (KPI) cards
 * shown at the top of the dashboard.
 */
export interface IKPICards {
  totalPatients: number;
  totalDoctors: number;
  upcomingAppointments: number; // e.g., in the next 24h or 7d
  todaySales: number; // Total from 'paid' invoices issued today
  pendingInvoices: number; // Count of 'pending' invoices
  lowStockItems: number; // Count of items at or below threshold
}

/**
 * Interface for a single data point in a time-series chart.
 * (e.g., Sales per day, New patients per month)
 */
export interface IChartDataPoint {
  date: string; // e.g., "2024-10-25" or "2024-10"
  value: number;
  [key: string]: any; // For additional properties, like stacked charts
}

/**
 * Interface for a category-based chart (e.g., Pie or Donut chart).
 * (e.g., Appointments by Doctor)
 */
export interface ICategoryChartDataPoint {
  name: string; // The label (e.g., "Dr. Smith", "Cardiology")
  value: number; // The count or amount
  color: string; // A hex color for the chart segment
}

/**
 * Interface for the "Recent Activity" feed.
 */
export type IRecentActivity = {
  id: string; // Unique ID (e.g., `appt-123`, `patient-456`)
  type: 'appointment_created' | 'patient_registered' | 'invoice_paid';
  timestamp: string; // ISO DateTime
  description: string; // e.g., "New appointment for John Doe with Dr. Smith"
  userId?: number | null; // Who performed the action
};

/**
 * Interface for the full dashboard data response.
 */
export interface IDashboardData {
  kpis: IKPICards;
  salesReport: IChartDataPoint[]; // Sales over the selected period
  newPatientsReport: IChartDataPoint[]; // New patients over the period
  serviceReport: ICategoryChartDataPoint[]; // Top services/doctors
  recentAppointments: any[]; // Using 'any' for now, should be IAppointmentDetails
  recentPatients: any[]; // Using 'any' for now, should be IPatient
}

/**
 * Type for query parameters for dashboard data.
 * Allows filtering KPIs and charts by a date range.
 */
export interface IDashboardQuery {
  startDate: string; // ISO Date (YYYY-MM-DD)
  endDate: string; // ISO Date (YYYY-MM-DD)
  // 'period' could be an alternative, e.g., '7d', '30d', 'mtd'
}