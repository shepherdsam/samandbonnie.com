# RSVP Implementation Plan

## IMPORTANT AGENT INSTRUCTIONS
Keep track of progress using checkboxes in the file. Only do one step at a time allowing me to confirm/review progress.

## Overview
Add RSVP form to public/index.html. Handle POST submissions with TypeScript serverless function in api/rsvp.ts. Persist data to Turso SQLite database. Matches existing static site structure on Vercel. Final export to Excel via Turso dashboard or query.

## RSVP
Fields needed:
- Name
- Yes / No: 
- "Number of guests"
- Message (optional)

## Requirements
- Turso account with database created.
- Database URL and auth token ready for env vars.
- TypeScript for the API handler.
- No full framework. Use native Vercel Functions support.

## Project Setup
- [x] 1. Run `npm init -y` in root if no package.json exists.
- [x] 2. Install runtime deps: `npm install @libsql/client`.
- [x] 3. Install TypeScript: `npm install -D typescript @types/node`.
- [x] 4. Create tsconfig.json targeting ES2022, module commonjs, for api/ folder.
- [x] 5. Add .gitignore entries for node_modules, .env*, .vercel if missing.

## Environment Variables
- TURSO_DATABASE_URL: full libsql:// or https:// URL from Turso.
- TURSO_AUTH_TOKEN: auth token from Turso.
- Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in .env.local for development and in the Vercel project’s Environment Variables. Never commit actual token/URLs to the repository.

## Database Schema
- [x] Create table via Turso CLI or web dashboard (one-time):
```sql
CREATE TABLE rsvps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  attending BOOLEAN NOT NULL,
  guest_count INTEGER NOT NULL DEFAULT 1,
  message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```
Later, consider adding an index on created_at if high row counts.

## API Handler (api/rsvp.ts)
- [x] Export default async function (req, res).
- [x] Only allow POST. Return 405 otherwise.
- [x] Parse JSON body. Validate required fields: name (string, non-empty), attending (boolean), guest_count (integer >=1).
- [x] Optional: message (string).
- [x] Use createClient from @libsql/client with env vars.
- [x] Execute INSERT with parameters to prevent injection.
- [x] On success: return 200 { success: true, message: "RSVP received" }.
- [x] On validation error: 400 with field errors.
- [x] On DB error: 500, log details.
- [x] Add simple honeypot field check (e.g. hidden "website" input) to block bots.
- [x] No sessions or auth needed.

**Completed:** Created api/rsvp.ts with full TypeScript handler. Matches spec. Ready for testing once env vars and DB schema are confirmed.

## Frontend Changes (public/index.html)
- [x] Insert form section using existing layout classes; add minimal scoped CSS classes for RSVP.
- [x] Fields leveraging existing aesthetic classes:
  - Name: input with existing edge/border styles
  - Attending: radio buttons using existing style pattern (inline-displayed labels styled inline)
  - Number of guests: input with existing patterns and min=1 default=1 required
  - Message: textarea with existing border/input style
- [x] Submit button using existing .address-form-btn class
- [x] Add hidden honeypot input (website)
- [x] Add message and error display containers using scoped .rsvp-message/.rsvp-success/.rsvp-error with existing aesthetic colors and spacing
- [x] JavaScript: preventDefault, collect object from form, fetch POST to /api/rsvp with headers, handle 200/errors, disable button during submit, show/hide messages
- [x] Accessible markup and client-side validation. No external libraries.
- [x] No inline styles; use existing classes and add minimal helpers (e.g., rsvp-section/wrapper, rsvp-input, rsvp-radio-group, rsvp-message containers) scoped within #rsvp.

**Completed:** public/index.html updated with full RSVP form, rustic-scoped CSS, and client-side fetch logic. All per spec.

## Vercel Configuration
- [x] Vercel auto-detects Function routes from api/ folder inside project root.
- [x] Confirm function region and Turso DB region proximity in Vercel settings; adjust if necessary for best latency.

## Local Development
- [x] Run `vercel dev`.
- [x] Submit test RSVP to api/rsvp.
- [x] Query Turso DB via CLI or dashboard: SELECT * FROM rsvps ORDER BY created_at DESC;.
- [x] Verify env vars load via console output from function.

## Deployment
- Commit plan.md, package.json, tsconfig.json, api/rsvp.ts, updated index.html.
- `vercel --prod`.
- Confirm env vars set in Vercel dashboard.
- Test live form submission.
- Monitor function logs in Vercel dashboard for errors.

## Post-Launch
- Periodically export CSV via Turso dashboard or CLI: SELECT * FROM rsvps ORDER BY created_at DESC INTO OUTFILE 'rsvps.csv';
- Import CSV into Excel for review.
- Add Vercel rate limiting or third-party CAPTCHA guard only if spam becomes an issue.
- Clean test RSVPs from Turso before day (use: DELETE FROM rsvps WHERE name='Test...');

## Risks
- Turso free tier sufficient for <1000 rows.
- Concurrent writes rare for RSVP volume. Use simple INSERT.
- Function timeout: keep handler under 5s.
- No durable state in functions: all persistence in Turso.

## Next Steps
- [x] Confirm the RSVP form in public/index.html works with api/rsvp.ts and no console/network errors.

**Plan completed**
