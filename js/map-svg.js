// MotherRoot Deforestation Accountability Map - Leaflet Implementation
// Real geographic map with USFS data and EPA enforcement

let currentProjects = [];
let filteredProjects = [];
let currentView = 'projects';
let currentEntities = {};
let activeLayers = ['Forest Loss', 'Documented Burns', 'Burn Pits', 'Permits', 'Responsible Entities'];
let mapInstance = null;
let projectsLayerGroup = null;
let burnPitLayerGroup = null;
let markerClusterGroup = null;
let layerGroups = {};

// Load all project data (USFS timber + Parkville development)
async function loadProjectData() {
  const allProjects = [];

  // Load Parkville PARCEL BOUNDARIES (lot-level GeoJSON)
  try {
    const parcelResponse = await fetch('data/parkville-parcels.geojson');
    if (parcelResponse.ok) {
      const parcelData = await parcelResponse.json();
      const parcels = parcelData.features.map(feature => {
        return {
          id: feature.properties.projectId * 1000 + feature.properties.lotNumber,
          name: `${feature.properties.projectName} - Lot ${feature.properties.lotNumber}`,
          sourceType: 'Parkville Parcel',
          status: feature.properties.status,
          acres: feature.properties.acresPerLot,
          parcel: feature.properties.parcelId,
          geometry: feature.geometry,
          properties: feature.properties
        };
      });
      allProjects.push(...parcels);
      console.log(`✓ Loaded ${parcels.length} Parkville parcel boundaries (lot-level)`);
    }
  } catch (error) {
    console.log('Parkville parcels not available:', error.message);
  }

  // Load Parkville development projects (for metadata)
  try {
    const parkvilleResponse = await fetch('data/parkville-development-projects.json');
    if (parkvilleResponse.ok) {
      const parkvilleData = await parkvilleResponse.json();
      parkvilleData.forEach(p => {
        p.sourceType = 'Parkville Project';
        p.geometry = { type: "Point", coordinates: [p.coordinates.lng, p.coordinates.lat] };
      });
      // Keep for reference but don't add to display (parcels take priority)
      console.log(`✓ Loaded ${parkvilleData.length} Parkville project metadata`);
    }
  } catch (error) {
    console.log('Parkville project metadata not available');
  }

  // Load USFS timber projects
  try {
    const enforcementResponse = await fetch('data/usfs-projects-with-enforcement.json');
    if (enforcementResponse.ok) {
      const usfsData = await enforcementResponse.json();
      usfsData.forEach(p => p.sourceType = 'USFS Timber Sale');
      allProjects.push(...usfsData);
      console.log(`✓ Loaded ${usfsData.length} USFS timber projects`);
      return allProjects;
    }
  } catch (error) {
    console.log('USFS data fallback...');
  }

  // Fallback
  if (allProjects.length === 0) {
    return getDefaultSampleData();
  }

  return allProjects;
}

// Default sample data
function getDefaultSampleData() {
  return [
    {
      id: 1, name: "Cascade Timber Sale", state: "OR", county: "Lane",
      acresApproved: 2100, acresCleared: 1240, status: "Active",
      geometry: { type: "Point", coordinates: [-121.8, 44.1] }
    },
    {
      id: 2, name: "Sierra Nevada Restoration", state: "CA", county: "El Dorado",
      acresApproved: 3200, acresCleared: 0, status: "Proposed",
      geometry: { type: "Point", coordinates: [-120.8, 38.5] }
    }
  ];
}

// Truncate project names for map display
function truncateProjectName(name) {
  const shorterNames = {
    "The Woods at Creekside, 4th Plat": "Creekside 4th",
    "The Woods at Creekside, 5th Plat": "Creekside 5th",
    "The Estates at Thousand Oaks (1st-7th Plats)": "Thousand Oaks Est.",
    "Thousand Oaks 25th Plat": "T.Oaks 25th",
    "Thousand Oaks 26th Plat": "T.Oaks 26th",
    "Sanctuary at Riss Lake": "Riss Lake",
    "Creekside West Apartments": "Creekside Apts",
    "The Hills at The National": "The Hills",
    "Village on the Green East": "Village E",
    "Village on the Green West": "Village W",
    "Platte 38": "Platte 38"
  };
  return shorterNames[name] || name.substring(0, 20);
}

