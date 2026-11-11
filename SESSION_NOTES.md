# Session Notes

## Done
- Implemented task 9 with dependency-free hash routing at `#/promesse/<id>` and keyboard-accessible pledge cards.
- Added `validateStake` with fast-check properties for balance, minimum amount, and integer-only stakes.
- Added the reducer-based demo game store with guarded localStorage persistence, a 1,000-Soul starting balance, staking, simulated resolution, reset, and fictional stakers generated from demo pools.
- Wired simulated resolution through `resolveOutcome`, `applyEvent`, and `settlePledge`, including inconclusive refunds and final ghost states.
- Added property tests for total-Soul conservation and full refunds below evidence level 3.
- Added the mobile-first pledge page with a large stateful ghost, criteria, countdown, pool split, stake controls, French validation, monetary-value notice, evidence ladder, source details, safety reason, fictional AI confidence, and demo payout result.
- Added the player's Soul balance and demo reset control to the Feed header.
- Corrected a conservation defect found during review: displayed pools included the player's stake, so fictional staker generation had to subtract player stakes before settlement.
- Ran `npm.cmd test -- --run` and `npm.cmd run build`; both started their expected scripts, but this environment terminated each Node process with exit code `-1` before Vitest, TypeScript, or Vite produced a result.
- No Git command was run, as explicitly requested.

## Next
Re-run the exact test and build commands in a working Node terminal to obtain conclusive summaries.

## Next steps
1. Run `npm.cmd test -- --run` and confirm all fast-check properties pass.
2. Run `npm.cmd run build` and confirm TypeScript and Vite complete successfully.
3. Open the built app at 360 px and smoke-test card navigation, staking, persistence, reset, and final ghost animations with reduced motion enabled.
