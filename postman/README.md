# ELGS Enterprise — Developer Sandbox API & Postman Collection

Welcome to the **ELGS Developer Sandbox Environment**. This sandbox API layer allows developers, partner integrators, and QA engineers to test full-lifecycle logistics operations, telematics streams, and Segregation of Duties (SoD) maker-checker rules **without writing or mutating data in the production PostgreSQL database**.

---

## ⚡ Key Architectural Features

1. **Zero Database Mutation Guarantee**:
   All `/api/v1/sandbox/*` endpoints run in an isolated in-memory simulation container (`SandboxState`). Every response carries:
   - `X-ELGS-Environment: sandbox`
   - `X-Database-Write: skipped`
   - `X-Sandbox-Mode: active`

2. **Automated Volumetric & Freight Tariff Simulation**:
   Calculates dimension-based volumetric weight `(L x W x H / 5000)` and applies service tier multipliers (Cold-Chain Priority, Express, Same-Day).

3. **Live Telematics & IoT Probe Simulator**:
   Simulates live GPS vehicle coordinates, speed, battery level, and ultra-cold bio-vaccine sensor readings (-72.4°C).

4. **Maker-Checker SoD Rule Validation**:
   Validates compliance rules in memory: order creators cannot self-approve orders, and physical stock counters cannot self-reconcile variances.

---

## 🚀 Quickstart: Importing into Postman / Insomnia / Bruno

### 1. Import Collection & Environment
1. Open **Postman** (or Insomnia / Bruno).
2. Click **Import** (Top left).
3. Drag & drop both files:
   - `postman/ELGS_Enterprise_Sandbox.postman_collection.json`
   - `postman/ELGS_Sandbox.postman_environment.json`
4. Select the environment **"ELGS Sandbox — Localhost"** from the environment dropdown in the top-right corner.

### 2. Run the Workflow
Execute the requests in sequence:
1. **01. Authentication ➔ Generate Sandbox Developer Token**:
   - Generates a synthetic developer bearer token.
   - Automatically saves `{{sandbox_token}}` into your Postman environment.
2. **02. Environment & Status ➔ Get Sandbox Status**:
   - Confirms isolation health and active features.
3. **03. Sales Orders ➔ Create Sandbox Order**:
   - Simulates creating an order.
   - Automatically saves `{{sandbox_order_id}}` and `{{sandbox_tracking_number}}`.
4. **04. Live GPS Telematics ➔ Query Live Tracking**:
   - Uses `{{sandbox_tracking_number}}` to stream simulated GPS coordinates and cold-chain temperature.
5. **05. Warehouse Hubs ➔ Simulate Stock Opname**:
   - Simulates variance audit and SoD dual-control escalation.
6. **06. Billing ➔ Settle Invoice**:
   - Simulates payment gateway webhook callback.
7. **07. Administration ➔ Reset Sandbox**:
   - Resets the sandbox back to pristine baseline fixtures anytime.

---

## 📋 Available Sandbox Endpoints

| Method | Endpoint | Description | DB Mutation |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/v1/sandbox/status` | Engine status and feature flags | ❌ None |
| `POST` | `/api/v1/sandbox/auth/token` | Generate synthetic developer access token | ❌ None |
| `GET` | `/api/v1/sandbox/orders` | List simulated sandbox orders | ❌ None |
| `POST` | `/api/v1/sandbox/orders` | Create simulated order with freight calculations | ❌ None |
| `GET` | `/api/v1/sandbox/orders/:id` | Get simulated order by UUID | ❌ None |
| `POST` | `/api/v1/sandbox/orders/:id/transition` | Transition status with SoD maker-checker rules | ❌ None |
| `GET` | `/api/v1/sandbox/tracking/:tracking_number` | Live GPS & IoT probe telemetry stream | ❌ None |
| `GET` | `/api/v1/sandbox/warehouses` | List simulated hubs and inventory stock | ❌ None |
| `POST` | `/api/v1/sandbox/stock/opname` | Simulate stock count variance & escalation | ❌ None |
| `POST` | `/api/v1/sandbox/finance/settle` | Simulate payment gateway webhook settlement | ❌ None |
| `POST` | `/api/v1/sandbox/reset` | Reset simulation state to baseline fixtures | ❌ None |