// Generate polygon boundary for cleared land parcel based on acreage
function generateParcelPolygon(centerLat, centerLng, acresCleared) {
  // Convert acres to approximate square meters (1 acre ≈ 4047 m²)
  const areaSqMeters = Math.max(1, acresCleared) * 4047;

  // Approximate side length in meters (assuming roughly square parcel)
  const sideLengthMeters = Math.sqrt(areaSqMeters);

  // Convert meters to degrees (rough approximation: 1 degree ≈ 111 km)
  const degreesPerMeter = 1 / 111000;
  // Scale up by 5x for visibility at zoom level 4 - creates dramatic size differentiation
  const halfSideDegrees = ((sideLengthMeters / 2) * degreesPerMeter) * 5;

  // Create irregular polygon shape (8 points around rectangle with slight variations)
  const polygon = [
    // NW corner
    [centerLat + halfSideDegrees * 1.1, centerLng - halfSideDegrees * 0.95],
    // N side
    [centerLat + halfSideDegrees * 1.05, centerLng - halfSideDegrees * 0.5],
    // NE corner
    [centerLat + halfSideDegrees * 0.9, centerLng + halfSideDegrees * 0.95],
    // E side
    [centerLat + halfSideDegrees * 0.5, centerLng + halfSideDegrees * 1.1],
    // SE corner
    [centerLat - halfSideDegrees * 0.95, centerLng + halfSideDegrees * 0.9],
    // S side
    [centerLat - halfSideDegrees * 1.05, centerLng + halfSideDegrees * 0.45],
    // SW corner
    [centerLat - halfSideDegrees * 0.85, centerLng - halfSideDegrees * 0.95],
    // W side
    [centerLat - halfSideDegrees * 0.5, centerLng - halfSideDegrees * 1.05],
    // Back to start
    [centerLat + halfSideDegrees * 1.1, centerLng - halfSideDegrees * 0.95]
  ];

  return polygon;
}

// Get Indigenous burial and sacred sites
function getBurialSites() {
  return [
    // Ancestral Puebloans
    { name: "Cahokia Mounds", lat: 38.6549, lng: -90.0619, tribe: "Ancestral Mississippian", state: "IL" },
    { name: "Mesa Verde", lat: 37.1840, lng: -108.4618, tribe: "Ancestral Puebloan", state: "CO" },
    { name: "Chaco Canyon", lat: 36.0191, lng: -107.9551, tribe: "Ancestral Puebloan", state: "NM" },

    // Mississippian
    { name: "Poverty Point", lat: 32.6277, lng: -91.4088, tribe: "Mississippian", state: "LA" },

    // Eastern Woodlands
    { name: "Serpent Mound", lat: 39.2608, lng: -83.4142, tribe: "Fort Ancient/Adena", state: "OH" },
    { name: "Grave Creek Mound", lat: 40.7661, lng: -80.7328, tribe: "Adena", state: "WV" },
    { name: "Hopewell Culture", lat: 39.7372, lng: -82.9880, tribe: "Hopewell", state: "OH" },

    // Great Plains
    { name: "Spoon River Mississippian", lat: 40.3761, lng: -89.9544, tribe: "Mississippian", state: "IL" },
    { name: "Running Buttes", lat: 47.8298, lng: -103.1951, tribe: "Mandan", state: "ND" },

    // Southwest
    { name: "Canyon de Chelly", lat: 36.1280, lng: -109.4138, tribe: "Navajo/Ancestral Puebloan", state: "AZ" },
    { name: "Gila Cliff Dwellings", lat: 32.8678, lng: -108.2296, tribe: "Mogollon", state: "NM" },

    // Pacific Northwest
    { name: "Ozette Village", lat: 48.3736, lng: -124.6547, tribe: "Makah", state: "WA" },
    { name: "Nez Perce Historic Sites", lat: 46.4089, lng: -116.2023, tribe: "Nez Perce", state: "ID" },

    // California
    { name: "Anza-Borrego Sacred Sites", lat: 32.8945, lng: -116.4441, tribe: "Kumeyaay", state: "CA" },

    // Great Lakes
    { name: "Aztalan State Park", lat: 43.2858, lng: -88.3100, tribe: "Mississippian", state: "WI" }
  ];
}

