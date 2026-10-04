"use client";

import Link from "next/link";
import Script from "next/script";
import { FormEvent, useMemo, useState } from "react";
import { createPublicSupabaseClient } from "@/lib/supabase";
import styles from "./free-quote-form.module.css";

const services = [
  "Residential Construction & Renovation",
  "Commercial Construction & Renovation",
  "Interior & Exterior Painting",
  "Roof Restoration",
  "Gutter Installation, Repair & Replacement",
  "Tiling",
  "Wall Rendering",
  "General Carpentry",
];

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const maxBytes = 10 * 1024 * 1024;
const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || "";

export function FreeQuoteForm() {
  const supabase = useMemo(() => createPublicSupabaseClient(), []);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (String(data.get("company") || "").trim()) return;

    const files = data.getAll("attachments").filter((item): item is File => item instanceof File && item.size > 0);
    if (files.length > 5) return setMessage("Please attach no more than 5 files.");
    for (const file of files) {
      if (!allowedTypes.has(file.type)) return setMessage("Attachments must be JPG, PNG, WebP or PDF.");
      if (file.size > maxBytes) return setMessage(`${file.name} is larger than 10 MiB.`);
    }

    const phone = String(data.get("phone") || "").trim();
    const email = String(data.get("email") || "").trim();
    if (!phone && !email) return setMessage("Add a phone number or email address.");
    if (turnstileSiteKey && !String(data.get("cf-turnstile-response") || "").trim()) {
      return setMessage("Please complete the anti-spam check.");
    }

    setBusy(true);
    setMessage("");
    const { data: response, error } = await supabase.functions.invoke("submit-enquiry", { body: data });
    setBusy(false);

    if (error) {
      setMessage("We could not send your enquiry right now. Please try again or contact VIC Premier directly.");
      return;
    }

    if (!response?.ok) {
      setMessage(response?.error || "We could not send your enquiry. Please check the form and try again.");
      return;
    }

    setMessage("Thanks — your project enquiry has been received. VIC Premier can now review the details and contact you about the next step.");
    form.reset();
    if (turnstileSiteKey) {
      const turnstile = (window as typeof window & { turnstile?: { reset: () => void } }).turnstile;
      turnstile?.reset();
    }
  }

  return (
    <>
      {turnstileSiteKey ? <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer /> : null}
      <form className={styles.form} onSubmit={submit}>
        <div className={styles.row}>
          <label>Full name<input name="name" required minLength={2} maxLength={120} /></label>
          <label>Suburb / postcode<input name="suburb" maxLength={160} /></label>
        </div>
        <div className={styles.row}>
          <label>Phone<input name="phone" type="tel" maxLength={40} /></label>
          <label>Email<input name="email" type="email" maxLength={254} /></label>
        </div>
        <label>Service<select name="service" defaultValue=""><option value="">Select a service</option>{services.map((service) => <option key={service}>{service}</option>)}</select></label>
        <label>Tell us about the work<textarea name="description" required minLength={10} maxLength={5000} rows={6} /></label>
        <label>Preferred timeframe<input name="timeframe" placeholder="e.g. Within 1–3 months" maxLength={160} /></label>
        <label>Photos or plans <span className={styles.hint}>Up to 5 files · JPG, PNG, WebP or PDF · 10 MiB each</span><input name="attachments" type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf" /></label>
        {turnstileSiteKey ? <div className="cf-turnstile" data-sitekey={turnstileSiteKey} data-theme="dark" /> : null}
        <label className={styles.consent}><input name="consent" type="checkbox" required /><span>I consent to VIC Premier Construction Team using these details to contact me about this project. See the <Link href="/privacy">privacy notice</Link>.</span></label>
        <label className={styles.honeypot} aria-hidden="true">Company<input name="company" tabIndex={-1} autoComplete="off" /></label>
        <button disabled={busy}>{busy ? "Sending enquiry…" : "Request a free quote ↗"}</button>
        {message ? <p className={styles.message} role="status">{message}</p> : null}
      </form>
    </>
  );
}
