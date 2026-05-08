import { Link } from '@inertiajs/react';
import type { AuthLayoutProps } from '@/types';
import logo from '/public/images/full_logo.png';
import bgImage from '/public/images/bglogin.jpg'; // ← your existing bg image
import { motion, AnimatePresence } from 'framer-motion';
import { usePage } from '@inertiajs/react';

export default function AuthSplitLayout({ children, title, description, variant = 'login' }: AuthLayoutProps) {

    const { auth } = usePage().props as any;
    const user = auth?.user;
    const roleDashboardMap: Record<string, string> = {
        admin: '/admin/dashboard',
        doctor: '/doctor/dashboard',
        medtech: '/medtech/dashboard',
        radtech: '/radtech/dashboard',
    };
    const dashboardRoute = user?.role ? (roleDashboardMap[user.role] || '/dashboard') : '/dashboard';
    const isRegister = variant === 'register';

    return (
        // ↓ background image + dark overlay on the page
        <div
            className="relative flex items-center justify-center min-h-screen bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${bgImage})` }}
        >
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/50" />

            {/* Card container — sits above overlay */}
            <div className="relative z-10 flex w-full lg:max-w-[780px] lg:rounded-2xl lg:shadow-2xl overflow-hidden">

                {/* LEFT PANEL */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="hidden lg:flex flex-col items-center justify-center gap-4 p-8 text-white"
                    style={{ background: '#2E7D32', width: '32%', minHeight: '100%' }}
                >
                    <Link href={dashboardRoute}>
                        <motion.img
                            src={logo}
                            alt="Logo"
                            className="h-14 w-auto object-contain mb-1"
                            whileHover={{ scale: 1.05 }}
                        />
                    </Link>

                    <AnimatePresence mode="wait">
                        {isRegister ? (
                            <motion.div
                                key="register"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -16 }}
                                transition={{ duration: 0.35 }}
                                className="flex flex-col items-center gap-3 text-center"
                            >
                                <h2 className="text-xl font-bold text-white">Create an Account</h2>
                                <p className="text-xs text-white/80">Join Living Myth Industrial Clinic today</p>
                                <Link
                                    href="/login"
                                    className="border-2 border-white text-white rounded-full px-7 py-2 text-xs font-semibold hover:bg-white/15 transition-all"
                                >
                                    Sign In
                                </Link>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="login"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -16 }}
                                transition={{ duration: 0.35 }}
                                className="flex flex-col items-center gap-3 text-center"
                            >
                                <h2 className="text-xl font-bold text-white">Hello, Welcome</h2>
                                <p className="text-xs text-white/80">Don't have an account?</p>
                                <Link
                                    href="/register"
                                    className="border-2 border-white text-white rounded-full px-7 py-2 text-xs font-semibold hover:bg-white/15 transition-all"
                                >
                                    Register
                                </Link>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* RIGHT PANEL */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="flex flex-col flex-1 bg-white overflow-y-auto"
                    style={{ color: '#111827' }}
                >
                    <div className="flex flex-col items-center justify-center min-h-full px-8 py-7">

                        {/* Mobile logo */}
                        <Link href={dashboardRoute} className="flex items-center justify-center lg:hidden mb-4">
                            <img src={logo} alt="Logo" className="h-10 w-auto" />
                        </Link>

                        {title && (
                            <h1 className="text-2xl font-bold mb-1" style={{ color: '#111827' }}>{title}</h1>
                        )}
                        {description && (
                            <p className="text-xs mb-4" style={{ color: '#6b7280' }}>{description}</p>
                        )}

                        <div className="w-full [&_label]:text-gray-700 [&_input]:text-gray-900 [&_input]:bg-gray-50 [&_input::placeholder]:text-gray-400 [&_input]:border-gray-200 [&_a]:text-[#0097A7] [&_.text-muted-foreground]:text-gray-500 [&_p]:text-gray-600 [&_span.text-muted-foreground]:text-gray-500">
                            {children}
                        </div>

                        <div className="w-full [&_label]:text-gray-700 [&_input]:text-gray-900 [&_input]:bg-gray-50 [&_input::placeholder]:text-gray-400 [&_input]:border-gray-200 [&_a]:text-[#0097A7] [&_.text-muted-foreground]:text-gray-500 [&_p]:text-gray-600 [&_span.text-muted-foreground]:text-gray-500 [&_button[role=checkbox]]:border-gray-400 [&_button[role=checkbox]]:border-2"></div>
                    </div>
                </motion.div>

            </div>
        </div>
    );
}