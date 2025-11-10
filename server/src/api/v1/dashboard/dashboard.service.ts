import { getDb } from '../../../config/database';
import { ApiError } from '../../../middleware/errorHandler';
import { DashboardQueryInput } from './dashboard.validation';
import { IDashboardData, IKPICards, IChartDataPoint } from './dashboard.types';
import { startOfDay, endOfDay, addDays, parseISO } from 'date-fns';

type UserRole = 'admin' | 'doctor' | 'reception';

export class DashboardService {
  /**
   * Get aggregated dashboard data (KPIs, charts, recent activity).
   * Optionally filters data based on the user's role.
   */
  static async getAggregatedData(
    tenantId: string,
    query: DashboardQueryInput,
    userRole: UserRole,
    userId: number, // The ID of the logged-in user
  ): Promise<IDashboardData> {
    const db = getDb();
    const { startDate, endDate } = query;

    // We must use 'endOfDay' for the end date to include all of an end date
    // e.g., query for "2024-10-30" to "2024-10-30"
    // 'endDate' will be "2024-10-30T23:59:59.999Z"
    const rangeEndDate = endOfDay(parseISO(endDate)).toISOString();
    const rangeStartDate = startOfDay(parseISO(startDate)).toISOString();

    // --- 1. Fetch KPIs ---
    // These are run in parallel for performance
    const [
      kpis,
      salesReport,
      newPatientsReport,
      serviceReport,
      recentAppointments,
      recentPatients,
    ] = await Promise.all([
      this.getKpiData(db, tenantId, userRole, userId),
      this.getSalesReport(db, tenantId, rangeStartDate, rangeEndDate),
      this.getNewPatientsReport(db, tenantId, rangeStartDate, rangeEndDate),
      this.getServiceReport(db, tenantId, rangeStartDate, rangeEndDate),
      this.getRecentAppointments(db, tenantId),
      this.getRecentPatients(db, tenantId),
    ]);

    return {
      kpis,
      salesReport,
      newPatientsReport,
      serviceReport,
      recentAppointments,
      recentPatients,
    };
  }

  /**
   * Fetches all KPI card data.
   */
  private static async getKpiData(
    db: any,
    tenantId: string,
    userRole: UserRole,
    userId: number,
  ): Promise<IKPICards> {
    const today = new Date();
    const todayStart = startOfDay(today).toISOString();
    const todayEnd = endOfDay(today).toISOString();
    const next7DaysEnd = endOfDay(addDays(today, 7)).toISOString();

    // Base query for all KPIs
    const kpiSql = `
      SELECT
        (SELECT COUNT(id) FROM patients WHERE tenantId = @tenantId) as totalPatients,
        (SELECT COUNT(id) FROM users WHERE tenantId = @tenantId AND role = 'doctor') as totalDoctors,
        (SELECT COUNT(id) FROM invoices WHERE tenantId = @tenantId AND status = 'pending') as pendingInvoices,
        (SELECT COUNT(id) FROM inventory_items WHERE tenantId = @tenantId AND quantity <= lowStockThreshold) as lowStockItems,
        (SELECT SUM(totalAmount) FROM invoices WHERE tenantId = @tenantId AND status = 'paid' AND issueDate >= @todayStart AND issueDate <= @todayEnd) as todaySales
    `;

    // Dynamic query for upcoming appointments
    let upcomingApptSql: string;
    const upcomingApptParams: any = {
      tenantId: tenantId,
      now: today.toISOString(),
      next7Days: next7DaysEnd,
    };

    if (userRole === 'doctor') {
      // Doctor only sees their own upcoming appointments
      upcomingApptSql = `
        SELECT COUNT(id) as count FROM appointments 
        WHERE tenantId = @tenantId AND doctorId = @userId 
          AND start >= @now AND start <= @next7Days AND status = 'scheduled'
      `;
      upcomingApptParams.userId = userId;
    } else {
      // Admin/Reception see all
      upcomingApptSql = `
        SELECT COUNT(id) as count FROM appointments 
        WHERE tenantId = @tenantId 
          AND start >= @now AND start <= @next7Days AND status = 'scheduled'
      `;
    }

    try {
      const baseKpis: any = db
        .prepare(kpiSql)
        .get({ tenantId, todayStart, todayEnd });
      const upcomingAppt: any = db
        .prepare(upcomingApptSql)
        .get(upcomingApptParams);

      return {
        totalPatients: baseKpis.totalPatients || 0,
        totalDoctors: baseKpis.totalDoctors || 0,
        pendingInvoices: baseKpis.pendingInvoices || 0,
        lowStockItems: baseKpis.lowStockItems || 0,
        todaySales: baseKpis.todaySales || 0,
        upcomingAppointments: upcomingAppt.count || 0,
      };
    } catch (error: any) {
      console.error('Failed to fetch KPI data:', error);
      throw new ApiError(500, `Failed to fetch KPIs: ${error.message}`);
    }
  }

