import { Router } from 'express';
import * as homeController from '../controllers/homeController.js';
import * as adminDashboardController from '../controllers/adminDashboardController.js';
import { createAuthController } from '../controllers/authController.js';
import { loadCurrentUser, requireAdmin } from '../middleware/auth.js';

export function createRouter({ db, uploadsDir }) {
  const router = Router();
  const auth = createAuthController(db);

  router.use(loadCurrentUser(db));

  router.get('/', homeController.show);

  router.get('/login', auth.loginForm);
  router.post('/login', auth.login);
  router.get('/register', auth.registerForm);
  router.post('/register', auth.register);
  router.post('/logout', auth.logout);

  const admin = Router();
  admin.use(requireAdmin);
  admin.get('/', adminDashboardController.show);
  router.use('/admin', admin);

  return router;
}
