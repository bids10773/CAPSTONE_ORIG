import { useState, useEffect } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Calendar, ArrowLeft, Save, Upload, FileText, Users } from 'lucide-react';
import { Link } from '@inertiajs/react';
import type { BreadcrumbItem, SharedData } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Create Appointment',
        href: "",
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

    const [errors, setErrors] = useState<Record<string, string | undefined>>({});
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
                c.company_name.toLowerCase().includes(companySearch.toLowerCase())
            );
            setFilteredCompanies(filtered);
        } else {
            setFilteredCompanies(companies || []);
        }
    }, [companySearch, companies]);

    // Filter patients based on search
    useEffect(() => {
        if (patientSearch) {
            const filtered = (patients || []).filter((p: Patient) =>
                `${p.first_name} ${p.last_name}`.toLowerCase().includes(patientSearch.toLowerCase()) ||
                p.email.toLowerCase().includes(patientSearch.toLowerCase())
            );
            setFilteredPatients(filtered);
        } else {
            setFilteredPatients(patients || []);
        }
    }, [patientSearch, patients]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        
        // Reset company_id when type changes to individual
        if (name === 'type' && value === 'individual') {
            setFormData((prev) => ({ ...prev, company_id: '', referral_code: '' }));
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
        setPatientSearch(`${patient.first_name} ${patient.last_name} (${patient.email})`);
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

    const showCompanyField = formData.type === 'company_referral' || formData.type === 'company_bulk';
    const showReferralCode = formData.type === 'company_referral';

    return (
        <>
            <Head title="Create Appointment - Admin" />

            <div className="p-6">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Link
                        href="/admin/appointments"
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Calendar className="w-6 h-6" />
                            Create Appointment
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Schedule an appointment for a patient
                        </p>
                    </div>
                </div>

                <div className="max-w-3xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Patient Selection */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Patient Information
                            </h2>
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    autoComplete="off"
                                />
                                <input type="hidden" name="patient_id" value={formData.patient_id} />
                                
                                {showPatientDropdown && filteredPatients.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                        {filteredPatients.map((patient: Patient) => (
                                            <button
                                                key={patient.id}
                                                type="button"
                                                onClick={() => handlePatientSelect(patient)}
                                                className="w-full px-4 py-2 text-left hover:bg-blue-50 transition-colors"
                                            >
                                                <p className="font-medium">{patient.first_name} {patient.last_name}</p>
                                                <p className="text-sm text-gray-500">{patient.email}</p>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {errors.patient_id && (
                                    <p className="mt-1 text-sm text-red-600">{errors.patient_id}</p>
                                )}
                            </div>
                        </div>

                        {/* Appointment Type */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Appointment Type
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {(Object.entries(appointmentTypes) as [string, string][]).map(([value, label]) => (
                                    <label
                                        key={value}
                                        className={`relative flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                            formData.type === value
                                                ? 'border-blue-500 bg-blue-50'
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
                                            {value === 'individual' && <Users className="w-6 h-6 mx-auto mb-2 text-gray-600" />}
                                            {value === 'company_referral' && <FileText className="w-6 h-6 mx-auto mb-2 text-gray-600" />}
                                            {value === 'company_bulk' && <Upload className="w-6 h-6 mx-auto mb-2 text-gray-600" />}
                                            <span className="text-sm font-medium">{label}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Company Selection (for Referral/Bulk) */}
                        {showCompanyField && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h2 className="text-lg font-semibold mb-4">Company Information</h2>
                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                        onFocus={() => setShowCompanyDropdown(true)}
                                        placeholder="Search for a company..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        autoComplete="off"
                                    />
                                    <input type="hidden" name="company_id" value={formData.company_id} />
                                    
                                    {showCompanyDropdown && filteredCompanies.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                            {filteredCompanies.map((company: Company) => (
                                                <button
                                                    key={company.id}
                                                    type="button"
                                                    onClick={() => handleCompanySelect(company)}
                                                    className="w-full px-4 py-2 text-left hover:bg-blue-50 transition-colors"
                                                >
                                                    {company.company_name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {errors.company_id && (
                                        <p className="mt-1 text-sm text-red-600">{errors.company_id}</p>
                                    )}
                                </div>

                                {showReferralCode && (
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Referral Code
                                        </label>
                                        <input
                                            type="text"
                                            name="referral_code"
                                            value={formData.referral_code}
                                            onChange={handleChange}
                                            placeholder="Enter referral code (optional)"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Patient Details - Conditional for individual/company_referral */}
                        {(formData.type === 'individual' || formData.type === 'company_referral') && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-blue-600" />
                                    Patient Medical Details *
                                </h2>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    
                                    {/* Birthdate & Age */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Birthdate *
                                        </label>
                                        <div className="flex gap-3">
                                            <input
                                                type="date"
                                                name="birthdate"
                                                max={new Date().toISOString().split('T')[0]}
                                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                onChange={handleChange}
                                            />
                                            <div className="flex items-center px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-800 min-w-[100px]">
                                                Age: <span id="calculatedAge"> - </span>
                                            </div>
                                        </div>
                                        {errors.birthdate && (
                                            <p className="mt-1 text-sm text-red-600">{errors.birthdate}</p>
                                        )}
                                    </div>

                                    {/* Sex */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Sex *
                                        </label>
                                        <select
                                            name="sex"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            onChange={handleChange}
                                        >
                                            <option value="">Select sex</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                        </select>
                                        {errors.sex && (
                                            <p className="mt-1 text-sm text-red-600">{errors.sex}</p>
                                        )}
                                    </div>

                                    {/* Civil Status */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Civil Status *
                                        </label>
                                        <select
                                            name="civil_status"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            onChange={handleChange}
                                        >
                                            <option value="">Select civil status</option>
                                            <option value="Single">Single</option>
                                            <option value="Married">Married</option>
                                            <option value="Divorced">Divorced</option>
                                            <option value="Widowed">Widowed</option>
                                        </select>
                                        {errors.civil_status && (
                                            <p className="mt-1 text-sm text-red-600">{errors.civil_status}</p>
                                        )}
                                    </div>

                                    {/* Address */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Address *
                                        </label>
                                        <textarea
                                            name="address"
                                            rows={2}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Complete address"
                                            onChange={handleChange}
                                        />
                                        {errors.address && (
                                            <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                                        )}
                                    </div>

                                    {/* Emergency Contact */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Emergency Contact Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="emergency_contact_name"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Emergency contact full name"
                                            onChange={handleChange}
                                        />
                                        {errors.emergency_contact_name && (
                                            <p className="mt-1 text-sm text-red-600">{errors.emergency_contact_name}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Emergency Contact Number *
                                        </label>
                                        <input
                                            type="tel"
                                            name="emergency_contact_no"
                                            maxLength={11}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="09XXXXXXXXX"
                                            onChange={handleChange}
                                        />
                                        {errors.emergency_contact_no && (
                                            <p className="mt-1 text-sm text-red-600">{errors.emergency_contact_no}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Service Type */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold mb-4">Service Type</h2>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Select Service *
                                </label>
                                <select
                                    name="service_type"
                                    value={formData.service_type}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Select a service</option>
                                    {(Object.entries(serviceTypes) as [string, string][]).map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                                {errors.service_type && (
                                    <p className="mt-1 text-sm text-red-600">{errors.service_type}</p>
                                )}
                            </div>
                        </div>

                        {/* Appointment Date */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold mb-4">Schedule</h2>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Preferred Date & Time *
                                </label>
                                <input
                                    type="datetime-local"
                                    name="appointment_date"
                                    value={formData.appointment_date}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                {errors.appointment_date && (
                                    <p className="mt-1 text-sm text-red-600">{errors.appointment_date}</p>
                                )}
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold mb-4">Additional Information</h2>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notes (Optional)
                                </label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder="Any special requests or information..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {/* Error Message */}
                        {errors.general && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                {errors.general}
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex justify-end gap-4">
                            <Link
                                href="/admin/appointments"
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save className="w-4 h-4" />
                                {isSubmitting ? 'Creating...' : 'Create Appointment'}
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

