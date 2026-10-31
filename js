import { describe, expect, test } from 'vitest';
import { createMissionState } from './state.js';
import { assignResource, approveTask, completeTurn, requestRFI } from './rules.js';

describe('Operation Pacific Shield rules', () => {
  test('requestRFI marks the objective requirement as satisfied', () => {
    const state = createMissionState();
    requestRFI(state, 'fos-lantern', 'Access route and fuel support check');

    const objective = state.objectives[0];
    expect(state.rfis.length).toBe(1);
    expect(objective.requirements.find((req) => req.id === 'rfi')?.satisfied).toBe(true);
  });

  test('fuel assignment validates inventory and completes the support requirement', () => {
    const state = createMissionState();
    assignResource(state, 'fuel-truck', 1, 'fos-lantern');

    const objective = state.objectives[0];
    expect(state.resources.available.find((resource) => resource.id === 'fuel-truck')?.qty).toBe(1);
    expect(objective.requirements.find((req) => req.id === 'fuel')?.satisfied).toBe(true);
  });

  test('completeTurn fails until all objective requirements are satisfied', () => {
    const state = createMissionState();
    expect(() => completeTurn(state)).toThrow(/Not all required actions/i);
  });

  test('full objective completion resolves the mission and sets debrief state', () => {
    const state = createMissionState();
    requestRFI(state, 'fos-lantern', 'Access route and fuel support check');
    assignResource(state, 'fuel-truck', 1, 'fos-lantern');
    approveTask(state, 'CAOC');

    const debrief = completeTurn(state);
    expect(state.status).toBe('COMPLETE');
    expect(state.debrief).not.toBeNull();
    expect(debrief.title).toContain('Mission complete');
  });
});
