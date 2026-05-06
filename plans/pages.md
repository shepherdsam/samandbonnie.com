# Next.js App Router Conversion Plan

## IMPORTANT AGENT INSTRUCTIONS
Keep track of progress using checkboxes in the file. Only do one step at a time allowing me to confirm/review progress.

## Overview
Convert static HTML site (public/index.html and public/address.html) with embedded RSVP form and Vercel function (api/rsvp.ts) to Next.js 14+ using App Router. Preserve exact rustic style: colors (--cream #f8f4eb, --soft-white #fffaf0, --rustic-brown #5c4634, --accent-tan #8a6f4f), fonts (Playfair Display and Libre Baskerville via Google), layout, header, and footer. Add persistent horizontal menu on all pages. Extract RSVP to dedicated page. Expand Details. Add Registry page with cash gift options.

Current site uses Vercel for hosting and Turso for RSVP storage. Retain that. Follow Vercel best practices: stateless functions, env vars for secrets, no KV.

## Project Initialization
- Run `npx create-next-app@latest . --yes` to bootstrap (overwrites minimal package.json but preserves deps like @libsql/client).
- Update package.json scripts: "dev": "next dev", "build": "next build", "start": "next start", "lint": "next lint".
- Keep tsconfig.json (adjust for Next.js defaults if needed). Add "paths" for @/ alias.
- Install: `npm install next react react-dom` (if not auto), `@types/react @types/react-dom` as dev.
- Add tailwind? No. Keep custom CSS in app/globals.css to match existing exactly. Extract root vars, body styles, .header, .hero, .address-form-btn, .rsvp-* classes verbatim.
- Migrate Google font imports to next/font/google in layout for performance.

## App Router Structure
app/
- layout.tsx: Root layout. Include <html>, <body>. Shared Header component with logo, horizontal Menu component (links to Home, RSVP, Details, Registry using next/link), Footer component. Metadata: title "Bonnie & Sam • June 13, 2026", description, viewport.
- page.tsx: Home/Landing. Replicate current hero: date/time/venue, rustic line, registry button (link to registry page or external). Keep tagline. Remove embedded RSVP (moved to /rsvp).
- rsvp/page.tsx: Dedicated RSVP page. Copy form section exactly from index.html #rsvp (h2, intro, form fields: name, attending radios, guest_count, message, honeypot, submit). Include all scoped CSS and JS logic (radio listeners, guest count toggle, form submit with fetch to /api/rsvp, success/error messages). Make form interactive via 'use client' React component. Form action or client fetch to API.
- details/page.tsx: Details page. Full venue address: 8220 Langdon Leake Ct, Granbury, Texas 76049. Add hotel accommodations section (placeholder for recommended hotels near Fall Creek Ranch, e.g., list 2-3 options with links/prices if provided). Reuse hero styles, rustic elements. Include address form link if still relevant.
- registry/page.tsx: Registry page. Link to main: https://www.myregistry.com/giftlist/bonnieandsam. Section for cash gifts: CashApp ($username), Venmo (@username), PayPal (email or link), Bitcoin (address). Use same button/link styles. Keep rustic aesthetic.
- api/rsvp/route.ts: Migrate from api/rsvp.ts. Use Next.js route handlers (export async function POST(req)). Fix missing imports (use NextRequest, NextResponse from 'next/server' instead of Vercel types). Keep all logic: honeypot, validation, Turso client insert, responses. Use process.env.TURSO_* (set via Vercel env, never commit).
- globals.css: Extract all <style> from index.html and address.html. Scope to avoid conflicts. Add menu styles: horizontal nav, flex, links with accent color on hover/active.

## Shared Components
- components/Header.tsx: Logo "Bonnie & Sam" in Playfair, same padding/shadow.
- components/Footer.tsx: "Built with love by Sam and Grok", same styles.
- components/Menu.tsx: Horizontal nav bar. Links: Home (/), RSVP (/rsvp), Details (/details), Registry (/registry). Use Next.js Link. Style: flex, gap, font size matching body, hover to rustic-brown. Place in layout below header.
- components/RSVPForm.tsx: Extract form for reuse if needed, but since single page, inline in rsvp/page.

## Style and Design Consistency
- Replicate all CSS rules exactly. No changes to colors, spacing, shadows, button .address-form-btn transitions.
- Mobile responsive: keep @media queries.
- No new design elements unless specified. Horizontal menu: simple <nav> with <ul> or flex <a>, no dropdowns.
- For images/assets: move any future to public/, use / path. Current site has none beyond inline.

## Data and API
- Retain Turso integration for RSVPs. Schema unchanged.
- In Next.js dev: use .env.local (blocked per security, set locally).
- API route handles POST only, validation, DB insert, JSON responses.
- Form on /rsvp uses client-side JS or React state for attending toggle and submit (disable button, show messages).
- No changes to honeypot or error handling.

## Navigation and Routing
- Horizontal menu visible on every page via layout.
- Use app router file-based: / for home, /rsvp, /details, /registry.
- External links (registry, address form, hotels) open in new tab with target="_blank".
- Update any old vercel.json rewrites if needed (remove /address since now /details).

## Development and Deployment
- Local: `npm run dev`. Test form submit, navigation, all pages render matching original.
- Build: `npm run build`. Verify no TypeScript errors, CSS loads.
- Vercel: Auto deploys on push. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in project env vars (not .env files in repo).
- Region: Set function region close to Turso DB.
- Test: Submit RSVP, query Turso, check menu active states if added (via pathname).
- Post: Export RSVPs same as before.

## Migration Steps
- [x] 1. Bootstrap Next.js and install deps.
- [x] 2. Create app/layout.tsx with header/menu/footer.
- [x] 3. Port home page content.
- [x] 4. Create rsvp page with exact form copy + interactivity.
- [x] 5. Create details page with address + hotels.
- [x] 6. Create registry page with links and cash details.
- [x] 7. Migrate and fix API route.
- [ ] 8. Extract and centralize CSS.
- [ ] 9. Test locally and deploy.
- [x] 10. Remove old public/*.html, api/rsvp.ts, vercel.json rewrites once verified.

