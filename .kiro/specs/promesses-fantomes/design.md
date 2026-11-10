# Design — Promesses Fantômes (Ghost Pledges)

## Architecture
React PWA -> Supabase (Postgres, auth, RLS) <- Serverless functions running the AI crew. Domain rules live in `src/engine` (pure TS) and are shared by UI and functions.

## Data model (Postgres)
- pledges(id, question, criteria, deadline, tier, state, evidence_level, outcome, ai_confidence, created_at)
- sources(id, pledge_id, url, kind[statement|reliable|official], independent_group, fetched_at)
- stakes(id, pledge_id, user_id, side[KEPT|BROKEN], amount, created_at)
- profiles(id, souls, prophet_rank)
- decisions(id, pledge_id, actor[ai|human], action, reason, created_at)
- tombstones(id, pledge_id, ai_claim, human_override, reason, created_at)

## Engine algorithms
**Payout (largest remainder):** pool = sum(stakes); W = stakes on winning side. For each winner i: base_i = floor(pool * s_i / W); remainder = pool - sum(base_i); distribute +1 Soul to winners by descending fractional part, ties by earliest stake. If W = 0 refund everyone.
**Evidence level:** L4 if any official document; L3 if >= 2 reliable sources from different independent_group; L2 if 1 reliable; L1 if only a statement; else L0.
**Lifecycle:** pure function nextState(state, now, deadline, resolution) enforcing allowed transitions.
**Safety:** classify(draft) -> {tier, reason}; BLOCKED rules are explicit keyword + model check; tier can only be raised by the model, never lowered below the rule-based tier.

## AI crew (runtime)
Scout (find candidates) -> Drafter (write question and criteria) -> Guardian (tier and block) -> publish or queue -> Verifier x3 (resolve) -> Gravekeeper (cemetery and tombstones). Each step is a function with a deterministic fixture mode.

## Correctness properties (property-based tests)
P1 Conservation: sum(payouts) == pool for any stakes and winning side.
P2 Fairness: a larger stake on the winning side never yields a smaller payout than a smaller stake (monotonic).
P3 No loss for winners: each winner payout >= their stake only if the losing pool > 0; refund cases equal stake.
P4 Resolution gate: resolve(KEPT|BROKEN) is impossible below evidence L3.
P5 Lifecycle: no illegal transition; final states are terminal except recorded override.
P6 Publishability: a pledge missing criteria, deadline or source is never published.
P7 Safety monotonic: model output can never lower a rule-based tier.

## Error handling
LLM failure -> retry once, then queue for human; source failure -> use cached sources and mark confidence low; never publish on partial data.

## Open items to verify during build
Kiro hook file format; whether Kiro Crew is available on the account; free-tier limits of chosen LLM API; a legal football/fixtures source; Vercel cron limits.
