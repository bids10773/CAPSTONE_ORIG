import { router } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    LoaderCircle,
} from 'lucide-react';
import { useState } from 'react';
import type { PaginatedResponse } from '@/types/pagination';

type PaginationProps<T> = {
    pagination: Pick<
        PaginatedResponse<T>,
        'data' | 'current_page' | 'last_page' | 'links' | 'per_page' | 'total'
    > &
        Partial<
            Pick<
                PaginatedResponse<T>,
                | 'first_page_url'
                | 'from'
                | 'last_page_url'
                | 'next_page_url'
                | 'prev_page_url'
                | 'to'
            >
        >;
    preserveScroll?: boolean;
    label?: string;
};

const pageSizes = [10, 25, 50, 100];

export function Pagination<T>({
    pagination,
    preserveScroll = true,
    label = 'records',
}: PaginationProps<T>) {
    const [loading, setLoading] = useState(false);
    const pageLinks = pagination.links.slice(1, -1);

    function visit(url: string | null) {
        if (!url || loading) return;
        setLoading(true);
        router.visit(url, {
            preserveState: true,
            preserveScroll,
            replace: true,
            onFinish: () => setLoading(false),
        });
    }

    function changePageSize(perPage: number) {
        const url = new URL(window.location.href);
        url.searchParams.set('per_page', String(perPage));
        url.searchParams.set('page', '1');
        visit(url.toString());
    }

    return (
        <nav
            aria-label={`${label} pagination`}
            className="flex flex-col gap-4 border-t border-slate-200 bg-white px-4 py-4 lg:flex-row lg:items-center lg:justify-between"
        >
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <span aria-live="polite">
                    Showing{' '}
                    <strong>
                        {pagination.from ??
                            (pagination.total
                                ? (pagination.current_page - 1) *
                                      pagination.per_page +
                                  1
                                : 0)}
                    </strong>{' '}
                    to{' '}
                    <strong>
                        {pagination.to ??
                            Math.min(
                                pagination.current_page * pagination.per_page,
                                pagination.total,
                            )}
                    </strong>{' '}
                    of <strong>{pagination.total}</strong> {label}
                </span>
                <label className="flex items-center gap-2">
                    <span>Rows</span>
                    <select
                        value={pagination.per_page}
                        disabled={loading}
                        onChange={(event) =>
                            changePageSize(Number(event.target.value))
                        }
                        className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
                        aria-label="Records per page"
                    >
                        {pageSizes.map((size) => (
                            <option key={size} value={size}>
                                {size}
                            </option>
                        ))}
                    </select>
                </label>
                {loading && (
                    <LoaderCircle
                        aria-label="Loading results"
                        className="size-4 animate-spin text-moss-700"
                    />
                )}
            </div>

            <div
                className="flex items-center gap-1 overflow-x-auto"
                role="group"
                aria-label="Page navigation"
            >
                <PageButton
                    label="First page"
                    disabled={!pagination.prev_page_url || loading}
                    onClick={() => visit(pagination.first_page_url ?? null)}
                >
                    <ChevronsLeft className="size-4" />
                </PageButton>
                <PageButton
                    label="Previous page"
                    disabled={!pagination.prev_page_url || loading}
                    onClick={() => visit(pagination.prev_page_url ?? null)}
                >
                    <ChevronLeft className="size-4" />
                </PageButton>
                {pageLinks.map((link, index) => (
                    <button
                        key={`${link.label}-${index}`}
                        type="button"
                        disabled={!link.url || loading}
                        aria-current={link.active ? 'page' : undefined}
                        aria-label={`Page ${link.label}`}
                        onClick={() => visit(link.url)}
                        className={`min-w-9 rounded-lg px-2 py-2 text-sm font-semibold ${
                            link.active
                                ? 'bg-moss-700 text-white'
                                : 'border border-slate-200 text-slate-700 hover:bg-moss-50 disabled:opacity-40'
                        }`}
                    >
                        {link.label === '...' ? '…' : link.label}
                    </button>
                ))}
                <PageButton
                    label="Next page"
                    disabled={!pagination.next_page_url || loading}
                    onClick={() => visit(pagination.next_page_url ?? null)}
                >
                    <ChevronRight className="size-4" />
                </PageButton>
                <PageButton
                    label="Last page"
                    disabled={!pagination.next_page_url || loading}
                    onClick={() => visit(pagination.last_page_url ?? null)}
                >
                    <ChevronsRight className="size-4" />
                </PageButton>
            </div>
        </nav>
    );
}

function PageButton({
    label,
    disabled,
    onClick,
    children,
}: {
    label: string;
    disabled: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            disabled={disabled}
            onClick={onClick}
            className="rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-moss-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
            {children}
        </button>
    );
}
