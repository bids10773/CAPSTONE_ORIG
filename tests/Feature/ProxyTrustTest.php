<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Route;

beforeEach(function () {
    config(['http_trust.proxies' => [], 'http_trust.hosts' => [], 'http_trust.railway.enabled' => false, 'http_trust.railway.environment_id' => null, 'http_trust.railway.tcp_application_port' => null]);
    Route::get('/__request-context', fn (Request $request) => response()->json([
        'ip' => $request->ip(), 'host' => $request->getHost(),
        'secure' => $request->isSecure(), 'port' => $request->getPort(),
    ]));
});

it('uses Railway client IP and HTTPS while ignoring other forwarded values in explicit Railway mode', function () {
    config(['http_trust.railway.enabled' => true, 'http_trust.railway.environment_id' => 'synthetic-environment', 'app.url' => 'https://lmichealth.company']);
    $this->app->instance('env', 'production');
    $this->withServerVariables(['REMOTE_ADDR' => '192.0.2.10'])
        ->withHeaders(['X-Real-IP' => '203.0.113.50', 'X-Forwarded-Proto' => 'https', 'X-Forwarded-For' => '198.51.100.99', 'X-Forwarded-Host' => 'evil.example', 'X-Forwarded-Port' => '1234', 'X-Forwarded-Prefix' => '/evil', 'Forwarded' => 'for=198.51.100.99;host=evil.example;proto=http'])
        ->getJson('http://lmichealth.company/__request-context')
        ->assertOk()->assertExactJson(['ip' => '203.0.113.50', 'host' => 'lmichealth.company', 'secure' => true, 'port' => 443]);
});

it('does not enable Railway trust from metadata or request headers alone', function () {
    config(['http_trust.railway.environment_id' => 'synthetic-environment']);
    $this->withServerVariables(['REMOTE_ADDR' => '192.0.2.10'])
        ->withHeaders(['X-Real-IP' => '203.0.113.50', 'X-Forwarded-Proto' => 'https', 'X-Railway-Edge' => 'synthetic'])
        ->getJson('http://localhost/__request-context')
        ->assertOk()->assertJsonPath('ip', '192.0.2.10')->assertJsonPath('secure', false);
});

it('fails closed when Railway mode lacks deployment metadata or a canonical HTTPS URL', function ($environment, $url) {
    config(['http_trust.railway.enabled' => true, 'http_trust.railway.environment_id' => $environment, 'app.url' => $url]);
    $this->withoutExceptionHandling()->getJson('/__request-context');
})->with([[null, 'https://lmichealth.company'], ['', 'https://lmichealth.company'], ['synthetic', 'http://lmichealth.company']])
    ->throws(InvalidArgumentException::class);

it('does not trust incomplete or malformed Railway forwarding context', function ($client, $scheme) {
    config(['http_trust.railway.enabled' => true, 'http_trust.railway.environment_id' => 'synthetic', 'app.url' => 'https://lmichealth.company']);
    $this->withServerVariables(['REMOTE_ADDR' => '192.0.2.10'])
        ->withHeaders(['X-Real-IP' => $client, 'X-Forwarded-Proto' => $scheme, 'X-Forwarded-For' => '198.51.100.99'])
        ->getJson('http://lmichealth.company/__request-context')
        ->assertOk()->assertJsonPath('ip', '192.0.2.10')->assertJsonPath('secure', false);
})->with([['', 'https'], ['not-an-ip', 'https'], ['203.0.113.50, 198.51.100.10', 'https'], ['203.0.113.50', 'http'], ['203.0.113.50', 'https,http']]);

it('rejects Railway mode combined with explicit proxies or a TCP proxy', function (bool $tcp) {
    config(['http_trust.railway.enabled' => true, 'http_trust.railway.environment_id' => 'synthetic', 'app.url' => 'https://lmichealth.company']);
    config($tcp ? ['http_trust.railway.tcp_application_port' => '8080'] : ['http_trust.proxies' => ['192.0.2.10']]);
    $this->withoutExceptionHandling()->getJson('/__request-context');
})->with([true, false])->throws(InvalidArgumentException::class);

