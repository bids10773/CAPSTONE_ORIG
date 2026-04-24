import { useState, useEffect } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Calendar, ArrowLeft, Save, Users, FileText, Upload, HeartPulse } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { AvailableDoctor, Doctor, DoctorAvailabilityResponse } from '@/types/availability';


interface Company {
  id: number;
  company_name: string;
}

export default function CreateAppointment() {
const { companies, serviceTypes, appointmentTypes, auth } = usePage().props as any;

const [doctors, setDoctors] = useState<Doctor[]>([]);
const [doctorAvailability, setDoctorAvailability] = useState<DoctorAvailabilityResponse | null>(null);
const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
const [selectedDayName, setSelectedDayName] = useState('');

const filteredAppointmentTypes = Object.entries(appointmentTypes).filter(
  ([value]) => {
    if (auth.user.role !== 'company') {
      return value !== 'company_bulk'; // ❌ hide for non-company
    }
    return true; // ✅ show all for company
  }
);

  const [formData, setFormData] = useState({
    doctor_id: '',
    start_time: '',
    type: 'individual',
    company_id: '',
    appointment_date: '',
    service_types: [] as string[],
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
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>(companies || []);
  const [calculatedAge, setCalculatedAge] = useState('-');
  const [selectedCompanyName, setSelectedCompanyName] = useState('');

  
 ///TIME FORMAT 

  const formatTime = (time: string) => {
  const [hour, minute] = time.split(':').map(Number);

  const suffix = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;

  return `${formattedHour}:${minute.toString().padStart(2, '0')} ${suffix}`;
};

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

  // ✅ HANDLE MULTIPLE CHECKBOX (SERVICE TYPES)
  if (type === 'checkbox' && name === 'service_types') {
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      service_types: checked
        ? [...prev.service_types, value]
        : prev.service_types.filter((v) => v !== value),
    }));

    return;
  }

  setFormData((prev) => ({
    ...prev,
    [name]: type === 'checkbox'
      ? (e.target as HTMLInputElement).checked
      : value,
  }));

  // Age calculation
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

  const fetchDoctors = async () => {
    setIsLoadingDoctors(true);
    try {
      const response = await fetch('/api/doctors');
      if (!response.ok) throw new Error('Failed to fetch doctors');
      const data: Doctor[] = await response.json();
      setDoctors(data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setIsLoadingDoctors(false);
    }
  };

  const fetchDoctorAvailability = async (doctorId: string, date?: string) => {
    setIsLoadingAvailability(true);
    try {
      const url = `/api/doctors/${doctorId}/availability${date ? `?date=${date}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch availability');
      const data: DoctorAvailabilityResponse = await response.json();
      setDoctorAvailability(data);
      
      if (date) {
        const dayDate = new Date(date);
        setSelectedDayName(dayDate.toLocaleDateString('en-US', { weekday: 'long' }));
      }
    } catch (error) {
      console.error('Error fetching doctor availability:', error);
      setDoctorAvailability(null);
      setErrors(prev => ({ ...prev, doctor_id: 'Doctor not available' }));
    } finally {
      setIsLoadingAvailability(false);
    }
  };

  // Load all doctors on mount
  useEffect(() => {
    fetchDoctors();
  }, []);

  // Fetch availability when doctor or date changes
  useEffect(() => {
    if (formData.doctor_id) {
      fetchDoctorAvailability(formData.doctor_id, formData.appointment_date || undefined);
    } else {
      setDoctorAvailability(null);
    }
  }, [formData.doctor_id, formData.appointment_date]);

  useEffect(() => {
  if (!formData.start_time || !formData.appointment_date) return;

  const now = new Date();
  const selectedDate = new Date(formData.appointment_date);

  if (selectedDate.toDateString() === now.toDateString()) {
    const [h, m] = formData.start_time.split(':').map(Number);
    const selectedTime = new Date();
    selectedTime.setHours(h, m, 0, 0);

    if (selectedTime <= now) {
      setFormData((prev) => ({ ...prev, start_time: '' }));
    }
  }
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

  const add30Minutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m + 30);

  return date.toTimeString().slice(0,5);
};

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

router.post('/appointments', formData, {
  onSuccess: () => {
    setIsSubmitting(false);

    // optional: reset form
    setFormData({
      doctor_id: '',
      start_time: '',
      type: 'individual',
      company_id: '',
      appointment_date: '',
      service_types: [],
      notes: '',
      birthdate: '',
      sex: '',
      civil_status: '',
      address: '',
      emergency_contact_name: '',
      emergency_contact_no: '',
    });
  },
  onError: (errors: any) => {
    setErrors(errors);
    setIsSubmitting(false);
  },
  preserveScroll: true,
});
  };

  const showCompanyField = formData.type === 'company_referral' || formData.type === 'company_bulk';
  const showPatientDetails = formData.type === 'individual' || formData.type === 'company_referral';
