// Queues a message in the session; it is shown on the next rendered page.
export function flash(req, type, message) {
  req.session.flash ??= [];
  req.session.flash.push({ type, message });
}

export function flashMiddleware(req, res, next) {
  res.locals.flash = req.session.flash ?? [];
  delete req.session.flash;
  next();
}
