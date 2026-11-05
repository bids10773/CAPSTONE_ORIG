import { Head, useForm } from '@inertiajs/react';
import {
    FlaskConical,
    LoaderCircle,
    LockKeyhole,
    Save,
    ShieldCheck,
} from 'lucide-react';
import {
    Fragment,
    useEffect,
    useRef,
    useState,
    useSyncExternalStore,
} from 'react';

import InputError from '@/components/input-error';
import { useSidebar } from '@/components/ui/sidebar';
import { useSessionDraft } from '@/hooks/use-session-draft';
import AppLayout from '@/layouts/app-layout';
import { confirmAction } from '@/lib/dialogs';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'MedTech Queue', href: '/medtech/appointments' },
    { title: 'Laboratory Examination', href: '' },
];

function readLabLayout(): 'tabs' | 'all' {
    try {
        return window.localStorage.getItem('lmic-lab-form-layout') === 'all'
            ? 'all'
            : 'tabs';
    } catch {
        return 'tabs';
    }
}

function subscribeLabLayout(notify: () => void) {
    window.addEventListener('storage', notify);
    return () => window.removeEventListener('storage', notify);
}

type Field = {
    key: string;
    label: string;
    heading?: string;
    required?: boolean;
    type: 'text' | 'number' | 'select';
    unit?: string | null;
    normal?: string | null;
    options: string[];
    validation?: { min: number; max: number; decimals: number } | null;
    reference?: Record<string, [number | null, number | null]>;
};
type Section = {
    label: string;
    heading?: string;
    column: string;
    fields: Field[];
    requires_interpretation?: boolean;
};
type Interpretation = { interpretation: string; findings: string };
type Props = {
    appointment: { id: number; reference_code: string };
    patientSummary: {
        name: string;
        age?: number;
        sex?: string;
        birthdate?: string;
        company?: string | null;
        employee_number?: string | null;
        date?: string;
        doctor?: string;
    };
    sections: Record<string, Section>;
    interpretations: Record<string, Partial<Interpretation>>;
    labResult?: Record<string, any> | null;
    locked: boolean;
    drugVerificationPending: boolean;
    submitUrl: string;
};

function initialResults(
    sections: Record<string, Section>,
    result?: Record<string, any> | null,
) {
    return Object.fromEntries(
        Object.entries(sections).map(([key, section]) => {
            const stored = result?.[section.column];
            if (key === 'pregnancy')
                return [key, { pregnancy_test: stored ?? '' }];
            if (key === 'blood_type')
                return [key, { blood_type: stored ?? '' }];
            return [
                key,
                Object.fromEntries(
                    section.fields.map((field) => [
                        field.key,
                        stored?.[field.key] ?? '',
                    ]),
                ),
            ];
        }),
    );
}

