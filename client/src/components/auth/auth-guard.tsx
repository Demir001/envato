import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, selectIsAuthenticated } from '@/store/use-auth-store';
import { useGetMyProfile } from '@/api/auth-api';
import FullPageSpinner from '../ui/full-page-spinner';

/**
 * AuthGuard (Giriş Kontrolü Koruyucusu)
 *
 * 'App.tsx' içinde ana panel (Dashboard) rotalarını sarmalar.
 *
 * Sorumlulukları:
 * 1. Kullanıcının giriş yapıp yapmadığını (authenticated) kontrol etmek.
 * 2. Eğer giriş *yapmamışsa*, kullanıcıyı '/auth/login' sayfasına yönlendirmek.
 * 3. Eğer giriş *yapmışsa*, alt bileşenleri (children) (örn. <DashboardLayout />)
 * render etmek.
 * 4. Sayfa yenilendiğinde, Zustand store (localStorage) token'ı okurken
 * veya 'auth/me' (profil) isteği yapılırken bir yükleme (loading)
 * ekranı (Spinner) göstermek.
 */
const AuthGuard = ({ children }: { children: React.ReactElement }) => {
  // 1. Zustand store'dan anlık (snapshot) kimlik doğrulama durumunu al
  // 'useAuthStore(selectIsAuthenticated)' kullanmak, store değiştiğinde
  // bu bileşeni yeniden render eder (örn. logout sonrası).
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const location = useLocation();

  // 2. 'auth/me' API isteği için React Query kancasını çağır
  // 'enabled: isAuthenticated' -> Bu sorgu, SADECE Zustand store
  // (localStorage) bir token bulursa (isAuthenticated=true) çalışır.
  const {
    data: profileData,
    isLoading: isProfileLoading,
    isError: isProfileError,
    error: profileError,
  } = useGetMyProfile({
    enabled: isAuthenticated,
  });

  // 3. Yükleme Durumu (Loading State) Yönetimi
  // 'isCheckingAuth': Store'un 'rehydrate' (localStorage'dan okuma)
  // işleminin bitip bitmediğini kontrol eder.
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Zustand'un 'persist' (localStorage) işlemi asenkron olabilir.
    // 'hasRehydrated' state'ini dinleyerek store'un
    // hazır olduğundan emin ol.
    const unsub = useAuthStore.persist.onFinishRehydration(() => {
      setIsCheckingAuth(false);
    });

    // Eğer store zaten hazırsa (rehydrated), kontrolü hemen bitir
    if (useAuthStore.persist.hasRehydrated()) {
      setIsCheckingAuth(false);
    }

    return () => {
      unsub(); // Clean up listener
    };
  }, []);

  // --- Render Mantığı ---

  // Durum 1: Halen localStorage'ı kontrol ediyoruz (Rehydrating)
  if (isCheckingAuth) {
    // console.log('AuthGuard: Checking localStorage (rehydrating)...');
    return <FullPageSpinner />;
  }

  // Durum 2: Store hazır (isCheckingAuth = false)
  // AMA 'isAuthenticated' (token var) VE
  // 'auth/me' profil isteği halen yükleniyor (isProfileLoading).
  if (isAuthenticated && isProfileLoading) {
    // console.log('AuthGuard: Token found, fetching profile (/auth/me)...');
    return <FullPageSpinner />;
  }
  
  // Durum 3: Store hazır, 'isAuthenticated' (token var) AMA
  // 'auth/me' isteği HATA verdi (isProfileError).
  // Bu, token'ın GEÇERSİZ (invalid/expired) olduğu anlamına gelir.
  if (isAuthenticated && isProfileError) {
    // Axios interceptor'ı (401 hatasıyla) zaten 'logout' yapmış
    // ve toast göstermiş olmalı, ancak bu bir ek güvenlik katmanıdır.
    console.error('AuthGuard: Profile fetch failed. Invalid token?', profileError);
    // 'logout'u manuel tetikle (interceptor kaçırmışsa diye)
    useAuthStore.getState().logout();
    // 'isAuthenticated' state'i değişecek ve Durum 4'e düşecek.
    // Yine de yönlendirmeyi ekleyelim:
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Durum 4: Store hazır (isCheckingAuth = false) VE
  // 'isAuthenticated' false (localStorage'da token yok).
  if (!isAuthenticated) {
    // console.log('AuthGuard: No token. Redirecting to login.');
    // Kullanıcıyı login sayfasına yönlendir.
    // 'state: { from: location }' -> Başarılı girişten sonra
    // kullanıcının gitmek istediği sayfaya (location) geri dönmesini sağlar.
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Durum 5: Başarılı!
  // Store hazır, 'isAuthenticated' true, 'isProfileLoading' false, 'isProfileError' false.
  // Kullanıcı giriş yapmış ve profili (profileData) yüklenmiş.
  // console.log('AuthGuard: Success. Rendering protected route.');
  return children; // <DashboardLayout /> (ve alt rotaları) render et
};

export default AuthGuard;