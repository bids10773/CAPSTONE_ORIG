<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Validation\Rule;

class DoctorAvailabilityController extends Controller
{
    /**
     * Display admin doctor availability management form.
     */
    public function adminIndex(Request $request): Response
    {
        $doctorId = $request->query('doctor_id');

        // Get all doctors
        $doctors = \App\Models\User::where('role', 'doctor')
            ->orderBy('first_name')
            ->get([
                'id',
                'first_name',
                'last_name',
                'specialization',
                'availability'
            ]);

        // Pre-selected doctor
        $selectedDoctor = $doctorId ? $doctors->firstWhere('id', $doctorId) : $doctors->first();

        return Inertia::render('admin/doctor-availability/index', [
            'doctors' => $doctors,
            'days' => [
                'mon' => 'Monday',
                'tue' => 'Tuesday',
                'wed' => 'Wednesday',
                'thu' => 'Thursday',
                'fri' => 'Friday',
                'sat' => 'Saturday',
                'sun' => 'Sunday',
            ],
            'selectedDoctorId' => $selectedDoctor?->id ?? null,
        ]);
    }

    /**
     * Update doctor availability by admin.
     */
    public function adminUpdate(Request $request): \Illuminate\Http\RedirectResponse
    {
        $request->validate([
            'doctor_id' => [
                'required',
                Rule::exists('users', 'id')->where(fn($query) => $query->where('role', 'doctor')),
            ],
            'availability' => 'nullable|array',
            'availability.*.day' => 'required|string|in:mon,tue,wed,thu,fri,sat,sun',
            'availability.*.start' => 'required|date_format:H:i',
            'availability.*.end' => 'required|date_format:H:i|after:availability.*.start',
        ]);

        $doctor = \App\Models\User::findOrFail($request->doctor_id);

if ($doctor->role !== 'doctor') {
    abort(403, 'Invalid doctor selected.');
}

        // Update availability (empty array if none)
        $doctor->update([
            'availability' => $request->availability ?? [],
        ]);

        return back()->with('success', 'Doctor availability updated successfully.');
    }
}