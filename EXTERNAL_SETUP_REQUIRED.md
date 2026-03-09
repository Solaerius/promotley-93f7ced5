# External Configuration Required

## Meta/Facebook App Configuration

To enable Facebook and Instagram OAuth integration, you need to configure your Meta App with the following settings:

### 1. App Dashboard Settings
1. Go to https://developers.facebook.com/apps
2. Select your app (or create a new one)
3. Navigate to **Settings** → **Basic**

### 2. Configure OAuth Redirect URIs
Add the following redirect URI to your app's **Valid OAuth Redirect URIs**:

```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/oauth-callback
```

### 3. App Permissions
Make sure your app has the following permissions approved:
- `instagram_basic` - Read basic Instagram account info
- `instagram_content_publish` - Publish content to Instagram
- `pages_show_list` - List Facebook Pages
- `pages_read_engagement` - Read engagement metrics
- `business_management` - Manage business accounts

### 4. App Review
For production use, submit your app for Meta's App Review to get these permissions approved for public users.

### 5. Test Users (Development)
While in development mode, only test users, developers, and testers added to your app can authenticate. Add test users in:
**Roles** → **Test Users**

---

## Current Configuration Status

✅ **Backend Security**: Fully configured
✅ **Authentication**: Fully configured

⚠️ **External Configuration Needed**:
- Meta App OAuth redirect URI (see above)
- Meta App permissions approval

---

## Testing Your Setup

1. **Sign up** with email and password at `/auth`
2. **Navigate to Dashboard** after successful login
3. **Try to connect Facebook** - this will redirect to Meta's OAuth
4. **Verify the connection** appears in your dashboard after approval
5. **Generate AI suggestions** to test rate limiting
