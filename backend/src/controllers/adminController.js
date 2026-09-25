import bcrypt from 'bcryptjs';
import pool from '../config/db.js';

// ------------------------------------------------------------
// OFFICES
// ------------------------------------------------------------
export async function listOfficesAdmin(req, res) {
  try {
    const [offices] = await pool.query(
      `SELECT o.*, COUNT(w.id) AS actual_window_count
       FROM offices o LEFT JOIN windows w ON w.office_id = o.id
       GROUP BY o.id ORDER BY o.name`
    );
    res.json({ offices });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch offices.' });
  }
}

export async function createOffice(req, res) {
  const { code, name, prefix, initialWindowCount = 1 } = req.body;
  if (!code || !name || !prefix) {
    return res.status(400).json({ message: 'code, name, and prefix are required.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const normalizedPrefix = prefix.toUpperCase().endsWith('-') ? prefix.toUpperCase() : `${prefix.toUpperCase()}-`;
    const [result] = await conn.query(
      `INSERT INTO offices (code, name, prefix, window_count) VALUES (?, ?, ?, ?)`,
      [code.toUpperCase(), name, normalizedPrefix, initialWindowCount]
    );
    const officeId = result.insertId;

    for (let i = 1; i <= initialWindowCount; i++) {
      await conn.query(
        `INSERT INTO windows (office_id, window_number, label) VALUES (?, ?, ?)`,
        [officeId, i, `${name} - Window ${i}`]
      );
    }

    await conn.commit();
    res.status(201).json({ message: 'Office created.', officeId });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'An office with that code already exists.' });
    }
    res.status(500).json({ message: 'Failed to create office.' });
  } finally {
    conn.release();
  }
}

export async function updateOffice(req, res) {
  const { id } = req.params;
  const { name, prefix, is_active } = req.body;

  const fields = [];
  const values = [];
  if (name !== undefined) { fields.push('name = ?'); values.push(name); }
  if (prefix !== undefined) { fields.push('prefix = ?'); values.push(prefix.endsWith('-') ? prefix : `${prefix}-`); }
  if (is_active !== undefined) { fields.push('is_active = ?'); values.push(is_active ? 1 : 0); }
  if (fields.length === 0) return res.status(400).json({ message: 'Nothing to update.' });

  try {
    await pool.query(`UPDATE offices SET ${fields.join(', ')} WHERE id = ?`, [...values, id]);
    res.json({ message: 'Office updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update office.' });
  }
}

// ------------------------------------------------------------
// WINDOWS
// ------------------------------------------------------------
export async function addWindow(req, res) {
  const { officeId } = req.params;
  try {
    const [[{ nextNum }]] = await pool.query(
      `SELECT COALESCE(MAX(window_number), 0) + 1 AS nextNum FROM windows WHERE office_id = ?`,
      [officeId]
    );
    const [[office]] = await pool.query(`SELECT name FROM offices WHERE id = ?`, [officeId]);
    if (!office) return res.status(404).json({ message: 'Office not found.' });

    await pool.query(
      `INSERT INTO windows (office_id, window_number, label) VALUES (?, ?, ?)`,
      [officeId, nextNum, `${office.name} - Window ${nextNum}`]
    );
    res.status(201).json({ message: 'Window added.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to add window.' });
  }
}

// Toggle a window between AVAILABLE and OFFLINE. Cannot offline a busy window.
export async function setWindowStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;
  if (!['AVAILABLE', 'OFFLINE'].includes(status)) {
    return res.status(400).json({ message: 'status must be AVAILABLE or OFFLINE.' });
  }

  try {
    const [[win]] = await pool.query(`SELECT * FROM windows WHERE id = ?`, [id]);
    if (!win) return res.status(404).json({ message: 'Window not found.' });
    if (win.status === 'BUSY' && status === 'OFFLINE') {
      return res.status(409).json({ message: 'This window is currently serving a ticket. Complete or skip it first.' });
    }

    await pool.query(`UPDATE windows SET status = ? WHERE id = ?`, [status, id]);
    res.json({ message: `Window set to ${status}.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update window.' });
  }
}

export async function deleteWindow(req, res) {
  const { id } = req.params;
  try {
    const [[win]] = await pool.query(`SELECT * FROM windows WHERE id = ?`, [id]);
    if (!win) return res.status(404).json({ message: 'Window not found.' });
    if (win.status === 'BUSY') {
      return res.status(409).json({ message: 'Cannot remove a window that is currently serving a ticket.' });
    }
    await pool.query(`DELETE FROM windows WHERE id = ?`, [id]);
    res.json({ message: 'Window removed.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to remove window.' });
  }
}

// ------------------------------------------------------------
// STAFF
// ------------------------------------------------------------
export async function listStaff(req, res) {
  try {
    const [staff] = await pool.query(
      `SELECT s.id, s.full_name, s.username, s.role, s.is_active, s.office_id, s.window_id,
              o.name AS office_name, o.code AS office_code, w.label AS window_label
       FROM staff s
       JOIN offices o ON o.id = s.office_id
       LEFT JOIN windows w ON w.id = s.window_id
       ORDER BY o.name, s.full_name`
    );
    res.json({ staff });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch staff.' });
  }
}

export async function createStaff(req, res) {
  const { officeId, windowId, fullName, username, password, role = 'STAFF' } = req.body;
  if (!officeId || !fullName || !username || !password) {
    return res.status(400).json({ message: 'officeId, fullName, username, and password are required.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters.' });
  }

  try {
    if (windowId) {
      const [[win]] = await pool.query(`SELECT id FROM windows WHERE id = ? AND office_id = ?`, [windowId, officeId]);
      if (!win) return res.status(400).json({ message: 'That window does not belong to the selected office.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO staff (office_id, window_id, full_name, username, password_hash, role)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [officeId, windowId || null, fullName, username, hash, role]
    );
    res.status(201).json({ message: 'Staff account created.', staffId: result.insertId });
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'That username is already taken.' });
    }
    res.status(500).json({ message: 'Failed to create staff account.' });
  }
}

export async function updateStaff(req, res) {
  const { id } = req.params;
  const { fullName, windowId, role, is_active } = req.body;

  try {
    if (windowId) {
      const [[staffRow]] = await pool.query(`SELECT office_id FROM staff WHERE id = ?`, [id]);
      if (!staffRow) return res.status(404).json({ message: 'Staff account not found.' });
      const [[win]] = await pool.query(`SELECT id FROM windows WHERE id = ? AND office_id = ?`, [windowId, staffRow.office_id]);
      if (!win) return res.status(400).json({ message: "That window does not belong to this staff member's office." });
    }

    const fields = [];
    const values = [];
    if (fullName !== undefined) { fields.push('full_name = ?'); values.push(fullName); }
    if (windowId !== undefined) { fields.push('window_id = ?'); values.push(windowId || null); }
    if (role !== undefined) { fields.push('role = ?'); values.push(role); }
    if (is_active !== undefined) { fields.push('is_active = ?'); values.push(is_active ? 1 : 0); }
    if (fields.length === 0) return res.status(400).json({ message: 'Nothing to update.' });

    await pool.query(`UPDATE staff SET ${fields.join(', ')} WHERE id = ?`, [...values, id]);
    res.json({ message: 'Staff account updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update staff account.' });
  }
}

export async function resetStaffPassword(req, res) {
  const { id } = req.params;
  const { password } = req.body;
  if (!password || password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters.' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(`UPDATE staff SET password_hash = ? WHERE id = ?`, [hash, id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Staff account not found.' });
    res.json({ message: 'Password reset.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to reset password.' });
  }
}
