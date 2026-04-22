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
        $query = Appointment::with(['user', 'company'])
            ->where('status', 'for_diagnostics') 
            ->orderBy('updated_at', 'desc');

            
        // ✅ SEARCH LOGIC (Moved up so it actually runs)
        if ($request->search) {
            $query->whereHas('user', function($q) use ($request) {
                $q->where('first_name', 'like', "%{$request->search}%")
                  ->orWhere('last_name', 'like', "%{$request->search}%");
            });
        }

        return Inertia::render('medtech/index', [
            'appointments' => $query->paginate(10)->withQueryString(),
            'filters' => $request->only(['search']),
            'pageTitle' => 'Laboratory Queue'
        ]);
    }

    public function create(Appointment $appointment): Response
    {
        $appointment->load('user', 'company' ,'patientProfile'); // patientProfile changed to company based on index
        
        return Inertia::render('medtech/lab-results-form', [
            'appointment' => $appointment,
            'labResult' => LabResult::where('appointment_id', $appointment->id)->first(),
        ]);
    }

    public function store(Request $request, Appointment $appointment)
{
    $validated = $request->validate([
        'cbc_status' => 'nullable|string',
        'cbc_remarks' => 'nullable|string',
        'urinalysis_status' => 'nullable|string',
        'urinalysis_remarks' => 'nullable|string',
        'fecalysis_status' => 'nullable|string',
        'fecalysis_remarks' => 'nullable|string',
        'hepa_b_status' => 'nullable|string',
        'hepa_a_status' => 'nullable|string',
        'pregnancy_test_status' => 'nullable|string',
        'meth_status' => 'nullable|string',
        'marijuana_status' => 'nullable|string',
    ]);

    // ✅ SAVE LAB RESULT (ONLY ONCE)
    LabResult::updateOrCreate(
        ['appointment_id' => $appointment->id],
        array_merge($validated, [
            'encoded_by' => auth()->id(),
            'is_completed' => true
        ])
    );

    // ✅ MOVE TO XRAY
    $appointment->update([
        'status' => 'for_xray'
    ]);

    return redirect()->route('medtech.appointments')
        ->with('success', 'Laboratory results saved and forwarded to X-Ray.');
}
}