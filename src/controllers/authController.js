import { authenticate, createUser } from '../models/userModel.js';
import { safeNext } from '../middleware/auth.js';
import { flash } from '../middleware/flash.js';
import { AppError } from '../utils/errors.js';
import { normalizeEmail, validateRegistration } from '../utils/validation.js';

// A fresh session id on login prevents session fixation.
function startSession(req, user) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);
      req.session.userId = user.id;
      resolve();
    });
  });
}

export function createAuthController(db) {
  return {
    loginForm(req, res) {
      res.render('auth/login', {
        title: 'Log in',
        values: { email: '' },
        next: safeNext(req.query.next),
        error: null,
      });
    },

    async login(req, res) {
      const email = normalizeEmail(req.body.email);
      const password = typeof req.body.password === 'string' ? req.body.password : '';
      const user = email && password ? await authenticate(db, email, password) : null;

      if (!user) {
        return res.status(401).render('auth/login', {
          title: 'Log in',
          values: { email },
          next: safeNext(req.body.next),
          error: 'Wrong email or password.',
        });
      }

      await startSession(req, user);
      flash(req, 'success', `Welcome back, ${user.name}!`);
      const fallback = user.role === 'admin' ? '/admin' : '/';
      res.redirect(req.body.next ? safeNext(req.body.next) : fallback);
    },

    registerForm(req, res) {
      res.render('auth/register', { title: 'Sign up', values: {}, errors: {} });
    },

    async register(req, res) {
      const { data, errors } = validateRegistration(req.body);
      const rerender = (status, fieldErrors) =>
        res.status(status).render('auth/register', {
          title: 'Sign up',
          values: { name: data.name, email: data.email },
          errors: fieldErrors,
        });

      if (Object.keys(errors).length > 0) {
        return rerender(422, errors);
      }

      let user;
      try {
        user = await createUser(db, data);
      } catch (err) {
        if (err instanceof AppError && err.status === 409) {
          return rerender(409, { email: err.message });
        }
        throw err;
      }

      await startSession(req, user);
      flash(req, 'success', `Your account is ready. Welcome, ${user.name}!`);
      res.redirect('/');
    },

    logout(req, res, next) {
      req.session.destroy((err) => {
        if (err) return next(err);
        res.clearCookie('connect.sid');
        res.redirect('/');
      });
    },
  };
}
