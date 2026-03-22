// Role storage utility
const ROLE_STORAGE_KEY = 'iks_user_role'

export const roles = {
  CAMPUS_IN_CHARGE: 'campus-in-charge',
  SPOC: 'spoc',
  ADMIN_OFFICE: 'admin-office'
}

export const roleLabels = {
  [roles.CAMPUS_IN_CHARGE]: 'IKS Campus In-Charge',
  [roles.SPOC]: 'SPOC (Single Point of Contact)',
  [roles.ADMIN_OFFICE]: 'IKS Admin Office'
}

export const saveRole = (role) => {
  if (Object.values(roles).includes(role)) {
    localStorage.setItem(ROLE_STORAGE_KEY, role)
    return true
  }
  return false
}

export const getRole = () => {
  return localStorage.getItem(ROLE_STORAGE_KEY)
}

export const clearRole = () => {
  localStorage.removeItem(ROLE_STORAGE_KEY)
}

export const hasRole = () => {
  return !!getRole()
}

/**
 * Check if a role allows self-registration
 * @param {string} role - User role
 * @returns {boolean} - True if role allows self-registration
 */
export const canSelfRegister = (role) => {
  const allowedRoles = [roles.CAMPUS_IN_CHARGE, roles.SPOC]
  return allowedRoles.includes(role)
}

