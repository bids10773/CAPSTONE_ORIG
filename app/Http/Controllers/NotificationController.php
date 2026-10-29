<?php

namespace App\Http\Controllers;

use App\Events\NotificationCenterUpdated;
use App\Models\Appointment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class NotificationController extends Controller
{
    public function center(Request $request): JsonResponse
    {
        $user = $request->user();

        // Echo can refresh the bell before a form submission's redirect loads.
        // This background response cannot display flash messages, so keep them
        // for the next page response instead of consuming them here.
        $request->session()->reflash();

        return response()->json([
            'unreadCount' => $user->visibleNotifications()->whereNull('read_at')->count(),
            'latest' => $user->visibleNotifications()->latest()->limit(7)->get()
                ->map(fn (DatabaseNotification $notification) => $this->serialize($notification))
                ->values(),
        ]);
    }

    public function index(Request $request): Response
    {
        if ($request->header('X-Inertia-Partial-Component') === 'notifications/index') {
            $request->session()->reflash();
        }
        $validated = $request->validate(['filter' => ['nullable', Rule::in(['all', 'unread'])]]);
        $filter = $validated['filter'] ?? 'all';
        $query = $filter === 'unread'
            ? $request->user()->visibleNotifications()->whereNull('read_at')
            : $request->user()->visibleNotifications();

        return Inertia::render('notifications/index', [
            'notifications' => $query->latest()->paginate(15)->withQueryString()
                ->through(fn (DatabaseNotification $notification) => $this->serialize($notification)),
            'filter' => $filter,
        ]);
    }

    public function read(Request $request, string $notification): RedirectResponse
    {
        $owned = $request->user()->visibleNotifications()->whereKey($notification)->firstOrFail();
        $owned->markAsRead();
        $this->broadcastUpdate($request);

        return back()->with('success', 'Notification marked as read.');
    }

    public function readAndVisit(Request $request, string $notification): RedirectResponse
    {
        $owned = $request->user()->visibleNotifications()->whereKey($notification)->firstOrFail();
        $owned->markAsRead();
        $this->broadcastUpdate($request);
        $url = $this->destination($request, $owned);

        return $this->safeLocalDestination($request, $url)
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
            'appointment_submitted', 'appointment_confirmed', 'appointment_rejected', 'appointment_cancelled', 'appointment_reminder' => in_array($request->user()->role, ['patient', 'company'], true)
                    && $this->canViewAppointment($request, $notification)
                    ? route('appointments.show', ['appointment' => $notification->data['appointment_id']], false)
                    : route('notifications.index', absolute: false),
            'appointment_assigned' => $request->user()->role === 'doctor'
                && $this->canViewAppointment($request, $notification)
                ? route('doctor.appointments.show', ['appointment' => $notification->data['appointment_id']], false)
                : route('notifications.index', absolute: false),
            'medical_service_update' => $request->user()->role === 'patient'
                ? route('appointments.index', ['status' => 'completed'], false)
                : route('notifications.index', absolute: false),
            default => is_string($notification->data['url'] ?? null) ? $notification->data['url'] : null,
        };
    }

    private function canViewAppointment(Request $request, DatabaseNotification $notification): bool
    {
        $id = $notification->data['appointment_id'] ?? null;
        if (! is_int($id) && (! is_string($id) || ! ctype_digit($id))) {
            return false;
        }

        $appointment = Appointment::find($id);

        return $appointment !== null && Gate::forUser($request->user())->allows('view', $appointment);
    }

    private function safeLocalDestination(Request $request, ?string $url): bool
    {
        if (! is_string($url) || ! str_starts_with($url, '/') || str_starts_with($url, '//')
            || preg_match('/[\\\\\x00-\x20]/', rawurldecode($url))) {
            return false;
        }

        // Stored legacy destinations may outlive the recipient's staff role.
        $prefix = explode('/', trim(parse_url($url, PHP_URL_PATH) ?: '', '/'))[0];

        return ! in_array($prefix, ['admin', 'doctor', 'receptionist', 'medtech', 'radtech', 'company'], true)
            || $prefix === $request->user()->role;
    }

    public function readAll(Request $request): RedirectResponse
    {
        $request->user()->visibleNotifications()->whereNull('read_at')->update(['read_at' => now()]);
        $this->broadcastUpdate($request);

        return back()->with('success', 'All notifications marked as read.');
    }

    public function destroy(Request $request, string $notification): RedirectResponse
    {
        $owned = $request->user()->visibleNotifications()->whereKey($notification)->firstOrFail();
        $owned->delete();
        $this->broadcastUpdate($request);

        return back()->with('success', 'Notification removed.');
    }

    public function destroyAll(Request $request): RedirectResponse
    {
        $request->user()->visibleNotifications()->delete();
        $this->broadcastUpdate($request);

        return back()->with('success', 'All notifications removed.');
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
        try {
            NotificationCenterUpdated::dispatch(
                $request->user()->id,
                $request->user()->visibleNotifications()->whereNull('read_at')->count(),
            );
        } catch (Throwable $exception) {
            Log::warning('Notification realtime update failed; polling will retry.', [
                'user_id' => $request->user()->id,
                'exception' => $exception::class,
            ]);
        }
    }
}
