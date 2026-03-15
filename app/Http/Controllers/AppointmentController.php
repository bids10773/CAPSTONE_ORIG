<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Company;
use App\Models\User;
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
        
        return Inertia::render('appointments/create', [
            'companies' => $companies,
            'serviceTypes' => Appointment::getServiceTypeOptions(),
            'appointmentTypes' => Appointment::getTypeOptions(),
        ]);
    }

    /**
     * Store a newly created appointment.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        
        $rules = [
            'type' => ['required', 'string', 'in:individual,company_referral,company_bulk'],
            'company_id' => ['nullable', 'exists:companies,id'],
            'appointment_date' => ['required', 'date', 'after_or_equal:today'],
            'service_type' => ['required', 'string'],
            'referral_code' => ['nullable', 'string', 'max:50'],
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
        
        // For company referral, company is required
        if ($request->type === 'company_referral' && !$request->company_id) {
            $validator->errors()->add('company_id', 'Company is required for company referral.');
        }
        
        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }
        
        $data = $validator->validated();
        
        // Generate referral code for company referrals
        if ($data['type'] === 'company_referral') {
            $data['referral_code'] = $data['referral_code'] ?? strtoupper(Str::random(8));
        }

        // Create appointment first
        $appointment = Appointment::create([
            'user_id' => $user->id,
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
            ->with('success', 'Appointment booked successfully!');
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
            'status' => ['required', 'string', 'in:pending,accepted,arrived,completed,cancelled'],
        ]);

        
        if ($validator->fails()) {
            return back()->withErrors($validator);
        }
        
        $appointment->update([
            'status' => $request->status,
        ]);
        
        return back()->with('success', 'Appointment status updated.');
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
     * Admin: Display all appointments with advanced filtering.
     */
    public function adminIndex(Request $request): Response
    {
        $search = $request->get('search', '');
        $status = $request->get('status', '');
        $type = $request->get('type', '');
        $dateFrom = $request->get('date_from', '');
        $dateTo = $request->get('date_to', '');
        
$query = Appointment::with(['user.patientProfile', 'company']);


        
        if ($search) {
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
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
        
        $appointments = $query->orderBy('appointment_date', 'desc')
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
        
        $patients = User::where('role', 'patient')
            ->where('is_active', true)
            ->orderBy('first_name')
            ->get(['id', 'first_name', 'last_name', 'email']);
        
        return Inertia::render('admin/appointments/create', [
            'companies' => $companies,
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
            'referral_code' => ['nullable', 'string', 'max:50'],
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
     * Staff appointment list - filtered by role and status/service_type.
     */
    public function staffIndex(Request $request, string $role): Response
    {
        $search = $request->get('search', '');
        $status = $request->get('status', 'pending'); // Default to pending

        $query = Appointment::with(['user', 'company', 'physicalExam', 'labResult', 'xrayReport'])
            ->where('status', $status);

        // Role-specific filtering
        if ($role === 'doctor') {
            // Doctors see all pending appointments
            $query->whereDoesntHave('physicalExam', function ($q) {
                $q->where('is_completed', true);
            });
        } elseif ($role === 'medtech') {
            // MedTech sees pending appointments requiring lab (service_type match)
            $labServices = ['CBC', 'Urinalysis', 'Fecalysis', 'Drug Test', 'Hepatitis', 'FBS', 'Pregnancy Test'];
            $query->whereIn('service_type', $labServices)
                  ->whereDoesntHave('labResult');
        } elseif ($role === 'radtech') {
            // RadTech sees pending X-Ray appointments
            $query->where('service_type', 'like', '%X-Ray%')
                  ->whereDoesntHave('xrayReport');
        }

        if ($search) {
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%");
            });
        }

        $appointments = $query->orderBy('appointment_date', 'asc')
            ->paginate(15)
            ->withQueryString();

        $pageTitle = ucfirst($role) . ' Appointments';

        return Inertia::render("{$role}/appointments/index", [
            'appointments' => $appointments,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'role' => $role,
            ],
            'pageTitle' => $pageTitle,
        ]);
    }
}


