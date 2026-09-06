<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'position')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->string('position', 100)->nullable()->after('last_name');
            });
        }

        $hasCompanyIndex = collect(Schema::getIndexes('users'))
            ->contains(fn (array $index): bool => $index['columns'] === ['company_id']);

        if (! $hasCompanyIndex) {
            Schema::table('users', function (Blueprint $table): void {
                $table->index('company_id', 'users_company_id_index');
            });
        }
    }

    public function down(): void
    {
        $hasCompanyIndex = collect(Schema::getIndexes('users'))
            ->contains(fn (array $index): bool => ($index['name'] ?? null) === 'users_company_id_index');

        Schema::table('users', function (Blueprint $table) use ($hasCompanyIndex): void {
            if ($hasCompanyIndex) {
                $table->dropIndex('users_company_id_index');
            }

            if (Schema::hasColumn('users', 'position')) {
                $table->dropColumn('position');
            }
        });
    }
};
