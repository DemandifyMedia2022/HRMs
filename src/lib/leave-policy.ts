/**
 * Leave Policy Management Utility
 * Handles annual leave resets, carry-forward policies, and year-end processing
 */

export interface LeavePolicy {
  carryForward: boolean;
  maxCarryForward?: number;
  annualReset: boolean;
  paidLeaveAllocation: number;
  sickLeaveAllocation: number;
  yearStartMonth: number; // 0 = January, 3 = April (for financial year)
}

export interface YearBoundaries {
  yearStart: Date;
  yearEnd: Date;
  year: number;
}

/**
 * Default leave policy - no carry-forward, calendar year reset
 */
export const DEFAULT_LEAVE_POLICY: LeavePolicy = {
  carryForward: false,
  annualReset: true,
  paidLeaveAllocation: 12,
  sickLeaveAllocation: 6,
  yearStartMonth: 0 // January 1st reset
};

/**
 * Get year boundaries based on policy (calendar year vs financial year)
 */
export function getYearBoundaries(year?: number, policy: LeavePolicy = DEFAULT_LEAVE_POLICY): YearBoundaries {
  const targetYear = year || new Date().getFullYear();
  
  // Calculate year start based on policy
  const yearStart = new Date(targetYear, policy.yearStartMonth, 1, 0, 0, 0, 0);
  
  // Calculate year end (11 months + remaining days from start)
  const yearEnd = new Date(targetYear, policy.yearStartMonth + 12, 0, 23, 59, 59, 999);
  
  return {
    yearStart,
    yearEnd,
    year: targetYear
  };
}

/**
 * Check if a date falls within the specified year boundaries
 */
export function isDateInYear(date: Date, boundaries: YearBoundaries): boolean {
  return date >= boundaries.yearStart && date <= boundaries.yearEnd;
}

/**
 * Clamp a date range to year boundaries
 */
export function clampDateToYear(start: Date, end: Date, boundaries: YearBoundaries): { start: Date; end: Date } | null {
  const clampedStart = start < boundaries.yearStart ? boundaries.yearStart : start;
  const clampedEnd = end > boundaries.yearEnd ? boundaries.yearEnd : end;
  
  // Return null if the range doesn't overlap with the year
  if (clampedStart > clampedEnd || clampedEnd < boundaries.yearStart || clampedStart > boundaries.yearEnd) {
    return null;
  }
  
  return { start: clampedStart, end: clampedEnd };
}

/**
 * Calculate leave allocation for a specific year
 */
export function calculateLeaveAllocation(
  year: number, 
  policy: LeavePolicy = DEFAULT_LEAVE_POLICY
): { paidLeave: number; sickLeave: number; carryForward: number } {
  
  // Base allocation for the year
  let paidLeave = policy.paidLeaveAllocation;
  let sickLeave = policy.sickLeaveAllocation;
  let carryForward = 0;
  
  // If carry-forward is enabled, this would be calculated from previous year
  // For now, we enforce no carry-forward policy
  if (!policy.carryForward) {
    carryForward = 0;
  }
  
  return {
    paidLeave,
    sickLeave,
    carryForward
  };
}

/**
 * Validate leave policy compliance
 */
export function validateLeavePolicy(policy: LeavePolicy): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (policy.paidLeaveAllocation < 0) {
    errors.push('Paid leave allocation cannot be negative');
  }
  
  if (policy.sickLeaveAllocation < 0) {
    errors.push('Sick leave allocation cannot be negative');
  }
  
  if (policy.yearStartMonth < 0 || policy.yearStartMonth > 11) {
    errors.push('Year start month must be between 0 (January) and 11 (December)');
  }
  
  if (policy.carryForward && policy.maxCarryForward !== undefined && policy.maxCarryForward < 0) {
    errors.push('Maximum carry-forward cannot be negative');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get leave policy description for UI display
 */
export function getLeavesPolicyDescription(policy: LeavePolicy = DEFAULT_LEAVE_POLICY): string {
  const yearStartName = new Date(2024, policy.yearStartMonth, 1).toLocaleDateString('en-US', { month: 'long' });
  
  let description = `Leave year runs from ${yearStartName} 1st to ${yearStartName} 31st of the following year. `;
  
  if (policy.annualReset) {
    description += 'Leave balances reset annually. ';
  }
  
  if (policy.carryForward) {
    const maxCarry = policy.maxCarryForward ? ` (maximum ${policy.maxCarryForward} days)` : '';
    description += `Unused leaves can be carried forward to the next year${maxCarry}. `;
  } else {
    description += 'No carry-forward of unused leaves from previous year. ';
  }
  
  description += `Annual allocation: ${policy.paidLeaveAllocation} paid leave days, ${policy.sickLeaveAllocation} sick leave days.`;
  
  return description;
}

/**
 * Check if it's time for annual leave reset
 */
export function shouldResetLeaves(currentDate: Date = new Date(), policy: LeavePolicy = DEFAULT_LEAVE_POLICY): boolean {
  const boundaries = getYearBoundaries(currentDate.getFullYear(), policy);
  
  // Check if current date is the start of leave year
  const isYearStart = currentDate.getTime() >= boundaries.yearStart.getTime() && 
                     currentDate.getTime() < boundaries.yearStart.getTime() + 24 * 60 * 60 * 1000; // Within first day
  
  return isYearStart && policy.annualReset;
}