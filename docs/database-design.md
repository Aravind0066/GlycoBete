# GlycoBete Database Design

GlycoBete should use Supabase Postgres for Phase 1 because the product needs
relational health logs, secure auth, row-level security, migrations, and a clear
path to family-monitoring permissions.

## ER Diagram

```mermaid
erDiagram
  users ||--|| health_profiles : owns
  users ||--o{ glucose_logs : records
  users ||--o{ meal_logs : records
  users ||--o{ chat_history : chats
  users ||--o{ quests : receives
  users ||--|| rewards : earns
  users ||--o{ streaks : maintains
  users ||--o{ risk_assessments : completes
  users ||--o{ user_achievements : unlocks
  achievements ||--o{ user_achievements : catalog

  users {
    uuid id PK
    text email
    text display_name
    text role
  }

  health_profiles {
    uuid id PK
    uuid user_id FK
    text diabetes_type
    integer age_years
    numeric height_cm
    numeric weight_kg
    text activity_level
    boolean family_history
  }

  glucose_logs {
    uuid id PK
    uuid user_id FK
    timestamptz logged_at
    integer reading_mg_dl
    text reading_context
    text[] symptoms
    boolean meds_taken
  }

  meal_logs {
    uuid id PK
    uuid user_id FK
    timestamptz logged_at
    text meal_type
    text description
    numeric estimated_carbs_g
    text glycemic_level
    text sugar_impact
  }

  chat_history {
    uuid id PK
    uuid user_id FK
    uuid session_id
    text role
    text content
  }

  quests {
    uuid id PK
    uuid user_id FK
    text quest_type
    integer target_count
    integer progress_count
    integer xp_reward
  }

  rewards {
    uuid id PK
    uuid user_id FK
    integer xp_total
    integer level
    integer health_coins
  }

  achievements {
    uuid id PK
    text code
    text name
    text description
  }

  user_achievements {
    uuid id PK
    uuid user_id FK
    uuid achievement_id FK
  }

  streaks {
    uuid id PK
    uuid user_id FK
    text streak_type
    integer current_count
    integer best_count
  }

  risk_assessments {
    uuid id PK
    uuid user_id FK
    integer risk_score
    text explanation
    text[] recommendations
  }
```

## Migration

Run the Phase 1 migration from:

```bash
supabase db push
```

Migration file:

```text
supabase/migrations/001_glycobete_core_schema.sql
```

## Security Model

- Supabase Auth owns the canonical user identity through `auth.users`.
- Application user rows mirror auth users in `public.users`.
- Row-level security is enabled on all user-owned health tables.
- Authenticated users can only access records where `auth.uid() = user_id`.
- Global achievement catalog rows are readable by authenticated users.
- Future caregiver permissions should be added as a separate join table instead
  of sharing patient credentials.
