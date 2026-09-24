# Production Deployment Runbook

## Required services

- HTTPS reverse proxy or web server pointing its document root to `public/`
- PHP 8.2+ runtime and process manager
- Production database with automated backups
- Persistent storage for `storage/app/private` and required `storage/app/public` files
- Scheduler process that runs `php artisan schedule:run` every minute
- Supervised queue worker when `QUEUE_CONNECTION` is asynchronous
- Supervised FastAPI/uvicorn process for `ml_api.main:app`
- Central log collection, exception alerts, and uptime monitoring

## Production environment checklist

Configure secrets through the hosting platform, not source control.

- Use production application mode and disable debug output.
- Use the final HTTPS application URL.
- Generate a unique application key and retain it securely for disaster recovery.
- Use a production database account with only the required privileges.
- Enable secure and HTTP-only session cookies with an approved SameSite policy.
- Enable session encryption unless an approved compatibility reason prevents it.
- Use `daily` or centralized logging at `warning` or an approved level.
- Configure SMTP, OAuth redirect URLs, and the private ML service URL.
- Configure trusted proxies/hosts for the actual infrastructure.
- Keep the ML API private; do not expose it directly to the public internet.

## Release procedure

1. Confirm an encrypted off-host backup and record its restore identifier.
2. Put the application into maintenance mode if the migration requires it.
3. Deploy the reviewed source and run `composer install --no-dev --classmap-authoritative`.
4. Run `npm ci` and `npm run build` in the build stage; deploy the generated assets.
5. Run `composer check-platform-reqs` and `composer audit --locked`.
6. Run `php artisan migrate --force` after reviewing pending migrations.
7. Run `php artisan optimize` and `php artisan storage:link` when the link is not managed by the platform.
8. Restart PHP workers, queue workers, scheduler supervision, and the ML API.
9. Verify `/up`, the landing page, login, registration, protected role dashboards, queue health, and external integrations.
10. End maintenance mode and monitor errors, latency, failed jobs, and health alerts.

## Rollback

1. Re-enable maintenance mode.
2. Restore the previous application artifact and matching dependency lock files.
3. Do not run destructive migration rollback automatically. Review whether the prior release can operate against the current schema.
4. Restore the database and files only when required and only through the tested recovery procedure.
5. Restart supervised processes, verify health, and document the incident.

## Security headers

`App\Http\Middleware\SecurityHeaders` applies baseline browser headers and a production content-security policy. The reverse proxy should also enforce HTTPS and may add HSTS. Test OAuth, email links, fonts, downloads, and Inertia navigation whenever this policy changes.

## Monitoring minimums

- HTTPS and `/up` uptime checks
- HTTP 5xx and exception-rate alerts
- Failed queue job alerts
- Database capacity/connection alerts
- Storage capacity alerts
- Backup failure and restore-verification alerts
- ML service availability and timeout alerts
- Release identifier attached to logs and error events
