-- Ledgerline self-host schema. Tables prefixed ll_ so they never clash with other apps.
create extension if not exists pgcrypto;
create table if not exists ll_projects (
  key text primary key check (key ~ '^[A-Z][A-Z0-9]{1,9}$'),
  name text not null,
  description text not null default '',
  next_seq bigint not null default 0,
  created_at timestamptz not null default now()
);
insert into ll_projects (key, name, description) values ('LL', 'Ledgerline', 'Default project') on conflict do nothing;
create table if not exists ll_sprints (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  goal text not null default '',
  state text not null default 'planned' check (state in ('planned','active','closed')),
  starts_on date, ends_on date,
  created_at timestamptz not null default now()
);
create unique index if not exists ll_one_active_sprint on ll_sprints ((state)) where state = 'active';
create table if not exists ll_issues (
  id uuid primary key default gen_random_uuid(),
  project_key text not null references ll_projects(key),
  parent_key text,
  key text not null unique,
  title text not null,
  description text not null default '',
  type text not null default 'task' check (type in ('task','bug','story','epic')),
  status text not null default 'todo' check (status in ('todo','in_progress','in_review','done')),
  priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  assignee text,
  sprint_id uuid references ll_sprints(id) on delete set null,
  labels text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists ll_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  body text not null default '',
  parent_slug text,
  updated_by text not null default 'system',
  updated_at timestamptz not null default now()
);
create table if not exists ll_audit (
  id bigserial primary key,
  actor text not null,
  action text not null,
  target text,
  at timestamptz not null default now()
);
create index if not exists ll_issues_parent on ll_issues (parent_key);
create table if not exists ll_comments (
  id uuid primary key default gen_random_uuid(),
  issue_key text not null references ll_issues(key) on delete cascade,
  author text not null,
  body text not null,
  created_at timestamptz not null default now()
);
create table if not exists ll_links (
  id uuid primary key default gen_random_uuid(),
  from_key text not null references ll_issues(key) on delete cascade,
  to_key text not null references ll_issues(key) on delete cascade,
  type text not null check (type in ('blocks','relates','duplicates'))
);
create table if not exists ll_page_versions (
  id bigserial primary key,
  slug text not null references ll_pages(slug) on delete cascade,
  title text not null,
  body text not null,
  saved_at timestamptz not null,
  saved_by text not null
);
