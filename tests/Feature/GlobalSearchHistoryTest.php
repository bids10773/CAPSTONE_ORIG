<?php

use App\Models\Appointment;
use App\Models\Company;
use App\Models\User;

beforeEach(function () {
    $this->withCredentials()->withCookie(config('session.cookie'), session()->getId());
});

test('empty search returns only authorized history and no records', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    User::factory()->create(['first_name' => 'HistoryPatient', 'role' => 'patient']);
    $this->actingAs($admin)->getJson(route('api.global-search'))
        ->assertOk()->assertJsonPath('recent', [])->assertJsonPath('groups', []);
    $this->postJson('/api/global-search/recent', ['q' => 'HistoryPatient', 'category' => 'patients'])->assertNoContent();
    $this->getJson(route('api.global-search'))
        ->assertOk()->assertJsonPath('recent.0.query', 'HistoryPatient')->assertJsonPath('recent.0.category', 'patients')
        ->assertJsonPath('groups', []);
});

test('recent searches are bounded deduplicated and only saved for matching authorized queries', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    foreach (range(1, 8) as $number) {
        User::factory()->create(['first_name' => 'HistoryTerm'.$number, 'role' => 'patient']);
        $this->actingAs($admin)->postJson('/api/global-search/recent', ['q' => 'HistoryTerm'.$number, 'category' => 'patients'])->assertNoContent();
    }
    $this->postJson('/api/global-search/recent', ['q' => 'historyterm5', 'category' => 'patients'])->assertNoContent();
    $this->postJson('/api/global-search/recent', ['q' => 'NoMatchingAuthorizedRecord', 'category' => 'patients'])->assertNoContent();
    $this->getJson(route('api.global-search'))->assertOk()->assertJsonCount(6, 'recent')
        ->assertJsonPath('recent.0.query', 'historyterm5')->assertJsonMissing(['query' => 'HistoryTerm1'])
        ->assertJsonMissing(['query' => 'NoMatchingAuthorizedRecord']);
});

test('history is isolated by account role and company even in the same browser session', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $otherAdmin = User::factory()->create(['role' => 'admin']);
    User::factory()->create(['first_name' => 'HistoryPatient', 'role' => 'patient']);
    $this->actingAs($admin)->postJson('/api/global-search/recent', ['q' => 'HistoryPatient', 'category' => 'patients'])->assertNoContent();
    $this->actingAs($otherAdmin)->getJson(route('api.global-search'))->assertJsonPath('recent', []);
    $admin->updateQuietly(['role' => 'receptionist']);
    $this->actingAs($admin)->getJson(route('api.global-search'))->assertJsonPath('recent', []);

    $one = Company::create(['company_name' => 'One', 'email' => 'one@example.test', 'status' => 'active']);
    $two = Company::create(['company_name' => 'Two', 'email' => 'two@example.test', 'status' => 'active']);
    $representative = User::factory()->create(['role' => 'company', 'company_id' => $one->id]);
    User::factory()->create(['first_name' => 'CompanyHistory', 'role' => 'patient', 'company_id' => $one->id]);
    $this->actingAs($representative)->postJson('/api/global-search/recent', ['q' => 'CompanyHistory', 'category' => 'patients'])->assertNoContent();
    $representative->updateQuietly(['company_id' => $two->id]);
    $this->actingAs($representative)->getJson(route('api.global-search'))->assertJsonPath('recent', []);
});

test('history is revalidated after assigned record access is revoked', function () {
    $doctor = User::factory()->create(['role' => 'doctor']);
    $patient = User::factory()->create(['role' => 'patient', 'first_name' => 'PreviouslyAssigned']);
    $visit = Appointment::create(['user_id' => $patient->id, 'doctor_id' => $doctor->id, 'type' => 'individual', 'status' => 'accepted', 'appointment_date' => today()]);
    $this->actingAs($doctor)->postJson('/api/global-search/recent', ['q' => 'PreviouslyAssigned', 'category' => 'appointments'])->assertNoContent();
    $this->getJson(route('api.global-search'))->assertJsonCount(1, 'recent');
    $visit->updateQuietly(['doctor_id' => null]);
    $this->getJson(route('api.global-search'))->assertOk()->assertJsonPath('recent', []);
});

test('an older session payload cannot erase a completed history update', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    User::factory()->create(['first_name' => 'HistoryRace', 'role' => 'patient']);
    $this->actingAs($admin)->getJson(route('api.global-search'))->assertOk();
    $snapshot = session()->all();
    $this->postJson('/api/global-search/recent', ['q' => 'HistoryRace', 'category' => 'patients'])->assertNoContent();
    session()->replace($snapshot);
    $this->getJson(route('api.global-search'))->assertOk()->assertJsonPath('recent.0.query', 'HistoryRace');
});

test('unauthorized history writes and single character searches follow the search access rules', function () {
    $this->postJson('/api/global-search/recent', ['q' => 'Patient', 'category' => 'patients'])->assertUnauthorized();
    $patient = User::factory()->create(['role' => 'patient']);
    $this->actingAs($patient)->postJson('/api/global-search/recent', ['q' => 'Patient', 'category' => 'patients'])->assertForbidden();
    $this->getJson(route('api.global-search', ['q' => 'a']))->assertOk();
    $this->getJson(route('api.global-search', ['q' => ' ']))->assertUnprocessable();
});
