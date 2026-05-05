# Timeline Proyek - Plan

## Overview
Aplikasi web untuk monitor proyek dari due date tenggang waktu yang sedang atau akan dikerjakan. Mendukung multi-user dengan team collaboration.

---

## Tech Stack

| Komponen | Pilihan |
|---------|---------|
| Framework | Next.js 14 (App Router) |
| Bahasa | TypeScript |
| Database | MySQL |
| ORM | Prisma |
| UI Library | ShadcnUI + Tailwind CSS |
| Font | Inter |
| Auth | NextAuth.js (Credentials + Google OAuth) |
| Deployment | Local dulu |

---

## Fitur Utama

### 1. Autentikasi
- Register/Login dengan email/password
- Login dengan Google OAuth
- Session management via NextAuth.js

### 2. Manajemen Proyek
- Buat/Edit/Hapus proyek
- Set due date & deskripsi
- Status proyek: Active, Completed, Overdue

### 3. Team Collaboration
- Invite member ke proyek via email
- Role: Owner, Editor, Viewer
- List member per proyek

### 4. Timeline Dashboard
- Tampilkan semua proyek dengan deadline
- Filter: Active, Completed, Overdue
- Sorting berdasarkan due date
- Progress tracking

### 5. UI/UX
- ShadcnUI components
- Font Inter
- Responsive design
- Dark mode support

---

## Database Schema (Prisma)

### User
| Field | Type |
|-------|------|
| id | String (cuid) |
| name | String? |
| email | String (unique) |
| password | String? |
| image | String? |
| createdAt | DateTime |

### Project
| Field | Type |
|-------|------|
| id | String (cuid) |
| name | String |
| description | String? |
| dueDate | DateTime |
| status | Enum (ACTIVE, COMPLETED, OVERDUE) |
| userId | String (relation to User) |
| createdAt | DateTime |

### ProjectMember
| Field | Type |
|-------|------|
| id | String (cuid) |
| projectId | String (relation to Project) |
| userId | String (relation to User) |
| role | Enum (OWNER, EDITOR, VIEWER) |
| invitedAt | DateTime |

### Task (Optional - Milestone)
| Field | Type |
|-------|------|
| id | String (cuid) |
| projectId | String (relation to Project) |
| title | String |
| dueDate | DateTime? |
| completed | Boolean |

---

## Tahap Pengembangan

| Fase | Deskripsi |
|-----|-----------|
| 1 | Setup Next.js + TypeScript + ShadcnUI |
| 2 | Setup Prisma + MySQL + Schema |
| 3 | Implementasi Auth (NextAuth.js) |
| 4 | CRUD Projects |
| 5 | Team collaboration (invite member) |
| 6 | Timeline dashboard & filtering |
| 7 | UI polish & dark mode |

---

## Struktur Folder

```
timeline-office/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/
│   │   │   ├── projects/
│   │   │   └── layout.tsx
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   └── projects/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   └── project/
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── db.ts
│   │   └── utils.ts
│   └── styles/
│       └── globals.css
├── .env
├── next.config.ts
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```