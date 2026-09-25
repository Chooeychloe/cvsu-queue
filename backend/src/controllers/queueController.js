import pool from '../config/db.js';
import { formatQueueCode, todayDateString } from '../utils/queueCode.js';
import { getIO } from '../socket/index.js';

async function logStatusChange(conn, queueId, fromStatus, toStatus, changedBy = null) {
  await conn.query(
    `INSERT INTO queue_logs (queue_id, from_status, to_status, changed_by) VALUES (?, ?, ?, ?)`,
    [queueId, fromStatus, toStatus, changedBy]
  );
}

async function broadcastOfficeState(officeId) {
  const io = getIO();
  if (!io) return;
  const state = await getOfficeStateInternal(officeId);
  io.to(`office:${officeId}`).emit('queue:update', state);
  io.to('public-display').emit('queue:update', state);
}

async function getOfficeStateInternal(officeId) {
  const [[office]] = await pool.query(`SELECT * FROM offices WHERE id = ?`, [officeId]);
  const [windows] = await pool.query(
    `SELECT w.id, w.window_number, w.label, w.status,
            q.id AS queue_id, q.queue_code, q.status AS queue_status
     FROM windows w
     LEFT JOIN queues q ON q.id = w.current_queue_id
     WHERE w.office_id = ? ORDER BY w.window_number`,
    [officeId]
  );
  const [waiting] = await pool.query(
    `SELECT id, queue_code, sequence_no, created_at
     FROM queues WHERE office_id = ? AND status = 'WAITING' AND queue_date = ?
     ORDER BY sequence_no ASC`,
    [officeId, todayDateString()]
  );
  const [recentlyCalled] = await pool.query(
    `SELECT q.id, q.queue_code, q.status, w.label AS window_label, w.window_number
     FROM queues q LEFT JOIN windows w ON w.id = q.window_id
     WHERE q.office_id = ? AND q.status IN ('CALLED','SERVING') AND q.queue_date = ?
     ORDER BY q.called_at DESC`,
    [officeId, todayDateString()]
  );
  const [skipped] = await pool.query(
    `SELECT id, queue_code, recall_count FROM queues
     WHERE office_id = ? AND status = 'SKIPPED' AND queue_date = ?
     ORDER BY skipped_at ASC`,
    [officeId, todayDateString()]
  );

  return { office, windows, waiting, active: recentlyCalled, skipped };
}

// ------------------------------------------------------------
// CLIENT: Get a queue number for an office
// ------------------------------------------------------------
export async function createQueue(req, res) {
  const { officeId } = req.body;
  if (!officeId) return res.status(400).json({ message: 'officeId is required.' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[office]] = await conn.query(`SELECT * FROM offices WHERE id = ? FOR UPDATE`, [officeId]);
    if (!office) {
      await conn.rollback();
      return res.status(404).json({ message: 'Office not found.' });
    }

    const today = todayDateString();
    const [[{ maxSeq }]] = await conn.query(
      `SELECT COALESCE(MAX(sequence_no), 0) AS maxSeq FROM queues WHERE office_id = ? AND queue_date = ?`,
      [officeId, today]
    );
    const sequenceNo = maxSeq + 1;
    const queueCode = formatQueueCode(office.prefix, sequenceNo);

    const [result] = await conn.query(
      `INSERT INTO queues (office_id, queue_code, sequence_no, status, queue_date)
       VALUES (?, ?, ?, 'WAITING', ?)`,
      [officeId, queueCode, sequenceNo, today]
    );

    await logStatusChange(conn, result.insertId, null, 'WAITING');
    await conn.commit();

    // how many people are ahead of this new ticket right now
    const [[{ ahead }]] = await pool.query(
      `SELECT COUNT(*) AS ahead FROM queues
       WHERE office_id = ? AND status = 'WAITING' AND queue_date = ? AND sequence_no < ?`,
      [officeId, today, sequenceNo]
    );

    await broadcastOfficeState(officeId);

    res.status(201).json({
      queue: { id: result.insertId, queueCode, sequenceNo, officeName: office.name, status: 'WAITING' },
      peopleAhead: ahead,
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'Failed to create queue ticket.' });
  } finally {
    conn.release();
  }
}

