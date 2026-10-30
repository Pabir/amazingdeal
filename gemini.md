# AmazingDeal (`amazingdeal.co.in`) - Master Project Context & AI Reference Guide

> **File Purpose:** This document serves as the single source of truth for the **AmazingDeal** multi-tenant platform. Any AI agent or developer interacting with this codebase **MUST read this file first** to maintain full historical and architectural context.  
> **Maintenance Rule:** This document **MUST be updated with every feature addition, modification, or deletion**, maintaining a complete chronological record from project inception to the current state.

---

## 1. What the Project is About

**AmazingDeal** (`amazingdeal.co.in`) is a production-ready, cloud-native **Multi-Tenant Hyperlocal E-Commerce Platform** designed specifically for Indian merchants (kiranas, retail stores, local boutiques, restaurants, and direct-to-consumer brands).

### Core Problem & Vision
Traditional e-commerce platforms either charge exorbitant subscription fees, take high transaction commissions (15-30%), or lock small merchants into complex proprietary ecosystems. AmazingDeal provides a **zero-hosting-cost, cloud-native alternative** where every local merchant gets:
1. **Their Own Branded Storefront:** Subdomain-based (e.g. `sharmagrocery.amazingdeal.co.in`) or custom domain (`grocery.com`) with independent catalog, pricing, and branding.
2. **Dedicated Merchant Admin Portal:** Hosted at `admin.amazingdeal.co.in` with live incoming order streams, POS thermal receipt printing, inventory management, and store settings.
3. **Frictionless Indian Payment Stack:** Instant direct UPI QR codes (`upi://pay` intent for PhonePe, Google Pay, Paytm, BHIM, Cred) with zero intermediary fees, Cash on Delivery (COD), and automated Razorpay gateway payments.
4. **AI-Powered "Camera-to-Catalog" Studio:** Merchants can photograph any physical product; vision AI (Google Gemini 3.8 Flash / OpenAI GPT-4o-mini) automatically generates titles, SEO descriptions, categories, pricing, barcodes, and creates 4 synthetic studio turnaround photo angles (Front 0°, 45° Perspective, 90° Side Profile, Macro Detail) with an interactive 360° turntable.
5. **Customer Authentication & Accounts:** Built-in Firebase Authentication (Google 1-Tap Sign-In, Mobile SMS OTP) with saved multi-address management and live order tracking, while maintaining 100% guest checkout capability.
6. **Zero-Hosting-Cost Architecture:** Engineered from day one to operate completely within generous free tiers (Neon Serverless PostgreSQL, Render Docker web services, Cloudflare Pages/Workers, Cloudflare R2 object storage, and Cloudflare Wildcard SSL).

---

## 2. Tech Stack Used in the Project

### 2.1. Backend Architecture
- **Language & Runtime:** Java 21 (Eclipse Temurin JRE on Alpine Linux)
- **Framework:** Spring Boot 3.3.5
- **Build System:** Maven 3.9+ with `./mvnw` wrapper
- **Database & Persistence:**
  - **Database:** PostgreSQL 16 on Neon Serverless (`ep-rough-fire-b4tti27m-pooler.c-6.us-east-2.aws.neon.tech`)
  - **ORM:** Spring Data JPA / Hibernate 6.x
  - **Connection Pooling:** HikariCP with SSL connection pooling (`sslmode=require`)
  - **Local/Test Fallback:** In-memory H2 database with PostgreSQL compatibility mode
- **Multi-Tenancy Engine:**
  - Discriminator Column Pattern (`tenant_id UUID`)
  - Dynamic request identification via `TenantResolver` (host header subdomain parsing & `X-Tenant-ID` header)
  - ThreadLocal context isolation via `TenantContext` and `CustomerContext`
  - Automated Hibernate session filtering via `@FilterDef(name = "tenantFilter")` and `@Filter`
  - Base audit entities via `TenantAwareEntity` (`@PrePersist` tenant injection)
- **Security & Authentication:**
  - Spring Security 6.x with stateless session management
  - JSON Web Tokens (JJWT 0.12.6 - `jjwt-api`, `jjwt-impl`, `jjwt-jackson`)
  - Multi-role JWT architecture (`ROLE_MERCHANT`, `ROLE_CUSTOMER`, with demo token support)
  - Granular CORS configuration for custom domains, Cloudflare Pages, and Render origins
- **Payment & QR Code Generation:**
  - **Razorpay Java SDK:** `razorpay-java:1.4.6` for server-side order creation, payment capture, and webhook HMAC SHA256 verification
  - **Dynamic UPI QR Codes:** Google ZXing 3.5.3 (`core`, `javase`) generating standard NPCI `upi://pay` URI QR codes
  - **PayU & YouPI:** Historical payment callback integrations
- **Object Storage & Media:**
  - AWS Java SDK v2 (`software.amazon.awssdk:s3:2.29.1`) interfacing with Cloudflare R2 S3-compatible object storage
  - Pre-signed PUT upload URLs with public CDN delivery via `media.amazingdeal.co.in`
- **Artificial Intelligence & Vision:**
  - **Google Gemini API:** Native REST client targeting `gemini-3.8-flash`, `gemini-3.5-flash-lite`, and `gemini-flash-latest` with exponential backoff and model pool fallback
  - **OpenAI API:** GPT-4o and GPT-4o-mini vision models with Bring-Your-Own-Key (BYOK) support
  - **ChatGPT OAuth2 Flow:** Token management for connected ChatGPT accounts
  - **AI Studio Enhancer:** Multi-angle synthetic photo generator and studio command processor (`/360`, `/podium`, `/studio`, `/macro`)
- **POS / Hardware Printing:**
  - Native 58mm and 80mm ESC/POS thermal receipt formatting engine for local billing printers

### 2.2. Frontend Admin (`frontend-admin`)
- **Framework & Runtime:** React 18.3.1, TypeScript 5.6.3, Vite 6.0.1
- **Styling & UI:** Tailwind CSS 3.4.15, PostCSS 8.4.49, Lucide React 1.16.0 icons
- **State & Utilities:** `clsx`, `tailwind-merge`
- **Hosting / Edge:** Cloudflare Pages / Workers static assets via `wrangler.json` (routed to `admin.amazingdeal.co.in`)

