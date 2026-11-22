# 🌐 ELGS — Ethereal Logistics Management System (Enterprise Edition)

[![Rust](https://img.shields.io/badge/Rust-Axum%200.7%20Tokio-orange?style=flat-square&logo=rust)](https://www.rust-lang.org/)
[![Astro](https://img.shields.io/badge/Astro-5.0-bc52ee?style=flat-square&logo=astro)](https://astro.build/)
[![Ethereal UI](https://img.shields.io/badge/Design%20System-Ethereal%20UI-38bdf8?style=flat-square)](https://ethereal-ui.dev)
[![Compliance](https://img.shields.io/badge/Compliance-SOC--2%20%7C%20SoD%20Enforced-green?style=flat-square)](https://www.aicpa.org/soc4so)
[![Database](https://img.shields.io/badge/Database-Supabase%20%2B%20Upstash-blue?style=flat-square)](https://supabase.com)

**ELGS (Ethereal Logistics Management System)** is an enterprise-grade, mission-critical distributed logistics and cold-chain supply chain operating system. Engineered with **Astro 5 + Ethereal UI** on the frontend and an asynchronous **Rust Axum + Tokio** engine on the backend, ELGS enforces strict **Role-Based Access Control (RBAC)**, **Segregation of Duties (SoD) Maker-Checker governance**, and an immutable cryptographic **SOC-2 Type II Audit Trail**.

---

## 🏗️ Architectural Overview

```
                                  ELGS Core Engine
                                         │
     ┌───────────────────────────┬───────┴───────────────────┬───────────────────────────┐
     │                           │                           │                           │
ORDER & DISPATCH            WAREHOUSE & STOCK           FLEET TELEMATICS            FINANCIAL LEDGER
- Dynamic Order Lifecycle   - Multi-zone Facility Hubs  - Live GPS & Cryo Sensors   - IATA Air Freight Tariffs
- SoD Maker-Checker Gates   - Sub-zero Cold Vaults      - Driver Fatigue Guard      - Settle Dual-Control
- Full CRUD API / Modals    - Dual-Control Opname       - Route Dispatch Queue      - Automated Invoicing
     │                           │                           │                           │
     └───────────────────────────┼───────────────────────────┼───────────────────────────┘
                                 │
     ┌───────────────────────────┴───────────────────────────┐
     │                                                       │
  RBAC PERSONAS & PERMISSIONS            SOC-2 COMPLIANCE AUDIT TRAIL
  - SuperAdmin (Alexander H.)             - SHA-256 HMAC Signatures
  - LogisticsManager (Diana P.)           - Non-Repudiation Immutable Ledger
  - WarehouseOperator (Farhan M.)         - Dual-Sign-Off Verification
  - FleetDispatcher (Satria W.)           - Segregation of Duties (SoD) Trap
  - FinanceAuditor (Evelyn W.)
```

---

## 🔐 Enterprise Governance: RBAC, SoD, & SOC-2

### 1. Role-Based Access Control (RBAC) Matrix
ELGS manages roles and corporate user accounts dynamically inside PostgreSQL (`elgs_users`):
| Persona | Role | Department | Permissions |
|---|---|---|---|
| **Alexander Hartono** | `SuperAdmin` | Enterprise Operations | Full Wildcard access (`*`) — Security admin, configuration |
| **Hendra Wijaya** | `ProjectManager` | Supply Chain Solutions | Project oversight, order approvals, fleet and warehouse management |
| **Diana Puspita** | `LogisticsManager` | Fulfillment Management | Create/Update orders, approve inventory, route dispatch, finance |
| **Farhan Maulana** | `WarehouseOperator` | Warehouse & Cryo Vault | Bin counts, stock transfers, cold-storage telemetry |
| **Satria Wicaksono** | `FleetDispatcher` | Fleet Telematics | Assign routes, driver telematics, route dispatch |
| **Evelyn Wijaya** | `FinanceAuditor` | Treasury & Internal Audit | Freight invoices, dual-control settle, audit trail review |
| **Bambang Pamungkas** | `Driver` | Ground Operations | Active route navigation, proof of delivery execution |

### 2. Segregation of Duties (SoD) Enforced Rules
- **Order Maker-Checker Rule**: The user who created a sales order (`created_by`) is strictly prohibited from approving inventory reservation for that same order, unless authorized as `SuperAdmin`.
- **Stock Opname Dual-Control**: Physical stock audit count sheets submitted by an operator cannot be reconciled/approved by that same operator.
- **Invoice Settlement Control**: Invoices issued by an auditor cannot be settled by the same user without dual-party authorization.

### 3. SOC-2 Type II Cryptographic Audit Trail
- Every mutation (`CREATE_ORDER`, `RESERVE_INVENTORY`, `DISPATCH_VEHICLE`, `STOCK_OPNAME`, `SETTLE_INVOICE`) records an immutable audit log.
- Entries feature an actor ID, role, client IP, payload snapshot, timestamp, and SHA-256 cryptographic signature.
- Attempted SoD violations are logged with `is_sod_violation: true` for audit scrutiny.

---

## 🗄️ Database & Cache Infrastructure (Supabase & Upstash)

Configure your production or staging database credentials in `.env` (copied from `.env.example`):

```bash
# Supabase PostgreSQL (Port 5432 or 6543 pooler)
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
DATABASE_URL="postgres://postgres.your-project-ref:your-db-password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require"

# Upstash Serverless Redis (Distributed locks & live telemetry)
UPSTASH_REDIS_REST_URL="https://your-upstash-instance.upstash.io"
UPSTASH_REDIS_REST_TOKEN="AX...YourToken..."
REDIS_URL="rediss://default:your-token@your-upstash-instance.upstash.io:6379"
```

A complete SQL migration script with 9 enterprise tables, constraints, foreign keys, and indexes is provided at:
👉 `backend/migrations/0001_init_elgs_schema.sql`

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** >= 20.x & **pnpm** >= 9.x
- **Rust** toolchain (`rustc`, `cargo` >= 1.80)

### 1. Installation
```bash
# Install workspace and frontend dependencies
pnpm install
cd frontend && pnpm install && cd ..
```

### 2. Run in Development
```bash
# Run both Backend & Frontend concurrently
pnpm dev

# Or start individually:
pnpm dev:backend   # Rust Axum backend on http://127.0.0.1:8080
pnpm dev:frontend  # Astro 5 frontend on http://localhost:4321
```

### 3. Running Enterprise Test Suites
```bash
# Runs full Rust domain tests + Vitest frontend suite (Husky pre-commit enforces this)
pnpm test
```

### 4. Production Release Builds
```bash
pnpm run build:backend   # Compiles optimized Rust binary (target/release/elgs-backend)
pnpm run build:frontend  # Compiles Astro 5 static + SSR output (frontend/dist/)
```

---

## 🧪 Verified Test Suites
- **Rust Backend**:
  - `tests/order_lifecycle_test.rs` — 3 tests (transitions, state machine validation, invariant guards)
  - `tests/tariff_and_finance_test.rs` — 2 tests (IATA dimensional weight calculation, invoice generation)
  - `tests/concurrency_stock_test.rs` — Concurrency testing under multi-threaded allocation
  - `tests/api_integration_test.rs` — 3 Axum integration tests
  - `tests/rbac_and_sod_test.rs` — 3 tests enforcing RBAC permissions and SoD Maker-Checker violations
- **Frontend Vitest**:
  - `frontend/src/tests/theme_switcher.test.tsx` — Dynamic OKLCH theme switching & DOM link verification
  - `frontend/src/tests/order_management.test.tsx` — Order rendering, CRUD modals, and status badges
  - `frontend/src/tests/tariff_calculator.test.ts` — Dimensional weight calculation algorithms
  - `frontend/src/tests/audit_trail_and_rbac.test.tsx` — SOC-2 compliance audit log rendering & SoD violation inspection