// Initialize Leaflet map
async function initMap() {
  // Create map instance with USA bounds
  const usaBounds = [[24.5, -125], [49.4, -66]]; // Continental USA bounds
  mapInstance = L.map('map', {
    center: [39.8283, -98.5795], // Center of USA
    zoom: 4,
    minZoom: 3,
    maxZoom: 16,
    maxBounds: usaBounds,
    maxBoundsViscosity: 0.8,
    attributionControl: true,
    fadeAnimation: true,
    markerZoomAnimation: true
  });

  // Add OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
    className: 'map-tiles'
  }).addTo(mapInstance);

  // Load project data
  currentProjects = await loadProjectData();
  console.log(`Loaded ${currentProjects.length} projects`);

  // Initialize layer groups
  projectsLayerGroup = L.layerGroup().addTo(mapInstance);
  burnPitLayerGroup = L.layerGroup().addTo(mapInstance);
  const burialSitesLayerGroup = L.layerGroup().addTo(mapInstance);

  // Initialize marker cluster group for numbered markers
  markerClusterGroup = L.markerClusterGroup({
    maxClusterRadius: 40,
    disableClusteringAtZoom: 11,
    iconCreateFunction: function(cluster) {
      const count = cluster.getChildCount();
      return L.divIcon({
        html: `<div style="background: #00d9ff; color: #0a0e27; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid #fff; font-size: 14px;">${count}</div>`,
        iconSize: [44, 44],
        className: 'project-cluster'
      });
    }
  }).addTo(mapInstance);

  layerGroups = {
    'Forest Loss': L.layerGroup().addTo(mapInstance),
    'Documented Burns': L.layerGroup().addTo(mapInstance),
    'Burn Pits': burnPitLayerGroup,
    'Permits': L.layerGroup().addTo(mapInstance),
    'Responsible Entities': L.layerGroup().addTo(mapInstance),
    'Indigenous Sacred Sites': burialSitesLayerGroup
  };

  // Add burial/sacred sites to map
  const burialSites = getBurialSites();
  burialSites.forEach(site => {
    const burialIcon = L.divIcon({
      html: `<div style="background: #8b4789; width: 14px; height: 14px; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 6px #8b4789;"></div>`,
      iconSize: [18, 18],
      className: 'burial-icon'
    });

    const burialMarker = L.marker([site.lat, site.lng], { icon: burialIcon });
    const burialPopup = `<strong>⚱️ ${site.name}</strong><br><small>${site.tribe}</small><br><small>${site.state}</small>`;
    burialMarker.bindPopup(burialPopup);
    burialMarker.addTo(burialSitesLayerGroup);
  });

  // Aggregate entities for profile view
  currentEntities = aggregateByEntity(currentProjects);

  // Display projects on map
  displayProjectsOnMap(currentProjects);

  // Setup zoom-based label visibility
  const updateLabelVisibility = () => {
    const zoom = mapInstance.getZoom();
    const labels = document.querySelectorAll('.zoom-label');
    labels.forEach(label => {
      label.style.display = zoom >= 10 ? 'block' : 'none';
    });
  };

  // Call on initial load
  setTimeout(updateLabelVisibility, 500);

  // Call on every zoom
  mapInstance.on('zoomend', updateLabelVisibility);

  // Setup event listeners
  setupEventListeners();

  // Setup mobile navigation
  setupMobileNavigation();

  console.log('✓ Map initialized with Leaflet');
}