it('rejects unexpected native hosts even in Railway mode', function () {
    config(['http_trust.railway.enabled' => true, 'http_trust.railway.environment_id' => 'synthetic', 'app.url' => 'https://lmichealth.company']);
    $this->app->instance('env', 'production');
    $this->withServerVariables(['REMOTE_ADDR' => '192.0.2.10'])
        ->withHeaders(['X-Real-IP' => '203.0.113.50', 'X-Forwarded-Proto' => 'https', 'X-Forwarded-Host' => 'lmichealth.company'])
        ->getJson('http://evil.example/__request-context')->assertStatus(400);
});

it('generates canonical HTTPS reset URLs through Railway without sending mail', function () {
    config(['http_trust.railway.enabled' => true, 'http_trust.railway.environment_id' => 'synthetic', 'app.url' => 'https://lmichealth.company']);
    Route::get('/__reset-url', fn () => ['url' => route('password.reset', ['token' => 'synthetic', 'email' => 'synthetic@example.test'])]);
    $this->withServerVariables(['REMOTE_ADDR' => '192.0.2.10'])
        ->withHeaders(['X-Real-IP' => '2001:db8::20', 'X-Forwarded-Proto' => 'https', 'X-Forwarded-Host' => 'evil.example'])
        ->getJson('http://lmichealth.company/__reset-url')->assertOk()
        ->assertJsonPath('url', 'https://lmichealth.company/reset-password/synthetic?email=synthetic%40example.test');
});

it('separates Railway visitors behind the same peer and prevents rotating XFF from bypassing recovery limits', function () {
    Notification::fake();
    config(['http_trust.railway.enabled' => true, 'http_trust.railway.environment_id' => 'synthetic', 'app.url' => 'https://lmichealth.company']);
    $this->withServerVariables(['REMOTE_ADDR' => '192.0.2.10'])->withHeader('X-Forwarded-Proto', 'https');
    foreach (range(1, 5) as $attempt) {
        $this->withHeaders(['X-Real-IP' => '203.0.113.50', 'X-Forwarded-For' => '198.51.100.'.$attempt])
            ->postJson('http://lmichealth.company/forgot-password', ['email' => 'absent@example.test'])->assertOk();
    }
    $this->withHeader('X-Forwarded-For', '198.51.100.99')
        ->postJson('http://lmichealth.company/forgot-password', ['email' => 'absent@example.test'])->assertTooManyRequests();
    $this->withHeader('X-Real-IP', '203.0.113.60')
        ->postJson('http://lmichealth.company/forgot-password', ['email' => 'absent@example.test'])->assertOk();
    Notification::assertNothingSent();
});

afterEach(function () {
    Request::setTrustedHosts([]);
    Request::setTrustedProxies([], 0);
});

it('ignores forwarded headers from an unconfigured peer', function () {
    $this->withServerVariables(['REMOTE_ADDR' => '192.0.2.10'])
        ->withHeaders(['X-Forwarded-For' => '203.0.113.50', 'X-Forwarded-Host' => 'evil.example', 'X-Forwarded-Proto' => 'https', 'X-Forwarded-Port' => '443'])
        ->getJson('http://localhost/__request-context')
        ->assertOk()->assertExactJson(['ip' => '192.0.2.10', 'host' => 'localhost', 'secure' => false, 'port' => 80]);
});

