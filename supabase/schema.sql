-- Botaköz — database schema + Row Level Security
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
-- Safe to re-run: it drops and recreates the objects it owns.

-- ──────────────────────────────────────────────────────────────
-- 1. Tables
-- ──────────────────────────────────────────────────────────────

-- One row per user, created automatically on signup (see trigger below).
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  email         text,
  base_currency text not null default 'KZT',   -- amounts are stored in this base
  locale        text not null default 'ru',    -- 'kz' | 'ru' | 'en'
  created_at    timestamptz not null default now()
);

-- Every income/expense entry. amount_kzt is the base-currency value.
create table if not exists public.transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  type        text not null check (type in ('income', 'expense')),
  category    text not null,                    -- income | kaspi | rent | utilities | tariff | road | debts | other
  amount_kzt  numeric(14, 2) not null check (amount_kzt >= 0),
  note        text not null default '',
  occurred_on date not null,
  created_at  timestamptz not null default now()
);

-- The "big goals" with progress.
create table if not exists public.goals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  key         text not null,                    -- kaspi | downpayment | teeth | chinese | <custom>
  title       text,
  target_kzt  numeric(14, 2) not null check (target_kzt >= 0),
  saved_kzt   numeric(14, 2) not null default 0 check (saved_kzt >= 0),
  color       text not null default '#a78bfa',
  created_at  timestamptz not null default now()
);

-- User-created categories (defaults live in code; these are the custom ones).
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  type       text not null check (type in ('income', 'expense')),
  name       text not null,
  icon       text not null default 'tag',
  color      text not null default '#a78bfa',
  created_at timestamptz not null default now()
);

-- Recurring rules that auto-generate transactions each month (salary, rent…).
create table if not exists public.recurring (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  type         text not null check (type in ('income', 'expense')),
  category     text not null,
  amount_kzt   numeric(14, 2) not null check (amount_kzt >= 0),
  note         text not null default '',
  day_of_month int not null check (day_of_month between 1 and 31),
  last_ym      text,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

-- Per-category monthly spending limits (one row per category per user).
create table if not exists public.budgets (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  category   text not null,
  limit_kzt  numeric(14, 2) not null check (limit_kzt >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, category)
);

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, occurred_on desc);
create index if not exists goals_user_idx
  on public.goals (user_id);
create index if not exists categories_user_idx
  on public.categories (user_id);

-- ──────────────────────────────────────────────────────────────
-- 2. Row Level Security — each user can touch ONLY their own rows
-- ──────────────────────────────────────────────────────────────
alter table public.profiles     enable row level security;
alter table public.transactions enable row level security;
alter table public.goals        enable row level security;
alter table public.categories   enable row level security;
alter table public.budgets      enable row level security;
alter table public.recurring    enable row level security;

drop policy if exists "own profile"      on public.profiles;
drop policy if exists "own transactions" on public.transactions;
drop policy if exists "own goals"        on public.goals;
drop policy if exists "own categories"   on public.categories;
drop policy if exists "own budgets"      on public.budgets;
drop policy if exists "own recurring"    on public.recurring;

create policy "own budgets" on public.budgets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own recurring" on public.recurring
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "own transactions" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own goals" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own categories" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────
-- 3. On signup: auto-create the profile and seed the 4 big goals
-- ──────────────────────────────────────────────────────────────
-- On signup: create ONLY the profile. No seeded goals/transactions —
-- every user starts with a blank slate and adds their own.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
