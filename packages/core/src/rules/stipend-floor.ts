import type { StipendFloorRule } from '../entities/cycle';
import type { RoleType } from '../entities/jd';

/**
 * Stipend floor compliance check (Phase 5.3).
 *
 * For full-time: BOTH endpoints of the salary range must clear the floor.
 * For internships: stipend (single value) must clear the floor.
 *
 * The scope-creep multiplier from the AI analyzer applies on top — when scope
 * creep is detected, the floor is raised proportionally. That multiplier is
 * passed in by the caller after the AI analyzer runs.
 */
export interface StipendFloorCheck {
  readonly passes: boolean;
  readonly cycleFloorPaise: number;
  readonly adjustedFloorPaise: number;
  readonly lowEndpointPaise: number | undefined;
  readonly highEndpointPaise: number | undefined;
  readonly violatedEndpoint?: 'low' | 'high' | 'single';
}

/**
 * Compensation slice the gate reads. Optionals are explicit `| undefined`
 * so callers can pass `{ baseMinPaise: maybeUndefined }` under
 * exactOptionalPropertyTypes without conditional spreads.
 */
export interface StipendFloorInput {
  readonly roleType: RoleType;
  readonly baseMinPaise?: number | undefined;
  readonly baseMaxPaise?: number | undefined;
  readonly stipendPaise?: number | undefined;
}

export function checkStipendFloor(
  jd: StipendFloorInput,
  applicableRule: StipendFloorRule,
  scopeCreepMultiplier: number,
): StipendFloorCheck {
  const adjustedFloor = Math.round(applicableRule.floorPaise * Math.max(scopeCreepMultiplier, 1));

  if (jd.roleType === 'full-time') {
    const low = jd.baseMinPaise;
    const high = jd.baseMaxPaise;
    if (low === undefined || high === undefined) {
      return {
        passes: false,
        cycleFloorPaise: applicableRule.floorPaise,
        adjustedFloorPaise: adjustedFloor,
        lowEndpointPaise: low,
        highEndpointPaise: high,
        violatedEndpoint: 'low',
      };
    }
    if (low < adjustedFloor) {
      return {
        passes: false,
        cycleFloorPaise: applicableRule.floorPaise,
        adjustedFloorPaise: adjustedFloor,
        lowEndpointPaise: low,
        highEndpointPaise: high,
        violatedEndpoint: 'low',
      };
    }
    if (high < adjustedFloor) {
      return {
        passes: false,
        cycleFloorPaise: applicableRule.floorPaise,
        adjustedFloorPaise: adjustedFloor,
        lowEndpointPaise: low,
        highEndpointPaise: high,
        violatedEndpoint: 'high',
      };
    }
    return {
      passes: true,
      cycleFloorPaise: applicableRule.floorPaise,
      adjustedFloorPaise: adjustedFloor,
      lowEndpointPaise: low,
      highEndpointPaise: high,
    };
  }

  // Internship — single stipend value
  const stipend = jd.stipendPaise;
  if (stipend === undefined || stipend < adjustedFloor) {
    return {
      passes: false,
      cycleFloorPaise: applicableRule.floorPaise,
      adjustedFloorPaise: adjustedFloor,
      lowEndpointPaise: stipend,
      highEndpointPaise: stipend,
      violatedEndpoint: 'single',
    };
  }
  return {
    passes: true,
    cycleFloorPaise: applicableRule.floorPaise,
    adjustedFloorPaise: adjustedFloor,
    lowEndpointPaise: stipend,
    highEndpointPaise: stipend,
  };
}
