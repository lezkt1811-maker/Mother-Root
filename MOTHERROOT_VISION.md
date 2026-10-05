# 🌲 MotherRoot: Forest Loss + Biomass Accountability Platform

## Core Mission
**Find the clearing. Follow the evidence. Track the trees.**

Track the complete lifecycle of forest loss:
- What was cleared (satellite + permits)
- How much (acreage + tree count)
- Who authorized it (agencies + permits)
- What happened to the trees (harvested / burned / chipped / unknown)
- Who was responsible (developers + contractors)
- What evidence exists (permits, imagery, reports)

---

## 🎯 Phase 1: Core Features (MVP)

### 1. Multi-Layer Map System

**Switchable Layers:**
- 🌲 **Forest Loss** - Clearings with before/after satellite
- 🔥 **Documented Burns** - Burn pits (verified, suspected, permitted)
- 🪓 **Timber Harvest** - Documented timber operations
- 🏗️ **Development Clearing** - Cleared for development
- 🛰️ **Rapid Change** - Overnight/rapid clearing detection
- 📋 **Permits** - Active permits + approvals
- 🏢 **Responsible Entities** - Companies + contractors
- 📍 **Community Reports** - Unverified community submissions
- ⚠️ **Enforcement** - EPA violations + penalties

### 2. Satellite Imagery Comparison (Before/After)

**For Each Clearing Event:**
```
🌲 Forest Present: [Date 1] → Imagery Link
🪓 Clearing Detected: [Date 2] → Imagery Link
📊 Acreage Change: 45.3 acres lost
⏱️ Timeframe: May 3 - May 10 (7 day window)
```

**Critical:** Only claim "overnight" if satellite proves it.
Otherwise say: "Clearing occurred within observation window."

### 3. Tree Destination Tracking

**For Each Clearing:**
```
🌲 Trees Cleared: 127.4 acres

📊 Documented Destiny:
  ✓ 42 acres - Timber harvested (document: permit #123)
  ✓ 18 acres - Chipped on-site (document: company report)
  ✓ 11 acres - Burned (document: burn permit #456)
  ✓ 56.4 acres - Destination UNKNOWN
```

**Key:** Unknown destination is itself important data.

### 4. Burn Pit Layer (Documented vs Suspected)

**Documented Burn:**
- Permit on file
- Photo evidence
- Air quality complaint
- Public record
- → Green pin = Verified

**Suspected Burn:**
- Satellite shows clearing → black spot
- No permit filed
- Community report
- Requires verification
- → Yellow pin = Needs evidence

**Clicking a burn shows:**
```
🔥 BURN EVENT

Status: SUSPECTED (no permit on file)
Location: Creekside Development, I-435 & Hwy 45
Date Detected: January 15, 2022 (satellite)
Acreage: ~18 acres cleared
Material: Trees (unknown species)
Authorized: Parkville Development Permit #PK-2022-WOODS-4-5
Responsible Entity: Creekside Developers
Source Documents:
  • City permit (approval date)
  • Before/after satellite imagery
  • Community report (user witnessed)
Verification Status: Needs air quality records, burn permits
```

### 5. Evidence Scoring System (A-D Credibility)

**Evidence Quality Rating:**

| Grade | Criteria | Example |
|-------|----------|---------|
| **A** | Government record + Satellite imagery + Permit | "Cleared for development, permit on file, satellite confirms 23-acre loss" |
| **B** | Government record + Satellite imagery | "Permit on file, satellite shows clearing" |
| **C** | Public record only | "City development tracker shows project approved" |
| **D** | Community report awaiting verification | "User reported overnight clearing" |

**Every claim in MotherRoot has an Evidence Score.**

No evidence = no claim.

### 6. Proposed vs Actual Clearing Overlay

**Two Map Layers:**
- 🔵 **PROPOSED CLEARING** - Footprint from permit/plan
- 🔴 **OBSERVED CLEARING** - Actual satellite-confirmed clearing

