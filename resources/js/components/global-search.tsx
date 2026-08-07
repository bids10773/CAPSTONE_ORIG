import { router } from '@inertiajs/react';
import axios from 'axios';
import {
    Building2,
    CalendarDays,
    FileSearch,
    LoaderCircle,
    Search,
    UserRound,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

type SearchItem = {
    id: string;
    type: 'appointment' | 'person' | 'company';
    title: string;
    subtitle: string;
    url: string;
};
type SearchGroup = { key: string; title: string; items: SearchItem[] };
const icons = {
    appointment: CalendarDays,
    person: UserRound,
    company: Building2,
};

export function GlobalSearch() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [groups, setGroups] = useState<SearchGroup[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const items = useMemo(
        () => groups.flatMap((group) => group.items),
        [groups],
    );

    useEffect(() => {
        const shortcut = (event: KeyboardEvent) => {
            if (
                (event.ctrlKey || event.metaKey) &&
                event.key.toLowerCase() === 'k'
            ) {
                event.preventDefault();
                setOpen(true);
            }
        };
        window.addEventListener('keydown', shortcut);
        return () => window.removeEventListener('keydown', shortcut);
    }, []);

    useEffect(() => {
        if (open) inputRef.current?.focus();
    }, [open]);

    useEffect(() => {
        if (!open || query.trim().length < 2) {
            setGroups([]);
            setError('');
            return;
        }
        const controller = new AbortController();
        const timeout = window.setTimeout(async () => {
            setLoading(true);
            setError('');
            try {
                const response = await axios.get<{ groups: SearchGroup[] }>(
                    '/api/global-search',
                    {
                        params: { q: query.trim() },
                        signal: controller.signal,
                    },
                );
                setGroups(response.data.groups);
                setActiveIndex(0);
            } catch (requestError) {
                if (!axios.isCancel(requestError)) {
                    setGroups([]);
                    setError(
                        'Search is temporarily unavailable. Please try again.',
                    );
                }
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }, 350);
        return () => {
            window.clearTimeout(timeout);
            controller.abort();
        };
    }, [open, query]);

    function close() {
        setOpen(false);
        setQuery('');
        setGroups([]);
        setError('');
    }

    function navigate(item: SearchItem) {
        close();
        router.visit(item.url);
    }

    function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'Escape') close();
        if (event.key === 'ArrowDown' && items.length) {
            event.preventDefault();
            setActiveIndex((index) => (index + 1) % items.length);
        }
        if (event.key === 'ArrowUp' && items.length) {
            event.preventDefault();
            setActiveIndex(
                (index) => (index - 1 + items.length) % items.length,
            );
        }
        if (event.key === 'Enter' && items[activeIndex]) {
            event.preventDefault();
            navigate(items[activeIndex]);
        }
    }

    let itemIndex = -1;
    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="mx-auto hidden h-10 w-full max-w-md items-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-500 transition hover:border-moss-300 hover:bg-white lg:flex"
                aria-label="Open global search"
            >
                <Search className="mr-2.5 size-4" />
                <span className="truncate">
                    Search patients, appointments, records…
                </span>
                <kbd className="ml-auto rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-400">
                    Ctrl K
                </kbd>
            </button>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="topbar-icon ml-auto lg:hidden"
                aria-label="Open global search"
            >
                <Search className="size-[18px]" />
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-[100] flex items-start justify-center bg-slate-950/45 px-4 pt-[10vh] backdrop-blur-sm"
                    role="presentation"
                    onMouseDown={(event) =>
                        event.target === event.currentTarget && close()
                    }
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-label="Global search"
                        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
                    >
                        <div className="flex items-center border-b border-slate-200 px-4">
                            {loading ? (
                                <LoaderCircle className="size-5 animate-spin text-moss-700" />
                            ) : (
                                <Search className="size-5 text-slate-400" />
                            )}
                            <input
                                ref={inputRef}
                                value={query}
                                onChange={(event) =>
                                    setQuery(event.target.value)
                                }
                                onKeyDown={onKeyDown}
                                type="search"
                                placeholder="Search by patient, appointment number, service, company…"
                                aria-label="Global search query"
                                aria-controls="global-search-results"
                                className="h-14 min-w-0 flex-1 border-0 px-3 text-base outline-none"
                            />
                            <button
                                type="button"
                                onClick={close}
                                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                                aria-label="Close search"
                            >
                                <X className="size-5" />
                            </button>
                        </div>
                        <div
                            id="global-search-results"
                            className="max-h-[65vh] overflow-y-auto p-2"
                            aria-live="polite"
                        >
                            {query.trim().length < 2 && (
                                <div className="p-8 text-center text-sm text-slate-500">
                                    <FileSearch className="mx-auto mb-3 size-8 text-moss-600" />
                                    Enter at least two characters. Results are
                                    limited to records your role can access.
                                </div>
                            )}
                            {error && (
                                <p className="p-6 text-center text-sm font-semibold text-red-600">
                                    {error}
                                </p>
                            )}
                            {!loading &&
                                !error &&
                                query.trim().length >= 2 &&
                                groups.length === 0 && (
                                    <p className="p-8 text-center text-sm text-slate-500">
                                        No authorized records matched your
                                        search.
                                    </p>
                                )}
                            {groups.map((group) => (
                                <div key={group.key} className="mb-3 last:mb-0">
                                    <h2 className="px-3 py-2 text-xs font-bold tracking-wider text-slate-400 uppercase">
                                        {group.title}
                                    </h2>
                                    {group.items.map((item) => {
                                        itemIndex += 1;
                                        const index = itemIndex;
                                        const Icon = icons[item.type];
                                        return (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onMouseEnter={() =>
                                                    setActiveIndex(index)
                                                }
                                                onClick={() => navigate(item)}
                                                className={`flex w-full items-center gap-3 rounded-xl p-3 text-left ${activeIndex === index ? 'bg-moss-50 ring-1 ring-moss-200' : 'hover:bg-slate-50'}`}
                                            >
                                                <span className="rounded-xl bg-white p-2 text-moss-700 shadow-sm">
                                                    <Icon className="size-5" />
                                                </span>
                                                <span className="min-w-0">
                                                    <span className="block truncate font-semibold text-slate-900">
                                                        {item.title}
                                                    </span>
                                                    <span className="block truncate text-xs text-slate-500">
                                                        {item.subtitle}
                                                    </span>
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            )}
        </>
    );
}
