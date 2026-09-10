# SkillSetu (कौशल सेतु)
> *"Where Skills Meet Opportunity."*

**Smart India Hackathon (SIH)**  
**Problem Statement ID:** 26044  
**Title:** Portal for Academia - Industry collaboration for Skill Mapping, Internships and Placement  
**Organization:** Ministry of Ayush  
**Department:** All India Institute of Ayurveda (AIIA)  
**Category:** Software  
**Theme:** Smart Automation  

---

## 1. Project Vision

There is an acute gap between academic curriculum transcripts and live industry competencies. Students often do not know their quantifiable skill levels, which opportunities suit them, or the exact skill gaps causing rejections. Industries struggle to find candidates with verified operational competencies. Academic institutions lack real-time visibility into curriculum gaps and placement readiness.

**SkillSetu** bridges this divide by establishing a standardized, quantifiable, and explainable skill exchange layer connecting:
$$\text{Students} \longleftrightarrow \text{Industry} \longleftrightarrow \text{Academia / Institutions}$$

### Core Differentiators
1. **Skill Quantification:** Calibrating student skills through standardized aptitude benchmarks on a 0–100 scale ("Assessed Skill Scores").
2. **Explainable Skill Matching & Recommendation Engine:** Deterministic, transparent compatibility calculations showing exact per-skill scores, surpluses, and deficits (avoiding black-box opaque rejections).
3. **Interactive What-If Simulation:** Allowing students to simulate skill improvements and visualize instantaneous match score elevations.
4. **Institution Intelligence:** Equipping academic leadership with Student Skill Supply vs. Industry Demand matrices to guide curriculum updates and placement interventions.

---

## 2. Current Implementation Status

> **Current Phase:** `STEP 1 — PROJECT FOUNDATION`

The project foundation has been established with clean architectural separation between the React frontend, FastAPI backend, and MongoDB configuration layer:
- ✅ **Frontend Shell:** React 19 + TypeScript + Vite + Tailwind CSS with responsive layout and institutional branding.
- ✅ **Frontend Routing:** Route foundations for `/`, `/login`, `/student`, `/industry`, and `/institution`.
- ✅ **FastAPI Backend:** Modular Python FastAPI service with health telemetry, lifecycle events, and CORS handling.
- ✅ **MongoDB Configuration:** Dynamic environment-driven configuration with non-blocking fallback handling for development safety.
- ✅ **API Client Service:** Centralized HTTP service (`apiClient.ts`, `healthService.ts`) with error boundaries and live status monitoring.

*Note: Database collections, student assessments, matching algorithms, industry postings, and institutional dashboards are scheduled for subsequent steps.*

---

## 3. Technology Stack

| Layer | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite | Modern, responsive Single-Page Application (SPA) |
| **Styling** | Tailwind CSS v4, Lucide Icons | Accessible, institutional design system |
| **Routing** | React Router v7 | Client-side role routing |
| **Backend** | Python 3.10+, FastAPI, Pydantic v2 | High-performance asynchronous REST API |
| **Database** | MongoDB (PyMongo) | Flexible document store for profiles, skills & opportunities |
| **Process Manager** | Concurrently | Unified development orchestration |

---

## 4. Project Directory Structure

