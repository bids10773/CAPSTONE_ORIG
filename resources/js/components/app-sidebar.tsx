import { Link, usePage } from '@inertiajs/react';
import {
    BarChart3,
    ChartSpline,
    Building2,
    CalendarDays,
    CalendarClock,
    ChevronDown,
    FlaskConical,
    LayoutDashboard,
    ScanLine,
    Settings,
    Stethoscope,
    UserCog,
    UsersRound,
    UserRoundSearch,
    ListOrdered,
    MessagesSquare,
    Lock,
    Unlock,
} from 'lucide-react';
import { useState } from 'react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from '@/components/ui/sidebar';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import logo from '/public/images/full_logo2-optimized.webp';

type Item = {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    children?: Array<{
        title: string;
        href: string;
        icon: React.ComponentType<{ className?: string }>;
    }>;
};

const navigation: Record<string, Item[]> = {
    admin: [
        { title: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        {
            title: 'Appointments',
            href: '/admin/appointments',
            icon: CalendarDays,
            children: [
                {
                    title: 'Appointments',
                    href: '/admin/appointments',
                    icon: CalendarDays,
                },
                {
                    title: "Today's Clinic Overview",
                    href: '/admin/todays-appointments',
                    icon: CalendarClock,
                },
                {
                    title: 'Bulk Appointment',
                    href: '/admin/bulk-appointments',
                    icon: UsersRound,
                },
            ],
        },
        {
            title: 'Management',
            href: '/admin/staff',
            icon: UserCog,
            children: [
                {
                    title: 'Staff',
                    href: '/admin/staff',
                    icon: UserCog,
                },
                {
                    title: 'Companies',
                    href: '/admin/companies',
                    icon: Building2,
                },
                {
                    title: 'Patients',
                    href: '/admin/patients',
                    icon: UserRoundSearch,
                },
                {
                    title: 'Inquiries',
                    href: '/admin/inquiries',
                    icon: MessagesSquare,
                },
                {
                    title: 'Doctor availability',
                    href: '/admin/doctor-availability',
                    icon: Stethoscope,
                },
            ],
        },
        {
            title: 'Analytics',
            href: '/admin/analytics',
            icon: BarChart3,
            children: [
                {
                    title: 'Analytics overview',
                    href: '/admin/analytics',
                    icon: BarChart3,
                },
                {
                    title: 'Disease simulation',
                    href: '/admin/forecast',
                    icon: ChartSpline,
                },
            ],
        },
        {
            title: 'Security',
            href: '/admin/security',
            icon: Lock,
        },
    ],
    doctor: [
        {
            title: 'Dashboard',
            href: '/doctor/dashboard',
            icon: LayoutDashboard,
        },
        {
            title: 'Appointments',
            href: '/doctor/appointments',
            icon: CalendarDays,
        },
        {
            title: 'Onsite Events',
            href: '/doctor/onsite-events',
            icon: Building2,
        },
        {
            title: 'Availability',
            href: '/doctor/doctor-availability',
            icon: Stethoscope,
        },
        { title: 'Settings', href: '/settings/profile', icon: Settings },
    ],
    medtech: [
        {
            title: 'Overview',
            href: '/medtech/dashboard',
            icon: LayoutDashboard,
        },
        {
            title: 'Medtech Queue',
            href: '/medtech/appointments',
            icon: FlaskConical,
        },
        {
            title: 'Onsite Events',
            href: '/medtech/onsite-events',
            icon: Building2,
        },
        { title: 'Settings', href: '/settings/profile', icon: Settings },
    ],
    radtech: [
        {
            title: 'Overview',
            href: '/radtech/dashboard',
            icon: LayoutDashboard,
        },
        {
            title: 'Radtech Queue',
            href: '/radtech/appointments',
            icon: ScanLine,
        },
        {
            title: 'Onsite Events',
            href: '/radtech/onsite-events',
            icon: Building2,
        },
        { title: 'Settings', href: '/settings/profile', icon: Settings },
    ],
    receptionist: [
        {
            title: 'Dashboard',
            href: '/receptionist/dashboard',
            icon: LayoutDashboard,
        },
        {
            title: 'Bulk Attendance',
            href: '/receptionist/onsite-events',
            icon: Building2,
        },
        {
            title: 'Queue Management',
            href: '/receptionist/queue',
            icon: ListOrdered,
        },
        {
            title: 'Appointment Requests',
            href: '/receptionist/appointment-requests',
            icon: CalendarClock,
        },
        { title: 'Profile', href: '/settings/profile', icon: Settings },
    ],
    company: [
        {
            title: 'Overview',
            href: '/company/dashboard',
            icon: LayoutDashboard,
        },
        { title: 'Employee bookings', href: '/appointments', icon: UsersRound },
        { title: 'Inquiries', href: '/my-inquiries', icon: MessagesSquare },
        { title: 'Settings', href: '/settings/profile', icon: Settings },
    ],
    patient: [
        {
            title: 'My health overview',
            href: '/dashboard',
            icon: LayoutDashboard,
        },
        { title: 'Appointments', href: '/appointments', icon: CalendarDays },
        { title: 'Inquiries', href: '/my-inquiries', icon: MessagesSquare },
        { title: 'Settings', href: '/settings/profile', icon: Settings },
    ],
};

const roleLabels: Record<string, string> = {
    admin: 'Administration',
    doctor: 'Clinical workspace',
    medtech: 'Laboratory workspace',
    radtech: 'Radiology workspace',
    receptionist: 'Front desk workspace',
    company: 'Company workspace',
    patient: 'Patient portal',
};

export function AppSidebar({ className }: { auth?: any; className?: string }) {
    const { props, url } = usePage();
    const { isMobile, isPinned, setPinned, setOpenMobile } = useSidebar();
    const role = (props.auth as any)?.user?.role || 'patient';
    const items = navigation[role] || navigation.patient;
    const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
    const home = items[0].href;
    const closeMobileSidebar = () => {
        if (isMobile) setOpenMobile(false);
    };

    return (
        <Sidebar
            collapsible="icon"
            className={`border-r border-sidebar-border bg-sidebar text-sidebar-foreground ${className || ''}`}
        >
            <SidebarHeader className="h-[72px] flex-row items-center justify-between border-b border-border px-4 group-data-[collapsible=icon]:px-3">
                <Link
                    href={home}
                    onClick={closeMobileSidebar}
                    className="flex min-w-0 items-center gap-3 rounded-xl p-1 group-data-[collapsible=icon]:mx-auto focus-visible:ring-2 focus-visible:ring-moss-500 focus-visible:outline-none"
                >
                    <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-moss-200 bg-moss-100 shadow-sm">
                        <img
                            src={logo}
                            alt="LMIC"
                            className="h-full w-full object-contain"
                        />
                    </span>
                    <span className="min-w-0 group-data-[collapsible=icon]:hidden">
                        <span className="block truncate text-sm font-bold tracking-[-.02em] text-slate-950">
                            Living Myth
                        </span>
                        <span className="block truncate text-[10px] font-semibold tracking-[.12em] text-slate-400 uppercase">
                            Industrial Clinic
                        </span>
                    </span>
                </Link>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            type="button"
                            onClick={(event) => {
                                setPinned((pinned) => !pinned);

                                if (isPinned && event.detail > 0) {
                                    event.currentTarget.blur();
                                }
                            }}
                            className="hidden size-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition group-data-[collapsible=icon]:hidden hover:bg-moss-50 hover:text-moss-700 focus-visible:ring-2 focus-visible:ring-moss-500 focus-visible:outline-none md:flex"
                            aria-label={
                                isPinned ? 'Unlock sidebar' : 'Lock sidebar'
                            }
                            aria-pressed={isPinned}
                        >
                            {isPinned ? (
                                <Unlock className="size-[18px]" />
                            ) : (
                                <Lock className="size-[18px]" />
                            )}
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        {isPinned ? 'Unlock sidebar' : 'Lock sidebar'}
                    </TooltipContent>
                </Tooltip>
            </SidebarHeader>

            <SidebarContent className="px-3 py-5 group-data-[collapsible=icon]:px-2">
                <SidebarGroup className="p-0">
                    <SidebarGroupLabel className="mb-2 px-3 text-[10px] font-bold tracking-[.16em] text-slate-400 uppercase group-data-[collapsible=icon]:hidden">
                        {roleLabels[role] || roleLabels.patient}
                    </SidebarGroupLabel>
                    <SidebarMenu className="gap-2 group-data-[collapsible=icon]:items-center">
                        {items.map((item) => {
                            const childIsActive = item.children?.some(
                                (child) =>
                                    url === child.href ||
                                    url.startsWith(`${child.href}/`),
                            );
                            const active =
                                url === item.href ||
                                (item.href !== '/dashboard' &&
                                    url.startsWith(`${item.href}/`)) ||
                                childIsActive;
                            const Icon = item.icon;

                            if (item.children) {
                                return (
                                    <Collapsible
                                        key={item.href}
                                        asChild
                                        open={hoveredMenu === item.href}
                                        onOpenChange={(open) => {
                                            if (isMobile) {
                                                setHoveredMenu(
                                                    open ? item.href : null,
                                                );
                                            }
                                        }}
                                        className="group/collapsible"
                                    >
                                        <SidebarMenuItem
                                            onMouseEnter={() =>
                                                setHoveredMenu(item.href)
                                            }
                                            onMouseLeave={() =>
                                                setHoveredMenu(null)
                                            }
                                            onFocus={() =>
                                                setHoveredMenu(item.href)
                                            }
                                            onBlur={(event) => {
                                                if (
                                                    !event.currentTarget.contains(
                                                        event.relatedTarget as Node | null,
                                                    )
                                                ) {
                                                    setHoveredMenu(null);
                                                }
                                            }}
                                        >
                                            <CollapsibleTrigger asChild>
                                                <SidebarMenuButton
                                                    tooltip={item.title}
                                                    isActive={active}
                                                    className="relative h-12 rounded-xl px-3 text-slate-500 transition-all group-data-[collapsible=icon]:size-12! group-data-[collapsible=icon]:p-1! hover:bg-transparent hover:text-moss-700 data-[active=true]:bg-transparent data-[active=true]:font-semibold data-[active=true]:text-moss-700 hover:[&_.sidebar-icon]:bg-moss-100 data-[active=true]:[&_.sidebar-icon]:bg-moss-100"
                                                >
                                                    <span className="sidebar-icon flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-100 transition-colors">
                                                        <Icon className="size-6" />
                                                    </span>
                                                    <span className="group-data-[collapsible=icon]:hidden">
                                                        {item.title}
                                                    </span>
                                                    <ChevronDown className="ml-auto size-4 transition-transform group-data-[collapsible=icon]:hidden group-data-[state=open]/collapsible:rotate-180" />
                                                </SidebarMenuButton>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent>
                                                <SidebarMenuSub className="gap-2">
                                                    {item.children.map(
                                                        (child) => {
                                                            const ChildIcon =
                                                                child.icon;
                                                            const isChildActive =
                                                                url ===
                                                                    child.href ||
                                                                url.startsWith(
                                                                    `${child.href}/`,
                                                                );

                                                            return (
                                                                <SidebarMenuSubItem
                                                                    key={
                                                                        child.href
                                                                    }
                                                                >
                                                                    <SidebarMenuSubButton
                                                                        asChild
                                                                        isActive={
                                                                            isChildActive
                                                                        }
                                                                        className="h-11 rounded-lg px-2.5 text-xs text-slate-500 hover:bg-transparent hover:text-moss-700 data-[active=true]:bg-transparent data-[active=true]:font-semibold data-[active=true]:text-moss-700 hover:[&_.sidebar-icon]:bg-moss-100 data-[active=true]:[&_.sidebar-icon]:bg-moss-100"
                                                                    >
                                                                        <Link
                                                                            href={
                                                                                child.href
                                                                            }
                                                                            onClick={
                                                                                closeMobileSidebar
                                                                            }
                                                                        >
                                                                            <span className="sidebar-icon flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 transition-colors">
                                                                                <ChildIcon className="size-5" />
                                                                            </span>
                                                                            <span>
                                                                                {
                                                                                    child.title
                                                                                }
                                                                            </span>
                                                                        </Link>
                                                                    </SidebarMenuSubButton>
                                                                </SidebarMenuSubItem>
                                                            );
                                                        },
                                                    )}
                                                </SidebarMenuSub>
                                            </CollapsibleContent>
                                        </SidebarMenuItem>
                                    </Collapsible>
                                );
                            }

                            return (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton
                                        asChild
                                        tooltip={item.title}
                                        isActive={active}
                                        className="relative h-12 rounded-xl px-3 text-slate-500 transition-all group-data-[collapsible=icon]:size-12! group-data-[collapsible=icon]:p-1! hover:bg-transparent hover:text-moss-700 data-[active=true]:bg-transparent data-[active=true]:font-semibold data-[active=true]:text-moss-700 hover:[&_.sidebar-icon]:bg-moss-100 data-[active=true]:[&_.sidebar-icon]:bg-moss-100"
                                    >
                                        <Link
                                            href={item.href}
                                            onClick={closeMobileSidebar}
                                        >
                                            <span className="sidebar-icon flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-100 transition-colors">
                                                <Icon className="size-6" />
                                            </span>
                                            <span className="group-data-[collapsible=icon]:hidden">
                                                {item.title}
                                            </span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}
