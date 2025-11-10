import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// API'den dönen 'user' nesnesinin tipi
// (Backend: ILoginResponse['user'])
interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'doctor' | 'reception';
  tenantId: string;
}

// Store'un (durumun) arayüzü
interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean; // Kolay erişim için türetilmiş (derived) durum
}

// Store'daki eylemlerin (actions) arayüzü
interface AuthActions {
  /**
   * Kullanıcı giriş yaptığında token ve kullanıcı bilgilerini kaydeder.
   * @param data - API'den dönen { user, token } nesnesi.
   */
  login: (data: { user: AuthUser; token: string }) => void;

  /**
   * Kullanıcı çıkış yaptığında durumu sıfırlar.
   */
  logout: () => void;

  /**
   * Kullanıcı bilgilerini (örn. profil güncellemesi) günceller.
   * @param user - Güncellenmiş kullanıcı nesnesi.
   */
  setUser: (user: AuthUser) => void;
}

// Başlangıç durumu (initial state)
const initialState: Omit<AuthState, 'isAuthenticated'> = {
  user: null,
  token: null,
};

/**
 * Zustand Auth Store
 *
 * 'persist' middleware'i kullanarak kullanıcı oturumunu (auth state)
 * 'localStorage' (tarayıcı depolaması) üzerine kaydeder.
 * Bu sayede kullanıcı sayfayı yenilediğinde veya tarayıcıyı
 * kapattığında oturumu açık kalır.
 */
export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      ...initialState,
      isAuthenticated: false, // Başlangıçta kimse giriş yapmamıştır

      /**
       * LOGIN EYLEMİ
       * 'set' fonksiyonu, mevcut durumu (state) günceller.
       */
      login: (data) =>
        set({
          user: data.user,
          token: data.token,
          isAuthenticated: true, // Durumu 'giriş yapıldı' olarak güncelle
        }),

      /**
       * LOGOUT EYLEMİ
       * Durumu başlangıç haline (initialState) döndürür ve
       * 'isAuthenticated' bayrağını 'false' yapar.
       */
      logout: () => set({ ...initialState, isAuthenticated: false }),

      /**
       * SETUSER EYLEMİ
       * Sadece kullanıcı bilgilerini günceller (örn. profil sayfasından).
       * Token veya 'isAuthenticated' durumunu etkilemez.
       */
      setUser: (user) => set((state) => ({ ...state, user })),
    }),
    {
      // 'persist' ayarları
      name: 'clinicadmin-auth-storage', // localStorage'daki anahtar (key) adı

      // Depolama alanı (varsayılan: localStorage)
      storage: createJSONStorage(() => localStorage),

      // Sadece bu alanları depola (isteğe bağlı, ama iyi bir pratik)
      // 'isAuthenticated' alanı depolanmaz, bunun yerine
      // 'user' ve 'token' var mı diye kontrol edilerek
      // her yüklemede yeniden hesaplanır.
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),

      // Depodan veri okunduktan sonra (sayfa yenilemesi) çalışır
      // 'isAuthenticated' durumunu manuel olarak ayarlar.
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isAuthenticated = !!(state.user && state.token);
        }
      },
    },
  ),
);

/**
 * Kolay erişim için store'dan seçici (selector) fonksiyonlar.
 * Bileşenlerin (component) sadece ihtiyaç duydukları veriyi almasını sağlar
 * ve gereksiz yeniden render (re-render) işlemlerini önler.
 */
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectUser = (state: AuthState) => state.user;
export const selectUserRole = (state: AuthState) => state.user?.role;
export const selectToken = (state: AuthState) => state.token;