# 🌐 NexusLogistics Enterprise LMS (Logistics Management System)

An ultra-modern, production-grade, distributed enterprise logistics management system designed for multi-tier supply chain operations, fulfillment automation, fleet dispatch telematics, and dynamic freight financial ledgers.

---

## 🏗️ Architecture Blueprint

```
                      NexusLogistics Core System
                                  │
      ┌───────────────────────────┼───────────────────────────┐
      │                           │                           │
ORDER & FULFILLMENT         MULTI-WAREHOUSE             FLEET & DISPATCH
      │                           │                           │
- Sales Order Lifecycle     - Multi-facility Zones      - Fleet & Telematics
- Inventory Reservation     - Rack/Shelf/Bin Tracking   - Dynamic Route Planning
- Picking & Packing Waves   - Stock Opname Audits       - Real-time GPS Tracking
- Return & Reverse Logistics- Inter-facility Transfers  - Proof of Delivery (PoD)
      │                           │                           │
      └───────────────────────────┼───────────────────────────┘
                                  │
                      FINANCE & TARIFF ENGINE
                                  │
                    - Dimensional Weight Tariffs
                    - Automated Invoicing & Ledger
                    - Real-time Analytics & KPIs
```

## 🛠️ Technology Stack

- **Backend (Rust)**:
  - Framework: [Axum](https://github.com/tokio-rs/axum) with Tokio multi-threaded asynchronous runtime.
  - Concurrency: Atomic state machines, concurrent reservation pools with lock-free reading and write isolation.
  - Domain Modeling: Strict DDD (Domain-Driven Design), Event Sourcing principles, Invariant guards.
  - Telemetry: Tracing subscriber, structured logging, latency profiling.
- **Frontend (Astro & Ethereal UI)**:
  - Framework: [Astro 5](https://astro.build) with React islands (`@astrojs/react`).
  - Design System: **Ethereal UI** (`@etherealui/react`) dark-first telemetry components.
  - Styling: Pure **Tailwind CSS v4** `@theme inline` design tokens.
  - Theming Engine: 870+ OKLCH Community Theme support, zero-runtime React Context overhead, 100% WCAG AA contrast safeguards (`text-primary-foreground` on `bg-primary`).
- **Quality Assurance & CI/CD**:
  - Git Hooks: [Husky](https://typicode.github.io/husky/) + `lint-staged`.
  - Backend Tests: Unit tests for domain state machine invariants, concurrency tests for stock reservation, API integration tests.
  - Frontend Tests: Vitest component and logic tests.

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js >= 20 & pnpm >= 9
- Rust toolchain (`cargo`, `rustc` >= 1.80)

### 2. Installation
```bash
# Install root workspace dependencies
pnpm install

# Install frontend dependencies
cd frontend && pnpm install && cd ..
```

### 3. Running Services
```bash
# Run both Backend & Frontend concurrently
pnpm dev

# Or run separately:
pnpm dev:backend   # Rust backend on http://127.0.0.1:8080
pnpm dev:frontend  # Astro frontend on http://localhost:4321
```

### 4. Running Verification Tests
```bash
# Run all tests (Rust domain invariants + Frontend components)
pnpm test
```
