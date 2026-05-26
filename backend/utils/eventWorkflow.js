/**
 * Event Workflow Utilities
 * Handles status transitions and validation
 */

/**
 * Valid status transitions
 */
export const STATUS_TRANSITIONS = {
  draft: ['pending', 'cancelled'],
  pending: ['approved', 'rejected', 'cancelled'],
  approved: ['completed', 'cancelled'],
  rejected: ['draft', 'cancelled'],
  completed: [],
  cancelled: []
}

/**
 * Check if a status transition is allowed
 * @param {string} currentStatus - Current event status
 * @param {string} newStatus - Desired new status
 * @param {string} userRole - User role attempting the transition
 * @returns {Object} - { allowed: boolean, error: string|null }
 */
export const canTransitionStatus = (currentStatus, newStatus, userRole) => {
  // Admin can transition to any status
  if (userRole === 'admin-office') {
    return { allowed: true, error: null }
  }

  // Users cannot directly set status to approved
  if (newStatus === 'approved' && userRole !== 'admin-office') {
    return {
      allowed: false,
      error: 'Only administrators can approve events. Please submit for review.'
    }
  }

  // Check if transition is in allowed list
  const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || []
  if (!allowedTransitions.includes(newStatus)) {
    return {
      allowed: false,
      error: `Cannot transition from ${currentStatus} to ${newStatus}. Allowed transitions: ${allowedTransitions.join(', ')}`
    }
  }

  return { allowed: true, error: null }
}

/**
 * Validate event can be submitted (draft → pending)
 * @param {Object} event - Event object
 * @returns {Object} - { valid: boolean, error: string|null }
 */
export const canSubmitEvent = (event) => {
  if (event.status !== 'draft') {
    return {
      valid: false,
      error: `Only draft events can be submitted. Current status: ${event.status}`
    }
  }

  if (!event.title || !event.title.trim()) {
    return {
      valid: false,
      error: 'Event title is required for submission'
    }
  }

  if (!event.start_date) {
    return {
      valid: false,
      error: 'Start date is required for submission'
    }
  }

  return { valid: true, error: null }
}

/**
 * Get next valid status for an event based on current status and user role
 * @param {string} currentStatus - Current event status
 * @param {string} userRole - User role
 * @returns {string[]} - Array of valid next statuses
 */
export const getValidNextStatuses = (currentStatus, userRole) => {
  if (userRole === 'admin-office') {
    // Admin can set any status
    return ['draft', 'pending', 'approved', 'rejected', 'completed', 'cancelled']
  }

  // Regular users can only transition to allowed statuses
  const allowed = STATUS_TRANSITIONS[currentStatus] || []
  
  // Remove 'approved' from allowed transitions for non-admin users
  return allowed.filter(status => status !== 'approved')
}



