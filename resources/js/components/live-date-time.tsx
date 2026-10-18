import { CalendarDays, Clock3 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const timeZone = 'Asia/Manila';

type LiveDateTimeProps = {
    className?: string;
};

export function LiveDateTime({ className }: LiveDateTimeProps) {
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
        year: 'numeric',
    }).format(now);
    const dateTime = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
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
                'items-center gap-3 border-l border-border px-3 text-moss-700 dark:text-moss-200',
                className,
            )}
            aria-label={`Philippine date and time: ${date}, ${time}`}
        >
            <time
                dateTime={dateTime}
                className="flex items-center gap-2 text-xs font-bold whitespace-nowrap"
            >
                <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
                {date}
            </time>
            <span className="flex items-center gap-2 whitespace-nowrap">
                <Clock3 className="size-4 shrink-0" aria-hidden="true" />
                <time
                    dateTime={now.toISOString()}
                    className="block text-xs font-bold tabular-nums"
                >
                    {time}
                </time>
            </span>
        </div>
    );
}
