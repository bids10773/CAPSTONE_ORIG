import { Head, Link, usePage, router } from '@inertiajs/react';
import { 
    Calendar, 
    Plus, 
    Search, 
    Filter, 
    Eye, 
    CheckCircle,
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle
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

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Appointments',
        href: "",
    },
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

        // FIX: Laravel sends snake_case
        patient_profile?: PatientProfile;
    };
    company: {
        company_name: string;
    } | null;
}

interface Props {
    appointments: {
        data: Appointment[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: {
        search: string;
        status: string;
        type: string;
        date_from: string;
        date_to: string;
    };
}

export default function AdminAppointmentsIndex() {

const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

useEffect(() => {
  console.log(selectedAppointment);
}, [selectedAppointment]);

const page = usePage<{ appointments: Props['appointments']; filters: Props['filters'] }>();
const { appointments, filters } = page.props;

const acceptAppointment = (appointmentId: number) => {
  router.patch(
    `/admin/appointments/${appointmentId}/status`,
    { status: 'accepted' },
    {
      preserveScroll: true,
      onSuccess: () => {
        setSelectedAppointment(null);
        router.reload({ only: ['appointments'] });
      },
    }
  );
};

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'pending':
            return 'bg-yellow-100 text-yellow-800';
        case 'accepted':
            return 'bg-indigo-100 text-indigo-800';
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

const getStatusIcon = (status: string) => {
    switch (status) {
        case 'pending':
            return <AlertCircle className="w-4 h-4 text-yellow-600" />;
        case 'accepted':
            return <CheckCircle2 className="w-4 h-4 text-indigo-600" />;
        case 'arrived':
            return <Clock className="w-4 h-4 text-blue-600" />;
        case 'completed':
            return <CheckCircle className="w-4 h-4 text-green-600" />;
        case 'cancelled':
            return <XCircle className="w-4 h-4 text-red-600" />;
        default:
            return null;
    }
};

const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const getTypeLabel = (type: string) => {
    switch (type) {
        case 'individual':
            return 'Individual';
        case 'company_referral':
            return 'Company Referral';
        case 'company_bulk':
            return 'Bulk Booking';
        default:
            return type;
    }
};

return (
<>
<Head title="Appointments - Admin" />

<div className="p-6">

{/* HEADER */}
<div className="flex justify-between mb-6">
<div>
<h1 className="text-2xl font-bold flex items-center gap-2">
<Calendar className="w-6 h-6" />
Appointments
</h1>
<p className="text-gray-500">Manage all clinic appointments</p>
</div>

<Link
href="/admin/appointments/create"
className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
>
<Plus className="w-4 h-4" />
New Appointment
</Link>
</div>

{/* TABLE */}
<div className="bg-white rounded-lg border overflow-hidden">

<table className="w-full">

<thead className="bg-gray-100">
<tr>
<th className="px-6 py-3 text-left text-xs uppercase">Patient</th>
<th className="px-6 py-3 text-left text-xs uppercase">Date</th>
<th className="px-6 py-3 text-left text-xs uppercase">Service</th>
<th className="px-6 py-3 text-left text-xs uppercase">Type</th>
<th className="px-6 py-3 text-left text-xs uppercase">Company</th>
<th className="px-6 py-3 text-left text-xs uppercase">Status</th>
<th className="px-6 py-3 text-right text-xs uppercase">Actions</th>
</tr>
</thead>

<tbody className="divide-y">

{appointments.data.map((appointment) => (

<tr key={appointment.id}>

<td className="px-6 py-4">
<p className="font-medium">
{appointment.user.first_name} {appointment.user.last_name}
</p>
<p className="text-sm text-gray-500">
{appointment.user.email}
</p>
</td>

<td className="px-6 py-4">
{formatDate(appointment.appointment_date)}
</td>

<td className="px-6 py-4">
{appointment.service_type}
</td>

<td className="px-6 py-4">
{getTypeLabel(appointment.type)}
</td>

<td className="px-6 py-4">
{appointment.company?.company_name || '-'}
</td>

<td className="px-6 py-4">
<span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusBadge(appointment.status)}`}>
{getStatusIcon(appointment.status)}
{appointment.status}
</span>
</td>

<td className="px-6 py-4 text-right">

<Button
    variant="ghost"
    size="sm"
    title="View Appointment"
    className="h-8 w-8 p-0 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900"
    onClick={() => setSelectedAppointment(appointment)}
>
    <Eye className="w-4 h-4" />
</Button>

</td>

</tr>

))}

</tbody>
</table>

</div>

{/* MODAL */}
{selectedAppointment && (

<Dialog open={true} onOpenChange={() => setSelectedAppointment(null)}>

<DialogContent>

<DialogHeader>
<DialogTitle>Patient Details</DialogTitle>
<DialogDescription>Full profile information</DialogDescription>
</DialogHeader>

<div className="space-y-4">

<div>
<label className="text-sm font-medium">Name</label>
<p className="text-lg font-semibold">
{selectedAppointment.user.first_name} {selectedAppointment.user.last_name}
</p>
</div>

<div>
<label className="text-sm font-medium">Email</label>
<p>{selectedAppointment.user.email}</p>
</div>

{selectedAppointment.status === 'pending' && (
<Button
onClick={() => acceptAppointment(selectedAppointment.id)}
className="w-full bg-green-600"
>
<CheckCircle2 className="w-4 h-4 mr-2" />
Accept Appointment
</Button>
)}

{/* FIXED SECTION */}
{selectedAppointment.user.patient_profile ? (
  <div className="grid grid-cols-2 gap-4 mt-3">

    <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
      <p className="text-xs text-gray-500">Age</p>
      <p className="font-semibold text-gray-900 dark:text-white">
        {selectedAppointment.user.patient_profile.birthdate
          ? Math.floor(
              (new Date().getTime() -
                new Date(selectedAppointment.user.patient_profile.birthdate).getTime()) /
                (1000 * 60 * 60 * 24 * 365.25)
            )
          : 'N/A'}
      </p>
    </div>

    <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
      <p className="text-xs text-gray-500">Sex</p>
      <p className="font-semibold text-gray-900 dark:text-white">
        {selectedAppointment.user.patient_profile.sex || 'N/A'}
      </p>
    </div>

    <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
      <p className="text-xs text-gray-500">Civil Status</p>
      <p className="font-semibold text-gray-900 dark:text-white">
        {selectedAppointment.user.patient_profile.civil_status || 'N/A'}
      </p>
    </div>

    <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
      <p className="text-xs text-gray-500">Contact Number</p>
      <p className="font-semibold text-gray-900 dark:text-white">
        {selectedAppointment.user.patient_profile.contact_no || 'N/A'}
      </p>
    </div>

    <div className="col-span-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
      <p className="text-xs text-gray-500">Address</p>
      <p className="font-semibold text-gray-900 dark:text-white">
        {selectedAppointment.user.patient_profile.address || 'N/A'}
      </p>
    </div>

    <div className="col-span-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
      <p className="text-xs text-gray-500">Emergency Contact</p>
      <p className="font-semibold text-gray-900 dark:text-white">
        {selectedAppointment.user.patient_profile.emergency_contact_name || 'N/A'}
      </p>
      <p className="text-sm text-gray-500">
        {selectedAppointment.user.patient_profile.emergency_contact_no || ''}
      </p>
    </div>

  </div>
) : (
  <p className="text-sm text-gray-500 italic mt-2">
    No additional patient profile information available.
  </p>
)}

</div>

</DialogContent>

</Dialog>

)}

</div>
</>
);
}

AdminAppointmentsIndex.layout = (page: any) => {
return <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
};
