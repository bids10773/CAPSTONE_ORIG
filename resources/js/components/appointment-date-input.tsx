import { useId, useRef, useState } from 'react';
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
}

type Props = {
    value: string;
    error?: string;
    min?: string;
    max?: string;
    onChange: (value: string) => void;
};

export default function AppointmentDateInput({
    value,
    error,
    min,
    max,
    onChange,
}: Props) {
    const [parts, setParts] = useState(() => partsFromValue(value));
    const [localError, setLocalError] = useState<string>();
    const dayRef = useRef<HTMLInputElement>(null);
    const monthRef = useRef<HTMLInputElement>(null);
    const yearRef = useRef<HTMLInputElement>(null);
    const errorId = `${useId()}-error`;

    function update(part: keyof DateParts, raw: string) {
        const next = {
            ...parts,
            [part]: raw.replace(/\D/g, '').slice(0, part === 'year' ? 4 : 2),
        };
        setParts(next);
        setLocalError(undefined);
        const complete =
            next.day.length === 2 &&
            next.month.length === 2 &&
            next.year.length === 4;
        const message = complete
            ? validationMessage(next, min, max)
            : undefined;
        onChange(
            complete && !message
                ? `${next.year}-${next.month}-${next.day}`
                : '',
        );

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
                                if (parts.day || parts.month || parts.year) {
                                    setLocalError(
                                        validationMessage(parts, min, max),
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
            <div id={errorId} aria-live="polite">
                <InputError message={error || localError} />
            </div>
        </div>
    );
}