**Question:** Does actual match approved?

If actual > proposed → unauthorized clearing
If actual < proposed → project incomplete
If different shape → development changed

### 7. Developer/Company Entity Profiles

**Click a company:**
```
🏢 ENTITY: Creekside Developers

📊 Track Record:
  • Projects: 4
  • Documented clearing: 180 acres
  • Acreage with unknown tree destination: 67.4 acres
  • Burn events documented: 3
  • EPA violations: 2
  • Penalties: $8,000
  • Wasteful practices flagged: Burn pit destruction (cost-cutting)

🗓️ Timeline:
  • Active since: 2018
  • Current projects: 2 (Active, Approved)
  • Proposed projects: 0

📍 Geographic Range:
  • Missouri (5 projects)
  • Kansas (0 projects)

⚠️ Compliance Flags:
  • Rapid approval cycles detected (3-7 weeks)
  • Tree preservation requirements unclear
  • Multiple overnight clearing reports
```

### 8. "Overnight" Clearing Detector

**Satellite Comparison Algorithm:**

```
IF satellite_date_1 shows forest
AND satellite_date_2 (within 14 days) shows clearing
THEN flag as "RAPID CLEARING DETECTED"

Display:
  Forest present: [Date 1]
  Forest absent: [Date 2]
  Clearing window: [# days]
  Satellite source: [Google Earth, USGS, etc.]
  Acreage loss: [#]
```

**Never claim "overnight" without proof.**
Say: "Clearing detected within 7-day observation window."

### 9. Community Evidence Submission

**Users can submit:**
- 📸 Photos
- 🎥 Videos
- 📍 Coordinates
- 📅 Date observed
- 📝 Description
- 🏷️ Category (burning, illegal clearing, compliance issue)

**Workflow:**
1. Submission → ⚠️ UNVERIFIED COMMUNITY REPORT
2. Moderator review → Attach supporting evidence
3. Evidence verification → ✓ DOCUMENTED or ✗ INSUFFICIENT EVIDENCE
4. If verified → Integrate into main layers

### 10. Forest Loss Timeline Slider

**Interactive timeline:**
```
2018 ←→ 2019 ←→ 2020 ←→ 2021 ←→ 2022 ←→ 2023 ←→ 2024 ←→ 2025 ←→ 2026

Drag slider → Watch forest disappear
Each project shows clearing date
Visual transition shows clearing progression
```

**Powerful storytelling tool.**

---

## 🏗️ Technical Architecture

### Data Model

```
PROJECT
├── Basic Info (name, location, parcel)
├── Authorization
│   ├── Permit number
│   ├── Agency
│   ├── Approval date
│   └── Status
├── Clearing Event
│   ├── Date observed
│   ├── Satellite imagery (before/after)
│   ├── Acreage
│   └── Rapid change flag
├── Tree Destination
│   ├── Harvested (quantity, documents)
│   ├── Burned (quantity, permits)
│   ├── Chipped (quantity, documents)
│   ├── Unknown (quantity, flag)
│   └── Total validation
├── Responsible Entities
│   ├── Developer
│   ├── Contractor
│   └── History
├── Evidence
│   ├── Permits
│   ├── Satellite imagery
│   ├── Public photos
│   ├── Community reports
│   └── Enforcement records
└── Quality Score (A/B/C/D)
```

### Map Layers (Switchable)

```
[Toggle All] [Toggle None]

☐ 🌲 Forest Loss
☐ 🔥 Documented Burns
☐ 🔥 Suspected Burns (requires verification)
☐ 🪓 Timber Harvest
☐ 🏗️ Development Clearing
☐ 🛰️ Rapid Change (24-48 hours)
☐ 📋 Permits
☐ 🏢 Responsible Entities
☐ 📍 Community Reports
☐ ⚠️ Enforcement Actions
```

### Evidence Locker (Per Project)

