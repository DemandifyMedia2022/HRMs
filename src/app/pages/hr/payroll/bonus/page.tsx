'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BonusRedirect() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to the correct location
        router.replace('/pages/hr/payroll/statutory/bonus');
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <p className="text-lg">Redirecting to Bonus page...</p>
            </div>
        </div>
    );
}
