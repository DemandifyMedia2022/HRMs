import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function formatTo12Hour(time24: string): string {
  // expects HH:mm
  const [hStr, mStr] = time24.split(':');
  let h = Number(hStr);
  const m = Number(mStr);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  const hStr12 = String(h);
  const mPadded = m.toString().padStart(2, '0');
  return `${hStr12}:${mPadded} ${ampm}`;
}

export async function GET() {
  try {
    const users = await prisma.users.findMany({
      where: { Full_name: { not: null } } as any,
      select: { Full_name: true, emp_code: true },
      orderBy: { Full_name: 'asc' } as any
    });
    const deptRows: Array<{ department: string | null }> = await prisma.$queryRaw`
      SELECT DISTINCT department FROM users WHERE department IS NOT NULL AND department <> '' ORDER BY department ASC
    `;
    const departments = deptRows.map(r => r.department).filter((d): d is string => !!d);

    // Allocated groups from shift_time
    const rows = await prisma.shift_time.findMany({
      select: { group_name: true, Full_name: true, biomatric_id: true, shift_time: true },
      orderBy: [{ group_name: 'asc' }, { Full_name: 'asc' }]
    });
    const groupsMap = new Map<string, Array<{ Full_name: string; biomatric_id: number; shift_time: string }>>();
    for (const r of rows) {
      const g = r.group_name;
      if (!g) continue;
      const arr = groupsMap.get(g) || [];
      arr.push({ Full_name: r.Full_name, biomatric_id: r.biomatric_id, shift_time: r.shift_time });
      groupsMap.set(g, arr);
    }
    const groups = Array.from(groupsMap.entries()).map(([group_name, members]) => ({ group_name, members }));
    return NextResponse.json({ success: true, users, departments, groups });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e?.message || 'Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // Try JSON first, then fallback to formData
    let selectedUsers: string[] = [];
    let start_time = '';
    let end_time = '';
    let groupName = '';

    const ctype = req.headers.get('content-type') || '';
    if (ctype.includes('application/json')) {
      const body = await req.json().catch(() => ({}) as any);
      selectedUsers = Array.isArray(body?.selectedUsers) ? body.selectedUsers : [];
      start_time = String(body?.start_time || '');
      end_time = String(body?.end_time || '');
      groupName = String(body?.groupName || '');
    } else {
      const form = await req.formData().catch(() => null);
      if (form) {
        const all = form.getAll('selectedUsers');
        selectedUsers = all.map(v => String(v)).filter(Boolean);
        start_time = String(form.get('start_time') || '');
        end_time = String(form.get('end_time') || '');
        groupName = String(form.get('groupName') || '');
      }
    }

    if (!selectedUsers.length) {
      return NextResponse.json({ success: false, message: 'No users selected.' }, { status: 400 });
    }
    if (!/^\d{2}:\d{2}$/.test(start_time) || !/^\d{2}:\d{2}$/.test(end_time)) {
      return NextResponse.json(
        { success: false, message: 'start_time and end_time must be in HH:mm format.' },
        { status: 400 }
      );
    }

    const startFormatted = formatTo12Hour(start_time);
    const endFormatted = formatTo12Hour(end_time);
    const shiftTime = `${startFormatted} - ${endFormatted}`;

    let updated = 0;
    let inserted = 0;
    const updatedNames: string[] = [];
    const insertedNames: string[] = [];
    const skippedNames: string[] = [];

    for (const fullName of selectedUsers) {
      const user = await prisma.users.findFirst({ where: { Full_name: fullName } as any, select: { emp_code: true } });
      const empCode = (user?.emp_code || '').trim();
      if (!empCode) {
        skippedNames.push(fullName);
        continue;
      }

      const bioId = Number(empCode);
      if (!Number.isFinite(bioId)) {
        // If biomatric_id must be Int, skip non-numeric emp_code
        skippedNames.push(fullName);
        continue;
      }

      const exists = await prisma.shift_time.findFirst({ where: { Full_name: fullName } });
      if (exists) {
        const res = await prisma.shift_time.updateMany({
          where: { Full_name: fullName },
          data: {
            shift_time: shiftTime,
            group_name: groupName,
            biomatric_id: bioId
          }
        });
        updated += res.count;
        if (res.count > 0) updatedNames.push(fullName);
      } else {
        await prisma.shift_time.create({
          data: {
            Full_name: fullName,
            shift_time: shiftTime,
            group_name: groupName,
            biomatric_id: bioId
          }
        });
        inserted += 1;
        insertedNames.push(fullName);
      }
    }

    return NextResponse.json({
      success: true,
      shift_time: shiftTime,
      updated,
      inserted,
      updated_names: updatedNames,
      inserted_names: insertedNames,
      skipped_names: skippedNames
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e?.message || 'Error' }, { status: 500 });
  }
}
