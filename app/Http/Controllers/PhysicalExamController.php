<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\MedicalHistory;
use App\Models\PhysicalExam;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PhysicalExamController extends Controller
{
    public function create($appointmentId): Response
    {
        $appointment = Appointment::with(['user', 'physicalExam', 'medicalHistory'])->findOrFail($appointmentId);
        
        return Inertia::render('doctor/physical-exam-form', [
            'appointment' => $appointment,
            'physicalExam' => $appointment->physicalExam,
        ]);
    }

    // app/Http/Controllers/PhysicalExamController.php

public function store(Request $request, $appointmentId)
{
    $appointment = Appointment::findOrFail($appointmentId);

    $request->validate([
        'height' => 'nullable|numeric',
        'weight' => 'nullable|numeric',
        'blood_pressure' => 'nullable|string',
        'pulse_rate' => 'nullable|numeric',
        'temperature' => 'nullable|numeric',
        'remarks' => 'nullable|string',
    ]);

    $fieldsMap = [
        'head_scalp' => 'head', 'eyes' => 'eyes', 'ears' => 'ears',
        'nose_sinuses' => 'nose', 'mouth_throat' => 'mouth', 'neck_thyroid' => 'neck',
        'chest_breast' => 'chest', 'lungs' => 'lungs', 'heart' => 'heart',
        'abdomen' => 'abdomen', 'extremities' => 'extremities',
    ];

    $physicalFindings = [];
    foreach ($fieldsMap as $frontendKey => $modelPrefix) {
        $status = $request->input("{$frontendKey}_status");
        $physicalFindings["is_{$modelPrefix}_normal"] = ($status === 'normal');
        $physicalFindings["{$modelPrefix}_remarks"] = $request->input($frontendKey);
    }

    PhysicalExam::updateOrCreate(
        ['appointment_id' => $appointment->id],
        array_merge($physicalFindings, [
            'doctor_id' => auth()->id(),
            'height' => $request->height,
            'weight' => $request->weight,
            'blood_pressure' => $request->blood_pressure,
            'pulse_rate' => $request->pulse_rate,
            'temperature' => $request->temperature,
            'remarks' => $request->remarks,
            'classification' => 'Pending',
        ])
    );

    MedicalHistory::updateOrCreate(
        ['appointment_id' => $appointment->id],
        $request->only([
            'present_illness', 'past_medical_history', 'operations_accidents',
            'family_history', 'allergies', 'personal_social_history', 'ob_menstrual_history',
        ])
    );

    // ✅ MATCH THIS STATUS WITH MEDTECH CONTROLLER
    $appointment->update([
        'status' => 'pending_diagnostics' 
    ]);

    return redirect()->back()->with('success', 'Physical Examination complete! Patient forwarded to Lab.');
}

    public function final($appointment): Response
    {
        $appointment = Appointment::findOrFail($appointment);
        
        return Inertia::render('doctor/finalExam', [
            'appointment_id' => $appointment->id,
            'appointment' => $appointment
        ]);
    }

    public function finalStore(Request $request, $appointment)
    {
        $request->validate([
            'final_remarks' => 'nullable|string',
            'diagnosis' => 'nullable|string',
        ]);

        // Update appointment with final diagnosis or add to PhysicalExam
        $appointment = Appointment::findOrFail($appointment);
        $appointment->update([
            'final_diagnosis' => $request->diagnosis,
            'doctor_remarks' => $request->final_remarks,
            'status' => 'completed', // or appropriate status
        ]);

        return redirect()->back()->with('success', 'Final evaluation saved.');
    }
}
