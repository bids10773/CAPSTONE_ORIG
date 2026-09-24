# LMIC Medical Services Management System

Laravel 12, Inertia, React, and TypeScript application for patient appointments, company medical programs, clinical workflows, reporting, and forecasting.

## Local setup

Requirements:

- PHP 8.2 or newer with the extensions validated by `composer check-platform-reqs`
- Composer 2
- Node.js 22 or newer and npm
- SQLite for local development, or a configured MySQL database
- Python 3.13 for the optional ML forecasting service

```text
composer install
npm ci
copy .env.example .env
php artisan key:generate
php artisan migrate
npm run build
```

Start the Laravel development services with `composer dev`. Start the ML API separately with `npm run api` when forecast endpoints are required.

## Required checks

Before merging or deploying:

```text
composer audit --locked
composer lint:check
npm audit --omit=dev
npm run format:check
npm run lint:check
npm run types:check
composer test
npm run build
```

The test suite uses an isolated in-memory SQLite database and a 512 MB PHP CLI memory limit.

## Operations

- Deployment: `docs/DEPLOYMENT.md`
- Backup and recovery: `docs/BACKUP_RECOVERY.md`
- User acceptance testing: `docs/UAT_CHECKLIST.md`
- Company bulk appointment testing: `docs/COMPANY_BULK_APPOINTMENT_TEST.md`
- Pre-deployment assessment: `PRE_DEPLOYMENT_REPORT.md`

Never commit `.env`, credentials, database dumps, production medical records, or backup archives.
