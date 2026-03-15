<?php

namespace App\Http\Controllers;

use App\Models\PhysicalExam;
use App\Models\Appointment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PhysicalExamController extends Controller
{
    public function create($appointmentId): Response
    {
        $appointment = Appointment::with(['user', 'physicalExam'])->findOrFail($appointmentId);
        
        return Inertia::render('doctor/physical-exam-form', [
            'appointment' => $appointment,
            'physicalExam' => $appointment->physicalExam,
        ]);
    }

    public function store(Request $request, $appointment)
    {
        $request->validate([
            'height' => 'nullable|numeric',
            'weight' => 'nullable|numeric',
            'blood_pressure' => 'nullable|string',
            'pulse_rate' => 'nullable|numeric',
            'temperature' => 'nullable|numeric',
            'remarks' => 'nullable|string',
        ]);

        PhysicalExam::updateOrCreate(
            ['appointment_id' => $appointment],
            [
                'doctor_id' => auth()->id(),
                'height' => $request->height,
                'weight' => $request->weight,
                'blood_pressure' => $request->blood_pressure,
                'pulse_rate' => $request->pulse_rate,
                'temperature' => $request->temperature,
                'remarks' => $request->remarks,
            ]
        );

        return redirect()->back()->with('success', 'Physical exam saved.');
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
