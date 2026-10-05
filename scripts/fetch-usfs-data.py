#!/usr/bin/env python3
"""
Fetch and process USFS timber harvest data from official GIS sources.

USFS provides public ArcGIS REST API data for:
1. Timber Harvest Projects (planned and accomplished)
2. NEPA Decision Project Areas
3. Decades of historical harvest data

This script fetches from USFS endpoints and converts to MotherRoot format.

References:
- USFS Public Web API: https://apps.fs.usda.gov/fsgisx01/rest/services
- Timber Harvest Database: https://data.fs.usda.gov/
- USFS Geospatial Data: https://www.fs.usda.gov/rds/archive/

Installation:
    pip install requests

Usage:
    python scripts/fetch-usfs-data.py [--state OR] [--limit 100]

This generates data/usfs-projects.json with all parsed projects.
"""

import json
import requests
import sys
import argparse
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional

# Create data directory if needed
Path("data").mkdir(exist_ok=True)

# USFS ArcGIS REST API endpoints
USFS_ENDPOINTS = {
    "timber_harvest": "https://apps.fs.usda.gov/fsgisx01/rest/services/RDS/ForestServicePublicWebAPI/MapServer/19/query",
    "projects": "https://apps.fs.usda.gov/fsgisx01/rest/services/RDS/ForestServicePublicWebAPI/MapServer/7/query",
}


def fetch_usfs_data(endpoint_name: str, where_clause: Optional[str] = None, limit: int = 1000) -> Optional[List[Dict]]:
    """
    Fetch GeoJSON data from USFS ArcGIS REST API.

    Args:
        endpoint_name: Key in USFS_ENDPOINTS dict
        where_clause: Custom WHERE clause for filtering
        limit: Maximum records to fetch

    Returns:
        List of features or None if fetch fails
    """
    endpoint = USFS_ENDPOINTS.get(endpoint_name)
    if not endpoint:
        print(f"❌ Unknown endpoint: {endpoint_name}")
        return None

    # Build query parameters
    params = {
        "where": where_clause or "1=1",
        "outFields": "*",
        "returnGeometry": "true",
        "f": "json",
        "returnTrueCurves": "false",
        "spatialRel": "esriSpatialRelIntersects",
        "outSR": '{"wkid":4326}',
        "resultRecordCount": limit,
    }

    try:
        print(f"📡 Fetching {endpoint_name}...")
        response = requests.get(endpoint, params=params, timeout=60)
        response.raise_for_status()
        data = response.json()

        if "error" in data:
            print(f"  ⚠️  API Error: {data['error'].get('message', 'Unknown error')}")
            return []

        features = data.get("features", [])
        print(f"  ✓ Found {len(features)} features")
        return features

    except requests.exceptions.Timeout:
        print(f"  ❌ Timeout fetching {endpoint_name}")
        return None
    except requests.exceptions.ConnectionError as e:
        print(f"  ❌ Connection error: {e}")
        return None
    except requests.exceptions.RequestException as e:
        print(f"  ❌ Error fetching {endpoint_name}: {e}")
        return None
    except json.JSONDecodeError as e:
        print(f"  ❌ Invalid JSON from {endpoint_name}: {e}")
        return None


def transform_feature(feature: Dict) -> Dict:
    """
    Transform raw USFS feature to MotherRoot format.

    Maps USFS ArcGIS REST API properties to standardized MotherRoot schema.
    """
    props = feature.get("attributes", {})
    geometry = feature.get("geometry", {})

    # Generate unique ID
    feature_id = props.get("OBJECTID", props.get("FID", hash(str(props))).__str__())

    return {
        "id": feature_id,
        "name": props.get("PROJECT_NAME", "Unknown Project"),
        "location": props.get("LOCATION_DESC", ""),
        "state": (props.get("STATE_CODE") or "").strip(),
        "county": (props.get("COUNTY_NAME") or "").strip(),
        "agency": props.get("AGENCY_NAME", "USFS"),
        "company": props.get("CONTRACTOR_NAME") or "Not disclosed",
        "acresProposed": float(props.get("ACRES_PROPOSED") or 0),
        "acresApproved": float(props.get("ACRES_APPROVED") or 0),
        "acresCleared": float(props.get("ACRES_ACCOMPLISHED") or 0),
        "dateApproved": props.get("DECISION_DATE", ""),
        "status": determine_status(props),
        "clearingType": props.get("HARVEST_TYPE") or "Timber harvest",
        "permitNumber": props.get("PERMIT_NUMBER") or "",
        "documentUrl": props.get("DOCUMENT_URL") or "",
        "geometry": geometry if geometry else None
    }


