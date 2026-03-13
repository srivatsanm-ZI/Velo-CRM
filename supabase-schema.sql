-- ============================================================
-- Clarity CRM — Supabase Database Schema
-- Run this entire script in Supabase → SQL Editor → New Query
-- ============================================================

-- CONTACTS TABLE
create table if not exists contacts (
  id              uuid default gen_random_uuid() primary key,
  first_name      text not null,
  last_name       text not null,
  email           text,
  job_title       text,
  company_name    text,
  phone           text,
  mobile_phone    text,
  city            text,
  state           text,
  country         text default 'US',
  department      text,
  seniority       text,
  linkedin_url    text,
  zi_person_id    text,
  zi_company_id   text,
  enriched        boolean default false,
  enriched_at     timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- COMPANIES TABLE
create table if not exists companies (
  id              uuid default gen_random_uuid() primary key,
  name            text not null,
  website         text,
  industry        text,
  employees       text,
  revenue         text,
  city            text,
  state           text,
  country         text default 'US',
  phone           text,
  description     text,
  founded         text,
  ticker          text,
  zi_company_id   text,
  enriched        boolean default false,
  enriched_at     timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- NOTES TABLE
create table if not exists notes (
  id          uuid default gen_random_uuid() primary key,
  content     text not null,
  type        text default 'note' check (type in ('note','call','email','meeting')),
  contact_id  uuid references contacts(id) on delete cascade,
  company_id  uuid references companies(id) on delete cascade,
  created_at  timestamptz default now()
);

-- INDEXES for fast search
create index if not exists idx_contacts_email       on contacts(email);
create index if not exists idx_contacts_company     on contacts(company_name);
create index if not exists idx_contacts_enriched    on contacts(enriched);
create index if not exists idx_companies_name       on companies(name);
create index if not exists idx_companies_enriched   on companies(enriched);
create index if not exists idx_notes_contact        on notes(contact_id);
create index if not exists idx_notes_company        on notes(company_id);

-- ROW LEVEL SECURITY (keeps your data private)
alter table contacts  enable row level security;
alter table companies enable row level security;
alter table notes     enable row level security;

-- Allow all operations using your anon key (single-user setup)
-- If you add auth later, change these policies
create policy "Allow all contacts"  on contacts  for all using (true) with check (true);
create policy "Allow all companies" on companies for all using (true) with check (true);
create policy "Allow all notes"     on notes     for all using (true) with check (true);

-- Done! You should see 3 tables in your Table Editor.
