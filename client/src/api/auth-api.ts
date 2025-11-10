import { useQuery, useMutation } from '@tanstack/react-query';
import apiClient from './axios-instance';
import { useAuthStore } from '../store/use-auth-store';
import { toast } from 'sonner';

// --- Tipler (Types) ---
// Bu tipler backend'deki 'auth.types.ts' ve 'auth.validation.ts' ile eşleşmelidir.

// /auth/login (Giriş) isteği için gönderilecek veri tipi
interface LoginCredentials {
  email: string;
  password: string;
}

// /auth/register (Kayıt) isteği için gönderilecek veri tipi
interface RegisterPayload {
  clinicName: string;
  userName: string;
  email: string;
  password: string;
}

// API'den dönen 'user' nesnesinin tipi
interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'doctor' | 'reception';
  tenantId: string;
}

// /auth/login veya /auth/me yanıtının tam tipi
// (Backend'deki ApiResponse<T> formatına uygun)
interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: AuthUser;
  };
}

// /auth/me yanıtı için (token yok)
interface ProfileResponse {
  success: boolean;
  message: string;
  data: AuthUser; // Sadece kullanıcı profili
}

// --- API Fonksiyonları ---

/**
 * Giriş (Login) API çağrısını yapan fonksiyon.
 * @param credentials - { email, password }
 * @returns Başarılı yanıt (AuthResponse)
 */
const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  // Axios istemcisi (apiClient) otomatik olarak 'baseURL' (/api/v1)
  // ve JSON header'larını ekler.
  // Yanıt (response) interceptor'ı sayesinde, başarılı yanıtlarda
  // 'response.data' otomatik olarak döndürülür.
  return apiClient.post('/auth/login', credentials);
};

/**
 * Kayıt (Register) API çağrısını yapan fonksiyon.
 * @param payload - { clinicName, userName, email, password }
 * @returns Başarılı yanıt (Genellikle { success, message })
 */
const register = async (payload: RegisterPayload) => {
  return apiClient.post('/auth/register', payload);
};

/**
 * 'auth/me' (Profilim) API çağrısını yapan fonksiyon.
 * Axios request (istek) interceptor'ı, bu istek için
 * 'Authorization' header'ını (token) otomatik olarak ekleyecektir.
 * @returns Başarılı yanıt (ProfileResponse)
 */
const getMyProfile = async (): Promise<ProfileResponse> => {
  return apiClient.get('/auth/me');
};

// --- React Query Kancaları (Hooks) ---

/**
 * Giriş (Login) için 'useMutation' kancası.
 *
 * 'useMutation', sunucuya veri yazan (POST, PUT, DELETE) işlemler için kullanılır.
 * @returns 'mutate' (giriş fonksiyonunu tetikler) ve 'isPending' (yükleniyor durumu)
 */
export const useLogin = () => {
  // Zustand store'undan 'login' eylemini (action) al
  const { login: storeLogin } = useAuthStore();

  return useMutation({
    // Kullanılacak API fonksiyonu
    mutationFn: login,

    // Başarılı (onSuccess) olduğunda:
    // 1. Gelen 'data' (token ve user) ile Zustand store'unu güncelle.
    // 2. Başarı bildirimi (toast) göster.
    onSuccess: (response) => {
      const { user, token } = response.data;
      storeLogin({ user, token }); // Zustand store'unu güncelle
      toast.success(response.message || 'Giriş başarılı!');
      // Yönlendirme (navigate) burada VEYA bileşenin (component) içinde yapılabilir.
    },

    // Hata (onError) olduğunda:
    // Axios response interceptor'ı (axios-instance.ts) zaten
    // genel hata bildirimini (toast) gösterir.
    // İstersek burada ekstra işlem yapabiliriz.
    onError: (error: any) => {
      // Axios interceptor zaten toast gösterdi.
      // Konsola log yazabiliriz.
      console.error('Login mutation error:', error);
    },
  });
};

/**
 * Kayıt (Register) için 'useMutation' kancası.
 */
export const useRegister = () => {
  return useMutation({
    mutationFn: register,
    onSuccess: (response: any) => {
      toast.success(
        response.message || 'Kayıt başarılı! Lütfen giriş yapın.',
      );
      // Yönlendirme (navigate) burada VEYA bileşenin içinde yapılabilir.
    },
    onError: (error: any) => {
      console.error('Register mutation error:', error);
      // Axios interceptor zaten toast gösterdi.
    },
  });
};

/**
 * Kullanıcı profilini çekmek için 'useQuery' kancası.
 *
 * 'useQuery', sunucudan veri okuyan (GET) işlemler için kullanılır.
 *
 * @param options - React Query ayarları (örn. 'enabled').
 * 'enabled: false' ayarı, sorgunun otomatik çalışmasını engeller
 * (örn. sadece 'isAuthenticated' true ise çalıştır).
 */
export const useGetMyProfile = (options: { enabled: boolean } = { enabled: true }) => {
  // Zustand store'undan 'setUser' eylemini al
  const { setUser } = useAuthStore();

  return useQuery<ProfileResponse, Error>({
    // Sorgu (query) için benzersiz anahtar (key)
    queryKey: ['myProfile'],

    // Kullanılacak API fonksiyonu
    queryFn: getMyProfile,

    // 'enabled' seçeneği dışarıdan (parametre) alınır.
    // 'AuthGuard' içinde, bu sorgunun sadece kullanıcı
    // 'isAuthenticated' ise (token varsa) çalışmasını sağlarız.
    enabled: options.enabled,

    // Veri başarılı çekildiğinde:
    // 1. Gelen 'data' (user) ile Zustand store'unu güncelle.
    //    Bu, profil bilgilerinin (örn. isim) her zaman güncel kalmasını sağlar.
    onSuccess: (response) => {
      if (response.data) {
        setUser(response.data); // Zustand store'undaki kullanıcıyı güncelle
      }
    },

    // Hata (onError) durumunda:
    // Axios interceptor'ı 401 hatasını yakalayıp 'logout' yapacaktır.
    // Diğer hatalar (örn. 500) burada yakalanır.
    onError: (error) => {
      console.error('GetMyProfile query error:', error);
      // AuthGuard (eğer kullanıyorsa) bu hatayı yakalayıp
      // kullanıcıyı logout yapabilir.
    },
    
    // Bu sorgunun bayatlama süresi (staleTime)
    staleTime: 1000 * 60 * 15, // 15 dakika
    // Sadece bir kez (1) yeniden dene
    retry: 1,
    // Pencereye odaklanınca yeniden çekme (refetch)
    refetchOnWindowFocus: false,
  });
};