import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.resolve(process.cwd(), 'hosp_emr.db');
console.log(`Initializing database at ${dbPath}`);
const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT, -- 'admin', 'doctor', 'lab', 'revenue'
    name TEXT,
    specialty TEXT
  );

  CREATE TABLE IF NOT EXISTS patients (
    patient_id TEXT PRIMARY KEY,
    name TEXT,
    age INTEGER,
    gender TEXT,
    contact TEXT,
    history TEXT
  );

  CREATE TABLE IF NOT EXISTS lab_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id TEXT,
    test_name TEXT,
    result_value REAL,
    timestamp DATETIME,
    FOREIGN KEY(patient_id) REFERENCES patients(patient_id)
  );

  CREATE TABLE IF NOT EXISTS medications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id TEXT,
    med_name TEXT,
    dosage TEXT,
    last_updated DATETIME,
    FOREIGN KEY(patient_id) REFERENCES patients(patient_id)
  );

  CREATE TABLE IF NOT EXISTS encounters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id TEXT,
    is_icu INTEGER,
    num_diagnoses INTEGER,
    num_services INTEGER,
    num_transfers INTEGER,
    timestamp DATETIME,
    FOREIGN KEY(patient_id) REFERENCES patients(patient_id)
  );

  CREATE TABLE IF NOT EXISTS verified_tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id TEXT,
    test_name TEXT,
    tns_score REAL,
    proof_hash TEXT,
    status TEXT, -- 'AUTO-APPROVED', 'DOCTOR-REVIEW', 'REJECTED'
    timestamp DATETIME,
    FOREIGN KEY(patient_id) REFERENCES patients(patient_id)
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id TEXT,
    doctor_id INTEGER,
    date TEXT,
    status TEXT, -- 'pending', 'completed', 'cancelled'
    query TEXT,
    diagnosis TEXT,
    prescription TEXT,
    FOREIGN KEY(patient_id) REFERENCES patients(patient_id),
    FOREIGN KEY(doctor_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id TEXT,
    amount REAL,
    reason TEXT,
    timestamp TEXT,
    hash TEXT,
    FOREIGN KEY(patient_id) REFERENCES patients(patient_id)
  );
`);

// Migration: Add 'query' column to 'appointments' if it doesn't exist
const tableInfo = db.prepare("PRAGMA table_info(appointments)").all() as any[];
const hasQueryColumn = tableInfo.some(col => col.name === 'query');
if (!hasQueryColumn) {
  db.exec("ALTER TABLE appointments ADD COLUMN query TEXT");
}

// Seed initial data if empty
const userCount = db.prepare('SELECT count(*) as count FROM users').get() as { count: number };
if (userCount.count === 0) {
  const bcrypt = await import('bcryptjs');
  const hashedPassword = await bcrypt.default.hash('password123', 10);
  
  const insertUser = db.prepare('INSERT INTO users (username, password, role, name, specialty) VALUES (?, ?, ?, ?, ?)');
  insertUser.run('admin', hashedPassword, 'admin', 'System Admin', null);
  insertUser.run('doctor1', hashedPassword, 'doctor', 'Dr. Smith', 'Cardiology');
  insertUser.run('lab1', hashedPassword, 'lab', 'Lab Tech John', null);
  insertUser.run('revenue1', hashedPassword, 'revenue', 'Finance Dept', null);

  const insertPatient = db.prepare('INSERT INTO patients (patient_id, name, age, gender, contact, history) VALUES (?, ?, ?, ?, ?, ?)');
  insertPatient.run('P001', 'John Doe', 62, 'M', '555-0101', 'Hypertension');
  insertPatient.run('P002', 'Alice Brown', 45, 'Female', '555-0102', 'Hypertension');
  insertPatient.run('P003', 'Bob Wilson', 32, 'Male', '555-0103', 'None');

  // Seed data from the user's request
  const now = new Date().toISOString();
  db.prepare("INSERT INTO encounters (patient_id, is_icu, num_diagnoses, num_services, num_transfers, timestamp) VALUES ('P001', 1, 12, 2, 3, ?)").run(now);
  
  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
  db.prepare("INSERT INTO lab_results (patient_id, test_name, result_value, timestamp) VALUES ('P001', 'Glucose', 115.0, ?)").run(fourHoursAgo);
  
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare("INSERT INTO medications (patient_id, med_name, dosage, last_updated) VALUES ('P001', 'Metformin', '500mg', ?)").run(monthAgo);

  const insertAppointment = db.prepare('INSERT INTO appointments (patient_id, doctor_id, date, status) VALUES (?, ?, ?, ?)');
  insertAppointment.run('P001', 2, now, 'pending');
}

export default db;
