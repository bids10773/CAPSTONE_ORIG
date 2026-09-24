import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useId, useMemo, useRef, useState } from 'react';
import InputError from '@/components/input-error';

type DateParts = { day: string; month: string; year: string };

function partsFromValue(value: string): DateParts {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    return match
        ? { day: match[3], month: match[2], year: match[1] }
        : { day: '', month: '', year: '' };
}

function validationMessage(parts: DateParts, min?: string, max?: string) {
    if (!parts.day || !parts.month || !parts.year) {
        return 'Please complete the appointment date.';
    }

    const day = Number(parts.day);
    const month = Number(parts.month);
    const year = Number(parts.year);
    const candidate = new Date(Date.UTC(year, month - 1, day));
    if (
        parts.day.length !== 2 ||
        parts.month.length !== 2 ||
        parts.year.length !== 4 ||
        candidate.getUTCFullYear() !== year ||
        candidate.getUTCMonth() !== month - 1 ||
        candidate.getUTCDate() !== day
    ) {
        return 'Please enter a valid appointment date.';
    }

    const value = `${parts.year}-${parts.month}-${parts.day}`;
    if (min && value < min) return 'Appointment date cannot be in the past.';
    if (max && value > max)
        return 'Appointment date is outside the available booking period.';
    if (candidate.getUTCDay() === 0 || candidate.getUTCDay() === 6)
        return 'Appointments are available Monday through Friday only.';
}

type Props = {
    value: string;
    error?: string;
    min?: string;
    max?: string;
    onChange: (value: string) => void;
    slotCounts?: Record<string, number>;
    slotCountContext?: string;
    loadingSlotCounts?: boolean;
};

function dateKey(date: Date): string {
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0'),
    ].join('-');
}

