<?php

use App\Mail\CompanyInvitation;
use App\Models\Company;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

function companyPayload(array $overrides = []): array
{
    return array_merge([
        'company_name' => 'Acme Medical Industries',
        'email' => 'portal@acme.test',
        'contact_number' => '+63 912 345 6789',
        'address' => '123 Health Avenue, Cabuyao, Laguna',
        'industry_type' => 'Manufacturing',
        'status' => 'active',
        'representative_first_name' => 'Maria',
        'representative_middle_name' => 'Santos',
        'representative_last_name' => 'Reyes',
        'representative_position' => 'HR Officer',
    ], $overrides);
}

test('admin creates a company and its secure first-login account atomically', function () {
    Mail::fake();
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)->post(route('admin.companies.store'), companyPayload())
        ->assertRedirect(route('admin.companies.index'))
        ->assertSessionHas('success');

    $company = Company::where('email', 'portal@acme.test')->firstOrFail();
    $account = $company->account()->firstOrFail();

    expect($account->company_id)->toBe($company->id)
        ->and($account->role)->toBe('company')
        ->and($account->name)->toBe('Maria Santos Reyes')
        ->and($account->position)->toBe('HR Officer')
        ->and($account->must_change_password)->toBeTrue()
        ->and($account->is_active)->toBeTrue()
        ->and($account->password)->not->toBeNull();
    expect($company->is_partnered)->toBeTrue();

    Mail::assertSent(CompanyInvitation::class, function (CompanyInvitation $mail) use ($account): bool {
        return $mail->hasTo('portal@acme.test')
            && Hash::check($mail->tempPassword, $account->password);
    });
});

test('representative middle name and position are optional without affecting full name spacing', function () {
    Mail::fake();
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)->post(route('admin.companies.store'), companyPayload([
        'representative_middle_name' => '',
        'representative_position' => '',
    ]))->assertRedirect(route('admin.companies.index'));

    $account = User::where('email', 'portal@acme.test')->firstOrFail();
    expect($account->name)->toBe('Maria Reyes')
        ->and($account->middle_name)->toBeNull()
        ->and($account->position)->toBeNull()
        ->and($account->role)->toBe('company');
});

test('representative first and last names are required with readable errors', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)->post(route('admin.companies.store'), companyPayload([
        'representative_first_name' => '   ',
        'representative_last_name' => '   ',
    ]))->assertSessionHasErrors([
        'representative_first_name' => 'Representative first name is required.',
        'representative_last_name' => 'Representative last name is required.',
    ]);
});

test('company inputs are trimmed and company email is normalized', function () {
    Mail::fake();
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)->post(route('admin.companies.store'), companyPayload([
        'company_name' => '  Acme Medical Industries  ',
        'email' => '  PORTAL@ACME.TEST  ',
        'representative_first_name' => '  Maria  ',
    ]))->assertRedirect(route('admin.companies.index'));

    $this->assertDatabaseHas('companies', ['company_name' => 'Acme Medical Industries', 'email' => 'portal@acme.test']);
    $this->assertDatabaseHas('users', ['first_name' => 'Maria', 'email' => 'portal@acme.test', 'role' => 'company']);
});

test('non admins cannot open or submit company account creation', function () {
    $patient = User::factory()->create(['role' => 'patient']);

    $this->actingAs($patient)->get(route('admin.companies.create'))->assertForbidden();
    $this->actingAs($patient)->post(route('admin.companies.store'), companyPayload())->assertForbidden();
});

test('invalid company phone industry and logo are rejected', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)->post(route('admin.companies.store'), companyPayload([
        'contact_number' => '123',
        'industry_type' => 'Unknown Industry',
        'logo' => UploadedFile::fake()->create('logo.pdf', 100, 'application/pdf'),
    ]))->assertSessionHasErrors(['contact_number', 'industry_type', 'logo']);
});

test('company logo above two megabytes is rejected', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)->post(route('admin.companies.store'), companyPayload([
        'logo' => UploadedFile::fake()->image('logo.png')->size(2049),
    ]))->assertSessionHasErrors(['logo']);
});

