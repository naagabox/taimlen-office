# Timeline Office

Project and Task Management Application

## Overview

Timeline Office is a Next.js-based project and task management application that allows users to create, manage, and track projects with their tasks. Users can collaborate on projects with different role levels (Owner, Editor, Viewer).

## Tech Stack

- **Framework**: Next.js 16.2.4
- **Language**: TypeScript
- **Database**: MySQL with Prisma ORM
- **Authentication**: NextAuth.js
- **UI Components**: shadcn/ui
- **Charts**: ApexCharts
- **Drag & Drop**: @dnd-kit
- **Styling**: Tailwind CSS

## Features

### 1. Authentication
- User registration and login
- Session-based authentication via NextAuth.js

### 2. Project Management
- Create new projects with name, description, and due date
- View projects categorized by status (Overdue, Active, Completed)
- Edit project details (Owner, Editor only)
- Delete projects (Owner only)
- Project status auto-calculation (ACTIVE, COMPLETED, OVERDUE)

### 3. Task Management (Kanban Board)
- Three-column Kanban board: To Do, In Progress, Finished
- Drag and drop tasks between columns
- Task status colors:
  - To Do: Amber/Orange
  - In Progress: Blue
  - Finished: Green
- Edit task title
- Add attachment URL (for FINISHED tasks only - stored as link)
- Delete tasks

### 4. Activity Logging
- Track task status changes
- Display activity history in project detail

### 5. Charts & Visualization

#### Task Distribution This Week
- Stacked horizontal bar chart using Recharts
- Displays task distribution per day: Finished, In Progress, Todo

#### Attachment Status
- Horizontal bar chart using ApexCharts
- Displays task count based on attachment status:
  - **Attached**: Tasks with attachments (array length > 0)
  - **Not Yet**: Tasks without attachments (null or empty array)
  - **To Do**: Tasks with status NOT_STARTED
- Chart colors:
  - Attached: #22c55e (green)
  - Not Yet: #94a3b8 (gray)
  - To Do: #f59e0b (amber)

### 6. UI/UX
- Breadcrumb navigation
- Hover-reveal action buttons on cards
- Delete confirmation dialogs
- Responsive design
- Full width Projects page layout (max-w-full)
- Project card title: max 30 characters with ellipsis (...)
- Project card badge: flex-shrink-0 to prevent title overflow
- Chart legend: Circle markers with proper color matching

## Database Schema

### Models

```prisma
User {
  id, name, email, password, image, createdAt, updatedAt
}

Project {
  id, name, description, dueDate, status, createdAt, updatedAt
  userId (owner), members[], tasks[], activities[]
}

Task {
  id, title, description, dueDate, completed, status, order
  attachmentUrl, createdAt, updatedAt
  projectId
}

ProjectMember {
  id, role (OWNER/EDITOR/VIEWER), invitedAt
  projectId, userId
}

ActivityLog {
  id, taskId, taskTitle, oldStatus, newStatus
  userId, userName, createdAt
  projectId
}
```

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/[...nextauth]` | NextAuth handlers |
| GET/POST | `/api/projects` | List/Create projects |
| GET/PUT/DELETE | `/api/projects/[id]` | Project CRUD |
| GET/POST | `/api/projects/[id]/tasks` | List/Create tasks |
| PUT/DELETE | `/api/projects/[id]/tasks/[taskId]` | Task update/delete |
| GET/POST | `/api/projects/[id]/activities` | List/Create activity logs |
| GET/POST | `/api/projects/[id]/members` | List/Add members |

## Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   └── projects/
│   │       ├── [id]/
│   │       ├── new/
│   │       └── page.tsx
│   └── api/
│       └── projects/
│           └── [id]/
│               ├── tasks/
│               │   └── [taskId]/
│               ├── members/
│               └── activities/
├── components/
│   ├── auth/
│   ├── dashboard/
│   ├── project/
│   │   ├── projects-list.tsx
│   │   ├── project-detail.tsx
│   │   ├── task-board.tsx
│   │   ├── task-card.tsx
│   │   ├── task-column.tsx
│   │   └── activity-log.tsx
│   └── ui/          # shadcn components
└── lib/
    ├── auth.ts     # NextAuth config
    ├── db.ts      # Prisma client
    └── utils.ts   # Utility functions
```

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env`:
```env
DATABASE_URL="mysql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
```

3. Initialize database:
```bash
npx prisma db push
```

4. Run development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Permissions

| Action | Owner | Editor | Viewer |
|--------|-------|--------|--------|
| Create Project | Yes | - | - |
| Edit Project | Yes | Yes | - |
| Delete Project | Yes | - | - |
| Add Tasks | Yes | Yes | - |
| Edit Tasks | Yes | Yes | - |
| Delete Tasks | Yes | Yes | - |
| Add Attachment | Yes | Yes | - |
| View Projects | Yes | Yes | Yes |
| View Tasks | Yes | Yes | Yes |

---

## Build with opencode.ai

This project was built using **opencode.ai** with the **MiniMax** model.

**opencode.ai** is an AI-powered CLI tool that helps developers with software engineering tasks including:
- Writing, reading, and editing code
- Searching and navigating codebases
- Running shell commands
- Multi-file refactoring
- Bug fixing and feature implementation

### Model: MiniMax

The MiniMax model provides intelligent assistance for:
- Understanding project context
- Implementing features based on natural language descriptions
- Code generation and refactoring
- Explaining and debugging code

### How opencode.ai Helped

This application was developed through conversations with opencode.ai:
- Feature planning and specification
- Database schema design
- API route implementation
- UI component development
- Bug fixing and refinements

To learn more about opencode.ai, visit: https://opencode.ai