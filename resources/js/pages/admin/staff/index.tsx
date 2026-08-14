import { Head, Link, usePage, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Plus,
    Search,
    ToggleLeft,
    Clock,
    Filter,
    RefreshCw,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Staff Management', href: '/admin/staff' },
];

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
};

interface StaffMember {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    license_no: string | null;
    specialization: string | null;
    is_active: boolean;
    must_change_password: boolean;
    created_at: string;
}

export default function StaffIndex() {
    const props = usePage().props as any;
    const { staff, filters, roles, auth } = props;
    const [search, setSearch] = useState(filters?.search || '');
    const [selectedRole, setSelectedRole] = useState(filters?.role || '');
    const [selectedStatus, setSelectedStatus] = useState(filters?.status || '');

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            router.get(
                '/admin/staff',
                {
                    search: search || undefined,
                    role: selectedRole || undefined,
                    status: selectedStatus || undefined,
                    per_page: staff.per_page,
                },
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [search, selectedRole, selectedStatus, staff.per_page]);

    const getRoleBadgeColor = (role: string) => {
        const colors: Record<string, string> = {
            doctor: 'bg-moss-50 text-moss-700 border-moss-200',
            medtech: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            radtech: 'bg-purple-50 text-purple-700 border-purple-200',
            company: 'bg-amber-50 text-amber-700 border-amber-200',
        };
        return colors[role] || 'bg-slate-50 text-slate-700 border-slate-200';
    };

    return (
        <>
            <Head title="Staff Management" />

            <motion.div
                className="mx-auto max-w-7xl space-y-4 p-6"
                variants={container}
                initial="hidden"
                animate="show"
            >
                {/* 1. Action Bar (Search & Filter) */}
                <motion.div
                    variants={item}
                    className="flex flex-col items-center gap-3 rounded-xl border border-gray-200 bg-white p-2 pl-4 shadow-sm transition-all hover:shadow-md sm:flex-row"
                >
                    <div className="relative w-full flex-1">
                        <Search className="absolute top-1/2 left-0 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, email, or license..."
                            className="h-10 w-full border-none bg-transparent pl-8 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex w-full items-center gap-3 pr-1 sm:w-auto">
                        <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-1.5">
                            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                            <select
                                value={selectedRole}
                                onChange={(e) =>
                                    setSelectedRole(e.target.value)
                                }
                                className="cursor-pointer bg-transparent text-sm font-medium focus:outline-none"
                            >
                                <option value="" className="text-gray-900">
                                    All Roles
                                </option>
                                {Object.entries(roles).map(
                                    ([value, label]: any) => (
                                        <option
                                            key={value}
                                            value={value}
                                            className="text-gray-900"
                                        >
                                            {label}
                                        </option>
                                    ),
                                )}
                            </select>
                        </div>
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium"
                        >
                            <option value="">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>

                        <Link
                            href="/admin/staff/create"
                            className="w-full sm:w-auto"
                        >
                            <Button className="h-10 w-full gap-2 rounded-lg px-4 font-semibold shadow-sm sm:w-auto">
                                <Plus className="h-4 w-4" />
                                Add Staff
                            </Button>
                        </Link>
                    </div>
                    <Pagination pagination={staff} label="staff members" />
                </motion.div>

                {/* 2. Symmetrical Table Section */}
                <motion.div
                    variants={item}
                    className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/40">
                                    <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                                        Personnel
                                    </th>
                                    <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                                        Details
                                    </th>
                                    <th className="px-6 py-4 text-center text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 pr-6 text-right text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                <AnimatePresence mode="popLayout">
                                    {staff.data.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="px-6 py-24 text-center opacity-40"
                                            >
                                                <Users className="mx-auto mb-2 h-10 w-10" />
                                                <p className="text-sm font-medium">
                                                    No results found.
                                                </p>
                                            </td>
                                        </tr>
                                    ) : (
                                        staff.data.map(
                                            (member: StaffMember) => (
                                                <motion.tr
                                                    layout
                                                    key={member.id}
                                                    className="transition-all duration-150 hover:bg-slate-50/50"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50 text-xs font-bold text-indigo-600 shadow-sm">
                                                                {
                                                                    member
                                                                        .first_name[0]
                                                                }
                                                                {
                                                                    member
                                                                        .last_name[0]
                                                                }
                                                            </div>
                                                            <div className="flex min-w-0 flex-col">
                                                                <span className="truncate text-sm font-bold text-gray-900">
                                                                    {
                                                                        member.first_name
                                                                    }{' '}
                                                                    {
                                                                        member.last_name
                                                                    }
                                                                </span>
                                                                <span className="truncate text-[12px] text-muted-foreground">
                                                                    {
                                                                        member.email
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1">
                                                            <span
                                                                className={`w-fit rounded border px-2 py-0.5 text-[9px] font-bold tracking-tighter uppercase ${getRoleBadgeColor(member.role)}`}
                                                            >
                                                                {roles[
                                                                    member.role
                                                                ] ||
                                                                    member.role}
                                                            </span>
                                                            <span className="text-xs font-medium text-muted-foreground">
                                                                {member.specialization ||
                                                                    'General Staff'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div
                                                            className={cn(
                                                                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-tight uppercase',
                                                                member.is_active
                                                                    ? 'border-green-200 bg-green-50 text-green-700'
                                                                    : 'border-red-200 bg-red-50 text-red-700',
                                                            )}
                                                        >
                                                            <div
                                                                className={cn(
                                                                    'h-1.5 w-1.5 rounded-full',
                                                                    member.is_active
                                                                        ? 'bg-green-500'
                                                                        : 'bg-red-500',
                                                                )}
                                                            />
                                                            {member.is_active
                                                                ? 'Active'
                                                                : 'Inactive'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 pr-6 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            {member.role ===
                                                                'doctor' &&
                                                                auth.user
                                                                    .role ===
                                                                    'admin' && (
                                                                    <Link
                                                                        href={`/admin/doctor-availability?doctor_id=${member.id}`}
                                                                    >
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8 text-moss-500 hover:bg-moss-100/50"
                                                                            title="Schedule"
                                                                        >
                                                                            <Clock className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    </Link>
                                                                )}
                                                            {member.must_change_password && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-moss-600 hover:bg-moss-100/50"
                                                                    title="Resend temporary credentials"
                                                                    onClick={() => {
                                                                        if (
                                                                            confirm(
                                                                                'Generate and email a new temporary password? The previous temporary password will stop working.',
                                                                            )
                                                                        ) {
                                                                            router.post(
                                                                                `/admin/staff/${member.id}/resend-credentials`,
                                                                            );
                                                                        }
                                                                    }}
                                                                >
                                                                    <RefreshCw className="h-3.5 w-3.5" />
                                                                </Button>
                                                            )}
                                                            <Button
                                                                asChild
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-amber-500 hover:bg-amber-100/50"
                                                                title="Toggle Status"
                                                            >
                                                                <Link
                                                                    method="patch"
                                                                    href={`/admin/staff/${member.id}/toggle-active`}
                                                                >
                                                                    <ToggleLeft className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ),
                                        )
                                    )}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </motion.div>
        </>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}

StaffIndex.layout = (page: any) => {
    return <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
};
