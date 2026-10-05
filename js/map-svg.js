// MotherRoot Deforestation Accountability Map - SVG Implementation with USFS Data
// Loads real deforestation projects from data/usfs-projects.json

let currentProjects = [];
let filteredProjects = [];
let currentView = 'projects'; // 'projects' or 'entities'
let currentEntities = {};

// Load USFS project data with EPA enforcement enrichment
async function loadProjectData() {
  try {
    // Try to load enriched data with enforcement info first
    const enforcementResponse = await fetch('data/usfs-projects-with-enforcement.json');
    if (enforcementResponse.ok) {
      const data = await enforcementResponse.json();
      console.log(`✓ Loaded ${data.length} projects with EPA enforcement data`);
      return data;
    }
  } catch (error) {
    // Fall through to try basic projects file
  }

  try {
    // Fall back to basic projects file
    const response = await fetch('data/usfs-projects.json');
    if (!response.ok) throw new Error('Data file not found');

    const data = await response.json();
    console.log(`✓ Loaded ${data.length} USFS projects (no enforcement data)`);
    return data;
  } catch (error) {
    console.warn('Could not load project data:', error.message);
    console.log('💡 Generate sample data: python scripts/generate-sample-data.py');
    console.log('💡 Add EPA data: python scripts/fetch-epa-enforcement.py');
    return getDefaultSampleData();
  }
}

// Default sample data for when USFS file is not available
function getDefaultSampleData() {
  return [
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
      geometry: { type: "Point", coordinates: [-121.8, 44.1] }
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
      geometry: { type: "Point", coordinates: [-120.8, 38.5] }
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
      geometry: { type: "Point", coordinates: [-118.5, 45.3] }
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
      geometry: { type: "Point", coordinates: [-121.4, 47.6] }
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
      geometry: { type: "Point", coordinates: [-105.5, 39.8] }
    }
  ];
}

// Convert geographic coordinates to SVG display coordinates
function coordinatesToSVGPosition(lon, lat) {
  // US bounds: approximately -125 to -66 longitude, 25 to 50 latitude
  const minLon = -125;
  const maxLon = -66;
  const minLat = 25;
  const maxLat = 50;

  const x = ((lon - minLon) / (maxLon - minLon)) * 90;
  const y = ((maxLat - lat) / (maxLat - minLat)) * 60;

  return { x, y };
}

// Calculate size based on acreage
function getProjectSize(acresApproved) {
  return Math.max(20, Math.min(80, 20 + (acresApproved / 100)));
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

// Create SVG map with real USFS data
async function initMap() {
  const mapDiv = document.getElementById('map');

  // Load project data
  const projects = await loadProjectData();

  // Enhance projects with SVG coordinates
  currentProjects = projects.map(project => {
    let pos;

    if (project.geometry && project.geometry.coordinates) {
      // Use coordinates from geometry
      const [lon, lat] = project.geometry.coordinates;
      pos = coordinatesToSVGPosition(lon, lat);
    } else if (project.x !== undefined && project.y !== undefined) {
      // Use existing x,y from sample data
      pos = { x: project.x, y: project.y };
    } else {
      // Default to US center
      pos = { x: 45, y: 40 };
    }

    return {
      ...project,
      x: pos.x,
      y: pos.y,
      size: project.size || getProjectSize(project.acresApproved || 1000)
    };
  });

  // Create SVG
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('viewBox', '0 0 100 80');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  svg.style.background = 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)';

  // Add title text
  const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  title.setAttribute('x', '50');
  title.setAttribute('y', '5');
  title.setAttribute('text-anchor', 'middle');
  title.setAttribute('font-size', '3');
  title.setAttribute('fill', '#00d9ff');
  title.setAttribute('font-weight', 'bold');
  title.setAttribute('letter-spacing', '1');
  title.textContent = 'United States Deforestation Projects';
  svg.appendChild(title);

  // Add data source info
  const dataInfo = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  dataInfo.setAttribute('x', '50');
  dataInfo.setAttribute('y', '8');
  dataInfo.setAttribute('text-anchor', 'middle');
  dataInfo.setAttribute('font-size', '1');
  dataInfo.setAttribute('fill', '#888');
  dataInfo.textContent = `USFS Data • ${currentProjects.length} Projects Tracked`;
  svg.appendChild(dataInfo);

  // Add map background
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('x', '5');
  bg.setAttribute('y', '10');
  bg.setAttribute('width', '90');
  bg.setAttribute('height', '60');
  bg.setAttribute('fill', '#1a1f3a');
  bg.setAttribute('stroke', '#00d9ff');
  bg.setAttribute('stroke-width', '0.3');
  svg.appendChild(bg);

  // Add grid
  for (let i = 0; i <= 90; i += 15) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', 5 + i);
    line.setAttribute('y1', '10');
    line.setAttribute('x2', 5 + i);
    line.setAttribute('y2', '70');
    line.setAttribute('stroke', '#333');
    line.setAttribute('stroke-width', '0.1');
    svg.appendChild(line);
  }

  for (let i = 0; i <= 60; i += 15) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', '5');
    line.setAttribute('y1', 10 + i);
    line.setAttribute('x2', '95');
    line.setAttribute('y2', 10 + i);
    line.setAttribute('stroke', '#333');
    line.setAttribute('stroke-width', '0.1');
    svg.appendChild(line);
  }

  // Add region labels
  const labels = [
    { text: 'WA', x: 32, y: 15 },
    { text: 'OR', x: 30, y: 35 },
    { text: 'CA', x: 28, y: 60 },
    { text: 'CO', x: 52, y: 40 },
    { text: 'ID', x: 40, y: 25 }
  ];

  labels.forEach(label => {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', label.x);
    text.setAttribute('y', label.y);
    text.setAttribute('font-size', '1.5');
    text.setAttribute('fill', '#555');
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('opacity', '0.6');
    text.textContent = label.text;
    svg.appendChild(text);
  });

  displayProjectsOnMap(svg, currentProjects);

  mapDiv.innerHTML = '';
  mapDiv.appendChild(svg);

  setupEventListeners();
}

