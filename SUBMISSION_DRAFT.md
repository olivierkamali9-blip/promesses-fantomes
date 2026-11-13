# Kiroween 2026 submission draft

## Project

**Promesses Fantômes (Ghost Pledges)**

Category: **Costume Contest**

Production: https://promesses-fantomes.vercel.app/

## Short description

Public promises evaporate. Promesses Fantômes turns each verifiable statement into a ghost that people can follow until independent evidence arrives. Players stake virtual Souls on TENUE or ROMPUE; Souls have no monetary value.

## Full description

The ghost is the state of a promise. A faint Murmur awaits approval, an Apparition accepts stakes, a Haunting approaches its deadline, and final states show whether the pledge was kept, broken, or remained inconclusive. Ghost opacity represents the evidence ladder from L0 rumor to L4 primary data.

An AI crew separates responsibilities. Scout monitors configured sources. Drafter creates a binary question, deadline, and resolution criteria. Guardian applies GREEN, ORANGE, RED, and BLOCKED safety rules. Three Verifiers propose outcomes with confidence and sources. Gravekeeper records any human correction of an AI result in a visible demo cemetery stored on that device.

Political statements are never invented. Runtime Gemini analysis may select an exact sentence only when it exists in an allowlisted article and contains an attributable commitment with an explicit future deadline. Local rules still raise sensitive material to RED or BLOCKED. KEPT and BROKEN outcomes require evidence L3 or L4.

## How Kiro was used

Kiro converted the product idea into requirements, design constraints, implementation tasks, a pure TypeScript engine, mobile React UI, Vercel functions, safety gates, and fast-check invariants. Steering kept domain logic out of the UI and made every ghost communicate state or evidence. Kiro also diagnosed production failures involving Node ESM imports, source season paths, cache behavior, TypeScript narrowing, and Gemini model compatibility.

Planning specs and steering were initially prepared with Claude. Kiro implemented, tested, reviewed, and corrected the working application. Gemini is only a runtime feature inside the application.

## Technical highlights

- React, Vite, TypeScript, mobile-first PWA
- Pure engine with Vitest and fast-check
- Supabase Postgres schema is prepared but not connected in the demo build, where state is stored on the device
- Vercel serverless source adapters
- Demo mode with fictional fixtures and no API key
- Real football sources and allowlisted DRC public-information sources
- Accessible state labels, reduced motion, data saver, keyboard navigation
- MIT license

## Blog draft

**This article was written as part of the Kiroween 2026 hackathon.**

A public promise usually has a short life online. Promesses Fantômes gives it a longer memory. The application models each promise as a ghost whose movement and opacity reveal deadline pressure and evidence quality. The hardest work was not visual. It was defining what the system must refuse to claim.

Kiro specs and steering turned those boundaries into code: no monetary Souls, no conclusive resolution below L3 (two independent reliable sources) or L4 (official or primary data), no invented quote, and mandatory human control for sensitive subjects. Property-based tests check invariants across many generated cases rather than a few hand-picked examples.

The signature feature is the Cemetery of AI Mistakes. When a human corrects an AI resolution, the application preserves the original claim, correction, reason, and date. The product treats admitting an error as part of the experience rather than hiding it.

## Social post draft

#KiroweenHackathon26 Public promises become ghosts you can follow until evidence arrives. 👻 Promesses Fantômes combines a mobile haunted interface, virtual Souls, visible sources, safety tiers, property-based tests, and a visible on-device Cemetery of AI Mistakes. Built with Kiro. [ADD DEVPOST URL]

## Final external checklist

- [ ] Add public YouTube video URL under 3 minutes.
- [ ] Add screenshots and production URL to Devpost.
- [ ] Select Costume Contest.
- [ ] Do not select Startup or Student.
- [ ] Select Ghost of Kiroween Past only if registered in 2025.
- [ ] Publish the blog with the required Kiroween sentence.
- [ ] Publish the social post with the hashtag first.
- [ ] Submit before the deadline shown on Devpost.
