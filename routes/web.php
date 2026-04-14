<?php

use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\CompanyDashboardController;
use App\Http\Controllers\DoctorDashboardController;
use App\Http\Controllers\MedTechDashboardController;
use App\Http\Controllers\PatientDashboardController;
use App\Http\Controllers\RadTechDashboardController;
use App\Http\Controllers\LaboratoryController;
use App\Http\Controllers\DoctorAvailabilityController;
use App\Http\Controllers\PhysicalExamController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\XrayController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\WalkInController;



Route::get('/dashboard', [PatientDashboardController::class, '__invoke'])->name('dashboard');
Route::get('/appointment', [AppointmentController::class, 'create'])->name('appointment.create');

// 2. SMART REDIRECTS
Route::get('/', function () {
    if (auth()->check()) {
        // Redirect patients/staff to their correct spots
        return match(auth()->user()->role) {
            'admin'    => redirect('/admin/dashboard'),
            'doctor'   => redirect('/doctor/dashboard'),
            'medtech'  => redirect('/medtech/dashboard'),
            'radtech'  => redirect('/radtech/dashboard'),
            'company'  => redirect('/company/dashboard'),
            // Patients or anyone else goes to the unified dashboard
            default    => redirect('/dashboard'),
        };
    }

    // Guest: Go to the public dashboard (Landing Page)
    return redirect('/dashboard'); 
})->name('home');




