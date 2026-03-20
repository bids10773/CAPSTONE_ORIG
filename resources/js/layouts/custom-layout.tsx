import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Breadcrumbs } from '@/components/breadcrumbs';
import type { AppLayoutProps } from '@/types';
import { motion } from 'framer-motion';

export default function ClinicDashboardLayout({ children, breadcrumbs = [] }: AppLayoutProps) {
    return (
        <SidebarProvider className="bg-white dark:bg-neutral-900 min-h-screen">
            
            {/* SIDEBAR */}
            <AppSidebar className="border-r border-blue-100 dark:border-blue-900/50 bg-transparent dark:bg-neutral-900" />

            {/* RIGHT CONTENT */}
            <SidebarInset className="relative flex flex-col bg-[#F0F7FF] dark:bg-[#0a0f1a]">
                
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#246AFE]/5 dark:bg-[#246AFE]/10 blur-[100px] pointer-events-none" />

                {/* HEADER (Reduced height slightly) */}
                <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 px-6">
                    <div className="flex w-full items-center gap-2 rounded-2xl border border-white/60 dark:border-white/10 bg-white/40 dark:bg-white/5 px-4 py-2 shadow-sm backdrop-blur-md">
                        <SidebarTrigger className="-ml-1 text-[#246AFE] dark:text-blue-400" />
                        <div className="h-4 w-px bg-blue-100 dark:bg-blue-800 mx-2" />
                        <Breadcrumbs breadcrumbs={breadcrumbs} />
                    </div>
                </header>

                {/* MAIN CONTENT (FIXED SPACING HERE) */}
                <motion.main 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex-1 lg:px-10"
                >
                    <div className="mx-auto w-full max-w-7xl">
                        {children}
                    </div>
                </motion.main>

            </SidebarInset>
        </SidebarProvider>
    );
}