  /**
   * Fetches sales data for the date range, grouped by day.
   */
  private static async getSalesReport(
    db: any,
    tenantId: string,
    startDate: string,
    endDate: string,
  ): Promise<IChartDataPoint[]> {
    const sql = `
      SELECT 
        DATE(issueDate) as date,
        SUM(totalAmount) as value
      FROM invoices
      WHERE tenantId = ? AND status = 'paid'
        AND issueDate >= ? AND issueDate <= ?
      GROUP BY DATE(issueDate)
      ORDER BY date ASC
    `;
    try {
      return db.prepare(sql).all(tenantId, startDate, endDate) as IChartDataPoint[];
    } catch (error: any) {
      throw new ApiError(500, `Failed to fetch sales report: ${error.message}`);
    }
  }

  /**
   * Fetches new patient registrations for the date range, grouped by day.
   */
  private static async getNewPatientsReport(
    db: any,
    tenantId: string,
    startDate: string,
    endDate: string,
  ): Promise<IChartDataPoint[]> {
    const sql = `
      SELECT 
        DATE(createdAt) as date,
        COUNT(id) as value
      FROM patients
      WHERE tenantId = ? 
        AND createdAt >= ? AND createdAt <= ?
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `;
    try {
      return db.prepare(sql).all(tenantId, startDate, endDate) as IChartDataPoint[];
    } catch (error: any) {
      throw new ApiError(500, `Failed to fetch new patients report: ${error.message}`);
    }
  }

  /**
   * Fetches appointment count by doctor for the date range.
   */
  private static async getServiceReport(
    db: any,
    tenantId: string,
    startDate: string,
    endDate: string,
  ): Promise<any[]> {
    const sql = `
      SELECT 
        u.name as name,
        COUNT(a.id) as value
      FROM appointments a
      JOIN users u ON a.doctorId = u.id
      WHERE a.tenantId = ?
        AND a.start >= ? AND a.start <= ?
        AND a.status = 'completed'
      GROUP BY u.name
      ORDER BY value DESC
      LIMIT 5 
    `;
    try {
      // TODO: Assign random colors or have colors in the DB
      const results = db.prepare(sql).all(tenantId, startDate, endDate) as any[];
      const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];
      return results.map((r, i) => ({ ...r, color: colors[i % colors.length] }));
    } catch (error: any) {
      throw new ApiError(500, `Failed to fetch service report: ${error.message}`);
    }
  }

  /**
   * Gets the 5 most recent appointments.
   */
  private static async getRecentAppointments(
    db: any,
    tenantId: string,
  ): Promise<any[]> {
    const sql = `
      SELECT 
        a.id, a.start, a.status,
        p.name as patientName,
        u.name as doctorName
      FROM appointments a
      LEFT JOIN patients p ON a.patientId = p.id
      LEFT JOIN users u ON a.doctorId = u.id
      WHERE a.tenantId = ?
      ORDER BY a.start DESC
      LIMIT 5
    `;
    return db.prepare(sql).all(tenantId);
  }

  /**
   * Gets the 5 most recently registered patients.
   */
  private static async getRecentPatients(
    db: any,
    tenantId: string,
  ): Promise<any[]> {
    const sql = `
      SELECT id, name, email, phone, createdAt
      FROM patients
      WHERE tenantId = ?
      ORDER BY createdAt DESC
      LIMIT 5
    `;
    return db.prepare(sql).all(tenantId);
  }
}