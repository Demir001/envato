import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import { useAuthStore } from '../store/use-auth-store'; // Zustand store'u import et
import { toast } from 'sonner'; // Bildirim için

// 1. Axios İstemcisini (Client) Oluşturma
// API'nin temel URL'si.
// Geliştirme (development) ortamında Vite proxy'si (/api) sayesinde
// bu 'http://localhost:5001'e yönlendirilecektir.
// Production ortamında, aynı domain altında sunuluyorsa
// bu '/api/v1' olarak kalabilir veya çevre değişkeninden (environment variable)
// okunabilir.
const apiClient = axios.create({
  baseURL: '/api/v1', // Backend API'mizin v1 kök dizini
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Request (İstek) Interceptor'ı
// Bu fonksiyon, API'ye gönderilen *her* istekten önce çalışır.
// Görevi: Zustand store'dan JWT token'ını okumak ve
// isteğin 'Authorization' header'ına eklemek.
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Zustand store'dan token'ı al
    // Not: Store'u bir hook (useAuthStore()) gibi çağırmıyoruz,
    // çünkü burası bir React bileşeni değil.
    // 'getState()' metodunu kullanarak anlık (snapshot) durumu alırız.
    const token = useAuthStore.getState().token;

    if (token) {
      // Eğer token varsa, header'a 'Bearer <token>' olarak ekle
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // İstek yapılandırma hatası
    return Promise.reject(error);
  },
);

// 3. Response (Yanıt) Interceptor'ı
// Bu fonksiyon, API'den dönen *tüm* yanıtlardan sonra çalışır.
// Görevi: Hataları (özellikle 401 veya 403) merkezi olarak yönetmek.
apiClient.interceptors.response.use(
  // Başarılı yanıtlar (2xx) için:
  // Yanıtı olduğu gibi döndür.
  (response: AxiosResponse) => {
    // Bazen backend { success: true, data: ... } formatında yanıt verir.
    // React Query'nin doğrudan veriye ('data') ulaşması için
    // burada 'response.data' yerine 'response.data.data'
    // döndürülebilir, ancak biz backend'de (ApiResponse.ts)
    // standart bir yapı (data, message, success) kullandığımız için
    // tüm yanıtı (response.data) döndürmek daha iyidir.
    return response.data;
  },

  // Başarısız yanıtlar (4xx, 5xx) için:
  (error: AxiosError) => {
    // Hatanın 'response' (sunucudan gelen yanıt) içerip içermediğini kontrol et
    if (error.response) {
      const status = error.response.status;
      const data: any = error.response.data; // Backend'den gelen hata mesajı

      // --- Hata Yönetimi ---

      // 401 Unauthorized (Yetkisiz)
      // Token geçersiz, süresi dolmuş veya yok.
      // Kullanıcıyı hemen sistemden at (logout).
      if (status === 401) {
        // 'useAuthStore.getState().logout()' çağrısını kontrol et
        // Eğer zaten giriş yapılmamışsa tekrar logout demeye gerek yok
        const isAuthenticated = useAuthStore.getState().isAuthenticated;
        if (isAuthenticated) {
          useAuthStore.getState().logout();
          // Sayfayı yenileyerek kullanıcıyı login sayfasına yönlendir
          // (AuthGuard bunu otomatik yapacak)
          window.location.href = '/auth/login';
          toast.error('Oturumunuzun süresi doldu. Lütfen tekrar giriş yapın.');
        }
      }

      // 403 Forbidden (Yasak)
      // Kullanıcının token'ı geçerli ancak bu işlemi yapmaya yetkisi yok
      // (örn. 'doctor' rolü 'staff' silmeye çalıştı).
      else if (status === 403) {
        toast.error(
          data?.message || 'Bu işlemi yapmak için yetkiniz bulunmuyor.',
        );
      }

      // 404 Not Found (Bulunamadı)
      // Kaynak bulunamadı (örn. /patients/9999)
      else if (status === 404) {
        toast.error(
          data?.message || 'İstenilen kaynak bulunamadı.',
        );
      }
      
      // 400 Bad Request (Geçersiz İstek) veya 409 Conflict (Çakışma)
      // Genellikle Zod validasyon hataları veya 'email zaten var' hataları.
      else if (status === 400 || status === 409) {
         toast.error(data?.message || 'Geçersiz veri. Lütfen formu kontrol edin.');
      }

      // 500 Internal Server Error (Sunucu Hatası)
      else if (status >= 500) {
        toast.error(
          data?.message || 'Sunucuda beklenmedik bir hata oluştu.',
        );
      }
      
      // Backend'den gelen 'ApiError' (data) nesnesini
      // React Query'nin 'error' objesi olarak döndür.
      return Promise.reject(data);
      
    } else if (error.request) {
      // İstek yapıldı ancak yanıt alınamadı (örn. API/internet kapalı)
      toast.error(
        'Sunucuya ulaşılamıyor. Lütfen internet bağlantınızı kontrol edin.',
      );
    } else {
      // İsteği kurarken bir hata oluştu
      console.error('Axios config error:', error.message);
    }

    // Genel bir hata nesnesi döndür
    return Promise.reject(error.message || 'Bilinmeyen bir hata oluştu.');
  },
);

export default apiClient;