// Display projects as markers on the map
function displayProjectsOnMap(projects) {
  // Clear existing markers
  projectsLayerGroup.clearLayers();
  burnPitLayerGroup.clearLayers();
  markerClusterGroup.clearLayers();

  Object.values(layerGroups).forEach(group => group.clearLayers());

  projects.forEach(project => {
    if (!project.geometry || !project.geometry.coordinates) return;

    const statusColor = getStatusColor(project.status);
    const isPolygon = project.geometry.type === 'Polygon';
    const isPoint = project.geometry.type === 'Point';

    if (!isPolygon && !isPoint) return;

    let lat, lon;
    if (isPoint) {
      [lon, lat] = project.geometry.coordinates;
    } else if (isPolygon) {
      // Calculate center of polygon for labels and markers
      const coords = project.geometry.coordinates[0];
      lat = coords.reduce((sum, c) => sum + c[0], 0) / coords.length;
      lon = coords.reduce((sum, c) => sum + c[1], 0) / coords.length;
    }

    // Use actual polygon for Parkville parcels, generated for others
    let polygonBounds;

    if (isPolygon && project.geometry.type === 'Polygon') {
      // Use actual parcel boundary from GeoJSON
      polygonBounds = project.geometry.coordinates[0];
      console.log(`${project.name}: actual parcel boundary (source: ${project.sourceType})`);
    } else {
      // Generate estimated polygon for projects without real boundaries
      let polygonAcreage = 100; // default

      if (project.sourceType === 'Parkville Development') {
        if (project.acres) {
          polygonAcreage = project.acres;
        } else if (project.lots) {
          const totalLots = typeof project.lots === 'object' ? project.lots.total : project.lots;
          polygonAcreage = Math.max(totalLots * 0.3, 5);
        } else if (project.units) {
          polygonAcreage = Math.max(project.units * 0.2, 10);
        }
      } else {
        polygonAcreage = project.acresCleared || project.acresApproved || 100;
      }

      polygonBounds = generateParcelPolygon(lat, lon, polygonAcreage);
      console.log(`${project.name}: ${polygonAcreage} acres (source: ${project.sourceType})`);
    }

    // Create land parcel polygon with minimal opacity to keep map readable
    const polygon = L.polygon(polygonBounds, {
      color: statusColor,
      fillColor: statusColor,
      fillOpacity: 0.08,
      weight: 1.5,
      opacity: 0.9
    });

    // Create popup content
    const popupContent = getProjectPopup(project);
    polygon.bindPopup(popupContent, {
      maxWidth: 350,
      className: 'project-popup'
    });

    // Add small number marker at center (only visible when zoomed out)
    const markerIndex = projects.indexOf(project) + 1;
    const marker = L.marker([lat, lon], {
      icon: L.divIcon({
        html: `<div style="background: ${statusColor}; color: #fff; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; border: 2px solid #fff; box-shadow: 0 0 8px rgba(0,0,0,0.5); opacity: 0.8;">${markerIndex}</div>`,
        iconSize: [32, 32],
        className: 'project-marker'
      })
    });

    // Add zoom-based label layer (visibility controlled by CSS and zoom handler)
    const label = L.marker([lat, lon], {
      icon: L.divIcon({
        html: `<div class="zoom-label" style="background: rgba(0,0,0,0.7); color: #fff; font-size: 10px; font-weight: bold; padding: 4px 6px; border-radius: 3px; white-space: nowrap; max-width: 120px; text-align: center;">${truncateProjectName(project.name)}</div>`,
        iconSize: [130, 30],
        className: 'project-label-zoom'
      })
    });

    // Click handlers for both polygon and marker
    const handleClick = () => {
      currentView = 'projects';
      displayProjectDetails(project);
      updateViewToggle();
      const sidebar = document.querySelector('.sidebar');
      if (window.innerWidth <= 768) {
        sidebar.classList.remove('mobile-closed');
      }
    };

    polygon.on('click', handleClick);
    marker.on('click', handleClick);
    label.on('click', handleClick);

    polygon.addTo(projectsLayerGroup);
    marker.addTo(markerClusterGroup);  // Add to cluster group for smart overlap handling
    label.addTo(projectsLayerGroup);

    // Add to layer groups based on categories
    const categories = project.layerCategories || [];
    activeLayers.forEach(layer => {
      if (categories.includes(layer)) {
        if (layerGroups[layer]) {
          polygon.addTo(layerGroups[layer]);
        }
      }
    });

    // Add burn pit marker if applicable
    if (project.burningDocumented || (project.treeDestination?.burned > 0)) {
      const burnIcon = L.divIcon({
        html: `<div style="background: ${project.burningDocumented ? '#22c55e' : '#eab308'};
                           width: 16px; height: 16px; border-radius: 50%;
                           border: 2px solid #fff; box-shadow: 0 0 5px ${project.burningDocumented ? '#22c55e' : '#eab308'};"></div>`,
        iconSize: [20, 20],
        className: 'burn-pit-icon'
      });

      const burnMarker = L.marker([lat, lon], { icon: burnIcon });
      const burnPopup = `<strong>${project.burningDocumented ? '✓ Verified' : '⚠ Suspected'} Burn Pit</strong><br>${project.name}`;
      burnMarker.bindPopup(burnPopup);
      burnMarker.addTo(burnPitLayerGroup);
    }
  });
}

