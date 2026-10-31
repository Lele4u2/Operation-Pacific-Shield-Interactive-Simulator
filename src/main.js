import './styles.css';
import { createMissionState } from './game/state.js';
import { assignResource, approveTask, completeTurn, requestRFI } from './game/rules.js';
import { runAiSupport } from './game/ai.js';
import { SITE_DEFS, STATION_ROLES } from './game/config.js';

const app = document.getElementById('app');
let state = createMissionState({ role: 'MOB', difficulty: 'guided', mode: 'solo' });
let selectedTab = 'MOB';

function hexPoints(cx, cy, r) {
  const points = [];
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return points.join(' ');
}

function renderWorkstation() {
  const selectedObjective = state.objectives.find((item) => item.id === state.selectedObjectiveId) || state.objectives[0];
  const site = state.sites.find((item) => item.id === state.selectedSiteId) || state.sites[0];
  const fuel = state.resources.available.find((item) => item.id === 'fuel-truck');
  const currentFuelAtSite = state.resources.atSite['fos-lantern']?.['fuel-truck'] ?? 0;

  return `
    <div class="mission-card">
      <div class="eyebrow">ACTIVE OBJECTIVE</div>
      <h3>${selectedObjective.title}</h3>
      <p>${selectedObjective.description}</p>
      <div class="requirement-list">
        ${selectedObjective.requirements.map((req) => `
          <div class="requirement ${req.satisfied ? 'satisfied' : ''}">
            <span>${req.satisfied ? '✓' : '○'}</span>
            <small>${req.label}</small>
          </div>
        `).join('')}
      </div>
      <div class="mini-grid">
        <div>
          <small>Site readiness</small>
          <strong>${site.readiness}%</strong>
        </div>
        <div>
          <small>Fuel at site</small>
          <strong>${currentFuelAtSite}</strong>
        </div>
        <div>
          <small>Available fuel</small>
          <strong>${fuel?.qty ?? 0}</strong>
        </div>
        <div>
          <small>AI status</small>
          <strong>${state.ai.lastAction}</strong>
        </div>
      </div>
      <div class="button-stack">
        <button class="primary" data-action="request-rfi">REQUEST RFI</button>
        <button data-action="assign-fuel">ASSIGN 1 FUEL TRUCK</button>
        <button data-action="approve-caoc">APPROVE WITH CAOC</button>
        <button data-action="submit-task">SUBMIT TASK</button>
        <button data-action="save">SAVE MISSION</button>
      </div>
    </div>
  `;
}

function renderMissionLog() {
  return state.log.slice(0, 7).map((entry) => `<div class="log-entry">${entry.text}</div>`).join('');
}

