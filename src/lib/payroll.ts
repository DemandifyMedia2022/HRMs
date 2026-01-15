import { prisma } from '@/lib/prisma';

export async function isMonthFrozen(year: number, month: number): Promise<boolean> {
  const freeze = await prisma.attendance_freeze.findUnique({
    where: { year_month: { year, month } as any },
  }).catch(() => null);
  return !!freeze?.is_frozen;
}

export function getMonthRange(year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return { start, end };
}
