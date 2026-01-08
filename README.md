# SellLocal Online

Empowering home-based sellers to bring their business online and increase their reach to nearby areas.

## Features

- **Seller Registration & Microsites**: Sellers can register and get their own unique microsite with their business name as the URL alias
- **Product Management**: Add products with images, videos, descriptions, and multiple price tiers for bulk orders
- **Volume Pricing**: Set different prices based on order quantity to encourage bulk purchases
- **Promotions**: Create sales promotions with percentage or absolute discounts
- **Theme Selection**: Choose from 6 beautiful themes for your store
- **WhatsApp Checkout**: Buyers checkout directly via WhatsApp for easy communication
- **Admin Panel**: Admin can approve sellers, manage accounts, and extend trials
- **PWA Enabled**: Works as a progressive web app on mobile devices
- **SEO Optimized**: Each product and store page is optimized for search engines
- **Fully Responsive**: Works perfectly on all devices

## Tech Stack

- **Frontend**: Next.js 15 with TypeScript, Tailwind CSS
- **Backend**: Node.js with Express
- **Database**: MongoDB
- **State Management**: Zustand
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB running locally on port 27017

### Installation

1. **Clone the repository**

2. **Install Backend Dependencies**
```bash
cd backend
npm install
```

3. **Install Frontend Dependencies**
```bash
cd frontend
npm install
```

4. **Seed the Admin User**
```bash
cd backend
npm run seed
```

This creates the admin user:
- Email: `admin@selllocalonline.com`
- Password: `Bloxham1!`

### Running the Application

1. **Start MongoDB** (if not already running)

2. **Start the Backend**
```bash
cd backend
npm run dev
```
The backend will run on `http://localhost:5000`

3. **Start the Frontend**
```bash
cd frontend
npm run dev
```
The frontend will run on `http://localhost:3000`

## User Roles

### Admin
- Login: `admin@selllocalonline.com` / `Bloxham1!`
- Can approve/reject seller registrations
- Can enable/disable sellers
- Can extend seller trials
- Phone: +917838055426

### Seller
- Register at `/register`
- Wait for admin approval
- Add products and set prices
- Create promotions
- 1 month free trial

### Buyer
- Browse seller stores at `/store/{seller-alias}`
- Register/login on any store
- Add items to cart
- Checkout via WhatsApp

## Store Themes

- **Ocean** - Cyan/teal gradient
- **Sunset** - Orange/amber gradient
- **Forest** - Green gradient
- **Midnight** - Indigo/purple gradient
- **Rose** - Pink/red gradient
- **Minimal** - Clean black & white

## API Endpoints

### Auth
- `POST /api/auth/register/seller` - Register seller
- `POST /api/auth/register/buyer` - Register buyer
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Products
- `GET /api/products/store/:alias` - Get store products (public)
- `GET /api/products/store/:alias/:slug` - Get single product (public)
- `GET /api/products/my-products` - Get seller's products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `PATCH /api/products/:id/toggle` - Toggle product status
- `DELETE /api/products/:id` - Delete product

### Promotions
- `GET /api/promotions` - Get seller's promotions
- `POST /api/promotions` - Create promotion
- `PUT /api/promotions/:id` - Update promotion
- `PATCH /api/promotions/:id/toggle` - Toggle promotion
- `DELETE /api/promotions/:id` - Delete promotion

### Cart
- `GET /api/cart/:sellerAlias` - Get cart
- `POST /api/cart/add` - Add to cart
- `PUT /api/cart/update` - Update cart item
- `DELETE /api/cart/remove/:sellerAlias/:productId` - Remove from cart
- `POST /api/cart/checkout/:sellerAlias` - Checkout (returns WhatsApp URL)

### Admin
- `GET /api/admin/sellers` - Get all sellers
- `GET /api/admin/stats` - Get dashboard stats
- `PATCH /api/admin/sellers/:id/approve` - Approve seller
- `PATCH /api/admin/sellers/:id/toggle` - Toggle seller status
- `PATCH /api/admin/sellers/:id/extend-trial` - Extend trial

## License

MIT

