<?php

use App\Models\Appointment;
use App\Models\Company;
use App\Models\User;
use App\Services\CompanyEmployeeImportService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Inertia\Testing\AssertableInertia as Assert;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

uses(RefreshDatabase::class);

function employeeSpreadsheet(array $rows): UploadedFile
{
    $spreadsheet = new Spreadsheet;
    $spreadsheet->getActiveSheet()->fromArray($rows);
    $path = tempnam(sys_get_temp_dir(), 'employee-import-test-').'.xlsx';
    (new Xlsx($spreadsheet))->save($path);

    return new UploadedFile(
        $path,
        'employees.xlsx',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        null,
        true
    );
}

test('master list template uses canonical database field names', function () {
    expect(CompanyEmployeeImportService::TEMPLATE_HEADERS)->toBe([
        'first_name',
        'middle_name',
        'last_name',
        'sex',
        'birthdate',
        'civil_status',
        'employee_number',
    ]);
});

test('upload preview redirects to a refreshable dashboard url', function () {
    $company = Company::create(['company_name' => 'Preview Redirect Company']);
    $representative = User::factory()->create([
        'role' => 'company',
        'company_id' => $company->id,
    ]);
    $file = employeeSpreadsheet([
        ['first_name', 'last_name', 'sex', 'birthdate', 'civil_status'],
        ['Paolo', 'Reyes', 'Male', '1994-06-20', 'Single'],
    ]);

    $response = $this->actingAs($representative)->post(
        route('company.employees.import.preview'),
        ['file' => $file]
    );

    $location = $response->headers->get('Location');
    expect($location)->toContain('/company/dashboard?preview_token=');

    $this->get($location)
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('company/dashboard')
            ->where('importPreview.summary.valid', 1));
});

test('company employee spreadsheets are previewed and imported without fabricated credentials', function () {
    $company = Company::create(['company_name' => 'Acme Health']);
    $service = app(CompanyEmployeeImportService::class);
    $file = employeeSpreadsheet([
        ['First Name', 'Middle Name', 'Last Name', 'Gender', 'Birth Date', 'Civil Status', 'Employee Number'],
        [' Juan ', 'Santos', ' Dela Cruz ', 'M', '2000-05-15', 'SINGLE', 'EMP-001'],
        ['Maria', null, 'Santos', 'female', '1998-09-21', 'Married', 'EMP-002'],
    ]);

    $preview = $service->preview($file, $company->id);

    expect($preview['summary'])->toMatchArray([
        'total' => 2,
        'valid' => 2,
        'invalid' => 0,
        'duplicates' => 0,
    ]);

    $result = $service->import($preview, $company->id);

    expect($result['imported'])->toBe(2);
    $employee = User::where('company_id', $company->id)->where('first_name', 'Juan')->firstOrFail();
    expect($employee->email)->toBeNull()
        ->and($employee->password)->toBeNull()
        ->and($employee->is_active)->toBeFalse()
        ->and($employee->middle_name)->toBe('Santos')
        ->and($employee->patientProfile->sex)->toBe('Male')
        ->and($employee->patientProfile->civil_status)->toBe('Single')
        ->and($employee->patientProfile->employee_number)->toBe('EMP-001')
        ->and($employee->patientProfile->birthdate->toDateString())->toBe('2000-05-15');
});

test('invalid rows and company-scoped duplicates are identified before import', function () {
    $company = Company::create(['company_name' => 'Acme Health']);
    $otherCompany = Company::create(['company_name' => 'Other Company']);

    foreach ([$company, $otherCompany] as $owner) {
        $employee = User::factory()->create([
            'first_name' => 'Juan',
            'last_name' => 'Dela Cruz',
            'company_id' => $owner->id,
        ]);
        $employee->patientProfile()->create([
            'birthdate' => '2000-05-15',
            'sex' => 'Male',
            'civil_status' => null,
        ]);
    }

    $file = employeeSpreadsheet([
        ['firstname', 'lastname', 'sex', 'birthdate', 'civil_status'],
        ['Juan', 'Dela Cruz', 'Male', '2000-05-15', 'Single'],
        ['Ana', 'Reyes', 'Unknown', '2030-01-01', 'Single'],
        ['Ana', 'Reyes', 'Female', '2001-02-03', 'Single'],
        ['Ana', 'Reyes', 'Female', '2001-02-03', 'Single'],
    ]);

    $preview = app(CompanyEmployeeImportService::class)->preview($file, $company->id);

    expect($preview['summary'])->toMatchArray([
        'total' => 4,
        'valid' => 1,
        'invalid' => 2,
        'duplicates' => 1,
    ]);
});

test('broken age formulas are warnings and age is calculated from birthdate', function () {
    $company = Company::create(['company_name' => 'Schema Source Company']);
    $file = employeeSpreadsheet([
        ['FIRST NAME', 'Middle_Name', 'LAST_NAME', 'Gender', 'BDAY', 'Civil_Status', 'AGE'],
        ['Lea', 'M.', 'Garcia', 'F', '2000-08-09', 'DIVORCED', '#REF!'],
    ]);

    $preview = app(CompanyEmployeeImportService::class)->preview($file, $company->id);

    expect($preview['summary']['valid'])->toBe(1)
        ->and($preview['rows'][0]['age'])->toBe(Carbon::parse('2000-08-09')->age)
        ->and($preview['rows'][0]['warnings'][0]['field'])->toBe('age');
});

