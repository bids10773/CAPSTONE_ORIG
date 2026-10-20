import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Check,
    ChevronDown,
    FileHeart,
    LoaderCircle,
    Save,
    Search,
    Stethoscope,
    UserRound,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { MedicalCertificatePreview } from '@/components/medical-certificate-document';
import type { MedicalCertificateDocumentData } from '@/components/medical-certificate-document';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type {
    MedicalCertificateConsultation,
    MedicalCertificateDetail,
    MedicalCertificateFormValues,
    MedicalCertificatePatient,
    MedicalCertificatePermissions,
    MedicalCertificatePhysician,
} from '@/types/medical-certificate';

type Props = {
    certificate?: MedicalCertificateDetail | null;
    physicians: MedicalCertificatePhysician[];
    selectedPatient?: MedicalCertificatePatient | null;
    consultations?: MedicalCertificateConsultation[];
    selectedConsultationId?: number | null;
    can?: MedicalCertificatePermissions;
};

type PatientSearchPayload =
    | MedicalCertificatePatient[]
    | {
          patients?: MedicalCertificatePatient[];
          data?: MedicalCertificatePatient[];
      };

type ConsultationPayload =
    | MedicalCertificateConsultation[]
    | {
          consultations?: MedicalCertificateConsultation[];
          data?: MedicalCertificateConsultation[];
      };

function patientName(patient?: MedicalCertificatePatient | null): string {
    if (!patient) return '';
    return (
        patient.full_name ||
        patient.name ||
        [patient.first_name, patient.middle_name, patient.last_name]
            .filter(Boolean)
            .join(' ')
    );
}

function patientSearchLabel(patient: MedicalCertificatePatient): string {
    const reference = patient.patient_reference_code;
    return reference
        ? `${patientName(patient)} · ${reference}`
        : patientName(patient);
}

function dateOnly(value?: string | null): string {
    return value ? value.slice(0, 10) : '';
}

function manilaToday(): string {
    const values = Object.fromEntries(
        new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Manila',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        })
            .formatToParts(new Date())
            .filter((part) => part.type !== 'literal')
            .map((part) => [part.type, part.value]),
    );

    return `${values.year}-${values.month}-${values.day}`;
}

function calculateAge(
    birthdate?: string | null,
    referenceDate?: string | null,
): number | null {
    if (!birthdate) return null;
    const birthParts = birthdate.slice(0, 10).split('-').map(Number);
    const referenceParts = (referenceDate || manilaToday())
        .slice(0, 10)
        .split('-')
        .map(Number);
    if (
        birthParts.length !== 3 ||
        referenceParts.length !== 3 ||
        [...birthParts, ...referenceParts].some(Number.isNaN)
    ) {
        return null;
    }

    let age = referenceParts[0] - birthParts[0];
    if (
        referenceParts[1] < birthParts[1] ||
        (referenceParts[1] === birthParts[1] &&
            referenceParts[2] < birthParts[2])
    ) {
        age -= 1;
    }

    return Math.max(0, age);
}

function initialPatientFromCertificate(
    certificate?: MedicalCertificateDetail | null,
): MedicalCertificatePatient | null {
    if (!certificate?.patient_id) return null;
    if (certificate.patient) return certificate.patient;

    return {
        id: certificate.patient_id,
        name: certificate.patient_name,
        patient_reference_code: certificate.patient_reference_code,
        age: certificate.patient_age,
        sex: certificate.patient_sex,
        civil_status: certificate.patient_civil_status,
    };
}

function consultationDate(
    consultation: MedicalCertificateConsultation,
): string {
    return dateOnly(
        consultation.consultation_date || consultation.appointment_date,
    );
}

function formatConsultationLabel(
    consultation: MedicalCertificateConsultation,
): string {
    const date = consultationDate(consultation);
    const formattedDate = date
        ? new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium' }).format(
              new Date(`${date}T00:00:00`),
          )
        : 'Date unavailable';
    return consultation.reference_code
        ? `${formattedDate} · ${consultation.reference_code}`
        : formattedDate;
}

