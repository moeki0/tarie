-- Drop existing table and recreate from scratch
drop table if exists public.books cascade;
drop function if exists public.update_updated_at() cascade;

-- Books table: core entity for photo books
create table public.books (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  manuscript text not null default '',
  style_spans jsonb not null default '[]'::jsonb,

  -- Publishing fields
  -- visibility: 'draft' (default, owner only), 'url_only', 'password', 'private'
  visibility text not null default 'draft',
  published_manuscript text,
  published_style_spans jsonb,
  published_at timestamptz,
  share_password text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index: list books by owner, newest first
create index idx_books_owner on public.books (owner_id, created_at desc);

-- Auto-update updated_at on row change
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger books_updated_at
  before update on public.books
  for each row execute function public.update_updated_at();

-- RLS: enable but managed via service role key from API routes
alter table public.books enable row level security;
