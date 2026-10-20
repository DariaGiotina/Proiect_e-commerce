import { AppError } from '../utils/errors.js';

const EMOJI_BY_STATUS = { 401: '🔐', 403: '🔒', 404: '🙈', 409: '💭', 422: '📝' };

function renderError(res, status, message) {
  res.status(status).render('errors/error', {
    title: `Error ${status}`,
    status,
    message,
    emoji: EMOJI_BY_STATUS[status] ?? '💔',
  });
}

export function notFound(req, res) {
  renderError(res, 404, 'Oops! Page not found 🎀');
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }
  if (err instanceof AppError) {
    return renderError(res, err.status, err.message);
  }
  // Errors from Express itself, such as a malformed request body.
  if (err.status >= 400 && err.status < 500) {
    return renderError(res, err.status, 'That request did not look right. Please try again.');
  }
  console.error(err);
  renderError(res, 500, 'Something went wrong 💔');
}
