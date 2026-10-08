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
        className: 'text-amber-700 dark:text-amber-400',
        icon: Clock3,
    },
    accepted: {
        label: 'Accepted',
        className: 'text-moss-700 dark:text-moss-300',
        icon: ShieldCheck,
    },
    arrived: {
        label: 'Arrived',
        className: 'text-sky-700 dark:text-sky-400',
        icon: CircleDot,
    },
    not_arrived: {
        label: 'Not Yet Arrived',
        className: 'text-amber-700 dark:text-amber-400',
        icon: Clock3,
    },
    absent: {
        label: 'Absent',
        className: 'text-red-700 dark:text-red-400',
        icon: XCircle,
    },
    for_diagnostics: {
        label: 'For Diagnostics',
        className: 'text-violet-700 dark:text-violet-400',
        icon: FlaskConical,
    },
    pending_diagnostics: {
        label: 'For Diagnostics',
        className: 'text-violet-700 dark:text-violet-400',
        icon: FlaskConical,
    },
    for_xray: {
        label: 'For X-ray',
        className: 'text-cyan-700 dark:text-cyan-400',
        icon: ScanLine,
    },
    awaiting_xray_result: {
        label: 'X-ray Performed — Awaiting Result',
        className: 'text-amber-700 dark:text-amber-400',
        icon: Clock3,
    },
    verifying_xray: {
        label: 'Verifying X-ray Result',
        className: 'text-amber-700 dark:text-amber-400',
        icon: ScanLine,
    },
    verifying_drug_test: {
        label: 'Verifying Drug Test Result',
        className: 'text-amber-700 dark:text-amber-400',
        icon: FlaskConical,
    },
    pending_xray: {
        label: 'For X-ray',
        className: 'text-cyan-700 dark:text-cyan-400',
        icon: ScanLine,
    },
    for_final_evaluation: {
        label: 'For Final Evaluation',
        className: 'text-indigo-700 dark:text-indigo-400',
        icon: Stethoscope,
    },
    pending_final_evaluation: {
        label: 'For Final Evaluation',
        className: 'text-indigo-700 dark:text-indigo-400',
        icon: Stethoscope,
    },
    completed: {
        label: 'Completed',
        className: 'text-green-700 dark:text-green-400',
        icon: CheckCircle2,
    },
    active: {
        label: 'Active',
        className: 'text-moss-700 dark:text-moss-300',
        icon: CheckCircle2,
    },
    cancelled: {
        label: 'Cancelled',
        className: 'text-red-700 dark:text-red-400',
        icon: XCircle,
    },
    inactive: {
        label: 'Inactive',
        className: 'text-slate-600 dark:text-slate-300',
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
        className: 'text-slate-600 dark:text-slate-300',
        icon: CircleDot,
    };
    return (
        <motion.span
            key={key}
            initial={reduceMotion ? false : { opacity: 0.75, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.18 }}
            className={cn(
                'status-text-only motion-status inline-flex text-xs font-bold capitalize',
                config.className,
                className,
            )}
        >
            {config.label}
        </motion.span>
    );
}
