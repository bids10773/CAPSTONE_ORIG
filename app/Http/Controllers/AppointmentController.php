<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Company;
use App\Models\User;
use App\Models\MedicalHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AppointmentController extends Controller
{
    /**
     * Display a listing of appointments.
     */
    public function index(Request $request): Response
    {
        $search = $request->get('search', '');
        $status = $request->get('status', '');
        $type = $request->get('type', '');
        
        $user = $request->user();
        
        $query = Appointment::with([
    'user' => function ($q) {
$q->with('patientProfile');
    },
    'company'
]);
        
        // If patient, show only their appointments
        if ($user->role === 'patient') {
            $query->where('user_id', $user->id);
        }
        
        // If company, show appointments for their employees
        if ($user->role === 'company') {
            $query->where('company_id', $user->company_id);
        }
        
        if ($search) {
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%");
            });
        }
        
        if ($status) {
            $query->where('status', $status);
        }
        
        if ($type) {
            $query->where('type', $type);
        }
        
        $appointments = $query->orderBy('appointment_date', 'desc')
            ->paginate(10)
            ->withQueryString();
        
        return Inertia::render('appointments/index', [
            'appointments' => $appointments,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'type' => $type,
            ],
            'can' => [
                'create' => in_array($user->role, ['patient', 'company']),
            ],
        ]);
    }

    /**
     * Show the form for creating a new appointment.
     */
    public function create(Request $request): Response
{
    $companies = Company::where('is_active', true)
        ->orderBy('company_name')
        ->get(['id', 'company_name']);

    $user = $request->user()->load('patientProfile'); // ✅ LOAD RELATION

    return Inertia::render('appointments/create', [
        'companies' => $companies,
        'serviceTypes' => Appointment::getServiceTypeOptions(),
        'appointmentTypes' => Appointment::getTypeOptions(),
        'auth' => [
            'user' => $user // ✅ SEND USER WITH PROFILE
        ]
    ]);
}

    /**
     * Store a newly created appointment.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        
$rules = [
            'doctor_id' => ['required', 'exists:users,id'],
            'start_time' => ['required', 'date_format:H:i'],
            'type' => ['required', 'string', 'in:individual,company_referral,company_bulk'],
            'company_id' => ['nullable', 'exists:companies,id'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'appointment_date' => ['required', 'date', 'after_or_equal:today'],
            'service_types' => ['required', 'array'],
            'notes' => ['nullable', 'string', 'max:500'],
            'present_illness' => ['nullable', 'string', 'max:1000'],
            'past_medical_history' => ['nullable', 'string', 'max:1000'],
            'operations_accidents' => ['nullable', 'string', 'max:1000'],
            'family_history' => ['nullable', 'string', 'max:1000'],
            'allergies' => ['nullable', 'string', 'max:1000'],
            'personal_social_history' => ['nullable', 'string', 'max:1000'],
            'ob_menstrual_history' => ['nullable', 'string', 'max:1000'],
        ];

        // Conditional fields for individual/company_referral
        if (in_array($request->type, ['individual', 'company_referral'])) {
            $rules = array_merge($rules, [
                'birthdate' => ['required', 'date', 'before:today'],
                'sex' => ['required', 'in:Male,Female'],
                'civil_status' => ['required', 'string', 'max:50'],
                'address' => ['required', 'string', 'max:500'],
                'emergency_contact_name' => ['required', 'string', 'max:255'],
                'emergency_contact_no' => ['required', 'string', 'max:11'],
            ]);
        }

        $validator = Validator::make($request->all(), $rules);
        
        // For company referral, company is required
        if ($request->type === 'company_referral' && !$request->company_id && !$request->company_name) {
    $validator->errors()->add('company_name', 'Company is required.');
}
        
        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }
        
        $data = $validator->validated();

        // Validate doctor availability
        $doctor = User::findOrFail($data['doctor_id']);
        if ($doctor->role !== 'doctor' || !$doctor->is_active) {
            return back()->withErrors(['doctor_id' => 'Invalid doctor selected.'])->withInput();
        }

        $appointmentDate = new \DateTime($data['appointment_date']);
        $dayKey = strtolower($appointmentDate->format('D'));
        $availSlot = collect($doctor->availability ?? [])->firstWhere('day', $dayKey);

        if (!$availSlot) {
            return back()->withErrors(['doctor_id' => "Doctor not available on {$appointmentDate->format('l')}."])->withInput();
        }

        $startTime = new \DateTime($data['appointment_date'] . ' ' . $data['start_time']);
        $endTime = clone $startTime;
        $endTime->add(new \DateInterval('PT30M'));  // 30min slot

        if ($startTime->format('H:i') < $availSlot['start'] || $endTime->format('H:i') > $availSlot['end']) {
            return back()->withErrors(['start_time' => 'Selected time outside doctor\'s availability.'])->withInput();
        }

        // Check for overlapping appointments
        $overlap = Appointment::where('doctor_id', $doctor->id)
            ->whereDate('appointment_date', $data['appointment_date'])
            ->where(function ($q) use ($startTime, $endTime) {
                $q->whereBetween('start_time', [$startTime->format('H:i'), $endTime->format('H:i')])
                  ->orWhereBetween('end_time', [$startTime->format('H:i'), $endTime->format('H:i')]);
            })
            ->exists();

        if ($overlap) {
            return back()->withErrors(['start_time' => 'Time slot already booked.'])->withInput();
        }

        if ($data['type'] === 'company_referral') {
    $data['referral_code'] = 'REF-' . now()->format('Ymd') . '-' . strtoupper(Str::random(4));
}

        // Create appointment first
        $appointment = Appointment::create([
            'user_id' => $user->id,
            'company_id' => $data['company_id'] ?? null,
            'company_name' => $data['company_name']
                ?? ($data['company_id'] ? Company::find($data['company_id'])->company_name : null),            'doctor_id' => $data['doctor_id'],
            'start_time' => $startTime->format('H:i'),
            'end_time' => $endTime->format('H:i'),
            'appointment_date' => $data['appointment_date'],
            'type' => $data['type'],
            'status' => 'pending',
            'service_types' => json_encode($data['service_types']),
            'referral_code' => $data['referral_code'] ?? null,
            'notes' => $data['notes'] ?? null,
        ]);

        // Create or update patient profile for individual/referral
        if (in_array($data['type'], ['individual', 'company_referral'])) {
            $user->patientProfile()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'birthdate' => $data['birthdate'],
                    'sex' => $data['sex'],
                    'contact_no' => $user->contact, // Use user contact or override
                    'civil_status' => $data['civil_status'],
                    'address' => $data['address'],
                    'emergency_contact_name' => $data['emergency_contact_name'],
                    'emergency_contact_no' => $data['emergency_contact_no'],
                ]
            );
        }
        
        return redirect()->route('appointments.index')
    ->with('success', 
        'Appointment booked successfully!' . 
        ($data['type'] === 'company_referral' 
            ? ' Referral Code: ' . $data['referral_code'] 
            : '')
    );
    }

    /**
     * Display the specified appointment.
     */
    public function show(Appointment $appointment): Response
    {
        $appointment->load(['user', 'company', 'physicalExam', 'labResult', 'xrayReport']);
        
        return Inertia::render('appointments/show', [
            'appointment' => $appointment,
        ]);
    }

    /**
     * Update appointment status (for clinic staff).
     */
    public function updateStatus(Request $request, Appointment $appointment)
    {
        $validator = Validator::make($request->all(), [
            'status' => ['required', 'string', 'in:pending,accepted,arrived,for_diagnostics,for_xray,for_final_evaluation,completed,cancelled'],
        ]);

        
        if ($validator->fails()) {
            return back()->withErrors($validator);
        }
        
        $appointment->update([
            'status' => $request->status,
        ]);
        
        return back()->with('success', match ($request->status) {
            'accepted' => 'Appointment accepted and forwarded to doctor.',
            'arrived' => 'Patient marked as arrived.',
            'completed' => 'Appointment marked as completed.',
            'cancelled' => 'Appointment has been cancelled.',
            default => 'Appointment status updated.',
        });
    }


    /**
     * Handle bulk appointment creation from CSV (for Company HR).
     */
    public function bulkStore(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'company_id' => ['required', 'exists:companies,id'],
            'appointment_date' => ['required', 'date'],
            'service_type' => ['required', 'string'],
            'employees' => ['required', 'array', 'min:1'],
            'employees.*.email' => ['required', 'email'],
            'employees.*.first_name' => ['required', 'string'],
            'employees.*.last_name' => ['required', 'string'],
        ]);
        
        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }
        
        $data = $validator->validated();
        $batchId = strtoupper(Str::random(10));
        $company = Company::find($data['company_id']);
        
        $created = 0;
        $errors = [];
        
        foreach ($data['employees'] as $index => $employee) {
            // Find or create user by email
            $user = User::where('email', $employee['email'])->first();
            
            if (!$user) {
                // Create new user/patient
                $user = User::create([
                    'first_name' => $employee['first_name'],
                    'last_name' => $employee['last_name'],
                    'email' => $employee['email'],
                    'password' => bcrypt('changeme123'), // Temporary password
                    'role' => 'patient',
                    'company_id' => $data['company_id'],
                    'is_active' => true,
                ]);
            }
            
            // Create appointment
            Appointment::create([
                'user_id' => $user->id,
                'company_id' => $data['company_id'],
                'appointment_date' => $data['appointment_date'],
                'type' => 'company_bulk',
                'status' => 'pending',
                'service_type' => $data['service_type'],
                'batch_id' => $batchId,
                'notes' => "Bulk booking for {$company->company_name}",
            ]);
            
            $created++;
        }
        
        return redirect()->route('appointments.index')
            ->with('success', "Successfully created {$created} appointments for {$company->company_name} (Batch: {$batchId})");
    }

    /**
     * Get available doctors and slots for a date (API).
     */
    public function availableDoctors(Request $request)
    {
        $date = $request->get('date', today()->format('Y-m-d'));
        $dayKey = strtolower(date('D', strtotime($date)));

        $doctors = User::where('role', 'doctor')
            ->where('is_active', true)
            ->whereJsonContains('availability->*.day', $dayKey)
            ->withCount(['doctorAppointments as booked_slots' => function ($q) use ($date) {
                $q->whereDate('appointment_date', $date)
                  ->whereIn('status', ['accepted', 'arrived']);
            }])
            ->get(['id', 'first_name', 'last_name', 'specialization']);

        $doctors->each(function ($doctor) use ($dayKey, $date) {
            $avail = collect($doctor->availability)->firstWhere('day', $dayKey);
            if ($avail) {
                $doctor->availability_slot = $avail;
                // Simple free slots estimate:  (end - start hours * 2) - booked
                $hours = (strtotime($avail['end']) - strtotime($avail['start'])) / 3600;
                $doctor->free_slots = max(0, intval($hours * 2) - $doctor->booked_slots_count);
            }
        });

        return response()->json($doctors->filter(fn($d) => ($d->free_slots ?? 0) > 0));
    }

    /**
     * Get available companies for dropdown (API).
     */
    public function getCompanies(Request $request)
    {
        $search = $request->get('search', '');
        
        $companies = Company::where('is_active', true)
            ->when($search, function ($query) use ($search) {
                $query->where('company_name', 'like', "%{$search}%");
            })
            ->orderBy('company_name')
            ->limit(20)
            ->get(['id', 'company_name']);
        
        return response()->json($companies);
    }

    /**
     * Get all active doctors (API).
     */
    public function getDoctors(Request $request)
    {
        $doctors = User::where('role', 'doctor')
            ->where('is_active', true)
            ->orderBy('first_name')
            ->get(['id', 'first_name', 'last_name', 'specialization']);
        return response()->json($doctors);
    }

    /**
     * Get specific doctor's availability (API).
     */
    public function getDoctorAvailability(Request $request, $doctorId)
    {
        $doctor = User::where('role', 'doctor')->where('is_active', true)->findOrFail($doctorId);
        
        $availability = $doctor->availability ?? [];
        $slots = collect($availability)->keyBy('day');
        
        $date = $request->get('date');
        $availableDates = [];
        
        // Next 30 days available dates
        $startDate = now();
        for ($i = 0; $i < 30; $i++) {
            $checkDate = $startDate->copy()->addDays($i);
            $dayKey = strtolower($checkDate->format('D'));
            if (isset($slots[$dayKey])) {
                $availableDates[] = $checkDate->format('Y-m-d');
            }
        }
        
        $availableTimes = [];
        if ($date) {
            $dayKey = strtolower(date('D', strtotime($date)));
            $slot = $slots->get($dayKey);
            if ($slot) {
                $availableTimes = $this->generateAvailableTimes($slot['start'], $slot['end'], $doctorId, $date);
            }
        }
        
        return response()->json([
            'doctor' => [
                'id' => $doctor->id,
                'name' => $doctor->first_name . ' ' . $doctor->last_name,
                'specialization' => $doctor->specialization,
            ],
            'slots' => $slots->toArray(),
            'availableDates' => $availableDates,
            'availableTimes' => $availableTimes,
        ]);
    }

    /**
     * Generate available 30min time slots for doctor on date.
     */
    private function generateAvailableTimes($start, $end, $doctorId, $date)
    {
        $times = [];
        $current = new \DateTime($start);
        $endTime = new \DateTime($end);
        
        while ($current < $endTime) {
            $startStr = $current->format('H:i');
            $endStr = (clone $current)->add(new \DateInterval('PT30M'))->format('H:i');
            
            // Check overlap with booked appointments
            $overlap = Appointment::where('doctor_id', $doctorId)
                ->whereDate('appointment_date', $date)
                ->whereIn('status', ['accepted', 'arrived', 'pending'])  // include pending
                ->where(function($q) use ($startStr, $endStr) {
                    $q->where('start_time', '<=', $endStr)
                      ->where('end_time', '>', $startStr);
                })
                ->exists();
            
            if (!$overlap) {
                $times[] = $startStr;
            }
            
            $current->add(new \DateInterval('PT30M'));
        }
        
        return $times;
    }

    /**
     * Admin: Display all appointments with advanced filtering.
     */
    public function adminIndex(Request $request): Response
    {
        $search = $request->get('search', '');
        $status = $request->get('status', '');
        $type = $request->get('type', '');
        $dateFrom = $request->get('date_from', '');
        $dateTo = $request->get('date_to', '');
        
$query = Appointment::with(['user.patientProfile', 'company', 'doctor']);


        
        if ($search) {
    $query->where(function ($query) use ($search) {

        // 🔍 Search by patient name/email
        $query->whereHas('user', function ($q) use ($search) {
            $q->where('first_name', 'like', "%{$search}%")
              ->orWhere('last_name', 'like', "%{$search}%")
              ->orWhere('email', 'like', "%{$search}%");
        })

        // 🔍 Search by doctor name
        ->orWhereHas('doctor', function ($q) use ($search) {
            $q->where('first_name', 'like', "%{$search}%")
              ->orWhere('last_name', 'like', "%{$search}%");
        })

        // 🔍 Search by appointment date
        ->orWhere('appointment_date', 'like', "%{$search}%");
    });
}
        
        if ($status) {
            $query->where('status', $status);
        }
        
        if ($type) {
            $query->where('type', $type);
        }

        if ($dateFrom) {
            $query->whereDate('appointment_date', '>=', $dateFrom);
        }

        if ($dateTo) {
            $query->whereDate('appointment_date', '<=', $dateTo);
        }
        
        $appointments = $query
    ->orderByRaw("
        CASE 
            WHEN status = 'pending' THEN 1
            WHEN status = 'accepted' THEN 2
            WHEN status = 'arrived' THEN 3
            WHEN status = 'pending_diagnostics' THEN 4
            WHEN status = 'pending_xray' THEN 5
            WHEN status = 'completed' THEN 6
            WHEN status = 'cancelled' THEN 7
            ELSE 8
        END
    ")
    ->orderBy('appointment_date', 'asc') // optional: earliest first
    ->paginate(15)
    ->withQueryString();
        
        return Inertia::render('admin/appointments/index', [
            'appointments' => $appointments,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'type' => $type,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
        ]);
    }

    /**
     * Admin: Show form for creating appointment.
     */
    public function adminCreate(Request $request): Response
    {
        $companies = Company::where('is_active', true)
            ->orderBy('company_name')
            ->get(['id', 'company_name']);

        $doctors = User::where('role', 'doctor')
            ->where('is_active', true)
            ->orderBy('first_name')
            ->get(['id', 'first_name', 'last_name', 'specialization']);

        $patients = User::where('role', 'patient')
            ->where('is_active', true)
            ->orderBy('first_name')
            ->get(['id', 'first_name', 'last_name', 'email']);
        
        return Inertia::render('admin/appointments/create', [
            'companies' => $companies,
            'doctors' => $doctors,
            'patients' => $patients,
            'serviceTypes' => Appointment::getServiceTypeOptions(),
            'appointmentTypes' => Appointment::getTypeOptions(),
        ]);
    }

    /**
     * Admin: Store new appointment.
     */
    public function adminStore(Request $request)
    {
        $rules = [
            'patient_id' => ['required', 'exists:users,id'],
            'type' => ['required', 'string', 'in:individual,company_referral,company_bulk'],
            'company_id' => ['nullable', 'exists:companies,id'],
            'appointment_date' => ['required', 'date'],
            'service_type' => ['required', 'string'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];

        // Conditional fields for individual/company_referral
        if (in_array($request->type, ['individual', 'company_referral'])) {
            $rules = array_merge($rules, [
                'birthdate' => ['required', 'date', 'before:today'],
                'sex' => ['required', 'in:Male,Female'],
                'civil_status' => ['required', 'string', 'max:50'],
                'address' => ['required', 'string', 'max:500'],
                'emergency_contact_name' => ['required', 'string', 'max:255'],
                'emergency_contact_no' => ['required', 'string', 'max:11'],
            ]);
        }

        $validator = Validator::make($request->all(), $rules);
        
        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }
        
        $data = $validator->validated();

        $appointment = Appointment::create([
            'user_id' => $data['patient_id'],
            'company_id' => $data['company_id'] ?? null,
            'appointment_date' => $data['appointment_date'],
            'type' => $data['type'],
            'status' => 'pending',
            'service_type' => $data['service_type'],
            'referral_code' => $data['referral_code'] ?? null,
            'notes' => $data['notes'] ?? null,
        ]);

        // Create or update patient profile for individual/referral
        if (in_array($data['type'], ['individual', 'company_referral'])) {
            $patient = User::find($data['patient_id']);
            $patient->patientProfile()->updateOrCreate(
                ['user_id' => $data['patient_id']],
                [
                    'birthdate' => $data['birthdate'],
                    'sex' => $data['sex'],
                    'contact_no' => $patient->contact ?? '',
                    'civil_status' => $data['civil_status'],
                    'address' => $data['address'],
                    'emergency_contact_name' => $data['emergency_contact_name'],
                    'emergency_contact_no' => $data['emergency_contact_no'],
                ]
            );
        }
        
        return redirect()->route('admin.appointments.index')
            ->with('success', 'Appointment created successfully!');
    }

    /**
     * Bulk upload appointments from CSV for company users (simple file upload).
     */
    public function companyBulkStore(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:2048',
        ]);

        $user = $request->user();
        $company = $user->company ?? $user->company_id ? Company::find($user->company_id) : null;
        
        if (!$company) {
            return back()->with('error', 'No company association found.');
        }

        $path = $request->file('file')->getRealPath();
        $data = fopen($path, 'r');

        $created = 0;

        $header = fgetcsv($data); // Skip header
        while (($row = fgetcsv($data)) !== false) {
            if (count($row) < 4) continue;

            [$employeeName, $date, $time, $type] = array_map('trim', $row);

            Appointment::create([
                'company_id' => $company->id,
                'patient_name' => $employeeName,
                'appointment_date' => $date,
                'appointment_time' => $time,
                'appointment_type' => $type,
                'status' => 'pending',
            ]);

            $created++;
        }

        fclose($data);

        return back()->with('success', "Created {$created} pending appointments successfully!");
    }

    /**
     * Staff appointment list - filtered by role and status/service_type.
     */
   public function staffIndex(Request $request, string $role): Response
{
    $search = $request->get('search', '');
    $status = $request->get('status', '');

    
    $query = Appointment::with(['user', 'company', 'physicalExam', 'labResult', 'xrayReport']);


    if ($role === 'doctor') {
    $query->where(function ($q) {
        $q->where(function ($sub) {
            $sub->whereIn('status', ['accepted', 'arrived'])
                ->whereDoesntHave('physicalExam');
        })
        ->orWhere('status', 'for_final_evaluation');
    });

} elseif ($role === 'medtech') {
    $query->where('status', 'for_diagnostics')
          ->whereDoesntHave('labResult');

} elseif ($role === 'radtech') {
    $query->where('status', 'for_xray')
          ->whereDoesntHave('xrayReport');
}

if ($status) {
    $query->where('status', $status);
}

    // Search logic
    if ($search) {
        $query->whereHas('user', function ($q) use ($search) {
            $q->where('first_name', 'like', "%{$search}%")
              ->orWhere('last_name', 'like', "%{$search}%");
        });
    }

    $appointments = $query->orderBy('updated_at', 'desc')->paginate(15)->withQueryString();

    // Map the role to the correct Inertia page path based on your routes
    $pagePath = match($role) {
        'doctor' => 'doctor/appointments/index', // Adjust if your file is elsewhere
        'medtech' => 'medtech/appointments/index',
        'radtech' => 'radtech/appointments/index',
        default => "{$role}/appointments/index"
    };

    return Inertia::render($pagePath, [
        'appointments' => $appointments,
        'filters' => ['search' => $search,'status' => $status, 'role' => $role],
        'pageTitle' => ucfirst($role) . ' Queue',
    ]);
}
}


