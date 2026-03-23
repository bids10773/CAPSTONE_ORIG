import AppLayout from '@/layouts/app-layout';
import { Users, Plus, Search, Edit, Trash2, ToggleLeft, UserCheck, UserX, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { motion } from "framer-motion";
import type { BreadcrumbItem} from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Staff Management',
        href: "",
    },
];

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.12
        }
    }
};

const item = {
    hidden: { opacity: 0, x: -20 },
    show: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.35 }
    }
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

interface LinkItem {
    url: string | null;
    label: string;
    active: boolean;
}

export default function StaffIndex() {
    const props = usePage().props as any;
    const { staff, filters, roles } = props;
    const [search, setSearch] = useState(filters?.search || '');
    const [selectedRole, setSelectedRole] = useState(filters?.role || '');
    useEffect(() => {
        router.get('/admin/staff', { 
            search: search || undefined, 
            role: selectedRole || undefined 
        }, {
            preserveState: true,
            preserveScroll: true
        });
    }, [search, selectedRole]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/staff', { 
            search: search || undefined, 
            role: selectedRole || undefined 
        }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'doctor':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            case 'medtech':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'radtech':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
            case 'company':
                return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    const getRoleLabel = (role: string) => {
        return roles[role] || role;
    };

    return (
        <>
            <Head title="Staff Management" />

            <motion.div
                className="space-y-6"
                variants={container}
                initial="hidden"
                animate="show"
            >



                {/* Filters */}
                <motion.div variants={item}>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
                        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">

                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                                    <input
                                        type="text"
                                        placeholder="Search by name or email..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                                        bg-white dark:bg-gray-900 
                                        text-gray-900 dark:text-white 
                                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <select
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                                bg-white dark:bg-gray-900 
                                text-gray-900 dark:text-white 
                                focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">All Roles</option>

                                {(Object.entries(roles) as [string, string][]).map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>

                        

                            <Link
                                href="/admin/staff/create"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add Staff Member
                            </Link>

                        </form>
                    </div>
                </motion.div>

                {/* Staff Table */}
                <motion.div variants={item}>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">

                        <div className="overflow-x-auto">

                            <table className="w-full">

                                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                            Name
                                        </th>

                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                            Role
                                        </th>

                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                            License No.
                                        </th>

                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                            Specialization
                                        </th>

                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                            Status
                                        </th>

                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>


                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">

                                    {staff?.data?.length === 0 ? (

                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-500" />
                                                <p>No staff members found</p>
                                            </td>
                                        </tr>

                                    ) : (

                                        staff?.data?.map((member: StaffMember) => (

                                            <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">

                                                <td className="px-6 py-4">

                                                    <div className="flex items-center">

                                                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-semibold">
                                                            {member.first_name[0]}{member.last_name[0]}
                                                        </div>

                                                        <div className="ml-4">

                                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {member.first_name} {member.last_name}
                                                            </div>

                                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                {member.email}
                                                            </div>

                                                        </div>

                                                    </div>

                                                </td>

                                                <td className="px-6 py-4">

                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                                                    {getRoleLabel(member.role)}
                                                </span>



                                                </td>

                                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {member.license_no || '-'}
                                                </td>

                                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {member.specialization || '-'}
                                                </td>

                                                <td className="px-6 py-4">

                                                    {member.is_active ? (
                                                        <span className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                                                            <UserCheck className="w-4 h-4" />
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                                                            <UserX className="w-4 h-4" />
                                                            Inactive
                                                        </span>
                                                    )}

                                                </td>


                                                <td className="px-6 py-4 text-right">

                                                    <div className="flex items-center justify-end gap-2">
                                                        {member.role === 'doctor' && props.auth.user.role === 'admin' && (
                                                            <Link
                                                                href={`/admin/doctor-availability?doctor_id=${member.id}`}
                                                                className="p-2 text-blue-400 hover:text-blue-600 transition-colors"
                                                                title="Manage Availability"
                                                            >
                                                                <Clock className="w-4 h-4" />
                                                            </Link>
                                                        )}
                                                        <Link
                                                            href={`/admin/staff/${member.id}/edit`}
                                                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Link>

                                                        <Link
                                                            method="patch"
                                                            href={`/admin/staff/${member.id}/toggle-active`}
                                                            className="p-2 text-gray-400 hover:text-yellow-500 transition-colors"
                                                        >
                                                            <ToggleLeft className="w-4 h-4" />
                                                        </Link>

                                                        <button
                                                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                                            onClick={() => {
                                                                if (confirm('Are you sure you want to delete this staff member?')) {
                                                                    router.delete(`/admin/staff/${member.id}`, {
                                                                        onSuccess: () => router.reload({ only: ['staff'] })
                                                                    });
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>

                                                    </div>

                                                </td>

                                            </tr>

                                        ))

                                    )}

                                </tbody>

                            </table>

                        </div>

                    </div>
                </motion.div>

            </motion.div>
        </>
    );
}

StaffIndex.layout = (page: any) => {
    return <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
};