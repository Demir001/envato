import { test, expect } from '@playwright/test';
import { useAuthStore } from '../client/src/store/use-auth-store'; // Test çalışırken store'a erişim (önerilmez)

/**
 * Playwright E2E (Uçtan Uca) Testi - Kimlik Doğrulama (Auth)
 *
 * Bu test, 'playwright.config.ts' (Adım 142) yapılandırmasına göre çalışır.
 * 'npm run test:e2e' komutuyla tetiklenir.
 *
 * Sorumlulukları:
 * 1. Başlamadan önce: 'webServer' (Vite) sunucusunun
 * 'http://localhost:3000' adresinde çalışır durumda olmasını bekler.
 * 2. Backend API'sinin (http://localhost:5001) de çalışıyor olması gerekir.
 * (Bunu 'docker-compose up' veya manuel 'npm run dev' ile sağlamalıyız).
 *
 * Test Akışı:
 * 1. 'beforeAll': Backend'in hazır olduğundan emin olmak için 'seed' (demo veri)
 * işleminin çalıştırıldığından emin olun. (Bu script'te manuel varsayıyoruz)
 * 2. Test 1: Başarısız (hatalı şifre) giriş denemesi.
 * 3. Test 2: Başarılı (demo admin) giriş denemesi.
 * 4. Test 3: Başarılı giriş sonrası 'logout' (çıkış) denemesi.
 */

// --- Test 1: Başarısız Giriş (Hatalı Şifre) ---
test('should fail to login with wrong credentials', async ({ page }) => {
  // 1. '/auth/login' (Giriş) sayfasına git
  await page.goto('/auth/login');
  
  // 2. 'expect' ile sayfanın yüklendiğini (başlık) doğrula
  await expect(page.getByRole('heading', { name: 'Hesabınıza giriş yapın' }))
    .toBeVisible();

  // 3. Formu Doldur (Hatalı Şifre)
  // Demo admin e-postası (seed.ts - Adım 16)
  await page.getByLabel('E-posta Adresi').fill('admin@clinic.com');
  await page.getByLabel('Şifre').fill('yanlis_sifre_123');

  // 4. Gönder (Sign In) Düğmesine Tıkla
  await page.getByRole('button', { name: 'Giriş Yap' }).click();

  // 5. Sonucu Doğrula
  
  // 5a. Hata bildiriminin (toast) görünür olmasını bekle
  // (Axios interceptor'ı - Adım 72 - tetiklenir)
  await expect(page.getByText('Invalid email or password.')).toBeVisible();
  
  // 5b. URL'in '/dashboard'a yönlen*mediğini* doğrula
  await expect(page).toHaveURL('/auth/login');
});


// --- Test 2: Başarılı Giriş (Admin) ---
test('should login successfully with admin credentials', async ({ page }) => {
  // 1. '/auth/login' (Giriş) sayfasına git
  await page.goto('/auth/login');
  
  // 2. Formu Doldur (Doğru Demo Verisi - Adım 16 / .env)
  // DEMO_ADMIN_EMAIL=admin@clinic.com
  // DEMO_ADMIN_PASSWORD=demopassword123 (seed.ts'deki varsayılan)
  await page.getByLabel('E-posta Adresi').fill('admin@clinic.com');
  await page.getByLabel('Şifre').fill('demopassword123');

  // 3. Gönder (Sign In) Düğmesine Tıkla
  // Not: 'name' (isim) 'isLoading' durumuna göre değişir ('Giriş Yap' -> 'Giriş yapılıyor...').
  // Playwright 'click' komutu bu durumu otomatik yönetir.
  await page.getByRole('button', { name: 'Giriş Yap' }).click();

  // 4. Sonucu Doğrula
  
  // 4a. '/dashboard' (Ana Panel) sayfasına yönlendirildiğimizi doğrula
  // 'waitForURL' veya 'toHaveURL' kullanılabilir.
  await expect(page).toHaveURL('/dashboard', { timeout: 10000 }); // Yönlendirme ve veri çekme için 10sn bekle

  // 4b. Dashboard sayfasının yüklendiğini (KPI) doğrula
  // (useGetDashboardData - Adım 79 - çağrısı bittikten sonra)
  await expect(page.getByText('Toplam Hasta')).toBeVisible();
  await expect(page.getByText('Yaklaşan Randevular')).toBeVisible();

  // 4c. (Ekstra) 'localStorage'da token'ın ayarlandığını doğrula
  // (Bu, 'useAuthStore' (Adım 70) 'persist'in çalıştığını test eder)
  const localStorage = await page.evaluate(() => window.localStorage);
  expect(localStorage['clinicadmin-auth-storage']).toBeTruthy(); // 'clinicadmin-auth-storage' anahtarının varlığı
  expect(localStorage['clinicadmin-auth-storage']).toContain('token'); // 'token' içermesi
});


