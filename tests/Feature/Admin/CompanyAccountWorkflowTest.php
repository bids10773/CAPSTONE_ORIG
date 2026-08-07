<?php

use App\Mail\CompanyInvitation;
use App\Models\Company;
use App\Models\User;
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
        ->and($account->must_change_password)->toBeTrue()
        ->and($account->is_active)->toBeTrue()
        ->and($account->password)->not->toBeNull();

    Mail::assertSent(CompanyInvitation::class, function (CompanyInvitation $mail) use ($account): bool {
        return $mail->hasTo('portal@acme.test')
            && Hash::check($mail->tempPassword, $account->password);
    });
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