### 2.3. Frontend Customer Storefront (`frontend-storefront`)
- **Framework & Runtime:** React 18.3.1, TypeScript 5.6.3, Vite 6.0.1 (runs on dev port 5174)
- **Styling & UI:** Tailwind CSS 3.4.15, Lucide React 1.16.0
- **Customer Authentication:** Firebase Authentication SDK 13.0.0 (Google OAuth Popup, Phone/Email OTP)
- **Subdomain Routing:** Custom `useSubdomain` hook extracting tenant subdomains from `window.location.hostname` or `?store=` query parameter
- **Hosting / Edge:** Cloudflare Pages / Workers static assets via `wrangler.json` (wildcard routing for `*.amazingdeal.co.in` and root `amazingdeal.co.in`)

### 2.4. Cloud Infrastructure & DevOps
- **Backend Hosting:** Render Web Service (Free Tier, Docker runtime) at `amazingdeal-backend.onrender.com` / `api.amazingdeal.co.in`
- **Alternative Backend Host:** Oracle Cloud Infrastructure (OCI) Always-Free ARM VM with `docker-compose.oci.yml` and Caddy automated SSL reverse proxy
- **Database:** Neon Serverless PostgreSQL (0.5GB compute, autosuspend, instant branchable database)
- **Edge CDN & DNS:** Cloudflare Free Plan with Universal SSL, Wildcard SSL (`*.amazingdeal.co.in`), DDoS mitigation, and HTTP/3
- **Object Storage:** Cloudflare R2 (10 GB free storage, 0 egress fees, 10M reads/month)
- **Continuous Integration / Continuous Deployment:** GitHub Actions (`.github/workflows/deploy.yml`) testing Spring Boot backend and deploying frontends via `cloudflare/wrangler-action@v3`
- **Keep-Alive Uptime Ping:** Automated cron pings to `/api/v1/health` (Cron-job.org / UptimeRobot) preventing Render free-tier cold starts

---

## 3. What Has Been Built Till Now

### 3.1. Multi-Tenant Core (`backend`)
- **`TenantContext` & `CustomerContext`:** ThreadLocal context holders for current tenant UUID and authenticated customer UUID.
- **`TenantResolver`:** Parses incoming HTTP requests:
  - Subdomains from `Host` header (e.g. `sharmagrocery.amazingdeal.co.in` -> `sharmagrocery`).
  - Fallback query parameter `?store=<subdomain>`.
  - Admin/API header `X-Tenant-ID` or JWT claim `tenant_id`.
- **`TenantFilter`:** Intercepts requests, validates tenant status, injects tenant ID into Hibernate session filter (`tenantFilter`), and binds customer auth tokens.
- **`TenantAwareEntity`:** Base entity providing `@Id UUID id`, `UUID tenantId`, `createdAt`, `updatedAt`, and automated `@PrePersist` tenant assignment.
- **`SecurityConfig` & `JwtFilter`:** Configured security paths, permitting public storefront endpoints (`/api/v1/store/**`), public auth endpoints (`/api/v1/auth/**`), actuator `/api/v1/health`, and securing `/api/v1/admin/**` (requires `ROLE_MERCHANT`) and `/api/v1/store/customer/**` (requires `ROLE_CUSTOMER`).

### 3.2. Merchant Onboarding & Master Store Verticals (18 Categories + Multi-Category Support)
- **Multi-Category Business Selection:** Merchants can operate across multiple verticals simultaneously (e.g., Kirana + Fresh Produce + Dairy & Bakery, or Apparel + Footwear + Accessories). Both the registration wizard (`MerchantLandingPage.tsx`) and Admin settings (`StoreSettings.tsx`) feature an interactive multi-select tag picker with real-time search.
- **Exhaustive Master Store Categories (18 Verticals):**
  1. **Daily Essentials & Groceries:** Kiranas, provision shops, ration stores, flour/atta, rice, oil & FMCG.
  2. **Supermarket & Hypermarket:** Departmental stores, multi-aisle retail marts, packaged foods & household cleaning.
  3. **Fruits & Fresh Vegetables:** Subzi mandis, fresh seasonal produce, farm-to-table organic.
  4. **Dairy, Milk, Sweets & Bakery:** Milk booths, dairies, sweet shops (mithai), cakes & bread.
  5. **Meat, Poultry, Fish & Seafood:** Butcher shops, fresh chicken cuts, mutton, river fish & eggs.
  6. **Restaurants, Cafes & Cloud Kitchens:** Cooked meals, biryani, pizzas, rolls, burgers, chai & coffee.
  7. **Pharmacy, Healthcare & Ayurveda:** Chemists, OTC medicines, wellness supplements & Ayurvedic tonics.
  8. **Apparel, Clothing & Ethnic Fashion:** Clothing boutiques, sarees, shirts, jeans, kurtas & kidswear.
  9. **Footwear, Bags & Leather Accessories:** Shoes, sports sneakers, sandals, school shoes, backpacks, wallets.
  10. **Beauty, Cosmetics & Personal Care:** Skincare, serums, haircare, perfumes, makeup & grooming kits.
  11. **Electronics, Gadgets & Mobile Accessories:** Mobile stores, TWS earbuds, chargers, cables, smart accessories.
  12. **Home, Kitchen & Plasticware:** Bartan marts, pressure cookers, non-stick tawas, bottles, storage containers.
  13. **Hardware, Electricals, Sanitary & Paints:** Paints, LED bulbs, switches, plumbing pipes, tools & bath fittings.
  14. **Stationery, Books & Office Supplies:** School notebooks, pens, printing paper, art supplies & calculators.
  15. **Jewelry, Watches & Fashion Accessories:** Imitation jewelry, Kundan sets, wristwatches, silver earrings.
  16. **Toys, Baby Care & Kids World:** Diapers, baby wipes, board games, learning toys, cycles & strollers.
  17. **Pet Food & Supplies:** Dog food, cat treats, pet shampoos, leashes, chew bones & toys.
  18. **Florist, Pooja Essentials & Gifts:** Fresh flowers, dhoop, agarbatti, brass diyas, idols & festive gifts.
- **AI Context Integration:** The chosen multi-category set anchors `AiCatalogGeneratorService`, informing multi-vertical vision prompts, default units (kg, g, L, pcs, set), pricing heuristics, and attribute extraction when scanning products.
- **Store Registration & Updates:** `POST /api/v1/auth/register-store` registers multi-category tenants; `PUT /api/v1/auth/settings` allows live modifications.

