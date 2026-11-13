# Session Notes

## Done
- Implemented task 10 AI contracts and adapters: `Candidate`, `Draft`, `LlmClient`, deterministic `FixtureLlm`, and `createLlm` with no browser API key or network client.
- Added six clearly fictional news fixtures using invented entities and `example.org` URLs, plus `SourceAdapter`, `FixtureAdapter`, and `scout`.
- Added safe JSON draft parsing and monotonic safety-tier merging through `classifyByRules` and `mergeTier`.
- Added publishability validation and Guardian decisions for GREEN, ORANGE, RED, and BLOCKED tiers; ORANGE publication is marked `UNCONFIRMED` in the decision reason.
- Added fast-check properties P6 and P7 plus four example tests, including invalid LLM JSON and a GREEN model answer raised to RED by rules.
- Ran `npm.cmd test -- --run` and `npm.cmd run build` directly and through an independent sub-agent. Both started their expected scripts, but this environment terminated each Node process with exit code `-1` before Vitest, TypeScript, or Vite produced a result.
- No property-test defect was reported, but the process interruption makes the result inconclusive.
- No Git command was run, as explicitly requested.

## Next
Re-run the exact test and build commands in a working Node terminal to obtain conclusive summaries.

## Next steps
1. Run `npm.cmd test -- --run` and confirm all tests, including P6 and P7, pass.
2. Run `npm.cmd run build` and confirm TypeScript and Vite complete successfully.
3. Continue with task 11 by connecting Guardian decisions to the approval queue UI.

## Session — 2026-11-12

### Done
- Added early unchanged-state returns for unknown draft IDs in `APPROVE_DRAFT`, `EDIT_DRAFT`, and `REJECT_DRAFT`.
- Added a fast-check property covering all three review actions and arbitrary unknown draft IDs, with reference identity checked through `toBe`.
- Updated the workflow log property so missing review targets are expected to be no-ops.
- Did not run tests or Git commands, as requested.

### Next
Run the state tests and TypeScript checks locally.

### Next steps
1. Run the Vitest suite.
2. Run the TypeScript build or type-check.
3. Commit the verified changes.

## Session — 2026-11-12 — Task 12

### Done
- Added three deterministic fixture verifiers: Archiviste, Témoin, and Greffier.
- Added consensus routing with evidence, confidence, disagreement, and safety-tier gates.
- Added persisted verifier reports, human resolution, AI override tombstones, and decision-log entries to the existing game store.
- Added the mobile-first three-spirit verdict and Guardian controls to the pledge page.
- Added fast-check coverage for consensus safety, override accounting, and Souls conservation across automatic, human, and override paths.
- Did not run tests, build, network, or Git commands, as requested.

### Next
Have the GitHub helper run the full test and TypeScript build checks.

### Next steps
1. Run the Vitest suite with a non-watch command.
2. Run the TypeScript/Vite production build.
3. Commit task 12 after those checks pass.

## Session — 2026-11-12 — Task 13

### Done
- Added the lazy-loaded `#/cimetiere` route with accessible tabs for broken pledges, inconclusive pledges, and recorded AI corrections.
- Added responsive stone tombstones drawn with inline SVG, evidence chips, state ghosts, calm empty states, French epitaphs, and reduced-motion support.
- Lazy-loaded the Guardian, Cemetery, and ghost gallery behind a French haunted `Suspense` fallback.
- Added the home cemetery counter and fast-check properties for safe epitaphs and exact BROKEN-pledge filtering.
- Did not run tests, build, network calls, or Git commands, as explicitly requested.

### Next
Have the GitHub helper run the full test and production build checks.

### Next steps
1. Run the Vitest suite with a non-watch command.
2. Run the TypeScript/Vite production build.
3. Commit task 13 after those checks pass.

## Session — 2026-11-13 — Task 14

### Done
- Added defensive pure football normalizers, normalized team matching, independent result confirmation, and conflict-safe evidence handling.
- Added the thin Web-standard Vercel route backed by server-only token access, two upstream football sources, French partial-failure warnings, and a five-minute in-memory cache.
- Added the six-second HTTP SourceAdapter and live-to-demo adapter fallback; `VITE_DEMO=1` remains fully fixture-only.
- Connected live football drafts to the Guardian flow with GREEN/ORANGE enforcement, dynamic source-mode labels, provider labels, and the `Résultat réel` badge.
- Restricted the unchanged `Garde-fou fictif` instruction to `src/sources/fixtures.ts` and `src/data/**`.
- Added inline normalizer examples and fast-check properties for team-name symmetry, missing evidence, score conflicts, and evidence levels below L3 on conflict.
- Added the server-only `FOOTBALL_DATA_TOKEN` placeholder to `.env.example`; no secret is read by browser code.
- Did not run tests, build, network calls, or Git commands, as explicitly requested.

### Next
Have the GitHub helper run the full Vitest and production build checks.

### Next steps
1. Run the Vitest suite in non-watch mode.
2. Run the TypeScript/Vite production build.
3. Commit task 14 after those checks pass.

## Session — 2026-11-13 — Task 15 extended app shell

### Done
- Replaced the old header navigation with a sticky mobile top bar and fixed five-tab bottom navigation, including safe-area spacing, 44 px targets, active text/icon/underline, Souls and Guardian draft badges.
- Added category data for demo and live football pledges, pure category filtering, scrollable Feed chips, and exclusion of pending MURMUR items from the public Feed.
- Added lazy-loaded My Stakes, Profile, and Settings routes with stake outcomes and totals, smoothed prophet rank, recent history, bilingual shell/settings/notices, persisted accessibility/data preferences, a configurable daily stake cap, demo reset, and the required About disclosures.
- Enforced the daily cap in the pure stake engine and reducer, added reduced-motion/data-saver styling, and added fast-check coverage for categories, cap enforcement, and prophet rank plus bilingual dictionary parity coverage.
- Per the user’s instruction, no command, test, build, network call, or Git operation was run.

