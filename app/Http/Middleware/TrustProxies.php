<?php

namespace App\Http\Middleware;

use Illuminate\Http\Middleware\TrustProxies as Middleware;
use Illuminate\Http\Request;
use InvalidArgumentException;

class TrustProxies extends Middleware
{
    protected function setTrustedProxyIpAddresses(Request $request)
    {
        $proxies = config('http_trust.proxies', []);

        if (! is_array($proxies)) {
            throw new InvalidArgumentException('Trusted proxies must be an array of explicit IP addresses or CIDRs.');
        }

        foreach ($proxies as $proxy) {
            if (! is_string($proxy) || ! $this->isExplicitProxy($proxy)) {
                throw new InvalidArgumentException('Trusted proxies must contain only explicit IP addresses or nonzero CIDRs.');
            }
        }

        if (config('http_trust.railway.enabled') === true) {
            if ($proxies !== []) {
                throw new InvalidArgumentException('Use Railway proxy mode or an explicit proxy list, not both.');
            }

            $this->setRailwayProxy($request);

            return;
        }

        // Do not inherit platform hostname heuristics or caller-address wildcards.
        $request->setTrustedProxies($proxies, $this->getTrustedHeaderNames());
    }

    private function setRailwayProxy(Request $request): void
    {
        $environment = config('http_trust.railway.environment_id');
        $url = (string) config('app.url');

        if (! is_string($environment) || trim($environment) === ''
            || parse_url($url, PHP_URL_SCHEME) !== 'https' || ! parse_url($url, PHP_URL_HOST)
            || config('http_trust.railway.tcp_application_port')) {
            throw new InvalidArgumentException('Railway proxy mode requires Railway environment metadata, an HTTPS APP_URL and no TCP proxy on this service.');
        }

        $client = trim((string) $request->headers->get('X-Real-IP'));
        $scheme = strtolower(trim((string) $request->headers->get('X-Forwarded-Proto')));
        $peer = (string) $request->server->get('REMOTE_ADDR');

        if ($scheme !== 'https' || filter_var($client, FILTER_VALIDATE_IP) === false || filter_var($peer, FILTER_VALIDATE_IP) === false) {
            return;
        }

        // Explicit opt-in trusts this Railway environment's ingress, including
        // its private services. These headers do not authenticate edge origin.
        // Use Railway's single client-IP header; discard any supplied XFF chain.
        $request->headers->set('X-Forwarded-For', $client);
        $request->headers->set('X-Forwarded-Proto', 'https');
        $request->headers->set('X-Forwarded-Port', '443');
        $request->setTrustedProxies([$peer], $this->getTrustedHeaderNames());
    }

    protected function getTrustedHeaderNames()
    {
        // The edge must preserve the actual canonical Host header.
        return Request::HEADER_X_FORWARDED_FOR
            | Request::HEADER_X_FORWARDED_PORT
            | Request::HEADER_X_FORWARDED_PROTO;
    }

    private function isExplicitProxy(string $proxy): bool
    {
        $parts = explode('/', $proxy);

        if (count($parts) > 2 || filter_var($parts[0], FILTER_VALIDATE_IP) === false) {
            return false;
        }

        if (count($parts) === 1) {
            return true;
        }

        $maximum = str_contains($parts[0], ':') ? 128 : 32;

        return ctype_digit($parts[1]) && (int) $parts[1] > 0 && (int) $parts[1] <= $maximum;
    }
}
