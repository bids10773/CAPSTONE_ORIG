import React, { useState, useEffect } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Check, Calendar, Clock, User, FileText, Users, Upload, Stethoscope, Building2, HeartPulse, ClipboardList } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { Doctor, DoctorAvailabilityResponse } from '@/types/availability';

interface Company {
  id: number;
  company_name: string;
}

const STEPS = ['Doctor', 'Date & Time', 'Your Details', 'Confirm'];

export default function CreateAppointment() {
  const { companies, serviceTypes, appointmentTypes, auth } = usePage().props as any;

  console.log('AUTH:', auth);
console.log('USER:', auth?.user);
console.log('PATIENT PROFILE:', auth?.user?.patient_profile);

  const [currentStep, setCurrentStep] = useState(1);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorAvailability, setDoctorAvailability] = useState<DoctorAvailabilityResponse | null>(null);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [companySearch, setCompanySearch] = useState('');
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>(
  Array.isArray(companies) ? companies : []
);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const [formData, setFormData] = useState({
    doctor_id: '',
    start_time: '',
    type: 'individual',
    company_id: '',
    appointment_date: '',
    service_types: [] as string[],
    notes: '',
  });

  const filteredAppointmentTypes = Object.entries(appointmentTypes).filter(([value]) => {
    if (auth.user.role !== 'company') return value !== 'company_bulk';
    return true;
  }) as [string, string][];

  const showCompanyField = formData.type === 'company_referral' || formData.type === 'company_bulk';
  
  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':').map(Number);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minute.toString().padStart(2, '0')} ${suffix}`;
  };

  const add30Minutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m + 30);
    return date.toTimeString().slice(0, 5);
  };

  useEffect(() => {
    if (companySearch) {
      setFilteredCompanies((companies || []).filter((c: Company) =>
        c.company_name.toLowerCase().includes(companySearch.toLowerCase())
      ));
    } else {
      setFilteredCompanies(companies || []);
    }
  }, [companySearch, companies]);

  const fetchDoctors = async () => {
    setIsLoadingDoctors(true);
    try {
      const res = await fetch('/api/doctors');
      if (!res.ok) throw new Error();
      setDoctors(await res.json());
    } catch (error) {
    console.error('Failed to fetch doctors', error);
 }
    finally { setIsLoadingDoctors(false); }
  };

  const fetchDoctorAvailability = async (doctorId: string, date?: string) => {
    setIsLoadingAvailability(true);
    try {
      const url = `/api/doctors/${doctorId}/availability${date ? `?date=${date}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      setDoctorAvailability(await res.json());
    } catch (error) {
    console.error(error);
      setDoctorAvailability(null);
    } finally { setIsLoadingAvailability(false); }
  };

  useEffect(() => { fetchDoctors(); }, []);

  useEffect(() => {
    if (formData.doctor_id) {
      fetchDoctorAvailability(formData.doctor_id, formData.appointment_date || undefined);
    } else {
      setDoctorAvailability(null);
    }
  }, [formData.doctor_id, formData.appointment_date]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox' && name === 'service_types') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        service_types: checked ? [...prev.service_types, value] : prev.service_types.filter(v => v !== value),
      }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleCompanySelect = (company: Company) => {
    setFormData(prev => ({ ...prev, company_id: company.id.toString() }));
    setCompanySearch(company.company_name);
    setShowCompanyDropdown(false);
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    setErrors({});
    router.post('/appointments', formData, {
      onSuccess: () => setIsSubmitting(false),
      onError: (errs: any) => {
  console.log('VALIDATION ERRORS:', errs);

  setErrors(errs);
  setIsSubmitting(false);
},
      preserveScroll: true,
    });
  };


  const calculateAge = (birthdate: string) => {
    const birth = new Date(birthdate);
    const today = new Date();

    let age =
        today.getFullYear() - birth.getFullYear();

    const monthDiff =
        today.getMonth() - birth.getMonth();

    if (
        monthDiff < 0 ||
        (monthDiff === 0 &&
            today.getDate() < birth.getDate())
    ) {
        age--;
    }

    return age;
};
  const getSelectedDoctor = () => doctors.find(d => d.id.toString() === formData.doctor_id);

  const availableTimes = (doctorAvailability?.availableTimes || []).filter(time => {
    if (!formData.appointment_date) return true;
    const now = new Date();
    const selDate = new Date(formData.appointment_date);
    if (selDate.toDateString() !== now.toDateString()) return true;
    const [h, m] = time.split(':').map(Number);
    const t = new Date(); t.setHours(h, m, 0, 0);
    return t > now;
  });

  const availableDates = (doctorAvailability?.availableDates || []).filter(date => {
    const today = new Date();
    return new Date(date) >= new Date(today.toDateString());
  });

  // ─── TYPE ICONS ───────────────────────────────────────────────────────────
  const typeIcons: Record<string, React.ReactNode> = {
    individual: <User className="w-6 h-6" />,
    company_referral: <FileText className="w-6 h-6" />,
    company_bulk: <Upload className="w-6 h-6" />,
  };

  const typeLabels: Record<string, string> = {
    individual: 'Individual',
    company_referral: 'Company Referral',
    company_bulk: 'Company Bulk',
  };

  // ─── STEP COMPONENTS ──────────────────────────────────────────────────────

  const Step1 = () => (
    <div className="space-y-6">
      {/* Appointment Type */}
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
          Appointment type
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {filteredAppointmentTypes.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFormData(p => ({ ...p, type: value, company_id: '' }))}
              className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all text-center ${
                formData.type === value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600 text-gray-600 dark:text-gray-400 bg-white dark:bg-neutral-900'
              }`}
            >
              <span className={formData.type === value ? 'text-blue-500' : 'text-gray-400'}>
                {typeIcons[value] || <Users className="w-6 h-6" />}
              </span>
              <span className="text-sm font-semibold">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Company Search */}
      {showCompanyField && (
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
            <Building2 className="w-4 h-4" /> Company
          </label>
          <input
            type="text"
            value={companySearch}
            onChange={e => { setCompanySearch(e.target.value); setShowCompanyDropdown(true); }}
            onFocus={() => setShowCompanyDropdown(true)}
            placeholder="Search company name…"
            className="w-full px-4 py-3 border border-gray-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          {showCompanyDropdown && filteredCompanies.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl shadow-xl max-h-52 overflow-y-auto">
              {filteredCompanies.map((c: Company) => (
                <button key={c.id} type="button" onClick={() => handleCompanySelect(c)}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                  {c.company_name}
                </button>
              ))}
            </div>
          )}
          {errors.company_id && <p className="mt-1 text-xs text-red-500">{errors.company_id}</p>}
        </div>
      )}

      {/* Doctor Cards */}
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide flex items-center gap-1">
          <Stethoscope className="w-4 h-4" /> Choose your doctor
        </p>
        {isLoadingDoctors ? (
          <div className="flex items-center justify-center py-10 text-gray-400">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent mr-3"></div>
            Loading doctors…
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {doctors.map(doc => {
              const initials = `${doc.first_name?.[0] ?? ''}${doc.last_name?.[0] ?? ''}`.toUpperCase();
              const selected = formData.doctor_id === doc.id.toString();
              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, doctor_id: doc.id.toString(), appointment_date: '', start_time: '' }))}
                  className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                    selected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600 bg-white dark:bg-neutral-900'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    selected ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-300'
                  }`}>
                    {initials || '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                      Dr. {doc.first_name} {doc.last_name}
                    </p>
                    {doc.specialization && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{doc.specialization}</p>
                    )}
                  </div>
                  {selected && <Check className="w-5 h-5 text-blue-500 ml-auto flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
        {errors.doctor_id && <p className="mt-1 text-xs text-red-500">{errors.doctor_id}</p>}
      </div>

      {/* Services */}
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide flex items-center gap-1">
          <HeartPulse className="w-4 h-4" /> Services needed
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(Object.entries(serviceTypes) as [string, string][]).map(([value, label]) => {
            const checked = formData.service_types.includes(value);
            return (
              <label key={value} className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                checked
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600 bg-white dark:bg-neutral-900'
              }`}>
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  checked ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-neutral-600'
                }`}>
                  {checked && <Check className="w-3 h-3 text-white" />}
                </div>
                <input type="checkbox" name="service_types" value={value} checked={checked} onChange={handleChange} className="sr-only" />
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</span>
              </label>
            );
          })}
        </div>
        {errors.service_types && <p className="mt-1 text-xs text-red-500">{errors.service_types}</p>}
      </div>
    </div>
  );

  const Step2 = () => (
    <div className="space-y-6">
      {!formData.doctor_id && (
        <div className="text-center py-10 text-gray-400">
          <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Please select a doctor first (go back to step 1)</p>
        </div>
      )}

      {formData.doctor_id && (
        <>
          {/* Date Selection */}
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide flex items-center gap-1">
              <Calendar className="w-4 h-4" /> Available dates
            </p>
            {isLoadingAvailability ? (
              <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                Checking availability…
              </div>
            ) : availableDates.length === 0 ? (
              <p className="text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl px-4 py-3">
                No available dates for this doctor. Please go back and select a different doctor.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableDates.map(date => {
                  const d = new Date(date);
                  const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                  const dayNum = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  const selected = formData.appointment_date === date;
                  return (
                    <button
                      key={date}
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, appointment_date: date, start_time: '' }))}
                      className={`flex flex-col items-center px-4 py-3 rounded-xl border-2 transition-all min-w-[72px] ${
                        selected
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : 'border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-700 dark:text-gray-300 hover:border-blue-300'
                      }`}
                    >
                      <span className={`text-xs font-medium ${selected ? 'text-blue-100' : 'text-gray-400 dark:text-gray-500'}`}>{dayName}</span>
                      <span className="text-sm font-bold mt-0.5">{dayNum}</span>
                    </button>
                  );
                })}
              </div>
            )}
            {errors.appointment_date && <p className="mt-1 text-xs text-red-500">{errors.appointment_date}</p>}
          </div>

          {/* Time Selection */}
          {formData.appointment_date && (
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide flex items-center gap-1">
                <Clock className="w-4 h-4" /> Pick a time slot
              </p>
              {availableTimes.length === 0 ? (
                <p className="text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl px-4 py-3">
                  No available time slots for this date.
                </p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {availableTimes.map(time => {
                    const selected = formData.start_time === time;
                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, start_time: time }))}
                        className={`flex flex-col items-center py-3 px-2 rounded-xl border-2 transition-all ${
                          selected
                            ? 'border-blue-500 bg-blue-500 text-white'
                            : 'border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-700 dark:text-gray-300 hover:border-blue-300'
                        }`}
                      >
                        <span className="text-sm font-bold">{formatTime(time)}</span>
                        <span className={`text-xs mt-0.5 ${selected ? 'text-blue-100' : 'text-gray-400 dark:text-gray-500'}`}>
                          – {formatTime(add30Minutes(time))}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              {errors.start_time && <p className="mt-1 text-xs text-red-500">{errors.start_time}</p>}
            </div>
          )}
        </>
      )}
    </div>
  );

  const Step3 = () => {
    const profile = auth.user.patient_profile;

    console.log('STEP3 PROFILE:', profile);

    return (
        <div className="space-y-6">

            {/* PATIENT INFO */}
            <div>
                <p className="
                    text-sm font-medium
                    text-gray-500 dark:text-gray-400
                    mb-3 uppercase tracking-wide
                    flex items-center gap-1
                ">
                    <User className="w-4 h-4" />
                    Patient Information
                </p>

                <div className="
                    bg-gray-50 dark:bg-neutral-800/50
                    border border-gray-200 dark:border-neutral-700
                    rounded-2xl p-5
                ">
                    <div className="grid grid-cols-2 gap-4">

                        <div>
                            <p className="text-xs text-gray-400 mb-1">
                                Full Name
                            </p>

                            <p className="font-semibold text-gray-900 dark:text-white">
                                {auth.user.name}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs text-gray-400 mb-1">
                                Contact
                            </p>

                            <p className="font-semibold text-gray-900 dark:text-white">
                                {auth.user.contact}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs text-gray-400 mb-1">
                                Birthdate
                            </p>

                            <p className="font-semibold text-gray-900 dark:text-white">
    {profile?.birthdate
        ? new Date(String(profile.birthdate)).toLocaleDateString()
        : '—'}
</p>
                        </div>
                        <div>
    <p className="text-xs text-gray-400 mb-1">
        Age
    </p>

    <p className="font-semibold text-gray-900 dark:text-white">
        {profile?.birthdate
    ? `${calculateAge(String(profile.birthdate))} years old`
    : '—'}
    </p>
</div>

                        <div>
                            <p className="text-xs text-gray-400 mb-1">
                                Sex
                            </p>

                            <p className="font-semibold text-gray-900 dark:text-white">
                                {profile?.sex || '—'}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs text-gray-400 mb-1">
                                Civil Status
                            </p>

                            <p className="font-semibold text-gray-900 dark:text-white">
                                {profile?.civil_status || '—'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* NOTES */}
            <div>
                <label className="
                    block text-sm font-medium
                    text-gray-700 dark:text-gray-300
                    mb-1.5
                ">
                    Notes (optional)
                </label>

                <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Any additional notes for the doctor…"
                    className="
                        w-full px-4 py-3
                        border border-gray-200 dark:border-neutral-700
                        rounded-xl
                        bg-white dark:bg-neutral-800
                        text-gray-900 dark:text-white
                        focus:ring-2 focus:ring-blue-500
                        outline-none resize-none
                    "
                />
            </div>

            {/* REMINDER */}
            <div className="
                bg-amber-50 dark:bg-amber-900/20
                border border-amber-200 dark:border-amber-800
                rounded-xl px-4 py-3
            ">
                <p className="
                    text-xs font-semibold
                    text-amber-800 dark:text-amber-300
                    mb-0.5
                ">
                    📌 Reminder / Paalala
                </p>

                <p className="
                    text-xs text-amber-700 dark:text-amber-400
                    leading-relaxed
                ">
                    Bring a 1×1 ID photo and stool sample.
                    <br />
                    Magdala ng 1×1 na litrato at dumi.
                </p>
            </div>
        </div>
    );
};

  const Step4 = () => {
    const doc = getSelectedDoctor();
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 flex items-start gap-3">
          <ClipboardList className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800 dark:text-blue-300">
            Please review your details before confirming. Once booked, you'll receive a confirmation.
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-2xl overflow-hidden">
          {[
            {
              label: 'Doctor',
              value: doc ? `Dr. ${doc.first_name} ${doc.last_name}${doc.specialization ? ` · ${doc.specialization}` : ''}` : '—'
            },
            {
              label: 'Type',
              value: typeLabels[formData.type] || formData.type
            },
            ...(showCompanyField && companySearch ? [{ label: 'Company', value: companySearch }] : []),
            {
              label: 'Date',
              value: formData.appointment_date
                ? new Date(formData.appointment_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                : '—'
            },
            {
              label: 'Time',
              value: formData.start_time
                ? `${formatTime(formData.start_time)} – ${formatTime(add30Minutes(formData.start_time))}`
                : '—'
            },
            {
              label: 'Services',
              value: formData.service_types.length > 0 ? formData.service_types.join(', ') : 'None selected'
            },
          ].map(({ label, value }, i, arr) => (
            <div key={label} className={`flex justify-between items-start px-5 py-3.5 ${i < arr.length - 1 ? 'border-b border-gray-100 dark:border-neutral-800' : ''}`}>
              <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0 w-24">{label}</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white text-right max-w-[60%]">{value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ─── PROGRESS BAR ─────────────────────────────────────────────────────────
  const ProgressBar = () => (
    <div className="flex items-center mb-8">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const done = step < currentStep;
        const active = step === currentStep;
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                done ? 'bg-blue-500 text-white' :
                active ? 'bg-blue-500 text-white ring-4 ring-blue-100 dark:ring-blue-900/40' :
                'bg-gray-100 dark:bg-neutral-800 text-gray-400 dark:text-gray-500'
              }`}>
                {done ? <Check className="w-4 h-4" /> : step}
              </div>
              <span className={`mt-1.5 text-xs font-medium whitespace-nowrap ${
                active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
              }`}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-5 transition-all ${
                done ? 'bg-blue-500' : 'bg-gray-200 dark:bg-neutral-700'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );

  const canGoNext = () => {
    if (currentStep === 1) return !!formData.doctor_id;
    if (currentStep === 2) return !!formData.appointment_date && !!formData.start_time;
    return true;
  };

  return (
    <>
      <Head title="Book Appointment" />
      <div className="min-h-screen bg-[#f8fafc]">

    {/* TOP NAVBAR */}
    <div className="
        sticky top-0 z-50
        border-b border-slate-200/80
        bg-white/80 backdrop-blur-xl
    ">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">

            {/* LEFT */}
            <div className="flex items-center gap-3">

                <div className="
                    w-11 h-11 rounded-2xl
                    bg-gradient-to-br
                    from-blue-600 to-cyan-500
                    flex items-center justify-center
                    shadow-lg shadow-blue-500/20
                ">
                    <Calendar className="w-5 h-5 text-white" />
                </div>

                <div>
                    <h1 className="text-lg font-black text-slate-900">
                        Living Myth Clinic
                    </h1>

                    <p className="text-xs text-slate-500">
                        Online Appointment Portal
                    </p>
                </div>
            </div>

            {/* RIGHT */}
            <Link
                href="/dashboard"
                className="
                    px-4 py-2 rounded-2xl
                    border border-slate-200
                    bg-white
                    text-sm font-semibold
                    text-slate-600
                    hover:bg-slate-100
                    transition-all
                "
            >
                Dashboard
            </Link>
        </div>
    </div>

    {/* MAIN CONTENT */}
    <div className="max-w-3xl mx-auto px-6 py-10">
      

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Book an Appointment</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">LMIC – Living Myth Industrial Clinic</p>
            </div>
          </div>

          {/* Progress */}
          <ProgressBar />

          {/* Card */}
          <div
  onSubmit={(e) => {
    e.preventDefault();

    if (currentStep !== 4) return;

    handleSubmit();
  }}
  className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6 sm:p-8 shadow-sm"
>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              {currentStep === 1 && 'Select doctor & services'}
              {currentStep === 2 && 'Choose your date & time'}
              {currentStep === 3 && 'Your details'}
              {currentStep === 4 && 'Confirm your booking'}
            </h2>

            {currentStep === 1 && <Step1 />}
            {currentStep === 2 && <Step2 />}
            {currentStep === 3 && <Step3 />}
            {currentStep === 4 && <Step4 />}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setCurrentStep(s => s - 1)}
                disabled={currentStep === 1}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-neutral-800 transition disabled:opacity-0 disabled:pointer-events-none"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(s => s + 1)}
                  disabled={!canGoNext()}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button 
                onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {isSubmitting ? 'Booking…' : 'Confirm booking'}
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

