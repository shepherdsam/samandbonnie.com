# RSVP Implementation Plan

## Overview
Add RSVP form to public/index.html. Handle POST submissions with TypeScript serverless function in api/rsvp.ts. Persist data to Turso SQLite database. Matches existing static site structure on Vercel. Final export to Excel via Turso dashboard or query.

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
- Set in .env.local for local dev and in Vercel project settings. Never commit.

## Database Schema
- [x] Create table once via Turso CLI or dashboard:
```
CREATE TABLE rsvps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  attending BOOLEAN NOT NULL,
  guest_count INTEGER NOT NULL DEFAULT 1,
  message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```
Index on created_at if needed later.

## API Handler (api/rsvp.ts)
- Export default async function (req, res).
- Only allow POST. Return 405 otherwise.
- Parse JSON body. Validate required fields: name (string, non-empty), attending (boolean), guest_count (integer >=1).
- Optional: message (string).
- Use createClient from @libsql/client with env vars.
- Execute INSERT with parameters to prevent injection.
- On success: return 200 { success: true, message: "RSVP received" }.
- On validation error: 400 with field errors.
- On DB error: 500, log details.
- Add simple honeypot field check (e.g. hidden "website" input) to block bots.
- No sessions or auth needed.

## Frontend Changes (public/index.html)
- Insert form section matching rustic white/cream style.
- Fields: 
  - Name: text input, required.
  - Attending: radio buttons or select (Yes/No). Use "Yes" / "No" per notes.
  - Number of guests: number input, min 1, default 1, required.
  - Message: textarea, optional.
- Submit button.
- Add hidden honeypot input.
- Add divs for success message and error display.
- JavaScript:
  - On submit: preventDefault.
  - Collect form data into object.
  - fetch POST to /api/rsvp with JSON body and Content-Type header.
  - On 200: hide form, show thank you message with RSVP details echo.
  - On error: display error text, allow retry.
  - Disable button during submit.
- Keep form accessible. No external libs.

## Vercel Configuration
- Existing vercel.json stays minimal. Add nothing unless function routes need explicit config.
- Functions auto-detected from api/ folder.
- Set regions close to Turso primary if possible (Turso has global replicas).

## Local Development
- Run `vercel dev`.
- Submit test data.
- Use Turso shell or dashboard to query SELECT * FROM rsvps.
- Verify env vars load correctly.

## Deployment
- Commit plan.md, package.json, tsconfig.json, api/rsvp.ts, updated index.html.
- `vercel --prod`.
- Confirm env vars set in Vercel dashboard.
- Test live form submission.
- Monitor function logs in Vercel dashboard for errors.

## Post-Launch
- Periodically export CSV from Turso (SELECT ... INTO or dashboard export).
- Import to Excel.
- Add rate limiting or CAPTCHA only if spam appears.
- Delete test RSVPs via Turso before wedding.

## Risks
- Turso free tier sufficient for <1000 rows.
- Concurrent writes rare for RSVP volume. Use simple INSERT.
- Function timeout: keep handler under 5s.
- No durable state in functions: all persistence in Turso.

## Next Steps
Only do one step at a time allowing me to confirm/review progress.
