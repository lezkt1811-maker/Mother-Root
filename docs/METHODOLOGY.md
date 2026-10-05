# MotherRoot Methodology

## What This Project Is

MotherRoot is an **environmental accountability database**, not a news outlet or advocacy site. We map the forest remembers: who proposed clearing, who approved it, what the records show actually happened.

## Core Principles

### 1. Facts Over Narrative

We show:
- ✅ "USFS records show 2,450 acres proposed, 1,930 approved, 1,240 cleared as of [date]"
- ❌ "The forest is being destroyed" (opinion)

### 2. Status Matters

A project isn't "approved" unless government records say approved. We distinguish:

| Status | Means | Example |
|--------|-------|---------|
| 🟢 **Proposed** | Submitted, not yet approved | Application pending |
| 🟡 **Approved** | Government gave permission | Permit issued |
| 🟠 **Active** | Work in progress | Clearing underway |
| 🔴 **Completed** | Project finished | All acres accomplished |

This prevents misrepresentation. "Proposed 4,000 acres" ≠ "destroyed 4,000 acres."

### 3. Evidence-Based

Every figure ties to a government document:
- Acreage: USFS timber harvest layer or permit
- Dates: Official decision documents
- Contractor: Government records (where available)
- Current status: Latest agency update

### 4. Gender-Blind Accountability

We identify responsible entities (companies, agencies, individuals) based on what records show. We don't assume gender, manufacture outrage, or make claims beyond the data.

If a corporation is responsible for documented clearing, we show that fact. The data doesn't care about demographics.

## How We Classify Projects

### Status Determination

```
IF acres_accomplished >= acres_approved AND acres_approved > 0
  THEN status = "Completed"

ELSE IF acres_accomplished > 0
  THEN status = "Active"

ELSE IF acres_approved > 0 AND decision_made = TRUE
  THEN status = "Approved"

ELSE
  THEN status = "Proposed"
```

### Acreage Categories

- **Proposed**: In permit application or pre-decision
- **Approved**: Government decision document issued
- **Accomplished**: Actual work completed (from USFS yearly reports)

### Clearing Types

Projects are categorized by actual work type:
- Timber harvest
- Mining
- Solar development
- Wind development
- Housing/infrastructure
- Pipeline/transmission
- Road construction
- Agriculture
- Water management
- Other

## Data Quality Assurance

### Before a Project Goes Live

1. **Record found** - Located in USFS, EPA, or state database
2. **Fields extracted** - Name, location, acreage, dates, contractor
3. **Cross-reference** - Verify against other available sources
4. **Geometry validated** - GIS layer matches government map
5. **Links tested** - Government record URL still works
6. **Reviewed** - Manual review for obvious errors

### What Happens When Sources Disagree

When USFS and state records show different acreage:

1. Note the discrepancy in the project record
2. Link to both sources
3. Use most conservative (lowest) acreage figure
4. Document the conflict in comments

This prevents inflated figures that weaken credibility.

### What We Skip

We exclude:
- 📌 Unconfirmed allegations
- 📌 Projects in private litigation (until resolved)
- 📌 Historical projects with no retrievable records
- 📌 Proposed projects older than 10 years with no progress

## Entity History

The "Entity Accountability" view shows:

```
WEYERHAEUSER CORPORATION

Projects documented: 47
States: OR, WA, CA, ID
Total proposed: 134,200 acres
Total approved: 128,600 acres
Total accomplished: 89,450 acres

Enforcement actions: 2
  - 2018: EPA violation, $125,000 penalty
  - 2021: USFS permit suspension (30 days)

First project: 1998
Most recent: 2024
```

**All figures verified against government records.**

## How Updates Work

### Weekly Data Refresh

```
1. Query USFS timber harvest API
2. Fetch new/updated projects
3. Cross-reference existing records
4. Flag changes (new project, acreage update, status change)
5. Commit changes with audit trail
```

### Audit Trail

Every dataset change is recorded:
```json
{
  "timestamp": "2024-10-05T15:30:00Z",
  "project_id": "usfs-12345",
  "field": "acres_accomplished",
  "old_value": 1200,
  "new_value": 1450,
  "source": "USFS timber harvest database update",
  "verified": true
}
```

This creates accountability for data itself.

## Transparency & Limitations

### What We Can't Show

- **Private land harvests** - USFS data only covers federal land mostly
- **Pre-1980s projects** - Historical records incomplete
- **Real-time activity** - Data lags USFS updates by ~1 week
- **Climate impact** - We show acreage, not ecological consequence
- **Wildlife displacement** - Documented elsewhere, not in our scope

### What We Acknowledge

- Some USFS data is incomplete (they acknowledge this)
- State records vary widely in quality and accessibility
- Contractor information sometimes withheld for "proprietary" reasons
- Estimated acreage sometimes differs between federal and state records

## Research Standards

If you're using MotherRoot for research:

1. **Verify claims independently** - Use links provided, don't take our word
2. **Understand the lag** - Data may be weeks old
3. **Know the gaps** - Read SOURCES.md and understand what's not included
4. **Cite properly** - Link to original government record, not MotherRoot
5. **Report errors** - Help us improve accuracy

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for how to:
- Report data errors
- Suggest new data sources
- Improve documentation
- Help with data verification

## Questions?

- **Data accuracy**: Open an [issue](https://github.com/lezkt1811-maker/Mother-Root/issues)
- **Methodology**: See [docs/](./), especially SOURCES.md
- **Technical**: Check [README](../README.md)
