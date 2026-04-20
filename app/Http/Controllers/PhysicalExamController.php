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
    /**
     * Show Physical Exam Form
     */
    public function create($appointmentId): Response
    {
        $appointment = Appointment::with([
            'user',
            'physicalExam',
            'medicalHistory',
            'patientProfile',
        ])->findOrFail($appointmentId);

        return Inertia::render('doctor/physical-exam-form', [
            'appointment' => $appointment,
            'physicalExam' => $appointment->physicalExam,
        ]);
    }

    /**
     * Store Physical Exam + Medical History
     */
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
            'head_scalp' => 'head',
            'eyes' => 'eyes',
            'ears' => 'ears',
            'nose_sinuses' => 'nose',
            'mouth_throat' => 'mouth',
            'neck_thyroid' => 'neck',
            'chest_breast' => 'chest',
            'lungs' => 'lungs',
            'heart' => 'heart',
            'abdomen' => 'abdomen',
            'extremities' => 'extremities',
        ];

        $physicalFindings = [];

        foreach ($fieldsMap as $frontendKey => $modelPrefix) {
            $status = $request->input("{$frontendKey}_status");

            $physicalFindings["is_{$modelPrefix}_normal"] = ($status === 'normal');
            $physicalFindings["{$modelPrefix}_remarks"] = $request->input($frontendKey);
        }

        // ✅ Save Physical Exam
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

        // ✅ Save Medical History
        MedicalHistory::updateOrCreate(
            ['appointment_id' => $appointment->id],
            $request->only([
                'present_illness',
                'past_medical_history',
                'operations_accidents',
                'family_history',
                'allergies',
                'personal_social_history',
                'ob_menstrual_history',
            ])
        );

        // ✅ Send to MedTech
        $appointment->update([
            'status' => 'for_diagnostics'
        ]);

        return redirect()->route('doctor.dashboard')
            ->with('success', 'Forwarded to Laboratory.');
    }

    /**
     * Show Final Evaluation Page
     */
    public function final($appointmentId): Response
    {
        $appointment = Appointment::with([
            'user',
            'patientProfile',
            'physicalExam',
            'labResult',
            'xrayReport',
            'medicalHistory',
        ])->findOrFail($appointmentId);

        return Inertia::render('doctor/final-evaluation', [
            'appointment' => $appointment
        ]);
    }

    /**
     * Store Final Evaluation (CLASS A/B/C)
     */
public function finalStore(Request $request, $appointmentId)
{
    $request->validate([
        'medical_class' => 'required',
        'final_remarks' => 'nullable|string',
    ]);

    $appointment = Appointment::findOrFail($appointmentId);

    // ✅ SAVE TO PHYSICAL EXAM
    PhysicalExam::updateOrCreate(
        ['appointment_id' => $appointmentId],
        [
            'classification' => match($request->medical_class) {
                'A' => 'Class A',
                'B' => 'Class B',
                'C' => 'Class C',
                'pending' => 'Pending',
                default => 'Pending',
            },
            'doctor_remarks' => $request->final_remarks,
        ]
    );

    // ✅ UPDATE STATUS
    $appointment->update([
        'status' => 'completed',
    ]);

    return redirect()->route('doctor.dashboard')
        ->with('success', 'Final medical evaluation completed.');
}
}