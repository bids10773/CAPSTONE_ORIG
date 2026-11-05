import { Head, Link, usePage } from '@inertiajs/react';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { SharedData } from '@/types';

export default function Forbidden({ message }: { message: string }) {
    const { auth } = usePage<SharedData>().props;
    const needsLicenseVerification = auth.requiresLicenseVerification;

    return (
        <AppLayout>
            <Head title="Access denied" />
            <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
                <section
                    aria-labelledby="forbidden-title"
                    className="w-full max-w-xl rounded-xl border border-border bg-card p-6 sm:p-8"
                >
                    <ShieldAlert
                        aria-hidden="true"
                        className="mb-5 size-10 text-amber-600 dark:text-amber-400"
                    />
                    <p className="mb-2 text-sm text-muted-foreground">
                        Error 403
                    </p>
                    <h1
                        id="forbidden-title"
                        className="text-2xl font-semibold text-foreground"
                    >
                        {needsLicenseVerification
                            ? 'Professional license verification required'
                            : 'Access denied'}
                    </h1>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        {message}
                    </p>
                    {needsLicenseVerification && (
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                            Review your license details in profile settings. If
                            you have already submitted them, contact an
                            administrator to complete verification.
                        </p>
                    )}
                    <div className="mt-6 flex flex-wrap gap-3">
                        {needsLicenseVerification && (
                            <Button asChild>
                                <Link href="/settings/profile">
                                    Review license details
                                </Link>
                            </Button>
                        )}
                        <Button asChild variant="outline">
                            <Link href="/dashboard">Return to dashboard</Link>
                        </Button>
                    </div>
                </section>
            </main>
        </AppLayout>
    );
}
