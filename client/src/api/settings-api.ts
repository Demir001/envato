import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './axios-instance';
import { toast } from 'sonner';

// --- Tipler (Types) ---
// Backend'deki 'settings.types.ts' ile eşleşmeli.

// Günlük çalışma saati tipi
export interface IDayHours {
  open: string; // "09:00"
  close: string; // "17:00"
  isOpen: boolean;
}

// 7 günlük çalışma saati nesnesi
export interface IOpeningHours {
  mon: IDayHours;
  tue: IDayHours;
  wed: IDayHours;
  thu: IDayHours;
  fri: IDayHours;
  sat: IDayHours;
  sun: IDayHours;
}

// Klinik Ayarları (Settings) nesnesinin tam arayüzü
export interface IClinicSettings {
  tenantId: string;
  clinicName: string | null;
  currencySymbol: string;
  openingHours: IOpeningHours | null;
  holidays: string[]; // ["YYYY-MM-DD", ...]
}

// API'den dönen ayar yanıtı
// (Backend: ApiResponse<IClinicSettings>)
interface SettingsResponse {
  success: boolean;
  message: string;
  data: IClinicSettings;
}

// Ayarları güncelleme (Update) payload'u
export type UpdateSettingsInput = Partial<{
  clinicName: string;
  currencySymbol: string;
  openingHours: IOpeningHours;
  holidays: string[];
}>;

// --- API Fonksiyonları ---

/**
 * Mevcut kliniğin ayarlarını çeker.
 * @returns SettingsResponse
 */
const fetchSettings = async (): Promise<SettingsResponse> => {
  return apiClient.get('/settings');
};

/**
 * Mevcut kliniğin ayarlarını günceller.
 * @param settingsData - UpdateSettingsInput
 * @returns SettingsResponse (güncellenmiş ayarlar)
 */
const updateSettings = async (
  settingsData: UpdateSettingsInput,
): Promise<SettingsResponse> => {
  return apiClient.put('/settings', settingsData);
};

// --- React Query Kancaları (Hooks) ---

/**
 * Klinik ayarlarını (fetchSettings) çekmek için 'useQuery' kancası.
 */
export const useGetSettings = () => {
  return useQuery<SettingsResponse, Error>({
    // Sorgu anahtarı (queryKey):
    // 'settings' anahtarı, ayarların uygulama genelinde
    // tek bir yerde (singleton) tutulmasını sağlar.
    queryKey: ['settings'],

    // API fonksiyonu
    queryFn: fetchSettings,

    // Ayarlar verisi nadiren değişir.
    // 'staleTime' (bayatlama süresi) uzun tutulabilir.
    staleTime: 1000 * 60 * 30, // 30 dakika
    
    // Pencereye odaklanınca yeniden çekmeye gerek yok.
    refetchOnWindowFocus: false,
    
    // Hata durumunda yeniden deneme (retry)
    retry: 1,
  });
};

/**
 * Klinik ayarlarını güncellemek (updateSettings) için 'useMutation' kancası.
 */
export const useUpdateSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSettings,
    onSuccess: (response) => {
      toast.success(response.message || 'Ayarlar başarıyla güncellendi.');

      // Başarılı güncelleme sonrası:
      // 'settings' sorgusunu geçersiz kıl (invalidate)
      // veya 'setQueryData' ile önbelleği (cache) doğrudan güncelle.
      // 'setQueryData' daha hızlı bir UI güncellemesi sağlar.
      queryClient.setQueryData(['settings'], response);

      // (Opsiyonel) Eğer klinik adı değiştiyse, 'auth/me'
      // veya 'dashboard' verisini de yenilemek gerekebilir.
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error: any) => {
      // Axios interceptor'ı hatayı zaten gösterdi.
      console.error('Update settings error:', error);
    },
  });
};