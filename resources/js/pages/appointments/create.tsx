import { Head, Link, router, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowLeft, ArrowRight, BriefcaseMedical, Building2, CalendarDays, Check,
    CheckCircle2, CircleAlert, ClipboardCheck, Clock3, FileHeart,
    HeartPulse, Info, LoaderCircle, Mail, MapPin, Phone, ShieldCheck,
    Stethoscope, UserRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { Doctor } from '@/types/availability';

interface Company {
    id: number;
    company_name: string;
}

interface BookingData {
    doctor_id: string;
    start_time: string;
    type: string;
    company_id: string;
    appointment_date: string;
    service_types: string[];
    notes: string;
}

interface PatientProfile {
    birthdate?: string | null;
    sex?: string | null;
    civil_status?: string | null;
}

interface AppointmentUser {
    id: number;
    name: string;
    email: string;
    contact?: string | null;
    role: string;
    patient_profile?: PatientProfile | null;
}

interface AppointmentPageProps {
    companies?: Company[];
    serviceTypes?: Record<string, string>;
    appointmentTypes?: Record<string, string>;
    auth: { user: AppointmentUser };
    [key: string]: unknown;
}

interface AvailabilityResponse {
    doctor: {
        id: number;
        name: string;
        specialization?: string | null;
    };
    slots: Record<string, unknown>;
    availableDates: string[];
    availableTimes: string[];
}

type BookingErrors = Record<string, string | undefined>;
type OptionEntry = [string, string];

const STEPS = [
    { title: 'Visit', short: 'Visit' },
    { title: 'Schedule', short: 'Time' },
    { title: 'Details', short: 'Details' },
    { title: 'Review', short: 'Review' },
    { title: 'Confirmation', short: 'Done' },
];

const TYPE_DETAILS: Record<string, { description: string; icon: typeof UserRound }> = {
    individual: {
        description: 'Book a personal clinic visit under your account.',
        icon: UserRound,
    },
    company_referral: {
        description: 'Schedule an examination requested by your employer.',
        icon: Building2,
    },
    company_bulk: {
        description: 'Coordinate medical services for your organization.',
        icon: BriefcaseMedical,
    },
};

const SERVICE_ICONS = [HeartPulse, FileHeart, Stethoscope, ClipboardCheck];

const INITIAL_DATA: BookingData = {
    doctor_id: '',
    start_time: '',
    type: 'individual',
    company_id: '',
    appointment_date: '',
    service_types: [],
    notes: '',
};

const isStringArray = (value: unknown): value is string[] =>
    Array.isArray(value) && value.every((item) => typeof item === 'string');

const restoreDraft = (storageKey: string): BookingData => {
    if (typeof window === 'undefined') return { ...INITIAL_DATA };

    try {
        const parsed: unknown = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
        if (!parsed || typeof parsed !== 'object') return { ...INITIAL_DATA };
        const draft = parsed as Partial<Record<keyof BookingData, unknown>>;

        return {
            doctor_id: typeof draft.doctor_id === 'string' ? draft.doctor_id : '',
            start_time: typeof draft.start_time === 'string' ? draft.start_time : '',
            type: typeof draft.type === 'string' ? draft.type : 'individual',
            company_id: typeof draft.company_id === 'string' ? draft.company_id : '',
            appointment_date: typeof draft.appointment_date === 'string' ? draft.appointment_date : '',
            service_types: isStringArray(draft.service_types) ? draft.service_types : [],
            notes: typeof draft.notes === 'string' ? draft.notes.slice(0, 500) : '',
        };
    } catch {
        localStorage.removeItem(storageKey);
        return { ...INITIAL_DATA };
    }
};

const isDoctorArray = (value: unknown): value is Doctor[] =>
    Array.isArray(value) && value.every((doctor) =>
        doctor !== null
        && typeof doctor === 'object'
        && typeof (doctor as Doctor).id === 'number'
        && typeof (doctor as Doctor).first_name === 'string'
        && typeof (doctor as Doctor).last_name === 'string'
    );

const isAvailabilityResponse = (value: unknown): value is AvailabilityResponse => {
    if (!value || typeof value !== 'object') return false;
    const response = value as Partial<AvailabilityResponse>;
    return isStringArray(response.availableDates) && isStringArray(response.availableTimes);
};

const getErrorMessage = (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback;

const formatTime = (time: string) => {
    const [hour, minute] = time.split(':').map(Number);
    return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(2026, 0, 1, hour, minute));
};

const formatDate = (date: string, options?: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat('en-US', options ?? {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(`${date}T00:00:00`));

const add30Minutes = (time: string) => {
    const [hour, minute] = time.split(':').map(Number);
    const date = new Date(2026, 0, 1, hour, minute + 30);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

export default function CreateAppointment() {
    const { companies = [], serviceTypes = {}, appointmentTypes = {}, auth } = usePage<AppointmentPageProps>().props;
    const storageKey = `appointment-draft-${auth.user.id}`;

    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<BookingData>(() => {
        return restoreDraft(storageKey);
    });
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
    const [loadingDoctors, setLoadingDoctors] = useState(true);
    const [loadingAvailability, setLoadingAvailability] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<BookingErrors>({});
    const [companySearch, setCompanySearch] = useState(() => {
        const restoredCompanyId = restoreDraft(storageKey).company_id;
        return companies.find((company) => String(company.id) === restoredCompanyId)?.company_name ?? '';
    });
    const [companyMenuOpen, setCompanyMenuOpen] = useState(false);
    const [draftRestored, setDraftRestored] = useState(() =>
        typeof window !== 'undefined' && localStorage.getItem(storageKey) !== null
    );

    const appointmentTypeEntries = (Object.entries(appointmentTypes) as OptionEntry[])
        .filter(([value]) => auth.user.role === 'company' || value !== 'company_bulk');
    const serviceEntries = Object.entries(serviceTypes) as OptionEntry[];
    const needsCompany = ['company_referral', 'company_bulk'].includes(formData.type);
    const selectedDoctor = doctors.find((doctor) => String(doctor.id) === formData.doctor_id);
    const selectedCompany = companies.find((company) => String(company.id) === formData.company_id);
    const patientProfile = auth.user.patient_profile;

    const filteredCompanies = useMemo(() => companies.filter((company) =>
        company.company_name.toLowerCase().includes(companySearch.toLowerCase())
    ), [companies, companySearch]);

    const availableDates = (availability?.availableDates ?? []).filter((date) =>
        new Date(`${date}T00:00:00`) >= new Date(new Date().toDateString())
    );

    const availableTimes = (availability?.availableTimes ?? []).filter((time) => {
        if (!formData.appointment_date) return true;
        const today = new Date();
        if (new Date(`${formData.appointment_date}T00:00:00`).toDateString() !== today.toDateString()) return true;
        const [hour, minute] = time.split(':').map(Number);
        const slot = new Date();
        slot.setHours(hour, minute, 0, 0);
        return slot > today;
    });

    useEffect(() => {
        const timeout = window.setTimeout(() => localStorage.setItem(storageKey, JSON.stringify(formData)), 250);
        return () => window.clearTimeout(timeout);
    }, [formData, storageKey]);

    useEffect(() => {
        const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
            if (!formData.doctor_id && !formData.service_types.length) return;
            event.preventDefault();
        };
        window.addEventListener('beforeunload', warnBeforeLeaving);
        return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
    }, [formData.doctor_id, formData.service_types.length]);

    useEffect(() => {
        const controller = new AbortController();
        fetch('/api/doctors', { signal: controller.signal, headers: { Accept: 'application/json' } })
            .then((response) => {
                if (!response.ok) throw new Error('Unable to load doctors.');
                return response.json() as Promise<unknown>;
            })
            .then((data) => {
                if (!isDoctorArray(data)) throw new Error('The doctor list returned an invalid response.');
                setDoctors(data);
            })
            .catch((error: unknown) => {
                if (error instanceof DOMException && error.name === 'AbortError') return;
                setErrors((current) => ({
                    ...current,
                    doctors: getErrorMessage(error, 'Unable to load doctors.'),
                }));
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoadingDoctors(false);
            });
        return () => controller.abort();
    }, []);

    useEffect(() => {
        if (!formData.doctor_id) {
            return;
        }
        const controller = new AbortController();
        const query = formData.appointment_date ? `?date=${formData.appointment_date}` : '';
        fetch(`/api/doctors/${formData.doctor_id}/availability${query}`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
        })
            .then((response) => {
                if (!response.ok) throw new Error('Availability could not be loaded.');
                return response.json() as Promise<unknown>;
            })
            .then((data) => {
                if (!isAvailabilityResponse(data)) throw new Error('The schedule returned an invalid response.');
                setAvailability(data);
                setErrors((current) => ({ ...current, availability: undefined }));
            })
            .catch((error: unknown) => {
                if (error instanceof DOMException && error.name === 'AbortError') return;
                setAvailability(null);
                setErrors((current) => ({
                    ...current,
                    availability: getErrorMessage(error, 'Availability could not be loaded.'),
                }));
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoadingAvailability(false);
            });
        return () => controller.abort();
    }, [formData.doctor_id, formData.appointment_date]);

    const update = <K extends keyof BookingData>(key: K, value: BookingData[K]) => {
        setFormData((current) => ({ ...current, [key]: value }));
        setErrors((current) => ({ ...current, [key]: undefined }));
    };

    const selectCompany = (company: Company) => {
        update('company_id', String(company.id));
        setCompanySearch(company.company_name);
        setCompanyMenuOpen(false);
    };

    const toggleService = (value: string) => {
        update('service_types', formData.service_types.includes(value)
            ? formData.service_types.filter((service) => service !== value)
            : [...formData.service_types, value]);
    };

    const validateStep = () => {
        const nextErrors: BookingErrors = {};
        if (currentStep === 1) {
            if (!formData.service_types.length) nextErrors.service_types = 'Choose at least one medical service.';
            if (!formData.doctor_id) nextErrors.doctor_id = 'Choose a doctor to continue.';
            if (needsCompany && !formData.company_id) nextErrors.company_id = 'Select the referring company.';
        }
        if (currentStep === 2) {
            if (!formData.appointment_date) nextErrors.appointment_date = 'Choose an available date.';
            if (!formData.start_time) nextErrors.start_time = 'Choose an available time.';
        }
        setErrors((current) => ({ ...current, ...nextErrors }));
        return Object.keys(nextErrors).length === 0;
    };

    const continueForward = () => {
        if (!validateStep()) return;
        setCurrentStep((step) => Math.min(step + 1, 4));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const submit = () => {
        if (submitting) return;
        setSubmitting(true);
        setErrors({});
        router.post('/appointments', { ...formData }, {
            preserveScroll: true,
            onSuccess: () => {
                localStorage.removeItem(storageKey);
                setSubmitting(false);
            },
            onError: (serverErrors) => {
                setErrors(serverErrors);
                setSubmitting(false);
                const errorFields = Object.keys(serverErrors);
                if (errorFields.some((key) => ['type', 'company_id', 'company_name', 'service_types', 'doctor_id'].includes(key))) {
                    setCurrentStep(1);
                } else if (errorFields.some((key) => ['appointment_date', 'start_time'].includes(key))) {
                    setCurrentStep(2);
                } else if (errorFields.includes('notes')) {
                    setCurrentStep(3);
                }
            },
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <>
            <Head title="Book an appointment" />
            <div className="min-h-screen bg-[#f6f9fc] text-slate-900">
                <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
                    <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6">
                        <Link href="/dashboard" className="flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20">
                            <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 text-white shadow-lg shadow-blue-600/20">
                                <HeartPulse className="size-5" />
                            </span>
                            <span>
                                <span className="block text-sm font-bold tracking-[-.02em]">Living Myth Clinic</span>
                                <span className="block text-[10px] font-medium uppercase tracking-[.12em] text-slate-400">Patient appointments</span>
                            </span>
                        </Link>
                        <Link href="/dashboard" className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/15">
                            <ArrowLeft className="size-4" />
                            <span className="hidden sm:inline">Back to dashboard</span>
                        </Link>
                    </div>
                </header>

                <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10">
                    <div className="mb-7 lg:max-w-3xl">
                        <p className="text-xs font-bold uppercase tracking-[.16em] text-blue-600">Online scheduling</p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Book your clinic visit</h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">Choose your care, find a convenient schedule, and review everything before confirming.</p>
                    </div>

                    <Progress currentStep={currentStep} />

                    {draftRestored && (
                        <div className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700">
                            <span className="flex items-center gap-2"><Info className="size-4 shrink-0" /> Your saved booking draft has been restored.</span>
                            <button onClick={() => setDraftRestored(false)} className="font-semibold">Dismiss</button>
                        </div>
                    )}

                    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_-40px_rgba(15,43,75,.35)]">
                            <div className="border-b border-slate-100 px-5 py-5 sm:px-8">
                                <p className="text-xs font-semibold text-blue-600">Step {currentStep} of 4</p>
                                <h2 className="mt-1 text-xl font-semibold tracking-[-.025em]">
                                    {currentStep === 1 && 'What care do you need?'}
                                    {currentStep === 2 && 'Choose a date and time'}
                                    {currentStep === 3 && 'Confirm your information'}
                                    {currentStep === 4 && 'Review your appointment'}
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    {currentStep === 1 && 'Select a visit type, services, and your preferred doctor.'}
                                    {currentStep === 2 && 'Only currently available schedules are shown.'}
                                    {currentStep === 3 && 'We use the verified information saved in your profile.'}
                                    {currentStep === 4 && 'Check the details below before submitting your request.'}
                                </p>
                            </div>

                            <div className="p-5 sm:p-8">
                                <AnimatePresence mode="wait">
                                    <motion.div key={currentStep} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: .22 }}>
                                        {currentStep === 1 && (
                                            <VisitStep
                                                appointmentTypes={appointmentTypeEntries}
                                                serviceTypes={serviceEntries}
                                                doctors={doctors}
                                                formData={formData}
                                                loadingDoctors={loadingDoctors}
                                                errors={errors}
                                                needsCompany={needsCompany}
                                                companySearch={companySearch}
                                                companyMenuOpen={companyMenuOpen}
                                                filteredCompanies={filteredCompanies}
                                                onType={(type) => {
                                                    update('type', type);
                                                    update('company_id', '');
                                                    setCompanySearch('');
                                                }}
                                                onService={toggleService}
                                                onDoctor={(doctorId) => {
                                                    setLoadingAvailability(true);
                                                    update('doctor_id', doctorId);
                                                    update('appointment_date', '');
                                                    update('start_time', '');
                                                }}
                                                onCompanySearch={(value) => {
                                                    setCompanySearch(value);
                                                    setCompanyMenuOpen(true);
                                                    update('company_id', '');
                                                }}
                                                onCompanySelect={selectCompany}
                                                onCompanyFocus={() => setCompanyMenuOpen(true)}
                                            />
                                        )}
                                        {currentStep === 2 && (
                                            <ScheduleStep
                                                doctor={selectedDoctor}
                                                dates={availableDates}
                                                times={availableTimes}
                                                selectedDate={formData.appointment_date}
                                                selectedTime={formData.start_time}
                                                loading={loadingAvailability}
                                                errors={errors}
                                                onDate={(date) => {
                                                    setLoadingAvailability(true);
                                                    update('appointment_date', date);
                                                    update('start_time', '');
                                                }}
                                                onTime={(time) => update('start_time', time)}
                                            />
                                        )}
                                        {currentStep === 3 && (
                                            <DetailsStep
                                                user={auth.user}
                                                profile={patientProfile}
                                                notes={formData.notes}
                                                onNotes={(notes) => update('notes', notes)}
                                            />
                                        )}
                                        {currentStep === 4 && (
                                            <ReviewStep
                                                formData={formData}
                                                doctor={selectedDoctor}
                                                company={selectedCompany}
                                                appointmentTypes={appointmentTypes}
                                                serviceTypes={serviceTypes}
                                                user={auth.user}
                                                onEdit={setCurrentStep}
                                            />
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-8">
                                <button type="button" onClick={() => setCurrentStep((step) => Math.max(1, step - 1))} disabled={currentStep === 1 || submitting} className="inline-flex h-12 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:invisible">
                                    <ArrowLeft className="size-4" /> Back
                                </button>
                                {currentStep < 4 ? (
                                    <button type="button" onClick={continueForward} className="inline-flex h-12 min-w-36 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20">
                                        Continue <ArrowRight className="size-4" />
                                    </button>
                                ) : (
                                    <button type="button" onClick={submit} disabled={submitting} className="inline-flex h-12 min-w-44 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:pointer-events-none disabled:opacity-65">
                                        {submitting ? <><LoaderCircle className="size-4 animate-spin" /> Booking securely…</> : <><Check className="size-4" /> Confirm booking</>}
                                    </button>
                                )}
                            </div>
                        </section>

                        <BookingSummary formData={formData} doctor={selectedDoctor} appointmentTypes={appointmentTypes} />
                    </div>
                </main>
            </div>
        </>
    );
}

function Progress({ currentStep }: { currentStep: number }) {
    return (
        <nav aria-label="Booking progress" className="mb-7 overflow-x-auto pb-1">
            <ol className="flex min-w-[570px] items-center">
                {STEPS.map((item, index) => {
                    const step = index + 1;
                    const complete = step < currentStep;
                    const active = step === currentStep;
                    return (
                        <li key={item.title} className={`flex items-center ${index < STEPS.length - 1 ? 'flex-1' : ''}`} aria-current={active ? 'step' : undefined}>
                            <div className="flex items-center gap-2.5">
                                <span className={`flex size-9 items-center justify-center rounded-full text-xs font-bold transition ${complete ? 'bg-teal-500 text-white' : active ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'border border-slate-200 bg-white text-slate-400'}`}>
                                    {complete ? <Check className="size-4" /> : step}
                                </span>
                                <span className={`text-xs font-semibold ${active ? 'text-slate-900' : complete ? 'text-teal-700' : 'text-slate-400'}`}>{item.short}</span>
                            </div>
                            {index < STEPS.length - 1 && <span className={`mx-3 h-px flex-1 ${complete ? 'bg-teal-400' : 'bg-slate-200'}`} />}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}

interface VisitStepProps {
    appointmentTypes: OptionEntry[];
    serviceTypes: OptionEntry[];
    doctors: Doctor[];
    formData: BookingData;
    loadingDoctors: boolean;
    errors: BookingErrors;
    needsCompany: boolean;
    companySearch: string;
    companyMenuOpen: boolean;
    filteredCompanies: Company[];
    onType: (type: string) => void;
    onService: (service: string) => void;
    onDoctor: (doctorId: string) => void;
    onCompanySearch: (search: string) => void;
    onCompanySelect: (company: Company) => void;
    onCompanyFocus: () => void;
}

function VisitStep({ appointmentTypes, serviceTypes, doctors, formData, loadingDoctors, errors, needsCompany, companySearch, companyMenuOpen, filteredCompanies, onType, onService, onDoctor, onCompanySearch, onCompanySelect, onCompanyFocus }: VisitStepProps) {
    return (
        <div className="space-y-8">
            <FieldGroup title="Visit type" description="How will this appointment be arranged?">
                <div className="grid gap-3 sm:grid-cols-3">
                    {appointmentTypes.map(([value, label]) => {
                        const detail = TYPE_DETAILS[value] ?? TYPE_DETAILS.individual;
                        const Icon = detail.icon;
                        const selected = formData.type === value;
                        return (
                            <button key={value} type="button" onClick={() => onType(value)} aria-pressed={selected} className={`relative min-h-36 rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/15 ${selected ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-blue-200'}`}>
                                {selected && <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-blue-600 text-white"><Check className="size-3" /></span>}
                                <span className={`flex size-10 items-center justify-center rounded-xl ${selected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}><Icon className="size-5" /></span>
                                <span className="mt-3 block text-sm font-semibold text-slate-900">{label}</span>
                                <span className="mt-1 block text-xs leading-5 text-slate-500">{detail.description}</span>
                            </button>
                        );
                    })}
                </div>
            </FieldGroup>

            {needsCompany && (
                <FieldGroup title="Referring company" description="Select the company associated with this appointment.">
                    <div className="relative max-w-xl">
                        <Building2 className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-slate-400" />
                        <input value={companySearch} onChange={(event) => onCompanySearch(event.target.value)} onFocus={onCompanyFocus} placeholder="Search for your company" aria-label="Referring company" aria-invalid={!!errors.company_id} className="h-12 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" />
                        {companyMenuOpen && companySearch && (
                            <div className="absolute z-20 mt-2 max-h-52 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                                {filteredCompanies.length ? filteredCompanies.map((company: Company) => (
                                    <button key={company.id} type="button" onClick={() => onCompanySelect(company)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-blue-50"><Building2 className="size-4 text-slate-400" />{company.company_name}</button>
                                )) : <p className="px-3 py-3 text-sm text-slate-500">No matching company found.</p>}
                            </div>
                        )}
                    </div>
                    <InlineError message={errors.company_id} />
                </FieldGroup>
            )}

            <FieldGroup title="Medical services" description="Select all services you need during this visit.">
                <div className="grid gap-3 sm:grid-cols-2">
                    {serviceTypes.map(([value, label], index) => {
                        const selected = formData.service_types.includes(value);
                        const Icon = SERVICE_ICONS[index % SERVICE_ICONS.length];
                        return (
                            <button key={value} type="button" onClick={() => onService(value)} aria-pressed={selected} className={`flex min-h-16 items-center gap-3 rounded-xl border px-4 py-3 text-left transition hover:border-blue-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/15 ${selected ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}>
                                <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${selected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}><Icon className="size-4" /></span>
                                <span className="flex-1 text-sm font-medium text-slate-800">{label}</span>
                                <span className={`flex size-5 items-center justify-center rounded-md border ${selected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'}`}>{selected && <Check className="size-3" />}</span>
                            </button>
                        );
                    })}
                </div>
                <InlineError message={errors.service_types} />
            </FieldGroup>

            <FieldGroup title="Preferred doctor" description="Choose the clinician who will handle your appointment.">
                {loadingDoctors ? <LoadingState label="Finding available doctors…" /> : errors.doctors ? <InlineError message={errors.doctors} /> : (
                    <div className="grid gap-3 sm:grid-cols-2">
                        {doctors.map((doctor: Doctor) => {
                            const selected = formData.doctor_id === String(doctor.id);
                            const initials = `${doctor.first_name?.[0] ?? ''}${doctor.last_name?.[0] ?? ''}`;
                            return (
                                <button key={doctor.id} type="button" onClick={() => onDoctor(String(doctor.id))} aria-pressed={selected} className={`flex min-h-20 items-center gap-3 rounded-xl border p-3.5 text-left transition hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/15 ${selected ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}>
                                    <span className={`flex size-11 shrink-0 items-center justify-center rounded-full text-xs font-bold ${selected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{initials}</span>
                                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-900">Dr. {doctor.first_name} {doctor.last_name}</span><span className="mt-0.5 block truncate text-xs text-slate-500">{doctor.specialization || 'Clinic physician'}</span></span>
                                    {selected && <CheckCircle2 className="size-5 shrink-0 text-blue-600" />}
                                </button>
                            );
                        })}
                    </div>
                )}
                <InlineError message={errors.doctor_id} />
            </FieldGroup>
        </div>
    );
}

interface ScheduleStepProps {
    doctor?: Doctor;
    dates: string[];
    times: string[];
    selectedDate: string;
    selectedTime: string;
    loading: boolean;
    errors: BookingErrors;
    onDate: (date: string) => void;
    onTime: (time: string) => void;
}

function ScheduleStep({ doctor, dates, times, selectedDate, selectedTime, loading, errors, onDate, onTime }: ScheduleStepProps) {
    const today = new Date().toISOString().slice(0, 10);
    return (
        <div className="space-y-8">
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <span className="flex size-10 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm"><Stethoscope className="size-4" /></span>
                <div><p className="text-xs text-slate-500">Scheduling with</p><p className="text-sm font-semibold">Dr. {doctor?.first_name} {doctor?.last_name}</p></div>
            </div>

            {loading ? <LoadingState label="Checking the latest availability…" /> : errors.availability ? <InlineError message={errors.availability} /> : (
                <>
                    <FieldGroup title="Available dates" description="Unavailable clinic days are automatically hidden.">
                        {dates.length ? (
                            <>
                                {dates.includes(today) && <button type="button" onClick={() => onDate(today)} className="mb-3 inline-flex h-9 items-center gap-2 rounded-lg bg-teal-50 px-3 text-xs font-semibold text-teal-700 hover:bg-teal-100"><CalendarDays className="size-4" /> Choose today</button>}
                                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                                    {dates.map((date) => {
                                        const selected = selectedDate === date;
                                        return (
                                            <button key={date} type="button" onClick={() => onDate(date)} aria-pressed={selected} className={`min-h-20 rounded-xl border px-2 py-3 text-center transition hover:border-blue-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/15 ${selected ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/15' : 'border-slate-200 bg-white'}`}>
                                                <span className={`block text-[10px] font-bold uppercase tracking-wide ${selected ? 'text-blue-100' : 'text-slate-400'}`}>{formatDate(date, { weekday: 'short' })}</span>
                                                <span className="mt-1 block text-sm font-semibold">{formatDate(date, { month: 'short', day: 'numeric' })}</span>
                                                {date === today && <span className={`mt-1 block text-[9px] ${selected ? 'text-blue-100' : 'text-teal-600'}`}>Today</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            </>
                        ) : <EmptyAvailability message="No upcoming dates are available for this doctor. Return to the previous step to choose another doctor." />}
                        <InlineError message={errors.appointment_date} />
                    </FieldGroup>

                    {selectedDate && (
                        <FieldGroup title="Available times" description={`${times.length} slot${times.length === 1 ? '' : 's'} remaining on ${formatDate(selectedDate, { month: 'long', day: 'numeric' })}.`}>
                            {times.length ? (
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                                    {times.map((time) => {
                                        const selected = selectedTime === time;
                                        return (
                                            <button key={time} type="button" onClick={() => onTime(time)} aria-pressed={selected} className={`min-h-16 rounded-xl border px-3 py-2 text-center transition hover:border-blue-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/15 ${selected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200'}`}>
                                                <span className="block text-sm font-semibold">{formatTime(time)}</span>
                                                <span className={`mt-0.5 block text-[10px] ${selected ? 'text-blue-100' : 'text-slate-400'}`}>until {formatTime(add30Minutes(time))}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : <EmptyAvailability message="No time slots remain for this date. Please choose another date." />}
                            <InlineError message={errors.start_time} />
                        </FieldGroup>
                    )}
                </>
            )}
        </div>
    );
}

interface DetailsStepProps {
    user: AppointmentUser;
    profile?: PatientProfile | null;
    notes: string;
    onNotes: (notes: string) => void;
}

function DetailsStep({ user, profile, notes, onNotes }: DetailsStepProps) {
    const details = [
        { label: 'Full name', value: user.name, icon: UserRound },
        { label: 'Email address', value: user.email, icon: Mail },
        { label: 'Contact number', value: user.contact || 'Not provided', icon: Phone },
        { label: 'Birthdate', value: profile?.birthdate ? new Date(String(profile.birthdate)).toLocaleDateString() : 'Not provided', icon: CalendarDays },
    ];
    return (
        <div className="space-y-7">
            <div className="grid gap-3 sm:grid-cols-2">
                {details.map(({ label, value, icon: Icon }) => (
                    <div key={label} className="flex min-h-18 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm"><Icon className="size-4" /></span>
                        <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-0.5 truncate text-sm font-semibold text-slate-800">{value}</p></div>
                    </div>
                ))}
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs leading-5 text-blue-700">
                <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                <p>Your verified profile information will be attached to this appointment. To correct it, visit <Link href="/settings/profile" className="font-semibold underline underline-offset-2">Profile Settings</Link> before booking.</p>
            </div>
            <div>
                <label htmlFor="booking-notes" className="mb-2 block text-sm font-semibold text-slate-800">Additional notes <span className="font-normal text-slate-400">(optional)</span></label>
                <div className="relative">
                    <FileHeart className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-slate-400" />
                    <textarea id="booking-notes" value={notes} onChange={(event) => onNotes(event.target.value)} rows={4} maxLength={500} placeholder="Share symptoms, accessibility needs, or anything the clinic should know." className="w-full resize-none rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" />
                </div>
                <p className="mt-1.5 text-right text-[10px] text-slate-400">{notes.length}/500</p>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <Info className="mt-0.5 size-4 shrink-0 text-amber-600" />
                <div><p className="text-xs font-semibold text-amber-900">Before your visit</p><p className="mt-1 text-xs leading-5 text-amber-700">Please bring one 1×1 ID photo and a stool sample. Magdala ng 1×1 na litrato at sample ng dumi.</p></div>
            </div>
        </div>
    );
}

interface ReviewStepProps {
    formData: BookingData;
    doctor?: Doctor;
    company?: Company;
    appointmentTypes: Record<string, string>;
    serviceTypes: Record<string, string>;
    user: AppointmentUser;
    onEdit: (step: number) => void;
}

interface ReviewSection {
    title: string;
    step: number;
    icon: LucideIcon;
    rows: [string, string][];
}

function ReviewStep({ formData, doctor, company, appointmentTypes, serviceTypes, user, onEdit }: ReviewStepProps) {
    const sections: ReviewSection[] = [
        {
            title: 'Visit and care team', step: 1, icon: Stethoscope,
            rows: [
                ['Appointment type', appointmentTypes[formData.type] || formData.type],
                ['Doctor', `Dr. ${doctor?.first_name || ''} ${doctor?.last_name || ''}`],
                ...(company ? [['Company', company.company_name] as [string, string]] : []),
                ['Services', formData.service_types.map((code: string) => serviceTypes[code] || code).join(', ')],
            ],
        },
        {
            title: 'Schedule', step: 2, icon: CalendarDays,
            rows: [
                ['Date', formatDate(formData.appointment_date)],
                ['Time', `${formatTime(formData.start_time)} – ${formatTime(add30Minutes(formData.start_time))}`],
            ],
        },
        {
            title: 'Patient details', step: 3, icon: UserRound,
            rows: [
                ['Patient', user.name],
                ['Contact', user.contact || user.email],
                ...(formData.notes ? [['Notes', formData.notes] as [string, string]] : []),
            ],
        },
    ];
    return (
        <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-teal-100 bg-teal-50 p-4 text-xs leading-5 text-teal-800"><ShieldCheck className="mt-0.5 size-4 shrink-0" /> Your information is encrypted and will only be used to coordinate your care.</div>
            {sections.map(({ title, step, icon: Icon, rows }) => (
                <section key={title} className="overflow-hidden rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
                        <h3 className="flex items-center gap-2 text-sm font-semibold"><Icon className="size-4 text-blue-600" />{title}</h3>
                        <button type="button" onClick={() => onEdit(step)} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50">Edit</button>
                    </div>
                    <dl className="divide-y divide-slate-100 px-4">
                        {rows.map(([label, value]) => <div key={label} className="grid gap-1 py-3 sm:grid-cols-[130px_1fr]"><dt className="text-xs text-slate-500">{label}</dt><dd className="text-sm font-medium leading-5 text-slate-800">{value}</dd></div>)}
                    </dl>
                </section>
            ))}
            <p className="flex items-center gap-2 text-[11px] text-slate-400"><Info className="size-3.5" /> You can still edit any section before confirming.</p>
        </div>
    );
}

interface BookingSummaryProps {
    formData: BookingData;
    doctor?: Doctor;
    appointmentTypes: Record<string, string>;
}

function BookingSummary({ formData, doctor, appointmentTypes }: BookingSummaryProps) {
    return (
        <aside className="sticky top-6 hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_16px_50px_-38px_rgba(15,43,75,.4)] lg:block">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-slate-400">Your appointment</p>
            <div className="mt-4 flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><CalendarDays className="size-5" /></span>
                <div><p className="text-sm font-semibold">{appointmentTypes[formData.type] || 'Clinic appointment'}</p><p className="mt-0.5 text-xs text-slate-400">{formData.service_types.length} service{formData.service_types.length === 1 ? '' : 's'} selected</p></div>
            </div>
            <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
                <SummaryLine icon={Stethoscope} label={doctor ? `Dr. ${doctor.first_name} ${doctor.last_name}` : 'Choose a doctor'} active={!!doctor} />
                <SummaryLine icon={CalendarDays} label={formData.appointment_date ? formatDate(formData.appointment_date, { month: 'long', day: 'numeric', year: 'numeric' }) : 'Choose a date'} active={!!formData.appointment_date} />
                <SummaryLine icon={Clock3} label={formData.start_time ? formatTime(formData.start_time) : 'Choose a time'} active={!!formData.start_time} />
                <SummaryLine icon={MapPin} label="Living Myth Industrial Clinic" active />
            </div>
            <div className="mt-5 rounded-xl bg-slate-50 p-3.5 text-[11px] leading-5 text-slate-500"><strong className="text-slate-700">Arrival guidance:</strong> Please arrive 15 minutes before your scheduled time for check-in.</div>
        </aside>
    );
}

function SummaryLine({ icon: Icon, label, active }: { icon: LucideIcon; label: string; active: boolean }) {
    return <div className={`flex items-center gap-2.5 text-xs ${active ? 'text-slate-700' : 'text-slate-400'}`}><Icon className="size-4 shrink-0" /><span>{label}</span></div>;
}

function FieldGroup({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
    return <fieldset><legend className="text-sm font-semibold text-slate-900">{title}</legend><p className="mb-3 mt-1 text-xs leading-5 text-slate-500">{description}</p>{children}</fieldset>;
}

function InlineError({ message }: { message?: string }) {
    if (!message) return null;
    return <p role="alert" className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600"><CircleAlert className="size-3.5" />{message}</p>;
}

function LoadingState({ label }: { label: string }) {
    return <div className="flex min-h-24 items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 text-sm text-slate-500"><LoaderCircle className="size-4 animate-spin text-blue-600" />{label}</div>;
}

function EmptyAvailability({ message }: { message: string }) {
    return <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800"><CircleAlert className="mt-0.5 size-4 shrink-0" />{message}</div>;
}