### Next
Have the GitHub helper run the full Vitest and production TypeScript/Vite checks and report any compile or behavior failures.

### Next steps
1. Run the Vitest suite in non-watch mode.
2. Run the production build and verify the initial JavaScript remains under 200 KB.
3. Check the shell at 360 px and test all five tabs, keyboard focus, safe areas, language, reduced motion, data saver, and the daily cap before committing.

## Session — 2026-11-13 — Task 14 production fixes

### Done
- Fixed Node ESM runtime imports in the Vercel route and football server, and added a TypeScript-AST test that requires `.js` on runtime relative imports while ignoring erased type imports.
- Added pure OpenFootball season-folder conversion, wired `2025` to `2025-26` URLs, passed the start year to football-data.org, and added examples plus a fast-check year property.
- Added one-per-session automatic live loading through Scout, `draftPledge`, and Guardian; upcoming matches are limited to six within seven days, use a kickoff-plus-two-hours deadline, remain GREEN, and display a `Match réel` badge.
- Added atomic upcoming/results requests, a guarded ten-minute localStorage cache, whole-pipeline demo fallback, source mode/refresh metadata, and a three-item Rediffusion section built only from two-source L3 results from 2025-26.
- Added evidence tests for two agreeing sources, one source, conflicting scores, and GREEN real-match classification.
- Per the user’s instruction, no command, test, build, network call, or Git operation was run.

### Next
Have the GitHub helper run the full suite and production deployment checks, especially Vercel’s Node ESM route and real provider payloads.

### Next steps
1. Run Vitest in non-watch mode and fix any static or property-test failure.
2. Run the production build and invoke `/api/fixtures` for both upcoming and results modes with a server-side token.
3. Verify cache reuse/expiry, six upcoming cards, three L3 replays, fallback mode, source timestamp, and real-match labels before committing.

## Session — 2026-11-13 — Autonomous political monitoring

### Done
- Added an automatic real-source monitor for the DRC Presidency, DRC Government Communications, and Radio Okapi through a server-only Vercel route with fixed allowlisted hosts, redirect blocking, timeouts, response-size limits, and ten-minute server/browser caches.
- Added pure political statement extraction and drafting: only attributable statements with explicit future deadlines are accepted; the exact sourced excerpt is preserved, ORANGE items publish as unconfirmed, RED items enter the Guardian queue, and BLOCKED decisions remain visible in the decision log.
- Combined political and football live sources so one provider failure no longer hides successful real data; the live adapter retries after temporary failures and refreshes automatically every ten minutes while explicit demo mode makes no network call.
- Fixed football partial-source behavior so OpenFootball matches can remain visible without a football-data.org token when usable data exists.
- Added real-statement badges and excerpts to cards/details, updated visible source disclosures, and closed staking at the deadline while keeping expired pledges visible for evidence follow-up.
- Added tests for partial football availability, live-source composition/recovery, explicit no-network demo mode, exact political statement preservation, ORANGE routing, and stake-window closure.
- No command, build, test runner, deployment, or Git operation was run in this session.

### Next
Deploy through Vercel, leave `VITE_DEMO` unset or set to `0`, and verify that the live endpoints can reach the three allowlisted political sources from the deployment region.

### Next steps
1. Run the full Vitest suite and production TypeScript/Vite build.
2. Call `/api/fixtures` and `/api/political` on the deployed host, then confirm `Sources : en direct` and inspect the Guardian queue for RED statements.
3. Add persistent scheduled evidence follow-up in Supabase before enabling automatic resolution of real political pledges; ORANGE resolutions must continue to require a human.

## Session — 2026-11-13 — Vercel TypeScript fix

### Done
- Fixed TS2339 in `draftToPledge` by retaining the narrowed `PoliticalCandidate` reference before reading `exactStatement` and `speaker`.
- Started `npm.cmd run build`; TypeScript/Vite began without reporting the previous TS2339 errors, but the local execution environment interrupted the process with exit code `-1` before a final result.
- No Git operation was run.

### Next
Push the focused fix and let Vercel run the authoritative production build.

### Next steps
1. Stage `src/state/useGame.ts` and `SESSION_NOTES.md`.
2. Commit and push the TypeScript narrowing fix.
3. Confirm the new Vercel deployment completes or share the next complete error.

## Session — 2026-11-13 — Live deployment diagnosis

### Done
- Inspected the deployed public endpoints directly. The football APIs are healthy and return real OpenFootball data; the 2025-26 results endpoint also returns matching football-data.org results. The political endpoint currently returns no qualifying future commitment and reports Radio Okapi unavailable.
- Identified the main football visibility defect: the server sorted and sliced forty old OpenFootball `SCHEDULED` rows before the client applied its seven-day window, so every delivered upcoming row was already expired.
- Fixed server selection to discard expired scheduled rows before sorting and slicing, and moved the verified real replay section above demo pledge cards so real evidence appears immediately.
- Kept real-source retries, partial-provider support, automatic refresh, and strict no-fabrication rules intact.

### Next
Push this focused visibility correction and verify the deployed upcoming endpoint starts with future fixtures and the Feed shows `Rediffusion réelle` above demo cards.

### Next steps
1. Run the build and tests locally or through GitHub/Vercel.
2. Push `src/sources/footballServer.ts`, `src/ui/Feed.tsx`, and `SESSION_NOTES.md`.
3. Verify the production Feed and inspect `VITE_DEMO` only if it still reports `Sources : démo` after this deployment.
