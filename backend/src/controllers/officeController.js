import pool from '../config/db.js';

export async function listOffices(req, res) {
  try {
    const [offices] = await pool.query(
      `SELECT id, code, name, prefix, window_count FROM offices WHERE is_active = 1 ORDER BY name`
    );
    res.json({ offices });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch offices.' });
  }
}

export async function listWindows(req, res) {
  const { officeId } = req.params;
  try {
    const [windows] = await pool.query(
      `SELECT w.*, q.queue_code AS current_queue_code
       FROM windows w
       LEFT JOIN queues q ON q.id = w.current_queue_id
       WHERE w.office_id = ?
       ORDER BY w.window_number`,
      [officeId]
    );
    res.json({ windows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch windows.' });
  }
}