### 3.3. Product Catalog Management & Smart Auto-Fill
- **150+ Item Standard Catalog Bank (`categoriesData.ts`):** Pre-built dictionary across all 18 store verticals containing standard titles, subcategories, suggested MRPs, typical selling prices, units, descriptions, and high-resolution images.
- **Smart Title Autocomplete:** As merchants type into the Product Title field, an instant popover suggests matching standard items with prices and categories. Clicking any suggestion auto-fills all product fields.
- **Quick-Pick Popular Items Bar:** Horizontal carousel in the Add Product modal displaying fast-selling items tailored to the merchant's active store categories for 1-tap addition.
- **Category Quick Chips:** Quick selection chips (e.g. Grains & Flours, Cooking Oils, Dairy & Milk, Beverages, Men Fashion, Audio & Tech) preventing blank or mistyped categories.
- **Merchant Product CRUD (`/api/v1/admin/products`):**
  - Full pagination, filtering by category, search by title/description.
  - Quick 1-tap stock status toggling (`ACTIVE` vs `OUT_OF_STOCK`).
  - Compare price (MRP) and discounted selling price tracking.
  - Multi-image gallery support via JSONB array.
- **Public Storefront Catalog (`/api/v1/store/products`):**
  - Cached public catalog filtered by tenant subdomain.
  - Category filtering chips dynamically computed from inventory, price sorting, and live keyword search.

### 3.4. AI Product Studio & Vision Scanner
- **Dual AI Model Support (Google Gemini + OpenAI):**
  - Native integration with Google Gemini (`gemini-3.8-flash`, `gemini-3.5-flash-lite`, `gemini-flash-latest`) via REST API with `x-goog-api-key`.
  - OpenAI GPT-4o and GPT-4o-mini vision integration.
  - Smart `AUTO` mode prioritizing Google Gemini's generous free tier for Indian merchants, falling back to OpenAI.
  - Explicit merchant provider toggle ("GEMINI" vs "OPENAI").
- **Camera-to-Listing Pipeline (`POST /api/v1/admin/ai/generate-product`):**
  - Merchant snaps a photo of a product package or item.
  - Client-side canvas compression to optimize payload size.
  - AI extracts: Title, Brand, Category, Recommended Selling Price, MRP, Inventory, Description, Tags, and Barcode.
- **Interactive 360° Studio Enhancer (`POST /api/v1/admin/ai/enhance-photos`):**
  - Synthesizes 4 studio photography angles from a single upload:
    1. Angle 0°: Front Hero Studio
    2. Angle 45°: Perspective Turnaround
    3. Angle 90°: Side Profile Studio
    4. Macro Detail: Texture & Branding Close-up
  - Interactive rotation turntable with 0°-360° drag scrubber.
  - Studio command bar supporting instant slash actions: `/360`, `/podium`, `/studio`, `/macro`.
- **API Key Synchronization:**
  - Auto-persists Gemini and OpenAI keys to browser `localStorage` and syncs with tenant settings in the database.
  - Demo connect button for instant simulated preview.

### 3.5. Order Management & Hardware Printing
- **Order Flow (`POST /api/v1/store/orders`):**
  - Creates tenant-scoped order with sequential order number.
  - Supports `DELIVERY` (with address & landmark) and `PICKUP`.
  - Captures customer phone, name, delivery fees, and order item details in JSONB.
- **Merchant Order Board (`frontend-admin/src/components/OrderBoard.tsx`):**
  - Real-time status progression: `PLACED` -> `ACCEPTED` -> `PACKED` -> `DELIVERED` / `CANCELLED`.
  - Web Audio API notification chime on incoming new orders.
  - Status filter tabs with unread counters.
- **Thermal POS Receipt Printer:**
  - Native 58mm and 80mm thermal receipt generator (`GET /api/v1/admin/orders/{id}/receipt`).
  - Formatted text output with store header, itemized bill, tax summary, UPI transaction ID, and cut lines.
  - In-browser print dialog with monospace receipt styling.

### 3.6. Payment Stack
- **Direct UPI Dynamic QR Generation:**
  - Generates NPCI-compliant UPI payload: `upi://pay?pa={vpa}&pn={name}&am={amount}&tn={orderNumber}&cu=INR`.
  - Generates instant PNG QR code via ZXing library.
  - Deep-link intent triggers on mobile opening Google Pay, PhonePe, Paytm, or BHIM directly.
- **Razorpay Payment Gateway:**
  - `RazorpayController` and `RazorpayService` using `razorpay-java:1.4.6`.
  - Endpoints: `POST /api/v1/payment/razorpay/create-order` and `POST /api/v1/payment/razorpay/verify`.
  - Verifies signature using HMAC SHA-256 (`RAZORPAY_WEBHOOK_SECRET`).
  - Strict cryptographic verification: all simulation bypasses, mock test signatures, and client-side fallback approvals completely removed to prevent unauthorized payment bypass.
  - `RazorpayTransaction` audit entity for tracking payment attempts and status updates.

### 3.7. Customer Authentication & Account Management
- **Customer Authentication & Mandatory Checkout Guard:**
  - Mandatory customer login enforced for all storefront orders (`POST /api/v1/store/orders`).
  - Storefront UI blocks guest checkout in both `CartDrawer` and `CheckoutModal`; shoppers clicking checkout while unauthenticated are prompted with the `CustomerAuthModal` (Google 1-Tap or Mobile/Email OTP), automatically resuming directly to the populated checkout modal upon sign-in.
  - Backend enforces defense-in-depth: both `StorefrontController` and `OrderService` validate customer identity and reject unauthenticated requests with `HTTP 401 Unauthorized`.
- **Firebase Auth Integration:**
  - Storefront uses Firebase Web SDK 13.0.0 (Project: `amazingdeal-prod-2026-a1b2c`).
  - Google 1-Tap Sign-In popup and Phone SMS OTP.
- **Customer Database Model:**
  - `customers` table with `firebase_uid`, `phone`, `email`, `full_name`, `avatar_url`.
  - `customer_addresses` table with default address tags (`Home`, `Work`, `Other`), pincode, and landmark.
  - `orders.customer_id` foreign key linking past orders to authenticated customers.
