-- Reports
create table reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('pre', 'post', 'player')),
  type_label text not null,
  title text not null,
  competition text default '',
  date text default '',
  sources text[] default '{}',
  extra_notes text default '',
  tone text default 'Técnico / profesional',
  content text not null,
  created_at timestamptz default now()
);

alter table reports enable row level security;
create policy "Users see own reports" on reports
  for all using (auth.uid() = user_id);

-- Matches
create table matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  team text not null,
  rival text not null,
  date text not null,
  time text default '',
  competition text default 'Otra',
  result text default 'Pendiente' check (result in ('Victoria', 'Empate', 'Derrota', 'Pendiente')),
  notes text default '',
  created_at timestamptz default now()
);

alter table matches enable row level security;
create policy "Users see own matches" on matches
  for all using (auth.uid() = user_id);
