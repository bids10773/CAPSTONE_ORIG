@props(['url'])
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px auto;">
    <tr>
        <td align="center" bgcolor="#56765c" style="border-radius:12px;">
            <a class="email-button" href="{{ $url }}" style="display:inline-block;padding:15px 28px;border:1px solid #56765c;border-radius:12px;background-color:#56765c;color:#ffffff;font-size:15px;line-height:20px;font-weight:700;text-decoration:none;">{{ $slot }}</a>
        </td>
    </tr>
</table>
