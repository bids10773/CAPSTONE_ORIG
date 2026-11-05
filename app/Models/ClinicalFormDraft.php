<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class ClinicalFormDraft extends Model
{
    protected $fillable = ['appointment_id', 'author_id', 'form_type', 'payload'];

    protected function casts(): array
    {
        return ['payload' => 'encrypted:array'];
    }

    public static function forAuthor(Appointment $appointment, User $author, string $form): Builder
    {
        return static::query()->where('appointment_id', $appointment->id)
            ->where('author_id', $author->id)->where('form_type', $form);
    }

    public static function saveFor(Appointment $appointment, Request $request, string $form, array $payload): void
    {
        unset($payload['save_action']);
        static::updateOrCreate([
            'appointment_id' => $appointment->id, 'author_id' => $request->user()->id, 'form_type' => $form,
        ], ['payload' => $payload]);
        ClinicalFormAudit::create([
            'appointment_id' => $appointment->id, 'actor_id' => $request->user()->id,
            'form_type' => $form, 'action' => 'draft_saved', 'changes' => ['saved' => true],
            'ip_address' => $request->ip(), 'user_agent' => $request->userAgent(),
        ]);
    }
}
