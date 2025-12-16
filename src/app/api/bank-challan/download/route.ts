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

    const role = mapTypeToRole((user as any).type);

    // Only HR and Admin can download
    if (role !== 'hr' && role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Access Denied' },
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

    // Fetch all users
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
        CTC: true,
        gross_salary: true,
        Basic_Monthly_Remuneration: true,
        HRA_Monthly_Remuneration: true,
        OTHER_ALLOWANCE_Monthly_Remuneration: true,
        PF_Monthly_Contribution: true,
        Employee_Esic_Monthly: true,
        netSalary: true,
        gender: true,
        Paygroup: true
      },
      orderBy: { emp_code: 'asc' }
    });

    const users = usersRaw.map(user => ({ ...user, id: Number(user.id) }));

    const [year, month] = selectedMonth.split('-').map(Number);
    const totalDays = new Date(year, month, 0).getDate();

    // Fetch holidays
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

    const slabs = await prisma.slabs.findFirst();

    // Process each user
    const enrichedData = await Promise.all(
      users.map(async user => {
        if (!user.emp_code) return {
          ...user,
          pay_days: 0,
          lop_days: 0,
          basic_earned: 0,
          hra_earned: 0,
          other_earned: 0,
          total_earning: 0,
          EmployeeEsicMonthly: 0,
          professional_tax: 0,
          income_tax: 0,
          total_deduction: 0,
          net_pay: 0
        };

        const empIdStr = String(user.emp_code || '').trim();
        const attendance = await prisma.npattendance.findMany({
          where: {
            employee_id: empIdStr,
            date: {
              gte: new Date(year, month - 1, 1),
              lt: new Date(year, month, 1)
            }
          }
        });

        let presentDays = attendance.filter(a => a.status === 'Present').length;
        const paidStatusDays = attendance.filter(a =>
          ['work From Home', 'Paid Leave', 'Sick Leave(FullDay)', 'Week Off'].includes(a.status || '')
        ).length;

        const halfDays =
          attendance.filter(a => a.status === 'Half-day' && !holidayDates.includes(a.date.toISOString().split('T')[0]))
            .length * 0.5;

        const allDates: string[] = [];
        for (let day = 1; day <= totalDays; day++) {
          allDates.push(new Date(year, month - 1, day).toISOString().split('T')[0]);
        }

        const existingDates = attendance.map(a => a.date.toISOString().split('T')[0]);
        const missingDates = allDates.filter(d => !existingDates.includes(d));

        let absentDays = attendance.filter(a => a.status === 'Absent').length;
        absentDays += missingDates.length;

        const holidayCount = missingDates.filter(d => holidayDates.includes(d)).length;
        absentDays -= holidayCount;
        presentDays += holidayCount;

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
        absentDays -= paidLeaveDates.filter(d => missingDates.includes(d)).length;
        absentDays = Math.max(absentDays, 0);

        let payDays = totalDays - absentDays - halfDays + totalSickLeaveDays;
        payDays = Math.max(0, Math.min(payDays, totalDays)); // Ensure payDays doesn't exceed totalDays
        const lopDays = Math.max(0, totalDays - payDays);

        const basic = parseFloat(user.Basic_Monthly_Remuneration || '0');
        const hra = parseFloat(user.HRA_Monthly_Remuneration || '0');
        const other = parseFloat(user.OTHER_ALLOWANCE_Monthly_Remuneration || '0');

        const basicEarned = (basic / totalDays) * payDays;
        const hraEarned = (hra / totalDays) * payDays;
        const otherEarned = (other / totalDays) * payDays;
        const totalEarning = Math.round(basicEarned) + Math.round(hraEarned) + Math.round(otherEarned);

        const employeeEsicMonthly = user.Employee_Esic_Monthly || 0;
        const esiEarned = (employeeEsicMonthly / totalDays) * payDays;

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

        const investmentDeclaration = await prisma.investment_declaration.findFirst({
          where: { emp_code: user.emp_code },
          select: { TDS_this_month1: true }
        });

        const tdsThisMonth = parseFloat(investmentDeclaration?.TDS_this_month1 || '0');
        const incomeTax = (tdsThisMonth / totalDays) * payDays;

        let pfContribution = 0;
        if (user.PF_Monthly_Contribution && parseFloat(user.PF_Monthly_Contribution) > 0) {
          const basicEarnedForPF = (basic / totalDays) * payDays;
          pfContribution = Math.min(Math.round(basicEarnedForPF * 0.12), 1800);
        }

        const totalDeduction = Math.round(pfContribution + professionalTax + incomeTax + esiEarned);
        const netPay = Math.round(totalEarning - totalDeduction);

        return {
          ...user,
          pay_days: Math.round(Math.min(payDays, totalDays) * 10) / 10,
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

    // Generate CSV
    const getCurrentDate = () => {
      const today = new Date();
      return today.toLocaleDateString('en-GB');
    };

    const csvHeaders = [
      'Sr No', 'Emp Code', 'Full Name', 'Employment Status', 'Company', 'Business Unit',
      'Department', 'Designation', 'Branch', 'Date of Joining', 'PAN No', 'UAN No',
      'Payment Type', 'Payment Mode', 'Bank Name', 'Bank Branch', 'IFSC', 'Account No',
      'Process Date', 'Release Date', 'Amount', 'Employment Type', 'First Name',
      'Grade', 'Level', 'Mobile Number', 'Personal Email', 'Region', 'Sub Department',
      'Work Email', 'CTC', 'Monthly Gross Salary', 'BASIC(R)', 'HRA(R)', 'OTHER ALLOWANCE(R)',
      'Paid Days', 'LOP Days', 'Basic', 'HRA', 'Other Allowance', 'Total Earning',
      'EPF', 'ESI', 'Income Tax', 'Professional Tax', 'Total Deductions', 'Net Pay',
      'Arrears', 'Incentive', 'Total Net Pay', 'Comments'
    ];

    const csvRows = enrichedData.map((row, index) => [
      index + 1,
      row.emp_code || '',
      row.Full_name || '',
      row.employment_status || '',
      row.company_name || '',
      row.Business_unit || '',
      row.department || '',
      row.job_role || '',
      row.branch || '',
      row.joining_date || '',
      row.pan_card_no || '',
      row.UAN || '',
      'Salary',
      'Online Transfer',
      row.bank_name || '',
      row.bank_name || '',
      row.IFSC_code || '',
      row.Account_no || '',
      getCurrentDate(),
      getCurrentDate(),
      row.net_pay || row.netSalary || '',
      row.employment_type || '',
      row.Full_name || '',
      'NA',
      'NA',
      row.contact_no || '',
      row.Personal_Email || '',
      'West',
      row.department || '',
      row.email || '',
      row.CTC || '',
      row.gross_salary || '',
      row.Basic_Monthly_Remuneration || '',
      row.HRA_Monthly_Remuneration || '',
      row.OTHER_ALLOWANCE_Monthly_Remuneration || '',
      row.pay_days !== null && row.pay_days !== undefined ? row.pay_days : 0,
      row.lop_days !== null && row.lop_days !== undefined ? row.lop_days : 0,
      row.basic_earned || '',
      row.hra_earned || '',
      row.other_earned || '',
      row.total_earning || '',
      row.PF_Monthly_Contribution || '',
      row.EmployeeEsicMonthly || '',
      row.income_tax || '',
      row.professional_tax || '',
      row.total_deduction || '',
      row.net_pay || '',
      '',
      '',
      row.net_pay || '',
      ''
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => {
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
        'Content-Disposition': `attachment; filename="Bank_Report_${selectedMonth}.csv"`
      }
    });

  } catch (error: any) {
    console.error('Bank challan download error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
