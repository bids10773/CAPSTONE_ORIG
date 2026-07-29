<?php

namespace App\Repositories;

use App\Models\DiseaseCaseRecord;
use Illuminate\Support\Collection;

class DiseaseCaseRepository
{
    /**
     * Return one normalized observation per disease/month.
     *
     * @return Collection<int, array{disease:string, month:string, cases:int}>
     */
    public function monthly(?string $disease = null, ?int $year = null): Collection
    {
        return DiseaseCaseRecord::query()
            ->when($disease, fn ($query) => $query->where('disease_name', $disease))
            ->when($year, fn ($query) => $query->whereYear('record_month', $year))
            ->orderBy('disease_name')
            ->orderBy('record_month')
            ->get(['disease_name', 'record_month', 'case_count'])
            ->map(fn (DiseaseCaseRecord $row) => [
                'disease' => $row->disease_name,
                'month' => $row->record_month->format('Y-m'),
                'cases' => $row->case_count,
            ]);
    }

    /** @return list<string> */
    public function diseases(): array
    {
        return DiseaseCaseRecord::query()
            ->distinct()
            ->orderBy('disease_name')
            ->pluck('disease_name')
            ->all();
    }
}
