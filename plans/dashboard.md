# Dashboard Implementation Plan

## IMPORTANT AGENT INSTRUCTIONS
Keep track of progress using checkboxes in the file. Only do one step at a time allowing me to confirm/review progress.

## Overview
Internal admin dashboard to view RSVP data from Turso SQLite. Not publicly accessible. Totals and filterable table.

## Tech Stack
- Next.js 16 app router
- @libsql/client for DB access (reuse existing pattern)
- TypeScript
- Client-side filtering with React state or URL search params

## Authentication
- Simple password protection
- Password form that sets httpOnly cookie on successful match against `DASHBOARD_PASSWORD` env var
- Use middleware.ts or server action to gate access
- Redirect unauthenticated users to login page

## Routes & Structure
- `/admin/login` - password entry form
- `/admin/dashboard` - protected dashboard page

## Database Access
- Create `lib/db.ts` helper (or inline)
- Reuse Turso client config from api/rsvp
- Queries:
  - Totals: `SELECT SUM(guest_count) FROM rsvps WHERE attending = 1`
  - `SELECT SUM(guest_count) FROM rsvps WHERE attending = 0`
  - List: `SELECT * FROM rsvps ORDER BY created_at DESC`

## Dashboard UI
- Header: "Bonnie & Sam - RSVP Dashboard"
- Top stats cards:
  - Attending Guests: total count (sum guest_count where attending=true)
  - Declined Guests: total count (sum where attending=false)
- Filters row:
  - Text input: filter by name (case-insensitive partial match)
  - Select: All / Attending / Declined
- Table:
  - Columns: Name, Attending (yes/no), Guests, Message, Submitted
  - Sort: created_at DESC (fixed)
  - Responsive, clean rustic styling matching site (whites/creams)
- Empty state and loading

## Data Flow
- Server component fetches all rows on load (small dataset expected)
- Client component handles filtering/sorting in memory
- Or use URL search params + server re-fetch for shareable filters
- No editing/deleting in v1

## Security & Deployment
- Never expose DB creds or password in client
- Add `DASHBOARD_PASSWORD` to Vercel env
- Unlisted path: /admin or /rsvps (obscure enough)

## Implementation Order
- [x] 1. Add env var and middleware/auth logic (middleware.ts created; set DASHBOARD_PASSWORD in Vercel env; login logic in next step)
- [x] 2. Create /admin route group or pages (login + dashboard stubs + server action)
- [x] 3. Implement DB queries and totals (lib/db.ts + server fetches + stats + table)
- [x] 4. Build table + filters (client-side React filtering by name/status)
- [x] 5. Style and test with real data (polished rustic layout, logout, filters verified)
