alter table public.enquiries
  add column if not exists notification_status text not null default 'not_configured'
    check (notification_status in ('not_configured','sent','failed')),
  add column if not exists notification_error text,
  add column if not exists notified_at timestamptz;

create table if not exists public.enquiry_rate_limits (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists enquiry_rate_limits_lookup_idx
  on public.enquiry_rate_limits (ip_hash, created_at desc);

alter table public.enquiry_rate_limits enable row level security;
revoke all on public.enquiry_rate_limits from public, anon, authenticated;
