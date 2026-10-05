// MotherRoot Deforestation Accountability Map
// MVP: Display USFS timber harvest projects on an interactive map

let map;
let geoJsonLayer;
let currentProjects = [];
let filteredProjects = [];

// Sample project data - replace with real USFS API data
const sampleProjects = [
  {
    id: 1,
    name: "Cascade Timber Sale",
    location: "Cascade Range, OR",
    state: "OR",
    county: "Lane",
    agency: "USFS - Willamette National Forest",
    company: "Weyerhaeuser Corporation",
    acresProposed: 2150,
    acresApproved: 2100,
    acresCleared: 1240,
    dateApproved: "2022-06-15",
    status: "Active",
    clearingType: "Timber harvest",
    geometry: {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-121.8, 44.1],
          [-121.7, 44.1],
          [-121.7, 44.2],
          [-121.8, 44.2],
          [-121.8, 44.1]
        ]]
      }
    }
  },
  {
    id: 2,
    name: "Sierra Nevada Restoration Project",
    location: "Sierra Nevada, CA",
    state: "CA",
    county: "El Dorado",
    agency: "USFS - Eldorado National Forest",
    company: "Sierra Pacific Industries",
    acresProposed: 3500,
    acresApproved: 3200,
    acresCleared: 0,
    dateApproved: "2023-03-20",
    status: "Proposed",
    clearingType: "Timber harvest",
    geometry: {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-120.8, 38.5],
          [-120.7, 38.5],
          [-120.7, 38.6],
          [-120.8, 38.6],
          [-120.8, 38.5]
        ]]
      }
    }
  },
  {
    id: 3,
    name: "Blue Mountains Timber Harvest",
    location: "Blue Mountains, OR",
    state: "OR",
    county: "Baker",
    agency: "USFS - Wallowa-Whitman National Forest",
    company: "Hampton Lumber Mills",
    acresProposed: 1800,
    acresApproved: 1800,
    acresCleared: 1650,
    dateApproved: "2021-09-10",
    status: "Completed",
    clearingType: "Timber harvest",
    geometry: {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-118.5, 45.3],
          [-118.4, 45.3],
          [-118.4, 45.4],
          [-118.5, 45.4],
          [-118.5, 45.3]
        ]]
      }
    }
  },
  {
    id: 4,
    name: "Washington Forest Initiative",
    location: "Snoqualmie National Forest, WA",
    state: "WA",
    county: "King",
    agency: "USFS - Snoqualmie National Forest",
    company: "Rayonier Inc.",
    acresProposed: 2200,
    acresApproved: 2000,
    acresCleared: 850,
    dateApproved: "2023-01-05",
    status: "Active",
    clearingType: "Timber harvest",
    geometry: {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-121.4, 47.6],
          [-121.3, 47.6],
          [-121.3, 47.7],
          [-121.4, 47.7],
          [-121.4, 47.6]
        ]]
      }
    }
  },
  {
    id: 5,
    name: "Colorado Front Range Project",
    location: "Front Range, CO",
    state: "CO",
    county: "Clear Creek",
    agency: "USFS - Arapaho National Forest",
    company: "Collins Company",
    acresProposed: 950,
    acresApproved: 900,
    acresCleared: 0,
    dateApproved: "2024-02-14",
    status: "Approved",
    clearingType: "Timber harvest",
    geometry: {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-105.5, 39.8],
          [-105.4, 39.8],
          [-105.4, 39.9],
          [-105.5, 39.9],
          [-105.5, 39.8]
        ]]
      }
    }
  }
];

// Initialize map
function initMap() {
  map = L.map('map').setView([39.8, -104.9], 4);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap contributors, © CartoDB',
    maxZoom: 19
  }).addTo(map);

  currentProjects = sampleProjects;
  displayProjects(currentProjects);
  setupEventListeners();
}

