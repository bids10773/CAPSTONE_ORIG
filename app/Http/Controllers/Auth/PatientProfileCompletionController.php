<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Support\PhilippineContactNumber;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PatientProfileCompletionController extends Controller
{
    public function edit(Request $request): Response|RedirectResponse
    {
        $user = $request->user()->load('patientProfile');
        abort_unless($user->role === 'patient', 403);

        if ($user->hasCompletePatientProfile()) {
            return to_route('dashboard');
        }

        return Inertia::render('auth/complete-patient-profile', [
            'profile' => [
                'first_name' => $user->first_name,
                'middle_name' => $user->middle_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'contact' => $user->contact,
                'birthdate' => $user->patientProfile?->birthdate?->format('Y-m-d'),
                'sex' => $user->patientProfile?->sex,
                'civil_status' => $user->patientProfile?->civil_status,
                'address' => $user->patientProfile?->address,
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user->role === 'patient', 403);

        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'birthdate' => ['required', 'date_format:Y-m-d', 'before_or_equal:'.today()->subYearsNoOverflow(18)->format('Y-m-d')],
            'sex' => ['required', Rule::in(['Male', 'Female'])],
            'civil_status' => ['required', Rule::in(['Single', 'Married', 'Divorced', 'Widowed'])],
            'contact' => ['required', 'string', 'max:20', function (string $attribute, mixed $value, \Closure $fail): void {
                if (PhilippineContactNumber::normalize((string) $value) === null) {
                    $fail('Enter a valid Philippine mobile number.');
                }
            }],
            'address' => ['required', 'string', 'max:1000'],
        ]);

        DB::transaction(function () use ($user, $validated): void {
            $user->update([
                'first_name' => $validated['first_name'],
                'middle_name' => $validated['middle_name'] ?? null,
                'last_name' => $validated['last_name'],
                'contact' => PhilippineContactNumber::normalize($validated['contact']),
            ]);
            $user->patientProfile()->updateOrCreate([], [
                'birthdate' => CarbonImmutable::parse($validated['birthdate']),
                'sex' => $validated['sex'],
                'civil_status' => $validated['civil_status'],
                'address' => $validated['address'],
            ]);
        });

        return to_route('dashboard')->with('status', 'Patient profile completed.');
    }
}
