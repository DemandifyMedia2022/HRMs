import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const result = await prisma.users.findMany({
      select: {
        id: true,
        Full_name: true,
        PF_Annual_Contribution: true
      }
    });

    // Convert BigInt to string for JSON serialization
    const formattedData = result.map(
      (user: { id: bigint; Full_name: string | null; PF_Annual_Contribution: string | null }) => ({
        id: user.id.toString(),
        Full_name: user.Full_name,
        PF_Annual_Contribution: user.PF_Annual_Contribution
      })
    );

    return NextResponse.json({
      success: true,
      data: formattedData
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch users',
        error: error.message
      },
      { status: 500 }
    );
  }
}
