import { Link, usePage } from '@inertiajs/react';
import {
    BarChart3, Building2, CalendarDays, ClipboardList, FlaskConical, LayoutDashboard,
    ScanLine, Settings, Stethoscope, UserCog, UsersRound,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel,
    SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from '@/components/ui/sidebar';
import logo from '/public/images/full_logo.png';

type Item = { title: string; href: string; icon: React.ComponentType<{ className?: string }> };

const navigation: Record<string, Item[]> = {
    admin: [
        { title: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard },
        { title: 'Appointments', href: '/admin/appointments', icon: CalendarDays },
        { title: 'Staff', href: '/admin/staff', icon: UserCog },
        { title: 'Companies', href: '/admin/companies', icon: Building2 },
        { title: 'Doctor availability', href: '/admin/doctor-availability', icon: Stethoscope },
        { title: 'Trend analytics', href: '/admin/analytics', icon: BarChart3 },
        { title: 'Reports', href: '/admin/reports', icon: ClipboardList },
        { title: 'Settings', href: '/settings/profile', icon: Settings },
    ],
    doctor: [
        { title: 'Overview', href: '/doctor/dashboard', icon: LayoutDashboard },
        { title: 'Appointments', href: '/doctor/appointments', icon: CalendarDays },
        { title: 'Availability', href: '/doctor/availability', icon: Stethoscope },
        { title: 'Settings', href: '/settings/profile', icon: Settings },
    ],
    medtech: [
        { title: 'Overview', href: '/medtech/dashboard', icon: LayoutDashboard },
        { title: 'Laboratory queue', href: '/medtech/appointments', icon: FlaskConical },
        { title: 'Settings', href: '/settings/profile', icon: Settings },
    ],
    radtech: [
        { title: 'Overview', href: '/radtech/dashboard', icon: LayoutDashboard },
        { title: 'Imaging queue', href: '/radtech/appointments', icon: ScanLine },
        { title: 'Settings', href: '/settings/profile', icon: Settings },
    ],
    receptionist: [
        { title: 'Overview', href: '/receptionist/dashboard', icon: LayoutDashboard },
        { title: 'Appointments', href: '/staff/appointments', icon: CalendarDays },
        { title: 'Settings', href: '/settings/profile', icon: Settings },
    ],
    company: [
        { title: 'Overview', href: '/company/dashboard', icon: LayoutDashboard },
        { title: 'Employee bookings', href: '/appointments', icon: UsersRound },
        { title: 'Settings', href: '/settings/profile', icon: Settings },
    ],
    patient: [
        { title: 'My health overview', href: '/dashboard', icon: LayoutDashboard },
        { title: 'Appointments', href: '/appointments', icon: CalendarDays },
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
    const role = (props.auth as any)?.user?.role || 'patient';
    const items = navigation[role] || navigation.patient;
    const home = items[0].href;

    return (
        <Sidebar collapsible="icon" className={`border-r border-slate-200 bg-white text-slate-700 ${className || ''}`}>
            <SidebarHeader className="h-20 justify-center border-b border-slate-100 px-4">
                <Link href={home} className="flex items-center gap-3 rounded-xl p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 shadow-lg shadow-blue-600/20">
                        <img src={logo} alt="" className="h-7 w-auto brightness-0 invert" />
                    </span>
                    <span className="min-w-0 group-data-[collapsible=icon]:hidden">
                        <span className="block truncate text-sm font-bold tracking-[-.02em] text-slate-950">Living Myth</span>
                        <span className="block truncate text-[10px] font-semibold uppercase tracking-[.12em] text-slate-400">Industrial Clinic</span>
                    </span>
                </Link>
            </SidebarHeader>

            <SidebarContent className="px-3 py-5 group-data-[collapsible=icon]:px-2">
                <SidebarGroup className="p-0">
                    <SidebarGroupLabel className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.16em] text-slate-400 group-data-[collapsible=icon]:hidden">
                        {roleLabels[role] || roleLabels.patient}
                    </SidebarGroupLabel>
                    <SidebarMenu className="gap-1">
                        {items.map((item) => {
                            const active = url === item.href || (item.href !== '/dashboard' && url.startsWith(`${item.href}/`));
                            const Icon = item.icon;
                            return (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton asChild tooltip={item.title} isActive={active} className="relative h-11 rounded-xl px-3 text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-950 data-[active=true]:bg-blue-50 data-[active=true]:font-semibold data-[active=true]:text-blue-700">
                                        <Link href={item.href}>
                                            {active && <motion.span layoutId="navigation-marker" className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-blue-600" />}
                                            <Icon className="size-[18px] shrink-0" />
                                            <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t border-slate-100 p-3">
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