it('trusts only explicit proxy IPs and CIDRs while ignoring forwarded hosts', function ($proxy, $peer) {
    config(['http_trust.proxies' => [$proxy]]);
    $this->withServerVariables(['REMOTE_ADDR' => $peer])
        ->withHeaders(['X-Forwarded-For' => '203.0.113.50', 'X-Forwarded-Host' => 'evil.example', 'X-Forwarded-Proto' => 'https', 'X-Forwarded-Port' => '443'])
        ->getJson('http://localhost/__request-context')
        ->assertOk()->assertExactJson(['ip' => '203.0.113.50', 'host' => 'localhost', 'secure' => true, 'port' => 443]);
})->with([['192.0.2.10', '192.0.2.10'], ['192.0.2.0/24', '192.0.2.10'], ['2001:db8::/32', '2001:db8::10']]);

it('does not infer trusted proxies from hosting suffixes', function ($host) {
    $this->withServerVariables(['REMOTE_ADDR' => '192.0.2.10'])
        ->withHeaders(['X-Forwarded-For' => '203.0.113.50'])
        ->getJson('http://'.$host.'/__request-context')
        ->assertOk()->assertJsonPath('ip', '192.0.2.10');
})->with(['audit.on-forge.com', 'audit.on-vapor.com']);

it('does not trust an outside peer or skip an untrusted intermediate hop', function () {
    config(['http_trust.proxies' => ['192.0.2.0/24']]);
    $this->withServerVariables(['REMOTE_ADDR' => '198.51.100.10'])
        ->withHeader('X-Forwarded-For', '203.0.113.50')
        ->getJson('/__request-context')->assertOk()->assertJsonPath('ip', '198.51.100.10');
    $this->withServerVariables(['REMOTE_ADDR' => '192.0.2.10'])
        ->withHeader('X-Forwarded-For', '203.0.113.50, 198.51.100.10')
        ->getJson('/__request-context')->assertOk()->assertJsonPath('ip', '198.51.100.10');
});

it('does not allow forged forwarded addresses to evade login throttling', function () {
    $this->withServerVariables(['REMOTE_ADDR' => '192.0.2.10']);
    foreach (range(1, 5) as $attempt) {
        $this->withHeader('X-Forwarded-For', '203.0.113.'.$attempt)
            ->postJson('/login', ['email' => 'absent@example.test', 'password' => 'incorrect'])->assertUnprocessable();
    }
    $this->withHeader('X-Forwarded-For', '203.0.113.99')
        ->postJson('/login', ['email' => 'absent@example.test', 'password' => 'incorrect'])->assertTooManyRequests();
});

it('rejects unsafe proxy configuration', function ($proxy) {
    config(['http_trust.proxies' => [$proxy]]);
    $this->withoutExceptionHandling()->getJson('/__request-context');
})->with(['*', '**', 'REMOTE_ADDR', '0.0.0.0/0', '::/0', 'proxy.example', '192.0.2.0/33'])
    ->throws(InvalidArgumentException::class);

it('rejects unexpected production hosts including health checks', function ($host) {
    $this->app->instance('env', 'production');
    config(['app.url' => 'https://clinic.example.test']);
    $this->get('http://'.$host.'/up')->assertStatus(400);
})->with(['evil.example', 'sub.clinic.example.test']);

it('allows the canonical production host and explicit aliases', function ($host) {
    $this->app->instance('env', 'production');
    config(['app.url' => 'https://clinic.example.test', 'http_trust.hosts' => ['alias.example.test']]);
    $this->getJson('http://'.$host.'/__request-context')->assertOk()->assertJsonPath('host', $host);
})->with(['clinic.example.test', 'alias.example.test']);

it('does not allow forged forwarded addresses to evade recovery throttling', function () {
    Notification::fake();
    $this->withServerVariables(['REMOTE_ADDR' => '192.0.2.10']);
    foreach (range(1, 5) as $attempt) {
        $this->withHeader('X-Forwarded-For', '203.0.113.'.$attempt)
            ->postJson('/forgot-password', ['email' => 'absent@example.test'])->assertOk();
    }
    $this->withHeader('X-Forwarded-For', '203.0.113.99')
        ->postJson('/forgot-password', ['email' => 'absent@example.test'])->assertStatus(429);
    Notification::assertNothingSent();
});
