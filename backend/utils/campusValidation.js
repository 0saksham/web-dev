/**
 * Campus and Branch validation utilities
 */

export const campuses = {
  HALDWANI: 'haldwani',
  BHIMTAL: 'bhimtal',
  DEHRADUN: 'dehradun'
}

export const campusLabels = {
  [campuses.HALDWANI]: 'Haldwani',
  [campuses.BHIMTAL]: 'Bhimtal',
  [campuses.DEHRADUN]: 'Dehradun'
}

export const branches = {
  CSE: 'cse',
  ECE: 'ece',
  ME: 'me',
  CE: 'ce',
  EE: 'ee',
  IT: 'it'
}

export const branchLabels = {
  [branches.CSE]: 'Computer Science & Engineering',
  [branches.ECE]: 'Electronics & Communication Engineering',
  [branches.ME]: 'Mechanical Engineering',
  [branches.CE]: 'Civil Engineering',
  [branches.EE]: 'Electrical Engineering',
  [branches.IT]: 'Information Technology'
}

/**
 * Get allowed campuses for a role
 * @param {string} role - User role
 * @returns {string[]} - Array of allowed campus values
 */
export const getAllowedCampuses = (role) => {
  const rules = {
    'campus-in-charge': [campuses.HALDWANI, campuses.BHIMTAL],
    'spoc': [campuses.DEHRADUN],
    'admin-office': [campuses.DEHRADUN]
  }
  return rules[role] || []
}

/**
 * Check if campus is allowed for role
 * @param {string} role - User role
 * @param {string} campus - Campus value
 * @returns {boolean} - True if campus is allowed
 */
export const isCampusAllowed = (role, campus) => {
  const allowedCampuses = getAllowedCampuses(role)
  return allowedCampuses.includes(campus)
}

/**
 * Check if branch selection is required for role
 * @param {string} role - User role
 * @returns {boolean} - True if branch is required
 */
export const isBranchRequired = (role) => {
  return role === 'spoc'
}

/**
 * Check if campus selection is required for role
 * @param {string} role - User role
 * @returns {boolean} - True if campus selection is required
 */
export const isCampusSelectionRequired = (role) => {
  // Admin has fixed campus (Dehradun), no selection needed
  return role !== 'admin-office'
}

/**
 * Get fixed campus for role (if any)
 * @param {string} role - User role
 * @returns {string|null} - Fixed campus or null if selection required
 */
export const getFixedCampus = (role) => {
  if (role === 'admin-office') {
    return campuses.DEHRADUN
  }
  return null
}

/**
 * Validate campus and branch for a role
 * @param {string} role - User role
 * @param {string} campus - Campus value
 * @param {string|null} branch - Branch value (optional)
 * @returns {Object} - { valid: boolean, error: string|null }
 */
export const validateCampusBranch = (role, campus, branch) => {
  // Check if campus is required
  if (isCampusSelectionRequired(role)) {
    if (!campus) {
      return { valid: false, error: 'Campus selection is required' }
    }

    // Check if campus is allowed for role
    if (!isCampusAllowed(role, campus)) {
      return { valid: false, error: `Invalid campus selection for ${role}` }
    }
  } else {
    // For admin, use fixed campus
    const fixedCampus = getFixedCampus(role)
    if (campus && campus !== fixedCampus) {
      return { valid: false, error: 'Invalid campus for admin role' }
    }
  }

  // Check if branch is required
  if (isBranchRequired(role)) {
    if (!branch) {
      return { valid: false, error: 'Branch selection is required for SPOC' }
    }
    if (!Object.values(branches).includes(branch)) {
      return { valid: false, error: 'Invalid branch selection' }
    }
  }

  return { valid: true, error: null }
}



