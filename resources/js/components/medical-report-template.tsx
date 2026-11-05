import type { ReactNode } from 'react';
import { getBmiClassification } from '@/lib/bmi';

type Diagnostic = {
    service_key: string;
    status?: string;
    verified_at?: string | null;
    interpretation?: string | null;
    findings?: string | null;
    result_data?: Record<string, unknown> | null;
};

export function MedicalReportHeading({ children }: { children: ReactNode }) {
    return (
        <h2 className="border-b border-moss-400 bg-white px-3 py-1.5 text-sm font-bold text-moss-800">
            {children}
        </h2>
    );
}

export function MedicalReportDiagnosticSummary({
    services,
    diagnostics = [],
    laboratory,
    xray,
    ecg,
    audiometry,
    neuro,
}: {
    services: string[];
    diagnostics?: Diagnostic[];
    laboratory?: Record<string, unknown> | null;
    xray?: {
        status?: string;
        is_completed?: boolean;
        verified_at?: string | null;
        impression?: string;
    } | null;
    ecg?: string | null;
    audiometry?: string | null;
    neuro?: string | null;
}) {
    const has = (service: string) => services.includes(service);
    const diagnostic = (key: string) =>
        diagnostics.find((item) => item.service_key === key);
    const verified = (key: string) =>
        diagnostic(key)?.status === 'verified' &&
        !!diagnostic(key)?.verified_at;
    const status = (requested: boolean, complete: boolean) =>
        !requested
            ? 'Not requested'
            : complete
              ? 'See supporting result'
              : 'Pending';
    const interpretedRow = (key: string, service: string, label: string) => {
        const requested =
            has(service) || (key === 'blood_chemistry' && has('FBS'));
        const complete = requested && verified(key);
        return (
            <ResultRow
                key={key}
                label={label}
                choices={['Normal', 'Findings']}
                selected={
                    complete
                        ? diagnostic(key)?.interpretation === 'normal'
                            ? 0
                            : diagnostic(key)?.interpretation ===
                                'with_findings'
                              ? 1
                              : null
                        : null
                }
                note={
                    complete && diagnostic(key)?.findings
                        ? diagnostic(key)?.findings
                        : status(requested, !!complete)
                }
            />
        );
    };
    const valueFrom = (value: unknown, key: string): string => {
        if (value && typeof value === 'object')
            return String((value as Record<string, unknown>)[key] ?? '')
                .toLowerCase()
                .trim();
        return String(value ?? '')
            .toLowerCase()
            .trim();
    };
    const categoricalRow = (
        key: string,
        service: string,
        label: string,
        choices: [string, string],
        value: string,
        allowed: [string, string],
    ) => {
        const complete = has(service) && verified(key);
        return (
            <ResultRow
                key={label}
                label={label}
                choices={choices}
                selected={
                    complete
                        ? value === allowed[0]
                            ? 0
                            : value === allowed[1]
                              ? 1
                              : null
                        : null
                }
                note={status(has(service), !!complete)}
            />
        );
    };
    const drug =
        diagnostic('drug_test')?.result_data?.final_result ??
        laboratory?.drug_test_results;
    const xrayVerified =
        has('X-Ray') &&
        xray?.status === 'completed' &&
        xray?.is_completed &&
        !!xray?.verified_at;
    const impression = xray?.impression?.trim() ?? '';
    const normalXray =
        /^(?:essentially\s+)?normal\s+chest(?:\s+x[\s-]?ray)?[.!]?$/i.test(
            impression,
        );
    const abnormalXray = /\b(?:abnormal|not\s+normal)\b/i.test(impression);
    return (
        <div className="border-x border-b border-moss-400 bg-white">
            <MedicalReportHeading>III. Laboratory</MedicalReportHeading>
            <ResultTable>
                {interpretedRow('cbc', 'CBC', 'A. Complete Blood Count')}
                {interpretedRow('urinalysis', 'Urinalysis', 'B. Urinalysis')}
                {interpretedRow('fecalysis', 'Fecalysis', 'C. Fecalysis')}
                {categoricalRow(
                    'serology',
                    'Hepatitis',
                    'D. Hepatitis B (HBs Ag)',
                    ['Non-reactive', 'Reactive'],
                    valueFrom(laboratory?.serology_results, 'hbsag'),
                    ['non-reactive', 'reactive'],
                )}
                {categoricalRow(
                    'pregnancy',
                    'Pregnancy Test',
                    'E. Pregnancy Test',
                    ['Negative', 'Positive'],
                    valueFrom(laboratory?.pregnancy_test, 'pregnancy_test'),
                    ['negative', 'positive'],
                )}
                <tr className="border-b border-moss-200">
                    <th
                        colSpan={4}
                        className="px-3 py-1.5 text-left font-medium text-moss-800"
                    >
                        F. Drug Test
                    </th>
                </tr>
                {categoricalRow(
                    'drug_test',
                    'Drug Test',
                    'Methamphetamine (Shabu)',
                    ['Negative', 'Positive'],
                    valueFrom(drug, 'methamphetamine'),
                    ['negative', 'positive'],
                )}
                {categoricalRow(
                    'drug_test',
                    'Drug Test',
                    'Marijuana / THC',
                    ['Negative', 'Positive'],
                    valueFrom(drug, 'tetrahydrocannabinol'),
                    ['negative', 'positive'],
                )}
            </ResultTable>
            <MedicalReportHeading>IV. Chest X-ray</MedicalReportHeading>
            <ResultTable>
                <ResultRow
                    label="Chest X-ray"
                    choices={['Normal chest', 'Findings']}
                    selected={
                        xrayVerified && impression
                            ? normalXray
                                ? 0
                                : abnormalXray
                                  ? 1
                                  : null
                            : null
                    }
                    note={
                        xrayVerified && impression
                            ? impression
                            : status(has('X-Ray'), !!xrayVerified)
                    }
                />
            </ResultTable>
            <MedicalReportHeading>
                V. Electrocardiogram / audiometry
            </MedicalReportHeading>
            <ResultTable>
                <ResultRow
                    label="Electrocardiogram (ECG)"
                    choices={['Normal', 'Findings']}
                    selected={null}
                    note={has('ECG') ? ecg || 'Pending' : 'Not requested'}
                />
                <ResultRow
                    label="Audiometry"
                    choices={['Normal', 'Findings']}
                    selected={null}
                    note={
                        has('Audiometry')
                            ? audiometry || 'Pending'
                            : 'Not requested'
                    }
                />
            </ResultTable>
            <MedicalReportHeading>VI. Others</MedicalReportHeading>
            <ResultTable>
                {interpretedRow(
                    'blood_chemistry',
                    'Blood Chemistry',
                    'Blood chemistry',
                )}
                {has('Blood Typing') && (
                    <ResultRow
                        label="Blood type"
                        choices={null}
                        selected={null}
                        note={
                            verified('blood_type')
                                ? valueFrom(
                                      laboratory?.blood_type,
                                      'blood_type',
                                  ).toUpperCase() || 'See supporting result'
                                : 'Pending'
                        }
                    />
                )}
                {has('Neuro Psychiatric Test') && (
                    <ResultRow
                        label="Neuro psychiatric test"
                        choices={null}
                        selected={null}
                        note={neuro || 'Pending'}
                    />
                )}
            </ResultTable>
        </div>
    );
}

