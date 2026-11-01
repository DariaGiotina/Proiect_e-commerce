# Blush & Bow 🎀 — Project Plan (Assignment II, individual)

Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A server-rendered MVC web shop with two roles (admin, client) that covers every Milestone 1 and Milestone 2 requirement of Assignment II, with a cute, pink, aesthetic UI.

**Architecture:** Node.js + Express 5 with the classic MVC split. `models/` holds the SQL, run through better-sqlite3. `views/` holds EJS templates that share one layout. `controllers/` handles requests, and `routes/` wires everything together. All data lives in one SQLite file, and a session remembers who is logged in. `createApp({ db })` builds the app, so tests can run it against an in-memory database.

**Tech stack:** Node.js 24 · Express 5.3 · EJS 7 + express-ejs-layouts 2.5 · better-sqlite3 13 (SQLite) · express-session 1.19 · bcryptjs 3 · helmet 8 · multer 2.5 (image upload) · tests: built-in `node:test` + supertest 7 · plain CSS (no build step).

**Spec:** the course project slides, slide 8 ("II. Building a custom application (individual)"), plus slides 2 and 5 (grading, dates). The requirements are summarized in §0.

**Repo:** https://github.com/DariaGiotina/Proiect_e-commerce

**Why this stack:** the course lets students pick any technology. Node.js is already installed on my PC. SQLite needs no database server (no WAMP or MySQL). Express + EJS is a textbook MVC layout, which makes it easy to explain at the presentation.

---

## 0. What the course asks for

| Requirement (slide 8) | Milestone | Task |
|---|---|---|
| 2 roles: admin and user | 1 | 4 |
| authentication (as admin and as client) | 1 | 4 |
| add / edit / delete products | 1 | 6 |
| a product can have: name, description, specifications, price, stock, supplier, delivery method, category | 1 | 5, 6 |
| browse products and categories | 1 | 7 |
| product management flow, adding products to a favorites list / wish list | 2 | 9 |
| purchase flow (add to cart, enter details) | 2 | 8, 10 |
| order history | 2 | 11 |

**Grading and rules (slides 2 and 5):**
- The project is **40% of the final grade**: Milestone 1 = 40% and Milestone 2 = 60% of the project grade.
- Milestone 1 is presented in **week 7/8** and Milestone 2 in **week 11/12** (depending on the timetable; presented with the subgroup).
- Late presentations lose **2 points per week**. Not presenting = **grade 1**.
- Bonus for an outstanding project (see §9).
- To enter the exam, the project grade **or** the lab grade must be ≥ 5.

---

## 1. Timeline

This assumes semester week 1 = 28 Sep 2026. Check it against the real timetable.

| Week | Dates (approx.) | Do | Milestone |
|---|---|---|---|
| 6 | 2–8 Nov | Tasks 1–4 | |
| 7 | 9–15 Nov | Tasks 5–7, M1 | **Milestone 1** (if the slot is week 7) |
| 8 | 16–22 Nov | buffer + design polish | **Milestone 1** (if the slot is week 8) |
| 9 | 23–29 Nov | Tasks 8–9 (and the lab homework) | |
| 10 | 30 Nov–6 Dec | Task 10 | |
| 11 | 7–13 Dec | Task 11, M2 | **Milestone 2** (if the slot is week 11) |
| 12 | 14–20 Dec | buffer + bonus | **Milestone 2** (if the slot is week 12) |

> If Milestone 1 is in week 7, there is about one week. Tasks 1–7 are the minimum for it, so keep the design simple at first and polish it in week 8.

---

## 2. What to install

| Tool | Why | On my PC (checked 2026-11-01) |
|---|---|---|
| Node.js 24 LTS | runs the app | ✅ v24.19.0 |
| npm | installs packages | ✅ 12.0.2 |
| Git | version control and GitHub | ✅ 2.55 |
| VS Code | editor (recommended by the course) | install from code.visualstudio.com if missing |
| VS Code extension "EJS language support" | syntax highlighting for `.ejs` | optional |
| VS Code extension "SQLite Viewer" (qwtel) | look at tables in `data/shop.db` | optional, nice for the demo |
| DB Browser for SQLite | show the DB schema in the presentation | optional |

**Not needed:** WAMP, PHP, MySQL, XAMPP.

**npm packages (installed in Task 1):**
```bash
npm install express ejs express-ejs-layouts express-session better-sqlite3 bcryptjs helmet multer
```
```bash
npm install --save-dev supertest
```

Verified on this machine: better-sqlite3 13.0.3 loads on Node 24.19 using the Windows binary it ships with. npm 12 prints *"1 package has install scripts blocked … better-sqlite3 (node-gyp rebuild)"*. That warning is harmless. Silence it with `npm install-scripts deny better-sqlite3`, and do **not** approve the script (approving it compiles from source, which needs Visual Studio Build Tools).

> PowerShell tip: if `npm` fails with *"running scripts is disabled on this system"*, run `npm.cmd …` or use Git Bash. There is no need to change the execution policy.

---

## 3. Global constraints

- Node ≥ 24, ESM modules (`"type": "module"`) everywhere.
- No build step. CSS goes in `public/css/`, browser JS in `public/js/`, and there are **no inline `<script>` tags**, because helmet's CSP blocks them. Turn off `upgradeInsecureRequests` in the helmet CSP so `http://localhost` works.
- Money is stored as an integer number of **cents** (`price_cents`, 1 RON = 100 cents) and never as a float. It's displayed as `49.99 RON` through `formatPrice()`.
- Currency is RON. **All UI text, code, comments and docs are in English.**
- Passwords are hashed with bcryptjs (cost 10). They are never logged or stored in plain text.
- Every `/admin/*` route sits behind `requireAdmin`. Every `/wishlist`, `/cart`, `/checkout` and `/orders` route sits behind `requireLogin`.
- Session cookie: `httpOnly: true, sameSite: 'lax'`. This is the CSRF protection for this project's scope.
- Secrets (`SESSION_SECRET`, demo account passwords) live in `.env`, which is git-ignored. `.env.example` is committed with placeholders.
- **No card data is collected or stored.** Payment is `cash_on_delivery` or `card_on_delivery` (courier POS).
- Every page works at 375 px width, and text contrast is ≥ 4.5:1 (the tokens in §4 meet this).
- Each task ends with `npm test` passing and one git commit.

---

## 4. Design system 🎀 (cute, pink, aesthetic)

**Mood:** a soft "coquette boutique". Blush background, white rounded cards, rose pill buttons, bows, hearts and sparkles, and a gingham pattern in the hero. It should feel cute and still be easy to read.

**`public/css/tokens.css`, exact values:**
```css
:root {
  /* surfaces */
  --blush-50:  #FFF5F8;   /* page background */
  --blush-100: #FFE8F0;   /* soft fills, table stripes */
  --pink-200:  #FFD1E1;   /* borders, chips */
  --pink-300:  #FFB3CB;   /* hover fills, gingham */
  --pink-400:  #FF8FB4;   /* decoration only — never text */
  --lavender-200: #E7D9F5;
  --white: #FFFFFF;
  /* text & actions */
  --rose-600: #D63E77;    /* icons / large text only (4.1:1) */
  --rose-700: #B83268;    /* primary buttons, links (5.3:1 on blush-50, 5.7:1 with white text) */
  --rose-800: #8F2350;    /* hover / pressed */
  --plum-900: #4A1D3A;    /* body text */
  --plum-600: #7A4A66;    /* muted text (6.5:1) */
  /* feedback */
  --mint-200: #CFF0DD;   --mint-800: #1E6B45;     /* success */
  --butter-200: #FFF1C9; --butter-800: #7A5A00;   /* warning */
  --cherry-100: #FFE1E1; --cherry-700: #B42318;   /* error */
  /* shape */
  --radius-sm: 10px; --radius-md: 16px; --radius-lg: 24px; --radius-pill: 999px;
  --shadow-soft: 0 6px 20px rgba(184, 50, 104, 0.12);
  --shadow-lift: 0 12px 32px rgba(184, 50, 104, 0.20);
  --focus-ring: 0 0 0 3px var(--white), 0 0 0 6px var(--rose-700);
  /* type */
  --font-logo: "Pacifico", cursive;
  --font-heading: "Fredoka", system-ui, sans-serif;
  --font-body: "Nunito", system-ui, sans-serif;
}
```

