<?php

use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\ClinicalDocumentController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\CompanyDashboardController;
use App\Http\Controllers\CompanyEmployeeImportController;
use App\Http\Controllers\CompanyReferralController;
use App\Http\Controllers\DoctorAvailabilityController;
use App\Http\Controllers\DoctorDashboardController;
use App\Http\Controllers\ForecastController;
use App\Http\Controllers\GlobalSearchController;
use App\Http\Controllers\LaboratoryController;
use App\Http\Controllers\MedTechDashboardController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OnsiteEventController;
use App\Http\Controllers\PatientDashboardController;
use App\Http\Controllers\PatientVisitForecastController;
use App\Http\Controllers\PhysicalExamController;
use App\Http\Controllers\RadTechDashboardController;
use App\Http\Controllers\ReceptionistDashboardController;
use App\Http\Controllers\ReceptionistWalkInController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\TemporaryPasswordController;
use App\Http\Controllers\XrayController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/company-referrals/invitation/{token}', [CompanyReferralController::class, 'invitation'])
    ->middleware(['signed', 'throttle:30,1'])
    ->name('company-referrals.invitation');

Route::middleware('auth')->group(function () {
    Route::get('/temporary-password', [TemporaryPasswordController::class, 'edit'])
        ->name('temporary-password.edit');
    Route::put('/temporary-password', [TemporaryPasswordController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('temporary-password.update');
});

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
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::patch('/notifications/read-all', [NotificationController::class, 'readAll'])->name('notifications.read-all');
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'read'])->whereUuid('notification')->name('notifications.read');
    Route::post('/notifications/{notification}/visit', [NotificationController::class, 'readAndVisit'])->whereUuid('notification')->name('notifications.visit');
    Route::get('/company-referrals/invitation/{token}/accept', [CompanyReferralController::class, 'accept'])
        ->middleware(['signed', 'throttle:10,1'])
        ->name('company-referrals.accept');
    Route::get('/api/global-search', GlobalSearchController::class)
        ->middleware('throttle:30,1')
        ->name('api.global-search');

    Route::get('/dashboard', PatientDashboardController::class)
        ->middleware('patient.only')
        ->name('dashboard');

    Route::middleware('role:patient,company')->group(function () {
        Route::get('/appointment', [AppointmentController::class, 'create'])->name('appointment.create');
        Route::get('/appointments', [AppointmentController::class, 'index'])->name('appointments.index');
        Route::get('/appointments/create', [AppointmentController::class, 'create'])->name('appointments.create');
        Route::post('/appointments', [AppointmentController::class, 'store'])
            ->middleware('throttle:appointment-booking')
            ->name('appointments.store');
        Route::get('/appointments/{appointment}', [AppointmentController::class, 'show'])->name('appointments.show');

        Route::get('/api/companies', [AppointmentController::class, 'getCompanies'])->name('api.companies');
        Route::get('/api/available-doctors', [AppointmentController::class, 'availableDoctors'])->name('api.available-doctors');
        Route::get('/api/doctors', [AppointmentController::class, 'getDoctors'])->name('api.doctors');
        Route::get('/api/doctors/{doctorId}/availability', [AppointmentController::class, 'getDoctorAvailability'])->name('api.doctor.availability');
    });

    Route::middleware('role:company')->group(function () {
        Route::get('/company/dashboard', CompanyDashboardController::class)->name('company.dashboard');
        Route::post('/company/employees/import/preview', [CompanyEmployeeImportController::class, 'preview'])->name('company.employees.import.preview');
        Route::post('/company/employees/import/confirm', [CompanyEmployeeImportController::class, 'confirm'])->name('company.employees.import.confirm');
        Route::get('/company/employees/import/template', [CompanyEmployeeImportController::class, 'template'])->name('company.employees.import.template');
        Route::get('/company/employees/import/errors/{token}', [CompanyEmployeeImportController::class, 'errorReport'])->whereUuid('token')->name('company.employees.import.errors');
        Route::post('/company/referrals', [CompanyReferralController::class, 'store'])->name('company.referrals.store');
        Route::patch('/company/referrals/{companyReferral}/cancel', [CompanyReferralController::class, 'cancel'])->name('company.referrals.cancel');
    });

    Route::middleware('role:receptionist')->prefix('receptionist')->name('receptionist.')->group(function () {
        Route::get('/dashboard', ReceptionistDashboardController::class)->name('dashboard');
        Route::get('/walk-ins', [ReceptionistWalkInController::class, 'index'])->name('walk-ins.index');
        Route::post('/walk-ins', [ReceptionistWalkInController::class, 'store'])->name('walk-ins.store');
        Route::patch('/walk-ins/{appointment}/status', [ReceptionistWalkInController::class, 'updateStatus'])->name('walk-ins.status');
        Route::get('/queue', [ReceptionistWalkInController::class, 'queue'])->name('queue.index');
        Route::get('/patients', [ReceptionistWalkInController::class, 'patients'])->name('patients.index');
        Route::get('/patients/search', [ReceptionistWalkInController::class, 'searchPatients'])->name('patients.search');
        Route::get('/onsite-events/{event}', [OnsiteEventController::class, 'show'])->name('onsite-events.show');
        Route::patch('/onsite-employees/{employee}/attendance', [OnsiteEventController::class, 'attendance'])->name('onsite-employees.attendance');
    });

    Route::middleware('role:doctor')->prefix('doctor')->name('doctor.')->group(function () {
        Route::get('/onsite-events/{event}/queue', [OnsiteEventController::class, 'myQueue'])->name('onsite-events.queue');
        Route::get('/dashboard', DoctorDashboardController::class)->name('dashboard');
        Route::get('/appointments', [AppointmentController::class, 'staffIndex'])->defaults('role', 'doctor')->name('appointments');
        Route::get('/doctor-availability', [DoctorAvailabilityController::class, 'adminIndex'])->name('doctor-availability.index');
        Route::patch('/doctor-availability', [DoctorAvailabilityController::class, 'adminUpdate'])->name('doctor-availability.update');
        Route::get('/physical-exam-form/{appointment}', [PhysicalExamController::class, 'create'])->name('physical-exams.create');
        Route::post('/physical-exam-form/{appointment}', [PhysicalExamController::class, 'store'])->name('physical-exams.store');
        Route::get('/final-evaluation/{appointment}', [PhysicalExamController::class, 'final'])->name('final-evaluation');
        Route::post('/final-evaluation/{appointment}', [PhysicalExamController::class, 'finalStore'])->name('final-evaluation.store');
        Route::post('/final-evaluation/{appointment}/drug-test', [\App\Http\Controllers\DoctorDiagnosticResultController::class, 'drugTest'])->name('diagnostics.drug-test.verify');
        Route::post('/final-evaluation/{appointment}/xray', [\App\Http\Controllers\DoctorDiagnosticResultController::class, 'xray'])->name('diagnostics.xray.verify');
        Route::post('/final-evaluation/{appointment}/release', [PhysicalExamController::class, 'release'])->name('medical-reports.release');
    });

    Route::middleware('role:medtech')->prefix('medtech')->name('medtech.')->group(function () {
        Route::get('/onsite-events/{event}/queue', [OnsiteEventController::class, 'myQueue'])->name('onsite-events.queue');
        Route::get('/dashboard', MedTechDashboardController::class)->name('dashboard');
        Route::get('/appointments', [AppointmentController::class, 'staffIndex'])->defaults('role', 'medtech')->name('appointments');
        Route::get('/lab-results/{appointment}', [LaboratoryController::class, 'create'])->name('lab-results.create');
        Route::post('/lab-results/{appointment}', [LaboratoryController::class, 'store'])->name('lab-results.store');
    });

    Route::get('/clinical-forms/{appointment}/laboratory.pdf', [LaboratoryController::class, 'pdf'])
        ->name('clinical-forms.laboratory.pdf');
    Route::get('/clinical-forms/{appointment}/laboratory/{section}.pdf', [LaboratoryController::class, 'sectionPdf'])
        ->where('section', '[a-z_]+')
        ->name('clinical-forms.laboratory.section.pdf');
    Route::get('/clinical-forms/{appointment}/physical-exam.pdf', [ClinicalDocumentController::class, 'physicalExam'])
        ->name('clinical-forms.physical-exam.pdf');
    Route::get('/clinical-forms/{appointment}/xray.pdf', [ClinicalDocumentController::class, 'xray'])
        ->name('clinical-forms.xray.pdf');

    Route::middleware('role:radtech')->prefix('radtech')->name('radtech.')->group(function () {
        Route::get('/onsite-events/{event}/queue', [OnsiteEventController::class, 'myQueue'])->name('onsite-events.queue');
        Route::get('/dashboard', RadTechDashboardController::class)->name('dashboard');
        Route::get('/appointments', [AppointmentController::class, 'staffIndex'])->defaults('role', 'radtech')->name('appointments');
        Route::get('/xrays/{appointment}', [XrayController::class, 'create'])->name('xrays.create');
        Route::post('/xrays/{appointment}', [XrayController::class, 'store'])->name('xrays.store');
    });

    Route::middleware('role:admin')->prefix('admin')->name('admin.')->group(function () {
        Route::get('/onsite-events/{event}', [OnsiteEventController::class, 'show'])->name('onsite-events.show');
        Route::post('/onsite-events/{event}/staff', [OnsiteEventController::class, 'assignStaff'])->name('onsite-events.staff.assign');
        Route::delete('/onsite-events/{event}/staff/{deployment}', [OnsiteEventController::class, 'removeStaff'])->name('onsite-events.staff.remove');
        Route::patch('/onsite-employees/{employee}/attendance', [OnsiteEventController::class, 'attendance'])->name('onsite-employees.attendance');
        Route::get('/dashboard', AdminDashboardController::class)->name('dashboard');
        Route::get('/doctor-availability', [DoctorAvailabilityController::class, 'adminIndex'])->name('doctor-availability.index');
        Route::patch('/doctor-availability', [DoctorAvailabilityController::class, 'adminUpdate'])->name('doctor-availability.update');

        Route::resource('staff', StaffController::class)->except('show');
        Route::patch('/staff/{staff}/toggle-active', [StaffController::class, 'toggleActive'])->name('staff.toggle-active');
        Route::post('/staff/{staff}/signature', [StaffController::class, 'uploadSignature'])->name('staff.signature');
        Route::post('/staff/{staff}/resend-credentials', [StaffController::class, 'resendCredentials'])
            ->middleware('throttle:6,1')
            ->name('staff.resend-credentials');

        Route::get('/appointments', [AppointmentController::class, 'adminIndex'])->name('appointments.index');
        Route::get('/todays-appointments', [AppointmentController::class, 'today'])->name('appointments.today');
        Route::get('/bulk-appointments', [AppointmentController::class, 'adminIndex'])->name('bulk-appointments.index');
        Route::get('/appointments/create', [AppointmentController::class, 'adminCreate'])->name('appointments.create');
        Route::post('/appointments', [AppointmentController::class, 'adminStore'])->name('appointments.store');
        Route::get('/appointments/{appointment}', [AppointmentController::class, 'show'])->name('appointments.show');
        Route::patch('/appointments/{appointment}/status', [AppointmentController::class, 'updateStatus'])->name('appointments.update-status');
        Route::patch('/appointments/{appointment}/approve', [AppointmentController::class, 'approve'])->name('appointments.approve');
        Route::patch('/appointments/{appointment}/reject', [AppointmentController::class, 'reject'])->name('appointments.reject');
        Route::get('/appointments/{appointment}/physical-exam', [PhysicalExamController::class, 'create'])->name('physical-exams.edit');
        Route::post('/appointments/{appointment}/physical-exam', [PhysicalExamController::class, 'store'])->name('physical-exams.update');
        Route::get('/appointments/{appointment}/laboratory', [LaboratoryController::class, 'create'])->name('lab-results.edit');
        Route::post('/appointments/{appointment}/laboratory', [LaboratoryController::class, 'store'])->name('lab-results.update');
        Route::get('/appointments/{appointment}/xray', [XrayController::class, 'create'])->name('xrays.edit');
        Route::post('/appointments/{appointment}/xray', [XrayController::class, 'store'])->name('xrays.update');
        Route::post('/appointments/{appointment}/release-report', [PhysicalExamController::class, 'release'])->name('medical-reports.release');

        Route::resource('companies', CompanyController::class);
        Route::patch('/companies/{company}/toggle-active', [CompanyController::class, 'toggleActive'])->name('companies.toggle-active');
        Route::post('/companies/{company}/resend-invitation', [CompanyController::class, 'resendInvitation'])->name('companies.resend-invitation');

        Route::get('/analytics', [AdminDashboardController::class, 'analytics'])->name('analytics');
        Route::get('/forecast', [ForecastController::class, 'index'])->name('forecast.index');
        Route::get('/api/forecast', [ForecastController::class, 'dashboard'])->name('forecast.dashboard');
        Route::get('/api/forecast/history', [ForecastController::class, 'history'])->name('forecast.history');
        Route::get('/api/forecast/{disease}', [ForecastController::class, 'disease'])->name('forecast.disease');
        Route::get('/patient-visits', [PatientVisitForecastController::class, 'index'])->name('patient-visits.index');
        Route::get('/api/patient-visits', [PatientVisitForecastController::class, 'dashboard'])->name('patient-visits.dashboard');
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
