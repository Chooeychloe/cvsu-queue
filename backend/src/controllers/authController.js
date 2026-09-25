import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { JWT_SECRET } from '../middleware/auth.js';

export async function login(req, res) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT s.*, o.code AS office_code, o.name AS office_name
       FROM staff s JOIN offices o ON o.id = s.office_id
       WHERE s.username = ? AND s.is_active = 1`,
      [username]
    );

    const staff = rows[0];
    if (!staff) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const match = await bcrypt.compare(password, staff.password_hash);
    if (!match) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const payload = {
      id: staff.id,
      username: staff.username,
      fullName: staff.full_name,
      officeId: staff.office_id,
      officeCode: staff.office_code,
      officeName: staff.office_name,
      role: staff.role,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });
    res.json({ token, staff: payload });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during login.' });
  }
}

export async function me(req, res) {
  res.json({ staff: req.staff });
}
