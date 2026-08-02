<?php

use App\Models\Company;
use App\Models\User;
use App\Services\CompanyEmployeeImportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
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

test('company employee spreadsheets are previewed and imported without fabricated credentials', function () {
    $company = Company::create(['company_name' => 'Acme Health']);
    $service = app(CompanyEmployeeImportService::class);
    $file = employeeSpreadsheet([
        ['First Name', 'Last Name', 'Gender', 'Birth Date'],
        [' Juan ', ' Dela Cruz ', 'M', '2000-05-15'],
        ['Maria', 'Santos', 'female', '1998-09-21'],
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
        ->and($employee->patientProfile->sex)->toBe('Male')
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
        ['firstname', 'lastname', 'sex', 'birthdate'],
        ['Juan', 'Dela Cruz', 'Male', '2000-05-15'],
        ['Ana', 'Reyes', 'Unknown', '2030-01-01'],
        ['Ana', 'Reyes', 'Female', '2001-02-03'],
        ['Ana', 'Reyes', 'Female', '2001-02-03'],
    ]);

    $preview = app(CompanyEmployeeImportService::class)->preview($file, $company->id);

    expect($preview['summary'])->toMatchArray([
        'total' => 4,
        'valid' => 1,
        'invalid' => 2,
        'duplicates' => 1,
    ]);
});
