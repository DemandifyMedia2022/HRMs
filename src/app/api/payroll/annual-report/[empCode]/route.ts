import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ empCode: string }> }
) {
  try {
    const { empCode } = await params;
    
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

    try {
      verifyToken(token);
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }

    // Fetch user
    const user = await prisma.users.findFirst({
      where: { emp_code: empCode },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const fiscalMonths = [
      { num: 4, short: 'Apr' },
      { num: 5, short: 'May' },
      { num: 6, short: 'Jun' },
      { num: 7, short: 'Jul' },
      { num: 8, short: 'Aug' },
      { num: 9, short: 'Sep' },
      { num: 10, short: 'Oct' },
      { num: 11, short: 'Nov' },
      { num: 12, short: 'Dec' },
      { num: 1, short: 'Jan' },
      { num: 2, short: 'Feb' },
      { num: 3, short: 'Mar' },
    ];

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const fiscalYear = currentMonth >= 4 ? currentYear : currentYear - 1;

    // Get current fiscal month (previous month)
    const lastMonth = new Date(now);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const currentFiscalMonth = lastMonth;

    // Preload TDS values
    const monthlyTDS: Record<string, number> = {};
    for (const month of fiscalMonths) {
      const monthYear =
        month.num >= 4
          ? new Date(fiscalYear, month.num - 1)
          : new Date(fiscalYear + 1, month.num - 1);

      if (monthYear <= currentFiscalMonth) {
        const investmentDeclaration = await prisma.investment_declaration.findFirst({
          where: { emp_code: empCode },
          select: { TDS_this_month1: true },
        });
        monthlyTDS[month.short] = parseFloat(investmentDeclaration?.TDS_this_month1 || '0');
      } else {
        monthlyTDS[month.short] = 0;
      }
    }

    const orderedComponents = {
      BASIC: parseFloat(String(user.Basic_Monthly_Remuneration || '0')),
      HRA: parseFloat(String(user.HRA_Monthly_Remuneration || '0')),
      'OTHER ALLOWANCE': parseFloat(String(user.OTHER_ALLOWANCE_Monthly_Remuneration || '0')),
      PF: parseFloat(String(user.PF_Monthly_Contribution || '0')),
      ESI: user.Employee_Esic_Monthly ? parseFloat(String(user.Employee_Esic_Monthly)) : 0,
      'PROF. TAX': 0,
      TDS: 0,
    };

    const report: Record<string, Record<string, number>> = {};
    const slab = await prisma.slabs.findFirst();

    // Initialize components
    for (const [label, monthlyAmount] of Object.entries(orderedComponents)) {
      const row: Record<string, number> = {};
      let total = 0;

      for (const month of fiscalMonths) {
        let value = 0;
        const monthYear =
          month.num >= 4
            ? new Date(fiscalYear, month.num - 1)
            : new Date(fiscalYear + 1, month.num - 1);

        if (monthYear <= currentFiscalMonth) {
          if (label === 'PROF. TAX') {
            value = 0; // Calculated later
          } else if (label === 'TDS') {
            value = monthlyTDS[month.short] || 0;
          } else {
            value = monthlyAmount;
          }
          total += value;
        }

        row[month.short] = value;
      }

      row['Total'] = total;
      report[label] = row;

      if (label === 'OTHER ALLOWANCE') {
        report['Total Earnings'] = {};
      }
    }

    // Calculate actual earnings based on attendance
    let totalEarnings = 0;
    for (const month of fiscalMonths) {
      const monthYear =
        month.num >= 4
          ? new Date(fiscalYear, month.num - 1)
          : new Date(fiscalYear + 1, month.num - 1);

      if (monthYear <= currentFiscalMonth) {
        const totalDays = new Date(monthYear.getFullYear(), month.num, 0).getDate();

        const attendance = await prisma.npAttendance.findMany({
          where: {
            employeeId: parseInt(empCode) || 0,
            date: {
              gte: new Date(monthYear.getFullYear(), month.num - 1, 1),
              lt: new Date(monthYear.getFullYear(), month.num, 1),
            },
          },
        });

        let presentDays = attendance.filter((a) => a.status === 'Present').length;

        const holidays = await prisma.crud_events.findMany({
          where: {
            event_date: {
              gte: new Date(monthYear.getFullYear(), month.num - 1, 1),
              lt: new Date(monthYear.getFullYear(), month.num, 1),
            },
          },
        });
        const holidayDates = holidays.map((h) => h.event_date?.toISOString().split('T')[0]).filter((d): d is string => d !== undefined);

        const halfDays =
          attendance.filter(
            (a) => a.status === 'Half-day' && !holidayDates.includes(a.date.toISOString().split('T')[0])
          ).length * 0.5;

        const allDates: string[] = [];
        for (let day = 1; day <= totalDays; day++) {
          allDates.push(new Date(monthYear.getFullYear(), month.num - 1, day).toISOString().split('T')[0]);
        }

        const existingDates = attendance.map((a) => a.date.toISOString().split('T')[0]);
        const missingDates = allDates.filter((d) => !existingDates.includes(d));

        let absentDays = attendance.filter((a) => a.status === 'Absent').length + missingDates.length;
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
          },
        });

        let totalPaidLeaveDays = 0;
        let totalSickLeaveDays = 0;
        const paidLeaveDates: string[] = [];

        for (const leave of leaveDays) {
          const startDate = new Date(leave.start_date);
          const endDate = new Date(leave.end_date);

          for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            if (
              d.getMonth() + 1 !== month.num ||
              d.getFullYear() !== monthYear.getFullYear() ||
              d.getDay() === 0 ||
              d.getDay() === 6
            )
              continue;

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

        let payDays = totalDays - absentDays - halfDays + totalSickLeaveDays;
        payDays = Math.max(0, payDays);

        // Component-wise calculations
        const basic = parseFloat(user.Basic_Monthly_Remuneration || '0');
        const hra = parseFloat(user.HRA_Monthly_Remuneration || '0');
        const other = parseFloat(user.OTHER_ALLOWANCE_Monthly_Remuneration || '0');

        const basicEarned = (basic / totalDays) * payDays;
        const hraEarned = (hra / totalDays) * payDays;
        const otherEarned = (other / totalDays) * payDays;

        const totalEarning = Math.round(basicEarned) + Math.round(hraEarned) + Math.round(otherEarned);

        // ESI calculation
        const employeeEsicMonthly = parseFloat(String(user.Employee_Esic_Monthly || '0'));
        const esiEarned = (employeeEsicMonthly / totalDays) * payDays;

        report['BASIC'][month.short] = Math.round(basicEarned);
        report['HRA'][month.short] = Math.round(hraEarned);
        report['OTHER ALLOWANCE'][month.short] = Math.round(otherEarned);
        report['ESI'][month.short] = Math.round(esiEarned);
        report['Total Earnings'][month.short] = totalEarning;
        totalEarnings += totalEarning;
      } else {
        report['Total Earnings'][month.short] = 0;
      }
    }

    report['Total Earnings']['Total'] = totalEarnings;

    // Calculate totals for components
    let basicTotal = 0;
    let hraTotal = 0;
    let otherTotal = 0;
    let esiTotal = 0;

    for (const month of fiscalMonths) {
      const monthYear =
        month.num >= 4
          ? new Date(fiscalYear, month.num - 1)
          : new Date(fiscalYear + 1, month.num - 1);

      if (monthYear <= currentFiscalMonth) {
        basicTotal += report['BASIC'][month.short] || 0;
        hraTotal += report['HRA'][month.short] || 0;
        otherTotal += report['OTHER ALLOWANCE'][month.short] || 0;
        esiTotal += report['ESI'][month.short] || 0;
      }
    }

    report['BASIC']['Total'] = basicTotal;
    report['HRA']['Total'] = hraTotal;
    report['OTHER ALLOWANCE']['Total'] = otherTotal;
    report['ESI']['Total'] = esiTotal;

    // Calculate Professional Tax
    for (const month of fiscalMonths) {
      const monthYear =
        month.num >= 4
          ? new Date(fiscalYear, month.num - 1)
          : new Date(fiscalYear + 1, month.num - 1);

      if (monthYear <= currentFiscalMonth) {
        const totalEarning = report['Total Earnings'][month.short] || 0;
        let professionalTax = 0;

        if (user && !(user.Paygroup === 'Intern' && user.gender?.toLowerCase() === 'female') && slab) {
          const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
          const monthName = monthNames[month.num - 1];

          for (let i = 1; i <= 5; i++) {
            const gender = (slab as any)[`gender${i}`];
            const minLimit = (slab as any)[`min_limit${i}`];
            const maxLimit = (slab as any)[`max_limit${i}`];
            const monthKey = `${monthName}${i}`;

            if (
              gender &&
              user.gender &&
              gender.toLowerCase() === user.gender.toLowerCase() &&
              totalEarning >= minLimit &&
              totalEarning <= maxLimit
            ) {
              professionalTax = parseFloat((slab as any)[monthKey] || '0');
              break;
            }
          }
        }

        report['PROF. TAX'][month.short] = professionalTax;
      } else {
        report['PROF. TAX'][month.short] = 0;
      }
    }

    report['PROF. TAX']['Total'] = Object.values(report['PROF. TAX'])
      .filter((v) => typeof v === 'number')
      .reduce((a, b) => a + b, 0);

    // Calculate Total Deductions
    report['Total Deductions'] = {};
    let totalDeductions = 0;
    const deductionsLabels = ['PF', 'ESI', 'PROF. TAX', 'TDS'];

    for (const month of fiscalMonths) {
      const monthYear =
        month.num >= 4
          ? new Date(fiscalYear, month.num - 1)
          : new Date(fiscalYear + 1, month.num - 1);

      if (monthYear <= currentFiscalMonth) {
        let monthlyDeduction = 0;
        for (const label of deductionsLabels) {
          monthlyDeduction += report[label]?.[month.short] || 0;
        }
        report['Total Deductions'][month.short] = monthlyDeduction;
        totalDeductions += monthlyDeduction;
      } else {
        report['Total Deductions'][month.short] = 0;
      }
    }
    report['Total Deductions']['Total'] = totalDeductions;

    // Calculate Net Take Home
    report['Net Take Home'] = {};
    let netTotal = 0;

    for (const month of fiscalMonths) {
      const monthYear =
        month.num >= 4
          ? new Date(fiscalYear, month.num - 1)
          : new Date(fiscalYear + 1, month.num - 1);

      if (monthYear <= currentFiscalMonth) {
        const totalEarning = report['Total Earnings'][month.short] || 0;
        const totalDeduction = report['Total Deductions'][month.short] || 0;

        const netPay = totalEarning - totalDeduction;
        report['Net Take Home'][month.short] = Math.round(netPay);
        netTotal += netPay;
      } else {
        report['Net Take Home'][month.short] = 0;
      }
    }

    report['Net Take Home']['Total'] = Math.round(netTotal);

    return NextResponse.json({
      success: true,
      data: {
        user: {
          Full_name: user.Full_name,
          emp_code: user.emp_code,
        },
        fiscalMonths: fiscalMonths.map((m) => m.short),
        report,
      },
    });
  } catch (error: any) {
    console.error('Error fetching annual report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch annual report', details: error.message },
      { status: 500 }
    );
  }
}
