import { CalendarDays, Clock3 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const timeZone = 'Asia/Manila';

export function LiveDateTime({ className }: { className?: string }) {
    const [now, setNow] = useState<Date>(() => new Date());

    useEffect(() => {
        const interval = window.setInterval(() => setNow(new Date()), 1_000);

        return () => window.clearInterval(interval);
    }, []);

    const date = new Intl.DateTimeFormat('en-PH', {
        timeZone,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    }).format(now);
    const time = new Intl.DateTimeFormat('en-PH', {
        timeZone,
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
    }).format(now);

    return (
        <div
            className={cn(
                'items-center gap-2 border-l border-border px-3 text-moss-700 dark:text-moss-200',
                className,
            )}
            aria-label={`Philippine date and time: ${date}, ${time}`}
        >
            <Clock3 className="size-4 shrink-0" aria-hidden="true" />
            <div className="leading-tight whitespace-nowrap">
                <time
                    dateTime={now.toISOString()}
                    className="block text-xs font-bold tabular-nums"
                >
                    {time}
                </time>
                <span className="hidden text-[10px] font-medium text-slate-500 2xl:flex 2xl:items-center 2xl:gap-1 dark:text-slate-400">
                    <CalendarDays className="size-3" aria-hidden="true" />
                    {date}
                </span>
            </div>
        </div>
    );
}
