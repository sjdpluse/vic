# Phase 8 integrations

This phase completes enquiry notification and anti-spam hardening without changing the public business claims.

## Current production origin

- `https://vicpremier.vercel.app`

## Planned canonical origin

- `https://vicpremierconstructionteam.au`
- optional `https://www.vicpremierconstructionteam.au`

## Supabase Edge Function secrets

Required for email notifications:

- `RESEND_API_KEY`
- `ENQUIRY_NOTIFICATION_FROM`
- optional `ENQUIRY_NOTIFICATION_TO` (defaults to the verified VIC Premier business email in the function)

Required for Turnstile enforcement:

- `TURNSTILE_SECRET_KEY`

Optional origin override:

- `ALLOWED_ORIGINS`

The Edge Function also supports a safe built-in allowlist for the current Vercel production URL and the planned custom domain.

## Vercel public environment

Required for Turnstile widget rendering:

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`

Do not place `TURNSTILE_SECRET_KEY` or `RESEND_API_KEY` in any `NEXT_PUBLIC_*` variable.
