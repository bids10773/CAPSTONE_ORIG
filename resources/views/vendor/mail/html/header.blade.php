@props(['url'])
<tr>
<td class="header">
<a href="{{ $url }}" style="display: inline-block;">
@if (trim($slot) === 'Laravel')
<img src="{{ asset('/public/images/full_logo.png') }}" class="logo" alt="LMIC Logo">
@else
{!! $slot !!}
@endif
</a>
</td>
</tr>
