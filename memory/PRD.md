# V-Chron - The Truth of Time
## Healthcare Attendance Tracking System PRD

### Original Problem Statement
Build a mobile and web MVP application called "V-Chron" with subtitle "The Truth of Time" - a healthcare attendance tracking system for hospitals and clinics. Staff can record reporting time (login) and end-of-shift time (logout) with automatic GPS coordinate capture.

### User Personas
1. **Healthcare Workers** - Nurses, Clinical Officers, Environmental Health Technicians, Doctors
2. **Facility Administrators** - Staff who manage attendance and generate reports
3. **District Health Officers** - Review attendance data across multiple facilities

### Core Requirements (Static)
- User registration with email/password and Google OAuth
- Facility selection from 47 healthcare facilities in Mkushi District
- Report for Duty (Clock In) with GPS capture
- End Shift (Clock Out) with GPS capture
- Offline support with data sync
- Admin dashboard for real-time monitoring
- CSV/Excel export functionality
- Email backup to district office

### What's Been Implemented (January 2026)

#### Authentication
- [x] Email/password registration and login (JWT-based)
- [x] Google OAuth via Emergent Auth
- [x] Session management with secure cookies
- [x] Protected routes

#### User Management
- [x] User registration with position and facility selection
- [x] Complete registration flow for OAuth users
- [x] Admin role management
- [x] User profile display

#### Attendance Features
- [x] Report for Duty button with GPS capture
- [x] End Shift button with GPS capture
- [x] Attendance status tracking (on-duty/off-duty)
- [x] Attendance history view
- [x] Offline attendance recording with local storage
- [x] Automatic sync when online

#### Admin Dashboard
- [x] Real-time staff on-duty count
- [x] Facility breakdown
- [x] Map view with staff locations (Leaflet/OpenStreetMap)
- [x] User management (view, edit, promote to admin)
- [x] Attendance filtering by date, facility, name
- [x] CSV/Excel export

#### Email Backup
- [x] Backend integration with Resend (REQUIRES API KEY)
- [ ] Automatic daily backup (not implemented - manual trigger only)

### Prioritized Backlog

#### P0 - Critical (Next Sprint)
- Email service API key configuration for backup emails
- Promote initial admin user in database

#### P1 - High Priority
- Automatic daily/weekly email backup scheduling
- Mobile app wrapper (React Native or PWA)
- Push notifications for shift reminders

#### P2 - Medium Priority
- Shift scheduling feature
- Leave management
- Report generation (monthly summaries)
- Multi-facility admin views

#### P3 - Low Priority
- Biometric integration
- Timesheet approval workflow
- Integration with payroll systems

### Technical Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Authentication**: JWT + Emergent Google OAuth
- **Maps**: Leaflet with OpenStreetMap (free)
- **Offline**: LocalForage for offline storage

### API Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/session` - Google OAuth session
- `GET /api/auth/me` - Current user
- `POST /api/auth/logout` - Logout
- `GET /api/facilities` - List all facilities
- `GET /api/positions` - List all positions
- `POST /api/attendance` - Record attendance
- `GET /api/attendance/me` - User's attendance history
- `GET /api/attendance/status` - Current attendance status
- `GET /api/admin/users` - Admin: List users
- `PUT /api/admin/users/{id}` - Admin: Update user
- `GET /api/admin/attendance` - Admin: All attendance
- `GET /api/admin/attendance/realtime` - Admin: Real-time stats
- `GET /api/admin/export` - Admin: Export CSV/Excel
- `POST /api/admin/send-backup` - Admin: Send backup email

### Next Action Items
1. Configure Resend API key for email backup functionality
2. Create initial admin user in database
3. Test Google OAuth flow end-to-end
4. Add mobile-responsive testing
