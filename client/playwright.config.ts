import { defineConfig, devices } from '@playwright/test';
import path from 'path';

// .env dosyasını oku (eğer testte özel değişkenler gerekirse)
// require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

/**
 * Playwright (E2E Test) Yapılandırması
 *
 * Bu dosya, Playwright'in Uçtan Uca (End-to-End) testleri
 * (örn. 'auth.e2e.spec.ts') nasıl çalıştıracağını yapılandırır.
 *
 * Kriter 3: "2 Playwright e2e"
 */
export default defineConfig({
  // --- Test Dizini ---
  // Test dosyalarının (örn. ...e2e.spec.ts) bulunduğu yer.
  // 'src' klasörünün *dışında*, '/client/tests' klasörünü kullanacağız.
  testDir: './tests',

  // --- Genel Ayarlar ---
  // Testlerin ne kadar sürebileceği (timeout)
  timeout: 30 * 1000, // 30 saniye
  expect: {
    timeout: 5000, // 'expect(..).toBeVisible()' gibi beklemeler için 5sn
  },
  
  // Testleri 'tamamen paralel' çalıştır
  fullyParallel: true,
  
  // Başarısız (failed) testleri CI (GitHub Actions) üzerinde
  // otomatik olarak yeniden deneme
  retries: process.env.CI ? 2 : 0,
  
  // Paralel çalışacak 'worker' (işçi) sayısı
  workers: process.env.CI ? 1 : undefined, // CI'da 1, lokalde 'undefined' (otomatik)
  
  // Raporlama (Reporter)
  // 'html' -> Test sonuçlarını görmek için 'npx playwright show-report'
  reporter: 'html',

  // --- Web Sunucusu (Web Server) ---
  // Playwright'in, testlere başlamadan *önce*
  // geliştirme (development) sunucusunu (Vite)
  // otomatik olarak başlatmasını sağlar.
  webServer: {
    // Vite'i başlatan komut ('client' klasöründe çalışır)
    command: 'npm run dev',
    
    // Test edilecek 'baseURL' (Vite'in çalıştığı port)
    url: 'http://localhost:3000',
    
    // Sunucunun başlamasını bekle
    reuseExistingServer: !process.env.CI, // CI'da sunucuyu yeniden başlat, lokalde mevcudu kullan
    timeout: 120 * 1000, // Sunucunun başlaması için 120sn bekle
  },

  // --- 'use' (Genel Test Ayarları) ---
  // Tüm testlerde (projects) geçerli olacak ayarlar
  use: {
    // --- Ana URL ---
    // 'page.goto('/')' çağrıldığında, Playwright
    // 'http://localhost:3000/' adresine gider.
    baseURL: 'http://localhost:3000',

    // --- İzleme (Tracing) ---
    // Testler başarısız olduğunda (veya ilk denemede)
    // 'trace' (adım adım ekran görüntüsü ve ağ kaydı) al.
    trace: 'on-first-retry',
  },

  // --- Projeler (Projects) / Tarayıcılar ---
  // Testlerin hangi tarayıcılarda çalıştırılacağını belirler.
  // Varsayılan olarak Chromium (Chrome/Edge), Firefox ve WebKit (Safari)
  // hedeflenir.
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Mobil (Mobile) cihazları taklit et (Opsiyonel) */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],
});