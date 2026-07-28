import type { LucideIcon } from 'lucide-react';
import {
    CalendarDays,
    Check,
    ChevronRight,
    Clock3,
    Hash,
    UserRound,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface PatientSummaryDetail {
    label: string;
    value?: ReactNode;
    icon?: LucideIcon;
}

export function PatientSummaryCard({
    name,
    subtitle,
    details,
    stage,
}: {
    name: string;
    subtitle?: string;
    details: PatientSummaryDetail[];
    stage: string;
}) {
    const initials = name
        .split(' ')
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase();

    return (
        <section className="sticky top-[88px] z-20 rounded-2xl border border-border bg-white/95 p-4 shadow-[0_14px_38px_-28px_rgba(31,41,55,.3)] backdrop-blur-xl sm:p-5">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
                <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-moss-100 text-sm font-bold text-moss-800">
                        {initials || <UserRound className="size-5" />}
                    </span>
                    <div className="min-w-0">
                        <p className="text-[11px] font-semibold tracking-[.12em] text-moss-700 uppercase">
                            Active patient
                        </p>
                        <h1 className="truncate text-lg font-semibold text-slate-950">
                            {name}
                        </h1>
                        {subtitle && (
                            <p className="truncate text-xs text-slate-500">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>

                <dl className="grid flex-1 grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-3 lg:grid-cols-4 xl:border-l xl:border-border xl:pl-6">
                    {details.map(({ label, value, icon: Icon = Hash }) => (
                        <div key={label} className="min-w-0">
                            <dt className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
                                <Icon className="size-3.5" />
                                {label}
                            </dt>
                            <dd className="mt-1 truncate text-sm font-semibold text-slate-800">
                                {value || 'Not available'}
                            </dd>
                        </div>
                    ))}
                </dl>

                <div className="shrink-0 rounded-xl border border-moss-200 bg-moss-50 px-3.5 py-2.5">
                    <p className="text-[10px] font-semibold tracking-wide text-moss-600 uppercase">
                        Current stage
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-moss-900">
                        {stage}
                    </p>
                </div>
            </div>
        </section>
    );
}

export function WorkflowTimeline({
    steps,
    current,
}: {
    steps: string[];
    current: number;
}) {
    return (
        <nav
            aria-label="Clinical workflow progress"
            className="overflow-x-auto rounded-2xl border border-border bg-white px-4 py-4"
        >
            <ol className="flex min-w-max items-center">
                {steps.map((step, index) => {
                    const complete = index < current;
                    const active = index === current;
                    return (
                        <li key={step} className="flex items-center">
                            <div className="flex items-center gap-2">
                                <span
                                    className={cn(
                                        'flex size-8 items-center justify-center rounded-full border text-xs font-semibold transition-all',
                                        complete &&
                                            'border-moss-500 bg-moss-500 text-white',
                                        active &&
                                            'border-moss-500 bg-moss-50 text-moss-800 ring-4 ring-moss-100',
                                        !complete &&
                                            !active &&
                                            'border-slate-200 bg-white text-slate-400',
                                    )}
                                    aria-current={active ? 'step' : undefined}
                                >
                                    {complete ? (
                                        <Check className="size-4" />
                                    ) : (
                                        index + 1
                                    )}
                                </span>
                                <span
                                    className={cn(
                                        'text-xs font-medium',
                                        active
                                            ? 'text-moss-800'
                                            : complete
                                              ? 'text-slate-700'
                                              : 'text-slate-400',
                                    )}
                                >
                                    {step}
                                </span>
                            </div>
                            {index < steps.length - 1 && (
                                <ChevronRight className="mx-3 size-4 text-slate-300" />
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}

export function ClinicalSection({
    icon: Icon,
    title,
    description,
    children,
    className,
}: {
    icon: LucideIcon;
    title: string;
    description?: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section
            className={cn(
                'overflow-hidden rounded-2xl border border-border bg-white shadow-[0_10px_30px_-24px_rgba(31,41,55,.25)]',
                className,
            )}
        >
            <header className="flex items-start gap-3 border-b border-border bg-moss-50/50 px-5 py-4 sm:px-6">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-moss-700 shadow-sm">
                    <Icon className="size-5" />
                </span>
                <div>
                    <h2 className="text-base font-semibold text-slate-900">
                        {title}
                    </h2>
                    {description && (
                        <p className="mt-0.5 text-xs leading-5 text-slate-500">
                            {description}
                        </p>
                    )}
                </div>
            </header>
            <div className="p-5 sm:p-6">{children}</div>
        </section>
    );
}

export function MedicalMetricCard({
    icon: Icon,
    label,
    unit,
    children,
}: {
    icon: LucideIcon;
    label: string;
    unit?: string;
    children: ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-border bg-slate-50/50 p-4 transition focus-within:border-moss-300 focus-within:bg-white">
            <div className="mb-3 flex items-center gap-2">
                <Icon className="size-4 text-moss-600" />
                <label className="text-xs font-semibold text-slate-700">
                    {label}
                </label>
                {unit && (
                    <span className="ml-auto text-[10px] text-slate-400">
                        {unit}
                    </span>
                )}
            </div>
            {children}
        </div>
    );
}

export function SegmentedChoice({
    value,
    onChange,
    options,
    ariaLabel,
}: {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string; tone?: 'normal' | 'warning' }[];
    ariaLabel: string;
}) {
    return (
        <div
            role="radiogroup"
            aria-label={ariaLabel}
            className="grid gap-2 sm:grid-cols-2"
        >
            {options.map((option) => {
                const selected = value === option.value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => onChange(option.value)}
                        className={cn(
                            'min-h-11 rounded-xl border px-3 py-2 text-sm font-semibold transition focus-visible:ring-4 focus-visible:ring-moss-500/15 focus-visible:outline-none',
                            selected &&
                                option.tone !== 'warning' &&
                                'border-moss-500 bg-moss-50 text-moss-800',
                            selected &&
                                option.tone === 'warning' &&
                                'border-amber-400 bg-amber-50 text-amber-800',
                            !selected &&
                                'border-slate-200 bg-white text-slate-500 hover:border-moss-300 hover:bg-moss-50/50',
                        )}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}

export function StickyActionFooter({
    children,
    hint,
}: {
    children: ReactNode;
    hint?: string;
}) {
    return (
        <footer className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-2xl border border-border bg-white/95 px-4 py-3 shadow-[0_18px_48px_-24px_rgba(31,41,55,.32)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-xs text-slate-500">
                <Clock3 className="size-4 text-moss-600" />
                {hint || 'Review all entries before completing this stage.'}
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
                {children}
            </div>
        </footer>
    );
}

export const clinicalIcons = { CalendarDays, Clock3 };
