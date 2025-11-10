import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './axios-instance';
import { toast } from 'sonner';

// --- Tipler (Types) ---
// Backend'deki 'appointment.types.ts' ile eşleşmeli.

// Randevu (Appointment) nesnesinin tam arayüzü
export interface IAppointment {
  id: number;
  tenantId: string;
  patientId: number;
  doctorId: number;
  receptionistId: number | null;
  title: string | null;
  start: string; // ISO DateTime
  end: string; // ISO DateTime
  status: 'scheduled' | 'completed' | 'cancelled' | 'noshow';
  notes: string | null;
  createdAt: string; // ISO DateTime
}

// FullCalendar'a gönderilecek genişletilmiş randevu tipi
// (Backend: IAppointmentDetails)
export interface IAppointmentDetails extends IAppointment {
  patientName: string;
  doctorName: string;
  patientEmail?: string | null;
  doctorSpecialty?: string | null;
}

// Randevu listesi için sorgu parametreleri (FullCalendar'dan gelir)
export interface IAppointmentListParams {
  start: string; // ISO Date or DateTime
  end: string; // ISO Date or DateTime
  doctorId?: string;
}

// API'den dönen randevu listesi yanıtı
// (Backend: ApiResponse<IAppointmentDetails[]>)
interface AppointmentsResponse {
  success: boolean;
  message: string;
  data: IAppointmentDetails[];
}

// Tek randevu yanıtı
// (Backend: ApiResponse<IAppointmentDetails>)
interface AppointmentResponse {
  success: boolean;
  message: string;
  data: IAppointmentDetails;
}

// Randevu oluşturma (Create) payload'u
export type CreateAppointmentInput = {
  patientId: number;
  doctorId: number;
  start: string; // ISO DateTime
  end: string; // ISO DateTime
  title?: string | null;
  notes?: string | null;
};

// Randevu güncelleme (Update) payload'u
// (Drag-drop veya durum değişikliği)
export type UpdateAppointmentInput = Partial<{
  patientId: number;
  doctorId: number;
  start: string; // ISO DateTime
  end: string; // ISO DateTime
  status: 'scheduled' | 'completed' | 'cancelled' | 'noshow';
  notes: string | null;
}>;

// --- API Fonksiyonları ---

/**
 * Randevuları listeler (FullCalendar için).
 * @param params - { start, end, doctorId }
 * @returns AppointmentsResponse
 */
const fetchAppointments = async (
  params: IAppointmentListParams,
): Promise<AppointmentsResponse> => {
  const query = new URLSearchParams(
    params as Record<string, string>,
  ).toString();
  return apiClient.get(`/appointments?${query}`);
};

/**
 * Yeni bir randevu oluşturur.
 * @param apptData - CreateAppointmentInput
 * @returns AppointmentResponse (yeni oluşturulan randevu)
 */
const createAppointment = async (
  apptData: CreateAppointmentInput,
): Promise<AppointmentResponse> => {
  return apiClient.post('/appointments', apptData);
};

/**
 * Mevcut bir randevuyu günceller (drag-drop, not, durum).
 * @param id - Güncellenecek randevu ID'si
 * @param apptData - UpdateAppointmentInput
 * @returns AppointmentResponse (güncellenen randevu)
 */
const updateAppointment = async ({
  id,
  apptData,
}: {
  id: number;
  apptData: UpdateAppointmentInput;
}): Promise<AppointmentResponse> => {
  return apiClient.put(`/appointments/${id}`, apptData);
};

/**
 * Bir randevuyu siler (iptal eder).
 * @param id - Silinecek randevu ID'si
 */
const deleteAppointment = async (id: number) => {
  return apiClient.delete(`/appointments/${id}`);
};

// --- React Query Kancaları (Hooks) ---

/**
 * Randevuları listelemek (fetchAppointments) için 'useQuery' kancası.
 * @param params - IAppointmentListParams (FullCalendar'dan gelir)
 */
export const useGetAppointments = (params: IAppointmentListParams) => {
  return useQuery<AppointmentsResponse, Error>({
    // Sorgu anahtarı (queryKey):
    // 'start', 'end' ve 'doctorId' değiştikçe yeniden tetiklenir.
    queryKey: ['appointments', params.start, params.end, params.doctorId],

    // API fonksiyonu
    queryFn: () => fetchAppointments(params),

    staleTime: 1000 * 60 * 1, // 1 dakika (Takvim verisi değişebilir)
    
    // 'enabled' seçeneği:
    // Sadece 'start' ve 'end' tarihleri mevcutsa çalışır.
    enabled: !!(params.start && params.end),
    
    // FullCalendar'a 'data.data' (yani IAppointmentDetails[] dizisi)
    // olarak döndürmek için 'select' kullanabiliriz.
    select: (response) => response.data,
  });
};

/**
 * Yeni randevu oluşturmak (createAppointment) için 'useMutation' kancası.
 */
export const useCreateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAppointment,
    onSuccess: (response) => {
      toast.success(response.message || 'Randevu başarıyla oluşturuldu.');

      // Başarılı oluşturma sonrası:
      // 'appointments' anahtarıyla başlayan *tüm* sorguları (takvim)
      // geçersiz kıl (invalidate).
      // Bu, FullCalendar'ın yeniden veri çekmesini (refetch) tetikler.
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
    onError: (error: any) => {
      // Axios interceptor'ı hatayı zaten gösterdi.
      // Örn: Randevu çakışması (conflict) hatası (409)
      console.error('Create appointment error:', error);
    },
  });
};

/**
 * Randevuyu güncellemek (updateAppointment) için 'useMutation' kancası.
 * (Drag-drop veya modal'dan düzenleme)
 */
export const useUpdateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAppointment,
    onSuccess: (response, variables) => {
      toast.success(response.message || 'Randevu başarıyla güncellendi.');

      // 1. Tüm 'appointments' listelerini geçersiz kıl (yeniden çekilsin).
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      
      // 2. (Opsiyonel) Dashboard'daki "Yaklaşan Randevular"
      // gibi diğer sorguları da geçersiz kıl.
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error: any) => {
      toast.error('Randevu güncellenemedi. Lütfen takvimi yenileyin.');
      // Güncelleme (örn. drag-drop) başarısız olursa,
      // takvimi eski haline döndürmek için listeyi yenile
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    }
  });
};

/**
 * Randevuyu silmek (deleteAppointment) için 'useMutation' kancası.
 */
export const useDeleteAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAppointment,
    onSuccess: (response: any) => {
      toast.success(response.message || 'Randevu başarıyla iptal edildi.');

      // Başarılı silme sonrası:
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};