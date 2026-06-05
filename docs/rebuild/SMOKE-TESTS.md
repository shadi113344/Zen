# Post-deploy smoke tests

Run within 15 minutes of every production deploy. Check each box.

| # | Test | Expected |
|---|------|----------|
| S1 | Load `/log` | 200, no blank screen |
| S2 | Hard refresh | Assets load |
| S3 | Sign in | Session works |
| S4 | Log one habit | Persists after refresh |
| S5 | Tap habit name | `/habit/:id` loads |
| S6 | Open `/categories` | Lists categories |
| S7 | Open `/categories/health` (or your slug) | Score visible |
| S8 | `/profile/notifications` | Saves settings |
| S9 | `sw.js` | 200, correct MIME |
| S10 | Manifest | Valid in Chrome Application tab |
| S11 | Test push (if enabled) | Notification received |
| S12 | Mobile Safari A2HS | Opens standalone |
| S13 | Open `/goals` → add goal → refresh | Goal persists (local + cloud) |
| S14 | Today goal chips | Active goals show under hero; tap opens `/goals/:id` |
| S15 | Pull to refresh on Today (mobile) | Syncs habits/logs/goals from cloud |

## Release notes

- **Cache:** bump `CACHE_NAME` in `apps/web/public/sw.js` on each release.
- **Rollback:** Cloudflare → Deployments → previous version; bump SW cache after rollback.
