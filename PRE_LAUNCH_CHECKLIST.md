# Pre-Launch Checklist - Promotely

## Security Status: READY TO PUBLISH

All critical security improvements have been implemented.

---

## Required: External Configuration

### 1. Meta/Facebook App Configuration

#### OAuth Redirect URI
Add this redirect URI to your Meta App:
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/oauth-callback
```

#### Required Permissions
- `instagram_basic`
- `instagram_content_publish`
- `pages_show_list`
- `pages_read_engagement`
- `business_management`

### 2. Testing Checklist

- [ ] Create new account with email/password
- [ ] Login with existing account
- [ ] Connect Facebook via OAuth
- [ ] Generate AI suggestion (free trial)
- [ ] Verify rate limiting (6 quick requests)
- [ ] Switch light/dark theme
- [ ] Test data export / account deletion

---

## Security Features Implemented

1. AES-256-GCM token encryption
2. CSRF-protected OAuth with state tokens
3. Rate limiting (5 req/min on AI)
4. RLS on all tables
5. Security event logging
6. Soft delete with 30-day grace period
7. Security headers (CSP, HSTS, X-Frame-Options)
