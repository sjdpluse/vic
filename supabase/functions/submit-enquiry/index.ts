import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const maxBytes = 10 * 1024 * 1024;
const maxFiles = 5;
const windowMinutes = 15;
const maxRequestsPerWindow = 5;
const defaultAllowedOrigins = [
  "https://vicpremier.vercel.app",
  "https://vicpremierconstructionteam.au",
  "https://www.vicpremierconstructionteam.au",
];
const defaultTurnstileHostnames = new Set([
  "vicpremier.vercel.app",
  "vicpremierconstructionteam.au",
  "www.vicpremierconstructionteam.au",
]);

function configuredOrigins() {
  const configured = (Deno.env.get("ALLOWED_ORIGINS") || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return configured.length ? configured : defaultAllowedOrigins;
}

function corsHeaders(origin: string | null) {
  const allowed = configuredOrigins();
  const allowedOrigin = origin && allowed.includes(origin) ? origin : allowed[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });
}

function clean(value: FormDataEntryValue | null, max: number) {
  const result = typeof value === "string" ? value.trim() : "";
  return result.slice(0, max);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  }[char] || char));
}

async function hashIp(ip: string) {
  const salt = Deno.env.get("RATE_LIMIT_SALT") || "vic-premier-enquiry";
  const bytes = new TextEncoder().encode(`${salt}:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function verifyTurnstile(token: string, ip: string, origin: string | null) {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
  if (!secret) return true;
  if (!token) return false;

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token, remoteip: ip }),
  });
  if (!response.ok) return false;

  const result = await response.json() as { success?: boolean; hostname?: string };
  if (result.success !== true || !result.hostname) return false;

  const expectedHostname = origin ? new URL(origin).hostname : null;
  if (expectedHostname && result.hostname !== expectedHostname) return false;

  return defaultTurnstileHostnames.has(result.hostname);
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(origin) });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405, origin);

  const allowedOrigins = configuredOrigins();
  if (!origin || !allowedOrigins.includes(origin)) {
    return json({ ok: false, error: "Origin not allowed." }, 403, origin);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return json({ ok: false, error: "Service unavailable." }, 503, origin);
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  try {
    const form = await req.formData();
    if (clean(form.get("company"), 200)) return json({ ok: true }, 200, origin);

    const name = clean(form.get("name"), 120);
    const phone = clean(form.get("phone"), 40);
    const email = clean(form.get("email"), 254);
    const suburb = clean(form.get("suburb"), 160);
    const service = clean(form.get("service"), 160);
    const description = clean(form.get("description"), 5000);
    const timeframe = clean(form.get("timeframe"), 160);
    const consent = form.get("consent") === "on" || form.get("consent") === "true";
    const files = form.getAll("attachments").filter((item): item is File => item instanceof File && item.size > 0);

    if (name.length < 2 || description.length < 10 || !consent || (!phone && !email)) {
      return json({ ok: false, error: "Please complete the required project and contact details." }, 400, origin);
    }
    if (files.length > maxFiles) return json({ ok: false, error: "Please attach no more than 5 files." }, 400, origin);
    for (const file of files) {
      if (!allowedTypes.has(file.type) || file.size > maxBytes) {
        return json({ ok: false, error: "One or more attachments are not allowed." }, 400, origin);
      }
    }

    const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const ipHash = await hashIp(ip);
    const since = new Date(Date.now() - windowMinutes * 60_000).toISOString();
    const { count: recentCount } = await admin
      .from("enquiry_rate_limits")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", since);
    if ((recentCount || 0) >= maxRequestsPerWindow) {
      return json({ ok: false, error: "Too many requests. Please wait and try again." }, 429, origin);
    }
    await admin.from("enquiry_rate_limits").insert({ ip_hash: ipHash });

    const turnstileToken = clean(form.get("cf-turnstile-response"), 4096);
    if (!(await verifyTurnstile(turnstileToken, ip, origin))) {
      return json({ ok: false, error: "Anti-spam verification failed. Please try again." }, 400, origin);
    }

    const enquiryId = crypto.randomUUID();
    const { error: enquiryError } = await admin.from("enquiries").insert({
      id: enquiryId,
      name,
      phone: phone || null,
      email: email || null,
      suburb_postcode: suburb || null,
      service: service || null,
      project_description: description,
      preferred_timeframe: timeframe || null,
      consent: true,
      status: "new",
      notification_status: "not_configured",
    });
    if (enquiryError) throw enquiryError;

    const uploaded: string[] = [];
    try {
      for (const file of files) {
        const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").slice(0, 140) || "attachment";
        const path = `${enquiryId}/${crypto.randomUUID()}-${safeName}`;
        const { error: uploadError } = await admin.storage.from("enquiry-media").upload(path, file, {
          contentType: file.type,
          upsert: false,
        });
        if (uploadError) throw uploadError;
        uploaded.push(path);
        const { error: mediaError } = await admin.from("enquiry_media").insert({
          enquiry_id: enquiryId,
          storage_path: path,
          original_name: file.name.slice(0, 255),
          mime_type: file.type,
          size_bytes: file.size,
        });
        if (mediaError) throw mediaError;
      }
    } catch (error) {
      if (uploaded.length) await admin.storage.from("enquiry-media").remove(uploaded);
      await admin.from("enquiries").delete().eq("id", enquiryId);
      throw error;
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const from = Deno.env.get("ENQUIRY_NOTIFICATION_FROM");
    const to = Deno.env.get("ENQUIRY_NOTIFICATION_TO") || "vicpremier_constructionteam@yahoo.com";
    if (resendKey && from) {
      try {
        const mailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from,
            to: [to],
            subject: `New VIC Premier enquiry — ${name}`,
            html: `<h2>New project enquiry</h2><p><strong>Name:</strong> ${escapeHtml(name)}</p><p><strong>Phone:</strong> ${escapeHtml(phone || "—")}</p><p><strong>Email:</strong> ${escapeHtml(email || "—")}</p><p><strong>Suburb / postcode:</strong> ${escapeHtml(suburb || "—")}</p><p><strong>Service:</strong> ${escapeHtml(service || "General enquiry")}</p><p><strong>Timeframe:</strong> ${escapeHtml(timeframe || "—")}</p><p><strong>Project:</strong><br>${escapeHtml(description).replace(/\n/g, "<br>")}</p><p>${files.length} attachment(s) are available in the private admin inbox.</p>`,
          }),
        });
        if (!mailResponse.ok) throw new Error(`Resend returned ${mailResponse.status}`);
        await admin.from("enquiries").update({ notification_status: "sent", notified_at: new Date().toISOString(), notification_error: null }).eq("id", enquiryId);
      } catch (error) {
        await admin.from("enquiries").update({ notification_status: "failed", notification_error: String(error).slice(0, 500) }).eq("id", enquiryId);
      }
    }

    return json({ ok: true, enquiryId }, 200, origin);
  } catch (error) {
    console.error(error);
    return json({ ok: false, error: "We could not save your enquiry right now. Please try again." }, 500, origin);
  }
});