- **Storefront Customer Modals:**
  - `CustomerAuthModal`: Google 1-tap sign-in and mobile login.
  - `SavedAddressesModal`: Add, edit, select, and delete delivery addresses.
  - `MyOrdersModal`: View real-time tracking badges and past order receipts.

### 3.8. Storefront Experience & SaaS Landing Page
- **Root Domain SaaS Landing Page (`amazingdeal.co.in`):**
  - High-conversion marketing page (`MerchantLandingPage.tsx`).
  - Interactive feature tour (Instant Store, AI Studio, Zero Commission UPI).
  - Pricing tiers: Starter (₹0/mo), Growth (₹499/mo), Enterprise.
  - Instant merchant registration modal and link to `admin.amazingdeal.co.in`.
- **Dynamic Storefront (`*.amazingdeal.co.in`):**
  - Branded store header with search and category filters.
  - Product grid with discount percentages, stock indicators, and quick-add buttons.
  - Slide-out Cart Drawer with real-time total, delivery fee calculations, and free delivery thresholds.
  - 1-Step Checkout Modal supporting delivery address, payment mode selection (Direct UPI, COD, Razorpay).
  - Order success confirmation with dynamic QR code and direct UPI app launcher.

### 3.9. Vyapar-Grade SME ERP: POS Counter Billing, GST Invoicing & Parties Khata
- **High-Speed Counter POS (`PosCounter.tsx`):**
  - Instant shop counter billing interface with global laser barcode scanning input and hotkeys (`F2` New Bill, `F4` Quick Pay Cash, `F8` Clear).
  - Fast search with real-time product autocomplete, quick-pick popular item chips, and customizable units (`pcs`, `kg`, `g`, `litre`, `box`).
  - Cash Change Calculator with one-tap rupee presets (₹100, ₹200, ₹500, ₹2000) and instant "Change to Return" display.
  - Direct UPI payment integration with merchant's VPA QR code.
- **GST & Indian Tax Compliance Engine:**
  - Automated state-based tax split logic: Intrastate supplies split into CGST (50%) and SGST (50%); Interstate supplies calculate IGST (100%).
  - Pre-mapped GST tax slabs (0%, 5%, 12%, 18%, 28%) and HSN/SAC code tracking.
  - Automatic nearest rupee round-off calculation.
  - Omnichannel inventory decrement: Counter billing automatically reduces live product inventory and marks items OUT_OF_STOCK when exhausted.
- **Multi-Format Receipt & Invoice Printing:**
  - **A4 / A5 Professional GST Tax Invoices (`GstInvoiceModal.tsx`):** Complete with merchant branding, GSTIN, customer GSTIN, place of supply, HSN summary, amount in words, bank account details for NEFT/IMPS, terms & conditions, and digital signature box.
  - **58mm / 80mm ESC/POS Thermal Receipts:** Monospace thermal slip formatting with cut lines and UPI QR.
  - **1-Tap WhatsApp Sharing:** Direct `https://wa.me/` deep links with pre-composed itemized summary and dynamic UPI payment URL.
- **Parties & Udhaar Khata Management (`PartiesKhata.tsx`):**
  - Customer and Supplier ledgers with live balance tracking (positive = "Lene Hain" / Receivables; negative = "Dene Hain" / Payables).
  - 1-Tap WhatsApp Payment Reminder button with pre-filled formal message and merchant UPI link.
  - Add / Edit Party modal with auto-extraction of 2-digit Indian State code from 15-digit GSTIN.
- **Smart GST & Bank Account Auto-Fill (`StoreSettings.tsx`):**
  - **IFSC Auto-Fetch:** Entering an 11-character Indian IFSC code (e.g. `SBIN0001295`, `HDFC0001234`) automatically queries RBI bank databases (`https://ifsc.razorpay.com/` with backend proxy fallback `GET /api/v1/admin/settings/lookup-ifsc`), instantly auto-populating Bank Name and Branch Name with real-time verification indicators.
  - **Instant Prefix Matcher:** Pre-loaded dictionary with 40+ Indian commercial bank prefixes (`SBIN` -> State Bank of India, `HDFC` -> HDFC Bank, `ICIC` -> ICICI Bank, etc.) providing instant feedback while typing.
  - **GSTIN Smart Parser & State Code Selector:** Entering 15-digit Merchant GSTIN automatically extracts 2-digit State Code and 10-digit PAN number. The State Code field is standardized across Settings, Counter POS, and Parties Khata as a full 37-state selector formatted as `{code}-{StateName}` (e.g. `03-Punjab`, `04-Chandigarh`, `07-Delhi`, `27-Maharashtra`, `29-Karnataka`).
- **Document Conversion Engine:**
  - Full document lifecycle support: 1-click conversion from Estimates / Quotations (`ESTIMATE`) to official GST Tax Invoices (`TAX_INVOICE`).

### 3.10. Payment Receiving & Merchant BYOK Architecture
- **Bring-Your-Own-Key (BYOK) Payment Gateway:**
  - Full support for merchant-owned Razorpay and Cashfree credentials.
  - Client-side and server-side encryption at rest using AES-256-GCM (`AesCryptoUtil`).
  - Dual execution modes: platform-level subscription billing vs tenant-level customer storefront checkout.
  - Interactive "Test Razorpay Connection" API (`POST /api/v1/admin/settings/test-razorpay`) with live connection health badges.
- **Direct Merchant UPI (0% Platform MDR):**
  - Instant direct bank settlement without payment gateway fees.
  - Dynamic QR code generation, click-to-pay deep links (GPay, PhonePe, Paytm, BHIM), and custom printed QR sticker URL uploads.
- **Cash on Delivery (COD) Rules & Anti-Fraud Engine:**
  - Configurable COD extra handling surcharge (e.g. ₹25 surcharge).
  - Minimum order amount and maximum order amount safeguards to prevent high-value fraud.
  - OTP verification flag and pay-at-doorstep fulfillment workflows.

