# Fix Admin Dashboard 403 Issue on Welcome Page

## Problem
Admin clicking Dashboard button on welcome page gets 403 because it redirects to '/dashboard' (patient-only route).

## Steps
- [x] 1. Update routes/web.php: Protect root '/' route with auth/staff.verified middleware and add role-based redirect
- [x] 2. Update resources/js/pages/welcome.tsx: Make navbar Dashboard button role-aware (admin -> '/admin/dashboard')
- [ ] 3. Run `php artisan route:clear &amp;&amp; php artisan config:clear &amp;&amp; npm run dev`
- [ ] 4. Test: Login as admin, visit /, click Dashboard button, direct /admin/dashboard
- [ ] 5. Mark complete
