import { Head, usePage, Link } from '@inertiajs/react';
import {
    FileText,
    Calendar,
    Activity,
    CheckCircle,
    Clock,
    XCircle,
    AlertCircle,
    Building2,
    Stethoscope,
    FlaskConical,
    Scan,
    Eye,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';

interface Props {
    totalAppointments: number;
    monthlyAppointments: number;
    yearlyAppointments: number;
    statusBreakdown: Record<string, number>;
    typeBreakdown: Record<string, number>;
    topCompanies: { company_name: string; count: number }[];
    recentAppointments: any[];
    medicalRecords: {
        physicalExams: number;
        labResults: number;
        xrayReports: number;
    };
}

export default function AdminReports() {
    const props = usePage().props as any;
    const {
        totalAppointments,
        monthlyAppointments,
        yearlyAppointments,
        statusBreakdown,
        typeBreakdown,
        topCompanies,
        recentAppointments,
        medicalRecords,
    } = props;

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'arrived':
                return 'bg-moss-100 text-moss-800';
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <>
            <Head title="Reports - Admin" />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                        <FileText className="h-6 w-6" />
                        Reports
                    </h1>
                    <p className="mt-1 text-gray-500">
                        View comprehensive clinic reports
                    </p>
                </div>

                {/* Summary Cards */}
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
                                    This Month
                                </p>
                                <p className="mt-1 text-3xl font-bold text-gray-900">
                                    {monthlyAppointments}
                                </p>
                            </div>
                            <Activity className="h-8 w-8 text-green-500" />
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">
                                    This Year
                                </p>
                                <p className="mt-1 text-3xl font-bold text-gray-900">
                                    {yearlyAppointments}
                                </p>
                            </div>
                            <FileText className="h-8 w-8 text-purple-500" />
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">
                                    Medical Records
                                </p>
                                <p className="mt-1 text-3xl font-bold text-gray-900">
                                    {(medicalRecords?.physicalExams || 0) +
                                        (medicalRecords?.labResults || 0) +
                                        (medicalRecords?.xrayReports || 0)}
                                </p>
                            </div>
                            <Stethoscope className="h-8 w-8 text-orange-500" />
                        </div>
                    </div>
                </div>

                {/* Status & Type Breakdown */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Status Breakdown */}
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 text-lg font-semibold text-gray-900">
                            Appointments by Status
                        </h3>
                        <div className="space-y-3">
                            {Object.entries(statusBreakdown || {}).map(
                                ([status, count]: [string, any]) => {
                                    const total = Object.values(
                                        statusBreakdown || {},
                                    ).reduce(
                                        (sum: number, c: any) =>
                                            sum + Number(c),
                                        0,
                                    );
                                    const pct =
                                        total > 0
                                            ? (Number(count) / total) * 100
                                            : 0;
                                    const icons: Record<string, any> = {
                                        completed: CheckCircle,
                                        pending: AlertCircle,
                                        arrived: Clock,
                                        cancelled: XCircle,
                                    };
                                    const Icon = icons[status] || Activity;
                                    return (
                                        <div
                                            key={status}
                                            className="flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Icon
                                                    className={`h-4 w-4 ${
                                                        status === 'completed'
                                                            ? 'text-green-600'
                                                            : status ===
                                                                'pending'
                                                              ? 'text-yellow-600'
                                                              : status ===
                                                                  'arrived'
                                                                ? 'text-moss-600'
                                                                : 'text-red-600'
                                                    }`}
                                                />
                                                <span className="text-sm text-gray-600 capitalize">
                                                    {status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-100">
                                                    <div
                                                        className={`h-full rounded-full ${
                                                            status ===
                                                            'completed'
                                                                ? 'bg-green-500'
                                                                : status ===
                                                                    'pending'
                                                                  ? 'bg-yellow-500'
                                                                  : status ===
                                                                      'arrived'
                                                                    ? 'bg-moss-500'
                                                                    : 'bg-red-500'
                                                        }`}
                                                        style={{
                                                            width: `${pct}%`,
                                                        }}
                                                    />
                                                </div>
                                                <span className="w-12 text-right text-sm font-medium text-gray-900">
                                                    {count}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                },
                            )}
                        </div>
                    </div>

                    {/* Type Breakdown */}
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 text-lg font-semibold text-gray-900">
                            Appointments by Type
                        </h3>
                        <div className="space-y-3">
                            {Object.entries(typeBreakdown || {}).map(
                                ([type, count]: [string, any]) => {
                                    const total = Object.values(
                                        typeBreakdown || {},
                                    ).reduce(
                                        (sum: number, c: any) =>
                                            sum + Number(c),
                                        0,
                                    );
                                    const pct =
                                        total > 0
                                            ? (Number(count) / total) * 100
                                            : 0;
                                    return (
                                        <div
                                            key={type}
                                            className="flex items-center justify-between"
                                        >
                                            <span className="text-sm text-gray-600 capitalize">
                                                {type === 'individual'
                                                    ? 'Individual'
                                                    : type ===
                                                        'company_referral'
                                                      ? 'Company Referral'
                                                      : 'Bulk Booking'}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-100">
                                                    <div
                                                        className="h-full rounded-full bg-moss-500"
                                                        style={{
                                                            width: `${pct}%`,
                                                        }}
                                                    />
                                                </div>
                                                <span className="w-12 text-right text-sm font-medium text-gray-900">
                                                    {count}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                },
                            )}
                        </div>
                    </div>
                </div>

                {/* Top Companies & Medical Records */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Top Companies */}
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 text-lg font-semibold text-gray-900">
                            Top Companies
                        </h3>
                        {(topCompanies || []).length > 0 ? (
                            <div className="space-y-3">
                                {topCompanies
                                    .slice(0, 5)
                                    .map((company: any, index: number) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-gray-400" />
                                                <span className="max-w-[200px] truncate text-sm text-gray-600">
                                                    {company.company_name}
                                                </span>
                                            </div>
                                            <span className="text-sm font-medium text-gray-900">
                                                {company.count}
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        ) : (
                            <p className="py-4 text-center text-gray-500">
                                No company data yet
                            </p>
                        )}
                    </div>

                    {/* Medical Records */}
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 text-lg font-semibold text-gray-900">
                            Medical Records
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="rounded-lg bg-moss-50 p-4 text-center">
                                <Stethoscope className="mx-auto mb-2 h-8 w-8 text-moss-600" />
                                <p className="text-2xl font-bold text-moss-900">
                                    {medicalRecords?.physicalExams || 0}
                                </p>
                                <p className="text-sm text-moss-700">
                                    Physical Exams
                                </p>
                            </div>
                            <div className="rounded-lg bg-green-50 p-4 text-center">
                                <FlaskConical className="mx-auto mb-2 h-8 w-8 text-green-600" />
                                <p className="text-2xl font-bold text-green-900">
                                    {medicalRecords?.labResults || 0}
                                </p>
                                <p className="text-sm text-green-700">
                                    Lab Results
                                </p>
                            </div>
                            <div className="rounded-lg bg-purple-50 p-4 text-center">
                                <Scan className="mx-auto mb-2 h-8 w-8 text-purple-600" />
                                <p className="text-2xl font-bold text-purple-900">
                                    {medicalRecords?.xrayReports || 0}
                                </p>
                                <p className="text-sm text-purple-700">
                                    X-Ray Reports
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Appointments */}
                <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Recent Appointments
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Patient
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Service
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {(recentAppointments || [])
                                    .slice(0, 10)
                                    .map((appointment: any) => (
                                        <tr
                                            key={appointment.id}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-gray-900">
                                                    {
                                                        appointment.user
                                                            ?.first_name
                                                    }{' '}
                                                    {
                                                        appointment.user
                                                            ?.last_name
                                                    }
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-gray-600">
                                                    {formatDate(
                                                        appointment.appointment_date,
                                                    )}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-gray-600">
                                                    {appointment.service_type}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-gray-600 capitalize">
                                                    {appointment.type ===
                                                    'individual'
                                                        ? 'Individual'
                                                        : appointment.type ===
                                                            'company_referral'
                                                          ? 'Company'
                                                          : 'Bulk'}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(appointment.status)}`}
                                                >
                                                    {appointment.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link
                                                    href={`/appointments/${appointment.id}`}
                                                    className="text-moss-600 hover:text-moss-800"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}

AdminReports.layout = (page: any) => {
    return <AppLayout>{page}</AppLayout>;
};
