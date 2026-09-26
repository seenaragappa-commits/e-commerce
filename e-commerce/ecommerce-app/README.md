# ShopSphere

**Simple Shopping. Smarter Experience.**

A full-stack **MERN** e-commerce web application (MongoDB, Express, React, Node.js) with a customer storefront
and an admin dashboard, built as a college project.

---

## Project Overview

ShopSphere is an online store where customers browse a product catalog, fill a shopping cart, check out and
follow their orders on a live tracking timeline, while administrators manage products, inventory, orders and
customers from a dedicated dashboard.

- **Frontend:** a React single-page application (Vite, React Router, Tailwind CSS).
- **Backend:** a REST API built with Node.js and Express.
- **Database:** MongoDB accessed through Mongoose.
- **Security:** JWT authentication, bcrypt password hashing and role-based access control enforced on the server.

## Problem Statement

Small online shops need more than a product page: customers expect search, a reliable cart, a simple checkout and
visibility of where their order is, and store owners need a safe way to manage stock and orders without editing the
database by hand. A naive implementation trusts the browser - for example prices, user ids or roles sent by the
client - which allows customers to change what they pay or access admin functions.

ShopSphere solves this with a complete, secure shopping workflow in which **the server is the single source of
truth**: it authenticates every request, checks roles in the database, calculates prices from the database,
controls stock atomically and enforces the order status rules.

## Objectives

1. Build a responsive storefront with product browsing, search, filtering, sorting and product details.
2. Implement a persistent shopping cart with stock-aware quantities and correct totals.
3. Implement checkout with shipping validation, a payment choice and server-side order creation.
4. Provide order history and a live order-tracking timeline driven by the database.
5. Secure the application with JWT authentication, bcrypt password hashing and role-based authorization.
6. Build an admin dashboard for statistics, product CRUD, inventory, order status management and customers.
7. Keep inventory consistent: reduce stock on purchase, prevent overselling, restore stock on cancellation.
8. Deliver clean, documented, tested code that can be set up and demonstrated easily.

## Features

### Customer
- **Registration, login and logout** with validation on both the client and the server.
- **Product catalog** with pagination, **search** (name, description, category), **filters** (category, price
  range, in stock only) and **sorting** (newest, price low/high, top rated, name). Filters live in the URL.
- **Product details** - image, rating, price, stock status (`In stock`, `Only 3 left`, `Out of Stock`), a quantity
  selector limited by stock and related products.
- **Cart** - add, change quantity, remove, clear; saved in the browser and re-checked against the server (price and
  stock) whenever the cart or checkout opens. Out-of-stock products cannot be added.
- **Checkout** - validated shipping form, **Cash on Delivery** or **Demo Card** payment (simulated: no card data is
  collected, no money is charged), order summary with server-verified totals.
- **Order confirmation, My Orders and order details.**
- **Live order tracking** - `✓ done  ● current  ○ upcoming` timeline built from the order's status history in
  MongoDB. The page re-checks the order every 15 seconds (and when you return to the browser tab), so a status set
  by the admin appears without reloading. Cancelled orders are shown in red.
- **Cancel an order** while it is *Order Placed* or *Confirmed*; **profile** with order statistics, name/email
  update and password change.

### Admin (`/admin`)
- **Dashboard** - total revenue, orders, products and customers; *Pending / Processing / Shipped / Delivered*
  order cards; revenue for the last 7 days (bar chart with a table view); sales by category; recent orders;
  low-stock products; recent products; orders by status.
- **Products** - table (image, name, category, price, stock, rating, actions) with search, category and
  stock-level filters and sorting; **add**, **edit** (with validation and image preview) and **delete** (with a
  confirmation dialog).
- **Orders** - table (order ID, customer, date, items, total, payment status, order status, action) with status,
  payment and text filters; order details (customer, shipping address, products, quantities, prices, subtotal,
  shipping, total, payment, status history); **status updates** one step at a time with an optional note, and
  cancellation with confirmation.