// Display projects on SVG map
function displayProjectsOnMap(svg, projects) {
  // Remove existing project circles
  const existingCircles = svg.querySelectorAll('.project-circle');
  existingCircles.forEach(el => el.remove());

  projects.forEach(project => {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    const color = getStatusColor(project.status);

    circle.setAttribute('cx', 5 + project.x);
    circle.setAttribute('cy', 10 + project.y);
    circle.setAttribute('r', project.size / 100);
    circle.setAttribute('fill', color);
    circle.setAttribute('fill-opacity', '0.5');
    circle.setAttribute('stroke', color);
    circle.setAttribute('stroke-width', '0.4');
    circle.setAttribute('class', 'project-circle');
    circle.style.cursor = 'pointer';
    circle.style.transition = 'all 0.2s ease';

    circle.addEventListener('click', () => {
      displayProjectDetails(project);
    });

    circle.addEventListener('mouseover', () => {
      circle.setAttribute('fill-opacity', '0.8');
      circle.setAttribute('stroke-width', '0.6');
    });

    circle.addEventListener('mouseout', () => {
      circle.setAttribute('fill-opacity', '0.5');
      circle.setAttribute('stroke-width', '0.4');
    });

    svg.appendChild(circle);

    // Add enforcement badge if violations exist
    const enforcement = project.enforcement || {};
    if (enforcement.violations > 0) {
      const badge = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      badge.setAttribute('cx', 5 + project.x + project.size / 80);
      badge.setAttribute('cy', 10 + project.y - project.size / 80);
      badge.setAttribute('r', '0.4');
      badge.setAttribute('fill', '#ef4444');
      badge.setAttribute('stroke', '#fca5a5');
      badge.setAttribute('stroke-width', '0.15');
      badge.setAttribute('class', 'enforcement-badge');

      badge.addEventListener('click', (e) => {
        e.stopPropagation();
        displayProjectDetails(project);
      });

      svg.appendChild(badge);
    }
  });
}