// Client: check status/position of a specific ticket
export async function getQueueStatus(req, res) {
  const { id } = req.params;
  try {
    const [[queue]] = await pool.query(
      `SELECT q.*, o.name AS office_name, w.label AS window_label
       FROM queues q JOIN offices o ON o.id = q.office_id
       LEFT JOIN windows w ON w.id = q.window_id
       WHERE q.id = ?`,
      [id]
    );
    if (!queue) return res.status(404).json({ message: 'Queue ticket not found.' });

    let ahead = 0;
    if (queue.status === 'WAITING') {
      const [[row]] = await pool.query(
        `SELECT COUNT(*) AS ahead FROM queues
         WHERE office_id = ? AND status = 'WAITING' AND queue_date = ? AND sequence_no < ?`,
        [queue.office_id, queue.queue_date, queue.sequence_no]
      );
      ahead = row.ahead;
    }

    res.json({ queue, peopleAhead: ahead });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch queue status.' });
  }
}

// Client: cancel own ticket while WAITING or CALLED
export async function cancelQueue(req, res) {
  const { id } = req.params;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[queue]] = await conn.query(`SELECT * FROM queues WHERE id = ? FOR UPDATE`, [id]);
    if (!queue) {
      await conn.rollback();
      return res.status(404).json({ message: 'Queue ticket not found.' });
    }
    if (!['WAITING', 'CALLED'].includes(queue.status)) {
      await conn.rollback();
      return res.status(400).json({ message: `Cannot cancel a ticket that is ${queue.status}.` });
    }

    await conn.query(`UPDATE queues SET status = 'CANCELLED', cancelled_at = NOW() WHERE id = ?`, [id]);
    if (queue.window_id) {
      await conn.query(
        `UPDATE windows SET status = 'AVAILABLE', current_queue_id = NULL WHERE id = ?`,
        [queue.window_id]
      );
    }
    await logStatusChange(conn, id, queue.status, 'CANCELLED');
    await conn.commit();

    await broadcastOfficeState(queue.office_id);
    res.json({ message: 'Queue ticket cancelled.' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'Failed to cancel queue ticket.' });
  } finally {
    conn.release();
  }
}

// ------------------------------------------------------------
// STAFF: Call the next waiting ticket for their office
// Automatically finds an available window - staff never picks manually.
// ------------------------------------------------------------
export async function callNext(req, res) {
  const officeId = req.staff.officeId;
  const staffId = req.staff.id;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Find an available window for this office (locked)
    const [availableWindows] = await conn.query(
      `SELECT * FROM windows WHERE office_id = ? AND status = 'AVAILABLE'
       ORDER BY window_number LIMIT 1 FOR UPDATE`,
      [officeId]
    );
    const win = availableWindows[0];
    if (!win) {
      await conn.rollback();
      return res.status(409).json({ message: 'No available window right now. Finish serving first.' });
    }

    // 2. Find the oldest waiting ticket for this office (locked)
    const [waitingTickets] = await conn.query(
      `SELECT * FROM queues WHERE office_id = ? AND status = 'WAITING' AND queue_date = ?
       ORDER BY sequence_no ASC LIMIT 1 FOR UPDATE`,
      [officeId, todayDateString()]
    );
    const queue = waitingTickets[0];
    if (!queue) {
      await conn.rollback();
      return res.status(404).json({ message: 'No waiting tickets for your office.' });
    }

    // 3. Assign ticket to window, mark CALLED
    await conn.query(
      `UPDATE queues SET status = 'CALLED', window_id = ?, called_at = NOW() WHERE id = ?`,
      [win.id, queue.id]
    );
    await conn.query(
      `UPDATE windows SET status = 'BUSY', current_queue_id = ? WHERE id = ?`,
      [queue.id, win.id]
    );
    await logStatusChange(conn, queue.id, 'WAITING', 'CALLED', staffId);
    await conn.commit();

    await broadcastOfficeState(officeId);

    // Dedicated "announce" event for the public display / chime
    const io = getIO();
    io?.to('public-display').emit('queue:called', {
      queueCode: queue.queue_code,
      officeName: req.staff.officeName,
      windowLabel: win.label,
    });

    res.json({ message: 'Next ticket called.', queueCode: queue.queue_code, window: win.label });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'Failed to call next ticket.' });
  } finally {
    conn.release();
  }
}

