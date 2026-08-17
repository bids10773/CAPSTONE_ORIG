import { Link, usePage } from '@inertiajs/react';
import {
    CalendarDays,
    ChevronDown,
    FileHeart,
    Home,
    Menu,
    Plus,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { NotificationBell } from '@/components/notification-bell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
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
    const { auth } = usePage().props as any;
    const user = auth?.user;
    const [mobileOpen, setMobileOpen] = useState(false);
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
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
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
                                className="size-full object-cover"
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
                        {links.map(({ title, href, icon: Icon }) => (
                            <Link
                                key={title}
                                href={href}
                                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-moss-50 hover:text-moss-800"
                            >
                                <Icon className="size-4" /> {title}
                            </Link>
                        ))}
                    </nav>

                    <Link
                        href="/appointment"
                        className="ml-auto hidden shrink-0 items-center gap-2 rounded-xl bg-moss-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-moss-800 sm:inline-flex"
                    >
                        <Plus className="size-4" /> Book appointment
                    </Link>

                    <button
                        type="button"
                        onClick={() => setMobileOpen((open) => !open)}
                        className="ml-auto rounded-xl p-2 text-slate-600 hover:bg-moss-50 sm:ml-0 xl:hidden"
                        aria-label="Toggle patient navigation"
                        aria-expanded={mobileOpen}
                    >
                        {mobileOpen ? (
                            <X className="size-5" />
                        ) : (
                            <Menu className="size-5" />
                        )}
                    </button>

                    <NotificationBell />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className="flex shrink-0 items-center gap-2 rounded-xl p-1.5 text-left hover:bg-moss-50 focus-visible:ring-2 focus-visible:ring-moss-500 focus-visible:outline-none"
                                aria-label="Open patient account menu"
                            >
                                <Avatar className="size-9">
                                    <AvatarImage
                                        src={user?.avatar}
                                        alt={fullName}
                                    />
                                    <AvatarFallback className="bg-moss-100 text-xs font-bold text-moss-800">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="hidden max-w-32 truncate text-xs font-bold text-slate-700 md:block">
                                    {fullName}
                                </span>
                                <ChevronDown className="hidden size-4 text-slate-400 md:block" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            sideOffset={8}
                            className="w-64 rounded-xl"
                        >
                            <UserMenuContent user={user} showProfileSettings />
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {mobileOpen && (
                    <nav
                        className="border-t border-slate-100 bg-white p-3 xl:hidden"
                        aria-label="Mobile patient navigation"
                    >
                        <div className="mx-auto grid max-w-[1500px] gap-1 sm:grid-cols-3">
                            {links.map(({ title, href, icon: Icon }) => (
                                <Link
                                    key={title}
                                    href={href}
                                    onClick={() => setMobileOpen(false)}
                                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-moss-50 hover:text-moss-800"
                                >
                                    <Icon className="size-4" /> {title}
                                </Link>
                            ))}
                            <Link
                                href="/appointment"
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center gap-3 rounded-xl bg-moss-700 px-4 py-3 text-sm font-bold text-white sm:hidden"
                            >
                                <Plus className="size-4" /> Book appointment
                            </Link>
                        </div>
                    </nav>
                )}
            </header>
            <main>{children}</main>
        </div>
    );
}