// Get project popup content
function getProjectPopup(project) {
  const status = project.status || 'Unknown';
  const acreage = project.acresApproved || 0;
  const burned = project.treeDestination?.burned || 0;

  let popup = `<strong>${project.name}</strong><br>`;
  popup += `<small>Status: ${status} • ${acreage} acres</small>`;

  if (burned > 0) {
    popup += `<br><strong style="color: #ef4444;">🔥 ${burned} acres burned</strong>`;
  }

  if (project.rapidClearingFlag) {
    popup += `<br><strong style="color: #f97316;">⚡ Rapid clearing detected</strong>`;
  }

  popup += '<br><em>Click for full details</em>';
  return popup;
}

// Get status color (handles both USFS and Parkville statuses)
function getStatusColor(status) {
  const colors = {
    // USFS statuses
    "Proposed": "#22c55e",
    "Approved": "#eab308",
    "Active": "#f97316",
    "Completed": "#ef4444",
    // Parkville development statuses
    "Under Review": "#3b82f6",
    "Preliminary Plat Approved": "#06b6d4",
    "Under Construction": "#f97316",
    "Construction/Completion Activity 2024": "#f97316"
  };
  return colors[status] || "#888888";
}

// Display project details in sidebar
function displayProjectDetails(project) {
  const projectDetails = document.getElementById('projectDetails');
  if (!projectDetails) return;

  let html = `<strong>${project.name}</strong><br>`;
  html += `<small><em>${project.sourceType || 'Project'}</em></small><br>`;
  html += `<small>Location: ${project.location || `${project.county || ''} ${project.state || ''}`}</small><br>`;
  html += `<strong>Status: ${project.status}</strong><br>`;

  // Parkville development-specific info
  if (project.parcel) {
    html += `<br><strong>Parcel:</strong> ${project.parcel}<br>`;
  }

  if (project.acres) {
    html += `<strong>Acres:</strong> ${project.acres}<br>`;
  }

  if (project.lots || project.units) {
    html += `<strong>Development:</strong><br>`;
    if (project.lots) {
      if (typeof project.lots === 'object') {
        Object.entries(project.lots).forEach(([type, count]) => {
          if (type !== 'total' && count > 0) {
            html += `• ${type}: ${count}<br>`;
          }
        });
        html += `<strong>Total Lots: ${project.lots.total}</strong><br>`;
      } else {
        html += `${project.lots} lots<br>`;
      }
    }
    if (project.units) {
      html += `${project.units} units<br>`;
    }
  }

  // USFS timber-specific info
  if (project.acresApproved) {
    html += `<strong>Approved:</strong> ${project.acresApproved} acres<br>`;
  }
  if (project.acresCleared) {
    html += `<strong>Cleared:</strong> ${project.acresCleared} acres<br>`;
  }

  // Evidence score
  if (project.evidenceScore) {
    html += `<br><span class="evidence-score">Evidence: ${project.evidenceScore.grade}</span>`;
    html += `<br><small>${project.evidenceScore.description}</small>`;
  }

  // Tree destination
  if (project.treeDestination) {
    const dest = project.treeDestination;
    html += `<br><br><strong>Tree Destination:</strong><br>`;
    html += `🌲 Harvested: ${dest.harvested || 0} acres<br>`;
    html += `🔥 Burned: ${dest.burned || 0} acres<br>`;
    html += `❓ Unknown: ${dest.unknown || 0} acres`;
  }

  // Burn pit info
  if (project.burningDocumented || (project.treeDestination?.burned > 0)) {
    html += `<br><br><span style="background: rgba(239, 68, 68, 0.2); padding: 8px; border-radius: 4px; display: block;">`;
    html += `<strong>🚨 Burn Pit Activity</strong><br>`;
    html += project.burningDocumented ?
      `<span style="color: #22c55e;">✓ Verified burn pit destruction</span>` :
      `<span style="color: #eab308;">⚠ Suspected burn pit (${project.treeDestination?.burned || 0} acres burned)</span>`;
    html += `</span>`;
  }

  // Rapid change detection
  if (project.rapidClearingFlag) {
    html += `<br><br><span style="background: rgba(249, 115, 22, 0.2); padding: 8px; border-radius: 4px; display: block;">`;
    html += `<strong>⚡ Rapid Clearing Detected</strong><br>`;
    const dateApproved = project.dateApproved ? new Date(project.dateApproved) : null;
    const afterDate = project.satelliteImagery?.afterDate ? new Date(project.satelliteImagery.afterDate) : null;
    if (dateApproved && afterDate) {
      const days = Math.floor((afterDate - dateApproved) / (1000 * 60 * 60 * 24));
      html += `<small>Cleared within ${days} days of approval</small>`;
    }
    html += `</span>`;
  }

  // Proposed vs actual
  if (project.proposedVsActual) {
    const proposed = project.proposedVsActual.proposedAcres || 0;
    const actual = project.proposedVsActual.actualAcres || 0;
    const percentProposed = proposed > 0 ? (actual / proposed * 100) : 0;

    html += `<br><br><span style="background: rgba(59, 130, 246, 0.2); padding: 8px; border-radius: 4px; display: block;">`;
    html += `<strong>📊 Proposed vs Actual</strong><br>`;
    html += `Proposed: ${proposed} acres<br>`;
    html += `Actual: ${actual} acres (${percentProposed.toFixed(0)}%)<br>`;
    if (actual > proposed) {
      html += `<span style="color: #ef4444;">⚠️ Over-clearing detected</span>`;
    }
    html += `</span>`;
  }

  // EPA enforcement data
  if (project.epaViolations && project.epaViolations.length > 0) {
    html += `<br><br><strong style="color: #ef4444;">EPA Violations: ${project.epaViolations.length}</strong>`;
    project.epaViolations.slice(0, 3).forEach(v => {
      html += `<br><small>${v}</small>`;
    });
  }

  projectDetails.innerHTML = html;
  projectDetails.classList.remove('empty');
}

