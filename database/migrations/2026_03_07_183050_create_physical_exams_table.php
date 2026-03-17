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

    $table->integer('pulse_rate')->nullable();
    $table->integer('respiration_rate')->nullable();

    /* ======================
       PHYSICAL FINDINGS
    ======================*/

    $table->string('head_scalp')->nullable();
    $table->string('eyes')->nullable();
    $table->string('ears')->nullable();
    $table->string('nose_sinuses')->nullable();
    $table->string('mouth_throat')->nullable();
    $table->string('neck_thyroid')->nullable();
    $table->string('chest_breast')->nullable();
    $table->string('lungs')->nullable();
    $table->string('heart')->nullable();
    $table->string('abdomen')->nullable();
    $table->string('back')->nullable();
    $table->string('anus')->nullable();
    $table->string('genitals')->nullable();
    $table->string('extremities')->nullable();
    $table->string('skin')->nullable();
    $table->string('dental')->nullable();

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
