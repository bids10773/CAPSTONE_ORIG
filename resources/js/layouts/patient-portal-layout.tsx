import { Link, usePage } from '@inertiajs/react';
import {
    CalendarDays,
    ChevronDown,
    FileHeart,
    Home,
    Menu,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { ClinicStatus } from '@/components/clinic-status';
import { LiveDateTime } from '@/components/live-date-time';
import { NotificationBell } from '@/components/notification-bell';
import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import { cn } from '@/lib/utils';
import type { AppLayoutProps } from '@/types';
import logo from '/public/images/full_logo2.png';

const links = [
    { title: 'Home', href: '/dashboard', icon: Home },
    { title: 'My appointments', href: '/appointments', icon: CalendarDays },
    {
        title: 'Medical records',
        href: '/appointments?status=completed',
        icon: FileHeart,
    },
];

export default function PatientPortalLayout({ children }: AppLayoutProps) {
    const page = usePage();
    const { auth } = page.props as any;
    const user = auth?.user;
    const [mobileOpen, setMobileOpen] = useState(false);
    const [currentPath, queryString = ''] = page.url.split('?');
    const currentStatus = new URLSearchParams(queryString).get('status');
    const isLinkActive = (href: string) => {
        if (href === '/dashboard') return currentPath === '/dashboard';
        if (href.includes('status=completed')) {
            return (
                currentPath === '/appointments' && currentStatus === 'completed'
            );
        }

        return (
            href === '/appointments' &&
            currentPath.startsWith('/appointments') &&
            currentStatus !== 'completed'
        );
    };
    const fullName =
        user?.name ||
        [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
        'Patient';
    const initials =
        [user?.first_name?.[0], user?.last_name?.[0]]
            .filter(Boolean)
            .join('')
            .toUpperCase() || 'PT';

    return (
        <div className="patient-portal min-h-screen bg-background text-foreground">
            <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-xl">
                <div className="mx-auto flex h-[72px] max-w-[1500px] items-center gap-3 px-4 sm:px-6 lg:px-8">
                    <Link
                        href="/dashboard"
                        className="flex shrink-0 items-center gap-3 rounded-xl focus-visible:ring-2 focus-visible:ring-moss-500 focus-visible:outline-none"
                        aria-label="LMIC patient portal home"
                    >
                        <span className="flex size-10 overflow-hidden rounded-xl border border-moss-200 bg-moss-100">
                            <img
                                src={logo}
                                alt="LMIC"
                                className="size-full object-contain p-1"
                            />
                        </span>
                        <span className="hidden leading-tight sm:block">
                            <strong className="block text-sm text-slate-950">
                                Living Myth
                            </strong>
                            <small className="block text-[10px] font-bold tracking-wider text-moss-700 uppercase">
                                Patient portal
                            </small>
                        </span>
                    </Link>

                    <nav
                        className="ml-5 hidden items-center gap-1 xl:flex"
                        aria-label="Patient navigation"
                    >
                        {links.map(({ title, href, icon: Icon }) => {
                            const active = isLinkActive(href);

                            return (
                                <Link
                                    key={title}
                                    href={href}
                                    aria-current={active ? 'page' : undefined}
                                    className={cn(
                                        'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-moss-500 focus-visible:ring-offset-2 focus-visible:outline-none',
                                        active
                                            ? 'bg-moss-100 text-moss-800'
                                            : 'text-slate-600 hover:bg-moss-50 hover:text-moss-800',
                                    )}
                                >
                                    <Icon className="size-4" /> {title}
                                </Link>
                            );
                        })}
                    </nav>

                    <button
                        type="button"
                        onClick={() => setMobileOpen((open) => !open)}
                        className="rounded-xl p-2 text-slate-600 hover:bg-moss-50 xl:hidden dark:text-moss-200"
                        aria-label="Toggle patient navigation"
                        aria-expanded={mobileOpen}
                    >
                        {mobileOpen ? (
                            <X className="size-5" />
                        ) : (
                            <Menu className="size-5" />
                        )}
                    </button>

                    <div className="ml-auto flex shrink-0 items-center gap-1.5">
                        {page.component !== 'dashboard' && <ClinicStatus />}
                        <LiveDateTime className="hidden lg:flex" />
                        <ThemeToggle />
                        <NotificationBell />

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className="flex shrink-0 items-center gap-2 rounded-xl p-1.5 text-left text-foreground hover:bg-moss-50 focus-visible:ring-2 focus-visible:ring-moss-500 focus-visible:outline-none data-[state=open]:bg-moss-50 dark:hover:bg-moss-900 dark:data-[state=open]:bg-moss-900"
                                    aria-label="Open patient account menu"
                                >
                                    <span className="relative shrink-0">
                                        <Avatar className="size-9">
                                            <AvatarImage
                                                src={user?.avatar}
                                                alt={fullName}
                                            />
                                            <AvatarFallback className="bg-moss-100 text-xs font-bold text-moss-800 dark:bg-moss-900 dark:text-moss-200">
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
                                    <span className="hidden max-w-32 truncate text-xs font-bold text-foreground md:block">
                                        {fullName}
                                    </span>
                                    <ChevronDown className="hidden size-4 text-slate-400 md:block dark:text-moss-300" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                sideOffset={8}
                                className="w-64 rounded-xl"
                            >
                                <UserMenuContent
                                    user={user}
                                    showProfileSettings
                                />
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {mobileOpen && (
                    <nav
                        className="border-t border-slate-100 bg-white p-3 xl:hidden"
                        aria-label="Mobile patient navigation"
                    >
                        <div className="mx-auto grid max-w-[1500px] gap-1 sm:grid-cols-3">
                            {links.map(({ title, href, icon: Icon }) => {
                                const active = isLinkActive(href);

                                return (
                                    <Link
                                        key={title}
                                        href={href}
                                        onClick={() => setMobileOpen(false)}
                                        aria-current={
                                            active ? 'page' : undefined
                                        }
                                        className={cn(
                                            'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-moss-500 focus-visible:outline-none',
                                            active
                                                ? 'bg-moss-100 text-moss-800'
                                                : 'text-slate-700 hover:bg-moss-50 hover:text-moss-800',
                                        )}
                                    >
                                        <Icon className="size-4" /> {title}
                                    </Link>
                                );
                            })}
                        </div>
                    </nav>
                )}
            </header>
            <main>{children}</main>
        </div>
    );
}
