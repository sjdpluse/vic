"use client";

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

    setBusy(true);
    setMessage("");
    const enquiryId = crypto.randomUUID();
    const { error: enquiryError } = await supabase.from("enquiries").insert({
      id: enquiryId,
      name: String(data.get("name") || "").trim(),
      phone: phone || null,
      email: email || null,
      suburb_postcode: String(data.get("suburb") || "").trim() || null,
      service: String(data.get("service") || "").trim() || null,
      project_description: String(data.get("description") || "").trim(),
      preferred_timeframe: String(data.get("timeframe") || "").trim() || null,
      consent: data.get("consent") === "on",
      status: "new",
    });

    if (enquiryError) {
      setBusy(false);
      setMessage(enquiryError.message);
      return;
    }

    for (const file of files) {
      const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
      const path = `${enquiryId}/${crypto.randomUUID()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from("enquiry-media").upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) {
        setBusy(false);
        setMessage(`Your enquiry was saved, but ${file.name} could not be uploaded. Please contact us if the file is important.`);
        form.reset();
        return;
      }
      const { error: mediaError } = await supabase.from("enquiry_media").insert({
        enquiry_id: enquiryId,
        storage_path: path,
        original_name: file.name,
        mime_type: file.type,
        size_bytes: file.size,
      });
      if (mediaError) {
        setBusy(false);
        setMessage(`Your enquiry was saved, but one attachment could not be registered. Please contact us if needed.`);
        form.reset();
        return;
      }
    }

    setBusy(false);
    setMessage("Thanks — your project enquiry has been received. VIC Premier can now review the details and contact you about the next step.");
    form.reset();
  }

  return (
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
      <label className={styles.consent}><input name="consent" type="checkbox" required /><span>I consent to VIC Premier Construction Team using these details to contact me about this project.</span></label>
      <label className={styles.honeypot} aria-hidden="true">Company<input name="company" tabIndex={-1} autoComplete="off" /></label>
      <button disabled={busy}>{busy ? "Sending enquiry…" : "Request a free quote ↗"}</button>
      {message ? <p className={styles.message} role="status">{message}</p> : null}
    </form>
  );
}
