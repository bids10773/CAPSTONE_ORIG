import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface Props {
    appointment: any;
}

export default function FinalEvaluation({ appointment }: Props) {
    const { data, setData, post, processing } = useForm({
        medical_class: '',
        final_remarks: '',
    });

    const handleClassChange = (value: string) => {
        setData('medical_class', value);
        const remarksMap: Record<string, string> = {
            'A': 'FIT TO WORK\nPhysically fit for all types of work. Has no noted defects.',
            'B': 'FIT TO WORK\nPhysically fit for all types of work. Has minor defect(s) or ailment(s) that is easily curable and offers no handicap to job applied for.',
            'C': 'Employment at the risk and under the discretion of management.',
            'pending': 'Pending further laboratory results or clearance.',
        };
        setData('final_remarks', remarksMap[value] || '');
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/doctor/final-evaluation/${appointment.id}`);
    };

    const physical = appointment.physical_exam || appointment.physicalExam;
    const lab = appointment.lab_result || appointment.labResult;
    const xray = appointment.xray_report || appointment.xrayReport;
    const profile = appointment.patient_profile || appointment.patientProfile;
    const birthdate = profile?.birthdate || profile?.date_of_birth;
    const history = appointment.medical_history || appointment.medicalHistory;
    const age = birthdate
        ? new Date().getFullYear() - new Date(birthdate).getFullYear()
        : null;
    const formattedDate = appointment.appointment_date
        ? new Date(appointment.appointment_date).toLocaleDateString('en-PH', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
          })
        : 'N/A';

    // BMI calculation
    const weightKg = parseFloat(physical?.weight);
    const heightCm = parseFloat(physical?.height);
    let bmi: string | null = null;
    let bmiLabel = '';
    if (weightKg && heightCm) {
        const bmiVal = weightKg / Math.pow(heightCm / 100, 2);
        bmi = bmiVal.toFixed(1);
        if (bmiVal < 18.5) bmiLabel = 'UNDERWEIGHT';
        else if (bmiVal < 25) bmiLabel = 'NORMAL';
        else if (bmiVal < 30) bmiLabel = 'OVERWEIGHT';
        else bmiLabel = 'OBESE';
    }

    const examItems = [
        { label: 'Head/Scalp', value: physical?.head_scalp },
        { label: 'Eyes', value: physical?.eyes },
        { label: 'Ears', value: physical?.ears },
        { label: 'Nose/Sinuses', value: physical?.nose_sinuses },
        { label: 'Mouth/Throat', value: physical?.mouth_throat },
        { label: 'Neck/Thyroid', value: physical?.neck_thyroid },
        { label: 'Chest/Breasts', value: physical?.chest_breast },
        { label: 'Lungs', value: physical?.lungs },
        { label: 'Heart', value: physical?.heart },
        { label: 'Abdomen', value: physical?.abdomen },
        { label: 'Back', value: physical?.back },
        { label: 'Anus', value: physical?.anus },
        { label: 'Genitals', value: physical?.genitals },
        { label: 'Extremities', value: physical?.extremities },
        { label: 'Skin', value: physical?.skin },
        { label: 'Dental', value: physical?.dental },
    ];

    const isNormal = (v?: string) =>
        !v || v.toLowerCase() === 'normal' || v === '/';

    const labItems = [
        {
            label: 'A. Complete Blood Count',
            normal: lab?.cbc_status,
            normalLabel: 'Normal',
            findingLabel: 'Findings',
            result: lab?.cbc_result,
        },
        {
            label: 'B. Urinalysis',
            normal: lab?.urinalysis_status,
            normalLabel: 'Normal',
            findingLabel: 'Findings',
            result: lab?.urinalysis_result,
        },
        {
            label: 'C. Fecalysis',
            normal: lab?.fecalysis_status,
            normalLabel: 'Normal',
            findingLabel: 'Findings',
            result: lab?.fecalysis_result,
        },
        {
            label: 'D. Hepatitis B (HBsAg)',
            normal: lab?.hepa_b_status,
            normalLabel: 'Non-reactive',
            findingLabel: 'Reactive',
            result: lab?.hepa_b_result,
        },
        {
            label: 'E. Hepatitis A (Anti-HAV IgM)',
            normal: lab?.hepa_a_status,
            normalLabel: 'Non-reactive',
            findingLabel: 'Reactive',
            result: lab?.hepa_a_result,
        },
        {
            label: 'F. Pregnancy Test',
            normal: lab?.pregnancy_test,
            normalLabel: 'Negative',
            findingLabel: 'Positive',
            result: null,
        },
    ];

    const drugItems = [
        {
            label: 'a. Methamphetamine (Shabu)',
            status: lab?.meth_status,
            result: lab?.meth_result,
        },
        {
            label: 'b. Marijuana',
            status: lab?.marijuana_status,
            result: lab?.marijuana_result,
        },
    ];

    const isNeg = (s?: string) =>
        s?.toLowerCase().includes('negative') ||
        s?.toLowerCase().includes('non-reactive') ||
        s?.toLowerCase().includes('normal');

    const classItems = [
        {
            key: 'A',
            desc: 'Physical fit for all types of work. Has no noted defects.',
        },
        {
            key: 'B',
            desc: "Physical fit for all types of work. Has minor defect(s) or ailment(s) that is easily curable and offers no handicap to job applied for.",
        },
        {
            key: 'C',
            desc: 'Employment at the risk and under the discretion of management.',
        },
        { key: 'pending', label: 'PENDING', desc: '' },
    ];

    return (
        <>
            <Head title="Medical Examination Report" />

            <div className="min-h-screen bg-gray-100 py-8 px-4">
                <form onSubmit={submit}>
                    <div
                        className="mx-auto bg-white shadow-lg"
                        style={{
                            maxWidth: '900px',
                            fontFamily: '"Times New Roman", Times, serif',
                            fontSize: '11px',
                            color: '#000',
                        }}
                    >
                        {/* ── HEADER ── */}
                        <div
                            className="text-center border-b-2 border-black px-6 py-3"
                            style={{ borderBottom: '2px solid black' }}
                        >
                            <p className="text-xs">
                                2nd Floor, Serafin Business Center, National
                                Highway Banlic, Cabuyao, Laguna
                            </p>
                            <p className="text-xs">
                                Mobile No. 0920-631-1130
                            </p>
                            <h1
                                className="font-bold mt-1"
                                style={{ fontSize: '15px' }}
                            >
                                MEDICAL EXAMINATION REPORT
                            </h1>
                        </div>

                        <div className="px-6 py-3 space-y-0">
                            {/* ── PATIENT INFO ── */}
                            <div
                                className="grid grid-cols-2 gap-x-6 mb-1"
                                style={{
                                    borderBottom: '1px solid #999',
                                    paddingBottom: '4px',
                                }}
                            >
                                <InfoRow
                                    label="Name"
                                    value={`${appointment.user.last_name}, ${appointment.user.first_name}`}
                                />
                                <InfoRow
                                    label="Company/Agency"
                                    value={profile?.company || ''}
                                />
                                <InfoRow
                                    label="Age/Sex"
                                    value={`${age ?? '—'} / ${profile?.sex?.toUpperCase() ?? '—'}`}
                                />
                                <InfoRow
                                    label="Date"
                                    value={formattedDate}
                                />
                                <InfoRow
                                    label="Address"
                                    value={profile?.address || ''}
                                />
                                <InfoRow
                                    label="Civil Status"
                                    value={profile?.civil_status?.toUpperCase() || ''}
                                />
                                <InfoRow
                                    label="Date of Examination"
                                    value={formattedDate}
                                    span
                                />
                            </div>

                            {/* ── TWO-COLUMN BODY ── */}
                            <div className="grid grid-cols-2 gap-x-8 pt-2">
                                {/* LEFT: History + Physical */}
                                <div>
                                    <SectionTitle>I. MEDICAL HISTORY</SectionTitle>

<HistoryRow label="A. Present Illness" value={history?.present_illness} />
<HistoryRow label="B. Past Medical History" value={history?.past_medical_history} />
<HistoryRow label="C. Operation(s) / Accident(s)" value={history?.operations_accidents} />
<HistoryRow label="D. Family History" value={history?.family_history} />
<HistoryRow label="E. Allergies" value={history?.allergies} />
<HistoryRow label="F. Personal / Social History" value={history?.personal_social_history} />
<HistoryRow label="G. OB / Menstrual History" value={history?.ob_menstrual_history} />

                                    <SectionTitle className="mt-3">
                                        II. PHYSICAL EXAMINATION
                                    </SectionTitle>
                                    <VitalRow label="A. Height" value={physical?.height} unit="cm" />
                                    <VitalRow label="B. Weight" value={physical?.weight} unit="kg" />
                                    <VitalRow label="C. Blood Pressure" value={physical?.blood_pressure} />
                                    <VitalRow label="D. Temperature" value={physical?.temperature} unit="°C" />
                                    <VitalRow label="E. Pulse Rate" value={physical?.pulse_rate} unit="bpm" />
                                    <VitalRow label="F. Respiration" value={physical?.respiration} unit="cpm" />
                                    <VitalRow label="G. Hearing" value={physical?.hearing} />
                                    <VitalRow label="H. Visual Acuity" value={physical?.visual_acuity} />
                                </div>

                                {/* RIGHT: Systemic exam table */}
                                <div>
                                    <SectionTitle>&nbsp;</SectionTitle>
                                    <table
                                        className="w-full"
                                        style={{
                                            borderCollapse: 'collapse',
                                            fontSize: '11px',
                                        }}
                                    >
                                        <thead>
                                            <tr>
                                                <th
                                                    className="text-left font-bold pb-1"
                                                    style={{ width: '55%' }}
                                                ></th>
                                                <th
                                                    className="text-center font-bold pb-1"
                                                    style={{ width: '15%' }}
                                                >
                                                    Normal
                                                </th>
                                                <th
                                                    className="text-left font-bold pb-1 pl-2"
                                                    style={{ width: '30%' }}
                                                >
                                                    Findings
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {examItems.map((item) => (
                                                <tr
                                                    key={item.label}
                                                    style={{
                                                        borderTop:
                                                            '1px solid #ccc',
                                                    }}
                                                >
                                                    <td className="py-0.5">
                                                        {item.label}
                                                    </td>
                                                    <td className="text-center py-0.5">
                                                        {isNormal(item.value) ? (
                                                            <span className="font-bold">
                                                                /
                                                            </span>
                                                        ) : (
                                                            ''
                                                        )}
                                                    </td>
                                                    <td className="pl-2 py-0.5 text-xs">
                                                        {!isNormal(item.value)
                                                            ? item.value
                                                            : ''}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* ── III. LABORATORY ── */}
                            <div
                                className="mt-3 pt-2"
                                style={{ borderTop: '1px solid #999' }}
                            >
                                <SectionTitle>III. LABORATORY</SectionTitle>
                                <table
                                    className="w-full mt-1"
                                    style={{
                                        borderCollapse: 'collapse',
                                        fontSize: '11px',
                                    }}
                                >
                                    <tbody>
                                        {labItems.map((item) => {
                                            const neg = isNeg(item.normal);
                                            return (
                                                <tr
                                                    key={item.label}
                                                    style={{
                                                        borderTop:
                                                            '1px solid #ddd',
                                                    }}
                                                >
                                                    <td
                                                        className="py-0.5"
                                                        style={{ width: '38%' }}
                                                    >
                                                        {item.label}
                                                    </td>
                                                    <td
                                                        className="py-0.5"
                                                        style={{ width: '22%' }}
                                                    >
                                                        <span
                                                            className="inline-flex items-center gap-1"
                                                        >
                                                            <CheckBox
                                                                checked={neg}
                                                            />{' '}
                                                            {item.normalLabel}
                                                        </span>
                                                    </td>
                                                    <td
                                                        className="py-0.5"
                                                        style={{ width: '18%' }}
                                                    >
                                                        <span className="inline-flex items-center gap-1">
                                                            <CheckBox
                                                                checked={
                                                                    !neg &&
                                                                    !!item.normal
                                                                }
                                                            />{' '}
                                                            {item.findingLabel}
                                                        </span>
                                                    </td>
                                                    <td
                                                        className="py-0.5 text-xs italic"
                                                        style={{ width: '22%' }}
                                                    >
                                                        {item.result ||
                                                            (item.normal
                                                                ? 'SEE ATTACHED RESULT'
                                                                : '')}
                                                    </td>
                                                </tr>
                                            );
                                        })}

                                        {/* Drug Test */}
                                        <tr
                                            style={{
                                                borderTop: '1px solid #ddd',
                                            }}
                                        >
                                            <td
                                                colSpan={4}
                                                className="py-0.5 font-semibold"
                                            >
                                                G. Drug Test
                                            </td>
                                        </tr>
                                        {drugItems.map((d) => {
                                            const neg = isNeg(d.status);
                                            return (
                                                <tr
                                                    key={d.label}
                                                    style={{
                                                        borderTop:
                                                            '1px solid #eee',
                                                    }}
                                                >
                                                    <td className="py-0.5 pl-4">
                                                        {d.label}
                                                    </td>
                                                    <td className="py-0.5">
                                                        <span className="inline-flex items-center gap-1">
                                                            <CheckBox
                                                                checked={neg}
                                                            />{' '}
                                                            Negative
                                                        </span>
                                                    </td>
                                                    <td className="py-0.5">
                                                        <span className="inline-flex items-center gap-1">
                                                            <CheckBox
                                                                checked={
                                                                    !neg &&
                                                                    !!d.status
                                                                }
                                                            />{' '}
                                                            Positive
                                                        </span>
                                                    </td>
                                                    <td className="py-0.5 text-xs italic">
                                                        {d.result || (d.status ? 'SEE ATTACHED RESULT' : '')}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* ── IV. CHEST X-RAY ── */}
                            <div
                                className="mt-3 pt-2"
                                style={{ borderTop: '1px solid #999' }}
                            >
                                <SectionTitle>IV. CHEST X-RAY</SectionTitle>
                                <div className="flex items-start gap-6 mt-1 text-xs">
                                    <span className="inline-flex items-center gap-1">
                                        <CheckBox
                                            checked={
                                                !xray?.findings ||
                                                xray?.impression
                                                    ?.toLowerCase()
                                                    .includes('normal')
                                            }
                                        />{' '}
                                        Normal Chest
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                        <CheckBox
                                            checked={
                                                !!xray?.findings &&
                                                !xray?.impression
                                                    ?.toLowerCase()
                                                    .includes('normal')
                                            }
                                        />{' '}
                                        Findings
                                    </span>
                                    {xray?.findings && (
                                        <span className="italic">
                                            {xray.findings}
                                        </span>
                                    )}
                                    {!xray?.findings && (
                                        <span className="italic text-gray-400">
                                            SEE ATTACHED RESULT
                                        </span>
                                    )}
                                </div>
                                {xray?.impression && (
                                    <p className="mt-1 text-xs">
                                        <span className="font-semibold">
                                            Impression:{' '}
                                        </span>
                                        {xray.impression}
                                    </p>
                                )}
                            </div>

                            {/* ── V. ECG / AUDIOMETRY ── */}
                            <div
                                className="mt-3 pt-2"
                                style={{ borderTop: '1px solid #999' }}
                            >
                                <SectionTitle>
                                    V. ELECTROCARDIOGRAM / AUDIOMETRY
                                </SectionTitle>
                                <table
                                    className="w-full mt-1"
                                    style={{
                                        borderCollapse: 'collapse',
                                        fontSize: '11px',
                                    }}
                                >
                                    <tbody>
                                        {[
                                            {
                                                label: 'Electrocardiogram (ECG)',
                                                val: appointment.ecg_status,
                                            },
                                            {
                                                label: 'Audiometry',
                                                val: appointment.audiometry_status,
                                            },
                                        ].map((r) => (
                                            <tr
                                                key={r.label}
                                                style={{
                                                    borderTop:
                                                        '1px solid #ddd',
                                                }}
                                            >
                                                <td
                                                    className="py-0.5"
                                                    style={{ width: '38%' }}
                                                >
                                                    {r.label}
                                                </td>
                                                <td
                                                    className="py-0.5"
                                                    style={{ width: '20%' }}
                                                >
                                                    <span className="inline-flex items-center gap-1">
                                                        <CheckBox
                                                            checked={isNeg(
                                                                r.val
                                                            )}
                                                        />{' '}
                                                        Normal
                                                    </span>
                                                </td>
                                                <td className="py-0.5">
                                                    <span className="inline-flex items-center gap-1">
                                                        <CheckBox
                                                            checked={
                                                                !!r.val &&
                                                                !isNeg(r.val)
                                                            }
                                                        />{' '}
                                                        Findings
                                                    </span>
                                                </td>
                                                <td className="py-0.5 text-xs italic">
                                                    {r.val
                                                        ? 'SEE ATTACHED RESULT'
                                                        : ''}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* ── VI. OTHERS (Blood Chem) ── */}
                            <div
                                className="mt-3 pt-2"
                                style={{ borderTop: '1px solid #999' }}
                            >
                                <SectionTitle>VI. OTHERS</SectionTitle>
                                <table
                                    className="w-full mt-1"
                                    style={{
                                        borderCollapse: 'collapse',
                                        fontSize: '11px',
                                    }}
                                >
                                    <tbody>
                                        <tr>
                                            <td
                                                className="py-0.5"
                                                style={{ width: '38%' }}
                                            >
                                                BLOOD CHEM
                                            </td>
                                            <td
                                                className="py-0.5"
                                                style={{ width: '20%' }}
                                            >
                                                <span className="inline-flex items-center gap-1">
                                                    <CheckBox
                                                        checked={isNeg(
                                                            lab?.blood_chem_status
                                                        )}
                                                    />{' '}
                                                    Normal
                                                </span>
                                            </td>
                                            <td className="py-0.5">
                                                <span className="inline-flex items-center gap-1">
                                                    <CheckBox
                                                        checked={
                                                            !!lab?.blood_chem_status &&
                                                            !isNeg(
                                                                lab?.blood_chem_status
                                                            )
                                                        }
                                                    />{' '}
                                                    Findings
                                                </span>
                                            </td>
                                            <td className="py-0.5 text-xs italic">
                                                {lab?.blood_chem_status
                                                    ? 'SEE ATTACHED RESULT'
                                                    : ''}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* ── CLASSIFICATION + BMI + CERTIFICATION ── */}
                            <div
                                className="mt-4 pt-3 grid grid-cols-2 gap-x-8"
                                style={{ borderTop: '2px solid #000' }}
                            >
                                {/* LEFT: Classification + Remarks */}
                                <div>
                                    <p className="font-bold mb-2 text-xs uppercase tracking-wide">
                                        Medical Classification
                                    </p>
                                    {classItems.map((c) => (
                                        <label
                                            key={c.key}
                                            className="flex items-start gap-2 mb-1 cursor-pointer"
                                        >
                                            <input
                                                type="radio"
                                                name="medical_class"
                                                value={c.key}
                                                checked={
                                                    data.medical_class === c.key
                                                }
                                                onChange={() =>
                                                    handleClassChange(c.key)
                                                }
                                                className="mt-0.5 shrink-0"
                                            />
                                            <span>
                                                <span className="font-bold uppercase">
                                                    {c.label ||
                                                        `CLASS ${c.key}`}
                                                </span>
                                                {c.desc && (
                                                    <span className="ml-1">
                                                        {c.desc}
                                                    </span>
                                                )}
                                            </span>
                                        </label>
                                    ))}

                                    <div className="mt-3">
                                        <p className="font-bold mb-1 text-xs uppercase tracking-wide">
                                            Remarks
                                        </p>
                                        <Textarea
                                            value={data.final_remarks}
                                            onChange={(e) =>
                                                setData(
                                                    'final_remarks',
                                                    e.target.value
                                                )
                                            }
                                            className="text-xs min-h-[70px] border border-black rounded-none resize-none"
                                            style={{
                                                fontFamily:
                                                    '"Times New Roman", Times, serif',
                                                fontSize: '11px',
                                            }}
                                            placeholder="e.g. FIT TO WORK..."
                                        />
                                    </div>
                                </div>

                                {/* RIGHT: BMI + Certification */}
                                <div>
                                    {/* BMI */}
                                    <div
                                        className="mb-3 p-2 border border-black"
                                        style={{ display: 'inline-block', minWidth: '100%' }}
                                    >
                                        <p className="font-bold text-xs uppercase tracking-wide mb-1">
                                            Body Mass Index (BMI)
                                        </p>
                                        <p className="text-sm font-bold">
                                            {bmi
                                                ? `${bmi} - ${bmiLabel}`
                                                : '—'}
                                        </p>
                                    </div>

                                    {/* Certification */}
                                    <div className="mt-2 text-xs leading-snug">
                                        <p className="font-bold mb-1">
                                            CERTIFICATION
                                        </p>
                                        <p className="italic">
                                            "I certify that I am the same person
                                            whose name and picture appears on
                                            this medical record, and that I have
                                            truthfully answered all the questions
                                            asked regarding my person being
                                            medically examined,"
                                        </p>
                                        <div className="mt-4 border-t border-black pt-1 text-center">
                                            <p className="font-semibold">
                                                {appointment.user.first_name}{' '}
                                                {appointment.user.last_name}
                                            </p>
                                            <p className="text-gray-500">
                                                Signature Over Printed Name
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ── PHYSICIAN SIGNATURES ── */}
                            <div
                                className="mt-4 pt-3 grid grid-cols-2 gap-x-8"
                                style={{ borderTop: '1px solid #999' }}
                            >
                                <div className="text-center">
                                    <div
                                        className="border-t border-black mt-8 pt-1"
                                        style={{ marginTop: '32px' }}
                                    >
                                        <p className="font-semibold text-xs">
                                            Examining Physician
                                        </p>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div
                                        className="border-t border-black mt-8 pt-1"
                                        style={{ marginTop: '32px' }}
                                    >
                                        <p className="font-semibold text-xs">
                                            Classified By
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* ── SUBMIT BUTTON ── */}
                            <div
                                className="mt-4 pt-3 flex justify-end"
                                style={{ borderTop: '2px solid #000' }}
                            >
                                <Button
                                    type="submit"
                                    disabled={
                                        processing || !data.medical_class
                                    }
                                    className="px-8 py-2 text-sm font-bold uppercase tracking-widest rounded-none"
                                    style={{
                                        background: '#1a1a1a',
                                        color: '#fff',
                                        letterSpacing: '0.1em',
                                    }}
                                >
                                    {processing
                                        ? 'Processing...'
                                        : 'Save & Issue Evaluation'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
}

// ── HELPERS ──

function SectionTitle({
    children,
    className = '',
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <p
            className={`font-bold uppercase text-xs tracking-wide mb-1 ${className}`}
            style={{ borderBottom: '1px solid #000', paddingBottom: '2px' }}
        >
            {children}
        </p>
    );
}

function InfoRow({
    label,
    value,
    span,
}: {
    label: string;
    value: string;
    span?: boolean;
}) {
    return (
        <div
            className={`flex gap-2 text-xs py-0.5 ${span ? 'col-span-2' : ''}`}
        >
            <span className="font-semibold shrink-0 w-36">{label}:</span>
            <span
                className="flex-1 border-b border-black"
                style={{ minWidth: '80px' }}
            >
                {value || '\u00A0'}
            </span>
        </div>
    );
}

function HistoryRow({ label, value }: { label: string; value?: string }) {
    return (
        <div className="flex gap-2 text-xs py-0.5">
            <span className="shrink-0" style={{ width: '170px' }}>
                {label}
            </span>
            <span className="border-b border-black flex-1">
                {value || '-'}
            </span>
        </div>
    );
}

function VitalRow({
    label,
    value,
    unit,
}: {
    label: string;
    value?: string | number;
    unit?: string;
}) {
    return (
        <div className="flex gap-2 text-xs py-0.5">
            <span className="shrink-0" style={{ width: '130px' }}>
                {label}
            </span>
            <span className="border-b border-black flex-1">
                {value ? `${value}${unit ? ' ' + unit : ''}` : '—'}
            </span>
        </div>
    );
}

function CheckBox({ checked }: { checked: boolean }) {
    return (
        <span
            style={{
                display: 'inline-block',
                width: '12px',
                height: '12px',
                border: '1px solid #000',
                textAlign: 'center',
                lineHeight: '11px',
                fontSize: '10px',
                fontWeight: 'bold',
                flexShrink: 0,
            }}
        >
            {checked ? '/' : '\u00A0'}
        </span>
    );
}

FinalEvaluation.layout = (page: any) => <AppLayout>{page}</AppLayout>;