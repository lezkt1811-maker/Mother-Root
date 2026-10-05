// MotherRoot Deforestation Accountability Map - SVG Implementation
// Lightweight fallback that works without external CDN dependencies

let currentProjects = [];
let filteredProjects = [];

// Sample project data with simplified coordinates for SVG display
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
    x: 30,
    y: 35,
    size: 45
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
    x: 25,
    y: 55,
    size: 55
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
    x: 35,
    y: 30,
    size: 40
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
    x: 32,
    y: 25,
    size: 50
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
    x: 50,
    y: 45,
    size: 35
  }
];

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

// Create SVG map
function initMap() {
  const mapDiv = document.getElementById('map');

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

  currentProjects = sampleProjects;
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
    </div>
  `;
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

// Setup event listeners
function setupEventListeners() {
  document.getElementById('stateSelect').addEventListener('change', applyFilters);
  document.getElementById('statusSelect').addEventListener('change', applyFilters);
  document.getElementById('minAcreage').addEventListener('change', applyFilters);
}

// Initialize
document.addEventListener('DOMContentLoaded', initMap);
