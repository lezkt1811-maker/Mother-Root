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
let layerGroups = {};

// Load USFS project data with EPA enforcement enrichment
async function loadProjectData() {
  try {
    const enforcementResponse = await fetch('data/usfs-projects-with-enforcement.json');
    if (enforcementResponse.ok) {
      const data = await enforcementResponse.json();
      console.log(`✓ Loaded ${data.length} projects with EPA enforcement data`);
      return data;
    }
  } catch (error) {
    console.log('Trying fallback data file...');
  }

  try {
    const response = await fetch('data/usfs-projects.json');
    if (!response.ok) throw new Error('Data file not found');
    const data = await response.json();
    console.log(`✓ Loaded ${data.length} USFS projects (no enforcement data)`);
    return data;
  } catch (error) {
    console.warn('Could not load project data:', error.message);
    return getDefaultSampleData();
  }
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

  Object.values(layerGroups).forEach(group => group.clearLayers());

  projects.forEach(project => {
    if (!project.geometry || !project.geometry.coordinates) return;

    const [lon, lat] = project.geometry.coordinates;
    const statusColor = getStatusColor(project.status);
    const acreage = project.acresApproved || 100;

    // Calculate radius based on acreage (0.5 to 2 km radius)
    const radius = Math.max(5000, Math.min(50000, acreage * 100));

    // Create main project circle marker
    const circle = L.circle([lat, lon], {
      radius: radius,
      color: statusColor,
      fillColor: statusColor,
      fillOpacity: 0.6,
      weight: 2,
      dashArray: '5, 5'
    });

    // Create popup content
    const popupContent = getProjectPopup(project);
    circle.bindPopup(popupContent, {
      maxWidth: 350,
      className: 'project-popup'
    });

    // Click to show details in sidebar
    circle.on('click', () => {
      currentView = 'projects';
      displayProjectDetails(project);
      updateViewToggle();

      // On mobile, keep map visible
      const sidebar = document.querySelector('.sidebar');
      if (window.innerWidth <= 768) {
        sidebar.classList.remove('mobile-closed');
      }
    });

    circle.addTo(projectsLayerGroup);

    // Add to layer groups based on categories
    const categories = project.layerCategories || [];
    activeLayers.forEach(layer => {
      if (categories.includes(layer)) {
        if (layerGroups[layer]) {
          circle.addTo(layerGroups[layer]);
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

// Get status color
function getStatusColor(status) {
  const colors = {
    "Proposed": "#22c55e",
    "Approved": "#eab308",
    "Active": "#f97316",
    "Completed": "#ef4444"
  };
  return colors[status] || "#888888";
}

// Display project details in sidebar
function displayProjectDetails(project) {
  const projectDetails = document.getElementById('projectDetails');
  if (!projectDetails) return;

  let html = `<strong>${project.name}</strong><br>`;
  html += `<small>Location: ${project.location || `${project.county || ''} ${project.state || ''}`}</small><br>`;
  html += `Status: ${project.status}<br>`;
  html += `Approved: ${project.acresApproved || 0} acres<br>`;
  html += `Cleared: ${project.acresCleared || 0} acres<br>`;

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
