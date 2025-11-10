import { test, expect, Page } from '@playwright/test';
import { fakerTR as faker } from '@faker-js/faker';

/**
 * Playwright E2E (Uçtan Uca) Testi - Hasta Yönetimi (CRUD)
 *
 * Bu, Kriter 3'te istenen *ikinci* E2E testidir.
 *
 * Sorumlulukları:
 * 1. 'Resepsiyon' (veya Admin) olarak giriş yapmak.
 * 2. Hasta listesi sayfasına gitmek.
 * 3. "Yeni Hasta Ekle" düğmesine tıklamak.
 * 4. Yeni hasta formunu (patient-form) doldurmak.
 * 5. Kaydetmek ve listeye yönlendirilmek (redirect).
 * 6. Yeni oluşturulan hastayı listede (arama yaparak) bulmak.
 */

// --- Yardımcı (Helper) Fonksiyon: Giriş (Login) ---
// Bu fonksiyon, 'Resepsiyon' rolüyle (yeni hasta ekleme yetkisi olan)
// hızlıca giriş yapar. (Test tekrarını önler).
async function loginAsReception(page: Page) {
  await page.goto('/auth/login');
  await page.getByLabel('E-posta Adresi').fill('reception@clinic.com');
  await page.getByLabel('Şifre').fill('demopassword123');
  await page.getByRole('button', { name: 'Giriş Yap' }).click();
  // Dashboard'un yüklendiğinden emin ol
  await expect(page).toHaveURL('/dashboard');
  await expect(page.getByText('Toplam Hasta')).toBeVisible();
}

// --- Test: Hasta Oluşturma (Create) ve Okuma (Read) ---
test('should create a new patient and find them in the list', async ({
  page,
}) => {
  // 1. (Ön Hazırlık) Resepsiyon olarak giriş yap
  await loginAsReception(page);

  // 2. Hasta Listesi Sayfasına Git
  // (Sidebar'daki (Adım 107) linke tıkla)
  await page.getByRole('link', { name: 'Hastalar' }).click();

  // 3. Sayfanın Yüklendiğini Doğrula
  // ('patient-list-page.tsx' - Adım 117)
  await expect(page).toHaveURL('/patients');
  await expect(
    page.getByRole('heading', { name: 'Tüm Hastalar' }),
  ).toBeVisible();

  // 4. "Yeni Hasta Ekle" Düğmesine Tıkla
  // ('patient-data-table.tsx' - Adım 118)
  await page.getByRole('button', { name: 'Yeni Hasta Ekle' }).click();

  // 5. "Yeni Hasta Ekle" Sayfasına Yönlendirmeyi Doğrula
  // ('patient-create-page.tsx' - Adım 121)
  await expect(page).toHaveURL('/patients/new');
  await expect(
    page.getByRole('heading', { name: 'Yeni Hasta Ekle' }),
  ).toBeVisible();

  // 6. Formu Doldur (patient-form.tsx - Adım 120)
  // 'faker-js' (fakerTR) kullanarak rastgele (random)
  // bir test hastası oluştur.
  const newPatientName = `${faker.person.firstName()} ${faker.person.lastName()}`;
  const newPatientEmail = faker.internet.email().toLowerCase();
  const newPatientPhone = faker.phone.number();

  // 'FormLabel' (Adım 88/89) 'Input' (Adım 87) ile 'htmlFor'
  // aracılığıyla bağlı olduğu için 'getByLabel' kullanabiliriz.
  await page.getByLabel('Adı Soyadı *').fill(newPatientName);
  await page.getByLabel('E-posta Adresi').fill(newPatientEmail);
  await page.getByLabel('Telefon Numarası').fill(newPatientPhone);
  
  // (Opsiyonel: Diğer alanlar)
  await page.getByLabel('Doğum Tarihi (YYYY-AA-GG)').fill('1990-05-15');
  
  // 'Select' (Seçim) kutusu (getByLabel ile alınamaz, rolü (role) kullanılır)
  await page.getByRole('combobox', { name: 'Cinsiyet' }).click();
  await page.getByRole('option', { name: 'Erkek' }).click();

  // 7. Formu Kaydet (Submit)
  // 'Button' (Adım 86) 'isLoading' (kaydediliyor)
  // durumunu yönetir (Playwright bunu bekler).
  await page.getByRole('button', { name: 'Hastayı Kaydet' }).click();

  // 8. Listeye Geri Yönlendirmeyi (Redirect) Doğrula
  // (Formun 'onSuccess' (Adım 121) yönlendirmesi)
  await expect(page).toHaveURL('/patients');

  // 9. Yeni Hastayı Listede Bul (Arama Filtresi)
  
  // 9a. Başarı bildirimini (toast) (opsiyonel) doğrula
  await expect(page.getByText('Hasta başarıyla oluşturuldu.')).toBeVisible();
  
  // 9b. Arama (Search) Input'unu (Adım 118) doldur
  await page
    .getByPlaceholder('Hastaları ada, e-postaya veya telefona göre ara...')
    .fill(newPatientName);

  // 10. Sonucu Doğrula
  
  // Arama (debounce) ve API (useGetPatients)
  // çağrısının bitmesini bekle (timeout artırılabilir).
  // Tablonun (Adım 118/119) *sadece*
  // aradığımız hastayı göstermesini bekle.
  await expect(page.getByRole('cell', { name: newPatientName })).toBeVisible({
    timeout: 10000,
  });
  
  // (Opsiyonel) E-postanın da aynı satırda olduğunu doğrula
  await expect(page.getByRole('cell', { name: newPatientEmail })).toBeVisible();
});