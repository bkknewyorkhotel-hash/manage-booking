# Sanrue New York Booking System

This is a hotel management system built with Next.js, Prisma, and SQLite.

## Getting Started

### Prerequisites

- Node.js (v18 or later recommended)

### Installation

1. Install dependencies:

\`\`\`bash
npm install
\`\`\`

2. Setup the database (SQLite):

\`\`\`bash
# This creates the database and applies the schema
npx prisma db push

# Seed the database with initial data (Rooms, Users, Products)
npm run db:seed
\`\`\`

> **Note:** The database is stored in `prisma/dev.db`.

### Running the Application

Run the development server:

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Login Credentials

Default accounts for testing:

| Role | Username | Password |
|---|---|---|
| **Admin** | \`admin\` | \`password123\` |
| **Reception** | \`reception\` | \`password123\` |

## Project Structure

- \`prisma/\`: Database schema and seed script
- \`src/app/\`: Next.js App Router pages and API routes
- \`src/components/\`: Reusable React components
- \`src/lib/\`: Utility functions and shared logic
