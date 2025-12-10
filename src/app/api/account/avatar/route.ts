
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { join, resolve } from 'path';
import { writeFile, mkdir } from 'fs/promises';

export const runtime = 'nodejs';

async function getMe(req: NextRequest) {
    const token = req.cookies.get('access_token')?.value;
    if (!token) return null;
    try {
        const payload = verifyToken(token) as any;
        const email = String(payload.email || '');
        if (!email) return null;
        const user = await (prisma as any).users.findUnique({ where: { email } });
        if (!user) return null;
        return user;
    } catch {
        return null;
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getMe(req);
        if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json({ message: 'Invalid file type. Only JPG, PNG, and WebP are allowed.' }, { status: 400 });
        }

        // Validate size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ message: 'File too large. Max 5MB.' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Determine upload directory
        const uploadDir = resolve(process.cwd(), 'uploads');

        // User slug generation (matching existing logic in files route)
        const nameStr = user.Full_name || user.name || 'user';
        const userSlug = String(nameStr)
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_-]/g, '_') || 'user';

        const userUploadDir = join(uploadDir, userSlug);

        // Ensure directory exists
        try {
            await mkdir(userUploadDir, { recursive: true });
        } catch (err) {
            // ignore if exists
        }

        // Generate filename with timestamp to avoid cache issues
        const ext = file.name.split('.').pop() || 'jpg';
        const filename = `profile_${Date.now()}.${ext}`;
        const filepath = join(userUploadDir, filename);

        // Write file
        await writeFile(filepath, buffer);

        // Save relative path to DB
        const storedPath = `${userSlug}/${filename}`;

        await (prisma as any).users.update({
            where: { id: user.id },
            data: { profile_image: storedPath }
        });

        return NextResponse.json({
            success: true,
            profile_image: storedPath
        });

    } catch (error: any) {
        console.error('Avatar upload error:', error);
        return NextResponse.json({ message: error.message || 'Upload failed' }, { status: 500 });
    }
}
