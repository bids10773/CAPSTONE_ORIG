# Accepted Status Implementation

## Steps:

1. [x] Update `app/Models/Appointment.php` - Add 'accepted' case to getStatusBadgeAttribute
2. [x] Update `resources/js/pages/appointments/index.tsx` - Add badge/icon cases and confirm option
3. [x] Update `resources/js/pages/doctor/appointments/index.tsx` - Add badge/icon cases 
4. [x] Update `resources/js/pages/medtech/appointments/index.tsx` - Add badge/icon and option
5. [x] Update `resources/js/pages/radtech/appointments/index.tsx` - Add badge/icon and option
6. [x] Update `resources/js/pages/admin/appointments/index.tsx` - Add filter option if missing
7. [ ] Test: Run `php artisan serve`, check all pages display 'accepted' badge correctly, update status flows
8. [ ] Mark complete ✅
