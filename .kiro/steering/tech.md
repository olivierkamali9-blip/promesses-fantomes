---
inclusion: always
---
# Tech Steering

## Stack (chosen to need few, short PC sessions)
- React + Vite + TypeScript, mobile-first PWA, CSS only for ghost animation (no heavy libraries)
- Supabase (Postgres + auth + row level security), Vercel hosting
- Pure TypeScript domain engine in `src/engine/` (no I/O) tested with Vitest + fast-check (property-based tests)
- LLM calls behind one adapter `src/ai/llm.ts` (provider swappable, fixtures for offline demo mode)
- Source access behind `SourceAdapter` interface (`searchNews`, `getFixture`, `fetchOfficial`) with recorded fixtures

## Structure
```
src/engine/    souls.ts (payout), evidence.ts (ladder), lifecycle.ts (ghost states), safety.ts (tiers)
src/ai/        scout.ts drafter.ts verifier.ts guardian.ts gravekeeper.ts llm.ts
src/ui/        GhostFigure.tsx PledgeCard.tsx Feed.tsx Cemetery.tsx ApprovalQueue.tsx
src/sources/   adapters + fixtures/
supabase/      schema.sql seed.sql
.kiro/         steering/ specs/ hooks/ (NEVER add to .gitignore)
SESSION_NOTES.md  updated at the end of every work session
```

## Rules
- Domain logic lives only in `src/engine`. UI and AI call it, never re-implement it.
- Every engine function has property-based tests (see spec invariants).
- Secrets only in env vars, never in the repo. Provide `.env.example`.
- Demo mode: `VITE_DEMO=1` runs on fixtures with no network and no API key.
- Each session ends with: tests green, commit, SESSION_NOTES.md updated (what is done, what is next, 3 next steps).
- Open source license file (MIT) at repo root, visible in the About section.
