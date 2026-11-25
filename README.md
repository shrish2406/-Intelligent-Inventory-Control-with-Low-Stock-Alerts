# Smart Inventory & Stock Alert System

A full-stack **Smart Inventory & Stock Alert System** built using
**React (Vite), Tailwind CSS, Recharts, FastAPI, SQLAlchemy, PostgreSQL,
and WebSockets**. The system enables real-time inventory tracking,
multi-warehouse stock management, automated stock alerts, and
transaction-safe inventory operations.

------------------------------------------------------------------------

## Key Features

-   **Real-Time Analytics Dashboard:** Displays key performance
    indicators (KPIs), 14-day inbound/outbound stock movement trends,
    warehouse-wise inventory distribution, recent stock movements, and
    active alerts using live PostgreSQL data.
-   **Product & Warehouse Management:** Complete CRUD operations with
    product search, warehouse management, and unique SKU validation.
-   **Multi-Warehouse Inventory Tracking:** Searchable and filterable
    inventory table with automatic `IN_STOCK`, `LOW_STOCK`, and
    `OUT_OF_STOCK` status classification.
-   **Transaction-Safe Stock Movements:** Supports `IN` and `OUT`
    transactions using PostgreSQL `SELECT ... FOR UPDATE` row-level
    locking to prevent negative inventory during concurrent requests.
-   **Automated Alerting Service (`alert_service/`):** Independent
    Python module that detects `LOW_STOCK`, `OUT_OF_STOCK`, and
    `FAST_DEPLETION` conditions, prevents duplicate active alerts, and
    automatically resolves alerts when stock is replenished.
-   **Real-Time WebSocket Updates (`/ws`):** Automatically synchronizes
    dashboards, inventory tables, and toast notifications after
    successful database commits.
-   **Dark & Light Theme:** Modern frosted-glass UI with a Volcanic
    Ash-inspired design and persistent light/dark mode preferences.

------------------------------------------------------------------------

## Project Structure

``` text
Dot Konneckt Technical Assignment/
├── alert_service/              # Independent alert detection service
│   ├── rules.py                # Stateless stock alert rules
│   ├── alert_repository.py     # Alert persistence and deduplication
│   └── detector.py             # Alert evaluation and auto-resolution
│
├── Backend/                    # FastAPI backend
│   ├── app/
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── schemas/            # Pydantic validation schemas
│   │   ├── services/           # Business logic and transaction handling
│   │   ├── routes/             # REST API endpoints
│   │   ├── main.py             # FastAPI application entry point
│   │   └── websocket_manager.py # WebSocket connection management
│   │
│   ├── tests/
│   │   └── test_api.py         # Integration and concurrency tests
│   └── requirements.txt
│
├── Frontend/                   # React + Vite dashboard
│   └── src/
│       ├── components/         # Reusable UI components
│       ├── hooks/              # WebSocket and theme hooks
│       ├── pages/              # Dashboard and management pages
│       └── services/
│           └── api.js          # Axios API client
│
├── .env.example                # Environment variable template
└── README.md
```

------------------------------------------------------------------------

## Prerequisites

Ensure the following tools are installed:

-   **Python 3.11+**
-   **Node.js 20+** and npm
-   **PostgreSQL** (running locally on port `5432`)

Verify your installations:

``` bash
python --version
node --version
npm --version
```

------------------------------------------------------------------------

## Local Setup Guide

### Step 1: Create the PostgreSQL Database

Open **psql** or **pgAdmin** and execute:

``` sql
CREATE DATABASE smart_inventory;
```

### Step 2: Configure Environment Variables

Create a `.env` file in the project root by copying `.env.example`.

**Windows PowerShell:**

``` powershell
Copy-Item .env.example .env
```

**macOS / Linux:**

``` bash
cp .env.example .env
```

Update `DATABASE_URL` in your `.env` file with your PostgreSQL
credentials:

``` env
DATABASE_URL=postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/smart_inventory
```

### Environment Variables Reference

  ----------------------------------------------------------------------------------------------------------------------------
  Variable                           Description             Default
  ---------------------------------- ----------------------- -----------------------------------------------------------------
  `DATABASE_URL`                     PostgreSQL connection   `postgresql://postgres:postgres@localhost:5432/smart_inventory`
                                     string                  

  `BACKEND_HOST`                     FastAPI server bind     `0.0.0.0`
                                     address                 

  `BACKEND_PORT`                     FastAPI server port     `8000`

  `CORS_ORIGINS`                     Allowed frontend        `http://localhost:5173,http://127.0.0.1:5173`
                                     origins                 

  `FAST_DEPLETION_WINDOW_HOURS`      Fast-depletion lookback `24`
                                     window                  

  `FAST_DEPLETION_THRESHOLD_RATIO`   Fast-depletion          `0.5`
                                     threshold ratio         

  `VITE_API_BASE_URL`                Frontend REST API URL   `http://localhost:8000/api`

  `VITE_WS_URL`                      Frontend WebSocket URL  `ws://localhost:8000/ws`
  ----------------------------------------------------------------------------------------------------------------------------

