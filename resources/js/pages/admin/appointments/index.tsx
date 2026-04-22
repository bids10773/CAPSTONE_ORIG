import { Head, usePage, router } from '@inertiajs/react';
import { 
    Eye, 
    CheckCircle,
    CheckCircle2,
    XCircle,
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
    start_time: string;   // 👈 ADD THIS
    end_time: string; 
    status: string;
    type: string;
    service_types: string;
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

    //for service_types arraay format
    const formatService = (service: any) => {
    try {
        const parsed = typeof service === 'string' ? JSON.parse(service) : service;
        return Array.isArray(parsed) ? parsed.join(', ') : parsed;
    } catch {
        return service;
    }
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

    const cancelAppointment = (id: number) => {
    router.patch(`/admin/appointments/${id}/status`, {
        status: 'cancelled'
    }, {
        onSuccess: () => {
            setSelectedAppointment(null);
        }
    });
};

    const getStatusStyle = (status: string) => {
    switch (status) {
        case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'accepted': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
        case 'arrived': return 'bg-blue-100 text-blue-800 border-blue-200';

        case 'for_diagnostics': return 'bg-purple-100 text-purple-800 border-purple-200';
        case 'for_xray': return 'bg-pink-100 text-pink-800 border-pink-200';
        case 'for_final_evaluation': return 'bg-orange-100 text-orange-800 border-orange-200';

        case 'completed': return 'bg-green-100 text-green-800 border-green-200';
        case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';

        default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

const getStatusLabel = (status: string) => {
    switch (status) {
        case 'for_diagnostics': return 'Laboratory';
        case 'for_xray': return 'X-Ray';
        case 'for_final_evaluation': return 'Final Evaluation';
        default: return status.replace('_', ' ');
    }
};

    const getAge = (birthdate?: string) => {
        if (!birthdate) return 'N/A';
        return Math.floor((new Date().getTime() - new Date(birthdate).getTime()) / 31557600000);
    };

    return (
        <>
            <Head title="Admin - Appointment Setting" />
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
                        <option value="completed">Completed</option>
                        <option value="pending_xray">Pending Xray</option>
                    </select>
                </div>

                {/* Main Table */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700 border-b text-xs uppercase text-gray-500 font-bold">
                            <tr>
                                <th className="px-6 py-4">Patient Profile</th>
                                <th className="px-6 py-4">Readiness</th>
                                <th className="px-6 py-4">Schedule</th>
                                <th className="px-6 py-4">Appointment type</th>
                                <th className="px-6 py-4">Service type</th>
                                <th className="px-6 py-4">Doctor</th>
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
                                        <div className="flex flex-col">
                                            <span>
                                                {new Date(apt.appointment_date).toLocaleDateString()}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {apt.start_time} - {apt.end_time}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs rounded-full font-semibold
                                            ${
                                                apt.type === 'individual'
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : apt.type === 'company_referral'
                                                    ? 'bg-purple-100 text-purple-800'
                                                    : apt.type === 'company_bulk'
                                                    ? 'bg-orange-100 text-orange-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }
                                        `}>
                                            {apt.type.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
    <div className="flex flex-wrap gap-1">
        {(() => {
            try {
                const parsed = typeof apt.service_types === 'string'
                    ? JSON.parse(apt.service_types)
                    : apt.service_types;

                return Array.isArray(parsed)
                    ? parsed.map((s: string, i: number) => (
                        <span
                            key={i}
                            className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800"
                        >
                            {s}
                        </span>
                    ))
                    : <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">{parsed}</span>;
            } catch {
                return (
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                        {apt.service_types}
                    </span>
                );
            }
        })()}
    </div>
</td>
                                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                                    {apt.doctor ? (
                                                        <span className="font-medium">
                                                        Dr. {apt.doctor.first_name} {apt.doctor.last_name}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 italic">Not Assigned</span>
                                                    )}
                                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase ${getStatusStyle(apt.status)}`}>
                                            {getStatusLabel(apt.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Button
                                            size="sm"
                                            onClick={() => setSelectedAppointment(apt)}
                                            className="gap-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
                                            >
                                            <Eye className="w-4 h-4" /> View
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
                        <DialogContent className="max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="text-xl flex items-center gap-2">
                                    <User className="w-5 h-5 text-blue-600" />
                                    Review Patient Information
                                </DialogTitle>
                                <DialogDescription>Verify all fields before sending to the medical queue.</DialogDescription>
                            </DialogHeader>

                            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Details Card */}
                                <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border min-w-0">
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
                                <div className="p-4 border rounded-xl flex flex-col justify-center bg-white dark:bg-gray-800 min-w-0">
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

                            <div className="mt-8 flex flex-wrap justify-end gap-3">

    {/* CLOSE MODAL */}
    <Button 
        variant="outline" 
        onClick={() => setSelectedAppointment(null)} 
        className="flex-1"
    >
        Close
    </Button>

    {/* ❌ CANCEL APPOINTMENT */}
    {!['completed', 'cancelled'].includes(selectedAppointment.status) && (
    <Button
        variant="destructive"
        onClick={() => cancelAppointment(selectedAppointment.id)}
        className="flex-1 gap-2"
    >
        <XCircle className="w-4 h-4" />
        Cancel Appointment
    </Button>
)}

    {/* ✅ APPROVE */}
    {selectedAppointment.status === 'pending' && (
        <Button 
            onClick={() => acceptAppointment(selectedAppointment.id)}
            disabled={!isComplete(selectedAppointment)}
            className={`flex-1 gap-2 ${
                isComplete(selectedAppointment) ? 'bg-green-600 hover:bg-green-700' : ''
            }`}
        >
            <CheckCircle2 className="w-4 h-4" />
            Approve & Forward
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