### 3.11. Logistics Engine, Delivery Time Slots & Shiprocket BYOK
- **Shiprocket Domestic Courier Integration (BYOK):**
  - Live courier serviceability check across 29,000+ Indian pincodes (`POST /api/v1/store/shipping/check-serviceability`).
  - Automated AWB generation and order dispatch (`POST /api/v1/admin/orders/{id}/ship-shiprocket`).
  - Dynamic shipping label generation and real-time tracking links (BlueDart, Delhivery, DTDC, Shadowfax).
  - Flexible merchant freight pricing rules: `FLAT_FEE`, `PASS_THROUGH`, and `FREE_ABOVE` order thresholds.
  - Interactive "Test Shiprocket Connection" API with JWT token caching.
- **Own Store Delivery Fleet & Rider Dispatch:**
  - Hyperlocal radius configuration (km), standard delivery fee, free delivery threshold, and whitelisted pincode validator.
  - **Expected Delivery Date (EDD) & Time Slot Selector:** Support for slots such as "Today Evening (5 PM - 8 PM)", "Tomorrow Morning (9 AM - 12 PM)", and "Rush Express Delivery (60 mins)".
  - **Store Rider Dispatch Generator (`POST /api/v1/admin/orders/{id}/assign-rider`):** 1-tap WhatsApp dispatch link with customer address, Google Maps routing link, itemized summary, and exact cash-to-collect instructions.
  - **Store Pickup (BOPIS):** Pay-on-counter / free customer pickup mode with store physical address.

---

## 4. Chronological Decision Log (With Exact Timestamps)

The following log documents every major architecture, infrastructure, and feature decision made in the project, derived from git commit records and project history.