// Aggregate data by entity (contractor)
function aggregateByEntity(projects) {
  const entities = {};

  projects.forEach(project => {
    const company = project.company || project.responsible_entity || 'Unknown';
    if (!entities[company]) {
      entities[company] = {
        name: company,
        projects: [],
        totalHarvested: 0,
        totalBurned: 0,
        totalUnknown: 0,
        burnPitCount: 0,
        rapidClearingCount: 0,
        overClearingCount: 0,
        totalViolations: 0,
        totalPenalties: 0
      };
    }

    entities[company].projects.push(project);

    if (project.treeDestination) {
      entities[company].totalHarvested += project.treeDestination.harvested || 0;
      entities[company].totalBurned += project.treeDestination.burned || 0;
      entities[company].totalUnknown += project.treeDestination.unknown || 0;
    }

    if (project.burningDocumented || (project.treeDestination?.burned > 0)) {
      entities[company].burnPitCount++;
    }

    if (project.rapidClearingFlag) {
      entities[company].rapidClearingCount++;
    }

    if (project.acresCleared > project.acresApproved) {
      entities[company].overClearingCount++;
    }

    if (project.epaViolations) {
      entities[company].totalViolations += project.epaViolations.length;
    }
  });

  return entities;
}

// Setup event listeners for controls
function setupEventListeners() {
  // Layer toggle checkboxes
  document.querySelectorAll('.layer-toggle').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const layer = e.target.dataset.layer;
      if (e.target.checked) {
        if (!activeLayers.includes(layer)) activeLayers.push(layer);
        if (layerGroups[layer]) mapInstance.addLayer(layerGroups[layer]);
      } else {
        activeLayers = activeLayers.filter(l => l !== layer);
        if (layerGroups[layer]) mapInstance.removeLayer(layerGroups[layer]);
      }
    });
  });

  // View toggle buttons
  const projectToggle = document.getElementById('viewToggleProject');
  const entityToggle = document.getElementById('viewToggleEntity');

  if (projectToggle) {
    projectToggle.addEventListener('click', () => {
      currentView = 'projects';
      projectToggle.classList.add('active');
      entityToggle?.classList.remove('active');
      document.getElementById('projectView').classList.add('active');
      document.getElementById('entityView').classList.remove('active');
    });
  }

  if (entityToggle) {
    entityToggle.addEventListener('click', () => {
      currentView = 'entities';
      entityToggle.classList.add('active');
      projectToggle?.classList.remove('active');
      document.getElementById('projectView').classList.remove('active');
      document.getElementById('entityView').classList.add('active');
      displayEntitiesView();
    });
  }

  // Filter controls
  document.getElementById('stateSelect')?.addEventListener('change', applyFilters);
  document.getElementById('statusSelect')?.addEventListener('change', applyFilters);
  document.getElementById('minAcreage')?.addEventListener('change', applyFilters);
}

