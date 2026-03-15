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
    Eye
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
        medicalRecords 
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
                return 'bg-blue-100 text-blue-800';
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

            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <FileText className="w-6 h-6" />
                        Reports
                    </h1>
                    <p className="text-gray-500 mt-1">
                        View comprehensive clinic reports
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Appointments</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{totalAppointments}</p>
                            </div>
                            <Calendar className="w-8 h-8 text-blue-500" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">This Month</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{monthlyAppointments}</p>
                            </div>
                            <Activity className="w-8 h-8 text-green-500" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">This Year</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{yearlyAppointments}</p>
                            </div>
                            <FileText className="w-8 h-8 text-purple-500" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Medical Records</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">
                                    {(medicalRecords?.physicalExams || 0) + (medicalRecords?.labResults || 0) + (medicalRecords?.xrayReports || 0)}
                                </p>
                            </div>
                            <Stethoscope className="w-8 h-8 text-orange-500" />
                        </div>
                    </div>
                </div>

                {/* Status & Type Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Status Breakdown */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointments by Status</h3>
                        <div className="space-y-3">
                            {Object.entries(statusBreakdown || {}).map(([status, count]: [string, any]) => {
                                const total = Object.values(statusBreakdown || {}).reduce((sum: number, c: any) => sum + Number(c), 0);
                                const pct = total > 0 ? (Number(count) / total) * 100 : 0;
                                const icons: Record<string, any> = {
                                    completed: CheckCircle,
                                    pending: AlertCircle,
                                    arrived: Clock,
                                    cancelled: XCircle
                                };
                                const Icon = icons[status] || Activity;
                                return (
                                    <div key={status} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Icon className={`w-4 h-4 ${
                                                status === 'completed' ? 'text-green-600' :
                                                status === 'pending' ? 'text-yellow-600' :
                                                status === 'arrived' ? 'text-blue-600' : 'text-red-600'
                                            }`} />
                                            <span className="text-sm text-gray-600 capitalize">{status}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full ${
                                                        status === 'completed' ? 'bg-green-500' :
                                                        status === 'pending' ? 'bg-yellow-500' :
                                                        status === 'arrived' ? 'bg-blue-500' : 'bg-red-500'
                                                    }`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-medium text-gray-900 w-12 text-right">{count}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Type Breakdown */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointments by Type</h3>
                        <div className="space-y-3">
                            {Object.entries(typeBreakdown || {}).map(([type, count]: [string, any]) => {
                                const total = Object.values(typeBreakdown || {}).reduce((sum: number, c: any) => sum + Number(c), 0);
                                const pct = total > 0 ? (Number(count) / total) * 100 : 0;
                                return (
                                    <div key={type} className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600 capitalize">
                                            {type === 'individual' ? 'Individual' : 
                                             type === 'company_referral' ? 'Company Referral' : 'Bulk Booking'}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-blue-500 rounded-full"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-medium text-gray-900 w-12 text-right">{count}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Top Companies & Medical Records */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Companies */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Companies</h3>
                        {(topCompanies || []).length > 0 ? (
                            <div className="space-y-3">
                                {topCompanies.slice(0, 5).map((company: any, index: number) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm text-gray-600 truncate max-w-[200px]">{company.company_name}</span>
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">{company.count}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-4">No company data yet</p>
                        )}
                    </div>

                    {/* Medical Records */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Medical Records</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                                <Stethoscope className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                                <p className="text-2xl font-bold text-blue-900">{medicalRecords?.physicalExams || 0}</p>
                                <p className="text-sm text-blue-700">Physical Exams</p>
                            </div>
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                                <FlaskConical className="w-8 h-8 mx-auto text-green-600 mb-2" />
                                <p className="text-2xl font-bold text-green-900">{medicalRecords?.labResults || 0}</p>
                                <p className="text-sm text-green-700">Lab Results</p>
                            </div>
                            <div className="text-center p-4 bg-purple-50 rounded-lg">
                                <Scan className="w-8 h-8 mx-auto text-purple-600 mb-2" />
                                <p className="text-2xl font-bold text-purple-900">{medicalRecords?.xrayReports || 0}</p>
                                <p className="text-sm text-purple-700">X-Ray Reports</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Appointments */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Recent Appointments</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {(recentAppointments || []).slice(0, 10).map((appointment: any) => (
                                    <tr key={appointment.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-gray-900">
                                                {appointment.user?.first_name} {appointment.user?.last_name}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-gray-600">{formatDate(appointment.appointment_date)}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-gray-600 text-sm">{appointment.service_type}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-gray-600 capitalize text-sm">
                                                {appointment.type === 'individual' ? 'Individual' : 
                                                 appointment.type === 'company_referral' ? 'Company' : 'Bulk'}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(appointment.status)}`}>
                                                {appointment.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/appointments/${appointment.id}`}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                <Eye className="w-4 h-4" />
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