console.log(doctorAvailability);
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

        <div className="w-full">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Appointment Type */}
             
            <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Appointment Type
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(filteredAppointmentTypes as [string, string][]).map(([value, label]) => (
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
  </div>
            )}

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
                  disabled={isLoadingDoctors}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {isLoadingDoctors ? 'Loading doctors...' : 'Select a doctor first'}
                  </option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id.toString()}>
                      Dr. {doctor.first_name} {doctor.last_name}
                      {doctor.specialization && ` - ${doctor.specialization}`}
                    </option>
                  ))}
                </select>
                {errors.doctor_id && <p className="mt-1 text-sm text-red-600">{errors.doctor_id}</p>}
                {!doctorAvailability && !isLoadingAvailability && formData.doctor_id && (
                  <p className="mt-1 text-sm text-yellow-600">No availability for this doctor. Please select another doctor.</p>
                )}
                {errors.doctor_id && <p className="mt-1 text-sm text-red-600">{errors.doctor_id}</p>}
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
                    <select
                      name="appointment_date"
                      value={formData.appointment_date}
                      onChange={handleChange}
                      disabled={!doctorAvailability || isLoadingAvailability}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {isLoadingAvailability ? 'Loading dates...' : doctorAvailability ? 'Select available date' : 'Select doctor first'}
                      </option>
                      {doctorAvailability?.availableDates
  .filter((date) => {
    const today = new Date();
    const checkDate = new Date(date);

    return checkDate >= new Date(today.toDateString());
  })
  .map((date) => (
    <option key={date} value={date}>
      {new Date(date).toLocaleDateString()}
    </option>
))}
                    </select>
                    {errors.appointment_date && <p className="mt-1 text-sm text-red-600">{errors.appointment_date}</p>}
                  </div>
                  <div>
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
    Time *
  </label>

  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
    {doctorAvailability?.availableTimes
  ?.filter((time) => {
    if (!formData.appointment_date) return true;

    const now = new Date();
    const selectedDate = new Date(formData.appointment_date);

    // if not today → allow all times
    if (selectedDate.toDateString() !== now.toDateString()) {
      return true;
    }

    

    const [hour, minute] = time.split(':').map(Number);
    const timeDate = new Date();
    timeDate.setHours(hour, minute, 0, 0);

    return timeDate > now;
  })
  .map((time) => {
    const isSelected = formData.start_time === time;

    return (
      <button
  key={time}
  type="button"
  onClick={() =>
    setFormData((prev) => ({ ...prev, start_time: time }))
  }
  className={`
    flex flex-col items-center justify-center
    px-3 py-3 rounded-xl text-sm font-medium transition border
    min-h-[70px]
    ${
      isSelected
        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
        : 'bg-white dark:bg-neutral-800 text-gray-800 dark:text-gray-200 border-gray-300 hover:border-blue-500 hover:text-blue-600'
    }
  `}
>
  <span className="text-base font-semibold">
    {formatTime(time)}
  </span>
  <span className="text-xs opacity-70">
    – {formatTime(add30Minutes(time))}
  </span>
</button>
    );
  })}
  </div>

  {errors.start_time && (
    <p className="mt-1 text-sm text-red-600">{errors.start_time}</p>
  )}
</div>
                </div>
              </div>
            </div>

            

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
              </div>
            )}

            {/* Service Type */}
<div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 p-6">
  <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
    Service Type (Select one or more)
  </h2>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
    {(Object.entries(serviceTypes) as [string, string][]).map(([value, label]) => (
      <label
        key={value}
        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition
        ${
          formData.service_types.includes(value)
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
            : 'border-gray-200 dark:border-neutral-700 hover:border-gray-300'
        }`}
      >
        <input
          type="checkbox"
          name="service_types"
          value={value}
          checked={formData.service_types.includes(value)}
          onChange={handleChange}
          className="w-4 h-4"
        />
        <span className="text-gray-800 dark:text-gray-200">{label}</span>
      </label>
    ))}
  </div>

  {errors.service_types && (
    <p className="mt-1 text-sm text-red-600">{errors.service_types}</p>
  )}
</div>


{/* NOTE SECTION */}
<div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4">
  <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">
    NOTE:
  </p>
  <p className="text-sm text-gray-700 dark:text-gray-300">
    Bring 1x1 I.D. picture and stool sample.
  </p>

  <p className="text-sm text-gray-800 dark:text-gray-200 font-medium mt-2">
    PAALALA:
  </p>
  <p className="text-sm text-gray-700 dark:text-gray-300">
    Magdala ng 1x1 I.D. na litrato at dumi.
  </p>
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

