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



    // Optional target employee override (for HR): ?emp=EMP_CODE_OR_ID

    const { searchParams } = new URL(request.url);

    const empOverride = (searchParams.get('emp') || '').toString();



    // Normalize employee identifier to match snapshots created from npattendance.employee_id

    const baseEmp = empOverride ? empOverride : (user.emp_code || '').toString();

    const empCode = baseEmp.trim();

    const empCodeNoSpace = empCode.replace(/\s+/g, '');

    const userIdStr = String(userIdNum);

    const candidateIds = Array.from(new Set([empCode, empCodeNoSpace, userIdStr]));



    // Get month and year from query params

    let month: number;

    let year: number;



    if (searchParams.get('month') && searchParams.get('year')) {

      month = parseInt(searchParams.get('month')!);

      year = parseInt(searchParams.get('year')!);

    } else {

      // Default to the latest available snapshot for this employee (exclude current month)

      const now = new Date();

      const currentMonth = now.getMonth() + 1;

      const currentYear = now.getFullYear();



      const latest = await prisma.payroll_attendance_snapshot

        .findFirst({

          where: {

            employee_id: { in: candidateIds as any },

            OR: [

              { year: { lt: currentYear } },

              { year: currentYear, month: { lt: currentMonth } }

            ]

          },

          orderBy: [{ year: 'desc' }, { month: 'desc' }]

        })

        .catch(() => null);



      if (!latest) {

        return NextResponse.json(

          { success: false, error: 'Payslip not available. Month not finalized or snapshot missing.' },

          { status: 404 }

        );

      }

      month = latest.month;

      year = latest.year;

    }



    // Strict rule: payslip must read from payroll_attendance_snapshot

    // Attempt strict composite match; if schema differs (spaces), fallback to findFirst with IN

    let snapshot = await prisma.payroll_attendance_snapshot.findUnique({

      where: { employee_id_year_month: { employee_id: empCode as any, year, month } as any },

    }).catch(() => null);

    if (!snapshot) {

      snapshot = await prisma.payroll_attendance_snapshot.findFirst({

        where: { employee_id: { in: candidateIds as any }, year, month }

      }).catch(() => null);

    }



    if (!snapshot) {

      // Fallback: use latest available snapshot for this employee (exclude current month)

      const now2 = new Date();

      const currentMonth2 = now2.getMonth() + 1;

      const currentYear2 = now2.getFullYear();

      const latestAlt = await prisma.payroll_attendance_snapshot

        .findFirst({

          where: {

            employee_id: { in: candidateIds as any },

            OR: [

              { year: { lt: currentYear2 } },

              { year: currentYear2, month: { lt: currentMonth2 } }

            ]

          },

          orderBy: [{ year: 'desc' }, { month: 'desc' }]

        })

        .catch(() => null);



      if (!latestAlt) {

        return NextResponse.json(

          { success: false, error: 'Payslip not available. Month not finalized or snapshot missing.' },

          { status: 404 }

        );

      }

      snapshot = latestAlt as any;

      month = latestAlt.month;

      year = latestAlt.year;

    }



    if (!snapshot) {

      return NextResponse.json(

        { success: false, error: 'Payslip not available. Month not finalized or snapshot missing.' },

        { status: 404 }

      );

    }



    // Use snapshot values but pro-rate against calendar days in month

    const calendarDays = new Date(year, month, 0).getDate();

    const presentDays = Number(snapshot.present_days || 0);

    const leaveDaysCount = Number(snapshot.leave_days || 0);

    const absentDays = Number(snapshot.absent_days || 0);

    const halfDays = presentDays % 1; // 0.5 if any half-day counted in present

    const payDays = Math.max(0, Math.min(calendarDays, presentDays + leaveDaysCount));



    // Calculate component-wise earnings

    const basic = parseFloat(user.Basic_Monthly_Remuneration || '0');

    const hra = parseFloat(user.HRA_Monthly_Remuneration || '0');

    const other = parseFloat(user.OTHER_ALLOWANCE_Monthly_Remuneration || '0');



    const denom = calendarDays || 1;

    const basicEarned = (basic / denom) * payDays;

    const hraEarned = (hra / denom) * payDays;

    const otherEarned = (other / denom) * payDays;

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

    const esiEarned = (employeeEsicMonthly / calendarDays) * payDays;



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

      const basicEarnedForPF = (basic / calendarDays) * payDays;

      pfContribution = Math.min(Math.round(basicEarnedForPF * 0.12), 1800);

    }



    // Total Deduction

    const totalDeduction = Math.round(pfContribution + professionalTax + incomeTax + esiEarned);

    const inhandSalary = Math.round(totalEarning - totalDeduction);

    const netPayInWords = convertNumberToWords(inhandSalary);



    // Fetch all available payslips from snapshot (grouped by month and year)

    // Try listing with a broad IN filter via ORM (safer than raw REPLACE logic)

    const availablePayslips = (await prisma.payroll_attendance_snapshot

      .findMany({

        where: { employee_id: { in: candidateIds as any } },

        select: { year: true, month: true },

        orderBy: [{ year: 'desc' }, { month: 'desc' }]

      })

      .catch(() => [])) as any[];



    // Filter out current month

    const now = new Date();

    const currentMonth = now.getMonth() + 1;

    const currentYear = now.getFullYear();



    const filteredPayslips = availablePayslips

      .filter((payslip: any) => {

        return !(payslip.month === currentMonth && payslip.year === currentYear);

      })

      .filter((payslip: any) => {

        // Show only from Jan 2025 onwards

        return payslip.year > 2024;

      });



    // Create single entry per month (full month) with deduplication

    const uniquePayslips = new Map();

    filteredPayslips.forEach((payslip: any) => {

      const key = `${payslip.year}-${payslip.month}`;

      if (!uniquePayslips.has(key)) {

        uniquePayslips.set(key, {

          year: payslip.year,

          month: payslip.month,

          period: 'Full Month'

        });

      }

    });

    const payslipsWithPeriod = Array.from(uniquePayslips.values());



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

          totalDays: calendarDays,

          presentDays: Math.round(presentDays * 10) / 10,

          absentDays: Math.round(absentDays * 10) / 10,

          halfDays: Math.round(halfDays * 10) / 10,

          leaveDays: Math.round(leaveDaysCount * 10) / 10,

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

        payslips: payslipsWithPeriod,

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

