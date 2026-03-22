/**
 * Campus and Branch validation utilities (Frontend)
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
 * Check if branch selection is required for role
 */
export const isBranchRequired = (role) => {
  return role === 'spoc'
}

/**
 * Check if campus selection is required for role
 */
export const isCampusSelectionRequired = (role) => {
  return role !== 'admin-office'
}

/**
 * Get fixed campus for role (if any)
 */
export const getFixedCampus = (role) => {
  if (role === 'admin-office') {
    return campuses.DEHRADUN
  }
  return null
}

