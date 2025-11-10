import { Outlet } from 'react-router-dom';
import { Stethoscope } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * AuthLayout (Kimlik Doğrulama Yerleşimi)
 *
 * 'App.tsx' içinde '/auth/*' (örn. /auth/login, /auth/register)
 * rotalarını sarmalayan yerleşimdir.
 *
 * Sorumlulukları:
 * 1. Marka (Logo/İsim) ve bir arka plan görseli (opsiyonel)
 * ile basit bir merkezi düzen sağlamak.
 * 2. 'Outlet' aracılığıyla 'LoginPage' veya 'RegisterPage'
 * gibi alt rotaları render etmek.
 */
const AuthLayout = () => {
  const { i18n } = useTranslation();

  // Dil değiştirme (basit örnek)
  const toggleLanguage = () => {
    const newLang = i18n.language === 'tr' ? 'en' : 'tr';
    i18n.changeLanguage(newLang);
  };

  return (
    // 'min-h-screen' ile tüm ekranı kapla
    <div className="flex min-h-screen w-full">
      {/* 1. Sol Taraf - Marka ve Görsel (Mobil cihazlarda gizlenir) */}
      <div className="relative hidden flex-1 items-center justify-center bg-muted lg:flex">
        {/* Buraya bir arka plan görseli eklenebilir
           <img
             src="/path/to/auth-background.jpg"
             alt="Clinic"
             className="absolute inset-0 h-full w-full object-cover"
           />
        */}
        <div className="relative z-10 flex flex-col items-center text-center text-muted-foreground">
          <Stethoscope className="h-16 w-16 text-primary" />
          <h1 className="mt-4 text-3xl font-bold text-foreground">
            ClinicAdmin
          </h1>
          <p className="mt-2 text-lg">
            Küçük klinikler için modern yönetim paneli.
          </p>
        </div>

        {/* Dil Değiştirme Düğmesi (Sol alt) */}
        <button
          onClick={toggleLanguage}
          className="absolute bottom-6 left-6 z-10 rounded-md bg-background/50 px-3 py-1.5 text-sm font-medium text-foreground backdrop-blur-sm hover:bg-background/80"
        >
          {i18n.language === 'tr' ? 'English (EN)' : 'Türkçe (TR)'}
        </button>
      </div>

      {/* 2. Sağ Taraf - Form Alanı (Login/Register) */}
      <div className="flex flex-1 items-center justify-center p-4 lg:p-8">
        <div className="mx-auto flex w-full max-w-sm flex-col justify-center space-y-6">
          {/*
           'Outlet', React Router'ın mevcut auth rotasını
           (örn. <LoginPage /> veya <RegisterPage />)
           buraya render etmesini sağlar.
          */}
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;