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

const page = usePage<{ appointments: Props['appointments']; filters: Props['filters'] }>();
const { appointments, filters } = page.props;

const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
const [search, setSearch] = useState(filters.search ?? '');

// Debounce: fires a GET request 400ms after the user stops typing
useEffect(() => {
    const timeout = setTimeout(() => {
        router.get(
            '/admin/appointments',
            { ...filters, search },
            { preserveScroll: true, preserveState: true, replace: true }
        );
    }, 400);

    return () => clearTimeout(timeout);
}, [search]);

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
        case 'pending':    return 'bg-yellow-100 text-yellow-800';
        case 'accepted':   return 'bg-indigo-100 text-indigo-800';
        case 'arrived':    return 'bg-blue-100 text-blue-800';
        case 'completed':  return 'bg-green-100 text-green-800';
        case 'cancelled':  return 'bg-red-100 text-red-800';
        default:           return 'bg-gray-100 text-gray-800';
    }
};

const getStatusIcon = (status: string) => {
    switch (status) {
        case 'pending':   return <AlertCircle className="w-4 h-4 text-yellow-600" />;
        case 'accepted':  return <CheckCircle2 className="w-4 h-4 text-indigo-600" />;
        case 'arrived':   return <Clock className="w-4 h-4 text-blue-600" />;
        case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
        case 'cancelled': return <XCircle className="w-4 h-4 text-red-600" />;
        default:          return null;
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
        case 'individual':       return 'Individual';
        case 'company_referral': return 'Company Referral';
        case 'company_bulk':     return 'Bulk Booking';
        default:                 return type;
    }
};

const getAge = (birthdate?: string) => {
    if (!birthdate) return 'N/A';
    return Math.floor(
        (new Date().getTime() - new Date(birthdate).getTime()) /
        (1000 * 60 * 60 * 24 * 365.25)
    );
};

return (
<>
<Head title="Appointments - Admin" />

<div className="p-6">


{/* SEARCH BAR — matching StaffIndex design */}
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
  <div className="flex flex-col md:flex-row gap-4">

    <div className="flex-1">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, email, service..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
          bg-white dark:bg-gray-900
          text-gray-900 dark:text-white
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    {/* STATUS FILTER */}
  <div>
    <select
      value={filters.status}
      onChange={(e) => {
        router.get(
          '/admin/appointments',
          { ...filters, status: e.target.value, search },
          { preserveScroll: true, preserveState: true, replace: true }
        );
      }}
      className="w-full pl-3 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                 bg-white dark:bg-gray-900
                 text-gray-900 dark:text-white
                 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    >
      <option value="">All Status</option>
      <option value="pending">Pending</option>
      <option value="accepted">Accepted</option>
      <option value="arrived">Arrived</option>
      <option value="completed">Completed</option>
      <option value="cancelled">Cancelled</option>
    </select>
  </div>

{/* NEW APPOINTMENT BUTTON */}
    <Link
      href="/admin/appointments/create"
      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
    >
      <Plus className="w-4 h-4" />
      New Appointment
    </Link>

  </div>
</div>

{/* TABLE */}
<div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
  <div className="overflow-x-auto">
    <table className="w-full text-gray-900 dark:text-white">
      <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Patient</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Service</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Doctor</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Type</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Company</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
        {appointments.data.length === 0 ? (
          <tr>
            <td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
              No appointments found.
            </td>
          </tr>
        ) : (
          appointments.data.map((appointment) => (
            <tr key={appointment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="px-6 py-4">
                <p className="font-medium">{appointment.user.first_name} {appointment.user.last_name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{appointment.user.email}</p>
              </td>
              <td className="px-6 py-4">{formatDate(appointment.appointment_date)}</td>
              <td className="px-6 py-4">{appointment.service_type}</td>
              <td className="px-6 py-4">
                {appointment.doctor ? (
                  <p className="font-medium">Dr. {appointment.doctor.first_name} {appointment.doctor.last_name}</p>
                ) : (
                  <p className="text-sm text-gray-500 italic">No doctor assigned</p>
                )}
              </td>
              <td className="px-6 py-4">{getTypeLabel(appointment.type)}</td>
              <td className="px-6 py-4">{appointment.company?.company_name || '-'}</td>
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
          ))
        )}
      </tbody>
    </table>
  </div>
</div>

{/* MODAL - landscape */}
{selectedAppointment && (
  <Dialog open={true} onOpenChange={() => setSelectedAppointment(null)}>
    <DialogContent className="max-w-4xl p-6 bg-white dark:bg-neutral-950 rounded-xl shadow-xl">
      <DialogHeader>
        <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
          Patient Details
        </DialogTitle>
        <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
          Full profile information
        </DialogDescription>
      </DialogHeader>

      <div className="mt-4 space-y-4">

        {/* Name & Email */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-100 dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Name</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {selectedAppointment.user.first_name} {selectedAppointment.user.last_name}
            </p>
          </div>

          <div className="p-4 bg-gray-100 dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {selectedAppointment.user.email}
            </p>
          </div>
        </div>

        {/* Patient Profile */}
        {selectedAppointment.user.patient_profile ? (
          <div className="space-y-3">

            {/* Row 1: Age, Sex, Civil Status */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900">
                <p className="text-xs text-gray-500">Age</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {getAge(selectedAppointment.user.patient_profile.birthdate)}
                </p>
              </div>

              <div className="p-4 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900">
                <p className="text-xs text-gray-500">Sex</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedAppointment.user.patient_profile.sex || 'N/A'}
                </p>
              </div>

              <div className="p-4 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900">
                <p className="text-xs text-gray-500">Civil Status</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedAppointment.user.patient_profile.civil_status || 'N/A'}
                </p>
              </div>
            </div>

            {/* Row 2: Contact Number + Emergency Contact */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900">
                <p className="text-xs text-gray-500">Contact Number</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedAppointment.user.patient_profile.contact_no || 'N/A'}
                </p>
              </div>

              <div className="p-4 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900">
                <p className="text-xs text-gray-500">Emergency Contact</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedAppointment.user.patient_profile.emergency_contact_name || 'N/A'}
                </p>
                <p className="text-sm text-gray-500">
                  {selectedAppointment.user.patient_profile.emergency_contact_no || ''}
                </p>
              </div>
            </div>

            {/* Row 3: Address (full width) */}
            <div className="p-4 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900">
              <p className="text-xs text-gray-500">Address</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {selectedAppointment.user.patient_profile.address || 'N/A'}
              </p>
            </div>

          </div>
        ) : (
          <p className="text-sm text-gray-500 italic mt-2">
            No additional patient profile information available.
          </p>
        )}

        {/* Accept Button */}
        {selectedAppointment.status === 'pending' && (
          <Button
            onClick={() => acceptAppointment(selectedAppointment.id)}
            className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Accept Appointment
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

AdminAppointmentsIndex.layout = (page: any) => {
return <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
};