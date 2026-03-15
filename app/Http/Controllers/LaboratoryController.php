<?php

namespace App\Http\Controllers;

use App\Models\LabResult;
use App\Models\Appointment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;

class LaboratoryController extends Controller
{
    public function create($appointmentId): Response
    {
        $appointment = Appointment::with(['user', 'labResult'])->findOrFail($appointmentId);
        
        return Inertia::render('medtech/lab-results-form', [
            'appointment' => $appointment,
            'labResult' => $appointment->labResult,
            'normalValues' => LabResult::getNormalValues(),
        ]);
    }

    public function store(Request $request, $appointmentId)
    {
        $request->validate([
            'hemoglobin' => 'nullable|numeric',
            'hematocrit' => 'nullable|numeric',
            'wbc_count' => 'nullable|numeric',
            'rbc_count' => 'nullable|numeric',
            'platelet' => 'nullable|numeric',
            'segmenters' => 'nullable|numeric',
            'lymphocytes' => 'nullable|numeric',
            'monocytes' => 'nullable|numeric',
            'eosinophils' => 'nullable|numeric',
            'basophils' => 'nullable|numeric',
            'uri_color' => 'nullable|string|max:50',
            'uri_transparency' => 'nullable|string|max:50',
            'uri_ph' => 'nullable|numeric',
            'uri_sp_gravity' => 'nullable|string',
            'uri_sugar' => 'nullable|string|max:50',
            'uri_protein' => 'nullable|string|max:50',
            'uri_wbc' => 'nullable|numeric',
            'uri_rbc' => 'nullable|numeric',
            'uri_bacteria' => 'nullable|string|max:100',
            'uri_epithelial_cells' => 'nullable|string|max:100',
            'fecal_color' => 'nullable|string|max:50',
            'fecal_consistency' => 'nullable|string|max:50',
            'fecal_pus_cells' => 'nullable|numeric',
            'fecal_rbc' => 'nullable|numeric',
            'fecal_parasites' => 'nullable|string|max:100',
            'drug_test_shabu' => 'nullable|string|max:50',
            'drug_test_thc' => 'nullable|string|max:50',
            'hepa_b_sag' => 'nullable|string|max:50',
            'hepa_b_cab' => 'nullable|string|max:50',
            'pregnancy_test' => 'nullable|string|max:50',
            'fbs' => 'nullable|numeric',
            'remarks' => 'nullable|string|max:1000',
        ]);

        LabResult::updateOrCreate(
            ['appointment_id' => $appointmentId],
            array_merge($request->only(array_keys($request->validate())),
                          [
                              'encoded_by' => auth()->id(),
                              'is_completed' => true,
                          ])
        );

        return redirect()->back()->with('success', 'Lab results saved successfully.');
    }
}

