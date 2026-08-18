import { motion, useReducedMotion } from 'framer-motion';
import {
    CheckCircle2,
    CircleDot,
    Clock3,
    FlaskConical,
    ScanLine,
    ShieldCheck,
    Stethoscope,
    XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const statusConfig = {
    pending: {
        label: 'Pending',
        className: 'border-amber-200 bg-amber-50 text-amber-800',
        icon: Clock3,
    },
    accepted: {
        label: 'Accepted',
        className: 'border-moss-200 bg-moss-50 text-moss-800',
        icon: ShieldCheck,
    },
    arrived: {
        label: 'Arrived',
        className: 'border-sky-200 bg-sky-50 text-sky-800',
        icon: CircleDot,
    },
    for_diagnostics: {
        label: 'For Diagnostics',
        className: 'border-violet-200 bg-violet-50 text-violet-800',
        icon: FlaskConical,
    },
    pending_diagnostics: {
        label: 'For Diagnostics',
        className: 'border-violet-200 bg-violet-50 text-violet-800',
        icon: FlaskConical,
    },
    for_xray: {
        label: 'For X-ray',
        className: 'border-cyan-200 bg-cyan-50 text-cyan-800',
        icon: ScanLine,
    },
    awaiting_xray_result: {
        label: 'X-ray Performed — Awaiting Result',
        className: 'border-amber-200 bg-amber-50 text-amber-800',
        icon: Clock3,
    },
    pending_xray: {
        label: 'For X-ray',
        className: 'border-cyan-200 bg-cyan-50 text-cyan-800',
        icon: ScanLine,
    },
    for_final_evaluation: {
        label: 'For Final Evaluation',
        className: 'border-indigo-200 bg-indigo-50 text-indigo-800',
        icon: Stethoscope,
    },
    pending_final_evaluation: {
        label: 'For Final Evaluation',
        className: 'border-indigo-200 bg-indigo-50 text-indigo-800',
        icon: Stethoscope,
    },
    completed: {
        label: 'Completed',
        className: 'border-green-200 bg-green-50 text-green-800',
        icon: CheckCircle2,
    },
    active: {
        label: 'Active',
        className: 'border-moss-200 bg-moss-50 text-moss-800',
        icon: CheckCircle2,
    },
    cancelled: {
        label: 'Cancelled',
        className: 'border-red-200 bg-red-50 text-red-800',
        icon: XCircle,
    },
    inactive: {
        label: 'Inactive',
        className: 'border-slate-200 bg-slate-50 text-slate-700',
        icon: CircleDot,
    },
} as const;

export function StatusBadge({
    status,
    className,
}: {
    status: string;
    className?: string;
}) {
    const reduceMotion = useReducedMotion();
    const key = status.toLowerCase() as keyof typeof statusConfig;
    const config = statusConfig[key] ?? {
        label: status.replaceAll('_', ' '),
        className: 'border-slate-200 bg-slate-50 text-slate-700',
        icon: CircleDot,
    };
    const Icon = config.icon;

    return (
        <motion.span
            key={key}
            initial={reduceMotion ? false : { opacity: 0.75, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.18 }}
            className={cn(
                'motion-status inline-flex min-h-7 w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold capitalize',
                config.className,
                className,
            )}
        >
            <Icon className="size-3.5" aria-hidden="true" />
            {config.label}
        </motion.span>
    );
}
