-- ============================================================
-- Migration: bind staff accounts to a fixed window
-- Run this ONLY if you already created the database from an
-- earlier version of schema.sql. New installs should just run
-- the current schema.sql, which already includes this column.
-- ============================================================
USE cvsu_queue;

ALTER TABLE staff
  ADD COLUMN window_id INT NULL AFTER office_id,
  ADD FOREIGN KEY (window_id) REFERENCES windows(id) ON DELETE SET NULL;

-- Optional: bind your existing seeded staff to their office's first window.
-- Adjust window_number if you want a different one per person.
-- UPDATE staff s
-- JOIN windows w ON w.office_id = s.office_id AND w.window_number = 1
-- SET s.window_id = w.id
-- WHERE s.role = 'STAFF';
