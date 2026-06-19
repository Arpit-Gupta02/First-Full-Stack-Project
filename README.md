# CaseVault 📂

**A secure, full-stack case study repository and gallery.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel) ]
([https://first-full-stack-project-iota.vercel.app/])

CaseVault is a robust Next.js web application designed to securely ingest, store, and display academic and professional case studies. It features a custom API, strict cryptographic authentication, and optimized database queries to ensure scalability and high performance.

---

## 🚀 Key Features

* **Secure Authentication Gateway:** User session management utilizing Supabase Auth and JSON Web Tokens (JWT).
* **Encrypted File Uploads:** Direct-to-bucket binary uploads for heavy PDF and Image files, bypassing server bottlenecks.
* **Paginated Gallery:** Offset-based pagination executed at the PostgreSQL database layer (`LIMIT` & `OFFSET`) to minimize memory overhead.
* **Real-time Multi-field Search:** In-memory client/server filtering across titles, descriptions, and metadata tags.
* **Optimistic UI Deletions:** Zero-latency DOM mutations during record deletion, backed by asynchronous server rollbacks on failure.
* **Strict Resource Protection:** API endpoints enforce IDOR (Insecure Direct Object Reference) protection, requiring exact cryptographic matches between the JWT subject and the database `user_id`.

---

## 🛠️ Technology Stack

**Frontend Architecture**
* **Framework:** Next.js (App Router)
* **Library:** React
* **Language:** TypeScript / JavaScript
* **Styling:** Tailwind CSS

**Backend Infrastructure (BaaS)**
* **Database:** PostgreSQL (via Supabase)
* **Authentication:** Supabase Auth
* **Object Storage:** Supabase Storage Buckets
* **API:** Next.js Serverless Route Handlers

---

## 📂 System Architecture

The application enforces a strict separation of concerns between client-side rendering and server-side data mutations.

```text
case-vault/
├── app/
│   ├── layout.tsx         # Global UI wrapper & metadata
│   ├── page.tsx           # Primary Gallery view (Client Component)
│   ├── login/             # Authentication gateway
│   ├── upload/            # Ingestion form & payload packager
│   └── api/
│       └── slides/
│           └── route.js   # Secure API (GET, POST, DELETE handlers)
├── public/                # Static visual assets
└── .env.local             # Hidden cryptographic keys