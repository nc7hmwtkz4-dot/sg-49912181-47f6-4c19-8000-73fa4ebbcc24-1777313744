# 🔄 Version Rollback Guide

## Quick Rollback to Version 0.2 (Stable Baseline - RECOMMENDED)

If you experience any major issues with newer versions, you can quickly rollback to **Version 0.2 (2026-02-21)**, which is the **recommended stable baseline** with all major features working.

---

## ⭐ Why Version 0.2 is the Recommended Recovery Point

**Version 0.2** includes:
- ✅ All core features (Collection, Sales, Marketplace, Auth)
- ✅ Fixed metal prices integration
- ✅ Advanced filtering and analytics on SKU page
- ✅ Statistics panel with 4 interactive charts
- ✅ Nested grouping (Year → Grade)
- ✅ Enhanced sorting with profit calculations
- ✅ Complete Sheldon Scale support (100+ grades)
- ✅ Virtual scrolling for performance
- ✅ No known critical bugs
- ✅ Production-ready stability

---

## Method 1: Softgen Version History (Recommended)

**This is the easiest method:**

1. Click the **"Version History"** button in the Softgen interface (top-right settings icon)
2. Find the version tagged: **"Version 0.2 - 2026-02-21"**
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
4. Find the deployment from **2026-02-21** (Version 0.2)
5. Click the **three dots (...)** menu on that deployment
6. Select **"Promote to Production"**

✅ **Advantage:** Instant rollback for live production site

---

## Method 3: Git Rollback (Manual)

**If you have Git access to the repository:**

```bash
# View version tags
git tag -l

# Checkout version 0.2
git checkout v0.2

# Or create a new branch from v0.2
git checkout -b rollback-to-v0.2 v0.2

# Force push to main (⚠️ USE WITH CAUTION)
git push origin rollback-to-v0.2:main --force
```

⚠️ **Warning:** Force pushing will overwrite the current main branch

---

## What Gets Restored?

When you rollback to Version 0.2, you get:

✅ **Codebase:**
- All source files as of 2026-02-21
- Stable metal prices integration (Gold, Silver, Platinum, Copper)
- Advanced filtering and analytics on SKU pages
- Statistics panel with interactive charts
- Nested grouping (Year → Grade) with virtual scrolling
- Enhanced sorting (Smart Sort, Profit Potential, Grade Hierarchy)
- Complete Sheldon Scale support
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
5. ✅ **Visit SKU detail page:** Verify filters, charts, and grouping work
6. ✅ **Test filtering:** Try Grade, Status, and Date Range filters
7. ✅ **Check sorting:** Test "Best to Sell" and other sort options
8. ✅ **Expand/collapse groups:** Verify state persistence
9. ✅ **Click "Refresh Prices":** Verify metal prices update (Gold ~2,600 CHF/g)

---

## Troubleshooting After Rollback

**If filters or charts don't appear:**
1. Clear your browser cache completely
2. Hard refresh the page (`Ctrl + Shift + R`)
3. Check browser console for error messages (`F12`)

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

**If charts render incorrectly:**
1. Ensure recharts is installed: `npm list recharts`
2. Clear localStorage: `localStorage.clear()` in browser console
3. Refresh the page

---

## Emergency Support

If rollback doesn't resolve your issue:

1. 📸 **Take screenshots** of any error messages
2. 💬 **Open browser console** (`F12`) and copy error logs
3. 🎯 **Contact support** with:
   - Version you rolled back from
   - Steps that led to the issue
   - Error messages and console logs
   - Screenshots of the problem

---

## Version 0.2 Stability (2026-02-21)

Version 0.2 is considered **stable and production-ready** with:

- ✅ All core features working
- ✅ No known critical bugs
- ✅ Metal prices correctly calculated
- ✅ Advanced filtering and analytics functional
- ✅ Statistics panel with interactive charts
- ✅ Nested grouping with virtual scrolling
- ✅ Enhanced sorting with profit calculations
- ✅ Database schema validated
- ✅ Authentication secure
- ✅ Marketplace functional

---

## Previous Stable Versions

### Version 0.1.1 (2026-02-20)
- First version with fixed metal prices
- No filtering or analytics features
- Basic SKU page with simple table

**When to use:** Only if Version 0.2 causes issues (unlikely)

### Version 0.1.0 (2026-02-20)
- Initial baseline release
- Metal prices had calculation errors
- No filtering or analytics

**When to use:** Not recommended - use 0.2 or 0.1.1 instead

---

**Last Updated:** 2026-02-21

**Recommended Stable Version:** 0.2 ⭐

**Status:** Production Ready ✅