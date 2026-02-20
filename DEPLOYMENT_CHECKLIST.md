# 🚀 NumiVault Deployment Checklist

## Version 0.1.0 - Stable Baseline (2026-02-20)

This checklist ensures safe deployment and provides a clear rollback path.

---

## Pre-Deployment Verification

### ✅ Core Features Working
- [ ] User authentication (login/register/logout)
- [ ] Collection page loads and displays coins
- [ ] Dashboard shows spot prices (Gold, Silver, Platinum)
- [ ] Sales tracking functional
- [ ] Marketplace listings work
- [ ] Image uploads working
- [ ] Bullion value calculations correct

### ✅ Metal Prices Integration
- [ ] API endpoint `/api/spot-prices` returns correct values
- [ ] Dashboard displays real-time prices
- [ ] Gold price ~123 CHF/gram (verify with current market)
- [ ] Silver price ~0.89 CHF/gram
- [ ] Platinum price ~28.5 CHF/gram
- [ ] Only 3 metals showing (no copper)

### ✅ Technical Checks
- [ ] `npm run build` completes without errors
- [ ] `npm run lint` passes
- [ ] No TypeScript errors
- [ ] No console errors in browser
- [ ] Environment variables configured in `.env.local`
- [ ] Supabase connection working

### ✅ Database Health
- [ ] All RLS policies enabled
- [ ] User profiles table accessible
- [ ] User coins table working
- [ ] Sales table functional
- [ ] Listings table operational

---

## Deployment Steps

### 1. Via Softgen "Publish" Button (Recommended)
1. Click "Publish" in Softgen interface
2. Deploy to Vercel
3. Wait for deployment to complete
4. Test production URL

### 2. Manual Vercel Deployment
1. Push code to GitHub
2. Vercel auto-deploys from main branch
3. Monitor deployment logs
4. Verify production URL

---

## Post-Deployment Verification

### Immediate Checks (within 5 minutes)
- [ ] Production URL loads successfully
- [ ] User can log in
- [ ] Dashboard displays correctly
- [ ] Metal prices load (click "Refresh Prices")
- [ ] Collection page accessible
- [ ] Images display properly

### Functional Testing (within 30 minutes)
- [ ] Create new coin entry
- [ ] Upload images (front/back/edge)
- [ ] Verify bullion value calculation
- [ ] Create sale record
- [ ] Create marketplace listing
- [ ] Test search functionality

### Performance Checks
- [ ] Page load time <3 seconds
- [ ] Image loading smooth
- [ ] No console errors in production
- [ ] API responses <1 second

---

## Rollback Procedures

### If Deployment Fails or Has Critical Issues:

#### Option 1: Softgen Version History (Fastest)
```
1. Click "Version History" button
2. Find "Version 0.1.0 - 2026-02-20"
3. Click "Revert"
4. Confirm rollback
```

#### Option 2: Vercel Deployment Rollback
```
1. Go to Vercel dashboard
2. Select NumiVault project
3. Click "Deployments"
4. Find deployment from 2026-02-20
5. Click (...) menu → "Promote to Production"
```

#### Option 3: Git Rollback
```bash
git checkout v0.1.0
git push origin main --force
```

---

## Known Good Configuration

### Environment Variables (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=[your-project-url]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
```

### API Configuration
- Metal Price API: https://api.metalpriceapi.com
- API Key: a4c341c9c8b69969cba65382941825cf
- Base Currency: CHF
- Metals: XAU, XAG, XPT (Gold, Silver, Platinum)

### Database Tables
- `profiles` - User profiles
- `user_coins` - Coin collection
- `user_sales` - Sales history
- `listings` - Marketplace listings
- `coin_references` - Reference data

---

## Success Criteria

### Version 0.1.0 is considered successful when:
✅ All users can authenticate
✅ Metal prices display correctly (Gold ~123 CHF/g)
✅ Bullion values calculate accurately
✅ No critical errors in production
✅ All core features accessible
✅ Database operations working
✅ Image uploads functional

---

## Emergency Contacts

If rollback doesn't resolve issues:
1. Check VERSION.md for detailed feature list
2. Review ROLLBACK.md for all rollback methods
3. Contact Softgen support with:
   - Screenshot of error
   - Browser console logs
   - Steps to reproduce

---

## Version Log

| Version | Date | Status | Notes |
|---------|------|--------|-------|
| 0.1.0 | 2026-02-20 | ✅ Stable | First production-ready release. Metal prices working correctly. |

---

**Last Updated:** 2026-02-20
**Current Stable Version:** 0.1.0
**Deployment Status:** ✅ Production Ready