- **Customers** - name, email, role, registration date, order count and total spent (never passwords).
- **Profile**, responsive sidebar (slide-in menu on phones and tablets).

### Inventory
- Stock is reduced when an order is placed and restored when it is cancelled.
- **Low stock** = 5 units or fewer (shown on the dashboard); stock 0 is shown as **"Out of Stock"**.
- Buying more than the available stock is refused by the server; the cart adjusts itself automatically.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, React Router 8, Axios, Context API, Tailwind CSS 4, lucide-react icons |
| Backend | Node.js, Express 5, jsonwebtoken (JWT), bcryptjs, helmet, cors, morgan, dotenv |
| Database | MongoDB with Mongoose 9 |
| Testing and quality | Node.js test runner, Supertest, mongodb-memory-server, ESLint |

## System Architecture

```
┌──────────────────────────┐   HTTP + JSON             ┌─────────────────────────────────────┐   Mongoose   ┌───────────┐
│  React SPA (Vite)        │   Authorization:          │  Express REST API (/api)             │              │  MongoDB  │
│  http://localhost:5173   │   Bearer <JWT>            │  http://localhost:5000               │              │           │
│                          │ ────────────────────────▶ │  routes -> middleware -> controllers │ ───────────▶ │  users    │
│  pages, components,      │                           │          -> services -> models       │              │  products │
│  context, services       │ ◀──────────────────────── │  central error handler               │ ◀─────────── │  orders   │
└──────────────────────────┘   JSON response           └─────────────────────────────────────┘              └───────────┘
```

Example request - an admin marks an order as *Shipped*:

1. React calls `PUT /api/admin/orders/:id/status` with the admin's token and `{ "status": "Shipped" }`.
2. `protect` verifies the JWT and loads the user **from MongoDB**; `admin` checks that this user's role is `admin`.
3. The controller checks that *Shipped* is a known status **and** the allowed next step for this order.
4. The order service updates the order and appends to its `statusHistory` in a single database operation.
5. The customer's tracking page reads the new status from the API on its next refresh.

## Frontend Architecture

```
client/src/
├── main.jsx          Entry point: Router + Toast, Auth and Cart providers
├── App.jsx           All routes (store, protected customer pages, lazy-loaded admin area)
├── layouts/          MainLayout (navbar + footer), AuthLayout, AdminLayout (sidebar)
├── pages/            Home, Products, ProductDetails, Cart, Checkout, OrderSuccess, MyOrders,
│   │                 OrderDetails, Profile, Login, Register, NotFound
│   └── admin/        Dashboard, Products, ProductForm, Orders, OrderDetails, Users, Profile
├── components/       Reusable UI: Navbar, Footer, ProductCard, OrderTimeline, StatCard, InfoCard,
│   │                 StatusHistory, AddressBlock, ConfirmDialog, EmptyState, ErrorState, ProtectedRoute...
│   └── admin/        Dashboard charts and the admin page header
├── context/          AuthContext (user + token), CartContext (cart), ToastContext (notifications)
├── hooks/            useFetch (loading/error), useAutoRefresh (live tracking), useLogout
├── services/         Axios API calls: auth, products, orders, admin
└── utils/            Constants, formatting, validation, order helpers, URL helpers, storage
```

- **State:** the logged-in user and the cart live in React Context; the cart is saved in `localStorage`.
- **API layer:** one Axios instance adds the JWT to every request and logs the user out on a `401`.
- **Routing guards:** `ProtectedRoute` sends logged-out users to the login page (and back afterwards) and shows
  an *Admins only* page to customers. The admin pages are lazy-loaded, so customers never download that code.
- **UX states:** every data page has loading, empty and error states; actions show success/error notifications;
  destructive actions ask for confirmation.

## Backend Architecture

