import AppLayout from '@/layouts/app-layout';
import { 
    Users, Plus, Search, Trash2, ToggleLeft, Clock, Filter
} from 'lucide-react';
import { useState, useEffect} from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { motion, AnimatePresence } from "framer-motion";
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Staff Management', href: "/admin/staff" },
];

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
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
    created_at: string;
}

export default function StaffIndex() {
    const props = usePage().props as any;
    const { staff, filters, roles, auth } = props;
    const [search, setSearch] = useState(filters?.search || '');
    const [selectedRole, setSelectedRole] = useState(filters?.role || '');

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            router.get('/admin/staff', { 
                search: search || undefined, 
                role: selectedRole || undefined 
            }, { preserveState: true, preserveScroll: true, replace: true });
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [search, selectedRole]);


    const getRoleBadgeColor = (role: string) => {
        const colors: Record<string, string> = {
            doctor: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
            medtech: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
            radtech: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800',
            company: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
        };
        return colors[role] || 'bg-slate-50 text-slate-700 border-slate-200';
    };

    return (
        <>
            <Head title="Staff Management" />

            <motion.div 
                className="max-w-7xl mx-auto p-6 space-y-4" 
                variants={container}
                initial="hidden"
                animate="show"
            >
                {/* 1. Action Bar (Search & Filter) */}
                <motion.div variants={item} className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-gray-950 p-2 pl-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm transition-all hover:shadow-md">
                    
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by name, email, or license..." 
                            className="pl-8 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm h-10 w-full"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto pr-1">
        <div className="flex items-center gap-2 bg-gray-50/50 dark:bg-gray-900/50 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-800">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer dark:text-white dark:bg-gray-900"
            >
                <option value="" className="dark:bg-gray-900 dark:text-white text-gray-900">All Roles</option>
                {Object.entries(roles).map(([value, label]: any) => (
                    <option 
                        key={value} 
                        value={value} 
                        className="dark:bg-gray-900 dark:text-white text-gray-900"
                    >
                        {label}
                    </option>
                ))}
            </select>
        </div>

                        <Link href="/admin/staff/create" className="w-full sm:w-auto">
                            <Button className="w-full sm:w-auto h-10 px-4 gap-2 rounded-lg font-semibold shadow-sm">
                                <Plus className="w-4 h-4" /> 
                                Add Staff
                            </Button>
                        </Link>
                    </div>
                </motion.div>

                {/* 2. Symmetrical Table Section */}
                <motion.div variants={item} className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/40 dark:bg-gray-900/40 border-b border-gray-100 dark:border-gray-800">
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Personnel</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Details</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase text-muted-foreground tracking-widest text-center">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase text-muted-foreground tracking-widest text-right pr-6">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                <AnimatePresence mode='popLayout'>
                                    {staff.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-24 text-center opacity-40">
                                                <Users className="w-10 h-10 mx-auto mb-2" />
                                                <p className="text-sm font-medium">No results found.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        staff.data.map((member: StaffMember) => (
                                            <motion.tr 
                                                layout
                                                key={member.id}
                                                className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all duration-150"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs border border-indigo-100 dark:border-indigo-800 shadow-sm">
                                                            {member.first_name[0]}{member.last_name[0]}
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="font-bold text-gray-900 dark:text-white text-sm truncate">
                                                                {member.first_name} {member.last_name}
                                                            </span>
                                                            <span className="text-[12px] text-muted-foreground truncate">
                                                                {member.email}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <span className={`w-fit px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-tighter ${getRoleBadgeColor(member.role)}`}>
                                                            {roles[member.role] || member.role}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground font-medium">
                                                            {member.specialization || 'General Staff'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className={cn(
                                                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-tight uppercase border",
                                                        member.is_active 
                                                            ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-800" 
                                                            : "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-800"
                                                    )}>
                                                        <div className={cn("w-1.5 h-1.5 rounded-full", member.is_active ? "bg-green-500" : "bg-red-500")} />
                                                        {member.is_active ? 'Active' : 'Inactive'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right pr-6">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {member.role === 'doctor' && auth.user.role === 'admin' && (
                                                            <Link href={`/admin/doctor-availability?doctor_id=${member.id}`}>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:bg-blue-100/50 dark:hover:bg-blue-900/30" title="Schedule">
                                                                    <Clock className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </Link>
                                                        )}
                                                        <Link method="patch" href={`/admin/staff/${member.id}/toggle-active`}>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-500 hover:bg-amber-100/50 dark:hover:bg-amber-900/30" title="Toggle Status">
                                                                <ToggleLeft className="w-4 h-4" />
                                                            </Button>
                                                        </Link>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-8 w-8 text-red-500 hover:bg-red-100/50 dark:hover:bg-red-900/30"
                                                            onClick={() => {
                                                                if (confirm('Permanently delete this staff member?')) {
                                                                    router.delete(`/admin/staff/${member.id}`, {
                                                                        onSuccess: () => router.reload({ only: ['staff'] })
                                                                    });
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))
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