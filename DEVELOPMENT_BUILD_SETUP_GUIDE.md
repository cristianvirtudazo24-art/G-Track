# Development Build Setup Guide for GTrack Mobile

## Overview

This guide walks you through creating and installing a Development Build of GTrack Mobile on your Android device. A Development Build allows you to test all native features (including Android push notifications) that aren't available in Expo Go.

---

## Prerequisites

✅ **Already Have**:
- Expo account (confirmed)
- Android device (confirmed)
- Project ready to build

**Need to Install**:
- EAS CLI (Expo Application Services)
- Node.js 18+ (should already have)

---

## Step 1: Install EAS CLI

**What it does**: Command-line tool to build your app

### **Installation**:

```bash
npm install -g eas-cli
```

**Verify installation**:
```bash
eas --version
```

**Should output**: `eas/X.X.X` (version number)

---

## Step 2: Link Your Project to Expo

This connects your local project to your Expo account.

```bash
eas init
```

**What happens**:
1. Browser opens to Expo login
2. Authenticate with your account
3. Creates an `eas.json` file in your project
4. Project is now linked

**Expected output**:
```
✓ Linked to project
✓ eas.json created
```

---

## Step 4: Build Development App (APK)

This creates the actual app file for your Android device.

```bash
eas build --platform android --profile preview
```

**What happens**:
- Compiles your app with Expo servers
- Creates an APK file (Android app package)
- Takes 5-15 minutes depending on server load
- You can monitor progress in browser

**During build**:
- Keep terminal open
- Don't close browser tab
- Can use your computer normally

**When complete**:
- You'll see: "Build finished successfully"
- You'll get a download link
- Can also scan QR code to download

---

## Step 5: Download & Install on Device

### **Option A: Download Link (Easiest)**

1. When build completes, you'll see a link
2. Click the link or copy-paste in browser
3. Download the APK file
4. Transfer to your Android device (via USB, email, cloud)
5. On device: Open file manager → Find APK → Tap to install
6. Allow installation from unknown sources (if prompted)

### **Option B: Direct Install (If Device Connected)**

```bash
eas build --platform android --profile preview --wait
```

After build completes, you'll get an option to install directly on connected device.

### **Option C: Scan QR Code**

1. Build completes → QR code appears in terminal
2. On Android device: Open camera app
3. Scan QR code
4. Tap link → Downloads APK
5. Install APK

---

## Step 6: Launch the App

1. On Android device, find "GTrack-Mobile" app
2. Tap to open
3. Should work exactly like Expo Go version
4. BUT now with full native features enabled

---

## Testing Checklist

After app launches, verify these features work:

### **Core Features**:
- [ ] App opens without errors
- [ ] Can log in
- [ ] All tabs load (Home, Alerts, Timeline, etc.)
- [ ] Broadcasts/Alerts display correctly

### **Location Features**:
- [ ] GPS tracking active (check status bar)
- [ ] Location updates every 15 minutes
- [ ] Battery level showing

### **Messaging Features**:
- [ ] Messages load
- [ ] Can send message to admin
- [ ] Auto-update messages every 5 seconds

### **Push Notifications** (when backend ready):
- [ ] Notification appears when app closed
- [ ] Shows admin name and preview
- [ ] Tapping opens message thread
- [ ] Sound/vibration works

### **Camera/SOS**:
- [ ] SOS button responsive
- [ ] Camera access works
- [ ] Video can be recorded

### **Performance**:
- [ ] App feels smooth
- [ ] No crashes
- [ ] Background location tracking works

---

## Building Updates

After making code changes:

### **Option 1: Quick Test (Expo Go)**
```bash
npm start
```
- Changes instant
- Use for quick UI changes

### **Option 2: Test in Dev Build**
```bash
eas build --platform android --profile preview
```
- Full native testing
- Takes 5-15 minutes
- Use before final testing

### **Workflow Suggestion**:
```
Quick changes → Test in Expo Go
Feature complete → Build Dev Build
Final testing → Use Dev Build
Ready for production → Build production
```

---

## Troubleshooting

### **Issue: "Not authenticated"**
**Solution**:
```bash
eas logout
eas login
eas init
```

### **Issue: Build fails with "error: enoent"**
**Solution**: Make sure you have all assets
```bash
ls assets/images/
# Should show: icon.png, android-icon-*.png, favicon.png, splash-icon.png
```

### **Issue: APK won't install**
**Solution**: 
1. Go to Settings → Apps → Special app access → Unknown apps
2. Give file manager permission to install apps
3. Try again

### **Issue: App crashes on launch**
**Solution**:
1. Check console: `adb logcat` (if ADB installed)
2. Or submit error to: https://github.com/expo/expo/issues
3. Or try clearing app data:
   - Settings → Apps → GTrack-Mobile → Storage → Clear Data

### **Issue: Build taking too long**
- Expo servers might be busy
- Normal wait time: 5-15 minutes
- You can monitor at: https://expo.dev/accounts/[your-username]/builds

### **Issue: Can't connect to Android device**
- Enable USB debugging on device
- Install ADB (Android Debug Bridge)
- Or manually transfer APK file

---

## Advanced: Rebuild Without Cache

If you have persistent issues:

```bash
eas build --platform android --profile preview --clear-cache
```

This rebuilds everything from scratch (takes longer but fixes weird issues).

---

## Production Build (When Ready)

When you're ready to release to Google Play:

```bash
eas build --platform android --profile production
```

**Differences**:
- Creates app-bundle (Google Play format)
- Optimized for production
- Requires signing key
- Can submit directly to Play Store via:
  ```bash
  eas submit --platform android
  ```

---

## Next Steps

### **Now**:
1. ✅ Run `eas init`
2. ✅ Run build command
3. ✅ Install on device
4. ✅ Test features

### **After Backend Implements Push**:
1. Deploy backend push notifications
2. Send test message from admin dashboard
3. Verify notification appears on device (even if app closed)
4. Test tapping notification opens app to message

### **Before Production**:
1. Full testing with Dev Build
2. Test on multiple Android devices if possible
3. Test with slow/no internet connection
4. Build production version with `--profile production`
5. Submit to Google Play

---

## Useful Commands Reference

```bash
# Login to Expo
eas login

# Initialize project
eas init

# Check build status
eas build:list

# View specific build
eas build:view [BUILD_ID]

# Cancel build
eas build:cancel [BUILD_ID]

# Delete credentials (if needed)
eas credentials

# Monitor logs during build
eas build --platform android --profile preview --wait
```

---

## Estimated Timeline

| Step | Time |
|------|------|
| Install EAS CLI | 2 min |
| Run `eas init` | 3 min |
| First build | 10-15 min |
| Download & install | 5 min |
| **Total** | **25-30 min** |

Subsequent builds: 10-15 minutes (cached)

---

## Support & Resources

- **Expo Docs**: https://docs.expo.dev/build/setup/
- **EAS CLI Docs**: https://docs.expo.dev/build/building-on-eas/
- **Push Notifications Guide**: https://docs.expo.dev/push-notifications/overview/
- **Troubleshooting**: https://docs.expo.dev/troubleshooting/build-process/

---

## Notes

- Development builds are free (uses Expo free tier)
- Each build creates new APK (old versions still on device)
- You can have Expo Go + Dev Build installed simultaneously
- Dev Build uses your same backend API
- All data syncs normally

---

**Document Version**: 1.0  
**Last Updated**: 2026-08-29  
**Status**: Ready to Follow
