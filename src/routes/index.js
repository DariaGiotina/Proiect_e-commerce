import { Router } from 'express';
import * as homeController from '../controllers/homeController.js';

export function createRouter({ db }) {
  const router = Router();

  router.get('/', homeController.show);

  return router;
}
