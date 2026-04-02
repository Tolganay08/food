# FoodDash — Full-Stack Food Delivery Platform

A complete, production-ready food delivery platform built with React, Node.js, PostgreSQL, and real-time WebSockets.

## Tech Stack

**Frontend:** React 18 + Vite, TailwindCSS, Zustand, React Query, React Router, Socket.io Client, Leaflet Maps, Lucide Icons

**Backend:** Node.js + Express, Prisma ORM, PostgreSQL, JWT Auth, Socket.io, Stripe (optional)

---

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### 1. Clone & Install

```bash
cd fooddash
npm install concurrently

# Install backend
cd backend
cp .env.example .env
npm install

# Install frontend
cd ../frontend
cp .env.example .env
npm install
```

### 2. Configure Database

Edit `backend/.env`:
```
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/fooddash?schema=public"
JWT_SECRET="change-this-to-a-random-string"
JWT_REFRESH_SECRET="change-this-to-another-random-string"
```

Create the database:
```bash
createdb fooddash
# or via psql: CREATE DATABASE fooddash;
```

### 3. Run Migrations & Seed

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
node src/prisma/seed.js
```

### 4. Start Development

```bash
# From root directory
npm run dev

# Or separately:
cd backend && npm run dev   # API on port 3001
cd frontend && npm run dev  # UI on port 5173
```

### 5. Open the App

Visit `http://localhost:5173`

---

## Test Accounts

| Role     | Email                    | Password    |
|----------|--------------------------|-------------|
| Admin    | admin@fooddash.com       | password123 |
| Customer | john@example.com         | password123 |
| Customer | jane@example.com         | password123 |
| Courier  | courier1@fooddash.com    | password123 |
| Courier  | courier2@fooddash.com    | password123 |

---

## Features

### Customer
- Browse restaurants with search, cuisine filters, and sorting
- View restaurant menu with categories
- Add to cart, modify quantities
- Checkout with delivery address and payment selection
- Real-time order tracking with live map
- Order history and reviews
- Profile management

### Courier
- Toggle online/offline status
- View and accept nearby orders
- Update delivery status through workflow
- Real-time location broadcasting
- Delivery stats and rating

### Admin
- Analytics dashboard (orders, revenue, popular dishes, active couriers)
- Manage restaurants (CRUD)
- Manage menu items and categories
- View and update all orders
- Manage couriers

---

## API Endpoints

### Auth
```
POST   /api/auth/register     — Register new user
POST   /api/auth/login        — Login
GET    /api/auth/me           — Get current user
POST   /api/auth/refresh      — Refresh JWT token
```

### Restaurants
```
GET    /api/restaurants        — List all (query: cuisine, search, sortBy, minRating)
GET    /api/restaurants/cuisines — List distinct cuisines
GET    /api/restaurants/:id    — Get restaurant with full menu
```

### Menu
```
GET    /api/menu/restaurant/:id — Menu items (query: category, search)
GET    /api/menu/:id            — Single menu item
```

### Orders
```
POST   /api/orders              — Create order
GET    /api/orders/my-orders    — Customer's orders
GET    /api/orders/:id          — Get order details
PATCH  /api/orders/:id/status   — Update status
PATCH  /api/orders/:id/assign-courier — Assign courier
```

### Couriers
```
GET    /api/couriers/profile         — Courier profile
PATCH  /api/couriers/location        — Update location
PATCH  /api/couriers/availability    — Toggle online
GET    /api/couriers/available-orders — Available orders
GET    /api/couriers/my-deliveries   — Active deliveries
PATCH  /api/couriers/accept-order/:id — Accept order
GET    /api/couriers                 — All couriers (admin)
```

### Payments
```
POST   /api/payments/create-intent — Create Stripe payment intent
POST   /api/payments/confirm       — Confirm payment
POST   /api/payments/cash          — Cash on delivery
```

### Admin
```
GET    /api/admin/analytics     — Dashboard analytics
GET    /api/admin/orders        — All orders (query: status, page, limit)
POST   /api/admin/restaurants   — Create restaurant
PUT    /api/admin/restaurants/:id — Update restaurant
DELETE /api/admin/restaurants/:id — Deactivate restaurant
POST   /api/admin/menu-items    — Create menu item
PUT    /api/admin/menu-items/:id — Update menu item
POST   /api/admin/categories    — Create category
GET    /api/admin/users         — All users
```

