import { Head, usePage } from '@inertiajs/react';
import {
    Calendar,
    Activity,
    TrendingUp,
    Users,
    Building2,
    Stethoscope,
    FlaskConical,
    Scan,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';

interface Props {
    monthlyTrends: { month: string; count: number }[];
    serviceTypeBreakdown: Record<string, number>;
    companyAppointments: { company_name: string; count: number }[];
    statusTrends: Record<string, number>;
    todayAppointments: number;
    staffByRole: Record<string, number>;
}

export default function AdminAnalytics() {
    const props = usePage().props as unknown as Props;
    const {
        monthlyTrends,
        serviceTypeBreakdown,
        companyAppointments,
        statusTrends,
        todayAppointments,
        staffByRole,
    } = props;

    // Calculate totals
    const totalAppointments = Object.values(monthlyTrends || {}).reduce(
        (sum: number, item: any) => sum + (item?.count || 0),
        0,
    );
    const totalServices = Object.values(serviceTypeBreakdown || {}).reduce(
        (sum: number, count) => sum + Number(count),
        0,
    );

    return (
        <>
            <Head title="Analytics - Admin" />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                        <Activity className="h-6 w-6" />
                        Analytics
                    </h1>
                    <p className="mt-1 text-gray-500">
                        View detailed analytics and trends
                    </p>
                </div>

                {/* Overview Stats */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">
                                    Total Appointments
                                </p>
                                <p className="mt-1 text-3xl font-bold text-gray-900">
                                    {totalAppointments}
                                </p>
                            </div>
                            <Calendar className="h-8 w-8 text-moss-500" />
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">
                                    Today's Appointments
                                </p>
                                <p className="mt-1 text-3xl font-bold text-gray-900">
                                    {todayAppointments || 0}
                                </p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-green-500" />
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">
                                    Service Types
                                </p>
                                <p className="mt-1 text-3xl font-bold text-gray-900">
                                    {
                                        Object.keys(serviceTypeBreakdown || {})
                                            .length
                                    }
                                </p>
                            </div>
                            <Stethoscope className="h-8 w-8 text-purple-500" />
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">
                                    Active Companies
                                </p>
                                <p className="mt-1 text-3xl font-bold text-gray-900">
                                    {companyAppointments?.length || 0}
                                </p>
                            </div>
                            <Building2 className="h-8 w-8 text-orange-500" />
                        </div>
                    </div>
                </div>

                {/* Monthly Trends */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">
                        Monthly Appointment Trends
                    </h3>
                    <div className="flex h-48 items-end gap-2">
                        {(monthlyTrends || []).map(
                            (trend: any, index: number) => {
                                const counts = (monthlyTrends || []).map(
                                    (t: any) => t.count,
                                );
                                const maxCount = Math.max(...counts, 1);
                                const heightPercent =
                                    maxCount > 0
                                        ? (trend.count / maxCount) * 100
                                        : 0;
                                return (
                                    <div
                                        key={index}
                                        className="flex flex-1 flex-col items-center gap-2"
                                    >
                                        <div
                                            className="w-full rounded-t-md bg-moss-500 transition-all hover:bg-moss-600"
                                            style={{
                                                height: `${heightPercent}%`,
                                                minHeight:
                                                    trend.count > 0
                                                        ? '10px'
                                                        : '0',
                                            }}
                                            title={`${trend.count} appointments`}
                                        />
                                        <span className="text-xs text-gray-500">
                                            {trend.month?.substring(0, 3)}
                                        </span>
                                    </div>
                                );
                            },
                        )}
                    </div>
                </div>

                {/* Status & Service Breakdown */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Status Breakdown */}
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 text-lg font-semibold text-gray-900">
                            Appointments by Status
                        </h3>
                        <div className="space-y-3">
                            {Object.entries(statusTrends || {}).map(
                                ([status, count]: [string, any]) => {
                                    const total = Object.values(
                                        statusTrends || {},
                                    ).reduce(
                                        (sum: number, c: any) =>
                                            sum + Number(c),
                                        0,
                                    );
                                    const pct =
                                        total > 0
                                            ? (Number(count) / total) * 100
                                            : 0;
                                    const colors: Record<string, string> = {
                                        completed: 'bg-green-500',
                                        pending: 'bg-yellow-500',
                                        arrived: 'bg-moss-500',
                                        cancelled: 'bg-red-500',
                                    };
                                    return (
                                        <div
                                            key={status}
                                            className="flex items-center justify-between"
                                        >
                                            <span className="text-sm text-gray-600 capitalize">
                                                {status}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-100">
                                                    <div
                                                        className={`h-full rounded-full ${colors[status] || 'bg-gray-500'}`}
                                                        style={{
                                                            width: `${pct}%`,
                                                        }}
                                                    />
                                                </div>
                                                <span className="w-8 text-sm font-medium text-gray-900">
                                                    {count}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                },
                            )}
                        </div>
                    </div>

                    {/* Service Type Breakdown */}
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 text-lg font-semibold text-gray-900">
                            Service Types
                        </h3>
                        <div className="space-y-3">
                            {Object.entries(serviceTypeBreakdown || {})
                                .slice(0, 8)
                                .map(([service, count]: [string, any]) => {
                                    const pct =
                                        totalServices > 0
                                            ? (Number(count) / totalServices) *
                                              100
                                            : 0;
                                    return (
                                        <div
                                            key={service}
                                            className="flex items-center justify-between"
                                        >
                                            <span className="max-w-[200px] truncate text-sm text-gray-600">
                                                {service}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-100">
                                                    <div
                                                        className="h-full rounded-full bg-purple-500"
                                                        style={{
                                                            width: `${pct}%`,
                                                        }}
                                                    />
                                                </div>
                                                <span className="w-8 text-sm font-medium text-gray-900">
                                                    {count}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                </div>

                {/* Staff by Role */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">
                        Staff by Role
                    </h3>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        <div className="rounded-lg bg-moss-50 p-4 text-center">
                            <Users className="mx-auto mb-2 h-8 w-8 text-moss-600" />
                            <p className="text-2xl font-bold text-moss-900">
                                {staffByRole?.doctors || 0}
                            </p>
                            <p className="text-sm text-moss-700">Doctors</p>
                        </div>
                        <div className="rounded-lg bg-green-50 p-4 text-center">
                            <FlaskConical className="mx-auto mb-2 h-8 w-8 text-green-600" />
                            <p className="text-2xl font-bold text-green-900">
                                {staffByRole?.medtechs || 0}
                            </p>
                            <p className="text-sm text-green-700">MedTechs</p>
                        </div>
                        <div className="rounded-lg bg-purple-50 p-4 text-center">
                            <Scan className="mx-auto mb-2 h-8 w-8 text-purple-600" />
                            <p className="text-2xl font-bold text-purple-900">
                                {staffByRole?.radtechs || 0}
                            </p>
                            <p className="text-sm text-purple-700">RadTechs</p>
                        </div>
                        <div className="rounded-lg bg-orange-50 p-4 text-center">
                            <Activity className="mx-auto mb-2 h-8 w-8 text-orange-600" />
                            <p className="text-2xl font-bold text-orange-900">
                                {staffByRole?.admins || 0}
                            </p>
                            <p className="text-sm text-orange-700">Admins</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

AdminAnalytics.layout = (page: any) => {
    return <AppLayout>{page}</AppLayout>;
};
