# How Kiro built Promesses Fantômes

## Product decisions enforced through steering

- The ghost communicates lifecycle and evidence; decorative spooky elements were removed.
- Souls are virtual points only. They cannot be purchased or withdrawn.
- Political and celebrity statements are ORANGE by default. Security, armed conflict, courts, health emergencies, and election results require approval before publication.
- A promise cannot resolve KEPT or BROKEN below evidence L3.
- Demo entities and URLs are fictional and visibly labelled.

## Specs and property-based tests

The spec split the project into pure engine functions before UI and networking. Fast-check properties cover:

- P1: payout conservation;
- P2: payout monotonicity;
- P3: winner/refund protection;
- P4: no KEPT/BROKEN result below L3;
- P5: final lifecycle states remain terminal except recorded override;
- P6: missing criteria, deadline, or source blocks publication;
- P7: model output cannot lower a rule-based safety tier.

Additional properties cover category filtering, daily stake caps, prophet rank, football-source conflicts, and deadline closure.

## Bugs found and corrected with Kiro

- Node ESM imports in Vercel functions needed explicit `.js` suffixes.
- OpenFootball used season folder `2025-26`, not `2025`.
- The football server sliced old scheduled rows before selecting future fixtures.
- The political function initially crashed through a transitive ESM import.
- Gemini model `gemini-2.5-flash` returned 404; production diagnostics led to a current Flash compatibility list.
- TypeScript lost a narrowed political candidate across a property access; retaining the typed reference fixed the Vercel build.
- Real-source loading originally looked like demo mode; the Feed now states when Scout/Gemini are working and does not present fixtures as live data.

## Runtime AI versus development tools

Kiro designed, implemented, reviewed, tested, and corrected the application using specs, steering, repository context, and property-based invariants. Gemini is an optional runtime analyzer used by the deployed application to select exact public commitments from allowlisted source text. Gemini output is treated as untrusted: the source sentence must exist in the fetched article and local safety rules can raise it to RED or BLOCKED.

Planning material was initially prepared with Claude. The implementation and corrections were performed with Kiro. This distinction is disclosed in the app.

## Known limits

- Real political sources do not always contain a clear commitment and explicit future deadline; an empty result is safer than an invented quote.
- Live political resolution still requires human review and stronger independent evidence.
- Supabase schema/RLS are supplied, but the current MVP UI continues to use local state until authenticated persistence is connected.
- A real-phone smoke test, video publication, and Devpost submission require the project owner’s accounts and device.
