import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IconLock } from '@tabler/icons-react';

export default function AccessDeniedPage() {
  return (
    <main className="min-h-svh flex items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <IconLock className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">Access denied</CardTitle>
          <CardDescription>
            You don't have permission to view this page. If you believe this is a mistake, please contact your
            administrator.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center gap-3">
          <Button asChild>
            <Link href="/">Go to Home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Back</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
