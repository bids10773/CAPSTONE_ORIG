<?php

namespace App\Http\Controllers;

use App\Models\XrayReport;
use App\Models\Appointment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;

class XrayController extends Controller
{
    public function create($appointmentId): Response
    {
        $appointment = Appointment::with(['user', 'xrayReport'])->findOrFail($appointmentId);
        
        return Inertia::render('radtech/xray-report-form', [
            'appointment' => $appointment,
            'xrayReport' => $appointment->xrayReport,
            'viewOptions' => XrayReport::getViewOptions(),
        ]);
    }

    public function store(Request $request, $appointmentId)
    {
        $request->validate([
            'view' => 'required|string|max:100',
            'findings' => 'nullable|string|max:2000',
            'impression' => 'nullable|string|max:1000',
            'remarks' => 'nullable|string|max:1000',
            // Image upload
            'images.*' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $xrayData = $request->only(['view', 'findings', 'impression', 'remarks']);

        $xrayReport = XrayReport::updateOrCreate(
            ['appointment_id' => $appointmentId],
            array_merge($xrayData, [
                'radiologist_id' => auth()->id(),
                'is_completed' => true,
            ])
        );

        // Handle image uploads
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = $image->store('xray-reports/' . $appointmentId, 'public');
                // Save path to a separate images table or JSON field if needed
            }
        }

        // Inside your store method:
$appointment->update(['status' => 'pending_final_evaluation']);
return redirect()->route('radtech.dashboard')->with('success', 'Sent back to Doctor for final review');
    }
}

