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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 10;
    const offset = (page - 1) * limit;

    const [year, month] = selectedMonth.split('-').map(Number);

    // Get total days in the month
    const totalDays = new Date(year, month, 0).getDate();

    // Build search condition
    let whereClause: any = {};
    if (search) {
      whereClause = {
        OR: [
          { Full_name: { contains: search } },
          { emp_code: { contains: search } }
        ]
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
        joining_date: true,
      },
    });

    const processedUsers = await Promise.all(
      users.map(async (user) => {
        const empCode = user.emp_code || '';

        // Fetch attendance
        const attendance = await prisma.npAttendance.findMany({
          where: {
            employeeId: parseInt(empCode) || 0,
            date: {
              gte: new Date(year, month - 1, 1),
              lt: new Date(year, month, 1),
            },
          },
        });

        // Count present days
        let presentDays = attendance.filter((a) => a.status === 'Present').length;
        
        // Add paid statuses
        const paidStatusDays = attendance.filter((a) =>
          ['work From Home', 'Paid Leave', 'Sick Leave(FullDay)', 'Week Off'].includes(a.status || '')
        ).length;
        presentDays += paidStatusDays;

        // Count half days
        const holidays = await prisma.crud_events.findMany({
          where: {
            event_date: {
              gte: new Date(year, month - 1, 1),
              lt: new Date(year, month, 1),
            },
          },
          select: { event_date: true },
        });
        const holidayDates = holidays.map((h) => h.event_date?.toISOString().split('T')[0]).filter((d): d is string => d !== undefined);

        const halfDays = attendance.filter((a) =>
          a.status === 'Half-day' && !holidayDates.includes(a.date.toISOString().split('T')[0])
        ).length * 0.5;

        // Get all dates in month
        const allDates: string[] = [];
        for (let day = 1; day <= totalDays; day++) {
          allDates.push(new Date(year, month - 1, day).toISOString().split('T')[0]);
        }

        const existingDates = attendance.map((a) => a.date.toISOString().split('T')[0]);
        const missingDates = allDates.filter((d) => !existingDates.includes(d));

        // Count absent days
        let absentDays = attendance.filter((a) => a.status === 'Absent').length;
        absentDays += missingDates.length;

        // Subtract holidays
        const holidayCount = missingDates.filter((d) => holidayDates.includes(d)).length;
        absentDays -= holidayCount;
        presentDays += holidayDates.length;

        // Fetch approved leaves
        const leaveDays = await prisma.leavedata.findMany({
          where: {
            emp_code: empCode,
            HRapproval: 'Approved',
            Managerapproval: 'Approved',
            leave_type: {
              in: ['Paid Leave', 'Sick Leave(HalfDay)', 'Sick Leave(FullDay)', 'work From Home'],
            },
            OR: [
              {
                start_date: {
                  gte: new Date(year, month - 1, 1),
                  lt: new Date(year, month, 1),
                },
              },
              {
                end_date: {
                  gte: new Date(year, month - 1, 1),
                  lt: new Date(year, month, 1),
                },
              },
            ],
          },
        });

        let totalPaidLeaveDays = 0;
        let totalSickLeaveDays = 0;
        const paidLeaveDates: string[] = [];

        for (const leave of leaveDays) {
          const startDate = new Date(leave.start_date);
          const endDate = new Date(leave.end_date);

          for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            if (d.getMonth() + 1 !== month || d.getFullYear() !== year) continue;
            if (d.getDay() === 0 || d.getDay() === 6) continue;

            const dateStr = d.toISOString().split('T')[0];

            if (['Paid Leave', 'work From Home'].includes(leave.leave_type)) {
              totalPaidLeaveDays++;
              paidLeaveDates.push(dateStr);
            } else if (leave.leave_type === 'Sick Leave(HalfDay)') {
              totalSickLeaveDays += 0.5;
            } else if (leave.leave_type === 'Sick Leave(FullDay)') {
              totalSickLeaveDays += 1;
            }
          }
        }

        presentDays += totalPaidLeaveDays;
        absentDays -= paidLeaveDates.filter((d) => missingDates.includes(d)).length;
        absentDays = Math.max(absentDays, 0);

        // Calculate pay days
        let payDays = totalDays - absentDays - halfDays + totalSickLeaveDays;
        payDays = Math.max(0, payDays);

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
          select: { TDS_this_month1: true },
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
          arrear_days: 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: processedUsers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit,
      },
      selectedMonth,
    });
  } catch (error: any) {
    console.error('Error fetching process attendance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch process attendance data', details: error.message },
      { status: 500 }
    );
  }
}
