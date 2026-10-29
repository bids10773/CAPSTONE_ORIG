<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('medical_certificates', function (Blueprint $table): void {
            $table->string('verification_token', 64)->nullable()->unique();
        });
        DB::table('medical_certificates')->whereIn('status', ['issued', 'void'])
            ->orderBy('id')->chunkById(200, function ($certificates): void {
                foreach ($certificates as $certificate) {
                    DB::table('medical_certificates')->where('id', $certificate->id)
                        ->update(['verification_token' => Str::random(64)]);
                }
            });
    }

    public function down(): void
    {
        Schema::table('medical_certificates', function (Blueprint $table): void {
            $table->dropUnique(['verification_token']);
            $table->dropColumn('verification_token');
        });
    }
};
