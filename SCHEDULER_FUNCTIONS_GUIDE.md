# Production Scheduler Functions Guide

## ⚠️ Important Note About Browser Console Errors

If you see an error like `window.scheduleAsXAB is not a function` in your browser console:
- This is NOT a code issue
- It's from manually typing commands with a typo in the browser console
- The correct functions are listed below

## 📍 Where These Functions Work

The scheduler functions (`window.scheduleASAP`, `window.scheduleALAP`, etc.) are ONLY available on the **Production Scheduler page**, NOT on the login or home pages.

To access the Production Scheduler:
1. Log in to your application
2. Navigate to: **Operations** → **Production Scheduler**
3. Wait for the scheduler to load completely

## ✅ Available Scheduler Functions

Once you're on the Production Scheduler page, these functions are available in the browser console:

### 1. Schedule As Soon As Possible (ASAP)
```javascript
window.scheduleASAP()
```

### 2. Schedule As Late As Possible (ALAP)
```javascript
window.scheduleALAP()
```

### 3. Optimize Schedule
```javascript
window.optimizeSchedule(algorithmId)
```

### 4. Wait for Scheduler Ready
```javascript
window.waitForSchedulerReady(timeout)
```

## 🐛 Troubleshooting

### Error: "window.scheduleASAP is not a function"
**Solution:** You're not on the Production Scheduler page. These functions only exist on that specific page.

### Error: "window.scheduleAsXAB is not a function"
**Solution:** This is a typo. The correct function is `scheduleASAP` (ending with "AP" not "XAB").

### Browser Console Showing Errors on Login Page
**Possible Causes:**
1. **Browser Extensions:** Disable extensions temporarily to test
2. **Browser Cache:** Clear cache and cookies for your domain
3. **Console History:** Clear browser console history
4. **Bookmarklets:** Check if you have any bookmarks that execute JavaScript

### To Clear Everything:
1. Open Chrome DevTools (F12)
2. Right-click the Refresh button
3. Select "Empty Cache and Hard Reload"
4. Clear console history: In console, right-click → "Clear console history"

## 🚀 Testing in Production

1. Deploy your application
2. Log in with your credentials
3. Navigate to Production Scheduler
4. Open browser console (F12)
5. Type the correct function: `window.scheduleASAP()`

## 📝 Note for Developers

These scheduler functions are injected by the Bryntum Scheduler Pro library and are only available when:
- The Production Scheduler page is loaded
- The Bryntum Scheduler instance is initialized
- The scheduler data is loaded

They are NOT global functions and will NOT be available on other pages.