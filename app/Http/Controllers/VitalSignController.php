<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreVitalSignRequest;
use App\Models\Appointment;
use App\Models\ClinicalFormAudit;
use App\Models\VitalSign;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class VitalSignController extends Controller
{
    public function create(Request $request, Appointment $appointment): Response
    {
        $this->authorizeReceptionist($request, $appointment);
        abort_unless($appointment->arrived_at || ! in_array($appointment->status, ['pending', 'accepted'], true), 422, 'Check the patient in before recording vital signs.');
        $appointment->load(['user.patientProfile', 'latestVitalSign.recordedBy',
            'vitalSigns' => fn ($query) => $query->with('recordedBy')->latest('measured_at'),
            'vitalSignRecheckRequests' => fn ($query) => $query->where('status', 'pending')->with('requestedBy')]);

        return Inertia::render('receptionist/vital-signs', [
            'appointment' => $appointment,
            'latestVitalSign' => $appointment->latestVitalSign,
            'history' => $appointment->vitalSigns,
            'pendingRecheck' => $appointment->vitalSignRecheckRequests->first(),
            'limits' => config('physical_exam.vital_limits'),
            'requiredFields' => config('physical_exam.required_vital_signs'),
        ]);
    }

    public function store(StoreVitalSignRequest $request, Appointment $appointment): RedirectResponse
    {
        $created = false;
        DB::transaction(function () use ($request, $appointment, &$created): void {
            $data = $request->validated();
            if (! empty($data['supersedes_id'])) {
                abort_unless(VitalSign::whereKey($data['supersedes_id'])->where('appointment_id', $appointment->id)->exists(), 422);
            }
            $height = isset($data['height']) ? (float) $data['height'] : null;
            $weight = isset($data['weight']) ? (float) $data['weight'] : null;
            $bmi = $height && $weight ? round($weight / (($height / 100) ** 2), 1) : null;
            $vital = VitalSign::firstOrCreate(['submission_key' => $data['submission_key']], [
                ...$data, 'patient_id' => $appointment->user_id, 'appointment_id' => $appointment->id,
                'medical_examination_id' => $appointment->medicalExamination?->id,
                'recorded_by' => $request->user()->id, 'bmi' => $bmi, 'measured_at' => now(),
            ]);
            $created = $vital->wasRecentlyCreated;
            if ($created) {
                $pending = $appointment->vitalSignRecheckRequests()->where('status', 'pending')->lockForUpdate()->get();
                foreach ($pending as $recheck) {
                    $recheck->update(['status' => 'resolved', 'resolved_by' => $request->user()->id,
                        'resolved_vital_sign_id' => $vital->id, 'resolved_at' => now()]);
                }
                ClinicalFormAudit::create(['appointment_id' => $appointment->id, 'actor_id' => $request->user()->id,
                    'form_type' => 'vital_signs', 'action' => 'recorded',
                    'changes' => ['vital_sign_id' => $vital->id, 'measurement_type' => $vital->measurement_type],
                    'ip_address' => $request->ip(), 'user_agent' => $request->userAgent()]);
            }
        });

        return redirect()->route('receptionist.queue.index')->with('success', $created
            ? 'Vital signs saved. The patient is ready for consultation.'
            : 'This measurement was already saved; no duplicate was created.');
    }

    public function requestRecheck(Request $request, Appointment $appointment): RedirectResponse
    {
        abort_unless($request->user()->role === 'doctor' && $request->user()->can('view', $appointment), 403);
        abort_unless($appointment->latestVitalSign()->exists(), 422, 'There is no recorded measurement to recheck.');
        $data = $request->validate(['reason' => ['required', 'string', 'max:1000']]);
        if ($appointment->vitalSignRecheckRequests()->where('status', 'pending')->exists()) {
            return back()->withErrors(['reason' => 'A vital signs recheck is already pending for this consultation.']);
        }
        $appointment->vitalSignRecheckRequests()->create(['requested_by' => $request->user()->id,
            'status' => 'pending', 'reason' => $data['reason'], 'requested_at' => now()]);
        ClinicalFormAudit::create(['appointment_id' => $appointment->id, 'actor_id' => $request->user()->id,
            'form_type' => 'vital_signs', 'action' => 'recheck_requested', 'changes' => ['reason' => $data['reason']],
            'ip_address' => $request->ip(), 'user_agent' => $request->userAgent()]);

        return back()->with('success', 'Vital signs recheck requested.');
    }

    private function authorizeReceptionist(Request $request, Appointment $appointment): void
    {
        abort_unless($request->user()->role === 'receptionist' && $appointment->user?->role === 'patient'
            && $appointment->bulk_appointment_id === null, 403);
    }
}
