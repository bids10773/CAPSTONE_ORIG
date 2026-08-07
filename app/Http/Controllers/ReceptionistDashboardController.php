<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Services\AppointmentSchedulingService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReceptionistDashboardController extends Controller
{
    public function __invoke(Request $request, AppointmentSchedulingService $scheduling): Response
    {
        abort_unless($request->user()->can('walkin.view'), 403);

        $today = Appointment::query()
            ->where('type', 'walk_in')
            ->whereDate('appointment_date', today());

        $counts = (clone $today)
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $current = (clone $today)
            ->whereIn('status', ['arrived', 'pending'])
            ->orderByRaw("CASE status WHEN 'arrived' THEN 1 ELSE 2 END")
            ->orderBy('id')
            ->first();

        $currentQueueNumber = null;
        if ($current !== null) {
            $position = (clone $today)->where('id', '<=', $current->id)->count();
            $currentQueueNumber = 'W-'.str_pad((string) $position, 3, '0', STR_PAD_LEFT);
        }

        $onlineQuery = Appointment::query()
            ->with('user:id,first_name,middle_name,last_name')
            ->whereIn('type', ['individual', 'company_referral'])
            ->whereDate('appointment_date', today())
            ->whereNotIn('status', ['cancelled', 'completed'])
            ->orderByRaw("CASE status WHEN 'arrived' THEN 1 WHEN 'accepted' THEN 2 WHEN 'pending' THEN 3 ELSE 4 END")
            ->orderBy('start_time')
            ->orderBy('id');
        $onlineTotal = (clone $onlineQuery)->count();
        $onlineQueue = $onlineQuery
            ->limit(10)
            ->get()
            ->values()
            ->map(fn (Appointment $appointment, int $index): array => [
                'id' => $appointment->id,
                'queue_number' => 'O-'.str_pad((string) ($index + 1), 3, '0', STR_PAD_LEFT),
                'patient_name' => $appointment->user?->name ?? 'Unknown patient',
                'start_time' => $appointment->start_time?->format('h:i A'),
                'services' => $appointment->service_types ?? [],
                'status' => $appointment->status,
                'type' => $appointment->type,
                'arrival_status' => $scheduling->arrivalStatus($appointment),
                'grace_ends_at' => $scheduling->graceEndsAt($appointment)?->toIso8601String(),
            ]);

        return Inertia::render('receptionist/dashboard', [
            'metrics' => [
                'total' => $counts->sum(),
                'waiting' => $counts->get('pending', 0),
                'processing' => $counts->get('arrived', 0),
                'completed' => $counts->get('completed', 0),
                'cancelled' => $counts->get('cancelled', 0),
                'currentQueueNumber' => $currentQueueNumber,
                'online' => $onlineTotal,
            ],
            'onlineQueue' => $onlineQueue,
        ]);
    }
}
