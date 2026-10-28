import { BmiSummary } from '@/components/bmi-summary';

type Reading = number | string | null;
type Measurements = {
    height?: Reading;
    weight?: Reading;
    bmi?: Reading;
    systolic_pressure?: Reading;
    diastolic_pressure?: Reading;
    blood_pressure?: Reading;
    heart_rate?: Reading;
    pulse_rate?: Reading;
    respiratory_rate?: Reading;
    respiration_rate?: Reading;
    temperature?: Reading;
    oxygen_saturation?: Reading;
    visual_acuity?: Reading;
    hearing?: Reading;
};

export function IntakeMeasurements({
    measurements,
    compact = false,
}: {
    measurements?: Measurements | null;
    compact?: boolean;
}) {
    const m = measurements;
    const pressure =
        m?.blood_pressure ??
        (m?.systolic_pressure != null && m?.diastolic_pressure != null
            ? `${m.systolic_pressure}/${m.diastolic_pressure}`
            : null);
    const height = Number(m?.height);
    const weight = Number(m?.weight);
    const bmi =
        m?.bmi ??
        (height > 0 && weight > 0
            ? (weight / (height / 100) ** 2).toFixed(1)
            : null);
    const fields = [
        ['Height', m?.height, 'cm'],
        ['Weight', m?.weight, 'kg'],
        ['Blood pressure', pressure, 'mmHg'],
        ['Pulse rate', m?.heart_rate ?? m?.pulse_rate, 'bpm'],
        [
            'Respiratory rate',
            m?.respiratory_rate ?? m?.respiration_rate,
            'breaths/min',
        ],
        ['Temperature', m?.temperature, '°C'],
        ['Oxygen saturation', m?.oxygen_saturation, '%'],
        ['Visual acuity', m?.visual_acuity, ''],
        ['Hearing', m?.hearing, ''],
    ] as const;
    return (
        <div
            className={`grid grid-cols-2 items-start gap-x-4 gap-y-2 ${compact ? '' : 'lg:grid-cols-3 xl:grid-cols-5'}`}
        >
            {fields.map(([label, value, unit]) => (
                <dl key={label} className="min-w-0 py-1">
                    <dt className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        {label}
                    </dt>
                    <dd className="mt-1 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-base font-semibold break-words text-slate-950 tabular-nums dark:text-slate-100">
                        {value == null || value === '' ? (
                            <span className="text-sm font-normal text-muted-foreground">
                                Not recorded
                            </span>
                        ) : (
                            <>
                                <span className="min-w-0 [overflow-wrap:anywhere]">
                                    {value}
                                </span>
                                {unit && (
                                    <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                                        {unit}
                                    </span>
                                )}
                            </>
                        )}
                    </dd>
                </dl>
            ))}
            <BmiSummary bmi={bmi} compact />
        </div>
    );
}
