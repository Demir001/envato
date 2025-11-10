import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';

// Temel Bileşen Sağlayıcıları (Providers)
import { ThemeProvider } from './components/providers/theme-provider';
import { Toaster }
  from './components/ui/sonner'; // 'sonner' (veya benzeri) toast kütüphanesi

// Sayfa Yükleme (Loading) Göstergesi
import FullPageSpinner from './components/ui/full-page-spinner';

// Düzen (Layout) Bileşenleri
// 'AuthLayout' (Giriş/Kayıt) ve 'DashboardLayout' (Ana Panel)
// Bu bileşenler, alt rotaları (children) göstermek için 'Outlet' kullanır.
import DashboardLayout from './components/layout/dashboard-layout';
import AuthLayout from './components/layout/auth-layout';

// Rota Koruyucuları (Route Guards)
// 'AuthGuard', kullanıcının giriş yapıp yapmadığını kontrol eder.
// 'RoleGuard', kullanıcının rolüne (örn. 'admin') göre erişimi kısıtlar.
import AuthGuard from './components/auth/auth-guard';
import RoleGuard from './components/auth/role-guard';

// --- Sayfaların Lazy Yüklenmesi ---
// Sayfaları 'lazy' ile yükleyerek ilk açılış (bundle) boyutunu küçültürüz.
// Sadece ihtiyaç duyulduğunda o sayfanın kodu (chunk) yüklenir.

// Kimlik Doğrulama (Auth) Sayfaları
const LoginPage = lazy(() => import('./pages/auth/login-page'));
const RegisterPage = lazy(() => import('./pages/auth/register-page'));
const ForgotPasswordPage = lazy(
  () => import('./pages/auth/forgot-password-page'),
);

// Ana Panel (Dashboard) Sayfaları
const DashboardOverviewPage = lazy(
  () => import('./pages/dashboard/dashboard-overview-page'),
);
const CalendarPage = lazy(() => import('./pages/dashboard/calendar-page'));

// Hasta (Patient) Sayfaları
const PatientListPage = lazy(
  () => import('./pages/dashboard/patients/patient-list-page'),
);
const PatientDetailPage = lazy(
  () => import('./pages/dashboard/patients/patient-detail-page'),
);
const PatientCreatePage = lazy(
  () => import('./pages/dashboard/patients/patient-create-page'),
);

// Faturalandırma (Billing) Sayfaları
const BillingListPage = lazy(
  () => import('./pages/dashboard/billing/billing-list-page'),
);
const BillingDetailPage = lazy(
  () => import('./pages/dashboard/billing/billing-detail-page'),
);

// Stok (Inventory) Sayfaları
const InventoryListPage = lazy(
  () => import('./pages/dashboard/inventory/inventory-list-page'),
);

// Personel (Staff) Yönetimi Sayfaları (Sadece Admin)
const StaffListPage = lazy(
  () => import('./pages/dashboard/staff/staff-list-page'),
);

// Ayarlar (Settings) Sayfası
const SettingsPage = lazy(() => import('./pages/dashboard/settings-page'));

// Hata Sayfaları
const NotFoundPage = lazy(() => import('./pages/utility/not-found-page'));

// --- Ana Uygulama Bileşeni ---

function App() {
  return (
    // Tema Sağlayıcısı (Light/Dark Mod)
    <ThemeProvider defaultTheme="system" storageKey="clinicadmin-theme">
      {/* Suspense: Lazy yüklenen bileşenlerin (sayfaların) yüklenmesini beklerken 
        bir 'fallback' (örn. spinner) gösterir.
      */}
      <Suspense fallback={<FullPageSpinner />}>
        {/* Ana Rota (Routes) Yapısı */}
        <Routes>
          {/* --- Kimlik Doğrulama (Auth) Rotaları ---
            Bu rotalar '/auth/*' yolunu kullanır ve 'AuthLayout' içinde render edilir.
            Örn: /auth/login, /auth/register
          */}
          <Route path="auth" element={<AuthLayout />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            {/* Auth kök dizini (örn: /auth), login'e yönlendirir */}
            <Route index element={<Navigate to="login" replace />} />
          </Route>

          {/* --- Ana Panel (Dashboard) Rotaları ---
            Bu rotalar '/' yolunu kullanır ve 'AuthGuard' (Giriş Koruması) altındadır.
            Kullanıcı giriş yapmamışsa, '/auth/login' sayfasına yönlendirilir.
          */}
          <Route
            path="/"
            element={
              <AuthGuard>
                <DashboardLayout />
              </AuthGuard>
            }
          >
            {/* Ana Sayfa (Dashboard) */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardOverviewPage />} />
            <Route path="calendar" element={<CalendarPage />} />

            {/* Hasta (Patient) Rotaları */}
            <Route path="patients">
              <Route index element={<PatientListPage />} />
              <Route path="new" element={<PatientCreatePage />} />
              <Route path=":id" element={<PatientDetailPage />} />
            </Route>

            {/* Faturalandırma (Billing) Rotaları */}
            <Route path="billing">
              <Route index element={<BillingListPage />} />
              <Route path=":id" element={<BillingDetailPage />} />
            </Route>

            {/* Stok (Inventory) Rotaları */}
            <Route path="inventory" element={<InventoryListPage />} />

            {/* --- Admin'e Özel Rotalar ---
              Bu rotalar 'RoleGuard' ile korunur. Sadece 'admin' rolü erişebilir.
            */}
            <Route
              path="staff"
              element={
                <RoleGuard allowedRoles={['admin']}>
                  <StaffListPage />
                </RoleGuard>
              }
            />

            {/* Ayarlar (Settings) Rotası */}
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* --- Yakalanmayan Rotalar (404) ---
            Hiçbir rotayla eşleşmeyen yollar 'NotFoundPage' sayfasına yönlendirilir.
          */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>

      {/* Toast (Bildirim) Konteyneri
        Uygulamanın herhangi bir yerinden toast göstermek için.
      */}
      <Toaster position="top-right" richColors />
    </ThemeProvider>
  );
}

export default App;