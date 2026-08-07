import { usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Bell, CalendarDays, ChevronDown } from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { GlobalSearch } from '@/components/global-search';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import { UserMenuContent } from '@/components/user-menu-content';
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
                            <Breadcrumbs breadcrumbs={breadcrumbs} />
                        </div>

                        <GlobalSearch />

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
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        data-test="navbar-user-menu-button"
                                        aria-label="Open account menu"
                                        className="ml-1 flex items-center gap-2 rounded-xl border-l border-slate-200 py-1 pr-1 pl-3 text-left transition outline-none hover:bg-moss-50 focus-visible:ring-4 focus-visible:ring-moss-500/15 sm:ml-2 sm:pl-4"
                                    >
                                        <Avatar className="size-9">
                                            <AvatarImage
                                                src={user?.avatar}
                                                alt={fullName}
                                            />
                                            <AvatarFallback className="bg-moss-100 text-xs font-bold text-moss-700">
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="hidden max-w-36 md:block">
                                            <p className="truncate text-xs font-semibold text-slate-800">
                                                {fullName}
                                            </p>
                                            <p className="truncate text-[10px] text-slate-400 capitalize">
                                                {user?.role || 'patient'}
                                            </p>
                                        </div>
                                        <ChevronDown className="hidden size-4 text-slate-400 md:block" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    className="w-64 rounded-xl"
                                    align="end"
                                    sideOffset={8}
                                >
                                    <UserMenuContent user={user} />
                                </DropdownMenuContent>
                            </DropdownMenu>
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
