# AmazingDeal (`amazingdeal.co.in`) - Master System Architecture & Code Study Guide

> **Document Type:** Master Architectural Specification, Engineering Manual & Code Reference Guide  
> **Target Audience:** System Architects, Full-Stack Engineers, AI Agents & Technical Evaluators  
> **Platform Version:** 1.0.0 Production Release (Cloud-Native Multi-Tenant Hyperlocal Commerce)  
> **Last Updated:** November 2026  

---

## Table of Contents
1. [Executive Summary & High-Level System Architecture](#chapter-1-executive-summary--high-level-system-architecture)
2. [Multi-Tenancy Engine & Request Lifecycle](#chapter-2-multi-tenancy-engine--request-lifecycle)
3. [Database Architecture & Complete ER Schema](#chapter-3-database-architecture--complete-er-schema)
4. [Authentication, Security & RBAC Engine](#chapter-4-authentication-security--rbac-engine)
5. [AI Product Studio & Vision Pipeline](#chapter-5-ai-product-studio--vision-pipeline)
6. [Indian Payment Stack & Hardware POS Printing](#chapter-6-indian-payment-stack--hardware-pos-printing)
7. [Logistics Engine & Delivery Fleet](#chapter-7-logistics-engine--delivery-fleet)
8. [Superadmin Master Operations Suite](#chapter-8-superadmin-master-operations-suite)
9. [Complete File-by-File Catalog & Code Walkthrough](#chapter-9-complete-file-by-file-catalog--code-walkthrough)
10. [Cloud DevOps & Zero-Cost Infrastructure Playbook](#chapter-10-cloud-devops--zero-cost-infrastructure-playbook)

---

# Chapter 1: Executive Summary & High-Level System Architecture

## 1.1 Business Problem & Platform Mission
Traditional e-commerce platforms charge exorbitant monthly SaaS subscriptions, take steep 15-30% transaction commissions, or lock small Indian merchants into complex proprietary ecosystems. **AmazingDeal** provides a zero-hosting-cost, cloud-native alternative where every kirana store, boutique, restaurant, pharmacy, or diagnostic lab gets:
1. **Their Own Branded Storefront:** Available via dynamic subdomain (e.g., `sharma.amazingdeal.co.in`) or custom domain (`grocery.com`).
2. **Dedicated Merchant Admin Portal:** Hosted at `admin.amazingdeal.co.in` with real-time order processing, inventory decrement, Vyapar-grade POS counter billing, and GST invoicing.
3. **Frictionless Indian Payment Stack:** 0% commission direct UPI QR codes (`upi://pay` deep links), Cash on Delivery (COD) with fraud thresholds, and merchant-owned Razorpay gateway (BYOK).
4. **AI "Camera-to-Catalog" Studio:** Photograph any physical product; vision AI extracts titles, categories, pricing, and generates a 4-angle 360° turnaround photoshoot.
5. **Zero-Hosting-Cost Discipline:** Engineered to operate completely within generous free tiers (Neon PostgreSQL, Render Docker web service, Cloudflare Pages/Workers, and Cloudflare R2).

## 1.2 System Topology Diagram

```
                                  [ CUSTOMER BROWSERS & MOBILE ]
                                                 │
                                                 ▼
                             ┌───────────────────────────────────────┐
                             │    Cloudflare Global Edge Network     │
                             │  • Universal & Wildcard SSL (*.co.in) │
                             │  • DDoS Mitigation & HTTP/3 Proxy     │
                             └───────────────────┬───────────────────┘
                                                 │
                      ┌──────────────────────────┼──────────────────────────┐
                      ▼                          ▼                          ▼
           [ Cloudflare Pages / Workers ] [ Cloudflare Pages ]     [ Cloudflare R2 ]
             frontend-storefront            frontend-admin          media.amazingdeal.co.in
             *.amazingdeal.co.in            admin.amazingdeal.co.in (Product Images & QR)
                      │                          │
                      └──────────────┬───────────┘
                                     │ REST APIs (/api/v1/**)
                                     ▼
                             ┌───────────────────────────────────────┐
                             │       Spring Boot 3.3.5 Backend       │
                             │        (Java 21 LTS on Render)        │
                             │  • TenantResolver & TenantFilter      │
                             │  • Stateless SecurityFilterChain      │
                             │  • AI Vision Service (Gemini/OpenAI)  │
                             │  • POS Billing & Tax Engine           │
                             └───────────────────┬───────────────────┘
                                                 │
                                                 ▼
                             ┌───────────────────────────────────────┐
                             │    Neon Serverless PostgreSQL 16      │
                             │  • AWS us-east-2 (Ohio Pooler)        │
                             │  • Discriminator column: tenant_id    │
                             │  • Hibernate @Filter Data Isolation   │
                             └───────────────────────────────────────┘
```

## 1.3 Technology Stack Inventory

| Component | Technology | Version | Purpose / Architectural Role |
| :--- | :--- | :--- | :--- |
| **Backend Framework** | Spring Boot | 3.3.5 | Core enterprise application framework & REST API engine |
| **Runtime Language** | Java (Eclipse Temurin) | 21 LTS | High-performance backend runtime with virtual threads & G1GC |
| **Database** | PostgreSQL on Neon | 16 | Serverless multi-tenant database with connection pooling |
| **ORM / Persistence** | Spring Data JPA / Hibernate | 6.x | Entity mapping, dynamic specifications & row-level filtering |
| **Security & Auth** | Spring Security & JJWT | 6.x / 0.12.6 | Stateless JWT authorization across Merchant, Customer, Superadmin |
| **AI Vision Engine** | Google Gemini & OpenAI | 3.8 Flash / 4o-mini | Camera-to-catalog attribute extraction & 360° photoshoot generation |
| **Payment Gateway** | Razorpay SDK & ZXing | 1.4.6 / 3.5.3 | Server-side HMAC verification & dynamic UPI QR generation |
| **Object Storage** | AWS Java SDK S3 (R2) | 2.29.1 | Cloudflare R2 S3-compatible media upload & public CDN delivery |
| **Frontend Admin** | React + TypeScript + Vite | 18.3.1 / 6.0.1 | Merchant administration, POS counter billing, GST reporting |
| **Frontend Storefront**| React + TypeScript + Vite | 18.3.1 / 6.0.1 | Shopper catalog, customer auth, cart drawer, 1-step checkout |
| **Customer Auth** | Firebase Authentication | 13.0.0 | Google 1-Tap Sign-In popup & SMS OTP authentication |
| **Styling & UI** | Tailwind CSS & Lucide | 3.4.15 / 1.16 | Responsive utility-first design & modern vector icon system |

---

# Chapter 2: Multi-Tenancy Engine & Request Lifecycle

## 2.1 Multi-Tenancy Architectural Pattern
AmazingDeal implements the **Shared Database with Discriminator Column** pattern. Instead of provisioning separate databases or schemas per tenant (which incurs high cloud infrastructure costs and slows migrations), every multi-tenant table includes a `tenant_id UUID` column.

Data isolation is guaranteed through three cooperative layers:
1. **Dynamic Tenant Identification (`TenantResolver`):** Resolves store identity from incoming HTTP requests.
2. **Context Binding (`TenantContext`):** ThreadLocal variable storing the authenticated tenant UUID for the duration of the thread.
3. **Automated Hibernate Session Filtering (`TenantFilter`):** Injects a persistent SQL filter into Hibernate sessions (`tenant_id = :tenantId`), making it mathematically impossible for one merchant to read or write another merchant's records.

## 2.2 Request Resolution Lifecycle

```
[ Incoming HTTP Request ] (e.g., GET https://sharma.amazingdeal.co.in/api/v1/store/products)
            │
            ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 1. TenantResolver.java                                                 │
│    • Parses Host header: "sharma.amazingdeal.co.in" ➔ "sharma"         │
│    • Fallback: Query param ?store=sharma                               │
│    • Fallback: Header X-Tenant-ID or JWT claim "tenantId"              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 2. TenantFilter.java (Spring Web OncePerRequestFilter)                │
│    • Queries TenantRepository by subdomain ("sharma")                  │
│    • Validates store status == 'ACTIVE'                                │
│    • Binds UUID to TenantContext.setTenantId(tenant.getId())           │
│    • Enables Hibernate Filter: entityManager.unwrap(Session.class)     │
│        .enableFilter("tenantFilter").setParameter("tenantId", tenantId)│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 3. Spring MVC Controller & Service Layer                               │
│    • Executes JPA query: productRepository.findAll()                   │
│    • Hibernate automatically appends: WHERE tenant_id = 'xxxx...'      │
│    • Returns isolated store catalog JSON                               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 4. Request Completion & Cleanup (finally block)                        │
│    • TenantContext.clear() prevents ThreadLocal thread pool leakage    │
└────────────────────────────────────────────────────────────────────────┘
```

## 2.3 `TenantAwareEntity` Base Architecture
All tenant-scoped JPA entities (`Product`, `Order`, `Party`, `Invoice`) extend `TenantAwareEntity`:
```java
@MappedSuperclass
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
public abstract class TenantAwareEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @PrePersist
    public void prePersist() {
        if (this.tenantId == null) {
            this.tenantId = TenantContext.getTenantId();
        }
    }
}
```

---

# Chapter 3: Database Architecture & Complete ER Schema

## 3.1 Entity-Relationship (ER) Master Schema

```
  ┌───────────────┐
  │  SUPERADMINS  │
  └───────────────┘
          
  ┌──────────────────────────────────────────────────────────────────────────┐
  │                                 TENANTS                                  │
  │  (store_name, subdomain, gstin, pan, bank_details, upi_vpa, settings)    │
  └───────┬───────────────────────────────┬──────────────────────────┬───────┘
          │ 1:N                           │ 1:N                      │ 1:N
          ▼                               ▼                          ▼
  ┌───────────────┐               ┌───────────────┐          ┌───────────────┐
  │   PRODUCTS    │               │    ORDERS     │◄──┐      │    PARTIES    │
  │ (mrp, price,  │               │ (total, items,│   │      │(khata balance,│
  │  inventory,   │               │  status, upi) │   │      │ credit limit) │
  │  hsn, images) │               └───────┬───────┘   │      └───────┬───────┘
  └───────────────┘                       │           │              │ 1:N
                                          │ N:1       │ N:1          ▼
                                          ▼           │      ┌───────────────┐
                                  ┌───────────────┐   │      │   INVOICES    │
                                  │   CUSTOMERS   │───┘      │ (tax split,   │
                                  │(firebase_uid, │          │  b2b, items,  │
                                  │ phone, email) │          │  round_off)   │
                                  └───────┬───────┘          └───────────────┘
                                          │ 1:N
                                          ▼
                                  ┌───────────────────┐
                                  │CUSTOMER_ADDRESSES │
                                  └───────────────────┘
```

## 3.2 Master Database Tables Reference

### 1. `tenants` Table (Stores & Master Business Profiles)
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY | Unique store identifier |
| `store_name` | VARCHAR(255) | NOT NULL | Registered store name |
| `subdomain` | VARCHAR(100) | UNIQUE, NOT NULL | Storefront subdomain (e.g., `sharma`) |
| `custom_domain` | VARCHAR(255) | UNIQUE, NULLABLE | Optional custom domain (`grocery.com`) |
| `owner_email` | VARCHAR(255) | UNIQUE, NOT NULL | Merchant login email |
| `owner_phone` | VARCHAR(20) | NOT NULL | Merchant WhatsApp/phone |
| `password_hash` | VARCHAR(255) | NOT NULL | BCrypt password hash |
| `status` | VARCHAR(20) | NOT NULL | `ACTIVE`, `SUSPENDED`, `TRIAL` |
| `store_category`| VARCHAR(1000)| NULLABLE | Multi-category CSV (e.g., "Groceries, Dairy") |
| `gstin` | VARCHAR(15) | NULLABLE | Indian 15-digit Merchant GSTIN |
| `state_code` | VARCHAR(2) | NOT NULL | 2-digit Indian State code (e.g. `07` Delhi) |
| `bank_name` | VARCHAR(100) | NULLABLE | Bank account name for invoice remittances |
| `bank_ifsc` | VARCHAR(20) | NULLABLE | 11-digit RBI IFSC code |
| `upi_vpa` | VARCHAR(100) | NULLABLE | Direct merchant UPI VPA (`store@okaxis`) |
| `subscription_plan`| VARCHAR(50)| NOT NULL | `STARTER`, `GROWTH`, `ENTERPRISE` |
| `subscription_expires_at`| TIMESTAMP| NULLABLE| Expiry timestamp for platform SaaS plan |

### 2. `products` Table (Merchant Catalog)
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY | Product ID |
| `tenant_id` | UUID | NOT NULL, INDEXED | Discriminator column linking to store |
| `title` | VARCHAR(255) | NOT NULL | Product title |
| `description` | TEXT | NULLABLE | Markdown SEO product description |
| `price` | NUMERIC(10,2)| NOT NULL | Discounted selling price |
| `compare_price` | NUMERIC(10,2)| NULLABLE | MRP / Maximum Retail Price |
| `category` | VARCHAR(100) | NOT NULL | Subcategory |
| `unit` | VARCHAR(20) | NOT NULL | Measure unit: `pcs`, `kg`, `g`, `litre`, `box` |
| `inventory_quantity`| INTEGER | NOT NULL | Live stock count |
| `status` | VARCHAR(20) | NOT NULL | `ACTIVE`, `OUT_OF_STOCK`, `DRAFT` |
| `images_json` | TEXT (JSONB) | NULLABLE | Array of public Cloudflare R2 image URLs |
| `hsn_sac` | VARCHAR(20) | NULLABLE | Indian GST HSN / SAC classification code |
| `gst_rate` | NUMERIC(5,2) | NOT NULL | GST slab: `0`, `5`, `12`, `18`, `28` (%) |

### 3. `orders` Table (Omnichannel Orders & POS Bills)
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY | Order ID |
| `tenant_id` | UUID | NOT NULL, INDEXED | Store owner UUID |
| `customer_id` | UUID | NULLABLE, INDEXED | Registered customer foreign key |
| `order_number` | VARCHAR(50) | NOT NULL | Sequential human bill number (`#ORD-1001`) |
| `customer_name`| VARCHAR(255) | NOT NULL | Customer name |
| `customer_phone`| VARCHAR(20) | NOT NULL | Delivery notification contact |
| `delivery_address`| TEXT | NULLABLE | Full street address or "Store Pickup" |
| `delivery_type`| VARCHAR(20) | NOT NULL | `DELIVERY`, `PICKUP` |
| `payment_method`| VARCHAR(20) | NOT NULL | `COD`, `UPI_ONLINE`, `RAZORPAY`, `CASH` |
| `payment_status`| VARCHAR(20) | NOT NULL | `PENDING`, `PAID`, `FAILED` |
| `order_status` | VARCHAR(30) | NOT NULL | `PLACED`, `ACCEPTED`, `PACKED`, `DELIVERED`, `CANCELLED` |
| `total_amount` | NUMERIC(10,2)| NOT NULL | Net order total |
| `items_json` | TEXT | NOT NULL | Complete snapshot of line items and prices |

---

# Chapter 4: Authentication, Security & RBAC Engine

## 4.1 Multi-Role JWT Architecture
The platform runs a stateless security model where every authenticated actor receives an HMAC-SHA256 signed JWT containing their role and tenant context:

```
┌────────────────────────────────────────────────────────────────────────┐
│ Decoded AmazingDeal JWT Claims Payload                                 │
├────────────────────────────────────────────────────────────────────────┤
│ {                                                                      │
│   "sub": "user@example.com",                                           │
│   "role": "ROLE_MERCHANT" | "ROLE_CUSTOMER" | "ROLE_SUPERADMIN",       │
│   "tenantId": "d3b07384-d113-40f4-8a1a-4d23253b2d1d",                 │
│   "subdomain": "sharma",                                               │
│   "customerId": "8f12a84b-...",                                        │
│   "iat": 1730000000,                                                   │
│   "exp": 1732592000                                                    │
│ }                                                                      │
└────────────────────────────────────────────────────────────────────────┘
```

## 4.2 Endpoint Security Matrix

| Endpoint Route Pattern | Required Role / Permission | Description |
| :--- | :--- | :--- |
| `/api/v1/auth/**` | Public (`permitAll()`) | Store registration & merchant login |
| `/api/v1/store/customer/auth/**`| Public (`permitAll()`) | Firebase token exchange for customer JWT |
| `/api/v1/store/customer/**` | `ROLE_CUSTOMER` | Saved delivery addresses & past orders |
| `/api/v1/store/**` | Public (`permitAll()`) | Public storefront catalog & place order |
| `/api/v1/admin/**` | `ROLE_MERCHANT` | Merchant catalog CRUD, POS counter, GST reports |
| `/api/v1/superadmin/auth/**` | Public (`permitAll()`) | Superadmin email/password login |
| `/api/v1/superadmin/**` | `ROLE_SUPERADMIN` | Global platform operations & cross-store telemetry |
| `/api/v1/health` | Public (`permitAll()`) | Automated uptime pings & health checks |

---

# Chapter 5: AI Product Studio & Vision Pipeline

## 5.1 "Camera-to-Catalog" Workflow
Merchants can photograph any retail packaging. The client compresses the image via an HTML5 canvas and posts the base64 payload to `/api/v1/admin/ai/generate-product`:

```
[ Merchant Smartphone ]
         │ Snaps product packaging photo
         ▼
[ HTML5 Canvas Compression ] (Resizes to max 1024px, 85% JPEG to save mobile bandwidth)
         │
         ▼ POST /api/v1/admin/ai/generate-product
[ AiCatalogGeneratorService.java ]
         │
         ├──► 1. Priority 1: Google Gemini 3.8 Flash (Free Tier, Fast Indian Response)
         └──► 2. Priority 2: OpenAI GPT-4o-mini (Fallback BYOK)
         │
         ▼ Vision Extraction Prompt
[ Structured JSON Output ]
         • Title: "Fortune Sunlite Refined Sunflower Oil (1L Pouch)"
         • Brand: "Fortune"
         • Category: "Cooking Oils & Ghee"
         • Suggested Selling Price: ₹135.00 | Suggested MRP: ₹165.00
         • Barcode: "8906007281024"
         • HSN Code: "1512" | GST Rate: 5%
         • Multi-angle Turnaround Synthesizer (0°, 45°, 90°, Macro)
```

---

# Chapter 6: Indian Payment Stack & Hardware POS Printing

## 6.1 Direct UPI Dynamic QR Generation
AmazingDeal generates compliant NPCI `upi://pay` deep links directly from merchant settings without middleman gateway commissions:
$$	ext{URI} = 	ext{upi://pay?pa=}\langle	ext{VPA}angle	ext{\&pn=}\langle	ext{StoreName}angle	ext{\&am=}\langle	ext{Amount}angle	ext{\&tn=ORD-}\langle	ext{OrderNo}angle	ext{\&cu=INR}$$

- Google ZXing generates an instant high-resolution PNG QR matrix.
- On mobile browsers, clicking the QR code triggers deep-link intents launching PhonePe, Google Pay, Paytm, BHIM, or Cred directly.

## 6.2 Indian GST Compliance & Tax Splitting
The billing engine automatically splits taxes based on the merchant's state code vs the buyer's place of supply:
- **Intrastate Supply (e.g. Delhi to Delhi):**
  $$	ext{CGST} = rac{	ext{GST Rate}}{2}, \quad 	ext{SGST} = rac{	ext{GST Rate}}{2}, \quad 	ext{IGST} = 0$$
- **Interstate Supply (e.g. Delhi to Punjab):**
  $$	ext{IGST} = 	ext{GST Rate}, \quad 	ext{CGST} = 0, \quad 	ext{SGST} = 0$$

---

# Chapter 7: Logistics Engine & Delivery Fleet

## 7.1 Multi-Mode Fulfillment Options
Merchants configure three independent fulfillment modes:
1. **Store Fleet Dispatch:** Local delivery boys managed by the shop with 1-tap WhatsApp dispatch messages containing customer address, GPS Google Maps coordinates, and exact cash-to-collect.
2. **Shiprocket BYOK:** Automated domestic courier integration covering 29,000+ Indian pincodes with instant AWB generation, shipping labels, and real-time tracking (Delhivery, BlueDart, DTDC).
3. **Store Pickup (BOPIS):** Buy-Online-Pickup-In-Store with ready-for-pickup notifications.

---

# Chapter 8: Superadmin Master Operations Suite

## 8.1 Platform-Wide Governance
Housed inside `frontend-admin` and protected by `ROLE_SUPERADMIN`, the platform master dashboard provides complete oversight:
- **Platform Telemetry:** Live counters for active stores, registered customers, platform GMV, and SaaS revenue.
- **Pure Database Specifications:** Built using `JpaSpecificationExecutor<T>` and Criteria API predicates, completely eliminating untyped null parameter JDBC crashes.
- **1-Click Merchant Impersonation:** Superadmins can generate scoped merchant sessions to troubleshoot or manage any store directly, with a floating top banner to return anytime.
- **System Diagnostics:** Live JVM heap telemetry (`usedMemory`, `totalMemory`, `freeMemory`), processor cores, and database connection pool status.

---

# Chapter 9: Complete File-by-File Catalog & Code Walkthrough

## 9.1 Backend Java Source Code (`backend/src/main/java`)

### Core & Configuration
- **`AmazingdealApplication.java`:** Spring Boot entry point (`@SpringBootApplication`).
- **`HealthController.java`:** Public `/api/v1/health` endpoint responding with system uptime and status for Keep-Alive uptime daemons.
- **`config/SecurityConfig.java`:** Configures Spring Security 6 stateless filter chain, CORS origin patterns, and endpoint role requirements.
- **`config/JwtFilter.java`:** HTTP request filter extracting and validating Bearer JWT tokens, establishing `SecurityContext` and setting tenant/customer contexts.
- **`config/JwtTokenProvider.java`:** Cryptographic JJWT builder and parser generating merchant, customer, and superadmin tokens.
- **`config/GlobalExceptionHandler.java`:** Global `@RestControllerAdvice` catching validation, entity not found, and unauthorized exceptions.

### Multi-Tenancy Subsystem (`multitenancy/`)
- **`TenantContext.java`:** ThreadLocal holder for current `tenantId` and `subdomain`.
- **`CustomerContext.java`:** ThreadLocal holder for authenticated `customerId`.
- **`TenantResolver.java`:** Extracts tenant identifier from host subdomain, query parameter `?store=`, or header `X-Tenant-ID`.
- **`TenantFilter.java`:** Intercepts requests, validates tenant, injects ID into Hibernate session filter (`tenantFilter`), and sets context.
- **`TenantAwareEntity.java`:** Base class for all tenant-scoped tables with `@PrePersist` tenant assignment.

### Artificial Intelligence (`modules/ai/`)
- **`controller/AiCatalogController.java`:** Endpoints `/generate-product`, `/enhance-photos`, `/chatgpt/*`.
- **`service/AiCatalogGeneratorService.java`:** REST client executing prompts against Gemini 3.8 Flash and OpenAI GPT-4o-mini.
- **`service/ChatGptOAuthService.java`:** Token management for connected ChatGPT developer accounts.
- **`util/AesCryptoUtil.java`:** AES-256-GCM encryption utility protecting API keys and credentials at rest.
- **DTOs:** `AiPhotoAngle`, `AiPhotoEnhanceRequest`, `GeneratedProductResponse`, `CustomApiKeyRequest`.

### Billing & POS Khata (`modules/billing/` & `modules/party/`)
- **`controller/BillingController.java`:** Endpoints for creating invoices, fetching invoice history, and streaming GSTR-1 CSV exports.
- **`service/BillingService.java`:** Tax calculation engine, sequential invoice numbering, document conversion.
- **`model/Invoice.java`:** Entity for B2B/B2C tax invoices and estimates.
- **`repository/InvoiceRepository.java`:** Invoice data access and sales aggregate queries.
- **`controller/PartyController.java`:** Endpoints for customer/supplier khata accounts.
- **`service/PartyService.java`:** Ledger balance calculations (Lene Hain vs Dene Hain).
- **`model/Party.java`:** Entity storing party GSTIN, credit limits, and balances.
- **`repository/PartyRepository.java`:** Party queries.

### Customer Management (`modules/customer/`)
- **`controller/CustomerAuthController.java`:** Endpoint `/api/v1/store/customer/auth/firebase-login`.
- **`controller/CustomerAccountController.java`:** Customer addresses, profile, and order history endpoints.
- **`service/CustomerService.java`:** Firebase UID mapping, customer registration, address book management.
- **`model/Customer.java`:** Customer account entity.
- **`model/CustomerAddress.java`:** Multi-address entity with default tags.

### Order Management (`modules/order/`)
- **`controller/StorefrontController.java`:** Public endpoint `POST /api/v1/store/orders` with mandatory customer login guard.
- **`controller/AdminOrderController.java`:** Merchant order progression, status updates, ESC/POS receipt generator.
- **`service/OrderService.java`:** Order placement, inventory decrement, receipt text formatting.
- **`model/Order.java`:** Omnichannel order entity with JSONB items and delivery metadata.
- **`repository/OrderRepository.java`:** JPA specifications for global order search and revenue calculations.

### Payments (`modules/payment/`)
- **`controller/RazorpayController.java`:** Razorpay order creation and webhook verification.
- **`service/RazorpayService.java`:** Official Razorpay Java SDK integration and HMAC-SHA256 signature validation.
- **`model/RazorpayTransaction.java`:** Audit trail for SaaS subscription transactions.

### Products (`modules/product/`)
- **`controller/AdminProductController.java`:** Product CRUD, category filtering, stock toggles.
- **`service/ProductService.java`:** Inventory updates and catalog management.
- **`model/Product.java`:** Product entity with comparePrice, HSN, and multi-image JSONB.

### Shipping & Logistics (`modules/shipping/`)
- **`service/ShiprocketService.java`:** Shiprocket courier BYOK token authentication, AWB generation, and serviceability checks.

### Superadmin Operations (`modules/superadmin/`)
- **`controller/SuperadminAuthController.java`:** Superadmin login endpoint.
- **`controller/SuperadminController.java`:** Endpoints for platform stats, merchant management, customer status, and impersonation.
- **`service/SuperadminService.java`:** Platform KPI aggregation, JPA specifications, and scoped token issuance.
- **`model/Superadmin.java`:** Superadmin user entity.
- **`config/SuperadminDataInitializer.java`:** Seeds default superadmin on startup if table is empty.

### Tenant & Settings (`modules/tenant/`)
- **`controller/AuthController.java`:** Merchant registration (`/register-store`) and login.
- **`controller/AdminSettingsController.java`:** Store configuration updates, IFSC live lookup, BYOK test endpoints.
- **`service/TenantService.java`:** Store creation and settings persistence.
- **`model/Tenant.java`:** Master tenant entity with multi-category and logistics settings.

---

## 9.2 Frontend Admin Source Code (`frontend-admin/src`)
- **`App.tsx`:** Master admin state coordinator, role-aware routing (Superadmin vs Merchant), data refresh interval.
- **`types.ts`:** Complete TypeScript interface contracts for Products, Orders, Invoices, Parties, and Superadmin.
- **`services/api.ts`:** HTTP client wrapper managing JWT tokens, tenant headers, and API endpoints.
- **`components/Navbar.tsx`:** Merchant navigation bar with store status pills, storefront deep links, and notifications.
- **`components/OrderBoard.tsx`:** Real-time incoming order stream with audio chimes and status progression.
- **`components/PosCounter.tsx`:** High-speed counter billing with barcode scanning, rupee change presets, and hotkeys.
- **`components/ProductCatalog.tsx`:** Catalog management with instant title autocomplete and dynamic category chips.
- **`components/StoreSettings.tsx`:** 5-tab settings studio for Bank IFSC auto-fetch, GSTIN parser, AI BYOK, and Shiprocket.
- **`components/InvoiceList.tsx`:** Sales register with period filters (This Month, Last Month), GST KPI cards, and CSV/Excel exports.
- **`components/GstInvoiceModal.tsx`:** A4/A5 tax invoice preview with print/WhatsApp sharing.
- **`components/BatchInvoicesModal.tsx`:** Batch invoice printing and PDF export with manual date pickers and search.
- **`components/PartiesKhata.tsx`:** Customer & Supplier credit ledgers with 1-tap WhatsApp payment reminders.
- **`components/ThermalReceiptModal.tsx`:** Monospace ESC/POS thermal receipt formatting for 58mm/80mm printers.
- **`components/AiProductScannerModal.tsx`:** Camera-to-catalog interface and interactive 360° turntable.
- **`components/superadmin/*`:** Complete Superadmin frontend suite (Navbar, Overview, Merchants, Customers, Orders, Subscriptions, Health).
- **`utils/printInvoices.ts`:** Isolated iframe printing engine ensuring zero blank pages.
- **`utils/gstExport.ts`:** Multi-sheet Excel XML (.xls) GSTR-1 workbook generator.

---

## 9.3 Frontend Storefront Source Code (`frontend-storefront/src`)
- **`App.tsx`:** Public storefront coordinator rendering catalog or SaaS landing page based on subdomain.
- **`components/MerchantLandingPage.tsx`:** Apex marketing page (`amazingdeal.co.in`) with pricing tiers and store wizard.
- **`components/StoreHeader.tsx`:** Branded store header with category navigation and customer auth button.
- **`components/ProductCard.tsx`:** Responsive product card with discount percentages and quick-add buttons.
- **`components/CartDrawer.tsx`:** Slide-out cart drawer with delivery fee calculations and customer sign-in requirement.
- **`components/CheckoutModal.tsx`:** 1-step checkout modal with address selection, delivery time slots, and payment modes.
- **`components/CustomerAuthModal.tsx`:** Firebase Google 1-Tap and Phone OTP sign-in dialog.
- **`components/SavedAddressesModal.tsx`:** Saved address management book.
- **`components/MyOrdersModal.tsx`:** Customer order tracking and receipt views.
- **`hooks/useSubdomain.ts`:** Extracts store subdomain from hostname or query parameters.
- **`hooks/useCustomerAuth.ts`:** Firebase auth state listener and customer token storage.
- **`hooks/useCart.ts`:** Persistent shopping cart state hook.
- **`services/storeApi.ts`:** Public catalog and order placement API client.
- **`services/firebase.ts`:** Firebase Web SDK initialization.

---

# Chapter 10: Cloud DevOps & Zero-Cost Infrastructure Playbook

## 10.1 Zero-Cost Cloud Architecture
AmazingDeal is intentionally engineered to operate with zero hosting expenses:
1. **Neon PostgreSQL Free Tier:** 0.5 GB SSD storage, automatic cold autosuspend, dedicated pooled connection URL.
2. **Render Docker Free Tier:** 512 MB RAM web service running Java 21 LTS with Keep-Alive ping to avoid cold starts.
3. **Cloudflare Free Tier:** Universal SSL, Wildcard DNS (`*.amazingdeal.co.in`), DDoS defense, HTTP/3, and 10 GB R2 storage with zero egress fees.
4. **Cloudflare Pages / Workers:** Unlimited static asset hosting for `admin.amazingdeal.co.in` and storefronts.

## 10.2 Alternative OCI Always-Free Stack
For high-traffic deployments, the root directory includes turnkey configurations for **Oracle Cloud (OCI) Always-Free ARM VM** (4 OCPUs, 24 GB RAM, 200 GB NVMe):
- **`docker-compose.oci.yml`:** Colocated PostgreSQL 16 + Spring Boot 3.3 + Caddy automated SSL reverse proxy.
- **`Caddyfile`:** Auto-obtains Let's Encrypt certificates for `api.amazingdeal.co.in` and proxies to backend on port 8080.