| Timestamp (ISO 8601) | Commit / Ref | Area | Decision & Rationale |
| :--- | :--- | :--- | :--- |
| **2026-10-15 20:31:56 +0530** | `b395536` | **Architecture** | Initial cloud multi-tenant architecture designed for `amazingdeal.co.in`. Selected zero-cost stack: Render (API), Neon (Postgres), Cloudflare Pages (Frontends), Cloudflare R2 (Media), Cloudflare Wildcard DNS & SSL. Chose shared database with discriminator column (`tenant_id`) and Hibernate `@Filter` for clean multi-tenancy. |
| **2026-10-15 20:34:32 +0530** | `9637d9c` | **Infrastructure** | Added alternative Oracle Cloud Infrastructure (OCI) Always-Free ARM VM deployment setup using `docker-compose.oci.yml` and Caddy reverse proxy with automated Let's Encrypt SSL. |
| **2026-10-15 20:52:23 +0530** | `37cd0a8` | **Database** | Provisioned live Neon Serverless PostgreSQL database (`ep-rough-fire-b4tti27m-pooler`) in US-East region with SSL connection pooling. Verified end-to-end multi-tenant schema creation and data isolation tests. |
| **2026-10-15 20:53:22 +0530** | `765061e` | **Docs** | Updated roadmap milestones in `plan.md` marking Phase 1 and live Neon DB verification as completed. |
| **2026-10-15 21:00:18 +0530** | `78494e6` | **DevOps** | Defaulted OCI compose configuration to remote Neon PostgreSQL so VM instances remain stateless. |
| **2026-10-15 21:17:35 +0530** | `0f90b5c` | **Frontend** | Upgraded Vite to version 6.x and added `wrangler.json` configurations for Cloudflare Pages/Workers static SPA asset deployment. |
| **2026-10-15 21:40:51 +0530** | `f24e68c` | **DevOps** | Cleaned Cloudflare `wrangler.json` configurations to remove asset binding conflicts for assets-only static deployment. |
| **2026-10-15 22:21:16 +0530** | `a6f95a8` | **DevOps** | Configured `render.yaml` for zero-credit-card deployment connecting directly to live Neon DB in Ohio region with health check monitoring. |
| **2026-10-16 11:15:56 +0530** | `9c5a346` | **Backend / Auth** | Enabled CORS for `workers.dev`, `pages.dev`, `onrender.com`, and custom domains. Added smart fallback to handle local dev vs production cloud API routing. |
| **2026-10-16 22:50:34 +0530** | `00f45a0` | **Frontend** | Implemented `useSubdomain` hook to dynamically extract tenant subdomains from `window.location.hostname` or `?store=` query parameter. Created storefront header and admin navigation bar. |
| **2026-10-17 11:22:33 +0530** | `8be1112` | **Customer Auth** | Decided on **Firebase Authentication (Google Cloud)** for customer login on storefront due to 100% free tier (unlimited Google Sign-In, 10,000 free phone OTPs/mo). Created `customers` and `customer_addresses` tables linked to `orders.customer_id`. |
| **2026-10-17 11:34:26 +0530** | `6122b28` | **Storefront UI** | Made Sign-In CTA prominent on all viewports in storefront header and added promotional sign-in banner inside the Cart Drawer to boost customer address saving. |
| **2026-10-18 10:56:31 +0530** | `90f3113` | **Storefront UI** | Implemented full storefront catalog views: category chips, instant search, responsive product cards, and bottom-sheet cart drawer. |
| **2026-10-18 11:19:46 +0530** | `aaab37e` | **CI/CD** | Migrated CI/CD workflow in `.github/workflows/deploy.yml` from deprecated `cloudflare/pages-action` to modern `cloudflare/wrangler-action@v3`. |
| **2026-10-18 17:02:16 +0530** | `db3aa79` | **Tooling** | Configured MCP (Model Context Protocol) servers for Render and payment developer services. |
| **2026-10-18 17:12:49 +0530** | `03a7672` | **Landing Page** | Built SaaS merchant marketing landing page on apex domain `amazingdeal.co.in` with store setup wizard and PayU subscription checkout. |
| **2026-10-18 17:21:03 +0530** | `8227c62` | **CI/CD** | Updated GitHub Actions workflow to deploy static SPA assets directly using Cloudflare Workers static asset configuration. |
| **2026-10-18 19:03:35 +0530** | `3fea7f2` | **Payments** | Routed PayU `surl`/`furl` payment callbacks to backend `/api/v1/payu/callback` and preserved merchant draft state across redirect loops. |
| **2026-10-18 19:09:29 +0530** | `37326e5` | **Payments** | Configured PayU integration to point to production gateway (`https://secure.payu.in/_payment`). |
| **2026-10-18 19:23:21 +0530** | `c62072e` | **Payments** | Configured Onrender callback URLs for PayU and added duplicate form submission guards. |
| **2026-10-19 02:08:43 +0530** | `141f8cb` | **Payments** | Integrated YouPI gateway and webhook endpoint for alternative UPI routing. |
| **2026-10-19 02:32:13 +0530** | `8f477fd` | **Payments** | Added resilient sovereign fallback to `initiateYoupi` when external gateway latency exceeds threshold. |
| **2026-10-19 15:12:22 +0530** | `3ca9fc1` | **Payments** | Initialized backend Razorpay integration using official `com.razorpay:razorpay-java:1.4.6` and built storefront Razorpay checkout client. |
| **2026-10-19 15:36:32 +0530** | `18056a5` | **Payments** | Configured live Razorpay credentials, webhook secret verification, and clean order ID parsing in payment controller. |
| **2026-10-19 19:05:08 +0530** | `80388b2` | **Storefront** | Added complete storefront UI components, styling, and CI/CD deployment workflow. |
| **2026-10-19 22:00:11 +0530** | `7119626` | **Networking** | Resolved client-side "Failed to fetch" errors by routing all frontend API requests to the live Render backend (`https://amazingdeal-backend.onrender.com`). |
| **2026-10-20 15:32:36 +0530** | `4b32fe7` | **Landing Page** | Refined SaaS landing page component with subscription tiers and streamlined merchant registration flow. |
| **2026-10-20 19:39:43 +0530** | `668dafe` | **Navigation** | Added merchant login CTA button to landing page header and routed admin links directly to `admin.amazingdeal.co.in`. |
| **2026-10-20 19:49:03 +0530** | `aa2d923` | **Cloudflare** | Configured custom domain route for `admin.amazingdeal.co.in` in `frontend-admin/wrangler.json`. |
| **2026-10-20 19:55:34 +0530** | `ff1115e` | **Routing** | Removed client-side window redirects in storefront so Cloudflare Pages edge routes directly based on hostname. |
| **2026-10-21 10:38:47 +0530** | `110b474` | **Core** | Implemented `TenantService`, `TenantRepository`, merchant `AuthModal`, and end-to-end tenant authentication tests. |
| **2026-10-21 11:00:48 +0530** | `ec34dea` | **AI** | Added `AiProductScannerModal` and AI catalog generation services with ChatGPT OAuth2 integration. |
| **2026-10-21 11:16:59 +0530** | `273d547` | **Security** | Added demo token bypass in `JwtFilter` to allow 1-click test evaluations without external login delays. |
| **2026-10-21 11:22:01 +0530** | `31a155b` | **Backend** | Fixed missing `Optional` import in `ChatGptOAuthService.java`. |
| **2026-10-21 11:31:05 +0530** | `cb82616` | **Frontend Admin** | Added "Instant Demo Connect" button in store settings AI card for instant sandbox testing. |
| **2026-10-21 11:43:45 +0530** | `acef0f2` | **AI** | Streamlined AI integration to prioritize Bring-Your-Own-Key (BYOK) for OpenAI API keys and GPT-4o-mini vision. |
| **2026-10-21 17:20:49 +0530** | `e2c71fb` | **Database** | Added complete JPA entity models for `Product` and `Tenant` and verified live Neon database schema creation. |
| **2026-10-21 18:11:36 +0530** | `2ad583c` | **AI** | Added multi-provider AI architecture in `AiCatalogGeneratorService` supporting both OpenAI and Google Gemini vision models. |
| **2026-10-21 18:20:52 +0530** | `d6a60c7` | **Settings** | Added store settings panel with AI key configuration and multi-provider selection. |
| **2026-10-21 18:41:21 +0530** | `d5f9c06` | **Gemini AI** | Updated Gemini client to use `gemini-flash-latest` with `x-goog-api-key` header and client-side photo canvas compression. |
| **2026-10-21 19:03:58 +0530** | `4e21646` | **AI UI** | Added dual OpenAI and Gemini key management with explicit provider selection buttons (`AUTO`, `GEMINI`, `OPENAI`). |
| **2026-10-21 19:06:40 +0530** | `d9b1a79` | **Bugfix** | Removed duplicate endpoint variable in `executeGeminiVisionRequest`. |
| **2026-10-21 19:17:39 +0530** | `46a1367` | **Gemini AI** | Configured `gemini-3.8-flash` as primary vision model with automated fallback to `gemini-3.5-flash-lite`. |
| **2026-10-21 19:26:58 +0530** | `af3f5b2` | **Gemini AI** | Refined active Gemini model pool and added automated retry logic on HTTP 503 service unavailable. |
| **2026-10-21 21:23:27 +0530** | `a53b979` | **AI Studio** | Implemented 360° multi-angle turnaround enhancer generating 4 studio photography angles and studio slash commands (`/360`, `/podium`, `/studio`, `/macro`). |
| **2026-10-21 21:24:00 +0530** | `ee52c68` | **AI Studio** | Added interactive 360° turntable, mouse/touch rotation scrubber, and studio command bar to `AiProductScannerModal.tsx`. |
| **2026-10-21 22:03:04 +0530** | `ab235e9` | **AI Studio** | Dynamically generated studio enhancer photos directly from the merchant's uploaded product image, eliminating static cargo pants fallback. |
| **2026-10-23 11:03:21 +0530** | `6aa9a09` | **Admin UI** | Refactored store management components, AI catalog generator service, and ChatGPT OAuth service. |
| **2026-10-23 11:44:58 +0530** | `cf72f9f` | **AI Settings** | Persisted and auto-synchronized Gemini and OpenAI API keys across browser sessions (`localStorage`) and modal dialogs. |
| **2026-10-23 12:27:08 +0530** | `7a98856` | **UI Bugfix** | Eliminated sticky preset `0` in Selling Price and number inputs in AI Product Studio modal. |
| **2026-10-24 14:55:00 +0530** | *Workspace* | **Documentation** | Created master `gemini.md` context anchor file containing full project scope, tech stack inventory, built feature catalog, timestamped decision history, and AI maintenance protocol. |
| **2026-10-24 15:10:00 +0530** | *Workspace* | **Architecture / Taxonomy** | Formalized and documented core store category verticals across onboarding, database, and storefront filters. |
| **2026-10-24 15:25:00 +0530** | *Workspace* | **Feature: Multi-Category & Smart Catalog** | Expanded store categories to 18 exhaustive retail verticals. Implemented multi-category store registration and settings management (`store_category` expanded to 1000/TEXT). Created 150+ item catalog bank (`categoriesData.ts`) and built 1-tap Quick-Pick item bars and real-time Title autocomplete in the Product Catalog. |
| **2026-10-24 16:20:00 +0530** | `f95bfe9` | **Cloudflare Deployment** | Identified that GitHub Actions edge deployment had been skipped due to unconfigured repository secrets. Configured custom domain route for `amazingdeal.co.in` in `frontend-storefront/wrangler.json`, deployed production builds for both `admin.amazingdeal.co.in` and `amazingdeal.co.in` via Cloudflare Wrangler, and verified live bundle delivery. |
| **2026-10-24 18:25:00 +0530** | *Workspace* | **Feature: Vyapar ERP & POS Billing (Phase 1)** | Implemented Vyapar-grade POS counter billing, GST tax invoicing, and customer/supplier Khata ledgers. Added `Party` and `Invoice` entities extending `TenantAwareEntity`. Built state-based tax split engine (Intrastate CGST+SGST vs Interstate IGST), real-time inventory decrement, sequential invoice numbering, document conversion (`ESTIMATE` -> `TAX_INVOICE`), A4/A5 GST Tax Invoice modal with print/WhatsApp sharing, ESC/POS thermal receipt formatting, and 1-tap WhatsApp payment reminders. Verified with 6 end-to-end integration tests. |
| **2026-10-24 21:50:00 +0530** | *Workspace* | **Feature: Payment Gateways (BYOK) & Logistics Engine (Shiprocket)** | Completed end-to-end merchant Payment and Delivery architecture. Implemented Razorpay BYOK with AES-256-GCM encrypted credentials, merchant-scoped order generation, signature verification, and live test connection validation. Built zero-MDR Direct Merchant UPI with custom QR sticker upload and Cash on Delivery (COD) with handling surcharges and min/max thresholds. Built domestic Shiprocket courier integration with automated AWB generation, shipping labels, and live pincode serviceability check. Added Store Fleet rider dispatch with 1-tap WhatsApp messages containing customer address, Google Maps link, and cash-to-collect alerts. Upgraded `StoreSettings.tsx` into a 5-tab studio, upgraded `OrderBoard.tsx` with 1-click Shiprocket and Rider dispatch, and upgraded storefront `CheckoutModal.tsx` with pincode serviceability, time slot selection, and BYOK payment flows. Verified with 6 live integration tests on Neon PostgreSQL. |
| **2026-10-28 19:54:00 +0530** | *Workspace* | **Bugfix: Auth Expiry & Shiprocket BYOK Diagnostics** | Resolved Shiprocket "Forbidden" error on Test Connection. Root causes diagnosed: (1) Merchant JWT expired after 24 hours while browser tab stayed active, leading Spring Security to return HTTP 403 on admin endpoints; extended merchant JWT validity to 30 days (`2592000000` ms) and added client-side token expiration detection with session refresh prompt; (2) Added `User-Agent: AmazingDeal-Hyperlocal/1.0` header across all Shiprocket HTTP requests to prevent Cloudflare WAF perimeter blocks; (3) Improved error response parsing in `ShiprocketService` to display exact API messages and provide guidance that Shiprocket requires dedicated API User credentials (Settings -> API -> Configure -> Create API User) rather than primary web login credentials; (4) Upgraded `StoreSettings.tsx` with API User guidance callouts and expandable error alert containers. |
| **2026-10-28 20:16:00 +0530** | *Workspace* | **Bugfix / Payments: Razorpay BYOK Engine & Diagnostics** | Refined Razorpay BYOK connection verification and order checkout flow. Identified & resolved: (1) Overbroad `contains("test")` bypass in `RazorpayService.testConnection` that falsely reported success on all `rzp_test_...` keys without contacting Razorpay; replaced with `testConnectionDetailed` performing live verification via `orders.fetchAll` and extracting exact Razorpay API errors; (2) Added fallback in `AdminSettingsController.testRazorpay` to resolve stored Key ID and decrypt masked Key Secret (`●●●●●●●●`); (3) Prevented dummy `order_byok_` IDs from reaching customer checkout and crashing the Razorpay JS SDK; (4) Enhanced `StoreSettings.tsx` with Razorpay API setup guidance callout pointing to Dashboard ➔ Settings ➔ API Keys. |
| **2026-10-29 20:23:00 +0530** | *Workspace* | **Infrastructure: OCI Migration Stack & Automated SSL** | Created turnkey `docker-compose.oci.yml` (PostgreSQL 16 + Java 21 Spring Boot + Caddy) and production `Caddyfile` for migrating from Neon/Render to Oracle Cloud Infrastructure (OCI) Always Free ARM Ampere A1 VM (Mumbai/Hyderabad). Outlined database dump (`pg_dump`), restore, and automated Let's Encrypt SSL orchestration. |
| **2026-10-29 21:35:00 +0530** | *Workspace* | **Bugfix / Persistence: BYOK & AI Keys Unified Database Storage** | Diagnosed and resolved why Payment BYOK, Shiprocket BYOK, Gemini, and OpenAI keys failed to save to database: (1) **Expired 24h JWT Token:** Server uptime exceeded 25h, causing requests to `/api/v1/admin/settings` and `/test-shiprocket` to be rejected with HTTP 403 Forbidden; (2) **Silent Frontend Failure:** `StoreSettings.handleSubmit` failed to `await onSave(payload)` and immediately flashed a false green success badge while `App.tsx` swallowed 403 errors with `console.warn`; (3) **AI Keys Disconnected:** `geminiKey` and `customKey` were completely omitted from `handleSubmit` payload and ignored by `AdminSettingsController.updateSettings`. Fixed by adding `geminiApiKey` and `openaiApiKey` to `AdminSettingsController.updateSettings`, returning `hasCustomGeminiKey`/`hasCustomOpenaiKey` in `getSettings`, making `StoreSettings.handleSubmit` asynchronous with full try/catch error banners, and rethrowing save failures in `App.tsx`. |
| **2026-10-29 22:25:00 +0530** | *Workspace* | **Security / Storefront: Mandatory Customer Authentication on Orders** | Replaced guest checkout with mandatory customer authentication. (1) **Backend Hardening:** Updated `StorefrontController.placeOrder` and `OrderService` to strictly validate `customerId`, returning `HTTP 401 Unauthorized` (`"Customers must be logged in to place an order."`) if unauthenticated; (2) **Storefront UI Guard:** Updated `CartDrawer.tsx` to require login before checkout, prompting with `CustomerAuthModal` and auto-resuming to checkout upon successful sign-in; (3) **Checkout Protection:** In `CheckoutModal.tsx`, blocked direct order submission when unauthenticated and added fallback login screen; (4) **StoreApi Cleanup:** Removed fake order client-side fallback in `storeApi.ts` so genuine backend errors are surfaced; (5) **Testing:** Updated `PaymentAndShippingIntegrationTest` and `LiveNeonEndToEndTest` with authenticated customer sessions (100% passing). |
| **2026-10-30 11:25:00 +0530** | *Workspace* | **Security / Payments: Payment Bypass Hardening & Simulation Removal** | Removed the "Test Mode: Simulate Instant Razorpay Confirmation" button and sandbox bypass option. (1) **Frontend Storefront:** Removed the sandbox test mode container and `handleSimulatePaymentSuccess` from `MerchantLandingPage.tsx`; (2) **API Verification Hardening:** Removed mock auto-approval fallback in `storeApi.ts.verifyRazorpayPayment`, strictly throwing real errors on payment rejection; (3) **Backend Cryptographic Enforcement:** Removed mock signature bypasses (`TEST_MOCK_SIGNATURE`, `SIMULATED_TEST_SIGNATURE`, `pay_simulated_`) in `RazorpayService.verifyPayment` and `verifyMerchantPayment`, enforcing genuine HMAC-SHA256 signature verification; (4) **Tests:** Updated `PaymentAndShippingIntegrationTest` to verify genuine HMAC-SHA256 calculations and assert that forged/simulated signatures are strictly rejected. |
| **2026-10-30 11:50:00 +0530** | *Workspace* | **Security / Configuration: Live Platform Master Razorpay Credentials & Zero Git Leakage** | Migrated platform subscription payment credentials to live Razorpay production keys without exposing credentials to git: (1) **Zero Git Exposure:** Removed hardcoded test keys from `application.yml`, `RazorpayConfig.java`, `RazorpayController.java`, `RazorpayService.java`, `render.yaml` (`sync: false`), `docker-compose.oci.yml`, and frontend fallbacks; (2) **Render Cloud Injection:** Injected Live API Key (`rzp_live_...`) and Secret securely into Render Web Service environment variables via authenticated REST API, triggering automatic zero-downtime redeployment; (3) **Local Safety:** Added `.env*` to root `.gitignore` and `backend/.gitignore`, creating untracked `backend/.env` for local environments; (4) **Clean Frontends:** Updated `MerchantLandingPage.tsx` and `storeApi.ts` to strictly consume backend-issued Razorpay configurations. |
| **2026-10-30 12:25:00 +0530** | *Workspace* | **Feature / ERP: IFSC Bank & Branch Auto-Fill & GSTIN Parser** | Implemented automatic bank name and branch name resolution in Store Settings -> GST & Bank Details: (1) **IFSC Live Lookup:** Added `ApiService.lookupIfsc` and backend proxy endpoint `GET /api/v1/admin/settings/lookup-ifsc` querying official RBI bank data via open Razorpay IFSC API; (2) **Instant Bank Recognition:** Added 40+ bank prefix dictionary (`BANK_PREFIX_MAP`) for instant feedback on typing 4 characters (e.g. `SBIN` -> State Bank of India, `HDFC` -> HDFC Bank, `ICIC` -> ICICI Bank); (3) **Auto-Population & UI Indicators:** Entering or pasting 11-digit IFSC code instantly auto-fills Bank Name and Branch Name with real-time verification status pills and manual re-trigger button; (4) **GSTIN Auto-Extraction:** Updated Merchant GSTIN input to automatically extract 2-digit State Code and 10-digit PAN number. |
| **2026-10-30 12:45:00 +0530** | *Workspace* | **UX / Compliance: Standardized 37-State GST Code Selector (`03-Punjab`)** | Standardized the 2-digit state code field in Settings -> GST & Bank Details, POS Counter, and Parties Khata: (1) Created centralized `gstStatesData.ts` mapping all 37 Indian States and Union Territories with `{code}-{StateName}` labels (e.g. `03-Punjab`, `04-Chandigarh`, `07-Delhi`, `29-Karnataka`); (2) Replaced plain number text input in `StoreSettings.tsx` with a styled dropdown displaying full state labels and auto-selecting on GSTIN entry; (3) Added backend safe truncation in `AdminSettingsController` to safely map multi-character state selections to `state_code VARCHAR(2)`. |

