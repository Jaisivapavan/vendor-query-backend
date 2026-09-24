# VendorQuery: Conversational Sales Intelligence & POS Backend

> A production-ready, multi-tenant Restaurant POS (Point of Sale) and operational backend powered by Google Gemini tool-calling for deterministic, conversational analytics.

---

## 🌟 Overview & System Objective

**VendorQuery** addresses real-world restaurant data intelligence challenges. Traditional restaurant POS systems lock analytical insights behind complex static dashboards and rigid reports. 

Instead of vulnerable Text-to-SQL approaches that expose databases to prompt injection and unauthorized leaks, **VendorQuery** couples:
1. **A deterministic POS & Billing Engine** (Express, TypeScript, Prisma, Neon PostgreSQL) enforcing strict multi-tenancy (`vendorId`).
2. **An AI Tool-Calling Layer (Google Gemini)** that only classifies vendor intent into predefined, parameterized analytical functions and streams natural-language executive summaries back via **Server-Sent Events (SSE)**.

---

## 🏛️ Core Architectural Pillars

```
┌────────────────────────────────────────────────────────────────────────┐
│                        LAYER 2: AI & STREAMING                         │
│                                                                        │
│   Client Chat Request ──► [Redis Rate Limiter: 10 req/min]             │
│                                │                                       │
│                                ▼                                       │
│                   Gemini 1.5 Flash (AI Studio)                         │
│                                │                                       │
│                        (Structured Tool Call)                          │
│                                │                                       │
│                                ▼                                       │
│                   Zod Argument Validation                              │
│                                │                                       │
│                   Server-Sent Events (SSE Stream) ◄─ Status & Tokens  │
└────────────────────────────────┼───────────────────────────────────────┘
                                 │ Calls Parameterized Methods
┌────────────────────────────────┼───────────────────────────────────────┐
│                        LAYER 1: POS CORE ENGINE                        │
│                                                                        │
│                   JWT Auth (req.vendorId Injected)                     │
│                                │                                       │
│                                ▼                                       │
│                   Analytics & Operational Services                     │
│          (getTopSellingItems, getRevenueSummary, getPaymentSplit)      │
│                                │                                       │
│                                ▼                                       │
│                  Prisma ORM (Strict tenant isolation)                 │
│                                │                                       │
│                                ▼                                       │
│                   PostgreSQL Database (Neon.tech)                      │
│            [Vendors, Categories, MenuItems, Orders, OrderItems]        │
│                     (350+ seeded historical orders)                    │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Elimination of SQL Injection**: The LLM NEVER writes raw SQL. It only issues structured function calls (`getTopSellingItems`, `getRevenueSummary`, `getPaymentMethodBreakdown`). Malicious commands like `"Drop tables"` trigger instant refusal.
2. **Strict Multi-Tenancy Invariant**: Tenant ownership (`vendorId`) is strictly extracted from the cryptographically verified JWT (`req.vendorId`). Neither the client nor the AI can choose or switch the `vendorId`.
3. **Low-Latency Token Streaming**: Leverages HTTP 1.1 Chunked Transfer Encoding (`text/event-stream`) to stream execution status and generated tokens in real time.
4. **Abuse Prevention & Caching**: Upstash Redis sliding-window rate limiting (10 queries/min) and response caching with automatic in-memory fallbacks.

---

## 🛠️ Tech Stack (Zero-Cost Production Setup)

| Component | Technology | Provider |
| :--- | :--- | :--- |
| **Language & Runtime** | Node.js (v20+ LTS) + TypeScript | Local / Cloud Container |
| **Framework** | Express.js | Open Source |
| **Database** | PostgreSQL 16 | [Neon.tech](https://neon.tech) |
| **ORM** | Prisma ORM | Open Source |
| **Cache & Throttling** | Redis (`ioredis`) | [Upstash](https://upstash.com) / In-Memory Fallback |
| **AI / LLM Engine** | Google Gemini Developer API | [Google AI Studio](https://aistudio.google.com) |
| **Validation & Auth** | Zod, Bcrypt, `jsonwebtoken`, Helmet, CORS | Open Source |
| **Deployment** | Web Service | [Render.com](https://render.com) |

---

## 📂 Project Structure

```
vendor-query-backend/
├── prisma/
│   ├── schema.prisma       # 5 relational models & indexes
│   └── seed.ts             # 350+ realistic orders across 60 days
├── src/
│   ├── @types/
│   │   └── express.d.ts    # Declaration merging for req.vendorId
│   ├── config/
│   │   ├── db.ts           # Prisma singleton
│   │   └── redis.ts        # Redis client & cache fallback
│   ├── controllers/
│   │   ├── auth.controller.ts     # Register & Login
│   │   ├── menu.controller.ts     # Categories & Dishes
│   │   ├── order.controller.ts    # Order creation & billing
│   │   ├── report.controller.ts   # Standard SQL aggregations
│   │   └── chat.controller.ts     # SSE stream handler
│   ├── middleware/
│   │   ├── auth.middleware.ts     # JWT verification & tenant isolation
│   │   ├── validate.middleware.ts # Zod schema validation
│   │   └── rateLimiter.ts         # Sliding-window rate limiter
│   ├── routes/
│   │   ├── auth.routes.ts         # /api/auth/*
│   │   ├── menu.routes.ts         # /api/menu/*
│   │   ├── order.routes.ts        # /api/orders/*
│   │   ├── report.routes.ts       # /api/reports/*
│   │   └── chat.routes.ts         # /api/chat/*
│   ├── services/
│   │   ├── auth.service.ts        # Bcrypt & JWT signing
│   │   ├── menu.service.ts        # Menu DB operations
│   │   ├── order.service.ts       # Transactional billing & 5% GST
│   │   ├── analytics.service.ts   # Parameterized aggregations
│   │   └── llm/
│   │       ├── gemini.service.ts  # Gemini chat & function call execution
│   │       └── toolRegistry.ts    # AI tool declarations & Zod schemas
│   ├── app.ts              # Express middleware & route mounting
│   └── server.ts           # Server bootstrap & graceful shutdown
├── .env.example
├── package.json
└── tsconfig.json
```

---

## 🚀 Quick Start Guide

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd Restaurent
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your credentials:
```env
PORT=5000
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
GEMINI_API_KEY="your_gemini_api_key_from_google_ai_studio"
JWT_SECRET="your_jwt_secret_key"
REDIS_URL="" # Optional, defaults to in-memory store
```

### 3. Synchronize Database & Seed Historical Data
```bash
npx prisma db push
npm run seed
```

### 4. Start Development Server
```bash
npm run dev
```

Server starts at `http://localhost:5000`.

