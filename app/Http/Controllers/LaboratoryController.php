<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\LabResult;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LaboratoryController extends Controller
{
    /**
     * Show lab result form for appointment.
     */
    public function create(Appointment $appointment): Response
    {
        $appointment->load('user', 'patientProfile');
        
        return Inertia::render('medtech/lab-results-form', [
            'appointment' => $appointment,
        ]);
    }

    /**
     * Store lab result.
     */
    public function store(Request $request, Appointment $appointment)
    {
        $request->validate([
            'cbc' => 'nullable|array',
            'cbc.*' => 'nullable|string|max:255',
            'urinalysis' => 'nullable|array',
            'urinalysis.*' => 'nullable|string|max:255',
            'fecalysis' => 'nullable|array',
            'fecalysis.*' => 'nullable|string|max:255',
            'blood_sugar' => 'nullable|string|max:255',
            'pregnancy_test' => 'nullable|string|max:255',
            'drug_test' => 'nullable|string|max:255',
            'hepatitis_b' => 'nullable|string|max:255',
            'remarks' => 'nullable|string|max:1000',
        ]);

        LabResult::create([
            'appointment_id' => $appointment->id,
            'cbc' => $request->cbc,
            'urinalysis' => $request->urinalysis,
            'fecalysis' => $request->fecalysis,
            'blood_sugar' => $request->blood_sugar,
            'pregnancy_test' => $request->pregnancy_test,
            'drug_test' => $request->drug_test,
            'hepatitis_b' => $request->hepatitis_b,
            'remarks' => $request->remarks,
            'encoded_by' => auth()->id(),
        ]);

        return redirect()->route('medtech.appointments.index')
            ->with('success', 'Lab results encoded successfully.');
    }
}

