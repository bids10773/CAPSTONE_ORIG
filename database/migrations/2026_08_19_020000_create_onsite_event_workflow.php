<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // MySQL applies the statements generated for this table alteration one at
        // a time. Guarding each operation lets a failed Railway migration resume
        // without trying to add an already-created column, index, or constraint.
        if (! Schema::hasColumn('appointments', 'attendance_status')) {
            Schema::table('appointments', function (Blueprint $table) {
                $table->string('attendance_status', 20)->nullable()->after('expected_employee_count');
            });
        }

        if (! Schema::hasIndex('appointments', ['attendance_status'])) {
            Schema::table('appointments', function (Blueprint $table) {
                $table->index('attendance_status', 'appointments_attendance_status_index');
            });
        }

        if (! Schema::hasColumn('appointments', 'attendance_marked_by')) {
            Schema::table('appointments', function (Blueprint $table) {
                $table->foreignId('attendance_marked_by')->nullable()->after('attendance_status');
            });
        }

        $this->ensureForeignKey(
            'appointments',
            'attendance_marked_by',
            'users',
            'set null',
            'appointments_attendance_marked_by_foreign'
        );

        if (! Schema::hasColumn('appointments', 'attendance_marked_at')) {
            Schema::table('appointments', function (Blueprint $table) {
                $table->timestamp('attendance_marked_at')->nullable()->after('attendance_marked_by');
            });
        }

        if (! Schema::hasColumn('appointments', 'absence_reason')) {
            Schema::table('appointments', function (Blueprint $table) {
                $table->string('absence_reason', 50)->nullable()->after('attendance_marked_at');
            });
        }

        if (! Schema::hasColumn('appointments', 'absence_details')) {
            Schema::table('appointments', function (Blueprint $table) {
                $table->string('absence_details', 500)->nullable()->after('absence_reason');
            });
        }

        if (! Schema::hasColumn('appointments', 'onsite_event_status')) {
            Schema::table('appointments', function (Blueprint $table) {
                $table->string('onsite_event_status', 40)->nullable()->after('absence_details');
            });
        }

        if (! Schema::hasIndex('appointments', ['onsite_event_status'])) {
            Schema::table('appointments', function (Blueprint $table) {
                $table->index('onsite_event_status', 'appointments_onsite_event_status_index');
            });
        }

        if (! Schema::hasTable('onsite_event_staff')) {
            Schema::create('onsite_event_staff', function (Blueprint $table) {
                $table->id();
                $table->foreignId('bulk_appointment_id');
                $table->foreignId('user_id');
                $table->string('service_role', 20);
                $table->unsignedSmallInteger('queue_capacity')->default(10);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        $this->ensureColumnsExist('onsite_event_staff', [
            'id',
            'bulk_appointment_id',
            'user_id',
            'service_role',
            'queue_capacity',
            'is_active',
            'created_at',
            'updated_at',
        ]);
        $this->ensureForeignKey(
            'onsite_event_staff',
            'bulk_appointment_id',
            'appointments',
            'cascade',
            'onsite_staff_bulk_appointment_foreign'
        );
        $this->ensureForeignKey(
            'onsite_event_staff',
            'user_id',
            'users',
            'cascade',
            'onsite_staff_user_foreign'
        );
        $this->ensureIndex(
            'onsite_event_staff',
            ['bulk_appointment_id', 'user_id', 'service_role'],
            'onsite_staff_event_user_role_unique',
            unique: true
        );

        if (! Schema::hasTable('onsite_service_queues')) {
            Schema::create('onsite_service_queues', function (Blueprint $table) {
                $table->id();
                $table->foreignId('bulk_appointment_id');
                $table->foreignId('appointment_id');
                $table->string('service_role', 20);
                $table->foreignId('assigned_staff_id')->nullable();
                $table->string('status', 20)->default('waiting');
                $table->timestamp('assigned_at')->nullable();
                $table->timestamp('started_at')->nullable();
                $table->timestamp('completed_at')->nullable();
                $table->string('hold_reason', 500)->nullable();
                $table->timestamps();
            });
        }

        $this->ensureColumnsExist('onsite_service_queues', [
            'id',
            'bulk_appointment_id',
            'appointment_id',
            'service_role',
            'assigned_staff_id',
            'status',
            'assigned_at',
            'started_at',
            'completed_at',
            'hold_reason',
            'created_at',
            'updated_at',
        ]);
        $this->ensureForeignKey(
            'onsite_service_queues',
            'bulk_appointment_id',
            'appointments',
            'cascade',
            'onsite_queue_bulk_appointment_foreign'
        );
        $this->ensureForeignKey(
            'onsite_service_queues',
            'appointment_id',
            'appointments',
            'cascade',
            'onsite_queue_appointment_foreign'
        );
        $this->ensureForeignKey(
            'onsite_service_queues',
            'assigned_staff_id',
            'users',
            'set null',
            'onsite_queue_assigned_staff_foreign'
        );
        $this->ensureIndex('onsite_service_queues', ['status'], 'onsite_queue_status');
        $this->ensureIndex(
            'onsite_service_queues',
            ['appointment_id', 'service_role'],
            'onsite_queue_appointment_role_unique',
            unique: true
        );
        $this->ensureIndex(
            'onsite_service_queues',
            ['bulk_appointment_id', 'service_role', 'status'],
            'onsite_queue_event_role_status'
        );
        $this->ensureIndex(
            'onsite_service_queues',
            ['assigned_staff_id', 'status'],
            'onsite_queue_staff_status'
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('onsite_service_queues');
        Schema::dropIfExists('onsite_event_staff');

        $attendanceMarkerForeignKey = $this->foreignKeyForColumn('appointments', 'attendance_marked_by');

        if ($attendanceMarkerForeignKey !== null) {
            $foreignKey = $attendanceMarkerForeignKey['name'] ?? null;

            Schema::table('appointments', function (Blueprint $table) use ($foreignKey) {
                $table->dropForeign($foreignKey ?: ['attendance_marked_by']);
            });
        }

        $columns = collect([
            'attendance_status',
            'attendance_marked_by',
            'attendance_marked_at',
            'absence_reason',
            'absence_details',
            'onsite_event_status',
        ])->filter(fn (string $column): bool => Schema::hasColumn('appointments', $column))->all();

        if ($columns !== []) {
            Schema::table('appointments', fn (Blueprint $table) => $table->dropColumn($columns));
        }
    }

    private function ensureForeignKey(
        string $tableName,
        string $column,
        string $foreignTable,
        string $onDelete,
        string $constraintName
    ): void {
        $foreignKey = $this->foreignKeyForColumn($tableName, $column);

        if ($foreignKey !== null) {
            if (
                $foreignKey['foreign_table'] !== $foreignTable
                || $foreignKey['foreign_columns'] !== ['id']
                || $foreignKey['on_delete'] !== $onDelete
            ) {
                throw new RuntimeException(
                    "The {$tableName}.{$column} foreign key exists with an unexpected definition."
                );
            }

            return;
        }

        Schema::table($tableName, function (Blueprint $table) use (
            $column,
            $foreignTable,
            $onDelete,
            $constraintName
        ) {
            $definition = $table->foreign($column, $constraintName)
                ->references('id')
                ->on($foreignTable);

            match ($onDelete) {
                'cascade' => $definition->cascadeOnDelete(),
                'set null' => $definition->nullOnDelete(),
                default => throw new RuntimeException("Unsupported delete action [{$onDelete}]."),
            };
        });
    }

    /**
     * @param  list<string>  $columns
     */
    private function ensureIndex(
        string $tableName,
        array $columns,
        string $indexName,
        bool $unique = false
    ): void {
        if ($this->hasIndex($tableName, $columns, $unique)) {
            return;
        }

        Schema::table($tableName, function (Blueprint $table) use ($columns, $indexName, $unique) {
            if ($unique) {
                $table->unique($columns, $indexName);

                return;
            }

            $table->index($columns, $indexName);
        });
    }

    /**
     * Laravel exposes uniqueness separately from an index's database type
     * (for example, MySQL reports the type as "btree").
     *
     * @param  list<string>  $columns
     */
    private function hasIndex(string $tableName, array $columns, bool $unique): bool
    {
        foreach (Schema::getIndexes($tableName) as $index) {
            if ($index['columns'] === $columns && (! $unique || $index['unique'])) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param  list<string>  $columns
     */
    private function ensureColumnsExist(string $tableName, array $columns): void
    {
        $missing = array_values(array_filter(
            $columns,
            fn (string $column): bool => ! Schema::hasColumn($tableName, $column)
        ));

        if ($missing !== []) {
            throw new RuntimeException(
                "The {$tableName} table is incomplete; missing columns: ".implode(', ', $missing).'.'
            );
        }
    }

    /**
     * @return array<string, mixed>|null
     */
    private function foreignKeyForColumn(string $tableName, string $column): ?array
    {
        foreach (Schema::getForeignKeys($tableName) as $foreignKey) {
            if ($foreignKey['columns'] === [$column]) {
                return $foreignKey;
            }
        }

        return null;
    }
};