---

## 📡 Key API Endpoints

### 🔐 Auth
* `POST /api/auth/register` — Create vendor account
* `POST /api/auth/login` — Login & receive JWT

### 🍽️ Menu & POS
* `GET /api/menu/categories` — List categories
* `POST /api/menu/categories` — Add category
* `GET /api/menu/items` — Active menu for POS billing
* `POST /api/menu/items` — Add dish
* `PATCH /api/menu/items/:id` — Update pricing or availability

### 🧾 Orders & Billing
* `POST /api/orders` — Create order (validates items, computes 5% GST, stores line items)
* `GET /api/orders` — Paginated order invoices with date filtering
* `GET /api/orders/:id` — Single invoice view

### 📊 Deterministic Analytics
* `GET /api/reports/top-items?limit=5` — Top selling dishes by quantity & revenue
* `GET /api/reports/revenue?startDate=2026-08-01` — Total sales, tax, and order count
* `GET /api/reports/payment-split` — Volume & revenue split by UPI, Cash, and Card

### 🤖 Conversational AI (SSE Stream)
* `POST /api/chat/stream`
```json
{
  "message": "What were my top 3 selling dishes this month and how much did we make?"
}
```
*Streams events in real time:*
```
data: {"type":"status","message":"Querying database via secure tool: getTopSellingItems..."}
data: {"type":"chunk","text":"Your top 3 selling dishes"}
data: {"type":"chunk","text":" this month were Butter Chicken..."}
data: {"type":"done"}
```
