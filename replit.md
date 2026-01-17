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
- **Database Schema Update**: Implemented full canonical schema with 17 tables including intakes, taxpayer_info, filing_status, photo_ids, bank_accounts, dependents, childcare_providers, estimated_payments, files, messages, checklist_items, audit_logs, status_history, preparer_packet_requests
- **Encryption**: Added AES-256-GCM encryption utility for sensitive data (SSNs, account numbers, etc.)
- **Seed Script**: Created seed script with demo admin, preparer, and client users
- **RBAC Hardening**: Implemented strict role-based access control with session cookie security (httpOnly, secure, sameSite=strict)
- **Audit Logging**: Added comprehensive audit logging for login, logout, intake submission, status changes, packet generation, file upload/delete
- **Protected API Routes**: Full intake and file management API with ownership enforcement

## User Preferences

Preferred communication style: Simple, everyday language.

## Database Setup

### Prerequisites
- PostgreSQL database (provided via Replit's built-in database)
- `DATABASE_URL` environment variable (automatically set)
- `DATA_ENCRYPTION_KEY` environment variable for encrypting sensitive data

### Generate Encryption Key
```bash
# Generate a secure 256-bit key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Add the generated key to your secrets as `DATA_ENCRYPTION_KEY`.

### Push Schema to Database
```bash
npx prisma generate  # Generate Prisma client
npx prisma db push   # Push schema to database
```

### Seed Database with Demo Data
```bash
npx tsx prisma/seed.ts
```

This creates:
- **Admin**: admin@mts1040.com / Admin123!
- **Preparer**: preparer@mts1040.com / Preparer123!
- **Demo Client**: demo@example.com / Client123!

### Database Tables

| Table | Description |
|-------|-------------|
| users | User accounts with roles (client/preparer/admin) |
| sessions | HTTP-only cookie sessions |
| intakes | Tax intake cases per user per year |
| taxpayer_info | Personal info with encrypted SSN/IP PIN fields |
| filing_status | Tax filing status selections |
| photo_ids | Government ID info for identity verification |
| bank_accounts | Bank info with encrypted routing/account numbers |
| dependents | Dependent information with encrypted SSNs |
| childcare_providers | Childcare provider info with encrypted EINs |
| estimated_payments | Estimated tax payment records |
| files | Document uploads with SHA-256 checksums |
| messages | Intake-related messaging |
| checklist_items | Items requiring client attention |
| audit_logs | System audit trail |
| status_history | Intake status change history |
| preparer_packet_requests | PDF packet generation requests |

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
- **Encryption**: `/lib/crypto.ts` - AES-256-GCM encryption for sensitive data

### Database Layer
- **Prisma ORM** with PostgreSQL adapter (`@prisma/adapter-pg`)
- **Schema**: `/prisma/schema.prisma` - Full tax intake schema
- **Shared Types**: `/shared/schema.ts` - TypeScript types and Zod validation schemas
- **Seed Script**: `/prisma/seed.ts` - Demo data creation

### Authentication System
- Session-based auth with HTTP-only cookies
- Password hashing with bcryptjs (12 rounds)
- Cryptographically secure session tokens (32 bytes hex)
- 7-day session expiry
- Role-based access control: `client`, `preparer`, `admin`

### Data Encryption (AES-256-GCM)
Sensitive fields are encrypted at rest using AES-256-GCM:
- Social Security Numbers (SSN)
- IP PINs
- Bank routing/account numbers
- Government ID numbers
- Provider EINs

Use `encryptToBytea()` and `decryptFromBytea()` from `/lib/crypto.ts`.

### File Storage
- Local filesystem storage abstraction (`/server/storage.ts`)
- Designed with S3-ready interface for future cloud migration
- Upload directory at `/uploads`
- SHA-256 checksums for integrity verification

## Key Routes

### Authentication
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Sign in with email/password
- `POST /api/auth/logout` - Sign out and clear session
- `GET /api/auth/session` - Check current authentication status

### Intakes (Protected)
- `GET /api/intakes` - List intakes (clients: own only, preparers/admins: all)
- `GET /api/intakes/:id` - Get intake details with related data
- `POST /api/intakes` - Create new intake (clients only)
- `POST /api/intakes/:id/submit` - Submit intake for review (clients only)
- `PATCH /api/intakes/:id/status` - Update intake status (preparers/admins only)
- `PATCH /api/intakes/:id/assign` - Assign preparer to intake (preparers/admins only)

### Files (Protected with Ownership Checks)
- `GET /api/intakes/:id/files` - List files for intake
- `POST /api/intakes/:id/files` - Upload file to intake
- `GET /api/files/:fileId` - Download file
- `DELETE /api/files/:fileId` - Delete file

### Checklist Items (Preparers/Admins Only)
- `GET /api/intakes/:id/checklist` - Get checklist items
- `POST /api/intakes/:id/checklist` - Create checklist item
- `PATCH /api/checklist/:itemId/resolve` - Resolve checklist item
- `DELETE /api/checklist/:itemId` - Delete checklist item

### Packet Generation (Preparers/Admins Only)
- `POST /api/intakes/:id/packet` - Request packet generation

### Admin Dashboard
- `GET /api/preparers` - List preparers (for assignment)
- `GET /api/admin/clients` - List all clients with intakes
- `GET /api/admin/stats` - Get dashboard statistics

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

### Important Constraints
- DO NOT rename database columns/tables from schema
- Use relative imports for server-side code (tsx doesn't resolve TypeScript path aliases)
- PostCSS config must be `.cjs` format due to ES modules in package.json
- Prisma 7 requires configuration in `prisma.config.ts` (no `url` in schema.prisma)
