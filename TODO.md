# Remove Spatie Role System - TODO

## Steps to Complete:

- [ ] **Step 1:** Remove Spatie package from composer.json and run `composer update`
- [ ] **Step 2:** Delete Spatie files (config/permission.php, RoleSeeder.php, permission migration)
- [ ] **Step 3:** Update app/Models/User.php - remove HasRoles trait
- [ ] **Step 4:** Update controllers (StaffController.php, CompanyController.php) - replace Spatie methods with native role field
- [ ] **Step 5:** Update DatabaseSeeder.php - remove RoleSeeder call
- [ ] **Step 6:** Clear caches: `php artisan config:clear && php artisan cache:clear && composer dump-autoload`
- [ ] **Step 7:** Database cleanup: Drop Spatie tables + `php artisan migrate:fresh --seed`
- [ ] **Step 8:** Search for remaining Spatie references and fix
- [ ] **Step 9:** Test all role-based routes and dashboards

**Current Progress: Steps 1-5 complete. Next: Step 6 caches, Step 7 migrate**

**Notes:** Using SQLite dev DB, migrate:fresh is safe. All role logic preserved via native 'role' string field.
