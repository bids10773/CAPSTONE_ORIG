import { Form, Head, router, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertCircle,
    CheckCircle2,
    Eye,
    EyeOff,
    LockKeyhole,
    Mail,
    ShieldCheck,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import TextLink from '@/components/text-link';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

export default function Login({
    status,
    canResetPassword,
    canRegister,
}: Props) {
    const { auth, errors: pageErrors } = usePage().props as any;
    const [showPassword, setShowPassword] = useState(false);
    const [showVerified, setShowVerified] = useState(
        () =>
            typeof window !== 'undefined' &&
            new URLSearchParams(window.location.search).get('verified') === '1',
    );

    useEffect(() => {
        if (auth?.user) router.visit('/dashboard');
        if (showVerified) {
            window.history.replaceState(
                {},
                document.title,
                window.location.pathname,
            );
        }
    }, [auth?.user, showVerified]);

    return (
        <>
            <Head title="Secure sign in" />
            <AuthLayout variant="login">
                <header className="mb-8">
                    <div className="mb-5 flex size-11 items-center justify-center rounded-xl bg-moss-50 text-moss-600">
                        <ShieldCheck className="size-5" aria-hidden="true" />
                    </div>
                    <p className="text-xs font-semibold tracking-[.16em] text-moss-600 uppercase">
                        Welcome back
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-slate-950">
                        Sign in to your account
                    </h1>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        Securely sign in to continue to the medical services
                        portal.
                    </p>
                </header>

                {(status || pageErrors?.email) && (
                    <div
                        role="alert"
                        className={`mb-5 flex items-start gap-3 rounded-xl border p-3.5 text-sm ${pageErrors?.email ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}
                    >
                        {pageErrors?.email ? (
                            <AlertCircle className="mt-0.5 size-4 shrink-0" />
                        ) : (
                            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                        )}
                        <span>{pageErrors?.email || status}</span>
                    </div>
                )}

                <Form
                    {...store.form()}
                    resetOnSuccess={['password']}
                    className="space-y-5"
                >
                    {({ processing, errors }) => (
                        <>
                            <div>
                                <label
                                    htmlFor="email"
                                    className="mb-2 block text-sm font-medium text-slate-700"
                                >
                                    Email address
                                </label>
                                <div className="auth-input-wrap">
                                    <Mail
                                        className="auth-input-icon"
                                        aria-hidden="true"
                                    />
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        autoFocus
                                        autoComplete="email"
                                        placeholder="you@example.com"
                                        className={`auth-input ${errors.email ? 'auth-input-error' : ''}`}
                                        aria-invalid={!!errors.email}
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="mb-2 flex items-center justify-between">
                                    <label
                                        htmlFor="password"
                                        className="text-sm font-medium text-slate-700"
                                    >
                                        Password
                                    </label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="text-xs font-semibold text-moss-600 hover:text-moss-700"
                                        >
                                            Forgot password?
                                        </TextLink>
                                    )}
                                </div>
                                <div className="auth-input-wrap">
                                    <LockKeyhole
                                        className="auth-input-icon"
                                        aria-hidden="true"
                                    />
                                    <input
                                        id="password"
                                        name="password"
                                        type={
                                            showPassword ? 'text' : 'password'
                                        }
                                        required
                                        autoComplete="current-password"
                                        placeholder="Enter your password"
                                        className="auth-input pr-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        className="auth-password-toggle"
                                        aria-label={
                                            showPassword
                                                ? 'Hide password'
                                                : 'Show password'
                                        }
                                    >
                                        {showPassword ? (
                                            <EyeOff className="size-4" />
                                        ) : (
                                            <Eye className="size-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    value="1"
                                    aria-describedby="remember-description"
                                    className="size-5 rounded border-slate-300 data-[state=checked]:border-moss-600 data-[state=checked]:bg-moss-600"
                                />
                                <div>
                                    <label
                                        htmlFor="remember"
                                        className="cursor-pointer text-sm font-medium text-slate-700"
                                    >
                                        Keep me signed in
                                    </label>
                                    <p
                                        id="remember-description"
                                        className="mt-0.5 text-xs text-slate-500"
                                    >
                                        Use only on a private, trusted device.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={processing}
                                className="auth-primary-button"
                            >
                                {processing ? (
                                    <>
                                        <Spinner className="size-4" /> Signing
                                        in securely…
                                    </>
                                ) : (
                                    'Sign in'
                                )}
                            </button>
                        </>
                    )}
                </Form>

                {canRegister && (
                    <div className="mt-7 border-t border-slate-100 pt-6 text-center text-sm text-slate-500">
                        New to the patient portal?{' '}
                        <TextLink
                            href={register()}
                            className="font-semibold text-moss-600 hover:text-moss-700"
                        >
                            Create an account
                        </TextLink>
                    </div>
                )}
                <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-400">
                    <LockKeyhole className="size-3.5" /> Your connection is
                    encrypted and secure
                </div>
            </AuthLayout>

            <AnimatePresence>
                {showVerified && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-moss-950/25 p-5 backdrop-blur-sm"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="verified-title"
                    >
                        <motion.div
                            initial={{ scale: 0.94, y: 12 }}
                            animate={{ scale: 1, y: 0 }}
                            className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-2xl"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', delay: 0.15 }}
                                className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"
                            >
                                <CheckCircle2 className="size-8" />
                            </motion.div>
                            <h2
                                id="verified-title"
                                className="mt-5 text-2xl font-semibold text-slate-950"
                            >
                                Email verified
                            </h2>
                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                Your account is ready. You can now sign in
                                securely.
                            </p>
                            <button
                                onClick={() => setShowVerified(false)}
                                className="auth-primary-button mt-6"
                            >
                                Continue to sign in
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
