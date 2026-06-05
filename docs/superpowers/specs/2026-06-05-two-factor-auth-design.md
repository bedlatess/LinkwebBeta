# LinkWeb TOTP 2FA Design

Date: 2026-06-05
Status: Design for review
Scope: TOTP-only two-factor authentication with QR-Code setup and recovery codes

## 1. Goal

Add two-factor authentication to LinkWeb without email codes or SMS codes.

The first version supports only standards-based TOTP authenticators such as Google Authenticator, Microsoft Authenticator, 1Password, Bitwarden, Aegis, and similar apps. Users enable 2FA by scanning a QR-Code generated from an `otpauth://totp/...` URI, then confirming with a 6-digit code.

The feature applies to:

- Regular users.
- Regular users promoted to `ADMIN`.
- CLI-created super administrators stored in `AdminUser`.

The system admin area can additionally require administrators to enable 2FA before they can use protected admin functions.

## 2. Non-Goals

This version will not implement:

- Email verification codes.
- SMS verification codes.
- WebAuthn/passkeys.
- Remember-this-device bypass.
- Third-party 2FA providers.
- Social recovery or email-based account recovery.

If a super administrator loses all 2FA access, recovery is handled by a CLI reset command, not by email.

## 3. Recommended Approach

Use a 2FA gate after primary authentication.

Primary authentication remains unchanged:

- Regular users authenticate through Auth.js / NextAuth credentials or optional GitHub/Google OAuth.
- Super administrators authenticate through `/sys-admin/api/login` and the existing independent admin session flow.

After primary authentication:

- If the account does not have 2FA enabled, the current behavior continues.
- If the account has 2FA enabled, access to protected app areas is blocked until the user completes TOTP or recovery-code verification.
- A successful 2FA challenge writes an HttpOnly signed cookie proving that the current primary session has passed 2FA.

This approach fits the current project because `src/proxy.ts` already centralizes route protection for `/dashboard`, `/sys-admin`, and sensitive API routes.

## 4. Dependencies

Add these packages:

- `otplib`: TOTP secret generation and token validation.
- `qrcode`: QR-Code data URL generation.
- `@types/qrcode`: TypeScript types for `qrcode`.

The design intentionally keeps QR-Code generation server-side for setup responses, so client components receive an image data URL rather than building QR logic themselves.

## 5. Data Model

Add 2FA fields to `User`:

```prisma
twoFactorEnabled     Boolean   @default(false)
twoFactorSecret      String?
twoFactorConfirmedAt DateTime?
twoFactorBackupCodes String?
```

Add the same fields to `AdminUser`:

```prisma
twoFactorEnabled     Boolean   @default(false)
twoFactorSecret      String?
twoFactorConfirmedAt DateTime?
twoFactorBackupCodes String?
```

Add an admin policy field to `SiteSettings`:

```prisma
requireAdminTwoFactor Boolean @default(false)
```

### Secret Storage

`twoFactorSecret` must be recoverable by the server because TOTP verification requires the original shared secret. Store it encrypted, not hashed.

Use AES-GCM encryption with:

- Preferred key: `TWO_FACTOR_ENCRYPTION_KEY`.
- Fallback key: `NEXTAUTH_SECRET`.

Production documentation should recommend setting `TWO_FACTOR_ENCRYPTION_KEY` separately from `NEXTAUTH_SECRET`.

### Backup Codes

Recovery codes are one-time codes generated when 2FA is enabled. Store only hashes, never plaintext.

The stored `twoFactorBackupCodes` value can be a JSON array of records:

```json
[
  {
    "hash": "sha256-or-bcrypt-hash",
    "usedAt": null
  }
]
```

Using bcrypt is acceptable but slower. SHA-256 with a server-side secret pepper is also acceptable because recovery codes are high-entropy random values. The implementation should pick one approach and keep it consistent.

## 6. Shared 2FA Library

Create a small library module, for example `src/lib/two-factor.ts`, responsible for:

- Generating TOTP secrets.
- Building `otpauth://totp/...` URLs.
- Generating QR-Code data URLs.
- Verifying 6-digit TOTP tokens.
- Encrypting/decrypting TOTP secrets.
- Generating backup codes.
- Hashing and verifying backup codes.
- Creating and verifying 2FA verification cookies.

