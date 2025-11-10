import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './sidebar';
import Header from './header';

/**
 * DashboardLayout (Ana Panel Yerleşimi)
 *
 * Bu bileşen, 'App.tsx' içinde korumalı (giriş yapılmış) rotaları
 * sarmalayan ana yerleşimdir.
 *
 * Yapısı:
 * 1. Sol tarafta sabit bir 'Sidebar' (Masaüstü).
 * 2. Üst tarafta bir 'Header' (Başlık).
 * 3. 'Header'ın içinde 'MobileSidebar' (Mobil).
 * 4. Geriye kalan ana içerik alanında 'Outlet' (alt rotaları,
 * yani asıl sayfaları (örn. Dashboard, Hastalar) render eder).
 */
const DashboardLayout = () => {
  const location = useLocation();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* 1. Sidebar (Sol Menü) - Sadece Masaüstü (lg ve üstü) */}
      {/* 'hidden' ve 'lg:block' ile mobil cihazlarda gizlenir */}
      <Sidebar className="hidden lg:block" />

      {/* 2. Ana İçerik Alanı (Header + Sayfa İçeriği) */}
      <div className="flex flex-1 flex-col overflow-auto">
        {/* 2a. Header (Üst Bar) */}
        {/* 'Header' bileşeni, 'MobileSidebar'ı (mobil menü) içinde barındırır */}
        <Header />

        {/* 2b. Sayfa İçeriği (Outlet) */}
        <main
          className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8"
          // Sayfa değiştiğinde (location.pathname) scroll'u en üste taşır
          key={location.pathname}
        >
          {/* 'Outlet', React Router'ın mevcut alt rotayı
             (örn. <PatientListPage />) buraya render etmesini sağlar.
          */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;