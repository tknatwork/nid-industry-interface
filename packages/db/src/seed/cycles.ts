import type { NewCycleRow } from '../schema/cycles.js';

/**
 * One open cycle for the prototype demo. Dates roughly mirror NID's
 * typical bi-annual cycle pattern.
 */
export const seedCycles: NewCycleRow[] = [
  {
    id: 'cycle_spring_2026',
    name: 'Spring 2026',
    campusIdsJson: JSON.stringify(['campus_ahmedabad', 'campus_gandhinagar', 'campus_bengaluru']),
    status: 'open',
    openDate: new Date('2026-02-01T00:00:00Z'),
    jdUploadDeadline: new Date('2026-05-14T18:30:00Z'),
    browseWindowOpens: new Date('2026-05-23T04:30:00Z'),
    shortlistDeadline: new Date('2026-05-25T11:30:00Z'),
    interviewWindowStart: new Date('2026-06-01T04:30:00Z'),
    interviewWindowEnd: new Date('2026-06-05T12:30:00Z'),
    offerDeadline: new Date('2026-06-10T18:30:00Z'),
    waveTimeWindowDays: 7,
    archiveDate: new Date('2026-07-31T00:00:00Z'),
    participationFeePaise: 1_500_000, // ₹15,000
    gpFeePerInternPaise: 500_000, // ₹5,000
    lateRegistrationFeePaise: 250_000, // ₹2,500
    configJson: null,
  },
];
