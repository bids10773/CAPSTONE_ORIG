import { BarChart3 } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type TooltipEntry = {
    color?: string;
    dataKey?: string | number;
    name?: string | number;
    value?: string | number;
};

export function ChartCard({
    title,
    description,
    eyebrow,
    action,
    children,
    footer,
    className,
}: {
    title: string;
    description?: string;
    eyebrow?: ReactNode;
    action?: ReactNode;
    children: ReactNode;
    footer?: ReactNode;
    className?: string;
}) {
    return (
        <section
            className={cn(
                'min-w-0 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm',
                className,
            )}
        >
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6">
                <div className="min-w-0">
                    {eyebrow && <div className="mb-2">{eyebrow}</div>}
                    <h2 className="text-sm font-semibold tracking-tight text-slate-950 sm:text-base">
                        {title}
                    </h2>
                    {description && (
                        <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500 sm:text-sm">
                            {description}
                        </p>
                    )}
                </div>
                {action}
            </header>
            <div className="min-w-0 p-3 sm:p-5">{children}</div>
            {footer && (
                <footer className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500 sm:px-6">
                    {footer}
                </footer>
            )}
        </section>
    );
}

export function ChartTooltip({
    active,
    label,
    payload,
    labelFormatter,
    valueFormatter = (value) => Number(value).toLocaleString(),
    unit,
}: {
    active?: boolean;
    label?: string | number;
    payload?: readonly TooltipEntry[];
    labelFormatter?: (label: string | number) => string;
    valueFormatter?: (value: string | number) => string;
    unit?: string;
}) {
    const visible = payload?.filter(
        (item) => item.value !== undefined && item.value !== null,
    );

    if (!active || !visible?.length) return null;

    return (
        <div className="min-w-40 rounded-xl border border-slate-200 bg-white/95 px-3 py-2.5 shadow-xl shadow-slate-900/10 backdrop-blur-sm">
            {label !== undefined && (
                <p className="mb-2 border-b border-slate-100 pb-2 text-xs font-semibold text-slate-900">
                    {labelFormatter ? labelFormatter(label) : String(label)}
                </p>
            )}
            <div className="space-y-1.5">
                {visible.map((item, index) => (
                    <div
                        key={`${String(item.dataKey ?? item.name)}-${index}`}
                        className="flex items-center justify-between gap-5 text-xs"
                    >
                        <span className="flex min-w-0 items-center gap-2 text-slate-600">
                            <span
                                className="size-2 shrink-0 rounded-full"
                                style={{
                                    backgroundColor: item.color ?? '#64748b',
                                }}
                            />
                            <span className="truncate">{item.name}</span>
                        </span>
                        <strong className="font-semibold whitespace-nowrap text-slate-950 tabular-nums">
                            {valueFormatter(item.value!)}
                            {unit ? ` ${unit}` : ''}
                        </strong>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function ChartEmptyState({
    message = 'No analytics data available for this period.',
    className,
}: {
    message?: string;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-6 text-center',
                className,
            )}
        >
            <span className="mb-3 rounded-xl bg-white p-2.5 text-slate-400 shadow-sm ring-1 ring-slate-200">
                <BarChart3 className="size-5" aria-hidden="true" />
            </span>
            <p className="max-w-sm text-sm font-medium text-slate-600">
                {message}
            </p>
        </div>
    );
}

export const chartGridProps = {
    stroke: '#e2e8f0',
    strokeDasharray: '3 5',
    vertical: false,
} as const;

export const chartAxisProps = {
    axisLine: false,
    tickLine: false,
    tick: { fill: '#64748b', fontSize: 11 },
} as const;

export const chartLegendProps = {
    iconType: 'circle' as const,
    iconSize: 8,
    wrapperStyle: {
        color: '#475569',
        fontSize: 12,
        paddingTop: 12,
        lineHeight: '22px',
    },
};
