import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './axios-instance';
import { toast } from 'sonner';

// --- Tipler (Types) ---
// Backend'deki 'patient.types.ts' ve 'patient.validation.ts' ile eşleşmeli.

// Hasta (Patient) nesnesinin tam arayüzü
export interface IPatient {
  id: number;
  tenantId: string;
  name: string;
  email: string | null;
  phone: string | null;
  dob: string | null; // YYYY-MM-DD
  gender: 'male' | 'female' | 'other' | null;
  address: string | null;
  bloodGroup: string | null;
  notes: string | null;
  createdAt: string; // ISO DateTime
}

// Hasta listesi sorgu parametreleri (pagination, search)
export interface IPatientListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'name' | 'createdAt' | 'id';
  sortOrder?: 'asc' | 'desc';
}

// API'den dönen paginated hasta listesi yanıtı
// (Backend: ApiResponse<IPaginatedPatients>)
interface PaginatedPatientsResponse {
  success: boolean;
  message: string;
  data: {
    patients: IPatient[];
    pagination: {
      totalItems: number;
      totalPages: number;
      currentPage: number;
      pageSize: number;
    };
  };
}

// Tek bir hasta yanıtı
// (Backend: ApiResponse<IPatient>)
interface PatientResponse {
  success: boolean;
  message: string;
  data: IPatient;
}

// Yeni hasta oluşturma (Create) veya güncelleme (Update) için payload
// 'id', 'tenantId', 'createdAt' hariç
export type PatientInput = Omit<
  IPatient,
  'id' | 'tenantId' | 'createdAt'
>;

// --- API Fonksiyonları ---

/**
 * Hastaları listeler (paginated, searchable).
 * @param params - { page, limit, search }
 * @returns PaginatedPatientsResponse
 */
const fetchPatients = async (
  params: IPatientListParams,
): Promise<PaginatedPatientsResponse> => {
  // 'params' nesnesini query string'e dönüştür (örn: ?page=1&limit=10)
  const query = new URLSearchParams(
    params as Record<string, string>,
  ).toString();
  return apiClient.get(`/patients?${query}`);
};

/**
 * ID ile tek bir hasta çeker.
 * @param id - Hasta ID'si
 * @returns PatientResponse
 */
const fetchPatientById = async (id: number): Promise<PatientResponse> => {
  return apiClient.get(`/patients/${id}`);
};

/**
 * Yeni bir hasta oluşturur.
 * @param patientData - Yeni hasta bilgileri (PatientInput)
 * @returns PatientResponse (yeni oluşturulan hasta)
 */
const createPatient = async (
  patientData: Partial<PatientInput>,
): Promise<PatientResponse> => {
  return apiClient.post('/patients', patientData);
};

/**
 * Mevcut bir hastayı günceller.
 * @param id - Güncellenecek hasta ID'si
 * @param patientData - Güncellenmiş hasta bilgileri (Partial<PatientInput>)
 * @returns PatientResponse (güncellenen hasta)
 */
const updatePatient = async ({
  id,
  patientData,
}: {
  id: number;
  patientData: Partial<PatientInput>;
}): Promise<PatientResponse> => {
  return apiClient.put(`/patients/${id}`, patientData);
};

/**
 * Bir hastayı siler.
 * @param id - Silinecek hasta ID'si
 * @returns Başarı yanıtı (örn: { success: true, message: "...", data: { id } })
 */
const deletePatient = async (id: number) => {
  return apiClient.delete(`/patients/${id}`);
};

// --- React Query Kancaları (Hooks) ---

/**
 * Hastaları listelemek (fetchPatients) için 'useQuery' kancası.
 * @param params - IPatientListParams (state'den alınır)
 */
export const useGetPatients = (params: IPatientListParams) => {
  return useQuery<PaginatedPatientsResponse, Error>({
    // Sorgu anahtarı (queryKey):
    // Anahtar, 'params' (filtreler) değiştikçe sorgunun
    // yeniden çalışmasını sağlamak için 'params'ı içermelidir.
    queryKey: ['patients', params],

    // API fonksiyonu
    queryFn: () => fetchPatients(params),

    // Bu veri, sık değişebilen bir liste olduğundan,
    // 'staleTime' (bayatlama süresi) daha kısa tutulabilir (örn. 1-5 dk).
    staleTime: 1000 * 60 * 1, // 1 dakika
    
    // Arka planda yenileme
    refetchOnWindowFocus: true,
  });
};

/**
 * Tek bir hastayı ID ile (fetchPatientById) çekmek için 'useQuery' kancası.
 * @param id - Hasta ID'si
 */
export const useGetPatientById = (id: number | null) => {
  return useQuery<PatientResponse, Error>({
    queryKey: ['patient', id],
    // API fonksiyonu. 'id' null ise çalışmaz.
    queryFn: () => fetchPatientById(id!),

    // 'enabled' seçeneği:
    // Eğer 'id' null (veya undefined) ise (örn. sayfa yüklenirken),
    // bu sorgu otomatik olarak çalışmaz.
    enabled: !!id,

    staleTime: 1000 * 60 * 5, // 5 dakika (Hasta detayı sık değişmez)
  });
};

/**
 * Yeni hasta oluşturmak (createPatient) için 'useMutation' kancası.
 */
export const useCreatePatient = () => {
  const queryClient = useQueryClient(); // React Query önbelleğini (cache) yönetmek için

  return useMutation({
    mutationFn: createPatient,
    onSuccess: (response) => {
      toast.success(response.message || 'Hasta başarıyla oluşturuldu.');

      // Başarılı oluşturma sonrası:
      // 'patients' anahtarıyla başlayan *tüm* sorguları (listeleri)
      // geçersiz kıl (invalidate).
      // Bu, TanStack Table'ın yeni hastayı göstermek için
      // otomatik olarak yeniden veri çekmesini (refetch) tetikler.
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
    onError: (error: any) => {
      // Axios interceptor'ı hatayı zaten gösterdi.
      console.error('Create patient error:', error);
    },
  });
};

/**
 * Hastayı güncellemek (updatePatient) için 'useMutation' kancası.
 */
export const useUpdatePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePatient,
    onSuccess: (response, variables) => {
      toast.success(response.message || 'Hasta başarıyla güncellendi.');

      // Başarılı güncelleme sonrası:
      // 1. Tüm 'patients' listelerini geçersiz kıl (yeniden çekilsin).
      queryClient.invalidateQueries({ queryKey: ['patients'] });

      // 2. Bu hastanın 'detail' sorgusunu (eğer önbellekte varsa)
      // doğrudan yeni veriyle güncelle (invalidate etmeden).
      // Bu, detay sayfasının anında güncellenmesini sağlar.
      queryClient.setQueryData(['patient', variables.id], response);
    },
  });
};

/**
 * Hastayı silmek (deletePatient) için 'useMutation' kancası.
 */
export const useDeletePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePatient,
    onSuccess: (response: any) => {
      toast.success(response.message || 'Hasta başarıyla silindi.');

      // Başarılı silme sonrası:
      // Tüm 'patients' listelerini geçersiz kıl (yeniden çekilsin).
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
};