import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken, mapTypeToRole } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    const token = request.cookies.get('access_token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized - No token found' }, { status: 401 });
    }

    // Verify token
    let payload: any;
    try {
      payload = verifyToken(token);
    } catch (e) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    // Fetch user to get their role
    const user = await prisma.users.findUnique({ where: { email: payload.email } });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 401 });
    }

    // Determine role strictly from DB `type` column
    const dept = user.department ?? null;
    const deptLower = dept ? String(dept).toLowerCase() : null;
    const role = mapTypeToRole((user as any).type);

    // Only HR and Admin can view and download all employees bank challan data
    if (role !== 'hr' && role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: 'Access Denied. Only HR and Admin can view bank challan data.'
        },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const selectedMonth = searchParams.get('month') || new Date().toISOString().slice(0, 7);

    // Build where clause
    const whereClause: any = {};

    if (search) {
      whereClause.OR = [{ Full_name: { contains: search } }, { emp_code: { contains: search } }];
    }

    // Fetch all users with their salary details
    const usersRaw = await prisma.users.findMany({
      where: whereClause,
      select: {
        id: true,
        emp_code: true,
        Full_name: true,
        employment_status: true,
        company_name: true,
        Business_unit: true,
        department: true,
        job_role: true,
        branch: true,
        joining_date: true,
        pan_card_no: true,
        UAN: true,
        bank_name: true,
        IFSC_code: true,
        Account_no: true,
        employment_type: true,
        contact_no: true,
        Personal_Email: true,
        email: true,
        gender: true,
        Paygroup: true,
        CTC: true,
        gross_salary: true,
        Basic_Monthly_Remuneration: true,
        HRA_Monthly_Remuneration: true,
        OTHER_ALLOWANCE_Monthly_Remuneration: true,
        PF_Monthly_Contribution: true,
        Employee_Esic_Monthly: true,
        netSalary: true
      },
      orderBy: {
        emp_code: 'asc'
      }
    });

    // Convert BigInt to number for JSON serialization
    const users = usersRaw.map(user => ({
      ...user,
      id: Number(user.id)
    }));

    // Parse selected month
    const [year, month] = selectedMonth.split('-').map(Number);
    const totalDays = new Date(year, month, 0).getDate();

    // Fetch holidays for the month
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

    // Fetch professional tax slabs
    const slabs = await prisma.slabs.findFirst();

    // Process each user
    const enrichedData = await Promise.all(
      users.map(async user => {
        if (!user.emp_code) return { ...user };

        // Fetch attendance from npattendance table
        const attendance = await prisma.npattendance.findMany({
          where: {
            employee_id: user.emp_code,
            date: {
              gte: new Date(year, month - 1, 1),
              lt: new Date(year, month, 1)
            }
          }
        });

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
            emp_code: user.emp_code,
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

        const lopDays = totalDays - payDays;

        // Calculate component-wise earnings
        const basic = parseFloat(user.Basic_Monthly_Remuneration || '0');
        const hra = parseFloat(user.HRA_Monthly_Remuneration || '0');
        const other = parseFloat(user.OTHER_ALLOWANCE_Monthly_Remuneration || '0');

        const basicEarned = (basic / totalDays) * payDays;
        const hraEarned = (hra / totalDays) * payDays;
        const otherEarned = (other / totalDays) * payDays;
        const totalEarning = Math.round(basicEarned) + Math.round(hraEarned) + Math.round(otherEarned);

        // Calculate ESI
        const employeeEsicMonthly = user.Employee_Esic_Monthly || 0;
        const esiEarned = (employeeEsicMonthly / totalDays) * payDays;

        // Calculate Professional Tax
        let professionalTax = 0;
        const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const monthName = monthNames[month - 1];

        if (!(user.Paygroup === 'Intern' && user.gender === 'Female') && slabs) {
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

        // Fetch Income Tax (TDS) from investment declaration
        const investmentDeclaration = await prisma.investment_declaration.findFirst({
          where: { emp_code: user.emp_code },
          select: { TDS_this_month1: true }
        });

        const tdsThisMonth = parseFloat(investmentDeclaration?.TDS_this_month1 || '0');
        const incomeTax = (tdsThisMonth / totalDays) * payDays;

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
          ...user,
          pay_days: Math.round(payDays * 10) / 10,
          lop_days: Math.round(lopDays * 10) / 10,
          basic_earned: Math.round(basicEarned),
          hra_earned: Math.round(hraEarned),
          other_earned: Math.round(otherEarned),
          total_earning: totalEarning,
          EmployeeEsicMonthly: Math.round(esiEarned),
          professional_tax: professionalTax,
          income_tax: Math.round(incomeTax),
          PF_Monthly_Contribution: pfContribution,
          total_deduction: totalDeduction,
          net_pay: netPay
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: enrichedData,
      selectedMonth: selectedMonth
    });
  } catch (error: any) {
    console.error('Bank challan fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error.message
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
