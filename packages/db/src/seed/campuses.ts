import type { NewCampusRow } from '../schema/campuses.js';

/**
 * The 3 legacy DPIIT campuses served by this portal.
 * The 4 bachelor-only campuses build their own portals via the institution-side API.
 */
export const seedCampuses: NewCampusRow[] = [
  {
    id: 'campus_ahmedabad',
    code: 'ahmedabad',
    name: 'NID Ahmedabad',
    programmesOfferedJson: JSON.stringify(['bachelors', 'masters', 'phd']),
    contactEmail: 'placement.ahmedabad@nid.edu',
    active: true,
  },
  {
    id: 'campus_gandhinagar',
    code: 'gandhinagar',
    name: 'NID Gandhinagar',
    programmesOfferedJson: JSON.stringify(['masters', 'phd']),
    contactEmail: 'placement.gandhinagar@nid.edu',
    active: true,
  },
  {
    id: 'campus_bengaluru',
    code: 'bengaluru',
    name: 'NID Bengaluru (R&D)',
    programmesOfferedJson: JSON.stringify(['masters', 'phd']),
    contactEmail: 'placement.bengaluru@nid.edu',
    active: true,
  },
];
