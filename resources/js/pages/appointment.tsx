import { useState, useEffect } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Calendar, ArrowLeft, Save, Upload, FileText, Users } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';

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
        birthdate: '',
        sex: '',
        civil_status: '',
        address: '',
        emergency_contact_name: '',
        emergency_contact_no: '',
    });

    const [errors, setErrors] = useState<Record<string, string | undefined>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [companySearch, setCompanySearch] = useState('');
    const [patientSearch, setPatientSearch] = useState('');
    const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
    const [showPatientDropdown, setShowPatientDropdown] = useState(false);
    const [filteredCompanies, setFilteredCompanies] = useState(companies || []);
    const [filteredPatients, setFilteredPatients] = useState(patients || []);

    // Calculate dynamic age
    const calculatedAge = formData.birthdate
        ? Math.floor(
              (new Date().getTime() - new Date(formData.birthdate).getTime()) /
                  (1000 * 60 * 60 * 24 * 365.25)
          )
        : '';

    useEffect(() => {
        setFilteredCompanies(
            companySearch
                ? companies.filter((c: Company) =>
                      c.company_name.toLowerCase().includes(companySearch.toLowerCase())
                  )
                : companies
        );
    }, [companySearch, companies]);

    useEffect(() => {
        setFilteredPatients(
            patientSearch
                ? patients.filter((p: Patient) =>
                      `${p.first_name} ${p.last_name}`
                          .toLowerCase()
                          .includes(patientSearch.toLowerCase()) ||
                      p.email.toLowerCase().includes(patientSearch.toLowerCase())
                  )
                : patients
        );
    }, [patientSearch, patients]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        if (name === 'type' && value === 'individual') {
            setFormData((prev) => ({ ...prev, company_id: '', referral_code: '' }));
        }

        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const handleCompanySelect = (company: Company) => {
        setFormData((prev) => ({ ...prev, company_id: company.id.toString() }));
        setCompanySearch(company.company_name);
        setShowCompanyDropdown(false);
        if (errors.company_id) setErrors((prev) => ({ ...prev, company_id: '' }));
    };

    const handlePatientSelect = (patient: Patient) => {
        setFormData((prev) => ({ ...prev, patient_id: patient.id.toString() }));
        setPatientSearch(`${patient.first_name} ${patient.last_name} (${patient.email})`);
        setShowPatientDropdown(false);
        if (errors.patient_id) setErrors((prev) => ({ ...prev, patient_id: '' }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

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
            <div className="p-6 bg-gray-50 dark:bg-neutral-900 min-h-screen animate-fade-in">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Link
                        href="/admin/appointments"
                        className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-neutral-800 transition"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Calendar className="w-6 h-6 text-blue-600" />
                            Create Appointment
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Schedule an appointment for a patient
                        </p>
                    </div>
                </div>

                <motion.form
                    onSubmit={handleSubmit}
                    className="max-w-3xl space-y-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Patient Selection */}
                    <motion.div
                        className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-gray-200 dark:border-neutral-700 p-6"
                        whileHover={{ scale: 1.02 }}
                    >
                        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-600" /> Patient Information
                        </h2>

                        <div className="relative">
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
                                className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-900 dark:text-white transition"
                            />
                            <input type="hidden" name="patient_id" value={formData.patient_id} />

                            <AnimatePresence>
                                {showPatientDropdown && filteredPatients.length > 0 && (
                                    <motion.div
                                        className="absolute z-10 w-full mt-1 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                    >
                                        {filteredPatients.map((patient: Patient) => (
                                            <button
                                                key={patient.id}
                                                type="button"
                                                onClick={() => handlePatientSelect(patient)}
                                                className="w-full px-4 py-2 text-left hover:bg-blue-50 dark:hover:bg-blue-900/30 transition"
                                            >
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {patient.first_name} {patient.last_name}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {patient.email}
                                                </p>
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            {errors.patient_id && (
                                <p className="mt-1 text-sm text-red-600">{errors.patient_id}</p>
                            )}
                        </div>
                    </motion.div>

                    {/* Appointment Type */}
                    <motion.div
                        className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-gray-200 dark:border-neutral-700 p-6"
                        whileHover={{ scale: 1.02 }}
                    >
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                            <FileText className="w-5 h-5 text-blue-600" /> Appointment Type
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {(Object.entries(appointmentTypes) as [string, string][]).map(([value, label]) => (
                                <label
                                    key={value}
                                    className={`relative flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                        formData.type === value
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                                            : 'border-gray-200 dark:border-neutral-700 hover:border-gray-300'
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
                                        {value === 'individual' && <Users className="w-6 h-6 mx-auto mb-2 text-gray-700 dark:text-gray-300" />}
                                        {value === 'company_referral' && <FileText className="w-6 h-6 mx-auto mb-2 text-gray-700 dark:text-gray-300" />}
                                        {value === 'company_bulk' && <Upload className="w-6 h-6 mx-auto mb-2 text-gray-700 dark:text-gray-300" />}
                                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </motion.div>

                    {/* Patient Birthdate & Age */}
                    <motion.div
                        className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-gray-200 dark:border-neutral-700 p-6"
                        whileHover={{ scale: 1.02 }}
                    >
                        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-600" /> Patient Details
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Birthdate *</label>
                                <div className="flex gap-3">
                                    <input
                                        type="date"
                                        name="birthdate"
                                        max={new Date().toISOString().split('T')[0]}
                                        onChange={handleChange}
                                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-900 dark:text-white transition"
                                    />
                                    <motion.div
                                        className="flex items-center px-4 py-2 bg-gray-100 dark:bg-neutral-800 rounded-lg text-sm font-medium text-gray-800 dark:text-gray-200 min-w-[100px]"
                                        animate={{ scale: [1, 1.05, 1] }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        Age: {calculatedAge || '-'}
                                    </motion.div>
                                </div>
                                {errors.birthdate && <p className="mt-1 text-sm text-red-600">{errors.birthdate}</p>}
                            </div>
                        </div>
                    </motion.div>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-4">
                        <Link
                            href="/admin/appointments"
                            className="px-6 py-2 border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
                        >
                            Cancel
                        </Link>
                        <motion.button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            whileTap={{ scale: 0.95 }}
                        >
                            <Save className="w-4 h-4" />
                            {isSubmitting ? 'Creating...' : 'Create Appointment'}
                        </motion.button>
                    </div>
                </motion.form>
            </div>
        </>
    );
}

AdminCreateAppointment.layout = (page: any) => <AppLayout>{page}</AppLayout>;
