import {
    ChevronDown,
    ListFilter,
    Search,
    SlidersHorizontal,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { FormEventHandler, InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type SearchFilterSection = {
    label: string;
    content: ReactNode;
    defaultOpen?: boolean;
};

type Props = {
    search: InputHTMLAttributes<HTMLInputElement>;
    sections?: SearchFilterSection[];
    hiddenFields?: ReactNode;
    actions?: ReactNode;
    onSubmit?: FormEventHandler<HTMLFormElement>;
    method?: 'GET' | 'POST';
    loading?: boolean;
    className?: string;
    filterLabel?: string;
};

export function SearchFilterToolbar({
    search,
    sections = [],
    hiddenFields,
    actions,
    onSubmit,
    method = 'GET',
    loading = false,
    className,
    filterLabel = 'Filter',
}: Props) {
    const [open, setOpen] = useState(false);
    const [openSections, setOpenSections] = useState<Set<number>>(
        () =>
            new Set(
                sections.flatMap((section, index) =>
                    section.defaultOpen ? [index] : [],
                ),
            ),
    );
    const rootRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (!open) return;

        const close = (event: PointerEvent) => {
            if (!rootRef.current?.contains(event.target as Node))
                setOpen(false);
        };
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false);
        };
        document.addEventListener('pointerdown', close);
        document.addEventListener('keydown', closeOnEscape);
        return () => {
            document.removeEventListener('pointerdown', close);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [open]);

    const toggleSection = (index: number) => {
        setOpenSections((current) => {
            const next = new Set(current);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    };

    return (
        <form
            ref={rootRef}
            method={method}
            onSubmit={(event) => {
                onSubmit?.(event);
                setOpen(false);
            }}
            className={cn(
                'relative flex flex-col gap-3 sm:flex-row sm:items-center',
                open ? 'z-[100]' : 'z-10',
                className,
            )}
        >
            {hiddenFields}
            <label className="relative min-w-0 flex-1">
                <span className="sr-only">
                    {search['aria-label'] ?? 'Search'}
                </span>
                <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-slate-400" />
                <input
                    type="search"
                    {...search}
                    className={cn(
                        'h-12 w-full rounded-xl border border-slate-200 bg-white pr-4 pl-12 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-4 focus:ring-slate-200/60 dark:border-input dark:bg-card dark:text-foreground dark:placeholder:text-muted-foreground dark:focus:border-moss-500 dark:focus:ring-moss-500/10',
                        search.className,
                    )}
                />
                {loading && (
                    <span className="absolute top-1/2 right-4 size-4 -translate-y-1/2 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600" />
                )}
            </label>

            {sections.length > 0 && (
                <div
                    className="relative w-full sm:w-auto"
                    onMouseEnter={() => setOpen(true)}
                    onMouseLeave={() => setOpen(false)}
                    onFocus={() => setOpen(true)}
                    onBlur={(event) => {
                        if (
                            !event.currentTarget.contains(
                                event.relatedTarget as Node | null,
                            )
                        ) {
                            setOpen(false);
                        }
                    }}
                >
                    <button
                        type="button"
                        aria-expanded={open}
                        aria-haspopup="dialog"
                        onClick={() => setOpen(true)}
                        className={cn(
                            'inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border px-5 text-sm font-medium shadow-sm transition-colors',
                            open
                                ? 'border-slate-600 bg-slate-600 text-white'
                                : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50 dark:border-border dark:bg-card dark:text-foreground dark:hover:bg-accent',
                        )}
                    >
                        <ListFilter className="size-5" />
                        {filterLabel}
                    </button>

                    {open && (
                        <div className="absolute top-full right-0 z-[110] w-full pt-2 sm:w-[min(28rem,calc(100vw-3rem))]">
                            <div
                                role="dialog"
                                aria-label="Search filters"
                                className="rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-border dark:bg-card"
                            >
                                <div className="space-y-2">
                                    {sections.map((section, index) => {
                                        const sectionOpen =
                                            openSections.has(index);
                                        return (
                                            <section
                                                key={section.label}
                                                className="overflow-hidden rounded-lg bg-slate-100/90 dark:bg-muted"
                                            >
                                                <button
                                                    type="button"
                                                    aria-expanded={sectionOpen}
                                                    onClick={() =>
                                                        toggleSection(index)
                                                    }
                                                    className="flex min-h-11 w-full items-center justify-between px-3.5 py-2.5 text-left text-sm font-semibold text-slate-600 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-accent"
                                                >
                                                    {section.label}
                                                    <ChevronDown
                                                        className={cn(
                                                            'size-5 text-slate-800 transition-transform dark:text-slate-300',
                                                            sectionOpen &&
                                                                'rotate-180',
                                                        )}
                                                    />
                                                </button>
                                                {sectionOpen && (
                                                    <div className="grid gap-2 border-t border-slate-200 bg-white p-3 dark:border-border dark:bg-card">
                                                        {section.content}
                                                    </div>
                                                )}
                                            </section>
                                        );
                                    })}
                                </div>
                                <div className="mt-3 flex justify-end">
                                    <button
                                        type="submit"
                                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 focus-visible:ring-4 focus-visible:ring-slate-300 focus-visible:outline-none"
                                    >
                                        <SlidersHorizontal className="size-5" />{' '}
                                        Apply
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
            {actions}
        </form>
    );
}
