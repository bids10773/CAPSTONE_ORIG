import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    Building2,
    CalendarDays,
    CheckCircle2,
    Download,
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
        examination_purpose: string;
    };
    acceptUrl: string;
    downloadUrl: string;
    authenticated: boolean;
}

export default function ReferralInvitation({
    referral,
    acceptUrl,
    downloadUrl,
    authenticated,
}: Props) {
    const unavailable = ['expired', 'cancelled', 'completed'].includes(
        referral.status,
    );

    return (
        <main className="relative min-h-screen overflow-hidden bg-moss-50 px-4 py-8 text-slate-900 sm:py-12">
            <Head title="Company Medical Referral" />
            <div className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-moss-200/60 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 -left-28 size-80 rounded-full bg-moss-300/40 blur-3xl" />
            <section className="relative mx-auto max-w-2xl overflow-hidden rounded-[1.5rem] border border-moss-200/80 bg-white shadow-[0_24px_70px_-30px_rgba(48,63,52,0.35)]">
                <header className="bg-moss-600 px-6 py-7 text-white sm:px-9 sm:py-8">
                    <img
                        src="/images/email-logo.png"
                        alt="Living Myth Industrial Clinic"
                        className="h-12 w-auto"
                    />
                    <div className="mt-6 flex items-start gap-4">
                        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10">
                            <Building2 className="size-6" />
                        </span>
                        <div>
                            <p className="text-xs font-bold tracking-[0.16em] text-moss-100 uppercase">
                                Company medical referral
                            </p>
                            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                                {referral.company}
                            </h1>
                            <p className="mt-2 text-sm text-moss-100">
                                Referral {referral.referral_number}
                            </p>
                        </div>
                    </div>
                </header>
                <div className="space-y-7 p-6 sm:p-9">
                    <div className="flex items-start gap-3 rounded-xl border border-moss-200 bg-moss-50 p-4 text-sm text-moss-900">
                        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-moss-600" />
                        <div>
                            <p className="font-semibold">Verified referral</p>
                            <p className="mt-1 leading-6 text-moss-800">
                                Issued for {referral.employee_name}.
                                Authentication is required before scheduling.
                            </p>
                        </div>
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-slate-800">
                            Required medical services
                        </h2>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            {referral.required_services.map((service) => (
                                <div
                                    key={service}
                                    className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-sm text-slate-700"
                                >
                                    <CheckCircle2 className="size-4 text-moss-600" />
                                    {service}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                        <CalendarDays className="size-5 text-moss-600" />
                        Valid until{' '}
                        {new Date(
                            `${referral.valid_until}T00:00:00`,
                        ).toLocaleDateString()}
                    </div>
                    {unavailable ? (
                        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                            This company referral is no longer available for
                            scheduling. Contact your company or the clinic.
                        </p>
                    ) : (
                        <a
                            href={acceptUrl}
                            className="motion-press inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-moss-600 px-5 text-sm font-bold text-white shadow-lg shadow-moss-600/20 transition hover:-translate-y-0.5 hover:bg-moss-700"
                        >
                            {authenticated
                                ? 'Continue to appointment'
                                : 'Login or register to continue'}
                            <ArrowRight className="size-4" />
                        </a>
                    )}
                    <a
                        href={downloadUrl}
                        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-moss-300 bg-white px-4 text-sm font-semibold text-moss-700 transition hover:border-moss-400 hover:bg-moss-50"
                    >
                        <Download className="size-4" />
                        Download referral PDF
                    </a>
                    {!authenticated && (
                        <p className="text-center text-xs text-slate-500">
                            New patient?{' '}
                            <Link
                                href={acceptUrl}
                                className="font-semibold text-moss-700 underline-offset-4 hover:underline"
                            >
                                Continue with this invitation
                            </Link>
                            .
                        </p>
                    )}
                </div>
                <footer className="border-t border-moss-100 bg-moss-50/70 px-6 py-4 text-center text-xs text-moss-800 sm:px-9">
                    Living Myth Industrial Clinic · Secure company referral
                </footer>
            </section>
        </main>
    );
}