```
📄 Permits (PDF links)
📄 Planning documents
📄 Environmental assessments
🛰️ Satellite imagery (linked)
📸 Public photographs
🗺️ Parcel boundaries
📜 Meeting minutes
📑 Enforcement records
🔗 Community reports
```

---

## 📊 Key Metrics

### Per Project
```
🌲 Trees Cleared: 127.4 acres
📊 Tree Disposition:
   42 acres documented harvested
   18 acres documented chipped
   11 acres documented burned
   56.4 acres destination UNKNOWN ← Important!

⏱️ Approval to clearing: 23 days (RED FLAG if < 30)
🏢 Responsible entity: [Company name]
⚠️ Evidence quality: B (permit + satellite)
```

### Per Entity
```
🏢 XYZ Development
   • Projects: 14
   • Acres cleared: 1,284
   • Acres with unknown destination: 487 (37.9%)
   • Burn events: 6
   • Rapid approval incidents: 4
   • EPA violations: 3
   • Compliance trend: ↓ (getting worse)
```

### Regional Summary
```
📍 Parkville, Missouri
   • Total forest loss tracked: 240 acres
   • Documented burns: 3
   • Suspected burns: 5 (need verification)
   • Unknown tree destination: 89 acres
   • Evidence quality average: B-
   • Contractor with most violations: Creekside Developers (2)
```

---

## 🎯 Why This Matters

### Before MotherRoot
- Developer clears forest
- City approves permit
- Trees disappear
- Nobody knows what happened
- Contractor repeats practice next year
- **Institutional forgetting**

### With MotherRoot
- Developer clears forest ← Detected via satellite
- City permit visible ← Tracked in system
- Trees disappear ← Before/after imagery documented
- Destination tracked ← Burned? Unknown? Documented
- Contractor flagged ← Violation pattern visible
- **Institutional memory**

### Accountability Chain
```
Satellite shows clearing
    ↓
Link to permit + approval date
    ↓
Track tree destination
    ↓
Cross-reference contractor
    ↓
EPA violation history
    ↓
Identify pattern (e.g., rapid approvals, burn pits)
    ↓
Future decision-makers are informed
```

---

## 🚀 Implementation Roadmap

### Phase 1 (Weeks 1-2)
- [ ] Multi-layer map system
- [ ] Before/after satellite comparison UI
- [ ] Tree destination tracking
- [ ] Evidence scoring (A/B/C/D)

### Phase 2 (Weeks 3-4)
- [ ] Burn pit layer (documented vs suspected)
- [ ] Proposed vs actual overlay
- [ ] Entity profile system
- [ ] Rapid change detection

### Phase 3 (Weeks 5-6)
- [ ] Community submission form
- [ ] Evidence locker (per project)
- [ ] Timeline slider (2018-2026)
- [ ] Regional summary dashboard

### Phase 4 (Ongoing)
- [ ] Advanced analytics
- [ ] Trend detection
- [ ] Compliance scoring
- [ ] Multi-jurisdiction expansion

---

## 🌍 Why MotherRoot Becomes Essential

**Real investigative data platform that:**
- Doesn't make accusations (evidence-based only)
- Doesn't pretend to know what it doesn't (marks unknown)
- Tracks patterns across time and contractors
- Integrates public records systematically
- Crowdsources community observations (with verification)
- Makes forest loss visible through satellite evidence
- Creates accountability through institutional memory

**The burn pit layer you described is perfect example:**
- Documented burns (verified, credible)
- Suspected burns (needs evidence)
- Clearly marked distinction
- Lets users see the pattern without false claims

This is how you build credibility. You don't hide unknowns. You document them.

---

**Core Principle:**
> MotherRoot doesn't guess. MotherRoot documents.
> It tracks what happened, where, to whom, and why.
> It makes the invisible visible.
> And it never forgets.

🌲 **Know who is cutting the forest. Know what happened to the trees.**
