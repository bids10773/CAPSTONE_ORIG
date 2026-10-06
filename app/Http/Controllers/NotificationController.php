<?php

namespace App\Http\Controllers;

use App\Events\NotificationCenterUpdated;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function center(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'unreadCount' => $user->unreadNotifications()->count(),
            'latest' => $user->notifications()->latest()->limit(7)->get()
                ->map(fn (DatabaseNotification $notification) => $this->serialize($notification))
                ->values(),
        ]);
    }

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
        $this->broadcastUpdate($request);

        return back()->with('success', 'Notification marked as read.');
    }

    public function readAndVisit(Request $request, string $notification): RedirectResponse
    {
        $owned = $request->user()->notifications()->whereKey($notification)->firstOrFail();
        $owned->markAsRead();
        $this->broadcastUpdate($request);
        $url = $this->destination($request, $owned);

        return is_string($url) && str_starts_with($url, '/')
            ? redirect($url)
            : redirect()->route('notifications.index');
    }

    private function destination(Request $request, DatabaseNotification $notification): ?string
    {
        return match ($notification->data['type'] ?? null) {
            'appointment_request' => match ($request->user()->role) {
                'admin' => route('admin.appointments.index', ['status' => 'pending', 'type' => 'individual'], false),
                'receptionist' => route('receptionist.appointment-requests.index', ['status' => 'pending'], false),
                default => route('notifications.index', absolute: false),
            },
            'appointment_submitted', 'appointment_confirmed', 'appointment_rejected', 'appointment_cancelled' => in_array($request->user()->role, ['patient', 'company'], true)
                    && filled($notification->data['appointment_id'] ?? null)
                    ? route('appointments.show', ['appointment' => $notification->data['appointment_id']], false)
                    : route('notifications.index', absolute: false),
            'appointment_assigned' => $request->user()->role === 'doctor'
                && filled($notification->data['appointment_id'] ?? null)
                ? route('doctor.appointments.show', ['appointment' => $notification->data['appointment_id']], false)
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
        $this->broadcastUpdate($request);

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

    private function broadcastUpdate(Request $request): void
    {
        NotificationCenterUpdated::dispatch(
            $request->user()->id,
            $request->user()->unreadNotifications()->count(),
        );
    }
}
