# GlycoBete AI Architecture

Phase 2 moves AI execution to the backend so private API keys and health prompts
do not ship to the browser.

## API Key Location

Put the Grok/xAI key in the backend environment, not in React code:

```text
XAI_API_KEY=your-xai-api-key
XAI_MODEL=grok-4.3
```

The backend also accepts these aliases:

```text
GROK_API_KEY=your-xai-api-key
GROK_MODEL=grok-4.3
```

For local development, create a `.env` file in the nested app folder:

```text
C:\Users\Ayushi Agarwal\Desktop\ArcNight VIT\GlycoBete\GlycoBete\.env
```

Do not put the key in any `VITE_*` variable. Vite exposes `VITE_*` values to the
browser.

## Agent Modules

- `backend/ai/riskAssessmentAgent.js`
  - Inputs: age, weight, height, symptoms, family history, activity level.
  - Output: risk score, risk level, explanation, recommendations.

- `backend/ai/diabetesCoachAgent.js`
  - Inputs: message, conversation history, profile context.
  - Output: coach reply, suggested actions, safety disclaimer.

- `backend/ai/mealAnalysisAgent.js`
  - Inputs: food description or image.
  - Output: estimated carbs, sugar impact, glycemic level, alternatives.

- `backend/ai/healthInsightAgent.js`
  - Inputs: glucose logs and meal logs.
  - Output: trends, warnings, weekly summary, action suggestions.

## Backend Endpoints

```text
POST /api/ai/risk-assessment
POST /api/ai/coach
POST /api/ai/meal-analysis
POST /api/ai/health-insights
```

All agents include safe deterministic fallbacks so the demo still works without
an API key.
