<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function index(Request $request): Response
    {
        $validated = $request->validate(['filter' => ['nullable', Rule::in(['all', 'unread'])]]);
        $filter = $validated['filter'] ?? 'all';
        $query = $filter === 'unread'
            ? $request->user()->unreadNotifications()
            : $request->user()->notifications();

        return Inertia::render('notifications/index', [
            'notifications' => $query->latest()->paginate(15)->withQueryString()
                ->through(fn (DatabaseNotification $notification) => $this->serialize($notification)),
            'filter' => $filter,
        ]);
    }

    public function read(Request $request, string $notification): RedirectResponse
    {
        $owned = $request->user()->notifications()->whereKey($notification)->firstOrFail();
        $owned->markAsRead();

        return back()->with('success', 'Notification marked as read.');
    }

    public function readAndVisit(Request $request, string $notification): RedirectResponse
    {
        $owned = $request->user()->notifications()->whereKey($notification)->firstOrFail();
        $owned->markAsRead();
        $url = $this->destination($request, $owned);

        return is_string($url) && str_starts_with($url, '/')
            ? redirect($url)
            : redirect()->route('notifications.index');
    }

    private function destination(Request $request, DatabaseNotification $notification): ?string
    {
        return match ($notification->data['type'] ?? null) {
            'appointment_request' => $request->user()->role === 'admin'
                ? route('admin.appointments.index', ['status' => 'pending', 'type' => 'individual'], false)
                : route('notifications.index', absolute: false),
            'appointment_submitted', 'appointment_confirmed', 'appointment_rejected', 'appointment_cancelled' =>
                in_array($request->user()->role, ['patient', 'company'], true)
                    ? route('appointments.index', absolute: false)
                    : route('notifications.index', absolute: false),
            'appointment_assigned' => $request->user()->role === 'doctor'
                ? route('doctor.appointments', absolute: false)
                : route('notifications.index', absolute: false),
            'medical_service_update' => $request->user()->role === 'patient'
                ? route('appointments.index', ['status' => 'completed'], false)
                : route('notifications.index', absolute: false),
            default => is_string($notification->data['url'] ?? null) ? $notification->data['url'] : null,
        };
    }

    public function readAll(Request $request): RedirectResponse
    {
        $request->user()->unreadNotifications()->update(['read_at' => now()]);

        return back()->with('success', 'All notifications marked as read.');
    }

    /** @return array<string, mixed> */
    private function serialize(DatabaseNotification $notification): array
    {
        return [
            'id' => $notification->id,
            ...$notification->data,
            'read_at' => $notification->read_at?->toIso8601String(),
            'created_at' => $notification->created_at?->toIso8601String(),
        ];
    }
}
