import { usePage } from '@inertiajs/react';
import { Bell, Moon, Search, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { AppSidebar } from '@/components/app-sidebar';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { useAppearance } from '@/hooks/use-appearance';
import type { AppLayoutProps } from '@/types';

export default function ClinicDashboardLayout({ children, breadcrumbs = [] }: AppLayoutProps) {
    const { auth } = usePage().props as any;
    const user = auth?.user;
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const fullName = user?.name || [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Clinic user';
    const initials = [user?.first_name?.[0], user?.last_name?.[0]].filter(Boolean).join('').toUpperCase() || 'LM';
    const pageTitle = breadcrumbs.at(-1)?.title || 'Workspace';

    return (
        <SidebarProvider className="app-workspace min-h-screen bg-slate-50">
            <AppSidebar />
            <SidebarInset className="min-w-0 bg-[#f8fafc] dark:bg-slate-950">
                <header className="sticky top-0 z-30 flex h-20 shrink-0 items-center border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90 sm:px-6">
                    <div className="flex w-full items-center gap-3">
                        <SidebarTrigger className="size-10 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-blue-600" />
                        <div className="hidden min-w-0 sm:block">
                            <h1 className="truncate text-base font-semibold tracking-[-.02em] text-slate-950 dark:text-white">{pageTitle}</h1>
                            <Breadcrumbs breadcrumbs={breadcrumbs} />
                        </div>

                        <div className="mx-auto hidden w-full max-w-md lg:block">
                            <label className="relative block">
                                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                                <input type="search" placeholder="Search patients, appointments, records…" className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-16 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white" />
                                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-400 dark:border-slate-700 dark:bg-slate-800">⌘ K</kbd>
                            </label>
                        </div>

                        <div className="ml-auto flex items-center gap-1.5">
                            <button onClick={() => updateAppearance(resolvedAppearance === 'dark' ? 'light' : 'dark')} className="topbar-icon" aria-label={`Use ${resolvedAppearance === 'dark' ? 'light' : 'dark'} mode`}>
                                {resolvedAppearance === 'dark' ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
                            </button>
                            <button className="topbar-icon relative" aria-label="Notifications">
                                <Bell className="size-[18px]" />
                                <span className="absolute right-2.5 top-2 size-2 rounded-full border-2 border-white bg-red-500 dark:border-slate-950" />
                            </button>
                            <div className="ml-2 hidden items-center gap-2.5 border-l border-slate-200 pl-4 md:flex dark:border-slate-800">
                                <Avatar className="size-9">
                                    <AvatarFallback className="bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">{initials}</AvatarFallback>
                                </Avatar>
                                <div className="max-w-36">
                                    <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">{fullName}</p>
                                    <p className="truncate text-[10px] capitalize text-slate-400">{user?.role || 'patient'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="relative flex-1">
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .3 }} className="mx-auto w-full max-w-[1600px]">
                        {children}
                    </motion.div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
