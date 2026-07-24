import { Link, usePage } from '@inertiajs/react';
import { Activity, BarChart3, CheckCircle2, HeartPulse, ShieldCheck, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import type { AuthLayoutProps } from '@/types';
import logo from '/public/images/full_logo.png';

export default function AuthSplitLayout({
    children,
    variant = 'login',
}: AuthLayoutProps) {
    const { auth } = usePage().props as any;
    const isRegister = variant === 'register';
    const dashboardRoute = auth?.user ? '/dashboard' : '/';

    return (
        <main className="auth-shell min-h-screen bg-[#f7f9fc] text-slate-950">
            <div className="grid min-h-screen lg:grid-cols-[44%_56%]">
                <section className="auth-visual relative hidden overflow-hidden bg-[#0b2d4f] lg:flex lg:flex-col">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_12%,rgba(20,184,166,.28),transparent_27%),radial-gradient(circle_at_90%_75%,rgba(37,99,235,.42),transparent_38%)]" />
                    <div className="auth-grid absolute inset-0 opacity-25" />

                    <div className="relative z-10 flex h-full flex-col px-[clamp(2.5rem,5vw,5.5rem)] py-10">
                        <Link
                            href={dashboardRoute}
                            className="inline-flex w-fit items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
                        >
                            <span className="flex size-11 items-center justify-center rounded-xl bg-white shadow-lg shadow-slate-950/20">
                                <img src={logo} alt="Living Myth Industrial Clinic" className="h-8 w-auto object-contain" />
                            </span>
                            <span className="text-sm font-semibold tracking-wide text-white">
                                LIVING MYTH
                                <span className="block text-[10px] font-medium tracking-[.18em] text-cyan-100/75">INDUSTRIAL CLINIC</span>
                            </span>
                        </Link>

                        <motion.div
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.65, ease: 'easeOut' }}
                            className="my-auto max-w-xl py-14"
                        >
                            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-medium text-cyan-50 backdrop-blur">
                                <Sparkles className="size-3.5 text-teal-300" />
                                Connected care, clearer decisions
                            </div>
                            <h1 className="max-w-lg text-4xl font-semibold leading-[1.12] tracking-[-0.04em] text-white xl:text-5xl">
                                Healthcare operations, working in harmony.
                            </h1>
                            <p className="mt-5 max-w-lg text-base leading-7 text-blue-100/75">
                                One secure workspace for medical services, patient coordination, and client trend analysis.
                            </p>

                            <div className="relative mt-12 h-56 max-w-lg">
                                <motion.div
                                    animate={{ y: [0, -7, 0] }}
                                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                                    className="absolute left-0 top-4 w-[72%] rounded-2xl border border-white/15 bg-white/[.11] p-5 shadow-2xl backdrop-blur-xl"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-blue-100/65">Patient wellness trend</p>
                                            <p className="mt-1 text-2xl font-semibold text-white">94.8%</p>
                                        </div>
                                        <span className="flex size-10 items-center justify-center rounded-xl bg-teal-400/20 text-teal-200">
                                            <Activity className="size-5" />
                                        </span>
                                    </div>
                                    <div className="mt-5 flex h-14 items-end gap-1.5">
                                        {[34, 48, 41, 63, 55, 74, 69, 88, 82, 96].map((height, index) => (
                                            <span key={index} className="flex-1 rounded-t-sm bg-gradient-to-t from-blue-500 to-teal-300" style={{ height: `${height}%` }} />
                                        ))}
                                    </div>
                                </motion.div>
                                <motion.div
                                    animate={{ y: [0, 7, 0] }}
                                    transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
                                    className="absolute bottom-0 right-0 w-52 rounded-2xl border border-white/15 bg-[#153f65]/90 p-4 shadow-2xl backdrop-blur-xl"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="flex size-10 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                                            <CheckCircle2 className="size-5" />
                                        </span>
                                        <div>
                                            <p className="text-sm font-semibold text-white">Records secured</p>
                                            <p className="mt-0.5 text-[11px] text-blue-100/60">Protected & synchronized</p>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>

                        <div className="flex items-center gap-6 text-[11px] font-medium text-blue-100/60">
                            <span className="flex items-center gap-2"><ShieldCheck className="size-4 text-teal-300" /> Secure access</span>
                            <span className="flex items-center gap-2"><HeartPulse className="size-4 text-teal-300" /> Patient focused</span>
                            <span className="flex items-center gap-2"><BarChart3 className="size-4 text-teal-300" /> Data informed</span>
                        </div>
                    </div>
                </section>

                <section className="relative flex min-h-screen items-center justify-center overflow-y-auto px-5 py-8 sm:px-8 lg:px-12">
                    <div className="absolute right-0 top-0 size-72 -translate-y-1/2 translate-x-1/3 rounded-full bg-blue-100/60 blur-3xl" />
                    <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.08, ease: 'easeOut' }}
                        className={`relative z-10 w-full ${isRegister ? 'max-w-[720px]' : 'max-w-[480px]'}`}
                    >
                        <div className="mb-7 flex items-center justify-center gap-3 lg:hidden">
                            <span className="flex size-11 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
                                <img src={logo} alt="Living Myth Industrial Clinic" className="h-8 w-auto object-contain" />
                            </span>
                            <div>
                                <p className="text-sm font-bold tracking-wide text-slate-800">LIVING MYTH</p>
                                <p className="text-[9px] font-semibold tracking-[.15em] text-slate-400">INDUSTRIAL CLINIC</p>
                            </div>
                        </div>
                        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_24px_70px_-30px_rgba(15,43,75,.3)] sm:p-9">
                            {children}
                        </div>
                        <p className="mt-6 text-center text-xs text-slate-400">
                            © {new Date().getFullYear()} Living Myth Industrial Clinic · Privacy protected
                        </p>
                    </motion.div>
                </section>
            </div>
        </main>
    );
}
