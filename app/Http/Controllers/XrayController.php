<?php

namespace App\Http\Controllers;

use App\Models\XrayReport;
use App\Models\Appointment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class XrayController extends Controller
{
    public function create($appointmentId): Response
    {
        $appointment = Appointment::with(['user', 'xrayReport', 'patientProfile'])->findOrFail($appointmentId);

        return Inertia::render('radtech/xray-report-form', [
            'appointment' => $appointment,
            'xrayReport' => $appointment->xrayReport,
        ]);
    }

    public function store(Request $request, $appointmentId)
    {
        // ✅ VALIDATION
        $request->validate([
            'chest_status' => 'required',
            'chest_findings' => 'required_if:chest_status,findings',
            'impression' => 'nullable|string|max:1000',
        ]);

        // ✅ SAVE DATA
        XrayReport::updateOrCreate(
            ['appointment_id' => $appointmentId],
            [
                'appointment_id' => $appointmentId,
                'radiologist_id' => auth()->id(),
                'findings' => $request->chest_findings,
                'impression' => $request->impression,
                'is_completed' => true,
            ]
        );

        // ✅ UPDATE STATUS BACK TO DOCTOR
        $appointment = Appointment::findOrFail($appointmentId);

        $appointment->update([
            'status' => 'for_final_evaluation'
        ]);

        return redirect()->route('radtech.appointments')
            ->with('success', 'X-Ray completed and sent to Doctor.');
    }
}