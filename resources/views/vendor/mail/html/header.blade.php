@props(['url'])
<tr>
<td class="header">
<a href="{{ $url }}" style="display: inline-block;">
@if (trim($slot) === 'Laravel')
<img src="{{ asset('images/full_logo2-optimized.png') }}" class="logo" alt="LMIC Logo">
@else
{!! $slot !!}
@endif
</a>
</td>
</tr>
