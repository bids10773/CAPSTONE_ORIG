@php
    $policy = json_decode(file_get_contents(resource_path('content/privacy-policy.json')), true, 512, JSON_THROW_ON_ERROR);
    $terms = json_decode(file_get_contents(resource_path('content/terms.json')), true, 512, JSON_THROW_ON_ERROR);
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="index,follow">
  <title>Terms of Service | {{ config('app.name', 'Our Application') }}</title>
  <style>
    :root{color-scheme:light;--ink:#17324a;--muted:#586a7a;--accent:#225f83;--bg:#f5f8fb;--border:#dce5ed}
    *{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.7 system-ui,-apple-system,Segoe UI,sans-serif}
    header{background:#153c56;color:white;padding:32px 20px}header .inner,main,footer .inner{max-width:850px;margin:auto}
    header h1{margin:8px 0;font-size:clamp(1.8rem,4vw,2.5rem)}header p{margin:0;color:#d9e9f3}
    main{background:white;margin:28px auto;padding:clamp(22px,5vw,50px);border:1px solid var(--border);border-radius:18px}
    h2{margin:32px 0 8px;font-size:1.3rem}p{margin:10px 0}li{margin:5px 0}a{color:var(--accent)}a:focus-visible{outline:3px solid #f9a825;outline-offset:3px}
    .notice{background:#fff6dd;border-left:4px solid #df9c16;padding:14px 18px;border-radius:8px;margin:16px 0}
    footer{padding:8px 20px 36px;color:var(--muted)}footer .inner{display:flex;gap:16px;flex-wrap:wrap}
  </style>
</head>
<body>
  <header><div class="inner"><a href="/" style="color:white">← Home</a><h1>Terms and Conditions</h1><p>{{ config('app.name', 'Our Application') }} · Last updated: {{ $terms['updated'] }}</p></div></header>
  <main>
    <p>{{ $terms['introduction'] }}</p>
    @foreach ($terms['sections'] as $section)
      <section>
        <h2>{{ $loop->iteration }}. {{ $section['title'] }}</h2>
        @foreach ($section['paragraphs'] ?? [] as $paragraph)
          <p>{{ $paragraph }}</p>
        @endforeach
        @if (!empty($section['items']))
          <ul>
            @foreach ($section['items'] as $item)
              <li>{{ $item }}</li>
            @endforeach
          </ul>
        @endif
      </section>
    @endforeach
    <h2>{{ count($terms['sections']) + 1 }}. Contact us</h2>
    <p>For questions regarding these Terms and Conditions, contact the clinic:</p>
    <address>
      {{ $policy['contact']['name'] }}<br>
      {{ $policy['contact']['address'] }}<br>
      Email: <a href="mailto:{{ $policy['contact']['email'] }}">{{ $policy['contact']['email'] }}</a><br>
      Contact number: {{ $policy['contact']['phone'] }}
    </address>
  </main>
  <footer><div class="inner"><a href="{{ url('/terms') }}">Terms of Service</a><a href="{{ url('/privacy-policy') }}">Privacy Policy</a><a href="{{ url('/data-deletion') }}">Data Deletion</a></div></footer>
</body></html>
