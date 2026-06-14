create extension if not exists "pgcrypto";

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  display_name text not null default 'GlycoBete Player',
  role text not null default 'patient' check (role in ('patient', 'family', 'clinician')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.health_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  diabetes_type text not null check (
    diabetes_type in ('type_1', 'type_2', 'prediabetic', 'gestational', 'unknown')
  ),
  age_years integer check (age_years between 1 and 120),
  gender text,
  height_cm numeric(5, 2) check (height_cm > 0),
  weight_kg numeric(5, 2) check (weight_kg > 0),
  activity_level text check (
    activity_level in ('sedentary', 'light', 'moderate', 'active', 'very_active')
  ),
  medications text,
  family_history boolean not null default false,
  emergency_contact_name text,
  emergency_contact_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table public.glucose_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  logged_at timestamptz not null default now(),
  reading_mg_dl integer not null check (reading_mg_dl between 20 and 600),
  reading_context text not null default 'fasting' check (
    reading_context in ('fasting', 'before_meal', 'after_meal', 'bedtime', 'random')
  ),
  symptoms text[] not null default '{}',
  sleep_quality integer check (sleep_quality between 1 and 5),
  meds_taken boolean,
  notes text,
  created_at timestamptz not null default now()
);

create table public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  logged_at timestamptz not null default now(),
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  description text not null,
  image_url text,
  estimated_carbs_g numeric(6, 2),
  glycemic_level text check (glycemic_level in ('low', 'medium', 'high')),
  sugar_impact text,
  healthier_alternatives text[] not null default '{}',
  ai_explanation text,
  created_at timestamptz not null default now()
);

create table public.chat_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  session_id uuid not null default gen_random_uuid(),
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  safety_label text,
  created_at timestamptz not null default now()
);

create table public.quests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text not null,
  quest_type text not null check (quest_type in ('daily', 'weekly')),
  target_count integer not null default 1 check (target_count > 0),
  progress_count integer not null default 0 check (progress_count >= 0),
  xp_reward integer not null default 10 check (xp_reward >= 0),
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  xp_total integer not null default 0 check (xp_total >= 0),
  level integer not null default 1 check (level > 0),
  health_coins integer not null default 0 check (health_coins >= 0),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  description text not null,
  icon text,
  xp_reward integer not null default 0 check (xp_reward >= 0),
  created_at timestamptz not null default now(),
  unique (code)
);

create table public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  unique (user_id, achievement_id)
);

create table public.streaks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  streak_type text not null check (streak_type in ('checkin', 'glucose_log', 'meal_log')),
  current_count integer not null default 0 check (current_count >= 0),
  best_count integer not null default 0 check (best_count >= 0),
  last_activity_date date,
  updated_at timestamptz not null default now(),
  unique (user_id, streak_type)
);

create table public.risk_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  age_years integer check (age_years between 1 and 120),
  weight_kg numeric(5, 2),
  height_cm numeric(5, 2),
  symptoms text[] not null default '{}',
  family_history boolean not null default false,
  activity_level text,
  risk_score integer not null check (risk_score between 0 and 100),
  explanation text not null,
  recommendations text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index glucose_logs_user_logged_at_idx on public.glucose_logs(user_id, logged_at desc);
create index meal_logs_user_logged_at_idx on public.meal_logs(user_id, logged_at desc);
create index chat_history_user_session_idx on public.chat_history(user_id, session_id, created_at);
create index quests_user_due_idx on public.quests(user_id, due_date);
create index risk_assessments_user_created_idx on public.risk_assessments(user_id, created_at desc);

alter table public.users enable row level security;
alter table public.health_profiles enable row level security;
alter table public.glucose_logs enable row level security;
alter table public.meal_logs enable row level security;
alter table public.chat_history enable row level security;
alter table public.quests enable row level security;
alter table public.rewards enable row level security;
alter table public.user_achievements enable row level security;
alter table public.streaks enable row level security;
alter table public.risk_assessments enable row level security;

create policy "Users can read own user row" on public.users
  for select using (auth.uid() = id);
create policy "Users can update own user row" on public.users
  for update using (auth.uid() = id);

create policy "Users own health profiles" on public.health_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users own glucose logs" on public.glucose_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users own meal logs" on public.meal_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users own chat history" on public.chat_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users own quests" on public.quests
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users own rewards" on public.rewards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users own achievements" on public.user_achievements
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users own streaks" on public.streaks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users own risk assessments" on public.risk_assessments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Achievements are readable by authenticated users" on public.achievements
  for select to authenticated using (true);

insert into public.achievements (code, name, description, icon, xp_reward) values
  ('first_glucose_log', 'First Check-In', 'Log your first glucose reading.', 'activity', 10),
  ('profile_complete', 'Profile Ready', 'Complete your health profile.', 'user-check', 20),
  ('seven_day_streak', '7 Day Streak', 'Complete check-ins for seven days.', 'flame', 100),
  ('meal_tracker', 'Meal Tracker', 'Log your first AI-analyzed meal.', 'utensils', 10),
  ('coach_chat', 'Coach Connection', 'Ask the AI coach your first question.', 'message-circle', 10)
on conflict (code) do nothing;
