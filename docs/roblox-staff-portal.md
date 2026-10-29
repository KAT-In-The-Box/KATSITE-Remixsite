# Roblox staff portal setup

This document describes the required configuration for the KaTBox Interactives staff portal.

## Roblox OAuth app

1. Create an OAuth app in the Roblox Creator Dashboard.
2. Register the exact callback URL `<SITE_ORIGIN>/auth/roblox/callback`. For local development, use `http://localhost:44100/auth/roblox/callback`; for production, replace the origin with the deployed HTTPS site origin.
3. Enable the identity and resource permissions needed for sign-in and group/experience importing. Prefer read-only permissions unless publishing or editing places is explicitly required.
4. Store the client ID and client secret as server environment variables. Never put the client secret in client-side code, HTML, browser storage, or a public repository.

## Server environment

Set these variables in the hosting provider's server environment:

- `SITE_ORIGIN`: canonical origin, with no trailing slash (for example `https://your-domain.example`).
- `ROBLOX_OAUTH_CLIENT_ID`: OAuth app client ID.
- `ROBLOX_OAUTH_CLIENT_SECRET`: OAuth app client secret.
- `ROBLOX_STAFF_USER_IDS`: comma-separated numeric Roblox user IDs allowed to use the manager, e.g. `123456,789012`.
- `MONGODB_URI` and optionally `MONGODB_DB`: persistent storage for sessions and imported records.

Do not share the OAuth client secret in chat or commit it to Git.

## Authorization model

OAuth proves which Roblox account signed in; it does not make every Roblox user a staff member. The portal must compare the verified Roblox user ID against `ROBLOX_STAFF_USER_IDS` on the server before showing manager data or accepting manager actions. Protect every write/import endpoint independently of the UI.

## Permissions

The `universe-places` Write permission is broad: Roblox indicates it applies to all existing places in the experience. Do not grant it just to list/import games. Use the narrowest available read permission for the required feature and add write permissions only if the manager later needs to publish or modify places.

## Before launch

- Configure OAuth credentials only in the hosting environment.
- Use HTTPS in production and an exact matching redirect URI.
- Require MongoDB in production for persistent sessions and imports.
- Verify state and PKCE on the OAuth callback.
- Use HttpOnly, Secure (production), SameSite=Lax session cookies.
- Check the staff allowlist on every protected request.
- Test with one authorized and one unauthorized Roblox account.
