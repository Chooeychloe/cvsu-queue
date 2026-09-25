-- ============================================================
-- CvSU - Bacoor City Campus | Queueing Management System
-- MySQL Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS cvsu_queue CHARACTER SET utf8mb4;
USE cvsu_queue;

-- ------------------------------------------------------------
-- OFFICES
-- ------------------------------------------------------------
CREATE TABLE offices (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  code          VARCHAR(10)  NOT NULL UNIQUE,   -- REG, CAS, ADM, IT, CLI
  name          VARCHAR(100) NOT NULL,          -- Registrar, Cashier...
  prefix        VARCHAR(10)  NOT NULL,          -- REG-, CAS-, ADM-, IT-, CLI-
  window_count  INT NOT NULL DEFAULT 1,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO offices (code, name, prefix, window_count) VALUES
  ('REG', 'Registrar',     'REG-', 3),
  ('CAS', 'Cashier',       'CAS-', 1),
  ('ADM', 'Admissions',    'ADM-', 1),
  ('IT',  'IT Help Desk',  'IT-',  1),
  ('CLI', 'Clinic',        'CLI-', 1);

-- ------------------------------------------------------------
-- WINDOWS (physical service windows per office)
-- ------------------------------------------------------------
CREATE TABLE windows (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  office_id     INT NOT NULL,
  window_number INT NOT NULL,               -- 1, 2, 3 (Registrar) / 1 (others)
  label         VARCHAR(50) NOT NULL,        -- "Window 1"
  status        ENUM('AVAILABLE','BUSY','OFFLINE') NOT NULL DEFAULT 'AVAILABLE',
  current_queue_id INT NULL,
  FOREIGN KEY (office_id) REFERENCES offices(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_office_window (office_id, window_number)
);

-- seed windows based on office window_count
INSERT INTO windows (office_id, window_number, label)
SELECT id, 1, CONCAT(name, ' - Window 1') FROM offices;
INSERT INTO windows (office_id, window_number, label)
SELECT id, 2, CONCAT(name, ' - Window 2') FROM offices WHERE code = 'REG';
INSERT INTO windows (office_id, window_number, label)
SELECT id, 3, CONCAT(name, ' - Window 3') FROM offices WHERE code = 'REG';

-- ------------------------------------------------------------
-- STAFF
-- ------------------------------------------------------------
CREATE TABLE staff (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  office_id     INT NOT NULL,
  window_id     INT NULL,                    -- fixed window this staff calls to (NULL = auto-assign)
  full_name     VARCHAR(100) NOT NULL,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('STAFF','ADMIN') NOT NULL DEFAULT 'STAFF',
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (office_id) REFERENCES offices(id) ON DELETE CASCADE,
  FOREIGN KEY (window_id) REFERENCES windows(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- QUEUES
-- ------------------------------------------------------------
CREATE TABLE queues (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  office_id      INT NOT NULL,
  window_id      INT NULL,
  queue_code     VARCHAR(20) NOT NULL,        -- REG-001
  sequence_no    INT NOT NULL,                -- 1, 2, 3 (resets daily)
  status         ENUM('WAITING','CALLED','SERVING','COMPLETED','SKIPPED','CANCELLED')
                 NOT NULL DEFAULT 'WAITING',
  called_at      DATETIME NULL,
  served_at      DATETIME NULL,
  completed_at   DATETIME NULL,
  skipped_at     DATETIME NULL,
  cancelled_at   DATETIME NULL,
  recall_count   INT NOT NULL DEFAULT 0,
  served_by      INT NULL,                    -- staff.id
  queue_date     DATE NOT NULL,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (office_id) REFERENCES offices(id) ON DELETE CASCADE,
  FOREIGN KEY (window_id) REFERENCES windows(id) ON DELETE SET NULL,
  FOREIGN KEY (served_by) REFERENCES staff(id) ON DELETE SET NULL,
  INDEX idx_office_status (office_id, status),
  INDEX idx_queue_date (queue_date)
);

-- ------------------------------------------------------------
-- QUEUE STATUS LOG (audit trail for lifecycle transitions)
-- ------------------------------------------------------------
CREATE TABLE queue_logs (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  queue_id    INT NOT NULL,
  from_status VARCHAR(20) NULL,
  to_status   VARCHAR(20) NOT NULL,
  changed_by  INT NULL,                       -- staff.id, null = system
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (queue_id) REFERENCES queues(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- Sample admin account (username: admin, password: admin123)
-- and per-office staff are created by `npm run seed` (backend/src/db/seedStaff.js),
-- which hashes passwords with bcrypt instead of hardcoding them here.
-- ------------------------------------------------------------
