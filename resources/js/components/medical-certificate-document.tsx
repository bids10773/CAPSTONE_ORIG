import { Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const A4_WIDTH_PX = (210 / 25.4) * 96;
const A4_HEIGHT_PX = (297 / 25.4) * 96;

export type MedicalCertificateDocumentData = {
    certificateNumber?: string | null;
    patientReference?: string | null;
    consultationDate?: string | null;
    salutation?: string | null;
    patientName?: string | null;
    patientAge?: number | string | null;
    patientSex?: string | null;
    patientCivilStatus?: string | null;
    reasonForConsultation?: string | null;
    clinicalImpression?: string | null;
    recommendation?: string | null;
    restStartDate?: string | null;
    restEndDate?: string | null;
    dateIssued?: string | null;
    physicianName?: string | null;
    physicianLicenseNumber?: string | null;
    status?: string | null;
};

function localDate(value?: string | null): Date | null {
    if (!value) return null;
    const dateOnly = value.slice(0, 10);
    const parsed = new Date(`${dateOnly}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(value?: string | null): string {
    const date = localDate(value);
    if (!date) return '';

    return new Intl.DateTimeFormat('en-PH', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    }).format(date);
}

function issueDateParts(value?: string | null): {
    day: string;
    month: string;
} {
    const date = localDate(value);
    if (!date) return { day: '', month: '' };

    return {
        day: String(date.getDate()),
        month: new Intl.DateTimeFormat('en-PH', {
            month: 'long',
            year: 'numeric',
        }).format(date),
    };
}

function valueOrSpace(value?: string | number | null): string {
    if (value === null || value === undefined || value === '') return '\u00a0';
    return String(value);
}

export function MedicalCertificateDocument({
    data,
    scale = 1,
    className,
}: {
    data: MedicalCertificateDocumentData;
    scale?: number;
    className?: string;
}) {
    const issueDate = issueDateParts(data.dateIssued);
    const watermark =
        data.status === 'issued'
            ? null
            : {
                  draft: 'DRAFT',
                  pending_approval: 'PENDING APPROVAL',
                  changes_requested: 'CHANGES REQUESTED',
                  approved: 'APPROVED — NOT ISSUED',
                  void: 'VOID',
              }[data.status || 'draft'] ||
              String(data.status || 'draft')
                  .replaceAll('_', ' ')
                  .toUpperCase();

    return (
        <article
            className={cn(
                'medical-certificate-document medical-certificate-print-area',
                className,
            )}
            style={{ transform: `scale(${scale})` }}
            aria-label="Medical certificate preview"
        >
            {watermark && (
                <div
                    className={`medical-certificate-watermark medical-certificate-watermark-${data.status}`}
                    aria-hidden="true"
                >
                    {watermark}
                </div>
            )}

            <header className="medical-certificate-letterhead">
                <img
                    src="/images/full_logo2-optimized.png"
                    alt="Living Myth Medical Clinic logo"
                    className="medical-certificate-logo"
                />
                <div className="medical-certificate-clinic-copy">
                    <h1>Living Myth Medical Clinic</h1>
                    <p>
                        2nd Floor, Serafin Business Center, National Highway
                        Banlic, Cabuyao, Laguna
                    </p>
                    <p>Mobile No. 0920-631-11-30</p>
                </div>
            </header>
            <div className="medical-certificate-header-rule" />

            <div className="medical-certificate-title-row">
                <span aria-hidden="true" />
                <h2>MEDICAL CERTIFICATE</h2>
                <p>
                    Date:
                    <span className="medical-certificate-inline-value medical-certificate-date-value">
                        {valueOrSpace(formatDate(data.dateIssued))}
                    </span>
                </p>
            </div>
            <div className="medical-certificate-reference-row">
                <span>
                    <strong>Certificate No.:</strong>{' '}
                    {valueOrSpace(data.certificateNumber || 'Pending')}
                </span>
                <span>
                    <strong>Patient Ref.:</strong>{' '}
                    {valueOrSpace(data.patientReference || 'N/A')}
                </span>
                <span>
                    <strong>Consultation:</strong>{' '}
                    {valueOrSpace(formatDate(data.consultationDate) || 'N/A')}
                </span>
            </div>

            <div className="medical-certificate-copy">
                <p className="medical-certificate-greeting">
                    To whom it may concern:
                </p>

                <div className="medical-certificate-patient-statement">
                    <p>
                        This is to certify that{' '}
                        <span className="medical-certificate-inline-value medical-certificate-salutation-value">
                            {valueOrSpace(data.salutation || 'Mr./Ms.')}
                        </span>{' '}
                        <span className="medical-certificate-inline-value medical-certificate-name-value">
                            {valueOrSpace(data.patientName)}
                        </span>
                        ,
                    </p>
                    <p>
                        Age:{' '}
                        <span className="medical-certificate-inline-value medical-certificate-short-value">
                            {valueOrSpace(data.patientAge)}
                        </span>
                        , Sex:{' '}
                        <span className="medical-certificate-inline-value medical-certificate-sex-value">
                            {valueOrSpace(data.patientSex)}
                        </span>
                        , Status:{' '}
                        <span className="medical-certificate-inline-value medical-certificate-status-value">
                            {valueOrSpace(data.patientCivilStatus)}
                        </span>
                        , sought consultation at our clinic due to:
                    </p>
                </div>

                <div className="medical-certificate-ruled-text medical-certificate-reason-lines">
                    {data.reasonForConsultation || '\u00a0'}
                </div>

                <section className="medical-certificate-findings-section">
                    <h3>IMPRESSION:</h3>
                    <div className="medical-certificate-ruled-text medical-certificate-impression-lines">
                        {data.clinicalImpression || '\u00a0'}
                    </div>
                </section>

                <section className="medical-certificate-findings-section">
                    <h3>RECOMMENDATION:</h3>
                    <div className="medical-certificate-ruled-text medical-certificate-recommendation-lines">
                        {data.recommendation || '\u00a0'}
                    </div>
                </section>

                <p className="medical-certificate-rest-line">
                    Advised to rest from{' '}
                    <span className="medical-certificate-inline-value medical-certificate-rest-value">
                        {valueOrSpace(formatDate(data.restStartDate))}
                    </span>{' '}
                    to{' '}
                    <span className="medical-certificate-inline-value medical-certificate-rest-value">
                        {valueOrSpace(formatDate(data.restEndDate))}
                    </span>
                    .
                </p>

                <p className="medical-certificate-issued-line">
                    This medical certificate was issued on the{' '}
                    <span className="medical-certificate-inline-value medical-certificate-issued-day-value">
                        {valueOrSpace(issueDate.day)}
                    </span>{' '}
                    day of{' '}
                    <span className="medical-certificate-inline-value medical-certificate-issued-month-value">
                        {valueOrSpace(issueDate.month)}
                    </span>{' '}
                    for whatever purpose this may serve the patient.
                </p>
            </div>

            <div className="medical-certificate-signature-block">
                <div className="medical-certificate-signature-line">
                    <strong>MD</strong>
                </div>
                <p className="medical-certificate-signature-name">
                    {valueOrSpace(data.physicianName).toUpperCase()}
                </p>
                <p className="medical-certificate-signature-role">
                    ATTENDING PHYSICIAN
                </p>
                <p>
                    LICENSE NO.{' '}
                    <span className="medical-certificate-license-value">
                        {valueOrSpace(data.physicianLicenseNumber)}
                    </span>
                </p>
            </div>

            <footer className="medical-certificate-footer">
                <strong>
                    NOTE: This certificate is not for medico-legal purposes.
                </strong>
            </footer>
        </article>
    );
}

export function MedicalCertificatePreview({
    data,
    initialScale = 0.75,
    className,
}: {
    data: MedicalCertificateDocumentData;
    initialScale?: number;
    className?: string;
}) {
    const [scale, setScale] = useState(initialScale);
    const minimumScale = 0.45;
    const maximumScale = 1;

    function changeScale(next: number) {
        setScale(
            Math.min(
                maximumScale,
                Math.max(minimumScale, Number(next.toFixed(2))),
            ),
        );
    }

    return (
        <section className={cn('medical-certificate-preview-shell', className)}>
            <div className="medical-certificate-preview-toolbar certificate-no-print">
                <div>
                    <p>Live certificate preview</p>
                    <span>A4 portrait · scroll to inspect</span>
                </div>
                <div
                    className="medical-certificate-zoom-controls"
                    role="group"
                    aria-label="Certificate preview zoom"
                >
                    <button
                        type="button"
                        onClick={() => changeScale(scale - 0.1)}
                        disabled={scale <= minimumScale}
                        aria-label="Zoom out"
                    >
                        <Minus aria-hidden="true" />
                    </button>
                    <output aria-live="polite">
                        {Math.round(scale * 100)}%
                    </output>
                    <button
                        type="button"
                        onClick={() => changeScale(scale + 0.1)}
                        disabled={scale >= maximumScale}
                        aria-label="Zoom in"
                    >
                        <Plus aria-hidden="true" />
                    </button>
                </div>
            </div>
            <div className="medical-certificate-scroll-region" tabIndex={0}>
                <div
                    className="medical-certificate-stage"
                    style={{
                        width: `${A4_WIDTH_PX * scale}px`,
                        height: `${A4_HEIGHT_PX * scale}px`,
                    }}
                >
                    <MedicalCertificateDocument data={data} scale={scale} />
                </div>
            </div>
        </section>
    );
}
