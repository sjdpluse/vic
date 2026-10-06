# VIC Premier launch checklist

## Content
- Confirm public service, About, Contact and quote content uses verified client-supplied information.
- Keep unverified licensing, registration, warranty, insurance, award, review, rating, years-of-experience and project claims off the site.

## Domain and Vercel
- Purchase `vicpremierconstructionteam.au` in the business owner's details.
- Add the apex domain to the Vercel project; optionally add `www.vicpremierconstructionteam.au` and choose one canonical redirect target.
- Wait for Vercel DNS/SSL status to become valid.
- Set Production `NEXT_PUBLIC_SITE_URL=https://vicpremierconstructionteam.au`.
- Do not set the production site URL on Preview deployments if previews should remain non-indexable.
- Redeploy after environment changes.

## Cloudflare Turnstile
- Add `vicpremierconstructionteam.au` to the existing Turnstile widget hostname list before switching traffic.
- Add `www.vicpremierconstructionteam.au` only if that hostname will serve the site.
- Keep `TURNSTILE_SECRET_KEY` in Supabase secrets and `NEXT_PUBLIC_TURNSTILE_SITE_KEY` in Vercel only.
- Submit a production enquiry after the domain cutover and confirm it appears in `/admin/enquiries`.

## Supabase / enquiry security
- Confirm the `submit-enquiry` Edge Function is active with JWT verification enabled.
- Confirm direct anonymous inserts to `enquiries`, `enquiry_media` and enquiry storage remain disabled.
- Confirm attachments remain private and admin signed links still work.
- Periodically clean old `enquiry_rate_limits` rows if growth becomes material.

## Email notifications
- Verify the custom domain with Resend after the domain is purchased.
- Create a verified sender address on that domain.
- Set `RESEND_API_KEY`, `ENQUIRY_NOTIFICATION_FROM` and optional `ENQUIRY_NOTIFICATION_TO` in Supabase secrets.
- Submit a real production test and confirm `notification_status=sent` in the admin inbox.

## SEO launch
- Confirm `robots.txt` allows public pages and blocks `/admin` only after `NEXT_PUBLIC_SITE_URL` is set.
- Confirm `/sitemap.xml` includes the homepage, services, contact and privacy routes.
- Confirm page metadata and canonical URLs resolve to the purchased domain.
- Add the site to Google Search Console and submit the sitemap only after the custom domain is live.

## Final QA
- Desktop and mobile: hero sequence, navigation, services, Selected Work, About, contact, privacy and quote form.
- Keyboard: focus visibility, mobile menu, service carousel controls, Selected Work comparison controls and admin controls.
- Reduced motion: verify the hero fallback remains usable.
- Test phone and email links.
- Confirm no secrets are exposed in client bundles or committed files.