### Reviews
```
POST   /api/reviews                   — Create review
GET    /api/reviews/restaurant/:id    — Restaurant reviews
```

### Users
```
PUT    /api/users/profile    — Update profile
PUT    /api/users/password   — Change password
```

---

## WebSocket Events

### Client → Server
```
join:order          — Join order tracking room
leave:order         — Leave order tracking room
courier:location    — Send courier GPS {orderId, latitude, longitude}
courier:availability — Toggle online status
```

### Server → Client
```
order:status:update     — Order status changed
order:new               — New order placed
courier:location:update — Courier position update
courier:availability:update — Courier status change
```

---

## Database Schema

The app uses 9 PostgreSQL tables via Prisma:

- **users** — All users (customer, courier, admin)
- **restaurants** — Restaurant profiles
- **categories** — Menu categories per restaurant
- **menu_items** — Food items
- **orders** — Customer orders with status workflow
- **order_items** — Items within an order
- **couriers** — Courier profiles linked to users
- **payments** — Payment records (Stripe or cash)
- **reviews** — Customer reviews

---

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
JWT_REFRESH_SECRET=your-refresh-secret
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
STRIPE_SECRET_KEY=sk_test_... (optional)
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=http://localhost:3001
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... (optional)
```

---

## Stripe Setup (Optional)

1. Create a Stripe account at stripe.com
2. Get test API keys from the Stripe Dashboard
3. Add keys to backend and frontend `.env` files
4. The app works without Stripe — payments are simulated in test mode

---

## Project Structure

```
fooddash/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   ├── src/
│   │   ├── config/database.js     # Prisma client
│   │   ├── middleware/auth.js      # JWT auth middleware
│   │   ├── routes/                 # API route handlers
│   │   │   ├── auth.js
│   │   │   ├── restaurants.js
│   │   │   ├── menu.js
│   │   │   ├── orders.js
│   │   │   ├── couriers.js
│   │   │   ├── payments.js
│   │   │   ├── admin.js
│   │   │   ├── reviews.js
│   │   │   └── users.js
│   │   ├── sockets/
│   │   │   └── socketManager.js   # WebSocket handling
│   │   ├── prisma/seed.js         # Seed data
│   │   ├── app.js                 # Express config
│   │   └── server.js              # Entry point
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── layout/            # Header, Nav, Layouts
│   │   ├── pages/                 # All page components
│   │   ├── services/
│   │   │   ├── api.js             # Axios API client
│   │   │   └── socket.js          # Socket.io client
│   │   ├── store/
│   │   │   ├── authStore.js       # Auth state (Zustand)
│   │   │   └── cartStore.js       # Cart state (Zustand)
│   │   ├── utils/helpers.js       # Formatters & constants
│   │   ├── App.jsx                # Router config
│   │   ├── main.jsx               # Entry point
│   │   └── index.css              # Tailwind + custom styles
│   ├── index.html
│   ├── tailwind.config.js
│   └── vite.config.js
└── package.json
```

---

## Example API Requests

### Register
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}'
```

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

### Get Restaurants
```bash
curl http://localhost:3001/api/restaurants
curl http://localhost:3001/api/restaurants?cuisine=Italian
curl http://localhost:3001/api/restaurants?search=pizza&sortBy=rating
```

### Create Order
```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "restaurantId": "RESTAURANT_ID",
    "items": [{"menuItemId": "ITEM_ID", "quantity": 2}],
    "deliveryAddress": "42 Baker Street",
    "deliveryLat": 51.5237,
    "deliveryLng": -0.1585,
    "paymentMethod": "CASH_ON_DELIVERY"
  }'
```

---

## Order Status Workflow

```
PENDING → ACCEPTED → COOKING → READY_FOR_PICKUP → PICKED_UP → ON_THE_WAY → DELIVERED
```

All status transitions emit real-time WebSocket events to connected clients.
