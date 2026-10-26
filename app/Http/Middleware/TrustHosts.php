<?php

namespace App\Http\Middleware;

use Illuminate\Http\Middleware\TrustHosts as Middleware;
use Illuminate\Http\Request;
use InvalidArgumentException;

class TrustHosts extends Middleware
{
    public function hosts()
    {
        $canonicalHost = parse_url((string) config('app.url'), PHP_URL_HOST);
        $aliases = config('http_trust.hosts', []);

        if (! is_string($canonicalHost) || $canonicalHost === '' || ! is_array($aliases)) {
            throw new InvalidArgumentException('APP_URL must have a canonical host and trusted host aliases must be an array.');
        }

        return array_map(function ($host) {
            if (! is_string($host) || trim($host) === '') {
                throw new InvalidArgumentException('Trusted host aliases must be nonempty literal hostnames.');
            }

            return '^'.preg_quote(strtolower(trim($host)), '/').'$';
        }, [$canonicalHost, ...$aliases]);
    }

    public function handle(Request $request, $next)
    {
        if ($this->shouldSpecifyTrustedHosts()) {
            Request::setTrustedHosts($this->hosts());
            // Validate even routes that never otherwise read the host, including /up.
            $request->getHost();
        }

        return $next($request);
    }
}
