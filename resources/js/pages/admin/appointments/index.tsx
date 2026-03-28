import { Head, Link, usePage, router } from '@inertiajs/react';
import { 
    Calendar, 
    Plus, 
    Eye, 
    CheckCircle,
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle,
    Search,
    UserCheck,
    FileWarning,
    MapPin,
    Phone,
    User,
    ArrowRight
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { PageProps } from '@inertiajs/core'; // Import this at the top

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Appointments', href: "/admin/appointments" },
];

interface PatientProfile {
  birthdate?: string;
  sex?: string;
  contact_no?: string;
  civil_status?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_no?: string;
}

interface Appointment {
    id: number;
    appointment_date: string;
    status: string;
    type: string;
    service_type: string;
    user: {
        first_name: string;
        last_name: string;
        email: string;
        patient_profile?: PatientProfile;
    };
    company: {
        company_name: string;
    } | null;
    doctor?: {
        first_name: string;
        last_name: string;
    };
}

interface Props extends PageProps {
    appointments: {
        data: Appointment[];
        current_page: number;
        last_page: number;
        links: any[];
    };
    filters: {
        search: string;
        status: string;
    };
}

export default function AdminAppointmentsIndex() {
    const { appointments, filters } = usePage<Props>().props;
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [search, setSearch] = useState(filters.search ?? '');

    // 1. Validation Logic: Checks if the profile is ready for the Doctor
    const getMissingFields = (apt: Appointment) => {
        const fields = [];
        const p = apt.user.patient_profile;
        if (!p?.birthdate) fields.push('Birthdate');
        if (!p?.sex) fields.push('Sex');
        if (!p?.contact_no) fields.push('Contact Number');
        if (!p?.address) fields.push('Address');
        return fields;
    };

    const isComplete = (apt: Appointment) => getMissingFields(apt).length === 0;

    // 2. Debounced Search
    useEffect(() => {
        const timeout = setTimeout(() => {
            router.get('/admin/appointments', { ...filters, search }, { 
                preserveState: true, 
                preserveScroll: true, 
                replace: true 
            });
        }, 400);
        return () => clearTimeout(timeout);
    }, [search]);

    const acceptAppointment = (id: number) => {
        router.patch(`/admin/appointments/${id}/status`, { status: 'accepted' }, {
            onSuccess: () => setSelectedAppointment(null)
        });
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'accepted': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
            case 'arrived': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'pending_diagnostics': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'completed': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getAge = (birthdate?: string) => {
        if (!birthdate) return 'N/A';
        return Math.floor((new Date().getTime() - new Date(birthdate).getTime()) / 31557600000);
    };

    return (
        <>
            <Head title="Admin - Appointment Vetting" />
            <div className="p-6">
                {/* Search and Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6 bg-white dark:bg-gray-800 p-4 rounded-xl border">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search patients..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-900"
                        />
                    </div>
                    <select 
                        value={filters.status} 
                        onChange={e => router.get('/admin/appointments', { ...filters, status: e.target.value })}
                        className="border rounded-lg px-4 py-2 dark:bg-gray-900"
                    >
                        <option value="">All Status</option>
                        <option value="pending">Pending Review</option>
                        <option value="accepted">Accepted (To Doctor)</option>
                        <option value="pending_diagnostics">At Laboratory</option>
                    </select>
                    <Link href="/admin/appointments/create" className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
                        <Plus className="w-4 h-4" /> New Appointment
                    </Link>
                </div>

                {/* Main Table */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700 border-b text-xs uppercase text-gray-500 font-bold">
                            <tr>
                                <th className="px-6 py-4">Patient Profile</th>
                                <th className="px-6 py-4">Readiness</th>
                                <th className="px-6 py-4">Schedule</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-gray-700">
                            {appointments.data.map((apt) => (
                                <tr key={apt.id} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-gray-900 dark:text-white">
                                            {apt.user.first_name} {apt.user.last_name}
                                        </p>
                                        <p className="text-xs text-gray-500">{apt.user.email}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        {isComplete(apt) ? (
                                            <span className="text-[10px] font-bold text-green-600 flex items-center gap-1 uppercase">
                                                <UserCheck className="w-3.5 h-3.5" /> Profile Complete
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-bold text-red-500 flex items-center gap-1 uppercase">
                                                <FileWarning className="w-3.5 h-3.5" /> Missing Info
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                        {new Date(apt.appointment_date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase ${getStatusStyle(apt.status)}`}>
                                            {apt.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Button variant="outline" size="sm" onClick={() => setSelectedAppointment(apt)} className="gap-2">
                                            <Eye className="w-4 h-4" /> Vetting
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Vetting Modal */}
                {selectedAppointment && (
                    <Dialog open={true} onOpenChange={() => setSelectedAppointment(null)}>
                        <DialogContent className="max-w-3xl">
                            <DialogHeader>
                                <DialogTitle className="text-xl flex items-center gap-2">
                                    <User className="w-5 h-5 text-blue-600" />
                                    Review Patient Information
                                </DialogTitle>
                                <DialogDescription>Verify all fields before sending to the medical queue.</DialogDescription>
                            </DialogHeader>

                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Details Card */}
                                <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Personal Data</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <p className="text-[10px] text-gray-500">Age / Sex</p>
                                            <p className="font-semibold">{getAge(selectedAppointment.user.patient_profile?.birthdate)} / {selectedAppointment.user.patient_profile?.sex || '?'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-500">Civil Status</p>
                                            <p className="font-semibold">{selectedAppointment.user.patient_profile?.civil_status || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3"/> Contact</p>
                                        <p className="font-semibold">{selectedAppointment.user.patient_profile?.contact_no || <span className="text-red-500">Missing</span>}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3"/> Address</p>
                                        <p className="font-semibold text-sm">{selectedAppointment.user.patient_profile?.address || <span className="text-red-500">Missing</span>}</p>
                                    </div>
                                </div>

                                {/* Checklist Card */}
                                <div className="p-4 border rounded-xl flex flex-col justify-center bg-white dark:bg-gray-800">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 text-center">Readiness Checklist</h4>
                                    {isComplete(selectedAppointment) ? (
                                        <div className="text-center space-y-2">
                                            <div className="inline-flex p-3 bg-green-100 rounded-full text-green-600">
                                                <CheckCircle className="w-8 h-8" />
                                            </div>
                                            <p className="text-sm font-bold text-green-700">Ready for Doctor</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <p className="text-xs text-red-500 font-bold mb-2">Required Fields Missing:</p>
                                            {getMissingFields(selectedAppointment).map(field => (
                                                <div key={field} className="flex items-center gap-2 text-sm text-gray-600 italic">
                                                    <XCircle className="w-4 h-4 text-red-400" /> {field}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-8 flex gap-3">
                                <Button variant="ghost" onClick={() => setSelectedAppointment(null)} className="flex-1">Cancel</Button>
                                
                                {selectedAppointment.status === 'pending' && (
                                    <Button 
                                        onClick={() => acceptAppointment(selectedAppointment.id)}
                                        disabled={!isComplete(selectedAppointment)}
                                        className={`flex-1 gap-2 ${isComplete(selectedAppointment) ? 'bg-green-600 hover:bg-green-700' : ''}`}
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        Approve & Forward to Doctor
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </>
    );
}

AdminAppointmentsIndex.layout = (page: any) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;