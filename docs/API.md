# Public form API

Two public forms post JSON to route handlers under `src/app/api`. The browser side lives in
`src/lib/forms/client.ts` (`fetchFormToken`, `submitPublicForm`).

## `GET /api/form-token`

Hosts: portfolio and blog. Response `200 { "token": "<issuedAtMs>.<hmac>" }`, `Cache-Control: no-store`.
The token is an HMAC-SHA256 (keyed by `AUTH_SECRET`) of the issue time. A submission is
accepted only when the token is at least 3 seconds and at most 2 hours old. Fetch it when
the visitor first focuses a field, not at render, because pages are cached. Both forms
wait at least 3.5 seconds after receiving a new token and refresh it after 110 minutes.
Token acquisition and submission each have a 15-second timeout with a retry path.

## `POST /api/contact`

Host: portfolio only (404 elsewhere). Body, at most 16 KB:

```json
{
  "name": "string, 1 to 80",
  "email": "valid email, at most 254",
  "subject": "string, 0 to 120 (send \"\" when empty)",
  "message": "string, 10 to 4000",
  "website": "honeypot, must be \"\"",
  "token": "from /api/form-token"
}
```

## `POST /api/comments`

Host: blog only (404 elsewhere). Body, at most 16 KB:

```json
{
  "postSlug": "slug of an existing, published post",
  "name": "string, 1 to 80",
  "email": "\"\" or a valid email, at most 254 (never shown publicly)",
  "body": "string, 2 to 2000",
  "website": "honeypot, must be \"\"",
  "token": "from /api/form-token"
}
```

## Responses (both endpoints)

| Status | Body | Meaning |
| --- | --- | --- |
| 200 | `{ "ok": true }` | Stored (comments wait for approval). Success is never returned for a discarded submission. |
| 400 | `{ "ok": false, "error": "...", "fieldErrors": { "email": ["..."] } }` | Validation failed. Field keys match the body keys. Honeypots and early, invalid or expired tokens also return 400, with a general verification error. |
| 403 | `{ "ok": false, "error": "..." }` | `Origin` header is not this site's origin. |
| 413 | `{ "ok": false, "error": "..." }` | Body over 16 KB. |
| 429 | `{ "ok": false, "error": "..." }` | Rate limited (5 a minute per sender, then 3 messages an hour or 10 comments a day). |
| 500 | `{ "ok": false, "error": "..." }` | Submission could not be confirmed; the client keeps entries for retry and never shows success. |

After `ok: true` the client fires the analytics event (`contact-sent`, or `comment-sent`
with `{ post: slug }`), then shows the success state: the contact form navigates to
`/contact/thanks`; the comment form shows "Thanks, your reply will appear once approved."
Never show success on any other status.
