<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\PatientProfile;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Reader\IReadFilter;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use RuntimeException;

class CompanyEmployeeImportService
{
    private const MAX_COLUMNS = 20;

    private const MAX_ROWS = 5000;

    private const HEADER_ALIASES = [
        'first_name' => ['first_name', 'first name', 'firstname'],
        'middle_name' => ['middle_name', 'middle name', 'middlename'],
        'last_name' => ['last_name', 'last name', 'lastname'],
        'sex' => ['sex', 'gender'],
        'birthdate' => ['birthdate', 'birth date', 'date of birth', 'dob', 'bday'],
        'civil_status' => ['civil_status', 'civil status', 'civilstatus'],
        'employee_number' => ['employee_number', 'employee number', 'employee no', 'employee id'],
        'company_name' => ['company_name', 'company name', 'company'],
        'age' => ['age'],
    ];

    public const TEMPLATE_HEADERS = [
        'first_name',
        'middle_name',
        'last_name',
        'sex',
        'birthdate',
        'civil_status',
        'employee_number',
    ];

    public function __construct(private readonly BulkAppointmentEnrollmentService $enrollment) {}

    public function preview(UploadedFile $file, int $companyId, ?int $bulkAppointmentId = null): array
    {
        if ($bulkAppointmentId !== null) {
            $this->bulkAppointment($companyId, $bulkAppointmentId);
        }

        $reader = IOFactory::createReaderForFile($file->getRealPath());
        $reader->setReadDataOnly(true);
        $reader->setReadFilter(new class(self::MAX_ROWS + 1, self::MAX_COLUMNS) implements IReadFilter
        {
            public function __construct(private readonly int $maxRow, private readonly int $maxColumn) {}

            public function readCell($columnAddress, $row, $worksheetName = ''): bool
            {
                return $row <= $this->maxRow
                    && Coordinate::columnIndexFromString($columnAddress) <= $this->maxColumn;
            }
        });

        $spreadsheet = $reader->load($file->getRealPath());
        $sheet = $spreadsheet->getActiveSheet();
        $lastColumn = Coordinate::stringFromColumnIndex(self::MAX_COLUMNS);
        $rawRows = $sheet->rangeToArray(
            "A1:{$lastColumn}".(self::MAX_ROWS + 1),
            null,
            false,
            true,
            false
        );
        $spreadsheet->disconnectWorksheets();

        if (! $this->isBlankRow($rawRows[self::MAX_ROWS] ?? [])) {
            throw new RuntimeException('The spreadsheet exceeds the maximum of '.self::MAX_ROWS.' rows per import.');
        }
        $rawRows = array_slice($rawRows, 0, self::MAX_ROWS);

        if ($rawRows === []) {
            throw new RuntimeException('The spreadsheet is empty.');
        }

        $headerIndex = $this->findHeaderRow($rawRows);
        if ($headerIndex === null) {
            throw new RuntimeException('Required headers were not found. Include first_name, last_name, sex, birthdate, and civil_status.');
        }

        $headers = $this->mapHeaders($rawRows[$headerIndex]);
        $missing = array_values(array_diff(
            ['first_name', 'last_name', 'sex', 'birthdate', 'civil_status'],
            array_values($headers)
        ));
        if ($missing !== []) {
            throw new RuntimeException('Missing required columns: '.implode(', ', $missing).'.');
        }

        $rows = [];
        $fileKeys = [];

        foreach (array_slice($rawRows, $headerIndex + 1, null, true) as $index => $rawRow) {
            if ($this->isBlankRow($rawRow)) {
                continue;
            }

            $values = [];
            foreach ($headers as $column => $field) {
                $values[$field] = $rawRow[$column] ?? null;
            }

            $rows[] = $this->validateRow($values, $index + 1, $companyId, $fileKeys);
        }

        if ($rows === []) {
            throw new RuntimeException('The spreadsheet contains no employee rows.');
        }

        return [
            'file_name' => Str::limit($file->getClientOriginalName(), 120, ''),
            'bulk_appointment_id' => $bulkAppointmentId,
            'rows' => $rows,
            'summary' => $this->summarize($rows),
        ];
    }

    public function import(array $preview, int $companyId): array
    {
        $result = [
            'total' => count($preview['rows']),
            'imported' => 0,
            'duplicates' => 0,
            'failed' => 0,
            'updated' => 0,
            'attached' => 0,
        ];

        DB::transaction(function () use ($preview, $companyId, &$result): void {
            $bulkAppointment = isset($preview['bulk_appointment_id'])
                ? $this->bulkAppointment($companyId, (int) $preview['bulk_appointment_id'], true)
                : null;

            foreach ($preview['rows'] as $row) {
                if ($row['status'] === 'invalid') {
                    $result['failed']++;

                    continue;
                }

                if ($this->duplicateExists(
                    $companyId,
                    $row['first_name'],
                    $row['middle_name'],
                    $row['last_name'],
                    $row['birthdate']
                )) {
                    $result['duplicates']++;

                    continue;
                }

                $user = User::create([
                    'first_name' => $row['first_name'],
                    'middle_name' => $row['middle_name'],
                    'last_name' => $row['last_name'],
                    'email' => null,
                    'contact' => null,
                    'password' => null,
                    'role' => 'patient',
                    'company_id' => $companyId,
                    'is_active' => false,
                ]);

                PatientProfile::create([
                    'user_id' => $user->id,
                    'birthdate' => $row['birthdate'],
                    'sex' => $row['sex'],
                    'civil_status' => $row['civil_status'],
                    'employee_number' => $row['employee_number'],
                ]);

                if ($bulkAppointment) {
                    $this->enrollment->enroll($bulkAppointment, $user);
                    $result['attached']++;
                }

                $result['imported']++;
            }
        });

        return $result;
    }

