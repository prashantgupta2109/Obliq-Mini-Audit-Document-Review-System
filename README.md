# Obliq — Mini Audit Document Review System

A CA firm audit workflow tool for managing clients, audit documents, and review cycles — with a complete, immutable audit history.

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Setup

```bash
# Install dependencies
npm install

# Generate Prisma client, create database, and seed demo data
npm run setup
```

### Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Demo Accounts

| Firm | Name | Email | Password | Role |
|---|---|---|---|---|
| ABC & Co. | Rohit Sharma | rohit@abc.co | password123 | Staff |
| ABC & Co. | Aman Verma | aman@abc.co | password123 | Reviewer |
| XYZ & Co. | Priya Mehta | priya@xyz.co | password123 | Staff |
| XYZ & Co. | Kiran Patel | kiran@xyz.co | password123 | Reviewer |

---

## Workflow

```
Reviewer creates client
   ↓
Anyone adds required documents (Bank Statement, GST Return, etc.)
   ↓
Staff uploads file → status: Uploaded
   ↓
Reviewer starts review → status: Under Review
   ↓
Reviewer approves → status: Approved ✅
  OR
Reviewer requests correction (with reason) → status: Correction Required
   ↓
Staff uploads revised document → status: Uploaded (loop)
```

---

## Architecture

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend + Backend | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Database | SQLite via Prisma ORM |
| Auth | JWT (jose) + bcryptjs |

### Project Structure

```
app/
├── (app)/                    # Authenticated routes (server-side auth guard)
│   ├── clients/              # Client list & create
│   ├── clients/[id]/         # Client detail + document list
│   │   ├── documents/[docId] # Document detail + actions + history
│   │   └── history/          # Full audit history (Reviewer only)
│   └── layout.tsx            # Auth guard: redirects to /login if no session
├── login/                    # Public login page
└── api/                      # REST API routes
    ├── auth/login             # POST: issues JWT cookie
    ├── auth/logout            # POST: clears JWT cookie
    ├── clients                # GET (firm-scoped) / POST (Reviewer only)
    ├── clients/[id]           # GET (firm-scoped)
    ├── documents              # POST: add document
    ├── documents/[id]         # GET / PATCH (upload)
    ├── documents/[id]/review  # POST: start_review / approve / request_correction
    └── audit/[clientId]       # GET: full audit log (Reviewer only)

components/
├── Navbar.tsx          # Top nav with firm, role, logout
├── StatusBadge.tsx     # Color-coded status pill
├── AuditTimeline.tsx   # Grouped-by-date audit log renderer
├── DocumentActions.tsx # Role-based action panel (upload / review / approve)
└── AddDocumentForm.tsx # Add document with suggested names

lib/
├── auth.ts    # JWT sign/verify, requireAuth/requireReviewer API guards
├── prisma.ts  # Prisma client singleton
└── audit.ts   # createAuditLog helper (single entry point)
```

---

## Security / Tenant Isolation

> **Authentication ≠ Authorization** and **Frontend hiding a button ≠ Security**

### How firm isolation is enforced

1. **JWT carries `firmId`** — set at login from the database, never trusting client-provided values.

2. **Every API route filters by `firmId` from the JWT**, not from the request body:
   ```ts
   // ✅ Correct — firmId from verified JWT
   await prisma.client.findFirst({
     where: { id: params.id, firmId: session.firmId }
   });
   ```
   A user from Firm B cannot access Firm A data even by guessing a client ID — they get a `404`.

3. **Role checks happen server-side**: Reviewer-only endpoints use `requireReviewer()` which validates the JWT role. Hiding the UI button is supplementary UX, not security.

4. **Audit logs are write-only via server code**: The `createAuditLog()` helper is called only from within API routes. There is no API endpoint that allows editing or deleting audit logs.

### API response for cross-tenant access attempt

```
GET /api/clients/[firm-A-client-id]  (logged in as Firm B user)
→ 404 Not Found
```

---

## Roles

### Staff
- View all clients in their firm
- Add required documents to any client
- Upload files for documents in `Pending` or `Correction Required` state
- View document history

### Reviewer
- All Staff permissions
- Create new clients
- Start document review
- Approve documents
- Request corrections (with mandatory reason)
- View full client audit history

---

## Audit Events

Every important action generates an immutable audit log:

| Action | Actor | Example Event |
|---|---|---|
| Document added | Anyone | `Added document "Bank Statement"` |
| File uploaded | Staff/Reviewer | `Uploaded Bank_Statement_Q1.pdf` |
| Review started | Reviewer | `Started reviewing` |
| Correction requested | Reviewer | `Requested correction` + reason |
| Revised file uploaded | Staff | `Uploaded revised document: Bank_Statement_v2.pdf` |
| Approved | Reviewer | `Approved document` |

Each log records: **who** (user name), **what** (action), **when** (timestamp), **which document**, and **any comment/reason**.

---

## What Would You Improve If You Had One More Week?

The single most valuable next improvement would be **real file storage with PDF preview**.

Currently, documents are tracked by filename strings (which is fine for an evaluation, and clearly simulates the concept correctly). But in real CA firm use, the actual content of a document is what matters — a reviewer needs to *read* the document to make an informed decision.

The improvement would involve:
1. **File upload to local disk or S3-compatible storage** (e.g. MinIO for self-hosted), storing the file path/key in the `Document` table.
2. **A secure file download/preview endpoint** that re-validates the JWT and `firmId` before serving the file — so a Firm B URL cannot be used to fetch Firm A files even if someone guesses the file path.
3. **PDF inline preview** on the document detail page using an `<iframe>` or a library like `react-pdf`, so reviewers can read the document without downloading it.

This is the next most valuable improvement because everything else in the system works correctly — the workflow, status transitions, roles, tenant isolation, and audit trail are all functional. The only missing piece for real-world use is being able to *read* what you're reviewing. A reviewer who cannot see the document content cannot meaningfully approve or request corrections, which makes the system incomplete for actual CA firm work.

I deliberately did not add this in the initial build because the challenge said "do not build unrelated features" and simulating file upload is sufficient to demonstrate all the required concepts (status transitions, audit logging, role enforcement). Adding real file storage would also require infrastructure decisions (local vs cloud) that go beyond the scope of a frontend evaluation.
