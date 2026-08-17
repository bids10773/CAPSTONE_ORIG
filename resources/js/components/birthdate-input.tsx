import { useEffect, useId, useRef, useState } from 'react';
import InputError from '@/components/input-error';

type DateParts = { day: string; month: string; year: string };

function partsFromValue(value?: string): DateParts {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
    return match
        ? { day: match[3], month: match[2], year: match[1] }
        : { day: '', month: '', year: '' };
}

function digits(value: string, maximumLength: number): string {
    return value.replace(/\D/g, '').slice(0, maximumLength);
}

function validationMessage(parts: DateParts): string | undefined {
    if (!parts.day || !parts.month || !parts.year) {
        return 'Please complete your birthdate.';
    }
    if (
        parts.day.length !== 2 ||
        parts.month.length !== 2 ||
        parts.year.length !== 4
    ) {
        return 'Please complete your birthdate.';
    }

    const day = Number(parts.day);
    const month = Number(parts.month);
    const year = Number(parts.year);
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1) {
        return 'Please enter a valid birthdate.';
    }

    const candidate = new Date(Date.UTC(year, month - 1, day));
    if (
        candidate.getUTCFullYear() !== year ||
        candidate.getUTCMonth() !== month - 1 ||
        candidate.getUTCDate() !== day
    ) {
        return 'The selected date is not valid.';
    }

    const now = new Date();
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    if (candidate.getTime() > today) {
        return 'Birthdate cannot be in the future.';
    }
}

export interface BirthdateInputProps {
    value?: string;
    name?: string;
    error?: string;
    required?: boolean;
    onChange?: (value: string) => void;
}

export default function BirthdateInput({
    value = '',
    name = 'birthdate',
    error,
    required = false,
    onChange,
}: BirthdateInputProps) {
    const [parts, setParts] = useState(() => partsFromValue(value));
    const [localError, setLocalError] = useState<string>();
    const monthRef = useRef<HTMLInputElement>(null);
    const yearRef = useRef<HTMLInputElement>(null);
    const dayRef = useRef<HTMLInputElement>(null);
    const baseId = useId();
    const errorId = `${baseId}-error`;
    const helpId = `${baseId}-help`;
    const complete =
        parts.day.length === 2 &&
        parts.month.length === 2 &&
        parts.year.length === 4;
    const combined = complete
        ? `${parts.year}-${parts.month}-${parts.day}`
        : '';
    const currentValidation = complete ? validationMessage(parts) : undefined;

    useEffect(() => {
        const message = currentValidation ?? '';
        dayRef.current?.setCustomValidity(message);
        monthRef.current?.setCustomValidity(message);
        yearRef.current?.setCustomValidity(message);
    }, [currentValidation]);

    function update(part: keyof DateParts, rawValue: string) {
        const maximum = part === 'year' ? 4 : 2;
        const nextValue = digits(rawValue, maximum);
        const next = { ...parts, [part]: nextValue };
        setParts(next);
        setLocalError(undefined);
        const nextComplete =
            next.day.length === 2 &&
            next.month.length === 2 &&
            next.year.length === 4;
        onChange?.(
            nextComplete ? `${next.year}-${next.month}-${next.day}` : '',
        );

        if (part === 'day' && nextValue.length === 2) monthRef.current?.focus();
        if (part === 'month' && nextValue.length === 2)
            yearRef.current?.focus();
    }

    function validateVisibleValue() {
        if (parts.day || parts.month || parts.year) {
            setLocalError(validationMessage(parts));
        }
    }

    const describedBy =
        `${helpId} ${error || localError ? errorId : ''}`.trim();
    const fields = [
        {
            key: 'day' as const,
            label: 'Day',
            placeholder: 'DD',
            length: 2,
            ref: dayRef,
        },
        {
            key: 'month' as const,
            label: 'Month',
            placeholder: 'MM',
            length: 2,
            ref: monthRef,
        },
        {
            key: 'year' as const,
            label: 'Year',
            placeholder: 'YYYY',
            length: 4,
            ref: yearRef,
        },
    ];

    return (
        <div>
            <input type="hidden" name={name} value={combined} />
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
                            required={required}
                            maxLength={field.length}
                            value={parts[field.key]}
                            placeholder={field.placeholder}
                            autoComplete={
                                field.key === 'year'
                                    ? 'bday-year'
                                    : field.key === 'month'
                                      ? 'bday-month'
                                      : 'bday-day'
                            }
                            aria-label={`Birth ${field.label.toLowerCase()}`}
                            aria-describedby={describedBy}
                            aria-invalid={Boolean(
                                error || localError || currentValidation,
                            )}
                            onChange={(event) =>
                                update(field.key, event.target.value)
                            }
                            onBlur={validateVisibleValue}
                            onInvalid={() =>
                                setLocalError(validationMessage(parts))
                            }
                            onKeyDown={(event) => {
                                if (
                                    event.key !== 'Backspace' ||
                                    parts[field.key] !== ''
                                )
                                    return;
                                if (field.key === 'month')
                                    dayRef.current?.focus();
                                if (field.key === 'year')
                                    monthRef.current?.focus();
                            }}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-center text-sm tracking-wider text-slate-900 transition outline-none placeholder:text-slate-400 focus:border-moss-500 focus:ring-4 focus:ring-moss-500/10 aria-invalid:border-rose-400 aria-invalid:focus:ring-rose-500/10"
                        />
                    </label>
                ))}
            </div>
            <p id={helpId} className="mt-1.5 text-[11px] text-slate-400">
                Example: 18 / 08 / 2003
            </p>
            <div id={errorId} aria-live="polite">
                <InputError message={error || localError} />
            </div>
        </div>
    );
}
