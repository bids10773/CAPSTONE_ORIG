<?php

use App\Models\Appointment;
use App\Models\DataBackup;
use App\Models\DataManagementSetting;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

test('only administrators can manage retention and backups', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $patient = User::factory()->create(['role' => 'patient']);

    $this->actingAs($admin)
        ->get('/admin/data-management')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/data-management/index')
            ->where('policy.backup_interval_months', 6)
            ->has('retentionSummary')
            ->has('backups'));

    $this->actingAs($patient)->get('/admin/data-management')->assertForbidden();
    $this->actingAs($patient)->post('/admin/data-management/backups')->assertForbidden();
});

test('administrator configures policy with a fixed six month backup interval', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)->patch('/admin/data-management', [
        'retention_years' => 5,
        'inactivity_months' => 18,
        'scheduled_backups_enabled' => true,
        'automatic_deletion_enabled' => true,
    ])->assertRedirect();

    $settings = DataManagementSetting::current();
    expect($settings->retention_years)->toBe(5)
        ->and($settings->inactivity_months)->toBe(18)
        ->and($settings->backup_interval_months)->toBe(6)
        ->and($settings->scheduled_backups_enabled)->toBeTrue()
        ->and($settings->automatic_deletion_enabled)->toBeTrue();

    $this->actingAs($admin)->patch('/admin/data-management', [
        'retention_years' => 0,
        'inactivity_months' => 5,
        'scheduled_backups_enabled' => true,
        'automatic_deletion_enabled' => false,
    ])->assertSessionHasErrors(['retention_years', 'inactivity_months']);
});

test('administrator creates and downloads a private manual backup', function () {
    Storage::fake('local');
    Storage::fake('public');
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->post('/admin/data-management/backups')
        ->assertRedirect()
        ->assertSessionHas('success');

    $backup = DataBackup::query()->sole();
    expect($backup->status)->toBe('completed')
        ->and($backup->type)->toBe('manual')
        ->and($backup->checksum_sha256)->toHaveLength(64)
        ->and($backup->size_bytes)->toBeGreaterThan(0);
    Storage::disk('local')->assertExists($backup->filename);

    $zip = new \ZipArchive;
    expect($zip->open(Storage::disk('local')->path($backup->filename)))->toBeTrue()
        ->and($zip->locateName('manifest.json'))->not->toBeFalse()
        ->and($zip->locateName('database/users.jsonl'))->not->toBeFalse()
        ->and($zip->getFromName('manifest.json'))->toBeFalse();
    $zip->setPassword(hash('sha256', config('data_management.encryption_key').'|lmic-data-backup-v1'));
    expect($zip->getFromName('manifest.json'))->not->toBeFalse();
    $zip->close();

    $this->actingAs($admin)
        ->get(route('admin.data-management.backups.download', $backup))
        ->assertDownload(basename($backup->filename));
});

test('scheduled backup runs once per six month period', function () {
    Storage::fake('local');
    Storage::fake('public');
    DataManagementSetting::current()->update(['scheduled_backups_enabled' => true]);

    $this->artisan('data:backup-scheduled')->assertSuccessful();
    $this->artisan('data:backup-scheduled')->assertSuccessful();

    expect(DataBackup::query()->where('type', 'scheduled')->where('status', 'completed')->count())->toBe(1);
});

test('retention creates a backup before deleting expired records and inactive accounts', function () {
    Storage::fake('local');
    Storage::fake('public');
    $activePatient = User::factory()->create([
        'role' => 'patient',
        'last_active_at' => now(),
    ]);
    $inactivePatient = User::factory()->create([
        'role' => 'patient',
        'last_active_at' => now()->subMonths(7),
        'created_at' => now()->subYear(),
    ]);
    $oldAppointment = Appointment::query()->create([
        'user_id' => $activePatient->id,
        'appointment_date' => now()->subYears(2),
        'type' => 'individual',
        'status' => 'completed',
        'service_types' => [],
    ]);

    DataManagementSetting::current()->update([
        'retention_years' => 1,
        'inactivity_months' => 6,
        'automatic_deletion_enabled' => true,
    ]);
    Storage::disk('local')->put('data-backups/expired.zip', 'expired backup');
    $expiredBackup = DataBackup::query()->create([
        'filename' => 'data-backups/expired.zip',
        'disk' => 'local',
        'type' => 'scheduled',
        'status' => 'completed',
        'completed_at' => now()->subYears(2),
    ]);

    $this->artisan('data:enforce-retention')->assertSuccessful();

    expect(DataBackup::query()->where('type', 'retention')->where('status', 'completed')->count())->toBe(1);
    $this->assertDatabaseMissing('appointments', ['id' => $oldAppointment->id]);
    $this->assertDatabaseMissing('users', ['id' => $inactivePatient->id]);
    $this->assertDatabaseHas('users', ['id' => $activePatient->id]);
    $this->assertDatabaseMissing('data_backups', ['id' => $expiredBackup->id]);
    Storage::disk('local')->assertMissing('data-backups/expired.zip');
});

test('retention anonymizes inactive staff who must remain linked to clinical history', function () {
    Storage::fake('local');
    Storage::fake('public');
    $patient = User::factory()->create(['role' => 'patient', 'last_active_at' => now()]);
    $doctor = User::factory()->create([
        'role' => 'doctor',
        'first_name' => 'Clinical',
        'last_name' => 'Doctor',
        'last_active_at' => now()->subMonths(7),
    ]);
    Appointment::query()->create([
        'user_id' => $patient->id,
        'doctor_id' => $doctor->id,
        'appointment_date' => now()->addMonth(),
        'type' => 'individual',
        'status' => 'accepted',
        'service_types' => ['PE'],
    ]);
    DataManagementSetting::current()->update([
        'inactivity_months' => 6,
        'automatic_deletion_enabled' => true,
    ]);

    $this->artisan('data:enforce-retention')->assertSuccessful();

    $doctor->refresh();
    expect($doctor->first_name)->toBe('Former')
        ->and($doctor->last_name)->toBe("Staff {$doctor->id}")
        ->and($doctor->email)->toEndWith('@retained.invalid')
        ->and($doctor->is_active)->toBeFalse()
        ->and($doctor->retention_anonymized_at)->not->toBeNull();
});