    private function bulkAppointment(int $companyId, int $appointmentId, bool $lock = false): Appointment
    {
        return Appointment::query()
            ->when($lock, fn ($query) => $query->lockForUpdate())
            ->whereKey($appointmentId)
            ->where('company_id', $companyId)
            ->where('type', 'company_bulk')
            ->whereNull('bulk_appointment_id')
            ->firstOrFail();
    }

    private function findHeaderRow(array $rows): ?int
    {
        foreach (array_slice($rows, 0, 10, true) as $index => $row) {
            $mapped = array_values($this->mapHeaders($row));
            if (in_array('first_name', $mapped, true) && in_array('last_name', $mapped, true)) {
                return $index;
            }
        }

        return null;
    }

    private function mapHeaders(array $row): array
    {
        $mapped = [];
        foreach ($row as $column => $heading) {
            $normalized = Str::of((string) $heading)->trim()->lower()->replace(['-', '_'], ' ')->squish()->toString();
            foreach (self::HEADER_ALIASES as $field => $aliases) {
                if (in_array($normalized, array_map(fn ($alias) => str_replace('_', ' ', $alias), $aliases), true)) {
                    $mapped[$column] = $field;
                    break;
                }
            }
        }

        return $mapped;
    }

    private function validateRow(array $values, int $rowNumber, int $companyId, array &$fileKeys): array
    {
        $firstName = trim((string) ($values['first_name'] ?? ''));
        $middleName = $this->nullableString($values['middle_name'] ?? null);
        $lastName = trim((string) ($values['last_name'] ?? ''));
        $sex = $this->normalizeSex($values['sex'] ?? null);
        $civilStatus = $this->normalizeCivilStatus($values['civil_status'] ?? null);
        $employeeNumber = $this->nullableString($values['employee_number'] ?? null);
        $errors = [];
        $warnings = [];

        if ($firstName === '') {
            $errors[] = ['field' => 'first_name', 'message' => 'First name is required.'];
        } elseif (mb_strlen($firstName) > 255) {
            $errors[] = ['field' => 'first_name', 'message' => 'First name is too long.'];
        }
        if ($lastName === '') {
            $errors[] = ['field' => 'last_name', 'message' => 'Last name is required.'];
        } elseif (mb_strlen($lastName) > 255) {
            $errors[] = ['field' => 'last_name', 'message' => 'Last name is too long.'];
        }
        if ($sex === null) {
            $errors[] = ['field' => 'sex', 'message' => 'Sex must be Male, Female, M, or F.'];
        }
        if ($civilStatus === null) {
            $errors[] = ['field' => 'civil_status', 'message' => 'Civil status must be Single, Married, Divorced, Widowed, or Separated.'];
        }

        if ($middleName !== null && mb_strlen($middleName) > 255) {
            $errors[] = ['field' => 'middle_name', 'message' => 'Middle name is too long.'];
        }
        if ($employeeNumber !== null && mb_strlen($employeeNumber) > 80) {
            $errors[] = ['field' => 'employee_number', 'message' => 'Employee number is too long.'];
        }

        [$birthdate, $birthdateError] = $this->normalizeBirthdate($values['birthdate'] ?? null, $values['age'] ?? null);
        if ($birthdateError !== null) {
            $errors[] = ['field' => 'birthdate', 'message' => $birthdateError];
        } elseif ($birthdate !== null) {
            $this->validateUploadedAge($values['age'] ?? null, $birthdate, $warnings);
        }

        if (isset($values['company_name'])) {
            $uploadedCompany = $this->nullableString($values['company_name']);
            $actualCompany = DB::table('companies')->where('id', $companyId)->value('company_name');
            if ($uploadedCompany !== null && mb_strtolower($uploadedCompany) !== mb_strtolower((string) $actualCompany)) {
                $errors[] = ['field' => 'company_name', 'message' => 'Company name does not match the signed-in company account.'];
            }
        }

        $duplicate = false;
        if ($firstName !== '' && $lastName !== '' && $birthdate !== null) {
            $key = $this->duplicateKey($firstName, $middleName, $lastName, $birthdate);
            if (isset($fileKeys[$key])) {
                $duplicate = true;
                $errors[] = ['field' => 'row', 'message' => "Duplicate of spreadsheet row {$fileKeys[$key]}."];
            } else {
                $fileKeys[$key] = $rowNumber;
                $duplicate = $this->duplicateExists($companyId, $firstName, $middleName, $lastName, $birthdate);
            }
        }

        return [
            'row' => $rowNumber,
            'first_name' => $firstName,
            'middle_name' => $middleName,
            'last_name' => $lastName,
            'sex' => $sex,
            'birthdate' => $birthdate,
            'civil_status' => $civilStatus,
            'employee_number' => $employeeNumber,
            'age' => $birthdate ? Carbon::parse($birthdate)->age : null,
            'status' => $errors !== [] ? 'invalid' : ($duplicate ? 'duplicate' : 'valid'),
            'errors' => $errors,
            'warnings' => $warnings,
        ];
    }

