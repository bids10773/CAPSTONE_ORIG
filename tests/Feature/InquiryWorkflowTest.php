<?php

use App\Enums\InquiryStatus;
use App\Mail\CompanyInvitation;
use App\Mail\InquiryAcknowledgment;
use App\Mail\InquiryReply;
use App\Models\Company;
use App\Models\Inquiry;
use App\Models\User;
use App\Notifications\NewInquirySubmitted;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

function inquiryPayload(array $overrides = []): array
{
    return array_merge([
        'submission_key' => (string) Str::uuid(),
        'category' => 'company_account',
        'sender_first_name' => 'Maria',
        'sender_middle_name' => 'Santos',
        'sender_last_name' => 'Reyes',
        'representative_position' => 'HR Officer',
        'company_name' => 'ABC Manufacturing Inc.',
        'email' => 'hr@abc.test',
        'contact_number' => '(049) 833-3127',
        'subject' => 'Company Account Request',
        'message' => 'We would like to discuss becoming a clinic partner.',
    ], $overrides);
}

test('external company submits an inquiry without creating an account or credentials', function () {
    Mail::fake();
    Notification::fake();
    $admin = User::factory()->create(['role' => 'admin']);
    $companyCount = Company::count();
    $userCount = User::count();

    $this->post(route('inquiries.store'), inquiryPayload())
        ->assertRedirect(route('inquiries.create'))
        ->assertSessionHas('success', 'Your company account inquiry has been submitted. The clinic will review your request before an account can be created.');

    $inquiry = Inquiry::firstOrFail();
    expect($inquiry->sender_name)->toBe('Maria Santos Reyes')
        ->and($inquiry->status)->toBe(InquiryStatus::Pending)
        ->and($inquiry->user_id)->toBeNull()
        ->and(Company::count())->toBe($companyCount)
        ->and(User::count())->toBe($userCount);
    Mail::assertSent(InquiryAcknowledgment::class, fn ($mail) => $mail->hasTo('hr@abc.test'));
    Mail::assertNotSent(CompanyInvitation::class);
    Notification::assertSentTo($admin, NewInquirySubmitted::class);
});

test('admin inquiry notification opens the protected inquiry detail page', function () {
    Mail::fake();
    $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);

    $this->post(route('inquiries.store'), inquiryPayload())->assertRedirect();

    $inquiry = Inquiry::firstOrFail();
    $notification = $admin->notifications()->firstOrFail();

    expect($notification->data['url'])->toBe(route('admin.inquiries.show', $inquiry, false));

    $this->actingAs($admin)
        ->post(route('notifications.visit', $notification->id))
        ->assertRedirect(route('admin.inquiries.show', $inquiry, false));
});

test('general inquiry does not require company-specific fields', function () {
    Mail::fake();

    $this->post(route('inquiries.store'), inquiryPayload([
        'category' => 'general',
        'company_name' => '',
        'representative_position' => '',
        'contact_number' => '',
    ]))->assertRedirect(route('inquiries.create'));

    $this->assertDatabaseHas('inquiries', ['category' => 'general', 'company_name' => null, 'contact_number' => null]);
});

test('company account inquiry requires company details and validates contact format', function () {
    $this->post(route('inquiries.store'), inquiryPayload([
        'company_name' => ' ',
        'contact_number' => '123',
    ]))->assertSessionHasErrors(['company_name', 'contact_number']);
});

test('inquiry names subject and message reject blank-only values', function () {
    $this->post(route('inquiries.store'), inquiryPayload([
        'sender_first_name' => ' ',
        'sender_last_name' => ' ',
        'subject' => ' ',
        'message' => ' ',
    ]))->assertSessionHasErrors(['sender_first_name', 'sender_last_name', 'subject', 'message']);
});

test('submission key makes a repeated inquiry idempotent', function () {
    Mail::fake();
    $payload = inquiryPayload();

    $this->post(route('inquiries.store'), $payload)->assertRedirect();
    $this->post(route('inquiries.store'), $payload)->assertRedirect();

    expect(Inquiry::count())->toBe(1);
    Mail::assertSent(InquiryAcknowledgment::class, 1);
});

test('logged in company receives inquiry form prefill from its account', function () {
    $company = Company::create([
        'company_name' => 'Partner Corp', 'email' => 'company@partner.test',
        'contact_number' => '+63 912 345 6789', 'address' => 'Laguna',
        'industry_type' => 'Manufacturing', 'status' => 'active',
    ]);
    $account = User::factory()->create([
        'company_id' => $company->id, 'role' => 'company',
        'first_name' => 'Ana', 'middle_name' => null, 'last_name' => 'Cruz',
        'position' => 'HR Manager', 'email' => 'company@partner.test',
    ]);

    $this->actingAs($account)->get(route('inquiries.create', ['category' => 'company_services']))
        ->assertInertia(fn (Assert $page) => $page
            ->component('inquiries/create')
            ->where('initialValues.company_name', 'Partner Corp')
            ->where('initialValues.sender_first_name', 'Ana')
            ->where('initialValues.sender_middle_name', '')
            ->where('initialValues.sender_last_name', 'Cruz')
            ->where('initialValues.representative_position', 'HR Manager')
            ->where('initialValues.email', 'company@partner.test'));
});

test('authenticated sender can see only their own inquiries', function () {
    $sender = User::factory()->create();
    $other = User::factory()->create();
    Inquiry::create([...inquiryPayload(), 'user_id' => $sender->id]);
    Inquiry::create([...inquiryPayload(['submission_key' => (string) Str::uuid(), 'email' => 'other@test.test']), 'user_id' => $other->id]);

    $this->actingAs($sender)->get(route('inquiries.index'))
        ->assertInertia(fn (Assert $page) => $page->has('inquiries.data', 1)->where('inquiries.data.0.user_id', $sender->id));
});

