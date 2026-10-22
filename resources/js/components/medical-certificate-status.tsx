import {
    BadgeCheck,
    Ban,
    CircleDashed,
    Clock3,
    FilePenLine,
    MessageSquareWarning,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MedicalCertificateStatus as CertificateStatus } from '@/types/medical-certificate';

const statusMeta: Record<
    CertificateStatus,
    {
        label: string;
        className: string;
        icon: React.ComponentType<{ className?: string }>;
    }
> = {
    draft: {
        label: 'Draft',
        className: 'text-slate-600 dark:text-slate-300',
        icon: FilePenLine,
    },
    pending_approval: {
        label: 'Pending approval',
        className: 'text-amber-700 dark:text-amber-400',
        icon: Clock3,
    },
    changes_requested: {
        label: 'Changes requested',
        className: 'text-orange-700 dark:text-orange-300',
        icon: MessageSquareWarning,
    },
    approved: {
        label: 'Approved',
        className: 'text-sky-700 dark:text-sky-300',
        icon: BadgeCheck,
    },
    issued: {
        label: 'Issued',
        className: 'text-emerald-700 dark:text-emerald-300',
        icon: BadgeCheck,
    },
    void: {
        label: 'Void',
        className: 'text-red-700 dark:text-red-300',
        icon: Ban,
    },
};

export function medicalCertificateStatusLabel(status: string): string {
    return (
        statusMeta[status as CertificateStatus]?.label ??
        status
            .replaceAll('_', ' ')
            .replace(/\b\w/g, (letter) => letter.toUpperCase())
    );
}

export function MedicalCertificateStatus({
    status,
    className,
}: {
    status: string;
    className?: string;
}) {
    const meta = statusMeta[status as CertificateStatus] ?? {
        label: medicalCertificateStatusLabel(status),
        className: 'text-slate-600 dark:text-slate-300',
        icon: CircleDashed,
    };
    const Icon = meta.icon;

    return (
        <span
            className={cn(
                'status-text-only inline-flex items-center gap-1.5 text-xs font-bold',
                meta.className,
                className,
            )}
        >
            <Icon className="size-3.5" aria-hidden="true" />
            {meta.label}
        </span>
    );
}
