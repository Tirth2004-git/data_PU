# Campus Compass — Institutional Academic Intelligence & Admin Portal

> A modern, high-performance, admin-only web application (MERN Stack) built on top of live MongoDB student records. Featuring instant tiered autocomplete, rich analytics dashboards, dynamic filtering, configurable placement eligibility checks, and complete A-to-Z student academic records.

---

## 🌟 Key Features

1. **Global Instant Autocomplete Search (`Ctrl + K` / `Cmd + K`)**
   - **Predictable, zero-fuzzy matching**: Prefix & containment tiered search for enrollment numbers, student names, and phone numbers.
   - **Tiered priority execution**:
     - *Digits*: Exact Roll No → Roll No prefix → Phone prefix → Roll No containment.
     - *Names*: Name prefix → Name token prefix (multi-word support) → Name containment.
   - **Keyboard navigation**: `↑` / `↓` navigation, `Enter` to open student record, `Esc` to close.
   - **Match highlighting**: Active typed query highlighted in real-time.
   - **Recent search history**: Stored locally for fast access.

2. **Executive Analytics Dashboard (`/`)**
   - **Real-time KPI metrics**: Total enrolled cohort, average CGPA, live backlogs count (%), and placement policy compliance (%).
   - **Interactive visual analytics (Recharts)**:
     - CGPA Distribution Histogram (0–5, 5–6, 6–7, 7–8, 8–9, 9–10)
     - Live Backlog Distribution (0, 1, 2, 3, 4+)
     - Departmental Academic Averages by Branch
     - Placement Policy Compliance Ratio Donut
   - **Drill-down navigation**: Clicking any chart bar/slice navigates directly to the students table with matching filters pre-applied.
   - **"Needs Academic Attention" leaderboard**: Top 10 students with the highest live backlogs for immediate remedial counseling.

3. **Filterable Students Directory & Table (`/students`)**
   - Dynamic filters by Branch, Division, Batch, Campus, Live Backlog status, Policy status, and CGPA range.
   - Instant search with active filter chips & one-click reset.
   - Column sorting (Roll No, Full Name, CGPA, Live Backlogs, etc.).
   - Full CSV export matching currently active filters.
   - Paginated display with configurable page sizes (15, 25, 50, 100).

4. **Comprehensive "A to Z" Student Record (`/students/:rollNo`)**
   - **Profile Header**: Initials avatar, copyable Roll Number, department metadata, status badges, Prev / Next student buttons, and print/PDF support.
   - **Live KPI Ring**: SVG circular CGPA ring (out of 10.0), latest SGPA with ▲/▼ delta indicator, live/closed backlog counts, 10th/12th grade marks.
   - **7 Dedicated Sections & Tabs**:
     1. **Overview**: Core institutional facts & auto-generated academic insights (CGPA trend, SGPA swings, backlog alerts, missing fields).
     2. **Personal & Contact**: DOB formatted as `DD MMM YYYY`, computed age, email (mailto + copy), phone (tel + WhatsApp wa.me links + copy).
     3. **Academics & Journey**: Education progression timeline (10th → 12th → Diploma → B.Tech) & comparative percentage bar chart.
     4. **Semester Analysis**: Term-by-term SGPA progression line chart, detailed audit table, best/worst semester indicators.
     5. **Backlogs Audit**: Live vs closed backlogs donut chart, raw text columns inspection.
     6. **Placement Eligibility**: Automated rule engine evaluating minimum CGPA (default 6.0), backlog ceiling (default 0), and signed policy agreement.
     7. **All Fields (Raw DB)**: Searchable key-value table showing every raw document attribute (including nested `B` object and unknown columns) with "Copy JSON".

