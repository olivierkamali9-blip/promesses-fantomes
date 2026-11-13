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

## Session — 2026-11-13 — Remaining spec tasks

### Done
- Audited all 17 tasks against requirements and the playbook; updated task checkboxes so only external completion steps for tasks 16 and 17 remain open.
- Completed task 6 repository deliverables with a Supabase schema, RLS policies, fictional seed, account trigger, strict resolution constraints, and an atomic authenticated stake RPC whose daily cap comes from the locked profile rather than caller input.
- Added installable PWA assets and service-worker precaching for hashed Vite assets, with API requests excluded and navigation-only offline fallback.
- Added a reproducible first-load JavaScript budget gate including modulepreload chunks and strict TypeScript checking for Vercel API entry points.
- Added a production smoke-test checklist, an under-three-minute video script, KIRO_NOTES, and Devpost/blog/social submission drafts; rewrote README with architecture, safety, setup, demo, deployment, database, limits, and Kiro/Gemini role disclosure.
- Added the missing Kiro hooks for engine tests on save, pre-commit secret review reminders, session-note handoff, and expanded the fictional-data guard to Supabase seed data.
- Added a readable source-failure state that preserves cached real pledges, the exact bilingual fictional seed label, and an explicit confidence field that honestly says “Non évaluée” when no measured confidence exists.
- Secret scans found no Gemini key or hard-coded credential. Test/build commands were attempted, but the local terminal bridge returned exit code `-1` without diagnostic output, so validation remains inconclusive until Vercel builds the commit.

### Next
Push the remaining-task commit, use Vercel as the authoritative build check, then complete the real-phone smoke test and external submission actions.

### Next steps
1. Push and confirm Vercel passes strict API TypeScript plus the 200 KB initial bundle gate.
2. Complete SMOKE_TEST.md on a real phone and record the video from VIDEO_SCRIPT.md.
3. Add the public video/Devpost URLs to SUBMISSION_DRAFT.md, publish the blog/social post, and submit in Costume Contest.

## Session — 2026-11-13 — Bundle budget recovery

### Done
- Vercel rejected commit `ad238d2`; local generated assets identified the enforced cause: the initial JavaScript entry was 230,757 bytes versus the 204,800-byte limit.
- Lazy-loaded PledgePage and the Feed, and moved the large deterministic LLM fixtures behind dynamic imports.
- Rebuilt generated assets and measured the initial entry at 204,735 bytes. `node scripts/check-bundle.mjs` reported that exact value without a budget error.
- TypeScript and Vite produced a complete new `dist`, including separate Feed, PledgePage, GhostFigure, and LLM chunks. The terminal bridge still reported exit code `-1`, so the upcoming Vercel build remains the authoritative end-to-end status.

### Next
Push the bundle split and confirm Vercel passes the strict API type-check and 200 KB budget.

### Next steps
1. Commit and push the lazy-loading correction.
2. Confirm Vercel deployment succeeds and the production app loads the Feed chunk normally.
3. Complete the real-phone checklist and external task 16/17 actions.

## Session — 2026-11-13 — Production bundle and sourced statements

### Done
- Changed the initial JavaScript budget to 100 KB gzipped at gzip level 9 while reporting both raw and gzipped byte totals.
- Updated R10’s transferred-size requirement and the submission’s accurate Supabase demo status.
- Confirmed `PledgePage` was already lazy-loaded, so no behavior-changing import change was needed.
- Truncated displayed sourced political statements to 160 characters while preserving full data and added original-article links on cards and detail pages.
- Did not run commands, tests, builds, or Git, as explicitly requested.

### Validation
- Verified by file inspection that the bundle checker uses `gzipSync` at level 9, enforces 102,400 gzipped bytes, and reports raw and gzipped totals.
- Verified by source search that both `publicStatement` render sites truncate the displayed text and provide `Lire la source` links while `exactStatement` remains unchanged in the data flow.
- `npm run build` and the Vitest command were not run, so production compilation, the measured gzip total, and automated tests remain unverified.
- No Git command was run.

### Next
Have the GitHub helper verify the production build, tests, bundle budget, and source-link behavior.

### Next steps
1. Run the Vitest suite in non-watch mode.
2. Run the production build and confirm the gzipped initial JavaScript stays at or below 102,400 bytes.
3. Check both political-statement source links and commit the verified changes.

## Session — 2026-11-13 — Browser fetch receiver fix

### Done
- Fixed `Illegal invocation` in both live browser source adapters by binding the selected native or injected `fetch` function to `globalThis` before storing it.
- Kept endpoint, timeout, cache, fallback, and response behavior unchanged.

### Validation
- Verified by source inspection that both detached-fetch assignments now bind the correct browser receiver.
- Verified that the remaining client request sites call these bound fields and that direct server fetch calls are unaffected.
- No test or build command was run, so automated regression coverage and production compilation remain unverified.
- No Git command was run.

### Next
Have the GitHub helper run the automated checks and confirm that live football and political requests no longer report `Illegal invocation` in Chromium.