// Display projects on map
function displayProjects(projects) {
  if (geoJsonLayer) {
    map.removeLayer(geoJsonLayer);
  }

  const geojsonFeatures = projects.map(project => ({
    type: "Feature",
    properties: project,
    geometry: project.geometry.geometry
  }));

  geoJsonLayer = L.geoJSON(geojsonFeatures, {
    style: function(feature) {
      return {
        color: getStatusColor(feature.properties.status),
        weight: 3,
        opacity: 0.8,
        fillOpacity: 0.4,
        fillColor: getStatusColor(feature.properties.status)
      };
    },
    onEachFeature: function(feature, layer) {
      layer.on('click', function() {
        displayProjectDetails(feature.properties);
        layer.setStyle({
          weight: 4,
          opacity: 1,
          fillOpacity: 0.6
        });
      });

      layer.on('mouseover', function() {
        layer.setStyle({ weight: 4 });
      });

      layer.on('mouseout', function() {
        layer.setStyle({ weight: 3 });
      });
    }
  }).addTo(map);

  // Fit bounds if projects exist
  if (geojsonFeatures.length > 0) {
    const bounds = L.geoJSON(geojsonFeatures).getBounds();
    map.fitBounds(bounds, { padding: [50, 50] });
  }
}

// Get color based on status
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
  const detailsDiv = document.getElementById('projectDetails');

  const acreageCleared = project.acresCleared || 0;
  const acreageApproved = project.acresApproved || 0;
  const percentCleared = acreageApproved > 0
    ? ((acreageCleared / acreageApproved) * 100).toFixed(1)
    : 0;

  detailsDiv.innerHTML = `
    <div class="project-card">
      <h3>${project.name}</h3>

      <div class="project-field">
        <div class="project-label">Location</div>
        <div class="project-value">${project.location}</div>
        <div class="project-value" style="font-size: 11px; color: #888;">${project.county} County, ${project.state}</div>
      </div>

      <div class="project-field">
        <div class="project-label">Status</div>
        <div class="status-badge status-${project.status.toLowerCase()}">${project.status}</div>
      </div>

      <div class="project-field">
        <div class="project-label">Acreage</div>
        <div class="project-value">
          Proposed: ${project.acresProposed.toLocaleString()}<br>
          Approved: ${project.acresApproved.toLocaleString()}<br>
          <span style="color: #00d9ff;">Cleared: ${acreageCleared.toLocaleString()} (${percentCleared}%)</span>
        </div>
      </div>

      <div class="project-field">
        <div class="project-label">Agency</div>
        <div class="project-value">${project.agency}</div>
      </div>

      <div class="project-field">
        <div class="project-label">Contractor/Company</div>
        <div class="project-value">${project.company}</div>
      </div>

      <div class="project-field">
        <div class="project-label">Clearing Type</div>
        <div class="project-value">${project.clearingType}</div>
      </div>

      <div class="project-field">
        <div class="project-label">Date Approved</div>
        <div class="project-value">${new Date(project.dateApproved).toLocaleDateString()}</div>
      </div>
    </div>
  `;
}

// Filter projects based on controls
function applyFilters() {
  const state = document.getElementById('stateSelect').value;
  const status = document.getElementById('statusSelect').value;
  const minAcreage = parseInt(document.getElementById('minAcreage').value) || 0;

  filteredProjects = currentProjects.filter(project => {
    const matchesState = !state || project.state === state;
    const matchesStatus = !status || project.status === status;
    const matchesAcreage = project.acresApproved >= minAcreage;

    return matchesState && matchesStatus && matchesAcreage;
  });

  displayProjects(filteredProjects);

  // Update count
  const count = filteredProjects.length;
  console.log(`Showing ${count} project(s)`);
}

// Setup event listeners
function setupEventListeners() {
  document.getElementById('stateSelect').addEventListener('change', applyFilters);
  document.getElementById('statusSelect').addEventListener('change', applyFilters);
  document.getElementById('minAcreage').addEventListener('change', applyFilters);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initMap);
