# Private Beta readiness report

**Date:** 2026-08-07  
**Verdict:** Ready for invite-only private beta on the college VPS (sole admin).

## What shipped

| Area | Status |
|------|--------|
| Registration modes (`OPEN` / `INVITE_ONLY` / `COLLEGE_ONLY` alias) | Done — default `INVITE_ONLY` via `CODEIT_REGISTRATION_MODE` |
| `GET /api/registration/config` | Done — public |
| Flyway `V10__private_beta.sql` | Done — requests, invites (hashed), admin audit |
| Beta public APIs | Done — request-access, verify-invite |
| Beta admin APIs | Done — list/approve/reject/generate/list/resend/analytics |
| Register invite gate | Done — email-bound, one-time, TTL, consume in same TX |
| Invite hashing | Done — SHA-256(`pepper + rawCode`) |
| Invite email template | Done — `mail/beta-invite.html` |
| Admin write rate limit | **Disabled** — filter unwired from `SecurityConfig` / `RateLimitConfig` |
| Beta public rate limits | Done — 2/h request, 5/10m verify, 3/d resend-by-email; register sustained 3/h |
| Admin audit | Done — all beta admin actions |
| Stitch UI | Done — nav badge, request-access, register invite field, banner, FAB, Admin Private Beta |

## Ops switches

```bash
CODEIT_REGISTRATION_MODE=INVITE_ONLY   # or OPEN to restore open signup
CODEIT_PUBLIC_BASE_URL=https://your.domain
CODEIT_INVITE_PEPPER=...               # optional; falls back to OTP pepper
```

## Invite lifecycle (manual verify checklist)

1. Visitor → `/request-access` → `PENDING` row in `beta_access_requests`
2. Admin → Private Beta → Approve → invite email + raw code once in UI; audit row
3. Register with `?invite=&email=` → OTP flow → invite `USED`
4. Reject path leaves request `REJECTED`; wrong email / expired / reused codes fail register
5. `OPEN` mode: config `requiresInvite=false`; Register CTA returns; invite field hidden

## Security pass (short)

- Raw invite never stored; only hash + display prefix
- Public beta endpoints rate-limited; admin beta endpoints **not** IP-throttled (by design)
- `/api/admin/**` requires `ROLE_ADMIN`
- Captcha still applies on request-access / register / contact FAB when enabled
- No college-domain validation (out of scope)

## Build

- `./mvnw -DskipTests compile` — OK
- `frontend-stitch` `npm run build` — OK

## Residual / follow-ups

- End-to-end email send needs Brevo/`codeit.mail.enabled=true` in the target env
- Run Flyway on deploy so V10 applies before first request
- Optional: unit tests for invite hash/consume race (optimistic `UPDATE … WHERE status='ACTIVE'`)
