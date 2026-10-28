import { usePage } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { GlobalSearch } from '@/components/global-search';
import { LiveDateTime } from '@/components/live-date-time';
import { PageTransition } from '@/components/motion';
import { NotificationBell } from '@/components/notification-bell';
import { ThemeToggle } from '@/components/theme-toggle';
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
    const { auth, sidebarPinned } = usePage().props as any;
    const user = auth?.user;
    const showStaffSettings = [
        'doctor',
        'medtech',
        'radtech',
        'receptionist',
    ].includes(user?.role);
    const fullName =
        user?.name ||
        [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
        'Clinic user';
    const initials =
        [user?.first_name?.[0], user?.last_name?.[0]]
            .filter(Boolean)
            .join('')
            .toUpperCase() || 'LM';
    return (
        <SidebarProvider
            defaultPinned={Boolean(sidebarPinned)}
            className="app-workspace min-h-screen bg-background"
        >
            <a
                href="#main-content"
                className="fixed top-4 left-4 z-[200] -translate-y-24 rounded-xl bg-card px-4 py-3 text-sm font-semibold text-moss-800 shadow-lg transition-transform focus:translate-y-0 focus-visible:ring-4 focus-visible:ring-moss-500/20 focus-visible:outline-none dark:text-moss-200"
            >
                Skip to content
            </a>
            <AppSidebar />
            <SidebarInset className="min-w-0 bg-background">
                <header className="sticky top-0 z-30 flex h-[72px] shrink-0 items-center border-b border-border bg-card/95 px-4 backdrop-blur-xl sm:px-6">
                    <div className="flex w-full items-center gap-3">
                        <SidebarTrigger className="size-10 rounded-xl text-slate-500 hover:bg-moss-50 hover:text-moss-700 focus-visible:ring-2 focus-visible:ring-moss-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-card md:hidden" />
                        <div className="hidden max-w-[45%] min-w-0 shrink-0 sm:block lg:max-w-[30%]">
                            <Breadcrumbs breadcrumbs={breadcrumbs} />
                        </div>

                        <GlobalSearch />

                        <div className="ml-auto flex shrink-0 items-center gap-1.5">
                            <LiveDateTime className="mr-1 hidden lg:flex" />
                            <ThemeToggle />
                            <NotificationBell />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        data-test="navbar-user-menu-button"
                                        aria-label="Open account menu"
                                        className="ml-1 flex touch-manipulation items-center gap-2 rounded-xl border-l border-slate-200 py-1 pr-1 pl-3 text-left transition-[background-color,color,box-shadow,transform] hover:bg-moss-50 focus-visible:ring-2 focus-visible:ring-moss-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-card focus-visible:outline-none active:scale-[0.98] active:bg-moss-100 data-[state=open]:bg-moss-50 data-[state=open]:text-moss-800 motion-reduce:transition-none sm:ml-2 sm:pl-4 dark:hover:bg-moss-900 dark:active:bg-moss-900 dark:data-[state=open]:bg-moss-900 dark:data-[state=open]:text-moss-200"
                                    >
                                        <span className="relative shrink-0">
                                            <Avatar className="size-9">
                                                <AvatarImage
                                                    src={user?.avatar}
                                                    alt={fullName}
                                                />
                                                <AvatarFallback className="bg-moss-100 text-xs font-bold text-moss-700">
                                                    {initials}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span
                                                className="absolute right-0 bottom-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-card"
                                                role="status"
                                                aria-label="Online"
                                                title="Online"
                                            />
                                        </span>
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
                                    <UserMenuContent
                                        user={user}
                                        showProfileSettings={showStaffSettings}
                                    />
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </header>

                <div
                    id="main-content"
                    tabIndex={-1}
                    className="relative flex-1 focus:outline-none"
                >
                    <PageTransition className="mx-auto w-full max-w-[1600px]">
                        {children}
                    </PageTransition>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
