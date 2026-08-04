# Email OTP, Forgot Password & Contact — Manual Test Checklist

Prerequisites on the VM/local:

- PostgreSQL migrated through **V5**
- Redis enabled (`codeit.redis.enabled=true`, autoconfigure exclude removed)
- Brevo SMTP env set (`CODEIT_MAIL_ENABLED=true`, `BREVO_SMTP_KEY`, `CODEIT_MAIL_FROM`, `CODEIT_MAIL_INBOX`)
- API running on `:9091`

## 1. Register → verify → login

- [ ] `POST /api/user/register` returns JSON with `needsVerification: true`
- [ ] Verification email arrives (HTML with 6-digit code)
- [ ] Login before verify returns **403** with `code: EMAIL_NOT_VERIFIED`
- [ ] Frontend `/verify-email` accepts OTP and redirects to login
- [ ] Resend works; second request within cooldown returns 429 / wait message
- [ ] After verify, login succeeds and JWT contains `tv`

## 2. Forgot password

- [ ] `POST /api/auth/forgot-password` always returns the same generic message (known + unknown email)
- [ ] OTP email only sent when the user exists
- [ ] `POST .../verify` returns `resetToken`
- [ ] `POST .../reset` updates password
- [ ] Old JWT is rejected after reset (`token_version` bump)
- [ ] Change-password in profile also bumps `token_version`

## 3. Contact

- [ ] `POST /api/contact` inserts a row (`PENDING` then `SENT` or `FAILED`)
- [ ] Inbox receives HTML notify mail when Brevo + `CODEIT_MAIL_INBOX` are set
- [ ] Logged-in request attaches `user_id` / profile email when JWT present
- [ ] Excess requests return **429**

## 4. Rate limits / fail-closed

- [ ] Without Redis: verify/resend/forgot return **503** `EMAIL_TEMPORARILY_UNAVAILABLE`
- [ ] Wrong OTP 5 times burns the OTP key (must resend)
- [ ] Register / verify / forgot / contact tiers return 429 under burst

## 5. Frontend smoke

- [ ] Stitch: register → verify → login; forgot wizard; contact form
- [ ] Production frontend: same routes `/verify-email`, `/forgot-password`, `/contact`

## 6. Cloudflare Turnstile

With `CODEIT_CAPTCHA_ENABLED=true` and valid Turnstile keys:

- [ ] `GET /api/captcha/config` returns `{ enabled: true, provider: "turnstile", siteKey: "..." }`
- [ ] Login / register / verify / forgot / contact pages show the Turnstile widget
- [ ] Submit without completing captcha returns **400** `CAPTCHA_FAILED`
- [ ] Valid captcha allows the request through; widget resets after failure

With captcha disabled (`CODEIT_CAPTCHA_ENABLED=false`):

- [ ] Config returns `enabled: false`; forms work without a widget
