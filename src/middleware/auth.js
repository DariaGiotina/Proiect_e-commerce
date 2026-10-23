import { findUserById } from '../models/userModel.js';
import { AppError } from '../utils/errors.js';

export function loadCurrentUser(db) {
  return (req, res, next) => {
    const user = req.session.userId ? findUserById(db, req.session.userId) : undefined;
    if (req.session.userId && !user) {
      delete req.session.userId;
    }
    req.user = user ?? null;
    res.locals.currentUser = req.user;
    next();
  };
}

// Only same-site paths are allowed, so ?next= cannot send people to another site.
export function safeNext(next) {
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\')
    ? next
    : '/';
}

function redirectToLogin(req, res) {
  res.redirect(`/login?next=${encodeURIComponent(req.originalUrl)}`);
}

export function requireLogin(req, res, next) {
  if (!req.user) {
    return redirectToLogin(req, res);
  }
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user) {
    return redirectToLogin(req, res);
  }
  if (req.user.role !== 'admin') {
    throw new AppError('This area is for admins only 🔒', 403);
  }
  next();
}