    private function normalizeSex(mixed $value): ?string
    {
        return match (mb_strtolower(trim((string) $value))) {
            'm', 'male' => 'Male',
            'f', 'female' => 'Female',
            default => null,
        };
    }

    private function normalizeCivilStatus(mixed $value): ?string
    {
        return match (mb_strtolower(trim((string) $value))) {
            'single' => 'Single',
            'married' => 'Married',
            'divorced' => 'Divorced',
            'widowed' => 'Widowed',
            'separated' => 'Separated',
            default => null,
        };
    }

    private function normalizeBirthdate(mixed $birthdate, mixed $age): array
    {
        if ($birthdate === null || trim((string) $birthdate) === '') {
            if ($age !== null && trim((string) $age) !== '') {
                return [null, 'A complete birthdate is required; age alone cannot determine an exact birthdate.'];
            }

            return [null, 'Birthdate is required.'];
        }

        try {
            if (is_numeric($birthdate)) {
                $date = Carbon::instance(ExcelDate::excelToDateTimeObject((float) $birthdate));
            } else {
                $value = trim((string) $birthdate);
                if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
                    $date = Carbon::createFromFormat('!Y-m-d', $value);
                    $dateErrors = Carbon::getLastErrors();
                    if ($dateErrors !== false && ($dateErrors['warning_count'] > 0 || $dateErrors['error_count'] > 0)) {
                        return [null, 'Use a real calendar date in YYYY-MM-DD format.'];
                    }
                } else {
                    $date = Carbon::parse($value);
                }
            }
        } catch (\Throwable) {
            return [null, 'Use a valid birthdate, preferably YYYY-MM-DD.'];
        }

        if ($date->isFuture()) {
            return [null, 'Birthdate cannot be in the future.'];
        }
        if ($date->age > 120) {
            return [null, 'Birthdate results in an impossible age over 120.'];
        }

        return [$date->toDateString(), null];
    }

    private function duplicateExists(
        int $companyId,
        string $firstName,
        ?string $middleName,
        string $lastName,
        string $birthdate
    ): bool {
        return User::query()
            ->where('company_id', $companyId)
            ->whereRaw('LOWER(first_name) = ?', [mb_strtolower($firstName)])
            ->where(function ($query) use ($middleName) {
                $middleName === null
                    ? $query->whereNull('middle_name')->orWhere('middle_name', '')
                    : $query->whereRaw('LOWER(middle_name) = ?', [mb_strtolower($middleName)]);
            })
            ->whereRaw('LOWER(last_name) = ?', [mb_strtolower($lastName)])
            ->whereHas('patientProfile', fn ($query) => $query->whereDate('birthdate', $birthdate))
            ->exists();
    }

    private function duplicateKey(string $firstName, ?string $middleName, string $lastName, string $birthdate): string
    {
        return implode('|', array_map(
            fn (string $value) => mb_strtolower($value),
            [$firstName, $middleName ?? '', $lastName, $birthdate]
        ));
    }

    private function nullableString(mixed $value): ?string
    {
        $normalized = trim((string) $value);

        return $normalized === '' ? null : $normalized;
    }

    private function validateUploadedAge(mixed $value, string $birthdate, array &$warnings): void
    {
        $rawAge = trim((string) $value);
        if ($rawAge === '') {
            return;
        }

        $calculatedAge = Carbon::parse($birthdate)->age;
        if (! ctype_digit($rawAge) || (int) $rawAge < 0 || (int) $rawAge > 120) {
            $warnings[] = ['field' => 'age', 'message' => 'Uploaded age is invalid and was ignored; age was calculated from birthdate.'];

            return;
        }

        if (abs((int) $rawAge - $calculatedAge) > 1) {
            $warnings[] = ['field' => 'age', 'message' => "Uploaded age does not match birthdate; calculated age {$calculatedAge} is used."];
        }
    }

    private function isBlankRow(array $row): bool
    {
        return collect($row)->every(fn ($value) => $value === null || trim((string) $value) === '');
    }

    private function summarize(array $rows): array
    {
        return [
            'total' => count($rows),
            'valid' => count(array_filter($rows, fn ($row) => $row['status'] === 'valid')),
            'invalid' => count(array_filter($rows, fn ($row) => $row['status'] === 'invalid')),
            'duplicates' => count(array_filter($rows, fn ($row) => $row['status'] === 'duplicate')),
        ];
    }
}
