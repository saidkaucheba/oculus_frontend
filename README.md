# Офтальмолог.Онлайн — Frontend

React + TypeScript frontend for the Oculus ophthalmology clinic management system.

## Tech stack
- **React 19** + **TypeScript**
- **React Router v7** for client-side routing
- **Vite 7** with built-in dev-server proxy (no CORS issues in development)
- No external UI library — custom styled components matching the design system

## Design system
- **Primary colour:** `#39568A`
- **Background:** `#EAE8EF`
- **Fonts:** Bitter (body/headings), Source Serif 4 (buttons)
- Status colours: Red `#a70b0b`, Yellow `#b8950a`, Green `#3ea515`, Blue `#1a6cd4`

## Getting started

### Prerequisites
- Node.js ≥ 18
- The Django backend running on `http://localhost:8000` (see `oculus_backend/`)

### Backend setup (quick reference)
```bash
cd oculus_backend
pip install -r requirements.txt
cp .env.example .env   # fill in SECRET_KEY, DB_NAME, DB_USER, DB_PASSWORD
python manage.py migrate
python manage.py runserver
```

> **Note:** `python-dotenv` is missing from `requirements.txt` — install it manually:
> `pip install python-dotenv`

### Frontend setup
```bash
# 1. Install dependencies
npm install

# 2. (Optional) configure environment
cp .env.example .env
# Leave VITE_API_URL= empty — the Vite dev proxy handles routing to localhost:8000

# 3. Start dev server
npm run dev
# → App runs at http://localhost:5173
```

The Vite dev server automatically proxies:
- `/api/*` → `http://localhost:8000/api/*`
- `/api-auth/*` → `http://localhost:8000/api-auth/*`
- `/csrf/*` → `http://localhost:8000/csrf/`
- `/media/*` → `http://localhost:8000/media/*`

This means **no CORS configuration is needed** during local development.

### Production build
```bash
npm run build        # outputs to dist/
npm run preview      # preview the build locally
```

For production, set `VITE_API_URL=https://your-api-domain.com` in your environment before building.

## Project structure
```
src/
├── api.client.ts        # HTTP client (all API endpoints, CSRF, auth)
├── api.hooks.ts         # React hooks wrapping api.client
├── api.types.ts         # TypeScript types for all API models
├── AuthContext.tsx       # Auth state + RequireAuth route guard
├── App.tsx              # Routes (role-based redirects)
├── main.tsx             # Entry point
├── index.css            # Minimal reset (global.css has the real styles)
├── styles/
│   └── global.css       # Design tokens + base styles
├── components/
│   ├── Header.tsx       # Fixed top nav with logo + logout
│   ├── PageLayout.tsx   # Header + footer wrapper
│   ├── IOLCalculator.tsx # IOL lens power calculator widget
│   └── PatientCard.tsx  # (legacy stub — not currently used in routing)
└── pages/
    ├── Login.tsx          # Auth screen (matches blue card design)
    ├── DoctorDashboard.tsx # Patient list with stat cards + tab filter
    ├── SurgeonDashboard.tsx # Ready-for-surgery list + feedback form
    ├── PatientCardPage.tsx # Full patient record (view/edit + files + IOL)
    └── PatientPage.tsx    # Patient self-view (read-only)
```

## Roles and routing
| Role             | Landing page           |
|------------------|------------------------|
| `district_doctor`| `/doctor`              |
| `admin`          | `/doctor`              |
| `surgeon`        | `/surgeon`             |
| `patient`        | `/patient/:id`         |

## Known issues in the backend (already fixed in codebase)
- `python-dotenv` missing from `requirements.txt` — add it
- `Django==6.0.2` in requirements — verify this version is available/intended
- Double SHA-256 hash computation per upload (minor inefficiency)