// Apply filters and redraw map
function applyFilters() {
  const state = document.getElementById('stateSelect')?.value || '';
  const status = document.getElementById('statusSelect')?.value || '';
  const acreage = parseInt(document.getElementById('minAcreage')?.value || '0');

  filteredProjects = currentProjects.filter(project => {
    const matchesState = !state || project.state === state;
    const matchesStatus = !status || project.status === status;
    const matchesAcreage = project.acresApproved >= acreage;
    return matchesState && matchesStatus && matchesAcreage;
  });

  displayProjectsOnMap(filteredProjects.length > 0 ? filteredProjects : currentProjects);
}

// Display entities (contractors) in sidebar
function displayEntitiesView() {
  const entitiesList = document.getElementById('entityList');
  if (!entitiesList) return;

  let html = '<div class="entity-list">';
  Object.values(currentEntities).forEach(entity => {
    html += `
      <div class="entity-card">
        <div class="entity-name">${entity.name}</div>
        <div class="entity-stat">
          <span>Projects:</span>
          <span class="entity-stat-value">${entity.projects.length}</span>
        </div>
        <div class="entity-stat">
          <span>Acreage:</span>
          <span class="entity-stat-value">${(entity.totalHarvested + entity.totalBurned + entity.totalUnknown).toFixed(0)}</span>
        </div>
        ${entity.totalBurned > 0 ? `
        <div class="entity-stat">
          <span>🔥 Burned:</span>
          <span class="entity-stat-value" style="color: #ef4444;">${entity.totalBurned.toFixed(0)}</span>
        </div>` : ''}
        ${entity.burnPitCount > 0 ? `
        <div class="entity-stat">
          <span>🚨 Burn Pits:</span>
          <span class="entity-stat-value">${entity.burnPitCount}</span>
        </div>` : ''}
        ${entity.rapidClearingCount > 0 ? `
        <div class="entity-stat">
          <span>⚡ Rapid Clearing:</span>
          <span class="entity-stat-value">${entity.rapidClearingCount}</span>
        </div>` : ''}
        ${entity.totalViolations > 0 ? `
        <div class="entity-stat">
          <span>⚠️ Violations:</span>
          <span class="entity-stat-violations">${entity.totalViolations}</span>
        </div>` : ''}
      </div>
    `;
  });
  html += '</div>';
  entitiesList.innerHTML = html;
}

// Update view toggle button state
function updateViewToggle() {
  const projectToggle = document.getElementById('viewToggleProject');
  const entityToggle = document.getElementById('viewToggleEntity');

  if (projectToggle && entityToggle) {
    if (currentView === 'projects') {
      projectToggle.classList.add('active');
      entityToggle.classList.remove('active');
    } else {
      projectToggle.classList.remove('active');
      entityToggle.classList.add('active');
    }
  }
}

// Mobile navigation
function setupMobileNavigation() {
  const sidebar = document.querySelector('.sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const isMobile = window.innerWidth <= 768;

  if (!isMobile) return;

  updateToggleButton();

  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-closed');
      updateToggleButton();
    });
  }

  const projectToggle = document.getElementById('viewToggleProject');
  const entityToggle = document.getElementById('viewToggleEntity');

  [projectToggle, entityToggle].forEach(toggle => {
    if (toggle) {
      toggle.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          sidebar.classList.add('mobile-closed');
          updateToggleButton();
        }
      });
    }
  });

  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      sidebar.classList.add('mobile-closed');
      updateToggleButton();
    }, 100);
  });
}

// Update toggle button appearance
function updateToggleButton() {
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.querySelector('.sidebar');

  if (sidebarToggle) {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      sidebarToggle.style.display = 'flex';
      sidebarToggle.textContent = sidebar.classList.contains('mobile-closed') ? '☰' : '✕';
    } else {
      sidebarToggle.style.display = 'none';
    }
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initMap);
