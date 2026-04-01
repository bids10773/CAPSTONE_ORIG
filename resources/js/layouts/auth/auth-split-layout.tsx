import { Link } from '@inertiajs/react';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';
import bgImage from '/public/images/bglogin.jpg';
import logo from '/public/images/full_logo.png';
import { motion } from 'framer-motion'; // [1] Import Framer Motion\
import { usePage } from '@inertiajs/react';


export default function AuthSplitLayout({ children, title, description }: AuthLayoutProps) {
    
const { auth } = usePage().props as any;
const user = auth?.user;
const roleDashboardMap: Record<string, string> = {
    admin: '/admin/dashboard',
    doctor: '/doctor/dashboard',
    medtech: '/medtech/dashboard',
    radtech: '/radtech/dashboard',
};

 const dashboardRoute = user?.role ? (roleDashboardMap[user.role] || '/dashboard') : '/dashboard';
    return (
        <div 
            className="relative h-dvh grid grid-cols-1 lg:grid-cols-2 bg-cover bg-center bg-no-repeat overflow-hidden dark:bg-[#0a0f1a]"
            style={{ backgroundImage: `url(${bgImage})` }} 
        >
            <div className="absolute inset-0 bg-black/40 dark:bg-black/60 z-0" />

            {/* LEFT PANEL */}
<motion.div 
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 0.9, x: 0 }} // Slight opacity for a modern feel
    transition={{ duration: 0.8, ease: "easeOut" }}
    className="relative z-10 hidden lg:flex flex-col justify-center items-center p-10 text-white"
>
    {/* TOP TEXT: Single Line */}
    <h1 className="text-3xl xl:text-5xl font-bold tracking-tight whitespace-nowrap mb-6 text-center">
        WELCOME BACK TO
    </h1>

    {/* LOGO & CLINIC NAME COMBO */}
    <Link href={dashboardRoute} className="flex flex-col items-center gap-4 mb-10 group">
        <motion.img 
            src={logo} 
            alt="LMC Logo" 
            className="h-32 xl:h-40 w-auto object-contain" 
            whileHover={{ scale: 1.05 }}
        />
        
        {/* BOTTOM TEXT: Bold Clinic Name */}
        <div className="text-center">
            <h2 className="text-2xl xl:text-3xl font-extrabold tracking-widest uppercase">
                LIVING MYTH
            </h2>
            <p className="text-sm xl:text-base font-semibold tracking-[0.3em] opacity-80 uppercase mt-1">
                INDUSTRIAL CLINIC
            </p>
        </div>
    </Link>

    {/* TAGLINE */}
    <div className="flex flex-col gap-3 text-center border-t border-white/20 pt-6">
        <p className="max-w-xs text-lg xl:text-xl opacity-90 font-light italic">
            Your trusted partner in health care
        </p>
    </div>
</motion.div>



           {/* RIGHT PANEL */}
<div className="relative z-10 flex items-center justify-center p-4 lg:p-8 overflow-y-auto h-full"> 
    <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        /* Added 'my-auto' to keep it centered when small, and 'max-h-[90vh]' to ensure it stays within view */
        className="mx-auto my-auto flex w-full flex-col justify-center space-y-6 bg-[#246AFE]/40 backdrop-blur-xl p-8 lg:p-10 rounded-[2.5rem] border border-white/20 sm:w-[500px] shadow-2xl"
    >
       
                    {/* Mobile logo */}
                    <Link href={dashboardRoute} className="flex items-center justify-center lg:hidden mb-4">
    <img src={logo} alt="LMC Logo" className="h-12 w-auto" />
</Link>

                    {/* Page title & description */}
                    <div className="flex flex-col items-start gap-2 text-left sm:items-center sm:text-center text-white">
                        <motion.h1 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-2xl font-bold"
                        >
                            {title}
                        </motion.h1>
                        <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-sm opacity-90"
                        >
                            {description}
                        </motion.p>
                    </div>

                    {/* Auth form content */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-white"
                    >
                        {children}
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