```
server/
├── server.js         Starts the API (checks env variables, connects to MongoDB)
├── app.js            Express app: helmet, CORS, JSON body limit, routes, 404 + error handler
├── config/           Environment loading and MongoDB connection
├── routes/           authRoutes, productRoutes, orderRoutes, adminRoutes
├── middleware/       protect (JWT), admin (role), loginLimiter, validateObjectId, error handler
├── controllers/      auth, product, order (customer), admin (stats, users), adminOrder
├── services/         orderService - pricing, stock reservation/restore, order status rules
├── models/           User, Product, Order (Mongoose schemas with validation)
├── utils/            constants, validators, helpers, ApiError, token and order-number generators
├── seed/             seed.js (command), seeder.js, data/ (users, products, sample orders)
├── scripts/demo.js   Demo mode: temporary MongoDB, auto-seeded
└── tests/            API integration tests + unit tests
```

- **Layers:** routes only map URLs; controllers handle HTTP input/output; the order service holds the business
  rules shared by several controllers; models validate data.
- **Errors:** controllers throw `ApiError(status, message)`; one error handler turns every error (including
  Mongoose validation and duplicate keys) into `{ "message": "...", "errors": { ... } }`.
- **Business rules on the server:** prices and totals are calculated from the database, the order owner comes from
  the token, stock is changed with conditional atomic updates and order statuses follow a fixed flow.

## Database Design

**User**

| Field | Type | Rules |
|---|---|---|
| `name` | String | required, 2-50 characters |
| `email` | String | required, unique, lowercase, valid format |
| `password` | String | bcrypt hash, never returned by queries (`select: false`) |
| `role` | String | `user` (default) or `admin` - cannot be set through the API |
| `createdAt`, `updatedAt` | Date | timestamps (registration date) |

**Product**

| Field | Type | Rules |
|---|---|---|
| `name` | String | required, 2-120 characters |
| `description` | String | required, 10-2000 characters |
| `price` | Number | required, greater than 0 |
| `category` | String | Electronics, Fashion, Home, Accessories or Gaming |
| `image` | String | `http(s)://` URL or a site path such as `/images/products/mug.svg` |
| `stock` | Number | whole number, 0 or more |
| `rating` | Number | 0-5, editable by admins; `numReviews` is seeded demo data |
| `isFeatured` | Boolean | shown on the home page |

**Order**

| Field | Type | Rules |
|---|---|---|
| `orderNumber` | String | unique, readable (e.g. `SS-260925-K7Q4M`) |
| `user` | ObjectId → User | taken from the JWT, never from the request body |
| `orderItems[]` | `{ product, name, image, price, quantity }` | snapshot copied from the database at checkout |
| `shippingAddress` | `{ fullName, email, phone, address, city, state, postalCode, country }` | validated |
| `paymentMethod` / `paymentStatus` | String | `Cash on Delivery` / `Demo Card`; `Pending`, `Paid`, `Refunded`, `Cancelled` |
| `itemsPrice`, `shippingPrice`, `totalPrice` | Number | calculated on the server |
| `orderStatus` | String | `Order Placed` → `Confirmed` → `Processing` → `Shipped` → `Out for Delivery` → `Delivered`, or `Cancelled` |
| `statusHistory[]` | `{ status, note, date }` | one entry per change - the tracking timeline is built from it |
| `estimatedDelivery`, `paidAt`, `deliveredAt`, `cancelledAt` | Date | |

Relationships: **one User has many Orders**; an Order references Products but keeps its own copy of name, image and
price, so old orders stay correct when a product is edited or deleted.

## API Endpoints

Base URL `http://localhost:5000/api`. Private routes need the header `Authorization: Bearer <token>`.

### Auth
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | `{ name, email, password, confirmPassword }` → `{ user, token }` |
| POST | `/auth/login` | Public | `{ email, password }` → `{ user, token }` |
| GET | `/auth/me` | Logged in | The current user |
| PUT | `/auth/profile` | Logged in | Update name/email; change password with `{ currentPassword, newPassword, confirmPassword }` |

