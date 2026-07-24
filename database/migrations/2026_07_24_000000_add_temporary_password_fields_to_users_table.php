<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('must_change_password')->default(false)->index();
            $table->timestamp('temporary_password_created_at')->nullable();
            $table->timestamp('temporary_password_expires_at')->nullable()->index();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['must_change_password']);
            $table->dropIndex(['temporary_password_expires_at']);
            $table->dropColumn([
                'must_change_password',
                'temporary_password_created_at',
                'temporary_password_expires_at',
            ]);
        });
    }
};
