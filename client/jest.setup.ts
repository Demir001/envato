// --- Jest DOM (DOM Eşleştiricileri) ---
// Bu import, 'jest-dom' kütüphanesini Jest'e tanıtır.
// Bu sayede, testlerimizde '.toBeInTheDocument()',
// '.toHaveClass()', '.toBeVisible()' gibi
// React Testing Library (RTL) ile sıkça kullanılan
// DOM odaklı 'expect' eşleştiricilerini (matchers)
// kullanabiliriz.
// 'jest.config.cjs' dosyasındaki 'setupFilesAfterEnv'
// ayarı, bu dosyanın her testten önce otomatik olarak
// çalıştırılmasını sağlar.
import '@testing-library/jest-dom';

// --- Global Mock'lar (Sahte Veriler) ---

// 'matchMedia' (Tema Sağlayıcısı - ThemeProvider için)
// 'useTheme' kancası (Adım 81) 'window.matchMedia' kullanır.
// JSDOM (Jest'in tarayıcı ortamı) bu fonksiyonu
// içermediği için, onu manuel olarak 'mock'lamalıyız (sahte
// bir versiyonunu oluşturmalıyız).
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false, // Varsayılan olarak 'light' (açık) temayı taklit et
    media: query,
    onchange: null,
    addListener: jest.fn(), // 'deprecated' (kullanımdan kaldırıldı)
    removeListener: jest.fn(), // 'deprecated' (kullanımdan kaldırıldı)
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// 'localStorage' (Zustand - useAuthStore için)
// 'useAuthStore' (Adım 70), 'persist' (kalıcılık)
// middleware'i ile 'localStorage' kullanır.
// JSDOM 'localStorage'ı içerir, ancak testler arasında
// temizlenmesi (clear) iyi bir pratiktir.
beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

// 'React Query' (API Çağrıları)
// Testlerin API çağrıları nedeniyle yavaşlamasını veya
// başarısız olmasını önlemek için React Query'nin
// 'retry' (yeniden deneme) özelliğini test ortamında kapat.
import { setLogger } from 'react-query';

setLogger({
  log: console.log,
  warn: console.warn,
  error: () => {
    // Testlerdeki 'retry' (yeniden deneme)
    // hatalarını konsolda gösterme (çok yer kaplar)
  },
});