function ResultTable({ children }: { children: ReactNode }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[540px] table-fixed border-collapse text-left text-xs sm:text-sm">
                <colgroup>
                    <col className="w-[34%]" />
                    <col className="w-[18%]" />
                    <col className="w-[18%]" />
                    <col className="w-[30%]" />
                </colgroup>
                <tbody>{children}</tbody>
            </table>
        </div>
    );
}

function ResultRow({
    label,
    choices,
    selected,
    note,
}: {
    label: string;
    choices: [string, string] | null;
    selected: number | null;
    note?: string | null;
}) {
    const accessibleLabel = label.replace(/^[A-Z]\.\s*/, '');
    return (
        <tr className="border-b border-moss-200 last:border-b-0">
            <th
                scope="row"
                className="border-r border-moss-200 px-3 py-1.5 align-top font-medium text-moss-800"
            >
                {label}
            </th>
            {choices ? (
                choices.map((choice, index) => (
                    <td
                        key={choice}
                        className="border-r border-moss-200 px-2 py-1.5 align-top"
                    >
                        <label className="flex items-start gap-1.5 text-slate-800">
                            <input
                                type="checkbox"
                                disabled
                                checked={selected === index}
                                aria-label={`${accessibleLabel}: ${choice}`}
                                className="mt-0.5 size-3.5 shrink-0 accent-moss-700"
                            />
                            {choice}
                        </label>
                    </td>
                ))
            ) : (
                <td colSpan={2} />
            )}
            <td className="px-3 py-1.5 align-top break-words whitespace-pre-wrap text-slate-700">
                {note}
            </td>
        </tr>
    );
}

export function MedicalReportCertification({
    physical,
}: {
    physical?: {
        bmi?: string | number | null;
        height?: string | number | null;
        weight?: string | number | null;
    } | null;
}) {
    const height = Number(physical?.height);
    const weight = Number(physical?.weight);
    const bmi =
        physical?.bmi ??
        (height > 0 && weight > 0
            ? (weight / (height / 100) ** 2).toFixed(1)
            : null);
    const category = getBmiClassification(bmi);
    return (
        <aside className="border-t border-moss-400 lg:border-t-0 lg:border-l">
            <MedicalReportHeading>Body mass index (BMI)</MedicalReportHeading>
            <p className="border-b border-moss-400 px-3 py-3 text-center text-sm font-semibold text-slate-900">
                {bmi ?? 'Not recorded'}
                {category ? ` — ${category}` : ''}
            </p>
            <MedicalReportHeading>Certification</MedicalReportHeading>
            <p className="px-4 py-4 text-sm leading-6 text-slate-700">
                “I certify that I am the same person whose name and picture
                appears on this medical record, and that I have truthfully
                answered all the questions asked regarding my person being
                medically examined.”
            </p>
        </aside>
    );
}
