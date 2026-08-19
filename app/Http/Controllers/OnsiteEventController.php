<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\OnsiteEventStaff;
use App\Models\OnsiteServiceQueue;
use App\Models\User;
use App\Services\OnsiteEventWorkflowService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class OnsiteEventController extends Controller
{
    public function show(Request $request, Appointment $event): Response
    {
        $this->authorizeEvent($request, $event);
        $event->load(['company:id,company_name,address', 'onsiteStaff.user:id,first_name,middle_name,last_name,role']);
        $employees = $event->bulkEmployees()->with('user:id,first_name,middle_name,last_name')->with('serviceQueues.assignedStaff:id,first_name,last_name')->orderBy('id')->get();

        $requiredRoles = collect(['receptionist'])->when(in_array('PE', $event->service_types ?? [], true), fn ($r) => $r->push('doctor'))->when(app(\App\Services\LaboratoryFormDefinition::class)->sectionsFor($event) !== [], fn ($r) => $r->push('medtech'))->when($event->requiresXray(), fn ($r) => $r->push('radtech'))->unique()->values();
        $assignedRoles = $event->onsiteStaff->where('is_active', true)->pluck('service_role')->unique();

        return Inertia::render('onsite/event', ['event' => $event, 'attendance' => [
            'total' => $employees->count(), 'not_arrived' => $employees->where('attendance_status', 'not_arrived')->count(),
            'arrived' => $employees->where('attendance_status', 'arrived')->count(), 'absent' => $employees->where('attendance_status', 'absent')->count(),
            'completed' => $employees->where('status', 'completed')->count(),
        ], 'employees' => $employees, 'staffing' => ['required_roles' => $requiredRoles, 'missing_roles' => $requiredRoles->diff($assignedRoles)->values(), 'ready' => $requiredRoles->diff($assignedRoles)->isEmpty()], 'staffOptions' => $request->user()->role === 'admin'
            ? User::whereIn('role', ['doctor', 'medtech', 'radtech', 'receptionist'])->where('is_active', true)->orderBy('first_name')->get(['id', 'first_name', 'last_name', 'role']) : []]);
    }

    public function attendance(Request $request, Appointment $employee, OnsiteEventWorkflowService $workflow)
    {
        abort_unless(in_array($request->user()->role, ['receptionist', 'admin'], true), 403);
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
        $workflow->removeStaff($event, $deployment);

        return back()->with('success', 'Staff member removed and waiting employees redistributed.');
    }

    public function myQueue(Request $request, Appointment $event): JsonResponse
    {
        $role = $request->user()->role;
        abort_unless(in_array($role, ['doctor', 'medtech', 'radtech'], true), 403);
        abort_unless(OnsiteEventStaff::where('bulk_appointment_id', $event->id)->where('user_id', $request->user()->id)->where('service_role', $role)->where('is_active', true)->exists(), 403);
        $queues = OnsiteServiceQueue::with('appointment.user:id,first_name,middle_name,last_name')->where('bulk_appointment_id', $event->id)->where('service_role', $role)->where('assigned_staff_id', $request->user()->id)->whereIn('status', ['assigned', 'in_progress'])->orderByRaw("CASE WHEN status = 'in_progress' THEN 0 ELSE 1 END")->orderBy('assigned_at')->get();

        return response()->json(['event' => $event->only(['id', 'appointment_date', 'event_address']), 'queue' => $queues]);
    }

    private function authorizeEvent(Request $request, Appointment $event): void
    {
        abort_unless($event->isBulkParent(), 404);
        $user = $request->user();
        $allowed = $user->role === 'admin' || ($user->role === 'company' && $user->company_id === $event->company_id)
            || OnsiteEventStaff::where('bulk_appointment_id', $event->id)->where('user_id', $user->id)->where('is_active', true)->exists();
        abort_unless($allowed, 403);
    }
}
