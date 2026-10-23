<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'light') == 'dark'])>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="theme-color" content="{{ ($appearance ?? 'light') === 'dark' ? '#0e1711' : '#ffffff' }}">

    {{-- Inertia MUST control the title --}}
    @inertiaHead

    {{-- Fallback title (only used if no <Head> is set) --}}
    <title inertia>LMIC</title>

    {{-- Dark mode script --}}
    <script>
        (function() {
            const appearance = '{{ $appearance ?? "light" }}';

            const isDark = appearance === 'dark' || (
                appearance === 'system' &&
                window.matchMedia('(prefers-color-scheme: dark)').matches
            );

            document.documentElement.classList.toggle('dark', isDark);
            document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
            document.querySelector('meta[name="theme-color"]')
                ?.setAttribute('content', isDark ? '#0e1711' : '#ffffff');
        })();
    </script>

    {{-- Background styling --}}
    <style>
        html {
            background-color: #ffffff;
        }

        html.dark {
            background-color: #0e1711;
        }
    </style>

    {{-- Icons --}}
    <link rel="icon" type="image/png" href="{{ asset('images/email-logo-optimized.png') }}?v=3">
    <link rel="apple-touch-icon" href="{{ asset('images/email-logo-optimized.png') }}?v=3">

    {{-- Fonts --}}
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

    {{-- Vite --}}
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.tsx'])
</head>

<body class="font-sans antialiased">
    @inertia
</body>
</html>
