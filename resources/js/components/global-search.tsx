import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { Clock3, LoaderCircle, Search, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    SearchCategories,
    SearchResultGroups,
} from '@/components/global-search-results';
import type {
    SearchCategory,
    SearchGroup,
    SearchItem,
} from '@/components/global-search-results';

type RecentSearch = { query: string; category: string };
type SearchResponse = {
    categories: SearchCategory[];
    groups: SearchGroup[];
    recent?: RecentSearch[];
};

const roleSearchCopy: Record<
    string,
    { button: string; input: string; empty: string }
> = {
    admin: {
        button: 'Search patients, staff, appointments, companies...',
        input: 'Search by name, reference code, service, or company...',
        empty: 'Search all authorized clinic records.',
    },
    doctor: {
        button: 'Search assigned patients and records...',
        input: 'Search patients, visit codes, or services...',
        empty: 'Search only patients assigned to you and their records.',
    },
    medtech: {
        button: 'Search laboratory patients and records...',
        input: 'Search lab patients, visit codes, or tests...',
        empty: 'Search your laboratory queue and records you handled.',
    },
    radtech: {
        button: 'Search radiology patients and records...',
        input: 'Search X-ray patients, visit codes, or services...',
        empty: 'Search your radiology queue and records you handled.',
    },
    receptionist: {
        button: "Search today's patients and appointments...",
        input: 'Search today by patient, visit code, or service...',
        empty: "Search today's front-desk appointment records.",
    },
    company: {
        button: 'Search employees and company appointments...',
        input: 'Search your employees, referrals, or appointments...',
        empty: 'Search only employees and appointments for your company.',
    },
    patient: {
        button: 'Search my appointments and records...',
        input: 'Search your reference code, service, or status...',
        empty: 'Search only your own appointments and medical records.',
    },
};

export function GlobalSearch() {
    const { auth } = usePage().props as {
        auth?: {
            user?: { id?: number; role?: string; company_id?: number | null };
        };
    };
    return (
        <GlobalSearchPopover
            key={`${auth?.user?.id}:${auth?.user?.role}:${auth?.user?.company_id}`}
            role={auth?.user?.role ?? ''}
        />
    );
}