function render() {
  const selectedObjective = state.objectives.find((item) => item.id === state.selectedObjectiveId) || state.objectives[0];
  const site = state.sites.find((item) => item.id === state.selectedSiteId) || state.sites[0];

  app.innerHTML = `
    <div class="ops-shell">
      <header class="topbar">
        <div class="title-wrap">
          <div class="eyebrow">Operation Pacific Shield</div>
          <h1>APEX // PACIFIC SHIELD</h1>
        </div>
        <div class="hud">
          <div><span>Role</span><strong>${selectedTab}</strong></div>
          <div><span>Turn</span><strong>${state.turn}</strong></div>
          <div><span>Phase</span><strong>${state.phase}</strong></div>
          <div><span>Score</span><strong>${state.debrief?.score ?? 0}</strong></div>
        </div>
      </header>

      <main class="game-grid">
        <aside class="left-panel panel">
          <div class="panel-section">
            <div class="eyebrow">Command auth</div>
            <h2>${selectedTab}</h2>
            <p class="soft-text">Lead the objective, confirm the missing support item, coordinate approval, and resolve the turn.</p>
            <button class="primary" data-action="resolve-turn">RESOLVE TURN</button>
            <button data-action="reset">RESET</button>
          </div>

          <div class="panel-section">
            <div class="eyebrow">Mission goals</div>
            <ul class="objective-list">
              ${state.objectives.map((objective) => `
                <li class="objective ${objective.id === selectedObjective.id ? 'selected' : ''}" data-objective-id="${objective.id}">
                  <span class="status-dot ${objective.status === 'COMPLETE' ? 'done' : 'open'}"></span>
                  <div>
                    <strong>${objective.title}</strong>
                    <small>${objective.status}</small>
                  </div>
                </li>
              `).join('')}
            </ul>
          </div>

          <div class="panel-section">
            <div class="eyebrow">Player positions</div>
            <div class="role-list">
              ${STATION_ROLES.map((role) => `
                <div class="role-pill ${role === selectedTab ? 'active' : ''}">
                  <span>${role}</span>
                  <small>${role === 'MOB' ? 'Player' : 'AI'}</small>
                </div>
              `).join('')}
            </div>
          </div>
        </aside>

        <section class="center-panel panel">
          <div class="map-header">
            <div>
              <div class="eyebrow">Live board</div>
              <h2>Pacific Theater</h2>
            </div>
            <span class="tag">Fictional training board</span>
          </div>

          <svg class="map-svg" viewBox="0 0 760 420" aria-label="Interactive operational map">
            ${SITE_DEFS.map((node) => `
              <g class="hex-node ${node.id === state.selectedSiteId ? 'selected' : ''}" data-site-id="${node.id}">
                <polygon points="${hexPoints(node.x, node.y, 54)}" />
                <text x="${node.x}" y="${node.y + 4}" text-anchor="middle">${node.name.split(' ')[0]}</text>
              </g>
            `).join('')}
          </svg>

          <div class="map-info">
            <h3>${site.name}</h3>
            <div class="stats-row">
              <div><span>Readiness</span><strong>${site.readiness}%</strong></div>
              <div><span>Status</span><strong>${site.status}</strong></div>
            </div>
            <p>Mission node selected. This board supports FOS evaluation, RFI handling, and support coordination.</p>
          </div>
        </section>

        <aside class="right-panel panel">
          <div class="panel-section">
            <div class="eyebrow">Active workstation</div>
            <div class="tab-bar">
              ${['BOARD', 'MOB', 'CAOC', 'CSpOC', 'MEDCOM', 'AAR'].map((tab) => `
                <button class="tab ${tab === selectedTab ? 'active' : ''}" data-tab="${tab}">${tab}</button>
              `).join('')}
            </div>
            <div class="workstation-screen">
              ${renderWorkstation()}
            </div>
          </div>

          <div class="panel-section">
            <div class="eyebrow">Mission log</div>
            <div class="mission-log">
              ${renderMissionLog()}
            </div>
          </div>
        </aside>
      </main>
    </div>
  `;

  bindEvents();
}

function bindEvents() {
  document.querySelectorAll('[data-site-id]').forEach((node) => {
    node.addEventListener('click', () => {
      state.selectedSiteId = node.dataset.siteId;
      render();
    });
  });

  document.querySelectorAll('[data-objective-id]').forEach((node) => {
    node.addEventListener('click', () => {
      state.selectedObjectiveId = node.dataset.objectiveId;
      render();
    });
  });

  document.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.action;
      try {
        switch (action) {
          case 'request-rfi':
            requestRFI(state, state.selectedSiteId, 'Access route and fuel support check');
            break;
          case 'assign-fuel':
            assignResource(state, 'fuel-truck', 1, 'fos-lantern');
            runAiSupport(state);
            break;
          case 'approve-caoc':
            approveTask(state, 'CAOC');
            break;
          case 'submit-task':
            completeTurn(state);
            break;
          case 'resolve-turn':
            completeTurn(state);
            break;
          case 'save':
            localStorage.setItem('ops-state', JSON.stringify(state));
            alert('Mission saved.');
            return;
          case 'reset':
            state = createMissionState({ role: 'MOB', difficulty: 'guided', mode: 'solo' });
            localStorage.removeItem('ops-state');
            break;
          default:
            break;
        }
        render();
      } catch (error) {
        alert(error.message);
      }
    });
  });

  document.querySelectorAll('[data-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      selectedTab = button.dataset.tab;
      render();
    });
  });
}

const savedState = localStorage.getItem('ops-state');
if (savedState) {
  try {
    state = JSON.parse(savedState);
  } catch (error) {
    console.warn('Saved mission failed to load.', error);
  }
}

render();

export { state };












































































































































































































































































































































































































































































