```
skillsetu/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── __init__.py
│   │   │   │   └── health.py          # /api/health diagnostic endpoint
│   │   │   ├── __init__.py
│   │   │   └── routes.py              # Central router aggregation
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py              # Environment and settings loader
│   │   │   └── database.py            # MongoDB connection & diagnostics
│   │   ├── models/                    # (Database models - Step 2)
│   │   ├── schemas/                   # (Pydantic validation schemas - Step 2)
│   │   ├── services/                  # (Business logic & matching engine)
│   │   ├── __init__.py
│   │   └── main.py                    # FastAPI application entry point
│   └── requirements.txt               # Python package dependencies
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   └── ErrorBoundary.tsx      # React error boundary
│   │   └── layout/
│   │       ├── AppLayout.tsx          # Main shell layout
│   │       ├── Navbar.tsx             # Header with live health badge
│   │       └── Footer.tsx             # Footer with SIH / Ayush context
│   ├── pages/
│   │   ├── HomePage.tsx               # Foundation overview & status card
│   │   ├── LoginPage.tsx              # Role access gateway
│   │   ├── StudentPlaceholderPage.tsx # Student portal placeholder
│   │   ├── IndustryPlaceholderPage.tsx# Industry portal placeholder
│   │   ├── InstitutionPlaceholderPage.tsx # Institution portal placeholder
│   │   └── NotFoundPage.tsx           # 404 handler
│   ├── services/
│   │   ├── apiClient.ts               # Reusable HTTP client
│   │   └── healthService.ts           # Health check API service
│   ├── types/
│   │   └── index.ts                   # Core TypeScript interfaces
│   ├── App.tsx                        # Router configuration
│   ├── index.css                      # Tailwind stylesheet
│   └── main.tsx                       # React DOM entry point
├── .env.example                       # Environment template
├── package.json                       # Node dependencies & npm scripts
├── tsconfig.json                      # TypeScript configuration
└── vite.config.ts                     # Vite build & proxy configuration
```

---

## 5. Local Setup & Execution Guide

### Prerequisites
- Node.js (v18+ or v20+) and npm
- Python 3.10+ and pip
- (Optional) MongoDB local server or MongoDB Atlas connection string

### Installation

1. **Install Frontend Dependencies:**
   ```bash
   npm install
   ```

2. **Install Backend Dependencies:**
   ```bash
   pip install -r backend/requirements.txt
   ```

3. **Configure Environment Variables:**
   Copy the `.env.example` template:
   ```bash
   cp .env.example .env
   ```
   Configure your MongoDB connection in `.env`:
   ```env
   MONGODB_URI=mongodb://localhost:27017
   DATABASE_NAME=skillsetu_db
   ```

---

## 6. How to Run the Application

### Option A: Run Both Services Simultaneously (Recommended)
```bash
npm run dev
```
This command uses `concurrently` to start:
- **FastAPI Backend:** on `http://127.0.0.1:8001`
- **Vite Frontend:** on `http://localhost:3000` (automatically proxying `/api` requests to port 8001)

### Option B: Run Services Separately

**Terminal 1 — Backend (FastAPI):**
```bash
# Using npm:
npm run dev:backend

# Or directly with uvicorn:
uvicorn backend.app.main:app --port 8001 --host 127.0.0.1 --reload
```
Interactive Swagger API documentation will be available at:  
`http://127.0.0.1:8001/docs`

**Terminal 2 — Frontend (Vite + React):**
```bash
npm run dev:frontend
```
Frontend application will be accessible at:  
`http://localhost:3000`

---

## 7. MongoDB Configuration & Resilience

The backend is built with a resilient MongoDB configuration layer in `backend/app/core/database.py`:
- Connection details are derived from `MONGODB_URI` and `DATABASE_NAME`.
- The backend attempts connectivity using a short timeout (`MONGODB_SERVER_TIMEOUT_MS=2000`).
- If MongoDB is unreachable locally, the application logs a clear diagnostic message and enters a safe standby mode without crashing.
- Live status can be inspected at any time via:
  `GET /api/health`

---

## 8. Upcoming Implementation Steps

- **STEP 2:** MongoDB Schemas, Models & Seeded Ayush/Tech Demo Data
- **STEP 3:** Student Profile & Assessed Skill Scores
- **STEP 4:** Skill Assessment Center & Real-time Scoring
- **STEP 5:** Explainable Skill Matching Engine
- **STEP 6:** What-If Simulation & Learning Recommendations
- **STEP 7:** Industry Opportunity Management & Weighting Matrix
- **STEP 8:** Ranked Candidate Discovery & Application Pipeline
- **STEP 9:** Institution Intelligence & Supply vs. Demand Analytics
- **STEP 10:** Integration, End-to-End Testing & Polish
- **STEP 11:** SIH Jury Demo Preparation