function GlobalSearchPopover({ role }: { role: string }) {
    const copy = roleSearchCopy[role] ?? roleSearchCopy.patient;
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('all');
    const [response, setResponse] = useState<
        (SearchResponse & { key: string }) | null
    >(null);
    const [failure, setFailure] = useState<{
        key: string;
        message: string;
    } | null>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [position, setPosition] = useState({
        left: 12,
        top: 64,
        width: 560,
        maxHeight: 480,
    });
    const containerRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const term = query.trim();
    const searching = term.length > 0;
    const requestCategory = searching ? category : 'all';
    const requestKey = JSON.stringify([term, requestCategory]);
    const groups = useMemo(
        () => (response?.key === requestKey ? response.groups : []),
        [response, requestKey],
    );
    const items = useMemo(
        () => groups.flatMap((group) => group.items),
        [groups],
    );
    const recent = response?.key === requestKey ? (response.recent ?? []) : [];
    const count = searching ? items.length : recent.length;
    const error = failure?.key === requestKey ? failure.message : '';
    const loading = open && !error && response?.key !== requestKey;

    const updatePosition = useCallback(() => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const width = Math.min(
            Math.max(rect.width, 560),
            window.innerWidth - 24,
        );
        const next = {
            left: Math.max(
                12,
                Math.min(rect.left, window.innerWidth - width - 12),
            ),
            top: rect.bottom + 8,
            width,
            maxHeight: Math.max(
                0,
                Math.min(
                    520,
                    (window.visualViewport?.height ?? window.innerHeight) -
                        rect.bottom -
                        20,
                ),
            ),
        };
        setPosition((previous) =>
            Object.keys(next).every(
                (key) =>
                    next[key as keyof typeof next] ===
                    previous[key as keyof typeof previous],
            )
                ? previous
                : next,
        );
    }, []);
    const close = useCallback(() => {
        setOpen(false);
        setResponse(null);
        setFailure(null);
        setActiveIndex(0);
    }, []);
    const openSearch = useCallback(() => {
        updatePosition();
        setOpen(true);
    }, [updatePosition]);

    useEffect(() => {
        const shortcut = (event: KeyboardEvent) => {
            if (
                (event.ctrlKey || event.metaKey) &&
                event.key.toLowerCase() === 'k'
            ) {
                event.preventDefault();
                openSearch();
                inputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', shortcut);
        return () => window.removeEventListener('keydown', shortcut);
    }, [openSearch]);

    useEffect(() => {
        if (!open) return;
        const dismissOutside = (event: Event) => {
            const target = event.target as Node;
            if (
                !containerRef.current?.contains(target) &&
                !panelRef.current?.contains(target)
            )
                close();
        };
        const escape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                inputRef.current?.focus({ preventScroll: true });
                close();
            }
        };
        document.addEventListener('pointerdown', dismissOutside, true);
        document.addEventListener('focusin', dismissOutside);
        document.addEventListener('keydown', escape);
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);
        window.visualViewport?.addEventListener('resize', updatePosition);
        window.visualViewport?.addEventListener('scroll', updatePosition);
        const observer =
            typeof ResizeObserver === 'undefined'
                ? null
                : new ResizeObserver(updatePosition);
        if (containerRef.current) {
            observer?.observe(containerRef.current);
            if (containerRef.current.parentElement)
                observer?.observe(containerRef.current.parentElement);
        }
        return () => {
            document.removeEventListener('pointerdown', dismissOutside, true);
            document.removeEventListener('focusin', dismissOutside);
            document.removeEventListener('keydown', escape);
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
            window.visualViewport?.removeEventListener(
                'resize',
                updatePosition,
            );
            window.visualViewport?.removeEventListener(
                'scroll',
                updatePosition,
            );
            observer?.disconnect();
        };
    }, [open, close, updatePosition]);

    useEffect(() => {
        if (!open) return;
        const controller = new AbortController();
        const timeout = window.setTimeout(
            async () => {
                try {
                    const result = await axios.get<SearchResponse>(
                        '/api/global-search',
                        {
                            params: {
                                ...(searching ? { q: term } : {}),
                                category: requestCategory,
                            },
                            signal: controller.signal,
                        },
                    );
                    if (!controller.signal.aborted) {
                        setResponse({ ...result.data, key: requestKey });
                        setFailure(null);
                    }
                } catch (requestError) {
                    if (
                        !controller.signal.aborted &&
                        !axios.isCancel(requestError)
                    ) {
                        setFailure({
                            key: requestKey,
                            message:
                                'Search is temporarily unavailable. Please try again.',
                        });
                    }
                }
            },
            searching ? 300 : 0,
        );
        return () => {
            window.clearTimeout(timeout);
            controller.abort();
        };
    }, [open, term, searching, requestCategory, requestKey]);

    useEffect(() => {
        if (open && count)
            document
                .getElementById(`global-search-option-${activeIndex}`)
                ?.scrollIntoView({ block: 'nearest' });
    }, [activeIndex, count, open]);

    function replay(entry: RecentSearch) {
        setQuery(entry.query);
        setCategory(entry.category);
        setActiveIndex(0);
        inputRef.current?.focus();
    }
    function navigate(item: SearchItem) {
        void axios
            .post('/api/global-search/recent', {
                q: term,
                category: requestCategory,
            })
            .catch(() => {});
        close();
        setQuery('');
        setCategory('all');
        router.visit(item.url);
    }
    function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'Escape') {
            event.preventDefault();
            close();
        }
        if (!open) {
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                openSearch();
            }
            return;
        }
        if (event.key === 'Tab' && !event.shiftKey) {
            const first = panelRef.current?.querySelector<HTMLButtonElement>(
                'button:not([disabled])',
            );
            if (first) {
                event.preventDefault();
                first.focus();
            }
        }
        if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && count) {
            event.preventDefault();
            const direction = event.key === 'ArrowDown' ? 1 : -1;
            setActiveIndex((index) => (index + direction + count) % count);
        }
        if (event.key === 'Enter' && count) {
            event.preventDefault();
            if (searching && items[activeIndex]) navigate(items[activeIndex]);
            else if (!searching && recent[activeIndex])
                replay(recent[activeIndex]);
        }
    }

    function onPanelKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
        if (event.key !== 'Tab') return;
        const buttons = panelRef.current?.querySelectorAll<HTMLButtonElement>(
            'button:not([disabled])',
        );
        if (!buttons?.length) return;
        if (event.shiftKey && event.target === buttons[0]) {
            event.preventDefault();
            inputRef.current?.focus();
        } else if (
            !event.shiftKey &&
            event.target === buttons[buttons.length - 1]
        ) {
            const pageControls = Array.from(
                document.querySelectorAll<HTMLElement>(
                    'a[href], button:not([disabled]), input:not([disabled]), [tabindex="0"]',
                ),
            ).filter(
                (element) =>
                    element.tabIndex >= 0 &&
                    element.getClientRects().length > 0 &&
                    !panelRef.current?.contains(element),
            );
            const inputIndex = pageControls.findIndex(
                (element) => element === inputRef.current,
            );
            const next =
                inputIndex >= 0 ? pageControls[inputIndex + 1] : undefined;
            if (next) {
                event.preventDefault();
                next.focus();
            }
            close();
        }
    }

    return (
        <div
            ref={containerRef}
            className="relative mx-auto min-w-0 flex-1 lg:max-w-md"
        >
            <div
                data-global-search-field
                className="flex h-10 items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 text-muted-foreground transition-colors focus-within:border-moss-400 focus-within:bg-card"
            >
                {loading ? (
                    <LoaderCircle
                        className="size-4 shrink-0 animate-spin"
                        aria-hidden="true"
                    />
                ) : (
                    <Search className="size-4 shrink-0" aria-hidden="true" />
                )}
                <input
                    ref={inputRef}
                    value={query}
                    onFocus={openSearch}
                    onClick={openSearch}
                    onChange={(event) => {
                        setQuery(event.target.value);
                        setActiveIndex(0);
                        openSearch();
                    }}
                    onKeyDown={onKeyDown}
                    type="search"
                    role="combobox"
                    autoComplete="off"
                    maxLength={100}
                    aria-expanded={open}
                    aria-autocomplete="list"
                    aria-activedescendant={
                        open && count
                            ? `global-search-option-${activeIndex}`
                            : undefined
                    }
                    aria-label="Global search query"
                    aria-controls={open ? 'global-search-results' : undefined}
                    placeholder={copy.button}
                    className="h-full min-h-0 w-full min-w-0 border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:appearance-none"
                />
                {query ? (
                    <button
                        type="button"
                        onClick={() => {
                            setQuery('');
                            setCategory('all');
                            setActiveIndex(0);
                            inputRef.current?.focus();
                        }}
                        aria-label="Clear search"
                        className="shrink-0 rounded p-1 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                        <X className="size-4" aria-hidden="true" />
                    </button>
                ) : (
                    <kbd className="hidden shrink-0 text-[10px] xl:block">
                        Ctrl K
                    </kbd>
                )}
            </div>
            {open &&
                typeof document !== 'undefined' &&
                createPortal(
                    <div
                        ref={panelRef}
                        onKeyDown={onPanelKeyDown}
                        style={position}
                        className="fixed z-[100] flex flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-lg"
                        data-search-popover="true"
                        aria-label="Global search dropdown"
                    >
                        {searching && response && (
                            <SearchCategories
                                categories={response.categories}
                                selected={category}
                                onSelect={(key) => {
                                    setCategory(key);
                                    setActiveIndex(0);
                                    inputRef.current?.focus();
                                }}
                            />
                        )}
                        <p className="sr-only" role="status">
                            {loading
                                ? 'Searching'
                                : error ||
                                  `${count} ${searching ? 'results' : 'recent searches'}`}
                        </p>
                        <div
                            id="global-search-results"
                            role="listbox"
                            aria-label={
                                searching ? 'Search results' : 'Recent searches'
                            }
                            aria-busy={loading}
                            className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
                        >
                            {!searching && (
                                <h2 className="px-4 pt-4 pb-2 text-xs font-medium text-muted-foreground">
                                    Recent searches
                                </h2>
                            )}
                            {loading && (
                                <p className="px-4 py-6 text-sm text-muted-foreground">
                                    {searching
                                        ? 'Searching?'
                                        : 'Loading recent searches?'}
                                </p>
                            )}
                            {error && (
                                <p className="px-4 py-6 text-sm text-red-600">
                                    {error}
                                </p>
                            )}
                            {!loading && !error && !count && (
                                <p className="px-4 py-6 text-sm text-muted-foreground">
                                    {searching
                                        ? 'No results found. Try another name, reference, or category.'
                                        : 'No recent searches.'}
                                </p>
                            )}
                            {searching ? (
                                <SearchResultGroups
                                    groups={groups}
                                    query={query}
                                    activeIndex={activeIndex}
                                    onActivate={setActiveIndex}
                                    onNavigate={navigate}
                                />
                            ) : (
                                recent.map((entry, index) => (
                                    <button
                                        key={`${entry.category}:${entry.query}`}
                                        id={`global-search-option-${index}`}
                                        type="button"
                                        role="option"
                                        aria-selected={activeIndex === index}
                                        onMouseEnter={() =>
                                            setActiveIndex(index)
                                        }
                                        onFocus={() => setActiveIndex(index)}
                                        onClick={() => replay(entry)}
                                        className={`flex min-h-12 w-full items-center gap-3 px-4 py-3 text-left text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset ${activeIndex === index ? 'bg-muted/80' : 'hover:bg-muted/50'}`}
                                    >
                                        <Clock3
                                            className="size-4 shrink-0 text-muted-foreground"
                                            aria-hidden="true"
                                        />
                                        <span className="min-w-0 flex-1 truncate">
                                            {entry.query}
                                        </span>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>,
                    document.body,
                )}
        </div>
    );
}
