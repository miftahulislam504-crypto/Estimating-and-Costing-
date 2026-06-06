# CivilOS Estimate

**BNBC-Centric Construction Estimating, Costing & BOQ Automation Platform**

## Sprint 1 — Foundation (Phase 1 + Phase 2)

### Tech Stack
- React 18 + Vite + TypeScript
- Tailwind CSS (dark theme)
- Zustand (state management)
- Recharts (charts)
- Firebase (backend)
- Vercel (deployment)

---

## File Structure

```
civilos-estimate/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── tailwind.config.ts
├── postcss.config.js
├── index.html
├── vercel.json
├── .env.example
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── firebase.ts
    ├── types/
    │   └── index.ts
    ├── store/
    │   ├── projectStore.ts
    │   └── takeoffStore.ts
    ├── components/
    │   ├── ui/
    │   │   └── index.tsx
    │   └── layout/
    │       └── Sidebar.tsx
    └── modules/
        ├── project/
        │   ├── ProjectHub.tsx
        │   ├── ProjectForm.tsx
        │   └── CostSettings.tsx
        └── takeoff/
            ├── TakeoffDashboard.tsx
            ├── QuantityEngine.ts
            ├── TakeoffTable.tsx
            ├── ElementForm.tsx
            └── TakeoffSummaryChart.tsx
```

---

## GitHub → Vercel Setup

### Step 1: GitHub-এ repository তৈরি করুন
1. github.com → "New repository"
2. Name: `civilos-estimate`
3. Private → Create

### Step 2: প্রতিটি ফাইল GitHub-এ paste করুন
সঠিক path-এ ফাইল তৈরি করুন।

### Step 3: Vercel-এ deploy করুন
1. vercel.com → "New Project"
2. GitHub repo import করুন
3. Framework: **Vite**
4. Build Command: `npm run build`
5. Output Directory: `dist`

### Step 4: Environment Variables যোগ করুন
Vercel Dashboard → Settings → Environment Variables:
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

---

## Sprint Roadmap

| Sprint | Phase | Module |
|--------|-------|--------|
| ✅ Sprint 1 | 1+2 | Project Foundation + Quantity Takeoff |
| Sprint 2 | 3+4 | BOQ Engine + Rate Analysis |
| Sprint 3 | 5+6 | Cost Database + Estimation |
| Sprint 4 | 7+8 | Budget + Procurement |
| Sprint 5 | 9+10 | Cash Flow + Tender |
| Sprint 6 | 11+12 | Variation + Value Engineering |
| Sprint 7 | 13+14 | Analytics + Reports |
| Sprint 8 | 15 | PM Bridge |
