import { getBmiClassification } from '@/lib/bmi';

export function BmiSummary({
    bmi,
    compact = false,
}: {
    bmi?: number | string | null;
    compact?: boolean;
}) {
    const classification = getBmiClassification(bmi);
    return (
        <div
            className={`rounded-xl border border-moss-200 bg-moss-50 dark:border-moss-800 dark:bg-moss-950/40 ${compact ? 'px-3 py-2' : 'p-4'}`}
        >
            <p
                className={`${compact ? 'text-xs' : 'text-sm'} font-semibold text-moss-800 dark:text-moss-200`}
            >
                {compact ? 'BMI' : 'Body mass index'}
            </p>
            <p
                className={`mt-1 ${compact ? 'text-lg' : 'text-2xl'} font-bold text-slate-950 dark:text-slate-100`}
            >
                {classification ? bmi : 'Not recorded'}
                {classification && (
                    <span
                        className={`ml-2 ${compact ? 'text-xs' : 'text-sm'} font-normal`}
                    >
                        kg/m²
                    </span>
                )}
            </p>
            {classification && (
                <p
                    title="Adult BMI classification"
                    className={`${compact ? 'mt-0.5 text-xs' : 'mt-2'} font-semibold text-moss-900 dark:text-moss-100`}
                >
                    {classification}
                </p>
            )}
            {!compact && (
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    Adult BMI classification
                </p>
            )}
        </div>
    );
}
