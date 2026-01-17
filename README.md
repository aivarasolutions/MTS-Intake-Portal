# MTS 1040 Intake Portal

A production-ready full-stack tax document intake portal built with Next.js 14+ (App Router), TypeScript, PostgreSQL, Prisma ORM, and TailwindCSS.

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: TailwindCSS
- **Validation**: Zod
- **Authentication**: Email/password with secure session management
- **File Storage**: Local filesystem (MVP) with S3-ready abstraction

## Features

- **Role-Based Access Control**: Three roles - `client`, `preparer`, `admin`
- **Secure Authentication**: Password hashing with bcrypt, HTTP-only session cookies
- **Client Dashboard**: Document upload, intake form progress, filing timeline
- **Admin/Preparer Dashboard**: Client management, document review, KPI tracking
- **Responsive Design**: Mobile-first approach with beautiful UI

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages (login, register)
│   ├── actions/           # Server Actions
│   └── dashboard/         # Protected dashboard routes
│       ├── client/        # Client-specific dashboard
│       └── admin/         # Admin/Preparer dashboard
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard components
│   └── ui/               # Shared UI components
├── lib/                   # Utility functions and configurations
│   ├── auth.ts           # Authentication utilities
│   ├── prisma.ts         # Prisma client instance
│   ├── storage.ts        # File storage abstraction
│   ├── utils.ts          # General utilities
│   └── validations.ts    # Zod validation schemas
├── prisma/               # Prisma schema and migrations
│   └── schema.prisma     # Database schema
└── uploads/              # Local file storage directory
```

## Database Schema

### Users Table
- `id`: UUID primary key
- `email`: Unique email address
- `password_hash`: Bcrypt hashed password
- `first_name`: User's first name
- `last_name`: User's last name
- `role`: Enum - 'client', 'preparer', 'admin'
- `created_at`: Timestamp
- `updated_at`: Timestamp

### Sessions Table
- `id`: UUID primary key
- `user_id`: Foreign key to users
- `token`: Unique session token
- `expires_at`: Session expiration timestamp
- `created_at`: Timestamp

## Local Development

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mts-1040-intake-portal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your database credentials and session secret.

4. **Generate Prisma Client**
   ```bash
   npm run db:generate
   ```

5. **Push database schema**
   ```bash
   npm run db:push
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5000`

### Available Scripts

- `npm run dev` - Start development server on port 5000
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Prisma Studio

## File Storage

The application uses a storage abstraction layer (`lib/storage.ts`) that currently implements local filesystem storage. This can be easily swapped for S3 or other cloud storage providers by implementing the `StorageProvider` interface:

```typescript
interface StorageProvider {
  upload(file: Buffer, filename: string, mimeType: string): Promise<string>;
  download(filepath: string): Promise<Buffer>;
  delete(filepath: string): Promise<void>;
  exists(filepath: string): Promise<boolean>;
  getUrl(filepath: string): string;
}
```

## Security Features

- Password hashing with bcrypt (12 rounds)
- HTTP-only session cookies
- Session expiration (7 days)
- Role-based route protection
- Input validation with Zod
- CSRF protection via Server Actions

## Role Permissions

| Feature | Client | Preparer | Admin |
|---------|--------|----------|-------|
| View own dashboard | ✅ | ✅ | ✅ |
| Upload documents | ✅ | ✅ | ✅ |
| View all clients | ❌ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ✅ |

## License

MIT License
