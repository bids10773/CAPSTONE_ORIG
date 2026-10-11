import { Link } from '@inertiajs/react';
import { Download, Eye, FileBadge2, Plus } from 'lucide-react';
import { MedicalCertificateStatus } from '@/components/medical-certificate-status';

export type PatientMedicalCertificateSummary = {
    id: number;
    certificate_number: string;
    date_issued: string | null;
    physician_name: string;
    status: string;
    issued_at: string | null;
    view_url: string;
    pdf_url: string | null;
};

function formatDate(value: string | null): string {
    if (!value) return 'Date unavailable';

    return new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium' }).format(
        new Date(`${value.slice(0, 10)}T00:00:00`),
    );
}

export function PatientMedicalCertificates({
    certificates,
    createUrl,
}: {
    certificates: PatientMedicalCertificateSummary[];
    createUrl?: string;
}) {
    return (
        <section>
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                    <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-100">
                        Medical Certificates
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Issued and voided certificates retained in this
                        patient&apos;s medical history.
                    </p>
                </div>
                {createUrl && (
                    <Link
                        href={createUrl}
                        className="inline-flex w-fit items-center gap-2 rounded-xl bg-moss-700 px-3.5 py-2.5 text-xs font-bold text-white hover:bg-moss-800"
                    >
                        <Plus className="size-4" /> Create certificate
                    </Link>
                )}
            </div>

            {certificates.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center dark:border-border dark:bg-muted/20">
                    <FileBadge2 className="mx-auto size-9 text-slate-300" />
                    <p className="mt-3 font-semibold text-slate-700 dark:text-slate-200">
                        No issued medical certificates
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                        Drafts stay in the Medical Certificates module until
                        physician approval and issuance.
                    </p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-border dark:bg-card">
                    <div className="overflow-x-auto">
                        <table>
                            <thead>
                                <tr>
                                    <th>Certificate ID</th>
                                    <th>Date issued</th>
                                    <th>Attending physician</th>
                                    <th>Status</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {certificates.map((certificate) => (
                                    <tr key={certificate.id}>
                                        <td className="font-mono text-xs font-bold text-moss-700 dark:text-moss-300">
                                            {certificate.certificate_number}
                                        </td>
                                        <td>
                                            {formatDate(
                                                certificate.date_issued,
                                            )}
                                        </td>
                                        <td>{certificate.physician_name}</td>
                                        <td>
                                            <MedicalCertificateStatus
                                                status={certificate.status}
                                            />
                                        </td>
                                        <td>
                                            <div className="flex justify-end gap-2">
                                                <Link
                                                    href={certificate.view_url}
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-semibold text-slate-700 hover:border-moss-300 hover:bg-moss-50 hover:text-moss-800 dark:border-border dark:text-slate-200"
                                                >
                                                    <Eye className="size-3.5" />
                                                    View
                                                </Link>
                                                {certificate.pdf_url && (
                                                    <a
                                                        href={
                                                            certificate.pdf_url
                                                        }
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-semibold text-slate-700 hover:border-moss-300 hover:bg-moss-50 hover:text-moss-800 dark:border-border dark:text-slate-200"
                                                    >
                                                        <Download className="size-3.5" />
                                                        PDF
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </section>
    );
}