test('unused cells outside the import columns do not exhaust spreadsheet memory', function () {
    $company = Company::create(['company_name' => 'Sparse Workbook Company']);
    $spreadsheet = new Spreadsheet;
    $spreadsheet->getActiveSheet()->fromArray([
        ['first_name', 'last_name', 'sex', 'birthdate', 'civil_status'],
        ['Nina', 'Lopez', 'Female', '1997-04-18', 'Single'],
    ]);
    $spreadsheet->getActiveSheet()->setCellValue('XFD1', 'unused formatting residue');
    $path = tempnam(sys_get_temp_dir(), 'sparse-employee-import-').'.xlsx';
    (new Xlsx($spreadsheet))->save($path);
    $file = new UploadedFile(
        $path,
        'sparse-employees.xlsx',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        null,
        true
    );

    $preview = app(CompanyEmployeeImportService::class)->preview($file, $company->id);

    expect($preview['summary'])->toMatchArray(['total' => 1, 'valid' => 1]);
});

test('an uploaded company name cannot target another company', function () {
    $company = Company::create(['company_name' => 'Authenticated Company']);
    $file = employeeSpreadsheet([
        ['company_name', 'first_name', 'last_name', 'sex', 'birthdate', 'civil_status'],
        ['Different Company', 'Liza', 'Cruz', 'Female', '1995-01-10', 'Single'],
    ]);

    $preview = app(CompanyEmployeeImportService::class)->preview($file, $company->id);

    expect($preview['summary']['invalid'])->toBe(1)
        ->and($preview['rows'][0]['errors'][0]['field'])->toBe('company_name');
});

test('imported employees inherit the selected bulk appointment batch', function () {
    $company = Company::create(['company_name' => 'Batch Company']);
    $representative = User::factory()->create([
        'role' => 'company',
        'company_id' => $company->id,
    ]);
    $bulkAppointment = Appointment::create([
        'user_id' => $representative->id,
        'company_id' => $company->id,
        'company_name' => $company->company_name,
        'appointment_date' => today()->addWeek(),
        'type' => 'company_bulk',
        'status' => 'accepted',
        'service_types' => ['PE'],
    ]);
    $file = employeeSpreadsheet([
        ['first_name', 'middle_name', 'last_name', 'sex', 'birthdate', 'civil_status'],
        ['Carla', 'M.', 'Ramos', 'Female', '1999-03-12', 'Single'],
    ]);
    $service = app(CompanyEmployeeImportService::class);

    $preview = $service->preview($file, $company->id, $bulkAppointment->id);
    $result = $service->import($preview, $company->id);
    $employee = User::where('company_id', $company->id)->where('first_name', 'Carla')->firstOrFail();
    $employeeAppointment = Appointment::where('user_id', $employee->id)->firstOrFail();

    expect($result['attached'])->toBe(1)
        ->and($bulkAppointment->refresh()->batch_id)->not->toBeNull()
        ->and($employeeAppointment->bulk_appointment_id)->toBe($bulkAppointment->id)
        ->and($employeeAppointment->batch_id)->toBe($bulkAppointment->batch_id)
        ->and($employeeAppointment->appointment_date->toDateString())->toBe($bulkAppointment->appointment_date->toDateString())
        ->and($employeeAppointment->service_types)->toBe(['PE']);
});

test('existing company employees are reused and enrolled into a selected bulk event', function () {
    $company = Company::create(['company_name' => 'Repeat Employee Company']);
    $employee = User::factory()->create([
        'role' => 'patient', 'company_id' => $company->id,
        'first_name' => 'Maria', 'middle_name' => null, 'last_name' => 'Santos',
    ]);
    $employee->patientProfile()->create([
        'birthdate' => '1993-04-10', 'sex' => 'Female', 'civil_status' => 'Single',
    ]);
    $representative = User::factory()->create(['role' => 'company', 'company_id' => $company->id]);
    $parent = Appointment::create([
        'user_id' => $representative->id, 'company_id' => $company->id,
        'appointment_date' => today()->addDay(), 'type' => 'company_bulk',
        'status' => 'pending', 'service_types' => ['PE'],
    ]);
    $file = employeeSpreadsheet([
        ['first_name', 'middle_name', 'last_name', 'sex', 'birthdate', 'civil_status', 'employee_number'],
        ['Maria', '', 'Santos', 'Female', '1993-04-10', 'Single', 'EMP-OLD'],
    ]);

    $service = app(\App\Services\CompanyEmployeeImportService::class);
    $result = $service->import($service->preview($file, $company->id, $parent->id), $company->id);

    expect($result['imported'])->toBe(0)
        ->and($result['duplicates'])->toBe(1)
        ->and($result['attached'])->toBe(1)
        ->and(User::where('company_id', $company->id)->where('role', 'patient')->count())->toBe(1)
        ->and($parent->bulkEmployees()->where('user_id', $employee->id)->exists())->toBeTrue();
});
