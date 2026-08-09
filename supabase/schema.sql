-- Apply this once in Supabase: SQL Editor -> New query -> Run.

create extension if not exists pgcrypto;

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  company text not null check (char_length(company) between 1 and 120),
  role text not null check (char_length(role) between 1 and 160),
  location text not null default 'Location not specified' check (char_length(location) <= 120),
  status text not null default 'Saved' check (status in ('Saved', 'Applied', 'Interview', 'Offer')),
  applied_date date,
  next_step text not null default 'Add your next action' check (char_length(next_step) <= 180),
  source text not null default 'Manual entry' check (char_length(source) <= 100),
  resume text not null default 'Not selected' check (char_length(resume) <= 100),
  accent text not null default 'A' check (char_length(accent) = 1),
  job_url text check (job_url is null or char_length(job_url) <= 500),
  notes text check (notes is null or char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.applications enable row level security;

revoke all on table public.applications from anon;
grant select, insert, update, delete on table public.applications to authenticated;

drop policy if exists "Users can read their own applications" on public.applications;
create policy "Users can read their own applications"
on public.applications for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own applications" on public.applications;
create policy "Users can create their own applications"
on public.applications for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own applications" on public.applications;
create policy "Users can update their own applications"
on public.applications for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own applications" on public.applications;
create policy "Users can delete their own applications"
on public.applications for delete to authenticated
using ((select auth.uid()) = user_id);

create index if not exists applications_user_status_idx
  on public.applications (user_id, status);

create index if not exists applications_user_updated_idx
  on public.applications (user_id, updated_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists applications_set_updated_at on public.applications;
create trigger applications_set_updated_at
before update on public.applications
for each row execute function public.set_updated_at();
