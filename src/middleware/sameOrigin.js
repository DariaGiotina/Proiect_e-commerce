import { AppError } from '../utils/errors.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function hostOf(url) {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

/**
 * Rejects form posts sent from another site. SameSite=Lax cookies already stop
 * cross-site posts from using a logged-in session; this also covers login and
 * register, where the attacker does not need the victim's cookie.
 */
export function requireSameOrigin(req, res, next) {
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }
  const source = req.get('origin') ?? req.get('referer');
  if (source && hostOf(source) !== req.get('host')) {
    throw new AppError('This form was sent from another website, so we ignored it. 🔒', 403);
  }
  next();
}