### Products
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/products` | Public | Query: `keyword`, `category`, `minPrice`, `maxPrice`, `inStock=true`, `stock=in\|low\|out`, `featured=true`, `sort=newest\|price-asc\|price-desc\|rating\|name\|stock-asc`, `page`, `limit` |
| GET | `/products/categories` | Public | Categories with product counts |
| GET | `/products/:id` | Public | One product |
| POST | `/products` | Admin | Create `{ name, description, price, category, image, stock, rating?, isFeatured? }` |
| PUT | `/products/:id` | Admin | Update any of those fields |
| DELETE | `/products/:id` | Admin | Delete (existing orders keep their copy) |

### Orders (customer)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/orders` | Logged in | `{ orderItems: [{ product, quantity }], shippingAddress, paymentMethod }` |
| GET | `/orders/myorders` | Logged in | The user's own orders |
| GET | `/orders/:id` | Owner or admin | One order (used by the tracking page) |
| PUT | `/orders/:id/cancel` | Owner | Cancel while *Order Placed* / *Confirmed*; stock is restored |

### Admin (all routes require `protect` + `admin`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/stats?tz=<time zone>` | Totals, revenue, orders per stage/status, low-stock data, recent orders/products, 7-day sales, sales by category |
| GET | `/admin/users` | All accounts (no passwords) with order count, total spent and last order |
| GET | `/admin/orders` | Query: `status` (one or comma-separated), `paymentStatus`, `keyword`, `page`, `limit` |
| GET | `/admin/orders/:id` | Order + customer + `customerStats` + `allowedStatuses` (valid next statuses) |
| PUT | `/admin/orders/:id/status` | `{ status, note? }` - one step forward, or `Cancelled` before delivery |

`GET /api/health` returns `{ status, database: "connected" | "disconnected" }`.

**Status codes:** `200` OK · `201` created · `400` invalid input or status change · `401` not logged in / invalid
token · `403` not allowed (customer on admin routes, someone else's order) · `404` not found · `409` conflict (email
taken, not enough stock) · `429` too many failed logins · `500` server error.
Errors always look like `{ "message": "...", "errors": { "field": "message" } }`.

## Authentication

1. **Register:** the server validates the input, hashes the password with **bcrypt** (in the User model's
   pre-save hook) and stores the user with the role `user`. A `role` sent by the browser is ignored.
2. **Login:** the password is compared with the stored hash. Wrong email and wrong password return the same
   message, so accounts cannot be discovered. After **10 failed attempts** for the same email from the same IP
   address, login is refused for **15 minutes** (`429`).
3. **Token:** on success the server returns a **JWT** signed with `JWT_SECRET` (from the environment) that
   contains only the user id and expires after `JWT_EXPIRES_IN` (default 7 days).
4. **Requests:** React stores the token in `localStorage` and sends it as `Authorization: Bearer <token>`.
   The `protect` middleware verifies it and loads the user from MongoDB for every request.
5. **Logout** removes the token in the browser; an expired or invalid token logs the user out automatically.

## Role-Based Access Control

| | Guest | Customer (`user`) | Admin (`admin`) |
|---|---|---|---|
| Browse, search, product details, cart | ✓ | ✓ | ✓ |
| Checkout, My Orders, tracking, profile | - | ✓ (own orders only) | ✓ |
| Admin dashboard, products CRUD, all orders, status updates, customers | - | - | ✓ |

- **The server enforces every rule.** Admin routes use `protect` + `admin`; the role is read **from the database**
  on every request, so a token can never "claim" admin rights and a demoted admin loses access immediately.
- Customers can only read and cancel **their own** orders (`403` otherwise).
- The React app mirrors the rules for convenience only: customers who open `/admin` see an *Admins only* page and
  the admin code is never downloaded for them.
- Accounts created through registration are always customers; the admin account comes from the seed data.

## Installation

