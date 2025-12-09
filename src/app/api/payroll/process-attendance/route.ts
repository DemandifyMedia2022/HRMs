import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const cookies = request.cookies;
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');

    let token: string | null = null;
    if (cookies.has('access_token')) {
      token = cookies.get('access_token')?.value || null;
    }
    if (!token && authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }

    if (!token) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    let payload: any;
    try {
      payload = verifyToken(token);
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const selectedMonth = searchParams.get('month') || new Date().toISOString().slice(0, 7);
    const downloadCsv = searchParams.get('download') === 'csv';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = downloadCsv ? 10000 : 10; // Get all records for CSV download
    const offset = downloadCsv ? 0 : (page - 1) * limit;

    const [year, month] = selectedMonth.split('-').map(Number);

    // Get total days in the month
    const totalDays = new Date(year, month, 0).getDate();

    // Build search condition
    let whereClause: any = {};
    if (search) {
      whereClause = {
        OR: [{ Full_name: { contains: search } }, { emp_code: { contains: search } }]
      };
    }

    // Get total count
    const totalCount = await prisma.users.count({ where: whereClause });

    // Fetch users with pagination
    const users = await prisma.users.findMany({
      where: whereClause,
      skip: offset,
      take: limit,
      select: {
        id: true,
        Full_name: true,
        emp_code: true,
        company_name: true,
        job_role: true,
        Basic_Monthly_Remuneration: true,
        HRA_Monthly_Remuneration: true,
        OTHER_ALLOWANCE_Monthly_Remuneration: true,
        PF_Monthly_Contribution: true,
        Employee_Esic_Monthly: true,
        gross_salary: true,
        netSalary: true,
        gender: true,
        Paygroup: true,
        joining_date: true
      }
    });

    const processedUsers = await Promise.all(
      users.map(async user => {
        const empCode = user.emp_code || '';

        // Fetch attendance
        const attendance = await prisma.npattendance.findMany({
          where: {
            employee_id: empCode,
            date: {
              gte: new Date(year, month - 1, 1),
              lt: new Date(year, month, 1)
            }
          }
        });

        // Get holidays in the month
        const holidays = await prisma.crud_events.findMany({
          where: {
            event_date: {
              gte: new Date(year, month - 1, 1),
              lt: new Date(year, month, 1)
            }
          },
          select: { event_date: true }
        });
        const holidayDates = holidays
          .map(h => h.event_date?.toISOString().split('T')[0])
          .filter((d): d is string => d !== undefined);

        // Get all dates in month
        const allDates: string[] = [];
        for (let day = 1; day <= totalDays; day++) {
          allDates.push(new Date(year, month - 1, day).toISOString().split('T')[0]);
        }

        const existingDates = attendance.map(a => a.date.toISOString().split('T')[0]);
        const missingDates = allDates.filter(d => !existingDates.includes(d));

        // Count paid days from attendance records
        let paidDays = 0;
        
        // Process each attendance record
        for (const att of attendance) {
          const status = (att.status || '').trim();
          const dateStr = att.date.toISOString().split('T')[0];
          const isHoliday = holidayDates.includes(dateStr);
          
          // Half day (not on holiday) - count as 0.5
          if (status === 'Half-day' && !isHoliday) {
            paidDays += 0.5;
          }
          // All statuses including Absent are counted as paid (1 day) unless it's unpaid leave
          // This is because salary deduction happens only for unpaid leave, not for absent marking
          else if (status) {
            paidDays += 1;
          }
        }

        // Missing dates that are holidays should be counted as paid
        const missingHolidays = missingDates.filter(d => holidayDates.includes(d)).length;
        paidDays += missingHolidays;

        // Count weekends in missing dates as paid (Week Off)
        for (const dateStr of missingDates) {
          const date = new Date(dateStr);
          const dayOfWeek = date.getDay();
          // If it's a weekend (Saturday=6 or Sunday=0) and not already counted as holiday
          if ((dayOfWeek === 0 || dayOfWeek === 6) && !holidayDates.includes(dateStr)) {
            paidDays += 1;
          }
        }

        // Fetch approved leaves to add any missing paid leave days
        const leaveDays = await prisma.leavedata.findMany({
          where: {
            emp_code: empCode,
            HRapproval: 'Approved',
            Managerapproval: 'Approved',
            leave_type: {
              in: ['Paid Leave', 'Sick Leave(HalfDay)', 'Sick Leave(FullDay)', 'work From Home']
            },
            OR: [
              {
                start_date: {
                  gte: new Date(year, month - 1, 1),
                  lt: new Date(year, month, 1)
                }
              },
              {
                end_date: {
                  gte: new Date(year, month - 1, 1),
                  lt: new Date(year, month, 1)
                }
              }
            ]
          }
        });

        // Add approved leaves that are not already in attendance
        for (const leave of leaveDays) {
          const startDate = new Date(leave.start_date);
          const endDate = new Date(leave.end_date);

          for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            if (d.getMonth() + 1 !== month || d.getFullYear() !== year) continue;
            if (d.getDay() === 0 || d.getDay() === 6) continue; // Skip weekends

            const dateStr = d.toISOString().split('T')[0];

            // Only add if this date is not already in attendance records
            if (!existingDates.includes(dateStr)) {
              if (['Paid Leave', 'work From Home', 'Sick Leave(FullDay)'].includes(leave.leave_type)) {
                paidDays += 1;
              } else if (leave.leave_type === 'Sick Leave(HalfDay)') {
                paidDays += 0.5;
              }
            }
          }
        }

        // Final pay days calculation
        let payDays = Math.min(paidDays, totalDays); // Ensure it doesn't exceed total days in month
        payDays = Math.max(0, payDays); // Ensure it's not negative

        // Calculate component-wise earnings
        const basic = parseFloat(user.Basic_Monthly_Remuneration || '0');
        const hra = parseFloat(user.HRA_Monthly_Remuneration || '0');
        const other = parseFloat(user.OTHER_ALLOWANCE_Monthly_Remuneration || '0');

        const basicEarned = (basic / totalDays) * payDays;
        const hraEarned = (hra / totalDays) * payDays;
        const otherEarned = (other / totalDays) * payDays;
        const totalEarning = Math.round(basicEarned) + Math.round(hraEarned) + Math.round(otherEarned);

        // Calculate Professional Tax
        let professionalTax = 0;
        if (!(user.Paygroup === 'Intern' && user.gender === 'Female')) {
          const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
          const monthName = monthNames[month - 1];

          const slabs = await prisma.slabs.findFirst();
          if (slabs) {
            for (let i = 1; i <= 5; i++) {
              const gender = (slabs as any)[`gender${i}`];
              const minLimit = (slabs as any)[`min_limit${i}`];
              const maxLimit = (slabs as any)[`max_limit${i}`];
              const monthKey = `${monthName}${i}`;

              if (
                gender &&
                user.gender &&
                gender.toLowerCase() === user.gender.toLowerCase() &&
                totalEarning >= minLimit &&
                totalEarning <= maxLimit
              ) {
                professionalTax = parseFloat((slabs as any)[monthKey] || '0');
                break;
              }
            }
          }
        }

        // Calculate ESI
        const employeeEsicMonthly = user.Employee_Esic_Monthly ? parseFloat(String(user.Employee_Esic_Monthly)) : 0;
        const esiEarned = (employeeEsicMonthly / totalDays) * payDays;

        // Fetch Income Tax
        const investmentDeclaration = await prisma.investment_declaration.findFirst({
          where: { emp_code: empCode },
          select: { TDS_this_month1: true }
        });
        const incomeTax = parseFloat(investmentDeclaration?.TDS_this_month1 || '0');

        // Calculate PF Contribution
        let pfContribution = 0;
        if (user.PF_Monthly_Contribution && parseFloat(user.PF_Monthly_Contribution) > 0) {
          const basicEarnedForPF = (basic / totalDays) * payDays;
          pfContribution = Math.min(Math.round(basicEarnedForPF * 0.12), 1800);
        }

        // Total Deduction
        const totalDeduction = Math.round(pfContribution + professionalTax + incomeTax + esiEarned);
        const netPay = Math.round(totalEarning - totalDeduction);

        return {
          id: Number(user.id),
          Full_name: user.Full_name,
          emp_code: user.emp_code,
          company_name: user.company_name,
          job_role: user.job_role,
          pay_days: Math.round(payDays * 10) / 10,
          net_pay: netPay,
          arrear_days: 0
        };
      })
    );

    // If CSV download is requested, return CSV format
    if (downloadCsv) {
      const csvHeaders = ['#', 'Name', 'Emp Code', 'Company', 'Designation', 'Paid Days', 'Net Salary', 'Arrears'];
      const csvRows = processedUsers.map((user, index) => [
        index + 1,
        user.Full_name || '',
        user.emp_code || '',
        user.company_name || '',
        user.job_role || '',
        user.pay_days,
        user.net_pay,
        user.arrear_days
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => {
          // Escape cells containing commas or quotes
          const cellStr = String(cell);
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(','))
      ].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="process_attendance_${selectedMonth}.csv"`
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: processedUsers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit
      },
      selectedMonth
    });
  } catch (error: any) {
    console.error('Error fetching process attendance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch process attendance data', details: error.message },
      { status: 500 }
    );
  }
}