export default function LaboratoryResultsForm({
    appointment,
    patientSummary,
    sections,
    interpretations,
    labResult,
    locked,
    drugVerificationPending,
    submitUrl,
}: Props) {
    const { open: sidebarOpen, isMobile } = useSidebar();
    const savedLayout = useSyncExternalStore(
        subscribeLabLayout,
        readLabLayout,
        () => 'tabs' as const,
    );
    const [layoutOverride, setLayout] = useState<'tabs' | 'all' | null>(null);
    const layout = layoutOverride ?? savedLayout;
    const [activeSection, setActiveSection] = useState(
        Object.keys(sections)[0] ?? '',
    );
    const compact = layout === 'tabs';
    const actionBarRef = useRef<HTMLDivElement>(null);
    const [actionBarHeight, setActionBarHeight] = useState(112);
    const [remarksExpanded, setRemarksExpanded] = useState(
        Boolean(labResult?.remarks),
    );
    const currentSection = sections[activeSection]
        ? activeSection
        : Object.keys(sections)[0];
    useEffect(() => {
        const bar = actionBarRef.current;
        if (!compact || !bar) return;
        const measure = () =>
            setActionBarHeight(bar.getBoundingClientRect().height);
        if (typeof ResizeObserver === 'undefined') {
            const frame = window.requestAnimationFrame(measure);
            window.addEventListener('resize', measure);
            return () => {
                window.cancelAnimationFrame(frame);
                window.removeEventListener('resize', measure);
            };
        }
        const observer = new ResizeObserver(measure);
        observer.observe(bar);
        return () => observer.disconnect();
    }, [compact]);
    const switchLayout = () => {
        const next = compact ? 'all' : 'tabs';
        setLayout(next);
        try {
            window.localStorage.setItem('lmic-lab-form-layout', next);
        } catch {
            // Saving this display preference is optional.
        }
    };
    const form = useForm({
        results: initialResults(sections, labResult),
        interpretations: Object.fromEntries(
            Object.entries(sections)
                .filter(([, section]) => section.requires_interpretation)
                .map(([key]) => [
                    key,
                    {
                        interpretation:
                            interpretations[key]?.interpretation ?? '',
                        findings: interpretations[key]?.findings ?? '',
                    },
                ]),
        ) as Record<string, Interpretation>,
        remarks: labResult?.remarks ?? '',
        finalize: false,
        drug_workflow_action: 'complete',
    });
    const { clearDraft } = useSessionDraft(
        `laboratory-${appointment.id}`,
        form.data,
        form.isDirty,
        (draft) => {
            if (draft.remarks) setRemarksExpanded(true);
            form.setData({
                ...form.data,
                results: Object.fromEntries(
                    Object.entries(form.data.results).map(
                        ([section, values]) => [
                            section,
                            { ...values, ...(draft.results?.[section] ?? {}) },
                        ],
                    ),
                ),
                interpretations: Object.fromEntries(
                    Object.entries(form.data.interpretations).map(
                        ([section, value]) => [
                            section,
                            {
                                ...value,
                                ...(draft.interpretations?.[section] ?? {}),
                            },
                        ],
                    ),
                ),
                remarks: draft.remarks ?? form.data.remarks,
            });
        },
        !locked,
    );
    const inputClass =
        'mt-1 min-h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-sm outline-none focus:border-moss-500 focus:ring-4 focus:ring-moss-500/15 disabled:bg-slate-100';
    const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
    const validateField = (field: Field, value: unknown, required = false) => {
        const text = String(value ?? '').trim();
        if (!text) {
            return required
                ? 'Complete this result before finalizing the laboratory report.'
                : '';
        }
        if (field.type === 'select' && !field.options.includes(text)) {
            return 'Select one of the available laboratory result options.';
        }
        if (field.type === 'number' && field.validation) {
            const pattern = new RegExp(
                `^\\d+(?:\\.\\d{1,${field.validation.decimals}})?$`,
            );
            if (!pattern.test(text)) {
                return `Enter a plain number with no more than ${field.validation.decimals} decimal places.`;
            }
            const number = Number(text);
            if (
                number < field.validation.min ||
                number > field.validation.max
            ) {
                return `Value must be between ${field.validation.min} and ${field.validation.max}${field.unit ? ` ${field.unit}` : ''}.`;
            }
        }
        if (field.type === 'text' && text.length > 1000) {
            return 'Result must not exceed 1000 characters.';
        }
        return '';
    };
    const update = (section: string, field: Field, value: string) => {
        form.setData('results', {
            ...form.data.results,
            [section]: {
                ...form.data.results[section],
                [field.key]: value,
            },
        });
        const key = `results.${section}.${field.key}`;
        if (localErrors[key]) {
            setLocalErrors((current) => ({
                ...current,
                [key]: validateField(field, value),
            }));
        }
    };
    const validateBeforeSubmit = (finalize: boolean) => {
        const nextErrors: Record<string, string> = {};
        Object.entries(sections).forEach(([sectionKey, section]) => {
            section.fields.forEach((field) => {
                const key = `results.${sectionKey}.${field.key}`;
                const message = validateField(
                    field,
                    form.data.results[sectionKey]?.[field.key],
                    finalize && field.required !== false,
                );
                if (message) nextErrors[key] = message;
            });
            if (finalize && section.requires_interpretation) {
                const interpretation = form.data.interpretations[sectionKey];
                if (!interpretation?.interpretation) {
                    nextErrors[`interpretations.${sectionKey}.interpretation`] =
                        'Select Normal or With findings before finalizing this result.';
                }
                if (
                    interpretation?.interpretation === 'with_findings' &&
                    !interpretation.findings.trim()
                ) {
                    nextErrors[`interpretations.${sectionKey}.findings`] =
                        'Describe the findings before finalizing this result.';
                }
            }
        });
        setLocalErrors(nextErrors);
        const firstInvalidSection = Object.keys(sections).find((key) =>
            Object.entries(nextErrors).some(
                ([field, message]) =>
                    message &&
                    (field.startsWith(`results.${key}.`) ||
                        field.startsWith(`interpretations.${key}.`)),
            ),
        );
        if (firstInvalidSection) setActiveSection(firstInvalidSection);
        return Object.keys(nextErrors).length === 0;
    };
    const blurField = (section: string, field: Field, value: unknown) => {
        const key = `results.${section}.${field.key}`;
        setLocalErrors((current) => ({
            ...current,
            [key]: validateField(field, value),
        }));
    };
    const focusNextField = (current: HTMLInputElement | HTMLSelectElement) => {
        const fields = Array.from(
            current.form?.querySelectorAll<HTMLElement>(
                '[data-lab-field]:not(:disabled)',
            ) ?? [],
        ).filter(
            (field) =>
                !field.closest('[hidden]') &&
                !field.closest('details:not([open])'),
        );
        const index = fields.indexOf(current);
        if (index >= 0) fields[index + 1]?.focus();
    };
    const referenceStatus = (field: Field, value: unknown) => {
        if (field.type !== 'number' || !field.reference || !field.validation)
            return null;
        const text = String(value ?? '').trim();
        const pattern = new RegExp(
            `^\\d+(?:\\.\\d{1,${field.validation.decimals}})?$`,
        );
        if (!pattern.test(text)) return null;
        const sex = String(patientSummary.sex ?? '').toLowerCase();
        const range =
            (sex.startsWith('m') ? field.reference.male : null) ??
            (sex.startsWith('f') ? field.reference.female : null) ??
            field.reference.default;
        if (!range) return null;
        const number = Number(text);
        if (range[0] !== null && number < range[0]) return 'Low';
        if (range[1] !== null && number > range[1]) return 'High';
        return 'Within reference';
    };
    const submit = (
        finalize: boolean,
        drugWorkflowAction:
            | 'complete'
            | 'send_verification'
            | 'update_verification' = 'complete',
    ) => {
        if (!validateBeforeSubmit(finalize)) return;
        form.transform((data) => ({
            ...data,
            finalize,
            drug_workflow_action: drugWorkflowAction,
        }));
        form.post(submitUrl, {
            onSuccess: clearDraft,
            onError: (errors) => {
                const firstInvalidSection = Object.keys(sections).find((key) =>
                    Object.keys(errors).some(
                        (field) =>
                            field.startsWith(`results.${key}.`) ||
                            field.startsWith(`interpretations.${key}.`),
                    ),
                );
                if (firstInvalidSection) setActiveSection(firstInvalidSection);
            },
        });
    };
    const selectedServices = Object.values(sections).map(
        (section) => section.label,
    );
    const finalizeLabel =
        selectedServices.length === 1
            ? `Finalize ${selectedServices[0]}`
            : 'Finalize Laboratory Report';
    const confirmFinalize = async () => {
        const services =
            selectedServices.length > 1
                ? `\n\nSelected services: ${selectedServices.join(', ')}.`
                : '';
        const message = `${finalizeLabel}?${services}\n\nPlease confirm that the results have been reviewed and verified. Once finalized, the report will be marked as completed and become read-only.`;

        if (await confirmAction(message)) {
            submit(true);
        }
    };
    const drugValues = Object.values(form.data.results.drug_test ?? {});
    const drugRequiresVerification = drugValues.some((value) =>
        ['positive', 'pending'].includes(String(value).toLowerCase()),
    );

    return (
        <>
            <Head title="Laboratory Results" />
            <div
                data-lab-workspace
                className="w-full space-y-4 p-4 sm:p-5"
                style={
                    compact
                        ? { paddingBottom: actionBarHeight + 24 }
                        : undefined
                }
            >
                <header className="overflow-hidden rounded-2xl bg-moss-700 text-white shadow-sm">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <h1 className="text-lg font-bold whitespace-nowrap">
                                Laboratory result entry
                            </h1>
                            <p className="text-sm whitespace-nowrap text-moss-100">
                                {appointment.reference_code} ·{' '}
                                {patientSummary.date ?? 'Date unavailable'}
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm lg:ml-auto">
                            <Summary
                                label="Patient"
                                value={patientSummary.name}
                            />
                            <Summary
                                label="Age / Sex"
                                value={`${patientSummary.age ?? '—'} / ${patientSummary.sex ?? '—'}`}
                            />
                            {patientSummary.company && (
                                <Summary
                                    label="Company"
                                    value={patientSummary.company}
                                />
                            )}
                            <Summary
                                label="Birthdate"
                                value={patientSummary.birthdate ?? '—'}
                            />
                            {patientSummary.employee_number && (
                                <Summary
                                    label="Company Employee No."
                                    value={patientSummary.employee_number}
                                />
                            )}
                            <Summary
                                label="Doctor"
                                value={patientSummary.doctor ?? 'Unassigned'}
                            />
                        </div>
                    </div>
                </header>
                {locked && (
                    <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                        <LockKeyhole className="h-5 w-5 shrink-0" />
                        <p>
                            This report has been finalized and is read-only.
                            Contact an administrator if a correction is
                            required.
                        </p>
                    </div>
                )}
                {Object.keys(sections).length === 0 && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">
                        This appointment has no supported laboratory services.
                        Review its requested service types before entering
                        results.
                    </div>
                )}
                <form
                    className="space-y-4"
                    onSubmit={(event) => event.preventDefault()}
                >
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-2">
                        {compact ? (
                            <div
                                role="tablist"
                                aria-label="Laboratory tests"
                                className="flex flex-wrap gap-1"
                            >
                                {Object.entries(sections).map(
                                    ([key, section]) => {
                                        const errorCount = Object.entries({
                                            ...form.errors,
                                            ...localErrors,
                                        }).filter(
                                            ([field, message]) =>
                                                message &&
                                                (field.startsWith(
                                                    `results.${key}.`,
                                                ) ||
                                                    field.startsWith(
                                                        `interpretations.${key}.`,
                                                    )),
                                        ).length;
                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                role="tab"
                                                id={`lab-tab-${key}`}
                                                aria-controls={`lab-panel-${key}`}
                                                aria-selected={
                                                    key === currentSection
                                                }
                                                tabIndex={
                                                    key === currentSection
                                                        ? 0
                                                        : -1
                                                }
                                                onClick={() =>
                                                    setActiveSection(key)
                                                }
                                                onKeyDown={(event) => {
                                                    const keys =
                                                        Object.keys(sections);
                                                    const index =
                                                        keys.indexOf(key);
                                                    const next =
                                                        event.key ===
                                                        'ArrowRight'
                                                            ? keys[
                                                                  (index + 1) %
                                                                      keys.length
                                                              ]
                                                            : event.key ===
                                                                'ArrowLeft'
                                                              ? keys[
                                                                    (index -
                                                                        1 +
                                                                        keys.length) %
                                                                        keys.length
                                                                ]
                                                              : event.key ===
                                                                  'Home'
                                                                ? keys[0]
                                                                : event.key ===
                                                                    'End'
                                                                  ? keys[
                                                                        keys.length -
                                                                            1
                                                                    ]
                                                                  : null;
                                                    if (next) {
                                                        event.preventDefault();
                                                        setActiveSection(next);
                                                        document
                                                            .getElementById(
                                                                `lab-tab-${next}`,
                                                            )
                                                            ?.focus();
                                                    }
                                                }}
                                                className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-moss-500 focus-visible:outline-none ${key === currentSection ? 'bg-moss-700 text-white' : 'text-slate-600 hover:bg-moss-50'}`}
                                            >
                                                {key === 'cbc'
                                                    ? 'CBC'
                                                    : section.label}
                                                {errorCount > 0 && (
                                                    <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-xs text-red-800">
                                                        {errorCount}
                                                        <span className="sr-only">
                                                            {' '}
                                                            errors
                                                        </span>
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    },
                                )}
                            </div>
                        ) : (
                            <p className="px-2 text-sm font-semibold text-slate-700">
                                All laboratory tests
                            </p>
                        )}
                        <button
                            type="button"
                            onClick={switchLayout}
                            className="min-h-10 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:border-moss-400 focus-visible:ring-2 focus-visible:ring-moss-500 focus-visible:outline-none"
                        >
                            {compact ? 'Original layout' : 'Tabbed layout'}
                        </button>
                    </div>
                    <div
                        className={
                            compact ? '' : 'columns-1 gap-3 lg:columns-2'
                        }
                    >
                        {Object.entries(sections).map(
                            ([sectionKey, section]) => (
                                <section
                                    key={sectionKey}
                                    id={`lab-panel-${sectionKey}`}
                                    role={compact ? 'tabpanel' : undefined}
                                    aria-labelledby={
                                        compact
                                            ? `lab-tab-${sectionKey}`
                                            : undefined
                                    }
                                    hidden={
                                        compact && sectionKey !== currentSection
                                    }
                                    className="mb-3 break-inside-avoid overflow-hidden rounded-xl border border-moss-100 bg-white shadow-sm"
                                >
                                    {section.heading && (
                                        <h3 className="px-3 pt-3 text-sm font-bold text-moss-800">
                                            {section.heading}
                                        </h3>
                                    )}
                                    <div className="flex items-center gap-2 border-b border-moss-100 bg-moss-50 px-3 py-2">
                                        <FlaskConical className="size-4 text-moss-700" />
                                        <h2 className="text-sm font-bold text-slate-900">
                                            {section.label}
                                        </h2>
                                    </div>
                                    <div
                                        className={
                                            compact
                                                ? 'grid gap-x-5 gap-y-1 p-3 md:grid-cols-2 xl:grid-cols-4'
                                                : 'grid gap-x-3 gap-y-2 p-3 sm:grid-cols-2'
                                        }
                                    >
                                        {section.fields.map((field) => {
                                            const value =
                                                form.data.results[sectionKey]?.[
                                                    field.key
                                                ] ?? '';
                                            const error = (
                                                form.errors as Record<
                                                    string,
                                                    string
                                                >
                                            )[
                                                `results.${sectionKey}.${field.key}`
                                            ];
                                            const localError =
                                                localErrors[
                                                    `results.${sectionKey}.${field.key}`
                                                ];
                                            const status = referenceStatus(
                                                field,
                                                value,
                                            );
                                            return (
                                                <Fragment key={field.key}>
                                                    {field.heading && (
                                                        <h3
                                                            className={`border-t border-moss-100 pt-3 text-sm font-bold text-moss-800 ${compact ? 'col-span-full' : 'sm:col-span-2'}`}
                                                        >
                                                            {field.heading}
                                                        </h3>
                                                    )}
                                                    <div
                                                        className={
                                                            compact
                                                                ? 'grid grid-cols-[minmax(0,1fr)_minmax(7rem,.8fr)] items-center gap-x-3 border-b border-slate-100 py-1.5'
                                                                : ''
                                                        }
                                                    >
                                                        <div>
                                                            <label
                                                                htmlFor={`${sectionKey}-${field.key}`}
                                                                className="text-sm font-semibold text-slate-700"
                                                            >
                                                                {field.label}
                                                                {field.required !==
                                                                    false && (
                                                                    <span className="ml-1 text-red-600">
                                                                        *
                                                                    </span>
                                                                )}
                                                            </label>
                                                            {field.normal && (
                                                                <p className="text-xs text-slate-500">
                                                                    Reference:{' '}
                                                                    {
                                                                        field.normal
                                                                    }
                                                                    {field.unit
                                                                        ? ` ${field.unit}`
                                                                        : ''}
                                                                </p>
                                                            )}
                                                            {compact &&
                                                                field.unit &&
                                                                !field.normal && (
                                                                    <p className="text-xs text-slate-500">
                                                                        Unit:{' '}
                                                                        {
                                                                            field.unit
                                                                        }
                                                                    </p>
                                                                )}
                                                        </div>
                                                        {field.type ===
                                                        'select' ? (
                                                            <select
                                                                id={`${sectionKey}-${field.key}`}
                                                                data-lab-field
                                                                disabled={
                                                                    locked ||
                                                                    (drugVerificationPending &&
                                                                        sectionKey !==
                                                                            'drug_test')
                                                                }
                                                                className={
                                                                    inputClass
                                                                }
                                                                value={value}
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    update(
                                                                        sectionKey,
                                                                        field,
                                                                        e.target
                                                                            .value,
                                                                    );
                                                                    if (
                                                                        e.target
                                                                            .value
                                                                    ) {
                                                                        focusNextField(
                                                                            e.currentTarget,
                                                                        );
                                                                    }
                                                                }}
                                                                onBlur={(e) =>
                                                                    blurField(
                                                                        sectionKey,
                                                                        field,
                                                                        e
                                                                            .currentTarget
                                                                            .value,
                                                                    )
                                                                }
                                                            >
                                                                <option value="">
                                                                    Select
                                                                    result
                                                                </option>
                                                                {field.options.map(
                                                                    (
                                                                        option,
                                                                    ) => (
                                                                        <option
                                                                            key={
                                                                                option
                                                                            }
                                                                            value={
                                                                                option
                                                                            }
                                                                        >
                                                                            {
                                                                                option
                                                                            }
                                                                        </option>
                                                                    ),
                                                                )}
                                                            </select>
                                                        ) : (
                                                            <div
                                                                className={`relative ${!compact && field.type === 'number' ? (field.unit ? 'max-w-48' : 'max-w-28') : ''}`}
                                                            >
                                                                <input
                                                                    id={`${sectionKey}-${field.key}`}
                                                                    data-lab-field
                                                                    disabled={
                                                                        locked ||
                                                                        (drugVerificationPending &&
                                                                            sectionKey !==
                                                                                'drug_test')
                                                                    }
                                                                    inputMode={
                                                                        field.type ===
                                                                        'number'
                                                                            ? 'decimal'
                                                                            : undefined
                                                                    }
                                                                    type="text"
                                                                    className={`${inputClass} ${field.unit && !compact ? 'pr-20' : ''}`}
                                                                    value={
                                                                        value
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        update(
                                                                            sectionKey,
                                                                            field,
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    onKeyDown={(
                                                                        e,
                                                                    ) => {
                                                                        if (
                                                                            e.key !==
                                                                                'Enter' ||
                                                                            e
                                                                                .nativeEvent
                                                                                .isComposing
                                                                        ) {
                                                                            return;
                                                                        }
                                                                        e.preventDefault();
                                                                        if (
                                                                            e.currentTarget.value.trim() &&
                                                                            !validateField(
                                                                                field,
                                                                                e
                                                                                    .currentTarget
                                                                                    .value,
                                                                            )
                                                                        ) {
                                                                            focusNextField(
                                                                                e.currentTarget,
                                                                            );
                                                                        } else {
                                                                            blurField(
                                                                                sectionKey,
                                                                                field,
                                                                                e
                                                                                    .currentTarget
                                                                                    .value,
                                                                            );
                                                                        }
                                                                    }}
                                                                    onBlur={(
                                                                        e,
                                                                    ) =>
                                                                        blurField(
                                                                            sectionKey,
                                                                            field,
                                                                            e
                                                                                .currentTarget
                                                                                .value,
                                                                        )
                                                                    }
                                                                />
                                                                {field.unit &&
                                                                    !compact && (
                                                                        <span className="absolute top-1/2 right-3 mt-0.5 -translate-y-1/2 text-xs text-slate-400">
                                                                            {
                                                                                field.unit
                                                                            }
                                                                        </span>
                                                                    )}
                                                            </div>
                                                        )}
                                                        {status &&
                                                            !localError &&
                                                            !error && (
                                                                <p
                                                                    className={`mt-1 text-xs font-semibold ${compact ? 'col-span-2' : ''} ${status === 'Within reference' ? 'text-emerald-700' : 'text-amber-700'}`}
                                                                >
                                                                    {status}{' '}
                                                                    range
                                                                </p>
                                                            )}
                                                        <div
                                                            className={
                                                                compact
                                                                    ? 'col-span-2'
                                                                    : ''
                                                            }
                                                        >
                                                            <InputError
                                                                message={
                                                                    localError ||
                                                                    error
                                                                }
                                                            />
                                                        </div>
                                                    </div>
                                                </Fragment>
                                            );
                                        })}
                                    </div>
                                    {section.requires_interpretation && (
                                        <div
                                            className={
                                                compact
                                                    ? 'flex flex-wrap items-center gap-x-4 border-t border-moss-100 bg-slate-50 p-3'
                                                    : 'border-t border-moss-100 bg-slate-50 p-3'
                                            }
                                        >
                                            <div
                                                className={
                                                    compact
                                                        ? 'min-w-0 flex-1'
                                                        : ''
                                                }
                                            >
                                                <label
                                                    htmlFor={`${sectionKey}-interpretation`}
                                                    className="text-sm font-bold text-slate-900"
                                                >
                                                    Clinical interpretation
                                                    <span className="ml-1 text-red-600">
                                                        *
                                                    </span>
                                                </label>
                                                <p className="mt-1 text-xs text-slate-600">
                                                    Review results and reference
                                                    ranges before selecting.
                                                </p>
                                            </div>
                                            <select
                                                id={`${sectionKey}-interpretation`}
                                                data-lab-field
                                                disabled={
                                                    locked ||
                                                    drugVerificationPending
                                                }
                                                className={`${inputClass} sm:max-w-sm`}
                                                value={
                                                    form.data.interpretations[
                                                        sectionKey
                                                    ]?.interpretation ?? ''
                                                }
                                                onChange={(event) => {
                                                    const interpretation =
                                                        event.target.value;
                                                    form.setData(
                                                        'interpretations',
                                                        {
                                                            ...form.data
                                                                .interpretations,
                                                            [sectionKey]: {
                                                                interpretation,
                                                                findings:
                                                                    interpretation ===
                                                                    'with_findings'
                                                                        ? (form
                                                                              .data
                                                                              .interpretations[
                                                                              sectionKey
                                                                          ]
                                                                              ?.findings ??
                                                                          '')
                                                                        : '',
                                                            },
                                                        },
                                                    );
                                                    setLocalErrors(
                                                        (current) => ({
                                                            ...current,
                                                            [`interpretations.${sectionKey}.interpretation`]:
                                                                '',
                                                        }),
                                                    );
                                                }}
                                            >
                                                <option value="">
                                                    Select interpretation
                                                </option>
                                                <option value="normal">
                                                    Normal
                                                </option>
                                                <option value="with_findings">
                                                    With findings
                                                </option>
                                            </select>
                                            <div
                                                className={
                                                    compact ? 'w-full' : ''
                                                }
                                            >
                                                <InputError
                                                    message={
                                                        localErrors[
                                                            `interpretations.${sectionKey}.interpretation`
                                                        ] ||
                                                        (
                                                            form.errors as Record<
                                                                string,
                                                                string
                                                            >
                                                        )[
                                                            `interpretations.${sectionKey}.interpretation`
                                                        ]
                                                    }
                                                />
                                            </div>
                                            {form.data.interpretations[
                                                sectionKey
                                            ]?.interpretation ===
                                                'with_findings' && (
                                                <div className="mt-2 w-full">
                                                    <label
                                                        htmlFor={`${sectionKey}-findings`}
                                                        className="text-sm font-semibold text-slate-700"
                                                    >
                                                        Findings
                                                        <span className="ml-1 text-red-600">
                                                            *
                                                        </span>
                                                    </label>
                                                    <textarea
                                                        id={`${sectionKey}-findings`}
                                                        data-lab-field
                                                        disabled={
                                                            locked ||
                                                            drugVerificationPending
                                                        }
                                                        rows={2}
                                                        className={inputClass}
                                                        value={
                                                            form.data
                                                                .interpretations[
                                                                sectionKey
                                                            ]?.findings ?? ''
                                                        }
                                                        onChange={(event) => {
                                                            form.setData(
                                                                'interpretations',
                                                                {
                                                                    ...form.data
                                                                        .interpretations,
                                                                    [sectionKey]:
                                                                        {
                                                                            ...form
                                                                                .data
                                                                                .interpretations[
                                                                                sectionKey
                                                                            ],
                                                                            findings:
                                                                                event
                                                                                    .target
                                                                                    .value,
                                                                        },
                                                                },
                                                            );
                                                            setLocalErrors(
                                                                (current) => ({
                                                                    ...current,
                                                                    [`interpretations.${sectionKey}.findings`]:
                                                                        '',
                                                                }),
                                                            );
                                                        }}
                                                        placeholder="Describe the clinically significant findings"
                                                    />
                                                    <InputError
                                                        message={
                                                            localErrors[
                                                                `interpretations.${sectionKey}.findings`
                                                            ] ||
                                                            (
                                                                form.errors as Record<
                                                                    string,
                                                                    string
                                                                >
                                                            )[
                                                                `interpretations.${sectionKey}.findings`
                                                            ]
                                                        }
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </section>
                            ),
                        )}
                    </div>
                    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <details
                            open={
                                !compact ||
                                remarksExpanded ||
                                !!form.errors.remarks
                            }
                            onToggle={(event) =>
                                setRemarksExpanded(event.currentTarget.open)
                            }
                        >
                            <summary
                                className={
                                    compact
                                        ? 'cursor-pointer text-sm font-semibold text-slate-700'
                                        : 'hidden'
                                }
                            >
                                Laboratory remarks (optional)
                            </summary>
                            <label
                                htmlFor="remarks"
                                className={
                                    compact
                                        ? 'sr-only'
                                        : 'font-bold text-slate-900'
                                }
                            >
                                Laboratory remarks
                            </label>
                            <textarea
                                id="remarks"
                                data-lab-field
                                disabled={locked}
                                rows={compact ? 2 : 3}
                                className={inputClass}
                                value={form.data.remarks}
                                onChange={(e) =>
                                    form.setData('remarks', e.target.value)
                                }
                                placeholder="Optional technical notes or critical-value communication"
                            />
                            <InputError message={form.errors.remarks} />
                        </details>
                        <InputError
                            message={
                                (form.errors as Record<string, string>).form
                            }
                        />
                    </section>
                    <div
                        ref={actionBarRef}
                        role="region"
                        aria-label="Laboratory actions"
                        style={
                            compact
                                ? {
                                      left: isMobile
                                          ? 0
                                          : sidebarOpen
                                            ? 'var(--sidebar-width,16.25rem)'
                                            : 'var(--sidebar-width-icon,5rem)',
                                  }
                                : undefined
                        }
                        className={
                            compact
                                ? 'fixed right-0 bottom-0 z-40 flex flex-wrap items-center justify-between gap-3 border-t border-moss-200 bg-white px-4 py-3 shadow-lg sm:px-5'
                                : 'flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between'
                        }
                    >
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <ShieldCheck className="h-5 w-5 text-moss-700" />
                            {compact
                                ? 'Finalization applies to all requested tests.'
                                : 'Finalizing locks this report and advances the patient workflow.'}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {!locked && (
                                <>
                                    <button
                                        type="button"
                                        disabled={form.processing}
                                        onClick={() =>
                                            submit(
                                                false,
                                                drugVerificationPending
                                                    ? 'update_verification'
                                                    : 'complete',
                                            )
                                        }
                                        className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-moss-300 px-4 py-2.5 font-semibold text-moss-800 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss-600 enabled:hover:border-moss-500 enabled:hover:bg-moss-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <Save className="h-4 w-4" />
                                        {drugVerificationPending
                                            ? 'Save Verification Update'
                                            : sections.drug_test
                                              ? 'Save as Pending'
                                              : 'Save draft'}
                                    </button>
                                    <button
                                        type="button"
                                        disabled={
                                            form.processing ||
                                            Object.keys(sections).length === 0
                                        }
                                        onClick={confirmFinalize}
                                        className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-moss-600 px-4 py-2.5 font-semibold text-white transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss-600 enabled:hover:bg-moss-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {form.processing ? (
                                            <LoaderCircle className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <ShieldCheck className="h-4 w-4" />
                                        )}
                                        {finalizeLabel}
                                    </button>
                                    {!drugVerificationPending &&
                                        sections.drug_test &&
                                        drugRequiresVerification && (
                                            <button
                                                type="button"
                                                disabled={form.processing}
                                                onClick={() =>
                                                    submit(
                                                        true,
                                                        'send_verification',
                                                    )
                                                }
                                                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 font-semibold text-white transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 enabled:hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <ShieldCheck className="h-4 w-4" />
                                                Send Drug Test for Verification
                                            </button>
                                        )}
                                    <InputError
                                        message={
                                            (
                                                form.errors as Record<
                                                    string,
                                                    string
                                                >
                                            )['drug_workflow_action']
                                        }
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
}

function Summary({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-baseline gap-1 whitespace-nowrap">
            <span className="text-xs text-moss-200">{label}:</span>
            <span className="font-semibold">{value}</span>
        </div>
    );
}
LaboratoryResultsForm.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
