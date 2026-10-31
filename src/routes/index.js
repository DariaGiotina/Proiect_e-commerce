import { Router } from 'express';
import { createHomeController } from '../controllers/homeController.js';
import { createCatalogController } from '../controllers/catalogController.js';
import * as adminDashboardController from '../controllers/adminDashboardController.js';
import { createAuthController } from '../controllers/authController.js';
import { createLookupController, mountLookupRoutes } from '../controllers/adminLookupController.js';
import { createAdminProductController } from '../controllers/adminProductController.js';
import { loadCurrentUser, requireAdmin } from '../middleware/auth.js';
import { createProductImageUpload } from '../middleware/upload.js';
import { LOOKUP_CONFIGS } from './adminLookups.js';

export function createRouter({ db, uploadsDir }) {
  const router = Router();
  const auth = createAuthController(db);
  const home = createHomeController(db);
  const catalog = createCatalogController(db);

  router.use(loadCurrentUser(db));

  router.get('/', home.show);
  router.get('/products', catalog.list);
  router.get('/products/:slug', catalog.show);

  router.get('/login', auth.loginForm);
  router.post('/login', auth.login);
  router.get('/register', auth.registerForm);
  router.post('/register', auth.register);
  router.post('/logout', auth.logout);

  const admin = Router();
  admin.use(requireAdmin);
  admin.get('/', adminDashboardController.show);
  for (const config of LOOKUP_CONFIGS) {
    mountLookupRoutes(admin, createLookupController(db, config), config.basePath);
  }
  const products = createAdminProductController(db, uploadsDir);
  const productImageUpload = createProductImageUpload(uploadsDir);
  admin.get('/products', products.list);
  admin.get('/products/new', products.newForm);
  admin.post('/products', productImageUpload, products.create);
  admin.get('/products/:id/edit', products.editForm);
  admin.post('/products/:id', productImageUpload, products.update);
  admin.post('/products/:id/delete', products.remove);
  router.use('/admin', admin);

  return router;
}
