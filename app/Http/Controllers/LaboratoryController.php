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
     * Display a listing of appointments waiting for lab work.
     */
    public function index(Request $request): Response
    {
        // We fetch appointments that are specifically sent by the doctor
        $query = Appointment::with(['user', 'company', 'labResult'])
            ->whereIn('status', ['pending_diagnostics', 'arrived']); // 'arrived' for direct lab walk-ins

        if ($request->search) {
            $query->whereHas('user', function($q) use ($request) {
                $q->where('first_name', 'like', "%{$request->search}%")
                  ->orWhere('last_name', 'like', "%{$request->search}%");
            });
        }

        return Inertia::render('medtech/index', [
            'appointments' => $query->paginate(10)->withQueryString(),
            'filters' => $request->only(['search', 'status']),
            'pageTitle' => 'Laboratory Queue'
        ]);
    }

    public function create(Appointment $appointment): Response
    {
        $appointment->load('user', 'patientProfile');
        
        return Inertia::render('medtech/lab-results-form', [
            'appointment' => $appointment,
        ]);
    }

    public function store(Request $request, Appointment $appointment)
    {
        $request->validate([
            'cbc' => 'nullable|array',
            'urinalysis' => 'nullable|array',
            'fecalysis' => 'nullable|array',
            'blood_sugar' => 'nullable|string|max:255',
            'pregnancy_test' => 'nullable|string|max:255',
            'drug_test' => 'nullable|string|max:255',
            'hepatitis_b' => 'nullable|string|max:255',
            'remarks' => 'nullable|string|max:1000',
        ]);

        // 1. Save results (using updateOrCreate to prevent duplicates)
        LabResult::updateOrCreate(
            ['appointment_id' => $appointment->id],
            [
                'cbc' => $request->cbc,
                'urinalysis' => $request->urinalysis,
                'fecalysis' => $request->fecalysis,
                'blood_sugar' => $request->blood_sugar,
                'pregnancy_test' => $request->pregnancy_test,
                'drug_test' => $request->drug_test,
                'hepatitis_b' => $request->hepatitis_b,
                'remarks' => $request->remarks,
                'encoded_by' => auth()->id(),
            ]
        );

        // 2. ✅ Update Status
        // Move to X-ray stage. If your clinic doesn't require X-ray for everyone,
        // you could change this to 'ready_for_final_evaluation'.
        $appointment->update([
            'status' => 'pending_xray' 
        ]);

        return redirect()->route('medtech.appointments.index')
            ->with('success', 'Lab results encoded. Patient moved to X-ray queue.');
    }
}