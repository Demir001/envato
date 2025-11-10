import { useQuery } from '@tanstack/react-query';
import apiClient from './axios-instance';
import { format, subDays } from 'date-fns';

// --- Tipler (Types) ---
// Backend'deki 'dashboard.types.ts' ile eşleşmeli.

// KPI Kartları
export interface IKPICards {
  totalPatients: number;
  totalDoctors: number;
  upcomingAppointments: number;
  todaySales: number;
  pendingInvoices: number;
  lowStockItems: number;
}

// Zaman serisi grafik (Line/Bar)
export interface IChartDataPoint {
  date: string;
  value: number;
  [key: string]: any;
}

// Kategori grafik (Pie/Donut)
export interface ICategoryChartDataPoint {
  name: string;
  value: number;
  color: string;
}

// Son Randevular (Özet)
export interface IRecentAppointment {
  id: number;
  start: string; // ISO DateTime
  status: string;
  patientName: string;
  doctorName: string;
}

// Son Hastalar (Özet)
export interface IRecentPatient {
  id: number;
  name: string;
  email: string | null;
  createdAt: string; // ISO DateTime
}

// Dashboard veri sorgu parametreleri
export interface IDashboardQuery {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

// API'den dönen tüm dashboard verisi
// (Backend: ApiResponse<IDashboardData>)
interface DashboardResponse {
  success: boolean;
  message: string;
  data: {
    kpis: IKPICards;
    salesReport: IChartDataPoint[];
    newPatientsReport: IChartDataPoint[];
    serviceReport: ICategoryChartDataPoint[];
    recentAppointments: IRecentAppointment[];
    recentPatients: IRecentPatient[];
  };
}

// --- API Fonksiyonu ---

/**
 * Dashboard verisini (KPI'lar, grafikler) çeker.
 * @param params - { startDate, endDate }
 * @returns DashboardResponse
 */
const fetchDashboardData = async (
  params: IDashboardQuery,
): Promise<DashboardResponse> => {
  const query = new URLSearchParams(
    params as Record<string, string>,
  ).toString();
  return apiClient.get(`/dashboard?${query}`);
};

// --- React Query Kancası (Hook) ---

// Varsayılan tarih aralığı (son 30 gün)
const defaultEndDate = format(new Date(), 'yyyy-MM-dd');
const defaultStartDate = format(subDays(new Date(), 30), 'yyyy-MM-dd');

/**
 * Dashboard verisini (fetchDashboardData) çekmek için 'useQuery' kancası.
 * @param params - IDashboardQuery (opsiyonel, varsayılan son 30 gün)
 */
export const useGetDashboardData = (
  params: IDashboardQuery = {
    startDate: defaultStartDate,
    endDate: defaultEndDate,
  },
) => {
  return useQuery<DashboardResponse, Error>({
    // Sorgu anahtarı (queryKey):
    // Tarih aralığı (params) değiştikçe sorgu yeniden tetiklenir.
    queryKey: ['dashboard', params],

    // API fonksiyonu
    queryFn: () => fetchDashboardData(params),

    // Dashboard verisi nispeten sık yenilenebilir,
    // ancak KPI'lar (örn. 'bugünkü satışlar') anlık değişebilir.
    // 'refetchInterval' ile periyodik yenileme düşünülebilir.
    staleTime: 1000 * 60 * 5, // 5 dakika
    
    // Pencereye odaklanınca veriyi yenile (KPI'lar için iyi)
    refetchOnWindowFocus: true,
  });
};