Route::middleware(['auth', 'staff.verified'])->group(function () {

    // Dashboard Routes
    Route::get('/admin/dashboard', [AdminDashboardController::class, '__invoke'])->middleware('role:admin');
    Route::get('/doctor/dashboard', [DoctorDashboardController::class, '__invoke'])->middleware('role:doctor')->name('doctor.dashboard');
    Route::get('/medtech/dashboard', [MedTechDashboardController::class, '__invoke'])->middleware('role:medtech');
    Route::get('/radtech/dashboard', [RadTechDashboardController::class, '__invoke'])->middleware('role:radtech');
    Route::get('/company/dashboard', [CompanyDashboardController::class, '__invoke'])->middleware('role:company')->name('company.dashboard');
    Route::post('/company/appointments/bulk', [AppointmentController::class, 'companyBulkStore'])->middleware('role:company')->name('company.appointments.bulk');
    
   // Doctor Routes
Route::middleware('role:doctor')->prefix('doctor')->name('doctor.')->group(function () {
    Route::get('/appointments', [AppointmentController::class, 'staffIndex'])->defaults('role', 'doctor');

    Route::get('/doctor-availability', [DoctorAvailabilityController::class, 'adminIndex'])->name('doctor-availability.index');
    Route::patch('/doctor-availability', [DoctorAvailabilityController::class, 'adminUpdate'])->name('doctor-availability.update');

    // Change {appointmentid} to {appointmentId}
    Route::get('/physical-exam-form/{appointmentId}', [PhysicalExamController::class, 'create'])->name('physical-exams.create');
    Route::post('/physical-exam-form/{appointmentId}', [PhysicalExamController::class, 'store'])->name('physical-exams.store');
    Route::get('/final-evaluation/{appointmentId}', [PhysicalExamController::class, 'final'])
    ->name('final-evaluation');

Route::post('/final-evaluation/{appointmentId}', [PhysicalExamController::class, 'finalStore'])
    ->name('final-evaluation.store');
});

    // MedTech Routes
    Route::middleware('role:medtech')->prefix('medtech')->name('medtech.')->group(function () {
        Route::get('/appointments', [AppointmentController::class, 'staffIndex'])
    ->defaults('role', 'medtech')
    ->name('appointments');
        Route::get('/lab-results/{appointment}', [LaboratoryController::class, 'create'])->name('lab-results.create');
        Route::post('/lab-results/{appointment}', [LaboratoryController::class, 'store'])->name('lab-results.store');
    });

    // RadTech Routes
    Route::middleware('role:radtech')->prefix('radtech')->name('radtech.')->group(function () {
       Route::get('/appointments', [AppointmentController::class, 'staffIndex'])
    ->defaults('role', 'radtech')
    ->name('appointments');
        Route::get('/xrays/{appointment}', [XrayController::class, 'create'])->name('xrays.create');
        Route::post('/xrays/{appointment}', [XrayController::class, 'store'])->name('xrays.store');
    });

    // Appointment Routes
    Route::get('/appointments', [AppointmentController::class, 'index'])->name('appointments.index');
    Route::get('/appointments/create', [AppointmentController::class, 'create'])->name('appointments.create');
    Route::post('/appointments', [AppointmentController::class, 'store'])->name('appointments.store');
    Route::get('/appointments/{appointment}', [AppointmentController::class, 'show'])->name('appointments.show');
    Route::patch('/appointments/{appointment}/status', [AppointmentController::class, 'updateStatus'])->name('appointments.update-status');
    Route::post('/appointments/bulk', [AppointmentController::class, 'bulkStore'])->name('appointments.bulk');
    
    // API for companies dropdown
    Route::get('/api/companies', [AppointmentController::class, 'getCompanies'])->name('api.companies');

    // API for doctor availability
    Route::get('/api/available-doctors', [AppointmentController::class, 'availableDoctors'])->name('api.available-doctors');
    
    // New APIs for doctor-first flow
    Route::get('/api/doctors', [AppointmentController::class, 'getDoctors'])->name('api.doctors');
    Route::get('/api/doctors/{doctorId}/availability', [AppointmentController::class, 'getDoctorAvailability'])->name('api.doctor.availability');

    // Admin Staff Management Routes

    Route::middleware(['role:admin'])->prefix('admin')->name('admin.')->group(function () {
        Route::get('/doctor-availability', [DoctorAvailabilityController::class, 'adminIndex'])->name('doctor-availability.index');
        Route::patch('/doctor-availability', [DoctorAvailabilityController::class, 'adminUpdate'])->name('doctor-availability.update');
        Route::get('/staff', [StaffController::class, 'index'])->name('staff.index');

        Route::get('/staff/create', [StaffController::class, 'create'])->name('staff.create');
        Route::post('/staff', [StaffController::class, 'store'])->name('staff.store');
        Route::get('/staff/{staff}/edit', [StaffController::class, 'edit'])->name('staff.edit');
        Route::put('/staff/{staff}', [StaffController::class, 'update'])->name('staff.update');
        Route::delete('/staff/{staff}', [StaffController::class, 'destroy'])->name('staff.destroy');
        Route::patch('/staff/{staff}/toggle-active', [StaffController::class, 'toggleActive'])->name('staff.toggle-active');
        Route::post('/staff/{staff}/signature', [StaffController::class, 'uploadSignature'])->name('staff.signature');

        // Admin Appointment Management
        Route::get('/appointments', [AppointmentController::class, 'adminIndex'])->name('appointments.index');
        Route::get('/appointments/create', [AppointmentController::class, 'adminCreate'])->name('appointments.create');
        Route::post('/appointments', [AppointmentController::class, 'adminStore'])->name('appointments.store');
        Route::get('/appointments/{appointment}', [AppointmentController::class, 'show'])->name('appointments.show');
        Route::patch('/appointments/{appointment}/status', [AppointmentController::class, 'updateStatus'])->name('appointments.update-status');
        
        // Admin Company Management
        Route::get('/companies', [CompanyController::class, 'index'])->name('companies.index');
        Route::get('/companies/create', [CompanyController::class, 'create'])->name('companies.create');
        Route::post('/companies', [CompanyController::class, 'store'])->name('companies.store');
        Route::get('/companies/{company}/edit', [CompanyController::class, 'edit'])->name('companies.edit');
        Route::put('/companies/{company}', [CompanyController::class, 'update'])->name('companies.update');
        Route::delete('/companies/{company}', [CompanyController::class, 'destroy'])->name('companies.destroy');
        Route::patch('/companies/{company}/toggle-active', [CompanyController::class, 'toggleActive'])->name('companies.toggle-active');
        Route::post('/companies/{company}/resend-invitation', [CompanyController::class, 'resendInvitation'])->name('companies.resend-invitation');

        // Admin Analytics
        Route::get('/analytics', [AdminDashboardController::class, 'analytics'])->name('analytics');
        
        // Admin Reports
        Route::get('/reports', [AdminDashboardController::class, 'reports'])->name('reports');

      
    });

});

require __DIR__.'/settings.php';

// Email Verification Routes
Route::get('/email/verify', function (Illuminate\Http\Request $request) {
    return Inertia::render('auth/verify-email', [
        'status' => $request->session()->get('status'),
    ]);
})->middleware('auth')->name('verification.notice');


Route::post('/email/verification-notification', function (Illuminate\Http\Request $request) {
    $user = $request->user();
    
    if ($user->hasVerifiedEmail()) {
        return back()->with('status', 'already-verified');
    }

    $user->sendEmailVerificationNotification();

    return back()->with('status', 'verification-link-sent');
})->middleware(['auth', 'throttle:6,1'])->name('verification.send');

