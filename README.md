<div align="center">

# ⚡ SagarSports — E-Commerce Platform

### *Move. Perform. Repeat.*

A modern, high-performance, full-stack athletic e-commerce platform and back-office ERP suite. Engineered with a **React 18 + Vite** frontend and a **Django REST Framework** backend, featuring factory-direct sports gear discovery, real-time co-purchase recommendations, dual-mode checkout, Razorpay payments, and executive analytics.

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4.3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Redux Toolkit](https://img.shields.io/badge/Redux_Toolkit-2.2-764ABC?style=for-the-badge&logo=redux&logoColor=white)](https://redux-toolkit.js.org/)
[![Django](https://img.shields.io/badge/Django-5.0-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![Django REST Framework](https://img.shields.io/badge/DRF-3.15-red?style=for-the-badge&logo=django&logoColor=white)](https://www.django-rest-framework.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon_Serverless-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech/)
[![Cloudflare R2](https://img.shields.io/badge/Cloudflare_R2-Object_Storage-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://www.cloudflare.com/products/r2/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Payment_Gateway-0C2340?style=for-the-badge&logo=razorpay&logoColor=blue)](https://razorpay.com/)
[![Brevo](https://img.shields.io/badge/Brevo-Transactional_Email-0B996F?style=for-the-badge&logo=brevo&logoColor=white)](https://www.brevo.com/)

[🌐 Live Storefront](https://sagarsports.shop) • [📑 API Reference](#-api-reference) • [🏗️ Architecture](#%EF%B8%8F-system-architecture) • [🚀 Quickstart](#-getting-started) • [📊 Admin Suite](#-admin-dashboard--analytics)

---

</div>

## 📖 Table of Contents

- [Overview](#-overview)
- [System Architecture](#%EF%B8%8F-system-architecture)
- [Key Features](#-key-features)
  - [Storefront & Discovery](#-storefront--discovery)
  - [Cart & Seamless Checkout](#-cart--frictionless-checkout)
  - [Back-Office Admin & Analytics](#-admin-dashboard--analytics)
  - [Security & Performance](#-security--performance-engineering)
- [Tech Stack](#%EF%B8%8F-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#1-backend-setup-django--drf)
  - [Frontend Setup](#2-frontend-setup-react--vite)
- [Environment Variables](#-environment-variables)
- [Database Seeding & Admin Setup](#-database-seeding--admin-setup)
- [API Reference](#-api-reference)
- [Order Lifecycle State Machine](#-order-lifecycle)
- [Production Deployment](#-production-deployment)
- [License & Acknowledgements](#-license)

---

## 🌟 Overview

**SagarSports** is a full-featured e-commerce platform purpose-built for an athletic equipment and sportswear brand manufactured directly at its factory in Kharkhoda, Haryana, India. 

Designed to deliver the seamless, high-density discovery experience of international sports retailers (such as Decathlon), the platform combines a blisteringly fast React storefront with a resilient Django REST Framework backend.

### What makes SagarSports stand out?

- **⚡ Blazing Fast UX**: Built on Vite 8, React 18, and Tailwind CSS v4, achieving near-instant page transitions, snappy interactions, and zero layout shift.
- **🧠 Real Co-Purchase Intelligence**: "Frequently Bought Together" recommendations calculated from actual historical order combinations, rather than generic category-matching.
- **🛍️ Frictionless Guest Checkout with Account Claiming**: Customers can complete orders without registration. Each guest receives an unguessable UUID `claim_token` that allows instant order tracking and one-click retroactive account creation.
- **🔒 Snapshot Immutability**: Line items freeze product names, variant labels, and price snapshots at checkout time, guaranteeing historical receipts and financial integrity are never corrupted by catalog edits.
- **📊 Integrated Executive ERP**: Built-in administration portal featuring revenue trends, interactive sales charts (Recharts), catalog management, low-stock alerts, and an automated product description generator.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Clients["Clients & Presentation Layer"]
        Storefront["Storefront (React 18 + Vite)"]
        AdminUI["Admin Portal (Recharts + React)"]
        Mobile["Responsive Mobile Drawer"]
    end

    subgraph API["Backend API Layer (Django 5 + DRF)"]
        Gateway["REST API / JWT Gateway"]
        AuthApp["apps.users (Auth & Addresses)"]
        ProductApp["apps.products (Catalog & ML)"]
        CartApp["apps.cart (Guest & User Carts)"]
        OrderApp["apps.orders (Checkout & Tracking)"]
        PaymentApp["apps.payments (Razorpay & COD)"]
        AdminApp["apps.admin (Analytics & Controls)"]
    end

    subgraph DataInfra["Data & Cloud Infrastructure"]
        DB[(PostgreSQL / Neon Cloud)]
        R2[(Cloudflare R2 / AWS S3 CDN)]
        Brevo["Brevo SMTP / REST API"]
        Razorpay["Razorpay Payment Gateway"]
    end

    Storefront --> Gateway
    AdminUI --> Gateway
    Mobile --> Gateway

    Gateway --> AuthApp
    Gateway --> ProductApp
    Gateway --> CartApp
    Gateway --> OrderApp
    Gateway --> PaymentApp
    Gateway --> AdminApp

    AuthApp --> DB
    ProductApp --> DB
    ProductApp --> R2
    CartApp --> DB
    OrderApp --> DB
    PaymentApp --> Razorpay
    OrderApp --> Brevo
```

---

## ✨ Key Features

### 🛒 Storefront & Discovery

* **Decathlon-Inspired MegaMenu**: Multi-level category tree with intuitive hierarchies across equipment, team sports, apparel, and accessories.
* **Instant Search Autocomplete**: Debounced query prediction with synonym-aware matching (e.g. mapping "racquet" to "racket", "cleats" to "football shoes").
* **Smart Recommendations**:
  * **Frequently Bought Together**: Mining co-purchased order data to cross-sell accessories that customers actually buy together.
  * **Related Gear**: Smart category & brand similarity fallbacks.
* **Rich Product Detail Pages**: Multiple high-resolution gallery images, interactive Color & Size variant selectors, real-time stock indicator, and verified customer reviews.
* **Wishlist**: Instant one-click wishlist toggling with local caching and server sync.

### 💳 Cart & Frictionless Checkout

* **Unified Dual-Mode Cart**:
  * Guest Cart stored persistently in browser state.
  * Seamless auto-merging into user cart upon login or registration without losing items.
* **Public & Guest Checkout**:
  * Unauthenticated users can checkout with just their delivery details and email.
  * Generated `claim_token` allows guest customers to track their order or attach it to a newly registered account.
* **Flexible Payments**:
  * **Razorpay Gateway**: Fast checkout supporting UPI, Credit/Debit Cards, NetBanking, and Wallets with cryptographic webhook verification.
  * **Cash on Delivery (COD)**: Configurable handling fee (₹50) frozen into order ledger at checkout.
* **Price & Line-Item Snapshots**: Complete preservation of SKU, title, variant, and unit prices as they existed at purchase time.

### 📊 Admin Dashboard & Analytics

* **Executive KPI Summary**: Instant tracking of Total Gross Revenue, Total Orders Placed, Active Catalog Count, and Pending Orders.
* **Interactive Visual Analytics**: Interactive sales trends, revenue charts, and payment method breakdowns powered by **Recharts**.
* **Catalog & Variant Management**: Full CRUD over products, variant matrices (size/color), image galleries, and category hierarchies.
* **Rule-Based Description Generator**: Intelligent text generator that crafts persuasive, feature-rich product descriptions from product attributes.
* **Inventory Monitor**: Real-time stock alerts flagging low-stock and out-of-stock items before they hurt sales.
* **Fulfillment Pipeline**: State-machine backed order tracking with one-click status transitions.

### 🛡️ Security & Performance Engineering

* **JWT with Refresh Rotation & Blacklisting**: 15-minute short-lived access tokens combined with 7-day refresh tokens invalidated upon logout.
* **Subquery Query Optimization**: Custom Django ORM subqueries embedding primary images and deferring heavy descriptions to eliminate N+1 queries.
* **Connection Pooling**: PostgreSQL connection reuse enabled via `conn_max_age=600`.
* **Zero-Downtime Health Probes**: Dedicated `/api/health/` endpoint designed for uptime pingers (UptimeRobot, Pingdom) with zero DB query overhead.
* **Cloudflare R2 Object Storage**: Edge CDN distribution for product media, minimizing server load and bandwidth costs.
* **Reliable Email Delivery**: Dual-mode Brevo configuration utilizing SMTP or HTTPS REST API (bypassing outbound port 587 firewalls on serverless clouds like Render).

---

## 🛠️ Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend Core** | React 18, Vite 8, React Router DOM v7, Redux Toolkit |
| **Frontend Styling & UI** | Tailwind CSS v4, PostCSS, React Icons |
| **Data Visualization** | Recharts (Admin revenue & volume trends) |
| **Backend Core** | Python 3.12, Django 5.0, Django REST Framework 3.15 |
| **Auth & Security** | SimpleJWT with Token Blacklisting, CORS Headers |
| **Database & ORM** | PostgreSQL (Neon Serverless), `dj-database-url`, `psycopg2-binary` |
| **Asset & Media Storage**| Cloudflare R2 / AWS S3 (`django-storages`, `boto3`), Whitenoise |
| **Payments** | Razorpay Python SDK, Cash on Delivery (COD) Engine |
| **Email & Comms** | Brevo (Sendinblue) Transactional SMTP & HTTPS REST API |

---

## 📁 Project Structure

```text
ecommerce-platform/
├── backend/                        # Django REST Framework API
│   ├── apps/
│   │   ├── cart/                   # Guest & user cart management
│   │   ├── categories/             # Hierarchical category trees & seeds
│   │   ├── common/                 # Base models, health check & custom pagination
│   │   ├── orders/                 # Checkout, order snapshots, fulfillment & analytics
│   │   ├── payments/               # Razorpay integration & webhook handlers
│   │   ├── products/               # Products, variants, search, recommendations
│   │   ├── reviews/                # Product ratings & customer feedback
│   │   ├── users/                  # Custom User model, JWT auth & address book
│   │   └── wishlist/               # User wishlists
│   ├── config/                     # Django root settings, WSGI/ASGI & URLs
│   ├── staticfiles/                # Collected static assets
│   ├── manage.py                   # Django management executable
│   ├── requirements.txt            # Python dependencies
│   └── .env.example                # Backend environment blueprint
│
├── frontend/                       # React 18 + Vite Frontend Application
│   ├── public/                     # Favicons, logos & static assets
│   ├── src/
│   │   ├── components/             # Reusable UI component library
│   │   │   ├── admin/              # Admin layouts, tables, analytics widgets
│   │   │   ├── cart/               # Cart drawer & line item components
│   │   │   ├── checkout/           # Checkout form, address picker, summary
│   │   │   ├── common/             # Buttons, modals, badges, loaders
│   │   │   ├── layout/             # Header, MegaMenu, Footer, MobileNav
│   │   │   ├── product/            # Cards, grids, filters, variant selector
│   │   │   └── reviews/            # Review forms & star ratings
│   │   ├── pages/                  # Page routes (Storefront & Admin)
│   │   │   ├── admin/              # Dashboard, Products, Orders, Analytics
│   │   │   ├── auth/               # Login, Register, Forgot/Reset Password
│   │   │   ├── checkout/           # Cart, Checkout, Order Confirmation
│   │   │   ├── home/               # Hero, category grid, curated rails
│   │   │   ├── products/           # Listing page with filters, Product Detail
│   │   │   └── profile/            # Order history, Addresses, Wishlist
│   │   ├── redux/                  # State management store & slices
│   │   ├── routes/                 # ProtectedRoute & AdminRoute guards
│   │   ├── services/               # Axios instance & token interceptors
│   │   ├── App.jsx                 # Routing configuration
│   │   └── main.jsx                # Application root mounting
│   ├── package.json                # Frontend dependencies & scripts
│   ├── tailwind.config.js          # Tailwind CSS theme configuration
│   └── vite.config.js              # Vite bundler configuration
│
└── README.md                       # Platform documentation
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js** 18+ and **npm**
- **Python** 3.11+ or 3.12+
- **PostgreSQL** 14+ (or a cloud PostgreSQL instance like [Neon](https://neon.tech))

---

### 1. Backend Setup (Django + DRF)

```bash
# Navigate to the backend directory
cd backend

# Create and activate a Python virtual environment
python3 -m venv venv
source venv/bin/activate       # On Windows: venv\Scripts\activate

# Install all backend dependencies
pip install -r requirements.txt

# Create your local environment configuration
cp .env.example .env

# Edit .env with your PostgreSQL credentials & secret keys
# (See the Environment Variables section below)

# Run database migrations
python manage.py migrate

# Seed sample categories and initial catalog
python manage.py seed_categories
python manage.py seed_products

# Create an administrator account
python manage.py createsuperuser

# Start the Django development server
python manage.py runserver 0.0.0.0:8000
```

> **API Health Check:** Visit `http://localhost:8000/api/health/` in your browser. You should receive `{"status": "ok"}`.

---

### 2. Frontend Setup (React + Vite)

Open a new terminal window:

```bash
# Navigate to the frontend directory
cd frontend

# Install Node dependencies
npm install

# Create frontend environment configuration
cp .env.example .env

# Ensure VITE_API_URL is set:
# VITE_API_URL=http://localhost:8000/api

# Start the Vite development server
npm run dev
```

> **Storefront:** Visit `http://localhost:5173` to explore the storefront.  
> **Admin Portal:** Navigate to `http://localhost:5173/admin` and log in with your superuser credentials.

---

## 🔐 Environment Variables

### Backend Configuration (`backend/.env`)

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `SECRET_KEY` | Django cryptographic signing secret | `your-long-random-secret` |
| `DEBUG` | Enable debug mode (`True` locally, `False` in prod) | `True` |
| `ALLOWED_HOSTS` | Comma-separated list of allowed hostnames | `localhost,127.0.0.1,api.sagarsports.shop` |
| `CSRF_TRUSTED_ORIGINS` | Trusted origins for CSRF checks | `https://sagarsports.shop,http://localhost:5173` |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@host:5432/sagarsports_db` |
| `CORS_ALLOWED_ORIGINS` | Allowed frontend origins for API requests | `http://localhost:5173,https://sagarsports.shop` |
| `ACCESS_TOKEN_LIFETIME_MINUTES` | Lifetime of JWT Access token | `15` |
| `REFRESH_TOKEN_LIFETIME_DAYS` | Lifetime of JWT Refresh token | `7` |
| `AWS_ACCESS_KEY_ID` | Cloudflare R2 / S3 access key ID | `your-r2-key-id` |
| `AWS_SECRET_ACCESS_KEY` | Cloudflare R2 / S3 secret access key | `your-r2-secret-key` |
| `AWS_STORAGE_BUCKET_NAME` | R2 Bucket name | `sagarsports-media` |
| `AWS_S3_ENDPOINT_URL` | Cloudflare R2 endpoint URL | `https://<account-id>.r2.cloudflarestorage.com` |
| `AWS_S3_CUSTOM_DOMAIN` | Media CDN domain | `media.sagarsports.shop` |
| `EMAIL_BACKEND` | Django email backend | `django.core.mail.backends.smtp.EmailBackend` |
| `EMAIL_HOST` | Transactional SMTP host | `smtp-relay.brevo.com` |
| `EMAIL_PORT` | SMTP port | `587` |
| `EMAIL_HOST_USER` | SMTP login user | `your-brevo-login` |
| `EMAIL_HOST_PASSWORD` | SMTP password | `your-brevo-smtp-key` |
| `DEFAULT_FROM_EMAIL` | Default sender address | `Sagar Sports <orders@sagarsports.shop>` |
| `BREVO_API_KEY` | Brevo REST API key (fallback for blocked SMTP) | `xkeysib-...` |
| `RAZORPAY_KEY_ID` | Razorpay Key ID | `rzp_test_...` |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret | `your-razorpay-secret` |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay Webhook Signing Secret | `your-webhook-secret` |
| `FRONTEND_URL` | Public URL of the frontend | `https://sagarsports.shop` |

### Frontend Configuration (`frontend/.env`)

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base URL for the Django REST Framework API | `http://localhost:8000/api` |

---

## 🗄️ Database Seeding & Admin Setup

The project includes custom management commands to seed realistic catalog data so you can test discovery, search, and checkout immediately:

```bash
cd backend
source venv/bin/activate

# 1. Populate category tree (hierarchy of parent & child categories)
python manage.py seed_categories

# 2. Seed catalog with sports gear, variants, and placeholder images
python manage.py seed_products

# 3. Create your administrative account
python manage.py createsuperuser
```

---

## 📡 API Reference

All API endpoints are prefixed with `/api/`.

### 🩺 Health & Observability
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health/` | None | Instant health check probe (`{"status":"ok"}`) |

### 🔑 Authentication & Profile
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register/` | None | Register a new user account |
| `POST` | `/api/auth/login/` | None | Obtain JWT access & refresh tokens |
| `POST` | `/api/auth/token/refresh/` | None | Rotate and issue a fresh access token |
| `POST` | `/api/auth/logout/` | Bearer | Blacklist refresh token & sign out |
| `GET` | `/api/auth/profile/` | Bearer | Retrieve current user profile |
| `PUT` | `/api/auth/profile/` | Bearer | Update user profile information |
| `POST` | `/api/auth/password-reset/` | None | Trigger password reset link email |
| `POST` | `/api/auth/password-reset-confirm/` | None | Confirm password reset via token |
| `GET` | `/api/users/addresses/` | Bearer | List saved delivery addresses |
| `POST` | `/api/users/addresses/` | Bearer | Add a new delivery address |
| `PUT/DEL` | `/api/users/addresses/<id>/` | Bearer | Edit or delete a saved address |

### 🏷️ Categories & Products
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/categories/` | None | List categories with child relations |
| `GET` | `/api/categories/tree/` | None | Complete nested category hierarchy tree |
| `GET` | `/api/products/` | None | Filtered product catalog (search, sort, price, category) |
| `GET` | `/api/products/<slug>/` | None | Single product detail with variants & images |
| `GET` | `/api/products/suggestions/` | None | Search autocomplete query predictions |
| `GET` | `/api/products/brands/` | None | List of available sports brands |
| `GET` | `/api/products/<slug>/related/` | None | Related gear in matching categories |
| `GET` | `/api/products/<slug>/frequently-bought-together/` | None | Real co-purchased recommendation pairs |
| `GET` | `/api/products/<slug>/reviews/` | None | Paginated customer reviews & ratings |
| `POST` | `/api/reviews/` | Bearer | Submit a verified product review |

### 🛒 Cart & Wishlist
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/cart/` | Session/User | Get current cart items and totals |
| `POST` | `/api/cart/items/` | Session/User | Add product variant to cart |
| `PATCH` | `/api/cart/items/<id>/` | Session/User | Update line item quantity |
| `DELETE` | `/api/cart/items/<id>/` | Session/User | Remove line item from cart |
| `POST` | `/api/cart/merge/` | Bearer | Merge guest session cart into user cart |
| `GET` | `/api/wishlist/` | Bearer | List user's saved wishlist items |
| `POST` | `/api/wishlist/toggle/` | Bearer | Add or remove an item from wishlist |

### 📦 Orders & Payments
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/orders/` | Bearer | List authenticated user's order history |
| `POST` | `/api/orders/` | None (Guest/User) | Place an order (COD or Initiate Online) |
| `GET` | `/api/orders/<id>/` | Bearer or Claim Token | View order confirmation & tracking details |
| `POST` | `/api/orders/<id>/claim/` | Bearer | Claim a guest order onto a registered account |
| `POST` | `/api/payments/initiate/` | None (Guest/User) | Create a Razorpay Order ID |
| `POST` | `/api/payments/confirm/` | None (Guest/User) | Verify Razorpay payment signature |
| `POST` | `/api/payments/razorpay/webhook/` | Razorpay Sig | Asynchronous Razorpay webhook confirmation |

### 🛠️ Staff Admin Suite (`IsAdminUser`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/analytics/summary/` | Admin | KPI summary (revenue, volume, inventory) |
| `GET` | `/api/admin/analytics/detailed/` | Admin | Multi-day sales trends & category distributions |
| `GET/POST`| `/api/admin/products/` | Admin | Product listing & creation |
| `PUT/DEL` | `/api/admin/products/<id>/` | Admin | Product edit & archival |
| `POST` | `/api/admin/products/generate-description/` | Admin | Rule-based description generator |
| `GET/POST`| `/api/admin/categories/` | Admin | Manage category hierarchy |
| `GET` | `/api/admin/orders/` | Admin | Full orders list with status filters |
| `PATCH` | `/api/admin/orders/<id>/` | Admin | Update fulfillment status & tracking |
| `GET` | `/api/admin/users/` | Admin | Customer directory & account metrics |

---

## 🔄 Order Lifecycle

Orders follow a strict, predictable state machine ensuring inventory and financial accuracy:

```mermaid
stateDiagram-v2
    [*] --> Pending : Customer checks out
    
    Pending --> Confirmed : Payment verified (Razorpay) or COD selected
    Pending --> Cancelled : Payment failed or customer cancelled

    Confirmed --> Processing : Order sent to factory floor
    Processing --> Shipped : Dispatched with logistics partner
    Shipped --> Out_For_Delivery : Arrived at local delivery hub
    Out_For_Delivery --> Delivered : Successfully handed to customer

    Processing --> Cancelled : Stock unavailable / refunded
    Delivered --> [*]
    Cancelled --> [*]
```

---

## 🚢 Production Deployment

The SagarSports platform is architected for decoupled container or serverless deployments:

### Backend Deployment (e.g. Render / Railway / AWS ECS)
1. Configure environment variables using `backend/.env.example`.
2. Connect to a managed PostgreSQL cluster (e.g., [Neon](https://neon.tech)).
3. Use Gunicorn as the production WSGI HTTP server:
   ```bash
   gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 3
   ```
4. Static assets are automatically compressed and served via **Whitenoise**.
5. Media uploads are streamed directly to **Cloudflare R2** via `django-storages[boto3]`.

### Frontend Deployment (e.g. Vercel / Cloudflare Pages / Netlify)
1. Set the build command: `npm run build`.
2. Set the publish directory: `dist`.
3. Provide the environment variable: `VITE_API_URL=https://api.sagarsports.shop/api`.
4. Add single-page application (SPA) rewrite rules routing `/*` to `/index.html`.

---

## 🧪 Testing & Quality

To run backend automated test suites:

```bash
cd backend
python manage.py test apps.common
```

To run frontend linting and production build checks:

```bash
cd frontend
npm run lint
npm run build
```

---

## 📄 License

This project is licensed under the **MIT License**. Feel free to use, modify, and distribute it in your personal or commercial projects.

<div align="center">

**Built with passion for athletes and active players.**  
*SagarSports — Kharkhoda, Haryana, India* 🇮🇳

</div>
