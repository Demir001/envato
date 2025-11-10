import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// JSON çeviri dosyalarını içe aktar
import enTranslations from './en.json';
import trTranslations from './tr.json';

// Çeviri kaynaklarını (resources) tanımla
// Her dil için 'translation' anahtarı altında JSON dosyasını ekle
const resources = {
  en: {
    translation: enTranslations,
  },
  tr: {
    translation: trTranslations,
  },
};

i18n
  // 1. LanguageDetector (Dil Algılayıcı)
  // Tarayıcının 'navigator.language' veya 'localStorage' ayarına bakarak
  // kullanıcı dilini otomatik olarak algılar.
  .use(LanguageDetector)

  // 2. initReactI18next (React Entegrasyonu)
  // 'i18next' örneğini 'react-i18next' kütüphanesine bağlar.
  // Bu, 'useTranslation' hook'unun ve 'Trans' bileşeninin çalışmasını sağlar.
  .use(initReactI18next)

  // 3. init (Başlatma)
  // i18next'in ana yapılandırması
  .init({
    // Çeviri kaynakları (dil dosyaları)
    resources,

    // Varsayılan dil (fallback)
    // Eğer algılanan dil (örn: 'de') 'resources' içinde yoksa,
    // 'en' (İngilizce) kullanılacaktır.
    fallbackLng: 'en',

    // Hangi dilin yükleneceğinin belirlenmesi
    // 'languageDetector' (tarayıcı ayarı) 'tr' veya 'en' bulamazsa
    // yine 'en' kullanılacaktır.
    supportedLngs: ['en', 'tr'],

    // Geliştirme modunda hata ayıklama (debug)
    // Konsola i18next'in ne yaptığını (hangi dili yüklediği vb.) yazar.
    debug: process.env.NODE_ENV === 'development',

    // React-i18next için özel seçenekler
    interpolation: {
      // Değişkenleri (örn: {{name}}) HTML-escape etme
      // React bunu zaten (XSS koruması) yaptığı için 'false' güvenlidir.
      escapeValue: false,
    },
  });

// Yapılandırılmış i18n örneğini dışa aktar
// Bu, 'main.tsx' dosyasında bir kez import edilecektir.
export default i18n;