**Prerequisites**
- **Node.js 22.22 or newer** (Node 24 LTS recommended) - check with `node -v`.
- **MongoDB** - a local [MongoDB Community Server](https://www.mongodb.com/try/download/community) or a free
  [MongoDB Atlas](https://www.mongodb.com/atlas) cluster. Without MongoDB you can use demo mode (see
  [Database Setup](#database-setup)).

```bash
cd ecommerce-app/server
npm install

cd ../client
npm install
```

> The first `npm install` in `server/` also downloads a MongoDB binary for `mongodb-memory-server` (used by the
> tests and by demo mode). This can take a few minutes, once.

## Environment Variables

Create `server/.env` from the template:

```bash
cd ecommerce-app/server
cp .env.example .env        # Windows (cmd): copy .env.example .env
```

| Variable | Required | Default | Description |
|---|---|---|---|
| `MONGO_URI` | yes | - | MongoDB connection string, e.g. `mongodb://127.0.0.1:27017/shopsphere` |
| `JWT_SECRET` | yes | - | Long random string used to sign tokens (the server warns if it is shorter than 32 characters) |
| `PORT` | no | `5000` | Port of the API |
| `CLIENT_URL` | no | `http://localhost:5173` | Browser origin(s) allowed by CORS, comma-separated |
| `JWT_EXPIRES_IN` | no | `7d` | Token lifetime |
| `NODE_ENV` | no | `development` | `development` logs requests; `production` hides internal error details |

Generate a strong secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

**Client** (optional) - copy `client/.env.example` to `client/.env` only if the API is not on
`http://localhost:5000/api`, and set `VITE_API_URL`. `.env` files are git-ignored; never commit real secrets.

## Database Setup

**Option A - local MongoDB:** install MongoDB Community Server, make sure it is running (Windows: the
*MongoDB Server* service) and keep `MONGO_URI=mongodb://127.0.0.1:27017/shopsphere`. The database and collections
are created automatically.

**Option B - MongoDB Atlas:** create a free cluster and a database user, allow your IP address and use
`MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/shopsphere`.

**Option C - demo mode (no MongoDB installation needed):**

```bash
cd ecommerce-app/server
npm run demo
```

Demo mode starts a temporary MongoDB server, seeds it and runs the API on port 5000. Its data is reset every time it
starts (temporary files in the git-ignored `server/.demo-db/`). Stop it with `Ctrl + C`.

Check the connection at `http://localhost:5000/api/health` → `"database": "connected"`.

## Seed Data

```bash
cd ecommerce-app/server
npm run seed            # deletes all data and loads the demo data
npm run seed:destroy    # deletes all users, products and orders
```

The seed creates:
- **16 products** in 5 categories, including low-stock and out-of-stock items;
- **5 users** - the admin, the demo customer and three sample customers (passwords are hashed);
- **8 sample orders** covering every order status over the last two weeks, so the dashboard, charts and tracking
  pages have data immediately.

## Running the Application

Use two terminals.

```bash
# Terminal 1 - backend API on http://localhost:5000/api
cd ecommerce-app/server
npm run dev          # auto-restart on changes (or: npm start)   |   no MongoDB? npm run demo
```

```bash
# Terminal 2 - frontend on http://localhost:5173
cd ecommerce-app/client
npm run dev
```

Open **http://localhost:5173** (store) and **http://localhost:5173/admin** (admin dashboard).
Production build: `npm run build` in `client/` (output in `client/dist`); `npm run preview` serves that build on
the same port 5173, which the API allows.

### Troubleshooting

| Problem | Fix |
|---|---|
| `Could not connect to MongoDB` | Start MongoDB or check `MONGO_URI`. No MongoDB? Use `npm run demo`. |
| `Missing environment variable(s)` | Create `server/.env` from `.env.example`. |
| "Cannot reach the ShopSphere server" in the app | The API is not running - start it in `server/`. |
| CORS error in the browser console | `CLIENT_URL` in `server/.env` must match the address of the React app. |
| `Port 5173 / 5000 is already in use` | Stop the other process (for example a second dev server or demo mode). |
| No products on the home page | Run `npm run seed` in `server/` (or use demo mode). |
| "Too many failed login attempts" | Wait 15 minutes or restart the API (the counter is kept in memory). |

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@example.com` | `Admin@123` |
| **Customer** | `user@example.com` | `User@123` |
| Sample customers | `maria@example.com`, `david@example.com`, `sara@example.com` | `Customer@123` |

The login page has buttons that fill in the admin and customer accounts. `user@example.com` starts with a delivered
and a shipped order, so tracking can be shown immediately.

**Suggested demonstration:** customer - home → products → search → product → add to cart → cart → checkout → place
order → confirmation → My Orders → tracking; then log out and log in as admin - dashboard → products → add/edit a
product → orders → open the new order → change its status → the customer's tracking page updates.

## Testing

### Automated tests

```bash
cd ecommerce-app/server
npm test          # 88 tests: API integration tests (real in-memory MongoDB) + unit tests
npm run lint

cd ../client
npm run lint
npm run build
```

| File | Covers |
|---|---|
| `auth.test.js` (15) | registration, bcrypt hashing, login, identical error for wrong email/password, login lockout, forged tokens, profile and password change |
| `products.test.js` (20) | search, filters, sorting, inventory filters, admin-only CRUD, validation (price > 0, stock ≥ 0, rating, image URL) |
| `orders.test.js` (17) | server-side pricing, shipping, stock reduction, stock limits (incl. two simultaneous orders), order owner from the token, own-orders-only, cancellation |
| `admin.test.js` (29) | 401/403/200 on every admin endpoint, role read from the database, order filters, one-step status transitions, final states, cancellation with stock restore, tracking integration, dashboard statistics, customer list without passwords |
| `utils.test.js` (7) | sales-chart calendar days (incl. daylight-saving changes), order status rules |

### Manual verification checklist
- **Customer:** register, log in, browse, search, filter, sort, product details, add to cart, change quantity,
  remove, checkout (with invalid then valid shipping data), place order, confirmation, My Orders, order details,
  tracking; log out.
- **Admin:** dashboard statistics, add / edit / delete a product (confirmation dialog), orders list and filters,
  order details, status changes, cancellation, customers.
- **Authorization:** as a customer open `/admin` (shows *Admins only*) and call an admin API with the customer's
  token (`403`, nothing changes).
- **Tracking:** keep the customer's order page open while the admin changes the status - it updates by itself.
- **Inventory:** set a product's stock to 1, buy it, confirm it shows *Out of Stock* and cannot be bought again;
  try to order more than the stock (refused).
- **Responsive:** phone (375 px), tablet (768 px), laptop (1024 px) and desktop (1440 px) - no horizontal scrolling.

## Learning Outcomes

- Designing a **REST API** with Express: routing, middleware, controllers, services and centralised error handling.
- **Data modelling** with MongoDB and Mongoose: schemas, validation, references, snapshots and indexes.
- **Authentication and security:** bcrypt hashing, JWT, brute-force protection, role-based authorization and why
  prices, user ids and roles must never be trusted from the client.
- **Consistency under concurrency:** atomic conditional updates that prevent overselling and double cancellation.
- **React application structure:** routing and route guards, Context API state, custom hooks, reusable components,
  lazy loading and responsive design with Tailwind CSS.
- **State machines in business logic:** the order status flow, enforced on the server and reflected in the UI.
- **Testing and quality:** API integration tests against a real database, linting, and manual end-to-end checks.

## Future Enhancements

- Real payment gateway (e.g. Stripe or Razorpay) instead of the simulated demo card.
- Verified-buyer reviews that calculate the product rating automatically (ratings are currently seed data or set by
  the admin).
- Image uploads to cloud storage instead of image URLs.
- Email / SMS notifications when an order status changes.
- Push-based live tracking with WebSockets or Server-Sent Events (the tracking page currently re-checks every 15 s).
- Refresh tokens in httpOnly cookies instead of `localStorage`; a shared rate-limit store (e.g. Redis) for several
  servers.
- MongoDB transactions (on a replica set such as Atlas) so that stock changes and order updates are all-or-nothing;
  today they are separate writes with compensation (see `server/services/orderService.js`).
- Wishlist, coupons, saved addresses and PDF invoices; admin reports with date ranges and CSV export.
- Docker Compose setup, CI pipeline and automated browser tests.

---

*Payments are simulated: "Demo Card" does not collect card details and does not contact any payment provider. Do not
enter real card data anywhere in this demo.*
