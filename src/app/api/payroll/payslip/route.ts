import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// Helper function to convert number to words
function convertNumberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = [
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen'
  ];

  if (num === 0) return 'Zero Rupees Only';

  const convertHundreds = (n: number): string => {
    let str = '';
    if (n > 99) {
      str += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n > 19) {
      str += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    } else if (n > 9) {
      str += teens[n - 10] + ' ';
      return str;
    }
    str += ones[n] + ' ';
    return str;
  };

  let result = '';
  if (num >= 10000000) {
    result += convertHundreds(Math.floor(num / 10000000)) + 'Crore ';
    num %= 10000000;
  }
  if (num >= 100000) {
    result += convertHundreds(Math.floor(num / 100000)) + 'Lakh ';
    num %= 100000;
  }
  if (num >= 1000) {
    result += convertHundreds(Math.floor(num / 1000)) + 'Thousand ';
    num %= 1000;
  }
  if (num > 0) {
    result += convertHundreds(num);
  }

  return result.trim() + ' Rupees Only';
}

// GET - Fetch logged-in user's payslip data
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
      return NextResponse.json({ success: false, error: 'Not authenticated. Please login.' }, { status: 401 });
    }

    let payload: any;
    try {
      payload = verifyToken(token);
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid session. Please login again.' }, { status: 401 });
    }

    const userIdNum = Number(payload.id);
    if (!userIdNum || Number.isNaN(userIdNum)) {
      return NextResponse.json({ success: false, error: 'User ID not found in session.' }, { status: 401 });
    }

    // Get the user with full details
    const user = await (prisma as any).users.findUnique({
      where: { id: BigInt(userIdNum) },
      select: {
        emp_code: true,
        Full_name: true,
        gender: true,
        Paygroup: true,
        job_role: true,
        joining_date: true,
        pan_card_no: true,
        Account_no: true,
        UAN: true,
        bank_name: true,
        IFSC_code: true,
        Basic_Monthly_Remuneration: true,
        HRA_Monthly_Remuneration: true,
        OTHER_ALLOWANCE_Monthly_Remuneration: true,
        PF_Monthly_Contribution: true,
        Employee_Esic_Monthly: true,
        gross_salary: true,
        netSalary: true
      }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
    }

    // Get month and year from query params
    const { searchParams } = new URL(request.url);
    let month: number;
    let year: number;

    if (searchParams.get('month') && searchParams.get('year')) {
      month = parseInt(searchParams.get('month')!);
      year = parseInt(searchParams.get('year')!);
    } else {
      const now = new Date();
      const currentDay = now.getDate();

      if (currentDay < 28) {
        month = now.getMonth() + 1;
        year = now.getFullYear();
      } else {
        const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        month = prevDate.getMonth() + 1;
        year = prevDate.getFullYear();
      }
    }

    // Calculate total days in the month
    const totalDays = new Date(year, month, 0).getDate();

    // Fetch attendance from npattendance table
    const attendance =
      (await prisma.npattendance
        .findMany({
          where: {
            employee_id: user.emp_code,
            date: {
              gte: new Date(year, month - 1, 1),
              lt: new Date(year, month, 1)
            }
          },
          orderBy: { date: 'asc' }
        })
        .catch(() => [])) || [];

    // Fetch holidays
    const holidays =
      (await prisma.crud_events
        .findMany({
          where: {
            event_date: {
              gte: new Date(year, month - 1, 1),
              lt: new Date(year, month, 1)
            }
          },
          select: { event_date: true }
        })
        .catch(() => [])) || [];
    const holidayDates = holidays
      .map(h => h.event_date?.toISOString().split('T')[0])
      .filter((d): d is string => d !== undefined);

    // Count present days
    let presentDays = attendance.filter(a => a.status === 'Present').length;

    // Add paid statuses
    const paidStatusDays = attendance.filter(a =>
      ['work From Home', 'Paid Leave', 'Sick Leave(FullDay)', 'Week Off'].includes(a.status || '')
    ).length;
    presentDays += paidStatusDays;

    // Count half days (excluding holidays)
    const halfDays =
      attendance.filter(a => a.status === 'Half-day' && !holidayDates.includes(a.date.toISOString().split('T')[0]))
        .length * 0.5;

    // Get all dates in the month
    const allDates: string[] = [];
    for (let day = 1; day <= totalDays; day++) {
      allDates.push(new Date(year, month - 1, day).toISOString().split('T')[0]);
    }

    const existingDates = attendance.map(a => a.date.toISOString().split('T')[0]);
    const missingDates = allDates.filter(d => !existingDates.includes(d));

    // Count absent days
    let absentDays = attendance.filter(a => a.status === 'Absent').length;
    absentDays += missingDates.length;

    // Subtract holidays from absent days and add to present days
    const holidayCount = missingDates.filter(d => holidayDates.includes(d)).length;
    absentDays -= holidayCount;
    presentDays += holidayDates.length;

    // Fetch approved leaves
    const leaveDays =
      (await prisma.leavedata
        .findMany({
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
        })
        .catch(() => [])) || [];

    let totalPaidLeaveDays = 0;
    let totalSickLeaveDays = 0;
    const paidLeaveDates: string[] = [];

    for (const leave of leaveDays) {
      const startDate = new Date(leave.start_date);
      const endDate = new Date(leave.end_date);

      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        if (d.getMonth() + 1 !== month || d.getFullYear() !== year) continue;
        if (d.getDay() === 0 || d.getDay() === 6) continue; // Skip weekends

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
    absentDays -= paidLeaveDates.filter(d => missingDates.includes(d)).length;
    absentDays = Math.max(absentDays, 0);

    // Handle dates before joining date
    const joiningDate = user.joining_date ? new Date(user.joining_date) : null;
    if (joiningDate) {
      const validDates: string[] = [];
      for (let day = 1; day <= totalDays; day++) {
        const date = new Date(year, month - 1, day);
        if (date >= joiningDate) {
          validDates.push(date.toISOString().split('T')[0]);
        }
      }
    }

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
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const monthName = monthNames[month - 1];

    if (user.Paygroup !== 'Intern') {
      const slabs = await prisma.slabs.findFirst().catch(() => null);

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
    const employeeEsicMonthly = user.Employee_Esic_Monthly || 0;
    const esiEarned = (employeeEsicMonthly / totalDays) * payDays;

    // Fetch Income Tax (TDS)
    const investmentDeclaration = await prisma.investment_declaration
      .findFirst({
        where: { emp_code: user.emp_code },
        select: { TDS_this_month1: true }
      })
      .catch(() => null);
    const incomeTax = parseFloat(investmentDeclaration?.TDS_this_month1 || '0');

    // Calculate PF Contribution
    let pfContribution = 0;
    if (user.PF_Monthly_Contribution && parseFloat(user.PF_Monthly_Contribution) > 0) {
      const basicEarnedForPF = (basic / totalDays) * payDays;
      pfContribution = Math.min(Math.round(basicEarnedForPF * 0.12), 1800);
    }

    // Total Deduction
    const totalDeduction = Math.round(pfContribution + professionalTax + incomeTax + esiEarned);
    const inhandSalary = Math.round(totalEarning - totalDeduction);
    const netPayInWords = convertNumberToWords(inhandSalary);

    // Fetch all available payslips (grouped by month and year)
    const availablePayslips =
      (await prisma
        .$queryRawUnsafe<any[]>(
          `SELECT
        YEAR(date) as year,
        MONTH(date) as month
      FROM npattendance
      WHERE npattendance.employee_id = ?
      GROUP BY year, month
      ORDER BY year DESC, month DESC`,
          user.emp_code
        )
        .catch(() => [])) || [];

    // Filter out current month
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const filteredPayslips = availablePayslips.filter((payslip: any) => {
      return !(payslip.month === currentMonth && payslip.year === currentYear);
    });

    return NextResponse.json({
      success: true,
      data: {
        employee: {
          Full_name: user.Full_name,
          emp_code: user.emp_code,
          job_role: user.job_role,
          joining_date: user.joining_date,
          pan_card_no: user.pan_card_no,
          Account_no: user.Account_no,
          UAN: user.UAN,
          bank_name: user.bank_name,
          IFSC_code: user.IFSC_code
        },
        salaryDetails: {
          Basic_Monthly_Remuneration: basic,
          HRA_Monthly_Remuneration: hra,
          OTHER_ALLOWANCE_Monthly_Remuneration: other,
          gross_salary: parseFloat(user.gross_salary || '0'),
          netSalary: parseFloat(user.netSalary || '0')
        },
        attendance: {
          totalDays,
          presentDays: Math.round(presentDays * 10) / 10,
          absentDays: Math.round(absentDays * 10) / 10,
          halfDays: Math.round(halfDays * 10) / 10,
          payDays: Math.round(payDays * 10) / 10
        },
        earnings: {
          basicEarned: Math.round(basicEarned),
          hraEarned: Math.round(hraEarned),
          otherEarned: Math.round(otherEarned),
          totalEarning
        },
        deductions: {
          pfContribution,
          professionalTax,
          incomeTax,
          esiEarned: Math.round(esiEarned),
          totalDeduction
        },
        netPay: {
          inhandSalary,
          netPayInWords
        },
        payslips: filteredPayslips,
        selectedMonth: month,
        selectedYear: year
      }
    });
  } catch (error: any) {
    console.error('Error fetching payslip data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payslip data.', details: error.message },
      { status: 500 }
    );
  }
}
