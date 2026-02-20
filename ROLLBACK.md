# 🔄 Version Rollback Guide

## Quick Rollback to Version 0.1.0 (Stable Baseline)

If you experience any major issues with newer versions, you can quickly rollback to Version 0.1.0 (2026-02-20), which is the first stable baseline.

---

## Method 1: Softgen Version History (Recommended)

**This is the easiest method:**

1. Click the **"Version History"** button in the Softgen interface (top-right settings icon)
2. Find the version tagged: **"Version 0.1.0 - 2026-02-20"**
3. Click the **"Revert"** button next to that version
4. Confirm the rollback action
5. The app will automatically restore to that exact state

✅ **Advantage:** One-click, no technical knowledge required

---

## Method 2: Vercel Deployment Rollback

**If you've deployed to Vercel:**

1. Go to your Vercel dashboard: https://vercel.com
2. Select your NumiVault project
3. Click on the **"Deployments"** tab
4. Find the deployment from **2026-02-20** (Version 0.1.0)
5. Click the **three dots (...)** menu on that deployment
6. Select **"Promote to Production"**

✅ **Advantage:** Instant rollback for live production site

---

## Method 3: Git Rollback (Manual)

**If you have Git access to the repository:**

```bash
# View version tags
git tag -l

# Checkout version 0.1.0
git checkout v0.1.0

# Or create a new branch from v0.1.0
git checkout -b rollback-to-v0.1.0 v0.1.0

# Force push to main (⚠️ USE WITH CAUTION)
git push origin rollback-to-v0.1.0:main --force
```

⚠️ **Warning:** Force pushing will overwrite the current main branch

---

## What Gets Restored?

When you rollback to Version 0.1.0, you get:

✅ **Codebase:**
- All source files as of 2026-02-20
- Stable metal prices integration (Gold, Silver, Platinum)
- Working collection, dashboard, sales, and marketplace features
- Correct bullion value calculations

✅ **Database Schema:**
- Table structures and RLS policies remain unchanged
- User data is preserved (coins, sales, listings, profiles)

✅ **Configuration:**
- Environment variables (.env.local)
- Supabase connection settings
- API keys and integrations

---

## After Rollback Checklist

After rolling back, verify everything is working:

1. ✅ **Hard refresh your browser:** `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
2. ✅ **Test login/authentication:** Ensure you can log in
3. ✅ **Check dashboard:** Verify spot prices load correctly
4. ✅ **Test collection page:** Ensure coins display with correct values
5. ✅ **Click "Refresh Prices":** Verify metal prices update (Gold ~123 CHF/g)

---

## Troubleshooting After Rollback

**If prices still show incorrect values:**
1. Clear your browser cache completely
2. Hard refresh the page (`Ctrl + Shift + R`)
3. Click "Refresh Prices" button on dashboard

**If deployment doesn't reflect changes:**
1. Restart the Next.js server via Softgen settings
2. Or via terminal: `pm2 restart all`

**If database issues occur:**
1. Check Supabase connection in .env.local
2. Verify RLS policies are enabled
3. Check browser console for error messages

---

## Emergency Support

If rollback doesn't resolve your issue:

1. 📸 **Take screenshots** of any error messages
2. 💬 **Open browser console** (`F12`) and copy error logs
3. 🎯 **Contact support** with:
   - Version you rolled back from
   - Steps that led to the issue
   - Error messages and console logs

---

## Version 0.1.0 Stability

Version 0.1.0 (2026-02-20) is considered **stable and production-ready** with:

- ✅ All core features working
- ✅ No known critical bugs
- ✅ Metal prices correctly calculated
- ✅ Database schema validated
- ✅ Authentication secure
- ✅ Marketplace functional

---

**Last Updated:** 2026-02-20

**Stable Version:** 0.1.0

**Status:** Production Ready ✅