test('only admin can manage inquiries', function () {
    $patient = User::factory()->create(['role' => 'patient']);
    $inquiry = Inquiry::create(inquiryPayload());

    $this->get(route('admin.inquiries.index'))->assertRedirect(route('login'));
    $this->actingAs($patient)->get(route('admin.inquiries.index'))->assertForbidden();
    $this->actingAs($patient)->get(route('admin.inquiries.show', $inquiry))->assertForbidden();
});

test('admin opening an inquiry marks pending as read', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $inquiry = Inquiry::create(inquiryPayload());

    $this->actingAs($admin)->get(route('admin.inquiries.show', $inquiry))
        ->assertInertia(fn (Assert $page) => $page
            ->where('inquiry.sender_name', 'Maria Santos Reyes')
            ->where('inquiry.representative_position', 'HR Officer'));
    expect($inquiry->fresh()->status)->toBe(InquiryStatus::Read);
});

test('company profile updates representative identity but protects official company contacts', function () {
    $company = Company::create([
        'company_name' => 'Protected Corp', 'email' => 'official@protected.test',
        'contact_number' => '(049) 833-3127', 'address' => 'Laguna',
        'industry_type' => 'Manufacturing', 'status' => 'active',
    ]);
    $account = User::factory()->create([
        'company_id' => $company->id, 'role' => 'company', 'first_name' => 'Old',
        'last_name' => 'Name', 'email' => 'official@protected.test', 'contact' => '(049) 833-3127',
    ]);

    $this->actingAs($account)->patch(route('profile.update'), [
        'first_name' => 'Maria', 'middle_name' => '', 'last_name' => 'Reyes',
        'position' => 'HR Officer', 'email' => 'tampered@example.test', 'contact' => '09123456789',
    ])->assertRedirect(route('profile.edit'));

    $account->refresh();
    expect($account->name)->toBe('Maria Reyes')
        ->and($account->position)->toBe('HR Officer')
        ->and($account->email)->toBe('official@protected.test')
        ->and($account->contact)->toBe('(049) 833-3127');
});

test('admin can respond and close an inquiry using canonical statuses', function () {
    Mail::fake();
    $admin = User::factory()->create(['role' => 'admin']);
    $inquiry = Inquiry::create(inquiryPayload());

    $this->actingAs($admin)->post(route('admin.inquiries.reply', $inquiry), [
        'response' => '  Thank you. We will schedule a verification call.  ',
    ])->assertSessionHas('success');

    expect($inquiry->fresh()->status)->toBe(InquiryStatus::Replied)
        ->and($inquiry->fresh()->response)->toBe('Thank you. We will schedule a verification call.')
        ->and($inquiry->fresh()->responded_by)->toBe($admin->id);
    Mail::assertSent(InquiryReply::class, fn ($mail) => $mail->hasTo('hr@abc.test'));

    $this->actingAs($admin)->patch(route('admin.inquiries.status', $inquiry), ['status' => 'closed'])
        ->assertSessionHas('success');
    expect($inquiry->fresh()->status)->toBe(InquiryStatus::Closed);
});

test('create company action opens existing form with unverified inquiry prefill only', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $inquiry = Inquiry::create(inquiryPayload());

    $this->actingAs($admin)->get(route('admin.inquiries.create-company', $inquiry))
        ->assertRedirect(route('admin.companies.create', ['inquiry' => $inquiry->id]));

    expect(Company::count())->toBe(0);
    $this->actingAs($admin)->get(route('admin.companies.create', ['inquiry' => $inquiry->id]))
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/companies/create')
            ->where('prefill.company_name', 'ABC Manufacturing Inc.')
            ->where('prefill.representative_first_name', 'Maria')
            ->where('prefill.representative_middle_name', 'Santos')
            ->where('prefill.representative_last_name', 'Reyes')
            ->where('prefill.representative_position', 'HR Officer')
            ->where('sourceInquiryId', $inquiry->id));
    expect(Company::count())->toBe(0);
});

test('admin submission converts inquiry through the existing secure company workflow', function () {
    Mail::fake();
    $admin = User::factory()->create(['role' => 'admin']);
    $inquiry = Inquiry::create(inquiryPayload());

    $this->actingAs($admin)->post(route('admin.companies.store'), [
        'company_name' => 'ABC Manufacturing Inc.',
        'email' => 'hr@abc.test',
        'contact_number' => '(049) 833-3127',
        'address' => 'Cabuyao, Laguna',
        'industry_type' => 'Manufacturing',
        'status' => 'active',
        'representative_first_name' => 'Maria',
        'representative_middle_name' => '',
        'representative_last_name' => 'Reyes',
        'representative_position' => 'HR Director',
        'source_inquiry_id' => $inquiry->id,
    ])->assertRedirect(route('admin.companies.index'));

    $company = Company::where('email', 'hr@abc.test')->firstOrFail();
    $account = $company->account()->firstOrFail();
    expect($account->name)->toBe('Maria Reyes')
        ->and($account->position)->toBe('HR Director')
        ->and($account->role)->toBe('company')
        ->and($account->must_change_password)->toBeTrue()
        ->and($account->temporary_password_expires_at->isAfter(now()->addHours(47)))->toBeTrue()
        ->and($inquiry->fresh()->converted_company_id)->toBe($company->id)
        ->and($inquiry->fresh()->status)->toBe(InquiryStatus::Closed);
    Mail::assertSent(CompanyInvitation::class, fn ($mail) => $mail->hasTo('hr@abc.test'));
});
