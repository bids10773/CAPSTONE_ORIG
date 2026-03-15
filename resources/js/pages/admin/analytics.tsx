import { Head, usePage } from '@inertiajs/react';
import { 
    Calendar, 
    Activity, 
    TrendingUp, 
    Users,
    Building2,
    Stethoscope,
    FlaskConical,
    Scan
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';

interface Props {
    monthlyTrends: { month: string; count: number }[];
    serviceTypeBreakdown: Record<string, number>;
    companyAppointments: { company_name: string; count: number }[];
    statusTrends: Record<string, number>;
    todayAppointments: any[];
    staffByRole: Record<string, number>;
}

export default function AdminAnalytics() {
    const props = usePage().props as any;
    const { monthlyTrends, serviceTypeBreakdown, companyAppointments, statusTrends, todayAppointments, staffByRole } = props;

    // Calculate totals
    const totalAppointments = Object.values(monthlyTrends || {}).reduce((sum: number, item: any) => sum + (item?.count || 0), 0);
    const totalServices = Object.values(serviceTypeBreakdown || {}).reduce((sum: number, count) => sum + Number(count), 0);

    return (
        <>
            <Head title="Analytics - Admin" />

            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Activity className="w-6 h-6" />
                        Analytics
                    </h1>
                    <p className="text-gray-500 mt-1">
                        View detailed analytics and trends
                    </p>
                </div>

                {/* Overview Stats */}
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
                                <p className="text-sm text-gray-500">Today's Appointments</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{todayAppointments?.length || 0}</p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-green-500" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Service Types</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{Object.keys(serviceTypeBreakdown || {}).length}</p>
                            </div>
                            <Stethoscope className="w-8 h-8 text-purple-500" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Active Companies</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{companyAppointments?.length || 0}</p>
                            </div>
                            <Building2 className="w-8 h-8 text-orange-500" />
                        </div>
                    </div>
                </div>

                {/* Monthly Trends */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Appointment Trends</h3>
                    <div className="flex items-end gap-2 h-48">
                        {(monthlyTrends || []).map((trend: any, index: number) => {
                            const counts = (monthlyTrends || []).map((t: any) => t.count);
                            const maxCount = Math.max(...counts, 1);
                            const heightPercent = maxCount > 0 ? (trend.count / maxCount) * 100 : 0;
                            return (
                                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                    <div 
                                        className="w-full bg-blue-500 rounded-t-md transition-all hover:bg-blue-600"
                                        style={{ height: `${heightPercent}%`, minHeight: trend.count > 0 ? '10px' : '0' }}
                                        title={`${trend.count} appointments`}
                                    />
                                    <span className="text-xs text-gray-500">{trend.month?.substring(0, 3)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Status & Service Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Status Breakdown */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointments by Status</h3>
                        <div className="space-y-3">
                            {Object.entries(statusTrends || {}).map(([status, count]: [string, any]) => {
                                const total = Object.values(statusTrends || {}).reduce((sum: number, c: any) => sum + Number(c), 0);
                                const pct = total > 0 ? (Number(count) / total) * 100 : 0;
                                const colors: Record<string, string> = {
                                    completed: 'bg-green-500',
                                    pending: 'bg-yellow-500',
                                    arrived: 'bg-blue-500',
                                    cancelled: 'bg-red-500'
                                };
                                return (
                                    <div key={status} className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600 capitalize">{status}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full ${colors[status] || 'bg-gray-500'}`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-medium text-gray-900 w-8">{count}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Service Type Breakdown */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Types</h3>
                        <div className="space-y-3">
                            {Object.entries(serviceTypeBreakdown || {}).slice(0, 8).map(([service, count]: [string, any]) => {
                                const pct = totalServices > 0 ? (Number(count) / totalServices) * 100 : 0;
                                return (
                                    <div key={service} className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600 truncate max-w-[200px]">{service}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-purple-500 rounded-full"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-medium text-gray-900 w-8">{count}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Staff by Role */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Staff by Role</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <Users className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                            <p className="text-2xl font-bold text-blue-900">{staffByRole?.doctors || 0}</p>
                            <p className="text-sm text-blue-700">Doctors</p>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <FlaskConical className="w-8 h-8 mx-auto text-green-600 mb-2" />
                            <p className="text-2xl font-bold text-green-900">{staffByRole?.medtechs || 0}</p>
                            <p className="text-sm text-green-700">MedTechs</p>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <Scan className="w-8 h-8 mx-auto text-purple-600 mb-2" />
                            <p className="text-2xl font-bold text-purple-900">{staffByRole?.radtechs || 0}</p>
                            <p className="text-sm text-purple-700">RadTechs</p>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                            <Activity className="w-8 h-8 mx-auto text-orange-600 mb-2" />
                            <p className="text-2xl font-bold text-orange-900">{staffByRole?.admins || 0}</p>
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