export default function MedicalCertificateFormPage({
    certificate = null,
    physicians = [],
    selectedPatient: selectedPatientProp = null,
    consultations: initialConsultations = [],
    selectedConsultationId = null,
    can,
}: Props) {
    const editing = Boolean(certificate?.id);
    const initialPatient =
        selectedPatientProp ||
        certificate?.patient ||
        initialPatientFromCertificate(certificate);
    const [selectedPatient, setSelectedPatient] =
        useState<MedicalCertificatePatient | null>(initialPatient);
    const [patientQuery, setPatientQuery] = useState(
        initialPatient ? patientSearchLabel(initialPatient) : '',
    );
    const [patientResults, setPatientResults] = useState<
        MedicalCertificatePatient[]
    >([]);
    const [patientSearchOpen, setPatientSearchOpen] = useState(false);
    const [patientSearchLoading, setPatientSearchLoading] = useState(false);
    const [patientSearchError, setPatientSearchError] = useState('');
    const [activePatientIndex, setActivePatientIndex] = useState(0);
    const patientSearchRef = useRef<HTMLDivElement>(null);
    const [consultations, setConsultations] = useState(initialConsultations);
    const [consultationsLoading, setConsultationsLoading] = useState(false);
    const [consultationsError, setConsultationsError] = useState('');
    const initialConsultation = initialConsultations.find(
        (consultation) =>
            consultation.id ===
            (certificate?.appointment_id || selectedConsultationId),
    );
    const initialConsultationDate = certificate?.consultation_date
        ? dateOnly(certificate.consultation_date)
        : initialConsultation
          ? consultationDate(initialConsultation)
          : '';
    const initialPhysicianId =
        certificate?.attending_physician_id ||
        certificate?.attending_physician?.id ||
        certificate?.physician?.id ||
        initialConsultation?.attending_physician_id ||
        null;
    const initialPhysician = physicians.find(
        (physician) => physician.id === initialPhysicianId,
    );

    const form = useForm<MedicalCertificateFormValues>({
        patient_id: String(certificate?.patient_id || initialPatient?.id || ''),
        patient_age: String(
            certificate?.patient_age ??
                initialPatient?.age ??
                calculateAge(
                    initialPatient?.birthdate,
                    initialConsultationDate || certificate?.date_issued,
                ) ??
                '',
        ),
        patient_sex: certificate?.patient_sex || initialPatient?.sex || '',
        patient_civil_status:
            certificate?.patient_civil_status ||
            initialPatient?.civil_status ||
            '',
        appointment_id: String(
            certificate?.appointment_id || selectedConsultationId || '',
        ),
        attending_physician_id: String(initialPhysicianId || ''),
        physician_license_no:
            certificate?.physician_license_no ||
            initialConsultation?.physician_license_no ||
            initialPhysician?.license_no ||
            '',
        salutation: certificate?.salutation || '',
        consultation_date: initialConsultationDate,
        reason_for_consultation:
            certificate?.reason_for_consultation ||
            initialConsultation?.reason_for_consultation ||
            initialConsultation?.reason ||
            initialConsultation?.notes ||
            '',
        clinical_impression:
            certificate?.clinical_impression ||
            initialConsultation?.clinical_impression ||
            initialConsultation?.final_diagnosis ||
            '',
        recommendation:
            certificate?.recommendation ||
            initialConsultation?.recommendation ||
            initialConsultation?.recommendations ||
            '',
        rest_start_date: dateOnly(certificate?.rest_start_date),
        rest_end_date: dateOnly(certificate?.rest_end_date),
        date_issued: dateOnly(certificate?.date_issued) || manilaToday(),
    });

    const locked = Boolean(
        editing && (certificate?.can?.edit === false || can?.edit === false),
    );

    useEffect(() => {
        function closeSearch(event: PointerEvent) {
            if (!patientSearchRef.current?.contains(event.target as Node)) {
                setPatientSearchOpen(false);
            }
        }

        document.addEventListener('pointerdown', closeSearch);
        return () => document.removeEventListener('pointerdown', closeSearch);
    }, []);

    useEffect(() => {
        const query = patientQuery.trim();
        if (!patientSearchOpen || selectedPatient || query.length < 2) {
            setPatientResults([]);
            setPatientSearchLoading(false);
            if (query.length >= 2) setPatientSearchError('');
            return;
        }

        const controller = new AbortController();
        const timeout = window.setTimeout(async () => {
            setPatientSearchLoading(true);
            setPatientSearchError('');
            try {
                const response = await fetch(
                    `/medical-certificates/patients/search?q=${encodeURIComponent(query)}`,
                    {
                        signal: controller.signal,
                        headers: { Accept: 'application/json' },
                    },
                );
                if (!response.ok) throw new Error('Patient search failed');
                const payload = (await response.json()) as PatientSearchPayload;
                const results = Array.isArray(payload)
                    ? payload
                    : payload.patients || payload.data || [];
                setPatientResults(results);
                setActivePatientIndex(0);
                if (!results.length) {
                    setPatientSearchError(
                        'No authorized patient record matched this search.',
                    );
                }
            } catch (error) {
                if (
                    !(
                        error instanceof DOMException &&
                        error.name === 'AbortError'
                    )
                ) {
                    setPatientResults([]);
                    setPatientSearchError(
                        'Patient search is temporarily unavailable. Please try again.',
                    );
                }
            } finally {
                if (!controller.signal.aborted) setPatientSearchLoading(false);
            }
        }, 350);

        return () => {
            window.clearTimeout(timeout);
            controller.abort();
        };
    }, [patientQuery, patientSearchOpen, selectedPatient]);

    useEffect(() => {
        const patientId = selectedPatient?.id;
        if (!patientId) {
            setConsultations([]);
            return;
        }
        if (
            initialPatient?.id === patientId &&
            initialConsultations.length > 0
        ) {
            setConsultations(initialConsultations);
            return;
        }

        const controller = new AbortController();
        setConsultationsLoading(true);
        setConsultationsError('');
        void (async () => {
            try {
                const response = await fetch(
                    `/medical-certificates/patients/${patientId}/consultations`,
                    {
                        signal: controller.signal,
                        headers: { Accept: 'application/json' },
                    },
                );
                if (!response.ok) throw new Error('Consultation search failed');
                const payload = (await response.json()) as ConsultationPayload;
                setConsultations(
                    Array.isArray(payload)
                        ? payload
                        : payload.consultations || payload.data || [],
                );
            } catch (error) {
                if (
                    !(
                        error instanceof DOMException &&
                        error.name === 'AbortError'
                    )
                ) {
                    setConsultations([]);
                    setConsultationsError(
                        'Consultation history could not be loaded. You may continue without linking a consultation.',
                    );
                }
            } finally {
                if (!controller.signal.aborted) setConsultationsLoading(false);
            }
        })();

        return () => controller.abort();
    }, [initialConsultations, initialPatient?.id, selectedPatient?.id]);

    const selectedPhysician = physicians.find(
        (physician) =>
            String(physician.id) === form.data.attending_physician_id,
    );
    const previewPhysicianName =
        selectedPhysician?.name ||
        certificate?.attending_physician?.name ||
        certificate?.physician?.name ||
        certificate?.physician_name ||
        certificate?.attending_physician_name ||
        '';
    const previewAge = form.data.patient_age || null;
    const previewData: MedicalCertificateDocumentData = {
        certificateNumber:
            certificate?.certificate_number ||
            certificate?.certificate_id ||
            certificate?.reference_code,
        patientReference:
            selectedPatient?.patient_reference_code ||
            certificate?.patient_reference_code,
        consultationDate: form.data.consultation_date,
        status: certificate?.status || 'draft',
        salutation: form.data.salutation,
        patientName:
            patientName(selectedPatient) || certificate?.patient_name || '',
        patientAge: previewAge,
        patientSex: form.data.patient_sex,
        patientCivilStatus: form.data.patient_civil_status,
        reasonForConsultation: form.data.reason_for_consultation,
        clinicalImpression: form.data.clinical_impression,
        recommendation: form.data.recommendation,
        restStartDate: form.data.rest_start_date,
        restEndDate: form.data.rest_end_date,
        dateIssued: form.data.date_issued,
        physicianName: previewPhysicianName,
        physicianLicenseNumber: form.data.physician_license_no,
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Medical Certificates', href: '/medical-certificates' },
        {
            title: editing ? 'Edit Certificate' : 'Create Certificate',
            href: '',
        },
    ];

    const selectedConsultation = useMemo(
        () =>
            consultations.find(
                (consultation) =>
                    String(consultation.id) === form.data.appointment_id,
            ),
        [consultations, form.data.appointment_id],
    );

    function selectPatient(patient: MedicalCertificatePatient) {
        setSelectedPatient(patient);
        setPatientQuery(patientSearchLabel(patient));
        setPatientSearchOpen(false);
        setPatientResults([]);
        form.clearErrors('patient_id');
        form.setData((current) => ({
            ...current,
            patient_id: String(patient.id),
            patient_age: String(
                patient.age ??
                    calculateAge(
                        patient.birthdate,
                        current.consultation_date || current.date_issued,
                    ) ??
                    '',
            ),
            patient_sex: patient.sex || '',
            patient_civil_status: patient.civil_status || '',
            appointment_id: '',
            consultation_date: '',
            salutation:
                current.salutation ||
                (patient.sex?.toLowerCase().startsWith('m')
                    ? 'Mr.'
                    : patient.sex?.toLowerCase().startsWith('f')
                      ? 'Ms.'
                      : ''),
        }));
    }

    function clearPatient() {
        setSelectedPatient(null);
        setPatientQuery('');
        setPatientResults([]);
        setConsultations([]);
        form.setData((current) => ({
            ...current,
            patient_id: '',
            patient_age: '',
            patient_sex: '',
            patient_civil_status: '',
            appointment_id: '',
            consultation_date: '',
        }));
    }

    function applyConsultation(consultationId: string) {
        const consultation = consultations.find(
            (item) => String(item.id) === consultationId,
        );
        if (!consultation) {
            form.setData('appointment_id', '');
            return;
        }
        const consultationPhysician = physicians.find(
            (physician) => physician.id === consultation.attending_physician_id,
        );

        form.setData((current) => ({
            ...current,
            appointment_id: String(consultation.id),
            consultation_date: consultationDate(consultation),
            patient_age: String(
                calculateAge(
                    selectedPatient?.birthdate,
                    consultationDate(consultation),
                ) ?? current.patient_age,
            ),
            reason_for_consultation:
                consultation.reason_for_consultation ||
                consultation.reason ||
                consultation.notes ||
                current.reason_for_consultation,
            clinical_impression:
                consultation.clinical_impression ||
                consultation.final_diagnosis ||
                current.clinical_impression,
            recommendation:
                consultation.recommendation ||
                consultation.recommendations ||
                current.recommendation,
            attending_physician_id: consultation.attending_physician_id
                ? String(consultation.attending_physician_id)
                : current.attending_physician_id,
            physician_license_no:
                consultation.physician_license_no ||
                consultationPhysician?.license_no ||
                current.physician_license_no,
        }));
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        if (locked) return;

        if (editing && certificate) {
            form.patch(`/medical-certificates/${certificate.id}`, {
                preserveScroll: true,
            });
            return;
        }

        form.post('/medical-certificates', { preserveScroll: true });
    }

    function handlePatientKeyDown(
        event: React.KeyboardEvent<HTMLInputElement>,
    ) {
        if (event.key === 'Escape') {
            setPatientSearchOpen(false);
            return;
        }
        if (!patientResults.length) return;
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActivePatientIndex(
                (index) => (index + 1) % patientResults.length,
            );
        }
        if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActivePatientIndex(
                (index) =>
                    (index - 1 + patientResults.length) % patientResults.length,
            );
        }
        if (event.key === 'Enter') {
            event.preventDefault();
            selectPatient(patientResults[activePatientIndex]);
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head
                title={
                    editing
                        ? 'Edit Medical Certificate'
                        : 'Create Medical Certificate'
                }
            />
            <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
                <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <Link
                            href={
                                editing && certificate
                                    ? `/medical-certificates/${certificate.id}`
                                    : '/medical-certificates'
                            }
                            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-moss-700 dark:text-slate-300 dark:hover:text-moss-300"
                        >
                            <ArrowLeft className="size-4" /> Back to
                            certificates
                        </Link>
                        <p className="mt-5 text-xs font-bold tracking-[.16em] text-moss-700 uppercase dark:text-moss-300">
                            Living Myth Industrial Clinic
                        </p>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl dark:text-slate-100">
                            {editing
                                ? 'Edit medical certificate'
                                : 'Create medical certificate'}
                        </h1>
                        <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                            Select an existing patient, verify the clinical
                            details, and review the live document before saving
                            it as a draft.
                        </p>
                    </div>
                    {editing && certificate && (
                        <Link
                            href={`/medical-certificates/${certificate.id}`}
                            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-border dark:bg-card dark:text-slate-200 dark:hover:bg-accent"
                        >
                            View record
                        </Link>
                    )}
                </header>

                {locked && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                        This certificate is read-only at its current workflow
                        status.
                    </div>
                )}

                <div className="grid gap-6 xl:grid-cols-[minmax(360px,.84fr)_minmax(0,1.16fr)] xl:items-start">
                    <form onSubmit={submit} className="space-y-5">
                        <FormSection
                            icon={<UserRound />}
                            title="Patient information"
                            description="Search only authorized patient records. Stored patient data is used for the certificate snapshot."
                        >
                            <div ref={patientSearchRef} className="relative">
                                <FieldLabel
                                    htmlFor="certificate-patient-search"
                                    required
                                >
                                    Patient
                                </FieldLabel>
                                <div className="relative mt-1.5">
                                    <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        id="certificate-patient-search"
                                        type="search"
                                        value={patientQuery}
                                        disabled={locked}
                                        autoComplete="off"
                                        role="combobox"
                                        aria-autocomplete="list"
                                        aria-expanded={patientSearchOpen}
                                        aria-controls="certificate-patient-results"
                                        aria-activedescendant={
                                            patientResults[activePatientIndex]
                                                ? `certificate-patient-${patientResults[activePatientIndex].id}`
                                                : undefined
                                        }
                                        aria-invalid={Boolean(
                                            form.errors.patient_id,
                                        )}
                                        placeholder="Search name or patient ID (2+ characters)"
                                        className="pr-11 pl-10"
                                        onFocus={() =>
                                            !selectedPatient &&
                                            setPatientSearchOpen(true)
                                        }
                                        onKeyDown={handlePatientKeyDown}
                                        onChange={(event) => {
                                            if (selectedPatient) clearPatient();
                                            setPatientQuery(event.target.value);
                                            setPatientSearchOpen(true);
                                        }}
                                    />
                                    {patientSearchLoading && (
                                        <LoaderCircle className="absolute top-1/2 right-3.5 size-4 -translate-y-1/2 animate-spin text-moss-700" />
                                    )}
                                    {selectedPatient && !locked && (
                                        <button
                                            type="button"
                                            onClick={clearPatient}
                                            className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-accent"
                                            aria-label="Clear selected patient"
                                        >
                                            <X className="size-4" />
                                        </button>
                                    )}
                                </div>
                                <InputError
                                    className="mt-1.5"
                                    message={form.errors.patient_id}
                                />
                                {patientSearchError && (
                                    <p
                                        role="status"
                                        className="mt-1.5 text-xs font-medium text-red-600"
                                    >
                                        {patientSearchError}
                                    </p>
                                )}
                                {patientSearchOpen &&
                                    patientResults.length > 0 && (
                                        <div
                                            id="certificate-patient-results"
                                            role="listbox"
                                            className="absolute z-40 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-border dark:bg-popover"
                                        >
                                            {patientResults.map(
                                                (patient, index) => (
                                                    <button
                                                        id={`certificate-patient-${patient.id}`}
                                                        role="option"
                                                        aria-selected={
                                                            index ===
                                                            activePatientIndex
                                                        }
                                                        key={patient.id}
                                                        type="button"
                                                        onMouseEnter={() =>
                                                            setActivePatientIndex(
                                                                index,
                                                            )
                                                        }
                                                        onClick={() =>
                                                            selectPatient(
                                                                patient,
                                                            )
                                                        }
                                                        className={`flex w-full items-center gap-3 rounded-lg p-3 text-left ${
                                                            index ===
                                                            activePatientIndex
                                                                ? 'bg-moss-50 dark:bg-accent'
                                                                : 'hover:bg-slate-50 dark:hover:bg-muted'
                                                        }`}
                                                    >
                                                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-moss-100 text-sm font-bold text-moss-700 dark:bg-moss-900 dark:text-moss-200">
                                                            {(
                                                                patient
                                                                    .first_name?.[0] ||
                                                                patientName(
                                                                    patient,
                                                                )[0] ||
                                                                'P'
                                                            ).toUpperCase()}
                                                        </span>
                                                        <span className="min-w-0">
                                                            <span className="block truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                                {patientName(
                                                                    patient,
                                                                )}
                                                            </span>
                                                            <span className="block truncate text-xs text-slate-500">
                                                                {patient.patient_reference_code ||
                                                                    'Patient ID unavailable'}
                                                            </span>
                                                        </span>
                                                    </button>
                                                ),
                                            )}
                                        </div>
                                    )}
                            </div>

                            {selectedPatient && (
                                <div className="rounded-xl border border-moss-200 bg-moss-50/70 p-4 dark:border-moss-800 dark:bg-moss-950/30">
                                    <div className="flex items-center gap-2 text-sm font-bold text-moss-800 dark:text-moss-200">
                                        <Check className="size-4" /> Patient
                                        record selected
                                    </div>
                                    <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                                        <SummaryItem
                                            label="Patient ID"
                                            value={
                                                selectedPatient.patient_reference_code ||
                                                'Not recorded'
                                            }
                                        />
                                        <SummaryItem
                                            label="Age at consultation"
                                            value={
                                                !form.data.patient_age
                                                    ? 'Not recorded'
                                                    : form.data.patient_age
                                            }
                                        />
                                        <SummaryItem
                                            label="Sex"
                                            value={
                                                form.data.patient_sex ||
                                                'Not recorded'
                                            }
                                        />
                                        <SummaryItem
                                            label="Civil status"
                                            value={
                                                form.data
                                                    .patient_civil_status ||
                                                'Not recorded'
                                            }
                                        />
                                    </dl>
                                </div>
                            )}

                            <div>
                                <FieldLabel htmlFor="appointment_id">
                                    Related consultation
                                </FieldLabel>
                                <div className="relative mt-1.5">
                                    <select
                                        id="appointment_id"
                                        value={form.data.appointment_id}
                                        disabled={
                                            locked ||
                                            !selectedPatient ||
                                            consultationsLoading
                                        }
                                        onChange={(event) =>
                                            applyConsultation(
                                                event.target.value,
                                            )
                                        }
                                        className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 pr-10 text-sm text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60 dark:border-input dark:bg-card dark:text-foreground dark:disabled:bg-muted"
                                    >
                                        <option value="">
                                            {consultationsLoading
                                                ? 'Loading consultations…'
                                                : 'No linked consultation'}
                                        </option>
                                        {consultations.map((consultation) => (
                                            <option
                                                key={consultation.id}
                                                value={consultation.id}
                                            >
                                                {formatConsultationLabel(
                                                    consultation,
                                                )}
                                            </option>
                                        ))}
                                    </select>
                                    {consultationsLoading ? (
                                        <LoaderCircle className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 animate-spin text-moss-600" />
                                    ) : (
                                        <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-slate-400" />
                                    )}
                                </div>
                                <InputError
                                    className="mt-1.5"
                                    message={form.errors.appointment_id}
                                />
                                {consultationsError && (
                                    <p className="mt-1.5 text-xs text-amber-700 dark:text-amber-300">
                                        {consultationsError}
                                    </p>
                                )}
                                {selectedConsultation && (
                                    <p className="mt-1.5 text-xs text-slate-500">
                                        Selecting a consultation prefills
                                        available findings. Verify all content
                                        before saving.
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-4 sm:grid-cols-3">
                                <Field>
                                    <FieldLabel htmlFor="salutation" required>
                                        Salutation
                                    </FieldLabel>
                                    <select
                                        id="salutation"
                                        value={form.data.salutation}
                                        disabled={locked}
                                        aria-invalid={Boolean(
                                            form.errors.salutation,
                                        )}
                                        onChange={(event) =>
                                            form.setData(
                                                'salutation',
                                                event.target.value,
                                            )
                                        }
                                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm dark:border-input dark:bg-card"
                                    >
                                        <option value="">Select</option>
                                        <option value="Mr.">Mr.</option>
                                        <option value="Ms.">Ms.</option>
                                    </select>
                                    <InputError
                                        message={form.errors.salutation}
                                    />
                                </Field>
                                <Field className="sm:col-span-2">
                                    <FieldLabel
                                        htmlFor="consultation_date"
                                        required
                                    >
                                        Consultation date
                                    </FieldLabel>
                                    <Input
                                        id="consultation_date"
                                        type="date"
                                        max={manilaToday()}
                                        disabled={locked}
                                        value={form.data.consultation_date}
                                        aria-invalid={Boolean(
                                            form.errors.consultation_date,
                                        )}
                                        onChange={(event) =>
                                            form.setData((current) => ({
                                                ...current,
                                                consultation_date:
                                                    event.target.value,
                                                patient_age: String(
                                                    calculateAge(
                                                        selectedPatient?.birthdate,
                                                        event.target.value,
                                                    ) ?? current.patient_age,
                                                ),
                                            }))
                                        }
                                    />
                                    <InputError
                                        message={form.errors.consultation_date}
                                    />
                                </Field>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-3">
                                <Field>
                                    <FieldLabel htmlFor="patient_age" required>
                                        Age at consultation
                                    </FieldLabel>
                                    <Input
                                        id="patient_age"
                                        type="number"
                                        inputMode="numeric"
                                        min={0}
                                        max={130}
                                        disabled={locked}
                                        value={form.data.patient_age}
                                        aria-invalid={Boolean(
                                            form.errors.patient_age,
                                        )}
                                        onChange={(event) =>
                                            form.setData(
                                                'patient_age',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={form.errors.patient_age}
                                    />
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor="patient_sex" required>
                                        Sex
                                    </FieldLabel>
                                    <select
                                        id="patient_sex"
                                        value={form.data.patient_sex}
                                        disabled={locked}
                                        aria-invalid={Boolean(
                                            form.errors.patient_sex,
                                        )}
                                        onChange={(event) =>
                                            form.setData(
                                                'patient_sex',
                                                event.target.value,
                                            )
                                        }
                                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm dark:border-input dark:bg-card"
                                    >
                                        <option value="">Select sex</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                    <InputError
                                        message={form.errors.patient_sex}
                                    />
                                </Field>
                                <Field>
                                    <FieldLabel
                                        htmlFor="patient_civil_status"
                                        required
                                    >
                                        Civil status
                                    </FieldLabel>
                                    <select
                                        id="patient_civil_status"
                                        value={form.data.patient_civil_status}
                                        disabled={locked}
                                        aria-invalid={Boolean(
                                            form.errors.patient_civil_status,
                                        )}
                                        onChange={(event) =>
                                            form.setData(
                                                'patient_civil_status',
                                                event.target.value,
                                            )
                                        }
                                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm dark:border-input dark:bg-card"
                                    >
                                        <option value="">Select status</option>
                                        <option value="Single">Single</option>
                                        <option value="Married">Married</option>
                                        <option value="Widowed">Widowed</option>
                                        <option value="Separated">
                                            Separated
                                        </option>
                                        <option value="Divorced">
                                            Divorced
                                        </option>
                                    </select>
                                    <InputError
                                        message={
                                            form.errors.patient_civil_status
                                        }
                                    />
                                </Field>
                            </div>
                        </FormSection>

                        <FormSection
                            icon={<FileHeart />}
                            title="Medical information"
                            description="Use factual findings from the consultation. Do not add information that was not recorded or verified."
                        >
                            <Field>
                                <FieldLabel
                                    htmlFor="reason_for_consultation"
                                    required
                                >
                                    Reason for consultation
                                </FieldLabel>
                                <Textarea
                                    id="reason_for_consultation"
                                    rows={4}
                                    maxLength={1500}
                                    disabled={locked}
                                    value={form.data.reason_for_consultation}
                                    aria-invalid={Boolean(
                                        form.errors.reason_for_consultation,
                                    )}
                                    onChange={(event) =>
                                        form.setData(
                                            'reason_for_consultation',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Describe why the patient sought consultation"
                                />
                                <InputError
                                    message={
                                        form.errors.reason_for_consultation
                                    }
                                />
                            </Field>
                            <Field>
                                <FieldLabel
                                    htmlFor="clinical_impression"
                                    required
                                >
                                    Clinical impression
                                </FieldLabel>
                                <Textarea
                                    id="clinical_impression"
                                    rows={4}
                                    maxLength={1500}
                                    disabled={locked}
                                    value={form.data.clinical_impression}
                                    aria-invalid={Boolean(
                                        form.errors.clinical_impression,
                                    )}
                                    onChange={(event) =>
                                        form.setData(
                                            'clinical_impression',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Enter the verified clinical impression"
                                />
                                <InputError
                                    message={form.errors.clinical_impression}
                                />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="recommendation" required>
                                    Recommendation
                                </FieldLabel>
                                <Textarea
                                    id="recommendation"
                                    rows={4}
                                    maxLength={1500}
                                    disabled={locked}
                                    value={form.data.recommendation}
                                    aria-invalid={Boolean(
                                        form.errors.recommendation,
                                    )}
                                    onChange={(event) =>
                                        form.setData(
                                            'recommendation',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Enter the physician's recommendation"
                                />
                                <InputError
                                    message={form.errors.recommendation}
                                />
                            </Field>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field>
                                    <FieldLabel htmlFor="rest_start_date">
                                        Rest start date
                                    </FieldLabel>
                                    <Input
                                        id="rest_start_date"
                                        type="date"
                                        disabled={locked}
                                        value={form.data.rest_start_date}
                                        aria-invalid={Boolean(
                                            form.errors.rest_start_date,
                                        )}
                                        onChange={(event) =>
                                            form.setData(
                                                'rest_start_date',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={form.errors.rest_start_date}
                                    />
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor="rest_end_date">
                                        Rest end date
                                    </FieldLabel>
                                    <Input
                                        id="rest_end_date"
                                        type="date"
                                        min={
                                            form.data.rest_start_date ||
                                            undefined
                                        }
                                        disabled={locked}
                                        value={form.data.rest_end_date}
                                        aria-invalid={Boolean(
                                            form.errors.rest_end_date,
                                        )}
                                        onChange={(event) =>
                                            form.setData(
                                                'rest_end_date',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={form.errors.rest_end_date}
                                    />
                                </Field>
                            </div>
                        </FormSection>

                        <FormSection
                            icon={<Stethoscope />}
                            title="Certificate information"
                            description="The selected physician must review and approve the draft before it can be issued."
                        >
                            <Field>
                                <FieldLabel
                                    htmlFor="attending_physician_id"
                                    required
                                >
                                    Attending physician
                                </FieldLabel>
                                <select
                                    id="attending_physician_id"
                                    value={form.data.attending_physician_id}
                                    disabled={locked}
                                    aria-invalid={Boolean(
                                        form.errors.attending_physician_id,
                                    )}
                                    onChange={(event) => {
                                        const physician = physicians.find(
                                            (candidate) =>
                                                String(candidate.id) ===
                                                event.target.value,
                                        );
                                        form.setData((current) => ({
                                            ...current,
                                            attending_physician_id:
                                                event.target.value,
                                            physician_license_no:
                                                physician?.license_no || '',
                                        }));
                                    }}
                                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm dark:border-input dark:bg-card"
                                >
                                    <option value="">Select physician</option>
                                    {physicians.map((physician) => (
                                        <option
                                            key={physician.id}
                                            value={physician.id}
                                        >
                                            {physician.name}
                                            {physician.license_no
                                                ? ` · License ${physician.license_no}`
                                                : ''}
                                        </option>
                                    ))}
                                </select>
                                <InputError
                                    message={form.errors.attending_physician_id}
                                />
                                {selectedPhysician && (
                                    <p className="mt-1.5 text-xs text-slate-500">
                                        License verification:{' '}
                                        <span className="font-semibold">
                                            {selectedPhysician.license_verification_status ===
                                            'verified'
                                                ? 'Verified'
                                                : 'Not verified'}
                                        </span>
                                        . Only a verified physician can approve
                                        the draft.
                                    </p>
                                )}
                            </Field>
                            <Field>
                                <FieldLabel
                                    htmlFor="physician_license_no"
                                    required
                                >
                                    Physician license number
                                </FieldLabel>
                                <Input
                                    id="physician_license_no"
                                    value={form.data.physician_license_no}
                                    maxLength={100}
                                    disabled={locked}
                                    readOnly={Boolean(
                                        selectedPhysician?.license_no,
                                    )}
                                    aria-invalid={Boolean(
                                        form.errors.physician_license_no,
                                    )}
                                    onChange={(event) =>
                                        form.setData(
                                            'physician_license_no',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Enter the verified license number"
                                />
                                <InputError
                                    message={form.errors.physician_license_no}
                                />
                                {!selectedPhysician?.license_no && (
                                    <p className="text-xs leading-5 text-amber-700 dark:text-amber-300">
                                        The physician account has no license
                                        number. You may complete the draft, but
                                        the physician must update and verify
                                        their account before approval.
                                    </p>
                                )}
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="date_issued" required>
                                    Certificate date
                                </FieldLabel>
                                <Input
                                    id="date_issued"
                                    type="date"
                                    disabled={locked}
                                    value={form.data.date_issued}
                                    aria-invalid={Boolean(
                                        form.errors.date_issued,
                                    )}
                                    onChange={(event) =>
                                        form.setData(
                                            'date_issued',
                                            event.target.value,
                                        )
                                    }
                                />
                                <InputError message={form.errors.date_issued} />
                            </Field>
                        </FormSection>

                        {!locked && (
                            <div className="sticky bottom-3 z-20 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:justify-between dark:border-border dark:bg-card/95">
                                <p className="text-xs text-slate-500">
                                    Saving creates or updates a draft. It does
                                    not issue the certificate.
                                </p>
                                <Button
                                    type="submit"
                                    disabled={form.processing}
                                    className="shrink-0"
                                >
                                    {form.processing ? (
                                        <LoaderCircle className="animate-spin" />
                                    ) : (
                                        <Save />
                                    )}
                                    {editing
                                        ? 'Save changes'
                                        : 'Save certificate'}
                                </Button>
                            </div>
                        )}
                    </form>

                    <div className="min-w-0 xl:sticky xl:top-24">
                        <MedicalCertificatePreview data={previewData} />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function FormSection({
    icon,
    title,
    description,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <section className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-border dark:bg-card">
            <div className="flex gap-3 border-b border-slate-100 p-5 dark:border-border">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-moss-100 text-moss-700 dark:bg-moss-900 dark:text-moss-200 [&>svg]:size-5">
                    {icon}
                </span>
                <div>
                    <h2 className="font-bold text-slate-950 dark:text-slate-100">
                        {title}
                    </h2>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                        {description}
                    </p>
                </div>
            </div>
            <div className="space-y-4 p-5 sm:p-6">{children}</div>
        </section>
    );
}

function Field({
    children,
    className = '',
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return <div className={`space-y-1.5 ${className}`}>{children}</div>;
}

function FieldLabel({
    htmlFor,
    required = false,
    children,
}: {
    htmlFor: string;
    required?: boolean;
    children: React.ReactNode;
}) {
    return (
        <label
            htmlFor={htmlFor}
            className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
        >
            {children}
            {required && (
                <span className="ml-1 text-red-600" aria-hidden="true">
                    *
                </span>
            )}
        </label>
    );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                {label}
            </dt>
            <dd className="mt-0.5 font-semibold text-slate-800 dark:text-slate-100">
                {value}
            </dd>
        </div>
    );
}
