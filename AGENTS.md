# AGENTS.md

## Overview 
- Using vercel to deployment and hosting
- Project hosted at https://github.com/shepherdsam/samandbonnie.com
- Storage is SQLite on Turso

## Code
- use 2 space for indention
- TypeScript

## Website Design
- Domain: samandbonnie.com
- Colors: Whites and Creams
- Style: Simple and Rustic
- Title: Bonnie & Sam

## Wedding Details
Saturday, June 13th, 2026 at Fall Creek Ranch 8220 Langdon Leake Ct, Granbury, Texas 76049

<!-- VERCEL BEST PRACTICES START -->
## Best practices for developing on Vercel

These defaults are optimized for AI coding agents (and humans) working on apps that deploy to Vercel.

- Treat Vercel Functions as stateless + ephemeral (no durable RAM/FS, no background daemons), use Blob or marketplace integrations for preserving state
- Edge Functions (standalone) are deprecated; prefer Vercel Functions
- Don't start new projects on Vercel KV/Postgres (both discontinued); use Marketplace Redis/Postgres instead
- Store secrets in Vercel Env Variables; not in git or `NEXT_PUBLIC_*`
- Provision Marketplace native integrations with `vercel integration add` (CI/agent-friendly)
- Sync env + project settings with `vercel env pull` / `vercel pull` when you need local/offline parity
- Use `waitUntil` for post-response work; avoid the deprecated Function `context` parameter
- Set Function regions near your primary data source; avoid cross-region DB/service roundtrips
- Tune Fluid Compute knobs (e.g., `maxDuration`, memory/CPU) for long I/O-heavy calls (LLMs, APIs)
- Use Runtime Cache for fast **regional** caching + tag invalidation (don't treat it as global KV)
- Use Cron Jobs for schedules; cron runs in UTC and triggers your production URL via HTTP GET
- Use Vercel Blob for uploads/media; Use Edge Config for small, globally-read config
<!-- VERCEL BEST PRACTICES END -->