export default function AppointmentDateInput({
    value,
    error,
    min,
    max,
    onChange,
    slotCounts,
    slotCountContext = 'across all doctors',
    loadingSlotCounts = false,
}: Props) {
    const [draft, setDraft] = useState(() => ({
        sourceValue: value,
        parts: partsFromValue(value),
    }));
    if (draft.sourceValue !== value) {
        setDraft({ sourceValue: value, parts: partsFromValue(value) });
    }
    const parts = draft.parts;
    const [visibleMonth, setVisibleMonth] = useState(() => {
        const initial = value || min;
        return initial
            ? new Date(`${initial}T00:00:00`)
            : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    });
    const [localError, setLocalError] = useState<string>();
    const dayRef = useRef<HTMLInputElement>(null);
    const monthRef = useRef<HTMLInputElement>(null);
    const yearRef = useRef<HTMLInputElement>(null);
    const errorId = `${useId()}-error`;

    const calendarDays = useMemo(() => {
        const year = visibleMonth.getFullYear();
        const month = visibleMonth.getMonth();
        const firstWeekday = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        return Array.from({ length: 42 }, (_, index) => {
            const day = index - firstWeekday + 1;
            return day >= 1 && day <= daysInMonth
                ? new Date(year, month, day)
                : null;
        });
    }, [visibleMonth]);

    const selectedSlotCount = value ? slotCounts?.[value] : undefined;

    function selectCalendarDate(date: Date) {
        const nextValue = dateKey(date);
        setDraft({ sourceValue: nextValue, parts: partsFromValue(nextValue) });
        setLocalError(undefined);
        onChange(nextValue);
    }

    function update(part: keyof DateParts, raw: string) {
        const next = {
            ...parts,
            [part]: raw.replace(/\D/g, '').slice(0, part === 'year' ? 4 : 2),
        };
        setLocalError(undefined);
        const complete =
            next.day.length === 2 &&
            next.month.length === 2 &&
            next.year.length === 4;
        const message = complete
            ? validationMessage(next, min, max)
            : undefined;
        const nextValue =
            complete && !message
                ? `${next.year}-${next.month}-${next.day}`
                : '';
        setDraft({ sourceValue: nextValue, parts: next });
        onChange(nextValue);
        if (nextValue) setVisibleMonth(new Date(`${nextValue}T00:00:00`));

        if (part === 'day' && next.day.length === 2) monthRef.current?.focus();
        if (part === 'month' && next.month.length === 2)
            yearRef.current?.focus();
    }

    const fields = [
        {
            key: 'day' as const,
            label: 'Day',
            placeholder: 'DD',
            ref: dayRef,
            length: 2,
        },
        {
            key: 'month' as const,
            label: 'Month',
            placeholder: 'MM',
            ref: monthRef,
            length: 2,
        },
        {
            key: 'year' as const,
            label: 'Year',
            placeholder: 'YYYY',
            ref: yearRef,
            length: 4,
        },
    ];

    return (
        <div className="max-w-sm">
            {!slotCounts && (
                <>
                    <div className="grid grid-cols-3 gap-2.5">
                        {fields.map((field) => (
                            <label
                                key={field.key}
                                className="grid gap-1.5 text-xs font-medium text-slate-600"
                            >
                                <span>{field.label}</span>
                                <input
                                    ref={field.ref}
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    required
                                    maxLength={field.length}
                                    value={parts[field.key]}
                                    placeholder={field.placeholder}
                                    aria-invalid={Boolean(error || localError)}
                                    aria-describedby={errorId}
                                    onChange={(event) =>
                                        update(field.key, event.target.value)
                                    }
                                    onBlur={() => {
                                        if (
                                            parts.day ||
                                            parts.month ||
                                            parts.year
                                        ) {
                                            setLocalError(
                                                validationMessage(
                                                    parts,
                                                    min,
                                                    max,
                                                ),
                                            );
                                        }
                                    }}
                                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-center text-sm tracking-wider text-slate-900 outline-none placeholder:text-slate-400 focus:border-moss-500 focus:ring-4 focus:ring-moss-500/10 aria-invalid:border-rose-400"
                                />
                            </label>
                        ))}
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-400">
                        Example: 18 / 08 / 2026
                    </p>
                </>
            )}
            <div id={errorId} aria-live="polite">
                <InputError message={error || localError} />
            </div>
            {slotCounts && (
                <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between border-b border-slate-100 px-3 py-3">
                        <button
                            type="button"
                            onClick={() =>
                                setVisibleMonth(
                                    (current) =>
                                        new Date(
                                            current.getFullYear(),
                                            current.getMonth() - 1,
                                            1,
                                        ),
                                )
                            }
                            className="flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                            disabled={
                                !!min &&
                                dateKey(
                                    new Date(
                                        visibleMonth.getFullYear(),
                                        visibleMonth.getMonth() + 1,
                                        0,
                                    ),
                                ) < min
                            }
                            aria-label="Previous month"
                        >
                            <ChevronLeft className="size-4" />
                        </button>
                        <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                            <CalendarDays className="size-4 text-moss-600" />
                            {new Intl.DateTimeFormat('en-US', {
                                month: 'long',
                                year: 'numeric',
                            }).format(visibleMonth)}
                        </span>
                        <button
                            type="button"
                            onClick={() =>
                                setVisibleMonth(
                                    (current) =>
                                        new Date(
                                            current.getFullYear(),
                                            current.getMonth() + 1,
                                            1,
                                        ),
                                )
                            }
                            className="flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                            disabled={
                                !!max &&
                                dateKey(
                                    new Date(
                                        visibleMonth.getFullYear(),
                                        visibleMonth.getMonth() + 1,
                                        1,
                                    ),
                                ) > max
                            }
                            aria-label="Next month"
                        >
                            <ChevronRight className="size-4" />
                        </button>
                    </div>
                    <div className="p-3">
                        <div className="grid grid-cols-7 text-center text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
                            {[
                                'Sun',
                                'Mon',
                                'Tue',
                                'Wed',
                                'Thu',
                                'Fri',
                                'Sat',
                            ].map((day) => (
                                <span key={day} className="py-1">
                                    {day}
                                </span>
                            ))}
                        </div>
                        <div className="mt-1 grid grid-cols-7 gap-1">
                            {calendarDays.map((date, index) => {
                                if (!date)
                                    return <span key={`empty-${index}`} />;

                                const key = dateKey(date);
                                const count = slotCounts[key] ?? 0;
                                const outsideRange =
                                    (!!min && key < min) ||
                                    (!!max && key > max);
                                const weekend =
                                    date.getDay() === 0 || date.getDay() === 6;
                                const unavailable =
                                    outsideRange ||
                                    weekend ||
                                    (!loadingSlotCounts && count === 0);
                                const selected = key === value;

                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        disabled={unavailable}
                                        onClick={() => selectCalendarDate(date)}
                                        className={`flex min-h-12 flex-col items-center justify-center rounded-lg border px-0.5 py-1 transition ${
                                            selected
                                                ? 'border-moss-600 bg-moss-600 text-white'
                                                : unavailable
                                                  ? 'border-transparent text-slate-300'
                                                  : 'border-slate-100 text-slate-700 hover:border-moss-300 hover:bg-moss-50'
                                        }`}
                                    >
                                        <span className="text-xs font-semibold">
                                            {date.getDate()}
                                        </span>
                                        {!outsideRange && !weekend && (
                                            <span
                                                className={`mt-0.5 text-[8px] leading-none ${selected ? 'text-moss-100' : count > 0 ? 'text-moss-600' : 'text-slate-300'}`}
                                            >
                                                {loadingSlotCounts
                                                    ? '...'
                                                    : `${count} slot${count === 1 ? '' : 's'}`}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    {value && selectedSlotCount !== undefined && (
                        <p className="border-t border-slate-100 px-3 py-2.5 text-xs text-slate-600">
                            <span className="font-semibold text-moss-700">
                                {selectedSlotCount} available slot
                                {selectedSlotCount === 1 ? '' : 's'}
                            </span>{' '}
                            on the selected day {slotCountContext}.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
