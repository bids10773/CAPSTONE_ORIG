import { Head, Link } from '@inertiajs/react';
import {
    Building2,
    CalendarDays,
    CheckCircle2,
    ShieldCheck,
} from 'lucide-react';

interface Props {
    referral: {
        referral_number: string;
        company: string;
        employee_name: string;
        required_services: string[];
        valid_until: string;
        status: string;
    };
    acceptUrl: string;
    authenticated: boolean;
}

export default function ReferralInvitation({
    referral,
    acceptUrl,
    authenticated,
}: Props) {
    const unavailable = ['expired', 'cancelled', 'completed'].includes(
        referral.status,
    );

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
            <Head title="Company Medical Referral" />
            <section className="mx-auto max-w-2xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <header className="border-b border-slate-100 p-6 sm:p-8">
                    <span className="flex size-11 items-center justify-center rounded-lg bg-moss-600 text-white">
                        <Building2 className="size-5" />
                    </span>
                    <p className="mt-5 text-xs font-bold tracking-wider text-moss-600 uppercase">
                        Company medical referral
                    </p>
                    <h1 className="mt-1 text-2xl font-semibold">
                        {referral.company}
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Referral {referral.referral_number}
                    </p>
                </header>
                <div className="space-y-6 p-6 sm:p-8">
                    <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                        <ShieldCheck className="mt-0.5 size-5 shrink-0" />
                        <div>
                            <p className="font-semibold">Verified referral</p>
                            <p className="mt-1">
                                Issued for {referral.employee_name}.
                                Authentication is required before scheduling.
                            </p>
                        </div>
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold">
                            Required medical services
                        </h2>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            {referral.required_services.map((service) => (
                                <div
                                    key={service}
                                    className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm"
                                >
                                    <CheckCircle2 className="size-4 text-moss-600" />
                                    {service}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <CalendarDays className="size-4" />
                        Valid until{' '}
                        {new Date(
                            `${referral.valid_until}T00:00:00`,
                        ).toLocaleDateString()}
                    </div>
                    {unavailable ? (
                        <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
                            This company referral is no longer available for
                            scheduling. Contact your company or the clinic.
                        </p>
                    ) : (
                        <a
                            href={acceptUrl}
                            className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-moss-600 px-4 text-sm font-semibold text-white hover:bg-moss-700"
                        >
                            {authenticated
                                ? 'Continue to appointment'
                                : 'Login or register to continue'}
                        </a>
                    )}
                    {!authenticated && (
                        <p className="text-center text-xs text-slate-500">
                            New patient?{' '}
                            <Link
                                href={acceptUrl}
                                className="font-semibold text-moss-700"
                            >
                                Continue with this invitation
                            </Link>
                            .
                        </p>
                    )}
                </div>
            </section>
        </main>
    );
}
