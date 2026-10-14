import path from 'node:path';
import express from 'express';
import expressLayouts from 'express-ejs-layouts';
import session from 'express-session';
import helmet from 'helmet';
import { createRouter } from './routes/index.js';

const ROOT_DIR = path.resolve(import.meta.dirname, '..');

export function createApp({ db, sessionSecret, uploadsDir }) {
  const app = express();

  app.set('view engine', 'ejs');
  app.set('views', path.join(ROOT_DIR, 'views'));
  app.set('layout', 'layout');
  app.set('db', db);

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

  app.use(createRouter({ db }));

  return app;
}