5. **Security & Data Integrity**
   - Admin-only JWT authentication (8h expiry).
   - Strict rate limiting on login (5 attempts / 15 min / IP).
   - Input validation with Zod and regex escaping against injection.
   - CORS origin restriction & secure Helmet HTTP headers.
   - Print-friendly stylesheets (`window.print()` → Save as PDF).

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, React Router v6, Tailwind CSS, TanStack Query v5, Axios, Recharts, Lucide React icons.
- **Backend**: Node.js, Express, Mongoose, Native MongoDB Driver, JSONWebToken, BcryptJS, Helmet, CORS, Express-Rate-Limit, Zod, Dotenv.
- **Database**: MongoDB (Local instance: `mongodb://localhost:27017/student_campus`).

---

## 📂 Project Structure

```
├── client/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js             # Configured Axios with Bearer token & 401 handling
│   │   ├── components/
│   │   │   ├── common/              # Badge, CountUp, Skeleton, ProtectedRoute
│   │   │   ├── layout/              # Sidebar, Header, Layout
│   │   │   └── search/              # GlobalSearch with autocomplete dropdown
│   │   ├── context/
│   │   │   ├── AuthContext.jsx      # Admin auth state & persistence
│   │   │   └── ThemeContext.jsx     # Dark/Light theme mode state
│   │   ├── pages/
│   │   │   ├── Login.jsx            # Admin login screen
│   │   │   ├── Dashboard.jsx        # Analytics overview with charts
│   │   │   ├── StudentsList.jsx     # Paginated table with filters & CSV export
│   │   │   ├── StudentDetail.jsx    # Complete A-to-Z student view
│   │   │   └── NotFound.jsx         # 404 handler
│   │   ├── config.js                # App config & placement eligibility rules
│   │   ├── App.jsx                  # React application routes & QueryClient
│   │   ├── index.css                # Tailwind CSS & print styles
│   │   └── main.jsx                 # Vite application mount
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── server/
│   ├── config/                      # MongoDB connection helper
│   ├── controllers/                 # authController, studentController, analyticsController
│   ├── middleware/                  # JWT auth & login rate limiting
│   ├── models/                      # Admin & Student Mongoose schemas
│   ├── routes/                      # authRoutes, studentRoutes, analyticsRoutes
│   ├── scripts/
│   │   ├── discoverFields.js        # Discovers distinct fields from raw data
│   │   ├── normalize.js             # Cleans raw data -> 'students' collection + indexes
│   │   ├── createAdmin.js           # CLI script to initialize/reset admin credentials
│   │   └── testBackend.js           # 8-step backend test suite
│   ├── .env                         # Environment variables (git-ignored)
│   ├── .env.example
│   ├── package.json
│   └── server.js                    # Express application entry point
├── .gitignore
└── README.md
```

---

## 🚀 Setup & Execution Guide

### 1. Prerequisites
- **Node.js** v18+ and **npm**
- **MongoDB** running locally on port 27017: `mongodb://localhost:27017`
- Raw student collection imported in `student_campus.data` (~4,595 documents).

### 2. Environment Configuration
Copy the provided `.env.example` to create your local `.env`:
```bash
cp server/.env.example server/.env
```
Ensure your configuration in `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/student_campus
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=8h
CLIENT_URL=http://localhost:5173
```
*(Note: Never commit `server/.env` to source control. It is git-ignored by default).*

### 3. Step-by-Step Execution Order

#### Step 1: Run Field Discovery (Optional)
Inspect raw attributes and nested structures from `data`:
```bash
node server/scripts/discoverFields.js
```

#### Step 2: Normalize and Index Student Data (v2)
Read `data` collection, clean fields (UTC midnight dates, semesters with numeric backlog counts, diploma null handling, policy booleans/nulls, derived helpers `semesterBacklogSum`, `avgSgpa`, `latestSgpa`, and removal of stale stored age), and upsert into the indexed `students` collection:
```bash
node server/scripts/normalize.js
```

#### Step 3: Run Data Verification Script
Verifies sample student (`2303031460001`), checks backlog sum consistency across all 4,589 students, audits missing fields, and details the 6 duplicate source rows merged during normalization:
```bash
node server/scripts/verifyData.js
```

