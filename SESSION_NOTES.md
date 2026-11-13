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

## Session — 2026-11-13 — Force live on official deployment

### Done
- Verified the newly deployed football endpoint now returns future 2026-27 fixtures and two-source 2025-26 finished results.
- Kept offline `VITE_DEMO=1` behavior for local and preview demos, while forcing the official `promesses-fantomes.vercel.app` hostname to use live adapters so an accidental Vercel demo variable cannot hide real data.
- No secret or Vercel account setting was changed.

### Next
Push and verify that the official Feed reports live sources and shows the real replay section immediately; upcoming cards will appear when a fixture enters the seven-day window.

### Next steps
1. Commit and push the official-host live-mode override.
2. Wait for Vercel’s automatic deployment and reload the app.
3. Confirm `Sources : en direct` and `Rediffusion réelle` are visible.

## Session — 2026-11-13 — Real-only Feed correction

### Done
- Confirmed GitHub `main` and Vercel both contain the live-host override; the deployment status is successful.
- Confirmed the production football API returns real future fixtures and two-source finished results.
- Identified the remaining calendar gap: the nearest fixture is eight days away, so the strict seven-day selector returned no upcoming cards.
- Added a nearest-future fallback when the seven-day window is empty, bumped the browser football cache version, and made the live Feed hide fictional seed cards once at least one real pledge has loaded.
- Kept the six-card limit and added a selection regression test.

### Next
Push this final Feed-selection correction and verify the official deployment shows only real match cards while live mode is healthy.

### Next steps
1. Run tests/build through Vercel.
2. Push the changed football selector, adapter cache, Feed, test, and session notes.
3. Reload the production app after deployment and confirm `Match réel` and `Rediffusion d’un vrai résultat` cards.

## Session — 2026-11-13 — Gemini runtime integration

### Done
- Confirmed that the previous implementation used only `FixtureLlm`; no remote model was connected for political monitoring.
- Added server-only Gemini 2.5 Flash analysis through `GEMINI_API_KEY`, with one structured request over allowlisted article excerpts and no browser exposure of the secret.
- Added hard validation after Gemini: every selected statement must occur in the fetched article, contain an attributable public actor, a clear commitment, and an explicit future deadline; local safety rules still escalate RED and BLOCKED content before Guardian publication.
- Added JSON response schema, output limits, source-body scoping, timeouts, rule fallback, source provenance (`gemini` or `rules`), and a new political cache version.
- Updated the Feed so live mode no longer presents fictional cards while real sources are loading; it now announces that Gemini and Scout are monitoring, then shows real cards or an honest empty state.
- Updated About text to distinguish Gemini’s runtime role from Kiro’s design, implementation, testing, and correction work for Kiroween.
- Type/test commands were started, but the local terminal bridge interrupted them with exit code `-1` and no diagnostic output; Vercel remains the authoritative build check.

### Next
Push the Gemini integration, verify Vercel builds it, then inspect `/api/political` for `aiProvider: "gemini"`, warnings, and validated candidates.

### Next steps
1. Commit and push the Gemini server integration and UI loading state.
2. Confirm the Vercel deployment succeeds and the production environment exposes `GEMINI_API_KEY` only to server functions.
3. Inspect the political endpoint and Feed; tune source extraction only from observed, cited failures without weakening quote or safety validation.

## Session — 2026-11-13 — Gemini ESM production fix

### Done
- Deployed commit `5230d0d` successfully, then verified `/api/political` returned HTTP 500 while football remained healthy.
- Traced the crash to a transitive Node ESM import: `politicalLive.js` imports `safety.js`, whose runtime import of `safety.rules` lacked the required `.js` suffix.
- Corrected the suffix, expanded the runtime-import AST test across the full political server chain, and added a safe JSON error response plus a 30-second Vercel function duration declaration.

### Next
Push the ESM fix and query `/api/political` again; the response must be JSON with `aiProvider`, candidates, and/or explicit warnings rather than HTTP 500.

### Next steps
1. Commit and push the ESM chain correction.
2. Verify Vercel deployment success.
3. Inspect the production political endpoint and only then assess Gemini extraction quality.

## Session — 2026-11-13 — Gemini production diagnostics

### Done
- Verified commit `619b3a9` deployed successfully and `/api/political` now returns JSON instead of HTTP 500.
- Production reports that Gemini falls back to rules, but the generic warning hid whether the cause was authentication, model access, quota, or schema validation.
- Added a sanitized Gemini error reason to API warnings; API keys are never included in these errors.

### Next
Deploy the diagnostic and inspect the exact Gemini HTTP/result error before changing credentials, model, or schema.

### Next steps
1. Push the sanitized diagnostic.
2. Query `/api/political` after deployment.
3. Apply one targeted fix from the reported status without weakening source validation.

## Session — 2026-11-13 — Gemini model compatibility

### Done
- Production diagnostic confirmed `GEMINI_API_KEY` is present but `gemini-2.5-flash` returns HTTP 404.
- Replaced the retired model with an ordered compatibility list of current Flash models: 3.5 Flash-Lite, 3.6 Flash, then 3.8 Flash; fallback advances only on HTTP 404 and preserves all validation and quota controls.

### Next
Deploy and inspect `aiProvider`; a successful request may still return zero candidates when no sourced statement satisfies the strict promise criteria.

### Next steps
1. Push the model compatibility fix.
2. Verify the political endpoint no longer reports Gemini HTTP 404.
3. Distinguish a successful empty analysis from source extraction failures before any further changes.