// Generic status-transition helper for staff actions on a specific queue id
async function transitionQueue(req, res, { fromStatuses, toStatus, timestampCol, freeWindow = false }) {
  const { id } = req.params;
  const staffId = req.staff.id;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[queue]] = await conn.query(`SELECT * FROM queues WHERE id = ? FOR UPDATE`, [id]);
    if (!queue) {
      await conn.rollback();
      return res.status(404).json({ message: 'Queue ticket not found.' });
    }
    if (queue.office_id !== req.staff.officeId) {
      await conn.rollback();
      return res.status(403).json({ message: 'This ticket belongs to a different office.' });
    }
    if (!fromStatuses.includes(queue.status)) {
      await conn.rollback();
      return res.status(400).json({
        message: `Cannot move ticket from ${queue.status} to ${toStatus}.`,
      });
    }

    const extraCol = timestampCol ? `, ${timestampCol} = NOW()` : '';
    const servedByCol = toStatus === 'COMPLETED' ? `, served_by = ${conn.escape(staffId)}` : '';
    await conn.query(
      `UPDATE queues SET status = ? ${extraCol} ${servedByCol} WHERE id = ?`,
      [toStatus, id]
    );

    if (freeWindow && queue.window_id) {
      await conn.query(
        `UPDATE windows SET status = 'AVAILABLE', current_queue_id = NULL WHERE id = ?`,
        [queue.window_id]
      );
    }

    await logStatusChange(conn, id, queue.status, toStatus, staffId);
    await conn.commit();

    await broadcastOfficeState(queue.office_id);
    res.json({ message: `Ticket updated to ${toStatus}.` });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'Failed to update ticket.' });
  } finally {
    conn.release();
  }
}

// STAFF: CALLED -> SERVING
export const serveQueue = (req, res) =>
  transitionQueue(req, res, { fromStatuses: ['CALLED'], toStatus: 'SERVING', timestampCol: 'served_at' });

// STAFF: SERVING -> COMPLETED (frees the window)
export const completeQueue = (req, res) =>
  transitionQueue(req, res, {
    fromStatuses: ['SERVING'],
    toStatus: 'COMPLETED',
    timestampCol: 'completed_at',
    freeWindow: true,
  });

// STAFF: CALLED -> SKIPPED (client didn't show up; frees the window)
export const skipQueue = (req, res) =>
  transitionQueue(req, res, {
    fromStatuses: ['CALLED'],
    toStatus: 'SKIPPED',
    timestampCol: 'skipped_at',
    freeWindow: true,
  });

// STAFF: staff-side cancel (e.g. duplicate ticket, wrong office)
export const staffCancelQueue = (req, res) =>
  transitionQueue(req, res, {
    fromStatuses: ['WAITING', 'CALLED'],
    toStatus: 'CANCELLED',
    timestampCol: 'cancelled_at',
    freeWindow: true,
  });

// STAFF: SKIPPED -> re-assign to an available window and CALL again
export async function recallQueue(req, res) {
  const { id } = req.params;
  const officeId = req.staff.officeId;
  const staffId = req.staff.id;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[queue]] = await conn.query(`SELECT * FROM queues WHERE id = ? FOR UPDATE`, [id]);
    if (!queue || queue.office_id !== officeId) {
      await conn.rollback();
      return res.status(404).json({ message: 'Queue ticket not found.' });
    }
    if (queue.status !== 'SKIPPED') {
      await conn.rollback();
      return res.status(400).json({ message: 'Only skipped tickets can be recalled.' });
    }

    const [availableWindows] = await conn.query(
      `SELECT * FROM windows WHERE office_id = ? AND status = 'AVAILABLE'
       ORDER BY window_number LIMIT 1 FOR UPDATE`,
      [officeId]
    );
    const win = availableWindows[0];
    if (!win) {
      await conn.rollback();
      return res.status(409).json({ message: 'No available window to recall this ticket.' });
    }

    await conn.query(
      `UPDATE queues SET status = 'CALLED', window_id = ?, called_at = NOW(), recall_count = recall_count + 1
       WHERE id = ?`,
      [win.id, id]
    );
    await conn.query(`UPDATE windows SET status = 'BUSY', current_queue_id = ? WHERE id = ?`, [id, win.id]);
    await logStatusChange(conn, id, 'SKIPPED', 'CALLED', staffId);
    await conn.commit();

    await broadcastOfficeState(officeId);

    const io = getIO();
    io?.to('public-display').emit('queue:called', {
      queueCode: queue.queue_code,
      officeName: req.staff.officeName,
      windowLabel: win.label,
    });

    res.json({ message: 'Ticket recalled.', window: win.label });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'Failed to recall ticket.' });
  } finally {
    conn.release();
  }
}

// STAFF dashboard: full state for their office
export async function getOfficeQueueState(req, res) {
  try {
    const state = await getOfficeStateInternal(req.staff.officeId);
    res.json(state);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch queue state.' });
  }
}

// PUBLIC DISPLAY: state for every office at once
export async function getPublicDisplayState(req, res) {
  try {
    const [offices] = await pool.query(`SELECT * FROM offices WHERE is_active = 1 ORDER BY name`);
    const states = await Promise.all(offices.map((o) => getOfficeStateInternal(o.id)));
    res.json({ offices: states });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch public display state.' });
  }
}

export { getOfficeStateInternal };