**Fonts** (in the `<head>` of `views/layout.ejs`):
`https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600&family=Nunito:wght@400;600;700&family=Pacifico&display=swap`

**Components:**
- **Header:** white and sticky. Logo "Blush & Bow 🎀" in Pacifico, then nav links, a pill-shaped search box, a ♡ wishlist link with a count, and a 👜 cart link with a count badge in `--rose-700`.
- **Look and feel: a scrapbook / sticker book.** Photos are polaroids taped to the page, stock warnings are die-cut stickers, and categories sit in scalloped "flower" frames. The hero collage is the one bold element; everything else stays quiet.
- **Hero (home):** gingham background (two `repeating-linear-gradient`s in `--pink-300` at 25% opacity, 12 px stripes). Two columns (one on mobile, centered):
  - Left: the bow, then the heading "Cute things for pink days" in bubble-sticker lettering (`--rose-700` Fredoka with a white `text-shadow` outline and a `--pink-300` drop shadow), the lead text, and a pill CTA "Shop the collection".
  - Right: `images/hero/hero.jpg` in an arch-shaped white frame (top radius 999 px), rotated 2°, with washi tape on top and a scalloped butter sticker "Pay when it arrives 💗".
  - A wavy SVG divider sits underneath.
- **Washi tape (`.taped`):** a `::before` strip, 120 × 30 px. It has `--pink-400`/`--pink-200` diagonal stripes, torn ends drawn with `clip-path`, and a −3° rotation. Use it only on the hero photo and the product page photo.
- **Scalloped shape:** `public/img/scallop.svg` (12 petals), used as a CSS `mask` so the color comes from CSS. A mask also clips shadows, so the white die-cut edge and the shadow go on a wrapper with `filter: drop-shadow(...)`.
- **Category bubbles (home):** a 116 px scalloped `--pink-200` frame. Inside it, a round photo (`coverImage` = the first product photo in that category) with a white 3 px border, plus the category emoji as a small white sticker in the corner. With no photo, it shows the emoji on white. On hover the frame turns `--pink-300` and spins 30°.
- **Product card (polaroid):**
  - White, `--radius-sm`, padded 10 px with 14 px at the bottom, `--shadow-soft`.
  - A square (1:1) photo with a 6 px radius. When there's no image, show a placeholder: a `linear-gradient(135deg, var(--pink-200), var(--lavender-200))` tile with the category emoji at 64 px.
  - Below the photo: the name, then the price in bold `--rose-700`. A ♡ toggle goes in the top-right corner of the photo (from Task 9).
  - On hover or focus the card lifts and tilts (`translateY(-4px) rotate(∓1.5deg)`, alternating between neighbours) with `--shadow-lift`, except under `prefers-reduced-motion`.
  - Phones (≤ 520 px) get 2 columns.
- **Stickers (`.sticker`):** a pill with a white 3 px border, rotated −6°, over the top-left corner of the photo. Butter "Only N left" and cherry "Out of stock". Pills are still used everywhere else.
- **Product page photo:** a taped polaroid (14 px padding, 44 px at the bottom), rotated −1°.
- **Gift banner (home, after New arrivals):** a lavender panel with white polka dots. On the left, `images/hero/gift.jpg` as a polaroid rotated −3°; on the right, "A little gift for someone sweet" and a "Shop plushies" button.
- **Section titles (home):** `text-decoration: underline wavy var(--pink-300)`.
- **Photos:** demo photos live in `public/images/` (committed). Each one is free under the Unsplash License, with credits in `public/images/CREDITS.md`. Product photos are 900 × 900 JPGs named `<product-slug>.jpg`. The footer says "Product photos from Unsplash".
- **Buttons:** `.btn-primary` (`--rose-700` background, white text, pill shape; `--rose-800` on hover), `.btn-soft` (`--blush-100` background, `--plum-900` text), `.btn-ghost`. Every focusable element uses `box-shadow: var(--focus-ring)`.
- **Forms:** the label sits above the input. Inputs are white with a 2 px `--pink-200` border and 14 px radius. Errors appear under the field in `--cherry-700`, prefixed with ⚠️ and linked to the input with `aria-describedby`.
- **Flash messages:** a pill under the header. Success is mint, error is cherry, info is lavender. Add a ✨ on success.
- **Order status pills:** Placed (lavender), Processing (butter), Shipped (pink-200), Delivered (mint), Cancelled (cherry).
- **Empty states:** a big emoji plus a friendly line, e.g. "Your cart is empty… for now 🛍️" or "No favorites yet 💗".
- **Admin:** same palette. A left sidebar on desktop (a top bar on mobile), tables with `--blush-100` stripes, and stat cards with emoji (📦 products, ⚠️ low stock, 🧾 orders).

---

## 5. File structure

