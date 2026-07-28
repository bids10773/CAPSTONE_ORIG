import { usePage } from '@inertiajs/react';
import { Bell, CalendarDays, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { AppSidebar } from '@/components/app-sidebar';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import type { AppLayoutProps } from '@/types';

export default function ClinicDashboardLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const { auth } = usePage().props as any;
    const user = auth?.user;
    const fullName =
        user?.name ||
        [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
        'Clinic user';
    const initials =
        [user?.first_name?.[0], user?.last_name?.[0]]
            .filter(Boolean)
            .join('')
            .toUpperCase() || 'LM';
    const pageTitle = breadcrumbs.at(-1)?.title || 'Workspace';
    const currentDate = new Intl.DateTimeFormat('en-PH', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    }).format(new Date());

    return (
        <SidebarProvider className="app-workspace min-h-screen bg-background">
            <AppSidebar />
            <SidebarInset className="min-w-0 bg-background">
                <header className="sticky top-0 z-30 flex h-[72px] shrink-0 items-center border-b border-border bg-white/95 px-4 backdrop-blur-xl sm:px-6">
                    <div className="flex w-full items-center gap-3">
                        <SidebarTrigger className="size-10 rounded-xl text-slate-500 hover:bg-moss-50 hover:text-moss-700" />
                        <div className="hidden min-w-0 sm:block">
                            <h1 className="truncate text-base font-semibold tracking-[-.02em] text-slate-950">
                                {pageTitle}
                            </h1>
                            <Breadcrumbs breadcrumbs={breadcrumbs} />
                        </div>

                        <div className="mx-auto hidden w-full max-w-md lg:block">
                            <label className="relative block">
                                <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="search"
                                    placeholder="Search patients, appointments, records…"
                                    aria-label="Search"
                                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pr-16 pl-10 text-sm text-slate-800 transition outline-none focus:border-moss-400 focus:bg-white focus:ring-4 focus:ring-moss-500/10"
                                />
                                <kbd className="absolute top-1/2 right-3 -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-400">
                                    Ctrl K
                                </kbd>
                            </label>
                        </div>

                        <div className="ml-auto flex items-center gap-1.5">
                            <div className="mr-1 hidden items-center gap-2 rounded-xl bg-moss-50 px-3 py-2 text-xs font-medium text-moss-700 xl:flex">
                                <CalendarDays className="size-4" />
                                <time>{currentDate}</time>
                            </div>
                            <button
                                className="topbar-icon relative"
                                aria-label="Notifications"
                            >
                                <Bell className="size-[18px]" />
                                <span className="absolute top-2 right-2.5 size-2 rounded-full border-2 border-white bg-red-500" />
                            </button>
                            <div className="ml-2 hidden items-center gap-2.5 border-l border-slate-200 pl-4 md:flex">
                                <Avatar className="size-9">
                                    <AvatarFallback className="bg-moss-100 text-xs font-bold text-moss-700">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="max-w-36">
                                    <p className="truncate text-xs font-semibold text-slate-800">
                                        {fullName}
                                    </p>
                                    <p className="truncate text-[10px] text-slate-400 capitalize">
                                        {user?.role || 'patient'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="relative flex-1">
                    <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.24 }}
                        className="mx-auto w-full max-w-[1600px]"
                    >
                        {children}
                    </motion.div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