### Next steps
1. Run the Vitest suite in non-watch mode.
2. Run the production build and bundle-size check.
3. Open the deployed app with live sources enabled and verify both `/api/fixtures` and `/api/political` requests.

## Session — 2026-11-13 — Fetch fix publication

### Done
- User committed the browser fetch receiver fix and session notes as commit `7b88eb9`.
- User pushed commit `7b88eb9` from local `main` to `origin/main` successfully.

### Validation
- Verified the successful push from Git output: remote `main` advanced from `0620db8` to `7b88eb9`.
- Tests and the production build were not run, so those commands remain unverified.

### Next
Confirm the Vercel deployment succeeds and the deployed app no longer reports `Illegal invocation`.

### Next steps
1. Check the Vercel deployment for commit `7b88eb9`.
2. Test live football and political refreshes in the deployed Chromium app.
3. Run the Vitest suite and production build if Vercel does not run both checks.

## Session — 2026-11-13 — Non-sport feed diagnosis

### Done
- Traced political candidates from `/api/political` through live-source composition, Guardian classification, publication, and Feed filtering.
- Confirmed that live mode hides all non-live demo pledges as soon as football returns candidates.
- Confirmed that real politics can legitimately return no candidate under the exact-quote, attributable-speaker, and future-deadline rules.
- Confirmed that Buzz/Stories has no source adapter and Celebrities has a UI category but no producer or seed data.

### Validation
- Verified the behavior by source inspection only; no code behavior was changed.
- No test, build, deployment, or Git command was run, so those commands remain unverified.

### Next
Wait for approval to mix clearly labelled non-sport demo pledges into the live feed, then scope real non-sport source adapters separately.

### Next steps
1. Decide whether live mode should show clearly labelled demo fallback cards for missing non-sport categories.
2. If approved, implement the smallest Feed-only fallback without weakening political safety checks.
3. Define allowlisted, verifiable sources before adding real Celebrity or Buzz content.

## Session — 2026-11-13 — Real-content expansion scope

### Done
- Confirmed the requested direction: production content should be real across RDC politics, presidents, combat sports, general news, cinema, and public-figure stories.
- Identified official/current source options: existing RDC Presidency and Radio Okapi sources, SportsDataIO MMA API for combat events, and TMDB’s official upcoming/release-date APIs for cinema.
- Defined the safety boundary: general news or buzz enters the game only when it contains a sourced, attributable, verifiable claim with a deadline; rumors and private-person accusations remain excluded.

### Validation
- Checked current provider documentation and public source availability through web search; no provider integration was executed.
- No code, test, build, deployment, or Git command was run, so all implementation commands remain unverified.

### Next
Obtain user approval for the first implementation tranche and confirm whether TMDB and combat-sports API credentials can be supplied through Vercel environment variables.

### Next steps
1. Confirm production-real-only behavior while retaining fixtures exclusively under `VITE_DEMO=1`.
2. Choose and configure the cinema and combat-sports providers without committing secrets.
3. Implement one category at a time with source links, safety classification, cache handling, and tests.

## Session — 2026-11-13 — Mobile PWA installation

### Done
- Added Android/Chromium install-prompt handling with `beforeinstallprompt`, user-choice feedback, installed-state detection, and `appinstalled` handling.
- Added iPhone/iPad Add to Home Screen guidance and standalone detection in Settings, with French and English text.
- Completed the web app manifest with explicit identity, scope, portrait standalone display, 192 px, 512 px, maskable, SVG, and Apple icon coverage.
- Added mobile viewport safe-area metadata, Apple web-app metadata, and an Apple touch icon.
- Added valid PNG app icons and improved the service worker with cache-first handling for immutable Vite assets while keeping API requests uncached.
- Added a Vercel no-cache response policy for `/sw.js` so deployed clients can detect updates.

### Validation
- Verified all four generated PNG files by decoding them and confirming dimensions: 180×180, 192×192, and two 512×512 files.
- Verified by source inspection that every manifest, HTML, and service-worker icon path points to an existing file, and that French/English installation keys are paired.
- The icon-generation PowerShell process returned exit code `-1` after producing all four valid image files.
- `npm.cmd test -- --run` completed successfully in the user’s PowerShell terminal: 21 test files passed and all 98 tests passed in 15.49 seconds.
- `npm.cmd run build` completed successfully in the user’s PowerShell terminal: TypeScript and Vite passed, 79 modules were transformed, and the initial JavaScript measured 207,454 raw bytes / 66,957 gzipped bytes, below the 102,400-byte gzip limit.
- No Git command was run.

### Next
Run the checks in a working terminal, deploy to HTTPS, then verify installation on Android Chrome and iOS Safari.

### Next steps
1. Review the working tree, then commit and push the verified PWA changes.
2. Commit and push the PWA files, then confirm Vercel serves the new manifest, icons, and uncached service worker.
3. On a real phone, install from Settings or the browser menu, launch from the home screen, and verify standalone display and offline reopening.
