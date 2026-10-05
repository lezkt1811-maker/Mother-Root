# MotherRoot 🌳

> Know who is cutting the forest.

A public-record environmental accountability map showing documented deforestation projects across the United States. Built on official USFS and EPA data, MotherRoot tracks proposed, approved, active, and completed clearing projects with full transparency.

## What This Is

MotherRoot is an **open-data environmental accountability system** that:

- ✅ Maps all publicly documented timber harvest, mining, solar, and development clearing projects
- ✅ Shows who proposed, approved, and executed each project
- ✅ Tracks acreage: proposed vs. approved vs. actually cleared
- ✅ Links to original government records and permits
- ✅ Distinguishes project status (Proposed 🟢 → Approved 🟡 → Active 🟠 → Completed 🔴)
- ✅ Builds accountability through facts, not accusations

## Data Sources

- **USFS Timber Harvest Database** - National Forest Service data on planned and accomplished timber harvests (decades of history)
- **USFS NEPA Projects** - Environmental review records for forest management activities
- **EPA ECHO** - Facility, enforcement, and violation data
- **State Records** - State-level environmental permits and reviews

## Getting Started

### Prerequisites

- Node.js 16+
- Python 3.8+ (for data fetching)
- Git

### Installation

```bash
git clone https://github.com/lezkt1811-maker/Mother-Root.git
cd Mother-Root
npm install
```

### Run the Map

```bash
npm start
```

Open your browser to `http://localhost:8080` and click on any project to see details.

### Development

```bash
npm run dev
```

## Features (MVP)

The current version includes:

- 🗺️ **Interactive map** displaying deforestation projects by state
- 🔍 **Filtering** by state, status, and minimum acreage
- 📊 **Project details** showing acreage, dates, agency, contractor, and current status
- 🎯 **Status legend** with visual indicators for project stage
- 📱 **Responsive design** for desktop and mobile

### What the Map Shows

For each project:
- **Project name** and location
- **State, county, and agency** responsible
- **Company/contractor** (where publicly documented)
- **Acres**: proposed, approved, and actually cleared
- **Status**: proposed, approved, active, or completed
- **Date approved** and clearing type
- **Links to government records** (coming soon)

## Next Steps (Roadmap)

- [ ] Integration with real USFS API endpoints
- [ ] EPA ECHO enforcement data overlay
- [ ] Entity accountability view (track all projects by company)
- [ ] Historical data from decades of USFS records
- [ ] Document linking and NEPA review access
- [ ] Advanced filters (clearing type, date range, impact analysis)
- [ ] Data export (CSV, GeoJSON)

## Project Structure

```
MotherRoot/
├── index.html            # Main map interface
├── js/
│   └── map.js           # Map initialization and interactivity
├── data/
│   ├── projects.json    # Project records
│   ├── entities.json    # Company/agency information
│   └── usfs-projects.json  # USFS harvest data
├── scripts/
│   └── fetch-usfs-data.py  # Data fetching from USFS
├── docs/
│   ├── QUICKSTART.md     # Get started in 5 minutes
│   ├── API.md            # Data format documentation
│   ├── METHODOLOGY.md    # How we collect and verify data
│   └── SOURCES.md        # Data sources and credibility
├── config/
│   └── example.json      # Configuration template
└── README.md             # This file
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, open an issue on the [GitHub Issues](https://github.com/lezkt1811-maker/Mother-Root/issues) page.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history and updates.