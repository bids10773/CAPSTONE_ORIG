# Restore validator-required account locking

Authorized scope: restore the persistent lock after five failed password attempts and require a completed password reset. Retain all unrelated security fixes and the existing screen layout.

1. Add failing regression coverage for five failures across IPs/time windows, persistent denial of valid credentials, social and pending MFA denial, reset recovery, and sustained IP abuse. Update tests that asserted the superseded cooldown-only policy.
2. Restore database-backed failure counting using a transaction and row lock, cap at five, and audit the transition once. Keep public incorrect-credential responses generic. Clear consecutive failures only after completed authentication of an unlocked account.
3. Keep the five/minute email/IP and twenty/minute IP budgets; add fifty failed attempts/hour/IP. Successful authentication and password recovery must not erase aggregate IP budgets. Preserve explicit proxy trust, generic recovery responses and recovery request throttling.
4. Enforce persistent locks after credential/identity verification and on pending MFA challenges. A reset request or invalid token must not unlock an account. A valid completed reset clears persistent state and the current email/IP cooldown to allow immediate recovery.
5. Update existing login text, audit status and deployment notes. Run focused tests, isolated full PHP suite, frontend type/lint/build checks and independent read-only review.

Residual risk: a strict five-failure account-wide lock permits deliberate targeted lockouts even with IP controls. Distributed IPs and repeated abuse after recovery require operational monitoring and potentially an additional challenge service, which is outside this change.
