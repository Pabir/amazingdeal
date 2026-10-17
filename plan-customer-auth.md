# Customer Authentication & Account Management Architecture Plan
## AmazingDeal Hyperlocal Multi-Tenant E-Commerce Platform

> **Target:** Storefront Customer Experience (`*.amazingdeal.co.in` / `?store=<subdomain>`)  
> **Selected Provider:** **Firebase Authentication (Google Cloud)** (100% Free Tier: Unlimited Google Sign-In & Email/Password, 10,000 free phone OTPs/month).  
> **Configured Project:** `amazingdeal-prod-2026-a1b2c` (Web App `AmazingDeal Web`)

---

## 1. Architecture Overview

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant Storefront as Storefront SPA (Cloudflare Pages)
    participant Firebase as Firebase Auth (Google Cloud)
    participant Backend as Spring Boot API (/api/v1/store/*)
    participant DB as Neon PostgreSQL

    Customer->>Storefront: Clicks "Sign In" (or Checkout)
    Storefront->>Firebase: signInWithPopup(Google) or Phone/Email OTP
    Firebase-->>Storefront: Returns Firebase User & ID Token (JWT)
    Storefront->>Backend: POST /api/v1/store/customer/auth/verify (ID Token + profile)
    Backend->>Backend: Upserts Customer in DB & creates JWT with ROLE_CUSTOMER
    Backend-->>Storefront: Returns AmazingDeal JWT + Customer Profile + Saved Addresses
    Storefront->>Customer: Header displays "Hi, [Name]" & 1-Click Checkout Enabled
```

---

## 2. Storefront UI Touchpoints

### 2.1. Store Header Integration
- **Logged Out:** Shows `[ Sign In ]` button with user icon.
- **Logged In:** Shows circular avatar / initials + `Hi, [First Name]` with dropdown:
  - 📦 **My Orders** (Real-time order statuses, past order receipts, re-order button).
  - 📍 **Saved Addresses** (Home, Work, Other).
  - 🚪 **Sign Out**.

### 2.2. Login / Signup Modal (`CustomerAuthModal.tsx`)
- **1-Click Google Sign-In:** Instant sign-in without passwords.
- **Phone Number / Email Option:** Phone SMS OTP or Email/Password for flexibility.
- **Value Proposition:** "Save delivery addresses, track live orders, and checkout in 1-click".

### 2.3. Checkout Modal Integration (`CheckoutModal.tsx`)
- If logged in:
  - Auto-fills Name & Phone number.
  - Displays saved address selector cards (`Home: Flat 402...`).
  - Allows saving newly typed addresses with 1-click checkbox.
- If guest:
  - Frictionless guest checkout remains fully supported with optional "Sign in for faster checkout" prompt.

---

## 3. Database Schema (Neon PostgreSQL)

### 3.1. `customers` Table
```sql
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid VARCHAR(128) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    avatar_url VARCHAR(500),
    auth_provider VARCHAR(50) NOT NULL DEFAULT 'FIREBASE_GOOGLE', -- FIREBASE_GOOGLE, FIREBASE_PHONE, FIREBASE_EMAIL
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customers_firebase_uid ON customers(firebase_uid);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);
```

### 3.2. `customer_addresses` Table
```sql
CREATE TABLE customer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    label VARCHAR(50) DEFAULT 'Home', -- Home, Work, Other
    recipient_name VARCHAR(255),
    recipient_phone VARCHAR(20),
    address_line TEXT NOT NULL,
    landmark VARCHAR(255),
    city VARCHAR(100),
    pincode VARCHAR(20),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customer_addresses_customer_id ON customer_addresses(customer_id);
```

### 3.3. `orders` Table Update
```sql
ALTER TABLE orders ADD COLUMN customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
```

---

## 4. Backend Endpoints & Security

### 4.1. Security Configuration
- Allow public access: `POST /api/v1/store/customer/auth/**`
- Secure customer access: `GET /api/v1/store/customer/**` requires `ROLE_CUSTOMER`
- Update `JwtFilter.java` & `JwtTokenProvider.java` to support customer role claims.

### 4.2. REST Endpoints
- `POST /api/v1/store/customer/auth/verify` - Exchanges Firebase ID token for AmazingDeal customer JWT + profile.
- `GET /api/v1/store/customer/profile` - Current customer info.
- `PUT /api/v1/store/customer/profile` - Update customer details.
- `GET /api/v1/store/customer/addresses` - List saved delivery addresses.
- `POST /api/v1/store/customer/addresses` - Add new delivery address.
- `DELETE /api/v1/store/customer/addresses/{id}` - Remove saved address.
- `GET /api/v1/store/customer/orders` - Past orders with statuses.

---

## 5. Live Firebase Credentials Configured

- **Firebase Project ID:** `amazingdeal-prod-2026-a1b2c`
- **Web App ID:** `1:586928319675:web:a425c1e25a3b281cedcd9e`
- **Auth Domain:** `amazingdeal-prod-2026-a1b2c.firebaseapp.com`
- **API Key:** `AIzaSyBWq3bq_y6iH-L1G5o1WpP47r40EcBkb7Q`
