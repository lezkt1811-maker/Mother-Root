# Data Sources and Credibility

MotherRoot is built exclusively on official public records. Every project, acreage figure, and contractor name comes from verifiable government data.

## Primary Sources

### 1. USFS Timber Harvest Database

**Source**: U.S. Forest Service  
**URL**: https://data.fs.usda.gov/  
**Format**: GeoJSON, REST API, downloadable datasets

What it contains:
- Planned timber harvests across all National Forests
- Accomplished (completed) harvest areas by year
- Historical data going back decades
- Contractor information (where available)
- Acres planned vs. acres accomplished

**Limitations** (documented by USFS):
- Does not include all harvests (spatial reporting hasn't always been mandatory)
- Some older records lack complete acreage data
- Private land harvests not included

**Why we use it**: It's the most comprehensive national timber harvest database available and explicitly designed for public transparency.

### 2. USFS NEPA Projects

**Source**: U.S. Forest Service  
**URL**: https://www.fs.usda.gov/rds/archive/  
**Format**: GeoJSON, project polygons

What it contains:
- Environmental review project areas
- Decision dates and approval status
- Links to environmental assessment documents
- Associated permits and case numbers

**Why we use it**: Environmental review records provide legal accountability and permit status.

### 3. EPA ECHO System

**Source**: Environmental Protection Agency  
**URL**: https://echo.epa.gov/  
**Format**: REST API, downloadable datasets

What it contains:
- Facility inspection records
- Environmental enforcement actions
- Violations and penalties
- Compliance history

**Why we use it**: Enforces environmental law; violations tied to specific entities.

### 4. State Environmental Records

**Source**: State-level environmental agencies  
**Varies by state**: California, Oregon, Washington, Colorado, etc.

What it contains:
- State permits for clearing/mining/development
- Local environmental reviews
- Cumulative impact assessments

**Why we use it**: Captures projects not on federal land.

## Data Verification Process

Before a project appears on MotherRoot, we verify:

1. ✅ **Source credibility** - Data comes from official government databases
2. ✅ **Acreage accuracy** - Cross-reference multiple sources where available
3. ✅ **Entity identification** - Company/agency names from official records
4. ✅ **Permit/record links** - Direct reference to government documents
5. ✅ **Status consistency** - Project status reflects what records show

## What We Don't Include

- **Unverified allegations** - Only documented projects
- **Private addresses** - We map locations, not personal data
- **Speculation** - Only facts from public records
- **Historical removal** - If a project was removed from records, we note that

## Updating Data

MotherRoot data is updated:
- **Weekly** from USFS timber harvest database
- **Monthly** from EPA ECHO enforcement actions
- **As available** from state records

To check when data was last updated:
```bash
git log --oneline -- data/
```

## How to Verify a Project

Every project on MotherRoot links to the original government record. You can:

1. **Click the project** on the map
2. **Find "Government Record"** link in details
3. **Verify acreage, dates, and contractor** in the original document

## Contributing Data

Found an error in MotherRoot? Help us fix it:

1. Open an [issue](https://github.com/lezkt1811-maker/Mother-Root/issues) with:
   - Which project
   - What's wrong
   - Link to correct government record
   - Your source

2. Submit a [pull request](https://github.com/lezkt1811-maker/Mother-Root/pulls) with corrected data

All contributions must cite government sources.

## Transparency Reports

See `docs/TRANSPARENCY.md` for:
- Data gaps and limitations
- Projects we couldn't verify
- Discrepancies between sources
- Our methodology for conflict resolution