This keeps 2FA logic out of page components and route handlers.

## 7. Regular User Flow

### 7.1 Setup

Add an account security section to the existing dashboard settings area.

Setup API sequence:

1. User clicks "Enable 2FA".
2. Client calls `POST /api/settings/2fa/setup`.
3. Server confirms the user is authenticated.
4. Server generates a temporary TOTP secret.
5. Server stores the setup secret in a short-lived HttpOnly cookie or server-side signed token.
6. Server returns:
   - QR-Code data URL.
   - Manual secret text.
   - Issuer and account label.
7. User scans the QR-Code and enters a 6-digit code.
8. Client calls `POST /api/settings/2fa/confirm`.
9. Server verifies the code against the pending secret.
10. Server encrypts and saves the TOTP secret, enables 2FA, stores hashed backup codes, and returns the plaintext backup codes once.

The feature should not enable 2FA until confirmation succeeds.

### 7.2 Disable

Disable API sequence:

1. User clicks "Disable 2FA".
2. User must provide a valid current TOTP code or valid recovery code.
3. Server clears:
   - `twoFactorEnabled`
   - `twoFactorSecret`
   - `twoFactorConfirmedAt`
   - `twoFactorBackupCodes`
4. Server clears the 2FA verification cookie for that actor.

### 7.3 Regenerate Backup Codes

Regeneration requires a valid TOTP code. New backup codes replace the old hashed code list and are shown once.

## 8. Login and Gate Flow

### 8.1 Regular Users

Auth.js credentials and OAuth continue to create the normal primary session.

Then `src/proxy.ts` checks:

- Is the route protected?
- Is the current user authenticated?
- Does the user have `twoFactorEnabled = true`?
- Does the request contain a valid 2FA verification cookie bound to this user session?

If 2FA is required but not verified:

- Page requests redirect to `/auth/2fa?callbackUrl=...`.
- Sensitive API requests return `403` with a machine-readable code such as `TWO_FACTOR_REQUIRED`.

The `/auth/2fa` page lets the user enter:

- A 6-digit TOTP code.
- Or a recovery code.

After success, the server writes a 2FA verification cookie and redirects to the callback URL.

### 8.2 Super Administrators

The existing `/sys-admin/api/login` route should keep primary password verification.

If the matched `AdminUser` has 2FA enabled:

- Do not immediately create the final admin session.
- Create a short-lived admin 2FA challenge token.
- Return `{ requiresTwoFactor: true }`.
- The admin login form switches to a 2FA code step.
- `/sys-admin/api/login/2fa` verifies the challenge and TOTP/recovery code.
- Only after successful 2FA does the server call `createAdminSession` and set `__Host-linkweb-admin`.

This is stricter than the regular user gate because super admin login is already custom and easier to split into primary and secondary phases.

### 8.3 Promoted Regular Admins

Promoted regular admins authenticate through Auth.js credentials fallback in `src/app/sys-admin/login/admin-login-form.tsx`.

After Auth.js sign-in, `src/proxy.ts` applies the same 2FA gate as regular users. If admin 2FA is required globally, a promoted admin without enabled 2FA can only access the security setup flow.

## 9. 2FA Verification Cookie

Add a cookie such as:

```text
__Host-linkweb-2fa
```

The cookie should be:

- HttpOnly.
- Secure in production.
- SameSite strict or lax.
- Path `/`.
- Signed with `NEXTAUTH_SECRET` or a dedicated 2FA cookie secret.

The payload should bind verification to the current actor:

```json
{
  "actorType": "user",
  "actorId": "user-id",
  "sessionMarker": "derived-session-marker",
  "iat": 123,
  "exp": 123
}
```

For regular users, the cookie must bind to the current Auth.js session/user. For super administrators, it can bind to the admin challenge or final admin session version.

When a user disables 2FA, signs out, resets password, or an admin `tokenVersion` changes, the 2FA cookie should no longer authorize access.

## 10. Admin Policy

Add a global setting:

- Label: "Require 2FA for administrators"
- Storage: `SiteSettings.requireAdminTwoFactor`

When enabled:

