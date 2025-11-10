// --- /server/src/config/seed.ts ---
// BU, TÜM TABLOLARI ve DÜZELTİLMİŞ FAKER'I İÇEREN TAM KODDUR.

import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fakerTR as faker } from '@faker-js/faker';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Demo veritabanı yolunu al
const dbPath = path.resolve(
  __dirname,
  '../../',
  process.env.DEMO_DB_PATH || 'data/clinicadmin-demo.db',
);

// Veritabanını silip yeniden oluştur (temiz bir başlangıç için)
try {
  const fs = require('fs');
  // Veri klasörünün var olduğundan emin ol
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`Veri klasörü oluşturuldu: ${dataDir}`);
  }
  // Eski demo DB dosyasını sil
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('Eski demo veritabanı silindi.');
  }
} catch (error) {
  console.error('Demo DB silinirken hata oluştu:', error);
  process.exit(1);
}

const db = new Database(dbPath);
console.log('Demo veritabanı bağlandı:', dbPath);

/**
 * applySchema
 * 'database.ts' (Adım 15) içindeki TÜM TABLOLARI oluşturur.
 */
const applySchema = () => {
  try {
    const createSchemaStatement = db.transaction(() => {
      db.pragma('journal_mode = WAL');
      db.pragma('foreign_keys = ON');

      // 1. Clinics (Tenants)
      db.exec(`
        CREATE TABLE IF NOT EXISTS clinics (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          address TEXT,
          phone TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 2. Users (Personel)
      db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tenantId TEXT NOT NULL,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          password TEXT NOT NULL,
          role TEXT CHECK(role IN ('admin', 'doctor', 'reception')) NOT NULL,
          specialty TEXT,
          phone TEXT,
          isActive BOOLEAN DEFAULT 1,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (tenantId) REFERENCES clinics (id) ON DELETE CASCADE,
          UNIQUE (email, tenantId)
        );
      `);

      // 3. Patients (Hastalar)
      db.exec(`
        CREATE TABLE IF NOT EXISTS patients (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tenantId TEXT NOT NULL,
          name TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          dob TEXT,
          gender TEXT CHECK(gender IN ('male', 'female', 'other')),
          address TEXT,
          bloodGroup TEXT,
          notes TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (tenantId) REFERENCES clinics (id) ON DELETE CASCADE
        );
      `);

      // 4. Appointments (Randevular)
      db.exec(`
        CREATE TABLE IF NOT EXISTS appointments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tenantId TEXT NOT NULL,
          patientId INTEGER NOT NULL,
          doctorId INTEGER NOT NULL,
          receptionistId INTEGER,
          title TEXT,
          start DATETIME NOT NULL,
          end DATETIME NOT NULL,
          status TEXT CHECK(status IN ('scheduled', 'completed', 'cancelled', 'noshow')) DEFAULT 'scheduled',
          notes TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (tenantId) REFERENCES clinics (id) ON DELETE CASCADE,
          FOREIGN KEY (patientId) REFERENCES patients (id) ON DELETE CASCADE,
          FOREIGN KEY (doctorId) REFERENCES users (id) ON DELETE CASCADE,
          FOREIGN KEY (receptionistId) REFERENCES users (id) ON DELETE SET NULL
        );
      `);

      // 5. Invoices (Faturalar)
      db.exec(`
        CREATE TABLE IF NOT EXISTS invoices (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tenantId TEXT NOT NULL,
          patientId INTEGER NOT NULL,
          invoiceNumber TEXT NOT NULL UNIQUE,
          issueDate TEXT NOT NULL,
          dueDate TEXT NOT NULL,
          totalAmount REAL NOT NULL,
          status TEXT CHECK(status IN ('pending', 'paid', 'overdue')) DEFAULT 'pending',
          notes TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (tenantId) REFERENCES clinics (id) ON DELETE CASCADE,
          FOREIGN KEY (patientId) REFERENCES patients (id) ON DELETE CASCADE
        );
      `);

      // 6. Invoice Items (Fatura Kalemleri)
      db.exec(`
        CREATE TABLE IF NOT EXISTS invoice_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          invoiceId INTEGER NOT NULL,
          description TEXT NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 1,
          unitPrice REAL NOT NULL,
          total REAL NOT NULL,
          FOREIGN KEY (invoiceId) REFERENCES invoices (id) ON DELETE CASCADE
        );
      `);

      // 7. Inventory Items (Stok Kalemleri)
      db.exec(`
        CREATE TABLE IF NOT EXISTS inventory_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tenantId TEXT NOT NULL,
          name TEXT NOT NULL,
          category TEXT,
          quantity INTEGER NOT NULL DEFAULT 0,
          lowStockThreshold INTEGER NOT NULL DEFAULT 10,
          supplier TEXT,
          lastRestockDate TEXT,
          FOREIGN KEY (tenantId) REFERENCES clinics (id) ON DELETE CASCADE,
          UNIQUE(name, tenantId)
        );
      `);

      // 8. Settings (Ayarlar)
      db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
          id INTEGER PRIMARY KEY,
          tenantId TEXT NOT NULL UNIQUE,
          clinicName TEXT,
          openingHours TEXT,
          holidays TEXT,
          currencySymbol TEXT DEFAULT '$',
          FOREIGN KEY (tenantId) REFERENCES clinics (id) ON DELETE CASCADE
        );
      `);
    });

    createSchemaStatement();
    console.log('Veritabanı şeması (TÜM TABLOLAR) başarıyla oluşturuldu.');
  } catch (error) {
    console.error('Şema oluşturulurken hata oluştu:', error);
    throw error;
  }
};

// Seed işlemini başlat
const runSeed = () => {
  try {
    applySchema();

    const tenantId = 'demo-clinic-123';
    const patientIds: number[] = [];
    const doctorIds: number[] = [];

    // --- 1. Demo Kliniği Oluştur (Tenant) ---
    db.prepare(`INSERT INTO clinics (id, name, address, phone) VALUES (?, ?, ?, ?)`).run(
      tenantId,
      'Gemini Demo Kliniği',
      faker.location.streetAddress(),
      faker.phone.number(),
    );
    console.log(`Demo kliniği oluşturuldu: ${tenantId}`);

    // --- 2. Demo Kullanıcıları (Admin, Doktor, Resepsiyon) ---
    const hashPassword = (pass: string) => bcrypt.hashSync(pass, 10);
    const demoPassword = process.env.DEMO_ADMIN_PASSWORD || 'demopassword123';
    const hashedPassword = hashPassword(demoPassword);

    const stmtUsers = db.prepare(
      `INSERT INTO users (tenantId, name, email, password, role, specialty, phone) 
       VALUES (@tenantId, @name, @email, @password, @role, @specialty, @phone)`,
    );

    stmtUsers.run({
      tenantId,
      name: 'Dr. Admin Yılmaz',
      email: process.env.DEMO_ADMIN_EMAIL || 'admin@clinic.com',
      password: hashedPassword,
      role: 'admin',
      specialty: 'Genel Yönetim',
      phone: faker.phone.number(),
    });

    const reception = stmtUsers.run({
      tenantId,
      name: 'Resepsiyon Görevlisi',
      email: 'reception@clinic.com',
      password: hashedPassword,
      role: 'reception',
      specialty: null,
      phone: faker.phone.number(),
    });

    // --- 3. Doktorları Oluştur (İstenen 10 adet) ---
    const specialties = [
      'Kardiyoloji', 'Pediatri', 'Dermatoloji', 'Nöroloji', 'Ortopedi',
      'Göz Hastalıkları', 'Dahiliye', 'Radyoloji', 'Psikiyatri', 'Diş Hekimi',
    ];

    for (let i = 0; i < 10; i++) {
      const info = stmtUsers.run({
        tenantId,
        name: `Dr. ${faker.person.firstName()} ${faker.person.lastName()}`,
        email: `doctor${i}@clinic.com`,
        password: hashedPassword,
        role: 'doctor',
        specialty: specialties[i % specialties.length],
        phone: faker.phone.number(),
      });
      doctorIds.push(info.lastInsertRowid as number);
    }
    console.log(`${doctorIds.length} demo doktor oluşturuldu.`);

    // --- 4. Hastaları Oluştur (İstenen 50 adet) ---
    const stmtPatients = db.prepare(
      `INSERT INTO patients (tenantId, name, email, phone, dob, gender, address, bloodGroup)
       VALUES (@tenantId, @name, @email, @phone, @dob, @gender, @address, @bloodGroup)`,
    );
    
    // --- DÜZELTME BAŞLANGIÇ (Faker Hata 1) ---
    // 'faker.person.firstName' 'other' cinsiyetini desteklemiyor.
    const genders: ('male' | 'female')[] = ['male', 'female'];
    // --- DÜZELTME SONU ---
    
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

    for (let i = 0; i < 50; i++) {
      const gender = faker.helpers.arrayElement(genders);
      const info = stmtPatients.run({
        tenantId,
        name: `${faker.person.firstName(gender)} ${faker.person.lastName()}`, // 'gender' burada kullanılıyor
        email: faker.internet.email(),
        phone: faker.phone.number(),
        dob: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }).toISOString().split('T')[0],
        gender: gender,
        address: faker.location.streetAddress(),
        bloodGroup: faker.helpers.arrayElement(bloodGroups),
      });
      patientIds.push(info.lastInsertRowid as number);
    }
    console.log(`${patientIds.length} demo hasta oluşturuldu.`);

    // --- 5. Randevuları Oluştur (İstenen 200 adet) ---
    const stmtAppointments = db.prepare(
      `INSERT INTO appointments (tenantId, patientId, doctorId, receptionistId, title, start, end, status, notes)
       VALUES (@tenantId, @patientId, @doctorId, @receptionistId, @title, @start, @end, @status, @notes)`,
    );
    const statuses: ('scheduled' | 'completed' | 'cancelled' | 'noshow')[] = [
      'scheduled', 'completed', 'cancelled', 'noshow',
    ];
    const now = new Date();

    for (let i = 0; i < 200; i++) {
      const patientId = faker.helpers.arrayElement(patientIds);
      const doctorId = faker.helpers.arrayElement(doctorIds);
      
      const daysToAdd = faker.number.int({ min: -30, max: 30 });
      const start = new Date();
      start.setDate(now.getDate() + daysToAdd);
      start.setHours(faker.number.int({ min: 9, max: 16 }));
      start.setMinutes(faker.helpers.arrayElement([0, 15, 30, 45]));
      start.setSeconds(0);
      start.setMilliseconds(0);
      const end = new Date(start.getTime() + 30 * 60000); // 30 dk randevu

      let status = faker.helpers.arrayElement(statuses);
      if (start < now) {
        if (status === 'scheduled') status = faker.helpers.arrayElement(['completed', 'cancelled', 'noshow']);
      } else {
        if (status === 'completed' || status === 'noshow') status = faker.helpers.arrayElement(['scheduled', 'cancelled']);
      }

      stmtAppointments.run({
        tenantId,
        patientId,
        doctorId,
        receptionistId: reception.lastInsertRowid,
        title: 'Konsültasyon',
        start: start.toISOString(),
        end: end.toISOString(),
        status: status,
        notes: status === 'cancelled' ? 'Hasta aradı, iptal etti.' : 'Rutin kontrol.',
      });
    }
    console.log('200 demo randevu oluşturuldu.');

    // --- 6. Stok Kalemleri Oluştur ---
    const stmtInventory = db.prepare(
      `INSERT INTO inventory_items (tenantId, name, category, quantity, lowStockThreshold, supplier)
       VALUES (@tenantId, @name, @category, @quantity, @lowStockThreshold, @supplier)`,
    );
    const items = [
      'Aspirin 100mg', 'Parasetamol 500mg', 'Cerrahi Maske (Kutu)', 'Eldiven (Kutu)', 
      'Dezenfektan 1L', 'Sargı Bezi (Rulo)', 'Vitamin D (Kutu)', 'B12 İğnesi (Kutu)', 
      'Şırınga 10ml (Kutu)', 'Tansiyon Aleti', 'Stetoskop', 'Ateş Ölçer'
    ];
    for (const item of items) {
      stmtInventory.run({
        tenantId,
        name: item,
        category: (item.includes('İlaç') || item.includes('mg') || item.includes('Vitamin')) ? 'İlaçlar' : 'Sarf Malzemeler',
        quantity: faker.number.int({ min: 5, max: 200 }),
        lowStockThreshold: 15,
        supplier: faker.company.name(),
      });
    }
    console.log(`${items.length} demo stok kalemi oluşturuldu.`);

    // --- 7. Faturaları Oluştur ---
    const stmtInvoice = db.prepare(
      `INSERT INTO invoices (tenantId, patientId, invoiceNumber, issueDate, dueDate, totalAmount, status)
       VALUES (@tenantId, @patientId, @invoiceNumber, @issueDate, @dueDate, @totalAmount, @status)`,
    );
    const stmtInvoiceItem = db.prepare(
      `INSERT INTO invoice_items (invoiceId, description, quantity, unitPrice, total)
       VALUES (@invoiceId, @description, @quantity, @unitPrice, @total)`,
    );
    const invoiceStatuses = ['pending', 'paid', 'overdue'];
    
    for (let i = 0; i < 30; i++) {
      const patientId = faker.helpers.arrayElement(patientIds);
      const issueDate = faker.date.past({ years: 1 }).toISOString().split('T')[0];
      
      // --- DÜZELTME BAŞLANGIÇ (Faker Hata 2) ---
      // 'faker.date.future' yerine 'faker.date.soon' (gün bazlı) kullan.
      const dueDate = faker.date.soon({ days: 30, refDate: issueDate }).toISOString().split('T')[0];
      // --- DÜZELTME SONU ---
      
      const totalAmount = faker.finance.amount({ min: 100, max: 1000, dec: 0 });
      
      const info = stmtInvoice.run({
        tenantId,
        patientId,
        invoiceNumber: `INV-2024-00${i + 1}`, // Basit sıralı
        issueDate,
        dueDate,
        totalAmount,
        status: faker.helpers.arrayElement(invoiceStatuses),
      });
      const invoiceId = info.lastInsertRowid as number;

      // Her faturaya 1-2 kalem ekle
      stmtInvoiceItem.run({
         invoiceId,
         description: 'Muayene Ücreti',
         quantity: 1,
         unitPrice: totalAmount,
         total: totalAmount
      });
    }
    console.log('30 demo fatura oluşturuldu.');
    
    // --- 8. Ayarları Oluştur ---
    const defaultDay = (isOpen: boolean) => ({ open: '09:00', close: '17:00', isOpen });
    const defaultHours = {
      mon: defaultDay(true), tue: defaultDay(true), wed: defaultDay(true),
      thu: defaultDay(true), fri: defaultDay(true), sat: defaultDay(false),
      sun: defaultDay(false),
    };
    db.prepare(
      `INSERT INTO settings (tenantId, clinicName, openingHours, holidays, currencySymbol)
       VALUES (@tenantId, @clinicName, @openingHours, @holidays, @currencySymbol)`,
    ).run({
      tenantId,
      clinicName: 'Gemini Demo Kliniği',
      openingHours: JSON.stringify(defaultHours),
      holidays: JSON.stringify(['2025-01-01', '2025-04-23']),
      currencySymbol: '₺',
    });
    console.log('Varsayılan klinik ayarları oluşturuldu.');


    console.log('\n--- DEMO VERİ OLUŞTURMA TAMAMLANDI ---');
    console.log('Demo Admin: admin@clinic.com');
    console.log(`Demo Şifre: ${demoPassword}`);
    console.log('------------------------------------');

  } catch (error) {
    console.error('Seed işlemi sırasında hata oluştu:', error);
  } finally {
    db.close();
    console.log('Veritabanı bağlantısı kapatıldı.');
  }
};

// Seed script'ini çalıştır
runSeed();