# Obliq — Audit Document Review System

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=for-the-badge&logo=prisma)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=for-the-badge&logo=tailwind-css)

**A CA firm audit workflow tool — manage clients, track document review cycles, and maintain an immutable audit history.**

</div>

---

## Overview

Obliq is a **Mini Audit Document Review System** built for CA firms. It allows staff to upload client documents and reviewers to approve them or request corrections — with every action logged in a tamper-proof audit trail.

```
Create Client → Add Documents → Upload Files → Review → Approve / Request Correction → Audit History
```

---

## Features

| Feature | Details |
|---|---|
| 🏢 **Multi-tenant** | Firm A cannot see Firm B's data — enforced at the API level |
| 👥 **Role-based access** | `Staff` uploads, `Reviewer` approves/rejects |
| 📋 **Immutable audit log** | Every action recorded — who, what, when, which document |
| 🔐 **Secure auth** | JWT in httpOnly cookies, server-side role + tenant checks |
| 📄 **Document lifecycle** | `Pending → Uploaded → Under Review → Approved` |
| 🔄 **Correction flow** | Reviewer requests correction with reason → Staff re-uploads |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend + Backend** | Next.js 14 (App Router) + TypeScript |
| **Styling** | Tailwind CSS |
| **Database** | SQLite via Prisma ORM |
| **Auth** | JWT (`jose`) + `bcryptjs` |

---

## Getting Started

### Prerequisites

- Node.js 18+

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Create database schema + seed demo data
npm run db:push
npx ts-node --project tsconfig.seed.json prisma/seed.ts
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Demo Accounts

Two isolated firms are pre-seeded for testing.

### Firm A — ABC & Co.

| Name | Email | Password | Role |
|---|---|---|---|
| Rohit Sharma | `rohit@abc.co` | `password123` | Staff |
| Aman Verma | `aman@abc.co` | `password123` | Reviewer |

### Firm B — XYZ & Co.

| Name | Email | Password | Role |
|---|---|---|---|
| Priya Mehta | `priya@xyz.co` | `password123` | Staff |
| Kiran Patel | `kiran@xyz.co` | `password123` | Reviewer |

> Logging in as `kiran@xyz.co` and trying to access Firm A's client URLs returns `404` — not just a hidden button.

---

## Project Structure

```
├── app/
│   ├── (app)/                        # Authenticated routes
│   │   ├── clients/                  # Client list & create
│   │   ├── clients/[id]/             # Client detail + documents
│   │   │   ├── documents/[docId]/    # Document view + actions + history
│   │   │   └── history/             # Full audit history (Reviewer only)
│   │   └── layout.tsx               # Server-side auth guard
│   ├── login/                        # Public login page
│   └── api/                          # REST API routes
│       ├── auth/login                # POST — issues JWT cookie
│       ├── auth/logout               # POST — clears JWT cookie
│       ├── clients                   # GET (firm-scoped) / POST (Reviewer)
│       ├── clients/[id]              # GET (firm-scoped)
│       ├── documents                 # POST — add document
│       ├── documents/[id]            # GET / PATCH — view + upload
│       ├── documents/[id]/review     # POST — approve / request correction
│       └── audit/[clientId]          # GET — full audit log (Reviewer)
│
├── components/
│   ├── Navbar.tsx                    # Top nav with firm, role badge, logout
│   ├── StatusBadge.tsx               # Color-coded document status pill
│   ├── AuditTimeline.tsx             # Grouped-by-date audit log renderer
│   ├── DocumentActions.tsx           # Role-aware action panel
│   └── AddDocumentForm.tsx           # Add document with quick suggestions
│
├── lib/
│   ├── auth.ts                       # JWT sign/verify + requireAuth/requireReviewer guards
│   ├── prisma.ts                     # Prisma client singleton
│   ├── audit.ts                      # createAuditLog() — single write point
│   └── types.ts                      # Shared TypeScript types
│
└── prisma/
    ├── schema.prisma                 # DB schema
    └── seed.ts                       # Demo data
```

---

## Security Design

> **Authentication ≠ Authorization. Hiding a UI button ≠ Security.**

### Tenant Isolation

Every API route extracts `firmId` from the **verified JWT** — never from the request body. All database queries include `WHERE firmId = session.firmId`:

```ts
// ✅ firmId comes from the JWT — never from client input
const client = await prisma.client.findFirst({
  where: { id: params.id, firmId: session.firmId },
});
// Returns 404 if the resource belongs to a different firm
```

A user from Firm B who guesses a Firm A client ID gets a `404`, not unauthorized data.

### Role Enforcement

```ts
// Reviewer-only endpoints use this guard — checked server-side
export async function requireReviewer(req) {
  const result = await requireAuth(req);
  if (result.session.role !== "REVIEWER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
```

### Immutable Audit Log

Audit entries are written **only** via `createAuditLog()` inside API route handlers. There is no endpoint that edits or deletes audit records.

---

## Document Lifecycle

```
          Staff uploads file
               │
        ┌──────▼──────┐
        │   PENDING   │
        └──────┬──────┘
               │  Staff submits file
        ┌──────▼──────┐
        │  UPLOADED   │
        └──────┬──────┘
               │  Reviewer starts review
        ┌──────▼──────┐
        │ UNDER REVIEW│
        └──────┬──────┘
         ┌─────┴──────┐
         │            │
  Reviewer         Reviewer requests
  approves         correction
         │            │
  ┌──────▼──────┐  ┌──────────────────────┐
  │  APPROVED ✅ │  │ CORRECTION REQUIRED ⚠️│
  └─────────────┘  └──────────┬───────────┘
                               │  Staff re-uploads
                        ┌──────▼──────┐
                        │  UPLOADED   │  ← loop continues
                        └─────────────┘
```

---

## Audit History Example

```
15 Jan 2024

  ➕  10:20 AM   Aman Verma added document "Bank Statement"
  📄  10:30 AM   Rohit Sharma uploaded Bank_Statement_Q1.pdf
  🔍  10:41 AM   Aman Verma started reviewing
  ⚠️  10:44 AM   Aman Verma requested correction
                   Reason: Page 3 was missing. Please upload the complete bank statement.
  🔄  12:05 PM   Rohit Sharma uploaded revised document: Bank_Statement_Q1_v2.pdf
  ✅  12:12 PM   Aman Verma approved document
```

---

## Roles

### Staff
- View all clients in their firm
- Add required documents
- Upload files for `Pending` and `Correction Required` documents
- View document status and history

### Reviewer
- All Staff permissions
- Create new clients
- Start document review
- Approve documents
- Request corrections (mandatory reason required)
- View full client audit history
