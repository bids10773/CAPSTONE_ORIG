<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasColumn('appointments', 'service_types')) {
            Schema::table('appointments', function (Blueprint $table) {
                $table->json('service_types')->nullable()->after('company_id');
            });
        }

        if (! Schema::hasColumn('appointments', 'referral_code')) {
            Schema::table('appointments', function (Blueprint $table) {
                $table->string('referral_code')->nullable()->after('service_types');
            });
        }

        if (! Schema::hasColumn('appointments', 'notes')) {
            Schema::table('appointments', function (Blueprint $table) {
                $table->text('notes')->nullable()->after('referral_code');
            });
        }

        if (! Schema::hasColumn('appointments', 'batch_id')) {
            Schema::table('appointments', function (Blueprint $table) {
                $table->string('batch_id')->nullable()->after('notes');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $columns = collect(['service_types', 'referral_code', 'notes', 'batch_id'])
            ->filter(fn (string $column): bool => Schema::hasColumn('appointments', $column))
            ->all();

        if ($columns !== []) {
            Schema::table('appointments', fn (Blueprint $table) => $table->dropColumn($columns));
        }
    }
};