```
./                               ← git repo root (Proiect_e-commerce)
├─ PLAN-Proiect.md               ← this file
├─ README.md                     ← setup + run instructions (Task 12)
├─ package.json
├─ .env.example                  ← committed, placeholders only
├─ .env                          ← git-ignored
├─ .gitignore                    ← node_modules/, .env, data/*.db*, public/uploads/*
├─ server.js                     ← reads env, opens DB, createApp(), listen
├─ scripts/
│  ├─ seed.js                    ← migrate + seedDemoData from .env + attachDemoImages
│  └─ reset-db.js                ← delete data/shop.db, then seed
├─ src/
│  ├─ app.js                     ← createApp({ db, sessionSecret, uploadsDir })
│  ├─ db/
│  │  ├─ connection.js           ← openDb(filename)
│  │  ├─ schema.sql              ← §6
│  │  ├─ migrate.js              ← migrate(db)
│  │  └─ seed.js                 ← seedDemoData(db, accounts), attachDemoImages(db)
│  ├─ models/                    ← SQL lives ONLY here
│  │  ├─ userModel.js
│  │  ├─ categoryModel.js
│  │  ├─ supplierModel.js
│  │  ├─ deliveryMethodModel.js
│  │  ├─ productModel.js
│  │  ├─ wishlistModel.js
│  │  ├─ cartModel.js
│  │  └─ orderModel.js
│  ├─ controllers/
│  │  ├─ homeController.js
│  │  ├─ authController.js
│  │  ├─ catalogController.js
│  │  ├─ adminDashboardController.js
│  │  ├─ adminLookupController.js     ← one generic CRUD for categories / suppliers / delivery methods
│  │  ├─ adminProductController.js
│  │  ├─ adminOrderController.js
│  │  ├─ wishlistController.js
│  │  ├─ cartController.js
│  │  ├─ checkoutController.js
│  │  └─ orderController.js
│  ├─ routes/index.js            ← mounts every route + middleware
│  ├─ middleware/
│  │  ├─ auth.js                 ← loadCurrentUser, requireLogin, requireAdmin
│  │  ├─ flash.js                ← flash(req, type, msg) + res.locals.flash
│  │  ├─ upload.js               ← productImageUpload (multer)
│  │  └─ errors.js               ← notFound, errorHandler
│  └─ utils/
│     ├─ errors.js               ← AppError
│     ├─ money.js                ← toCents, formatPrice
│     ├─ text.js                 ← slugify, normalizeForSearch
│     ├─ specs.js                ← parseSpecs, formatSpecs
│     ├─ labels.js               ← STATUS_LABELS, PAYMENT_LABELS, formatOrderNumber
│     └─ validation.js           ← validateRegistration, validateProduct, validateCheckout
├─ views/
│  ├─ layout.ejs
│  ├─ partials/  header.ejs footer.ejs flash.ejs product-card.ejs pagination.ejs field-error.ejs
│  ├─ home.ejs
│  ├─ auth/      login.ejs register.ejs
│  ├─ catalog/   list.ejs product.ejs
│  ├─ wishlist/  index.ejs
│  ├─ cart/      index.ejs
│  ├─ checkout/  form.ejs confirmation.ejs
│  ├─ orders/    index.ejs show.ejs
│  ├─ admin/     dashboard.ejs lookup-list.ejs lookup-form.ejs products.ejs product-form.ejs orders.ejs order.ejs
│  └─ errors/    error.ejs   ← 403 / 404 / 409 / 500 with a cute emoji
├─ public/
│  ├─ css/  tokens.css base.css components.css admin.css
│  ├─ js/   main.js          ← mobile menu, qty steppers, confirm-before-delete
│  ├─ img/  bow.svg wave.svg scallop.svg
│  ├─ images/                ← demo photos from Unsplash (committed)
│  │  ├─ products/<slug>.jpg ← one 900×900 photo per demo product
│  │  ├─ hero/  hero.jpg gift.jpg
│  │  └─ CREDITS.md          ← photographer + link for every photo
│  └─ uploads/               ← admin-uploaded product images (git-ignored, keep .gitkeep)
├─ data/                      ← shop.db (git-ignored, keep .gitkeep)
└─ tests/
   ├─ helpers.js
   ├─ utils.test.js  db.test.js  auth.test.js  admin-lookups.test.js  admin-products.test.js
   └─ catalog.test.js  wishlist.test.js  cart.test.js  checkout.test.js  orders.test.js
```

**URLs:**

| Area | Routes |
|---|---|
| Public | `GET /`, `GET /products?category=&q=&sort=&page=`, `GET /products/:slug` |
| Auth | `GET/POST /login`, `GET/POST /register`, `POST /logout` |
| Wishlist | `GET /wishlist`, `POST /wishlist/:productId/toggle`, `POST /wishlist/:productId/move-to-cart` |
| Cart | `GET /cart`, `POST /cart/:productId/add`, `POST /cart/:productId/update`, `POST /cart/:productId/remove` |
| Checkout | `GET /checkout`, `POST /checkout`, `GET /checkout/confirmation/:orderId` |
| Orders | `GET /orders`, `GET /orders/:orderId` |
| Admin | `GET /admin`; `/admin/{categories,suppliers,delivery-methods}` with `GET` list, `GET new`, `POST`, `GET :id/edit`, `POST :id`, `POST :id/delete`; the same 6 for `/admin/products`; `GET /admin/orders`, `GET /admin/orders/:id`, `POST /admin/orders/:id/status` |

