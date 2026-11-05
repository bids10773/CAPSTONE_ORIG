@if(! empty($physical->vital_signs_not_assessed))
    <div style="padding: 3px; color: #111;">
        <strong>Measurements not assessed</strong>
        @foreach($physical->vital_signs_not_assessed as $field => $reason)
            <div>{{ str_replace('_', ' ', $field) }} — Not assessed: {{ $reason }}</div>
        @endforeach
    </div>
@endif
