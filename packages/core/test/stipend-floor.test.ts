import { describe, expect, it } from 'vitest';
import { checkStipendFloor } from '../src/rules/stipend-floor';
import type { StipendFloorRule } from '../src/entities/cycle';

function rule(floorPaise: number, roleType: StipendFloorRule['roleType']): StipendFloorRule {
  return {
    cycleId: 'cycle_x' as StipendFloorRule['cycleId'],
    disciplineIds: [] as StipendFloorRule['disciplineIds'],
    programme: 'masters',
    roleType,
    floorPaise,
  };
}

describe('checkStipendFloor', () => {
  it('passes a full-time range above the floor (multiplier 1)', () => {
    const r = checkStipendFloor(
      { roleType: 'full-time', baseMinPaise: 90_000_000, baseMaxPaise: 140_000_000 },
      rule(60_000_000, 'full-time'),
      1,
    );
    expect(r.passes).toBe(true);
    expect(r.adjustedFloorPaise).toBe(60_000_000);
  });

  it('raises the floor by the scope-creep multiplier and fails a low endpoint below it', () => {
    const r = checkStipendFloor(
      { roleType: 'full-time', baseMinPaise: 80_000_000, baseMaxPaise: 120_000_000 },
      rule(60_000_000, 'full-time'),
      1.6,
    );
    expect(r.adjustedFloorPaise).toBe(96_000_000);
    expect(r.passes).toBe(false);
    expect(r.violatedEndpoint).toBe('low');
  });

  it('flags the high endpoint when only the max is below the floor', () => {
    const r = checkStipendFloor(
      { roleType: 'full-time', baseMinPaise: 70_000_000, baseMaxPaise: 50_000_000 },
      rule(60_000_000, 'full-time'),
      1,
    );
    expect(r.passes).toBe(false);
    expect(r.violatedEndpoint).toBe('high');
  });

  it('treats a missing full-time range as a violation', () => {
    const r = checkStipendFloor({ roleType: 'full-time' }, rule(60_000_000, 'full-time'), 1);
    expect(r.passes).toBe(false);
  });

  it('checks an internship stipend as a single value', () => {
    expect(
      checkStipendFloor({ roleType: 'vacation-internship', stipendPaise: 1_000_000 }, rule(2_500_000, 'vacation-internship'), 1).passes,
    ).toBe(false);
    expect(
      checkStipendFloor({ roleType: 'vacation-internship', stipendPaise: 3_000_000 }, rule(2_500_000, 'vacation-internship'), 1).passes,
    ).toBe(true);
  });
});
