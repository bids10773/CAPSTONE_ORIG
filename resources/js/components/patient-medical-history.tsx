import { Activity, HeartPulse } from 'lucide-react';

type ValueMap = Record<string, string | number | boolean | null>;

export type PatientMedicalRecord = {
    id: number;
    examination_date: string | null;
    vital_signs: ValueMap | null;
};

function humanize(value: string): string {
    return value
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
        .replace('Bpm', 'BPM')
        .replace('Rpm', 'RPM')
        .replace('Bmi', 'BMI');
}

function displayValue(value: ValueMap[string]): string {
    if (value === true) return 'Yes';
    if (value === false) return 'No';
    if (value === null || value === '') return 'Not recorded';
    return String(value);
}

function formatDate(value: string | null): string {
    if (!value) return 'Date unavailable';

    return new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(`${value.slice(0, 10)}T00:00:00`));
}

export function PatientMedicalHistory({
    records,
}: {
    records: PatientMedicalRecord[];
}) {
    if (!records.length) {
        return (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center dark:border-border dark:bg-muted/20">
                <HeartPulse className="mx-auto size-9 text-slate-300" />
                <p className="mt-3 font-semibold text-slate-700 dark:text-slate-200">
                    No vital-sign records available
                </p>
                <p className="mt-1 text-sm text-slate-500">
                    Vital signs from completed and released physical
                    examinations will appear here.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {records.map((record) => (
                <section
                    key={record.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-border dark:bg-card"
                >
                    <div className="border-b border-slate-100 px-5 py-4 dark:border-border">
                        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                            Latest vital signs
                        </p>
                        <p className="mt-1 font-semibold text-slate-950 dark:text-slate-100">
                            {formatDate(record.examination_date)}
                        </p>
                    </div>

                    {record.vital_signs && (
                        <div className="p-5 sm:p-6">
                            <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                <Activity className="size-4 text-moss-600" />
                                Vital Signs
                            </h4>
                            <dl className="mt-3 grid gap-x-5 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
                                {Object.entries(record.vital_signs)
                                    .filter(
                                        ([, value]) =>
                                            value !== null && value !== '',
                                    )
                                    .map(([label, value]) => (
                                        <div key={label}>
                                            <dt className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                                                {humanize(label)}
                                            </dt>
                                            <dd className="mt-0.5 text-sm text-slate-800 dark:text-slate-200">
                                                {displayValue(value)}
                                            </dd>
                                        </div>
                                    ))}
                            </dl>
                        </div>
                    )}
                </section>
            ))}
        </div>
    );
}
