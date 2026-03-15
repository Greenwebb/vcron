# V-Chron - Healthcare Attendance Tracking System

## Original Problem Statement
Build a mobile and web MVP application called "v-chron" for attendance tracking of healthcare workers. Core features include user registration (email & Google), attendance logging ("Report for Duty" & "End Shift") with GPS coordinates, offline data sync, and an admin dashboard for user management and attendance monitoring.

## Tech Stack
- **Backend:** FastAPI (Python), Motor (async MongoDB)
- **Frontend:** React, Tailwind CSS, Shadcn UI, React Router
- **Database:** MongoDB
- **Auth:** JWT + Emergent-managed Google OAuth

## What's Been Implemented

### Core Features (Completed)
- User registration with email/password and Google OAuth
- Cascading dropdowns for Province -> District -> Facility on registration
- Phone number field in user profiles
- User dashboard for clocking in/out with GPS capture
- Area of Allocation (Facility/Outreach) selection at clock-in time
- Admin dashboard with real-time monitoring, user management, attendance records
- Map view (Leaflet) showing staff GPS locations
- CSV/Excel report export
- Email backup via Resend
- PWA setup (icons, service worker)
- Attendance history page

### Super User Feature (Completed - March 2026)
- Separate `/superuser` dashboard page with dark theme
- **User Management:** List, search, filter by role, change roles (user/admin/superuser), delete users, reset passwords
- **Facility Management:** CRUD operations for healthcare facilities
- **Shift Configuration:** Manually input/edit shift times (morning, afternoon, night, 4-off) with grace period
- **Attendance Reports:** Color-coded late/early/on-time status with summary cards
- **Export:** CSV and Excel exports with scope filtering
- **Access Control:** Proper role-based access (superuser > admin > user)
- **Bootstrap:** One-time promotion endpoint when no superusers exist
- `dcchinjamba@gmail.com` promoted to superuser
- 100% test pass rate (29/29 tests)

### Bug Fix: Facilities Sync (March 2026)
- Fixed: Facilities added via Super User now appear in registration dropdowns
- Updated `/api/facilities/{district}` and `/api/districts/{province}` to merge hardcoded + DB data
- Updated registration and complete-registration validation to accept DB-stored facilities
- Added search, province filter, and district filter to Super User Facilities tab
- 100% test pass rate (11/11 tests)

### Reports Filters Enhancement (March 2026)
- Added cascading Province → District → Facility dropdown filters to Reports tab
- Added search bar for filtering records by staff name, facility, or position
- Summary cards dynamically update based on filtered results
- Clear button resets all filters; export buttons pass filters to API
- 100% test pass rate (23/23 tests)

## User Roles
1. **User** - Can clock in/out, view history
2. **Admin** - Can view all users, attendance, export reports, send backups
3. **Super User** - Full control: manage users/roles, facilities, shifts, enhanced reports

## Key API Endpoints
- Auth: `/api/auth/{register, login, logout, session, me, complete-registration}`
- Attendance: `/api/attendance`, `/api/attendance/me`, `/api/attendance/status`, `/api/attendance/sync`
- Admin: `/api/admin/{users, attendance, attendance/realtime, export, send-backup}`
- Super User: `/api/superuser/{stats, users, promote, bootstrap, facilities, shifts, attendance-report, export, provinces, districts}`
- Data: `/api/{provinces, districts/{province}, facilities/{district}, positions, areas}`

## DB Collections
- `users` - User profiles with role field
- `attendance` - Clock in/out records with GPS
- `facilities` - Healthcare facility registry
- `shift_config` - Shift time configuration
- `user_sessions` - Google OAuth sessions

## Prioritized Backlog

### P1 - Next Up
- Robust Offline Sync (full LocalStorage + UI feedback)
- Automated Email Backups scheduling

### P2 - Future
- Backend refactoring (break server.py monolith into modules)
- Enhanced map features
- Notification system for late arrivals
