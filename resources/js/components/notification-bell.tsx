import { Link, router, usePage } from '@inertiajs/react';
import {
    Bell,
    CalendarDays,
    CheckCircle2,
    Clock3,
    ShieldAlert,
    XCircle,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface AppNotification {
    id: string;
    type: string;
    title: string;
    message: string;
    url?: string;
    read_at: string | null;
    created_at: string;
}

type NotificationCenter = { unreadCount: number; latest: AppNotification[] };

export function relativeNotificationTime(value: string): string {
    const then = new Date(value);
    const seconds = Math.max(
        0,
        Math.floor((Date.now() - then.getTime()) / 1000),
    );
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 172800) return 'Yesterday';
    return then.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

function NotificationIcon({ type }: { type: string }) {
    const className = 'size-4';
    if (type.includes('confirmed') || type.includes('assigned'))
        return <CheckCircle2 className={className} />;
    if (type.includes('rejected') || type.includes('cancelled'))
        return <XCircle className={className} />;
    if (type.includes('security')) return <ShieldAlert className={className} />;
    if (type.includes('schedule')) return <Clock3 className={className} />;
    return <CalendarDays className={className} />;
}

export function NotificationBell() {
    const { notificationCenter } = usePage().props as unknown as {
        notificationCenter: NotificationCenter;
    };
    const center = notificationCenter ?? { unreadCount: 0, latest: [] };

    const visit = (notification: AppNotification) => {
        router.post(
            `/notifications/${notification.id}/visit`,
            {},
            { preserveScroll: true },
        );
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className="topbar-icon relative"
                    aria-label={`Notifications${center.unreadCount ? `, ${center.unreadCount} unread` : ''}`}
                >
                    <Bell className="size-[18px]" />
                    {center.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                            {center.unreadCount > 99
                                ? '99+'
                                : center.unreadCount}
                        </span>
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                sideOffset={10}
                className="w-[min(24rem,calc(100vw-1rem))] overflow-hidden rounded-2xl p-0"
            >
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <div>
                        <p className="font-semibold text-slate-900">
                            Notifications
                        </p>
                        <p className="text-xs text-slate-500">
                            {center.unreadCount} unread
                        </p>
                    </div>
                    {center.unreadCount > 0 && (
                        <button
                            type="button"
                            onClick={() =>
                                router.patch(
                                    '/notifications/read-all',
                                    {},
                                    { preserveScroll: true },
                                )
                            }
                            className="text-xs font-semibold text-moss-700 hover:text-moss-900"
                        >
                            Mark all as read
                        </button>
                    )}
                </div>
                <div className="max-h-[28rem] overflow-y-auto">
                    {center.latest.length === 0 ? (
                        <div className="px-6 py-10 text-center">
                            <Bell className="mx-auto size-7 text-slate-300" />
                            <p className="mt-3 text-sm font-semibold text-slate-700">
                                No notifications yet
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                Important appointment and account updates will
                                appear here.
                            </p>
                        </div>
                    ) : (
                        center.latest.map((notification) => (
                            <button
                                key={notification.id}
                                type="button"
                                onClick={() => visit(notification)}
                                className={`flex w-full gap-3 border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50 ${notification.read_at ? 'bg-white' : 'bg-moss-50/70 font-medium'}`}
                            >
                                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-moss-700 shadow-sm">
                                    <NotificationIcon
                                        type={notification.type}
                                    />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="flex items-start gap-2">
                                        <span className="text-sm font-semibold text-slate-900">
                                            {notification.title}
                                        </span>
                                        {!notification.read_at && (
                                            <span
                                                className="mt-1 size-2 shrink-0 rounded-full bg-moss-600"
                                                aria-label="Unread"
                                            />
                                        )}
                                    </span>
                                    <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-slate-600">
                                        {notification.message}
                                    </span>
                                    <span className="mt-1 block text-[11px] text-slate-400">
                                        {relativeNotificationTime(
                                            notification.created_at,
                                        )}
                                    </span>
                                </span>
                            </button>
                        ))
                    )}
                </div>
                <Link
                    href="/notifications"
                    className="block px-4 py-3 text-center text-sm font-semibold text-moss-700 hover:bg-moss-50"
                >
                    View All Notifications
                </Link>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
