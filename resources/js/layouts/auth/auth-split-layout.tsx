import { Link, usePage } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import {
    Activity,
    BarChart3,
    CheckCircle2,
    HeartPulse,
    ShieldCheck,
    Sparkles,
} from 'lucide-react';
import type { AuthLayoutProps } from '@/types';
import logo from '/public/images/full_logo2.png';

export default function AuthSplitLayout({
    children,
    variant = 'login',
}: AuthLayoutProps) {
    const { auth } = usePage().props as any;
    const reduceMotion = useReducedMotion();
    const isRegister = variant === 'register';
    const dashboardRoute = auth?.user ? '/dashboard' : '/';

    return (
        <main className="auth-shell min-h-screen bg-background text-slate-950">
            <div className="grid min-h-screen lg:grid-cols-[44%_56%]">
                <section className="auth-visual relative hidden overflow-hidden border-r border-moss-200 bg-moss-50 lg:flex lg:flex-col">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_12%,rgba(168,195,160,.28),transparent_27%),radial-gradient(circle_at_90%_75%,rgba(107,143,113,.42),transparent_38%)]" />
                    <div className="auth-grid absolute inset-0 opacity-25" />

                    <div className="relative z-10 flex h-full flex-col px-[clamp(2.5rem,5vw,5.5rem)] py-10">
                        <Link
                            href={dashboardRoute}
                            className="inline-flex w-fit items-center gap-3 rounded-xl focus-visible:ring-4 focus-visible:ring-moss-500/20 focus-visible:outline-none"
                        >
                            <span className="flex size-11 items-center justify-center rounded-xl bg-white shadow-lg shadow-moss-950/10">
                                <img
                                    src={logo}
                                    alt="Living Myth Industrial Clinic"
                                    className="h-8 w-auto object-contain"
                                />
                            </span>
                            <span className="text-sm font-semibold tracking-wide text-moss-900">
                                LIVING MYTH
                                <span className="block text-[10px] font-medium tracking-[.18em] text-moss-600">
                                    INDUSTRIAL CLINIC
                                </span>
                            </span>
                        </Link>

                        <motion.div
                            initial={
                                reduceMotion ? false : { opacity: 0, y: 18 }
                            }
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: reduceMotion ? 0 : 0.42,
                                ease: 'easeOut',
                            }}
                            className="my-auto max-w-xl py-14"
                        >
                            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-moss-200 bg-white px-3.5 py-2 text-xs font-medium text-moss-700 shadow-sm">
                                <Sparkles className="size-3.5 text-moss-300" />
                                Connected care, clearer decisions
                            </div>
                            <h1 className="max-w-lg text-4xl leading-[1.12] font-semibold tracking-[-0.04em] text-slate-900 xl:text-5xl">
                                Healthcare operations, working in harmony.
                            </h1>
                            <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">
                                One secure workspace for medical services,
                                patient coordination, and client trend analysis.
                            </p>

                            <div className="relative mt-12 h-56 max-w-lg">
                                <motion.div
                                    animate={
                                        reduceMotion
                                            ? { y: 0 }
                                            : { y: [0, -7, 0] }
                                    }
                                    transition={{
                                        duration: 5,
                                        repeat: reduceMotion ? 0 : Infinity,
                                        ease: 'easeInOut',
                                    }}
                                    className="absolute top-4 left-0 w-[72%] rounded-2xl border border-moss-200 bg-white p-5 shadow-[0_18px_45px_-28px_rgba(69,94,74,.35)]"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-slate-500">
                                                Patient wellness trend
                                            </p>
                                            <p className="mt-1 text-2xl font-semibold text-slate-900">
                                                94.8%
                                            </p>
                                        </div>
                                        <span className="flex size-10 items-center justify-center rounded-xl bg-moss-400/20 text-moss-200">
                                            <Activity className="size-5" />
                                        </span>
                                    </div>
                                    <div className="mt-5 flex h-14 items-end gap-1.5">
                                        {[
                                            34, 48, 41, 63, 55, 74, 69, 88, 82,
                                            96,
                                        ].map((height, index) => (
                                            <span
                                                key={index}
                                                className="flex-1 rounded-t-sm bg-gradient-to-t from-moss-500 to-moss-300"
                                                style={{ height: `${height}%` }}
                                            />
                                        ))}
                                    </div>
                                </motion.div>
                                <motion.div
                                    animate={
                                        reduceMotion
                                            ? { y: 0 }
                                            : { y: [0, 7, 0] }
                                    }
                                    transition={{
                                        duration: 5.5,
                                        repeat: reduceMotion ? 0 : Infinity,
                                        ease: 'easeInOut',
                                    }}
                                    className="absolute right-0 bottom-0 w-52 rounded-2xl border border-moss-200 bg-white p-4 shadow-[0_18px_45px_-28px_rgba(69,94,74,.35)]"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="flex size-10 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                                            <CheckCircle2 className="size-5" />
                                        </span>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">
                                                Records secured
                                            </p>
                                            <p className="mt-0.5 text-[11px] text-slate-500">
                                                Protected & synchronized
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>

                        <div className="flex items-center gap-6 text-[11px] font-medium text-slate-500">
                            <span className="flex items-center gap-2">
                                <ShieldCheck className="size-4 text-moss-300" />{' '}
                                Secure access
                            </span>
                            <span className="flex items-center gap-2">
                                <HeartPulse className="size-4 text-moss-300" />{' '}
                                Patient focused
                            </span>
                            <span className="flex items-center gap-2">
                                <BarChart3 className="size-4 text-moss-300" />{' '}
                                Data informed
                            </span>
                        </div>
                    </div>
                </section>

                <section className="relative flex min-h-screen items-center justify-center overflow-y-auto px-5 py-8 sm:px-8 lg:px-12">
                    <div className="absolute top-0 right-0 size-72 translate-x-1/3 -translate-y-1/2 rounded-full bg-moss-100/60 blur-3xl" />
                    <motion.div
                        initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: reduceMotion ? 0 : 0.42,
                            delay: reduceMotion ? 0 : 0.08,
                            ease: 'easeOut',
                        }}
                        className={`relative z-10 w-full ${isRegister ? 'max-w-[720px]' : 'max-w-[480px]'}`}
                    >
                        <div className="mb-7 flex items-center justify-center gap-3 lg:hidden">
                            <span className="flex size-11 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
                                <img
                                    src={logo}
                                    alt="Living Myth Industrial Clinic"
                                    className="h-8 w-auto object-contain"
                                />
                            </span>
                            <div>
                                <p className="text-sm font-bold tracking-wide text-slate-800">
                                    LIVING MYTH
                                </p>
                                <p className="text-[9px] font-semibold tracking-[.15em] text-slate-400">
                                    INDUSTRIAL CLINIC
                                </p>
                            </div>
                        </div>
                        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_24px_70px_-30px_rgba(15,43,75,.3)] sm:p-9">
                            {children}
                        </div>
                        <p className="mt-6 text-center text-xs text-slate-400">
                            © {new Date().getFullYear()} Living Myth Industrial
                            Clinic · Privacy protected
                        </p>
                    </motion.div>
                </section>
            </div>
        </main>
    );
}
