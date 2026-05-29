import { describe, expect, it } from 'vitest';
import { bandFromScore, computeHealthScore } from '../src/rules/health-score';

describe('computeHealthScore', () => {
  it('is a pure sum of event weights', () => {
    expect(computeHealthScore([])).toBe(0);
    expect(computeHealthScore(['cycle-completed-successfully', 'cycle-completed-successfully'])).toBe(4);
    expect(computeHealthScore(['post-offer-ghost'])).toBe(-5);
    expect(computeHealthScore(['redressal-upheld-api-revoke'])).toBe(-15);
  });

  it('neutral events do not move the score', () => {
    expect(computeHealthScore(['analyzer-flag-resolved-at-submission', 'redressal-dismissed'])).toBe(0);
  });
});

describe('bandFromScore', () => {
  it('maps the 0–100 scale to the five bands', () => {
    expect(bandFromScore(85)).toBe('excellent');
    expect(bandFromScore(80)).toBe('excellent');
    expect(bandFromScore(70)).toBe('good');
    expect(bandFromScore(42)).toBe('watch');
    expect(bandFromScore(20)).toBe('restricted');
    expect(bandFromScore(5)).toBe('blacklisted');
  });

  it('uses inclusive lower bounds at the band edges', () => {
    expect(bandFromScore(50)).toBe('good');
    expect(bandFromScore(30)).toBe('watch');
    expect(bandFromScore(10)).toBe('restricted');
    expect(bandFromScore(9)).toBe('blacklisted');
  });
});
