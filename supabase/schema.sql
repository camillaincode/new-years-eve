-- Esegui questo script in Supabase > SQL Editor.
create table if not exists public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  contact_name text not null,
  contact text not null,
  group_size integer not null check (group_size between 1 and 40),
  participants jsonb not null,
  privacy_consent boolean not null check (privacy_consent = true)
);

alter table public.booking_requests enable row level security;

-- Nessuna policy pubblica SELECT/INSERT/UPDATE/DELETE:
-- il browser anonimo non può leggere né scrivere direttamente nella tabella.
-- La Edge Function usa la service-role key lato server e può inserire la richiesta.