#### Step 4: Run Global Search Acceptance Tests
Validates all 9 search acceptance test cases (roll number prefix, exact roll number, name tokens, multi-word, phone prefix, empty results, and regex injection safety):
```bash
node server/scripts/testSearch.js
```

#### Step 5: Run Frontend Unit Tests (Vitest)
Executes unit tests for field coverage (`fieldMap.test.js`) and the deterministic insight engine (`insights.test.js`):
```bash
cd client
npm test
```

#### Step 6: Start Backend Server
```bash
cd server
npm run dev
```
The backend server runs on `http://localhost:5000`.

#### Step 7: Start Frontend Development Server
In a separate terminal:
```bash
cd client
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 📱 Testing on a Real Phone

To test Campus Compass on your mobile device (iPhone / Android) over your local Wi-Fi network:

1. **Start the frontend with `--host`**:
   ```bash
   cd client
   npm run dev -- --host
   ```
   *(Ensure Windows Firewall allows Node.js incoming connections on private networks).*

2. **Find your computer's local LAN IP**:
   - On Windows: Run `ipconfig` in PowerShell/CMD and look for your IPv4 Address (e.g. `192.168.1.15`).

3. **Allow LAN origin in backend `.env`**:
   In `server/.env`, ensure `CLIENT_ORIGIN` permits your LAN device or set:
   ```env
   CLIENT_ORIGIN=http://localhost:5173,http://<YOUR-PC-IP>:5173
   ```
   *(Never use `*` in production or institutional environments).*

4. **Open in your mobile browser**:
   Navigate to `http://<YOUR-PC-IP>:5173` on Safari (iOS) or Chrome (Android).
   - **Vite Proxy**: All API calls (`/api/*`) are proxied directly to the Express server on port 5000, so your phone only needs access to port `5173`.
   - **Clipboard & PWA**: When browsing over HTTP LAN, the app automatically uses the `document.execCommand('copy')` fallback with toast notification.
   - **Install as PWA**: On mobile Safari, tap the **Share** button → **Add to Home Screen**. On Chrome Android, tap the **⋮** menu → **Install app / Add to Home screen** for the full-screen native mobile experience.

---

## 🔒 Default Admin Credentials

- **Email**: `admin@campuscompass.edu`
- **Password**: `admin123`
*(A convenient one-click "Autofill demo credentials" button is also present on the login screen).*

## ☁️ Deploy to Render

This repository includes `render.yaml` for a single Render Web Service. The service builds the React client and serves it from Express, so the deployed app and `/api` use the same URL.

1. Create a MongoDB Atlas cluster and allow Render to connect (`0.0.0.0/0` in Atlas Network Access, or use a restricted Render egress setup). Copy the Atlas connection string.
2. Push this repository to GitHub and create a new Blueprint on Render from the repository. Render will detect `render.yaml`.
3. Set the Blueprint environment variable `MONGODB_URI` to the Atlas connection string. Keep the generated `JWT_SECRET` private. If the service name or URL changes, update `CLIENT_URL` to the exact `https://...onrender.com` URL.
4. After the first deploy, open the Render Shell and create the requested administrator:

   ```bash
   npm run seed:admin --prefix server -- --email superadmin@gmail.com --password admin@123 --name "Super Admin"
   ```

5. Import the local student CSV into the same MongoDB Atlas database from your computer. The CSV is intentionally excluded from GitHub because it contains student data. In PowerShell, run this from the project root with your Atlas connection string:

   ```bash
   $env:MONGODB_URI="mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/campus_compass?retryWrites=true&w=majority"
   npm run seed:import-csv --prefix server
   ```

   If the imported data needs normalization, run `npm run normalize --prefix server` with the same `MONGODB_URI` set.

6. Check `https://YOUR-SERVICE.onrender.com/api/health`, then open the same URL in a browser and sign in with the administrator created above.

Render's free service can sleep after inactivity, so the first request after a pause may take a short time. Use MongoDB Atlas rather than `MONGODB_URI=memory`; the in-memory database is erased whenever the service restarts.

---

## 📄 License
Internal Institutional Use Only — Parul University / Campus Compass.
