import { Head, Link, router, usePage } from '@inertiajs/react';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { relativeNotificationTime } from '@/components/notification-bell';
import type { AppNotification } from '@/components/notification-bell';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { paginationLabel } from '@/lib/pagination-label';
import type { BreadcrumbItem } from '@/types';

type PageLink = { url: string | null; label: string; active: boolean };
type Props = {
    notifications: {
        data: AppNotification[];
        links: PageLink[];
        total: number;
    };
    filter: 'all' | 'unread';
    notificationCenter: { unreadCount: number };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Notifications', href: '/notifications' },
];

export default function NotificationsIndex() {
    const { notifications, filter, notificationCenter } = usePage()
        .props as unknown as Props;
    const unread = notificationCenter.unreadCount;

    const removeAllNotifications = () => {
        if (
            !window.confirm('Remove all notifications? This cannot be undone.')
        ) {
            return;
        }

        router.delete('/notifications', { preserveScroll: true });
    };

    return (
        <>
            <Head title="Notifications" />
            <div className="mx-auto max-w-4xl space-y-5 p-4 sm:p-6 lg:p-8">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold tracking-wider text-moss-700 uppercase">
                            Notification center
                        </p>
                        <h1 className="mt-1 text-3xl font-semibold text-slate-950">
                            Notifications
                        </h1>
                        <p className="mt-2 text-sm text-slate-500">
                            Appointment and system updates intended for your
                            account.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {notifications.total > 0 && (
                            <Button
                                variant="outline"
                                disabled={unread === 0}
                                onClick={() =>
                                    router.patch('/notifications/read-all')
                                }
                            >
                                <CheckCheck className="size-4" /> Mark all as
                                read
                            </Button>
                        )}
                        {notifications.total > 0 && (
                            <Button
                                variant="destructive"
                                onClick={removeAllNotifications}
                            >
                                <Trash2 className="size-4" /> Remove all
                            </Button>
                        )}
                    </div>
                </header>

                <nav className="flex gap-2" aria-label="Notification filters">
                    <Link
                        href="/notifications?filter=all"
                        className={`rounded-full px-4 py-2 text-sm font-semibold ${filter === 'all' ? 'bg-moss-700 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}
                    >
                        All
                    </Link>
                    <Link
                        href="/notifications?filter=unread"
                        className={`rounded-full px-4 py-2 text-sm font-semibold ${filter === 'unread' ? 'bg-moss-700 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}
                    >
                        Unread
                    </Link>
                </nav>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {notifications.data.length === 0 ? (
                        <div className="px-6 py-20 text-center">
                            <Bell className="mx-auto size-10 text-slate-300" />
                            <h2 className="mt-4 font-semibold text-slate-800">
                                No notifications yet
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Important appointment and account updates will
                                appear here.
                            </p>
                        </div>
                    ) : (
                        notifications.data.map((notification) => (
                            <article
                                key={notification.id}
                                className={`flex gap-4 border-b border-slate-100 p-4 sm:p-5 ${notification.read_at ? 'bg-white' : 'bg-moss-50/60'}`}
                            >
                                <span
                                    className={`mt-2 size-2 shrink-0 rounded-full ${notification.read_at ? 'border border-slate-300 bg-white' : 'bg-moss-600'}`}
                                    aria-label={
                                        notification.read_at ? 'Read' : 'Unread'
                                    }
                                />
                                <button
                                    type="button"
                                    className="min-w-0 flex-1 text-left"
                                    onClick={() =>
                                        router.post(
                                            `/notifications/${notification.id}/visit`,
                                        )
                                    }
                                >
                                    <h2 className="font-semibold text-slate-900">
                                        {notification.title}
                                    </h2>
                                    <p className="mt-1 text-sm leading-6 text-slate-600">
                                        {notification.message}
                                    </p>
                                    <time className="mt-2 block text-xs text-slate-400">
                                        {relativeNotificationTime(
                                            notification.created_at,
                                        )}
                                    </time>
                                </button>
                                {!notification.read_at && (
                                    <button
                                        type="button"
                                        className="self-start text-xs font-semibold text-moss-700"
                                        onClick={() =>
                                            router.patch(
                                                `/notifications/${notification.id}/read`,
                                            )
                                        }
                                    >
                                        Mark as read
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className="flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 focus-visible:ring-4 focus-visible:ring-red-500/20 focus-visible:outline-none dark:hover:bg-red-950/40 dark:hover:text-red-300"
                                    onClick={() =>
                                        router.delete(
                                            `/notifications/${notification.id}`,
                                            { preserveScroll: true },
                                        )
                                    }
                                    aria-label={`Remove ${notification.title}`}
                                    title="Remove notification"
                                >
                                    <Trash2 className="size-4" />
                                </button>
                            </article>
                        ))
                    )}
                    {notifications.links.length > 3 && (
                        <div className="flex flex-wrap justify-center gap-1 p-4">
                            {notifications.links.map((link, index) => (
                                <button
                                    key={`${link.label}-${index}`}
                                    type="button"
                                    disabled={!link.url || link.active}
                                    onClick={() =>
                                        link.url && router.get(link.url)
                                    }
                                    className={`rounded-lg px-3 py-2 text-sm ${link.active ? 'bg-moss-700 text-white' : 'text-slate-600 hover:bg-slate-100 disabled:opacity-40'}`}
                                >
                                    {paginationLabel(link.label)}
                                </button>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}

NotificationsIndex.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
