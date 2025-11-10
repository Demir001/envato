import Database from 'better-sqlite3';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Determine the database path
// Use demo.db in development (as specified in docker-compose/docs)
// Use the main db path for production
const dbPath =
  process.env.NODE_ENV === 'test'
    ? ':memory:' // Use in-memory DB for tests
    : process.env.NODE_ENV === 'development'
      ? path.resolve(__dirname, '../../', process.env.DEMO_DB_PATH || 'data/clinicadmin-demo.db')
      : path.resolve(__dirname, '../../', process.env.DB_PATH || 'data/clinicadmin.db');

// Ensure the data directory exists (especially for production)
if (process.env.NODE_ENV !== 'test') {
  const fs = require('fs');
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`Created data directory: ${dataDir}`);
  }
}

// Initialize the database instance
const db = new Database(dbPath, {
  // verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
});

// Enable Write-Ahead Logging for better concurrency and performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/**
 * Initializes the database schema.
 * Creates all necessary tables if they don't exist.
 */
export const initDb = () => {
  try {
    const createSchemaStatement = db.transaction(() => {
      // --- Users & Clinics (Tenants) ---
      // tenantId is the "clinicId"
      db.exec(`
        CREATE TABLE IF NOT EXISTS clinics (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          address TEXT,
          phone TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tenantId TEXT NOT NULL,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          password TEXT NOT NULL,
          role TEXT CHECK(role IN ('admin', 'doctor', 'reception')) NOT NULL,
          specialty TEXT, -- Doctors only
          phone TEXT,
          isActive BOOLEAN DEFAULT 1,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (tenantId) REFERENCES clinics (id) ON DELETE CASCADE,
          UNIQUE (email, tenantId)
        );
      `);

      // --- Patient Management ---
      db.exec(`
        CREATE TABLE IF NOT EXISTS patients (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tenantId TEXT NOT NULL,
          name TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          dob TEXT, -- ISO Date string
          gender TEXT CHECK(gender IN ('male', 'female', 'other')),
          address TEXT,
          bloodGroup TEXT,
          notes TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (tenantId) REFERENCES clinics (id) ON DELETE CASCADE
        );
      `);

      // --- Appointments ---
      db.exec(`
        CREATE TABLE IF NOT EXISTS appointments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tenantId TEXT NOT NULL,
          patientId INTEGER NOT NULL,
          doctorId INTEGER NOT NULL,
          receptionistId INTEGER, -- Who booked it?
          title TEXT, -- Often "Consultation with [Patient Name]"
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

      // --- Billing & Payments ---
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

      // --- Inventory (Stock Management) ---
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

      // --- Settings ---
      db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
          id INTEGER PRIMARY KEY,
          tenantId TEXT NOT NULL UNIQUE,
          clinicName TEXT,
          openingHours TEXT, -- JSON: {"mon": "09:00-17:00", "tue": ...}
          holidays TEXT, -- JSON: ["YYYY-MM-DD", "YYYY-MM-DD"]
          currencySymbol TEXT DEFAULT '$',
          FOREIGN KEY (tenantId) REFERENCES clinics (id) ON DELETE CASCADE
        );
      `);
    });

    createSchemaStatement();
  } catch (error) {
    console.error('Error initializing database schema:', error);
    throw error;
  }
};

/**
 * Returns the active database instance.
 */
export const getDb = () => db;

// Close the connection gracefully on exit
process.on('exit', () => db.close());
process.on('SIGINT', () => db.close());
process.on('SIGUSR1', () => db.close());
process.on('SIGUSR2', () => db.close());
process.on('uncaughtException', (err) => {
  console.error(err);
  db.close();
  process.exit(1);
});