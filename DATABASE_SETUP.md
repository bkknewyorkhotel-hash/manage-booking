# Database Setup Changes

## What Changed

Due to PostgreSQL not being installed locally, I've converted the application to use **SQLite** instead. This is a file-based database that requires no installation.

## Changes Made

1. **Schema Migration**: 
   - Changed from PostgreSQL to SQLite in `prisma/schema.prisma`
   - Converted `Decimal` types to `Float` (SQLite limitation)
   - Converted `String[]` arrays to JSON strings (SQLite limitation)

2. **Database File**: 
   - Database is stored in `prisma/dev.db`
   - This file is automatically created and managed

3. **Seed Data**: 
   - Created 8 floors with 10 rooms each (80 total rooms)
   - Created test users for all roles
   - Created 3 room types (Standard, Deluxe, Suite)

## Test Accounts

| Username | Password | Role |
|----------|----------|------|
| `admin` | `password123` | Admin |
| `reception` | `password123` | Reception |

## Running the Application

```bash
# Start the development server
npm run dev

# Access at http://localhost:3000
```

## Handling Database Changes (Prisma Migrations)

If you modify `schema.prisma` (e.g., add a column, change a type), **DO NOT use `--force-reset`**. Instead:

1.  **Generate a migration**:
    ```bash
    npx prisma migrate dev --name your_change_description
    ```
    This will:
    - Compare your schema with the database structure.
    - Generate an SQL file with the necessary `ALTER TABLE` statements.
    - Apply the changes safely while **preserving your existing data**.

2.  **Deploying migrations**:
    When deploying to production (Vercel/Cloud), run:
    ```bash
    npx prisma migrate deploy
    ```

## Database Commands

```bash
# [DEVELOPMENT] Reset and reseed database
# CAUTION: This will wipe all data in the database
# npx prisma db push --force-reset
# npm run db:seed

# [RECOMMENDED] Apply schema changes without wiping data (Uses ALTER TABLE)
npx prisma migrate dev

# [PRODUCTION] Apply migrations
npx prisma migrate deploy

# View database in browser
npx prisma studio
```

> [!WARNING]
> NEVER use `--force-reset` in production as it will permanently delete all your data.

## Production Note

For production deployment, you should switch back to PostgreSQL by:
1. Updating `prisma/schema.prisma` datasource
2. Converting Float back to Decimal types
3. Converting JSON strings back to proper arrays
4. Running migrations properly
