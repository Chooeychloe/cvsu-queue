// Run with: npm run seed
// Creates one sample staff account per office, all with password "password123".
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';

const SAMPLE_STAFF = [
  { officeCode: 'REG', fullName: 'Registrar Staff', username: 'registrar1', role: 'STAFF' },
  { officeCode: 'CAS', fullName: 'Cashier Staff', username: 'cashier1', role: 'STAFF' },
  { officeCode: 'ADM', fullName: 'Admissions Staff', username: 'admissions1', role: 'STAFF' },
  { officeCode: 'IT', fullName: 'IT Help Desk Staff', username: 'ithelpdesk1', role: 'STAFF' },
  { officeCode: 'CLI', fullName: 'Clinic Staff', username: 'clinic1', role: 'STAFF' },
];

const PASSWORD = 'password123';

async function seed() {
  const hash = await bcrypt.hash(PASSWORD, 10);

  for (const s of SAMPLE_STAFF) {
    const [[office]] = await pool.query('SELECT id FROM offices WHERE code = ?', [s.officeCode]);
    if (!office) {
      console.warn(`Office ${s.officeCode} not found, skipping ${s.username}`);
      continue;
    }

    await pool.query(
      `INSERT INTO staff (office_id, full_name, username, password_hash, role)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
      [office.id, s.fullName, s.username, hash, s.role]
    );
    console.log(`Seeded staff: ${s.username} / ${PASSWORD}`);
  }

  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
