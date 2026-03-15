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
        Schema::create('physical_exams', function (Blueprint $table) {

    $table->id();

    $table->foreignId('appointment_id')->constrained();

    $table->foreignId('doctor_id')->constrained('users');

    $table->decimal('height',5,2)->nullable();
    $table->decimal('weight',5,2)->nullable();

    $table->string('blood_pressure')->nullable();

    $table->boolean('is_lungs_normal')->default(true);

    $table->text('lungs_remarks')->nullable();

    $table->enum('classification',[
        'Class A',
        'Class B',
        'Class C',
        'Pending',
        'Unfit'
    ]);

    $table->text('doctor_remarks')->nullable();

    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('physical_exams');
    }
};