- Super administrators must enable 2FA.
- Promoted regular admins must enable 2FA.
- Admins without configured 2FA can access only the 2FA setup page and logout.

Regular non-admin users can still choose whether to enable 2FA.

## 11. API Surface

Regular user APIs:

- `POST /api/settings/2fa/setup`
- `POST /api/settings/2fa/confirm`
- `POST /api/settings/2fa/verify`
- `POST /api/settings/2fa/disable`
- `POST /api/settings/2fa/backup-codes/regenerate`

Super admin APIs:

- `POST /sys-admin/api/login/2fa`
- `POST /sys-admin/api/2fa/setup`
- `POST /sys-admin/api/2fa/confirm`
- `POST /sys-admin/api/2fa/disable`
- `POST /sys-admin/api/2fa/backup-codes/regenerate`

The two setup implementations can share the same library functions but must load and update different Prisma models.

## 12. UI Changes

### Regular User Dashboard

In `/dashboard/settings`, add a "Security" card:

- Current 2FA status.
- Enable button.
- QR-Code setup modal.
- Manual secret fallback.
- Confirmation code input.
- Backup code display after successful setup.
- Regenerate backup codes.
- Disable 2FA.

### Regular 2FA Challenge Page

Add `/auth/2fa`:

- Shows a 6-digit TOTP input.
- Allows switching to recovery-code input.
- Respects `callbackUrl`.
- Provides clear errors for invalid code, expired challenge, and missing primary login.

### Super Admin Login

Update `/sys-admin/login` form:

- Keep current email/password step.
- If `/sys-admin/api/login` returns `requiresTwoFactor`, replace the password form with a TOTP/recovery-code step.
- On success, redirect to the original admin callback URL.

### Admin Settings

In `/sys-admin/settings`, add the global admin policy toggle:

- "Require 2FA for administrators"
- Only visible/editable for actors with auth settings or site settings permission.

## 13. Error Handling

Use stable machine-readable error codes in JSON responses:

- `TWO_FACTOR_REQUIRED`
- `TWO_FACTOR_NOT_ENABLED`
- `TWO_FACTOR_ALREADY_ENABLED`
- `INVALID_TWO_FACTOR_CODE`
- `INVALID_RECOVERY_CODE`
- `TWO_FACTOR_SETUP_EXPIRED`
- `TWO_FACTOR_POLICY_REQUIRED`

User-facing Chinese copy can map from these codes in client components.

Rate-limit 2FA verification attempts:

- Per actor and per IP.
- Small default window, for example 5 attempts per 5 minutes.
- Do not auto-ban on normal 2FA mistakes in the first version.

## 14. Testing Plan

Manual verification:

- Enable 2FA for a regular credentials user.
- Confirm QR-Code works with an authenticator app.
- Sign out and sign in again; verify 2FA gate appears.
- Verify recovery code login works once and then cannot be reused.
- Disable 2FA with a valid TOTP code.
- Enable 2FA for a CLI-created super administrator.
- Verify `/sys-admin/api/login` requires 2FA before admin session is created.
- Enable global "Require 2FA for administrators".
- Verify promoted admins without 2FA can only reach the setup path.
- Verify non-admin users are not forced by the admin policy.
- Verify protected API routes return `TWO_FACTOR_REQUIRED` when 2FA is pending.

Automated tests, if added:

- Unit tests for encryption/decryption.
- Unit tests for TOTP verification with time drift.
- Unit tests for recovery-code hashing and one-time use.
- Route tests for 2FA setup, confirm, verify, disable.
- Proxy tests for protected route gating.

## 15. Implementation Order

1. Add dependencies.
2. Add Prisma fields and migration.
3. Implement `src/lib/two-factor.ts`.
4. Implement regular user setup/confirm/verify/disable APIs.
5. Add `/auth/2fa` challenge page.
6. Add `src/proxy.ts` 2FA gate for regular users and promoted admins.
7. Implement super admin 2FA challenge flow.
8. Add dashboard settings security UI.
9. Add admin policy setting.
10. Add tests and documentation.

## 16. Resolved Decision

The project will not use email or SMS for 2FA. Recovery is handled through one-time backup codes and, for super administrators, an explicit CLI reset path.
