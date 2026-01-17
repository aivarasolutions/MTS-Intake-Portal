# MTS 1040 Intake Portal

## Overview

MTS 1040 is a full-stack tax document intake portal for managing client tax documents and preparation workflows. The application serves three user roles: clients who upload documents and complete intake forms, preparers who review submissions, and admins who manage the overall system. The portal emphasizes security, professional design, and clear user workflows for tax-related tasks.

## Recent Changes (January 2026)

- Implemented complete authentication system with email/password login
- Created login and registration pages with form validation
- Added client dashboard with intake progress tracker, document upload interface, and filing timeline
- Created admin/preparer dashboard with client management, KPI cards, and alerts panel
- Implemented role-based layouts (client header navigation, admin sidebar navigation)
- Added protected routes with role-based access control

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (Vite + React SPA)
- **Location**: `/client/src`
- **Routing**: Wouter for client-side navigation
- **State Management**: 
  - TanStack Query for server state
  - React Context for auth state (`/client/src/contexts/auth-context.tsx`)
- **Components**: shadcn/ui (Radix primitives + TailwindCSS)

### Backend (Express.js)
- **Location**: `/server`
- **API Routes**: `/server/routes.ts` - RESTful endpoints for auth and data
- **Auth Logic**: `/server/auth.ts` - Session management, password hashing, middleware

### Database Layer
- **Prisma ORM** with PostgreSQL adapter (`@prisma/adapter-pg`)
- **Schema**: `/prisma/schema.prisma` with users and sessions tables
- **Shared Types**: `/shared/schema.ts` - TypeScript types and Zod validation schemas

### Authentication System
- Session-based auth with HTTP-only cookies
- Password hashing with bcryptjs (12 rounds)
- Cryptographically secure session tokens (32 bytes hex)
- 7-day session expiry
- Role-based access control: `client`, `preparer`, `admin`

### File Storage
- Local filesystem storage abstraction (`/server/storage.ts`)
- Designed with S3-ready interface for future cloud migration
- Upload directory at `/uploads`

## Key Routes

### Authentication
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Sign in with email/password
- `POST /api/auth/logout` - Sign out and clear session
- `GET /api/auth/session` - Check current authentication status

### Frontend Pages
- `/login` - Login page
- `/register` - Registration page
- `/dashboard/client` - Client dashboard (client role only)
- `/dashboard/admin` - Admin dashboard (preparer/admin roles)

## Component Organization

- `/client/src/components/ui` - shadcn/ui primitives
- `/client/src/components/layouts` - Client and admin layout components
- `/client/src/components/shared` - Shared components (user menu, protected route)
- `/client/src/pages` - Page components organized by route

## External Dependencies

### Database
- PostgreSQL via `DATABASE_URL` environment variable
- Prisma ORM with pg adapter for connection pooling

### UI Framework
- Radix UI primitives for accessible components
- TailwindCSS for styling
- class-variance-authority for component variants
- Inter font from Google Fonts

### Form Handling
- react-hook-form for form state
- Zod for validation schemas
- @hookform/resolvers for Zod integration

### Build Tools
- Vite for SPA development and bundling
- esbuild for server bundling
- tsx for TypeScript execution in development

## Development Notes

### Running the Application
The application runs with `npm run dev` which starts both the Express server and Vite dev server on port 5000.

### Database Schema Updates
Use Prisma CLI commands to manage the database:
- `npx prisma db push` - Push schema changes to database
- `npx prisma generate` - Generate Prisma client

### Important Constraints
- DO NOT rename database columns/tables from schema
- Use relative imports for server-side code (tsx doesn't resolve TypeScript path aliases)
- PostCSS config must be `.cjs` format due to ES modules in package.json
