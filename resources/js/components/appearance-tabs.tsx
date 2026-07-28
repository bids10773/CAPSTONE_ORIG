import { CheckCircle2, Sun } from 'lucide-react';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export default function AppearanceThemeCard({
    className = '',
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                'flex max-w-lg items-start gap-4 rounded-2xl border border-moss-200 bg-moss-50 p-5',
                className,
            )}
            {...props}
        >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-moss-700 shadow-sm">
                <Sun className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900">
                        Healthcare light theme
                    </h3>
                    <CheckCircle2
                        className="size-4 text-moss-600"
                        aria-label="Active"
                    />
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                    The clinic workspace uses a consistent bright theme for
                    comfortable reading and dependable color contrast.
                </p>
            </div>
        </div>
    );
}