---

## 5. Maintenance Protocol for AI Agents & Developers

To prevent context drift and ensure complete architectural consistency across AI agent sessions, all AI models (Gemini, Claude, GPT, etc.) and human contributors **MUST adhere to the following rules**:

### Rule 1: Read `gemini.md` First
Before formulating a plan or modifying any code in this repository, check this document to understand:
- Existing tenant isolation patterns (`TenantContext`, `TenantAwareEntity`, `TenantFilter`).
- Selected cloud providers (Neon DB, Render, Cloudflare Pages/R2) to avoid introducing paid or conflicting infrastructure.
- Existing frontend components and REST endpoints to prevent duplicate implementations.

### Rule 2: Mandatory Update on Feature Addition / Deletion
Whenever you:
- **Add a feature:** Add the feature description to **Section 3 ("What Has Been Built Till Now")** and record a new entry in **Section 4 ("Chronological Decision Log")** with the current ISO date timestamp, changed area, and architectural rationale.
- **Modify / Refactor a feature:** Update the relevant component description in Section 3 and record the refactoring decision in Section 4.
- **Delete / Deprecate a feature:** Document the removal in Section 3 (or remove obsolete references) and record the deprecation rationale in Section 4.

### Rule 3: Maintain Historical Continuity
Never wipe or truncate the decision log in Section 4. Always append new decisions in chronological order so that future agents have access to the complete evolution of the codebase from start to end.

### Rule 4: Zero-Cost Cloud Discipline
Never introduce dependencies or cloud services that violate the zero-cost hosting principle of AmazingDeal. Any new service must have a permanent free tier or be self-hostable within the existing Render/OCI/Cloudflare architecture.
