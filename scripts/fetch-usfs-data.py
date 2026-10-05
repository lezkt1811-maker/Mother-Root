#!/usr/bin/env python3
"""
Fetch and process USFS timber harvest data from official GIS sources.

USFS provides public GeoJSON data for:
1. Timber Harvest Projects (planned and accomplished)
2. NEPA Decision Project Areas
3. Historical harvest layers (decades of data)

This script demonstrates fetching from USFS endpoints and converting
to MotherRoot data format.

References:
- USFS National Timber Harvest Database: https://data.fs.usda.gov/
- USFS Geospatial Data: https://www.fs.usda.gov/rds/archive/
"""

import json
import requests
from datetime import datetime

# USFS data endpoints (example - actual URLs vary by forest/region)
USFS_ENDPOINTS = {
    "timber_harvest": "https://data.fs.usda.gov/api/forest-management/timber-harvest",
    "nepa_projects": "https://data.fs.usda.gov/api/forest-management/nepa-projects",
}

def fetch_usfs_data(endpoint_name):
    """
    Fetch GeoJSON data from USFS endpoints.

    Args:
        endpoint_name: Key in USFS_ENDPOINTS dict

    Returns:
        GeoJSON FeatureCollection or None if fetch fails
    """
    endpoint = USFS_ENDPOINTS.get(endpoint_name)
    if not endpoint:
        print(f"Unknown endpoint: {endpoint_name}")
        return None

    try:
        print(f"Fetching {endpoint_name}...")
        response = requests.get(endpoint, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching {endpoint_name}: {e}")
        return None

def transform_feature(feature):
    """
    Transform raw USFS feature to MotherRoot format.

    Maps USFS properties to standardized MotherRoot schema.
    """
    props = feature.get("properties", {})

    return {
        "name": props.get("PROJECT_NAME", "Unknown Project"),
        "location": props.get("LOCATION_DESC", ""),
        "state": props.get("STATE_CODE", ""),
        "county": props.get("COUNTY_NAME", ""),
        "agency": props.get("AGENCY_NAME", "USFS"),
        "company": props.get("CONTRACTOR_NAME", "Not disclosed"),
        "acresProposed": float(props.get("ACRES_PROPOSED", 0)),
        "acresApproved": float(props.get("ACRES_APPROVED", 0)),
        "acresCleared": float(props.get("ACRES_ACCOMPLISHED", 0)),
        "dateApproved": props.get("DECISION_DATE", ""),
        "status": determine_status(props),
        "clearingType": props.get("HARVEST_TYPE", "Timber harvest"),
        "permitNumber": props.get("PERMIT_NUMBER", ""),
        "documentUrl": props.get("DOCUMENT_URL", ""),
        "geometry": feature.get("geometry")
    }

def determine_status(props):
    """
    Determine project status from USFS data.

    Status mapping:
    - Proposed: No acres accomplished yet, decision pending
    - Approved: Decision made, not yet started
    - Active: Work in progress (partial acreage accomplished)
    - Completed: All planned acres accomplished
    """
    accomplished = float(props.get("ACRES_ACCOMPLISHED", 0))
    approved = float(props.get("ACRES_APPROVED", 0))
    status_field = props.get("PROJECT_STATUS", "").upper()

    if "COMPLETE" in status_field or (accomplished >= approved and approved > 0):
        return "Completed"
    elif accomplished > 0:
        return "Active"
    elif "APPROVED" in status_field or approved > 0:
        return "Approved"
    else:
        return "Proposed"

def process_data(geojson_data):
    """
    Process raw USFS GeoJSON into MotherRoot format.

    Args:
        geojson_data: Raw GeoJSON FeatureCollection from USFS

    Returns:
        List of transformed features
    """
    if not geojson_data:
        return []

    features = geojson_data.get("features", [])
    transformed = []

    for feature in features:
        try:
            transformed.append(transform_feature(feature))
        except Exception as e:
            print(f"Error transforming feature: {e}")
            continue

    return transformed

def save_data(data, output_file):
    """Save processed data to JSON file."""
    with open(output_file, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"Saved {len(data)} projects to {output_file}")

def main():
    """
    Main execution: Fetch, transform, and save USFS data.

    NOTE: This is a template. Actual USFS API endpoints vary.
    You'll need to:
    1. Identify the correct USFS REST endpoints for your region
    2. Handle authentication if required
    3. Implement pagination for large datasets
    4. Add error handling for specific API response formats
    """
    print("MotherRoot: USFS Data Fetcher")
    print("-" * 40)

    all_projects = []

    for endpoint_name in USFS_ENDPOINTS.keys():
        print(f"\nProcessing {endpoint_name}...")
        geojson = fetch_usfs_data(endpoint_name)
        projects = process_data(geojson)
        all_projects.extend(projects)

    if all_projects:
        output_file = "data/usfs-projects.json"
        save_data(all_projects, output_file)
    else:
        print("\nNo projects fetched. Check API endpoints and authentication.")

    return len(all_projects) > 0

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
