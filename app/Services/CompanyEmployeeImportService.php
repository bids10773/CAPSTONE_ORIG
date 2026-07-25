<?php

namespace App\Services;

use App\Models\PatientProfile;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use RuntimeException;

class CompanyEmployeeImportService
{
    private const HEADER_ALIASES = [
        'first_name' => ['first_name', 'first name', 'firstname'],
        'last_name' => ['last_name', 'last name', 'lastname'],
        'sex' => ['sex', 'gender'],
        'birthdate' => ['birthdate', 'birth date', 'date of birth', 'dob'],
        'age' => ['age'],
    ];

    public function preview(UploadedFile $file, int $companyId): array
    {
        $sheet = IOFactory::load($file->getRealPath())->getActiveSheet();
        $rawRows = $sheet->toArray(null, true, true, false);

        if ($rawRows === []) {
            throw new RuntimeException('The spreadsheet is empty.');
        }

        $headerIndex = $this->findHeaderRow($rawRows);
        if ($headerIndex === null) {
            throw new RuntimeException('Required headers were not found. Include First Name, Last Name, Sex, and Birthdate.');
        }

        $headers = $this->mapHeaders($rawRows[$headerIndex]);
        $missing = array_values(array_diff(['first_name', 'last_name', 'sex'], array_values($headers)));
        if (! in_array('birthdate', $headers, true) && ! in_array('age', $headers, true)) {
            $missing[] = 'birthdate';
        }
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
        ];

        DB::transaction(function () use ($preview, $companyId, &$result): void {
            foreach ($preview['rows'] as $row) {
                if ($row['status'] === 'invalid') {
                    $result['failed']++;

                    continue;
                }

                if ($this->duplicateExists($companyId, $row['first_name'], $row['last_name'], $row['birthdate'])) {
                    $result['duplicates']++;

                    continue;
                }

                $user = User::create([
                    'first_name' => $row['first_name'],
                    'middle_name' => null,
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
                    'civil_status' => null,
                ]);

                $result['imported']++;
            }
        });

        return $result;
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
        $lastName = trim((string) ($values['last_name'] ?? ''));
        $sex = $this->normalizeSex($values['sex'] ?? null);
        $errors = [];

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

        [$birthdate, $birthdateError] = $this->normalizeBirthdate($values['birthdate'] ?? null, $values['age'] ?? null);
        if ($birthdateError !== null) {
            $errors[] = ['field' => 'birthdate', 'message' => $birthdateError];
        }

        $duplicate = false;
        if ($firstName !== '' && $lastName !== '' && $birthdate !== null) {
            $key = mb_strtolower($firstName).'|'.mb_strtolower($lastName).'|'.$birthdate;
            if (isset($fileKeys[$key])) {
                $duplicate = true;
                $errors[] = ['field' => 'row', 'message' => "Duplicate of spreadsheet row {$fileKeys[$key]}."];
            } else {
                $fileKeys[$key] = $rowNumber;
                $duplicate = $this->duplicateExists($companyId, $firstName, $lastName, $birthdate);
            }
        }

        return [
            'row' => $rowNumber,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'sex' => $sex,
            'birthdate' => $birthdate,
            'age' => $birthdate ? Carbon::parse($birthdate)->age : null,
            'status' => $errors !== [] ? 'invalid' : ($duplicate ? 'duplicate' : 'valid'),
            'errors' => $errors,
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

    private function duplicateExists(int $companyId, string $firstName, string $lastName, string $birthdate): bool
    {
        return User::query()
            ->where('company_id', $companyId)
            ->whereRaw('LOWER(first_name) = ?', [mb_strtolower($firstName)])
            ->whereRaw('LOWER(last_name) = ?', [mb_strtolower($lastName)])
            ->whereHas('patientProfile', fn ($query) => $query->whereDate('birthdate', $birthdate))
            ->exists();
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
