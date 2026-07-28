import { useState, useEffect } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    Calendar,
    ArrowLeft,
    Save,
    Upload,
    FileText,
    Users,
} from 'lucide-react';
import { Link } from '@inertiajs/react';
import type { BreadcrumbItem, SharedData } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Create Appointment',
        href: '',
    },
];

interface Company {
    id: number;
    company_name: string;
}

interface Patient {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
}

interface Props {
    companies: Company[];
    patients: Patient[];
    serviceTypes: Record<string, string>;
    appointmentTypes: Record<string, string>;
}

export default function AdminCreateAppointment() {
    const props = usePage().props as any;
    const { companies, patients, serviceTypes, appointmentTypes } = props;

    const [formData, setFormData] = useState({
        patient_id: '',
        type: 'individual',
        company_id: '',
        appointment_date: '',
        service_type: '',
        referral_code: '',
        notes: '',
    });

    const [errors, setErrors] = useState<Record<string, string | undefined>>(
        {},
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [companySearch, setCompanySearch] = useState('');
    const [patientSearch, setPatientSearch] = useState('');
    const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
    const [showPatientDropdown, setShowPatientDropdown] = useState(false);
    const [filteredCompanies, setFilteredCompanies] = useState(companies || []);
    const [filteredPatients, setFilteredPatients] = useState(patients || []);

    // Filter companies based on search
    useEffect(() => {
        if (companySearch) {
            const filtered = (companies || []).filter((c: Company) =>
                c.company_name
                    .toLowerCase()
                    .includes(companySearch.toLowerCase()),
            );
            setFilteredCompanies(filtered);
        } else {
            setFilteredCompanies(companies || []);
        }
    }, [companySearch, companies]);

    // Filter patients based on search
    useEffect(() => {
        if (patientSearch) {
            const filtered = (patients || []).filter(
                (p: Patient) =>
                    `${p.first_name} ${p.last_name}`
                        .toLowerCase()
                        .includes(patientSearch.toLowerCase()) ||
                    p.email.toLowerCase().includes(patientSearch.toLowerCase()),
            );
            setFilteredPatients(filtered);
        } else {
            setFilteredPatients(patients || []);
        }
    }, [patientSearch, patients]);

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >,
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        // Reset company_id when type changes to individual
        if (name === 'type' && value === 'individual') {
            setFormData((prev) => ({
                ...prev,
                company_id: '',
                referral_code: '',
            }));
        }

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const handleCompanySelect = (company: Company) => {
        setFormData((prev) => ({ ...prev, company_id: company.id.toString() }));
        setCompanySearch(company.company_name);
        setShowCompanyDropdown(false);
        if (errors.company_id) {
            setErrors((prev) => ({ ...prev, company_id: '' }));
        }
    };

    const handlePatientSelect = (patient: Patient) => {
        setFormData((prev) => ({ ...prev, patient_id: patient.id.toString() }));
        setPatientSearch(
            `${patient.first_name} ${patient.last_name} (${patient.email})`,
        );
        setShowPatientDropdown(false);
        if (errors.patient_id) {
            setErrors((prev) => ({ ...prev, patient_id: '' }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        // Use Inertia post for proper redirect handling
        router.post('/admin/appointments', formData, {
            onError: (errors: any) => {
                setErrors(errors);
                setIsSubmitting(false);
            },
        });
    };

    const showCompanyField =
        formData.type === 'company_referral' ||
        formData.type === 'company_bulk';
    const showReferralCode = formData.type === 'company_referral';

    return (
        <>
            <Head title="Create Appointment - Admin" />

            <div className="p-6">
                {/* Header */}
                <div className="mb-6 flex items-center gap-4">
                    <Link
                        href="/admin/appointments"
                        className="rounded-lg p-2 transition-colors hover:bg-gray-100"
                    >
                        <ArrowLeft className="h-5 w-5 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                            <Calendar className="h-6 w-6" />
                            Create Appointment
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Schedule an appointment for a patient
                        </p>
                    </div>
                </div>

                <div className="max-w-3xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Patient Selection */}
                        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                                <Users className="h-5 w-5" />
                                Patient Information
                            </h2>
                            <div className="relative">
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Select Patient *
                                </label>
                                <input
                                    type="text"
                                    name="patient_search"
                                    value={patientSearch}
                                    onChange={(e) => {
                                        setPatientSearch(e.target.value);
                                        setShowPatientDropdown(true);
                                    }}
                                    onFocus={() => setShowPatientDropdown(true)}
                                    placeholder="Search for a patient..."
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-moss-500 focus:ring-2 focus:ring-moss-500"
                                    autoComplete="off"
                                />
                                <input
                                    type="hidden"
                                    name="patient_id"
                                    value={formData.patient_id}
                                />

                                {showPatientDropdown &&
                                    filteredPatients.length > 0 && (
                                        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                                            {filteredPatients.map(
                                                (patient: Patient) => (
                                                    <button
                                                        key={patient.id}
                                                        type="button"
                                                        onClick={() =>
                                                            handlePatientSelect(
                                                                patient,
                                                            )
                                                        }
                                                        className="w-full px-4 py-2 text-left transition-colors hover:bg-moss-50"
                                                    >
                                                        <p className="font-medium">
                                                            {patient.first_name}{' '}
                                                            {patient.last_name}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            {patient.email}
                                                        </p>
                                                    </button>
                                                ),
                                            )}
                                        </div>
                                    )}
                                {errors.patient_id && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.patient_id}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Appointment Type */}
                        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                                <FileText className="h-5 w-5" />
                                Appointment Type
                            </h2>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                {(
                                    Object.entries(appointmentTypes) as [
                                        string,
                                        string,
                                    ][]
                                ).map(([value, label]) => (
                                    <label
                                        key={value}
                                        className={`relative flex cursor-pointer items-center justify-center rounded-lg border-2 p-4 transition-all ${
                                            formData.type === value
                                                ? 'border-moss-500 bg-moss-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="type"
                                            value={value}
                                            checked={formData.type === value}
                                            onChange={handleChange}
                                            className="sr-only"
                                        />
                                        <div className="text-center">
                                            {value === 'individual' && (
                                                <Users className="mx-auto mb-2 h-6 w-6 text-gray-600" />
                                            )}
                                            {value === 'company_referral' && (
                                                <FileText className="mx-auto mb-2 h-6 w-6 text-gray-600" />
                                            )}
                                            {value === 'company_bulk' && (
                                                <Upload className="mx-auto mb-2 h-6 w-6 text-gray-600" />
                                            )}
                                            <span className="text-sm font-medium">
                                                {label}
                                            </span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Company Selection (for Referral/Bulk) */}
                        {showCompanyField && (
                            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                                <h2 className="mb-4 text-lg font-semibold">
                                    Company Information
                                </h2>
                                <div className="relative">
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Select Company *
                                    </label>
                                    <input
                                        type="text"
                                        name="company_search"
                                        value={companySearch}
                                        onChange={(e) => {
                                            setCompanySearch(e.target.value);
                                            setShowCompanyDropdown(true);
                                        }}
                                        onFocus={() =>
                                            setShowCompanyDropdown(true)
                                        }
                                        placeholder="Search for a company..."
                                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-moss-500 focus:ring-2 focus:ring-moss-500"
                                        autoComplete="off"
                                    />
                                    <input
                                        type="hidden"
                                        name="company_id"
                                        value={formData.company_id}
                                    />

                                    {showCompanyDropdown &&
                                        filteredCompanies.length > 0 && (
                                            <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                                                {filteredCompanies.map(
                                                    (company: Company) => (
                                                        <button
                                                            key={company.id}
                                                            type="button"
                                                            onClick={() =>
                                                                handleCompanySelect(
                                                                    company,
                                                                )
                                                            }
                                                            className="w-full px-4 py-2 text-left transition-colors hover:bg-moss-50"
                                                        >
                                                            {
                                                                company.company_name
                                                            }
                                                        </button>
                                                    ),
                                                )}
                                            </div>
                                        )}
                                    {errors.company_id && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.company_id}
                                        </p>
                                    )}
                                </div>

                                {showReferralCode && (
                                    <div className="mt-4">
                                        <label className="mb-1 block text-sm font-medium text-gray-700">
                                            Referral Code
                                        </label>
                                        <input
                                            type="text"
                                            name="referral_code"
                                            value={formData.referral_code}
                                            onChange={handleChange}
                                            placeholder="Enter referral code (optional)"
                                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-moss-500 focus:ring-2 focus:ring-moss-500"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Patient Details - Conditional for individual/company_referral */}
                        {(formData.type === 'individual' ||
                            formData.type === 'company_referral') && (
                            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                                    <Users className="h-5 w-5 text-moss-600" />
                                    Patient Medical Details *
                                </h2>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {/* Birthdate & Age */}
                                    <div className="md:col-span-2">
                                        <label className="mb-2 block text-sm font-medium text-gray-700">
                                            Birthdate *
                                        </label>
                                        <div className="flex gap-3">
                                            <input
                                                type="date"
                                                name="birthdate"
                                                max={
                                                    new Date()
                                                        .toISOString()
                                                        .split('T')[0]
                                                }
                                                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-moss-500 focus:ring-2 focus:ring-moss-500"
                                                onChange={handleChange}
                                            />
                                            <div className="flex min-w-[100px] items-center rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-800">
                                                Age:{' '}
                                                <span id="calculatedAge">
                                                    {' '}
                                                    -{' '}
                                                </span>
                                            </div>
                                        </div>
                                        {errors.birthdate && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.birthdate}
                                            </p>
                                        )}
                                    </div>

                                    {/* Sex */}
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-700">
                                            Sex *
                                        </label>
                                        <select
                                            name="sex"
                                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-moss-500 focus:ring-2 focus:ring-moss-500"
                                            onChange={handleChange}
                                        >
                                            <option value="">Select sex</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">
                                                Female
                                            </option>
                                        </select>
                                        {errors.sex && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.sex}
                                            </p>
                                        )}
                                    </div>

                                    {/* Civil Status */}
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-700">
                                            Civil Status *
                                        </label>
                                        <select
                                            name="civil_status"
                                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-moss-500 focus:ring-2 focus:ring-moss-500"
                                            onChange={handleChange}
                                        >
                                            <option value="">
                                                Select civil status
                                            </option>
                                            <option value="Single">
                                                Single
                                            </option>
                                            <option value="Married">
                                                Married
                                            </option>
                                            <option value="Divorced">
                                                Divorced
                                            </option>
                                            <option value="Widowed">
                                                Widowed
                                            </option>
                                        </select>
                                        {errors.civil_status && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.civil_status}
                                            </p>
                                        )}
                                    </div>

                                    {/* Address */}
                                    <div className="md:col-span-2">
                                        <label className="mb-1 block text-sm font-medium text-gray-700">
                                            Address *
                                        </label>
                                        <textarea
                                            name="address"
                                            rows={2}
                                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-moss-500 focus:ring-2 focus:ring-moss-500"
                                            placeholder="Complete address"
                                            onChange={handleChange}
                                        />
                                        {errors.address && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.address}
                                            </p>
                                        )}
                                    </div>

                                    {/* Emergency Contact */}
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-700">
                                            Emergency Contact Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="emergency_contact_name"
                                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-moss-500 focus:ring-2 focus:ring-moss-500"
                                            placeholder="Emergency contact full name"
                                            onChange={handleChange}
                                        />
                                        {errors.emergency_contact_name && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.emergency_contact_name}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-700">
                                            Emergency Contact Number *
                                        </label>
                                        <input
                                            type="tel"
                                            name="emergency_contact_no"
                                            maxLength={11}
                                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-moss-500 focus:ring-2 focus:ring-moss-500"
                                            placeholder="09XXXXXXXXX"
                                            onChange={handleChange}
                                        />
                                        {errors.emergency_contact_no && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.emergency_contact_no}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Service Type */}
                        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-lg font-semibold">
                                Service Type
                            </h2>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Select Service *
                                </label>
                                <select
                                    name="service_type"
                                    value={formData.service_type}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-moss-500 focus:ring-2 focus:ring-moss-500"
                                >
                                    <option value="">Select a service</option>
                                    {(
                                        Object.entries(serviceTypes) as [
                                            string,
                                            string,
                                        ][]
                                    ).map(([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                                {errors.service_type && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.service_type}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Appointment Date */}
                        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-lg font-semibold">
                                Schedule
                            </h2>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Preferred Date & Time *
                                </label>
                                <input
                                    type="datetime-local"
                                    name="appointment_date"
                                    value={formData.appointment_date}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-moss-500 focus:ring-2 focus:ring-moss-500"
                                />
                                {errors.appointment_date && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.appointment_date}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-lg font-semibold">
                                Additional Information
                            </h2>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Notes (Optional)
                                </label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder="Any special requests or information..."
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-moss-500 focus:ring-2 focus:ring-moss-500"
                                />
                            </div>
                        </div>

                        {/* Error Message */}
                        {errors.general && (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                                {errors.general}
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex justify-end gap-4">
                            <Link
                                href="/admin/appointments"
                                className="rounded-lg border border-gray-300 px-6 py-2 text-gray-700 transition-colors hover:bg-gray-50"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex items-center gap-2 rounded-lg bg-moss-600 px-6 py-2 text-white transition-colors hover:bg-moss-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Save className="h-4 w-4" />
                                {isSubmitting
                                    ? 'Creating...'
                                    : 'Create Appointment'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

AdminCreateAppointment.layout = (page: any) => {
    return <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
};
