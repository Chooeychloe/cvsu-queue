// Run with: npm run seed
// Creates sample staff accounts (all password "password123") plus one
// admin account (username "admin", password "admin123"). Safe to re-run --
// existing usernames just get their password re-hashed.
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';

const STAFF_PASSWORD = 'password123';
const ADMIN_PASSWORD = 'admin123';

// Registrar has 3 windows -- one bound account per window.
// Every other office has 1 window, so its single staff account is bound to it too.
const SAMPLE_STAFF = [
  { officeCode: 'REG', windowNumber: 1, fullName: 'Registrar Staff 1', username: 'registrar1' },
  { officeCode: 'REG', windowNumber: 2, fullName: 'Registrar Staff 2', username: 'registrar2' },
  { officeCode: 'REG', windowNumber: 3, fullName: 'Registrar Staff 3', username: 'registrar3' },
  { officeCode: 'CAS', windowNumber: 1, fullName: 'Cashier Staff', username: 'cashier1' },
  { officeCode: 'ADM', windowNumber: 1, fullName: 'Admissions Staff', username: 'admissions1' },
  { officeCode: 'IT', windowNumber: 1, fullName: 'IT Help Desk Staff', username: 'ithelpdesk1' },
  { officeCode: 'CLI', windowNumber: 1, fullName: 'Clinic Staff', username: 'clinic1' },
];

async function seed() {
  const staffHash = await bcrypt.hash(STAFF_PASSWORD, 10);
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  for (const s of SAMPLE_STAFF) {
    const [[office]] = await pool.query('SELECT id FROM offices WHERE code = ?', [s.officeCode]);
    if (!office) {
      console.warn(`Office ${s.officeCode} not found, skipping ${s.username}`);
      continue;
    }
    const [[win]] = await pool.query(
      'SELECT id FROM windows WHERE office_id = ? AND window_number = ?',
      [office.id, s.windowNumber]
    );

    await pool.query(
      `INSERT INTO staff (office_id, window_id, full_name, username, password_hash, role)
       VALUES (?, ?, ?, ?, ?, 'STAFF')
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), window_id = VALUES(window_id)`,
      [office.id, win?.id || null, s.fullName, s.username, staffHash]
    );
    console.log(`Seeded staff: ${s.username} / ${STAFF_PASSWORD} (Window ${s.windowNumber})`);
  }

  // Admin account -- not tied to a single office/window; attach to Registrar
  // as a home office (admins manage every office from the admin panel regardless).
  const [[registrar]] = await pool.query("SELECT id FROM offices WHERE code = 'REG'");
  await pool.query(
    `INSERT INTO staff (office_id, window_id, full_name, username, password_hash, role)
     VALUES (?, NULL, 'System Admin', 'admin', ?, 'ADMIN')
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
    [registrar.id, adminHash]
  );
  console.log(`Seeded admin: admin / ${ADMIN_PASSWORD}`);

  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
