import {
    ArrowUpRight,
    Building2,
    CalendarDays,
    FileBadge2,
    FileText,
    Layers2,
    UserRound,
    UserCog,
    X,
} from 'lucide-react';

export type SearchItem = {
    id: string;
    type:
        | 'appointment'
        | 'person'
        | 'company'
        | 'staff'
        | 'certificate'
        | 'document';
    title: string;
    subtitle: string;
    url: string;
};

export type SearchGroup = { key: string; title: string; items: SearchItem[] };
export type SearchCategory = { key: string; title: string };

const itemIcons = {
    appointment: CalendarDays,
    person: UserRound,
    company: Building2,
    staff: UserCog,
    certificate: FileBadge2,
    document: FileText,
};
const categoryIcons = {
    all: Layers2,
    appointments: CalendarDays,
    patients: UserRound,
    companies: Building2,
    staff: UserCog,
    certificates: FileBadge2,
    documents: FileText,
};

export function SearchHighlight({
    text,
    query,
}: {
    text: string;
    query: string;
}) {
    const needle = query.trim().toLowerCase();
    if (!needle) return <>{text}</>;
    const normalized = text.toLowerCase();
    const parts = [];
    let cursor = 0;
    let index = normalized.indexOf(needle);
    while (index !== -1) {
        parts.push(text.slice(cursor, index));
        parts.push(
            <mark
                key={index}
                className="rounded-sm bg-sky-100 px-0.5 text-sky-800 dark:bg-sky-900/60 dark:text-sky-100"
            >
                {text.slice(index, index + needle.length)}
            </mark>,
        );
        cursor = index + needle.length;
        index = normalized.indexOf(needle, cursor);
    }
    parts.push(text.slice(cursor));
    return <>{parts}</>;
}

export function SearchCategories({
    categories,
    selected,
    onSelect,
}: {
    categories: SearchCategory[];
    selected: string;
    onSelect: (key: string) => void;
}) {
    return (
        <div className="shrink-0 border-b border-border px-4 py-3 sm:px-5">
            <p className="mb-2 text-xs text-muted-foreground">
                What are you looking for?
            </p>
            <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label="Search categories"
            >
                {[{ key: 'all', title: 'All results' }, ...categories].map(
                    (category) => {
                        const Icon =
                            categoryIcons[
                                category.key as keyof typeof categoryIcons
                            ] ?? Layers2;
                        const active = selected === category.key;
                        return (
                            <button
                                key={category.key}
                                type="button"
                                aria-pressed={active}
                                onClick={() =>
                                    onSelect(active ? 'all' : category.key)
                                }
                                className={`inline-flex min-h-9 items-center gap-2 rounded-md border px-2.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${active ? 'border-moss-300 bg-moss-50 text-moss-900 dark:border-moss-700 dark:bg-moss-950 dark:text-moss-100' : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                            >
                                <Icon
                                    className="size-4 shrink-0"
                                    aria-hidden="true"
                                />
                                {category.title}
                                {active && category.key !== 'all' && (
                                    <X className="size-3" aria-hidden="true" />
                                )}
                            </button>
                        );
                    },
                )}
            </div>
        </div>
    );
}

export function SearchResultGroups({
    groups,
    query,
    activeIndex,
    onActivate,
    onNavigate,
}: {
    groups: SearchGroup[];
    query: string;
    activeIndex: number;
    onActivate: (index: number) => void;
    onNavigate: (item: SearchItem) => void;
}) {
    let itemIndex = -1;
    return groups.map((group) => (
        <div
            key={group.key}
            role="group"
            aria-labelledby={`search-group-${group.key}`}
            className="border-b border-border py-2 last:border-b-0"
        >
            <h2
                id={`search-group-${group.key}`}
                className="px-4 py-2 text-xs font-medium text-muted-foreground sm:px-5"
            >
                {group.title}
            </h2>
            {group.items.map((item) => {
                const index = ++itemIndex;
                const Icon = itemIcons[item.type];
                const active = activeIndex === index;
                const initials = item.title
                    .trim()
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((word) => word[0])
                    .join('');
                return (
                    <button
                        key={item.id}
                        id={`global-search-option-${index}`}
                        type="button"
                        role="option"
                        aria-selected={active}
                        onMouseEnter={() => onActivate(index)}
                        onFocus={() => onActivate(index)}
                        onClick={() => onNavigate(item)}
                        className={`group flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset sm:px-5 ${active ? 'bg-muted/80' : 'hover:bg-muted/50'}`}
                    >
                        <span
                            className={`flex size-8 shrink-0 items-center justify-center text-muted-foreground ${item.type === 'person' ? 'rounded-full bg-moss-50 text-[10px] font-semibold text-moss-700 dark:bg-moss-950 dark:text-moss-200' : ''}`}
                            aria-hidden="true"
                        >
                            {item.type === 'person' ? (
                                initials
                            ) : (
                                <Icon className="size-5" />
                            )}
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
                            <span className="truncate text-sm font-medium text-foreground sm:max-w-[55%]">
                                <SearchHighlight
                                    text={item.title}
                                    query={query}
                                />
                            </span>
                            <span className="truncate text-xs text-muted-foreground">
                                <SearchHighlight
                                    text={item.subtitle}
                                    query={query}
                                />
                            </span>
                        </span>
                        <ArrowUpRight
                            className={`size-3.5 shrink-0 text-muted-foreground ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'}`}
                            aria-hidden="true"
                        />
                    </button>
                );
            })}
        </div>
    ));
}
