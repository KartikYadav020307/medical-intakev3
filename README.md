<p align="center">
  <img src="public/locus-logo.png" alt="LOCUS Logo" width="96" />
</p>

<h1 align="center">LOCUS</h1>

<p align="center">
  <strong>Citation-First Medical Document Intelligence</strong><br/>
  Upload medical PDFs → extract structured clinical facts → verify every claim against the original source
</p>

<p align="center">
  <img alt="Next.js 16" src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" />
  <img alt="React 19" src="https://img.shields.io/badge/React-19-61DAFB?logo=react" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript" />
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-Auth%20%2B%20DB%20%2B%20Storage-3FCF8E?logo=supabase" />
  <img alt="Gemini" src="https://img.shields.io/badge/Gemini-3--flash--preview-4285F4?logo=google" />
</p>

<p align="center">
  <strong><a href="https://drive.google.com/file/d/1DcEpTUA0IMhCuFKehLE-BHw70ZPRBk0N/view?usp=sharing">Watch the Demo Video</a></strong>
</p>

<p align="center">
  <img src="public/images/medical-intake-homepage.png" alt="LOCUS Dashboard" width="800" />
</p>

---

## Why LOCUS Exists

Patients and clinicians deal with scattered lab reports, prescriptions, discharge summaries, and imaging reports across multiple facilities. AI-generated summaries can help, but they're hard to trust when the source evidence is hidden.

LOCUS focuses on **evidence-first medical intake**: it extracts structured clinical facts from PDF documents, attaches per-item confidence levels and spatial source coordinates, and lets a reviewer open the original PDF page to verify each claim. It does not generate diagnoses — it extracts facts already written in your documents and links them back to their source location.

> **Prototype Notice:** LOCUS is a development prototype for organizing and reviewing medical documents. It is not a validated diagnostic tool, emergency service, or substitute for professional clinical judgment.

---

## Table of Contents

