<?php

namespace App\Http\Controllers;

use App\Http\Requests\SaveXrayReportRequest;
use App\Models\Appointment;
use App\Models\ClinicalFormAudit;
use App\Models\XrayReport;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class XrayController extends Controller
{
    public function create(Appointment $appointment): Response
    {
        Gate::authorize('updateXray', $appointment);
        $appointment->load(['user', 'company', 'xrayReport', 'patientProfile']);

        return Inertia::render('radtech/xray-report-form', [
            'appointment' => $appointment, 'xrayReport' => $appointment->xrayReport,
            'locked' => $appointment->xrayReport?->finalized_at !== null && request()->user()->role !== 'admin',
            'submitUrl' => request()->user()->role === 'admin'
                ? route('admin.xrays.update', $appointment)
                : route('radtech.xrays.store', $appointment),
        ]);
    }

    public function store(SaveXrayReportRequest $request, Appointment $appointment): RedirectResponse
    {
        if ($appointment->xrayReport?->finalized_at && $request->user()->role !== 'admin') {
            throw ValidationException::withMessages(['form' => 'The X-ray report is finalized and locked.']);
        }

        DB::transaction(function () use ($request, $appointment): void {
            $report = XrayReport::updateOrCreate(['appointment_id' => $appointment->id], [
                'radiologist_id' => $request->user()->id,
                'findings' => $request->validated('chest_findings'),
                'impression' => $request->validated('impression'),
                'is_completed' => true,
            ]);
            $appointment->update(['status' => 'for_final_evaluation']);
            ClinicalFormAudit::create([
                'appointment_id' => $appointment->id, 'actor_id' => $request->user()->id,
                'form_type' => 'xray', 'action' => $report->wasRecentlyCreated ? 'created' : 'updated',
                'changes' => $report->getChanges(), 'ip_address' => $request->ip(), 'user_agent' => $request->userAgent(),
            ]);
        });

        return redirect()->route('radtech.appointments')->with('success', 'X-ray completed and sent to the doctor.');
    }
}
