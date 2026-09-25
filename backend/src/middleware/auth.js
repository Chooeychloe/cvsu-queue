import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_in_production';

export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided.' });
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.staff = payload; // { id, username, officeId, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

// Restrict to admin-only routes (e.g. managing staff accounts)
export function requireAdmin(req, res, next) {
  if (req.staff?.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required.' });
  }
  next();
}

export { JWT_SECRET };