All changes use `POST` (HTML forms can't send PUT or DELETE). After a successful POST the app redirects (Post/Redirect/Get) and shows a flash message.

---

## 6. Data model (`src/db/schema.sql`)

```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('admin','client')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  emoji TEXT NOT NULL DEFAULT '🎀',
  description TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS delivery_methods (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  eta TEXT NOT NULL                                   -- "2–3 business days"
);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  specs_json TEXT NOT NULL DEFAULT '[]',              -- [{"key":"Material","value":"satin"}]
  price_cents INTEGER NOT NULL CHECK (price_cents > 0),
  stock INTEGER NOT NULL CHECK (stock >= 0),
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  image_path TEXT,                                    -- '/uploads/…' (admin), '/images/products/…' (demo) or NULL → emoji placeholder
  search_text TEXT NOT NULL,                          -- normalizeForSearch(name + ' ' + description)
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS product_delivery_methods (
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  delivery_method_id INTEGER NOT NULL REFERENCES delivery_methods(id) ON DELETE RESTRICT,
  PRIMARY KEY (product_id, delivery_method_id)
);
CREATE TABLE IF NOT EXISTS wishlist_items (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, product_id)
);
CREATE TABLE IF NOT EXISTS cart_items (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (user_id, product_id)
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'placed'
    CHECK (status IN ('placed','processing','shipped','delivered','cancelled')),
  full_name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL,
  address TEXT NOT NULL, city TEXT NOT NULL, county TEXT NOT NULL, postal_code TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  delivery_method_name TEXT NOT NULL,                 -- snapshot, not a FK
  delivery_price_cents INTEGER NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash_on_delivery','card_on_delivery')),
  subtotal_cents INTEGER NOT NULL,
  total_cents INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,                         -- snapshot
  unit_price_cents INTEGER NOT NULL,                  -- snapshot
  quantity INTEGER NOT NULL CHECK (quantity > 0)
);
```

**Rules this schema enforces:**
- "Delivery method" is many-to-many: each product lists the delivery methods it allows. At checkout the customer picks from the methods **every** product in the cart allows (the intersection).
- Orders copy the product name, price and delivery method at the moment of purchase, so order history never changes when the admin edits or deletes a product.
- A category, supplier or delivery method can't be deleted while products use it (`RESTRICT`). The admin sees a friendly 409 message instead.
- `PRAGMA foreign_keys = ON` must be set on **every** connection (in `openDb`), because SQLite turns it off by default.

---

## 7. Review focus

These are the inputs most likely to break the app for a real user that the spec doesn't mention. Each one has a test in the task listed.

1. **Searching without accents or capitals:** searching "rose" must find "Rosé Satin Headband", and "PLANNER" must find "Fluffy Pink Planner". SQLite `LIKE` is accent-sensitive, so search runs on the normalized `search_text` column. → Task 7
2. **Stock changes between the cart and checkout:** if another order took the last items, placing the order must fail with a clear message naming the product and change **nothing** (no order, no stock change, cart kept). → Task 10
3. **Price typed with a comma or a dot:** the admin types `49,99` or `49.99`. Both must save as 4999 cents, and `-5`, `abc` or `1,999` must be rejected with a message, not crash. → Task 6
4. **Opening someone else's order by changing the URL id:** `/orders/2` as a different client must return 404 and must not show the data. → Task 11
5. **Deleting a product that's in carts, wishlists and past orders:** the cart and wishlist rows disappear, and past orders still show the product name and price from the snapshot. → Task 6

---

## 8. Tasks

### Shared test fixture (used by every test file)

`tests/helpers.js` exports:
- `PASSWORD = 'test-password-123'`
- `async createTestContext() → { db, app, guest(), loginAs(email) → agent, ids }`
  - It opens `:memory:`, runs `migrate(db)`, inserts the fixtures below, then calls `createApp({ db, sessionSecret: 'test-secret', uploadsDir: <os temp dir> })`.
  - `guest()` returns `request.agent(app)` from supertest. `loginAs(email)` POSTs `/login` and returns the agent, which keeps the cookie.
- Fixtures (`ids` exposes every id):
  - users: `admin@test.local` (admin), `ana@test.local` (client), `bianca@test.local` (client), all with `PASSWORD`
  - categories: Stationery 📒 (`stationery`), Accessories 🎀 (`accessories`)
  - suppliers: Pink Atelier
  - delivery methods: Standard courier (1599 cents, "2–3 business days"), Express courier (2499 cents, "24 hours")
  - products:

    | key | name | price_cents | stock | category | delivery |
    |---|---|---|---|---|---|
    | `planner` | Fluffy Pink Planner | 2999 | 5 | stationery | standard, express |
    | `clips` | Bow Hair Clips | 1499 | **0** | accessories | standard |
    | `pen` | Heart Pen | 999 | 20 | stationery | express |
    | `headband` | Rosé Satin Headband | 1999 | 3 | accessories | standard |

---

## Milestone 1 (week 7/8)

### Task 1: Project setup and app skeleton

**Files:**
- Create: `package.json`, `.gitignore`, `.env.example`, `server.js`, `src/app.js`, `src/routes/index.js`, `src/controllers/homeController.js`, `views/layout.ejs`, `views/home.ejs`, `tests/smoke.test.js`

**Interfaces:**
- Produces: `createApp({ db, sessionSecret, uploadsDir }) → express.Application` (`src/app.js`), configured with `view engine = ejs`, express-ejs-layouts (`layout.ejs`), `express.urlencoded({ extended: false })`, `express.static('public')`, `/uploads` served from `uploadsDir`, helmet (CSP with `upgradeInsecureRequests: null`, Google Fonts allowed in `style-src`/`font-src`), and express-session with the cookie from §3.

- [x] **Step 1: Connect the folder to the GitHub repo** (the folder already holds this plan, so use `git init` instead of `git clone`)
  ```bash
  git init -b main
  ```
  ```bash
  git remote add origin https://github.com/DariaGiotina/Proiect_e-commerce.git
  ```
  ```bash
  git pull origin main
  ```
  Expected: `README.md` appears next to `PLAN-Proiect.md`.
- [x] **Step 2: Initialize npm and install the packages from §2**, then run `npm pkg set type=module` and `npm install-scripts deny better-sqlite3`.
- [x] **Step 3: Add the scripts to `package.json`:**
  ```json
  "scripts": {
    "dev": "node --watch --env-file=.env server.js",
    "start": "node --env-file=.env server.js",
    "test": "node --test",
    "seed": "node --env-file=.env scripts/seed.js",
    "db:reset": "node --env-file=.env scripts/reset-db.js"
  }
  ```
- [x] **Step 4: Write `.env.example`** with `PORT=3000`, `DB_FILE=data/shop.db`, `SESSION_SECRET=change-me-to-a-long-random-string`, `ADMIN_EMAIL=`, `ADMIN_PASSWORD=`, `DEMO_CLIENT_EMAIL=`, `DEMO_CLIENT_PASSWORD=`. Copy it to `.env` and fill in real values. `.env` is never committed.
- [x] **Step 5: Write the failing smoke test** `tests/smoke.test.js`:
  ```js
  test('home page renders with the shop name', async () => {
    const app = createApp({ db: openDb(':memory:'), sessionSecret: 't', uploadsDir: os.tmpdir() });
    const res = await request(app).get('/');
    assert.equal(res.status, 200);
    assert.match(res.text, /Blush &amp; Bow/);
  });
  ```
  (This test also needs `openDb` from Task 2, so for now create `src/db/connection.js` with only `openDb`.)
- [x] **Step 6:** Run `npm test`. Expected: FAIL (cannot find `createApp`).
- [x] **Step 7: Implement** `createApp`, `routes/index.js` (`GET /` → `homeController.show`), a minimal `layout.ejs` and `home.ejs`, and `server.js` (reads `PORT` and `DB_FILE`, logs `Blush & Bow 🎀 running at http://localhost:3000`).
- [x] **Step 8:** Run `npm test`. Expected: PASS. Then run `npm run dev` and open http://localhost:3000.
- [x] **Step 9: Commit and push**
  ```bash
  git add . && git commit -m "chore: project skeleton (Express 5 + EJS MVC)" && git push -u origin main
  ```

### Task 2: Database schema, migration and demo seed

**Files:**
- Create: `src/db/schema.sql` (§6), `src/db/migrate.js`, `src/db/seed.js`, `scripts/seed.js`, `scripts/reset-db.js`, `src/utils/text.js`, `src/utils/money.js`, `src/utils/errors.js`, `tests/utils.test.js`, `tests/db.test.js`, `tests/helpers.js`
- Modify: `src/db/connection.js`

**Interfaces:**
- Produces:
  - `openDb(filename: string) → Database`. It sets `foreign_keys = ON`, plus `journal_mode = WAL` for file databases.
  - `migrate(db) → void`. It runs `schema.sql` and can safely run more than once.
  - `seedDemoData(db, { adminEmail, adminPassword, clientEmail, clientPassword }) → { created: boolean }`. It does nothing if any category already exists.
  - `toCents(input: string) → number`. Form values are always strings, and the seed writes cents directly. It parses the string itself (it never multiplies a float by 100): it accepts `"49,99"`, `"49.99"`, `"49"`, `" 49,9 "`, and throws `AppError(422)` for empty, negative, non-numeric or more than 2 decimals.
  - `formatPrice(cents: number) → string`. It uses `Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })` plus `' RON'`.
  - `slugify(text) → string` and `normalizeForSearch(text) → string`. Both remove accents with `normalize('NFD').replace(/\p{Diacritic}/gu, '')`.
  - `class AppError extends Error { constructor(message: string, status = 400) }` in `src/utils/errors.js`.
  - `tests/helpers.js`, as described in "Shared test fixture".

- [x] **Step 1: Write the failing tests** in `tests/utils.test.js`:
  ```js
  assert.equal(toCents('49,99'), 4999);   assert.equal(toCents('49.99'), 4999);
  assert.equal(toCents('49'), 4900);      assert.equal(toCents(' 49,9 '), 4990);
  for (const bad of ['', '-5', 'abc', '1,999']) assert.throws(() => toCents(bad), { status: 422 });
  assert.equal(formatPrice(4999), '49.99 RON');  assert.equal(formatPrice(124999), '1,249.99 RON');
  assert.equal(slugify('Rosé Satin Headband!'), 'rose-satin-headband');
  assert.equal(normalizeForSearch('Crème  BRÛLÉE'), 'creme brulee');
  ```
- [x] **Step 2: Write the failing tests** in `tests/db.test.js`:
  - `migrate twice does not throw`
  - `seedDemoData creates 1 admin, 1 client, 5 categories, 20 products, 3 delivery methods`. Count rows.
  - `seedDemoData is idempotent`: the second call returns `{ created: false }` and the counts stay the same.
  - `foreign keys are enforced`: inserting a product with `category_id = 999` throws `SQLITE_CONSTRAINT_FOREIGNKEY`.
  - `createTestContext inserts the shared fixtures`.
- [x] **Step 3:** Run `npm test`. Expected: FAIL.
- [x] **Step 4: Implement the functions above.** Demo seed content:
  - Categories: Stationery 📒, Hair Accessories 🎀, Beauty 💄, Decor 🕯️, Plushies 🧸, with 4 cute products each.
  - Suppliers: "Pink Atelier Ltd", "Petal Crafts", "Sweet Design".
  - Delivery methods: Standard courier (1599 cents, "2–3 business days"), Express courier (2499, "24 hours"), Locker pickup (999, "1–2 days"). Every product allows at least Standard courier.
  - Every product has 2–4 specs, stock between 0 and 30 (include one at 0 and one at 2), and `image_path = '/images/products/<slug>.jpg'` (its demo photo, see §4 "Photos").
  - `attachDemoImages(db) → { updated }` gives the demo products their photo in a database seeded before the photos existed. It only fills `image_path IS NULL`, so admin uploads are kept. `scripts/seed.js` calls it after `seedDemoData`.
  - Tests: `every demo product gets a photo that exists in public/images` and `attachDemoImages fills in missing demo photos and keeps uploaded ones`.
- [x] **Step 5:** Run `npm test`. Expected: PASS. Then run `npm run seed` and open `data/shop.db` in SQLite Viewer.
- [x] **Step 6: Commit:** `feat: SQLite schema, migration and demo seed`

### Task 3: Pink layout, design system and error pages

**Files:**
- Create: `public/css/tokens.css` (§4), `public/css/base.css`, `public/css/components.css`, `public/js/main.js`, `public/img/bow.svg`, `public/img/wave.svg`, `views/partials/header.ejs`, `views/partials/footer.ejs`, `views/partials/flash.ejs`, `views/errors/error.ejs`, `src/middleware/flash.js`, `src/middleware/errors.js`
- Modify: `views/layout.ejs`, `views/home.ejs`, `src/app.js`
- Test: `tests/smoke.test.js`

**Interfaces:**
- Produces:
  - `flash(req, type: 'success'|'error'|'info', message: string) → void`. The middleware moves it to `res.locals.flash` (an array) on the next request.
  - `notFound(req, res)` renders `errors/error` with 404 and "Oops! Page not found 🎀".
  - `errorHandler(err, req, res, next)`. An `AppError` renders with `err.status` and `err.message`. Anything else logs and renders 500 "Something went wrong 💔".
  - Every view receives `res.locals.currentUser` (null for now), `cartCount = 0` and `wishlistCount = 0`. Task 4 fills them in.

- [x] **Step 1: Write the failing test:** `GET /does-not-exist` returns 404 and the text contains `Page not found`.
- [x] **Step 2:** Run `npm test`. Expected: FAIL (Express's default 404 page).
- [x] **Step 3: Implement** the middleware and the layout (header, flash area, `<main>`, footer), and the home hero from §4. The category "bubbles" (emoji circles) and the "New arrivals" grid of the 8 newest products are added in Task 7, once the models exist.
- [x] **Step 4:** Run `npm test`. Expected: PASS.
- [x] **Step 5: Visual check** in the browser at 375 px and 1280 px (DevTools device toolbar). Expected: no horizontal scroll, a visible focus ring when you Tab, and a soft lift on card hover.
- [x] **Step 6: Commit:** `feat: pink design system, layout and error pages`

### Task 4: Authentication and roles (admin / client)

**Files:**
- Create: `src/models/userModel.js`, `src/controllers/authController.js`, `src/middleware/auth.js`, `src/utils/validation.js` (registration part), `views/auth/login.ejs`, `views/auth/register.ejs`, `views/admin/dashboard.ejs` (a placeholder for now), `src/controllers/adminDashboardController.js`, `tests/auth.test.js`
- Modify: `src/routes/index.js`, `views/partials/header.ejs`

**Interfaces:**
- Consumes: `AppError`, `flash`, `tests/helpers.js`.
- Produces:
  - `createUser(db, { name, email, password, role = 'client' }) → { id, name, email, role }`. It throws `AppError('An account with this email already exists.', 409)` if the email is taken.
  - `findUserById(db, id) → User | undefined`
  - `authenticate(db, email, password) → User | null`
  - `validateRegistration(body) → { data, errors }`. Rules: `name` 2–60 characters; `email` must contain `@`; `password` ≥ 8 characters; `passwordConfirm` must equal `password`. `errors` is keyed by field.
  - `loadCurrentUser(db)`. This middleware sets `req.user` and `res.locals.currentUser` from `req.session.userId`.
  - `requireLogin`. A guest is redirected to `/login?next=<original path>`.
  - `requireAdmin`. A guest is handled exactly like `requireLogin` (redirect with `next`). A client gets 403 "This area is for admins only 🔒".
  - `safeNext(next) → string`. It returns `next` only if it starts with `/` and not `//`; otherwise `/`.

- [x] **Step 1: Write the failing tests** in `tests/auth.test.js`:
  ```js
  // register → 302 to '/', then GET '/' contains 'Hi, Carla'
  // register with ana@test.local → 409, page contains 'An account with this email already exists.'
  // register with passwordConfirm ≠ password → 422, contains 'Passwords do not match.'
  // login ana / wrong password → 401, contains 'Wrong email or password.' and no session
  // login admin → 302 to '/admin'; login ana → 302 to '/'
  // login with next=//evil.example → 302 to '/' (no open redirect)
  // guest GET /admin → 302 to '/login?next=%2Fadmin'
  // ana GET /admin → 403
  // POST /logout → 302 '/', then GET /admin → 302 to login
  // the password is stored as a bcrypt hash: users.password_hash starts with '$2'
  ```
- [x] **Step 2:** Run `npm test`. Expected: FAIL.
- [x] **Step 3: Implement** the model, controller, middleware and views. Call `req.session.regenerate()` on login to prevent session fixation. The header shows "Hi, {name}", plus an "Admin" link when the user is an admin, and "Log out".
- [x] **Step 4:** Run `npm test`. Expected: PASS.
- [x] **Step 5: Commit:** `feat: login/register/logout with admin and client roles`

### Task 5: Admin — categories, suppliers and delivery methods

**Files:**
- Create: `src/models/categoryModel.js`, `src/models/supplierModel.js`, `src/models/deliveryMethodModel.js`, `src/controllers/adminLookupController.js`, `views/admin/lookup-list.ejs`, `views/admin/lookup-form.ejs`, `public/css/admin.css`, `tests/admin-lookups.test.js`
- Modify: `src/routes/index.js`, `views/admin/dashboard.ejs` (sidebar links)

**Interfaces:**
- Consumes: `requireAdmin`, `slugify`, `toCents`, `formatPrice`, `AppError`.
- Produces (every model has the same 5 functions):
  - `listCategories(db) → [{ id, name, slug, emoji, description, productCount }]`, `getCategoryById`, `getCategoryBySlug(db, slug)`, `createCategory(db, { name, emoji, description }) → id` (the slug comes from the name), `updateCategory(db, id, data)`, `deleteCategory(db, id)`
  - `listSuppliers`, `getSupplierById`, `createSupplier(db, { name, email, phone })`, `updateSupplier`, `deleteSupplier`
  - `listDeliveryMethods(db) → [{ id, name, priceCents, eta }]`, `getDeliveryMethodById`, `createDeliveryMethod(db, { name, priceCents, eta })`, `updateDeliveryMethod`, `deleteDeliveryMethod`
  - Each `delete*` throws `AppError('This … is used by products and cannot be deleted.', 409)` when products use the row (catch `SQLITE_CONSTRAINT_FOREIGNKEY`). A duplicate name throws a 409 `AppError`.
  - `createLookupController(config) → { list, newForm, create, editForm, update, remove }`. Here `config = { basePath, title, emoji, model, fields: [{ name, label, type: 'text'|'money'|'emoji'|'textarea', required }] }`. The controller handles all 3 entities with the 2 generic views.

- [x] **Step 1: Write the failing tests:**
  ```js
  // admin creates category { name: 'Jewelry', emoji: '💍' } → 302 to /admin/categories, flash 'Category saved ✨', slug 'jewelry'
  // admin edits a delivery method price to '19.99' → stored price_cents 1999
  // admin deletes 'stationery' (has products) → 409, contains 'cannot be deleted'
  // admin deletes a new empty supplier → row gone
  // creating a duplicate category name → 409
  // ana POST /admin/categories → 403 and no row created
  ```
- [x] **Step 2:** Run `npm test`. Expected: FAIL.
- [x] **Step 3: Implement** the models, the generic controller and the views. The list is a striped table with ✏️ Edit / 🗑️ Delete buttons, and `public/js/main.js` asks "Are you sure you want to delete this?" before submitting a delete.
- [x] **Step 4:** Run `npm test`. Expected: PASS.
- [x] **Step 5: Commit:** `feat: admin CRUD for categories, suppliers, delivery methods`

### Task 6: Admin — products CRUD (all 8 fields + image)

**Files:**
- Create: `src/models/productModel.js`, `src/utils/specs.js`, `src/middleware/upload.js`, `src/controllers/adminProductController.js`, `views/admin/products.ejs`, `views/admin/product-form.ejs`, `tests/admin-products.test.js`
- Modify: `src/utils/validation.js`, `src/routes/index.js`, `tests/utils.test.js`

**Interfaces:**
- Consumes: the Task 5 models (for the form selects and checkboxes), `toCents`, `slugify`, `normalizeForSearch`.
- Produces:
  - `parseSpecs(text: string) → [{ key, value }]`. It reads one `Key: Value` per line, trims both sides, and skips blank lines. A line without `:` throws `AppError('Line N must look like Key: Value', 422)`. `formatSpecs(specs) → string` does the reverse.
  - `validateProduct(body) → { data: ProductInput, errors }`. `ProductInput = { name, description, specs, priceCents, stock, categoryId, supplierId, deliveryMethodIds: number[] }`. Rules: name 2–120 characters; description ≥ 10 characters; price via `toCents` and > 0; stock is an integer ≥ 0; category and supplier are required; at least 1 delivery method.
  - `createProduct(db, input: ProductInput & { imagePath? }) → id`. It computes the unique slug (adding `-2`, `-3` … on collision) and `search_text`, and inserts the delivery-method links, all in one `db.transaction`.
  - `updateProduct(db, id, input)`. It replaces the delivery links, keeps the old image if `imagePath` is undefined, and sets `updated_at`.
  - `deleteProduct(db, id)`
  - `getProductById(db, id) → ProductDetail | undefined`. `ProductDetail = { id, name, slug, description, specs, priceCents, stock, imagePath, category: { id, name, slug, emoji }, supplier: { id, name }, deliveryMethods: [{ id, name, priceCents, eta }] }`
  - `productImageUpload`: multer `single('image')`, saved to `uploadsDir` with a random name. It accepts only `image/jpeg`, `image/png` and `image/webp`, up to 2 MB. Anything else gives a 422 field error "The image must be a JPG, PNG or WEBP file, max 2 MB."

- [x] **Step 1: Write the failing unit tests** in `tests/utils.test.js`:
  ```js
  assert.deepEqual(parseSpecs('Material: satin\n\nColor:  pale pink '), [
    { key: 'Material', value: 'satin' }, { key: 'Color', value: 'pale pink' }]);
  assert.throws(() => parseSpecs('Material satin'), { status: 422, message: /Line 1/ });
  ```
- [x] **Step 2: Write the failing route tests** in `tests/admin-products.test.js`:
  ```js
  // admin creates a product with every field (price '24.50', stock '7', specs, 2 delivery methods, a small PNG)
  //   → 302, and getProductById returns priceCents 2450, stock 7, 2 specs, 2 deliveryMethods, imagePath starting '/uploads/'
  // price '-5' → 422, the form is re-rendered WITH the typed values and contains 'Price must be greater than 0'
  // stock '2.5' → 422; no delivery method → 422 'Choose at least one delivery method.'
  // uploading a .txt as image → 422 and no product created
  // edit: change the price to '19,99' and leave the image empty → priceCents 1999 and imagePath unchanged
  // a duplicate name gets slug 'fluffy-pink-planner-2'
  // deleting 'planner' while it is in ana's cart and bianca's wishlist and in a past order
  //   → cart_items and wishlist_items rows are gone; order_items.product_name is still 'Fluffy Pink Planner' (product_id NULL)
  // ana POST /admin/products → 403
  ```
  (For the delete test, insert the past order directly with SQL in the test. `placeOrder` comes later, in Task 10.)
- [x] **Step 3:** Run `npm test`. Expected: FAIL.
- [x] **Step 4: Implement.** The form groups fields in pink cards: "Basic info", "Price & stock", "Category & supplier", "Delivery" (checkboxes), "Specifications" (a textarea with the placeholder `Material: satin`), and "Image" (with a preview). The admin list shows a thumbnail or emoji, the name, the price, and the stock with a ⚠️ butter pill when stock is below 5.
- [x] **Step 5:** Run `npm test`. Expected: PASS.
- [x] **Step 6: Commit:** `feat: admin product CRUD with specs, delivery methods and image upload`

### Task 7: Browsing products and categories (public catalog)

**Files:**
- Create: `src/controllers/catalogController.js`, `views/catalog/list.ejs`, `views/catalog/product.ejs`, `views/partials/product-card.ejs`, `views/partials/pagination.ejs`, `tests/catalog.test.js`
- Modify: `src/models/productModel.js`, `src/controllers/homeController.js`, `views/home.ejs`, `src/routes/index.js`

**Interfaces:**
- Consumes: `listCategories`, `getProductById`.
- Produces:
  - `listProducts(db, { categorySlug, q, sort = 'newest', page = 1, perPage = 12 }) → { items: ProductCard[], total, page, pages }`. `sort` is one of `newest | price_asc | price_desc | name`; an unknown value falls back to `newest`. `q` is run through `normalizeForSearch`, `%`, `_` and `\` are escaped, and it's matched with `search_text LIKE '%' || ? || '%' ESCAPE '\'` as a bound parameter. `ProductCard = { id, name, slug, priceCents, stock, imagePath, category: { name, slug, emoji } }`
  - `getProductBySlug(db, slug) → ProductDetail | undefined`

- [x] **Step 1: Write the failing tests:**
  ```js
  // GET / → contains 'New arrivals', the category bubbles 'Stationery' and 'Accessories', and 'Heart Pen'
  // GET /products → 200, shows all 4 fixture products
  // GET /products?category=accessories → contains 'Bow Hair Clips' and 'Rosé Satin Headband', NOT 'Heart Pen'
  // GET /products?q=rose → contains 'Rosé Satin Headband'   ← review focus #1 (no accents)
  // GET /products?q=PLANNER → contains 'Fluffy Pink Planner'
  // GET /products?sort=price_asc → 'Heart Pen' appears before 'Fluffy Pink Planner' in the HTML
  // GET /products?category=does-not-exist → 404
  // GET /products/fluffy-pink-planner → 200, shows '29.99 RON', 'Pink Atelier', 'Express courier', and the specs
  // GET /products/bow-hair-clips → contains 'Out of stock' and NO 'Add to cart' button
  // GET /products?q=%25 (a literal %) → 200 and does NOT list every product (escape % and _ with ESCAPE '\')
  ```
- [x] **Step 2:** Run `npm test`. Expected: FAIL.
- [x] **Step 3: Implement.**
  - The home page gets its category bubbles (`listCategories`) and the "New arrivals" grid (`listProducts({ sort: 'newest', perPage: 8 })`).
  - The catalog page has category pills along the top (the active one is filled `--rose-700`), a search box, a sort select, a responsive card grid (`grid-template-columns: repeat(auto-fill, minmax(220px, 1fr))`) and pagination.
  - The product page has the image on the left. On the right: the name, the price, a stock pill ("In stock" mint / "Only 2 left!" butter / "Out of stock" cherry), a specs table, the supplier, delivery chips with prices, and placeholder ♡ and "Add to cart" buttons (they start working in Tasks 8–9).
- [x] **Step 4:** Run `npm test`. Expected: PASS.
- [x] **Step 5: Commit:** `feat: public catalog with categories, search, sort and product page`

### Task M1: Milestone 1 — presentation (40% of the project grade)

- [ ] Run `npm run db:reset` for clean demo data (it comes with real product photos). Upload one photo through the admin form during the demo to show that the upload works.
- [ ] Take screenshots of the home, catalog, product page, admin product list, admin product form and the 403 page.
- [ ] **Slides (6–8)**, in the same pink palette:
  1. Title + "Blush & Bow 🎀"
  2. Requirements → status (the Milestone 1 rows of the §0 table, all ✅)
  3. Tech stack, and why
  4. MVC architecture diagram (browser → routes → controllers → models → SQLite, with views rendered back)
  5. Database diagram (the tables from §6)
  6. Screenshots
  7. Next steps (Milestone 2)
- [ ] **Live demo script (about 5 minutes):**
  1. Register a new client → the header shows "Hi, …".
  2. As that client, open `/admin` → the cute 403 page.
  3. Log in as admin → dashboard → create a category and a supplier → create a product with every field and an image → edit its price → delete a product.
  4. Log out → as a guest, browse home → category → product page (specs, supplier, delivery) → search "rose".
  5. Show the code folders (`models/`, `views/`, `controllers/`) and a table in SQLite Viewer.
  6. Run `npm test` → all green.
- [ ] Tag the commit: `git tag milestone-1 && git push --tags`

---

## Milestone 2 (week 11/12)

### Task 8: Shopping cart

**Files:**
- Create: `src/models/cartModel.js`, `src/controllers/cartController.js`, `views/cart/index.ejs`, `tests/cart.test.js`
- Modify: `src/middleware/auth.js` (`cartCount`), `views/catalog/product.ejs` (quantity + add button), `public/js/main.js` (qty steppers), `src/routes/index.js`

**Interfaces:**
- Produces:
  - `addToCart(db, userId, productId, quantity = 1) → { quantity, capped: boolean }`. It adds to an existing row. If the result would exceed the stock, it caps at the stock and returns `capped: true`. It throws `AppError('This product is out of stock.', 409)` when the stock is 0, and `AppError(404)` for an unknown product.
  - `setCartQuantity(db, userId, productId, quantity) → { quantity, capped }`. A quantity of 0 removes the row; a non-integer or negative value throws a 422.
  - `removeFromCart(db, userId, productId) → void`
  - `getCart(db, userId) → Cart`. `Cart = { items: [{ productId, name, slug, imagePath, emoji, unitPriceCents, quantity, stock, lineTotalCents }], itemCount, subtotalCents, deliveryOptions: [{ id, name, priceCents, eta }] }`. `deliveryOptions` holds the methods allowed by **every** item, and is empty when the cart is empty.
  - `countCartItems(db, userId) → number` (the sum of quantities)
  - `clearCart(db, userId) → void`

- [ ] **Step 1: Write the failing tests:**
  ```js
  // ana adds 'planner' twice → quantity 2; adds qty 10 → capped at 5, flash 'Only 5 added to your cart (max stock).'
  // adding 'clips' (stock 0) → 409 'This product is out of stock.' and no row
  // update quantity to 0 → the row is removed; update to '-1' or 'abc' → 422
  // getCart for planner×2 + pen×1 → subtotalCents 6997, itemCount 3, deliveryOptions = ['Express courier']
  // getCart for pen + headband → deliveryOptions = []   (used in Task 10)
  // GET /cart shows '69.97 RON' and the empty state 'Your cart is empty… for now 🛍️' when empty
  // the header badge shows 3 after adding planner×2 + pen×1
  // guest POST /cart/:id/add → 302 to /login?next=…
  ```
- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - The cart page shows a list of rows (thumbnail, name, unit price, ➖ qty ➕ stepper, line total, 🗑️) and a sticky summary card "Order summary" with the subtotal, "Delivery: chosen at the next step", and the "Continue to checkout" button.
  - If `deliveryOptions` is empty, show a butter warning: "The products in your cart don't share a delivery method. Please place them in separate orders."
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5: Commit:** `feat: shopping cart with stock caps and delivery options`

### Task 9: Wishlist / favorites flow

**Files:**
- Create: `src/models/wishlistModel.js`, `src/controllers/wishlistController.js`, `views/wishlist/index.ejs`, `tests/wishlist.test.js`
- Modify: `src/middleware/auth.js` (`wishlistCount`), `views/partials/product-card.ejs`, `views/catalog/product.ejs`, `src/routes/index.js`

**Interfaces:**
- Consumes: `requireLogin`, the `ProductCard` shape from Task 7, and `addToCart` from Task 8 (for "Move to cart").
- Produces:
  - `toggleWishlist(db, userId, productId) → boolean` (true = the product is now in the wishlist). It throws `AppError(404)` for an unknown product.
  - `listWishlist(db, userId) → ProductCard[]`, newest first.
  - `getWishlistIds(db, userId) → Set<number>`, so the cards can show ♥ (filled) or ♡.
  - `countWishlist(db, userId) → number`

- [ ] **Step 1: Write the failing tests:**
  ```js
  // ana toggles 'pen' → 302 back (Referer), wishlist_items has (ana, pen); toggling again removes it
  // GET /wishlist as ana → contains 'Heart Pen'; as bianca → does NOT (each user has her own list)
  // guest POST /wishlist/:id/toggle → 302 to /login?next=…
  // toggling product id 9999 → 404
  // an empty wishlist shows 'No favorites yet 💗'
  // move-to-cart: ana moves 'pen' → it is in cart_items with qty 1 and gone from the wishlist
  // move-to-cart for 'clips' (stock 0) → flash 'This product is out of stock.' and it stays in the wishlist
  ```
- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement.** The heart button is a `<form method="post">` with an `aria-pressed` state and a tiny CSS "pop" animation (none under `prefers-reduced-motion`). The wishlist page is a card grid with "Move to cart" and "Remove" buttons.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5: Commit:** `feat: wishlist (favorite) flow`

### Task 10: Checkout flow (entering shipping data and placing the order)

**Files:**
- Create: `src/models/orderModel.js` (`placeOrder`), `src/controllers/checkoutController.js`, `src/utils/labels.js`, `views/checkout/form.ejs`, `views/checkout/confirmation.ejs`, `tests/checkout.test.js`
- Modify: `src/utils/validation.js`, `src/routes/index.js`

**Interfaces:**
- Consumes: `getCart`, `clearCart`.
- Produces:
  - `validateCheckout(body, { allowedDeliveryIds: number[] }) → { data: CheckoutData, errors }`. `CheckoutData = { fullName, email, phone, address, city, county, postalCode, notes, deliveryMethodId, paymentMethod }`. Rules:
    - `fullName`: 3–100 characters
    - `email`: contains `@`
    - `phone`: `/^(\+40|0)7\d{8}$/` (mobile number format in Romania) after removing spaces, dots and dashes
    - `address`: 5–200 characters
    - `city`: 2–60 characters
    - `county`: 2–60 characters
    - `postalCode`: `/^\d{6}$/`
    - `notes`: ≤ 500 characters
    - `deliveryMethodId`: in `allowedDeliveryIds`
    - `paymentMethod`: `cash_on_delivery | card_on_delivery`
  - `placeOrder(db, userId, data: CheckoutData) → orderId`. Inside **one** `db.transaction`, in this order:
    1. Read the cart. If it's empty, throw `AppError('Your cart is empty.', 400)`.
    2. Check that the delivery method is in `cart.deliveryOptions`; otherwise throw a 422.
    3. Check every item: if `product.stock < quantity`, throw `AppError('Not enough stock for "{name}": only {stock} left.', 409)`.
    4. Insert the order (with the delivery name and price snapshot, subtotal, and total = subtotal + delivery).
    5. Insert the `order_items` snapshots.
    6. Run `UPDATE products SET stock = stock - ?`.
    7. Clear the cart.
  - `STATUS_LABELS = { placed: 'Placed', processing: 'Processing', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled' }`, `PAYMENT_LABELS = { cash_on_delivery: 'Cash on delivery', card_on_delivery: 'Card on delivery (courier POS)' }`, `formatOrderNumber(id) → 'BB-000042'`

- [ ] **Step 1: Write the failing tests:**
  ```js
  // GET /checkout with an empty cart → 302 to /cart with flash 'Your cart is empty.'
  // the GET /checkout form is prefilled with ana's name and email, and lists ONLY the cart's delivery options
  // valid POST (planner×2, Standard courier, cash on delivery) → 302 to /checkout/confirmation/:id; the order has
  //   subtotal_cents 5998, delivery_price_cents 1599, total_cents 7597, status 'placed';
  //   order_items snapshot ('Fluffy Pink Planner', 2999, 2); planner stock 5 → 3; ana's cart is empty
  // phone '12345' → 422 'This phone number is not valid.'; nothing is written
  // postalCode '0123' → 422; empty county → 422
  // delivery 'Express courier' when the cart has headband (standard only) → 422
  // stock race: ana has planner×5 in her cart; set planner.stock = 4 directly in the DB; POST → 409 containing
  //   'Not enough stock for "Fluffy Pink Planner"'; NO order row, stock still 4, ana's cart still has 5   ← review focus #2
  // a double submit (POST twice quickly) → exactly 1 order (the second POST finds an empty cart)
  // the confirmation page of bianca's order opened by ana → 404
  ```
- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - The form is two columns on desktop. On the left are cards "1. Shipping details", "2. Delivery method" (radio cards with price and ETA) and "3. Payment" (radio cards). On the right is a summary that updates the total when the delivery option changes (`public/js/main.js`; the server recalculates anyway).
  - When validation fails, the form is re-rendered with the typed values and the error under each field.
  - The confirmation page shows "Thank you! Order BB-000042 has been placed ✨", a summary, and "View my orders".
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5: Commit:** `feat: checkout with validation, delivery choice and transactional order placement`

### Task 11: Order history (client) and order management (admin)

**Files:**
- Create: `src/controllers/orderController.js`, `src/controllers/adminOrderController.js`, `views/orders/index.ejs`, `views/orders/show.ejs`, `views/admin/orders.ejs`, `views/admin/order.ejs`, `tests/orders.test.js`
- Modify: `src/models/orderModel.js`, `src/controllers/adminDashboardController.js`, `views/admin/dashboard.ejs`, `src/routes/index.js`

**Interfaces:**
- Produces:
  - `listOrdersForUser(db, userId) → [{ id, number, status, statusLabel, totalCents, itemCount, createdAt }]`, newest first
  - `getOrderForUser(db, userId, orderId) → OrderDetail | undefined`. It returns `undefined` when the order belongs to someone else. `OrderDetail` = all the order columns in camelCase + `items: [{ productName, unitPriceCents, quantity, lineTotalCents, productSlug | null }]`
  - `listAllOrders(db, { status } = {}) → [... + customerName]`
  - `getOrderById(db, orderId) → OrderDetail | undefined`
  - `updateOrderStatus(db, orderId, status) → void`. An unknown status throws a 422.
  - `getDashboardStats(db) → { productCount, lowStockCount (stock < 5), orderCount, ordersByStatus: { placed, … }, revenueCents (non-cancelled) }`

- [ ] **Step 1: Write the failing tests:**
  ```js
  // ana with 2 orders → GET /orders lists BB-… numbers, newest first, with status 'Placed' and totals in RON
  // GET /orders/:id of bianca's order as ana → 404   ← review focus #4
  // the order detail still shows '29.99 RON' for the planner after the admin changes its price to 39.99   ← snapshot
  // admin GET /admin/orders?status=placed lists both users' orders with customer names
  // admin POST /admin/orders/:id/status { status: 'shipped' } → ana's /orders shows 'Shipped'
  // status 'teleported' → 422; ana POST /admin/orders/:id/status → 403
  // admin dashboard shows the product count, low stock count and orders by status
  ```
- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement.** The client history is a list of cards (number, date in `en-GB` format, status pill, total, "Details"). The detail page has a small status timeline (Placed → Processing → Shipped → Delivered) with the current step highlighted. The admin side gets an orders table with a status filter, a detail page with a status `<select>`, and real stat cards on the dashboard.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5: Commit:** `feat: order history for clients and order management for admin`

### Task 12: Final polish, README and accessibility pass

**Files:**
- Modify: `README.md`, CSS files, any view that needs fixes

- [ ] **Step 1: Write the README:** what the app is, requirements, setup (`npm install`, copy `.env.example` → `.env`, `npm run seed`, `npm run dev`), how to run the tests, a feature list mapped to the course requirements, screenshots, and the tech stack.
- [ ] **Step 2: Accessibility check:** keyboard-only walk-through (Tab through the header, catalog, cart and checkout), every image has `alt`, every input has a `<label>`, and Chrome DevTools → Lighthouse → Accessibility ≥ 90.
- [ ] **Step 3: Responsive check** at 375 / 768 / 1280 px on every page. Expected: no horizontal scroll, and the admin sidebar collapses to a top bar.
- [ ] **Step 4: Run** `npm test`. Expected: all green, 0 failures.
- [ ] **Step 5: Commit and push:** `docs: README, polish and accessibility fixes`

### Task M2: Milestone 2 — presentation (60% of the project grade)

- [ ] Run `npm run db:reset` and place 2–3 demo orders with different statuses.
- [ ] **Slides (6–8):** what changed since Milestone 1, the Milestone 2 rows of the §0 table (all ✅), the purchase-flow diagram (cart → checkout → transaction → history), the "How I protect the data" slide (bcrypt, roles, snapshot prices, transaction + stock check, SQL parameters), screenshots, and the test count.
- [ ] **Live demo script (about 6 minutes):**
  1. Log in as the client → ♡ two products → `/wishlist` → "Move to cart".
  2. Cart: change the quantity, try more than the stock (the cap message), remove an item.
  3. Checkout: type a wrong phone number (the error), fix it, pick a delivery method (the total updates), place the order → ✨ confirmation.
  4. `/orders` → the order detail with its status timeline.
  5. Log in as admin → the product's stock dropped → `/admin/orders` → change the status to "Shipped".
  6. Back as the client → the status updated. Run `npm test` → all green.
- [ ] Tag the commit: `git tag milestone-2 && git push --tags`

---

## 9. Bonus ideas (for an outstanding project, only after Task 12)

Pick 1–2. Each should be its own small task with tests.
- **Discount codes** (e.g. `PINK10` = −10%, with a minimum order value and an expiry date) at checkout.
- **Free shipping over 200 RON**, with a progress bar in the cart: "You're 34.01 RON away from free shipping 🎀".
- **Product reviews and a ⭐ rating** (only for clients who bought the product).
- **Advanced filters:** price range, supplier, delivery method, "in stock only" (combined with AND).
- **PayPal Sandbox payment** as a third payment method, reusing the server code from the lab homework. This connects the two projects nicely.
- **Deploy** to a free host (e.g. Render) for a public demo link.
