<?php

use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\CompanyDashboardController;
use App\Http\Controllers\DoctorAvailabilityController;
use App\Http\Controllers\DoctorDashboardController;
use App\Http\Controllers\LaboratoryController;
use App\Http\Controllers\MedTechDashboardController;
use App\Http\Controllers\PatientDashboardController;
use App\Http\Controllers\PhysicalExamController;
use App\Http\Controllers\RadTechDashboardController;
use App\Http\Controllers\ReceptionistDashboardController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\XrayController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (! auth()->check()) {
        return Inertia::render('welcome');
    }

    return redirect(match (auth()->user()->role) {
        'admin' => '/admin/dashboard',
        'doctor' => '/doctor/dashboard',
        'medtech' => '/medtech/dashboard',
        'radtech' => '/radtech/dashboard',
        'company' => '/company/dashboard',
        'receptionist' => '/receptionist/dashboard',
        default => '/dashboard',
    });
})->name('home');

Route::middleware(['auth', 'staff.verified'])->group(function () {
    Route::get('/dashboard', PatientDashboardController::class)
        ->middleware('patient.only')
        ->name('dashboard');

    Route::middleware('role:patient,company')->group(function () {
        Route::get('/appointment', [AppointmentController::class, 'create'])->name('appointment.create');
        Route::get('/appointments', [AppointmentController::class, 'index'])->name('appointments.index');
        Route::get('/appointments/create', [AppointmentController::class, 'create'])->name('appointments.create');
        Route::post('/appointments', [AppointmentController::class, 'store'])->name('appointments.store');
        Route::get('/appointments/{appointment}', [AppointmentController::class, 'show'])->name('appointments.show');

        Route::get('/api/companies', [AppointmentController::class, 'getCompanies'])->name('api.companies');
        Route::get('/api/available-doctors', [AppointmentController::class, 'availableDoctors'])->name('api.available-doctors');
        Route::get('/api/doctors', [AppointmentController::class, 'getDoctors'])->name('api.doctors');
        Route::get('/api/doctors/{doctorId}/availability', [AppointmentController::class, 'getDoctorAvailability'])->name('api.doctor.availability');
    });

    Route::middleware('role:company')->group(function () {
        Route::get('/company/dashboard', CompanyDashboardController::class)->name('company.dashboard');
        Route::post('/company/appointments/bulk', [AppointmentController::class, 'companyBulkStore'])->name('company.appointments.bulk');
        Route::post('/appointments/bulk', [AppointmentController::class, 'bulkStore'])->name('appointments.bulk');
    });

    Route::middleware('role:receptionist')->group(function () {
        Route::get('/receptionist/dashboard', ReceptionistDashboardController::class)->name('receptionist.dashboard');
    });

    Route::middleware('role:receptionist')->prefix('staff')->name('staff.')->group(function () {
        Route::get('/', fn () => redirect()->route('staff.appointments.index'))->name('dashboard');
        Route::get('/appointments', [AppointmentController::class, 'staffDashboard'])->name('appointments.index');
        Route::post('/appointments', [AppointmentController::class, 'staffStore'])->name('appointments.store');
        Route::patch('/appointments/{appointment}', [AppointmentController::class, 'staffUpdate'])->name('appointments.update');
        Route::patch('/appointments/{appointment}/status', [AppointmentController::class, 'staffUpdateStatus'])->name('appointments.status');
        Route::get('/patients/search', [AppointmentController::class, 'searchPatients'])->name('patients.search');
    });

    Route::middleware('role:doctor')->prefix('doctor')->name('doctor.')->group(function () {
        Route::get('/dashboard', DoctorDashboardController::class)->name('dashboard');
        Route::get('/appointments', [AppointmentController::class, 'staffIndex'])->defaults('role', 'doctor')->name('appointments');
        Route::get('/doctor-availability', [DoctorAvailabilityController::class, 'adminIndex'])->name('doctor-availability.index');
        Route::patch('/doctor-availability', [DoctorAvailabilityController::class, 'adminUpdate'])->name('doctor-availability.update');
        Route::get('/physical-exam-form/{appointmentId}', [PhysicalExamController::class, 'create'])->name('physical-exams.create');
        Route::post('/physical-exam-form/{appointmentId}', [PhysicalExamController::class, 'store'])->name('physical-exams.store');
        Route::get('/final-evaluation/{appointmentId}', [PhysicalExamController::class, 'final'])->name('final-evaluation');
        Route::post('/final-evaluation/{appointmentId}', [PhysicalExamController::class, 'finalStore'])->name('final-evaluation.store');
    });

    Route::middleware('role:medtech')->prefix('medtech')->name('medtech.')->group(function () {
        Route::get('/dashboard', MedTechDashboardController::class)->name('dashboard');
        Route::get('/appointments', [AppointmentController::class, 'staffIndex'])->defaults('role', 'medtech')->name('appointments');
        Route::get('/lab-results/{appointment}', [LaboratoryController::class, 'create'])->name('lab-results.create');
        Route::post('/lab-results/{appointment}', [LaboratoryController::class, 'store'])->name('lab-results.store');
    });

    Route::middleware('role:radtech')->prefix('radtech')->name('radtech.')->group(function () {
        Route::get('/dashboard', RadTechDashboardController::class)->name('dashboard');
        Route::get('/appointments', [AppointmentController::class, 'staffIndex'])->defaults('role', 'radtech')->name('appointments');
        Route::get('/xrays/{appointment}', [XrayController::class, 'create'])->name('xrays.create');
        Route::post('/xrays/{appointment}', [XrayController::class, 'store'])->name('xrays.store');
    });

    Route::middleware('role:admin')->prefix('admin')->name('admin.')->group(function () {
        Route::get('/dashboard', AdminDashboardController::class)->name('dashboard');
        Route::get('/doctor-availability', [DoctorAvailabilityController::class, 'adminIndex'])->name('doctor-availability.index');
        Route::patch('/doctor-availability', [DoctorAvailabilityController::class, 'adminUpdate'])->name('doctor-availability.update');

        Route::resource('staff', StaffController::class)->except('show');
        Route::patch('/staff/{staff}/toggle-active', [StaffController::class, 'toggleActive'])->name('staff.toggle-active');
        Route::post('/staff/{staff}/signature', [StaffController::class, 'uploadSignature'])->name('staff.signature');

        Route::get('/appointments', [AppointmentController::class, 'adminIndex'])->name('appointments.index');
        Route::get('/appointments/create', [AppointmentController::class, 'adminCreate'])->name('appointments.create');
        Route::post('/appointments', [AppointmentController::class, 'adminStore'])->name('appointments.store');
        Route::get('/appointments/{appointment}', [AppointmentController::class, 'show'])->name('appointments.show');
        Route::patch('/appointments/{appointment}/status', [AppointmentController::class, 'updateStatus'])->name('appointments.update-status');

        Route::resource('companies', CompanyController::class)->except('show');
        Route::patch('/companies/{company}/toggle-active', [CompanyController::class, 'toggleActive'])->name('companies.toggle-active');
        Route::post('/companies/{company}/resend-invitation', [CompanyController::class, 'resendInvitation'])->name('companies.resend-invitation');

        Route::get('/analytics', [AdminDashboardController::class, 'analytics'])->name('analytics');
        Route::get('/reports', [AdminDashboardController::class, 'reports'])->name('reports');
    });
});

require __DIR__.'/settings.php';

Route::get('/email/verify', function (Request $request) {
    if ($request->user()->hasVerifiedEmail()) {
        return redirect()->route('dashboard');
    }

    return Inertia::render('auth/verify-email', [
        'status' => $request->session()->get('status'),
    ]);
})->middleware('auth')->name('verification.notice');

Route::post('/email/verification-notification', function (Request $request) {
    $user = $request->user();

    if ($user->hasVerifiedEmail()) {
        return redirect()->route('dashboard')->with('status', 'already-verified');
    }

    $user->sendEmailVerificationNotification();

    return back()->with('status', 'verification-link-sent');
})->middleware(['auth', 'throttle:6,1'])->name('verification.send');
