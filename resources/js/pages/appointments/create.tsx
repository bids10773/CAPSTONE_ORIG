import { Head, Link, router, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowLeft,
    ArrowRight,
    BriefcaseMedical,
    Building2,
    CakeSlice,
    CalendarDays,
    Check,
    CheckCircle2,
    CircleAlert,
    ClipboardCheck,
    Clock3,
    FileHeart,
    HeartPulse,
    Info,
    LoaderCircle,
    Mail,
    MapPin,
    Phone,
    ShieldCheck,
    Stethoscope,
    UserRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import AppointmentDateInput from '@/components/appointment-date-input';
import AppLayout from '@/layouts/app-layout';
import { useClinicHours } from '@/lib/clinic-hours';
import type { ClinicHoursSettings } from '@/lib/clinic-hours';
import type { Doctor } from '@/types/availability';

interface Company {
    id: number;
    company_name: string;
}

interface BookingData {
    company_referral_id: string;
    doctor_id: string;
    start_time: string;
    type: string;
    company_id: string;
    appointment_date: string;
    examination_purpose: string;
    service_types: string[];
    notes: string;
    service_location: string;
    event_address: string;
    event_contact_name: string;
    event_contact_number: string;
    expected_employee_count: string;
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
    company_id?: number | null;
    patient_profile?: PatientProfile | null;
}

interface AppointmentPageProps {
    clinicHours: ClinicHoursSettings;
    companies?: Company[];
    serviceTypes?: Record<string, string>;
    appointmentTypes?: Record<string, string>;
    pePackage?: {
        preEmploymentServices: string[];
        optionalBulkServices: string[];
    };
    auth: { user: AppointmentUser };
    bookingPolicy?: {
        maximumUpcoming: number;
        bookedDates: string[];
        upcomingAppointments: Array<{
            id: number;
            appointment_date: string;
            start_time: string;
            end_time: string;
            status: string;
        }>;
    };
    referral?: {
        id: number;
        referral_number: string;
        company_id: number;
        company_name: string;
        required_services: string[];
        examination_purpose: string;
        valid_until: string;
    } | null;
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
    dateSlotCounts: Record<string, number>;
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

const TYPE_DETAILS: Record<
    string,
    { description: string; icon: typeof UserRound }
> = {
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
const EXAMINATION_PURPOSES = [
    ['pre_employment', 'Pre-employment'],
    ['annual_pe', 'Annual Examination'],
    ['medical_clearance', 'Medical Certificate'],
] as const;
const EXAMINATION_PURPOSE_ICONS: Record<string, LucideIcon> = {
    pre_employment: BriefcaseMedical,
    annual_pe: CalendarDays,
    medical_clearance: ClipboardCheck,
};

const INITIAL_DATA: BookingData = {
    company_referral_id: '',
    doctor_id: '',
    start_time: '',
    type: 'individual',
    company_id: '',
    appointment_date: '',
    examination_purpose: '',
    service_types: [],
    notes: '',
    service_location: 'onsite',
    event_address: '',
    event_contact_name: '',
    event_contact_number: '',
    expected_employee_count: '',
};

const isStringArray = (value: unknown): value is string[] =>
    Array.isArray(value) && value.every((item) => typeof item === 'string');

const restoreDraft = (storageKey: string): BookingData => {
    if (typeof window === 'undefined') return { ...INITIAL_DATA };

    try {
        const parsed: unknown = JSON.parse(
            localStorage.getItem(storageKey) ?? 'null',
        );
        if (!parsed || typeof parsed !== 'object') return { ...INITIAL_DATA };
        const draft = parsed as Partial<Record<keyof BookingData, unknown>>;

        return {
            company_referral_id:
                typeof draft.company_referral_id === 'string'
                    ? draft.company_referral_id
                    : '',
            doctor_id:
                typeof draft.doctor_id === 'string' ? draft.doctor_id : '',
            start_time:
                typeof draft.start_time === 'string' ? draft.start_time : '',
            type:
                typeof draft.type === 'string' && draft.type !== 'walk_in'
                    ? draft.type
                    : 'individual',
            company_id:
                typeof draft.company_id === 'string' ? draft.company_id : '',
            appointment_date:
                typeof draft.appointment_date === 'string'
                    ? draft.appointment_date
                    : '',
            examination_purpose:
                typeof draft.examination_purpose === 'string'
                    ? draft.examination_purpose
                    : '',
            service_types: isStringArray(draft.service_types)
                ? draft.service_types
                : [],
            notes:
                typeof draft.notes === 'string'
                    ? draft.notes.slice(0, 500)
                    : '',
            service_location:
                typeof draft.service_location === 'string'
                    ? draft.service_location
                    : 'onsite',
            event_address:
                typeof draft.event_address === 'string'
                    ? draft.event_address
                    : '',
            event_contact_name:
                typeof draft.event_contact_name === 'string'
                    ? draft.event_contact_name
                    : '',
            event_contact_number:
                typeof draft.event_contact_number === 'string'
                    ? draft.event_contact_number
                    : '',
            expected_employee_count:
                typeof draft.expected_employee_count === 'string'
                    ? draft.expected_employee_count
                    : '',
        };
    } catch {
        localStorage.removeItem(storageKey);
        return { ...INITIAL_DATA };
    }
};

const isDoctorArray = (value: unknown): value is Doctor[] =>
    Array.isArray(value) &&
    value.every(
        (doctor) =>
            doctor !== null &&
            typeof doctor === 'object' &&
            typeof (doctor as Doctor).id === 'number' &&
            typeof (doctor as Doctor).first_name === 'string' &&
            typeof (doctor as Doctor).last_name === 'string',
    );

const isAvailabilityResponse = (
    value: unknown,
): value is AvailabilityResponse => {
    if (!value || typeof value !== 'object') return false;
    const response = value as Partial<AvailabilityResponse>;
    return (
        isStringArray(response.availableDates) &&
        isStringArray(response.availableTimes)
    );
};

const getErrorMessage = (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback;

const formatDoctorSex = (sex?: Doctor['sex']) => {
    if (!sex) return 'Gender not specified';
    return sex.charAt(0).toUpperCase() + sex.slice(1);
};

const formatTime = (time: string) => {
    const [hour, minute] = time.split(':').map(Number);
    return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(2026, 0, 1, hour, minute));
};

const formatDate = (date: string, options?: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(
        'en-US',
        options ?? {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        },
    ).format(new Date(`${date}T00:00:00`));

const add30Minutes = (time: string) => {
    const [hour, minute] = time.split(':').map(Number);
    const date = new Date(2026, 0, 1, hour, minute + 30);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

export default function CreateAppointment() {
    const {
        companies = [],
        serviceTypes = {},
        appointmentTypes = {},
        pePackage = {
            preEmploymentServices: [],
            optionalBulkServices: [],
        },
        auth,
        clinicHours,
        referral = null,
        bookingPolicy = {
            maximumUpcoming: 2,
            bookedDates: [],
            upcomingAppointments: [],
        },
    } = usePage<AppointmentPageProps>().props;
    const {
        today: clinicToday,
        time: clinicTime,
        minDate,
    } = useClinicHours(clinicHours);
    const storageKey = `appointment-draft-${auth.user.id}`;
    const isCompanyAccount = auth.user.role === 'company';

    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<BookingData>(() => {
        const draft = restoreDraft(storageKey);

        if (referral) {
            return {
                ...draft,
                company_referral_id: String(referral.id),
                type: 'company_referral',
                company_id: String(referral.company_id),
                service_types: referral.required_services,
                examination_purpose: referral.examination_purpose,
            };
        }

        return isCompanyAccount
            ? {
                  ...draft,
                  type: 'company_bulk',
                  company_id: String(auth.user.company_id ?? ''),
                  examination_purpose: 'annual_pe',
                  event_contact_name:
                      draft.event_contact_name.trim() || auth.user.name,
                  event_contact_number:
                      draft.event_contact_number.trim() ||
                      auth.user.contact ||
                      '',
              }
            : {
                  ...draft,
                  examination_purpose:
                      draft.examination_purpose === 'annual_pe'
                          ? ''
                          : draft.examination_purpose,
              };
    });
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [availability, setAvailability] =
        useState<AvailabilityResponse | null>(null);
    const [loadingDoctors, setLoadingDoctors] = useState(() =>
        ['individual', 'company_referral'].includes(formData.type),
    );
    const [loadingAvailability, setLoadingAvailability] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<BookingErrors>({});
    const [companySearch, setCompanySearch] = useState(() => {
        if (referral) return referral.company_name;
        const restoredCompanyId = restoreDraft(storageKey).company_id;
        return (
            companies.find(
                (company) => String(company.id) === restoredCompanyId,
            )?.company_name ?? ''
        );
    });
    const [companyMenuOpen, setCompanyMenuOpen] = useState(false);
    const [draftRestored, setDraftRestored] = useState(
        () =>
            typeof window !== 'undefined' &&
            localStorage.getItem(storageKey) !== null,
    );

    const appointmentTypeEntries = (
        Object.entries(appointmentTypes) as OptionEntry[]
    ).filter(
        ([value]) =>
            value !== 'walk_in' &&
            (isCompanyAccount
                ? value === 'company_bulk'
                : value !== 'company_bulk'),
    );
    const serviceEntries = Object.entries(serviceTypes) as OptionEntry[];
    const needsCompany = ['company_referral', 'company_bulk'].includes(
        formData.type,
    );
    const selectedDoctor = doctors.find(
        (doctor) => String(doctor.id) === formData.doctor_id,
    );
    const selectedCompany = companies.find(
        (company) => String(company.id) === formData.company_id,
    );
    const patientProfile = auth.user.patient_profile;

    const filteredCompanies = useMemo(
        () =>
            companies.filter((company) =>
                company.company_name
                    .toLowerCase()
                    .includes(companySearch.toLowerCase()),
            ),
        [companies, companySearch],
    );

    const availableTimes = (availability?.availableTimes ?? []).filter(
        (time) => {
            if (!formData.appointment_date) return true;
            return (
                formData.appointment_date !== clinicToday || time > clinicTime
            );
        },
    );
    const combinedSlotCounts = useMemo(
        () =>
            doctors.reduce<Record<string, number>>((counts, doctor) => {
                Object.entries(doctor.date_slot_counts ?? {}).forEach(
                    ([date, count]) => {
                        counts[date] = (counts[date] ?? 0) + count;
                    },
                );
                return counts;
            }, {}),
        [doctors],
    );
    const calendarSlotCounts =
        selectedDoctor?.date_slot_counts ?? combinedSlotCounts;

    useEffect(() => {
        const timeout = window.setTimeout(
            () => localStorage.setItem(storageKey, JSON.stringify(formData)),
            250,
        );
        return () => window.clearTimeout(timeout);
    }, [formData, storageKey]);

    useEffect(() => {
        const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
            if (!formData.doctor_id && !formData.service_types.length) return;
            event.preventDefault();
        };
        window.addEventListener('beforeunload', warnBeforeLeaving);
        return () =>
            window.removeEventListener('beforeunload', warnBeforeLeaving);
    }, [formData.doctor_id, formData.service_types.length]);

    useEffect(() => {
        if (!['individual', 'company_referral'].includes(formData.type)) {
            return;
        }

        const controller = new AbortController();
        fetch('/api/doctors', {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
        })
            .then(async (response) => {
                const data = (await response.json()) as unknown;
                if (!response.ok) {
                    const message =
                        data !== null &&
                        typeof data === 'object' &&
                        'message' in data &&
                        typeof data.message === 'string'
                            ? data.message
                            : 'Unable to load doctors.';
                    throw new Error(message);
                }
                return data;
            })
            .then((data) => {
                if (!isDoctorArray(data))
                    throw new Error(
                        'The doctor list returned an invalid response.',
                    );
                setDoctors(data);
            })
            .catch((error: unknown) => {
                if (
                    error instanceof DOMException &&
                    error.name === 'AbortError'
                )
                    return;
                setErrors((current) => ({
                    ...current,
                    doctors: getErrorMessage(error, 'Unable to load doctors.'),
                }));
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoadingDoctors(false);
            });
        return () => controller.abort();
    }, [formData.type]);

    useEffect(() => {
        if (!formData.doctor_id || !formData.appointment_date) {
            return;
        }
        const controller = new AbortController();
        const query = `?date=${encodeURIComponent(formData.appointment_date)}`;
        fetch(`/api/doctors/${formData.doctor_id}/availability${query}`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
        })
            .then((response) => {
                if (!response.ok)
                    throw new Error('Availability could not be loaded.');
                return response.json() as Promise<unknown>;
            })
            .then((data) => {
                if (!isAvailabilityResponse(data))
                    throw new Error(
                        'The schedule returned an invalid response.',
                    );
                setAvailability(data);
                setErrors((current) => ({
                    ...current,
                    availability: undefined,
                }));
            })
            .catch((error: unknown) => {
                if (
                    error instanceof DOMException &&
                    error.name === 'AbortError'
                )
                    return;
                setAvailability(null);
                setErrors((current) => ({
                    ...current,
                    availability: getErrorMessage(
                        error,
                        'Availability could not be loaded.',
                    ),
                }));
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoadingAvailability(false);
            });
        return () => controller.abort();
    }, [formData.doctor_id, formData.appointment_date]);

    const update = <K extends keyof BookingData>(
        key: K,
        value: BookingData[K],
    ) => {
        setFormData((current) => ({ ...current, [key]: value }));
        setErrors((current) => ({ ...current, [key]: undefined }));
    };

    const selectCompany = (company: Company) => {
        update('company_id', String(company.id));
        setCompanySearch(company.company_name);
        setCompanyMenuOpen(false);
    };

    const toggleService = (value: string) => {
        update(
            'service_types',
            formData.service_types.includes(value)
                ? formData.service_types.filter((service) => service !== value)
                : [...formData.service_types, value],
        );
    };

    const validateStep = () => {
        const nextErrors: BookingErrors = {};
        if (currentStep === 1) {
            if (!formData.examination_purpose)
                nextErrors.examination_purpose =
                    'Choose the purpose of this examination.';
            if (!formData.service_types.length)
                nextErrors.service_types =
                    'Choose at least one medical service.';
            if (!isCompanyAccount && needsCompany && !formData.company_id)
                nextErrors.company_id = 'Select the referring company.';
        }
        if (currentStep === 2) {
            if (!formData.appointment_date)
                nextErrors.appointment_date = 'Choose a date.';
            else if (formData.appointment_date < minDate)
                nextErrors.appointment_date =
                    'This date is no longer available. Please choose another day.';
            if (
                formData.type === 'individual' &&
                bookingPolicy.bookedDates.includes(formData.appointment_date)
            )
                nextErrors.appointment_date =
                    'You already have an appointment on this date.';
            if (
                formData.type === 'individual' &&
                bookingPolicy.upcomingAppointments.length >=
                    bookingPolicy.maximumUpcoming
            )
                nextErrors.appointment_limit =
                    'You already have the maximum number of upcoming appointments. Please complete or cancel an existing appointment before scheduling another one.';
            if (
                ['individual', 'company_referral'].includes(formData.type) &&
                !formData.doctor_id
            )
                nextErrors.doctor_id = 'Choose an available doctor.';
            if (
                ['individual', 'company_referral'].includes(formData.type) &&
                !formData.start_time
            )
                nextErrors.start_time = 'Choose an available time.';
        }
        if (currentStep === 3 && isCompanyAccount) {
            if (!formData.service_location)
                nextErrors.service_location = 'Choose a service setup.';
            if (!formData.expected_employee_count)
                nextErrors.expected_employee_count =
                    'Enter the expected employee count.';
            if (
                ['onsite', 'hybrid'].includes(formData.service_location) &&
                !formData.event_address.trim()
            )
                nextErrors.event_address = 'Enter the event address.';
            if (!formData.event_contact_name.trim())
                nextErrors.event_contact_name =
                    'Enter the onsite contact person.';
            if (!formData.event_contact_number.trim())
                nextErrors.event_contact_number =
                    'Enter the onsite contact number.';
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
        if (formData.appointment_date < minDate) {
            setErrors({
                appointment_date:
                    'This date is no longer available. Please choose another day.',
            });
            setCurrentStep(2);
            return;
        }
        setSubmitting(true);
        setErrors({});
        router.post(
            '/appointments',
            { ...formData },
            {
                preserveScroll: true,
                onSuccess: () => {
                    localStorage.removeItem(storageKey);
                    setSubmitting(false);
                },
                onError: (serverErrors) => {
                    setErrors(serverErrors);
                    setSubmitting(false);
                    const errorFields = Object.keys(serverErrors);
                    if (
                        errorFields.some((key) =>
                            [
                                'type',
                                'company_id',
                                'company_name',
                                'examination_purpose',
                                'service_types',
                            ].includes(key),
                        )
                    ) {
                        setCurrentStep(1);
                    } else if (
                        errorFields.some((key) =>
                            [
                                'appointment_date',
                                'doctor_id',
                                'start_time',
                            ].includes(key),
                        )
                    ) {
                        setCurrentStep(2);
                    } else if (errorFields.includes('notes')) {
                        setCurrentStep(3);
                    }
                },
                onFinish: () => setSubmitting(false),
            },
        );
    };

    return (
        <>
            <Head title="Book an appointment" />
            <AppLayout
                breadcrumbs={[
                    { title: 'Appointments', href: '/appointments' },
                    { title: 'Book Appointment', href: '/appointment' },
                ]}
            >
                <div className="min-h-full bg-background text-slate-900">
                    <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6">
                        <BookingIntro className="mb-5 lg:hidden" />

                        {draftRestored && (
                            <div className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-moss-100 bg-moss-50 px-4 py-3 text-xs text-moss-700 lg:hidden">
                                <span className="flex items-center gap-2">
                                    <Info className="size-4 shrink-0" /> Your
                                    saved booking draft has been restored.
                                </span>
                                <button
                                    onClick={() => setDraftRestored(false)}
                                    className="font-semibold"
                                >
                                    Dismiss
                                </button>
                            </div>
                        )}

                        {errors.appointment_limit && (
                            <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                                <p className="font-semibold">
                                    Appointment Limit Reached
                                </p>
                                <p className="mt-1 text-xs leading-5">
                                    {errors.appointment_limit}
                                </p>
                            </div>
                        )}

                        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_-40px_rgba(15,43,75,.35)]">
                                <div className="grid min-w-0 gap-6 border-b border-slate-100 px-5 py-5 sm:px-8 lg:grid-cols-[minmax(230px,0.7fr)_minmax(0,1.3fr)] lg:items-center">
                                    <div>
                                        <p className="text-xs font-semibold text-moss-600">
                                            Step {currentStep} of 4
                                        </p>
                                        <h2 className="mt-1 text-xl font-semibold tracking-[-.025em]">
                                            {currentStep === 1 &&
                                                'What care do you need?'}
                                            {currentStep === 2 &&
                                                (isCompanyAccount
                                                    ? 'Choose a preferred start date'
                                                    : 'Choose a date and time')}
                                            {currentStep === 3 &&
                                                'Confirm your information'}
                                            {currentStep === 4 &&
                                                'Review your appointment'}
                                        </h2>
                                        <p className="mt-1 text-sm text-slate-500">
                                            {currentStep === 1 &&
                                                'Select a visit type and the services you need.'}
                                            {currentStep === 2 &&
                                                (isCompanyAccount
                                                    ? 'The clinic will set the final one-day or two-day duration after reviewing your request.'
                                                    : 'Only currently available schedules are shown.')}
                                            {currentStep === 3 &&
                                                'We use the verified information saved in your profile.'}
                                            {currentStep === 4 &&
                                                'Check the details below before submitting your request.'}
                                        </p>
                                    </div>
                                    <div className="min-w-0 [&>nav]:mb-0 [&>nav]:w-full">
                                        <Progress currentStep={currentStep} />
                                    </div>
                                </div>

                                <div className="p-5 sm:p-8">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={currentStep}
                                            initial={{ opacity: 0, x: 12 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -12 }}
                                            transition={{ duration: 0.22 }}
                                        >
                                            {currentStep === 1 && (
                                                <VisitStep
                                                    appointmentTypes={
                                                        appointmentTypeEntries
                                                    }
                                                    serviceTypes={
                                                        serviceEntries
                                                    }
                                                    optionalBulkServices={
                                                        pePackage.optionalBulkServices
                                                    }
                                                    preEmploymentServices={
                                                        pePackage.preEmploymentServices
                                                    }
                                                    formData={formData}
                                                    errors={errors}
                                                    needsCompany={needsCompany}
                                                    isCompanyAccount={
                                                        isCompanyAccount
                                                    }
                                                    referral={referral}
                                                    companySearch={
                                                        companySearch
                                                    }
                                                    companyMenuOpen={
                                                        companyMenuOpen
                                                    }
                                                    filteredCompanies={
                                                        filteredCompanies
                                                    }
                                                    onType={(type) => {
                                                        if (referral) return;
                                                        setLoadingDoctors(
                                                            [
                                                                'individual',
                                                                'company_referral',
                                                            ].includes(type),
                                                        );
                                                        update('type', type);
                                                        update(
                                                            'company_id',
                                                            '',
                                                        );
                                                        update(
                                                            'appointment_date',
                                                            '',
                                                        );
                                                        update('doctor_id', '');
                                                        update(
                                                            'start_time',
                                                            '',
                                                        );
                                                        setDoctors([]);
                                                        setAvailability(null);
                                                        setCompanySearch('');
                                                    }}
                                                    onPurpose={(purpose) => {
                                                        update(
                                                            'examination_purpose',
                                                            purpose,
                                                        );
                                                        if (
                                                            purpose ===
                                                            'pre_employment'
                                                        ) {
                                                            update(
                                                                'service_types',
                                                                Array.from(
                                                                    new Set([
                                                                        ...pePackage.preEmploymentServices,
                                                                        ...formData.service_types,
                                                                    ]),
                                                                ),
                                                            );
                                                        } else {
                                                            update(
                                                                'service_types',
                                                                formData.service_types.filter(
                                                                    (service) =>
                                                                        !pePackage.preEmploymentServices.includes(
                                                                            service,
                                                                        ),
                                                                ),
                                                            );
                                                        }
                                                    }}
                                                    onService={toggleService}
                                                    onCompanySearch={(
                                                        value,
                                                    ) => {
                                                        setCompanySearch(value);
                                                        setCompanyMenuOpen(
                                                            true,
                                                        );
                                                        update(
                                                            'company_id',
                                                            '',
                                                        );
                                                    }}
                                                    onCompanySelect={
                                                        selectCompany
                                                    }
                                                    onCompanyFocus={() =>
                                                        setCompanyMenuOpen(true)
                                                    }
                                                />
                                            )}
                                            {currentStep === 2 && (
                                                <ScheduleStep
                                                    minDate={minDate}
                                                    doctors={doctors}
                                                    doctor={selectedDoctor}
                                                    times={availableTimes}
                                                    slotCounts={
                                                        calendarSlotCounts
                                                    }
                                                    selectedDate={
                                                        formData.appointment_date
                                                    }
                                                    selectedTime={
                                                        formData.start_time
                                                    }
                                                    loading={
                                                        loadingAvailability
                                                    }
                                                    loadingDoctors={
                                                        loadingDoctors
                                                    }
                                                    errors={errors}
                                                    requiresDoctor={
                                                        formData.type ===
                                                            'individual' ||
                                                        formData.type ===
                                                            'company_referral'
                                                    }
                                                    maxAllowedDate={
                                                        referral?.valid_until
                                                    }
                                                    onDate={(date) => {
                                                        setAvailability(null);
                                                        setLoadingAvailability(
                                                            Boolean(
                                                                date &&
                                                                formData.doctor_id,
                                                            ),
                                                        );
                                                        update(
                                                            'appointment_date',
                                                            date,
                                                        );
                                                        update(
                                                            'start_time',
                                                            '',
                                                        );
                                                    }}
                                                    onDoctor={(doctorId) => {
                                                        setAvailability(null);
                                                        setLoadingAvailability(
                                                            Boolean(
                                                                formData.appointment_date,
                                                            ),
                                                        );
                                                        update(
                                                            'doctor_id',
                                                            doctorId,
                                                        );
                                                        update(
                                                            'start_time',
                                                            '',
                                                        );
                                                    }}
                                                    onTime={(time) =>
                                                        update(
                                                            'start_time',
                                                            time,
                                                        )
                                                    }
                                                />
                                            )}
                                            {currentStep === 3 && (
                                                <DetailsStep
                                                    user={auth.user}
                                                    profile={patientProfile}
                                                    isCompanyAccount={
                                                        isCompanyAccount
                                                    }
                                                    notes={formData.notes}
                                                    event={formData}
                                                    errors={errors}
                                                    onEvent={(field, value) =>
                                                        update(field, value)
                                                    }
                                                    onNotes={(notes) =>
                                                        update('notes', notes)
                                                    }
                                                />
                                            )}
                                            {currentStep === 4 && (
                                                <ReviewStep
                                                    formData={formData}
                                                    doctor={selectedDoctor}
                                                    company={selectedCompany}
                                                    appointmentTypes={
                                                        appointmentTypes
                                                    }
                                                    serviceTypes={serviceTypes}
                                                    user={auth.user}
                                                    profile={patientProfile}
                                                    onEdit={setCurrentStep}
                                                />
                                            )}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>

                                <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-8 dark:border-border dark:bg-card/95">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCurrentStep((step) =>
                                                Math.max(1, step - 1),
                                            )
                                        }
                                        disabled={
                                            currentStep === 1 || submitting
                                        }
                                        className="inline-flex h-12 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:invisible dark:border-border dark:text-slate-300 dark:hover:bg-muted"
                                    >
                                        <ArrowLeft className="size-4" /> Back
                                    </button>
                                    {currentStep < 4 ? (
                                        <button
                                            type="button"
                                            onClick={continueForward}
                                            className="inline-flex h-12 min-w-36 items-center justify-center gap-2 rounded-xl bg-moss-600 px-5 text-sm font-semibold text-white shadow-lg shadow-moss-600/20 transition hover:-translate-y-0.5 hover:bg-moss-700 focus-visible:ring-4 focus-visible:ring-moss-500/20 focus-visible:outline-none"
                                        >
                                            Continue{' '}
                                            <ArrowRight className="size-4" />
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={submit}
                                            disabled={submitting}
                                            className="inline-flex h-12 min-w-44 items-center justify-center gap-2 rounded-xl bg-moss-600 px-5 text-sm font-semibold text-white shadow-lg shadow-moss-600/20 transition hover:-translate-y-0.5 hover:bg-moss-700 disabled:pointer-events-none disabled:opacity-65"
                                        >
                                            {submitting ? (
                                                <>
                                                    <LoaderCircle className="size-4 animate-spin" />{' '}
                                                    Booking securely…
                                                </>
                                            ) : (
                                                <>
                                                    <Check className="size-4" />{' '}
                                                    Confirm booking
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </section>

                            <div className="sticky top-24 z-20 hidden max-h-[calc(100vh-7.5rem)] space-y-4 self-start overflow-y-auto pb-1 lg:block">
                                <BookingIntro />
                                {draftRestored && (
                                    <div className="rounded-xl border border-moss-100 bg-moss-50 p-4 text-xs text-moss-700">
                                        <span className="flex items-start gap-2 leading-5">
                                            <Info className="mt-0.5 size-4 shrink-0" />
                                            Your saved booking draft has been
                                            restored.
                                        </span>
                                        <button
                                            onClick={() =>
                                                setDraftRestored(false)
                                            }
                                            className="mt-2 ml-6 font-semibold"
                                        >
                                            Dismiss
                                        </button>
                                    </div>
                                )}
                                <BookingSummary
                                    formData={formData}
                                    doctor={selectedDoctor}
                                    appointmentTypes={appointmentTypes}
                                />
                            </div>
                        </div>
                    </main>
                </div>
            </AppLayout>
        </>
    );
}

function BookingIntro({ className = '' }: { className?: string }) {
    return (
        <section
            className={`relative overflow-hidden rounded-2xl border border-moss-100 bg-moss-50/70 px-5 py-4 shadow-[0_16px_45px_-34px_rgba(15,43,75,.35)] ${className}`}
        >
            <div className="absolute -top-12 -right-12 size-28 rounded-full bg-moss-100/70" />
            <div className="relative">
                <p className="text-[11px] font-bold tracking-[.16em] text-moss-600 uppercase">
                    Online scheduling
                </p>
                <h1 className="mt-1 text-xl font-semibold tracking-[-.035em] text-slate-950 sm:text-2xl">
                    Book your clinic visit
                </h1>
                <p className="mt-1.5 text-sm leading-5 text-slate-600">
                    Choose your care, find a convenient schedule, and review
                    everything before confirming.
                </p>
            </div>
        </section>
    );
}

function Progress({ currentStep }: { currentStep: number }) {
    return (
        <nav aria-label="Booking progress" className="mb-7 w-full pb-1">
            <ol className="grid w-full grid-cols-5 items-start">
                {STEPS.map((item, index) => {
                    const step = index + 1;
                    const complete = step < currentStep;
                    const active = step === currentStep;
                    return (
                        <li
                            key={item.title}
                            className="relative flex min-w-0 flex-col items-center text-center"
                            aria-current={active ? 'step' : undefined}
                        >
                            {index < STEPS.length - 1 && (
                                <span
                                    className={`absolute top-[18px] left-[calc(50%+1.25rem)] h-px w-[calc(100%-2.5rem)] ${complete ? 'bg-moss-400 dark:bg-moss-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                                />
                            )}
                            <div className="relative z-10 flex min-w-0 flex-col items-center gap-2">
                                <span
                                    className={`flex size-9 items-center justify-center rounded-full text-xs font-bold transition ${complete ? 'bg-moss-500 text-white' : active ? 'bg-moss-600 text-white ring-4 ring-moss-100 dark:ring-moss-900' : 'border border-slate-200 bg-white text-slate-400 dark:border-slate-700 dark:bg-card'}`}
                                >
                                    {complete ? (
                                        <Check className="size-4" />
                                    ) : (
                                        step
                                    )}
                                </span>
                                <span
                                    className={`w-full text-[10px] font-semibold sm:text-xs ${active ? 'text-slate-900' : complete ? 'text-moss-700' : 'text-slate-400'}`}
                                >
                                    {item.short}
                                </span>
                            </div>
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
    optionalBulkServices: string[];
    preEmploymentServices: string[];
    formData: BookingData;
    errors: BookingErrors;
    needsCompany: boolean;
    isCompanyAccount: boolean;
    referral: AppointmentPageProps['referral'];
    companySearch: string;
    companyMenuOpen: boolean;
    filteredCompanies: Company[];
    onType: (type: string) => void;
    onPurpose: (purpose: string) => void;
    onService: (service: string) => void;
    onCompanySearch: (search: string) => void;
    onCompanySelect: (company: Company) => void;
    onCompanyFocus: () => void;
}

function VisitStep({
    appointmentTypes,
    serviceTypes,
    optionalBulkServices,
    preEmploymentServices,
    formData,
    errors,
    needsCompany,
    isCompanyAccount,
    referral,
    companySearch,
    companyMenuOpen,
    filteredCompanies,
    onType,
    onPurpose,
    onService,
    onCompanySearch,
    onCompanySelect,
    onCompanyFocus,
}: VisitStepProps) {
    const examinationPurposes = EXAMINATION_PURPOSES.filter(([value]) =>
        isCompanyAccount
            ? value === 'annual_pe'
            : referral
              ? value === formData.examination_purpose
              : value !== 'annual_pe',
    );

    return (
        <div className="space-y-8">
            {referral && (
                <div className="rounded-xl border border-moss-200 bg-moss-50 p-4">
                    <p className="text-sm font-semibold text-moss-900">
                        Verified company referral
                    </p>
                    <p className="mt-1 text-xs text-moss-700">
                        {referral.company_name} · {referral.referral_number} ·
                        valid through {formatDate(referral.valid_until)}
                    </p>
                    <p className="mt-2 text-xs text-moss-700">
                        Required services are set by the referring company and
                        cannot be removed.
                    </p>
                </div>
            )}
            <div className="grid items-start gap-8 lg:grid-cols-2">
                <FieldGroup
                    title="Visit type"
                    description="How will this appointment be arranged?"
                >
                    {isCompanyAccount ? (
                        <div className="rounded-2xl border border-moss-200 bg-moss-50 p-4">
                            <p className="text-sm font-semibold text-moss-900">
                                Company bulk booking
                            </p>
                            <p className="mt-1 text-xs leading-5 text-moss-700">
                                This booking is automatically linked to your
                                company account. No company selection is
                                required.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {appointmentTypes.map(([value, label]) => {
                                const detail =
                                    TYPE_DETAILS[value] ??
                                    TYPE_DETAILS.individual;
                                const Icon = detail.icon;
                                const selected = formData.type === value;
                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => onType(value)}
                                        disabled={!!referral}
                                        aria-pressed={selected}
                                        className={`relative min-h-36 rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-4 focus-visible:ring-moss-500/15 focus-visible:outline-none ${selected ? 'border-moss-500 bg-moss-50 shadow-sm' : 'border-slate-200 bg-white hover:border-moss-200'}`}
                                    >
                                        {selected && (
                                            <span className="absolute top-3 right-3 flex size-5 items-center justify-center rounded-full bg-moss-600 text-white">
                                                <Check className="size-3" />
                                            </span>
                                        )}
                                        <span
                                            className={`flex size-10 items-center justify-center rounded-xl ${selected ? 'bg-moss-600 text-white' : 'bg-slate-100 text-slate-500'}`}
                                        >
                                            <Icon className="size-5" />
                                        </span>
                                        <span className="mt-3 block text-sm font-semibold text-slate-900">
                                            {label}
                                        </span>
                                        <span className="mt-1 block text-xs leading-5 text-slate-500">
                                            {detail.description}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </FieldGroup>

                <FieldGroup
                    title="Examination purpose"
                    description={
                        isCompanyAccount
                            ? 'Company bulk appointments use Annual Examination automatically.'
                            : referral
                              ? 'This purpose was specified by the referring company.'
                              : 'Choose why this medical examination is being requested.'
                    }
                >
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                        {examinationPurposes.map(([value, label]) => {
                            const selected =
                                formData.examination_purpose === value;
                            const Icon = EXAMINATION_PURPOSE_ICONS[value];
                            return (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => onPurpose(value)}
                                    disabled={isCompanyAccount || !!referral}
                                    aria-pressed={selected}
                                    className={`flex min-h-12 items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition focus-visible:ring-4 focus-visible:ring-moss-500/15 focus-visible:outline-none ${selected ? 'border-moss-500 bg-moss-50 text-moss-800' : 'border-slate-200 text-slate-700 hover:border-moss-300'}`}
                                >
                                    <span
                                        className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${selected ? 'bg-moss-600 text-white' : 'bg-slate-100 text-slate-500'}`}
                                    >
                                        <Icon className="size-4" />
                                    </span>
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                    <InlineError message={errors.examination_purpose} />
                </FieldGroup>
            </div>

            {needsCompany && !isCompanyAccount && (
                <FieldGroup
                    title="Referring company"
                    description="Select the company associated with this appointment."
                >
                    <div className="relative max-w-xl">
                        <Building2 className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2 text-slate-400" />
                        <input
                            value={companySearch}
                            onChange={(event) =>
                                onCompanySearch(event.target.value)
                            }
                            onFocus={onCompanyFocus}
                            placeholder="Search for your company"
                            aria-label="Referring company"
                            aria-invalid={!!errors.company_id}
                            disabled={!!referral}
                            className="h-12 w-full rounded-xl border border-slate-200 pr-4 pl-10 text-sm transition outline-none focus:border-moss-500 focus:ring-4 focus:ring-moss-500/10"
                        />
                        {companyMenuOpen && companySearch && (
                            <div className="absolute z-20 mt-2 max-h-52 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                                {filteredCompanies.length ? (
                                    filteredCompanies.map(
                                        (company: Company) => (
                                            <button
                                                key={company.id}
                                                type="button"
                                                onClick={() =>
                                                    onCompanySelect(company)
                                                }
                                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-moss-50"
                                            >
                                                <Building2 className="size-4 text-slate-400" />
                                                {company.company_name}
                                            </button>
                                        ),
                                    )
                                ) : (
                                    <p className="px-3 py-3 text-sm text-slate-500">
                                        No matching company found.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                    <InlineError message={errors.company_id} />
                </FieldGroup>
            )}

            <FieldGroup
                title="Medical services"
                description="Select services based on your needed service during this visit."
            >
                <div className="grid gap-3 sm:grid-cols-2">
                    {serviceTypes.map(([value, label], index) => {
                        const selected = formData.service_types.includes(value);
                        const includedInPreEmployment =
                            formData.examination_purpose === 'pre_employment' &&
                            preEmploymentServices.includes(value);
                        const Icon =
                            SERVICE_ICONS[index % SERVICE_ICONS.length];
                        return (
                            <button
                                key={value}
                                type="button"
                                onClick={() => onService(value)}
                                disabled={!!referral || includedInPreEmployment}
                                aria-pressed={selected}
                                className={`flex min-h-16 items-center gap-3 rounded-xl border px-4 py-3 text-left transition hover:border-moss-300 focus-visible:ring-4 focus-visible:ring-moss-500/15 focus-visible:outline-none ${selected ? 'border-moss-500 bg-moss-50' : 'border-slate-200'}`}
                            >
                                <span
                                    className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${selected ? 'bg-moss-600 text-white' : 'bg-slate-100 text-slate-500'}`}
                                >
                                    <Icon className="size-4" />
                                </span>
                                <span className="flex-1 text-sm font-medium text-slate-800">
                                    {label}
                                    {formData.type === 'company_bulk' &&
                                        optionalBulkServices.includes(
                                            value,
                                        ) && (
                                            <small className="mt-0.5 block text-xs font-semibold text-amber-700">
                                                Optional add-on
                                            </small>
                                        )}
                                    {includedInPreEmployment && (
                                        <small className="mt-0.5 block text-xs font-semibold text-moss-700">
                                            Included in Pre-employment
                                        </small>
                                    )}
                                </span>
                                <span
                                    className={`flex size-5 items-center justify-center rounded-md border ${selected ? 'border-moss-600 bg-moss-600 text-white' : 'border-slate-300'}`}
                                >
                                    {selected && <Check className="size-3" />}
                                </span>
                            </button>
                        );
                    })}
                </div>
                <InlineError message={errors.service_types} />
            </FieldGroup>
        </div>
    );
}

interface ScheduleStepProps {
    minDate: string;
    doctors: Doctor[];
    doctor?: Doctor;
    times: string[];
    slotCounts: Record<string, number>;
    selectedDate: string;
    selectedTime: string;
    loading: boolean;
    loadingDoctors: boolean;
    maxAllowedDate?: string;
    errors: BookingErrors;
    requiresDoctor: boolean;
    onDate: (date: string) => void;
    onDoctor: (doctorId: string) => void;
    onTime: (time: string) => void;
}

function ScheduleStep({
    minDate,
    doctors,
    doctor,
    times,
    slotCounts,
    selectedDate,
    selectedTime,
    loading,
    loadingDoctors,
    maxAllowedDate,
    errors,
    requiresDoctor,
    onDate,
    onDoctor,
    onTime,
}: ScheduleStepProps) {
    const today = minDate;
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 29);
    const schedulingLimit = maxDate.toISOString().slice(0, 10);
    const latestDate =
        maxAllowedDate && maxAllowedDate < schedulingLimit
            ? maxAllowedDate
            : schedulingLimit;

    if (!requiresDoctor) {
        return (
            <FieldGroup
                title="Preferred event start date"
                description="Request your preferred starting date. The clinic will decide whether the program needs one or two full days and will assign all doctors and staff after review."
            >
                <AppointmentDateInput
                    min={today}
                    max={latestDate}
                    value={selectedDate}
                    error={errors.appointment_date}
                    onChange={onDate}
                />
            </FieldGroup>
        );
    }

    return (
        <div className="space-y-8">
            <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(340px,420px)]">
                <div className="order-2">
                    <FieldGroup
                        title="Appointment date"
                        description={
                            doctor
                                ? `Showing availability for Dr. ${doctor.first_name} ${doctor.last_name}.`
                                : 'Choose a date to see its combined availability across all doctors.'
                        }
                    >
                        <AppointmentDateInput
                            min={today}
                            max={latestDate}
                            value={selectedDate}
                            error={errors.appointment_date}
                            onChange={onDate}
                            slotCounts={slotCounts}
                            slotCountContext={
                                doctor
                                    ? `with Dr. ${doctor.first_name} ${doctor.last_name}`
                                    : 'across all doctors'
                            }
                            loadingSlotCounts={loadingDoctors}
                        />
                    </FieldGroup>
                </div>

                <div className="order-1">
                    <FieldGroup
                        title="Available doctors"
                        description={
                            selectedDate
                                ? `All active doctors are shown. Slot counts are for ${formatDate(selectedDate, { month: 'long', day: 'numeric' })}.`
                                : 'Select a doctor to show only their availability on the calendar.'
                        }
                    >
                        {loadingDoctors ? (
                            <LoadingState label="Finding available doctors…" />
                        ) : errors.doctors ? (
                            <InlineError message={errors.doctors} />
                        ) : doctors.length ? (
                            <div className="grid gap-3">
                                {doctors.map((availableDoctor) => {
                                    const selected =
                                        doctor?.id === availableDoctor.id;
                                    const initials = `${availableDoctor.first_name[0] ?? ''}${availableDoctor.last_name[0] ?? ''}`;
                                    const slotsOnSelectedDate = selectedDate
                                        ? (availableDoctor.date_slot_counts?.[
                                              selectedDate
                                          ] ?? 0)
                                        : null;
                                    const availabilityLabel =
                                        slotsOnSelectedDate === null
                                            ? formatDoctorSex(
                                                  availableDoctor.sex,
                                              )
                                            : `${slotsOnSelectedDate} slot${slotsOnSelectedDate === 1 ? '' : 's'} available`;
                                    return (
                                        <button
                                            key={availableDoctor.id}
                                            type="button"
                                            onClick={() =>
                                                onDoctor(
                                                    String(availableDoctor.id),
                                                )
                                            }
                                            aria-pressed={selected}
                                            className={`flex min-h-20 items-center gap-3 rounded-xl border p-3.5 text-left transition hover:border-moss-300 focus-visible:ring-4 focus-visible:ring-moss-500/15 focus-visible:outline-none ${selected ? 'border-moss-500 bg-moss-50' : 'border-slate-200'}`}
                                        >
                                            <span
                                                className={`flex size-11 shrink-0 items-center justify-center rounded-full text-xs font-bold ${selected ? 'bg-moss-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                                            >
                                                {initials}
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm font-semibold">
                                                    Dr.{' '}
                                                    {availableDoctor.first_name}{' '}
                                                    {availableDoctor.last_name}
                                                </span>
                                                <span className="mt-0.5 block truncate text-xs text-slate-500">
                                                    {availableDoctor.specialization ||
                                                        'Clinic physician'}
                                                </span>
                                                <span className="mt-1 block text-[11px] text-slate-500">
                                                    {availabilityLabel}
                                                </span>
                                            </span>
                                            {selected && (
                                                <CheckCircle2 className="size-5 shrink-0 text-moss-600" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <EmptyAvailability message="No active doctors are currently available for online booking." />
                        )}
                        <InlineError message={errors.doctor_id} />
                    </FieldGroup>
                </div>

                <div className="order-3 lg:col-span-2 lg:col-start-1">
                    {doctor &&
                        selectedDate &&
                        (loading ? (
                            <LoadingState label="Checking the latest availability…" />
                        ) : errors.availability ? (
                            <InlineError message={errors.availability} />
                        ) : (
                            <FieldGroup
                                title="Available times"
                                description={`${times.length} slot${times.length === 1 ? '' : 's'} remaining on ${formatDate(selectedDate, { month: 'long', day: 'numeric' })}.`}
                            >
                                {times.length ? (
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
                                        {times.map((time) => {
                                            const selected =
                                                selectedTime === time;
                                            return (
                                                <button
                                                    key={time}
                                                    type="button"
                                                    onClick={() => onTime(time)}
                                                    aria-pressed={selected}
                                                    className={`min-h-12 rounded-xl border px-2.5 py-2 text-center transition hover:border-moss-300 focus-visible:ring-4 focus-visible:ring-moss-500/15 focus-visible:outline-none ${selected ? 'border-moss-600 bg-moss-600 text-white' : 'border-slate-200'}`}
                                                >
                                                    <span className="block text-sm font-semibold">
                                                        {formatTime(time)}
                                                    </span>
                                                    <span
                                                        className={`mt-0.5 block text-[10px] ${selected ? 'text-moss-100' : 'text-slate-400'}`}
                                                    >
                                                        until{' '}
                                                        {formatTime(
                                                            add30Minutes(time),
                                                        )}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <EmptyAvailability message="No time slots remain for this date. Please choose another date." />
                                )}
                                <InlineError message={errors.start_time} />
                            </FieldGroup>
                        ))}
                </div>
            </div>
        </div>
    );
}

interface DetailsStepProps {
    user: AppointmentUser;
    profile?: PatientProfile | null;
    isCompanyAccount: boolean;
    notes: string;
    onNotes: (notes: string) => void;
    event: BookingData;
    errors: BookingErrors;
    onEvent: (field: keyof BookingData, value: string) => void;
}

function DetailsStep({
    user,
    profile,
    isCompanyAccount,
    notes,
    onNotes,
    event,
    errors,
    onEvent,
}: DetailsStepProps) {
    const age = calculateAge(profile?.birthdate);
    const details = [
        { label: 'Full name', value: user.name, icon: UserRound },
        { label: 'Email address', value: user.email, icon: Mail },
        {
            label: 'Contact number',
            value: user.contact || 'Not provided',
            icon: Phone,
        },
        {
            label: 'Birthdate',
            value: profile?.birthdate
                ? new Date(String(profile.birthdate)).toLocaleDateString()
                : 'Not provided',
            icon: CalendarDays,
        },
        {
            label: 'Age',
            value: age === null ? 'Not available' : `${age} years old`,
            icon: CakeSlice,
        },
        {
            label: 'Civil status',
            value: profile?.civil_status
                ? profile.civil_status
                      .replace(/_/g, ' ')
                      .replace(/\b\w/g, (letter) => letter.toUpperCase())
                : 'Not provided',
            icon: UserRound,
        },
    ];
    return (
        <div className="space-y-7">
            {isCompanyAccount ? (
                <div className="space-y-4">
                    <div className="rounded-xl border border-moss-100 bg-moss-50 p-4 text-sm text-moss-800">
                        Only the company representative's contact information is
                        needed for this bulk request.
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="text-sm font-semibold text-slate-800">
                            Service setup
                            <select
                                value={event.service_location}
                                onChange={(e) => {
                                    const location = e.target.value;
                                    onEvent('service_location', location);
                                    if (location === 'clinic') {
                                        onEvent('event_address', '');
                                    }
                                }}
                                className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal"
                            >
                                <option value="onsite">
                                    Onsite at company
                                </option>
                                <option value="clinic">At LMIC clinic</option>
                                <option value="hybrid">Hybrid</option>
                            </select>
                        </label>
                        <label className="text-sm font-semibold text-slate-800">
                            Expected employees
                            <input
                                type="number"
                                min="1"
                                max="5000"
                                required
                                value={event.expected_employee_count}
                                onChange={(e) =>
                                    onEvent(
                                        'expected_employee_count',
                                        e.target.value,
                                    )
                                }
                                className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal"
                            />
                        </label>
                        <InlineError message={errors.expected_employee_count} />
                        {(event.service_location === 'onsite' ||
                            event.service_location === 'hybrid') && (
                            <div className="sm:col-span-2">
                                <label className="text-sm font-semibold text-slate-800">
                                    Event address
                                    <input
                                        required
                                        maxLength={500}
                                        value={event.event_address}
                                        onChange={(e) =>
                                            onEvent(
                                                'event_address',
                                                e.target.value,
                                            )
                                        }
                                        className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal"
                                    />
                                </label>
                                <InlineError message={errors.event_address} />
                            </div>
                        )}
                        <label className="text-sm font-semibold text-slate-800">
                            {event.service_location === 'clinic'
                                ? 'Clinic coordination contact'
                                : 'Event contact person'}
                            <input
                                required
                                readOnly
                                maxLength={255}
                                value={event.event_contact_name}
                                className="mt-2 h-11 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3 font-normal text-slate-600"
                            />
                        </label>
                        <label className="text-sm font-semibold text-slate-800">
                            Contact number
                            <input
                                required
                                readOnly
                                maxLength={30}
                                value={event.event_contact_number}
                                className="mt-2 h-11 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3 font-normal text-slate-600"
                            />
                        </label>
                        <p className="text-xs text-slate-500 sm:col-span-2">
                            These details come from the company representative's
                            profile and cannot be changed during booking.
                        </p>
                        <InlineError
                            message={
                                errors.event_contact_name ??
                                errors.event_contact_number
                            }
                        />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="flex min-h-18 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm">
                                <Mail className="size-4" />
                            </span>
                            <div className="min-w-0">
                                <p className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
                                    Email address
                                </p>
                                <p className="mt-0.5 truncate text-sm font-semibold text-slate-800">
                                    {user.email}
                                </p>
                            </div>
                        </div>
                        <div className="flex min-h-18 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm">
                                <Phone className="size-4" />
                            </span>
                            <div className="min-w-0">
                                <p className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
                                    Contact number
                                </p>
                                <p className="mt-0.5 truncate text-sm font-semibold text-slate-800">
                                    {user.contact || 'Not provided'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {details.map(({ label, value, icon: Icon }) => (
                            <div
                                key={label}
                                className="flex min-h-18 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5"
                            >
                                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm">
                                    <Icon className="size-4" />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
                                        {label}
                                    </p>
                                    <p className="mt-0.5 truncate text-sm font-semibold text-slate-800">
                                        {value}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-start gap-3 rounded-xl border border-moss-100 bg-moss-50 p-4 text-xs leading-5 text-moss-700">
                        <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                        <p>
                            Your verified profile information will be attached
                            to this appointment. To correct it, visit{' '}
                            <Link
                                href="/settings/profile"
                                className="font-semibold underline underline-offset-2"
                            >
                                Profile Settings
                            </Link>{' '}
                            before booking.
                        </p>
                    </div>
                </>
            )}
            <div>
                <label
                    htmlFor="booking-notes"
                    className="mb-2 block text-sm font-semibold text-slate-800"
                >
                    Additional notes{' '}
                    <span className="font-normal text-slate-400">
                        (optional)
                    </span>
                </label>
                <div className="relative">
                    <FileHeart className="pointer-events-none absolute top-3.5 left-3.5 size-4 text-slate-400" />
                    <textarea
                        id="booking-notes"
                        value={notes}
                        onChange={(event) => onNotes(event.target.value)}
                        rows={4}
                        maxLength={500}
                        placeholder="Share symptoms, accessibility needs, or anything the clinic should know."
                        className="w-full resize-none rounded-xl border border-slate-200 py-3 pr-4 pl-10 text-sm transition outline-none placeholder:text-slate-400 focus:border-moss-500 focus:ring-4 focus:ring-moss-500/10"
                    />
                </div>
                <p className="mt-1.5 text-right text-[10px] text-slate-400">
                    {notes.length}/500
                </p>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <Info className="mt-0.5 size-4 shrink-0 text-amber-600" />
                <div>
                    <p className="text-xs font-semibold text-amber-900">
                        Before your visit
                    </p>
                    <p className="mt-1 text-xs leading-5 text-amber-700">
                        Please bring one 1×1 ID photo and a stool sample.
                        Magdala ng 1×1 na litrato at sample ng dumi.
                    </p>
                </div>
            </div>
        </div>
    );
}

function calculateAge(birthdate?: string | null): number | null {
    if (!birthdate) return null;

    const dateOfBirth = new Date(birthdate);
    if (Number.isNaN(dateOfBirth.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const birthdayHasPassed =
        today.getMonth() > dateOfBirth.getMonth() ||
        (today.getMonth() === dateOfBirth.getMonth() &&
            today.getDate() >= dateOfBirth.getDate());

    if (!birthdayHasPassed) age -= 1;

    return age >= 0 ? age : null;
}

interface ReviewStepProps {
    formData: BookingData;
    doctor?: Doctor;
    company?: Company;
    appointmentTypes: Record<string, string>;
    serviceTypes: Record<string, string>;
    user: AppointmentUser;
    profile?: PatientProfile | null;
    onEdit: (step: number) => void;
}

interface ReviewSection {
    title: string;
    step: number;
    icon: LucideIcon;
    rows: [string, string][];
}

function ReviewStep({
    formData,
    doctor,
    company,
    appointmentTypes,
    serviceTypes,
    user,
    profile,
    onEdit,
}: ReviewStepProps) {
    const age = calculateAge(profile?.birthdate);
    const sections: ReviewSection[] = [
        {
            title: 'Visit and care team',
            step: 1,
            icon: Stethoscope,
            rows: [
                [
                    'Appointment type',
                    appointmentTypes[formData.type] || formData.type,
                ],
                ...(doctor
                    ? [
                          [
                              'Doctor',
                              `Dr. ${doctor.first_name} ${doctor.last_name}`,
                          ] as [string, string],
                          ['Doctor gender', formatDoctorSex(doctor.sex)] as [
                              string,
                              string,
                          ],
                      ]
                    : []),
                ...(company
                    ? [['Company', company.company_name] as [string, string]]
                    : []),
                [
                    'Services',
                    formData.service_types
                        .map((code: string) => serviceTypes[code] || code)
                        .join(', '),
                ],
            ],
        },
        {
            title: 'Schedule',
            step: 2,
            icon: CalendarDays,
            rows: [
                [
                    formData.type === 'company_bulk'
                        ? 'Requested start date'
                        : 'Date',
                    formatDate(formData.appointment_date),
                ],
                ...(formData.start_time
                    ? [
                          [
                              'Time',
                              `${formatTime(formData.start_time)} – ${formatTime(add30Minutes(formData.start_time))}`,
                          ] as [string, string],
                      ]
                    : [
                          [
                              'Schedule',
                              formData.type === 'company_bulk'
                                  ? 'Duration and staff decided by the clinic'
                                  : 'To be coordinated by the clinic',
                          ] as [string, string],
                      ]),
            ],
        },
        {
            title:
                formData.type === 'company_bulk'
                    ? 'Company contact details'
                    : 'Patient details',
            step: 3,
            icon: UserRound,
            rows:
                formData.type === 'company_bulk'
                    ? [
                          ['Email', user.email],
                          [
                              'Service setup',
                              formData.service_location === 'clinic'
                                  ? 'At LMIC clinic'
                                  : formData.service_location === 'hybrid'
                                    ? 'Hybrid'
                                    : 'Onsite at company',
                          ],
                          ...(formData.event_address
                              ? [
                                    [
                                        'Event address',
                                        formData.event_address,
                                    ] as [string, string],
                                ]
                              : []),
                          ['Coordination contact', formData.event_contact_name],
                          ['Contact number', formData.event_contact_number],
                          [
                              'Expected employees',
                              formData.expected_employee_count,
                          ],
                          ...(formData.notes
                              ? [['Notes', formData.notes] as [string, string]]
                              : []),
                      ]
                    : [
                          ['Patient', user.name],
                          [
                              'Age',
                              age === null
                                  ? 'Not available'
                                  : `${age} years old`,
                          ],
                          [
                              'Civil status',
                              profile?.civil_status
                                  ? profile.civil_status
                                        .replace(/_/g, ' ')
                                        .replace(/\b\w/g, (letter) =>
                                            letter.toUpperCase(),
                                        )
                                  : 'Not provided',
                          ],
                          ['Contact', user.contact || user.email],
                          ...(formData.notes
                              ? [['Notes', formData.notes] as [string, string]]
                              : []),
                      ],
        },
    ];
    return (
        <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-moss-100 bg-moss-50 p-4 text-xs leading-5 text-moss-800">
                <ShieldCheck className="mt-0.5 size-4 shrink-0" /> Your
                information is encrypted and will only be used to coordinate
                your care.
            </div>
            {sections.map(({ title, step, icon: Icon, rows }) => (
                <section
                    key={title}
                    className="overflow-hidden rounded-xl border border-slate-200"
                >
                    <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
                        <h3 className="flex items-center gap-2 text-sm font-semibold">
                            <Icon className="size-4 text-moss-600" />
                            {title}
                        </h3>
                        <button
                            type="button"
                            onClick={() => onEdit(step)}
                            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-moss-600 hover:bg-moss-50"
                        >
                            Edit
                        </button>
                    </div>
                    <dl className="divide-y divide-slate-100 px-4">
                        {rows.map(([label, value]) => (
                            <div
                                key={label}
                                className="grid gap-1 py-3 sm:grid-cols-[130px_1fr]"
                            >
                                <dt className="text-xs text-slate-500">
                                    {label}
                                </dt>
                                <dd className="text-sm leading-5 font-medium text-slate-800">
                                    {value}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </section>
            ))}
            <p className="flex items-center gap-2 text-[11px] text-slate-400">
                <Info className="size-3.5" /> You can still edit any section
                before confirming.
            </p>
        </div>
    );
}

interface BookingSummaryProps {
    formData: BookingData;
    doctor?: Doctor;
    appointmentTypes: Record<string, string>;
}

function BookingSummary({
    formData,
    doctor,
    appointmentTypes,
}: BookingSummaryProps) {
    return (
        <aside className="rounded-2xl border border-slate-200 bg-white/95 p-5 text-slate-900 shadow-[0_22px_55px_-28px_rgba(15,43,75,.38)] ring-1 ring-slate-900/5 backdrop-blur dark:border-border dark:bg-card/95 dark:text-slate-100 dark:ring-white/10">
            <p className="text-xs font-bold tracking-[.14em] text-slate-400 uppercase dark:text-slate-400">
                Your appointment
            </p>
            <div className="mt-4 flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-moss-50 text-moss-600 dark:bg-moss-900/60 dark:text-moss-200">
                    <CalendarDays className="size-5" />
                </span>
                <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {appointmentTypes[formData.type] ||
                            'Clinic appointment'}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                        {formData.service_types.length} service
                        {formData.service_types.length === 1 ? '' : 's'}{' '}
                        selected
                    </p>
                </div>
            </div>
            <div className="mt-5 space-y-3 border-t border-slate-100 pt-4 dark:border-border">
                <SummaryLine
                    icon={Stethoscope}
                    label={
                        doctor
                            ? `Dr. ${doctor.first_name} ${doctor.last_name}`
                            : formData.type === 'individual'
                              ? 'Choose a doctor'
                              : 'Clinic team to be assigned'
                    }
                    active={!!doctor || formData.type !== 'individual'}
                />
                <SummaryLine
                    icon={CalendarDays}
                    label={
                        formData.appointment_date
                            ? formatDate(formData.appointment_date, {
                                  month: 'long',
                                  day: 'numeric',
                                  year: 'numeric',
                              })
                            : 'Choose a date'
                    }
                    active={!!formData.appointment_date}
                />
                <SummaryLine
                    icon={Clock3}
                    label={
                        formData.start_time
                            ? formatTime(formData.start_time)
                            : formData.type === 'company_bulk'
                              ? 'Clinic to set duration'
                              : formData.type === 'individual'
                                ? 'Choose a time'
                                : 'Time to be coordinated'
                    }
                    active={
                        !!formData.start_time || formData.type !== 'individual'
                    }
                />
                <SummaryLine
                    icon={MapPin}
                    label="Living Myth Industrial Clinic"
                    active
                />
            </div>
            <div className="mt-5 rounded-xl bg-slate-50 p-3.5 text-[11px] leading-5 text-slate-500 dark:bg-muted/70 dark:text-slate-300">
                <strong className="text-slate-700 dark:text-slate-100">
                    Arrival guidance:
                </strong>{' '}
                {formData.type === 'company_bulk'
                    ? 'The clinic administrator will assign doctors and staff after reviewing the request and employee masterlist.'
                    : 'Please arrive 15 minutes before your scheduled time for check-in. Your online slot is reserved until 10 minutes after the scheduled time. If you have not checked in by then, it may be cancelled and assigned to a waiting walk-in patient.'}
            </div>
        </aside>
    );
}

function SummaryLine({
    icon: Icon,
    label,
    active,
}: {
    icon: LucideIcon;
    label: string;
    active: boolean;
}) {
    return (
        <div
            className={`flex items-center gap-2.5 text-xs ${active ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}
        >
            <Icon className="size-4 shrink-0" />
            <span>{label}</span>
        </div>
    );
}

function FieldGroup({
    title,
    description,
    children,
}: {
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <fieldset>
            <legend className="text-sm font-semibold text-slate-900">
                {title}
            </legend>
            <p className="mt-1 mb-3 text-xs leading-5 text-slate-500">
                {description}
            </p>
            {children}
        </fieldset>
    );
}

function InlineError({ message }: { message?: string }) {
    if (!message) return null;
    return (
        <p
            role="alert"
            className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600"
        >
            <CircleAlert className="size-3.5" />
            {message}
        </p>
    );
}

function LoadingState({ label }: { label: string }) {
    return (
        <div className="flex min-h-24 items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 text-sm text-slate-500">
            <LoaderCircle className="size-4 animate-spin text-moss-600" />
            {label}
        </div>
    );
}

function EmptyAvailability({ message }: { message: string }) {
    return (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800">
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            {message}
        </div>
    );
}