### Step 3: Set Up & Run the Backend

Open terminal in the project root.

**Windows PowerShell:**

``` powershell
cd Backend
python -m venv .venv
.\\.venv\\Scripts\\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**macOS / Linux:**

``` bash
cd Backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Once the backend starts:

-   PostgreSQL tables (`products`, `warehouses`, `inventory`,
    `stock_movements`, and `alerts`) are automatically created during
    application startup.
-   Verify backend health at: `http://127.0.0.1:8000/health`
-   Expected response: `{"status":"ok","database":"connected"}`
-   Explore interactive Swagger API documentation at:
    `http://127.0.0.1:8000/docs`

### Step 4: Set Up & Run the Frontend

Open a **second terminal** in the project root:

``` bash
cd Frontend
npm install
npm run dev
```

Open the application in your browser:

**http://localhost:5173**

------------------------------------------------------------------------

## Running Tests

With the backend virtual environment activated, run the integration and
concurrency tests from the project root.

**Windows PowerShell:**

``` powershell
Backend\\.venv\\Scripts\\pytest.exe Backend\\tests\\test_api.py -v
```

**macOS / Linux:**

``` bash
Backend/.venv/bin/pytest Backend/tests/test_api.py -v
```

------------------------------------------------------------------------

## Architecture & Technical Highlights

``` mermaid
flowchart LR
    UI["React Dashboard<br/>Vite + Tailwind + Recharts"]
    API["FastAPI REST API<br/>/api/*"]
    WS["WebSocket Manager<br/>/ws"]
    SVC["Movement Service<br/>SELECT FOR UPDATE"]
    ALERT["Alert Service<br/>Rules + Detector + Repository"]
    DB[("PostgreSQL")]

    UI -->|"Axios HTTP"| API
    API --> SVC
    SVC -->|"Transactional Stock Updates"| DB
    API -->|"Post-Commit Evaluation"| ALERT
    ALERT -->|"Persist / Resolve Alerts"| DB
    API -->|"Broadcast After Commit"| WS
    WS -->|"Real-Time Events"| UI
```

### 1. Concurrency Control

Stock movements use PostgreSQL row-level locking through
`SELECT ... FOR UPDATE` within database transactions.

This ensures that concurrent outbound stock requests are processed
safely, preventing race conditions and negative inventory.

### 2. Automated Alert Detection

The alerting service evaluates inventory conditions using three
independent rules:

1.  **OUT_OF_STOCK:** Triggered when `quantity == 0`.
2.  **LOW_STOCK:** Triggered when `0 < quantity <= minimum_stock`.
3.  **FAST_DEPLETION:** Triggered when recent outbound stock volume
    within `FAST_DEPLETION_WINDOW_HOURS` is:
    -   Greater than or equal to 50% of `(quantity + recent_outbound)`.
    -   Greater than or equal to `max(minimum_stock, 5)`.

The service also prevents duplicate active alerts and automatically
resolves relevant alerts when inventory is replenished.

### 3. Real-Time Communication

WebSockets enable the frontend to receive updates without manually
refreshing the page.

Events include:

-   `inventory_updated`
-   `stock_movement_created`
-   `low_stock_alert`
-   `alert_resolved`

### 4. Scalability Considerations

The current implementation uses an in-memory `WebSocketManager`,
suitable for single-instance deployments.

For horizontal scaling across multiple backend instances, Redis Pub/Sub
can be introduced to distribute post-commit events across workers and
synchronize connected clients.

------------------------------------------------------------------------

## API Endpoints

  Module       Method   Endpoint
  ------------ -------- -----------------------------------------
  Health       GET      `/health`
  Products     GET      `/api/products`
  Products     POST     `/api/products`
  Products     GET      `/api/products/{id}`
  Products     PUT      `/api/products/{id}`
  Products     DELETE   `/api/products/{id}`
  Warehouses   GET      `/api/warehouses`
  Warehouses   POST     `/api/warehouses`
  Warehouses   PUT      `/api/warehouses/{id}`
  Warehouses   DELETE   `/api/warehouses/{id}`
  Inventory    GET      `/api/inventory`
  Inventory    GET      `/api/inventory/{id}`
  Movements    GET      `/api/movements`
  Movements    POST     `/api/movements`
  Alerts       GET      `/api/alerts`
  Alerts       PATCH    `/api/alerts/{id}/resolve`
  Dashboard    GET      `/api/dashboard/stats`
  Dashboard    GET      `/api/dashboard/movements`
  Dashboard    GET      `/api/dashboard/inventory-distribution`
  WebSocket    WS       `/ws`

------------------------------------------------------------------------

## Tech Stack

  Layer                     Technologies
  ------------------------- ---------------------------
  Frontend                  React, Vite, Tailwind CSS
  Data Visualization        Recharts
  Backend                   Python, FastAPI
  ORM                       SQLAlchemy
  Database                  PostgreSQL
  Real-Time Communication   WebSockets
  API Communication         Axios
  Testing                   Pytest

------------------------------------------------------------------------

**Built as part of the Dot Konneckt Technical Assignment.**
