#!/usr/bin/env python3
"""
Generate realistic sample USFS timber harvest data for development/testing.

This creates data in the MotherRoot format based on real USFS data patterns.
Use this to test the map without needing live API access.

Usage:
    python scripts/generate-sample-data.py
    python scripts/generate-sample-data.py --count 50  # Generate more projects

Output:
    data/usfs-projects.json
"""

import json
import random
from datetime import datetime, timedelta
from pathlib import Path

Path("data").mkdir(exist_ok=True)

# Realistic project data based on actual USFS records
FORESTS = {
    "OR": [
        {
            "forest": "Willamette National Forest",
            "agency": "USFS - Willamette National Forest",
            "bounds": [(-122.5, 43.8), (-121.2, 44.8)]
        },
        {
            "forest": "Wallowa-Whitman National Forest",
            "agency": "USFS - Wallowa-Whitman National Forest",
            "bounds": [(-118.8, 45.0), (-117.5, 46.0)]
        },
    ],
    "CA": [
        {
            "forest": "Eldorado National Forest",
            "agency": "USFS - Eldorado National Forest",
            "bounds": [(-121.2, 38.3), (-120.0, 39.0)]
        },
        {
            "forest": "Klamath National Forest",
            "agency": "USFS - Klamath National Forest",
            "bounds": [(-123.5, 41.5), (-121.8, 42.8)]
        },
    ],
    "WA": [
        {
            "forest": "Snoqualmie National Forest",
            "agency": "USFS - Snoqualmie National Forest",
            "bounds": [(-122.2, 47.2), (-121.0, 47.9)]
        },
        {
            "forest": "Gifford Pinchot National Forest",
            "agency": "USFS - Gifford Pinchot National Forest",
            "bounds": [(-122.2, 46.0), (-121.2, 46.8)]
        },
    ],
    "CO": [
        {
            "forest": "Arapaho National Forest",
            "agency": "USFS - Arapaho National Forest",
            "bounds": [(-106.5, 39.4), (-105.0, 40.0)]
        },
    ],
    "ID": [
        {
            "forest": "Nez Perce-Clearwater National Forest",
            "agency": "USFS - Nez Perce-Clearwater National Forest",
            "bounds": [(-116.5, 45.5), (-114.5, 46.5)]
        },
    ],
}

COMPANIES = [
    "Weyerhaeuser Corporation",
    "Sierra Pacific Industries",
    "Rayonier Inc.",
    "Hampton Lumber Mills",
    "Collins Company",
    "Green Diamond Resource Company",
    "Plum Creek Timber Company",
    "Potlatch Deltic Corporation",
]

PROJECT_TYPES = [
    "Timber harvest",
    "Timber harvest - salvage",
    "Vegetation management",
    "Fuels reduction",
    "Forest restoration",
]

STATUSES_WITH_DATES = {
    "Proposed": {"acres_mult": (0, 0.1), "years_ago": (2, 5)},
    "Approved": {"acres_mult": (0, 0.3), "years_ago": (1, 3)},
    "Active": {"acres_mult": (0.2, 0.7), "years_ago": (0.5, 2)},
    "Completed": {"acres_mult": (0.8, 1.0), "years_ago": (0.1, 2)},
}


def generate_project(project_id: int, state: str) -> dict:
    """Generate a single realistic project."""
    forest = random.choice(FORESTS[state])
    bounds = forest["bounds"]

    # Random coordinates within forest bounds
    lon = random.uniform(bounds[0][0], bounds[1][0])
    lat = random.uniform(bounds[0][1], bounds[1][1])

    # Acreage ranges based on actual USFS projects
    acres_approved = random.choice(
        list(range(500, 1000, 100)) +
        list(range(1000, 3000, 200)) +
        list(range(3000, 5000, 500))
    )
    acres_proposed = int(acres_approved * random.uniform(1.0, 1.3))

    # Status determines how much has been cleared
    status = random.choice(list(STATUSES_WITH_DATES.keys()))
    status_info = STATUSES_WITH_DATES[status]
    mult_min, mult_max = status_info["acres_mult"]
    acres_cleared = int(acres_approved * random.uniform(mult_min, mult_max))

    # Generate date
    years_min, years_max = status_info["years_ago"]
    days_ago = random.randint(
        int(years_min * 365),
        int(years_max * 365)
    )
    date_approved = (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d")

    # Project name
    project_num = random.randint(100, 9999)
    project_name = f"{forest['forest']} Project {project_num}"

    # County (simplified - just use forest location)
    counties = {
        "Willamette": "Lane", "Wallowa-Whitman": "Baker",
        "Eldorado": "El Dorado", "Klamath": "Siskiyou",
        "Snoqualmie": "King", "Gifford Pinchot": "Lewis",
        "Arapaho": "Clear Creek", "Nez Perce-Clearwater": "Idaho",
    }
    county = counties.get(forest["forest"].split()[0], "Unknown")

    return {
        "id": f"usfs-{project_id:05d}",
        "name": project_name,
        "location": f"Near {forest['forest'].replace(' National Forest', '')}, {state}",
        "state": state,
        "county": county,
        "agency": forest["agency"],
        "company": random.choice(COMPANIES),
        "acresProposed": acres_proposed,
        "acresApproved": acres_approved,
        "acresCleared": acres_cleared,
        "dateApproved": date_approved,
        "status": status,
        "clearingType": random.choice(PROJECT_TYPES),
        "permitNumber": f"USFS-{state}-{project_id:04d}",
        "documentUrl": f"https://data.fs.usda.gov/projects/usfs-{project_id:05d}",
        "geometry": {
            "type": "Point",
            "coordinates": [lon, lat]
        }
    }


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Generate sample USFS data")
    parser.add_argument("--count", type=int, default=25, help="Number of projects to generate")

    args = parser.parse_args()

    print("=" * 50)
    print("Generating sample USFS data for MotherRoot")
    print("=" * 50)

    projects = []
    for i in range(args.count):
        state = random.choice(list(FORESTS.keys()))
        project = generate_project(i + 1, state)
        projects.append(project)

        if (i + 1) % 5 == 0:
            print(f"✓ Generated {i + 1} projects...")

    # Save
    output_file = "data/usfs-projects.json"
    with open(output_file, 'w') as f:
        json.dump(projects, f, indent=2)

    print(f"\n✅ Generated {len(projects)} sample projects")
    print(f"📁 Saved to {output_file}")
    print(f"\n🚀 Ready! Start the map with: npm start")


if __name__ == "__main__":
    main()
