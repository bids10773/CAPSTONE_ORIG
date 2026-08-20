<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\OnsiteEventStaff;
use App\Models\OnsiteServiceQueue;
use App\Models\SecurityAudit;
use App\Models\User;
use App\Services\OnsiteEventWorkflowService;
use App\Services\OnsiteStaffingRecommendationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class OnsiteEventController extends Controller
{
    public function staffIndex(Request $request): Response
    {
        $role = $this->clinicalRole($request);
        $events = Appointment::query()->bulkParents()
            ->whereNotIn('status', ['pending', 'rejected', 'cancelled'])
            ->whereHas('onsiteStaff', fn ($query) => $query
                ->where('user_id', $request->user()->id)
                ->where('service_role', $role)
                ->where('is_active', true))
            ->with('company:id,company_name,address')
            ->withCount([
                'bulkEmployees',
                'bulkEmployees as arrived_count' => fn ($query) => $query->where('attendance_status', 'arrived'),
                'bulkEmployees as completed_count' => fn ($query) => $query->where('status', 'completed'),
                'onsiteQueues as my_active_queue_count' => fn ($query) => $query
                    ->where('assigned_staff_id', $request->user()->id)
                    ->whereIn('service_role', $this->tasksForRole($role))
                    ->whereIn('status', ['assigned', 'in_progress']),
            ])
            ->orderBy('appointment_date')
            ->paginate(15)->withQueryString();

        return Inertia::render('staff/onsite-events/index', ['events' => $events, 'role' => $role]);
    }

    public function staffShow(Request $request, Appointment $event): Response
    {
        $role = $this->clinicalRole($request);
        $this->authorizeAssignedClinicalStaff($request, $event, $role);
        $event->load('company:id,company_name,address');
        $queues = OnsiteServiceQueue::query()
            ->with(['appointment.user:id,first_name,middle_name,last_name', 'appointment.patientProfile:id,user_id,employee_number'])
            ->where('bulk_appointment_id', $event->id)
            ->where('assigned_staff_id', $request->user()->id)
            ->whereIn('service_role', $this->tasksForRole($role))
            ->where('status', '!=', 'removed')
            ->when($request->string('search')->trim()->isNotEmpty(), function ($query) use ($request) {
                $search = $request->string('search')->trim()->toString();
                $query->whereHas('appointment', fn ($appointment) => $appointment
                    ->whereHas('user', fn ($user) => $user->where('first_name', 'like', "%{$search}%")->orWhere('last_name', 'like', "%{$search}%"))
                    ->orWhereHas('patientProfile', fn ($profile) => $profile->where('employee_number', 'like', "%{$search}%")));
            })
            ->orderByRaw("CASE status WHEN 'in_progress' THEN 0 WHEN 'assigned' THEN 1 WHEN 'waiting' THEN 2 ELSE 3 END")
            ->orderBy('assigned_at')
            ->paginate(25)->withQueryString();

        return Inertia::render('staff/onsite-events/show', [
            'event' => $event,
            'queues' => $queues,
            'attendance' => $this->attendanceSummary($event),
            'role' => $role,
            'filters' => ['search' => $request->string('search')->toString()],
        ]);
    }

    public function receptionistIndex(Request $request): Response
    {
        $events = Appointment::query()->bulkParents()
            ->whereNotIn('status', ['pending', 'rejected', 'cancelled'])
            ->whereHas('onsiteStaff', fn ($query) => $query
                ->where('user_id', $request->user()->id)
                ->where('service_role', 'receptionist')->where('is_active', true))
            ->with('company:id,company_name,address')
            ->withCount(['bulkEmployees',
                'bulkEmployees as arrived_count' => fn ($query) => $query->where('attendance_status', 'arrived'),
                'bulkEmployees as absent_count' => fn ($query) => $query->where('attendance_status', 'absent'),
            ])->orderBy('appointment_date')->paginate(15)->withQueryString();

        return Inertia::render('receptionist/onsite-events/index', ['events' => $events]);
    }

    public function receptionistShow(Request $request, Appointment $event): Response
    {
        $this->authorizeAssignedReceptionist($request, $event);
        $event->load(['company:id,company_name,address', 'onsiteStaff' => fn ($query) => $query->where('is_active', true), 'onsiteStaff.user:id,first_name,middle_name,last_name,role']);
        $employees = $this->employeeQuery($event, $request->string('search')->trim()->toString())
            ->paginate(25)->withQueryString();

        return Inertia::render('receptionist/onsite-events/attendance', [
            'event' => $event,
            'employees' => $employees,
            'attendance' => $this->attendanceSummary($event),
            'filters' => ['search' => $request->string('search')->toString()],
        ]);
    }

    public function adminShow(Request $request, Appointment $event, OnsiteStaffingRecommendationService $recommendations): Response
    {
        abort_unless($event->isBulkParent(), 404);
        abort_if($event->onsite_event_status === 'draft', 404);
        $event->load(['company:id,company_name,address', 'onsiteStaff.user:id,first_name,middle_name,last_name,role']);

        $requiredRoles = collect($recommendations->requiredRoles($event));
        $assignedRoles = $event->onsiteStaff->where('is_active', true)->pluck('service_role')->unique();

        return Inertia::render('admin/onsite-events/show', [
            'event' => $event,
            'employees' => $this->employeeQuery($event, $request->string('search')->trim()->toString())
                ->paginate(25)->withQueryString(),
            'attendance' => $this->attendanceSummary($event),
            'staffing' => [
                'required_roles' => $requiredRoles,
                'missing_roles' => $requiredRoles->diff($assignedRoles)->values(),
                'ready' => $requiredRoles->diff($assignedRoles)->isEmpty(),
                'recommendations' => $recommendations->for($event),
                'default_queue_capacity' => config('onsite.default_queue_capacity'),
            ],
            'staffOptions' => User::whereIn('role', ['doctor', 'medtech', 'radtech', 'receptionist'])
                ->where('is_active', true)->orderBy('first_name')->get(['id', 'first_name', 'last_name', 'role']),
        ]);
    }

    public function attendance(Request $request, Appointment $employee, OnsiteEventWorkflowService $workflow)
    {
        abort_unless($request->user()->role === 'receptionist', 403);
        abort_unless($employee->bulkAppointment && OnsiteEventStaff::where('bulk_appointment_id', $employee->bulk_appointment_id)
            ->where('user_id', $request->user()->id)->where('service_role', 'receptionist')->where('is_active', true)->exists(), 403);
        $data = $request->validate(['attendance_status' => ['required', Rule::in(['arrived', 'absent'])], 'absence_reason' => ['nullable', Rule::in(OnsiteEventWorkflowService::ABSENCE_REASONS)], 'absence_details' => ['nullable', 'string', 'max:500', 'required_if:absence_reason,other']]);
        $data['attendance_status'] === 'arrived'
            ? $workflow->markArrived($employee, $request->user())
            : $workflow->markAbsent($employee, $request->user(), $data['absence_reason'] ?? null, $data['absence_details'] ?? null);

        return back()->with('success', 'Employee attendance updated.');
    }

    public function assignStaff(Request $request, Appointment $event, OnsiteEventWorkflowService $workflow)
    {
        abort_unless($request->user()->role === 'admin', 403);
        $data = $request->validate(['user_id' => ['required', 'integer', 'exists:users,id'], 'service_role' => ['required', Rule::in(['doctor', 'medtech', 'radtech', 'receptionist'])], 'queue_capacity' => ['required', 'integer', 'min:1', 'max:100']]);
        $workflow->assignStaff($event, User::findOrFail($data['user_id']), $data['service_role'], $data['queue_capacity'], $request->user());

        return back()->with('success', 'Staff member assigned to the onsite event.');
    }

    public function removeStaff(Request $request, Appointment $event, \App\Models\OnsiteEventStaff $deployment, OnsiteEventWorkflowService $workflow)
    {
        abort_unless($request->user()->role === 'admin', 403);
        $workflow->removeStaff($event, $deployment, $request->user());

        return back()->with('success', 'Staff member removed and waiting employees redistributed.');
    }

    public function completeActivities(Request $request, Appointment $event)
    {
        abort_unless($request->user()->role === 'admin' && $event->isBulkParent(), 403);
        abort_if(in_array($event->status, ['pending', 'rejected', 'cancelled'], true), 422, 'The event must be approved first.');
        $event->update(['onsite_event_status' => 'activities_completed']);
        SecurityAudit::create([
            'actor_id' => $request->user()->id,
            'target_user_id' => $event->user_id,
            'action' => 'onsite_activities_completed',
            'status' => 'success',
            'metadata' => ['bulk_appointment_id' => $event->id, 'completed_at' => now()->toIso8601String()],
        ]);

        return back()->with('success', 'Onsite activities marked completed. Pending result verification and final evaluations will continue.');
    }

    public function myQueue(Request $request, Appointment $event): JsonResponse
    {
        $role = $request->user()->role;
        abort_unless(in_array($role, ['doctor', 'medtech', 'radtech'], true), 403);
        abort_unless(OnsiteEventStaff::where('bulk_appointment_id', $event->id)->where('user_id', $request->user()->id)->where('service_role', $role)->where('is_active', true)->exists(), 403);
        $tasks = $role === 'doctor' ? ['doctor', 'drug_verification', 'xray_verification', 'final_evaluation'] : [$role];
        $queues = OnsiteServiceQueue::with('appointment.user:id,first_name,middle_name,last_name')->where('bulk_appointment_id', $event->id)->whereIn('service_role', $tasks)->where('assigned_staff_id', $request->user()->id)->whereIn('status', ['assigned', 'in_progress'])->orderByRaw("CASE WHEN status = 'in_progress' THEN 0 ELSE 1 END")->orderBy('assigned_at')->get();

        return response()->json(['event' => $event->only(['id', 'appointment_date', 'event_address']), 'queue' => $queues]);
    }

    private function authorizeAssignedReceptionist(Request $request, Appointment $event): void
    {
        abort_unless($event->isBulkParent(), 404);
        abort_unless(OnsiteEventStaff::where('bulk_appointment_id', $event->id)
            ->where('user_id', $request->user()->id)->where('service_role', 'receptionist')->where('is_active', true)->exists(), 403);
    }

    private function authorizeAssignedClinicalStaff(Request $request, Appointment $event, string $role): void
    {
        abort_unless($event->isBulkParent(), 404);
        abort_unless(OnsiteEventStaff::query()->where('bulk_appointment_id', $event->id)
            ->where('user_id', $request->user()->id)->where('service_role', $role)->where('is_active', true)->exists(), 403);
    }

    private function clinicalRole(Request $request): string
    {
        $role = $request->user()->role;
        abort_unless(in_array($role, ['doctor', 'medtech', 'radtech'], true), 403);

        return $role;
    }

    private function tasksForRole(string $role): array
    {
        return $role === 'doctor' ? ['doctor', 'drug_verification', 'xray_verification', 'final_evaluation'] : [$role];
    }

    private function employeeQuery(Appointment $event, string $search)
    {
        return $event->bulkEmployees()->with([
            'user:id,first_name,middle_name,last_name,company_id',
            'user.patientProfile:id,user_id,employee_number',
            'serviceQueues.assignedStaff:id,first_name,last_name',
        ])->when($search !== '', function ($query) use ($search) {
            $terms = preg_split('/\s+/', $search, -1, PREG_SPLIT_NO_EMPTY);
            $query->where(function ($outer) use ($search, $terms) {
                $outer->whereHas('patientProfile', fn ($profile) => $profile->where('employee_number', 'like', "%{$search}%"))
                    ->orWhereHas('user', function ($user) use ($terms) {
                        foreach ($terms as $term) {
                            $user->where(fn ($name) => $name->where('first_name', 'like', "%{$term}%")
                                ->orWhere('middle_name', 'like', "%{$term}%")
                                ->orWhere('last_name', 'like', "%{$term}%"));
                        }
                    });
            });
        })->orderBy('id');
    }

    private function attendanceSummary(Appointment $event): array
    {
        $counts = $event->bulkEmployees()->selectRaw("COALESCE(attendance_status, 'not_arrived') as attendance, COUNT(*) as aggregate")
            ->groupBy('attendance')->pluck('aggregate', 'attendance');

        return [
            'total' => (int) $counts->sum(),
            'not_arrived' => (int) ($counts['not_arrived'] ?? 0),
            'arrived' => (int) ($counts['arrived'] ?? 0),
            'absent' => (int) ($counts['absent'] ?? 0),
            'completed' => $event->bulkEmployees()->where('status', 'completed')->count(),
            'verifying_drug_test' => $event->bulkEmployees()->where('status', 'verifying_drug_test')->count(),
            'verifying_xray' => $event->bulkEmployees()->where('status', 'verifying_xray')->count(),
            'verifying_both' => $event->bulkEmployees()->where('status', 'verifying_drug_and_xray')->count(),
            'for_final_evaluation' => $event->bulkEmployees()->where('status', 'for_final_evaluation')->count(),
        ];
    }
}
