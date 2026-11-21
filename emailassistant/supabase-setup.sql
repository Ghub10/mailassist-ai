-- MailAssist AI — run this once in Supabase SQL Editor
-- Dashboard → SQL Editor → New query → paste → Run

create table if not exists email_tags (
  user_id text not null,
  email_id text not null,
  tag text,
  updated_at timestamptz default now(),
  primary key (user_id, email_id)
);

create table if not exists email_statuses (
  user_id text not null,
  email_id text not null,
  status text not null,
  updated_at timestamptz default now(),
  primary key (user_id, email_id)
);

create table if not exists user_preferences (
  user_id text primary key,
  display_name text,
  tone text default 'professional',
  updated_at timestamptz default now()
);

create table if not exists reply_history (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  subject text,
  body_snippet text,
  reply_text text,
  sent_at timestamptz default now()
);

-- MVP: allow the anon key to read/write (no Supabase Auth yet).
-- Tighten with Row Level Security once you add real auth.
alter table email_tags disable row level security;
alter table email_statuses disable row level security;
alter table user_preferences disable row level security;
alter table reply_history disable row level security;