// Display project details
function displayProjectDetails(project) {
  const detailsDiv = document.getElementById('projectDetails');

  const acreageCleared = project.acresCleared || 0;
  const acreageApproved = project.acresApproved || 0;
  const percentCleared = acreageApproved > 0
    ? ((acreageCleared / acreageApproved) * 100).toFixed(1)
    : 0;

  detailsDiv.classList.remove('empty');
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

      ${getEnforcementSection(project)}
    </div>
  `;
}

// Get EPA enforcement section for project details
function getEnforcementSection(project) {
  const enforcement = project.enforcement || {};
  const hasViolations = enforcement.violations > 0;

  if (hasViolations) {
    return `
      <div class="project-field" style="background: rgba(239, 68, 68, 0.1); padding: 10px; border-left: 3px solid #ef4444; margin-top: 10px;">
        <div class="project-label">⚠️ EPA Enforcement History</div>
        <div class="project-value">
          <strong>${enforcement.violations}</strong> violations<br>
          <strong>$${(enforcement.penalties || 0).toLocaleString()}</strong> in penalties<br>
          <strong>${enforcement.inspections || 0}</strong> inspections
        </div>
      </div>
    `;
  } else {
    return `
      <div class="project-field" style="background: rgba(34, 197, 94, 0.1); padding: 10px; border-left: 3px solid #22c55e; margin-top: 10px;">
        <div class="project-label">✓ No EPA Violations Documented</div>
        <div class="project-value" style="font-size: 12px; color: #888;">No EPA enforcement actions on record</div>
      </div>
    `;
  }
}

// Aggregate projects by entity (company/contractor)
function aggregateByEntity(projects) {
  const entities = {};

  projects.forEach(project => {
    const company = project.company || "Not disclosed";

    if (!entities[company]) {
      entities[company] = {
        name: company,
        projects: [],
        totalAcresProposed: 0,
        totalAcresApproved: 0,
        totalAcresCleared: 0,
        totalViolations: 0,
        totalPenalties: 0,
        totalInspections: 0,
        states: new Set(),
        statuses: {}
      };
    }

    entities[company].projects.push(project);
    entities[company].totalAcresProposed += project.acresProposed || 0;
    entities[company].totalAcresApproved += project.acresApproved || 0;
    entities[company].totalAcresCleared += project.acresCleared || 0;

    const enforcement = project.enforcement || {};
    entities[company].totalViolations += enforcement.violations || 0;
    entities[company].totalPenalties += enforcement.penalties || 0;
    entities[company].totalInspections += enforcement.inspections || 0;

    if (project.state) {
      entities[company].states.add(project.state);
    }

    const status = project.status || "Unknown";
    entities[company].statuses[status] = (entities[company].statuses[status] || 0) + 1;
  });

  return entities;
}

// Display entity accountability view
function displayEntityView(entities, sortBy = 'violations') {
  const entityList = document.getElementById('entityList');

  // Convert to array and sort
  let entityArray = Object.values(entities);

  switch(sortBy) {
    case 'violations':
      entityArray.sort((a, b) => b.totalViolations - a.totalViolations);
      break;
    case 'acreage':
      entityArray.sort((a, b) => b.totalAcresCleared - a.totalAcresCleared);
      break;
    case 'projects':
      entityArray.sort((a, b) => b.projects.length - a.projects.length);
      break;
    case 'name':
      entityArray.sort((a, b) => a.name.localeCompare(b.name));
      break;
  }

  let html = '<div class="entity-list">';

  entityArray.forEach(entity => {
    const hasViolations = entity.totalViolations > 0;
    const violationClass = hasViolations ? 'entity-stat-violations' : '';

    html += `
      <div class="entity-card" data-company="${entity.name}">
        <div class="entity-name">${entity.name}</div>
        <div class="entity-stat">
          <span>Projects:</span>
          <span class="entity-stat-value">${entity.projects.length}</span>
        </div>
        <div class="entity-stat">
          <span>Total Acres Cleared:</span>
          <span class="entity-stat-value">${entity.totalAcresCleared.toLocaleString()}</span>
        </div>
        <div class="entity-stat">
          <span>EPA Violations:</span>
          <span class="entity-stat-value ${violationClass}">${entity.totalViolations}</span>
        </div>
        <div class="entity-stat">
          <span>Total Penalties:</span>
          <span class="entity-stat-value">$${entity.totalPenalties.toLocaleString()}</span>
        </div>
        <div class="entity-stat" style="font-size: 10px; color: #666; margin-top: 6px;">
          <span>Active in: ${Array.from(entity.states).sort().join(', ')}</span>
        </div>
      </div>
    `;
  });

  html += '</div>';
  entityList.innerHTML = html;
  entityList.classList.remove('empty');

  // Add click handlers to entity cards
  document.querySelectorAll('.entity-card').forEach(card => {
    card.addEventListener('click', () => {
      const company = card.getAttribute('data-company');
      displayEntityDetails(entities[company]);
      highlightEntityProjects(company);
    });
  });
}

// Display detailed entity information
function displayEntityDetails(entity) {
  const detailsDiv = document.getElementById('entityList');
  const clearancePercent = entity.totalAcresApproved > 0
    ? ((entity.totalAcresCleared / entity.totalAcresApproved) * 100).toFixed(1)
    : 0;

  let statusHtml = '';
  Object.entries(entity.statuses).forEach(([status, count]) => {
    statusHtml += `<div class="entity-stat"><span>${status}:</span><span class="entity-stat-value">${count}</span></div>`;
  });

  const violationIndicator = entity.totalViolations > 0
    ? `<div style="background: rgba(239, 68, 68, 0.1); padding: 10px; border-left: 3px solid #ef4444; margin-top: 10px;">
         <div class="project-label">⚠️ EPA Enforcement Summary</div>
         <div class="entity-stat">
           <span>Total Violations:</span>
           <span class="entity-stat-value entity-stat-violations">${entity.totalViolations}</span>
         </div>
         <div class="entity-stat">
           <span>Total Penalties:</span>
           <span class="entity-stat-value">$${entity.totalPenalties.toLocaleString()}</span>
         </div>
         <div class="entity-stat">
           <span>Total Inspections:</span>
           <span class="entity-stat-value">${entity.totalInspections}</span>
         </div>
       </div>`
    : `<div style="background: rgba(34, 197, 94, 0.1); padding: 10px; border-left: 3px solid #22c55e; margin-top: 10px;">
         <div class="project-label">✓ No EPA Violations Documented</div>
       </div>`;

  const html = `
    <div class="project-card">
      <h3>${entity.name}</h3>

      <div class="project-field">
        <div class="project-label">Projects</div>
        <div class="project-value">${entity.projects.length} total projects</div>
      </div>

      <div class="project-field">
        <div class="project-label">Project Status</div>
        <div class="project-value">${statusHtml}</div>
      </div>

      <div class="project-field">
        <div class="project-label">Acreage Summary</div>
        <div class="project-value">
          Proposed: ${entity.totalAcresProposed.toLocaleString()}<br>
          Approved: ${entity.totalAcresApproved.toLocaleString()}<br>
          <span style="color: #00d9ff;">Cleared: ${entity.totalAcresCleared.toLocaleString()} (${clearancePercent}%)</span>
        </div>
      </div>

      <div class="project-field">
        <div class="project-label">States Active In</div>
        <div class="project-value">${Array.from(entity.states).sort().join(', ')}</div>
      </div>

      ${violationIndicator}
    </div>
  `;

  detailsDiv.innerHTML = html;
}

// Highlight projects from a specific entity on the map
function highlightEntityProjects(company) {
  const svg = document.querySelector('#map svg');
  if (!svg) return;

  const circles = svg.querySelectorAll('.project-circle');
  circles.forEach(circle => {
    const project = currentProjects.find(p =>
      p.x === parseFloat(circle.getAttribute('cx')) - 5 &&
      p.y === parseFloat(circle.getAttribute('cy')) - 10
    );

    if (project && project.company === company) {
      circle.setAttribute('stroke-width', '1');
      circle.setAttribute('fill-opacity', '0.7');
    } else {
      circle.setAttribute('stroke-width', '0.2');
      circle.setAttribute('fill-opacity', '0.2');
    }
  });
}

// Filter projects
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

  // Update map
  const svg = document.querySelector('#map svg');
  if (svg) {
    displayProjectsOnMap(svg, filteredProjects);
  }
}

// Toggle between project and entity view
function toggleView(view) {
  currentView = view;

  document.getElementById('projectView').classList.toggle('active', view === 'projects');
  document.getElementById('entityView').classList.toggle('active', view === 'entities');
  document.getElementById('viewToggleProject').classList.toggle('active', view === 'projects');
  document.getElementById('viewToggleEntity').classList.toggle('active', view === 'entities');

  if (view === 'entities') {
    currentEntities = aggregateByEntity(currentProjects);
    displayEntityView(currentEntities, 'violations');
  } else {
    applyFilters();
  }
}

// Setup event listeners
function setupEventListeners() {
  document.getElementById('stateSelect').addEventListener('change', applyFilters);
  document.getElementById('statusSelect').addEventListener('change', applyFilters);
  document.getElementById('minAcreage').addEventListener('change', applyFilters);

  document.getElementById('viewToggleProject').addEventListener('click', () => toggleView('projects'));
  document.getElementById('viewToggleEntity').addEventListener('click', () => toggleView('entities'));

  document.getElementById('entitySort').addEventListener('change', (e) => {
    if (currentView === 'entities') {
      displayEntityView(currentEntities, e.target.value);
    }
  });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initMap);
