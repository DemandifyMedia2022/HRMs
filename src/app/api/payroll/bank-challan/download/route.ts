import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken, mapTypeToRole } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Authentication
    const token = request.cookies.get('access_token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token) as any;
    const user = await prisma.users.findUnique({ where: { email: payload.email } });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 401 });
    }

    // Check role strictly from DB `type` column
    const role = mapTypeToRole((user as any).type);

    if (role !== 'hr' && role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Access Denied' }, { status: 403 });
    }

    // Get parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const selectedMonth = searchParams.get('month') || new Date().toISOString().slice(0, 7);
    const [year, monthNum] = selectedMonth.split('-').map(Number);

    // Build where clause
    const whereClause: any = {};
    if (search) {
      whereClause.OR = [{ Full_name: { contains: search } }, { emp_code: { contains: search } }];
    }

    // Fetch users
    const users = await prisma.users.findMany({
      where: whereClause,
      orderBy: { emp_code: 'asc' }
    });

    // Get holidays for the month
    const holidays = await prisma.crud_events.findMany({
      where: {
        event_start: {
          gte: new Date(year, monthNum - 1, 1),
          lt: new Date(year, monthNum, 1)
        }
      },
      select: { event_start: true }
    });
    const holidayDates = holidays.map(h => h.event_start.toISOString().split('T')[0]);

    const data: any[] = [];

    for (let index = 0; index < users.length; index++) {
      const user = users[index];
      const empCode = user.emp_code;

      // Fetch attendance from npattendance using employee_id
      const attendance = await (prisma as any).npAttendance.findMany({
        where: {
          employeeId: empCode ? parseInt(empCode) : undefined,
          date: {
            gte: new Date(year, monthNum - 1, 1),
            lt: new Date(year, monthNum, 1)
          }
        }
      });

      const totalDays = new Date(year, monthNum, 0).getDate();

      // Count present days
      let presentDays = attendance.filter((entry: any) =>
        ['Present', 'work From Home', 'Paid Leave', 'Sick Leave(FullDay)', 'Week Off'].includes(entry.status)
      ).length;

      // Count half days
      const halfDays = attendance.filter((entry: any) => entry.status === 'Half-day').length * 0.5;

      // Generate all dates in month
      const allDates: string[] = [];
      for (let day = 1; day <= totalDays; day++) {
        allDates.push(new Date(year, monthNum - 1, day).toISOString().split('T')[0]);
      }

      const existingDates = attendance.map((a: any) => new Date(a.date).toISOString().split('T')[0]);
      const missingDates = allDates.filter(d => !existingDates.includes(d));

      // Count absent days
      let absentDays = attendance.filter((entry: any) => entry.status === 'Absent').length;
      absentDays += missingDates.length;

      // Subtract holidays from absent days
      const holidayCount = missingDates.filter(d => holidayDates.includes(d)).length;
      absentDays -= holidayCount;
      presentDays += holidayDates.length;

      // Fetch approved leaves
      const leaveDays = await prisma.leavedata.findMany({
        where: {
          emp_code: user.emp_code || undefined,
          HRapproval: 'Approved',
          Managerapproval: 'Approved',
          leave_type: {
            in: ['Paid Leave', 'Sick Leave(HalfDay)', 'Sick Leave(FullDay)', 'work From Home']
          },
          OR: [
            {
              start_date: {
                gte: new Date(year, monthNum - 1, 1),
                lt: new Date(year, monthNum, 1)
              }
            },
            {
              end_date: {
                gte: new Date(year, monthNum - 1, 1),
                lt: new Date(year, monthNum, 1)
              }
            }
          ]
        }
      });

      let totalPaidLeaveDays = 0;
      let totalSickLeaveDays = 0;
      const paidLeaveDates: string[] = [];

      leaveDays.forEach(leave => {
        const start = new Date(leave.start_date);
        const end = new Date(leave.end_date);

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          if (d.getMonth() + 1 !== monthNum || d.getFullYear() !== year) continue;
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
      });

      presentDays += totalPaidLeaveDays;
      absentDays -= paidLeaveDates.filter(d => missingDates.includes(d)).length;
      absentDays = Math.max(absentDays, 0);

      // Handle weekends before joining
      const joiningDate = user.joining_date ? new Date(user.joining_date) : null;
      let weekendsBeforeJoining = 0;

      if (joiningDate) {
        for (let day = 1; day <= totalDays; day++) {
          const date = new Date(year, monthNum - 1, day);
          if (date < joiningDate && (date.getDay() === 0 || date.getDay() === 6)) {
            weekendsBeforeJoining++;
          }
        }
      }

      const payDays = Math.max(0, totalDays - absentDays - halfDays + totalSickLeaveDays - weekendsBeforeJoining);
      const lopDays = totalDays - payDays;

      // Salary calculations
      const basic = parseFloat(user.Basic_Monthly_Remuneration || '0');
      const hra = parseFloat(user.HRA_Monthly_Remuneration || '0');
      const other = parseFloat(user.OTHER_ALLOWANCE_Monthly_Remuneration || '0');

      const basicEarned = (basic / totalDays) * payDays;
      const hraEarned = (hra / totalDays) * payDays;
      const otherEarned = (other / totalDays) * payDays;
      const totalEarning = Math.round(basicEarned) + Math.round(hraEarned) + Math.round(otherEarned);

      // ESI calculation
      const Employee_Esic_Monthly = user.Employee_Esic_Monthly || 0;
      const EmployeeEsicMonthly = (Number(Employee_Esic_Monthly) / totalDays) * payDays;

      // Professional Tax calculation
      let professionalTax = 0;
      if (!(user.Paygroup === 'Intern' && user.gender === 'Female')) {
        const monthName = new Date(year, monthNum - 1).toLocaleString('en', { month: 'short' }).toLowerCase();
        const slab = await prisma.slabs.findFirst();

        if (slab) {
          for (let i = 1; i <= 5; i++) {
            const gender = (slab as any)[`gender${i}`];
            const minLimit = (slab as any)[`min_limit${i}`];
            const maxLimit = (slab as any)[`max_limit${i}`];
            const monthKey = `${monthName}${i}`;

            if (
              user.gender?.toLowerCase() === gender?.toLowerCase() &&
              totalEarning >= minLimit &&
              totalEarning <= maxLimit
            ) {
              professionalTax = parseFloat((slab as any)[monthKey] || '0');
              break;
            }
          }
        }
      }

      // Income Tax calculation
      const investmentDeclaration = await (prisma as any).investment_declaration.findFirst({
        where: { emp_code: user.emp_code }
      });
      let incomeTax = 0;
      if (investmentDeclaration) {
        const tdsThisMonth = parseFloat(investmentDeclaration.TDS_this_month1 || '0');
        incomeTax = (tdsThisMonth / totalDays) * payDays;
      }

      // PF calculation
      let pfContribution = 0;
      if (user.PF_Monthly_Contribution) {
        pfContribution = Math.min(Math.round(basicEarned * 0.12), 1800);
      }

      const totalDeduction = pfContribution + professionalTax + Math.round(incomeTax) + Math.round(EmployeeEsicMonthly);
      const netPay = Math.round(totalEarning) - Math.round(totalDeduction);

      const today = new Date().toLocaleDateString('en-GB');

      data.push({
        'Sr No': index + 1,
        'Emp Code': user.emp_code || '',
        'Full Name': user.Full_name || '',
        'Employment Status': user.employment_status || '',
        Company: user.company_name || '',
        'Business Unit': user.Business_unit || '',
        Department: user.department || '',
        Designation: user.job_role || '',
        Branch: user.branch || '',
        'Date of Joining': user.joining_date || '',
        'PAN No': user.pan_card_no || '',
        'UAN No': user.UAN || '',
        'Payment Type': 'Salary',
        'Payment Mode': 'Online Transfer',
        'Bank Name': user.bank_name || '',
        'Bank Branch': user.bank_name || '',
        IFSC: user.IFSC_code || '',
        'Account No': user.Account_no || '',
        'Process Date': today,
        'Release Date': today,
        Amount: netPay,
        'Employment Type': user.employment_type || '',
        'First Name': user.Full_name || '',
        Grade: 'NA',
        Level: 'NA',
        'Mobile Number': user.contact_no || '',
        'Personal Email': user.Personal_Email || '',
        Region: 'West',
        'Sub Department': user.department || '',
        'Work Email': user.email || '',
        CTC: user.CTC || '',
        'Monthly Gross Salary': user.gross_salary || '',
        'BASIC(R)': basic,
        'HRA(R)': hra,
        'OTHER ALLOWANCE(R)': other,
        'Paid Days': Math.round(payDays * 10) / 10,
        'LOP Days': Math.round(lopDays * 10) / 10,
        Basic: Math.round(basicEarned),
        HRA: Math.round(hraEarned),
        'Other Allowance': Math.round(otherEarned),
        'Total Earning': Math.round(totalEarning),
        EPF: pfContribution,
        ESI: Math.floor(EmployeeEsicMonthly),
        'Income Tax': Math.round(incomeTax),
        'Professional Tax': professionalTax,
        'Total Deductions': Math.round(totalDeduction),
        'Net Pay': netPay,
        Arrears: '',
        Incentive: '',
        'Total Net Pay': netPay,
        Comments: ''
      });
    }

    // Generate CSV
    const monthName = new Date(year, monthNum - 1).toLocaleString('en', { month: 'long' });
    const filename = `Bank_Report_${monthName}_${year}.csv`;

    let csv = '';
    if (data.length > 0) {
      // Headers
      csv += Object.keys(data[0]).join(',') + '\n';

      // Rows
      data.forEach(row => {
        csv +=
          Object.values(row)
            .map(val => {
              // Escape values containing commas or quotes
              const str = String(val);
              if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
              }
              return str;
            })
            .join(',') + '\n';
      });
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (error: any) {
    console.error('Download error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate report',
        details: error.message
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
