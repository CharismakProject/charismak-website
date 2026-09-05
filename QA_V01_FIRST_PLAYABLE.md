# Construction Manager V0.1 — First Playable QA

Date: 2026-09-05
Scope: Frozen V0.1 vertical slice only.

## Evidence basis

- Current locked CM-008 engine/data recovered from the CM-007 verification archive.
- Fresh QA harness executed against the recovered engine functions for company creation, tender, award, mobilisation, finance, duplicate-action protection, invalid bid handling, and save serialization round-trip.
- CM-007 verified production-browser record used for browser-only navigation/mobile and first construction-day outcome because the temporary GitHub transport archive is corrupted after the engine files and cannot reproduce the full web layer in this QA environment.

## Baseline vertical slice

Normal recommended-bid path:

1. Company creation starts with NGN 650,000.
2. Tender: NGN 4,800,000.
3. Award creates one project.
4. Mobilisation receipt: +NGN 1,680,000.
5. Starter material: -NGN 110,000.
6. Delivery: -NGN 15,000.
7. Cash after mobilisation procurement: NGN 2,205,000.
8. First-day labour: -NGN 20,000.
9. Expected/verified cash after first construction day: NGN 2,185,000.
10. One starter pack is fully consumed: stock 1 -> 0.
11. First activity duration = 1 working day; activity weight = 5% of the 20-day project plan.
12. Verified first-day result: activity 100%, project 5%, date 2026-09-08.

## Findings by area

### Gameplay clarity

PASS for the current slice. The verified Command Centre presents the attention item and directs the player to review site effects. No reproducible clarity defect recorded.

BALANCING NOTE: The first tender outcome is scripted to award. This is explicitly documented in engine code as a first-slice outcome, so it is not treated as a defect. However, the tender-value exploit below must be fixed because it breaks the financial/gameplay loop.

### Construction credibility

PASS for the implemented first activity. A 3-labourer general crew at NGN 20,000/day completes the 1-LS Mobilisation & Protection activity in one standard crew day. One protection pack is required and one is consumed. 1/20 of planned project duration = 5% project weight, matching the verified 5% overall progress.

### Financial correctness

PASS on the normal recommended-bid path:

NGN 650,000 + NGN 1,680,000 - NGN 110,000 - NGN 15,000 - NGN 20,000 = NGN 2,185,000.

This equals the CM-007 browser result on desktop and mobile.

### Navigation

PASS in the CM-007 production browser record for Home, Inbox, Projects, People, Market, Finance, Calendar and Company, with no recorded console/page errors.

### Mobile usability

PASS in the CM-007 production browser record at 390x844. Scroll width matched viewport width; mobile navigation rendered and desktop sidebar was hidden.

### Save/resume

PASS at engine level in fresh QA execution: serializeState -> deserializeState returned a deep-equal game state. CM-007 previously verified browser save/refresh/resume on the production build. No new save defect reproduced.

### Obvious exploits

#### QA-BUG-001 — Unbounded tender value can manufacture mobilisation cash

Severity: **MAJOR**

Steps:
1. Create a new company.
2. Open the first Small Renovation opportunity.
3. Submit a very high positive bid, e.g. NGN 1,000,000,000.
4. Resolve the scripted first tender.
5. Mobilise the awarded project.

Expected:
The tender/award path must enforce the already-locked valid tender/award constraints so an arbitrary bid cannot create impossible contract and mobilisation values.

Actual:
Any finite bid greater than zero is accepted by submitTender, and the scripted award accepts it. A NGN 1,000,000,000 bid becomes a NGN 1,000,000,000 contract, creates a NGN 350,000,000 mobilisation receipt, and leaves NGN 350,525,000 cash after starter procurement.

Additional proof:
A NGN 1 bid is also awarded. Its 35% mobilisation rounds to NGN 0, but the project can still mobilise from starting company cash, leaving NGN 525,000 after starter procurement.

Impact:
Breaks tender credibility, cash-flow challenge, progression and financial correctness. This is a genuine defect and should return to 04 — DEVELOPMENT.

Development constraint:
Do not invent a new tender mechanic. Enforce the already-locked V0.1 tender/bid acceptance constraint or locked balancing rule only.

## Exploit checks that passed

- Blank company name rejected.
- Zero bid rejected.
- Negative bid rejected.
- NaN bid rejected.
- Infinite bid rejected.
- Repeat tender submission against the updated state rejected.
- Repeat tender resolution/award rejected.
- Repeat mobilisation rejected.
- Save serialization round-trip preserved state exactly.

## Severity summary

- BLOCKER: 0
- MAJOR: 1
- MINOR: 0
- BALANCING: 1 note (scripted first award; intentional current-slice behaviour)

## QA gate

OPEN. QA-BUG-001 requires a defect-only fix and regression test before V0.1 first-playable QA can close.
