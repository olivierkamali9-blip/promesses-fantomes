# Promesses Fantômes (Ghost Pledges)

> Public promises evaporate. Ghost Pledges turns each verifiable statement into a ghost you can follow until evidence arrives.

**Live app:** https://promesses-fantomes.vercel.app/  
**Kiroween 2026:** Costume Contest  
**License:** [MIT](LICENSE)

## What it does

Players stake **Souls**, virtual points with no monetary value, on whether a public pledge will be **KEPT** or **BROKEN**. Souls cannot be bought, sold, or withdrawn. Winners share the full losing pool proportionally using integer arithmetic.

The ghost communicates state:

- `MURMUR`: waiting for publication approval;
- `APPARITION`: open for stakes;
- `HAUNTING`: deadline is less than 24 hours away;
- `KEPT`: confirmed with sufficient evidence;
- `BROKEN`: sent to the Cemetery of Pledges;
- `INCONCLUSIVE`: insufficient evidence, all stakes refunded.

Ghost opacity communicates evidence from L0 rumor to L4 official or primary data. KEPT and BROKEN require L3 or L4.

## AI crew and safety

The runtime pipeline separates responsibilities:

1. **Scout** reads configured source adapters.
2. **Gemini**, when configured, selects exact attributable public commitments from allowlisted articles.
3. **Drafter** creates a binary question, deadline, criteria, and sourced sides.
4. **Guardian** applies GREEN, ORANGE, RED, and BLOCKED rules.
5. Three **Verifiers** propose outcomes and confidence.
6. **Gravekeeper** preserves human corrections in the Cemetery of AI Mistakes.

Gemini output is never trusted directly. The selected sentence must exist in the fetched article, include a public actor and explicit future deadline, and pass local safety rules. ORANGE publishes as **Unconfirmed** and needs human approval to resolve. RED needs approval before publication. BLOCKED is rejected and logged.

## Kiro usage

Kiro implemented and corrected the project from the files in `.kiro/specs/` and `.kiro/steering/`. The pure engine is protected by Vitest and fast-check properties covering payout conservation, fairness, refunds, evidence gates, lifecycle terminality, publishability, and safety-tier monotonicity.

Planning material was initially prepared with Claude. Gemini is only an optional runtime analyzer inside the deployed application. See [KIRO_NOTES.md](KIRO_NOTES.md) for concrete Kiro decisions and production bugs corrected during development.

## Stack

- React + Vite + TypeScript
- Mobile-first installable PWA, no animation library
- Pure domain engine in `src/engine/`
- Vitest + fast-check
- Supabase schema, RLS, and atomic stake function in `supabase/`
- Vercel Functions for football and political sources
- Gemini REST API behind a server-only environment variable

## Local setup

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Set `VITE_DEMO=1` in `.env.local` for the deterministic offline demo. It requires no Gemini, football, or Supabase key. Do not commit `.env.local`.

For live server functions, configure secrets in Vercel:

- `GEMINI_API_KEY`
- `FOOTBALL_DATA_TOKEN`

Public Supabase values are reserved for the authenticated persistence phase:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Validation

```powershell
npm test -- --run
npm run build
```

The production build runs a first-load JavaScript budget check and fails above 200 KB. Use [SMOKE_TEST.md](SMOKE_TEST.md) for the 360 px, keyboard, reduced-motion, Slow 3G, PWA, and real-phone checks.

## Database

Run `supabase/schema.sql`, then `supabase/seed.sql`, in a Supabase project. The schema enables RLS and exposes an authenticated `place_stake` function that atomically checks balance, pledge deadline, minimum stake, and daily cap before debiting Souls.

The current demo UI still uses local state. The SQL is ready for the authenticated persistence task without placing a service-role secret in browser code.

## Demo and submission

- Demo data uses invented entities and `example.org` URLs.
- Seed rows carry the exact label **Fictional demo scenario**.
- [VIDEO_SCRIPT.md](VIDEO_SCRIPT.md) contains the under-three-minute recording plan.
- [SUBMISSION_DRAFT.md](SUBMISSION_DRAFT.md) contains Devpost, blog, and social drafts.

Known limitation: a real political scan may correctly return no pledge when recent articles contain no attributable commitment with an explicit future deadline. The app must prefer an honest empty state over an invented quote.
