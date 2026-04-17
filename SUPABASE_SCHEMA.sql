create table users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique,
  monthly_income numeric not null default 0,
  risk_appetite int check (risk_appetite between 1 and 5) default 3,
  phone text,
  password_hash text,
  avatar_url text,
  auth_provider text default 'credentials',
  google_id text unique,
  onboarding_complete boolean default false,
  created_at timestamp default now()
);

-- Run this if you already created the table without auth columns:
-- alter table users add column if not exists password_hash text;
-- alter table users add column if not exists avatar_url text;
-- alter table users add column if not exists auth_provider text default 'credentials';
-- alter table users add column if not exists google_id text unique;
-- alter table users add column if not exists onboarding_complete boolean default false;

create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  amount numeric not null,
  merchant text not null,
  category text not null,
  date date not null,
  note text default '',
  created_at timestamp default now()
);

create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  title text not null,
  target_amount numeric not null,
  current_savings numeric default 0,
  deadline_months int not null,
  daily_save_required numeric,
  narrative text,
  status text default 'active',
  created_at timestamp default now()
);

create table portfolio_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  risk_score int,
  allocation jsonb,
  instruments jsonb,
  sip_amount numeric,
  reasoning text,
  macro_note text,
  created_at timestamp default now()
);

create table nudge_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  merchant text,
  amount numeric,
  category text,
  nudge_message text,
  user_action text,
  created_at timestamp default now()
);
