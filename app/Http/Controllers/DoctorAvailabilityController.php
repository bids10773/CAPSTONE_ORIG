<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\JsonResponse;

class DoctorAvailabilityController extends Controller
{
    /**
     * Display doctor's availability form.
     */
    public function index(Request $request): Response
    {
        $doctor = $request->user();

        return Inertia::render('doctor/availability', [
            'availability' => $doctor->availability ?? [],
            'days' => [
                'mon' => 'Monday',
                'tue' => 'Tuesday',
                'wed' => 'Wednesday',
                'thu' => 'Thursday',
                'fri' => 'Friday',
                'sat' => 'Saturday',
                'sun' => 'Sunday',
            ],
        ]);
    }


    /**
     * Update doctor's availability.
     */
    public function update(Request $request): \Illuminate\Http\RedirectResponse
    {
        $request->validate([
            'availability' => 'required|array',
            'availability.*.day' => 'required|string|in:mon,tue,wed,thu,fri,sat,sun',
            'availability.*.start' => 'required|date_format:H:i',
            'availability.*.end' => 'required|date_format:H:i|after:availability.*.start',
        ]);

        $doctor = $request->user();
        $doctor->update(['availability' => $request->availability]);

        return redirect()->route('doctor.dashboard')
            ->with('success', 'Availability updated successfully.');
    }

}