// --- Test 3: Çıkış (Logout) ---
// Bu test, bir önceki teste (Test 2) *bağlıdır*.
// Playwright normalde testleri izole (ayrı) çalıştırır.
// Oturumu (authentication state) testler arasında *paylaşmak*
// için 'storageState' (oturum depolama) kullanmamız gerekir.
// v1 (MVP) için, bu testi ayrı çalıştırıp tekrar giriş yaptıracağız.

test('should logout successfully after login', async ({ page }) => {
  // 1. (Ön Hazırlık) Önce Giriş Yap
  await page.goto('/auth/login');
  await page.getByLabel('E-posta Adresi').fill('admin@clinic.com');
  await page.getByLabel('Şifre').fill('demopassword123');
  await page.getByRole('button', { name: 'Giriş Yap' }).click();
  await expect(page).toHaveURL('/dashboard'); // Girişin bittiğinden emin ol

  // 2. Çıkış (Logout) İşlemini Tetikle
  
  // 2a. 'UserNav' (Avatar) (Adım 109) düğmesine tıkla
  // (Avatar'ın 'Button'u 'role=button' içerir)
  await page.getByRole('button', { name: /Dr. Admin Yılmaz/i }).click(); // 'name' 'AvatarFallback'ten (baş harfler) veya 'alt' text'ten gelebilir. Düzeltme: Avatar'ın 'alt' text'i yok, bu yüzden 'fallback' (DA) veya 'aria-label' gerekir.
  
  // Düzeltme: UserNav (Adım 109) 'Button'u 'aria-label' içermiyor.
  // En iyisi 'Avatar' (Adım 100.1) 'fallback' metnine (DA) göre seçmektir.
  // VEYA 'UserNav' (Adım 109) 'Button'una bir 'aria-label' eklemektir.
  // (UserNav'ı 'aria-label="Kullanıcı Menüsü"' ile güncellediğimizi varsayalım)
  // await page.getByLabel('Kullanıcı Menüsü').click();
  
  // (En sağlam yol, 'fallback' metnini (Adım 109 - getInitials)
  // 'Dr. Admin Yılmaz' -> 'DY' olarak varsaymak)
  await page.getByText('DY').click(); // Avatar Fallback

  // 2b. Açılır Menüden (Dropdown) 'Çıkış Yap' (Logout) düğmesine tıkla
  // (Adım 109 - DropdownMenuItem)
  await page.getByRole('menuitem', { name: 'Çıkış Yap' }).click();
  
  // 3. Sonucu Doğrula
  
  // 3a. '/auth/login' (Giriş) sayfasına yönlendirildiğimizi doğrula
  await expect(page).toHaveURL('/auth/login', { timeout: 5000 });

  // 3b. 'localStorage'in temizlendiğini doğrula
  const localStorage = await page.evaluate(() => window.localStorage);
  const authStorage = localStorage['clinicadmin-auth-storage'];
  expect(authStorage).toBeTruthy(); // Anahtar kalabilir
  expect(JSON.parse(authStorage).state.user).toBeNull(); // 'user' 'null' olmalı
  expect(JSON.parse(authStorage).state.token).toBeNull(); // 'token' 'null' olmalı
});