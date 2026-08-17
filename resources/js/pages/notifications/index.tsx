import { Head, Link, router, usePage } from '@inertiajs/react';
import { Bell, CheckCheck } from 'lucide-react';
import { relativeNotificationTime } from '@/components/notification-bell';
import type { AppNotification } from '@/components/notification-bell';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type PageLink = { url: string | null; label: string; active: boolean };
type Props = {
    notifications: {
        data: AppNotification[];
        links: PageLink[];
        total: number;
    };
    filter: 'all' | 'unread';
};

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Notifications', href: '/notifications' }];

export default function NotificationsIndex() {
    const { notifications, filter } = usePage().props as unknown as Props;
    const unread = notifications.data.filter((item) => !item.read_at).length;

    return (
        <>
            <Head title="Notifications" />
            <div className="mx-auto max-w-4xl space-y-5 p-4 sm:p-6 lg:p-8">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div><p className="text-xs font-semibold tracking-wider text-moss-700 uppercase">Notification center</p><h1 className="mt-1 text-3xl font-semibold text-slate-950">Notifications</h1><p className="mt-2 text-sm text-slate-500">Appointment and system updates intended for your account.</p></div>
                    {unread > 0 && <Button variant="outline" onClick={() => router.patch('/notifications/read-all')}><CheckCheck className="size-4" /> Mark all as read</Button>}
                </header>

                <nav className="flex gap-2" aria-label="Notification filters">
                    <Link href="/notifications?filter=all" className={`rounded-full px-4 py-2 text-sm font-semibold ${filter === 'all' ? 'bg-moss-700 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>All</Link>
                    <Link href="/notifications?filter=unread" className={`rounded-full px-4 py-2 text-sm font-semibold ${filter === 'unread' ? 'bg-moss-700 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>Unread</Link>
                </nav>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {notifications.data.length === 0 ? (
                        <div className="px-6 py-20 text-center"><Bell className="mx-auto size-10 text-slate-300" /><h2 className="mt-4 font-semibold text-slate-800">No notifications yet</h2><p className="mt-1 text-sm text-slate-500">Important appointment and account updates will appear here.</p></div>
                    ) : notifications.data.map((notification) => (
                        <article key={notification.id} className={`flex gap-4 border-b border-slate-100 p-4 sm:p-5 ${notification.read_at ? 'bg-white' : 'bg-moss-50/60'}`}>
                            <span className={`mt-2 size-2 shrink-0 rounded-full ${notification.read_at ? 'border border-slate-300 bg-white' : 'bg-moss-600'}`} aria-label={notification.read_at ? 'Read' : 'Unread'} />
                            <button type="button" className="min-w-0 flex-1 text-left" onClick={() => router.post(`/notifications/${notification.id}/visit`)}>
                                <h2 className="font-semibold text-slate-900">{notification.title}</h2><p className="mt-1 text-sm leading-6 text-slate-600">{notification.message}</p><time className="mt-2 block text-xs text-slate-400">{relativeNotificationTime(notification.created_at)}</time>
                            </button>
                            {!notification.read_at && <button type="button" className="self-start text-xs font-semibold text-moss-700" onClick={() => router.patch(`/notifications/${notification.id}/read`)}>Mark as read</button>}
                        </article>
                    ))}
                    {notifications.links.length > 3 && <div className="flex flex-wrap justify-center gap-1 p-4">{notifications.links.map((link, index) => <button key={`${link.label}-${index}`} type="button" disabled={!link.url || link.active} onClick={() => link.url && router.get(link.url)} className={`rounded-lg px-3 py-2 text-sm ${link.active ? 'bg-moss-700 text-white' : 'text-slate-600 hover:bg-slate-100 disabled:opacity-40'}`} dangerouslySetInnerHTML={{ __html: link.label }} />)}</div>}
                </section>
            </div>
        </>
    );
}

NotificationsIndex.layout = (page: React.ReactNode) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
