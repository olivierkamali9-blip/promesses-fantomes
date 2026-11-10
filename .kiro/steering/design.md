---
inclusion: always
---
# Design Steering — "Haunting that has a job"

Principle: every spooky element must carry information. If it does not communicate state, evidence or risk, remove it.

## Tokens
bg #0B0914 | surface #14101F | text #E8E6F0 | muted #9A94B0 | spectral #7CFFC4 | violet #8B5CF6 | ember #FF8A4C | bone #D8D2C2 | danger #FF5C7A
Fonts: display "Cormorant Garamond", body "Inter", with system fallbacks. Load max two weights each.

## Ghost figure (SVG, CSS animation only)
- Opacity = evidence level: L0 0.25, L1 0.4, L2 0.6, L3 0.8, L4 1.0
- MURMUR: flickers; APPARITION: slow float; HAUNTING: faster float and ember glow; KEPT: stops, solid, warm light; BROKEN: slow sink animation to the Cemetery.
- Also expose state as text and icon (never rely on colour alone).

## Screens
1. Feed: pledge cards (ghost, question, countdown, YES/NO split, evidence ladder chips)
2. Pledge: ghost large, evidence timeline, stake sheet, "Why the AI believes this" panel with sources and confidence
3. Approval queue (Guardian): orange/red items, approve, edit, reject with reason
4. Cemetery: tab 1 broken pledges, tab 2 AI mistakes (tombstones with date and reason)
5. Profile: Souls, Prophet Rank, history

## Quality bar
- Mobile first at 360px width, works at 3G, total first-load JS under 200 KB
- Respect prefers-reduced-motion; sound off by default
- Contrast AA minimum; focus states visible
- Empty, loading and error states all haunted but readable
