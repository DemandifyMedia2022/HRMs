import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { triggerEsslSync, waitForSync } from '@/lib/essl-sync';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('date');

    // Determine target date in IST
    const getISTDate = () => {
      return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    };
    const dateStr = q || getISTDate();
    const targetDate = new Date(dateStr); // UTC midnight for that date

    // Trigger ESSL sync with rate limiting for today's data
    const shouldSync = !q || q === getISTDate();
    if (shouldSync) {
      const syncInitiated = await triggerEsslSync({ date: dateStr });
      await waitForSync(syncInitiated, true);
    }

    // Get all employees first to ensure we have the complete count
    // Match the headcount API logic - count all users
    const allEmployees = await (prisma as any).users.findMany({
      select: { 
        id: true, 
        email: true, 
        emp_code: true,
        status: true,
        employment_status: true 
      }
    });

    // Query npattendance (primary) with consistent logic
    let rows = await (prisma as any).npattendance.findMany({
      where: { date: targetDate },
      select: { 
        employee_id: true,  
        status: true, 
        in_time: true, 
        out_time: true, 
        login_hours: true,
        total_hours: true
      },
      orderBy: { employee_id: 'asc' } // Consistent ordering
    });

    // Only fallback to attendance table if no npattendance records exist
    if (rows.length === 0) {
      rows = await (prisma as any).attendance.findMany({
        where: { date: targetDate },
        select: { 
          employee_id: true,
          status: true, 
          in_time: true, 
          out_time: true, 
          login_hours: true,
          total_hours: true
        },
        orderBy: { employee_id: 'asc' }
      });
    }
    
    // If still no attendance records, create default absent entries for all employees
    if (rows.length === 0) {
      console.log(`No attendance records found for ${dateStr}, using employee list`);
      rows = allEmployees.map((emp: any) => ({
        employee_id: emp.email || emp.emp_code || emp.id,
        status: 'absent',
        in_time: null,
        out_time: null,
        login_hours: null,
        total_hours: null
      }));
    }

    const total = Math.max(rows.length, allEmployees.length); // Use the larger count to ensure accuracy
    let present = 0;
    let absent = 0;
    
    // Debug logging for troubleshooting
    console.log(`Attendance calculation for ${dateStr}:`, {
      totalEmployees: allEmployees.length,
      attendanceRecords: rows.length,
      shouldSync,
      sampleRecords: rows.slice(0, 3).map((r: any) => ({
        employee_id: (r as any).employee_id,
        status: (r as any).status,
        in_time: (r as any).in_time,
        out_time: (r as any).out_time,
        login_hours: (r as any).login_hours,
        total_hours: (r as any).total_hours
      }))
    });
    
    // Strict attendance calculation with proper business rules
    for (const r of rows as any[]) {
      const status = String((r as any).status || '').toLowerCase().trim();
      const hasInTime = (r as any).in_time !== null;
      const hasOutTime = (r as any).out_time !== null;
      const loginHours = (r as any).login_hours;
      const totalHours = (r as any).total_hours;
      
      // Calculate working minutes more safely
      let workingMinutes = 0;
      try {
        if (loginHours) {
          if (typeof loginHours === 'string') {
            // Parse TIME format (HH:MM:SS)
            const timeParts = loginHours.split(':');
            if (timeParts.length >= 2) {
              const hours = parseInt(timeParts[0]) || 0;
              const minutes = parseInt(timeParts[1]) || 0;
              workingMinutes = hours * 60 + minutes;
            }
          } else if (loginHours instanceof Date) {
            // Parse DateTime object - extract hours and minutes from time portion
            const hours = loginHours.getUTCHours();
            const minutes = loginHours.getUTCMinutes();
            workingMinutes = hours * 60 + minutes;
          }
        } else if (totalHours) {
          if (typeof totalHours === 'string') {
            // Fallback to total hours if login hours not available
            const timeParts = totalHours.split(':');
            if (timeParts.length >= 2) {
              const hours = parseInt(timeParts[0]) || 0;
              const minutes = parseInt(timeParts[1]) || 0;
              workingMinutes = hours * 60 + minutes;
            }
          } else if (totalHours instanceof Date) {
            // Parse DateTime object - extract hours and minutes from time portion
            const hours = totalHours.getUTCHours();
            const minutes = totalHours.getUTCMinutes();
            workingMinutes = hours * 60 + minutes;
          }
        }
      } catch (error) {
        // If time parsing fails, workingMinutes remains 0
        console.warn('Failed to parse working hours:', { loginHours, totalHours, error });
      }
      
      // Strict business rules for attendance status
      const MINIMUM_PRESENT_MINUTES = 4 * 60;      // 4 hours minimum = present
      const MINIMUM_HALFDAY_MINUTES = 4 * 60;      // 4 hours = half-day (still present)
      const ONGOING_SHIFT_THRESHOLD = 3 * 60;      // 3 hours minimum for ongoing shift to count as present
      
      // Deterministic status logic with strict business rules
      if (status.includes('present')) {
        // Explicit present status - trust the system's calculation
        present++;
      } else if (status.includes('half-day') || status.includes('halfday')) {
        // Half-day counts as present for dashboard purposes
        present++;
      } else if (status.includes('absent')) {
        // Explicit absent status
        absent++;
      } else if (status === '' || status === 'pending' || status === null || !status) {
        // Handle ongoing/unclear status - apply strict rules
        if (hasInTime && workingMinutes >= MINIMUM_PRESENT_MINUTES) {
          // Worked 4+ hours = present
          present++;
        } else if (hasInTime && workingMinutes >= ONGOING_SHIFT_THRESHOLD) {
          // Worked 3+ hours and ongoing = present (benefit of doubt for ongoing shift)
          present++;
        } else if (hasInTime) {
          // Less than 3 hours worked = absent (insufficient time)
          absent++;
        } else {
          // No clock-in time = absent
          absent++;
        }
      } else {
        // Any other status - apply strict working time rules
        if (workingMinutes >= MINIMUM_PRESENT_MINUTES) {
          // Has sufficient working time = present
          present++;
        } else {
          // Insufficient working time = absent
          absent++;
        }
      }
      
      // Debug logging for first few records
      if ((present + absent) <= 5) {
        console.log(`Employee ${(r as any).employee_id}: status="${status}", workingMinutes=${workingMinutes}, hasInTime=${hasInTime}, result=${status.includes('present') || (status.includes('half') && status.includes('day')) ? 'present' : workingMinutes >= MINIMUM_PRESENT_MINUTES ? 'present' : 'absent'}`);
      }
    }

    // Ensure total matches present + absent
    const calculated = present + absent;
    if (calculated !== total && total > 0) {
      // Adjust if there's a mismatch (shouldn't happen with fixed logic)
      const diff = total - calculated;
      if (diff > 0) {
        absent += diff; // Add difference to absent
      }
    }

    // Final validation - ensure numbers make sense
    const finalTotal = Math.max(total, allEmployees.length);
    const finalPresent = Math.min(present, finalTotal);
    const finalAbsent = finalTotal - finalPresent;

    console.log(`Final attendance for ${dateStr}:`, {
      total: finalTotal,
      present: finalPresent,
      absent: finalAbsent
    });

    return NextResponse.json(
      { 
        date: dateStr, 
        total: finalTotal, 
        present: finalPresent, 
        absent: finalAbsent,
        timestamp: new Date().toISOString(), // Add timestamp for debugging
        debug: {
          employeeCount: allEmployees.length,
          attendanceRecords: rows.length,
          calculated: { present, absent, total: calculated }
        }
      }, 
      { 
        headers: { 
          'Cache-Control': 'public, max-age=30', // Cache for 30 seconds to reduce inconsistency
          'X-Data-Source': rows.length > 0 ? 'npattendance' : 'attendance'
        } 
      }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'error' }, { status: 500 });
  }
}
  