test('admin updates representative identity and keeps company login synchronized', function () {
    Mail::fake();
    $admin = User::factory()->create(['role' => 'admin']);
    $this->actingAs($admin)->post(route('admin.companies.store'), companyPayload());
    $company = Company::where('email', 'portal@acme.test')->firstOrFail();

    $this->actingAs($admin)->put(route('admin.companies.update', $company), companyPayload([
        'email' => 'updated@acme.test',
        'contact_number' => '(049) 555-0199',
        'representative_first_name' => 'Elena',
        'representative_middle_name' => '',
        'representative_last_name' => 'Dela Cruz',
        'representative_position' => 'People Operations Manager',
    ]))->assertRedirect(route('admin.companies.index'));

    $account = $company->account()->firstOrFail()->fresh();
    expect($account->name)->toBe('Elena Dela Cruz')
        ->and($account->position)->toBe('People Operations Manager')
        ->and($account->email)->toBe('updated@acme.test')
        ->and($account->contact)->toBe('(049) 555-0199')
        ->and($account->role)->toBe('company');
});

test('company contact accepts a landline telephone number with area code', function () {
    Mail::fake();
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)->post(route('admin.companies.store'), companyPayload([
        'contact_number' => '(049) 833-3127',
    ]))->assertRedirect(route('admin.companies.index'));

    $this->assertDatabaseHas('companies', [
        'email' => 'portal@acme.test',
        'contact_number' => '(049) 833-3127',
    ]);
});

test('duplicate company names and login emails are rejected', function () {
    Mail::fake();
    $admin = User::factory()->create(['role' => 'admin']);
    Company::create(companyPayload());
    User::factory()->create(['email' => 'existing@acme.test']);

    $this->actingAs($admin)->post(route('admin.companies.store'), companyPayload([
        'email' => 'existing@acme.test',
    ]))->assertSessionHasErrors(['company_name', 'email']);
});

test('partially selected companies serialize without invoking a legacy name accessor', function () {
    Company::create(companyPayload());

    $company = Company::query()->firstOrFail(['id', 'company_name']);
    $serialized = $company->toArray();

    expect($serialized)
        ->toHaveKey('company_name', 'Acme Medical Industries')
        ->not->toHaveKey('name');
});

test('a failed invitation rolls back both company and login records', function () {
    Mail::shouldReceive('to')->once()->andThrow(new RuntimeException('Mail unavailable'));
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)->post(route('admin.companies.store'), companyPayload())
        ->assertSessionHas('error');

    $this->assertDatabaseMissing('companies', ['email' => 'portal@acme.test']);
    $this->assertDatabaseMissing('users', ['email' => 'portal@acme.test']);
});

test('deactivation disables only the company login and preserves linked employees', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $company = Company::create(companyPayload());
    $login = User::factory()->create(['role' => 'company', 'company_id' => $company->id]);
    $employee = User::factory()->create(['role' => 'patient', 'company_id' => $company->id]);

    $this->actingAs($admin)->patch(route('admin.companies.toggle-active', $company))
        ->assertSessionHas('success');

    expect($company->fresh()->status)->toBe('inactive')
        ->and($login->fresh()->is_active)->toBeFalse()
        ->and($employee->fresh())->not->toBeNull()
        ->and($employee->fresh()->is_active)->toBeTrue();
});

test('company must replace its temporary password before opening the dashboard', function () {
    $company = Company::create(companyPayload());
    $account = User::factory()->create([
        'role' => 'company',
        'company_id' => $company->id,
        'password' => Hash::make('TempPass!234567'),
        'must_change_password' => true,
        'temporary_password_expires_at' => now()->addHour(),
    ]);

    $this->actingAs($account)->get(route('company.dashboard'))
        ->assertRedirect(route('temporary-password.edit'));

    $this->actingAs($account)->put(route('temporary-password.update'), [
        'current_password' => 'TempPass!234567',
        'password' => 'PermanentPass!789',
        'password_confirmation' => 'PermanentPass!789',
    ])->assertRedirect('/company/dashboard');

    expect($account->fresh()->must_change_password)->toBeFalse()
        ->and(Hash::check('PermanentPass!789', $account->fresh()->password))->toBeTrue();
});