- [How It Works](#how-it-works)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Usage Walkthrough](#usage-walkthrough)
- [API Routes](#api-routes)
- [Validation & Testing](#validation--testing)
- [Troubleshooting](#troubleshooting)
- [Limitations](#limitations)
- [Contributing](#contributing)
- [Team & Acknowledgments](#team--acknowledgments)

---

## How It Works

```
Sign In → Onboarding (profile + role) → Upload PDF → Pre-check → Extract → Review → Timeline / Share / Export
```

1. **Authenticate** with email/password via Supabase Auth. Choose a Patient or Doctor role at sign-up.
2. **Complete onboarding** — patients provide name, date of birth, biological sex, blood type, and language. Doctors upload a credential document and provide specialty information.
3. **Upload a PDF** medical record using the inline PDF drop zone. The client computes a SHA-256 hash and checks for an exact-file duplicate in your existing records before uploading to Supabase Storage.
4. **AI pre-check** — Gemini classifies whether the document is medical, legible, in English, and belongs to the expected patient. If pre-check fails, the upload is rejected with a specific reason code. If the pre-check itself errors, extraction proceeds anyway.
5. **Structured extraction** — Gemini extracts clinical facts into 24 typed categories with confidence labels (High/Medium/Low) and bounding-box coordinates normalized to a 1000×1000 grid.
6. **Source-linked review** — click any extracted fact to open the original PDF page with the relevant region highlighted. A verification queue surfaces unverified and low-confidence items for human review.
7. **Timeline, share, and export** — a de-duplicated master timeline consolidates diagnoses, medications, and lab results across all uploaded documents into an extracted history. Generate time-limited sharing links or download a formatted PDF dossier.

---

## Features

| Feature | Status | Notes |
|---------|--------|-------|
| PDF upload with SHA-256 duplicate detection | Implemented | Client-side hash; exact-file match only, not semantic dedup |
| AI document pre-check (medical, legibility, language, patient match) | Implemented | English documents only; soft gate — errors fall through to extraction |
| Structured extraction (24 cited clinical categories + encounter date) | Implemented | Gemini `gemini-3-flash-preview`; preview model availability may change |
| Bounding-box source citations | Implemented | Model-generated coordinates; not guaranteed pixel-perfect alignment |
| Confidence labels (High/Medium/Low) | Implemented | Model self-assessment, not calibrated accuracy probabilities |
| In-app PDF viewer with citation highlights | Implemented | Uses `react-pdf` with local PDF.js worker; includes page navigation |
| Human verification queue (approve/reject) | Implemented | Requires Supabase RPCs `approve_extracted_item` / `reject_extracted_item` (not included in repo) |
| De-duplicated master timeline | Implemented | Diagnoses, medications, and lab results; dedup keys by type + normalized title |
| PDF dossier export | Implemented | Consolidates diagnoses, medications, lab results into a downloadable PDF |
| Time-limited sharing links (24h / 3d / 7d) | Implemented | Requires `shared_links` table; server checks expiry but does not revoke underlying PDF URLs |
| Patient / Doctor role routing | Implemented | Client-side guards + Supabase user metadata; no admin verification of doctor credentials |
| Drug-allergy safety check | Partially integrated | Server generates alerts, but they are returned as a sibling of `data` and not saved to the record. UI reads from `extracted_data.safetyAlerts` which is not populated by the current save flow. |
| Google Cloud Document AI OCR | Available as API route | `POST /api/extract/ocr` exists but is not called by any current frontend workflow |
| Configurable gatekeeper preferences | Implemented | Strict identity match and allergy sensitivity configurable per user |
| Global search across extracted records | Implemented | Searches nine categories; note that search results do not currently support page-aware citation navigation. |
| Interactive onboarding tour | Implemented | Uses `react-joyride` with mock data |

---

## Architecture

```mermaid
flowchart TD
    A[Patient / Doctor] -->|Email + Password| B[Supabase Auth]
    B --> C{Onboarding<br/>Complete?}
    C -->|No| D[Onboarding Form]
    C -->|Yes| E[Dashboard]

    E -->|Upload PDF| F[Client: SHA-256 Hash]
    F -->|Check existing| G[(Supabase DB:<br/>medical_records)]
    F -->|Duplicate?| H[Reject Upload]
    F -->|Unique| I[Supabase Storage:<br/>records bucket]
    I -->|Public URL| J[POST /api/extract/gemini]

    J -->|Step 1| K[Gemini Pre-check:<br/>medical? legible? English?<br/>correct patient?]
    K -->|Rejected| L[Validation Error<br/>with Reason Code]
    K -->|Passed / Error| M[Gemini Extraction:<br/>structured JSON +<br/>bounding boxes]
    M --> N[Optional: Drug-Allergy<br/>Safety Check]
    N --> O[API Response:<br/>data + safetyAlerts]

    O -->|Save response.data| G
    G -->|Read| P[Extracted Data Cards]
    G -->|Read| Q[Master Timeline]
    G -->|Read| R[Verification Queue]

    P -->|Click fact| S[Citation Modal:<br/>PDF Viewer +<br/>Bounding Box Highlight]

    Q --> T[PDF Dossier Export]
    E --> U[Share Link Modal]
    U --> V[(shared_links table)]
    V --> W[/shared/id — read-only<br/>time-limited view]

    style J fill:#4285F4,color:#fff
    style K fill:#FBBC04,color:#000
    style M fill:#34A853,color:#fff
```

**Optional OCR path** (not used by the main workflow):

`POST /api/extract/ocr` accepts a PDF URL, sends it to Google Cloud Document AI, and returns raw text plus page-level layout blocks with bounding boxes. This route exists independently and can be called directly but is not wired into the patient upload flow.

---

## Tech Stack

| Technology | Role | Version (lockfile) |
|---|---|---|
| [Next.js](https://nextjs.org/) | App Router, API routes, SSR | 16.x |
| [React](https://react.dev/) | UI framework | 19.x |
| [TypeScript](https://www.typescriptlang.org/) | Type safety | 5.9.x |
| [Tailwind CSS](https://tailwindcss.com/) | Styling | 4.x |
| [Supabase](https://supabase.com/) | Auth, PostgreSQL database, object storage | Client SDK 2.x |
| [@google/genai](https://www.npmjs.com/package/@google/genai) | Gemini API for pre-check and extraction | 2.x |
| [@google-cloud/documentai](https://www.npmjs.com/package/@google-cloud/documentai) | Optional OCR / layout analysis | 9.x |
| [Radix UI](https://www.radix-ui.com/) + [shadcn/ui](https://ui.shadcn.com/) | Accessible component primitives | — |
| [Motion](https://motion.dev/) (Framer Motion) | Animations and transitions | 12.x |
| [tw-animate-css](https://www.npmjs.com/package/tw-animate-css) | CSS animation utility | 1.4.x |
| [react-pdf](https://www.npmjs.com/package/react-pdf) | In-browser PDF rendering | 10.x |
| [jsPDF](https://www.npmjs.com/package/jspdf) + [jspdf-autotable](https://www.npmjs.com/package/jspdf-autotable) | PDF dossier generation | 4.x / 5.x |
| [Lucide React](https://lucide.dev/) | Icon library | — |

---

## Repository Structure

```
medical-intakev3/
├── public/
│   ├── locus-logo.png            # Product logo
│   ├── pdf.worker.min.mjs        # PDF.js web worker (local copy)
│   └── sample.pdf                # Sample document
├── lib/
│   └── supabase.ts               # Shared Supabase client (anon key)
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing / auth page
│   │   ├── onboarding/           # Patient + Doctor onboarding forms
│   │   ├── patient/
│   │   │   ├── page.tsx          # Patient dashboard (orchestration)
│   │   │   └── components/       # Upload, cards, timeline, PDF viewer,
│   │   │                         # citation modal, verification, sharing,
│   │   │                         # gatekeeper settings, profile, sidebar
│   │   ├── doctor/
│   │   │   ├── page.tsx          # Clinician patient list
│   │   │   └── patient/[id]/     # Per-patient detail view
│   │   ├── shared/[id]/          # Time-limited public summary view
│   │   └── api/
│   │       ├── extract/gemini/   # Pre-check + structured extraction
│   │       ├── extract/ocr/      # Optional Document AI OCR route
│   │       ├── proxy-pdf/        # CORS proxy for PDF viewing
│   │       └── records/delete/   # Authenticated record deletion
│   ├── components/
│   │   ├── AuthGuard.tsx         # Client-side auth gate
│   │   └── ui/                   # shadcn/ui primitives
│   ├── lib/                      # Additional utilities
│   └── utils/
│       ├── generateDossier.ts    # PDF export (jsPDF)
│       └── supabase/client.ts    # Re-export of shared client
├── package.json
├── package-lock.json
├── tsconfig.json
├── next.config.ts
├── eslint.config.mjs
├── postcss.config.mjs
└── components.json               # shadcn/ui configuration
```

> **Legacy names:** The `package.json` name is `medical-intake-web` and the PDF export footer reads "ClinicalAudit". These reflect earlier project names. The current product name is **LOCUS**, as shown in the landing page, logo, and UI branding.

---

## Getting Started

### Prerequisites

- **Node.js**: The dependency tree requires `^20.19.0 || ^22.13.0 || >=24`.
- **npm** (ships with Node.js)
- A **Supabase** project with Auth, Database, and Storage configured
- A **Google AI Studio** API key with access to the Gemini API
- *(Optional)* A Google Cloud project with a Document AI processor for the OCR route

### Installation

```bash
git clone https://github.com/KartikYadav020307/medical-intakev3.git
cd medical-intakev3
npm ci
```

### Environment Setup

Create a `.env.local` file in the project root. The `.gitignore` excludes `.env*` files to prevent credential leaks.

```ini
# === Required: Supabase ===
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...

# === Required: Gemini ===
GEMINI_API_KEY=AIzaSy...

# === Optional: Google Cloud Document AI (OCR route only) ===
DOCUMENT_AI_PROJECT_ID=your-gcp-project-id
DOCUMENT_AI_LOCATION=us                         # e.g., us, eu
DOCUMENT_AI_PROCESSOR_ID=abc123def456
# The OCR route also requires Google Application Default Credentials (ADC).
# Run: gcloud auth application-default login
# Or set GOOGLE_APPLICATION_CREDENTIALS to a service account key file.
```

| Variable | Visibility | Required | Purpose |
|----------|-----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | Yes | Supabase anonymous/public key |
| `GEMINI_API_KEY` | Server only | Yes | Google Gemini API authentication |
| `DOCUMENT_AI_PROJECT_ID` | Server only | No | GCP project for Document AI |
| `DOCUMENT_AI_LOCATION` | Server only | No | Document AI processor region |
| `DOCUMENT_AI_PROCESSOR_ID` | Server only | No | Document AI processor identifier |

> **Important:** Never place service-role or admin credentials in `NEXT_PUBLIC_` variables — those are exposed to the browser.

### Supabase Setup

The application requires the following Supabase resources. **Schema definitions, RPC SQL, and Row Level Security policies are not included in this repository.** You must create them manually in your Supabase dashboard or via migrations.

<details>
<summary><strong>Database tables and RPCs</strong></summary>

**`medical_records` table** — stores extracted data per upload:

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | Auto-generated |
| `user_id` | uuid | References `auth.users`; used for RLS scoping |
| `pdf_url` | text | Public URL of the uploaded PDF |
| `extracted_data` | jsonb | Full extraction result from Gemini |
| `file_hash` | text | SHA-256 hash for duplicate detection |
| `clinic_id` | text (nullable) | Optional; used by doctor dashboard filtering |
| `created_at` | timestamptz | Auto-generated |

**`shared_links` table** — stores time-limited sharing tokens:

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | Auto-generated; used as the share URL token |
| `user_id` | uuid | Owner who generated the link |
| `expires_at` | timestamptz | Link expiration time |
| `created_at` | timestamptz | Auto-generated |

**Required RPCs** (called by the verification queue):

- `approve_extracted_item(p_record_id uuid, p_category text, p_item_index int, p_user_id uuid)` — sets `verified_by` on a specific item within the `extracted_data` JSONB.
- `reject_extracted_item(p_record_id uuid, p_category text, p_item_index int, p_user_id uuid)` — removes a specific item from a category array within the `extracted_data` JSONB.

**Storage bucket:** A bucket named `records` must exist. The current implementation uses `getPublicUrl()` to generate document URLs, which requires the bucket to allow public reads. Making the bucket private would require code changes to use signed URLs.

</details>

> **Reproducibility limitation:** Without the table definitions, RPC SQL, and RLS policies, features that depend on the database (saving records, verification, sharing, deletion) will fail. The Gemini extraction API itself works independently of the database.

### Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The landing page opens an authentication dialog with Patient/Doctor role selection.

**Production build:**

```bash
npm run build
npm start
```

---

## Configuration

### Gatekeeper Preferences

Users can configure extraction behavior from their profile settings:

- **Strict Identity Match** — when enabled, the pre-check rejects documents where the patient name doesn't match the logged-in user's profile exactly.
- **Allergy Sensitivity** — controls whether the drug-allergy safety check flags all potential interactions or only critical ones.

These preferences are stored in the user's Supabase `user_metadata` and passed to the extraction API with each upload.

---

## Usage Walkthrough

1. **Sign up** with an email and password. Choose Patient or Doctor role.
2. **Complete onboarding** — fill in your profile information. Doctors upload a credential document.
3. **Upload a PDF** — drag and drop into the inline PDF drop zone in the patient dashboard. Only `.pdf` files are accepted (max 20 MB).
4. **Review extraction results** — structured facts appear in categorized cards (diagnoses, medications, lab results, allergies, procedures, vitals, physicians, ICD/CPT codes, family/social history, imaging/pathology findings, symptoms, chronic diseases, vaccinations, facilities, insurance, emergency contacts, follow-ups, pregnancy status, discharge details, referrals).
5. **Click any fact** to open the Citation Modal — the original PDF page loads with the relevant region highlighted.
6. **Verify facts** — the Review tab shows unverified and low-confidence items. Approve to mark as reviewed, or reject to remove.
7. **View the timeline** — the Overview tab consolidates all diagnoses, medications, and lab results into a chronological, de-duplicated extracted history.
8. **Export** — download a formatted PDF dossier of your medical timeline.
9. **Share** — generate a time-limited link (24h, 3 days, or 7 days) for read-only access to your medical summary.
10. **Delete** — remove individual records (deletes both the storage object and database row, scoped to your user).

---

## API Routes

| Route | Method | Auth | Required Inputs | Purpose |
|-------|--------|------|-----------------|---------|
| `/api/extract/gemini` | POST | None (server-side API key) | `pdfUrl` (body) | Pre-check + structured extraction |
| `/api/extract/ocr` | POST | None (requires ADC on server) | `pdfUrl` (body) | Document AI OCR/layout extraction (standalone) |
| `/api/proxy-pdf` | GET | None | `url` (query) | CORS proxy to fetch PDFs for in-browser viewing |
| `/api/records/delete` | POST | Bearer token (Authorization header) | `recordId`, `pdfUrl` (body) | Delete a record and its storage object |

<details>
<summary><strong>Extraction response shape (illustrative, synthetic data)</strong></summary>

```jsonc
{
  "success": true,
  "data": {
    "encounter_date": "2024-03-15",
    "documentDates": [],
    "diagnoses": [
      {
        "name": "Type 2 Diabetes Mellitus",
        "date": "2024-03-15",
        "confidence": "High",
        "boundingBox": [142, 85, 168, 490],
        "sourcePage": 1
        // [ymin, xmin, ymax, xmax] normalized to 0–1000
      }
    ],
    "medications": [
      {
        "name": "Metformin",
        "date": "2024-03-15",
        "dosage": "500mg tablet",
        "frequency": "twice daily",
        "duration": "",
        "adherenceClues": "",
        "confidence": "High",
        "boundingBox": [210, 85, 235, 380],
        "sourcePage": 1
      }
    ],
    "labResults": [
      {
        "testName": "HbA1c",
        "date": "2024-03-15",
        "value": "7.2",
        "unit": "%",
        "referenceRange": "< 5.7%",
        "isAbnormal": true,
        "confidence": "High",
        "boundingBox": [310, 90, 330, 450],
        "sourcePage": 2
      }
    ],
    "allergies": [],
    "procedures": [],
    "vitals": [],
    "physicians": [],
    "icdCodes": [],
    "cptCodes": [],
    "familyHistory": [],
    "socialHistory": [],
    "imagingFindings": [],
    "pathologyFindings": [],
    "symptoms": [],
    "chronicDiseaseIndicators": [],
    "vaccinations": [],
    "facilities": [],
    "insuranceDetails": [],
    "emergencyContacts": [],
    "followUpRecommendations": [],
    "pregnancyStatus": [],
    "dischargeDetails": [],
    "referralRecommendations": []
  },
  "safetyAlerts": {
    "conflictFound": false,
    "severity": "None",
    "description": ""
  }
}
```

> This is an illustrative response shape with synthetic data. Field names, nesting, and coordinate ordering (`[ymin, xmin, ymax, xmax]`) match the actual implementation. Confidence labels are the model's self-assessment, not calibrated accuracy probabilities.

</details>

---

## Validation & Testing

### Available commands

```bash
npm run lint          # ESLint
npx tsc --noEmit      # TypeScript type check
npm run build         # Full production build (catches build-time errors)
```

There is no `npm test` script or automated test suite in the current repository.

### Manual verification checklist

These checks require a running Supabase project and valid API keys.

| Check | Service dependency |
|-------|-------------------|
| Sign up → email confirmation → login | Supabase Auth |
| Complete patient onboarding | Supabase Auth (metadata update) |
| Upload a valid medical PDF → extraction succeeds | Supabase Storage + Gemini API |
| Upload a non-medical file → rejection with reason code | Gemini API |
| Upload a file exceeding 20 MB → client-side rejection | None (client-only) |
| Upload the same file twice → duplicate rejection | Supabase DB |
| Click an extracted fact → PDF opens with highlighted region | None (client-only) |
| Approve/reject a fact in verification view | Supabase RPCs |
| Export timeline as PDF dossier | None (client-only) |
| Generate a share link → access it → verify expiry | Supabase DB |
| Delete a record → verify removal from storage and DB | Supabase Storage + DB |

---

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| "Supabase is not configured" or blank page | Missing `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Add both to `.env.local` and restart the dev server |
| Database operations fail (save, delete, share) | Missing `medical_records` or `shared_links` tables, or RLS policies blocking access | Create the required tables and policies in Supabase Dashboard |
| Verification approve/reject fails | Missing `approve_extracted_item` / `reject_extracted_item` RPCs | Create the RPCs in Supabase SQL Editor (definitions not included in repo) |
| "Extraction service is not configured" | Missing `GEMINI_API_KEY` | Add the key to `.env.local` |
| 429 / rate limit error during extraction | Gemini API quota exceeded | Wait and retry; check your API quota in Google AI Studio |
| "Only English medical documents are supported" | Non-English document detected by pre-check | Upload an English-language document |
| "This does not appear to be a medical document" | Pre-check classified the file as non-medical | Ensure the PDF is a medical record, lab report, or clinical note |
| PDF viewer shows blank or fails to load | PDF proxy error, CORS issue, or PDF.js worker misconfiguration | Check browser console; verify `public/pdf.worker.min.mjs` exists |
| OCR route returns 500 | Missing Document AI environment variables or ADC credentials | Configure all three `DOCUMENT_AI_*` vars and set up Application Default Credentials |
| Email confirmation not arriving | Supabase email provider configuration | Check Supabase Auth settings; in development, you may need to disable email confirmation |

---

## Limitations

- **Prototype Status & Safety**: LOCUS is not a clinically validated device. Extraction relies on a preview AI model (`gemini-3-flash-preview`), and generated citations (bounding boxes) are model estimates, not pixel-perfect guarantees. It currently only supports English documents. Safety alerts (drug/allergy conflicts) are generated but not saved to the database in the current flow.
- **Incomplete Repository**: Supabase schema definitions, RLS policies, and verification RPCs are missing. Automated tests are absent.
- **Privacy & Security**: PDFs are stored with public URLs in Supabase. Authenticated deletion removes the row and object, but not necessarily external backups/logs. Shared links do not revoke the underlying PDF URL, and there is no admin verification for clinician credentials.
- **Timeline Constraints**: The deduplicated timeline only consolidates diagnoses, medications, and lab results, keeping only the newest item for repeated events (it is not a lossless longitudinal record).

### Data Processing Disclosure

The application uses external cloud services for AI extraction (hashing and PDF rendering occur locally). The current routes send data as follows:
- **Supabase**: receives PDFs for storage, plus profile context for database operations and authentication.
- **Google Gemini API**: receives public PDF URLs and profile context for document pre-check and structured extraction.
- **Google Cloud Document AI** (optional): receives the PDF when its specific endpoint is used; it does not receive profile context.

The application does not provide end-to-end encryption.

---

## Contributing

Contributions are welcome. This is a prototype, so there is significant room for improvement.

```bash
# Fork and clone
git clone https://github.com/<your-username>/medical-intakev3.git
cd medical-intakev3
npm ci

# Make changes, then validate
npm run lint
npx tsc --noEmit
npm run build

# Open a pull request against main
```

**Priority areas:** automated tests, database migration scripts, RPC definitions, signed URL support for private storage, safety alert save-flow fix, and expanded timeline categories.

---

## Team & Acknowledgments

**Team Kraken**

| Name | GitHub |
|------|--------|
| Kartik Yadav | [@KartikYadav020307](https://github.com/KartikYadav020307) |
| Sagar Negi | [@SagarNegi1](https://github.com/SagarNegi1) |

Teammate's repository: [SagarNegi1/Locus](https://github.com/SagarNegi1/Locus)

**Project context:** LOCUS was developed for the Samsung PRISM Gen AI Hackathon 2026 (Theme 4: Streaming Live RAG). The application applies the theme's ideas to medical-record review through citation-first document intake, not through a runtime knowledge graph or streaming RAG pipeline.

**Development tools:** Built with assistance from [Google Antigravity](https://antigravity.google/), an AI-powered development environment. Codebase analysis during development used [Graphify](https://github.com/Graphify-Labs/graphify?utm_source=chatgpt.com), a code/context knowledge-graph tool. Neither tool is a runtime dependency.

---

## License

No license file is included in this repository. Public visibility on GitHub does not constitute an open-source license. Contact the repository owner for usage terms.
