import { Head, Link, usePage } from '@inertiajs/react';
import { LayoutGrid, Calendar, HeartPulse, Users, Activity } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
    pendingCount: number;
    todayCount: number;
    totalPatients: number;
}

export default function DoctorDashboard(props: Props) {
    const { auth } = usePage().props as any;
    const { pendingCount, todayCount, totalPatients } = props;

    return (
        <>
            <Head title="Doctor Dashboard" />

            <div className="p-6 space-y-6">
                {/* Welcome Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Welcome back, Dr. {auth?.user?.name}</h1>
                        <p className="text-gray-500 mt-1">Here's what's happening with your appointments today</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Link href="/doctor/appointments" className="group">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-8 rounded-2xl hover:shadow-2xl transition-all duration-300 group-hover:-translate-y-1">
                            <div className="flex items-center justify-between">
                                <div className="p-3 bg-white/20 rounded-xl">
                                    <Calendar className="w-8 h-8" />
                                </div>
                                <div className="text-right">
                                    <p className="text-blue-100 text-sm">Pending Appointments</p>
                                    <p className="text-3xl font-bold">{pendingCount}</p>
                                </div>
                            </div>
                        </div>
                    </Link>

                    <Link href="/doctor/appointments" className="group">
                        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-8 rounded-2xl hover:shadow-2xl transition-all duration-300 group-hover:-translate-y-1">
                            <div className="flex items-center justify-between">
                                <div className="p-3 bg-white/20 rounded-xl">
                                    <HeartPulse className="w-8 h-8" />
                                </div>
                                <div className="text-right">
                                    <p className="text-green-100 text-sm">Today's Exams</p>
                                    <p className="text-3xl font-bold">{todayCount}</p>
                                </div>
                            </div>
                        </div>
                    </Link>

                    <div className="group">
                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-8 rounded-2xl hover:shadow-2xl transition-all duration-300 group-hover:-translate-y-1">
                            <div className="flex items-center justify-between">
                                <div className="p-3 bg-white/20 rounded-xl">
                                    <Users className="w-8 h-8" />
                                </div>
                                <div className="text-right">
                                    <p className="text-purple-100 text-sm">Total Patients</p>
                                    <p className="text-3xl font-bold">{totalPatients}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="group">
                        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-8 rounded-2xl hover:shadow-2xl transition-all duration-300 group-hover:-translate-y-1">
                            <div className="flex items-center justify-between">
                                <div className="p-3 bg-white/20 rounded-xl">
                                    <Activity className="w-8 h-8" />
                                </div>
                                <div className="text-right">
                                    <p className="text-indigo-100 text-sm">Completed This Week</p>
                                    <p className="text-3xl font-bold">24</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Link href="/doctor/appointments" className="block">
                        <Card className="h-48 hover:shadow-lg transition-shadow cursor-pointer border-2 border-dashed border-gray-200 hover:border-blue-300 group">
                            <CardContent className="p-8 flex flex-col items-center justify-center text-center group-hover:scale-105 transition-transform">
                                <Calendar className="w-16 h-16 text-blue-500 mb-4 group-hover:rotate-6 transition-transform" />
                                <h3 className="text-xl font-bold text-gray-900 mb-2">View Appointments</h3>
                                <p className="text-gray-500">{pendingCount} pending</p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/doctor/appointments" className="block">
                        <Card className="h-48 hover:shadow-lg transition-shadow cursor-pointer border-2 border-dashed border-gray-200 hover:border-green-300 group">
                            <CardContent className="p-8 flex flex-col items-center justify-center text-center group-hover:scale-105 transition-transform">
                                <HeartPulse className="w-16 h-16 text-green-500 mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Start New Exam</h3>
                                <p className="text-gray-500">Begin physical examination</p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/settings/profile" className="block">
                        <Card className="h-48 hover:shadow-lg transition-shadow cursor-pointer border-2 border-dashed border-gray-200 hover:border-purple-300 group">
                            <CardContent className="p-8 flex flex-col items-center justify-center text-center group-hover:scale-105 transition-transform">
                                <Activity className="w-16 h-16 text-purple-500 mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 mb-2">View Schedule</h3>
                                <p className="text-gray-500">Weekly overview & calendar</p>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </div>
        </>
    );
}

DoctorDashboard.layout = (page: any) => <AppLayout>{page}</AppLayout>;


