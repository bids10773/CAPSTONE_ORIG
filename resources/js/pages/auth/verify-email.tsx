import { Form, Head, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowRight, CheckCircle2, Clock3, LogOut, MailCheck,
    RefreshCw, ShieldCheck,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { logout } from '@/routes';
import { send } from '@/routes/verification';
import type { Auth } from '@/types';

interface VerificationPageProps {
    auth: Auth;
    status?: string;
    [key: string]: unknown;
}

const RESEND_DELAY_SECONDS = 45;

function maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    if (!domain) return 'your email address';

    const visibleCharacters = Math.min(2, localPart.length);
    const visible = localPart.slice(0, visibleCharacters);
    const hidden = '•'.repeat(Math.max(4, localPart.length - visibleCharacters));

    return `${visible}${hidden}@${domain}`;
}

export default function VerifyEmail() {
    const { auth, status } = usePage<VerificationPageProps>().props;
    const [secondsRemaining, setSecondsRemaining] = useState(RESEND_DELAY_SECONDS);
    const [announcement, setAnnouncement] = useState(
        status === 'verification-link-sent' ? 'A new verification link has been sent.' : '',
    );
    const maskedEmail = useMemo(() => maskEmail(auth.user.email), [auth.user.email]);
    const linkWasSent = status === 'verification-link-sent';

    useEffect(() => {
        if (secondsRemaining <= 0) return;

        const timer = window.setInterval(() => {
            setSecondsRemaining((current) => Math.max(0, current - 1));
        }, 1000);

        return () => window.clearInterval(timer);
    }, [secondsRemaining]);

    return (
        <>
            <Head title="Verify your email" />
            <AuthLayout>
                <div className="text-center">
                    <motion.div
                        initial={{ scale: 0.85, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                        className="relative mx-auto flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-teal-50 text-blue-600"
                    >
                        <MailCheck className="size-9" aria-hidden="true" />
                        <span className="absolute -right-1.5 -top-1.5 flex size-7 items-center justify-center rounded-full border-4 border-white bg-teal-500 text-white">
                            <CheckCircle2 className="size-3.5" />
                        </span>
                    </motion.div>

                    <p className="mt-6 text-xs font-semibold uppercase tracking-[.16em] text-blue-600">
                        One last step
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-slate-950">
                        Verify your email address
                    </h1>
                    <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">
                        We sent a secure verification link to the email address below. Open the message and select the verification button to complete your registration.
                    </p>
                </div>

                <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <div className="flex items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
                            <MailCheck className="size-[18px]" aria-hidden="true" />
                        </span>
                        <div className="min-w-0 text-left">
                            <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-slate-400">
                                Verification sent to
                            </p>
                            <p className="mt-0.5 truncate text-sm font-semibold text-slate-800" aria-label="Your masked email address">
                                {maskedEmail}
                            </p>
                        </div>
                    </div>
                </div>

                <div aria-live="polite" className="mt-5">
                    <AnimatePresence mode="wait">
                        {(linkWasSent || announcement) && (
                            <motion.div
                                key={announcement || status}
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                role="status"
                                className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-left text-xs leading-5 text-emerald-700"
                            >
                                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                                <span>A new verification link has been sent. Please check your inbox and spam folder.</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-left">
                    <div className="flex items-start gap-3">
                        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-blue-600" aria-hidden="true" />
                        <div>
                            <p className="text-xs font-semibold text-blue-900">Secure email verification</p>
                            <p className="mt-1 text-[11px] leading-5 text-blue-700">
                                For your security, verification links expire after a limited time and can only be used for this account.
                            </p>
                        </div>
                    </div>
                </div>

                <Form
                    {...send.form()}
                    className="mt-6"
                    onSuccess={() => {
                        setAnnouncement('A new verification link has been sent.');
                        setSecondsRemaining(RESEND_DELAY_SECONDS);
                    }}
                >
                    {({ processing }) => {
                        const resendDisabled = processing || secondsRemaining > 0;

                        return (
                            <div>
                                <p className="text-center text-xs text-slate-500">Didn’t receive the email?</p>
                                <button
                                    type="submit"
                                    disabled={resendDisabled}
                                    className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/15 active:scale-[.99] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                                >
                                    {processing ? (
                                        <>
                                            <Spinner className="size-4" />
                                            Sending verification link…
                                        </>
                                    ) : secondsRemaining > 0 ? (
                                        <>
                                            <Clock3 className="size-4" aria-hidden="true" />
                                            Resend available in {secondsRemaining}s
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className="size-4" aria-hidden="true" />
                                            Resend verification email
                                        </>
                                    )}
                                </button>
                            </div>
                        );
                    }}
                </Form>

                <div className="mt-7 border-t border-slate-100 pt-6">
                    <p className="text-center text-xs leading-5 text-slate-400">
                        Wrong email address? Return to sign in and register with the correct address.
                    </p>
                    <Form {...logout.form()} className="mt-3">
                        {({ processing }) => (
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-blue-600 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/15 disabled:opacity-60"
                            >
                                {processing ? <Spinner className="size-4" /> : <LogOut className="size-4" />}
                                Return to sign in
                                {!processing && <ArrowRight className="size-4" />}
                            </button>
                        )}
                    </Form>
                </div>

                <p className="mt-5 text-center text-[10px] leading-4 text-slate-400">
                    Keep this page open while checking your email. Verification will securely activate your patient account.
                </p>
            </AuthLayout>
        </>
    );
}
