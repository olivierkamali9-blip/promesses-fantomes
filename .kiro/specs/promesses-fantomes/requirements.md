# Requirements — Promesses Fantômes (Ghost Pledges)

## Introduction
Promesses Fantômes (Ghost Pledges) is a mobile-first web app where public pledges become ghosts that players follow, stake Souls (virtual points) on, and see resolved with visible evidence. An AI crew drafts, checks and resolves pledges under human-approval safety tiers.

## Requirements

### R1 Pledge feed
**User story:** As a player, I want a feed of open pledges so I can see what is being promised.
1. WHEN the app loads THEN the system SHALL list open pledges with ghost, question, deadline countdown, YES/NO stake split and evidence level.
2. WHEN data is unavailable THEN the system SHALL show a haunted but readable error state and keep cached pledges visible.

### R2 Ghost lifecycle
1. THE system SHALL model states MURMUR, APPARITION, HAUNTING, KEPT, BROKEN, INCONCLUSIVE.
2. WHEN a pledge is within 24h of its deadline THEN the system SHALL move it to HAUNTING.
3. WHEN a pledge is resolved THEN the ghost SHALL show the matching final animation and text.
4. A pledge SHALL never leave a final state except through a recorded human override.

### R3 Evidence ladder
1. EACH pledge SHALL carry an evidence level L0 to L4 computed from its attached sources.
2. WHEN fewer than two independent sources or one official document support the outcome THEN the system SHALL NOT resolve KEPT or BROKEN.
3. WHEN evidence is insufficient at the deadline THEN the system SHALL mark INCONCLUSIVE and refund all stakes.

### R4 Souls economy (virtual only)
1. EACH new player SHALL receive 1,000 Souls.
2. WHEN a pledge resolves KEPT or BROKEN THEN winners SHALL share the whole pool in proportion to their stake using integer Souls.
3. THE sum of all payouts SHALL equal the pool exactly (no Soul created or lost).
4. IF nobody staked on the winning side THEN all stakes SHALL be refunded.
5. Souls SHALL NOT be purchasable or withdrawable; the UI SHALL state they have no monetary value.

### R5 AI pledge detection and drafting
1. THE Scout SHALL scan configured sources and propose candidate pledges with source links.
2. THE Drafter SHALL produce a question with unambiguous resolution criteria, a deadline, two balanced sides with sources, and a safety tier.
3. A pledge without criteria, deadline or source SHALL NOT be publishable.

### R6 Safety tiers and approval
1. THE Guardian SHALL classify every draft GREEN, ORANGE, RED or BLOCKED with a reason.
2. GREEN SHALL auto-publish; ORANGE SHALL publish as UNCONFIRMED and require approval to resolve; RED SHALL require approval before publication; BLOCKED SHALL be rejected and logged.
3. THE approval queue SHALL let a human approve, edit or reject with a reason.

### R7 Resolution
1. THE Verifier ensemble (three independent checks) SHALL propose outcomes with sources and confidence.
2. IF the checks disagree or confidence is below threshold THEN the item SHALL go to human review.
3. WHEN a human overrides an AI resolution THEN the system SHALL carve a tombstone in the Cemetery of AI Mistakes with date, reason and the AI's original claim.

### R8 Cemetery
1. THE Cemetery SHALL show broken pledges and AI mistakes in two tabs, each with its evidence.

### R9 Transparency
1. EACH pledge page SHALL show "Why the AI believes this": sources, evidence level, confidence, and tier.

### R10 Accessibility and low data
1. THE app SHALL work at 360px width, respect reduced motion, keep AA contrast, and not rely on colour alone.
2. First-load JavaScript SHALL stay under 100 KB gzipped (transferred size), because transferred size determines how many bytes users download on slow networks.

### R11 Demo mode
1. WHEN VITE_DEMO=1 THEN the app SHALL run end to end on fixtures without network or API keys.
2. Seed data SHALL be labelled "Fictional demo scenario".

### R12 Language
1. THE UI SHALL default to French with an English toggle.
