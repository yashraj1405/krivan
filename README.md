# Fertilizer QR Management System

A production-ready full-stack application for managing fertilizer products, batches, and QR code verification.

## Technology Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: FastAPI + SQLAlchemy + PostgreSQL + JWT Authentication

## Modules

1. **Admin Authentication**: Secure JWT-based admin sign-in.
2. **Product Management**: Create, edit, and view fertilizer products (NPK ratios, description, branding, etc.).
3. **Batch Management**: Create and track production batches, expiry dates, and lot numbers.
4. **QR Code Generation**: Create unique, tamper-proof verification QR codes linked to batches.
5. **Product Verification Page**: Publicly accessible verification portal for scanning/entering QR details.
6. **Dashboard**: High-level metrics showing active products, batch status, scan counters, and verification logs.
7. **Download QR Codes**: Export generated QR codes in bulk as zip/PDF.
8. **Settings**: Admin profile, scan limit configurations, and environment configurations.

## Project Structure

```
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── api/              # API router and endpoints
│   │   ├── core/             # Configuration, security, database setups
│   │   ├── crud/             # Database query logic (Repository pattern)
│   │   ├── models/           # SQLAlchemy DB models
│   │   ├── schemas/          # Pydantic validation schemas
│   │   └── services/         # Custom services (QR code generation, exports)
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/                 # React TypeScript Application
│   ├── src/
│   │   ├── components/       # Custom reusable UI components
│   │   ├── context/          # State and Auth contexts
│   │   ├── hooks/            # Custom hooks
│   │   ├── pages/            # View pages and route targets
│   │   ├── services/         # Axios-based HTTP request services
│   │   └── utils/            # Helper scripts and formatting
│   ├── Dockerfile
│   └── tailwind.config.js
│
└── docker-compose.yml        # Docker composition for easy database/service launching
```

## Running the Project

### Using Docker Compose
```bash
docker-compose up --build
```

### Local Dev Manual Setup

#### Backend:
1. Navigate to `/backend`
2. Install virtual environment: `python -m venv venv && source venv/bin/activate`
3. Install dependencies: `pip install -r requirements.txt`
4. Set up `.env` file (see `.env.example`)
5. Run server: `uvicorn app.main:app --reload`

#### Frontend:
1. Navigate to `/frontend`
2. Install dependencies: `npm install`
3. Set up `.env` file (see `.env.example`)
4. Start dev server: `npm run dev`
