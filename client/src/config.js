/**
 * Campus Compass Client Configuration
 */
export const config = {
  appName: 'Campus Compass',
  institutionName: 'Parul University',
  adminPortalTitle: 'Admin Intelligence Portal',

  // Configurable Placement Policy Eligibility Criteria
  placementEligibility: {
    minCgpa: 6.0,
    maxLiveBacklogs: 0,
    requiresPolicySubmission: true,
  },

  // Pagination defaults
  pagination: {
    defaultLimit: 25,
    limits: [15, 25, 50, 100],
  },

  // Trend tolerance and mobile country defaults
  TREND_TOLERANCE: 0.3,
  defaultCountryCode: '91',

  // Mobile profile section ordering
  MOBILE_PROFILE_ORDER: [
    'hero',
    'actions',
    'quickFacts',
    'kpis',
    'pills',
    'insights',
    'semesters',
    'journey',
    'backlogs',
    'placement',
    'allFields',
  ],

  // Storage keys
  storageKeys: {
    authToken: 'campus_compass_auth_token',
    adminUser: 'campus_compass_admin_user',
    theme: 'campus_compass_theme',
    recentSearches: 'campus_compass_recent_searches',
  },
};
