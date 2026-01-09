# Database Migrations

This directory contains database migration scripts for the SellLocal Online application.

## Migration Scripts

### 001-initial-setup.js

Initial database setup migration that includes:
- Admin user seeding

**Admin Credentials:**
- Email: `admin@selllocalonline.com`
- Password: `Bloxham1!`

## Running Migrations

### Run all migrations:
```bash
npm run migrate
```

Or directly:
```bash
node backend/migrations/001-initial-setup.js
```

## Important Notes

- Migration scripts are **committed to git** (not in .gitignore)
- Always backup your database before running migrations in production
- Migrations are idempotent - safe to run multiple times
- The admin user will be created or updated if it already exists

## Adding New Migrations

When adding new migrations:
1. Create a new file: `002-migration-name.js`
2. Follow the same structure as `001-initial-setup.js`
3. Export the migration function
4. Update this README with the new migration details