def determine_status(props: Dict) -> str:
    """
    Determine project status from USFS data.

    Status mapping:
    - Proposed: No acres accomplished yet, decision pending
    - Approved: Decision made, not yet started
    - Active: Work in progress (partial acreage accomplished)
    - Completed: All planned acres accomplished
    """
    accomplished = float(props.get("ACRES_ACCOMPLISHED") or 0)
    approved = float(props.get("ACRES_APPROVED") or 0)
    status_field = (props.get("PROJECT_STATUS") or "").upper()

    if "COMPLETE" in status_field or (accomplished >= approved and approved > 0):
        return "Completed"
    elif accomplished > 0:
        return "Active"
    elif "APPROVED" in status_field or approved > 0:
        return "Approved"
    else:
        return "Proposed"


def process_features(features: Optional[List[Dict]]) -> List[Dict]:
    """
    Process raw USFS features into MotherRoot format.

    Args:
        features: List of raw features from USFS API

    Returns:
        List of transformed features
    """
    if not features:
        return []

    transformed = []
    errors = 0

    for feature in features:
        try:
            transformed.append(transform_feature(feature))
        except Exception as e:
            errors += 1
            if errors <= 3:  # Only show first 3 errors
                print(f"  ⚠️  Error transforming feature: {e}")

    if errors > 3:
        print(f"  ⚠️  ... and {errors - 3} more errors")

    return transformed


def save_data(data: List[Dict], output_file: str) -> None:
    """Save processed data to JSON file."""
    with open(output_file, 'w') as f:
        json.dump(data, f, indent=2, default=str)
    print(f"\n✅ Saved {len(data)} projects to {output_file}")


def load_local_data(filename: str = "data/usfs-projects.json") -> List[Dict]:
    """Load local USFS data if available."""
    try:
        with open(filename, 'r') as f:
            data = json.load(f)
            print(f"✓ Loaded {len(data)} projects from {filename}")
            return data
    except FileNotFoundError:
        return []


def main():
    """Main execution: Fetch, transform, and save USFS data."""
    parser = argparse.ArgumentParser(description="Fetch USFS timber harvest data")
    parser.add_argument("--state", help="Filter by state code (e.g., OR, CA, WA)")
    parser.add_argument("--limit", type=int, default=1000, help="Max records to fetch")
    parser.add_argument("--load-local", action="store_true", help="Load from local file instead of API")

    args = parser.parse_args()

    print("=" * 50)
    print("MotherRoot: USFS Data Integration")
    print("=" * 50)

    # Check if loading local data
    if args.load_local:
        all_projects = load_local_data()
        if all_projects:
            print(f"\n🗺️  Ready to use {len(all_projects)} projects in the map")
            return True
        else:
            print("❌ No local data found. Run without --load-local to fetch from USFS")
            return False

    # Build WHERE clause for state filter
    where_clause = None
    if args.state:
        where_clause = f"STATE_CODE = '{args.state.upper()}'"
        print(f"\n📍 Filtering for state: {args.state.upper()}")

    all_projects = []

    for endpoint_name in USFS_ENDPOINTS.keys():
        print(f"\n📊 Fetching {endpoint_name}...")
        features = fetch_usfs_data(endpoint_name, where_clause, args.limit)
        projects = process_features(features)
        all_projects.extend(projects)

        if projects:
            print(f"  ✓ Processed {len(projects)} projects")

    if all_projects:
        output_file = "data/usfs-projects.json"
        save_data(all_projects, output_file)
        print(f"\n🚀 Ready to use {len(all_projects)} projects in the map!")
        return True
    else:
        print("\n⚠️  No projects fetched.")
        print("\nTroubleshooting:")
        print("1. Check internet connection")
        print("2. Verify USFS API endpoints are accessible")
        print("3. Try: python scripts/fetch-usfs-data.py --load-local")
        print("4. Or use sample data: python scripts/generate-sample-data.py")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
