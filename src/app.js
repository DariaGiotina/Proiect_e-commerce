import path from 'node:path';
import express from 'express';
import expressLayouts from 'express-ejs-layouts';
import session from 'express-session';
import helmet from 'helmet';
import { createRouter } from './routes/index.js';
import { flashMiddleware } from './middleware/flash.js';
import { notFound, errorHandler } from './middleware/errors.js';
import { requireSameOrigin } from './middleware/sameOrigin.js';
import { formatPrice } from './utils/money.js';

const ROOT_DIR = path.resolve(import.meta.dirname, '..');

export function createApp({ db, sessionSecret, uploadsDir }) {
  const app = express();

  app.set('view engine', 'ejs');
  app.set('views', path.join(ROOT_DIR, 'views'));
  app.set('layout', 'layout');
  app.set('db', db);
  app.locals.formatPrice = formatPrice;

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          upgradeInsecureRequests: null,
          styleSrc: ["'self'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        },
      },
    }),
  );
  app.use(express.static(path.join(ROOT_DIR, 'public')));
  app.use('/uploads', express.static(uploadsDir));
  app.use(express.urlencoded({ extended: false }));
  app.use(
    session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: { httpOnly: true, sameSite: 'lax' },
    }),
  );
  app.use(expressLayouts);
  app.use(flashMiddleware);
  app.use((req, res, next) => {
    res.locals.currentUser = null;
    res.locals.cartCount = 0;
    res.locals.wishlistCount = 0;
    res.locals.currentPath = req.path;
    res.locals.searchQuery = typeof req.query.q === 'string' ? req.query.q : '';
    next();
  });
  app.use(requireSameOrigin);

  app.use(createRouter({ db, uploadsDir }));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
