import { allHistoryFields, bodyParts } from '@/lib/clinical-exam-fields';

export function MedicalReportClinicalReview({
    history,
    physical,
}: {
    history?: Record<string, unknown> | null;
    physical?: Record<string, unknown> | null;
}) {
    const pressure =
        physical?.blood_pressure ??
        (physical?.systolic_pressure != null &&
        physical?.diastolic_pressure != null
            ? `${physical.systolic_pressure}/${physical.diastolic_pressure}`
            : null);
    const measurements = [
        ['Height', physical?.height, 'cm'],
        ['Weight', physical?.weight, 'kg'],
        ['Blood pressure', pressure, 'mmHg'],
        ['Temperature', physical?.temperature, '°C'],
        ['Pulse rate', physical?.heart_rate ?? physical?.pulse_rate, 'bpm'],
        [
            'Respiration',
            physical?.respiratory_rate ?? physical?.respiration_rate,
            'breaths/min',
        ],
        ['Hearing', physical?.hearing, ''],
        ['Visual acuity', physical?.visual_acuity, ''],
        ['Oxygen saturation', physical?.oxygen_saturation, '%'],
    ];
    return (
        <div className="grid border-x border-b border-moss-400 bg-white lg:grid-cols-[52fr_48fr]">
            <div className="min-w-0 border-b border-moss-400 lg:border-r lg:border-b-0">
                <h2 className="border-b border-moss-400 px-3 py-1.5 text-sm font-bold text-moss-800">
                    I. Medical history
                </h2>
                <dl className="divide-y divide-moss-100">
                    {allHistoryFields.map(([label, field], index) => (
                        <div
                            key={field}
                            className="grid gap-1 px-3 py-1.5 text-sm sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-3"
                        >
                            <dt className="font-medium text-moss-800">
                                {String.fromCharCode(65 + index)}. {label}
                            </dt>
                            <dd className="min-w-0 border-b border-moss-200 break-words whitespace-pre-wrap text-slate-900">
                                {String(history?.[field] || 'Not recorded')}
                            </dd>
                        </div>
                    ))}
                </dl>
                <h2 className="border-y border-moss-400 px-3 py-1.5 text-sm font-bold text-moss-800">
                    II. Physical examination
                </h2>
                <dl className="divide-y divide-moss-100">
                    {measurements.map(([label, value, unit], index) => (
                        <div
                            key={String(label)}
                            className="grid grid-cols-2 gap-3 px-3 py-1.5 text-sm"
                        >
                            <dt className="font-medium text-moss-800">
                                {String.fromCharCode(65 + index)}.{' '}
                                {String(label)}
                            </dt>
                            <dd className="min-w-0 border-b border-moss-200 text-center break-words text-slate-900">
                                {value == null || value === ''
                                    ? 'Not recorded'
                                    : `${String(value)}${unit ? ` ${unit}` : ''}`}
                            </dd>
                        </div>
                    ))}
                </dl>
                {Object.entries(
                    (physical?.vital_signs_not_assessed ?? {}) as Record<
                        string,
                        string
                    >,
                ).map(([field, reason]) => (
                    <p
                        key={field}
                        className="px-3 py-1.5 text-sm text-amber-900"
                    >
                        {field.replaceAll('_', ' ')} — Not assessed: {reason}
                    </p>
                ))}
            </div>
            <div className="min-w-0">
                <h2 className="sr-only">Physical findings</h2>
                <table className="w-full table-fixed text-left text-sm">
                    <thead>
                        <tr className="border-b border-moss-200 text-slate-600">
                            <th
                                scope="col"
                                className="w-[36%] border-r border-moss-200 px-3 py-1.5 font-medium text-moss-800"
                            >
                                Body system
                            </th>
                            <th
                                scope="col"
                                className="w-[18%] border-r border-moss-200 px-1 py-1.5 text-center font-medium text-moss-800"
                            >
                                Normal
                            </th>
                            <th
                                scope="col"
                                className="px-3 py-1.5 font-medium text-moss-800"
                            >
                                Findings
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-moss-100">
                        {bodyParts.map(({ label, field }) => (
                            <tr key={field}>
                                <th
                                    scope="row"
                                    className="border-r border-moss-200 px-3 py-1.5 align-top font-medium text-moss-800"
                                >
                                    {label}
                                </th>
                                <td className="border-r border-moss-200 px-1 py-1.5 text-center align-top">
                                    <input
                                        type="checkbox"
                                        disabled
                                        checked={
                                            !!physical?.is_completed &&
                                            !physical?.[field]
                                        }
                                        aria-label={`${label}: Normal`}
                                        className="size-3.5 accent-moss-700"
                                    />
                                </td>
                                <td
                                    className={`px-3 py-1.5 align-top break-words whitespace-pre-wrap ${physical?.[field] ? 'text-amber-900' : 'text-slate-900'}`}
                                >
                                    {String(
                                        physical?.[field] ||
                                            (physical?.is_completed
                                                ? '—'
                                                : 'Not recorded'),
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <dl className="border-t border-moss-200 px-3 py-2 text-sm">
                    <dt className="font-medium text-slate-600">
                        Doctor’s remarks
                    </dt>
                    <dd className="mt-1 break-words whitespace-pre-wrap text-slate-900">
                        {String(physical?.remarks || 'Not recorded')}
                    </dd>
                </dl>
            </div>
        </div>
    );
}
