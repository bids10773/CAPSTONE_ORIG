<?php

namespace App\Http\Controllers;

use App\Http\Requests\AdminAppointmentIndexRequest;
use App\Http\Requests\TodayAppointmentIndexRequest;
use App\Models\Appointment;
use App\Models\Company;
use App\Models\CompanyReferral;
use App\Models\MedicalHistory;
use App\Models\User;
use App\Services\AppointmentApprovalService;
use App\Services\IndividualAppointmentBookingService;
use App\Services\LaboratoryFormDefinition;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
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
            'company',
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
            ->paginate($this->perPage($request))
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
        $referral = null;
        if ($request->filled('referral')) {
            abort_unless($request->user()->role === 'patient', 403);
            $referral = CompanyReferral::query()
                ->whereKey($request->integer('referral'))
                ->where('patient_id', $request->user()->id)
                ->with('company:id,company_name')
                ->firstOrFail();
            abort_unless($referral->isSchedulable(), 422, 'This referral is no longer available for scheduling.');
        }
        $companies = Company::query()
            ->where('status', 'active')
            ->when(
                $request->user()->role === 'company',
                fn ($query) => $query->whereKey($request->user()->company_id),
            )
            ->orderBy('company_name')
            ->get(['id', 'company_name'])
            ->map(fn (Company $company) => [
                'id' => $company->id,
                'company_name' => $company->company_name,
            ]);

        $user = $request->user()->load('patientProfile'); // ✅ LOAD RELATION
        $upcomingAppointments = collect();
        if ($user->role === 'patient') {
            $upcomingAppointments = Appointment::query()
                ->where('user_id', $user->id)
                ->where('type', 'individual')
                ->whereDate('appointment_date', '>=', today())
                ->activeReservation()
                ->orderBy('appointment_date')
                ->orderBy('start_time')
                ->get(['id', 'appointment_date', 'start_time', 'end_time', 'status']);
        }

        return Inertia::render('appointments/create', [
            'companies' => $companies,
            'serviceTypes' => Appointment::getServiceTypeOptions(),
            'pePackage' => [
                'includedLaboratoryServices' => config('medical.pe_package.laboratory_services', []),
                'optionalBulkServices' => config('medical.pe_package.optional_bulk_services', []),
                'requiresXray' => config('medical.pe_package.requires_xray', true),
            ],
            'appointmentTypes' => collect(Appointment::getTypeOptions())
                ->when(! $referral, fn ($types) => $types->except('company_referral'))
                ->all(),
            'auth' => [
                'user' => $user, // ✅ SEND USER WITH PROFILE
            ],
            'bookingPolicy' => [
                'maximumUpcoming' => (int) config('medical.booking_security.max_active_future_appointments', 2),
                'upcomingAppointments' => $upcomingAppointments,
                'bookedDates' => $upcomingAppointments->pluck('appointment_date')->map->toDateString()->unique()->values(),
            ],
            'referral' => $referral ? [
                'id' => $referral->id,
                'referral_number' => $referral->referral_number,
                'company_id' => $referral->company_id,
                'company_name' => $referral->company->company_name,
                'required_services' => $referral->required_services,
                'valid_until' => $referral->valid_until->toDateString(),
            ] : null,
        ]);
    }

    /**
     * Store a newly created appointment.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $referral = null;

        if ($request->filled('company_referral_id')) {
            abort_unless($user->role === 'patient', 403);
            $referral = CompanyReferral::query()
                ->whereKey($request->integer('company_referral_id'))
                ->where('patient_id', $user->id)
                ->firstOrFail();
            abort_unless($referral->isSchedulable(), 422, 'This referral is no longer available for scheduling.');
            $user->loadMissing('patientProfile');
            if (! $user->patientProfile?->birthdate || ! $user->patientProfile?->sex || ! $user->contact) {
                return back()->withErrors([
                    'profile' => 'Complete your birthdate, sex, and contact number before scheduling this company referral.',
                ]);
            }
            $request->merge([
                'type' => 'company_referral',
                'company_id' => $referral->company_id,
                'service_types' => $referral->required_services,
            ]);
        }

        if ($user->role === 'company') {
            $company = Company::query()
                ->whereKey($user->company_id)
                ->where('status', 'active')
                ->firstOrFail();

            $request->merge([
                'type' => 'company_bulk',
                'company_id' => $company->id,
                'company_name' => $company->company_name,
                'doctor_id' => null,
                'start_time' => null,
            ]);
        }

        $rules = [
            'doctor_id' => ['nullable', Rule::requiredIf(fn () => in_array($request->type, ['individual', 'company_referral'], true)), 'exists:users,id'],
            'start_time' => ['nullable', Rule::requiredIf(fn () => in_array($request->type, ['individual', 'company_referral'], true)), 'date_format:H:i'],
            'type' => ['required', 'string', 'in:individual,company_referral,company_bulk'],
            'company_id' => ['nullable', 'exists:companies,id'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'appointment_date' => ['required', 'date', 'after_or_equal:today'],
            'service_types' => ['required', 'array'],
            'service_types.*' => ['required', 'string', 'distinct', Rule::in(array_keys(Appointment::getServiceTypeOptions()))],
            'notes' => ['nullable', 'string', 'max:500'],
            'service_location' => [Rule::requiredIf(fn () => $request->type === 'company_bulk'), Rule::in(['onsite', 'clinic', 'hybrid'])],
            'event_address' => [Rule::requiredIf(fn () => $request->type === 'company_bulk' && in_array($request->service_location, ['onsite', 'hybrid'], true)), 'nullable', 'string', 'max:500'],
            'event_contact_name' => [Rule::requiredIf(fn () => $request->type === 'company_bulk'), 'nullable', 'string', 'max:255'],
            'event_contact_number' => [Rule::requiredIf(fn () => $request->type === 'company_bulk'), 'nullable', 'string', 'max:30'],
            'expected_employee_count' => [Rule::requiredIf(fn () => $request->type === 'company_bulk'), 'nullable', 'integer', 'min:1', 'max:5000'],
            'company_referral_id' => ['nullable', 'required_if:type,company_referral', 'exists:company_referrals,id'],
            'present_illness' => ['nullable', 'string', 'max:1000'],
            'past_medical_history' => ['nullable', 'string', 'max:1000'],
            'operations_accidents' => ['nullable', 'string', 'max:1000'],
            'family_history' => ['nullable', 'string', 'max:1000'],
            'allergies' => ['nullable', 'string', 'max:1000'],
            'personal_social_history' => ['nullable', 'string', 'max:1000'],
            'ob_menstrual_history' => ['nullable', 'string', 'max:1000'],
        ];
        if ($referral) {
            $rules['appointment_date'][] = 'before_or_equal:'.$referral->valid_until->toDateString();
        }

        $validator = Validator::make($request->all(), $rules);

        // For company referral, company is required
        if ($request->type === 'company_referral' && ! $request->company_id && ! $request->company_name) {
            $validator->errors()->add('company_name', 'Company is required.');
        }

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $data = $validator->validated();

        if ($data['type'] === 'individual') {
            app(IndividualAppointmentBookingService::class)->create($user, $data, $request);

            return redirect()->route('appointments.index')
                ->with('success', 'Your appointment request has been submitted and is waiting for clinic confirmation.');
        }

        $startTime = null;
        $endTime = null;

        if (in_array($data['type'], ['individual', 'company_referral'], true)) {
            $doctor = User::findOrFail($data['doctor_id']);
            if ($doctor->role !== 'doctor' || ! $doctor->is_active) {
                return back()->withErrors(['doctor_id' => 'Invalid doctor selected.'])->withInput();
            }

            $appointmentDate = new \DateTime($data['appointment_date']);
            $dayKey = strtolower($appointmentDate->format('D'));
            $dayPeriods = collect($doctor->availability ?? [])->where('day', $dayKey);

            if ($dayPeriods->isEmpty()) {
                return back()->withErrors(['doctor_id' => "Doctor not available on {$appointmentDate->format('l')}."])->withInput();
            }

            $startTime = new \DateTime($data['appointment_date'].' '.$data['start_time']);
            $endTime = (clone $startTime)->add(new \DateInterval('PT30M'));

            $withinAvailability = $dayPeriods->contains(fn ($period) => $startTime->format('H:i') >= $period['start'] && $endTime->format('H:i') <= $period['end']);
            if (! $withinAvailability) {
                return back()->withErrors(['start_time' => 'Selected time outside doctor\'s availability.'])->withInput();
            }

            $overlap = Appointment::where('doctor_id', $doctor->id)
                ->whereDate('appointment_date', $data['appointment_date'])
                ->whereNotIn('status', ['cancelled', 'rejected'])
                ->where('start_time', '<', $endTime->format('H:i'))
                ->where('end_time', '>', $startTime->format('H:i'))
                ->exists();

            if ($overlap) {
                return back()->withErrors(['start_time' => 'Time slot already booked.'])->withInput();
            }
        }

        if ($data['type'] === 'company_referral') {
            $data['referral_code'] = $referral?->referral_number
                ?? 'REF-'.now()->format('Ymd').'-'.strtoupper(Str::random(4));
        }

        DB::transaction(function () use ($data, $user, $startTime, $endTime, $referral) {
            $lockedReferral = null;
            if ($referral) {
                $lockedReferral = CompanyReferral::query()->lockForUpdate()->findOrFail($referral->id);
                abort_unless($lockedReferral->patient_id === $user->id && $lockedReferral->isSchedulable(), 422);
            }
            $appointment = Appointment::create([
                'user_id' => $user->id,
                'company_id' => $data['company_id'] ?? null,
                'company_name' => $data['company_name']
                    ?? (isset($data['company_id']) ? Company::find($data['company_id'])?->company_name : null),
                'doctor_id' => $data['doctor_id'] ?? null,
                'start_time' => $data['type'] === 'company_bulk' ? '08:00' : $startTime?->format('H:i'),
                'end_time' => $data['type'] === 'company_bulk' ? '17:00' : $endTime?->format('H:i'),
                'appointment_date' => $data['appointment_date'],
                'type' => $data['type'],
                'status' => 'pending',
                'service_types' => $data['service_types'],
                'referral_code' => $data['referral_code'] ?? null,
                'notes' => $data['notes'] ?? null,
                'service_location' => $data['service_location'] ?? null,
                'event_address' => $data['event_address'] ?? null,
                'event_contact_name' => $data['event_contact_name'] ?? null,
                'event_contact_number' => $data['event_contact_number'] ?? null,
                'expected_employee_count' => $data['expected_employee_count'] ?? null,
                'company_referral_id' => $lockedReferral?->id,
            ]);

            $lockedReferral?->update(['status' => 'scheduled', 'scheduled_at' => now()]);

            MedicalHistory::create([
                'appointment_id' => $appointment->id,
                ...collect($data)->only([
                    'present_illness', 'past_medical_history', 'operations_accidents',
                    'family_history', 'allergies', 'personal_social_history',
                    'ob_menstrual_history',
                ])->all(),
            ]);
        });

        return redirect()->route('appointments.index')
            ->with('success',
                'Appointment booked successfully!'.
                ($data['type'] === 'company_referral'
                    ? ' Referral Code: '.$data['referral_code']
                    : '')
            );
    }

    /**
     * Display the specified appointment.
     */
    public function show(Appointment $appointment, LaboratoryFormDefinition $definitions): Response
    {
        Gate::authorize('view', $appointment);

        $appointment->load([
            'user.patientProfile',
            'company',
            'medicalExamination',
            'physicalExam',
            'labResult',
            'xrayReport',
        ]);

        return Inertia::render('appointments/show', [
            'appointment' => $appointment,
            'laboratorySections' => collect($definitions->sectionsFor($appointment))
                ->map(fn (array $section): array => [
                    'label' => $section['label'],
                    'column' => $section['column'],
                ]),
        ]);
    }

    /**
     * Update appointment status (for clinic staff).
     */
    public function updateStatus(Request $request, Appointment $appointment)
    {
        $validator = Validator::make($request->all(), [
            'status' => ['required', 'string', 'in:pending,accepted,arrived,for_diagnostics,for_xray,awaiting_xray_result,for_final_evaluation,completed,cancelled'],
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator);
        }

        if ($appointment->type === 'individual' && $request->status === 'accepted') {
            app(AppointmentApprovalService::class)->accept($appointment, $request->user());

            return back()->with('success', 'Appointment confirmed successfully.');
        }

        if ($appointment->isBulkParent()) {
            app(\App\Services\BulkAppointmentEnrollmentService::class)
                ->synchronizeParentStatus($appointment, $request->status);
        } else {
            $appointment->update([
                'status' => $request->status,
            ]);
        }

        return back()->with('success', match ($request->status) {
            'accepted' => $appointment->type === 'company_bulk'
                ? 'Company bulk request approved for clinic coordination.'
                : 'Appointment accepted and forwarded to doctor.',
            'arrived' => 'Patient marked as arrived.',
            'completed' => 'Appointment marked as completed.',
            'cancelled' => 'Appointment has been cancelled.',
            default => 'Appointment status updated.',
        });
    }

    public function approve(Request $request, Appointment $appointment)
    {
        app(AppointmentApprovalService::class)->accept($appointment, $request->user());

        return back()->with('success', 'Appointment confirmed successfully.');
    }

    public function reject(Request $request, Appointment $appointment)
    {
        $validated = $request->validate([
            'reason' => ['required', Rule::in(AppointmentApprovalService::REJECTION_REASONS)],
            'details' => ['nullable', 'string', 'max:500', 'required_if:reason,other'],
        ], [
            'details.required_if' => 'Please provide a short explanation when selecting Other.',
        ]);

        app(AppointmentApprovalService::class)->reject(
            $appointment,
            $request->user(),
            $validated['reason'],
            $validated['details'] ?? null,
        );

        return back()->with('success', 'Appointment request rejected.');
    }

    /**
     * Get available doctors and slots for a date (API).
     */
    public function availableDoctors(Request $request)
    {
        $validated = $request->validate([
            'date' => ['required', 'date', 'after_or_equal:today', 'before_or_equal:'.today()->addDays(30)->format('Y-m-d')],
        ]);
        $date = $validated['date'];
        $dayKey = strtolower(date('D', strtotime($date)));

        $doctors = User::where('role', 'doctor')
            ->where('is_active', true)
            ->orderBy('first_name')
            ->get(['id', 'first_name', 'last_name', 'specialization', 'sex', 'availability']);

        $doctors->each(function ($doctor) use ($dayKey, $date) {
            $periods = collect($doctor->availability ?? [])->where('day', $dayKey);
            if ($periods->isNotEmpty()) {
                $doctor->availability_slot = $periods->first();
                $doctor->free_slots = $periods->sum(fn ($period) => count($this->generateAvailableTimes($period['start'], $period['end'], $doctor->id, $date)));
            }
        });

        return response()->json(
            $doctors
                ->filter(fn ($doctor) => ($doctor->free_slots ?? 0) > 0)
                ->values()
                ->makeHidden('availability')
        );
    }

    /**
     * Get available companies for dropdown (API).
     */
    public function getCompanies(Request $request)
    {
        $search = $request->get('search', '');

        $companies = Company::where('status', 'active')
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
            ->get(['id', 'first_name', 'last_name', 'specialization', 'sex']);

        return response()->json($doctors);
    }

    /**
     * Get specific doctor's availability (API).
     */
    public function getDoctorAvailability(Request $request, $doctorId)
    {
        $doctor = User::where('role', 'doctor')->where('is_active', true)->findOrFail($doctorId);

        $availability = $doctor->availability ?? [];
        $periods = collect($availability);
        $slots = $periods->groupBy('day');

        $date = $request->get('date');
        $availableDates = [];

        // Next 30 days available dates
        $startDate = now();
        for ($i = 0; $i < 30; $i++) {
            $checkDate = $startDate->copy()->addDays($i);
            $dayKey = strtolower($checkDate->format('D'));
            if ($slots->has($dayKey)) {
                $availableDates[] = $checkDate->format('Y-m-d');
            }
        }

        $availableTimes = [];
        if ($date) {
            $dayKey = strtolower(date('D', strtotime($date)));
            $availableTimes = $slots->get($dayKey, collect())->flatMap(fn ($period) => $this->generateAvailableTimes($period['start'], $period['end'], $doctorId, $date))->unique()->sort()->values()->all();
        }

        return response()->json([
            'doctor' => [
                'id' => $doctor->id,
                'name' => $doctor->first_name.' '.$doctor->last_name,
                'specialization' => $doctor->specialization,
            ],
            'slots' => $slots->map(fn ($items) => $items->values())->toArray(),
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
                ->whereNotIn('status', ['cancelled', 'rejected'])
                ->where(function ($q) use ($startStr, $endStr) {
                    $q->where('start_time', '<', $endStr)
                        ->where('end_time', '>', $startStr);
                })
                ->exists();

            if (! $overlap) {
                $times[] = $startStr;
            }

            $current->add(new \DateInterval('PT30M'));
        }

        return $times;
    }

    /**
     * Admin: Display all appointments with advanced filtering.
     */
    public function adminIndex(AdminAppointmentIndexRequest $request): Response
    {
        $bulkOnly = $request->routeIs('admin.bulk-appointments.index');
        $filters = $request->validated();
        $search = trim((string) ($filters['search'] ?? ''));
        $status = (string) ($filters['status'] ?? '');
        $type = (string) ($filters['type'] ?? '');
        $dateFilter = (string) ($filters['date_filter'] ?? '');
        $dateFrom = (string) ($filters['date_from'] ?? '');
        $dateTo = (string) ($filters['date_to'] ?? '');
        $doctorId = $filters['doctor_id'] ?? null;
        $companyId = $filters['company_id'] ?? null;
        $sort = (string) ($filters['sort'] ?? '');
        $direction = (string) ($filters['direction'] ?? 'asc');

        $query = Appointment::with(['user.patientProfile', 'company', 'doctor']);

        $query->when(
            $bulkOnly,
            fn ($query) => $query->bulkParents()->withCount([
                'bulkEmployees',
                'bulkEmployees as completed_employees_count' => fn ($employees) => $employees->where('status', 'completed'),
                'bulkEmployees as awaiting_results_count' => fn ($employees) => $employees->whereIn('status', ['awaiting_xray_result', 'for_final_evaluation']),
            ]),
            fn ($query) => $query->where('type', '!=', 'company_bulk'),
        );

        if ($search) {
            $nameTokens = preg_split('/\s+/', $search, -1, PREG_SPLIT_NO_EMPTY) ?: [$search];
            $query->where(function ($query) use ($search, $nameTokens) {
                $query->whereHas('user', function ($user) use ($search, $nameTokens) {
                    $user->where(function ($identity) use ($search, $nameTokens) {
                        $identity->where('email', 'like', "%{$search}%")
                            ->orWhere('contact', 'like', "%{$search}%")
                            ->orWhere(function ($name) use ($nameTokens) {
                                foreach ($nameTokens as $token) {
                                    $name->where(function ($part) use ($token) {
                                        $part->where('first_name', 'like', "%{$token}%")
                                            ->orWhere('middle_name', 'like', "%{$token}%")
                                            ->orWhere('last_name', 'like', "%{$token}%");
                                    });
                                }
                            });
                    });
                })
                    ->orWhereHas('doctor', function ($doctor) use ($nameTokens) {
                        foreach ($nameTokens as $token) {
                            $doctor->where(function ($part) use ($token) {
                                $part->where('first_name', 'like', "%{$token}%")
                                    ->orWhere('middle_name', 'like', "%{$token}%")
                                    ->orWhere('last_name', 'like', "%{$token}%");
                            });
                        }
                    })
                    ->orWhereHas('company', fn ($company) => $company->where('company_name', 'like', "%{$search}%"))
                    ->orWhere('company_name', 'like', "%{$search}%")
                    ->orWhere('referral_code', 'like', "%{$search}%")
                    ->when(ctype_digit($search), fn ($appointment) => $appointment->orWhere('appointments.id', (int) $search));
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

        if ($dateFilter === 'today') {
            $query->whereDate('appointment_date', today());
        } elseif ($dateFilter === 'upcoming') {
            $query->whereDate('appointment_date', '>', today());
        } elseif ($dateFilter === 'past') {
            $query->whereDate('appointment_date', '<', today());
        }

        if ($doctorId) {
            $query->where('doctor_id', $doctorId);
        }

        if ($companyId) {
            $query->where('company_id', $companyId);
        }

        if ($sort !== '') {
            $query->orderBy($sort, $direction);
        } else {
            $query->orderByDesc('created_at')->orderByDesc('id');
        }

        $appointments = $query->paginate($this->perPage($request))->withQueryString();

        return Inertia::render('admin/appointments/index', [
            'appointments' => $appointments,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'type' => $type,
                'date_filter' => $dateFilter,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'doctor_id' => (string) ($doctorId ?? ''),
                'company_id' => (string) ($companyId ?? ''),
                'sort' => $sort,
                'direction' => $direction,
            ],
            'doctors' => User::query()
                ->where('role', 'doctor')
                ->where('is_active', true)
                ->orderBy('first_name')
                ->get(['id', 'first_name', 'last_name']),
            'companies' => Company::query()
                ->orderBy('company_name')
                ->get(['id', 'company_name']),
            'statusOptions' => [
                'pending',
                'accepted',
                'arrived',
                'for_diagnostics',
                'for_xray',
                'for_final_evaluation',
                'awaiting_xray_result',
                'completed',
                'rejected',
                'cancelled',
            ],
            'typeOptions' => Appointment::getTypeOptions(),
            'bulkOnly' => $bulkOnly,
            'pendingRequestsCount' => Appointment::query()
                ->where('type', 'individual')
                ->where('status', 'pending')
                ->count(),
        ]);
    }

    /**
     * Admin: Display today's active clinic queue.
     */
    public function today(TodayAppointmentIndexRequest $request): Response
    {
        $search = trim((string) $request->validated('search', ''));
        $today = today();
        $baseQuery = Appointment::query()
            ->whereDate('appointment_date', $today)
            ->whereNotIn('status', ['rejected', 'cancelled'])
            ->whereHas('user', fn ($query) => $query->where('role', 'patient'));

        $summary = (clone $baseQuery)
            ->selectRaw('status, COUNT(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        $query = (clone $baseQuery)->with([
            'user:id,first_name,middle_name,last_name,email,contact',
            'company:id,company_name',
            'doctor:id,first_name,middle_name,last_name',
        ]);

        if ($search !== '') {
            $nameTokens = preg_split('/\s+/', $search, -1, PREG_SPLIT_NO_EMPTY) ?: [$search];
            $query->whereHas('user', function ($patient) use ($search, $nameTokens): void {
                $patient->where(function ($identity) use ($search, $nameTokens): void {
                    $identity->where('email', 'like', "%{$search}%")
                        ->orWhere('contact', 'like', "%{$search}%")
                        ->orWhere(function ($name) use ($nameTokens): void {
                            foreach ($nameTokens as $token) {
                                $name->where(fn ($part) => $part
                                    ->where('first_name', 'like', "%{$token}%")
                                    ->orWhere('middle_name', 'like', "%{$token}%")
                                    ->orWhere('last_name', 'like', "%{$token}%"));
                            }
                        });
                });
            });
        }

        $appointments = $query
            ->orderByRaw('CASE WHEN start_time IS NULL THEN 1 ELSE 0 END')
            ->orderBy('start_time')
            ->orderByRaw('COALESCE(arrived_at, created_at)')
            ->orderBy('id')
            ->paginate($this->perPage($request))
            ->withQueryString();

        $inProgressStatuses = ['arrived', 'for_diagnostics', 'for_xray', 'for_final_evaluation'];

        return Inertia::render('admin/appointments/today', [
            'appointments' => $appointments,
            'filters' => ['search' => $search],
            'today' => $today->toDateString(),
            'summary' => [
                'total' => (int) $summary->sum(),
                'waiting' => (int) collect(['pending', 'accepted'])->sum(fn ($status) => $summary->get($status, 0)),
                'in_progress' => (int) collect($inProgressStatuses)->sum(fn ($status) => $summary->get($status, 0)),
                'completed' => (int) $summary->get('completed', 0),
            ],
        ]);
    }

    /**
     * Admin: Show form for creating appointment.
     */
    public function adminCreate(Request $request): Response
    {
        $companies = Company::where('status', 'active')
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

        return redirect()->route('admin.appointments.index')
            ->with('success', 'Appointment created successfully!');
    }

    /**
     * Staff: Appointment dashboard (view, search, filter, walk-in creation)
     */
    public function staffDashboard(Request $request): Response
    {

        $search = $request->get('search', '');
        $status = $request->get('status', '');
        $type = $request->get('type', '');

        $query = Appointment::with(['user.patientProfile', 'doctor', 'company'])
            ->when($search, fn ($q) => $q->whereHas('user', fn ($q) => $q->where('first_name', 'like', "%{$search}%")
                ->orWhere('last_name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")
            )
            )
            ->when($status, fn ($q) => $q->where('status', $status))
            ->when($type, fn ($q) => $q->where('type', $type))
            ->orderByRaw("CASE
            WHEN status = 'pending'   THEN 1
            WHEN status = 'accepted'  THEN 2
            WHEN status = 'arrived'   THEN 3
            WHEN status = 'completed' THEN 4
            WHEN status = 'cancelled' THEN 5
            ELSE 6 END")
            ->orderBy('appointment_date', 'asc')
            ->paginate($this->perPage($request))
            ->withQueryString();

        return Inertia::render('staff/appointments/index', [
            'appointments' => $query,
            'doctors' => User::where('role', 'doctor')->where('is_active', true)
                ->get(['id', 'first_name', 'last_name']),
            'serviceTypes' => Appointment::getServiceTypeOptions(),
            'statusOptions' => ['pending', 'accepted', 'arrived', 'for_diagnostics', 'for_xray', 'for_final_evaluation', 'completed', 'cancelled'],
            'filters' => compact('search', 'status', 'type'),
        ]);
    }

    /**
     * Staff: Create walk-in appointment
     */
    public function staffStore(Request $request)
    {
        try {
            $validated = $request->validate([
                // Existing patient OR new patient fields
                'patient_type' => ['required', 'in:existing,new'],
                'user_id' => ['required_if:patient_type,existing', 'nullable', 'exists:users,id'],

                // New patient fields
                'first_name' => ['required_if:patient_type,new', 'nullable', 'string', 'max:255'],
                'last_name' => ['required_if:patient_type,new', 'nullable', 'string', 'max:255'],
                'email' => ['required_if:patient_type,new', 'nullable', 'email', 'unique:users,email'],
                'contact' => ['nullable', 'string', 'max:11'],

                // ✅ Patient profile fields
                'birthdate' => ['nullable', 'date'],
                'sex' => ['nullable', 'in:Male,Female'],
                'civil_status' => ['nullable', 'in:single,married,widowed,separated'],

                // Appointment fields
                'doctor_id' => ['required', 'exists:users,id'],
                'appointment_date' => ['required', 'date', 'after_or_equal:today'],
                'start_time' => ['required', 'date_format:H:i'],
                'service_types' => ['required', 'array', 'min:1'],
                'notes' => ['nullable', 'string', 'max:500'],
            ]);

            // Resolve or create the patient
            if ($validated['patient_type'] === 'new') {
                $user = User::create([
                    'first_name' => $validated['first_name'],
                    'last_name' => $validated['last_name'],
                    'email' => $validated['email'],
                    'contact' => $validated['contact'] ?? null,
                    'password' => bcrypt('walkin-'.now()->timestamp), // temp password
                    'role' => 'patient',
                    'is_active' => true,
                ]);

                // ✅ Create profile with staff-filled data
                \App\Models\PatientProfile::create([
                    'user_id' => $user->id,
                    'birthdate' => $validated['birthdate'] ?? null,
                    'sex' => $validated['sex'] ?? null,
                    'civil_status' => $validated['civil_status'] ?? null,
                ]);

            } else {
                $user = User::findOrFail($validated['user_id']);

                // ✅ Update existing patient's profile if staff filled anything in
                if ($user->patientProfile) {
                    $user->patientProfile->update([
                        'birthdate' => $validated['birthdate'] ?? $user->patientProfile->birthdate,
                        'sex' => $validated['sex'] ?? $user->patientProfile->sex,
                        'civil_status' => $validated['civil_status'] ?? $user->patientProfile->civil_status,
                    ]);
                }
            }

            $start = new \DateTime($validated['appointment_date'].' '.$validated['start_time']);
            $end = (clone $start)->add(new \DateInterval('PT30M'));

            Appointment::create([
                'user_id' => $user->id,
                'doctor_id' => $validated['doctor_id'],
                'appointment_date' => $validated['appointment_date'],
                'start_time' => $start->format('H:i'),
                'end_time' => $end->format('H:i'),
                'service_types' => $validated['service_types'],
                'notes' => $validated['notes'] ?? null,
                'type' => 'walk_in',
                'status' => 'arrived',
            ]);

            return back()->with('success', 'Walk-in appointment created'.($validated['patient_type'] === 'new' ? " for new patient {$user->first_name} {$user->last_name}." : '.'));

        } catch (\Throwable $exception) {
            Log::error('Walk-in appointment creation failed.', [
                'staff_id' => $request->user()->id,
                'exception' => $exception,
            ]);

            return back()->withInput()->with('error', 'The walk-in appointment could not be created. Please try again.');
        }
    }

    /**
     * Staff: Update appointment status
     */
    public function staffUpdateStatus(Request $request, Appointment $appointment)
    {
        $request->validate([
            'status' => ['required', 'in:pending,accepted,arrived,for_diagnostics,for_xray,awaiting_xray_result,for_final_evaluation,completed,cancelled'],
        ]);

        $appointment->update(['status' => $request->status]);

        return back()->with('success', match ($request->status) {
            'accepted' => 'Appointment accepted.',
            'arrived' => 'Patient marked as arrived.',
            'for_diagnostics' => 'Sent to diagnostics.',
            'for_xray' => 'Sent to X-Ray.',
            'for_final_evaluation' => 'Sent for final evaluation.',
            'completed' => 'Appointment completed.',
            'cancelled' => 'Appointment cancelled.',
            default => 'Status updated.',
        });
    }

    /**
     * Staff: Edit appointment details
     */
    public function staffUpdate(Request $request, Appointment $appointment)
    {
        $validated = $request->validate([
            'doctor_id' => ['required', 'exists:users,id'],
            'appointment_date' => ['required', 'date'],
            'start_time' => ['required', 'date_format:H:i'],
            'service_types' => ['required', 'array', 'min:1'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $start = new \DateTime($validated['appointment_date'].' '.$validated['start_time']);
        $end = (clone $start)->add(new \DateInterval('PT30M'));

        $appointment->update([
            ...$validated,
            'start_time' => $start->format('H:i'),
            'end_time' => $end->format('H:i'),
        ]);

        return back()->with('success', 'Appointment updated.');
    }

    /**
     * Patient search for walk-in autocomplete (API)
     */
    public function searchPatients(Request $request)
    {
        return response()->json(
            User::where('role', 'patient')
                ->where('is_active', true)
                ->where(fn ($q) => $q->where('first_name', 'like', "%{$request->q}%")
                    ->orWhere('last_name', 'like', "%{$request->q}%")
                    ->orWhere('email', 'like', "%{$request->q}%")
                )
                ->limit(10)
                ->get(['id', 'first_name', 'last_name', 'email'])
        );
    }

    /**
     * Staff appointment list - filtered by role and status/service_type.
     */
    public function staffIndex(Request $request, string $role): Response
    {
        $search = $request->get('search', '');
        $status = $request->get('status', '');
        $companyId = $request->integer('company_id') ?: null;
        $date = $request->get('date', '');
        $batch = $request->get('batch', '');

        $query = Appointment::with(['user', 'company', 'physicalExam', 'labResult', 'xrayReport', 'medicalExamination'])
            ->whereHas('user', fn ($user) => $user->where('role', 'patient'));

        if ($role === 'doctor') {
            $query->where(function ($q) {
                $q->where(function ($sub) {
                    $sub->whereIn('status', ['accepted', 'arrived'])
                        ->whereDoesntHave('physicalExam');
                })
                    ->orWhere('status', 'for_final_evaluation')
                    ->orWhere(function ($sub) {
                        $sub->where('status', 'completed')
                            ->whereHas('medicalExamination', fn ($examination) => $examination
                                ->whereNotNull('finalized_at')
                                ->whereNull('released_at'));
                    });
            });

        } elseif ($role === 'medtech') {
            $query->where('status', 'for_diagnostics')
                ->where(function ($query) {
                    $query->whereDoesntHave('labResult')
                        ->orWhereHas('labResult', fn ($result) => $result->where('status', '!=', 'finalized'));
                });

        } elseif ($role === 'radtech') {
            $query->whereIn('status', ['for_xray', 'awaiting_xray_result'])
                ->where(function ($query) {
                    $query->whereDoesntHave('xrayReport')
                        ->orWhereHas('xrayReport', fn ($result) => $result->where('is_completed', false));
                });
        }

        if ($status) {
            $query->where('status', $status);
        }

        $query->when($companyId, fn ($query) => $query->where('company_id', $companyId))
            ->when($date, fn ($query) => $query->whereDate('appointment_date', $date))
            ->when($batch, fn ($query) => $query->where('batch_id', $batch));

        // Search logic
        if ($search) {
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%");
            });
        }

        $appointments = $query->orderBy('updated_at', 'desc')->paginate($this->perPage($request))->withQueryString();

        // Map the role to the correct Inertia page path based on your routes
        $pagePath = match ($role) {
            'doctor' => 'doctor/appointments/index', // Adjust if your file is elsewhere
            'medtech' => 'medtech/appointments/index',
            'radtech' => 'radtech/appointments/index',
            default => "{$role}/appointments/index"
        };

        return Inertia::render($pagePath, [
            'appointments' => $appointments,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'role' => $role,
                'company_id' => $companyId,
                'date' => $date,
                'batch' => $batch,
            ],
            'pageTitle' => ucfirst($role).' Queue',
        ]);

    }
}
