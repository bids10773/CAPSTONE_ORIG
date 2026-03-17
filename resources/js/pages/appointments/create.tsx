import { useState, useEffect } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Calendar, ArrowLeft, Save, Users, FileText, Upload, HeartPulse } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { AvailableDoctor } from '@/types';

interface Company {
  id: number;
  company_name: string;
}

export default function CreateAppointment() {
const { companies, serviceTypes, appointmentTypes } = usePage().props as any;

const [availableDoctors, setAvailableDoctors] = useState<AvailableDoctor[]>([]);
const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
const [selectedDayName, setSelectedDayName] = useState('');

  const [formData, setFormData] = useState({
    doctor_id: '',
    start_time: '',
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
    // Medical history
    present_illness: '',
    past_medical_history: '',
    operations_accidents: '',
    family_history: '',
    allergies: '',
    personal_social_history: '',
    ob_menstrual_history: '',
  });

  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companySearch, setCompanySearch] = useState('');
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>(companies || []);
  const [calculatedAge, setCalculatedAge] = useState('-');
  const [selectedCompanyName, setSelectedCompanyName] = useState('');

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));

    // Calculate age from birthdate
    if (name === 'birthdate' && value) {
      const birthDate = new Date(value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      setCalculatedAge(age.toString());
    } else if (name === 'birthdate') {
      setCalculatedAge('-');
    }

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const fetchAvailableDoctors = async () => {
    if (!formData.appointment_date) {
      setAvailableDoctors([]);
      setSelectedDayName('');
      return;
    }

    setIsLoadingDoctors(true);
    try {
      const date = formData.appointment_date;
      const dayDate = new Date(date);
      const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'long' });
      setSelectedDayName(dayName);

      const response = await fetch(`/api/available-doctors?date=${date}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const doctors: AvailableDoctor[] = await response.json();
      setAvailableDoctors(doctors);
      if (doctors.length === 0) {
        setErrors(prev => ({ ...prev, doctor_id: `No doctors available on ${dayName}` }));
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setErrors(prev => ({ ...prev, doctor_id: 'Error loading available doctors' }));
      setAvailableDoctors([]);
    } finally {
      setIsLoadingDoctors(false);
    }
  };

  useEffect(() => {
    fetchAvailableDoctors();
  }, [formData.appointment_date]);

  const handleCompanySelect = (company: Company) => {
    setFormData((prev) => ({ ...prev, company_id: company.id.toString() }));
    setCompanySearch(company.company_name);
    setSelectedCompanyName(company.company_name);
    setShowCompanyDropdown(false);

    if (errors.company_id) {
      setErrors((prev) => ({ ...prev, company_id: '' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

router.post('/appointments', formData, {
      onError: (errors: any) => {
        setErrors(errors);
        setIsSubmitting(false);
      },
      preserveScroll: true,
    });
  };

  const showCompanyField = formData.type === 'company_referral' || formData.type === 'company_bulk';
  const showReferralCode = formData.type === 'company_referral';
  const showPatientDetails = formData.type === 'individual' || formData.type === 'company_referral';

  return (
    <>
      <Head title="Book Appointment" />

      <div className="p-6 bg-gray-50 dark:bg-neutral-950 min-h-screen">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/appointments" className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-neutral-800 transition">
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-600" />
              Book Appointment
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Schedule a medical appointment
            </p>
          </div>
        </div>

        <div className="max-w-3xl">
          <form onSubmit={handleSubmit} className="space-y-6">
  {/* Doctor & Time Selection */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Doctor Selection */}
              <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  Select Doctor {selectedDayName && `- Available on ${selectedDayName}`}
                </h2>
                <select
                  name="doctor_id"
                  value={formData.doctor_id}
                  onChange={handleChange}
                  disabled={!formData.appointment_date || isLoadingDoctors}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {isLoadingDoctors ? 'Loading available doctors...' : formData.appointment_date ? 'Choose available doctor...' : 'Select date first'}
                  </option>
                  {availableDoctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      Dr. {doctor.first_name} {doctor.last_name}
                      {doctor.specialization && ` - ${doctor.specialization}`}
                      {doctor.free_slots !== undefined && ` (${doctor.free_slots} slots left)`}
                    </option>
                  ))}
                </select>
                {errors.doctor_id && <p className="mt-1 text-sm text-red-600">{errors.doctor_id}</p>}
                {formData.appointment_date && availableDoctors.length === 0 && !isLoadingDoctors && (
                  <p className="mt-1 text-sm text-yellow-600">No doctors available on this day. Try another date.</p>
                )}
              </div>

              {/* Date & Time */}
              <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Date & Time
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      name="appointment_date"
                      value={formData.appointment_date}
                      onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.appointment_date && <p className="mt-1 text-sm text-red-600">{errors.appointment_date}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Time *
                    </label>
                    <input
                      type="time"
                      name="start_time"
                      value={formData.start_time}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.start_time && <p className="mt-1 text-sm text-red-600">{errors.start_time}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Appointment Type */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Appointment Type
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(Object.entries(appointmentTypes) as [string, string][]).map(([value, label]) => (
                  <label
                    key={value}
                    className={`relative flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
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
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {label}
                      </span>
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

            {/* Patient Details & Medical History - for individual/company_referral */}
            {showPatientDetails && (
              <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Patient Medical Details *
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Birthdate & Age */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Birthdate *
                    </label>
                    <div className="flex gap-3 items-center">
                      <input
                        type="date"
                        name="birthdate"
                        value={formData.birthdate}
                        onChange={handleChange}
                        max={new Date().toISOString().split('T')[0]}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <div className="px-4 py-2 bg-gray-100 dark:bg-neutral-800 rounded-lg text-sm font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">
                        Age: {calculatedAge}
                      </div>
                    </div>
                    {errors.birthdate && (
                      <p className="mt-1 text-sm text-red-600">{errors.birthdate}</p>
                    )}
                  </div>

                  {/* Sex */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Sex *
                    </label>
                    <select
                      name="sex"
                      value={formData.sex}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select sex</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                    {errors.sex && <p className="mt-1 text-sm text-red-600">{errors.sex}</p>}
                  </div>

                  {/* Civil Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Civil Status *
                    </label>
                    <select
                      name="civil_status"
                      value={formData.civil_status}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select civil status</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                    {errors.civil_status && <p className="mt-1 text-sm text-red-600">{errors.civil_status}</p>}
                  </div>

                  {/* Address */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Address *
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Complete address"
                    />
                    {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                  </div>

                  {/* Emergency Contact Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Emergency Contact Name *
                    </label>
                    <input
                      type="text"
                      name="emergency_contact_name"
                      value={formData.emergency_contact_name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Full name"
                    />
                    {errors.emergency_contact_name && <p className="mt-1 text-sm text-red-600">{errors.emergency_contact_name}</p>}
                  </div>

                  {/* Emergency Contact Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Emergency Contact Number *
                    </label>
                    <input
                      type="tel"
                      name="emergency_contact_no"
                      value={formData.emergency_contact_no}
                      onChange={handleChange}
                      maxLength={11}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="09XXXXXXXXX"
                    />
                    {errors.emergency_contact_no && <p className="mt-1 text-sm text-red-600">{errors.emergency_contact_no}</p>}
                  </div>

                </div>

                {/* Medical History Section */}
                <div className="mt-8 pt-8 border-t border-gray-200 dark:border-neutral-700">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                    <HeartPulse className="w-5 h-5 text-red-500" />
                    Medical History
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    Please provide your medical history (optional but recommended for Full PME)
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Present Illness
                      </label>
                      <textarea
                        name="present_illness"
                        value={formData.present_illness}
                        onChange={handleChange}
                        rows={3}
                        className="w-full p-3 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Current complaints or symptoms..."
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Past Medical History
                      </label>
                      <textarea
                        name="past_medical_history"
                        value={formData.past_medical_history}
                        onChange={handleChange}
                        rows={3}
                        className="w-full p-3 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Previous illnesses, hospitalizations..."
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Operations / Accidents
                      </label>
                      <textarea
                        name="operations_accidents"
                        value={formData.operations_accidents}
                        onChange={handleChange}
                        rows={2}
                        className="w-full p-3 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Surgeries, major injuries..."
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Family History
                      </label>
                      <textarea
                        name="family_history"
                        value={formData.family_history}
                        onChange={handleChange}
                        rows={2}
                        className="w-full p-3 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Hereditary conditions in family..."
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Allergies
                      </label>
                      <textarea
                        name="allergies"
                        value={formData.allergies}
                        onChange={handleChange}
                        rows={2}
                        className="w-full p-3 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Medications, food, environmental allergies..."
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Personal / Social History
                      </label>
                      <textarea
                        name="personal_social_history"
                        value={formData.personal_social_history}
                        onChange={handleChange}
                        rows={3}
                        className="w-full p-3 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Smoking, alcohol use, exercise habits, occupation..."
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        OB / Menstrual History (Female patients)
                      </label>
                      <textarea
                        name="ob_menstrual_history"
                        value={formData.ob_menstrual_history}
                        onChange={handleChange}
                        rows={3}
                        className="w-full p-3 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Gravida/Para, menstrual cycle details..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Service Type */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Service Type
              </h2>

              <select
                name="service_type"
                value={formData.service_type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a service</option>
                {(Object.entries(serviceTypes) as [string, string][]).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>

              {errors.service_type && (
                <p className="mt-1 text-sm text-red-600">{errors.service_type}</p>
              )}
            </div>



            {/* Notes */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Additional Information
              </h2>

              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Any special requests or information..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-4">
              <Link
                href="/appointments"
                className="px-6 py-2 border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? 'Booking...' : 'Book Appointment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

CreateAppointment.layout = (page: any) => {
  return <AppLayout>{page}</AppLayout>;
};

